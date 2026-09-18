import React, { useState, useEffect } from 'react';
import { 
  Users, 
  Search, 
  BookOpen, 
  GraduationCap, 
  UserCheck, 
  FileText, 
  MessageSquare, 
  Mail, 
  UserPlus,
  RefreshCw,
  X,
  AlertCircle,
  Volume2
} from 'lucide-react';
import { auth, ADMIN_CREDENTIALS } from '../services/firebaseAuth';
import { 
  StudentSummary, 
  HomeworkItem, 
  TeacherFeedbackItem, 
  fetchAssignedStudents, 
  fetchStudentHomework, 
  fetchStudentFeedback
} from '../services/teacherStudentService';
import { StudentCard } from './teacher/StudentCard';
import { StudentHomeworkTab } from './teacher/StudentHomeworkTab';
import { StudentFeedbackTab } from './teacher/StudentFeedbackTab';
import { LinkStudentModal } from './teacher/LinkStudentModal';

interface TeacherInsightsPanelProps {
  selectedLang: 'EN' | 'ES';
  onNavigateTab?: (tab: 'home' | 'chat' | 'progress' | 'roadmap' | 'teachers' | 'settings') => void;
  onOpenAuthModal?: () => void;
  chatMessages?: any[];
  isPaused?: boolean;
  isConnected?: boolean;
  pause?: () => void;
  resume?: () => void;
  onAskVoyager?: (text: string) => void;
  scores?: any;
  learnedWords?: string[];
  accentPatterns?: string[];
}

export const TeacherInsightsPanel: React.FC<TeacherInsightsPanelProps> = ({
  selectedLang,
  onOpenAuthModal,
  onAskVoyager
}) => {
  const [currentUser, setCurrentUser] = useState<any>(auth.currentUser);
  const [assignedStudents, setAssignedStudents] = useState<StudentSummary[]>([]);
  const [isLoadingStudents, setIsLoadingStudents] = useState<boolean>(true);
  const [selectedStudent, setSelectedStudent] = useState<StudentSummary | null>(null);

  const triggerTeacherOralReport = (student: StudentSummary | null) => {
    if (!student) return;
    const studentName = student.name || 'Estudiante';
    const level = student.cefrLevel || student.levelEstimate || 'Intermedio';
    const goal = student.goal || 'Conversación general';
    
    const pron = student.scores?.pronunciation ?? 82;
    const gram = student.scores?.grammar ?? 74;
    const flu = student.scores?.naturalness ?? 74;
    const conf = student.scores?.confidence ?? 68;

    const reportPrompt = `[INSTRUCCIÓN DE SISTEMA MANDATORIA: INFORME ORAL PARA PROFESOR]
El docente ha solicitado el informe del estudiante ${studentName}.
Habla en voz alta con tu voz natural de Voyager para darle al profesor un resumen oral muy corto, claro y profesional (de 20 a 30 segundos) en español sobre el estado y rendimiento de este estudiante.

INFORMACIÓN DEL ESTUDIANTE PARA EL PROFESOR:
- Estudiante: ${studentName}
- Nivel CEFR: ${level}
- Meta: ${goal}
- Métrica Pronunciación: ${pron}%
- Métrica Gramática: ${gram}%
- Métrica Fluidez: ${flu}%
- Métrica Confianza: ${conf}%

REGLAS STRICTAS E INQUEBRANTABLES DE RESUMEN PARA DOCENTES:
1. PROHIBIDO DAR CLASES O ENSEÑAR INGLÉS: Este espacio es únicamente para explicar el progreso del estudiante según sus datos al profesor. Queda estrictamente prohibido dar lecciones o prácticas de inglés aquí.
2. RESUMEN CLARO DE PROGRESO: Explica si el alumno está al día o si se está quedando atrás en alguna métrica concreta (por ejemplo, buena pronunciación del ${pron}%, pero área de oportunidad en confianza del ${conf}% o fluidez del ${flu}%).
3. RECOMENDACIÓN PEDAGÓGICA SOBRE DATOS: Proporciona una recomendación pedagógica concisa sobre en qué área debería enfocarse en sus próximas lecciones.
4. HONESTIDAD TOTAL SOBRE PROGRESO HISTÓRICO: Si no hay un historial acumulado de varios meses de este estudiante, acláralo explícitamente al profesor explicando que estos datos corresponden a su punto de partida base y que requerirá más sesiones acumuladas para evaluar tendencias históricas.`;

    if (typeof onAskVoyager === 'function') {
      onAskVoyager(reportPrompt);
    }
  };

  // Search & Filters
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [levelFilter, setLevelFilter] = useState<string>('ALL');

  // Selected student data
  const [studentHomework, setStudentHomework] = useState<HomeworkItem[]>([]);
  const [studentFeedback, setStudentFeedback] = useState<TeacherFeedbackItem[]>([]);
  const [isLoadingDetails, setIsLoadingDetails] = useState<boolean>(false);
  const [activeDetailTab, setActiveDetailTab] = useState<'homework' | 'feedback' | 'metrics'>('homework');

  // Link student modal
  const [showLinkModal, setShowLinkModal] = useState<boolean>(false);

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((user) => {
      setCurrentUser(user);
    });
    return () => unsubscribe();
  }, []);

  const loadStudents = async () => {
    if (!currentUser) {
      setAssignedStudents([]);
      setIsLoadingStudents(false);
      return;
    }

    setIsLoadingStudents(true);
    try {
      const students = await fetchAssignedStudents(currentUser.uid, currentUser.email || undefined);
      setAssignedStudents(students);
      if (students.length > 0 && !selectedStudent) {
        setSelectedStudent(students[0]);
      } else if (students.length === 0) {
        setSelectedStudent(null);
      }
    } catch (err) {
      console.error('Failed to load students:', err);
      setAssignedStudents([]);
    } finally {
      setIsLoadingStudents(false);
    }
  };

  useEffect(() => {
    loadStudents();
  }, [currentUser]);

  useEffect(() => {
    if (!selectedStudent) {
      setStudentHomework([]);
      setStudentFeedback([]);
      return;
    }

    let isMounted = true;
    const loadDetails = async () => {
      setIsLoadingDetails(true);
      try {
        const [hw, fb] = await Promise.all([
          fetchStudentHomework(selectedStudent.id),
          fetchStudentFeedback(selectedStudent.id)
        ]);
        if (isMounted) {
          setStudentHomework(hw);
          setStudentFeedback(fb);
        }
      } catch (err) {
        console.error('Failed to load student details:', err);
      } finally {
        if (isMounted) setIsLoadingDetails(false);
      }
    };

    loadDetails();
    return () => { isMounted = false; };
  }, [selectedStudent]);

  const filteredStudents = assignedStudents.filter(student => {
    const q = searchQuery.toLowerCase().trim();
    const matchesSearch = !q || 
      student.name.toLowerCase().includes(q) || 
      student.email.toLowerCase().includes(q) ||
      (student.cefrLevel && student.cefrLevel.toLowerCase().includes(q));

    const studentLevel = (student.cefrLevel || student.levelEstimate || 'NONE').toUpperCase();
    const matchesLevel = levelFilter === 'ALL' || 
      (levelFilter === 'NONE' ? (!student.cefrLevel && !student.levelEstimate) : studentLevel.includes(levelFilter));

    return matchesSearch && matchesLevel;
  });

  const isTeacherAdmin = currentUser?.email?.toLowerCase() === ADMIN_CREDENTIALS.email;

  const renderScoreMetric = (label: string, scoreVal: number | undefined) => {
    const hasScore = typeof scoreVal === 'number' && !isNaN(scoreVal);
    return (
      <div className="p-3 bg-neutral-50 rounded-xl border border-neutral-200 text-left">
        <div className="text-[11px] uppercase tracking-wider font-semibold text-neutral-500 mb-1">
          {label}
        </div>
        {hasScore ? (
          <div className="flex items-baseline gap-1.5">
            <span className="text-xl font-black text-neutral-900 font-mono">{Math.round(scoreVal)}%</span>
            <span className="text-xs text-emerald-600 font-medium font-sans">
              {scoreVal >= 80 ? (selectedLang === 'EN' ? 'Advanced' : 'Avanzado') : (selectedLang === 'EN' ? 'In Progress' : 'En Progreso')}
            </span>
          </div>
        ) : (
          <div className="flex items-center gap-1 text-neutral-400">
            <span className="text-sm font-semibold">—</span>
            <span className="text-xs italic">({selectedLang === 'EN' ? 'Unavailable' : 'No disponible'})</span>
          </div>
        )}
      </div>
    );
  };

  return (
    <div id="teacher-management-dashboard" className="w-full flex-1 flex flex-col bg-white text-neutral-900 text-left font-sans">
      {/* 🧭 Top Teacher Header Bar */}
      <header id="teacher-portal-header" className="border-b border-neutral-200 px-4 sm:px-6 py-4 bg-neutral-50/50">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-neutral-900 text-white flex items-center justify-center shadow-sm">
              <GraduationCap className="w-5 h-5 text-amber-400" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-lg sm:text-xl font-bold text-neutral-900 tracking-tight">
                  {selectedLang === 'EN' ? 'Teacher Student Management' : 'Gestión Docente de Estudiantes'}
                </h1>
                <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-semibold bg-neutral-900 text-amber-300 font-mono uppercase tracking-wider">
                  {isTeacherAdmin ? 'Admin / Docente' : 'Docente'}
                </span>
              </div>
              <p className="text-xs text-neutral-500">
                {currentUser 
                  ? (selectedLang === 'EN' ? `Signed in as: ${currentUser.email}` : `Sesión activa: ${currentUser.email}`)
                  : (selectedLang === 'EN' ? 'Sign in required to manage students' : 'Inicia sesión para gestionar a tus alumnos')}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 self-start sm:self-auto">
            {currentUser ? (
              <>
                <button
                  id="btn-refresh-roster"
                  onClick={loadStudents}
                  title={selectedLang === 'EN' ? 'Refresh Roster' : 'Actualizar Lista'}
                  className="p-2 text-neutral-600 hover:text-neutral-900 hover:bg-neutral-200 rounded-lg transition-colors"
                >
                  <RefreshCw className={`w-4 h-4 ${isLoadingStudents ? 'animate-spin' : ''}`} />
                </button>
                <button
                  id="btn-link-student-modal"
                  onClick={() => setShowLinkModal(true)}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-neutral-900 hover:bg-neutral-800 text-white text-xs font-semibold rounded-lg transition-all shadow-sm"
                >
                  <UserPlus className="w-3.5 h-3.5 text-amber-300" />
                  <span>{selectedLang === 'EN' ? 'Link Student' : 'Vincular Estudiante'}</span>
                </button>
              </>
            ) : (
              <button
                id="btn-teacher-signin"
                onClick={() => onOpenAuthModal && onOpenAuthModal()}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-neutral-900 text-amber-300 text-xs font-bold rounded-lg shadow-sm hover:bg-neutral-800 transition-colors"
              >
                <UserCheck className="w-4 h-4" />
                <span>{selectedLang === 'EN' ? 'Sign In as Teacher' : 'Iniciar Sesión Docente'}</span>
              </button>
            )}
          </div>
        </div>
      </header>

      {/* 🔐 Notice if not authenticated */}
      {!currentUser && (
        <div id="teacher-auth-banner" className="m-4 sm:m-6 p-5 rounded-2xl bg-amber-50 border border-amber-200 text-amber-950 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
            <div>
              <h3 className="text-sm font-bold text-amber-900">
                {selectedLang === 'EN' ? 'Teacher Authentication Required' : 'Autenticación Docente Requerida'}
              </h3>
              <p className="text-xs text-amber-800/90 mt-0.5">
                {selectedLang === 'EN' 
                  ? 'To view assigned students, verify CEFR levels, assign homework, and post feedback securely, please sign in with your teacher account.'
                  : 'Para ver tus estudiantes asignados, consultar niveles CEFR, asignar tareas y enviar retroalimentación segura, inicia sesión con tu cuenta de docente.'}
              </p>
            </div>
          </div>
          <button
            id="btn-auth-banner-login"
            onClick={() => onOpenAuthModal && onOpenAuthModal()}
            className="px-4 py-2 bg-amber-700 hover:bg-amber-800 text-white font-semibold text-xs rounded-xl shadow-sm transition-colors whitespace-nowrap"
          >
            {selectedLang === 'EN' ? 'Sign In' : 'Iniciar Sesión'}
          </button>
        </div>
      )}

      {/* 🚀 Main Master-Detail Layout */}
      <div id="teacher-dashboard-body" className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* 📋 Column Left: Student Roster (5 cols) */}
        <section id="students-roster-column" className="lg:col-span-5 flex flex-col gap-4">
          {/* Search & Level Filters */}
          <div className="bg-white p-4 rounded-2xl border border-neutral-200 shadow-sm space-y-3">
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
              <input
                id="input-search-students"
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={selectedLang === 'EN' ? 'Search by name, email, level...' : 'Buscar por nombre, correo o nivel...'}
                className="w-full pl-9 pr-3 py-2 bg-neutral-50 border border-neutral-200 rounded-xl text-xs text-neutral-800 placeholder-neutral-400 focus:outline-none focus:ring-2 focus:ring-neutral-900 transition-all"
              />
              {searchQuery && (
                <button 
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-600 text-xs"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* CEFR Level Filters */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
              <span className="text-[11px] font-semibold text-neutral-500 uppercase tracking-wider pr-1">
                {selectedLang === 'EN' ? 'Level:' : 'Nivel:'}
              </span>
              {['ALL', 'A1', 'A2', 'B1', 'B2', 'C1', 'NONE'].map((lvl) => (
                <button
                  key={lvl}
                  id={`filter-level-${lvl.toLowerCase()}`}
                  onClick={() => setLevelFilter(lvl)}
                  className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all whitespace-nowrap ${
                    levelFilter === lvl
                      ? 'bg-neutral-900 text-white shadow-xs'
                      : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200'
                  }`}
                >
                  {lvl === 'ALL' ? (selectedLang === 'EN' ? 'All' : 'Todos') : lvl === 'NONE' ? (selectedLang === 'EN' ? 'Unset' : 'Sin Nivel') : lvl}
                </button>
              ))}
            </div>
          </div>

          <div className="flex items-center justify-between px-1">
            <span className="text-xs font-bold uppercase tracking-wider text-neutral-500 font-mono">
              {selectedLang === 'EN' 
                ? `Assigned Students (${filteredStudents.length})` 
                : `Estudiantes Asignados (${filteredStudents.length})`}
            </span>
            {isLoadingStudents && (
              <span className="text-[11px] text-neutral-400 flex items-center gap-1">
                <RefreshCw className="w-3 h-3 animate-spin" />
                {selectedLang === 'EN' ? 'Loading...' : 'Cargando...'}
              </span>
            )}
          </div>

          {/* Cards List */}
          <div id="student-cards-container" className="space-y-2.5">
            {isLoadingStudents ? (
              <div className="p-8 text-center bg-neutral-50 rounded-2xl border border-neutral-200">
                <RefreshCw className="w-6 h-6 animate-spin text-neutral-400 mx-auto mb-2" />
                <p className="text-xs text-neutral-500 font-medium">
                  {selectedLang === 'EN' ? 'Retrieving assigned students from database...' : 'Consultando estudiantes asignados en la base de datos...'}
                </p>
              </div>
            ) : filteredStudents.length === 0 ? (
              /* Honest Empty State */
              <div id="students-empty-state" className="p-6 text-center bg-neutral-50 rounded-2xl border border-neutral-200">
                <div className="w-12 h-12 rounded-2xl bg-amber-100 text-amber-800 flex items-center justify-center mx-auto mb-3">
                  <Users className="w-6 h-6" />
                </div>
                <h4 className="text-sm font-bold text-neutral-900 mb-1">
                  {selectedLang === 'EN' ? 'No Assigned Students Found' : 'No Tienes Estudiantes Asignados'}
                </h4>
                <p className="text-xs text-neutral-500 max-w-sm mx-auto leading-relaxed mb-4">
                  {assignedStudents.length === 0
                    ? (selectedLang === 'EN'
                        ? 'Your assigned student roster is currently empty. When students are linked to your teacher profile, they will appear here with real metrics.'
                        : 'Tu lista de alumnos está vacía actualmente. Los estudiantes vinculados a tu cuenta docente aparecerán aquí con sus métricas reales.')
                    : (selectedLang === 'EN'
                        ? 'No students match your current search and level filter criteria.'
                        : 'Ningún estudiante coincide con el término de búsqueda o filtro seleccionado.')}
                </p>
                {currentUser && assignedStudents.length === 0 && (
                  <button
                    id="btn-empty-state-link"
                    onClick={() => setShowLinkModal(true)}
                    className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-neutral-900 text-amber-300 hover:bg-neutral-800 text-xs font-bold rounded-lg transition-colors"
                  >
                    <UserPlus className="w-3.5 h-3.5" />
                    <span>{selectedLang === 'EN' ? 'Link an Enrolled Student' : 'Vincular Estudiante Inscrito'}</span>
                  </button>
                )}
              </div>
            ) : (
              filteredStudents.map((student) => (
                <StudentCard
                  key={student.id}
                  student={student}
                  isSelected={selectedStudent?.id === student.id}
                  selectedLang={selectedLang}
                  onSelect={() => {
                    setSelectedStudent(student);
                    triggerTeacherOralReport(student);
                  }}
                  onHearReport={(st) => triggerTeacherOralReport(st)}
                />
              ))
            )}
          </div>
        </section>

        {/* 🔍 Column Right: Selected Student Details (7 cols) */}
        <section id="student-detail-column" className="lg:col-span-7 flex flex-col gap-5">
          {selectedStudent ? (
            <div id="student-selected-card" className="bg-white rounded-2xl border border-neutral-200 shadow-sm overflow-hidden">
              {/* Header */}
              <div className="p-5 border-b border-neutral-200 bg-neutral-50">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex items-center gap-3.5">
                    <div 
                      onClick={() => triggerTeacherOralReport(selectedStudent)}
                      className="w-12 h-12 rounded-2xl bg-neutral-900 text-amber-300 font-black text-lg flex items-center justify-center shadow-xs cursor-pointer hover:scale-105 transition-transform relative group/avatar"
                      title={selectedLang === 'EN' ? 'Click photo to hear Voyager oral report' : 'Haz clic en la foto para escuchar el informe oral de Voyager'}
                    >
                      {selectedStudent.name.charAt(0).toUpperCase()}
                      <div className="absolute inset-0 bg-black/30 rounded-2xl opacity-0 group-hover/avatar:opacity-100 transition-opacity flex items-center justify-center pointer-events-none">
                        <Volume2 className="w-5 h-5 text-amber-300 animate-pulse" />
                      </div>
                    </div>
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="text-base sm:text-lg font-bold text-neutral-900">
                          {selectedStudent.name}
                        </h3>
                        {selectedStudent.cefrLevel || selectedStudent.levelEstimate ? (
                          <span className="px-2 py-0.5 rounded-md text-xs font-bold font-mono bg-amber-100 text-amber-900 uppercase">
                            CEFR {selectedStudent.cefrLevel || selectedStudent.levelEstimate}
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded-md text-[11px] font-medium bg-neutral-200 text-neutral-600">
                            {selectedLang === 'EN' ? 'Not Assessed' : 'Sin Evaluar'}
                          </span>
                        )}

                        <button
                          type="button"
                          onClick={() => triggerTeacherOralReport(selectedStudent)}
                          className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-amber-500/15 hover:bg-amber-500/25 border border-amber-500/40 text-amber-900 rounded-lg text-xs font-bold transition-all cursor-pointer shadow-xs active:scale-95"
                          title={selectedLang === 'EN' ? 'Listen to Voyager oral summary' : 'Escuchar informe oral de Voyager'}
                        >
                          <Volume2 className="w-3.5 h-3.5 text-amber-600 animate-pulse" />
                          <span>{selectedLang === 'EN' ? 'Oral Report' : 'Informe Oral'}</span>
                        </button>
                      </div>
                      <div className="flex items-center gap-2 text-xs text-neutral-500 mt-0.5">
                        <Mail className="w-3.5 h-3.5" />
                        <span>{selectedStudent.email}</span>
                        {selectedStudent.goal && (
                          <>
                            <span>•</span>
                            <span className="text-neutral-700 font-medium truncate max-w-[200px]">
                              {selectedStudent.goal}
                            </span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="text-left sm:text-right text-xs text-neutral-500">
                    <div>{selectedLang === 'EN' ? 'Student ID:' : 'ID Alumno:'}</div>
                    <div className="font-mono font-medium text-neutral-800 text-[11px] truncate max-w-[160px]">
                      {selectedStudent.id}
                    </div>
                  </div>
                </div>

                {/* Score Metrics */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 mt-4">
                  {renderScoreMetric(selectedLang === 'EN' ? 'Pronunciation' : 'Pronunciación', selectedStudent.scores?.pronunciation)}
                  {renderScoreMetric(selectedLang === 'EN' ? 'Grammar' : 'Gramática', selectedStudent.scores?.grammar)}
                  {renderScoreMetric(selectedLang === 'EN' ? 'Fluency' : 'Fluidez', selectedStudent.scores?.naturalness)}
                  {renderScoreMetric(selectedLang === 'EN' ? 'Confidence' : 'Confianza', selectedStudent.scores?.confidence)}
                </div>
              </div>

              {/* Subtabs */}
              <div className="border-b border-neutral-200 px-5 flex items-center gap-4 bg-white text-xs font-bold">
                <button
                  id="tab-homework-management"
                  onClick={() => setActiveDetailTab('homework')}
                  className={`py-3 border-b-2 transition-all flex items-center gap-1.5 ${
                    activeDetailTab === 'homework'
                      ? 'border-neutral-900 text-neutral-900'
                      : 'border-transparent text-neutral-500 hover:text-neutral-700'
                  }`}
                >
                  <BookOpen className="w-3.5 h-3.5" />
                  <span>{selectedLang === 'EN' ? 'Assigned Homework' : 'Tareas Asignadas'}</span>
                  <span className="ml-1 px-1.5 py-0.2 rounded-full text-[10px] bg-neutral-100 text-neutral-700 font-mono">
                    {studentHomework.length}
                  </span>
                </button>

                <button
                  id="tab-feedback-management"
                  onClick={() => setActiveDetailTab('feedback')}
                  className={`py-3 border-b-2 transition-all flex items-center gap-1.5 ${
                    activeDetailTab === 'feedback'
                      ? 'border-neutral-900 text-neutral-900'
                      : 'border-transparent text-neutral-500 hover:text-neutral-700'
                  }`}
                >
                  <MessageSquare className="w-3.5 h-3.5" />
                  <span>{selectedLang === 'EN' ? 'Teacher Feedback' : 'Retroalimentación y Notas'}</span>
                  <span className="ml-1 px-1.5 py-0.2 rounded-full text-[10px] bg-neutral-100 text-neutral-700 font-mono">
                    {studentFeedback.length}
                  </span>
                </button>

                <button
                  id="tab-record-management"
                  onClick={() => setActiveDetailTab('metrics')}
                  className={`py-3 border-b-2 transition-all flex items-center gap-1.5 ${
                    activeDetailTab === 'metrics'
                      ? 'border-neutral-900 text-neutral-900'
                      : 'border-transparent text-neutral-500 hover:text-neutral-700'
                  }`}
                >
                  <FileText className="w-3.5 h-3.5" />
                  <span>{selectedLang === 'EN' ? 'Student Record' : 'Expediente'}</span>
                </button>
              </div>

              {/* Subtab Body */}
              <div className="p-5">
                {isLoadingDetails ? (
                  <div className="p-6 text-center text-xs text-neutral-400 flex items-center justify-center gap-2">
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>{selectedLang === 'EN' ? 'Loading student records...' : 'Cargando registros del estudiante...'}</span>
                  </div>
                ) : (
                  <>
                    {activeDetailTab === 'homework' && (
                      <StudentHomeworkTab
                        selectedStudent={selectedStudent}
                        currentUser={currentUser}
                        selectedLang={selectedLang}
                        homeworkList={studentHomework}
                        onHomeworkUpdated={(newItems) => setStudentHomework(newItems)}
                      />
                    )}

                    {activeDetailTab === 'feedback' && (
                      <StudentFeedbackTab
                        selectedStudent={selectedStudent}
                        currentUser={currentUser}
                        selectedLang={selectedLang}
                        feedbackList={studentFeedback}
                        onFeedbackUpdated={(newItems) => setStudentFeedback(newItems)}
                      />
                    )}

                    {activeDetailTab === 'metrics' && (
                      <div className="space-y-4 text-left">
                        <h4 className="text-xs font-bold uppercase tracking-wider text-neutral-700 font-mono">
                          {selectedLang === 'EN' ? 'Enrolled Student Profile & Academic Details' : 'Expediente del Estudiante y Datos de Inscripción'}
                        </h4>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                          <div className="p-3 bg-neutral-50 rounded-xl border border-neutral-200">
                            <div className="text-[11px] font-semibold text-neutral-500 mb-0.5">{selectedLang === 'EN' ? 'Learning Goal' : 'Meta de Aprendizaje'}</div>
                            <div className="font-medium text-neutral-900">{selectedStudent.goal || (selectedLang === 'EN' ? 'Not specified' : 'No especificada')}</div>
                          </div>

                          <div className="p-3 bg-neutral-50 rounded-xl border border-neutral-200">
                            <div className="text-[11px] font-semibold text-neutral-500 mb-0.5">{selectedLang === 'EN' ? 'Time Commitment' : 'Dedicación Semanal'}</div>
                            <div className="font-medium text-neutral-900">{selectedStudent.timePerWeek || (selectedLang === 'EN' ? 'Not specified' : 'No especificada')}</div>
                          </div>

                          <div className="p-3 bg-neutral-50 rounded-xl border border-neutral-200">
                            <div className="text-[11px] font-semibold text-neutral-500 mb-0.5">{selectedLang === 'EN' ? 'CEFR Level Target' : 'Nivel CEFR'}</div>
                            <div className="font-medium text-neutral-900">{selectedStudent.cefrLevel || selectedStudent.levelEstimate || (selectedLang === 'EN' ? 'Pending Initial Diagnostic' : 'Diagnóstico Inicial Pendiente')}</div>
                          </div>

                          <div className="p-3 bg-neutral-50 rounded-xl border border-neutral-200">
                            <div className="text-[11px] font-semibold text-neutral-500 mb-0.5">{selectedLang === 'EN' ? 'Education / Category' : 'Educación / Categoría'}</div>
                            <div className="font-medium text-neutral-900">{selectedStudent.education || selectedStudent.category || (selectedLang === 'EN' ? 'General' : 'General')}</div>
                          </div>
                        </div>

                        {selectedStudent.interests && (
                          <div className="p-3 bg-neutral-50 rounded-xl border border-neutral-200 text-xs">
                            <div className="text-[11px] font-semibold text-neutral-500 mb-0.5">{selectedLang === 'EN' ? 'Interests & Topics' : 'Intereses y Temas'}</div>
                            <div className="text-neutral-800">{selectedStudent.interests}</div>
                          </div>
                        )}
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>
          ) : (
            <div id="no-student-selected" className="p-12 text-center bg-neutral-50 rounded-2xl border border-dashed border-neutral-300 text-neutral-500">
              <Users className="w-10 h-10 text-neutral-300 mx-auto mb-2" />
              <h4 className="text-sm font-bold text-neutral-800 mb-1">
                {selectedLang === 'EN' ? 'Select a Student' : 'Selecciona un Estudiante'}
              </h4>
              <p className="text-xs max-w-xs mx-auto leading-relaxed">
                {selectedLang === 'EN'
                  ? 'Choose a student from the roster on the left to review their performance metrics, manage assignments, and post feedback.'
                  : 'Elige un estudiante de la lista a la izquierda para consultar sus métricas, gestionar tareas y enviar retroalimentación.'}
              </p>
            </div>
          )}
        </section>
      </div>

      {/* Modal for Linking Student */}
      {showLinkModal && (
        <LinkStudentModal
          currentUser={currentUser}
          selectedLang={selectedLang}
          onClose={() => setShowLinkModal(false)}
          onStudentLinked={() => {
            loadStudents();
          }}
        />
      )}
    </div>
  );
};
