import { useState, useEffect, useRef, useCallback } from 'react';
import { AudioCapture, AudioPlayback, VoiceActivityDetector } from '../domain/AudioSystem';
import { ConversationModePolicy } from '../domain/ConversationModePolicy';
import { ConversationMemory } from '../domain/ConversationMemory';
import { getLocalProfileCache } from '../services/userProfileService';
import { ALL_CIVICS_128_QUESTIONS } from '../data/civics128Data';

interface UseConversationSessionConfig {
  selectedLang: 'EN' | 'ES';
  isBilingualMode: boolean;
  isTranslateMode: boolean;
  isListenOnly: boolean;
  isSpanishOnlyMode: boolean;
  isEnglishOnlyMode: boolean;
  onUserTranscription: (text: string) => void;
  onTextResponse: (text: string, showForm: boolean) => void;
  onOpen: () => void;
  onMessageReceived: (msg: any) => void;
  onError: (error: string) => void;
  onClose: () => void;
  onAutoPause?: () => void;
  memory?: ConversationMemory;
  hasInteracted: boolean;
  userName?: string;
  userEmail?: string;
  userAge?: string;
  userCountry?: string;
  usState?: string;
  userGoal?: string;
  userLevel?: string;
  userRole?: string;
  activeTab?: string;
}

export function useConversationSession(config: UseConversationSessionConfig) {
  const {
    selectedLang,
    isBilingualMode,
    isTranslateMode,
    isListenOnly,
    isSpanishOnlyMode,
    isEnglishOnlyMode,
    onUserTranscription,
    onTextResponse,
    onOpen,
    onMessageReceived,
    onError,
    onClose,
    onAutoPause,
    memory,
    hasInteracted,
    userName,
    userEmail,
    userAge,
    userCountry,
    usState,
    userGoal,
    userLevel,
    userRole,
    activeTab,
  } = config;

  const [isConnected, setIsConnected] = useState(false);
  const [statusText, setStatusText] = useState('Disconnected');
  const [error, setError] = useState<string | null>(null);
  const [isPaused, setIsPaused] = useState(false);
  const [secondsElapsed, setSecondsElapsed] = useState(0);
  const [volume, setVolume] = useState(0);

  // Modular Audio Subsystems & Domain objects
  const captureRef = useRef<AudioCapture | null>(null);
  const playbackRef = useRef<AudioPlayback | null>(null);
  const vadRef = useRef<VoiceActivityDetector>(new VoiceActivityDetector());
  const wsRef = useRef<WebSocket | null>(null);

  const isPausedRef = useRef(false);
  const isListenOnlyRef = useRef(isListenOnly);
  const onUserTranscriptionRef = useRef(onUserTranscription);
  const onTextResponseRef = useRef(onTextResponse);
  const onOpenRef = useRef(onOpen);
  const onMessageReceivedRef = useRef(onMessageReceived);
  const onErrorRef = useRef(onError);
  const onCloseRef = useRef(onClose);

  // Keep references updated to avoid closure stale-state issues
  useEffect(() => {
    isPausedRef.current = isPaused;
  }, [isPaused]);

  useEffect(() => {
    isListenOnlyRef.current = isListenOnly;
  }, [isListenOnly]);

  useEffect(() => {
    onUserTranscriptionRef.current = onUserTranscription;
    onTextResponseRef.current = onTextResponse;
    onOpenRef.current = onOpen;
    onMessageReceivedRef.current = onMessageReceived;
    onErrorRef.current = onError;
    onCloseRef.current = onClose;
  });

  const recordInteraction = useCallback(() => {
    vadRef.current.recordActivity();
  }, []);

  const ensureAudioContexts = useCallback(() => {
    if (!captureRef.current) {
      captureRef.current = new AudioCapture();
    }
    if (!playbackRef.current) {
      playbackRef.current = new AudioPlayback();
    }
    playbackRef.current.init();
  }, []);

  // Update volume hook using clean domain-level properties
  useEffect(() => {
    let animationFrameId: number;
    const updateVolume = () => {
      let captureVol = 0;
      let playbackVol = 0;

      if (isConnected) {
        if (captureRef.current) {
          captureVol = captureRef.current.getVolume();
        }
        if (playbackRef.current) {
          playbackVol = playbackRef.current.getVolume();
        }
      }
      
      const combinedVol = Math.max(captureVol, playbackVol);
      setVolume(combinedVol);
      animationFrameId = requestAnimationFrame(updateVolume);
    };
    updateVolume();
    return () => cancelAnimationFrame(animationFrameId);
  }, [isConnected]);

  // Session timer
  useEffect(() => {
    if (!isConnected) {
      setSecondsElapsed(0);
      return;
    }
    if (isPaused) {
      return;
    }
    const interval = setInterval(() => {
      setSecondsElapsed(prev => prev + 1);
    }, 1000);
    return () => clearInterval(interval);
  }, [isConnected, isPaused]);

  // Clean WebSocket and media resources using domain abstractions
  const disconnect = useCallback(() => {
    setIsConnected(false);
    setStatusText('Disconnected');
    setVolume(0);
    setIsPaused(false);
    isPausedRef.current = false;

    if (wsRef.current) {
      const ws = wsRef.current;
      wsRef.current = null;
      ws.onopen = null;
      ws.onmessage = null;
      ws.onerror = null;
      ws.onclose = null;

      if (ws.readyState === WebSocket.OPEN || ws.readyState === WebSocket.CONNECTING) {
        try {
          ws.close();
        } catch (e) {
          console.error('Error closing WebSocket:', e);
        }
      }
    }

    if (captureRef.current) {
      captureRef.current.stop();
      captureRef.current = null;
    }

    if (playbackRef.current) {
      playbackRef.current.stop();
      playbackRef.current = null;
    }

    onClose();
  }, [onClose]);

  // Connect to the Live API session proxy on server.ts
  const connect = useCallback(async (initialPrompt?: string, isVoiceConnection: boolean = false, langOverride?: 'EN' | 'ES') => {
    setError(null);
    setIsPaused(false);
    isPausedRef.current = false;
    vadRef.current.reset();
    ensureAudioContexts();

    try {
      setStatusText('Connecting...');
      
      if (!captureRef.current) {
        captureRef.current = new AudioCapture();
      }

      const activeLang = langOverride || selectedLang;
      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const nameParam = userName ? `&userName=${encodeURIComponent(userName)}` : '';
      const emailParam = userEmail ? `&userEmail=${encodeURIComponent(userEmail)}` : '';
      const wsUrl = `${protocol}//${window.location.host}/api/live?lang=${activeLang}${nameParam}${emailParam}`;
      const ws = new WebSocket(wsUrl);
      wsRef.current = ws;

      ws.onopen = async () => {
        setIsConnected(true);
        setStatusText('Connected');
        setIsPaused(false);
        isPausedRef.current = false;
        console.log('WebSocket connection to server established');
        
        onOpenRef.current();

        try {
          // Delegate voice capture initialization to AudioCapture
          await captureRef.current?.start((base64Data) => {
            if (ws.readyState !== WebSocket.OPEN) return;
            if (isPausedRef.current) return;
            
            vadRef.current.recordActivity();
            ws.send(JSON.stringify({ audio: base64Data }));
          });
        } catch (captureErr: any) {
          console.warn('Audio capture failed to start:', captureErr);
          if (captureRef.current) {
            captureRef.current.stop();
          }
          const errStr = String(captureErr?.message || captureErr || '').toLowerCase();
          const errName = String(captureErr?.name || '');
          const isPermissionDenied = errName === 'NotAllowedError' || 
            errName === 'PermissionDeniedError' || 
            errStr.includes('permission') || 
            errStr.includes('denied');

          const userErrMsg = isPermissionDenied 
            ? (selectedLang === 'EN' 
                ? 'Microphone permission denied. Voice mode is disabled, but you can continue using text chat.' 
                : 'Permiso de micrófono denegado. El modo de voz está desactivado, pero puedes continuar usando el chat de texto.')
            : (selectedLang === 'EN'
                ? 'Microphone initialization failed. You can continue using text chat.'
                : 'No se pudo iniciar el micrófono. Puedes continuar usando el chat de texto.');

          onErrorRef.current(userErrMsg);
        }
      };

      ws.onmessage = async (event) => {
        try {
          vadRef.current.recordActivity();
          const msg = JSON.parse(event.data);
          
          // Relay all specific custom server payloads up
          onMessageReceivedRef.current(msg);

          if (msg.status === 'connected') {
            console.log('Gemini session active on backend. Mapping mode instructions via ConversationModePolicy.');
            if (msg.reconnected) {
              console.log('Seamless reconnection complete. Session active.');
              return;
            }
            
            // Map state variables back to a typed Mode for ConversationModePolicy
            const currentMode = isBilingualMode ? 'BILINGUAL'
                              : isTranslateMode ? 'LIVE_TRANSLATOR'
                              : isListenOnly ? 'LISTEN_ONLY'
                              : isSpanishOnlyMode ? 'SPANISH'
                              : isEnglishOnlyMode ? 'AMERICAN_ENGLISH'
                              : 'BILINGUAL';

            if (hasInteracted) {
              let greetingPrompt = "";
              const isOralTest = initialPrompt && (
                initialPrompt.includes('OFFICIAL USCIS') ||
                initialPrompt.includes('CIVICS TEST') ||
                initialPrompt.includes('NATURALIZATION CIVICS')
              );

              if (isOralTest) {
                greetingPrompt = initialPrompt;
              } else {
                greetingPrompt = ConversationModePolicy.getSystemInstructionsForMode(currentMode, {
                  initialPrompt,
                  selectedLang,
                  userName,
                  userAge,
                  userCountry,
                  usState,
                  userGoal,
                  userLevel,
                  userRole,
                  activeTab
                });

                if (activeTab === 'civics') {
                  let savedIdx = 0;
                  let activeSubTab: 'guide' | 'bilingual' | 'english' | 'exam' = 'bilingual';
                  try {
                    const rawIdx = localStorage.getItem('voyager_civics_flashcard_index');
                    if (rawIdx !== null) savedIdx = parseInt(rawIdx, 10) || 0;
                    const rawSub = localStorage.getItem('voyager_last_active_subtab') as any;
                    if (rawSub) activeSubTab = rawSub;
                  } catch (e) {}

                  const activeQ = ALL_CIVICS_128_QUESTIONS[savedIdx % ALL_CIVICS_128_QUESTIONS.length];
                  greetingPrompt += '\n\n' + ConversationModePolicy.getCivicsSystemInstructions(selectedLang, activeSubTab, activeQ ? {
                    id: activeQ.id,
                    questionEn: activeQ.questionEn,
                    questionEs: activeQ.questionEs,
                    indexOnScreen: savedIdx + 1,
                    totalQuestions: ALL_CIVICS_128_QUESTIONS.length
                  } : undefined);
                }

                if (memory) {
                  greetingPrompt += memory.getMemoryPayloadForPrompt();
                }
              }
              
              if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
                wsRef.current.send(JSON.stringify({ text: greetingPrompt }));
              }
            } else {
              const localCache = getLocalProfileCache();
              const hasExistingProfile = localCache && (
                localCache.onboardingCompleted ||
                localCache.country ||
                localCache.usState ||
                localCache.state ||
                localCache.goal ||
                localCache.role ||
                (userName && userName !== 'Guest' && userName !== 'Invitado')
              );

              if (hasExistingProfile) {
                let greetingPrompt = ConversationModePolicy.getSystemInstructionsForMode(currentMode, {
                  initialPrompt,
                  selectedLang,
                  userName: userName || localCache?.name,
                  userAge: userAge || (localCache?.age ? String(localCache.age) : undefined),
                  userCountry: userCountry || localCache?.country,
                  usState: usState || localCache?.usState || localCache?.state,
                  userGoal: userGoal || localCache?.goal,
                  userLevel: userLevel || localCache?.levelEstimate,
                  userRole: userRole || localCache?.role,
                  activeTab
                });

                if (activeTab === 'civics') {
                  let savedIdx = 0;
                  let activeSubTab: 'guide' | 'bilingual' | 'english' | 'exam' = 'bilingual';
                  try {
                    const rawIdx = localStorage.getItem('voyager_civics_flashcard_index');
                    if (rawIdx !== null) savedIdx = parseInt(rawIdx, 10) || 0;
                    const rawSub = localStorage.getItem('voyager_last_active_subtab') as any;
                    if (rawSub) activeSubTab = rawSub;
                  } catch (e) {}

                  const activeQ = ALL_CIVICS_128_QUESTIONS[savedIdx % ALL_CIVICS_128_QUESTIONS.length];
                  greetingPrompt += '\n\n' + ConversationModePolicy.getCivicsSystemInstructions(selectedLang, activeSubTab, activeQ ? {
                    id: activeQ.id,
                    questionEn: activeQ.questionEn,
                    questionEs: activeQ.questionEs,
                    indexOnScreen: savedIdx + 1,
                    totalQuestions: ALL_CIVICS_128_QUESTIONS.length
                  } : undefined);
                }

                if (memory) {
                  greetingPrompt += memory.getMemoryPayloadForPrompt();
                }

                if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
                  wsRef.current.send(JSON.stringify({ text: greetingPrompt }));
                }
              } else {
                const welcomeSpeech = "¡Bienvenido! Yo soy Voyager, tutor de Inglés Americano. Necesito saber más de ti para servirte mejor. Dime, ¿a qué te dedicas?";
                const welcomePrompt = `[INSTRUCCIÓN DE SISTEMA MANDATORIA: Estás guiando al usuario en el cuestionario de perfil inicial. 
Habla en tu voz natural de Voyager y lee en voz alta ÚNICAMENTE el siguiente mensaje en español: "${welcomeSpeech}".
REGLA CRÍTICA: NO digas nada más, NO saludes con "Hola", NO preguntes "¿Qué te trae por aquí hoy?" ni intentes iniciar una charla casual. Solo di este mensaje claramente y guarda silencio absoluto esperando la respuesta del usuario en la interfaz.]`;
                
                const onboardingInstruction = `[INSTRUCCIÓN DE SISTEMA DE SOPORTE DE ONBOARDING: El usuario está completando el formulario. Quédate en silencio y NO respondas a ruidos, habla o ruidos de fondo. Mantén el silencio absoluto hasta recibir una nueva instrucción.]`;

                if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
                  wsRef.current.send(JSON.stringify({ text: welcomePrompt }));
                  wsRef.current.send(JSON.stringify({ text: onboardingInstruction }));
                }
              }
            }
            return;
          }
          
          if (msg.sessionEnded) {
            console.log('Session ended gracefully by server:', msg.info);
            disconnect();
            return;
          }

          if (msg.error) {
             const isGoAwayOrAborted = typeof msg.error === 'string' && (
               msg.error.includes("GoAway") || 
               msg.error.includes("aborted") || 
               msg.error.includes("session duration") ||
               msg.error.includes("GoAway signal")
             );
             if (isGoAwayOrAborted) {
               console.log('Session ended due to timeout or GoAway signal:', msg.error);
               disconnect();
               return;
             }
             console.error('Server reported error:', msg.error);
             setError(msg.error);
             disconnect();
             return;
          }

          if (msg.userTranscription && !isPausedRef.current) {
            onUserTranscriptionRef.current(msg.userTranscription);
          }

          if (msg.text && !isPausedRef.current) {
            onTextResponseRef.current(msg.text, !!msg.showForm);
          }

          if (msg.audio && !isListenOnlyRef.current && !isPausedRef.current) {
            // Delegate audio queue and timing-based playback to AudioPlayback module
            playbackRef.current?.playRawPCM(msg.audio);
          }
        } catch (e) {
          console.error('Error reading message:', e);
        }
      };

      ws.onclose = () => {
         console.log('WebSocket connection closed');
         disconnect();
      };

      ws.onerror = (err) => {
         console.error('WebSocket error:', err);
         setError('Server connection error');
         disconnect();
      };

    } catch (err: any) {
        console.error('Connection Failed', err);
        setError(err.message || 'Error connecting or accessing microphone. Please ensure microphone permissions are granted.');
        setStatusText('Disconnected');
    }
  }, [
    selectedLang,
    isBilingualMode,
    isTranslateMode,
    isListenOnly,
    isSpanishOnlyMode,
    isEnglishOnlyMode,
    ensureAudioContexts,
    disconnect
  ]);

  const sendText = useCallback((text: string) => {
    vadRef.current.recordActivity();
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      try {
        wsRef.current.send(JSON.stringify({ text }));
        return true;
      } catch (e) {
        console.warn('sendText exception:', e);
        return false;
      }
    }
    return false;
  }, []);

  const pause = useCallback(() => {
    setIsPaused(true);
    isPausedRef.current = true;
    setVolume(0);
    if (playbackRef.current) {
      playbackRef.current.stop();
    }
    if (typeof window !== 'undefined' && window.speechSynthesis) {
      window.speechSynthesis.cancel();
    }
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      try {
        wsRef.current.send(JSON.stringify({ text: '[INSTRUCCIÓN DE SISTEMA: La conversación está en PAUSA. No envíes más respuestas ni audio.]' }));
      } catch (e) {}
    }
  }, []);

  const resume = useCallback(() => {
    setIsPaused(false);
    isPausedRef.current = false;
    if (playbackRef.current) {
      playbackRef.current.init();
    }
    vadRef.current.recordActivity();
    if (typeof window !== 'undefined' && window.speechSynthesis && window.speechSynthesis.paused) {
      window.speechSynthesis.resume();
    }
  }, []);

  // Inactivity auto-pause (3 minutes threshold for natural learning cadence)
  useEffect(() => {
    if (!isConnected || isPaused) return;
    const interval = setInterval(() => {
      const inactiveMs = vadRef.current.getInactiveMs();
      if (inactiveMs > 180000) {
        console.log('Auto-pausing session due to 180s inactivity tracked by VoiceActivityDetector');
        pause();
        if (onAutoPause) onAutoPause();
      }
    }, 3000);
    return () => clearInterval(interval);
  }, [isConnected, isPaused, pause, onAutoPause]);

  return {
    isConnected,
    statusText,
    error,
    isPaused,
    secondsElapsed,
    volume,
    connect,
    disconnect,
    sendText,
    pause,
    resume,
    recordInteraction,
    wsRef
  };
}

export default useConversationSession;
