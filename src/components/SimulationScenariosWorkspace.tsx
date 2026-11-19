import React, { useState, useEffect } from 'react';
import { 
  Compass, 
  Award, 
  BookOpen, 
  Play, 
  Pause, 
  RotateCcw, 
  CheckCircle2, 
  Clock, 
  MapPin, 
  User, 
  Sparkles, 
  ChevronRight, 
  AlertTriangle, 
  GraduationCap, 
  MessageSquare,
  Volume2,
  X,
  ArrowRight
} from 'lucide-react';
import { 
  simulationScenariosEngine, 
  RealWorldScenario, 
  CefrMockExam, 
  CapstoneSimulation, 
  ActiveSimulationSession,
  ScenarioCategory
} from '../domain/SimulationScenariosEngine';
import { LessonEvaluationRecord } from '../domain/LessonGradingSystem';

interface SimulationScenariosWorkspaceProps {
  selectedLang: 'EN' | 'ES';
  onAskVoyager: (text: string) => void;
  onNavigateTab?: (tab: string) => void;
}

export const SimulationScenariosWorkspace: React.FC<SimulationScenariosWorkspaceProps> = ({
  selectedLang,
  onAskVoyager,
  onNavigateTab
}) => {
  const isEn = selectedLang === 'EN';

  // Navigation tab within workspace
  const [activeTab, setActiveTab] = useState<'scenarios' | 'mock_exams' | 'capstones' | 'history'>('scenarios');
  const [selectedCategory, setSelectedCategory] = useState<ScenarioCategory | 'ALL'>('ALL');

  // Selected item state
  const [selectedScenario, setSelectedScenario] = useState<RealWorldScenario | null>(null);
  const [selectedExam, setSelectedExam] = useState<CefrMockExam | null>(null);
  const [selectedCapstone, setSelectedCapstone] = useState<CapstoneSimulation | null>(null);

  // Active live simulation session
  const [activeSession, setActiveSession] = useState<ActiveSimulationSession | null>(() => 
    simulationScenariosEngine.getActiveSession()
  );

  // Completed evaluation result modal
  const [recentEvaluation, setRecentEvaluation] = useState<LessonEvaluationRecord | null>(null);
  const [pastRecords, setPastRecords] = useState<LessonEvaluationRecord[]>(() => 
    simulationScenariosEngine.getStoredScenarioRecords()
  );

  // Scenarios and exams lists
  const scenarios = React.useMemo(() => simulationScenariosEngine.getScenarios(selectedLang), [selectedLang]);
  const mockExams = React.useMemo(() => simulationScenariosEngine.getMockExams(selectedLang), [selectedLang]);
  const capstones = React.useMemo(() => simulationScenariosEngine.getCapstones(selectedLang), [selectedLang]);

  // Sync session state from engine events
  useEffect(() => {
    const handleStateChange = (e: any) => {
      setActiveSession(e?.detail || simulationScenariosEngine.getActiveSession());
    };
    const handleCompletion = (e: any) => {
      if (e?.detail) {
        setRecentEvaluation(e.detail);
        setPastRecords(simulationScenariosEngine.getStoredScenarioRecords());
      }
    };

    window.addEventListener('voyager_simulation_state_changed', handleStateChange);
    window.addEventListener('voyager_scenario_completed', handleCompletion);

    return () => {
      window.removeEventListener('voyager_simulation_state_changed', handleStateChange);
      window.removeEventListener('voyager_scenario_completed', handleCompletion);
    };
  }, []);

  // Filtered scenarios
  const filteredScenarios = React.useMemo(() => {
    if (selectedCategory === 'ALL') return scenarios;
    return scenarios.filter(s => s.category === selectedCategory);
  }, [scenarios, selectedCategory]);

  // Handler: Start Scenario
  const handleStartScenario = (scenario: RealWorldScenario) => {
    const session = simulationScenariosEngine.startSession(
      scenario.id,
      'SCENARIO',
      scenario.title,
      scenario.cefrLevel,
      scenario.milestones.length
    );
    setActiveSession(session);

    const promptText = isEn
      ? `[AUTO_SYSTEM: SIMULATION SESSION STARTED. Scenario: "${scenario.title}" (CEFR: ${scenario.cefrLevel}). Setting: "${scenario.setting}". Your Role: "${scenario.voyagerRole}". Student Role: "${scenario.studentRole}". Primary Objective: "${scenario.objective}". ${scenario.rolePrompt} Speak immediately in your natural English voice as this character. Greet the student and initiate the interaction in character.]`
      : `[AUTO_SYSTEM: SESIÓN DE SIMULACIÓN INICIADA. Escenario: "${scenario.title}" (CEFR: ${scenario.cefrLevel}). Entorno: "${scenario.setting}". Tu Personaje: "${scenario.voyagerRole}". Rol del Estudiante: "${scenario.studentRole}". Objetivo Principal: "${scenario.objective}". ${scenario.rolePrompt} Habla de inmediato con tu voz natural en inglés interpretando a este personaje. Saluda al estudiante e inicia la interacción dentro del rol.]`;

    onAskVoyager(promptText);
  };

  // Handler: Start Mock Exam
  const handleStartExam = (exam: CefrMockExam) => {
    const session = simulationScenariosEngine.startSession(
      exam.id,
      'EXAM',
      exam.title,
      exam.cefrLevel,
      exam.sections.length
    );
    setActiveSession(session);

    const promptText = isEn
      ? `[AUTO_SYSTEM: CEFR PRACTICE MOCK EXAM STARTED: "${exam.title}" (Level ${exam.cefrLevel}). Act as an encouraging yet rigorous CEFR oral language examiner. Administer Section 1: "${exam.sections[0].name}" (${exam.sections[0].description}). Prompt task: "${exam.sections[0].taskPrompt}". Speak in American English, introduce the exam format, and ask the first assessment question.]`
      : `[AUTO_SYSTEM: EXAMEN DE SIMULACIÓN CEFR INICIADO: "${exam.title}" (Nivel ${exam.cefrLevel}). Actúa como un evaluador oral riguroso y motivador. Administra la Sección 1: "${exam.sections[0].name}" (${exam.sections[0].description}). Tarea: "${exam.sections[0].taskPrompt}". Habla en inglés americano, introduce el formato del examen y plantea la primera pregunta de evaluación.]`;

    onAskVoyager(promptText);
  };

  // Handler: Start Capstone
  const handleStartCapstone = (capstone: CapstoneSimulation) => {
    const session = simulationScenariosEngine.startSession(
      capstone.id,
      'CAPSTONE',
      capstone.title,
      capstone.cefrLevel,
      capstone.checkpoints.length
    );
    setActiveSession(session);

    const cp1 = capstone.checkpoints[0];
    const promptText = isEn
      ? `[AUTO_SYSTEM: MULTI-STAGE CAPSTONE SIMULATION STARTED: "${capstone.title}" (CEFR ${capstone.cefrLevel}). Initiating Checkpoint 1 of ${capstone.checkpoints.length}: "${cp1.title}". Situation: "${cp1.situation}". Your Role: "${cp1.voyagerRole}". Objective: "${cp1.objective}". Speak in character in natural American English. Engage the student and establish the scenario immediately.]`
      : `[AUTO_SYSTEM: SIMULACIÓN CAPSTONE MULTIETAPA INICIADA: "${capstone.title}" (CEFR ${capstone.cefrLevel}). Iniciando Punto de Control 1 de ${capstone.checkpoints.length}: "${cp1.title}". Situación: "${cp1.situation}". Tu Personaje: "${cp1.voyagerRole}". Objetivo: "${cp1.objective}". Habla interpretando al personaje en inglés americano natural. Involucra al estudiante e inicia el escenario de inmediato.]`;

    onAskVoyager(promptText);
  };

  // Controls: Pause / Resume / Repeat / Next / End
  const handlePause = () => {
    simulationScenariosEngine.pauseSession();
    onAskVoyager(isEn 
      ? `[AUTO_SYSTEM: The student paused the simulation session. Pause dialogue gracefully and confirm you are on standby.]`
      : `[AUTO_SYSTEM: El estudiante pausó la sesión de simulación. Pausa el diálogo amablemente y confirma que estás en espera.]`
    );
  };

  const handleResume = () => {
    simulationScenariosEngine.resumeSession();
    onAskVoyager(isEn
      ? `[AUTO_SYSTEM: Simulation resumed. Continue in character from where you left off naturally.]`
      : `[AUTO_SYSTEM: Simulación reanudada. Continúa dentro del personaje desde donde se quedaron.]`
    );
  };

  const handleRepeatCheckpoint = () => {
    onAskVoyager(isEn
      ? `[AUTO_SYSTEM: The student requested to repeat or rephrase the current simulation checkpoint prompt. Rephrase your last in-character statement clearly and naturally.]`
      : `[AUTO_SYSTEM: El estudiante solicitó repetir o reformular la consigna actual del punto de control. Repite tu última intervención dentro del personaje con claridad.]`
    );
  };

  const handleAdvanceCheckpoint = () => {
    simulationScenariosEngine.advanceCheckpoint();
    const updated = simulationScenariosEngine.getActiveSession();
    if (updated) {
      onAskVoyager(isEn
        ? `[AUTO_SYSTEM: Advance to simulation checkpoint ${updated.currentCheckpointIndex + 1} of ${updated.totalCheckpoints}. Transition seamlessly to the next stage of the scenario.]`
        : `[AUTO_SYSTEM: Avanza al punto de control ${updated.currentCheckpointIndex + 1} de ${updated.totalCheckpoints}. Realiza una transición fluida a la siguiente etapa.]`
      );
    }
  };

  const handleEndSession = () => {
    const record = simulationScenariosEngine.endSession(88, [], 480, selectedLang);
    setRecentEvaluation(record);
    onAskVoyager(isEn
      ? `[AUTO_SYSTEM: Simulation concluded. Step out of character. As Voyager, provide a warm 30-second oral summary of their conversational performance, highlighting their strengths and one pronunciation or vocabulary tip.]`
      : `[AUTO_SYSTEM: Simulación concluida. Sal del personaje. Como Voyager, ofrece un resumen oral cálido de 30 segundos sobre su desempeño conversacional, destacando sus fortalezas y un consejo de pronunciación o vocabulario.]`
    );
  };

  return (
    <div className="w-full h-full flex flex-col bg-zinc-950 text-white font-sans overflow-hidden">
      {/* Top Banner & Header */}
      <div className="border-b border-zinc-800 bg-zinc-900/90 px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-amber-500/10 border border-amber-500/30 flex items-center justify-center">
            <Compass className="w-4 h-4 text-amber-400" />
          </div>
          <div>
            <h2 className="text-sm font-bold tracking-tight text-white font-sans flex items-center gap-2">
              <span>{isEn ? 'REAL-WORLD SCENARIOS & CAPSTONES' : 'ESCENARIOS REALES Y CAPSTONES'}</span>
              <span className="text-[9px] font-mono font-normal px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20">
                PHASE 5
              </span>
            </h2>
            <p className="text-[10px] text-zinc-400">
              {isEn 
                ? 'Situational role-play, CEFR practice mock exams, and comprehensive simulations'
                : 'Juegos de rol situacionales, exámenes de práctica CEFR y simulaciones integrales'}
            </p>
          </div>
        </div>

        {/* Active Session Status Pill */}
        {activeSession && (
          <div className="flex items-center gap-2 bg-emerald-950/80 border border-emerald-500/40 px-3 py-1.5 rounded-xl">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <div className="text-[10px] font-mono">
              <span className="text-emerald-300 font-bold uppercase">{activeSession.status}: </span>
              <span className="text-zinc-300">{activeSession.title}</span>
            </div>
          </div>
        )}
      </div>

      {/* Primary Workspace Navigation Tabs */}
      <div className="flex border-b border-zinc-800 bg-zinc-900/40 px-4 gap-2 text-xs font-mono">
        <button
          onClick={() => { setActiveTab('scenarios'); setSelectedExam(null); setSelectedCapstone(null); }}
          className={`py-2.5 px-3 border-b-2 transition-all flex items-center gap-1.5 cursor-pointer ${
            activeTab === 'scenarios'
              ? 'border-amber-400 text-amber-300 font-bold'
              : 'border-transparent text-zinc-400 hover:text-zinc-200'
          }`}
        >
          <Compass className="w-3.5 h-3.5" />
          <span>{isEn ? 'Scenarios (12)' : 'Escenarios (12)'}</span>
        </button>

        <button
          onClick={() => { setActiveTab('mock_exams'); setSelectedScenario(null); setSelectedCapstone(null); }}
          className={`py-2.5 px-3 border-b-2 transition-all flex items-center gap-1.5 cursor-pointer ${
            activeTab === 'mock_exams'
              ? 'border-amber-400 text-amber-300 font-bold'
              : 'border-transparent text-zinc-400 hover:text-zinc-200'
          }`}
        >
          <GraduationCap className="w-3.5 h-3.5" />
          <span>{isEn ? 'CEFR Mock Exams (A1–C2)' : 'Exámenes Mock CEFR (A1–C2)'}</span>
        </button>

        <button
          onClick={() => { setActiveTab('capstones'); setSelectedScenario(null); setSelectedExam(null); }}
          className={`py-2.5 px-3 border-b-2 transition-all flex items-center gap-1.5 cursor-pointer ${
            activeTab === 'capstones'
              ? 'border-amber-400 text-amber-300 font-bold'
              : 'border-transparent text-zinc-400 hover:text-zinc-200'
          }`}
        >
          <Sparkles className="w-3.5 h-3.5" />
          <span>{isEn ? 'Capstones (3)' : 'Capstones (3)'}</span>
        </button>

        <button
          onClick={() => { setActiveTab('history'); }}
          className={`py-2.5 px-3 border-b-2 transition-all flex items-center gap-1.5 cursor-pointer ${
            activeTab === 'history'
              ? 'border-amber-400 text-amber-300 font-bold'
              : 'border-transparent text-zinc-400 hover:text-zinc-200'
          }`}
        >
          <CheckCircle2 className="w-3.5 h-3.5" />
          <span>{isEn ? `Records (${pastRecords.length})` : `Historial (${pastRecords.length})`}</span>
        </button>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">

        {/* ACTIVE SESSION CONTROL TOOLBAR (shown when session is live) */}
        {activeSession && (
          <div className="bg-gradient-to-r from-amber-950/40 via-zinc-900 to-black border border-amber-500/30 rounded-xl p-3.5 space-y-2.5 shadow-lg">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping" />
                <span className="text-xs font-mono font-bold text-amber-300 uppercase">
                  {isEn ? 'Interactive Simulation in Progress' : 'Simulación Interactiva en Curso'}
                </span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-white/10 text-zinc-300">
                  {activeSession.cefrLevel}
                </span>
              </div>
              <div className="text-[10px] font-mono text-zinc-400">
                {isEn ? 'Checkpoint' : 'Etapa'}: {activeSession.currentCheckpointIndex + 1} / {activeSession.totalCheckpoints}
              </div>
            </div>

            <div className="text-xs text-zinc-200 font-medium">
              {activeSession.title}
            </div>

            {/* Session Action Buttons */}
            <div className="flex items-center flex-wrap gap-2 pt-1 border-t border-white/10">
              {activeSession.status === 'ACTIVE' ? (
                <button
                  type="button"
                  onClick={handlePause}
                  className="px-3 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-mono flex items-center gap-1.5 transition-all cursor-pointer"
                >
                  <Pause className="w-3.5 h-3.5 text-amber-400" />
                  <span>{isEn ? 'Pause Session' : 'Pausar Sesión'}</span>
                </button>
              ) : (
                <button
                  type="button"
                  onClick={handleResume}
                  className="px-3 py-1.5 rounded-lg bg-emerald-700 hover:bg-emerald-600 text-white text-xs font-mono flex items-center gap-1.5 transition-all cursor-pointer"
                >
                  <Play className="w-3.5 h-3.5 text-white" />
                  <span>{isEn ? 'Resume Session' : 'Reanudar Sesión'}</span>
                </button>
              )}

              <button
                type="button"
                onClick={handleRepeatCheckpoint}
                className="px-3 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-mono flex items-center gap-1.5 transition-all cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5 text-sky-400" />
                <span>{isEn ? 'Repeat Prompt' : 'Repetir Consigna'}</span>
              </button>

              {activeSession.totalCheckpoints > 1 && activeSession.currentCheckpointIndex < activeSession.totalCheckpoints - 1 && (
                <button
                  type="button"
                  onClick={handleAdvanceCheckpoint}
                  className="px-3 py-1.5 rounded-lg bg-amber-600 hover:bg-amber-500 text-white text-xs font-mono flex items-center gap-1.5 transition-all cursor-pointer"
                >
                  <span>{isEn ? 'Next Checkpoint' : 'Siguiente Etapa'}</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              )}

              <button
                type="button"
                onClick={handleEndSession}
                className="px-3 py-1.5 rounded-lg bg-rose-700 hover:bg-rose-600 text-white text-xs font-mono font-bold flex items-center gap-1.5 transition-all cursor-pointer ml-auto"
              >
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>{isEn ? 'End & Evaluate' : 'Finalizar y Calificar'}</span>
              </button>
            </div>
          </div>
        )}

        {/* TAB 1: REAL-WORLD SCENARIOS */}
        {activeTab === 'scenarios' && (
          <div className="space-y-4">
            {/* Category Filter Pills */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-[11px] font-mono">
              {[
                { id: 'ALL', labelEn: 'All Categories (12)', labelEs: 'Todas las Categorías (12)' },
                { id: 'TRAVEL', labelEn: 'Travel (3)', labelEs: 'Viajes (3)' },
                { id: 'PROFESSIONAL', labelEn: 'Professional (3)', labelEs: 'Profesional (3)' },
                { id: 'EVERYDAY_LIFE', labelEn: 'Everyday Life (3)', labelEs: 'Vida Cotidiana (3)' },
                { id: 'SOCIAL_COMMUNICATION', labelEn: 'Social & Small Talk (3)', labelEs: 'Social y Charla (3)' }
              ].map(cat => (
                <button
                  key={cat.id}
                  onClick={() => setSelectedCategory(cat.id as any)}
                  className={`px-2.5 py-1 rounded-lg border transition-all cursor-pointer whitespace-nowrap ${
                    selectedCategory === cat.id
                      ? 'bg-amber-400 text-neutral-950 font-bold border-amber-400'
                      : 'bg-zinc-900 text-zinc-400 border-zinc-800 hover:border-zinc-700'
                  }`}
                >
                  {isEn ? cat.labelEn : cat.labelEs}
                </button>
              ))}
            </div>

            {/* Scenarios Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {filteredScenarios.map(scen => (
                <div
                  key={scen.id}
                  className="bg-zinc-900/80 border border-zinc-800 hover:border-zinc-700 rounded-xl p-3.5 space-y-2.5 transition-all flex flex-col justify-between"
                >
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="text-[9px] font-mono font-bold px-2 py-0.5 rounded bg-zinc-800 text-zinc-300 border border-zinc-700">
                        {scen.category}
                      </span>
                      <div className="flex items-center gap-1.5">
                        <span className="text-[10px] font-mono font-bold text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20">
                          {scen.cefrLevel}
                        </span>
                        <span className="text-[9px] font-mono text-zinc-400 flex items-center gap-1">
                          <Clock className="w-3 h-3 text-zinc-500" />
                          {scen.estimatedMinutes}m
                        </span>
                      </div>
                    </div>

                    <h4 className="text-sm font-bold text-white font-sans tracking-tight">
                      {scen.title}
                    </h4>

                    <p className="text-xs text-zinc-400 leading-relaxed">
                      {scen.subtitle}
                    </p>

                    <div className="grid grid-cols-2 gap-2 text-[10px] text-zinc-300 pt-1 font-mono">
                      <div className="bg-black/40 p-1.5 rounded border border-white/5 flex items-center gap-1.5">
                        <User className="w-3 h-3 text-amber-400 shrink-0" />
                        <span className="truncate">{scen.voyagerRole}</span>
                      </div>
                      <div className="bg-black/40 p-1.5 rounded border border-white/5 flex items-center gap-1.5">
                        <MapPin className="w-3 h-3 text-rose-400 shrink-0" />
                        <span className="truncate">{scen.setting}</span>
                      </div>
                    </div>

                    {/* Target Vocabulary */}
                    <div className="pt-1">
                      <span className="text-[9px] font-mono text-zinc-400 block mb-1">
                        {isEn ? 'Target Vocabulary:' : 'Vocabulario Clave:'}
                      </span>
                      <div className="flex flex-wrap gap-1">
                        {scen.vocabularyList.slice(0, 4).map((voc, i) => (
                          <span key={i} className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-zinc-800 text-zinc-300 border border-zinc-700">
                            {voc}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="pt-2 border-t border-zinc-800 flex items-center justify-between">
                    <span className="text-[9px] font-mono text-zinc-400">
                      {scen.milestones.length} {isEn ? 'Milestones' : 'Hitos'}
                    </span>

                    <button
                      type="button"
                      onClick={() => handleStartScenario(scen)}
                      className="px-3 py-1.5 rounded-lg bg-amber-400 hover:bg-amber-300 text-neutral-950 font-bold text-xs font-sans flex items-center gap-1.5 transition-all cursor-pointer shadow-sm"
                    >
                      <Play className="w-3 h-3 fill-current" />
                      <span>{isEn ? 'Start Role-Play' : 'Iniciar Simulación'}</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 2: CEFR PRACTICE MOCK EXAMS (A1 - C2) */}
        {activeTab === 'mock_exams' && (
          <div className="space-y-4">
            {/* Mandatory Regulatory Disclaimer */}
            <div className="p-3 bg-amber-500/10 border border-amber-500/30 rounded-xl space-y-1 text-xs">
              <div className="flex items-center gap-1.5 font-bold text-amber-300 font-mono text-[11px] uppercase tracking-wider">
                <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
                <span>{isEn ? 'CEFR Practice Assessment Notice' : 'Aviso sobre Exámenes de Práctica CEFR'}</span>
              </div>
              <p className="text-zinc-300 text-[11px] leading-relaxed">
                {isEn
                  ? 'Voyager USA practice assessments are instructional evaluations designed to build communicative competence. They do not constitute accredited official CEFR certification issued by external examining bodies.'
                  : 'Las evaluaciones de práctica de Voyager USA son pruebas pedagógicas diseñadas para desarrollar competencias orales. No constituyen una certificación oficial acreditada por entidades examinadoras externas.'}
              </p>
            </div>

            {/* Mock Exams List */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {mockExams.map(exam => (
                <div
                  key={exam.id}
                  className="bg-zinc-900/80 border border-zinc-800 hover:border-zinc-700 rounded-xl p-3.5 space-y-2.5 transition-all flex flex-col justify-between"
                >
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-black font-mono px-2.5 py-0.5 rounded-md bg-amber-400 text-neutral-950">
                        {exam.cefrLevel}
                      </span>
                      <span className="text-[10px] font-mono text-zinc-400">
                        {exam.sections.length} {isEn ? 'Sections' : 'Secciones'} • {isEn ? 'Pass' : 'Aprobación'}: {exam.passingScore}%
                      </span>
                    </div>

                    <h4 className="text-sm font-bold text-white font-sans">
                      {exam.title}
                    </h4>

                    <p className="text-xs text-zinc-400 leading-relaxed">
                      {exam.subtitle}
                    </p>

                    {/* Target Skills */}
                    <div className="flex flex-wrap gap-1 pt-1">
                      {exam.targetSkills.map((sk, idx) => (
                        <span key={idx} className="text-[9px] font-mono px-2 py-0.5 rounded bg-zinc-800 text-zinc-300 border border-zinc-700">
                          {sk}
                        </span>
                      ))}
                    </div>

                    {/* Sections overview */}
                    <div className="space-y-1 pt-1">
                      {exam.sections.map((sec, i) => (
                        <div key={i} className="text-[10px] font-mono text-zinc-400 flex items-center justify-between bg-black/40 px-2 py-1 rounded">
                          <span className="text-zinc-300 font-semibold">{sec.name}</span>
                          <span className="text-[9px] text-zinc-500">{sec.description}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="pt-2 border-t border-zinc-800 flex items-center justify-end">
                    <button
                      type="button"
                      onClick={() => handleStartExam(exam)}
                      className="px-3.5 py-1.5 rounded-lg bg-amber-400 hover:bg-amber-300 text-neutral-950 font-bold text-xs font-sans flex items-center gap-1.5 transition-all cursor-pointer shadow-sm"
                    >
                      <GraduationCap className="w-3.5 h-3.5" />
                      <span>{isEn ? `Take ${exam.cefrLevel} Mock Exam` : `Rendir Examen ${exam.cefrLevel}`}</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 3: CAPSTONES */}
        {activeTab === 'capstones' && (
          <div className="space-y-4">
            <div className="text-xs text-zinc-400 leading-relaxed">
              {isEn
                ? 'Capstone simulations synthesize everything you have practiced into real-life multi-stage scenarios across institutions, workplaces, and daily American society.'
                : 'Las simulaciones Capstone integran todo tu aprendizaje en escenarios multietapa de la vida real en instituciones, entornos de trabajo y la sociedad estadounidense.'}
            </div>

            <div className="space-y-3">
              {capstones.map(cap => (
                <div
                  key={cap.id}
                  className="bg-zinc-900/90 border border-zinc-800 hover:border-amber-500/40 rounded-xl p-4 space-y-3 transition-all"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-mono font-bold px-2.5 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30">
                        {cap.cefrLevel}
                      </span>
                      <h4 className="text-sm font-bold text-white font-sans">
                        {cap.title}
                      </h4>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleStartCapstone(cap)}
                      className="px-3.5 py-1.5 rounded-lg bg-amber-400 hover:bg-amber-300 text-neutral-950 font-bold text-xs font-sans flex items-center gap-1.5 transition-all cursor-pointer shadow-sm"
                    >
                      <Sparkles className="w-3.5 h-3.5" />
                      <span>{isEn ? 'Begin Capstone' : 'Iniciar Capstone'}</span>
                    </button>
                  </div>

                  <p className="text-xs text-zinc-300 leading-relaxed">
                    {cap.summary}
                  </p>

                  {/* Checkpoints Sequence */}
                  <div className="space-y-1.5 pt-1">
                    <span className="text-[10px] font-mono text-zinc-400 uppercase tracking-wider block">
                      {isEn ? 'Multi-Stage Checkpoints:' : 'Puntos de Control Multietapa:'}
                    </span>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                      {cap.checkpoints.map(cp => (
                        <div key={cp.id} className="p-2.5 bg-black/50 border border-white/5 rounded-lg text-xs space-y-1">
                          <div className="flex items-center justify-between text-[10px] font-mono">
                            <span className="text-amber-400 font-bold">{isEn ? 'Stage' : 'Etapa'} {cp.stageNumber}</span>
                            <span className="text-zinc-500 truncate max-w-[100px]">{cp.voyagerRole}</span>
                          </div>
                          <div className="font-semibold text-zinc-200 text-[11px]">{cp.title}</div>
                          <div className="text-[10px] text-zinc-400 leading-normal">{cp.situation}</div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="text-[10px] font-mono text-zinc-400 pt-1 border-t border-white/5 flex items-center justify-between">
                    <span>{isEn ? 'Final Milestone Award:' : 'Distinción Final:'} <strong>{cap.finalMilestone}</strong></span>
                    <span className="text-amber-400">30–45 {isEn ? 'mins total' : 'mins en total'}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 4: EVALUATION HISTORY & RECORDS */}
        {activeTab === 'history' && (
          <div className="space-y-3">
            <div className="flex items-center justify-between text-xs font-mono text-zinc-400">
              <span>{isEn ? 'Logged Simulation & Exam Attempts' : 'Intentos de Simulaciones y Exámenes Registrados'}</span>
              <span>{pastRecords.length} {isEn ? 'records' : 'registros'}</span>
            </div>

            {pastRecords.length === 0 ? (
              <div className="p-8 bg-zinc-900/50 border border-dashed border-zinc-800 rounded-xl text-center text-xs text-zinc-500">
                {isEn 
                  ? 'No simulation or mock exam attempts completed yet. Choose a scenario above to start practicing.'
                  : 'Aún no se han completado intentos de simulación. Selecciona un escenario arriba para comenzar.'}
              </div>
            ) : (
              <div className="space-y-2">
                {pastRecords.map(rec => (
                  <div
                    key={rec.id}
                    className="p-3 bg-zinc-900/80 border border-zinc-800 rounded-xl space-y-2 text-xs"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold font-mono text-xs ${
                          rec.passed ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' : 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                        }`}>
                          {rec.letterGrade || 'B+'}
                        </span>
                        <div>
                          <div className="font-bold text-white font-sans flex items-center gap-2">
                            <span>{rec.lessonTitle}</span>
                            <span className="text-[9px] font-mono px-1.5 py-0.2 rounded bg-zinc-800 text-zinc-300">
                              {rec.level}
                            </span>
                          </div>
                          <span className="text-[10px] text-zinc-400 font-mono">
                            {new Date(rec.timestamp).toLocaleDateString()} • {rec.resultLabel}
                          </span>
                        </div>
                      </div>

                      <div className="text-right">
                        <span className="text-sm font-bold font-mono text-amber-400">{rec.numericalScore}%</span>
                        <span className="text-[10px] text-zinc-500 block font-mono">{Math.round((rec.durationSeconds || 300) / 60)}m</span>
                      </div>
                    </div>

                    <p className="text-[11px] text-zinc-300 italic bg-black/40 p-2 rounded border border-white/5">
                      "{rec.explanation}"
                    </p>

                    {/* Criteria breakdown */}
                    {rec.criteriaScores && (
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5 text-[10px] font-mono pt-1">
                        <div className="p-1 bg-white/5 rounded text-center">
                          <span className="text-zinc-400 block">{isEn ? 'Fluency' : 'Fluidez'}</span>
                          <span className="font-bold text-sky-400">{rec.criteriaScores.fluency}%</span>
                        </div>
                        <div className="p-1 bg-white/5 rounded text-center">
                          <span className="text-zinc-400 block">{isEn ? 'Grammar' : 'Gramática'}</span>
                          <span className="font-bold text-amber-400">{rec.criteriaScores.grammar}%</span>
                        </div>
                        <div className="p-1 bg-white/5 rounded text-center">
                          <span className="text-zinc-400 block">{isEn ? 'Pronunciation' : 'Pronunciación'}</span>
                          <span className="font-bold text-emerald-400">{rec.criteriaScores.pronunciation}%</span>
                        </div>
                        <div className="p-1 bg-white/5 rounded text-center">
                          <span className="text-zinc-400 block">{isEn ? 'Objective' : 'Objetivo'}</span>
                          <span className="font-bold text-purple-400">{rec.criteriaScores.objectiveCompletion || rec.criteriaScores.objective}%</span>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

      </div>

      {/* RECENT EVALUATION MODAL */}
      {recentEvaluation && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-zinc-900 border border-zinc-700 rounded-2xl max-w-lg w-full p-5 space-y-4 shadow-2xl relative text-left">
            <button
              onClick={() => setRecentEvaluation(null)}
              className="absolute top-4 right-4 text-zinc-400 hover:text-white transition-all cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="flex items-center gap-3 border-b border-zinc-800 pb-3">
              <div className={`w-12 h-12 rounded-xl flex items-center justify-center font-black font-mono text-xl ${
                recentEvaluation.passed ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40' : 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
              }`}>
                {recentEvaluation.letterGrade || 'A-'}
              </div>
              <div>
                <span className="text-[10px] font-mono text-amber-400 uppercase tracking-widest block">
                  {isEn ? 'OFFICIAL SIMULATION EVALUATION' : 'EVALUACIÓN OFICIAL DE SIMULACIÓN'}
                </span>
                <h3 className="text-base font-bold text-white font-sans">
                  {recentEvaluation.lessonTitle}
                </h3>
                <span className="text-xs text-zinc-400 font-mono">
                  {recentEvaluation.resultLabel} • {recentEvaluation.numericalScore}%
                </span>
              </div>
            </div>

            <p className="text-xs text-zinc-300 leading-relaxed bg-black/50 p-3 rounded-xl border border-white/5">
              {recentEvaluation.explanation}
            </p>

            {/* Criteria breakdown */}
            {recentEvaluation.criteriaScores && (
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs font-mono">
                <div className="p-2 bg-zinc-800/80 rounded-lg text-center border border-zinc-700">
                  <span className="text-[10px] text-zinc-400 block">{isEn ? 'Fluency' : 'Fluidez'}</span>
                  <span className="font-bold text-sky-400 text-sm">{recentEvaluation.criteriaScores.fluency}%</span>
                </div>
                <div className="p-2 bg-zinc-800/80 rounded-lg text-center border border-zinc-700">
                  <span className="text-[10px] text-zinc-400 block">{isEn ? 'Grammar' : 'Gramática'}</span>
                  <span className="font-bold text-amber-400 text-sm">{recentEvaluation.criteriaScores.grammar}%</span>
                </div>
                <div className="p-2 bg-zinc-800/80 rounded-lg text-center border border-zinc-700">
                  <span className="text-[10px] text-zinc-400 block">{isEn ? 'Pronunciation' : 'Pronunciación'}</span>
                  <span className="font-bold text-emerald-400 text-sm">{recentEvaluation.criteriaScores.pronunciation}%</span>
                </div>
                <div className="p-2 bg-zinc-800/80 rounded-lg text-center border border-zinc-700">
                  <span className="text-[10px] text-zinc-400 block">{isEn ? 'Objective' : 'Objetivo'}</span>
                  <span className="font-bold text-purple-400 text-sm">{recentEvaluation.criteriaScores.objectiveCompletion || recentEvaluation.criteriaScores.objective}%</span>
                </div>
              </div>
            )}

            {/* Strengths & Improvements */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px]">
              <div className="p-2.5 bg-emerald-950/30 border border-emerald-500/20 rounded-xl space-y-1">
                <span className="font-bold text-emerald-400 font-mono uppercase text-[10px] block">
                  {isEn ? 'Demonstrated Strengths' : 'Fortalezas Demostradas'}
                </span>
                <ul className="list-disc list-inside text-zinc-300 space-y-0.5">
                  {recentEvaluation.strengths.map((s, i) => (
                    <li key={i}>{s}</li>
                  ))}
                </ul>
              </div>

              <div className="p-2.5 bg-amber-950/30 border border-amber-500/20 rounded-xl space-y-1">
                <span className="font-bold text-amber-400 font-mono uppercase text-[10px] block">
                  {isEn ? 'Areas to Practice' : 'Áreas de Práctica'}
                </span>
                <ul className="list-disc list-inside text-zinc-300 space-y-0.5">
                  {recentEvaluation.areasToImprove.map((a, i) => (
                    <li key={i}>{a}</li>
                  ))}
                </ul>
              </div>
            </div>

            <div className="pt-2 flex justify-end">
              <button
                type="button"
                onClick={() => setRecentEvaluation(null)}
                className="px-4 py-2 rounded-xl bg-amber-400 hover:bg-amber-300 text-neutral-950 font-bold text-xs font-sans transition-all cursor-pointer"
              >
                {isEn ? 'Continue Learning' : 'Continuar Aprendiendo'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
