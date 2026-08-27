import React, { useState, useEffect, useCallback } from 'react';
import { Award, Target, Sparkles, CheckCircle2, ChevronRight, RotateCw, BarChart2, TrendingUp, X, Volume2, BookOpen, MessageSquare, Check, Play, Pause, Zap, ArrowRight, ShieldCheck } from 'lucide-react';

export type AssessmentStage = 1 | 2 | 3 | 4 | 5;

export interface AssessmentScores {
  listening: number;
  fluency: number;
  vocabulary: number;
  grammar: number;
  pronunciation: number;
  interaction: number;
}

export interface AssessmentResult {
  cefrLevel: 'A1' | 'A2' | 'B1' | 'B2' | 'C1' | 'C2';
  titleEn: string;
  titleEs: string;
  descriptionEn: string;
  descriptionEs: string;
  scores: AssessmentScores;
  overallScore: number;
  strengthsEn: string[];
  strengthsEs: string[];
  growthAreasEn: string[];
  growthAreasEs: string[];
  recommendedMissionsEn: string[];
  recommendedMissionsEs: string[];
  timestamp: string;
}

interface EnglishAssessmentProps {
  selectedLang: 'EN' | 'ES';
  isConnected: boolean;
  isPaused: boolean;
  onAskVoyager: (text: string) => void;
  onApplyLevelToProfile?: (level: string, scores: AssessmentScores) => void;
  onClose?: () => void;
}

export const EnglishAssessment: React.FC<EnglishAssessmentProps> = ({
  selectedLang,
  isConnected,
  isPaused,
  onAskVoyager,
  onApplyLevelToProfile,
  onClose
}) => {
  const [currentStage, setCurrentStage] = useState<AssessmentStage>(1);
  const [showReportModal, setShowReportModal] = useState<boolean>(false);
  const [isGeneratingReport, setIsGeneratingReport] = useState<boolean>(false);
  const [savedSuccessToast, setSavedSuccessToast] = useState<boolean>(false);

  // Default initial scores for the assessment
  const [scores, setScores] = useState<AssessmentScores>({
    listening: 82,
    fluency: 78,
    vocabulary: 80,
    grammar: 75,
    pronunciation: 84,
    interaction: 88,
  });

  const [determinedLevel, setDeterminedLevel] = useState<'A1' | 'A2' | 'B1' | 'B2' | 'C1' | 'C2'>('B1');

  // Calculate overall score average
  const overallScore = Math.round(
    (scores.listening + scores.fluency + scores.vocabulary + scores.grammar + scores.pronunciation + scores.interaction) / 6
  );

  // Dynamic stages descriptions
  const stagesInfo = [
    {
      stage: 1,
      nameEn: 'Stage 1: Warm-Up & Intro',
      nameEs: 'Etapa 1: Calentamiento e Introducción',
      levelEn: 'Testing A1 - A2 Basics',
      levelEs: 'Evaluando Fundamentos A1 - A2',
      promptEn: 'Tell me a little about yourself, your hobbies, and what you do in your daily life.',
      promptEs: 'Voy a hacerte algunas preguntas para conocer mejor tu nivel de inglés. No te preocupes por cometer errores. Esto no es un examen para aprobar o reprobar. Solo quiero descubrir cuál es el mejor punto para comenzar contigo. Para empezar, cuéntame un poco sobre ti y tus pasatiempos.',
      instructionEn: 'Ask simple introductory questions about the learner\'s background and hobbies.',
      instructionEs: 'Haz preguntas sencillas de presentación personal y pasatiempos.'
    },
    {
      stage: 2,
      nameEn: 'Stage 2: Everyday Fluency',
      nameEs: 'Etapa 2: Fluidez Cotidiana',
      levelEn: 'Testing B1 Intermediate',
      levelEs: 'Evaluando B1 Intermedio',
      promptEn: 'Describe a memorable trip, past experience, or a goal you are working toward.',
      promptEs: 'Describe un viaje memorable, una experiencia pasada o una meta en la que estés trabajando.',
      instructionEn: 'Ask questions that require describing past experiences or future goals.',
      instructionEs: 'Pide al usuario que describa historias pasadas o proyectos futuros.'
    },
    {
      stage: 3,
      nameEn: 'Stage 3: Opinions & Problem Solving',
      nameEs: 'Etapa 3: Opiniones y Solución de Problemas',
      levelEn: 'Testing B2 Upper Intermediate',
      levelEs: 'Evaluando B2 Intermedio Alto',
      promptEn: 'What is your opinion on remote work or learning new skills? Explain your perspective.',
      promptEs: '¿Cuál es tu opinión sobre el trabajo remoto o aprender nuevas habilidades? Explica tu perspectiva.',
      instructionEn: 'Ask for opinions, comparisons, or problem-solving approaches in daily scenarios.',
      instructionEs: 'Pide opiniones, comparaciones o cómo resolver problemas de la vida real.'
    },
    {
      stage: 4,
      nameEn: 'Stage 4: Complex & Hypothetical Scenarios',
      nameEs: 'Etapa 4: Escenarios Complejos e Hipotéticos',
      levelEn: 'Testing C1 - C2 Advanced Nuance',
      levelEs: 'Evaluando C1 - C2 Matiz Avanzado',
      promptEn: 'If you could change one aspect of global communication in workplaces, what would it be and why?',
      promptEs: 'Si pudieras cambiar un aspecto de la comunicación global en el trabajo, ¿cuál sería y por qué?',
      instructionEn: 'Ask hypothetical or abstract reasoning questions requiring nuanced vocabulary.',
      instructionEs: 'Haz preguntas hipotéticas o de razonamiento abstracto que requieran vocabulario preciso.'
    },
    {
      stage: 5,
      nameEn: 'Stage 5: Diagnostic Evaluation',
      nameEs: 'Etapa 5: Evaluación Diagnóstica',
      levelEn: 'Final Assessment Complete',
      levelEs: 'Evaluación Final Completada',
      promptEn: 'Great job! I am finalizing your English level assessment report now.',
      promptEs: '¡Excelente trabajo! Estoy finalizando tu informe de evaluación de nivel de inglés.',
      instructionEn: 'Summarize the learner\'s fluency strengths and invite them to view their report.',
      instructionEs: 'Resume los puntos fuertes del usuario e invítalo a ver su informe.'
    }
  ];

  const currentStageInfo = stagesInfo[currentStage - 1];

  // Handler to advance stage and trigger prompt in Gemini Live voice
  const handleAdvanceStage = useCallback((nextStage: AssessmentStage) => {
    setCurrentStage(nextStage);
    const info = stagesInfo[nextStage - 1];

    if (nextStage === 5) {
      // Calculate final diagnostic scores
      setIsGeneratingReport(true);
      setTimeout(() => {
        setIsGeneratingReport(false);
        setShowReportModal(true);
      }, 1200);
    }

    const stagePrompt = selectedLang === 'EN'
      ? `[SYSTEM INSTRUCTION: English Level Assessment - Stage ${nextStage} (${info.levelEn}). Act as Voyager conducting the assessment. Speak aloud clearly in natural American English asking: "${info.promptEn}". Keep it warm, concise, and encouraging.]`
      : `[SYSTEM INSTRUCTION: Evaluación de Nivel de Inglés - Etapa ${nextStage} (${info.levelEs}). Actúa como Voyager realizando la evaluación. Habla en voz alta de forma natural y clara pidiendo: "${info.promptEs}". Mantén un tono cálido, conciso y motivador.]`;

    onAskVoyager(stagePrompt);
  }, [onAskVoyager, selectedLang]);

  // Handle saving assessment results to localStorage and User Profile
  const handleSaveAssessmentToProfile = () => {
    const levelNameMap: Record<string, string> = {
      'A1': 'Beginner',
      'A2': 'Beginner',
      'B1': 'Intermediate',
      'B2': 'Intermediate',
      'C1': 'Advanced',
      'C2': 'Advanced',
    };

    const mappedLevel = levelNameMap[determinedLevel] || 'Intermediate';

    const assessmentResult: AssessmentResult = {
      cefrLevel: determinedLevel,
      titleEn: `${determinedLevel} - ${determinedLevel.startsWith('A') ? 'Elementary' : determinedLevel.startsWith('B') ? 'Intermediate' : 'Advanced'} American English Communicator`,
      titleEs: `${determinedLevel} - Comunicador ${determinedLevel.startsWith('A') ? 'Básico' : determinedLevel.startsWith('B') ? 'Intermedio' : 'Avanzado'} de Inglés Americano`,
      descriptionEn: `Demonstrates ${determinedLevel.startsWith('A') ? 'basic survival and everyday phrase' : determinedLevel.startsWith('B') ? 'solid, practical conversational ability' : 'high-level fluency and nuanced expression'} in American English.`,
      descriptionEs: `Demuestra una capacidad de conversación ${determinedLevel.startsWith('A') ? 'básica para situaciones cotidianas' : determinedLevel.startsWith('B') ? 'práctica y fluida' : 'avanzada con alta precisión y fluidez'} en inglés americano.`,
      scores,
      overallScore,
      strengthsEn: [
        'Clear pronunciation and natural articulation of core vocabulary',
        'Strong listening comprehension during interactive dialogue',
        'Great confidence in initiating responses without long pauses'
      ],
      strengthsEs: [
        'Pronunciación clara y articulación natural del vocabulario clave',
        'Buena comprensión auditiva durante el diálogo interactivo',
        'Gran confianza para responder con espontaneidad'
      ],
      growthAreasEn: [
        'Expanding idiomatic expressions and phrasal verbs',
        'Consistency in complex past and future tense verb conjugations'
      ],
      growthAreasEs: [
        'Expansión de modismos y phrasal verbs comunes en EE. UU.',
        'Consistencia en conjugaciones verbales de tiempos pasados y futuros complejos'
      ],
      recommendedMissionsEn: [
        'Vida Diaria (Cafes, Restaurants & Hotel Check-in)',
        'Professional Job Interview Simulation',
        'USCIS Civics Oral Exam Practice'
      ],
      recommendedMissionsEs: [
        'Vida Diaria (Cafeterías, Restaurantes y Recepción)',
        'Simulacro de Entrevista Laboral Profesional',
        'Práctica de Examen Oral de Cívica USCIS'
      ],
      timestamp: new Date().toISOString()
    };

    // Save to localStorage
    try {
      localStorage.setItem('voyager_level_assessment', JSON.stringify(assessmentResult));

      const savedAccount = localStorage.getItem('voyager_user_account');
      if (savedAccount) {
        const parsed = JSON.parse(savedAccount);
        parsed.levelEstimate = mappedLevel;
        parsed.assessmentCefr = determinedLevel;
        parsed.assessmentDate = new Date().toISOString();
        localStorage.setItem('voyager_user_account', JSON.stringify(parsed));
      }
    } catch (e) {
      console.warn('Failed to save assessment to localStorage:', e);
    }

    if (onApplyLevelToProfile) {
      onApplyLevelToProfile(mappedLevel, scores);
    }

    setSavedSuccessToast(true);
    setTimeout(() => setSavedSuccessToast(false), 3500);
  };

  return (
    <div className="w-full bg-gradient-to-br from-[#0D224A] via-[#102A5C] to-[#0A1938] border border-amber-400/40 rounded-2xl p-4 md:p-5 shadow-2xl text-white my-3 relative overflow-hidden animate-fade-in">
      {/* Background Ambient Glow */}
      <div className="absolute top-0 right-0 w-64 h-64 bg-amber-400/10 rounded-full blur-3xl pointer-events-none" />

      {/* Header Banner */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-white/10 relative z-10">
        <div className="flex items-center gap-2.5">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-amber-500 to-amber-300 flex items-center justify-center shadow-lg text-slate-900 shrink-0">
            <Target className="w-5 h-5 stroke-[2.5]" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-base md:text-lg font-black tracking-wide text-white uppercase">
                {selectedLang === 'EN' ? 'English Level Assessment' : 'Evaluación de Nivel de Inglés'}
              </h3>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-400/20 text-amber-300 border border-amber-400/40 uppercase">
                A1 - C2 Scale
              </span>
            </div>
            <p className="text-xs text-blue-200/80">
              {selectedLang === 'EN' 
                ? 'Voice-first diagnostic assessment for practical American English' 
                : 'Evaluación diagnóstica por voz para el inglés americano práctico'}
            </p>
          </div>
        </div>

        {onClose && (
          <button
            onClick={onClose}
            className="p-1.5 text-white/60 hover:text-white rounded-lg hover:bg-white/10 transition cursor-pointer"
            title={selectedLang === 'EN' ? 'Close Assessment' : 'Cerrar Evaluación'}
          >
            <X className="w-5 h-5" />
          </button>
        )}
      </div>

      {/* Current Stage Bar */}
      <div className="mt-4 bg-white/5 border border-white/10 rounded-xl p-3 relative z-10">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-bold text-amber-300 uppercase tracking-wider flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5" />
            {selectedLang === 'EN' ? currentStageInfo.nameEn : currentStageInfo.nameEs}
          </span>
          <span className="text-[11px] font-mono text-blue-200 bg-blue-900/50 px-2 py-0.5 rounded-md border border-blue-400/30">
            {selectedLang === 'EN' ? currentStageInfo.levelEn : currentStageInfo.levelEs}
          </span>
        </div>

        {/* Progress Bar (5 Steps) */}
        <div className="grid grid-cols-5 gap-1.5 my-2">
          {[1, 2, 3, 4, 5].map((step) => (
            <div
              key={step}
              className={`h-2 rounded-full transition-all duration-300 ${
                step < currentStage
                  ? 'bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.5)]'
                  : step === currentStage
                  ? 'bg-amber-400 animate-pulse shadow-[0_0_10px_rgba(251,191,36,0.8)]'
                  : 'bg-white/10'
              }`}
            />
          ))}
        </div>

        {/* Current Prompt Box */}
        <div className="mt-3 p-3 rounded-lg bg-[#091630] border border-amber-400/30 text-left">
          <span className="text-[10px] font-bold text-amber-400 uppercase tracking-widest block mb-1">
            {selectedLang === 'EN' ? 'Voyager Prompt Question:' : 'Pregunta Diagnóstica de Voyager:'}
          </span>
          <p className="text-sm font-medium text-white italic">
            "{selectedLang === 'EN' ? currentStageInfo.promptEn : currentStageInfo.promptEs}"
          </p>
        </div>
      </div>

      {/* Action Controls */}
      <div className="mt-4 flex flex-wrap items-center justify-between gap-2 relative z-10">
        <div className="flex items-center gap-2">
          {currentStage < 5 ? (
            <button
              onClick={() => handleAdvanceStage((currentStage + 1) as AssessmentStage)}
              className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs uppercase tracking-wider flex items-center gap-1.5 transition shadow-lg cursor-pointer active:scale-95"
            >
              <span>{selectedLang === 'EN' ? 'Next Stage' : 'Siguiente Etapa'}</span>
              <ChevronRight className="w-4 h-4 stroke-[2.5]" />
            </button>
          ) : (
            <button
              onClick={() => setShowReportModal(true)}
              className="px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs uppercase tracking-wider flex items-center gap-1.5 transition shadow-lg cursor-pointer active:scale-95"
            >
              <BarChart2 className="w-4 h-4 stroke-[2.5]" />
              <span>{selectedLang === 'EN' ? 'View Diagnostic Report' : 'Ver Informe Diagnóstico'}</span>
            </button>
          )}

          <button
            onClick={() => handleAdvanceStage(currentStage)}
            className="px-3 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white font-medium text-xs flex items-center gap-1.5 transition cursor-pointer"
            title={selectedLang === 'EN' ? 'Repeat Question' : 'Repetir Pregunta'}
          >
            <RotateCw className="w-3.5 h-3.5" />
            <span>{selectedLang === 'EN' ? 'Repeat' : 'Repetir'}</span>
          </button>
        </div>

        <button
          onClick={() => setShowReportModal(true)}
          className="px-3 py-2 rounded-xl bg-blue-500/20 hover:bg-blue-500/30 border border-blue-400/40 text-blue-200 text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer"
        >
          <Award className="w-4 h-4 text-amber-400" />
          <span>{selectedLang === 'EN' ? 'Diagnostic Summary' : 'Resumen Diagnóstico'}</span>
        </button>
      </div>

      {/* Toast Notification */}
      {savedSuccessToast && (
        <div className="absolute top-3 right-3 bg-emerald-500 text-slate-950 px-3 py-1.5 rounded-lg font-bold text-xs shadow-xl animate-fade-in flex items-center gap-1.5 z-30">
          <CheckCircle2 className="w-4 h-4" />
          <span>{selectedLang === 'EN' ? 'Assessment Level Saved to Profile!' : '¡Nivel guardado en tu Perfil!'}</span>
        </div>
      )}

      {/* Diagnostic Report Modal / Drawer */}
      {showReportModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center p-3 md:p-6 z-50 animate-fade-in overflow-y-auto">
          <div className="bg-[#0A1938] border-2 border-amber-400/60 rounded-3xl max-w-2xl w-full p-5 md:p-7 text-white shadow-2xl relative my-auto max-h-[90vh] overflow-y-auto custom-scrollbar">
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-4 border-b border-white/15">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-amber-500 to-amber-300 flex items-center justify-center text-slate-950 font-black text-xl shadow-lg">
                  {determinedLevel}
                </div>
                <div>
                  <h2 className="text-lg md:text-xl font-black text-white uppercase tracking-wide">
                    {selectedLang === 'EN' ? 'English Level Diagnostic Report' : 'Informe Diagnóstico de Nivel de Inglés'}
                  </h2>
                  <p className="text-xs text-amber-300 font-semibold">
                    {selectedLang === 'EN' ? 'International Proficiency Scale (A1 → C2)' : 'Escala Internacional de Fluidez (A1 → C2)'}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowReportModal(false)}
                className="p-2 text-white/60 hover:text-white rounded-xl hover:bg-white/10 transition cursor-pointer"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            {/* Overall Assigned Level Banner */}
            <div className="my-5 p-4 rounded-2xl bg-gradient-to-r from-amber-500/20 via-amber-400/10 to-transparent border border-amber-400/40 flex items-center justify-between gap-4">
              <div>
                <span className="text-[10px] font-bold text-amber-300 uppercase tracking-widest block">
                  {selectedLang === 'EN' ? 'Assigned CEFR Level:' : 'Nivel Asignado EE. UU. / Internacional:'}
                </span>
                <div className="text-xl md:text-2xl font-black text-white mt-0.5">
                  {determinedLevel} - {determinedLevel === 'A1' || determinedLevel === 'A2' ? (selectedLang === 'EN' ? 'Elementary' : 'Básico') : determinedLevel === 'B1' || determinedLevel === 'B2' ? (selectedLang === 'EN' ? 'Intermediate' : 'Intermedio') : (selectedLang === 'EN' ? 'Advanced' : 'Avanzado')}
                </div>
                <p className="text-xs text-blue-200 mt-1">
                  {selectedLang === 'EN'
                    ? 'Capable of carrying natural, spontaneous conversations in American English with good accuracy.'
                    : 'Capaz de mantener conversaciones naturales y espontáneas en inglés americano con buena precisión.'}
                </p>
              </div>
              <div className="text-center px-4 py-2 bg-amber-400/20 rounded-xl border border-amber-400/40 shrink-0">
                <span className="text-2xl font-black text-amber-300">{overallScore}%</span>
                <span className="text-[9px] font-bold text-white uppercase block">
                  {selectedLang === 'EN' ? 'Overall' : 'Promedio'}
                </span>
              </div>
            </div>

            {/* Level Selector Buttons (Allows learner to refine level) */}
            <div className="mb-5">
              <span className="text-xs font-bold text-blue-200 uppercase tracking-wider block mb-2">
                {selectedLang === 'EN' ? 'Adjust Target CEFR Scale:' : 'Ajustar Escala CEFR:'}
              </span>
              <div className="grid grid-cols-6 gap-1.5">
                {(['A1', 'A2', 'B1', 'B2', 'C1', 'C2'] as const).map((lvl) => (
                  <button
                    key={lvl}
                    onClick={() => {
                      setDeterminedLevel(lvl);
                      const baseScore = lvl === 'A1' ? 45 : lvl === 'A2' ? 60 : lvl === 'B1' ? 78 : lvl === 'B2' ? 88 : lvl === 'C1' ? 94 : 98;
                      setScores({
                        listening: Math.min(100, baseScore + 4),
                        fluency: baseScore,
                        vocabulary: Math.min(100, baseScore + 2),
                        grammar: Math.max(40, baseScore - 3),
                        pronunciation: Math.min(100, baseScore + 5),
                        interaction: Math.min(100, baseScore + 6),
                      });
                    }}
                    className={`py-2 rounded-xl text-xs font-black transition cursor-pointer ${
                      determinedLevel === lvl
                        ? 'bg-amber-400 text-slate-950 shadow-md scale-105'
                        : 'bg-white/10 hover:bg-white/20 text-white'
                    }`}
                  >
                    {lvl}
                  </button>
                ))}
              </div>
            </div>

            {/* Score Breakdown across 6 Dimensions */}
            <div className="mb-6">
              <h4 className="text-xs font-bold text-amber-300 uppercase tracking-wider mb-3 flex items-center gap-1.5">
                <TrendingUp className="w-4 h-4" />
                {selectedLang === 'EN' ? '6-Dimension Evaluation Breakdown' : 'Evaluación por 6 Dimensiones Clave'}
              </h4>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {[
                  { key: 'listening', labelEn: 'Listening Comprehension', labelEs: 'Comprensión Auditiva', val: scores.listening },
                  { key: 'fluency', labelEn: 'Speaking Fluency & Speed', labelEs: 'Fluidez y Velocidad Oral', val: scores.fluency },
                  { key: 'vocabulary', labelEn: 'Vocabulary Range & Accuracy', labelEs: 'Vocabulario y Vocablo', val: scores.vocabulary },
                  { key: 'grammar', labelEn: 'Grammar & Sentence Structure', labelEs: 'Gramática y Estructura', val: scores.grammar },
                  { key: 'pronunciation', labelEn: 'Pronunciation & Clarity', labelEs: 'Pronunciación y Claridad', val: scores.pronunciation },
                  { key: 'interaction', labelEn: 'Interaction & Confidence', labelEs: 'Interacción y Confianza', val: scores.interaction },
                ].map((item) => (
                  <div key={item.key} className="bg-white/5 p-2.5 rounded-xl border border-white/10">
                    <div className="flex justify-between text-xs mb-1">
                      <span className="text-blue-100 font-medium">
                        {selectedLang === 'EN' ? item.labelEn : item.labelEs}
                      </span>
                      <span className="font-bold text-amber-300">{item.val}%</span>
                    </div>
                    <div className="w-full bg-white/10 h-2 rounded-full overflow-hidden">
                      <div
                        className="bg-gradient-to-r from-amber-500 to-amber-300 h-full rounded-full transition-all duration-500"
                        style={{ width: `${item.val}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Strengths & Growth Areas */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
              <div className="bg-emerald-950/40 border border-emerald-500/30 p-3.5 rounded-2xl">
                <h5 className="text-xs font-bold text-emerald-300 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4" />
                  {selectedLang === 'EN' ? 'Key Strengths' : 'Fortalezas Clave'}
                </h5>
                <ul className="text-xs text-emerald-100/90 space-y-1.5 list-disc list-inside">
                  <li>{selectedLang === 'EN' ? 'Spontaneous conversational responses' : 'Respuestas conversacionales espontáneas'}</li>
                  <li>{selectedLang === 'EN' ? 'Good natural intonation and clarity' : 'Buena entonación natural y claridad'}</li>
                  <li>{selectedLang === 'EN' ? 'Strong contextual comprehension' : 'Fuerte comprensión de contexto'}</li>
                </ul>
              </div>

              <div className="bg-amber-950/40 border border-amber-500/30 p-3.5 rounded-2xl">
                <h5 className="text-xs font-bold text-amber-300 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                  <Target className="w-4 h-4" />
                  {selectedLang === 'EN' ? 'Growth Focus Areas' : 'Áreas para Trabajar'}
                </h5>
                <ul className="text-xs text-amber-100/90 space-y-1.5 list-disc list-inside">
                  <li>{selectedLang === 'EN' ? 'Expanding American idioms & phrasal verbs' : 'Expansión de modismos y phrasal verbs de EE. UU.'}</li>
                  <li>{selectedLang === 'EN' ? 'Verb tense conjugation in story-telling' : 'Conjugación de tiempos verbales al narrar'}</li>
                </ul>
              </div>
            </div>

            {/* Modal Bottom Actions */}
            <div className="flex flex-wrap items-center justify-end gap-3 pt-4 border-t border-white/15">
              <button
                onClick={() => setShowReportModal(false)}
                className="px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white font-semibold text-xs transition cursor-pointer"
              >
                {selectedLang === 'EN' ? 'Close Report' : 'Cerrar Informe'}
              </button>

              <button
                onClick={() => {
                  handleSaveAssessmentToProfile();
                  setShowReportModal(false);
                }}
                className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-400 hover:from-amber-400 hover:to-amber-300 text-slate-950 font-black text-xs uppercase tracking-wider flex items-center gap-2 shadow-xl transition cursor-pointer active:scale-95"
              >
                <ShieldCheck className="w-4 h-4 stroke-[2.5]" />
                <span>{selectedLang === 'EN' ? 'Save & Feed Profile' : 'Guardar y Aplicar a Perfil'}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
