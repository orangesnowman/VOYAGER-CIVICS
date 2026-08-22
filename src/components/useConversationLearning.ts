import { useState, useCallback } from 'react';
import { PronunciationFeedbackEvent, ConversationEvent } from './LiveAgentTypes';
import { PronunciationCoach } from '../domain/PronunciationCoach';
import { ConversationMode } from './ConversationModes';
import { LearningProfile } from '../domain/LearningProfile';
import { ConversationMemory } from '../domain/ConversationMemory';

export function useConversationLearning() {
  const [profile] = useState(() => new LearningProfile());
  const [memory] = useState(() => new ConversationMemory());

  const [scores, setScores] = useState(() => profile.getCurrentScores());
  const [learnedWords, setLearnedWords] = useState<string[]>(() => profile.getLearnedWords());
  const [accentPatterns, setAccentPatterns] = useState<string[]>(() => profile.getAccentPatterns());
  const [pronunciationEvents, setPronunciationEvents] = useState<PronunciationFeedbackEvent[]>([]);

  const handleNewCoachingEvent = useCallback((newEvent: PronunciationFeedbackEvent) => {
    setPronunciationEvents(prev => [...prev, newEvent]);

    const conEvent: ConversationEvent = {
      type: 'PRONUNCIATION_COACHING',
      timestamp: Date.now(),
      sessionId: newEvent.sessionId,
      data: newEvent
    };
    console.log("Dispatched Pronunciation Coaching Event via PronunciationCoach:", conEvent);
  }, []);

  const createPronunciationEvent = useCallback((pattern: string) => {
    const newEvent = PronunciationCoach.createFeedbackEvent(pattern);
    handleNewCoachingEvent(newEvent);
  }, [handleNewCoachingEvent]);

  const updateLearningState = useCallback((parsed: any, activeMode: ConversationMode) => {
    const currentState = {
      scores,
      learnedWords,
      accentPatterns,
      pronunciationEvents
    };

    const result = PronunciationCoach.processIncomingMetrics(
      parsed,
      currentState,
      activeMode,
      handleNewCoachingEvent
    );

    // Synchronize to the domain model LearningProfile
    profile.updateScores(
      result.updatedScores.grammar,
      result.updatedScores.pronunciation,
      result.updatedScores.confidence,
      result.updatedScores.naturalness
    );
    profile.addLearnedWords(result.updatedWords);
    profile.addAccentPatterns(result.updatedPatterns);

    // Sync back to local component states
    setScores(result.updatedScores);
    setLearnedWords(profile.getLearnedWords());
    setAccentPatterns(profile.getAccentPatterns());
  }, [scores, learnedWords, accentPatterns, pronunciationEvents, handleNewCoachingEvent, profile]);

  return {
    scores,
    setScores,
    learnedWords,
    setLearnedWords,
    accentPatterns,
    setAccentPatterns,
    pronunciationEvents,
    setPronunciationEvents,
    createPronunciationEvent,
    updateLearningState,
    profile,
    memory
  };
}

export default useConversationLearning;
