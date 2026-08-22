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
    this.saveToStorage();
  }

  addLearnedWords(words: string[]): void {
    words.forEach(w => {
      const trimmed = w.toLowerCase().trim();
      if (trimmed) {
        this.learnedWords.add(trimmed);
      }
    });
    this.saveToStorage();
  }

  addAccentPatterns(patterns: string[]): void {
    patterns.forEach(p => {
      const trimmed = p.trim();
      if (trimmed) {
        this.accentPatterns.add(trimmed);
      }
    });
    this.saveToStorage();
  }

  private saveToStorage(): void {
    try {
      const data = {
        id: this.id,
        currentScores: this.currentScores,
        scoreHistory: this.scoreHistory,
        learnedWords: this.getLearnedWords(),
        accentPatterns: this.getAccentPatterns()
      };
      localStorage.setItem('voyager_learning_profile', JSON.stringify(data));
    } catch (e) {
      console.error('Failed to save learning profile to storage:', e);
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
