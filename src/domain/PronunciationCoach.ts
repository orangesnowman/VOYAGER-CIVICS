import { PronunciationFeedbackEvent, ConversationEvent } from '../components/LiveAgentTypes';
import { ConversationMode } from '../components/ConversationModes';
import { ConversationModePolicy } from './ConversationModePolicy';

export interface CoachingSessionState {
  scores: {
    grammar: number;
    pronunciation: number;
    confidence: number;
    naturalness: number;
  };
  learnedWords: string[];
  accentPatterns: string[];
  pronunciationEvents: PronunciationFeedbackEvent[];
}

export class PronunciationCoach {
  /**
   * Evaluates whether feedback/coaching should be given based on current mode and text.
   */
  static shouldEvaluate(mode: ConversationMode): boolean {
    return ConversationModePolicy.isCoachingAllowed(mode);
  }

  /**
   * Generates a structured PronunciationFeedbackEvent from a newly detected accent pattern suggestion.
   */
  static createFeedbackEvent(coachingSuggestion: string): PronunciationFeedbackEvent {
    const eventId = `pron_ev_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`;
    let phraseSpoken = "Practice phrase";
    let detectedIssue = "Accent pattern";
    let correctedPronunciation = "Corrected stress/sounds";

    // Attempt to extract quoted phrase
    const quotesMatch = coachingSuggestion.match(/['"]([^'"]+)['"]/);
    if (quotesMatch) {
      phraseSpoken = quotesMatch[1];
    }

    if (coachingSuggestion.toLowerCase().includes("instead of") || coachingSuggestion.toLowerCase().includes("not")) {
      detectedIssue = "Vowel/consonant stress or placement";
    }

    return {
      id: eventId,
      phraseSpoken,
      detectedIssue,
      correctedPronunciation,
      coachingSuggestion,
      confidence: 0.95,
      timestamp: Date.now(),
      sessionId: `session_${Date.now()}`
    };
  }

  /**
   * Evaluates the incoming live parsed payloads and returns an updated learning state, 
   * triggering coaching events when appropriate.
   */
  static processIncomingMetrics(
    parsedPayload: any,
    currentState: CoachingSessionState,
    activeMode: ConversationMode,
    onNewCoachingEvent?: (event: PronunciationFeedbackEvent) => void
  ): {
    updatedScores: CoachingSessionState['scores'];
    updatedWords: string[];
    updatedPatterns: string[];
    newEvents: PronunciationFeedbackEvent[];
  } {
    const updatedScores = parsedPayload.newScores ? { ...parsedPayload.newScores } : { ...currentState.scores };
    
    // Add learned words
    const updatedWords = [...currentState.learnedWords];
    if (parsedPayload.newLearnedWords && Array.isArray(parsedPayload.newLearnedWords)) {
      parsedPayload.newLearnedWords.forEach((word: string) => {
        if (word && !updatedWords.includes(word)) {
          updatedWords.push(word);
        }
      });
    }

    const updatedPatterns = [...currentState.accentPatterns];
    const newEvents = [...currentState.pronunciationEvents];

    // Only process accent pattern coaching suggestions if mode-policy permits coaching
    if (parsedPayload.newAccentPattern && this.shouldEvaluate(activeMode)) {
      const pattern = parsedPayload.newAccentPattern;
      if (!updatedPatterns.includes(pattern)) {
        updatedPatterns.push(pattern);
        
        // Coach decides how to generate the coaching feedback event
        const newEvent = this.createFeedbackEvent(pattern);
        newEvents.push(newEvent);

        if (onNewCoachingEvent) {
          onNewCoachingEvent(newEvent);
        }
      }
    }

    return {
      updatedScores,
      updatedWords,
      updatedPatterns,
      newEvents
    };
  }
}
