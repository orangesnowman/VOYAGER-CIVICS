// VOYAGER USA — Adaptive Study Plan & Learning Recommendation Engine
// Version 1.0 | Phase 4 Adaptive Learning Edition | November 2026

import { getMasterLessons, MasterLesson } from '../data/masterLessonsData';
import { vocabularyTracker } from './VocabularyTracker';
import { getStoredLessonAttempts, LessonEvaluationRecord } from './LessonGradingSystem';
import { auth, db } from '../services/firebaseAuth';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { withTimeout, isFirestoreQuotaExceeded, handleFirestoreWriteError } from '../services/userProfileService';

export interface StudyPlanActivity {
  id: string;
  lessonId: string;
  title: string;
  subtitle: string;
  category: string;
  cefrLevel: string;
  focusDimension: 'PRONUNCIATION' | 'FLUENCY' | 'VOCABULARY' | 'GRAMMAR';
  objective: string;
  estimatedMinutes: number;
  status: 'RECOMMENDED' | 'IN_PROGRESS' | 'COMPLETED';
  completedAt?: string;
  score?: number;
  reason: string; // Pedagogical justification
}

export interface PersonalizedStudyPlan {
  id: string;
  studentId: string;
  targetCefrLevel: string; // e.g. 'A2', 'B1', 'B2', 'C1'
  learningGoal: string;
  primaryFocus: 'PRONUNCIATION' | 'FLUENCY' | 'VOCABULARY' | 'GRAMMAR';
  rationale: string;
  recommendedActivities: StudyPlanActivity[];
  vocabularyReviewList: string[];
  phoneticFocusAreas: string[];
  generatedAt: string;
  updatedAt: string;
}

const STORAGE_PREFIX = 'voyager_student_study_plan_';

export class StudyPlanEngine {
  /**
   * Generates or updates an adaptive study plan tailored to the student's actual performance data.
   */
  public generatePlan(
    studentId: string,
    lang: 'EN' | 'ES' = 'EN',
    cefrLevel: string = 'B1',
    userGoal?: string,
    currentScores?: {
      pronunciation?: number;
      fluency?: number;
      vocabulary?: number;
      grammar?: number;
      confidence?: number;
    }
  ): PersonalizedStudyPlan {
    const allLessons = getMasterLessons(lang);
    const evaluations = getStoredLessonAttempts();
    const vocabSummary = vocabularyTracker.getProgressSummary();

    // 1. Determine primary focus dimension from actual assessment scores
    const pron = currentScores?.pronunciation ?? 82;
    const flu = currentScores?.fluency ?? 74;
    const voc = currentScores?.vocabulary ?? 86;
    const gram = currentScores?.grammar ?? 88;

    let primaryFocus: 'PRONUNCIATION' | 'FLUENCY' | 'VOCABULARY' | 'GRAMMAR' = 'FLUENCY';
    const minScore = Math.min(pron, flu, voc, gram);

    if (minScore === flu) primaryFocus = 'FLUENCY';
    else if (minScore === pron) primaryFocus = 'PRONUNCIATION';
    else if (minScore === voc) primaryFocus = 'VOCABULARY';
    else primaryFocus = 'GRAMMAR';

    // 2. Determine Rationale based on CEFR target and focus
    const goalText = userGoal || (lang === 'EN' ? 'General American English Fluency' : 'Fluidez General en Inglés');
    let rationale = '';
    if (lang === 'EN') {
      rationale = `Personalized for target level ${cefrLevel} with focus on ${primaryFocus.toLowerCase()} (${minScore}% baseline) to support your goal: "${goalText}". Self-paced with zero mandatory deadlines.`;
    } else {
      rationale = `Personalizado para el nivel objetivo ${cefrLevel} con enfoque en ${primaryFocus.toLowerCase()} (${minScore}% línea base) para apoyar tu meta: "${goalText}". A tu propio ritmo sin fechas límite forzadas.`;
    }

    // 3. Select 3-4 recommended lessons matching CEFR and focus
    const completedLessonIds = new Set(
      evaluations.filter(e => e.passed).map(e => e.lessonId)
    );

    const recommendedActivities: StudyPlanActivity[] = [];

    // Prioritize lessons matching the student's goal keywords
    const goalLower = (userGoal || '').toLowerCase();
    const isCitizenship = goalLower.includes('citizenship') || goalLower.includes('ciudadanía') || goalLower.includes('civic');
    const isCareer = goalLower.includes('interview') || goalLower.includes('career') || goalLower.includes('work') || goalLower.includes('trabajo');
    const isMedical = goalLower.includes('health') || goalLower.includes('doctor') || goalLower.includes('médic');

    allLessons.forEach((lesson) => {
      // Don't recommend more than 4 activities
      if (recommendedActivities.length >= 4) return;

      const isCompleted = completedLessonIds.has(lesson.id);
      let matchScore = 0;

      // Goal match bonus
      if (isCitizenship && (lesson.tags.includes('civics') || lesson.tags.includes('citizenship'))) matchScore += 5;
      if (isCareer && (lesson.tags.includes('career') || lesson.tags.includes('interview'))) matchScore += 5;
      if (isMedical && lesson.tags.includes('health')) matchScore += 5;

      // CEFR level compatibility
      if (lesson.level.includes(cefrLevel)) matchScore += 3;

      // Dimension relevance
      if (primaryFocus === 'FLUENCY' && lesson.category.toLowerCase().includes('conversation')) matchScore += 3;
      if (primaryFocus === 'PRONUNCIATION' && (lesson.tags.includes('pronunciation') || lesson.title.toLowerCase().includes('interview') || lesson.title.toLowerCase().includes('oral'))) matchScore += 3;
      if (primaryFocus === 'VOCABULARY' && (lesson.tags.includes('health') || lesson.tags.includes('business'))) matchScore += 3;

      let reasonText = '';
      if (lang === 'EN') {
        reasonText = isCompleted
          ? `Review to maintain ${primaryFocus.toLowerCase()} retention at CEFR ${lesson.level}.`
          : `Targeted practice for ${primaryFocus.toLowerCase()} aligned with ${cefrLevel} standards.`;
      } else {
        reasonText = isCompleted
          ? `Repaso para mantener retención de ${primaryFocus.toLowerCase()} en nivel ${lesson.level}.`
          : `Práctica dirigida para ${primaryFocus.toLowerCase()} alineada con nivel ${cefrLevel}.`;
      }

      recommendedActivities.push({
        id: `act_${lesson.id}`,
        lessonId: lesson.id,
        title: lesson.title,
        subtitle: lesson.subtitle,
        category: lesson.category,
        cefrLevel: lesson.level,
        focusDimension: primaryFocus,
        objective: lesson.objective,
        estimatedMinutes: lesson.estimatedMinutes || 20,
        status: isCompleted ? 'COMPLETED' : 'RECOMMENDED',
        reason: reasonText
      });
    });

    // 4. Vocabulary review list from 4-stage VocabularyTracker
    const vocabularyReviewList = vocabSummary.recommendedReviews;

    // 5. Phonetic focus areas based on oral speech benchmarks
    const phoneticFocusAreas = [
      lang === 'EN' ? '/θ/ & /ð/ Dental Fricatives (think / this)' : '/θ/ & /ð/ Fricativas dentales (think / this)',
      lang === 'EN' ? '/ə/ Vowel reduction in unstressed syllables' : '/ə/ Reducción vocálica (schwa) en sílabas átonas',
      lang === 'EN' ? 'Consonant-to-vowel liaison in connected speech' : 'Enlace consonántico en discurso conectado'
    ];

    const plan: PersonalizedStudyPlan = {
      id: `plan_${studentId}`,
      studentId,
      targetCefrLevel: cefrLevel,
      learningGoal: goalText,
      primaryFocus,
      rationale,
      recommendedActivities,
      vocabularyReviewList,
      phoneticFocusAreas,
      generatedAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    this.savePlan(plan);
    return plan;
  }

  /**
   * Retrieves stored study plan for a student, generating one on demand if missing.
   */
  public getOrGeneratePlan(
    studentId: string,
    lang: 'EN' | 'ES' = 'EN',
    cefrLevel: string = 'B1',
    userGoal?: string,
    currentScores?: any
  ): PersonalizedStudyPlan {
    const existing = this.loadPlan(studentId);
    if (existing) {
      // Refresh dynamic vocabulary review words
      existing.vocabularyReviewList = vocabularyTracker.getRecommendedReviewWords();
      return existing;
    }
    return this.generatePlan(studentId, lang, cefrLevel, userGoal, currentScores);
  }

  /**
   * Marks an activity as started or completed.
   */
  public updateActivityStatus(
    studentId: string,
    activityId: string,
    status: StudyPlanActivity['status'],
    score?: number
  ): void {
    const plan = this.loadPlan(studentId);
    if (!plan) return;

    const act = plan.recommendedActivities.find(a => a.id === activityId || a.lessonId === activityId);
    if (act) {
      act.status = status;
      if (status === 'COMPLETED') {
        act.completedAt = new Date().toISOString();
        if (typeof score === 'number') act.score = score;
      }
      plan.updatedAt = new Date().toISOString();
      this.savePlan(plan);
    }
  }

  public savePlan(plan: PersonalizedStudyPlan): void {
    if (typeof window === 'undefined') return;
    try {
      localStorage.setItem(`${STORAGE_PREFIX}${plan.studentId}`, JSON.stringify(plan));
      window.dispatchEvent(new CustomEvent('voyager_study_plan_updated', { detail: plan }));
      this.syncPlanToFirestore(plan);
    } catch (e) {
      console.warn('Failed to save study plan locally:', e);
    }
  }

  public loadPlan(studentId: string): PersonalizedStudyPlan | null {
    if (typeof window === 'undefined') return null;
    try {
      const raw = localStorage.getItem(`${STORAGE_PREFIX}${studentId}`);
      if (raw) return JSON.parse(raw);
    } catch (e) {
      console.warn('Failed to load study plan locally:', e);
    }
    return null;
  }

  private async syncPlanToFirestore(plan: PersonalizedStudyPlan): Promise<void> {
    if (isFirestoreQuotaExceeded()) return;
    const uid = auth.currentUser?.uid;
    if (!uid) return;

    try {
      const docRef = doc(db, 'users', uid, 'studyPlan', 'current');
      await withTimeout(setDoc(docRef, { ...plan, studentId: uid }, { merge: true }), 3000);
    } catch (e) {
      handleFirestoreWriteError(e, 'study plan');
    }
  }

  public async fetchRemotePlan(studentId: string): Promise<PersonalizedStudyPlan | null> {
    if (isFirestoreQuotaExceeded()) return this.loadPlan(studentId);
    try {
      const docRef = doc(db, 'users', studentId, 'studyPlan', 'current');
      const snap = await withTimeout(getDoc(docRef), 3000);
      if (snap.exists()) {
        const data = snap.data() as PersonalizedStudyPlan;
        return data;
      }
    } catch (e) {
      console.warn('Remote study plan fetch notice:', e);
    }
    return this.loadPlan(studentId);
  }
}

export const studyPlanEngine = new StudyPlanEngine();
