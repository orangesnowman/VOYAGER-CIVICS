import React, { useState, useEffect } from 'react';
import { Award, BookOpen, Star, RefreshCw, BarChart2, AlertCircle, Mail, MapPin, Target, Edit3, UserCheck, Bookmark, Trash2, ChevronDown, ChevronUp, MessageSquare, CheckCircle2, TrendingUp, Sparkles, Compass, Clock, ArrowRight } from 'lucide-react';
import { auth } from '../services/firebaseAuth';
import { saveSavedChatsToFirestore } from '../services/userProfileService';
import { ActivityCalendar } from './ActivityCalendar';
import { getStoredLessonAttempts, LessonEvaluationRecord } from '../domain/LessonGradingSystem';
import { vocabularyTracker } from '../domain/VocabularyTracker';
import { studyPlanEngine, PersonalizedStudyPlan, StudyPlanActivity } from '../domain/StudyPlanEngine';
import { simulationScenariosEngine } from '../domain/SimulationScenariosEngine';

interface SavedChatSession {
  id: string;
  date: string;
  title: string;
  durationSeconds: number;
  messageCount: number;
  snippet: string;
  messages: { sender: string; text: string; timestamp?: Date | string }[];
}

interface ProgressDashboardProps {
  selectedLang: 'EN' | 'ES';
  scores: {
    grammar: number;
    pronunciation: number;
    confidence: number;
    naturalness: number;
  };
  learnedWords: string[];
  accentPatterns: string[];
  onAskVoyager: (text: string) => void;
  userProfile?: {
    name?: string;
    email?: string;
    age?: string | number;
    country?: string;
    goal?: string;
    level?: string;
  };
  onEditProfile?: () => void;
  onLoadChat?: (chat: SavedChatSession) => void;
  onNewChat?: () => void;
  onNavigateTab?: (tab: string) => void;
}

export const ProgressDashboard: React.FC<ProgressDashboardProps> = ({
  selectedLang,
  scores,
  learnedWords,
  accentPatterns,
  onAskVoyager,
  userProfile,
  onEditProfile,
  onLoadChat,
  onNewChat,
  onNavigateTab,
}) => {
  // Retrieve saved account if not provided via props
  const savedAccount = React.useMemo(() => {
    const isLoggedIn = Boolean(auth.currentUser);
    const defaultName = isLoggedIn 
      ? (auth.currentUser?.displayName || (selectedLang === 'EN' ? 'Learner' : 'Estudiante'))
      : (selectedLang === 'EN' ? 'Guest Learner' : 'Estudiante Invitado');
    const defaultEmail = isLoggedIn 
      ? (auth.currentUser?.email || '')
      : (selectedLang === 'EN' ? 'Not signed in' : 'Sin iniciar sesión');

    if (userProfile?.name || userProfile?.email) {
      return {
        name: userProfile.name || defaultName,
        email: userProfile.email || defaultEmail,
        age: userProfile.age || '',
        country: userProfile.country || (selectedLang === 'EN' ? 'Not specified' : 'No especificado'),
        goal: userProfile.goal || (selectedLang === 'EN' ? 'Travel & Conversation' : 'Viaje y Conversación'),
        levelEstimate: userProfile.level || 'Intermediate'
      };
    }
    const saved = typeof window !== 'undefined' ? localStorage.getItem('voyager_user_account') : null;
    if (saved && isLoggedIn) {
      try {
        const parsed = JSON.parse(saved);
        return {
          name: parsed.name || defaultName,
          email: parsed.email || defaultEmail,
          age: parsed.age || '',
          country: parsed.country || (selectedLang === 'EN' ? 'Not specified' : 'No especificado'),
          goal: parsed.goal || (selectedLang === 'EN' ? 'Travel & Conversation' : 'Viaje y Conversación'),
          levelEstimate: parsed.levelEstimate || 'Intermediate'
        };
      } catch (e) {}
    }
    return {
      name: defaultName,
      email: defaultEmail,
      age: '',
      country: selectedLang === 'EN' ? 'Not specified' : 'No especificado',
      goal: selectedLang === 'EN' ? 'Travel & Conversation' : 'Viaje y Conversación',
      levelEstimate: 'Intermediate'
    };
  }, [userProfile, selectedLang]);

  const visitorFullName = React.useMemo(() => {
    if (savedAccount.name && savedAccount.name !== 'Estudiante' && savedAccount.name !== 'Learner') {
      const name = savedAccount.name.trim();
      if (name && name !== 'Estudiante' && name !== 'Learner') return name;
    }
    return '';
  }, [savedAccount.name]);

  const [savedChats, setSavedChats] = useState<SavedChatSession[]>([]);
  const [expandedChatId, setExpandedChatId] = useState<string | null>(null);
  const [evalAttempts, setEvalAttempts] = useState<LessonEvaluationRecord[]>(() => getStoredLessonAttempts());
  const [vocabSummary, setVocabSummary] = useState(() => vocabularyTracker.getProgressSummary());
  const [studyPlan, setStudyPlan] = useState<PersonalizedStudyPlan>(() => {
    const studentId = auth.currentUser?.uid || 'STU-001';
    return studyPlanEngine.getOrGeneratePlan(
      studentId,
      selectedLang,
      savedAccount.levelEstimate || 'B1',
      savedAccount.goal,
      scores
    );
  });

  useEffect(() => {
    try {
      const saved = localStorage.getItem('voyager_saved_chats');
      if (saved) {
        setSavedChats(JSON.parse(saved));
      }
    } catch (e) {}

    const handleUpdates = () => {
      setEvalAttempts(getStoredLessonAttempts());
      setVocabSummary(vocabularyTracker.getProgressSummary());
    };

    const handlePlanUpdate = (e: any) => {
      if (e?.detail) {
        setStudyPlan(e.detail);
      } else {
        const studentId = auth.currentUser?.uid || 'STU-001';
        setStudyPlan(studyPlanEngine.getOrGeneratePlan(studentId, selectedLang, savedAccount.levelEstimate, savedAccount.goal, scores));
      }
    };

    window.addEventListener('voyager_lesson_attempts_updated', handleUpdates);
    window.addEventListener('voyager_vocabulary_updated', handleUpdates);
    window.addEventListener('voyager_study_plan_updated', handlePlanUpdate);

    return () => {
      window.removeEventListener('voyager_lesson_attempts_updated', handleUpdates);
      window.removeEventListener('voyager_vocabulary_updated', handleUpdates);
      window.removeEventListener('voyager_study_plan_updated', handlePlanUpdate);
    };
  }, [selectedLang, savedAccount, scores]);

  const handleStartActivity = (activity: StudyPlanActivity) => {
    const studentId = auth.currentUser?.uid || 'STU-001';
    studyPlanEngine.updateActivityStatus(studentId, activity.id, 'IN_PROGRESS');
    
    // Store active guided lesson for Gemini Live WebSocket session
    const guidedData = {
      id: activity.lessonId,
      title: activity.title,
      level: activity.cefrLevel,
      objective: activity.objective,
      instructions: activity.subtitle
    };
    try {
      localStorage.setItem('voyager_current_guided_lesson', JSON.stringify(guidedData));
    } catch (e) {}

    const promptText = selectedLang === 'EN'
      ? `[AUTO_SYSTEM: The student initiated study plan lesson: "${activity.title}" (CEFR: ${activity.cefrLevel}). Primary objective: "${activity.objective}". Greet them by acknowledging this lesson and begin the first interactive exercise directly.]`
      : `[AUTO_SYSTEM: El estudiante inició la lección de su plan de estudio: "${activity.title}" (CEFR: ${activity.cefrLevel}). Objetivo principal: "${activity.objective}". Salúdalo reconociendo esta lección e inicia el primer ejercicio interactivo directamente.]`;
    
    onAskVoyager(promptText);
  };

  const handleRegeneratePlan = () => {
    const studentId = auth.currentUser?.uid || 'STU-001';
    const refreshed = studyPlanEngine.generatePlan(
      studentId,
      selectedLang,
      savedAccount.levelEstimate || 'B1',
      savedAccount.goal,
      scores
    );
    setStudyPlan(refreshed);
  };

  const handleDeleteSavedChat = (idToDelete: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const updated = savedChats.filter(c => c.id !== idToDelete);
    setSavedChats(updated);
    try {
      localStorage.setItem('voyager_saved_chats', JSON.stringify(updated));
      const uid = auth.currentUser?.uid;
      if (uid) {
        saveSavedChatsToFirestore(uid, updated);
      }
    } catch (e) {}
  };

  const scoreMetrics = [
    { key: 'grammar', name: selectedLang === 'EN' ? 'Grammar' : 'Gramática', val: scores.grammar },
    { key: 'pronunciation', name: selectedLang === 'EN' ? 'Pronunciation' : 'Pronunciación', val: scores.pronunciation },
    { key: 'confidence', name: selectedLang === 'EN' ? 'Confidence' : 'Confianza', val: scores.confidence },
    { key: 'naturalness', name: selectedLang === 'EN' ? 'Naturalness' : 'Naturalidad', val: scores.naturalness }
  ];

  const getMetricRatingStars = (rating: number) => {
    return (
      <div className="flex gap-0.5 text-yellow-500">
        {[1, 2, 3, 4, 5].map((s) => (
          <Star 
            key={s} 
            className={`w-3.5 h-3.5 ${s <= rating ? 'fill-yellow-500 text-yellow-500' : 'text-neutral-600'}`} 
          />
        ))}
      </div>
    );
  };

  return (
    <div className="w-full h-full flex flex-col bg-black/85 border border-white/10 rounded-2xl p-4 font-sans text-white overflow-hidden max-h-[500px]">
      
      {/* Title Header */}
      <div className="flex justify-between items-center border-b border-white/10 pb-2.5 mb-3">
        <span className="text-[10px] font-mono font-bold tracking-widest text-yellow-400 uppercase flex items-center gap-1">
          <UserCheck className="w-3.5 h-3.5 text-yellow-500" />
          {visitorFullName 
            ? (selectedLang === 'EN' ? `${visitorFullName.toUpperCase()}'S PROFILE & PROGRESS` : `PERFIL DE ${visitorFullName.toUpperCase()} Y PROGRESO`) 
            : (selectedLang === 'EN' ? 'USER PROFILE & PROGRESS' : 'PERFIL DE USUARIO Y PROGRESO')}
        </span>
        <span className="text-[9px] font-mono text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20 flex items-center gap-1">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
          {selectedLang === 'EN' ? 'LIVE DATA' : 'DATOS EN VIVO'}
        </span>
      </div>

      {/* Main Container */}
      <div className="flex-1 overflow-y-auto pr-1 space-y-4 max-h-[420px]">
        
        {/* Dynamic User Contact Profile Card */}
        <div className="bg-gradient-to-r from-red-950/60 via-zinc-900 to-black/80 border border-red-500/30 rounded-xl p-3.5 space-y-3 relative overflow-hidden shadow-md">
          <div className="flex items-center justify-between border-b border-white/10 pb-2">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-full bg-red-600 text-white flex items-center justify-center font-bold text-sm uppercase shadow-sm border border-white/20">
                {savedAccount.name ? savedAccount.name.charAt(0) : 'U'}
              </div>
              <div>
                <div className="text-xs font-black tracking-wide text-white uppercase flex items-center gap-2 font-sans">
                  <span>{savedAccount.name}</span>
                  <span className="inline-flex items-center px-1.5 py-0.5 rounded-full text-[8px] font-mono bg-red-500/20 text-red-300 border border-red-500/30">
                    {savedAccount.levelEstimate}
                  </span>
                </div>
                <div className="text-[10px] text-zinc-300 font-mono flex items-center gap-2 mt-0.5">
                  {savedAccount.email && (
                    <span className="flex items-center gap-1">
                      <Mail className="w-2.5 h-2.5 text-red-400" />
                      {savedAccount.email}
                    </span>
                  )}
                </div>
              </div>
            </div>
            {onEditProfile && (
              <button 
                onClick={onEditProfile}
                className="px-2.5 py-1 rounded-lg bg-white/10 hover:bg-white/20 text-white border border-white/20 text-[9px] font-mono font-bold uppercase transition-all flex items-center gap-1 cursor-pointer active:scale-95"
                title={selectedLang === 'EN' ? 'Edit Profile & Contact' : 'Editar Perfil y Contacto'}
              >
                <Edit3 className="w-2.5 h-2.5 text-red-400" />
                <span>{selectedLang === 'EN' ? 'Edit' : 'Editar'}</span>
              </button>
            )}
          </div>

          <div className="grid grid-cols-2 gap-2 text-[10px] font-sans">
            <div className="bg-black/50 p-2 rounded-lg border border-white/10 flex flex-col justify-center">
              <span className="text-[8.5px] font-mono uppercase text-zinc-400 flex items-center gap-1">
                <Target className="w-2.5 h-2.5 text-yellow-400" />
                {selectedLang === 'EN' ? 'Learning Goal' : 'Objetivo Principal'}
              </span>
              <span className="font-bold text-white truncate mt-0.5 text-[10.5px]">
                {savedAccount.goal}
              </span>
            </div>

            <div className="bg-black/50 p-2 rounded-lg border border-white/10 flex flex-col justify-center">
              <span className="text-[8.5px] font-mono uppercase text-zinc-400 flex items-center gap-1">
                <MapPin className="w-2.5 h-2.5 text-red-400" />
                {selectedLang === 'EN' ? 'Country & Age' : 'País y Edad'}
              </span>
              <span className="font-bold text-white truncate mt-0.5 text-[10.5px]">
                {savedAccount.country} {savedAccount.age ? `(${savedAccount.age} ${selectedLang === 'EN' ? 'yrs' : 'años'})` : ''}
              </span>
            </div>
          </div>
        </div>

        {/* Learning Assessment Dimensions Meter Section */}
        <div className="bg-white/5 border border-white/10 rounded-xl p-3 space-y-3">
          <div className="flex items-center justify-between border-b border-white/10 pb-1.5">
            <span className="block text-[9px] font-mono font-bold tracking-widest text-neutral-300 uppercase">
              📊 {selectedLang === 'EN' ? 'LEARNING ASSESSMENT DIMENSIONS' : 'DIMENSIONES DE EVALUACIÓN DEL APRENDIZAJE'}
            </span>
            <span className="text-[8px] font-mono text-zinc-400 bg-white/5 px-2 py-0.5 rounded border border-white/10" title={selectedLang === 'EN' ? 'Distinguishes measured evidence from observational indicators' : 'Distingue evidencia oral de indicadores observacionales'}>
              {selectedLang === 'EN' ? 'EVIDENCE-BASED' : 'BASADO EN EVIDENCIA'}
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-0.5">
            {(() => {
              const radius = 28;
              const strokeWidth = 8;
              const circumference = 2 * Math.PI * radius; // ~175.9

              const getPct = (val?: number, fallback: number = 80) => {
                if (val === undefined || val === null || val <= 0) return fallback;
                if (val <= 5) return Math.min(100, Math.round(val * 20));
                return Math.min(100, Math.round(val));
              };

              const metricSupportRuleEn = 'IMPORTANT VOYAGER MANDATE FOR INTERACTIVE GRAPH ANALYSIS: As Voyager, when the user clicks this graph or metric, you MUST analyze and explain in natural dynamic language: 1) What this dimension represents, 2) What the user\'s current score means, 3) Why this metric matters for their real-world American English communication, and 4) What key conclusion or actionable recommendation can be drawn. Do not invent phoneme-level accuracy scores. Confidence is an observational indicator.';
              const metricSupportRuleEs = 'REGLA Y MANDATO OBLIGATORIO DE VOYAGER PARA ANÁLISIS DE GRÁFICAS: Como Voyager, cuando el usuario hace clic en esta métrica, DEBES explicar y analizar en lenguaje natural y dinámico: 1) Qué representa esta dimensión, 2) Qué significa su puntuación actual, 3) Por qué importa para su comunicación real en inglés americano, y 4) Qué conclusión o recomendación clave se puede sacar. No inventes puntuaciones fonémicas no verificables. La confianza es un indicador observacional.';

              const items = [
                {
                  title: selectedLang === 'EN' ? 'Pronunciation' : 'Pronunciación',
                  pct: getPct(scores.pronunciation, 84),
                  sub: selectedLang === 'EN' ? 'Speech Clarity' : 'Claridad Oral',
                  prompt: selectedLang === 'EN'
                    ? `[AUTO_SYSTEM: The user clicked on their Pronunciation assessment metric (${getPct(scores.pronunciation, 84)}%). Explain how speech clarity is evaluated, how difficult sounds are corrected in context, and how to practice American English pronunciation. ${metricSupportRuleEn}]`
                    : `[AUTO_SYSTEM: El usuario hizo clic en su métrica de Pronunciación (${getPct(scores.pronunciation, 84)}%). Explica cómo se evalúa la claridad al hablar, cómo corregir sonidos difíciles en contexto y cómo practicar la pronunciación americana. ${metricSupportRuleEs}]`
                },
                {
                  title: selectedLang === 'EN' ? 'Fluency' : 'Fluidez',
                  pct: getPct(scores.naturalness || (scores as any).fluency, 80),
                  sub: selectedLang === 'EN' ? 'Speech Continuity' : 'Continuidad Oral',
                  prompt: selectedLang === 'EN'
                    ? `[AUTO_SYSTEM: The user clicked on their Fluency assessment metric (${getPct(scores.naturalness || (scores as any).fluency, 80)}%). Explain how conversational continuity, pacing, hesitation patterns, and sentence construction are evaluated. ${metricSupportRuleEn}]`
                    : `[AUTO_SYSTEM: El usuario hizo clic en su métrica de Fluidez (${getPct(scores.naturalness || (scores as any).fluency, 80)}%). Explica cómo se evalúa la continuidad del habla, el ritmo de respuesta y la fluidez conversacional. ${metricSupportRuleEs}]`
                },
                {
                  title: selectedLang === 'EN' ? 'Vocabulary' : 'Vocabulario',
                  pct: getPct((scores as any).vocabulary || scores.grammar, 86),
                  sub: selectedLang === 'EN' ? 'Contextual Mastery' : 'Dominio Contextual',
                  prompt: selectedLang === 'EN'
                    ? `[AUTO_SYSTEM: The user clicked on their Vocabulary assessment metric (${getPct((scores as any).vocabulary || scores.grammar, 86)}%). Explain how active vocabulary retention and contextual usage differ from mere exposure to words. ${metricSupportRuleEn}]`
                    : `[AUTO_SYSTEM: El usuario hizo clic en su métrica de Vocabulario (${getPct((scores as any).vocabulary || scores.grammar, 86)}%). Explica por qué el vocabulario requiere uso contextual repetido y cómo retener palabras activamente. ${metricSupportRuleEs}]`
                },
                {
                  title: selectedLang === 'EN' ? 'Confidence' : 'Confianza',
                  pct: getPct(scores.confidence, 75),
                  sub: selectedLang === 'EN' ? 'Observational' : 'Observacional',
                  prompt: selectedLang === 'EN'
                    ? `[AUTO_SYSTEM: The user clicked on their Confidence observational indicator (${getPct(scores.confidence, 75)}%). Explain that speaking confidence is a qualitative observational indicator based on conversational readiness, not an objective psychological score. ${metricSupportRuleEn}]`
                    : `[AUTO_SYSTEM: El usuario hizo clic en su indicador de Confianza (${getPct(scores.confidence, 75)}%). Explica que este es un indicador cualitativo u observacional basado en la disposición para conversar, no un test psicológico. ${metricSupportRuleEs}]`
                }
              ];

              return items.map((item, idx) => {
                const strokeDashoffset = circumference - (item.pct / 100) * circumference;

                return (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => onAskVoyager(item.prompt)}
                    className="flex flex-col items-center text-center bg-black/30 p-2.5 rounded-xl border border-white/10 hover:scale-105 transition-all duration-200 cursor-pointer group focus:outline-none"
                    title={selectedLang === 'EN' ? `Click to ask Voyager about ${item.title}` : `Haz clic para que Voyager te explique ${item.title}`}
                  >
                    <div className="relative w-16 h-16 flex items-center justify-center my-0.5">
                      <svg viewBox="0 0 80 80" className="w-full h-full -rotate-90 transform group-hover:scale-110 transition-all duration-300">
                        <circle
                          cx="40"
                          cy="40"
                          r={radius}
                          fill="transparent"
                          stroke="#333333"
                          strokeWidth={strokeWidth}
                        />
                        <circle
                          cx="40"
                          cy="40"
                          r={radius}
                          fill="transparent"
                          stroke="#FACC15"
                          strokeWidth={strokeWidth}
                          strokeDasharray={circumference}
                          strokeDashoffset={strokeDashoffset}
                          strokeLinecap="butt"
                          className="transition-all duration-700 ease-out group-hover:stroke-amber-300"
                        />
                      </svg>
                      <span className="absolute inset-0 flex items-center justify-center text-xs font-mono font-black text-white group-hover:scale-110 group-hover:text-amber-400 transition-all">
                        {item.pct}%
                      </span>
                    </div>
                    <span className="text-[10px] font-bold text-neutral-200 mt-1 font-mono group-hover:text-amber-300 transition-colors">{item.title}</span>
                    <span className="text-[8px] text-neutral-400 font-mono">{item.sub}</span>
                  </button>
                );
              });
            })()}
          </div>

          {/* Real Evaluated Lessons History (Only when sufficient real data exists) */}
          <div className="pt-2 border-t border-white/10 text-left">
            <span className="block text-[9px] font-mono font-bold tracking-widest text-amber-400 uppercase mb-2 flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <Award className="w-3.5 h-3.5 text-amber-400" />
                {selectedLang === 'EN' ? 'EVALUATION RECORDS & LESSON ATTEMPTS' : 'REGISTRO DE EVALUACIONES Y LECCIONES'}
              </span>
              <span className="text-[8px] text-amber-300 font-bold bg-amber-400/10 px-1.5 py-0.5 rounded border border-amber-400/20">
                {evalAttempts.length} {selectedLang === 'EN' ? 'recorded' : 'registradas'}
              </span>
            </span>

            {evalAttempts.length === 0 ? (
              <div className="bg-black/30 border border-white/5 rounded-xl p-3 text-center text-xs text-neutral-400 italic">
                {selectedLang === 'EN'
                  ? 'No completed lesson evaluations recorded yet. Complete interactive sessions with Voyager to record authentic American Letter Grades (A–F).'
                  : 'Aún no hay evaluaciones de lección registradas. Completa sesiones interactivas con Voyager para registrar Calificaciones con Letra Americana (A–F).'}
              </div>
            ) : (
              <div className="space-y-2">
                {evalAttempts.slice(0, 3).map((attempt) => (
                  <div key={attempt.id} className="bg-black/40 border border-white/10 rounded-xl p-2.5 text-xs text-left">
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <span className={`px-2 py-0.5 rounded text-[11px] font-mono font-black ${
                          attempt.passed ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' : 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                        }`}>
                          {attempt.letterGrade} ({attempt.numericalScore}%)
                        </span>
                        <span className="font-bold text-white font-sans">{attempt.lessonTitle}</span>
                      </div>
                      <span className="text-[10px] text-zinc-400 font-mono">
                        {new Date(attempt.date).toLocaleDateString()}
                      </span>
                    </div>
                    {attempt.explanation && (
                      <p className="text-[11px] text-zinc-300 mt-1 line-clamp-2 italic">
                        "{attempt.explanation}"
                      </p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* VOYAGER USA — Phase 4 Adaptive Study Plan & Recommendations */}
        <div className="bg-black/40 border border-white/10 rounded-2xl p-3.5 sm:p-4 space-y-3.5 text-left">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-mono font-bold tracking-widest text-amber-400 uppercase flex items-center gap-1.5">
              <Compass className="w-3.5 h-3.5 text-amber-400" />
              {selectedLang === 'EN' ? 'PERSONALIZED STUDY PLAN' : 'PLAN DE ESTUDIO PERSONALIZADO'}
            </span>
            <button
              type="button"
              onClick={handleRegeneratePlan}
              className="flex items-center gap-1 text-[9px] font-mono font-bold text-neutral-300 hover:text-amber-400 bg-white/5 hover:bg-white/10 px-2 py-0.5 rounded border border-white/10 transition-colors"
              title={selectedLang === 'EN' ? 'Recalculate recommendations from latest performance' : 'Recalcular recomendaciones según desempeño reciente'}
            >
              <RefreshCw className="w-2.5 h-2.5" />
              <span>{selectedLang === 'EN' ? 'RECALCULATE' : 'RECALCULAR'}</span>
            </button>
          </div>

          {/* Rationale & Primary Focus Banner */}
          <div className="p-3 bg-white/5 rounded-xl border border-white/10 space-y-1.5">
            <div className="flex items-center justify-between gap-2 flex-wrap">
              <div className="flex items-center gap-1.5">
                <span className="text-[11px] font-bold text-white">
                  {selectedLang === 'EN' ? 'Primary Focus:' : 'Enfoque Principal:'}
                </span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-black bg-amber-500/20 text-amber-300 border border-amber-500/30">
                  {studyPlan.primaryFocus}
                </span>
              </div>
              <span className="text-[10px] font-mono text-zinc-400">
                {selectedLang === 'EN' ? 'Target Level:' : 'Nivel Objetivo:'} <strong className="text-white font-mono">{studyPlan.targetCefrLevel}</strong>
              </span>
            </div>
            <p className="text-[11px] text-zinc-300 leading-relaxed italic">
              "{studyPlan.rationale}"
            </p>
          </div>

          {/* 4-Stage Vocabulary Retention Lifecycle */}
          <div className="p-3 bg-black/50 rounded-xl border border-white/10 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[9px] font-mono font-bold uppercase tracking-wider text-amber-400/90 flex items-center gap-1">
                <BookOpen className="w-3 h-3 text-amber-400" />
                {selectedLang === 'EN' ? 'VOCABULARY RETENTION LIFECYCLE (4 STAGES)' : 'CICLO DE RETENCIÓN DE VOCABULARIO (4 ETAPAS)'}
              </span>
              <span className="text-[8px] text-neutral-400 font-mono">
                {vocabSummary.totalIntroduced} {selectedLang === 'EN' ? 'words tracked' : 'palabras rastreadas'}
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5 text-center">
              <div className="p-2 bg-white/5 rounded-lg border border-white/5">
                <span className="text-[8px] text-zinc-400 block font-mono uppercase">{selectedLang === 'EN' ? 'Introduced' : 'Introducida'}</span>
                <span className="text-sm font-bold font-mono text-zinc-300">{vocabSummary.stageCounts.introduced}</span>
                <span className="text-[7px] text-zinc-500 block">{selectedLang === 'EN' ? 'Lesson Exposure' : 'Expuesta en lección'}</span>
              </div>
              <div className="p-2 bg-white/5 rounded-lg border border-white/5">
                <span className="text-[8px] text-sky-400 block font-mono uppercase">{selectedLang === 'EN' ? 'Practiced' : 'Practicada'}</span>
                <span className="text-sm font-bold font-mono text-sky-300">{vocabSummary.stageCounts.practiced}</span>
                <span className="text-[7px] text-zinc-500 block">{selectedLang === 'EN' ? 'Active Speech' : 'Uso oral activo'}</span>
              </div>
              <div className="p-2 bg-white/5 rounded-lg border border-white/5">
                <span className="text-[8px] text-amber-400 block font-mono uppercase">{selectedLang === 'EN' ? 'Provisional' : 'Provisional'}</span>
                <span className="text-sm font-bold font-mono text-amber-300">{vocabSummary.stageCounts.provisionallyMastered}</span>
                <span className="text-[7px] text-zinc-500 block">{selectedLang === 'EN' ? '2-3 Context Uses' : '2-3 usos contexto'}</span>
              </div>
              <div className="p-2 bg-white/5 rounded-lg border border-white/5">
                <span className="text-[8px] text-emerald-400 block font-mono uppercase">{selectedLang === 'EN' ? 'Retained' : 'Retenida'}</span>
                <span className="text-sm font-bold font-mono text-emerald-300">{vocabSummary.stageCounts.retained}</span>
                <span className="text-[7px] text-zinc-500 block">{selectedLang === 'EN' ? 'Mastered & Solid' : 'Dominio sólido'}</span>
              </div>
            </div>

            {studyPlan.vocabularyReviewList.length > 0 && (
              <div className="pt-1.5 border-t border-white/5">
                <span className="text-[9px] font-semibold text-zinc-400 block mb-1">
                  {selectedLang === 'EN' ? 'Recommended for Contextual Review:' : 'Recomendadas para Repaso en Contexto:'}
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {studyPlan.vocabularyReviewList.map((word, i) => (
                    <button
                      key={i}
                      type="button"
                      onClick={() => onAskVoyager(selectedLang === 'EN' ? `Let's practice using the word "${word}" in a natural sentence.` : `Practiquemos usando la palabra "${word}" en una oración natural.`)}
                      className="px-2 py-0.5 rounded text-[10px] font-mono bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border border-amber-500/20 transition-all cursor-pointer"
                    >
                      {word}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Sequential Recommended Activities */}
          <div className="space-y-2">
            <span className="text-[9px] font-mono font-bold uppercase tracking-wider text-amber-400/90 block">
              {selectedLang === 'EN' ? 'RECOMMENDED STUDY SEQUENCE' : 'SECUENCIA DE ESTUDIO RECOMENDADA'}
            </span>

            <div className="space-y-2">
              {studyPlan.recommendedActivities.map((act, idx) => (
                <div key={act.id} className="p-2.5 bg-black/40 border border-white/10 rounded-xl space-y-1.5 text-xs">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span className="w-5 h-5 rounded-full bg-white/10 flex items-center justify-center text-[10px] font-mono font-bold text-amber-400">
                        {idx + 1}
                      </span>
                      <div>
                        <div className="font-bold text-white font-sans flex items-center gap-1.5">
                          <span>{act.title}</span>
                          <span className="text-[8px] font-mono px-1.5 py-0.2 rounded bg-white/10 text-neutral-300 border border-white/10">
                            {act.cefrLevel}
                          </span>
                        </div>
                        <span className="text-[10px] text-zinc-400 block line-clamp-1">{act.subtitle}</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="text-[9px] font-mono text-zinc-400 flex items-center gap-0.5">
                        <Clock className="w-3 h-3 text-zinc-500" />
                        {act.estimatedMinutes}m
                      </span>

                      {act.status === 'COMPLETED' ? (
                        <span className="px-2 py-0.5 rounded text-[9px] font-mono font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                          {selectedLang === 'EN' ? 'COMPLETED' : 'COMPLETADA'}
                        </span>
                      ) : (
                        <button
                          type="button"
                          onClick={() => handleStartActivity(act)}
                          className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-[10px] font-bold bg-amber-400 hover:bg-amber-300 text-neutral-950 shadow-sm transition-all cursor-pointer font-sans"
                        >
                          <span>{selectedLang === 'EN' ? 'Practice' : 'Practicar'}</span>
                          <ArrowRight className="w-2.5 h-2.5" />
                        </button>
                      )}
                    </div>
                  </div>

                  <div className="text-[10px] text-zinc-400 pl-7 leading-relaxed flex items-center justify-between">
                    <span>{act.reason}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="text-[9px] text-neutral-400 italic text-center pt-1 border-t border-white/5">
            {selectedLang === 'EN'
              ? 'Self-paced study plan. Voyager adapts explanations without unsolicited interruptions.'
              : 'Plan de estudio a tu propio ritmo. Voyager adapta sus explicaciones sin interrupciones no solicitadas.'}
          </div>
        </div>

        {/* Real-World Scenarios, Mock Exams & Capstone Simulations */}
        {(() => {
          const scenarioRecords = simulationScenariosEngine.getStoredScenarioRecords();
          const latestRecord = scenarioRecords.length > 0 ? scenarioRecords[0] : null;

          return (
            <div className="bg-gradient-to-r from-amber-950/40 via-zinc-900 to-black/90 border border-amber-500/30 rounded-xl p-3.5 space-y-3 relative overflow-hidden shadow-md">
              <div className="flex items-center justify-between border-b border-white/10 pb-2">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-amber-500/20 border border-amber-500/40 flex items-center justify-center">
                    <Compass className="w-4 h-4 text-amber-400" />
                  </div>
                  <div>
                    <span className="text-[10px] font-mono font-bold tracking-wider text-amber-300 uppercase block">
                      {selectedLang === 'EN' ? 'REAL-WORLD SCENARIOS & CAPSTONES' : 'ESCENARIOS REALES Y CAPSTONES'}
                    </span>
                    <span className="text-[8.5px] text-zinc-400 font-mono">
                      {selectedLang === 'EN' ? 'Phase 5: Situational Role-Play & CEFR Mock Exams' : 'Fase 5: Juego de Rol Situacional y Exámenes CEFR'}
                    </span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    if (onNavigateTab) onNavigateTab('simulations');
                    else window.location.hash = '#/simulations';
                  }}
                  className="px-2.5 py-1 rounded-lg bg-amber-400 hover:bg-amber-300 text-neutral-950 font-bold text-[9px] font-mono uppercase flex items-center gap-1 transition-all cursor-pointer shadow-sm"
                >
                  <span>{selectedLang === 'EN' ? 'Open Workspace' : 'Abrir Taller'}</span>
                  <ArrowRight className="w-3 h-3" />
                </button>
              </div>

              {latestRecord && (
                <div className="p-2 bg-black/50 rounded-lg border border-white/5 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <span className={`w-6 h-6 rounded flex items-center justify-center font-mono font-bold text-[10px] ${
                      latestRecord.passed ? 'bg-emerald-500/20 text-emerald-300' : 'bg-rose-500/20 text-rose-300'
                    }`}>
                      {latestRecord.letterGrade || 'A-'}
                    </span>
                    <div>
                      <div className="font-semibold text-white text-[11px] truncate max-w-[180px]">{latestRecord.lessonTitle}</div>
                      <div className="text-[9px] text-zinc-400 font-mono">{latestRecord.resultLabel} • {latestRecord.numericalScore}%</div>
                    </div>
                  </div>
                  <span className="text-[9px] font-mono text-zinc-400">{scenarioRecords.length} {selectedLang === 'EN' ? 'completed' : 'completadas'}</span>
                </div>
              )}

              {/* Quick Launch Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-0.5">
                <button
                  type="button"
                  onClick={() => {
                    if (onNavigateTab) onNavigateTab('simulations');
                    else window.location.hash = '#/simulations';
                  }}
                  className="p-2 bg-black/40 hover:bg-zinc-800/80 border border-white/10 hover:border-amber-400/50 rounded-lg text-left transition-all cursor-pointer space-y-1 group"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-[9px] font-mono font-bold text-amber-400">✈️ TRAVEL</span>
                    <span className="text-[8px] font-mono px-1 rounded bg-white/10 text-zinc-300">A2–B1</span>
                  </div>
                  <div className="text-[10.5px] font-bold text-white group-hover:text-amber-300 transition-colors">
                    {selectedLang === 'EN' ? 'Airport & Customs' : 'Aeropuerto y CBP'}
                  </div>
                  <div className="text-[8.5px] text-zinc-400 leading-tight line-clamp-1">
                    {selectedLang === 'EN' ? 'Gate check-in & immigration CBP' : 'Check-in y oficial de aduanas'}
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    if (onNavigateTab) onNavigateTab('simulations');
                    else window.location.hash = '#/simulations';
                  }}
                  className="p-2 bg-black/40 hover:bg-zinc-800/80 border border-white/10 hover:border-amber-400/50 rounded-lg text-left transition-all cursor-pointer space-y-1 group"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-[9px] font-mono font-bold text-sky-400">💼 CAREER</span>
                    <span className="text-[8px] font-mono px-1 rounded bg-white/10 text-zinc-300">B2</span>
                  </div>
                  <div className="text-[10.5px] font-bold text-white group-hover:text-sky-300 transition-colors">
                    {selectedLang === 'EN' ? 'Job Interview (STAR)' : 'Entrevista Laboral'}
                  </div>
                  <div className="text-[8.5px] text-zinc-400 leading-tight line-clamp-1">
                    {selectedLang === 'EN' ? 'Elevator pitch & negotiation' : 'Presentación y negociación'}
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    if (onNavigateTab) onNavigateTab('simulations');
                    else window.location.hash = '#/simulations';
                  }}
                  className="p-2 bg-black/40 hover:bg-zinc-800/80 border border-white/10 hover:border-amber-400/50 rounded-lg text-left transition-all cursor-pointer space-y-1 group"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-[9px] font-mono font-bold text-purple-400">🏙️ CIVIC LIFE</span>
                    <span className="text-[8px] font-mono px-1 rounded bg-white/10 text-zinc-300">B1</span>
                  </div>
                  <div className="text-[10.5px] font-bold text-white group-hover:text-purple-300 transition-colors">
                    {selectedLang === 'EN' ? 'Everyday Living' : 'Vida Cotidiana'}
                  </div>
                  <div className="text-[8.5px] text-zinc-400 leading-tight line-clamp-1">
                    {selectedLang === 'EN' ? 'Clinic, landlord & banking' : 'Médico, arrendador y banco'}
                  </div>
                </button>
              </div>
            </div>
          );
        })()}

        {/* Voyager Activity Calendar */}
        <ActivityCalendar 
          selectedLang={selectedLang}
          savedChats={savedChats}
          targetGoalMinutes={15}
          onLoadChat={onLoadChat}
        />

        {/* Saved Conversations & Bookmarks Section */}
        <div className="space-y-2">
          <span className="block text-[9px] font-mono font-bold tracking-widest text-amber-400 uppercase flex items-center justify-between">
            <span className="flex items-center gap-1.5">
              <Bookmark className="w-3.5 h-3.5 text-amber-400 fill-amber-400/30" />
              {selectedLang === 'EN' ? 'SAVED CHATS & BOOKMARKS' : 'CONVERSACIONES GUARDADAS Y MARCADORES'}
            </span>
            <span className="text-[8px] text-amber-300 font-bold bg-amber-400/10 px-1.5 py-0.5 rounded border border-amber-400/20">
              {savedChats.length} {selectedLang === 'EN' ? 'saved' : 'guardadas'}
            </span>
          </span>

          {savedChats.length === 0 ? (
            <div className="bg-white/5 border border-white/5 rounded-xl p-3 text-center text-xs text-neutral-400 italic flex flex-col items-center gap-1">
              <Bookmark className="w-4 h-4 text-neutral-500 mb-0.5" />
              <span>
                {selectedLang === 'EN' 
                  ? 'No bookmarked chats yet. Use the 🔖 bookmark icon in CHARLA to save practice conversations.' 
                  : 'Aún no hay chats guardados. Usa el ícono de marcador 🔖 en CHARLA para guardar conversaciones.'}
              </span>
            </div>
          ) : (
            <div className="space-y-2">
              {savedChats.map((chat) => (
                <div 
                  key={chat.id}
                  className="bg-black/40 border border-amber-500/20 hover:border-amber-400/40 rounded-xl p-3 transition-all space-y-2"
                >
                  <div 
                    onClick={() => setExpandedChatId(expandedChatId === chat.id ? null : chat.id)}
                    className="flex items-center justify-between cursor-pointer"
                  >
                    <div className="flex items-center gap-2">
                      <Bookmark className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
                      <div>
                        <div className="text-xs font-bold text-white font-sans flex items-center gap-2">
                          <span>{chat.title}</span>
                          {chat.durationSeconds > 0 && (
                            <span className="text-[9px] font-mono text-amber-300 bg-amber-500/10 px-1.5 py-0.2 rounded">
                              {Math.floor(chat.durationSeconds / 60)}m {chat.durationSeconds % 60}s
                            </span>
                          )}
                        </div>
                        <div className="text-[9px] text-zinc-400 font-mono">
                          {new Date(chat.date).toLocaleDateString()} • {chat.messageCount} {selectedLang === 'EN' ? 'messages' : 'mensajes'}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5">
                      {onLoadChat && (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            onLoadChat(chat);
                          }}
                          className="px-2 py-0.5 bg-amber-400 hover:bg-amber-300 text-slate-950 text-[10px] font-bold rounded transition-colors"
                          title={selectedLang === 'EN' ? 'Load & Continue Chat' : 'Cargar y Continuar Chat'}
                        >
                          {selectedLang === 'EN' ? 'Load' : 'Cargar'}
                        </button>
                      )}
                      <button
                        onClick={(e) => handleDeleteSavedChat(chat.id, e)}
                        className="p-1 hover:bg-red-500/20 rounded text-zinc-400 hover:text-red-400 transition-colors"
                        title={selectedLang === 'EN' ? 'Delete saved chat' : 'Eliminar conversación guardada'}
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                      {expandedChatId === chat.id ? (
                        <ChevronUp className="w-4 h-4 text-amber-400" />
                      ) : (
                        <ChevronDown className="w-4 h-4 text-zinc-400" />
                      )}
                    </div>
                  </div>

                  {/* Expanded transcript */}
                  {expandedChatId === chat.id ? (
                    <div className="border-t border-white/10 pt-2 space-y-1.5 max-h-48 overflow-y-auto pr-1">
                      {chat.messages.map((m, idx) => (
                        <div key={idx} className={`p-1.5 rounded-lg text-xs leading-relaxed ${m.sender === 'user' ? 'bg-amber-400/10 text-amber-200 border border-amber-400/20 text-right' : 'bg-white/5 text-slate-200 border border-white/10 text-left'}`}>
                          <span className="font-bold text-[10px] block opacity-70 mb-0.5">
                            {m.sender === 'user' ? (selectedLang === 'EN' ? 'You' : 'Tú') : 'VOYAGER'}
                          </span>
                          <span>{m.text}</span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-[11px] text-zinc-300 line-clamp-1 italic bg-white/5 p-1.5 rounded-lg border border-white/5">
                      "{chat.snippet}"
                    </p>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Vocabulary Memory Section */}
        <div className="space-y-2 text-left">
          <div className="flex items-center justify-between">
            <span className="block text-[9px] font-mono font-bold tracking-widest text-neutral-300 uppercase">
              📖 {selectedLang === 'EN' ? 'VOCABULARY DEVELOPMENT' : 'DESARROLLO DE VOCABULARIO'}
            </span>
            <div className="flex items-center gap-2 text-[8px] font-mono">
              <span className="text-zinc-400">
                {selectedLang === 'EN' ? 'Introduced:' : 'Introducidas:'} <strong className="text-white">{Math.max(learnedWords.length, vocabSummary.totalIntroduced)}</strong>
              </span>
              <span className="text-amber-400">
                {selectedLang === 'EN' ? 'Practiced:' : 'Practicadas:'} <strong>{vocabSummary.totalPracticed}</strong>
              </span>
              <span className="text-emerald-400">
                {selectedLang === 'EN' ? 'Mastered:' : 'Dominadas:'} <strong>{vocabSummary.totalMastered}</strong>
              </span>
            </div>
          </div>

          <p className="text-[10px] text-zinc-400 italic">
            {selectedLang === 'EN'
              ? 'Words require contextual usage across interactive dialogues to reach demonstrated mastery, avoiding treating exposure as mastery.'
              : 'Las palabras requieren uso contextual en diálogos para demostrar dominio, evitando confundir exposición con dominio.'}
          </p>
          
          {learnedWords.length === 0 && vocabSummary.totalIntroduced === 0 ? (
            <div className="bg-white/5 border border-white/5 rounded-xl p-3 text-center text-xs text-neutral-400 italic">
              {selectedLang === 'EN' ? 'No words captured yet. Speak with VOYAGER to build vocabulary.' : 'Aún no hay palabras registradas. Habla con VOYAGER para incorporar vocabulario.'}
            </div>
          ) : (
            <div className="flex flex-wrap gap-1.5 p-1.5 bg-black/25 rounded-xl border border-white/5">
              {(learnedWords.length > 0 ? learnedWords : vocabSummary.recentPracticed).map((word, i) => (
                <span 
                  key={i}
                  onClick={() => onAskVoyager(selectedLang === 'EN' ? `Remind me, how is the vocabulary word "${word}" used in a professional English sentence?` : `Recuérdame, ¿cómo se usa la palabra de vocabulario "${word}" en una oración profesional en inglés?`)}
                  className="px-2 py-0.5 bg-yellow-500/10 border border-yellow-500/25 hover:border-yellow-400/50 hover:bg-yellow-500/20 text-yellow-400 text-[10px] font-mono font-bold rounded-lg cursor-pointer transition-all"
                  title={selectedLang === 'EN' ? 'Click to hear contextual usage from Voyager' : 'Toca para escuchar uso contextual con Voyager'}
                >
                  {word}
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Accent Reduction / Coach Section */}
        <div className="space-y-2">
          <span className="block text-[9px] font-mono font-bold tracking-widest text-neutral-400 uppercase">
            🎙️ {selectedLang === 'EN' ? 'ACCENT REDUCTION PATTERNS' : 'PATRONES DE REDUCCIÓN DE ACENTO'}
          </span>

          {accentPatterns.length === 0 ? (
            <div className="bg-white/5 border border-white/5 rounded-xl p-3 text-center text-xs text-neutral-400 italic">
              {selectedLang === 'EN' ? 'No pronunciation warnings flagged yet.' : 'Aún no se han detectado advertencias de pronunciación.'}
            </div>
          ) : (
            <div className="grid gap-2">
              {accentPatterns.map((pattern, i) => (
                <div 
                  key={i}
                  onClick={() => onAskVoyager(selectedLang === 'EN' ? `Let's practice the accent reduction exercise for: "${pattern}".` : `Practiquemos el ejercicio de reducción de acento para: "${pattern}".`)}
                  className="bg-red-500/5 border border-red-500/10 hover:border-red-500/35 p-2.5 rounded-xl transition-all cursor-pointer flex items-start gap-2.5 leading-normal group"
                >
                  <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0 mt-0.5 group-hover:scale-105 transition-all" />
                  <div className="flex-1 flex flex-col gap-0.5">
                    <span className="text-[11px] font-bold text-neutral-200 group-hover:text-white transition-colors">{pattern}</span>
                    <span className="text-[8px] font-mono text-neutral-500 uppercase tracking-wider group-hover:text-neutral-400 transition-colors">
                      {selectedLang === 'EN' ? 'Click to trigger coach practice' : 'Toca para iniciar práctica de acento'}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

      </div>
    </div>
  );
};

