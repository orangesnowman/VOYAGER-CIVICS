// VOYAGER USA — Evidence-Based Vocabulary Tracking & Retention System
// Version 2.0 | Phase 4 Adaptive Learning Edition | November 2026

export type VocabularyStage = 'INTRODUCED' | 'PRACTICED' | 'PROVISIONALLY_MASTERED' | 'RETAINED';

export interface TrackedVocabularyItem {
  word: string;
  normalizedWord: string;
  cefrLevel: 'A1' | 'A2' | 'B1' | 'B2' | 'C1' | 'C2';
  introducedAt: string; // ISO date string
  lessonId?: string;
  practiceCount: number; // Number of times student actively typed or spoke the word
  contextUsageCount: number; // Used correctly in complete sentences (> 4 words)
  stage: VocabularyStage; // 4-stage retention lifecycle
  hasDemonstratedMastery: boolean; // Retained through multiple contextual sessions (>= 4 usages)
  difficultyFlag?: boolean; // Flagged if misused or corrected by tutor
  lastPracticedAt?: string;
  needsReview?: boolean; // Flagged when review is recommended
}

export interface VocabularyProgressSummary {
  totalIntroduced: number;
  totalPracticed: number;
  totalMastered: number; // Retained mastery
  retentionRate: number; // (totalMastered / totalIntroduced) * 100
  stageCounts: {
    introduced: number;
    practiced: number;
    provisionallyMastered: number;
    retained: number;
  };
  activeDifficulties: string[];
  recentPracticed: string[];
  recommendedReviews: string[];
}

const STORAGE_KEY = 'voyager_vocabulary_tracker_state';

export class VocabularyTracker {
  private items: Map<string, TrackedVocabularyItem> = new Map();

  constructor() {
    this.loadFromStorage();
  }

  private normalize(word: string): string {
    return word.toLowerCase().trim().replace(/[.,!?;:()"']/g, '');
  }

  /**
   * Computes the 4-stage retention level based on empirical dialogue evidence.
   * Pedagogical rule: 2 usages are PROVISIONALLY MASTERED, not permanent retention.
   */
  private computeStage(item: TrackedVocabularyItem): VocabularyStage {
    if (item.practiceCount === 0) {
      return 'INTRODUCED';
    }
    if (item.contextUsageCount < 2) {
      return 'PRACTICED';
    }
    if (item.contextUsageCount < 4 || item.difficultyFlag) {
      return 'PROVISIONALLY_MASTERED';
    }
    return 'RETAINED';
  }

  /**
   * Records words introduced during a lesson or Voyager dialogue.
   * Note: Merely introducing a word classifies it as INTRODUCED. Exposure is not mastery.
   */
  public recordIntroducedWords(words: string[], lessonId?: string, cefrLevel: TrackedVocabularyItem['cefrLevel'] = 'B1'): void {
    const now = new Date().toISOString();
    words.forEach(w => {
      const norm = this.normalize(w);
      if (!norm || norm.length < 2) return;

      if (!this.items.has(norm)) {
        const newItem: TrackedVocabularyItem = {
          word: w.trim(),
          normalizedWord: norm,
          cefrLevel,
          introducedAt: now,
          lessonId,
          practiceCount: 0,
          contextUsageCount: 0,
          stage: 'INTRODUCED',
          hasDemonstratedMastery: false,
          needsReview: false
        };
        this.items.set(norm, newItem);
      }
    });
    this.saveToStorage();
  }

  /**
   * Evaluates user utterance text to detect whether tracked words were actively practiced.
   */
  public recordStudentUtterance(userText: string): string[] {
    if (!userText || !userText.trim()) return [];
    const tokens = userText.toLowerCase().split(/\s+/).map(t => this.normalize(t));
    const tokenSet = new Set(tokens);
    const practicedInThisTurn: string[] = [];
    const now = new Date().toISOString();
    const isSubstantiveTurn = tokens.length >= 4;

    this.items.forEach((item, norm) => {
      if (tokenSet.has(norm)) {
        item.practiceCount += 1;
        item.lastPracticedAt = now;
        if (isSubstantiveTurn) {
          item.contextUsageCount += 1;
        }

        // Recompute retention stage
        item.stage = this.computeStage(item);

        if (item.stage === 'RETAINED') {
          item.hasDemonstratedMastery = true;
          item.difficultyFlag = false;
          item.needsReview = false;
        } else if (item.stage === 'PROVISIONALLY_MASTERED') {
          item.hasDemonstratedMastery = false; // Provisional, not permanent
          item.needsReview = false;
        }

        practicedInThisTurn.push(item.word);
      }
    });

    if (practicedInThisTurn.length > 0) {
      this.saveToStorage();
    }

    return practicedInThisTurn;
  }

  /**
   * Flags a word as causing recurring difficulty based on corrective feedback.
   */
  public flagWordDifficulty(word: string): void {
    const norm = this.normalize(word);
    if (!norm) return;

    const existing = this.items.get(norm);
    if (existing) {
      existing.difficultyFlag = true;
      existing.hasDemonstratedMastery = false;
      existing.needsReview = true;
      existing.stage = existing.contextUsageCount >= 2 ? 'PROVISIONALLY_MASTERED' : 'PRACTICED';
    } else {
      this.items.set(norm, {
        word: word.trim(),
        normalizedWord: norm,
        cefrLevel: 'B1',
        introducedAt: new Date().toISOString(),
        practiceCount: 1,
        contextUsageCount: 0,
        stage: 'PRACTICED',
        hasDemonstratedMastery: false,
        difficultyFlag: true,
        needsReview: true
      });
    }
    this.saveToStorage();
  }

  /**
   * Returns list of words recommended for active review.
   * Includes words with difficulties, introduced words never practiced, and provisional words needing retention check.
   */
  public getRecommendedReviewWords(): string[] {
    const all = Array.from(this.items.values());
    const difficulties = all.filter(i => i.difficultyFlag).map(i => i.word);
    const provisional = all.filter(i => i.stage === 'PROVISIONALLY_MASTERED' && !i.hasDemonstratedMastery).map(i => i.word);
    const introducedUnpracticed = all.filter(i => i.stage === 'INTRODUCED').slice(0, 5).map(i => i.word);

    const combined = Array.from(new Set([...difficulties, ...provisional, ...introducedUnpracticed]));
    return combined.slice(0, 10);
  }

  /**
   * Returns a comprehensive vocabulary progress summary.
   */
  public getProgressSummary(): VocabularyProgressSummary {
    const all = Array.from(this.items.values());
    const totalIntroduced = all.length;
    const totalPracticed = all.filter(i => i.practiceCount > 0).length;
    const totalMastered = all.filter(i => i.stage === 'RETAINED').length;
    const retentionRate = totalIntroduced > 0 ? Math.round((totalMastered / totalIntroduced) * 100) : 0;
    
    const stageCounts = {
      introduced: all.filter(i => i.stage === 'INTRODUCED').length,
      practiced: all.filter(i => i.stage === 'PRACTICED').length,
      provisionallyMastered: all.filter(i => i.stage === 'PROVISIONALLY_MASTERED').length,
      retained: all.filter(i => i.stage === 'RETAINED').length
    };

    const activeDifficulties = all
      .filter(i => i.difficultyFlag && i.stage !== 'RETAINED')
      .map(i => i.word);

    const recentPracticed = all
      .filter(i => i.practiceCount > 0)
      .sort((a, b) => (b.lastPracticedAt || '').localeCompare(a.lastPracticedAt || ''))
      .slice(0, 15)
      .map(i => i.word);

    const recommendedReviews = this.getRecommendedReviewWords();

    return {
      totalIntroduced,
      totalPracticed,
      totalMastered,
      retentionRate,
      stageCounts,
      activeDifficulties,
      recentPracticed,
      recommendedReviews
    };
  }

  public getAllItems(): TrackedVocabularyItem[] {
    return Array.from(this.items.values());
  }

  private saveToStorage(): void {
    if (typeof window === 'undefined') return;
    try {
      const arr = Array.from(this.items.values());
      localStorage.setItem(STORAGE_KEY, JSON.stringify(arr));
      window.dispatchEvent(new Event('voyager_vocabulary_updated'));
    } catch (e) {
      console.warn('Failed to persist vocabulary tracker state:', e);
    }
  }

  private loadFromStorage(): void {
    if (typeof window === 'undefined') return;
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const arr: any[] = JSON.parse(raw);
        if (Array.isArray(arr)) {
          arr.forEach(item => {
            if (item && item.normalizedWord) {
              // Ensure backward compatibility with Phase 3 records
              if (!item.stage) {
                if (item.practiceCount === 0) item.stage = 'INTRODUCED';
                else if (item.contextUsageCount >= 4) item.stage = 'RETAINED';
                else if (item.contextUsageCount >= 2) item.stage = 'PROVISIONALLY_MASTERED';
                else item.stage = 'PRACTICED';
              }
              this.items.set(item.normalizedWord, item as TrackedVocabularyItem);
            }
          });
        }
      }
    } catch (e) {
      console.warn('Failed to load vocabulary tracker state:', e);
    }
  }
}

export const vocabularyTracker = new VocabularyTracker();
