import { db, auth } from '../services/firebaseAuth';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { ALL_CIVICS_128_QUESTIONS, CivicsQuestion } from '../data/civics128Data';

export type QuestionMasteryStatus = 'known' | 'unsure' | 'review';

export interface DaySessionRecord {
  dayId: 'Day 1' | 'Day 2' | 'Day 3' | 'Day 4' | 'Day 5' | 'Day 6';
  timestamp: number;
  totalQuestions: number;
  attempted: number;
  correct: number;
  unsure: number;
  incorrect: number;
  percentage: number;
  passed: boolean; // 60% Voyager study session threshold
  masteredCount: number;
  reviewCount: number;
}

export interface CivicsProgressData {
  questionStatus: Record<number, QuestionMasteryStatus>;
  daySessions: Record<string, DaySessionRecord>;
  lastUpdated: number;
  achievements: string[];
}

const STORAGE_KEY = 'voyager_civics_progress_v2';
const VOYAGER_PASS_THRESHOLD = 60; // 60% Voyager session threshold

type ProgressListener = (data: CivicsProgressData) => void;

class CivicsProgressTrackerManager {
  private data: CivicsProgressData = {
    questionStatus: {},
    daySessions: {},
    lastUpdated: Date.now(),
    achievements: []
  };

  private listeners: Set<ProgressListener> = new Set();
  private userUid: string | null = null;
  private isLoaded = false;

  constructor() {
    this.loadFromLocalStorage();
    this.setupAuthListener();
  }

  public subscribe(listener: ProgressListener): () => void {
    this.listeners.add(listener);
    listener(this.data);
    return () => this.listeners.delete(listener);
  }

  private notify() {
    this.listeners.forEach(l => l(this.data));
  }

  private setupAuthListener() {
    if (typeof window === 'undefined') return;
    auth.onAuthStateChanged(async user => {
      if (user) {
        this.userUid = user.uid;
        await this.syncFromFirestore(user.uid);
      } else {
        this.userUid = null;
      }
    });
  }

  private loadFromLocalStorage() {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        const stored = localStorage.getItem(STORAGE_KEY);
        if (stored) {
          const parsed = JSON.parse(stored);
          this.data = {
            questionStatus: parsed.questionStatus || {},
            daySessions: parsed.daySessions || {},
            lastUpdated: parsed.lastUpdated || Date.now(),
            achievements: parsed.achievements || []
          };
        }
      }
    } catch (e) {
      console.warn('Error reading civics progress from localStorage:', e);
    }
    this.isLoaded = true;
  }

  private async syncFromFirestore(uid: string) {
    try {
      const docRef = doc(db, 'users', uid, 'civicsProgress', 'tracker');
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        const remoteData = docSnap.data() as CivicsProgressData;
        // Merge remote data taking most recently updated statuses
        if (remoteData.lastUpdated && remoteData.lastUpdated > (this.data.lastUpdated || 0)) {
          this.data = {
            questionStatus: { ...this.data.questionStatus, ...remoteData.questionStatus },
            daySessions: { ...this.data.daySessions, ...remoteData.daySessions },
            lastUpdated: remoteData.lastUpdated,
            achievements: Array.from(new Set([...this.data.achievements, ...(remoteData.achievements || [])]))
          };
          this.saveToLocalStorage();
          this.notify();
        } else {
          // Local is newer or equal, push local to remote
          await this.saveToFirestore();
        }
      } else {
        // Doc doesn't exist yet, save current local state to Firestore
        await this.saveToFirestore();
      }
    } catch (e) {
      console.warn('Firestore sync failed, fallback to local storage:', e);
    }
  }

  private saveToLocalStorage() {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(this.data));
      }
    } catch (e) {
      console.warn('Failed to save progress to localStorage:', e);
    }
  }

  private async saveToFirestore() {
    if (!this.userUid) return;
    try {
      const docRef = doc(db, 'users', this.userUid, 'civicsProgress', 'tracker');
      await setDoc(docRef, this.data, { merge: true });
    } catch (e) {
      console.warn('Error pushing civics progress to Firestore:', e);
    }
  }

  private async save() {
    this.data.lastUpdated = Date.now();
    this.saveToLocalStorage();
    this.notify();
    await this.saveToFirestore();
  }

  // --- PUBLIC API ---

  public getProgressData(): CivicsProgressData {
    return { ...this.data };
  }

  public getQuestionStatus(questionId: number): QuestionMasteryStatus | null {
    return this.data.questionStatus[questionId] || null;
  }

  public setQuestionStatus(questionId: number, status: QuestionMasteryStatus | 'correct' | null) {
    let finalStatus: QuestionMasteryStatus | null = null;
    if (status === 'correct' || status === 'known') {
      finalStatus = 'known';
    } else if (status === 'unsure') {
      finalStatus = 'unsure';
    } else if (status === 'review') {
      finalStatus = 'review';
    }

    if (finalStatus === null) {
      delete this.data.questionStatus[questionId];
    } else {
      this.data.questionStatus[questionId] = finalStatus;
    }

    this.save();
  }

  public setMultipleQuestionStatuses(updates: Record<number, QuestionMasteryStatus | 'correct'>) {
    Object.entries(updates).forEach(([qIdStr, status]) => {
      const qId = Number(qIdStr);
      if (status === 'correct' || status === 'known') {
        this.data.questionStatus[qId] = 'known';
      } else if (status === 'unsure') {
        this.data.questionStatus[qId] = 'unsure';
      } else if (status === 'review') {
        this.data.questionStatus[qId] = 'review';
      }
    });
    this.save();
  }

  public recordDaySession(
    dayId: 'Day 1' | 'Day 2' | 'Day 3' | 'Day 4' | 'Day 5' | 'Day 6',
    correct: number,
    unsure: number,
    incorrect: number,
    totalQuestions: number,
    questionStatusUpdates?: Record<number, QuestionMasteryStatus>
  ): DaySessionRecord {
    const attempted = correct + unsure + incorrect;
    const percentage = attempted > 0 ? Math.round((correct / attempted) * 100) : 0;
    const passed = percentage >= VOYAGER_PASS_THRESHOLD;

    if (questionStatusUpdates) {
      Object.entries(questionStatusUpdates).forEach(([qIdStr, status]) => {
        this.data.questionStatus[Number(qIdStr)] = status;
      });
    }

    // Tally current overall mastered vs review
    const masteredCount = Object.values(this.data.questionStatus).filter(s => s === 'known').length;
    const reviewCount = Object.values(this.data.questionStatus).filter(s => s === 'unsure' || s === 'review').length;

    const record: DaySessionRecord = {
      dayId,
      timestamp: Date.now(),
      totalQuestions,
      attempted,
      correct,
      unsure,
      incorrect,
      percentage,
      passed,
      masteredCount,
      reviewCount
    };

    this.data.daySessions[dayId] = record;

    // Check achievement unlock for day completed
    const achievementKey = `completed_${dayId.toLowerCase().replace(' ', '_')}`;
    if (!this.data.achievements.includes(achievementKey)) {
      this.data.achievements.push(achievementKey);
    }

    // Check 6-day complete achievement
    const dayKeys = ['Day 1', 'Day 2', 'Day 3', 'Day 4', 'Day 5', 'Day 6'];
    const allDaysDone = dayKeys.every(d => this.data.daySessions[d]?.passed);
    if (allDaysDone && !this.data.achievements.includes('completed_all_6_days')) {
      this.data.achievements.push('completed_all_6_days');
    }

    this.save();
    return record;
  }

  // Single-source filter for personalized review without duplicating items
  public getQuestionsForPersonalizedReview(): CivicsQuestion[] {
    return ALL_CIVICS_128_QUESTIONS.filter(q => {
      const st = this.data.questionStatus[q.id];
      return st === 'unsure' || st === 'review';
    });
  }

  public getQuestionsByStatus(status: QuestionMasteryStatus): CivicsQuestion[] {
    return ALL_CIVICS_128_QUESTIONS.filter(q => this.data.questionStatus[q.id] === status);
  }

  public getOverallStats() {
    const total = ALL_CIVICS_128_QUESTIONS.length;
    let known = 0;
    let unsure = 0;
    let review = 0;

    Object.values(this.data.questionStatus).forEach(s => {
      if (s === 'known') known++;
      else if (s === 'unsure') unsure++;
      else if (s === 'review') review++;
    });

    const unattempted = total - (known + unsure + review);
    const daySessionsList = Object.values(this.data.daySessions);
    const completedDaysCount = daySessionsList.filter(s => s.passed).length;

    return {
      total,
      known,
      unsure,
      review,
      unattempted,
      completedDaysCount,
      daySessions: this.data.daySessions,
      achievements: this.data.achievements
    };
  }
}

export const CivicsProgressTracker = new CivicsProgressTrackerManager();
