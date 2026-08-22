import { useState, useCallback, useRef, useEffect } from 'react';
import { ConversationMode } from './ConversationModes';
import { ConversationEvent } from './LiveAgentTypes';

export function useConversationModes(initialMode: ConversationMode = 'BILINGUAL') {
  const [activeMode, setActiveModeState] = useState<ConversationMode>(initialMode);
  const [isTransitionLocked, setIsTransitionLocked] = useState(false);
  const modeLockTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Computed derived properties for UI compatibility
  const isBilingualMode = activeMode === 'BILINGUAL';
  const isTranslateMode = activeMode === 'LIVE_TRANSLATOR';
  const isListenOnly = activeMode === 'LISTEN_ONLY';
  const isSpanishOnlyMode = activeMode === 'SPANISH';
  const isEnglishOnlyMode = activeMode === 'AMERICAN_ENGLISH';

  const activeModeRef = useRef<ConversationMode>(activeMode);
  useEffect(() => {
    activeModeRef.current = activeMode;
  }, [activeMode]);

  // Clean up timeouts on unmount
  useEffect(() => {
    return () => {
      if (modeLockTimeoutRef.current) {
        clearTimeout(modeLockTimeoutRef.current);
      }
    };
  }, []);

  /**
   * Safely switches the active conversation mode.
   * Handles transition locks, mutual exclusion validation, and dispatches structured events.
   * Returns the structured ConversationEvent if transition succeeded, or null if ignored/locked.
   */
  const switchMode = useCallback((newMode: ConversationMode, selectedLang: 'EN' | 'ES', onLangChange?: (lang: 'EN' | 'ES') => void): ConversationEvent | null => {
    // 1. Transition Validation
    if (newMode === activeModeRef.current) {
      console.log(`[Mode Switch] Already in mode: ${newMode}. Transition ignored.`);
      return null;
    }

    if (isTransitionLocked) {
      console.warn(`[Mode Switch] Transition is locked. Please wait for the current mode change to settle.`);
      return null;
    }

    const previousMode = activeModeRef.current;

    // 2. Temporarily lock transitions to prevent rapid-fire clicking/switching issues
    setIsTransitionLocked(true);
    modeLockTimeoutRef.current = setTimeout(() => {
      setIsTransitionLocked(false);
    }, 800); // 800ms cool-down period

    // 3. State update
    setActiveModeState(newMode);

    // 4. Apply Language Selection Rules
    if (newMode === 'AMERICAN_ENGLISH' && selectedLang !== 'EN') {
      if (onLangChange) onLangChange('EN');
    } else if (newMode === 'SPANISH' && selectedLang !== 'ES') {
      if (onLangChange) onLangChange('ES');
    } else if (newMode === 'BILINGUAL' && selectedLang !== 'ES') {
      if (onLangChange) onLangChange('ES');
    }

    // 5. Generate and dispatch a structured typed mode-change event
    const sessionId = `session_${Date.now()}`;
    const modeChangeEvent: ConversationEvent = {
      type: 'MODE_CHANGE',
      timestamp: Date.now(),
      sessionId,
      data: {
        type: "conversation.mode.changed",
        mode: newMode,
        previousMode,
        timestamp: new Date().toISOString()
      }
    };

    console.log("Dispatched Mode-Change Event:", modeChangeEvent);
    return modeChangeEvent;
  }, [isTransitionLocked]);

  // Compatibility setters
  const setIsBilingualMode = useCallback((val: boolean) => {
    if (val) {
      switchMode('BILINGUAL', 'ES');
    } else if (activeModeRef.current === 'BILINGUAL') {
      switchMode('AMERICAN_ENGLISH', 'EN'); // Fallback default
    }
  }, [switchMode]);

  const setIsTranslateMode = useCallback((val: boolean) => {
    if (val) {
      switchMode('LIVE_TRANSLATOR', 'ES');
    } else if (activeModeRef.current === 'LIVE_TRANSLATOR') {
      switchMode('AMERICAN_ENGLISH', 'EN'); // Fallback default
    }
  }, [switchMode]);

  const setIsListenOnly = useCallback((val: boolean) => {
    if (val) {
      switchMode('LISTEN_ONLY', 'ES');
    } else if (activeModeRef.current === 'LISTEN_ONLY') {
      switchMode('AMERICAN_ENGLISH', 'EN'); // Fallback default
    }
  }, [switchMode]);

  const setIsSpanishOnlyMode = useCallback((val: boolean) => {
    if (val) {
      switchMode('SPANISH', 'ES');
    } else if (activeModeRef.current === 'SPANISH') {
      switchMode('AMERICAN_ENGLISH', 'EN'); // Fallback default
    }
  }, [switchMode]);

  const setIsEnglishOnlyMode = useCallback((val: boolean) => {
    if (val) {
      switchMode('AMERICAN_ENGLISH', 'EN');
    } else if (activeModeRef.current === 'AMERICAN_ENGLISH') {
      switchMode('BILINGUAL', 'ES'); // Fallback default
    }
  }, [switchMode]);

  return {
    activeMode,
    switchMode,
    isTransitionLocked,

    // UI/Session Compatibility Fields
    isBilingualMode,
    isTranslateMode,
    isListenOnly,
    isSpanishOnlyMode,
    isEnglishOnlyMode,

    setIsBilingualMode,
    setIsTranslateMode,
    setIsListenOnly,
    setIsSpanishOnlyMode,
    setIsEnglishOnlyMode
  };
}

export default useConversationModes;
