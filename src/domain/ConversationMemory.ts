export interface PreviousConversation {
  timestamp: number;
  summary: string;
}

export interface PersonalContext {
  userName?: string;
  nativeLanguage?: string;
  pronounPreference?: string;
  generalNotes?: string;
  age?: number;
}

export class ConversationMemory {
  private id: string;
  private goals: string[] = [];
  private interests: string[] = [];
  private preferences: string[] = [];
  private previousConversations: PreviousConversation[] = [];
  private personalContext: PersonalContext = {};

  constructor() {
    this.id = `memory_${Date.now()}`;
    this.loadFromStorage();
  }

  getId(): string {
    return this.id;
  }

  getGoals(): string[] {
    return [...this.goals];
  }

  getInterests(): string[] {
    return [...this.interests];
  }

  getPreferences(): string[] {
    return [...this.preferences];
  }

  getPreviousConversations(): PreviousConversation[] {
    return [...this.previousConversations];
  }

  getPersonalContext(): PersonalContext {
    return { ...this.personalContext };
  }

  addGoal(goal: string): void {
    const trimmed = goal.trim();
    if (trimmed && !this.goals.includes(trimmed)) {
      this.goals.push(trimmed);
      this.saveToStorage();
    }
  }

  addInterest(interest: string): void {
    const trimmed = interest.trim();
    if (trimmed && !this.interests.includes(trimmed)) {
      this.interests.push(trimmed);
      this.saveToStorage();
    }
  }

  addPreference(preference: string): void {
    const trimmed = preference.trim();
    if (trimmed && !this.preferences.includes(trimmed)) {
      this.preferences.push(trimmed);
      this.saveToStorage();
    }
  }

  addConversationSummary(summary: string): void {
    const trimmed = summary.trim();
    if (trimmed) {
      this.previousConversations.push({
        timestamp: Date.now(),
        summary: trimmed
      });
      this.saveToStorage();
    }
  }

  updatePersonalContext(context: Partial<PersonalContext>): void {
    this.personalContext = {
      ...this.personalContext,
      ...context
    };
    this.saveToStorage();
  }

  /**
   * Scans user text for specific keywords or trigger phrases indicating goals, interests, or preferences.
   */
  extractLearnerContext(userText: string): void {
    if (!userText) return;

    const lowerText = userText.toLowerCase().trim();

    // 1. Name extraction heuristics
    if (lowerText.includes("my name is") || lowerText.includes("me llamo") || lowerText.includes("mi nombre es") || lowerText.includes("soy ")) {
      const nameMatch = userText.match(/(?:my name is|me llamo|mi nombre es|soy)\s+([A-Z][a-z]+)/i);
      if (nameMatch && nameMatch[1]) {
        this.updatePersonalContext({ userName: nameMatch[1].trim() });
      }
    }

    // 1.5 Age extraction heuristics
    if (
      lowerText.includes("years old") ||
      lowerText.includes("años") ||
      lowerText.match(/\b(i'm|i am|tengo)\s+(\d+)\b/i)
    ) {
      const ageMatch = userText.match(/\b(\d+)\b/);
      if (ageMatch && ageMatch[1]) {
        const ageNum = parseInt(ageMatch[1], 10);
        if (ageNum > 0 && ageNum < 120) {
          this.updatePersonalContext({ age: ageNum });
        }
      }
    }

    // 2. Goal extraction heuristics
    if (
      lowerText.includes("i want to learn") || 
      lowerText.includes("my goal is") || 
      lowerText.includes("quiero aprender") || 
      lowerText.includes("mi meta es") ||
      lowerText.includes("i'm practicing to")
    ) {
      const goalMatch = userText.match(/(?:i want to learn|my goal is|quiero aprender|mi meta es|i'm practicing to)\s+([^.,?!]+)/i);
      if (goalMatch && goalMatch[1]) {
        this.addGoal(goalMatch[1].trim());
      }
    }

    // 3. Interest extraction heuristics
    if (
      lowerText.includes("i am interested in") || 
      lowerText.includes("i like") || 
      lowerText.includes("me gusta") || 
      lowerText.includes("me interesa") ||
      lowerText.includes("i love")
    ) {
      const interestMatch = userText.match(/(?:i am interested in|i like|me gusta|me interesa|i love)\s+([^.,?!]+)/i);
      if (interestMatch && interestMatch[1]) {
        this.addInterest(interestMatch[1].trim());
      }
    }
  }

  /**
   * Serializes human relationship fields into a helpful background context block for the model.
   * This enhances conversation quality by providing real personal memory.
   */
  getMemoryPayloadForPrompt(): string {
    const goals = this.getGoals();
    const interests = this.getInterests();
    const preferences = this.getPreferences();
    const prevConvs = this.getPreviousConversations();
    const ctx = this.getPersonalContext();

    let memoryContext = "\n\n[USER RELATIONSHIP & PERSONAL CONTEXT]\n";
    let hasMemory = false;

    if (ctx.userName) {
      memoryContext += `- Learner's Name: ${ctx.userName}\n`;
      hasMemory = true;
    }
    if (ctx.age) {
      memoryContext += `- Learner's Age: ${ctx.age} years old\n`;
      hasMemory = true;
    }
    if (goals.length > 0) {
      memoryContext += `- Goals & Practice Motivations: ${goals.join(', ')}\n`;
      hasMemory = true;
    }
    if (interests.length > 0) {
      memoryContext += `- Personal Interests: ${interests.join(', ')}\n`;
      hasMemory = true;
    }
    if (preferences.length > 0) {
      memoryContext += `- Learning Preferences: ${preferences.join(', ')}\n`;
      hasMemory = true;
    }
    if (prevConvs.length > 0) {
      memoryContext += `- Summary of past sessions:\n`;
      prevConvs.slice(-3).forEach((conv, index) => {
        memoryContext += `  * Session ${index + 1}: ${conv.summary}\n`;
      });
      hasMemory = true;
    }
    
    if (!hasMemory) {
      return "";
    }

    return memoryContext + "Use this context to build a warm, continuous, and genuine human connection. Bring up their interests and goals naturally when relevant to make the coaching session highly personalized and friendly.";
  }

  /**
   * Cleans transcript text by stripping backticks and metadata tags
   */
  static cleanStreamingTags(text: string): string {
    if (!text) return "";
    return text
      .replace(/\[\s*(GRAMMAR_CORRECTION|NEW_WORD|ACCENT_PATTERN|LEARNING_STATE)[^\]]*\]/gi, "")
      .replace(/```json[\s\S]*?```/gi, "")
      .trim();
  }

  private saveToStorage(): void {
    try {
      const data = {
        id: this.id,
        goals: this.goals,
        interests: this.interests,
        preferences: this.preferences,
        previousConversations: this.previousConversations,
        personalContext: this.personalContext
      };
      localStorage.setItem('voyager_conversation_memory', JSON.stringify(data));
    } catch (e) {
      console.error('Failed to save conversation memory to storage:', e);
    }
  }

  private loadFromStorage(): void {
    try {
      const stored = localStorage.getItem('voyager_conversation_memory');
      if (stored) {
        const parsed = JSON.parse(stored);
        this.id = parsed.id || this.id;
        this.goals = parsed.goals || [];
        this.interests = parsed.interests || [];
        this.preferences = parsed.preferences || [];
        this.previousConversations = parsed.previousConversations || [];
        this.personalContext = parsed.personalContext || {};
      }
    } catch (e) {
      console.error('Failed to load conversation memory from storage:', e);
    }
  }
}
