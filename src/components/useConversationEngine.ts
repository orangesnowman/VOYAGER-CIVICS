import { useState, useEffect, useRef, useCallback } from 'react';
import { ChatMessage, Lead, TravelDestination, PronunciationFeedbackEvent, ConversationEvent } from './LiveAgentTypes';
import { useConversationSession } from './useConversationSession';
import { useConversationTranscript } from './useConversationTranscript';
import { useConversationLearning } from './useConversationLearning';
import { useConversationModes } from './useConversationModes';
import { ConversationMode } from './ConversationModes';
import { ConversationModePolicy } from '../domain/ConversationModePolicy';

export function useConversationEngine(
  activeTab: string = 'chat',
  onUserVoiceTranscription?: (text: string) => void
) {
  const [selectedLang, setSelectedLang] = useState<'EN' | 'ES'>('ES');

  // Use the extracted conversation mode manager
  const {
    activeMode,
    switchMode,
    isTransitionLocked,

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
  } = useConversationModes('SPANISH');

  // Use the extracted learning/metrics manager
  const {
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
  } = useConversationLearning();

  const [error, setError] = useState<string | null>(null);
  const [hasInteracted, setHasInteracted] = useState<boolean>(false);

  // Use the transcript manager
  const {
    chatMessages,
    setChatMessages,
    parseImmersionTags,
    addSystemMessage,
    addUserMessage,
    addSplashMessage,
    updateUserVoiceTranscription,
    updateAssistantResponse
  } = useConversationTranscript(activeTab);

  // Initialize the session hook
  const session = useConversationSession({
    selectedLang,
    isBilingualMode,
    isTranslateMode,
    isListenOnly,
    isSpanishOnlyMode,
    isEnglishOnlyMode,
    memory,
    hasInteracted,
    userName: profile?.name,
    userAge: profile?.age ? String(profile.age) : undefined,
    userCountry: profile?.country,
    userGoal: profile?.goal,
    userLevel: profile?.levelEstimate,
    activeTab,
    onUserTranscription: (text) => {
      if (onUserVoiceTranscription) {
        onUserVoiceTranscription(text);
      }
      memory.extractLearnerContext(text);
    },
    onTextResponse: (text, showForm) => {
      updateAssistantResponse(text, showForm, (parsed) => {
        updateLearningState(parsed, activeMode);
      });
    },
    onOpen: () => {
      addSystemMessage(
        selectedLang === 'EN'
          ? '🟢 Connected! Speaking is active with VOYAGER.'
          : '🟢 ¡Conectado! La voz está activa con VOYAGER.',
        `msg_sys_open_${Date.now()}`
      );
    },
    onMessageReceived: (msg) => {
      if (msg.meetingBooked) {
         console.log("Meeting booked successfully.");
         return;
      }

      if (msg.languageSwitch) {
        setSelectedLang(msg.languageSwitch);
      }

      if (msg.progressUpdate) {
        console.log("Received progress update from tool:", msg.progressUpdate);
        const { scores: pScores, learnedWords: pLearnedWords, accentTips } = msg.progressUpdate;
        
        if (pScores) {
          setScores({
            grammar: pScores.grammar || 0,
            pronunciation: pScores.pronunciation || 0,
            confidence: pScores.confidence || 0,
            naturalness: pScores.naturalness || 0
          });
        }
        
        if (pLearnedWords && pLearnedWords.length > 0) {
          setLearnedWords(prev => {
            const updated = [...prev];
            pLearnedWords.forEach((w: string) => {
              if (!updated.includes(w)) updated.push(w);
            });
            return updated;
          });
        }
        
        if (accentTips) {
          setAccentPatterns(prev => {
            if (!prev.includes(accentTips)) {
              createPronunciationEvent(accentTips);
              return [...prev, accentTips];
            }
            return prev;
          });
        }
      }

      if (msg.mapAction) {
        console.log("Received mapAction (deferred in Phase 1):", msg.mapAction, msg.data);
      }
    },
    onError: (errMsg) => {
      setError(errMsg);
      addSystemMessage(
        `⚠️ ${errMsg}`,
        `msg_sys_err_${Date.now()}`
      );
    },
    onClose: () => {
      addSystemMessage(
        selectedLang === 'EN'
          ? '🔴 Disconnected from VOYAGER Voice Agent.'
          : '🔴 Desconectado del agente de voz VOYAGER.',
        `msg_sys_close_${Date.now()}`
      );
    },
    onAutoPause: () => {
      addSystemMessage(
        selectedLang === 'EN'
          ? 'ℹ️ Session paused. Type a message below to resume.'
          : 'ℹ️ Sesión en pausa. Escribe un mensaje en el campo de texto de abajo para reanudar la sesión.',
        `msg_sys_pause_${Date.now()}`
      );
    }
  });

  const wsRef = session.wsRef;

  // Handle WebSocket updates for session error propagation
  useEffect(() => {
    if (session.error) {
      setError(session.error);
    }
  }, [session.error]);

  const previousModeRef = useRef<ConversationMode>('BILINGUAL');

  // Centralized tracking and coordination of dynamic mode transitions
  useEffect(() => {
    const prevMode = previousModeRef.current;
    if (prevMode !== activeMode) {
      previousModeRef.current = activeMode;

      // Coordinate mode prompt switch with Gemini over WebSocket
      if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
        const msgText = ConversationModePolicy.getDynamicModeSwitchPrompt(activeMode);
        if (msgText) {
          wsRef.current.send(JSON.stringify({ text: msgText }));
        }
      }

      // Add clean status system banner to the chat log
      let chatText = "";
      if (selectedLang === 'EN') {
        switch (activeMode) {
          case 'LISTEN_ONLY':
            chatText = 'ℹ️ Monitor Mode active: VOYAGER is listening only and will not speak. Feedback will be provided via text.';
            break;
          case 'LIVE_TRANSLATOR':
            chatText = 'ℹ️ Instant Translation Mode active: VOYAGER will translate what you say immediately.';
            break;
          case 'BILINGUAL':
            chatText = 'ℹ️ Bilingual Mode active: VOYAGER will respond in Spanish and repeat in English.';
            break;
          case 'SPANISH':
            chatText = 'ℹ️ Spanish Only Mode active: VOYAGER will converse with you strictly in Spanish.';
            break;
          case 'AMERICAN_ENGLISH':
            chatText = 'ℹ️ English Only Mode active: VOYAGER will speak strictly in English for advanced practice.';
            break;
        }
      } else {
        switch (activeMode) {
          case 'LISTEN_ONLY':
            chatText = 'ℹ️ Modo Monitor activo: VOYAGER está únicamente escuchando y no hablará. Las correcciones se mostrarán por texto.';
            break;
          case 'LIVE_TRANSLATOR':
            chatText = 'ℹ️ Modo Traducción Instantánea activo: VOYAGER traducirá lo que digas de inmediato.';
            break;
          case 'BILINGUAL':
            chatText = 'ℹ️ Modo Bilingüe activo: VOYAGER responderá en español y lo repetirá en inglés.';
            break;
          case 'SPANISH':
            chatText = 'ℹ️ Modo Solo Español activo: VOYAGER conversará contigo estrictamente en español.';
            break;
          case 'AMERICAN_ENGLISH':
            chatText = 'ℹ️ Modo Solo Inglés activo: VOYAGER hablará estrictamente en inglés para práctica avanzada.';
            break;
        }
      }

      if (chatText) {
        setChatMessages(prev => [
          ...prev,
          {
            id: `msg_sys_mode_${activeMode}_${Date.now()}`,
            sender: 'system',
            text: chatText,
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            timeMs: Date.now()
          }
        ]);
      }
    }
  }, [activeMode, selectedLang, wsRef, setChatMessages]);

  const connectToGemini = useCallback((initialPrompt?: string, isVoiceConnection: boolean = false, langOverride?: 'EN' | 'ES') => {
    session.connect(initialPrompt, isVoiceConnection, langOverride);
  }, [session]);

  const disconnectSession = useCallback(() => {
    session.disconnect();
  }, [session]);

  return {
    // Session states
    isConnected: session.isConnected,
    statusText: session.statusText,
    isPaused: session.isPaused,
    secondsElapsed: session.secondsElapsed,
    volume: session.volume,
    error,
    setError,

    // Language & Mode states
    activeMode,
    switchMode,
    selectedLang,
    setSelectedLang,
    isListenOnly,
    setIsListenOnly,
    isTranslateMode,
    setIsTranslateMode,
    isBilingualMode,
    setIsBilingualMode,
    isSpanishOnlyMode,
    setIsSpanishOnlyMode,
    isEnglishOnlyMode,
    setIsEnglishOnlyMode,

    // Memory & Learning metrics
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
    memory,

    // Transcript
    chatMessages,
    setChatMessages,
    addSystemMessage,
    addUserMessage,
    addSplashMessage,
    updateUserVoiceTranscription,
    updateAssistantResponse,

    // Interaction states
    hasInteracted,
    setHasInteracted,

    // Proxy actions
    connect: connectToGemini,
    disconnect: disconnectSession,
    sendText: session.sendText,
    pause: session.pause,
    resume: session.resume,
    recordInteraction: session.recordInteraction,
    wsRef
  };
}

export default useConversationEngine;
