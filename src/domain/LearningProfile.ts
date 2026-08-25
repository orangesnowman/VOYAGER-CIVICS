export interface PerformanceMetrics {
  grammar: number;
  pronunciation: number;
  confidence: number;
  naturalness: number;
  timestamp: number;
}

export class LearningProfile {
  private id: string;
  private currentScores: {
    grammar: number;
    pronunciation: number;
    confidence: number;
    naturalness: number;
  };
  private scoreHistory: PerformanceMetrics[] = [];
  private learnedWords: Set<string> = new Set();
  private accentPatterns: Set<string> = new Set();

  constructor() {
    this.id = `profile_${Date.now()}`;
    this.currentScores = { grammar: 0, pronunciation: 0, confidence: 0, naturalness: 0 };
    this.loadFromStorage();
  }

  getId(): string {
    return this.id;
  }

  getCurrentScores() {
    return { ...this.currentScores };
  }

  getScoreHistory(): PerformanceMetrics[] {
    return [...this.scoreHistory];
  }

  getLearnedWords(): string[] {
    return Array.from(this.learnedWords);
  }

  getAccentPatterns(): string[] {
    return Array.from(this.accentPatterns);
  }

  updateScores(grammar: number, pronunciation: number, confidence: number, naturalness: number): void {
    this.currentScores = { grammar, pronunciation, confidence, naturalness };
    this.scoreHistory.push({
      grammar,
      pronunciation,
      confidence,
      naturalness,
      timestamp: Date.now()
    });
    // Cap score history to prevent uncontrolled growth
    if (this.scoreHistory.length > 50) {
      this.scoreHistory = this.scoreHistory.slice(-50);
    }
    this.saveToStorage();
  }

  addLearnedWords(words: string[]): void {
    words.forEach(w => {
      const trimmed = w.toLowerCase().trim();
      if (trimmed && trimmed.length < 100) {
        this.learnedWords.add(trimmed);
      }
    });
    // Cap learned words to max 300
    if (this.learnedWords.size > 300) {
      const arr = Array.from(this.learnedWords).slice(-300);
      this.learnedWords = new Set(arr);
    }
    this.saveToStorage();
  }

  addAccentPatterns(patterns: string[]): void {
    patterns.forEach(p => {
      const trimmed = p.trim();
      if (trimmed && trimmed.length < 200) {
        this.accentPatterns.add(trimmed);
      }
    });
    // Cap accent patterns to max 100
    if (this.accentPatterns.size > 100) {
      const arr = Array.from(this.accentPatterns).slice(-100);
      this.accentPatterns = new Set(arr);
    }
    this.saveToStorage();
  }

  private saveToStorage(): void {
    try {
      const data = {
        id: this.id,
        currentScores: this.currentScores,
        scoreHistory: this.scoreHistory.slice(-50),
        learnedWords: this.getLearnedWords().slice(-300),
        accentPatterns: this.getAccentPatterns().slice(-100)
      };
      localStorage.setItem('voyager_learning_profile', JSON.stringify(data));
    } catch (e) {
      console.warn('Storage quota limit reached for learning profile, pruning old history...');
      try {
        // Fallback: prune heavily to fit storage quota
        this.scoreHistory = this.scoreHistory.slice(-15);
        const trimmedWords = this.getLearnedWords().slice(-50);
        this.learnedWords = new Set(trimmedWords);
        const trimmedPatterns = this.getAccentPatterns().slice(-20);
        this.accentPatterns = new Set(trimmedPatterns);

        const prunedData = {
          id: this.id,
          currentScores: this.currentScores,
          scoreHistory: this.scoreHistory,
          learnedWords: trimmedWords,
          accentPatterns: trimmedPatterns
        };
        localStorage.setItem('voyager_learning_profile', JSON.stringify(prunedData));
      } catch (innerErr) {
        // Silently ignore if browser storage is completely blocked or restricted
      }
    }
  }

  private loadFromStorage(): void {
    try {
      const stored = localStorage.getItem('voyager_learning_profile');
      if (stored) {
        const parsed = JSON.parse(stored);
        this.id = parsed.id || this.id;
        this.currentScores = parsed.currentScores || this.currentScores;
        this.scoreHistory = parsed.scoreHistory || this.scoreHistory;
        this.learnedWords = new Set(parsed.learnedWords || []);
        this.accentPatterns = new Set(parsed.accentPatterns || []);
      }
    } catch (e) {
      console.error('Failed to load learning profile from storage:', e);
    }
  }
}
