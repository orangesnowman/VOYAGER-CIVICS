import { useState, useEffect, useRef, useCallback } from 'react';
import { AudioCapture, AudioPlayback, VoiceActivityDetector } from '../domain/AudioSystem';
import { ConversationModePolicy } from '../domain/ConversationModePolicy';
import { ConversationMemory } from '../domain/ConversationMemory';
import { getLocalProfileCache, flushAllPendingUserData } from '../services/userProfileService';
import { ALL_CIVICS_128_QUESTIONS } from '../data/civics128Data';
import { playStateSwitchBing } from '../services/audioUtils';
import { auth } from '../services/firebaseAuth';

interface UseConversationSessionConfig {
  selectedLang: 'EN' | 'ES';
  isAdaptiveMode?: boolean;
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
  onAutoPause?: (reason: 'inactivity') => void;
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
  activeGuidedLesson?: any;
  isSpeakingOrTtsActive?: boolean;
  isUserTyping?: boolean;
}

export function useConversationSession(config: UseConversationSessionConfig) {
  const {
    selectedLang,
    isAdaptiveMode,
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
    activeGuidedLesson,
    isSpeakingOrTtsActive,
    isUserTyping,
  } = config;

  const [isConnected, setIsConnected] = useState(false);
  const [isSessionActive, setIsSessionActive] = useState(false);
  const [framesSent, setFramesSent] = useState(0);
  const [chunksReceived, setChunksReceived] = useState(0);
  const [lastUserTranscriptionState, setLastUserTranscriptionState] = useState('');
  const [lastModelResponseState, setLastModelResponseState] = useState('');
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
  const isSessionActiveRef = useRef(false);
  const isListenOnlyRef = useRef(isListenOnly);
  const onUserTranscriptionRef = useRef(onUserTranscription);
  const onTextResponseRef = useRef(onTextResponse);
  const onOpenRef = useRef(onOpen);
  const onMessageReceivedRef = useRef(onMessageReceived);
  const onErrorRef = useRef(onError);
  const onCloseRef = useRef(onClose);

  const isAnnouncingPauseRef = useRef<boolean>(false);
  const announcementTimerRef = useRef<NodeJS.Timeout | null>(null);

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
    if (isTimerPausedRef.current || !lastActiveStartTimestampRef.current) {
      lastActiveStartTimestampRef.current = Date.now();
      setIsTimerPaused(false);
      isTimerPausedRef.current = false;
    }
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

  const [isTimerPaused, setIsTimerPaused] = useState(false);
  const isTimerPausedRef = useRef(false);

  // Timestamp-based active session timer
  const activeAccumulatedMsRef = useRef<number>(0);
  const lastActiveStartTimestampRef = useRef<number | null>(null);
  const lastGenuineActivityTimestampRef = useRef<number>(Date.now());

  const recordGenuineActivity = useCallback(() => {
    lastGenuineActivityTimestampRef.current = Date.now();
    vadRef.current.recordActivity();
    if (isTimerPausedRef.current) {
      lastActiveStartTimestampRef.current = Date.now();
      setIsTimerPaused(false);
      isTimerPausedRef.current = false;
    }
  }, []);

  const pauseTimer = useCallback((isDueToInactivity: boolean = false) => {
    if (lastActiveStartTimestampRef.current) {
      if (isDueToInactivity && lastGenuineActivityTimestampRef.current) {
        // Exclude the 30 seconds of inactivity: only credit time up to the last genuine activity
        const genuineElapsedMs = Math.max(0, lastGenuineActivityTimestampRef.current - lastActiveStartTimestampRef.current);
        activeAccumulatedMsRef.current += genuineElapsedMs;
      } else {
        // Manual pause: credit active time up to the exact moment pause was triggered
        activeAccumulatedMsRef.current += Math.max(0, Date.now() - lastActiveStartTimestampRef.current);
      }
      lastActiveStartTimestampRef.current = null;
    }
    const currentSeconds = Math.floor(activeAccumulatedMsRef.current / 1000);
    setSecondsElapsed(currentSeconds);
    setIsTimerPaused(true);
    isTimerPausedRef.current = true;
  }, []);

  const resumeTimer = useCallback(() => {
    lastActiveStartTimestampRef.current = Date.now();
    lastGenuineActivityTimestampRef.current = Date.now();
    setIsTimerPaused(false);
    isTimerPausedRef.current = false;
    vadRef.current.recordActivity();
  }, []);

  const setSecondsElapsedWithSync = useCallback((valOrUpdater: React.SetStateAction<number>) => {
    setSecondsElapsed(prev => {
      const next = typeof valOrUpdater === 'function' ? valOrUpdater(prev) : valOrUpdater;
      activeAccumulatedMsRef.current = next * 1000;
      if (!isTimerPausedRef.current && lastActiveStartTimestampRef.current) {
        lastActiveStartTimestampRef.current = Date.now();
      }
      return next;
    });
  }, []);

  // Session timer using local timestamps (Date.now())
  useEffect(() => {
    if (!isConnected && !activeGuidedLesson) {
      setSecondsElapsed(0);
      setIsTimerPaused(false);
      isTimerPausedRef.current = false;
      activeAccumulatedMsRef.current = 0;
      lastActiveStartTimestampRef.current = null;
      return;
    }
    if (isPaused || isTimerPaused) {
      return;
    }

    if (!lastActiveStartTimestampRef.current) {
      lastActiveStartTimestampRef.current = Date.now();
    }

    const interval = setInterval(() => {
      if (lastActiveStartTimestampRef.current && !isPausedRef.current && !isTimerPausedRef.current) {
        const currentActiveMs = activeAccumulatedMsRef.current + (Date.now() - lastActiveStartTimestampRef.current);
        setSecondsElapsed(Math.floor(currentActiveMs / 1000));
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [isConnected, isPaused, isTimerPaused, activeGuidedLesson]);

  // Clean WebSocket and media resources using domain abstractions
  const disconnect = useCallback(() => {
    // Flush accumulated dirty state to Firestore upon ending session
    flushAllPendingUserData().catch(() => {});

    setIsConnected(false);
    setIsSessionActive(false);
    setStatusText('Disconnected');
    setVolume(0);
    setIsPaused(false);
    isPausedRef.current = false;
    isSessionActiveRef.current = false;

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
    setIsSessionActive(false);
    isSessionActiveRef.current = false;
    vadRef.current.reset();
    ensureAudioContexts();
    setFramesSent(0);
    setChunksReceived(0);
    setLastUserTranscriptionState('');
    setLastModelResponseState('');

    try {
      setStatusText('Connecting...');
      
      if (!captureRef.current) {
        captureRef.current = new AudioCapture();
      }
      if (!playbackRef.current) {
        playbackRef.current = new AudioPlayback();
      }
      playbackRef.current.init();

      // Start capture immediately in the gesture call stack
      try {
        let sentFrames = 0;
        await captureRef.current.start((base64Data) => {
          if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN && !isPausedRef.current && isSessionActiveRef.current) {
            sentFrames++;
            setFramesSent(prev => prev + 1);
            vadRef.current.recordActivity();
            wsRef.current.send(JSON.stringify({ audio: base64Data }));
            if (sentFrames === 1 || sentFrames % 50 === 0) {
              console.log(`[Client Session] Sent audio frame #${sentFrames} to WS server`);
            }
          }
        });
      } catch (captureErr: any) {
        console.warn('Audio capture failed to start immediately:', captureErr);
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

      const activeLang = langOverride || selectedLang;
      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const nameParam = userName ? `&userName=${encodeURIComponent(userName)}` : '';
      const emailParam = userEmail ? `&userEmail=${encodeURIComponent(userEmail)}` : '';
      const levelParam = userLevel ? `&userLevel=${encodeURIComponent(userLevel)}` : '';
      const goalParam = userGoal ? `&userGoal=${encodeURIComponent(userGoal)}` : '';
      
      let lessonParam = '';
      try {
        const rawLesson = localStorage.getItem('voyager_current_guided_lesson');
        if (rawLesson) {
          const parsed = JSON.parse(rawLesson);
          if (parsed && parsed.title) {
            lessonParam = `&lessonTitle=${encodeURIComponent(parsed.title)}&lessonId=${encodeURIComponent(parsed.id || '')}&lessonLevel=${encodeURIComponent(parsed.level || '')}&lessonObjective=${encodeURIComponent(parsed.objective || '')}&lessonInstructions=${encodeURIComponent(parsed.instructions || '')}`;
          }
        }
      } catch (e) {}

      let planParam = '';
      try {
        const studentId = auth.currentUser?.uid || 'STU-001';
        const rawPlan = localStorage.getItem(`voyager_student_study_plan_${studentId}`);
        if (rawPlan) {
          const parsedPlan = JSON.parse(rawPlan);
          if (parsedPlan?.primaryFocus) {
            const reviewWords = (parsedPlan.vocabularyReviewList || []).slice(0, 5).join(',');
            planParam = `&planFocus=${encodeURIComponent(parsedPlan.primaryFocus)}&reviewWords=${encodeURIComponent(reviewWords)}`;
          }
        }
      } catch (e) {}

      let simParam = '';
      try {
        const rawSim = localStorage.getItem('voyager_active_simulation_session');
        if (rawSim) {
          const parsedSim = JSON.parse(rawSim);
          if (parsedSim && parsedSim.title && parsedSim.status === 'ACTIVE') {
            simParam = `&simType=${encodeURIComponent(parsedSim.type)}&simId=${encodeURIComponent(parsedSim.scenarioId)}&simTitle=${encodeURIComponent(parsedSim.title)}&simLevel=${encodeURIComponent(parsedSim.cefrLevel)}&simStep=${parsedSim.currentCheckpointIndex + 1}&simTotal=${parsedSim.totalCheckpoints}`;
          }
        }
      } catch (e) {}

      const wsUrl = `${protocol}//${window.location.host}/api/live?lang=${activeLang}${nameParam}${emailParam}${levelParam}${goalParam}${lessonParam}${planParam}${simParam}`;
      const ws = new WebSocket(wsUrl);
      wsRef.current = ws;

      ws.onopen = async () => {
        setIsConnected(true);
        setStatusText('Connected');
        setIsPaused(false);
        isPausedRef.current = false;
        console.log('WebSocket connection to server established');
        
        onOpenRef.current();
        if (captureRef.current) {
          await captureRef.current.resume();
        }
      };

      ws.onmessage = async (event) => {
        try {
          vadRef.current.recordActivity();
          const msg = JSON.parse(event.data);
          
          // Relay all specific custom server payloads up
          onMessageReceivedRef.current(msg);

          if (msg.status === 'connected') {
            setIsSessionActive(true);
            isSessionActiveRef.current = true;
            console.log('Gemini session active on backend. Mapping mode instructions via ConversationModePolicy.');
            if (msg.reconnected) {
              console.log('Seamless reconnection complete. Session active.');
              return;
            }
            
            // Map state variables back to a typed Mode for ConversationModePolicy
            const currentMode = isAdaptiveMode ? 'ADAPTIVE'
                              : isBilingualMode ? 'BILINGUAL'
                              : isTranslateMode ? 'LIVE_TRANSLATOR'
                              : isListenOnly ? 'LISTEN_ONLY'
                              : isSpanishOnlyMode ? 'SPANISH'
                              : isEnglishOnlyMode ? 'AMERICAN_ENGLISH'
                              : 'ADAPTIVE';

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
                  let screenIdx = 1;
                  let totalQs = ALL_CIVICS_128_QUESTIONS.length;
                  let activeSubTab: 'guide' | 'bilingual' | 'english' | 'exam' = 'bilingual';
                  try {
                    const rawIdx = localStorage.getItem('voyager_civics_flashcard_index');
                    if (rawIdx !== null) savedIdx = parseInt(rawIdx, 10) || 0;
                    const rawScreenIdx = localStorage.getItem('voyager_civics_card_screen_index');
                    if (rawScreenIdx !== null) screenIdx = parseInt(rawScreenIdx, 10) || (savedIdx + 1);
                    const rawTotal = localStorage.getItem('voyager_civics_card_total_questions');
                    if (rawTotal !== null) totalQs = parseInt(rawTotal, 10) || ALL_CIVICS_128_QUESTIONS.length;
                    const rawSub = localStorage.getItem('voyager_last_active_subtab') as any;
                    if (rawSub) activeSubTab = rawSub;
                  } catch (e) {}

                  const activeQ = ALL_CIVICS_128_QUESTIONS.find(q => q.id === (savedIdx + 1)) || ALL_CIVICS_128_QUESTIONS[savedIdx % ALL_CIVICS_128_QUESTIONS.length];
                  greetingPrompt += '\n\n' + ConversationModePolicy.getCivicsSystemInstructions(selectedLang, activeSubTab, activeQ ? {
                    id: activeQ.id,
                    questionEn: activeQ.questionEn,
                    questionEs: activeQ.questionEs,
                    indexOnScreen: screenIdx,
                    totalQuestions: totalQs
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

              let activeLessonData = null;
              try {
                const rawLesson = localStorage.getItem('voyager_current_guided_lesson');
                if (rawLesson) {
                  activeLessonData = JSON.parse(rawLesson);
                }
              } catch (e) {}

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
                  activeTab,
                  activeLesson: activeLessonData
                });

                if (activeTab === 'civics') {
                  let savedIdx = 0;
                  let screenIdx = 1;
                  let totalQs = ALL_CIVICS_128_QUESTIONS.length;
                  let activeSubTab: 'guide' | 'bilingual' | 'english' | 'exam' = 'bilingual';
                  try {
                    const rawIdx = localStorage.getItem('voyager_civics_flashcard_index');
                    if (rawIdx !== null) savedIdx = parseInt(rawIdx, 10) || 0;
                    const rawScreenIdx = localStorage.getItem('voyager_civics_card_screen_index');
                    if (rawScreenIdx !== null) screenIdx = parseInt(rawScreenIdx, 10) || (savedIdx + 1);
                    const rawTotal = localStorage.getItem('voyager_civics_card_total_questions');
                    if (rawTotal !== null) totalQs = parseInt(rawTotal, 10) || ALL_CIVICS_128_QUESTIONS.length;
                    const rawSub = localStorage.getItem('voyager_last_active_subtab') as any;
                    if (rawSub) activeSubTab = rawSub;
                  } catch (e) {}

                  const activeQ = ALL_CIVICS_128_QUESTIONS.find(q => q.id === (savedIdx + 1)) || ALL_CIVICS_128_QUESTIONS[savedIdx % ALL_CIVICS_128_QUESTIONS.length];
                  greetingPrompt += '\n\n' + ConversationModePolicy.getCivicsSystemInstructions(selectedLang, activeSubTab, activeQ ? {
                    id: activeQ.id,
                    questionEn: activeQ.questionEn,
                    questionEs: activeQ.questionEs,
                    indexOnScreen: screenIdx,
                    totalQuestions: totalQs
                  } : undefined);
                }

                if (memory) {
                  greetingPrompt += memory.getMemoryPayloadForPrompt();
                }

                if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
                  wsRef.current.send(JSON.stringify({ text: greetingPrompt }));
                }
              } else {
                const isLessonsTab = activeTab === 'lessons';
                const welcomeSpeech = isLessonsTab
                  ? (selectedLang === 'EN'
                      ? "Welcome to your Lesson Index! Here you can explore your lessons and learning materials. If you need any help, just ask me."
                      : "¡Te doy la bienvenida a tu Índice de lecciones! Aquí puedes explorar tus clases y materiales de aprendizaje. Si necesitas algo, solo pregúntame.")
                  : activeLessonData && activeLessonData.title
                  ? (selectedLang === 'EN'
                      ? `Welcome! I am USA Voyager, your American English tutor. We are working on your lesson: "${activeLessonData.title}". Let's begin!`
                      : `¡Bienvenidos! Yo soy USA Voyager, tu tutor de Inglés Americano. Estamos trabajando en tu lección: "${activeLessonData.title}". ¡Vamos a comenzar!`)
                  : (selectedLang === 'EN'
                      ? "Welcome! I am USA Voyager, your American English tutor. How can I help you today?"
                      : "¡Bienvenido! Yo soy USA Voyager, tu tutor de Inglés Americano. ¿En qué te puedo ayudar hoy?");
                const welcomePrompt = isLessonsTab
                  ? `[INSTRUCCIÓN CRÍTICA DE SISTEMA — ASISTENTE CONTEXTUAL VOYAGER:
El usuario ha ingresado al ÍNDICE DE LECCIONES (Lesson Index).
Tu rol es de asistente de ayuda contextual, NO de profesor de inglés. NO enseñes inglés por defecto ni propongas ejercicios.
Pronuncia en voz alta con tu voz natural de Voyager la siguiente bienvenida: "${welcomeSpeech}". Luego guarda completo silencio hasta que el estudiante te pregunte algo.]`
                  : activeLessonData && activeLessonData.title
                  ? `[INSTRUCCIÓN DE SISTEMA MANDATORIA: Saluda al estudiante en voz alta diciendo: "${welcomeSpeech}". Conduce la lección "${activeLessonData.title}", explica brevemente el objetivo y formula la primera pregunta o ejercicio de práctica. NO preguntes de qué le gustaría hablar.]`
                  : `[INSTRUCCIÓN DE SISTEMA MANDATORIA: Preséntate y saluda al usuario en voz alta con tu voz natural de Voyager diciendo: "${welcomeSpeech}". Luego escucha atentamente la respuesta del usuario y conversa naturalmente en voz alta.]`;

                if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
                  wsRef.current.send(JSON.stringify({ text: welcomePrompt }));
                }
              }
            }
            return;
          }
          
          if (msg.sessionEnded) {
            console.log('Session ended gracefully by server:', msg.info);
            if (msg.isQuotaNotice || (msg.info && (msg.info.includes('spending cap') || msg.info.includes('límite de gasto')))) {
              const quotaNotice = msg.info || (selectedLang === 'EN'
                ? 'Gemini API monthly spending cap reached. Voice session paused.'
                : 'Se ha alcanzado el límite de gasto mensual de Gemini API. Sesión de voz pausada.');
              setError(quotaNotice);
              if (onErrorRef.current) onErrorRef.current(quotaNotice);
              setStatusText(selectedLang === 'EN' ? 'Quota Exceeded' : 'Límite de Cuota');
            }
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
             const isQuotaOrSpendCap = msg.isQuotaError || (typeof msg.error === 'string' && (
               msg.error.includes("spending cap") ||
               msg.error.includes("límite de gasto") ||
               msg.error.includes("cuota") ||
               msg.error.includes("RESOURCE_EXHAUSTED")
             ));
             if (isQuotaOrSpendCap) {
               console.warn('Voice session quota notice:', msg.error);
               const quotaErrText = typeof msg.error === 'string' ? msg.error : (
                 selectedLang === 'EN'
                   ? 'Gemini API monthly spending cap reached. Manage API quota at https://ai.studio/spend.'
                   : 'Se ha alcanzado el límite de gasto mensual de Gemini API. Administra tu cuota en https://ai.studio/spend.'
               );
               setError(quotaErrText);
               if (onErrorRef.current) onErrorRef.current(quotaErrText);
               setStatusText(selectedLang === 'EN' ? 'Quota Exceeded' : 'Límite de Cuota');
               disconnect();
               return;
             }
             console.warn('Server session notice:', msg.error);
             const errText = typeof msg.error === 'string' ? msg.error : JSON.stringify(msg.error);
             setError(errText);
             if (onErrorRef.current) onErrorRef.current(errText);
             disconnect();
             return;
          }

          if (msg.userTranscription && !isPausedRef.current) {
            console.log('[Client Session] User transcription received from server:', msg.userTranscription);
            setLastUserTranscriptionState(msg.userTranscription);
            onUserTranscriptionRef.current(msg.userTranscription);
          }

          if (msg.text && !isPausedRef.current) {
            console.log('[Client Session] Text response received from server:', msg.text);
            setLastModelResponseState(msg.text);
            onTextResponseRef.current(msg.text, !!msg.showForm);
          }

          if (msg.audio && !isListenOnlyRef.current && !isPausedRef.current) {
            setChunksReceived(prev => prev + 1);
            if (!playbackRef.current) {
              playbackRef.current = new AudioPlayback();
              playbackRef.current.init();
            }
            console.log('[Client Session] Playing raw PCM audio chunk (len:', msg.audio.length, ')');
            playbackRef.current.playRawPCM(msg.audio);
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
         console.warn('WebSocket notification:', err);
         disconnect();
      };

    } catch (err: any) {
        console.warn('Connection notice:', err);
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
    // Freeze timestamp accumulation cleanly
    if (lastActiveStartTimestampRef.current) {
      activeAccumulatedMsRef.current += (Date.now() - lastActiveStartTimestampRef.current);
      lastActiveStartTimestampRef.current = null;
    }
    setSecondsElapsed(Math.floor(activeAccumulatedMsRef.current / 1000));

    setIsPaused(true);
    isPausedRef.current = true;
    isAnnouncingPauseRef.current = false;
    if (announcementTimerRef.current) {
      clearTimeout(announcementTimerRef.current);
      announcementTimerRef.current = null;
    }
    setVolume(0);
    if (captureRef.current) {
      captureRef.current.pause();
    }
    if (playbackRef.current) {
      playbackRef.current.stop();
    }
    if (typeof window !== 'undefined' && window.speechSynthesis) {
      window.speechSynthesis.cancel();
    }
    playStateSwitchBing('pause');
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      try {
        wsRef.current.send(JSON.stringify({ pause: true }));
      } catch (e) {}
    }
  }, []);

  const resume = useCallback(() => {
    setIsPaused(false);
    isPausedRef.current = false;
    isAnnouncingPauseRef.current = false;
    lastActiveStartTimestampRef.current = Date.now();
    if (announcementTimerRef.current) {
      clearTimeout(announcementTimerRef.current);
      announcementTimerRef.current = null;
    }
    if (captureRef.current) {
      captureRef.current.resume();
    }
    if (playbackRef.current) {
      playbackRef.current.init();
    }
    vadRef.current.recordActivity();
    if (typeof window !== 'undefined' && window.speechSynthesis && window.speechSynthesis.paused) {
      window.speechSynthesis.resume();
    }
    playStateSwitchBing('resume');
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      try {
        wsRef.current.send(JSON.stringify({ resume: true }));
      } catch (e) {}
    }
  }, []);

  // Inactivity auto-pause with 30s threshold and exact idle time exclusion
  useEffect(() => {
    if (!isConnected && !activeGuidedLesson) return;

    const interval = setInterval(() => {
      // Safeguards:
      // 1. Never interrupt if model is currently speaking (TTS or live playback chunks)
      const isModelSpeaking = (typeof playbackRef.current?.isPlaying === 'function' && playbackRef.current.isPlaying()) || Boolean(isSpeakingOrTtsActive);
      // 2. Never interrupt if student is actively speaking into microphone
      const isStudentSpeaking = volume > 0.05 || (typeof captureRef.current?.isActive === 'function' && captureRef.current.isActive() && typeof vadRef.current?.isSpeaking === 'function' && vadRef.current.isSpeaking());
      // 3. Never interrupt if student is actively typing or writing in chat
      const isStudentTyping = Boolean(isUserTyping);

      if (isModelSpeaking || isStudentSpeaking || isStudentTyping) {
        lastGenuineActivityTimestampRef.current = Date.now();
        vadRef.current.recordActivity();
        return;
      }

      if (isPausedRef.current || isTimerPausedRef.current) {
        return;
      }

      const inactiveMs = Date.now() - (lastGenuineActivityTimestampRef.current || Date.now());
      if (inactiveMs >= 30000) {
        if (!isTimerPausedRef.current) {
          // Pause learning timer and exclude the 30-second inactive interval
          pauseTimer(true);
          if (onAutoPause) onAutoPause('inactivity');
        }
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [isConnected, activeGuidedLesson, isSpeakingOrTtsActive, isUserTyping, volume, pauseTimer, onAutoPause]);

  return {
    isConnected,
    isSessionActive,
    statusText,
    error,
    isPaused,
    isTimerPaused,
    secondsElapsed,
    setSecondsElapsed: setSecondsElapsedWithSync,
    volume,
    framesSent,
    chunksReceived,
    lastUserTranscription: lastUserTranscriptionState,
    lastModelResponse: lastModelResponseState,
    connect,
    disconnect,
    sendText,
    pause,
    resume,
    pauseTimer,
    resumeTimer,
    recordGenuineActivity,
    recordInteraction,
    wsRef
  };
}

export default useConversationSession;
