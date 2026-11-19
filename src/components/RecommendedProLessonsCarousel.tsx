import React, { useState, useEffect } from 'react';
import { 
  ArrowRight, 
  X, 
  BookOpen, 
  CheckCircle2, 
  Clock, 
  Trash2, 
  ExternalLink, 
  Copy, 
  Check, 
  FileText, 
  Loader2, 
  GraduationCap, 
  Sparkles, 
  Compass, 
  Bookmark, 
  BookmarkCheck,
  AlertCircle,
  MessageSquareQuote,
  ChevronLeft,
  ChevronRight,
  ClipboardList,
  Square,
  CheckSquare,
  Play,
  Info
} from 'lucide-react';
import { createGoogleDoc } from '../services/googleDocsService';
import { VoyagerFundamentalsCard } from './VoyagerFundamentalsCard';
import { VoyagerFundamentalsModal } from './VoyagerFundamentalsModal';
import { VOYAGER_FUNDAMENTALS_LESSONS, FundamentalsLesson } from '../data/voyagerFundamentalsData';
import { getMasterLessons } from '../data/masterLessonsData';
import { 
  UnifiedAssignment, 
  fetchUnifiedStudentAssignments, 
  updateUnifiedAssignmentStatus,
  FetchAssignmentsResult
} from '../services/teacherStudentService';

export interface UserProfile {
  id?: string;
  uid?: string;
  name?: string;
  firstName?: string;
  lastName?: string;
  email?: string;
  englishLevel?: string;
  cefrLevel?: string;
  learningGoal?: string;
  interests?: string;
  completedDays?: number[];
  [key: string]: any;
}

export interface ActiveLesson {
  id: string;
  lessonId: string;
  title: string;
  subtitle: string;
  category: string;
  level: string;
  estimatedMinutes: number;
  objective: string;
  scenario: string;
  status: 'in_progress' | 'completed';
  progressPercentage?: number;
  startedAt: string;
  completedAt?: string;
}

interface RecommendedProLessonsCarouselProps {
  user: UserProfile;
  scores?: {
    pronunciation?: number;
    fluency?: number;
    vocabulary?: number;
    confidence?: number;
  };
  pronunciationScore?: number;
  civicsScore?: number;
  selectedLang: string;
  onAskVoyager?: (text: string) => void;
  onStartLesson?: (lesson: any, assignment?: any) => void;
  hideHeader?: boolean;
}

export interface ProLesson {
  id: string;
  title: string;
  subtitle: string;
  category: string;
  skillImproved: string;
  objective: string;
  whatItIs: string;
  perfectMatchReason?: string;
  keyOutcomes?: string[];
  level: string; // Genuine CEFR level
  estimatedMinutes: number;
  tags?: string[];
  imageUrl?: string;
  instructions?: string;
}

export const RecommendedProLessonsCarousel: React.FC<RecommendedProLessonsCarouselProps> = ({
  user,
  scores,
  pronunciationScore,
  civicsScore,
  selectedLang,
  onAskVoyager,
  onStartLesson,
  hideHeader = false,
}) => {
  // ───────────────────────────────────────────────────────────────────────────
  // STATE MANAGEMENT
  // ───────────────────────────────────────────────────────────────────────────
  const [selectedLesson, setSelectedLesson] = useState<ProLesson | null>(null);
  const [selectedFundamentalsLesson, setSelectedFundamentalsLesson] = useState<FundamentalsLesson | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [playingLessonId, setPlayingLessonId] = useState<string | null>(null);

  // Unified Assignments State
  const [assignmentData, setAssignmentData] = useState<FetchAssignmentsResult>({
    assignments: [],
    source: 'empty',
    isDemoMode: false
  });
  const [isAssignmentsLoading, setIsAssignmentsLoading] = useState(true);
  const [selectedAssignment, setSelectedAssignment] = useState<UnifiedAssignment | null>(null);

  // Scenario Selector inside modal
  const [selectedScenarioOption, setSelectedScenarioOption] = useState<string>('default');
  const [customScenarioText, setCustomScenarioText] = useState<string>('');

  // Catalog Tab State & Pagination (3 tabs: Asignadas, Por completar, Completadas)
  type CatalogTabType = 'assigned' | 'to_complete' | 'completed';
  const [activeTab, setActiveTab] = useState<CatalogTabType>('assigned');
  const [catalogPage, setCatalogPage] = useState<number>(1);
  const [detailedItemIndex, setDetailedItemIndex] = useState<number | null>(null);
  const itemsPerPage = 8;
  const [selectedLessonRelevance, setSelectedLessonRelevance] = useState<{ score: number; reasonEN: string; reasonES: string } | null>(null);

  // Explore Filter Category: 'all' | 'career' | 'civics' | 'daily' | 'travel' | 'health' | 'saved'
  const [exploreCategory, setExploreCategory] = useState<string>('all');

  // Active / Saved Lessons in LocalStorage
  const [myLessons, setMyLessons] = useState<ActiveLesson[]>(() => {
    if (typeof window === 'undefined') return [];
    try {
      const saved = localStorage.getItem('voyager_active_lessons');
      if (saved) return JSON.parse(saved);
    } catch (e) {}
    return [];
  });

  const saveMyLessonsToStorage = (updatedList: ActiveLesson[]) => {
    setMyLessons(updatedList);
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem('voyager_active_lessons', JSON.stringify(updatedList));
        window.dispatchEvent(new Event('voyager_active_lessons_updated'));
      } catch (e) {}
    }
  };

  // Google NotebookLM & Google Doc states
  const [copiedNotebookSource, setCopiedNotebookSource] = useState(false);
  const [isExportingGoogleDoc, setIsExportingGoogleDoc] = useState(false);

  // ───────────────────────────────────────────────────────────────────────────
  // LOAD TEACHER ASSIGNMENTS (Unified Data-Provider Architecture)
  // ───────────────────────────────────────────────────────────────────────────
  const loadAssignments = async () => {
    setIsAssignmentsLoading(true);
    try {
      const studentId = user?.id || user?.uid || 'STU-001';
      const studentEmail = user?.email || 'theorangesnowman@gmail.com';
      const result = await fetchUnifiedStudentAssignments(studentId, studentEmail);
      setAssignmentData(result);
    } catch (err) {
      console.error('Failed to load unified assignments:', err);
      setAssignmentData({
        assignments: [],
        source: 'empty',
        isDemoMode: false,
        error: 'Error loading assignments'
      });
    } finally {
      setIsAssignmentsLoading(false);
    }
  };

  useEffect(() => {
    loadAssignments();

    const handleAssignmentsUpdated = () => {
      loadAssignments();
    };

    window.addEventListener('voyager_assignments_updated', handleAssignmentsUpdated);
    return () => {
      window.removeEventListener('voyager_assignments_updated', handleAssignmentsUpdated);
    };
  }, [user?.id, user?.uid, user?.email]);

  // Sync active lessons
  useEffect(() => {
    const syncActiveLessons = () => {
      if (typeof window !== 'undefined') {
        try {
          const saved = localStorage.getItem('voyager_active_lessons');
          if (saved) setMyLessons(JSON.parse(saved));
        } catch (e) {}
      }
    };
    window.addEventListener('voyager_active_lessons_updated', syncActiveLessons);
    window.addEventListener('storage', syncActiveLessons);
    return () => {
      window.removeEventListener('voyager_active_lessons_updated', syncActiveLessons);
      window.removeEventListener('storage', syncActiveLessons);
    };
  }, []);

  // ───────────────────────────────────────────────────────────────────────────
  // SCORES & PROFILE METRICS
  // ───────────────────────────────────────────────────────────────────────────
  const getPct = (val?: number, fallback: number = 80) => {
    if (val === undefined || val === null || val <= 0) return fallback;
    if (val <= 5) return Math.min(100, Math.round(val * 20));
    return Math.min(100, Math.round(val));
  };

  const pronunciation = getPct(scores?.pronunciation || pronunciationScore, 82);
  const fluency = getPct(scores?.fluency, 74);
  const vocabulary = getPct(scores?.vocabulary, 88);
  const confidence = getPct(scores?.confidence, 68);
  const civics = getPct(civicsScore, 15);
  const currentLevel = user?.englishLevel || user?.cefrLevel || 'B2';
  const learningGoal = user?.learningGoal || (selectedLang === 'EN' ? 'Travel & Daily Conversation' : 'Viajes y Conversación Diaria');
  const interests = user?.interests || (selectedLang === 'EN' ? 'Travel, technology, business' : 'Viajes, tecnología, negocios');

  // ───────────────────────────────────────────────────────────────────────────
  // MASTER LESSON CATALOG (Authentic CEFR levels, relevant images & pedagogy)
  // ───────────────────────────────────────────────────────────────────────────
  const allMasterLessons: ProLesson[] = getMasterLessons(selectedLang as any) as ProLesson[];

  const getLessonImageUrl = (lessonId: string, category?: string): string => {
    const match = allMasterLessons.find(l => l.id === lessonId);
    if (match?.imageUrl) return match.imageUrl;
    const cat = (category || '').toLowerCase();
    if (cat.includes('civic') || cat.includes('cívic')) {
      return '/assets/lessons/cat-american-flag.svg';
    }
    if (cat.includes('career') || cat.includes('negocio')) {
      return '/assets/lessons/cat-career-bright.svg';
    }
    if (cat.includes('travel') || cat.includes('viaje')) {
      return '/assets/lessons/cat-airport-tsa.svg';
    }
    if (cat.includes('health') || cat.includes('salud')) {
      return '/assets/lessons/cat-doctor-pharmacy.svg';
    }
    return '/assets/lessons/cat-career-bright.svg';
  };

  // Maps any lesson category to its authentic Spanish lowercase topic name
  const getTopicInSpanish = (category: string): string => {
    const c = (category || '').trim().toLowerCase();
    if (c.includes('civic') || c.includes('cívic') || c.includes('right') || c.includes('derecho') || c.includes('government') || c.includes('gobierno') || c.includes('constitu')) {
      return 'cívica y derechos';
    }
    if (c.includes('career') || c.includes('carrera') || c.includes('business') || c.includes('negocio') || c.includes('trabajo') || c.includes('interview')) {
      return 'negocios y carrera';
    }
    if (c.includes('health') || c.includes('salud') || c.includes('medical') || c.includes('médic')) {
      return 'salud y bienestar';
    }
    if (c.includes('travel') || c.includes('viaje') || c.includes('transit') || c.includes('tránsito') || c.includes('airport')) {
      return 'viajes y tránsito';
    }
    if (c.includes('daily') || c.includes('vida diaria') || c.includes('living') || c.includes('rutina')) {
      return 'vida diaria';
    }
    if (c.includes('finance') || c.includes('finanza') || c.includes('bank') || c.includes('banca') || c.includes('dinero')) {
      return 'finanzas y banca';
    }
    if (c.includes('fluency') || c.includes('fluidez') || c.includes('pronun')) {
      return 'fluidez y pronunciación';
    }
    if (c.includes('tech') || c.includes('tecnolog')) {
      return 'tecnología';
    }
    if (c.includes('music') || c.includes('música')) {
      return 'música';
    }
    return c;
  };

  // ───────────────────────────────────────────────────────────────────────────
  // GENUINE PERSONALIZED RECOMMENDATION ENGINE
  // Ranks lessons based on student deficits, CEFR proximity, and goals.
  // ───────────────────────────────────────────────────────────────────────────
  const calculateRelevance = (lesson: ProLesson): { score: number; reasonEN: string; reasonES: string } => {
    let score = 50;
    let reasonEN = 'Recommended for your current level';
    let reasonES = 'Recomendada para tu nivel actual';

    // 1. Skill Deficit Ranking (Identify the student's weakest area)
    const deficits = [
      { skill: 'confidence', val: confidence, gap: 100 - confidence },
      { skill: 'fluency', val: fluency, gap: 100 - fluency },
      { skill: 'pronunciation', val: pronunciation, gap: 100 - pronunciation },
      { skill: 'vocabulary', val: vocabulary, gap: 100 - vocabulary },
      { skill: 'civics', val: civics, gap: 100 - civics },
    ].sort((a, b) => b.gap - a.gap);

    const primaryDeficit = deficits[0];

    const catLower = lesson.category.toLowerCase();
    const idLower = lesson.id.toLowerCase();
    const tags = lesson.tags || [];

    if (idLower === 'cat-confidence-drills' && primaryDeficit.skill === 'confidence') {
      score += 45;
      reasonEN = `Targeted for Speaking Confidence (${confidence}%)`;
      reasonES = `Priorizada para tu Confianza al Hablar (${confidence}%)`;
    } else if ((idLower === 'cat-connectors-flow' || tags.includes('flow')) && primaryDeficit.skill === 'fluency') {
      score += 45;
      reasonEN = `Targeted for Spoken Fluency (${fluency}%)`;
      reasonES = `Priorizada para mejorar tu Fluidez (${fluency}%)`;
    } else if ((idLower === 'cat-phonetics-th-v' || tags.includes('pronunciation')) && primaryDeficit.skill === 'pronunciation') {
      score += 45;
      reasonEN = `Targeted for Acoustic Pronunciation (${pronunciation}%)`;
      reasonES = `Priorizada para tu Pronunciación (${pronunciation}%)`;
    } else if (tags.includes('civics') && (learningGoal.toLowerCase().includes('citizen') || learningGoal.toLowerCase().includes('cívic') || civics < 60)) {
      score += 42;
      reasonEN = `Essential for US Citizenship Goal (${civics}% civics)`;
      reasonES = `Clave para tu meta de Ciudadanía (${civics}% cívica)`;
    }

    // 2. CEFR Proximity
    const getCefrRank = (lvl: string): number => {
      const l = lvl.toUpperCase();
      if (l.includes('C2')) return 6;
      if (l.includes('C1')) return 5;
      if (l.includes('B2')) return 4;
      if (l.includes('B1')) return 3;
      if (l.includes('A2')) return 2;
      if (l.includes('A1')) return 1;
      return 4;
    };

    const userRank = getCefrRank(currentLevel);
    const lessonRank = getCefrRank(lesson.level);
    const cefrDiff = Math.abs(userRank - lessonRank);
    if (cefrDiff === 0) {
      score += 24;
    } else if (cefrDiff === 1) {
      score += 14;
    } else {
      score -= cefrDiff * 10;
    }

    // 3. Learning Goal and Interests
    const goalLower = learningGoal.toLowerCase();
    const intLower = interests.toLowerCase();

    if (goalLower.includes('career') || goalLower.includes('trabajo') || goalLower.includes('interview')) {
      if (tags.includes('career') || tags.includes('business')) {
        score += 26;
        if (!reasonEN.includes('Targeted')) {
          reasonEN = `Aligned with your Career goal`;
          reasonES = `Alineada con tu meta de Carrera`;
        }
      }
    }

    if (goalLower.includes('travel') || goalLower.includes('viaje') || intLower.includes('travel') || intLower.includes('viaje')) {
      if (tags.includes('travel') || tags.includes('transit')) {
        score += 24;
        if (!reasonEN.includes('Targeted')) {
          reasonEN = `Aligned with your Travel goal`;
          reasonES = `Alineada con tu meta de Viajes`;
        }
      }
    }

    return { score, reasonEN, reasonES };
  };

  // Top 4 Recommended Lessons (Sorted strictly by relevance score)
  const recommendedLessons = [...allMasterLessons]
    .map(lesson => ({
      lesson,
      relevance: calculateRelevance(lesson)
    }))
    .sort((a, b) => b.relevance.score - a.relevance.score)
    .slice(0, 4);

  // Filtered list for "Explore Lessons" section
  const filteredExploreLessons = allMasterLessons.filter(lesson => {
    if (exploreCategory === 'all') return true;
    if (exploreCategory === 'career') return lesson.tags?.includes('career') || lesson.tags?.includes('business');
    if (exploreCategory === 'civics') return lesson.tags?.includes('civics');
    if (exploreCategory === 'health') return lesson.tags?.includes('health');
    if (exploreCategory === 'travel') return lesson.tags?.includes('travel') || lesson.tags?.includes('transit');
    if (exploreCategory === 'daily') return lesson.tags?.includes('daily');
    if (exploreCategory === 'saved') return myLessons.some(l => l.lessonId === lesson.id || l.id === lesson.id);
    return true;
  });

  // ───────────────────────────────────────────────────────────────────────────
  // ACTIONS: Audio Preview, Save, Start & Complete Lesson
  // ───────────────────────────────────────────────────────────────────────────
  const handlePlayLessonAudio = (e: React.MouseEvent, lesson: ProLesson) => {
    e.stopPropagation();
    if (playingLessonId === lesson.id) {
      if (typeof window !== 'undefined' && window.speechSynthesis) {
        window.speechSynthesis.cancel();
      }
      setPlayingLessonId(null);
      return;
    }

    setPlayingLessonId(lesson.id);

    // Cancel browser synthesis to prevent robotic speech
    if (typeof window !== 'undefined' && window.speechSynthesis) {
      try {
        window.speechSynthesis.cancel();
      } catch (err) {}
    }

    setTimeout(() => {
      setPlayingLessonId(null);
    }, 6000);

    if (typeof onAskVoyager === 'function') {
      const prompt = selectedLang === 'EN'
        ? `[AUTO_SYSTEM: MANDATORY VOYAGER VOICE INSTRUCTION]
As USA Voyager, speak directly to the student in your warm, encouraging voice.
Explain this lesson scenario in 2-3 engaging, clear sentences: "${lesson.title} - ${lesson.subtitle}".
Explain why mastering this practical situational skill is essential for real communication in the United States, and invite them warmly to click "Practice Scenario" to begin.
MANDATORY: Speak aloud in your official Voyager voice only.`
        : `[AUTO_SYSTEM: INSTRUCCIÓN MANDATORIA DE VOZ DE VOYAGER]
Como USA Voyager, habla directamente al estudiante con tu voz oficial cálida y motivadora en español.
Explica este escenario de lección en 2 o 3 oraciones claras y motivadoras: "${lesson.title} - ${lesson.subtitle}".
Explícale por qué dominar esta habilidad práctica situacional es fundamental para su comunicación real en Estados Unidos, y anímalo amablemente a hacer clic en "Practicar Escenario" cuando esté listo.
MANDATORIO: Habla en voz alta con tu voz oficial de Voyager únicamente.`;
      onAskVoyager(prompt);
    }
  };

  const handleToggleSaveLesson = (e: React.MouseEvent, lesson: ProLesson) => {
    e.stopPropagation();
    const exists = myLessons.some(l => l.lessonId === lesson.id || l.id === lesson.id);
    if (exists) {
      const updated = myLessons.filter(l => l.lessonId !== lesson.id && l.id !== lesson.id);
      saveMyLessonsToStorage(updated);
      setToastMessage(selectedLang === 'EN' ? 'Lesson removed from saved.' : 'Lección quitada de guardadas.');
    } else {
      const newActiveLesson: ActiveLesson = {
        id: `user-saved-${Date.now()}`,
        lessonId: lesson.id,
        title: lesson.title,
        subtitle: lesson.subtitle,
        category: lesson.category,
        level: lesson.level,
        estimatedMinutes: lesson.estimatedMinutes,
        objective: lesson.objective,
        scenario: lesson.category,
        status: 'in_progress',
        progressPercentage: 20,
        startedAt: new Date().toISOString()
      };
      saveMyLessonsToStorage([newActiveLesson, ...myLessons]);
      setToastMessage(selectedLang === 'EN' ? 'Saved to your Lesson Catalog!' : '¡Guardada en tu Catálogo de Lecciones!');
    }
    setTimeout(() => setToastMessage(null), 3000);
  };

  const handlePlayAssignmentAudio = (e: React.MouseEvent, assign: UnifiedAssignment) => {
    e.stopPropagation();
    if (playingLessonId === assign.id) {
      if (typeof window !== 'undefined' && window.speechSynthesis) {
        window.speechSynthesis.cancel();
      }
      setPlayingLessonId(null);
      return;
    }

    setPlayingLessonId(assign.id);
    setTimeout(() => {
      setPlayingLessonId(null);
    }, 6000);

    if (typeof onAskVoyager === 'function') {
      const prompt = selectedLang === 'EN'
        ? `[AUTO_SYSTEM: MANDATORY VOYAGER VOICE INSTRUCTION]
As USA Voyager, speak directly to the student in your warm, encouraging voice.
Introduce this assignment given by teacher ${assign.teacherName}: "${assign.title}".
Review the learning goal: "${assign.objective}".
Encourage the student to begin oral practice with you now.
MANDATORY: Speak aloud in your official Voyager voice only.`
        : `[AUTO_SYSTEM: INSTRUCCIÓN MANDATORIA DE VOZ DE VOYAGER]
Como USA Voyager, habla directamente al estudiante con tu voz oficial cálida y motivadora en español.
Presenta esta tarea asignada por tu docente ${assign.teacherName}: "${assign.title}".
Repasa el objetivo de aprendizaje: "${assign.objective}".
Anima al estudiante a iniciar la práctica oral contigo ahora.
MANDATORIO: Habla en voz alta con tu voz oficial de Voyager únicamente.`;
      onAskVoyager(prompt);
    }
  };

  const handleStartLessonDirect = (lesson: ProLesson) => {
    setSelectedLesson(lesson);
  };

  const handleLaunchScenarioWithVoyager = () => {
    if (!selectedLesson) return;

    const now = new Date();
    const nowIso = now.toISOString();

    const newActiveLesson: ActiveLesson = {
      id: `active-${selectedLesson.id}-${Date.now()}`,
      lessonId: selectedLesson.id,
      title: selectedLesson.title,
      subtitle: selectedLesson.subtitle,
      category: selectedLesson.category,
      level: selectedLesson.level,
      estimatedMinutes: selectedLesson.estimatedMinutes,
      objective: selectedLesson.objective,
      scenario: selectedScenarioOption === 'custom_free' && customScenarioText.trim()
        ? customScenarioText.trim()
        : selectedLesson.category,
      status: 'in_progress',
      progressPercentage: 35,
      startedAt: nowIso,
    };

    const filtered = myLessons.filter(l => l.lessonId !== selectedLesson.id);
    saveMyLessonsToStorage([newActiveLesson, ...filtered]);

    if (typeof onStartLesson === 'function') {
      onStartLesson({
        ...selectedLesson,
        scenario: selectedScenarioOption === 'custom_free' && customScenarioText.trim()
          ? customScenarioText.trim()
          : undefined
      });
      setSelectedLesson(null);
      setToastMessage(selectedLang === 'EN' ? 'Lesson started with Voyager!' : '¡Lección iniciada con Voyager!');
      setTimeout(() => setToastMessage(null), 3500);
      return;
    }

    if (typeof onAskVoyager === 'function') {
      const startPrompt = selectedLang === 'EN'
        ? `[VOYAGER VOICE INSTRUCTION: Speak aloud in your voice to launch lesson "${selectedLesson.title}". Welcome the student warmly and begin the first interactive oral exercise.]`
        : `[INSTRUCCIÓN DE VOZ VOYAGER: Habla en tu voz al estudiante para iniciar la lección "${selectedLesson.title}". Dales la bienvenida e inicia el primer ejercicio oral interactivo.]`;
      onAskVoyager(startPrompt);
    }

    setToastMessage(selectedLang === 'EN' ? 'Lesson started with Voyager!' : '¡Lección iniciada con Voyager!');
    setSelectedLesson(null);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // Launch assignment scenario
  const handleStartAssignment = async (assignment: UnifiedAssignment) => {
    if (typeof onAskVoyager === 'function') {
      const prompt = selectedLang === 'EN'
        ? `[VOYAGER VOICE INSTRUCTION: Speak aloud in your warm voice to begin teacher assignment "${assignment.title}" assigned by ${assignment.teacherName}. Review the pedagogical objective: "${assignment.objective}", explain the task: "${assignment.instructions}", and prompt the student with the opening question.]`
        : `[INSTRUCCIÓN DE VOZ VOYAGER: Habla en tu voz cálida al estudiante para comenzar la tarea escolar "${assignment.title}" asignada por ${assignment.teacherName}. Repasa el objetivo pedagógico: "${assignment.objective}", explica las instrucciones: "${assignment.instructions}", e inicia el primer ejercicio.]`;
      onAskVoyager(prompt);
    }

    if (assignment.status === 'PENDING') {
      await updateUnifiedAssignmentStatus(assignment, 'IN_PROGRESS', 35);
      loadAssignments();
    }

    setToastMessage(
      selectedLang === 'EN' 
        ? `Started assignment: ${assignment.title}` 
        : `Iniciada la tarea: ${assignment.title}`
    );
    setTimeout(() => setToastMessage(null), 3500);
  };

  const handleCompleteAssignment = async (assignment: UnifiedAssignment) => {
    await updateUnifiedAssignmentStatus(
      assignment, 
      'COMPLETED', 
      100, 
      assignment.feedback || (selectedLang === 'EN' ? 'Great progress! Practice verified.' : '¡Excelente progreso! Práctica verificada.')
    );
    loadAssignments();
    setToastMessage(
      selectedLang === 'EN'
        ? `Assignment marked as COMPLETED!`
        : `¡Tarea marcada como COMPLETADA!`
    );
    setTimeout(() => setToastMessage(null), 3500);
  };

  // Google NotebookLM generator
  const generateNotebookLMText = (lesson: ProLesson) => {
    const studentName = user?.name || (user?.firstName ? `${user.firstName} ${user.lastName || ''}`.trim() : 'Estudiante Voyager');
    return `# 📓 USA Voyager Lesson Plan: ${lesson.title}

## 👤 Learner Profile
- **Student**: ${studentName}
- **CEFR Level**: ${lesson.level}
- **Category**: ${lesson.category}
- **Target Skill**: ${lesson.skillImproved}
- **Estimated Duration**: ${lesson.estimatedMinutes} minutes

## 🎯 Pedagogical Objective
${lesson.objective}

## 🗣️ Audio & Speech Practice Guidelines
1. Practice real-world spoken interactions in the "${lesson.category}" context.
2. Eliminate hesitation gaps, master natural transition connectors, and improve vocal confidence.
3. Voice Tutor: USA Voyager AI Voice Coach.

## 📝 Google NotebookLM Study Instructions
- Import this source into your Google NotebookLM notebook (https://notebooklm.google.com).
- Use NotebookLM to create Audio Overviews, generate practice quizzes, and summarize key vocabulary!
`;
  };

  const handleCopyNotebookLM = (lesson: ProLesson) => {
    const content = generateNotebookLMText(lesson);
    navigator.clipboard.writeText(content);
    setCopiedNotebookSource(true);
    setToastMessage(selectedLang === 'EN' ? 'Copied Lesson Plan for NotebookLM!' : '¡Plan de Lección copiado para NotebookLM!');
    setTimeout(() => setCopiedNotebookSource(false), 3000);
    setTimeout(() => setToastMessage(null), 4000);
  };

  const handleExportGoogleDoc = async (lesson: ProLesson) => {
    try {
      setIsExportingGoogleDoc(true);
      const content = generateNotebookLMText(lesson);
      const docTitle = `USA Voyager - ${lesson.title}`;
      const result = await createGoogleDoc(docTitle, content);
      setToastMessage(selectedLang === 'EN' ? 'Google Doc created in your Drive!' : '¡Documento creado en tu Google Drive!');
      window.open(result.documentUrl, '_blank');
    } catch (err: any) {
      console.error('Google Doc creation error:', err);
      setToastMessage(err?.message || 'Failed to create Google Doc');
    } finally {
      setIsExportingGoogleDoc(false);
      setTimeout(() => setToastMessage(null), 4000);
    }
  };

  // ───────────────────────────────────────────────────────────────────────────
  // UNIFIED CATALOG ITEMS & FILTERED TABS
  // Filtered views without duplicating lessons. 9 lessons per page with pagination.
  // ───────────────────────────────────────────────────────────────────────────
  interface CatalogItem {
    id: string;
    sourceType: 'assignment' | 'lesson';
    originalAssignment?: UnifiedAssignment;
    originalLesson?: ProLesson;
    title: string;
    category: string;
    level: string;
    estimatedMinutes: number;
    imageUrl: string;
    description: string;
    progressPercentage?: number;
    isCompleted?: boolean;
    isInProgress?: boolean;
    isSaved?: boolean;
    teacherName?: string;
    dueDate?: string;
    feedback?: string;
    relevance?: { score: number; reasonEN: string; reasonES: string };
  }

  // 1. Assigned by My Teacher
  const assignedItems: CatalogItem[] = assignmentData.assignments.map(assign => {
    const isCompleted = assign.status === 'COMPLETED' || assign.status === 'GRADED' || (assign.progressPercentage !== undefined && assign.progressPercentage >= 100);
    const isInProgress = assign.status === 'IN_PROGRESS' && !isCompleted;
    const isSaved = myLessons.some(l => l.lessonId === assign.lessonId);
    return {
      id: assign.id,
      sourceType: 'assignment',
      originalAssignment: assign,
      title: assign.title,
      category: assign.category,
      level: assign.level,
      estimatedMinutes: assign.estimatedMinutes,
      imageUrl: getLessonImageUrl(assign.lessonId, assign.category),
      description: assign.instructions || assign.objective,
      progressPercentage: isCompleted ? 100 : (isInProgress ? (assign.progressPercentage || 0) : 0),
      isCompleted,
      isInProgress,
      isSaved,
      teacherName: assign.teacherName,
      dueDate: assign.dueDate,
      feedback: assign.feedback,
    };
  });

  // 2. Intereses (Curated recommendations aligned with student interests, level, and goals)
  const interestsItems: CatalogItem[] = allMasterLessons
    .map(lesson => {
      const isSaved = myLessons.some(l => l.lessonId === lesson.id || l.id === lesson.id);
      const active = myLessons.find(l => l.lessonId === lesson.id || l.id === lesson.id);
      const isCompleted = active?.status === 'completed' || (active?.progressPercentage !== undefined && active.progressPercentage >= 100);
      const isInProgress = active?.status === 'in_progress' && !isCompleted;
      const relevance = calculateRelevance(lesson);
      return {
        id: lesson.id,
        sourceType: 'lesson' as const,
        originalLesson: lesson,
        title: lesson.title,
        category: lesson.category,
        level: lesson.level,
        estimatedMinutes: lesson.estimatedMinutes,
        imageUrl: lesson.imageUrl || getLessonImageUrl(lesson.id, lesson.category),
        description: lesson.subtitle,
        progressPercentage: isCompleted ? 100 : (isInProgress ? (active?.progressPercentage || 30) : 0),
        isCompleted,
        isInProgress,
        isSaved,
        relevance,
      };
    })
    .sort((a, b) => (b.relevance?.score || 0) - (a.relevance?.score || 0));

  // 3. En proceso (Only lessons that are in progress / to complete, STRICTLY excluding 100% completed)
  const toCompleteItems: CatalogItem[] = (() => {
    const list: CatalogItem[] = [];
    const seenIds = new Set<string>();

    const isItemFinished = (item: CatalogItem) => {
      return item.isCompleted === true || (item.progressPercentage !== undefined && item.progressPercentage >= 100);
    };

    // 1. Pending/in-progress assignments (strictly NOT completed)
    assignedItems
      .filter(item => !isItemFinished(item))
      .forEach(item => {
        seenIds.add(item.id);
        if (item.originalAssignment?.lessonId) {
          seenIds.add(item.originalAssignment.lessonId);
        }
        list.push(item);
      });

    // 2. In-progress active lessons from myLessons (strictly NOT completed)
    allMasterLessons
      .filter(lesson => {
        const active = myLessons.find(l => l.lessonId === lesson.id || l.id === lesson.id);
        const isDone = active && (active.status === 'completed' || (active?.progressPercentage !== undefined && active.progressPercentage >= 100));
        return active && active.status === 'in_progress' && !isDone && !seenIds.has(lesson.id);
      })
      .forEach(lesson => {
        const active = myLessons.find(l => l.lessonId === lesson.id || l.id === lesson.id);
        const relevance = calculateRelevance(lesson);
        seenIds.add(lesson.id);
        list.push({
          id: lesson.id,
          sourceType: 'lesson' as const,
          originalLesson: lesson,
          title: lesson.title,
          category: lesson.category,
          level: lesson.level,
          estimatedMinutes: lesson.estimatedMinutes,
          imageUrl: lesson.imageUrl || getLessonImageUrl(lesson.id, lesson.category),
          description: lesson.subtitle,
          progressPercentage: Math.min(99, active?.progressPercentage || 35),
          isCompleted: false,
          isInProgress: true,
          isSaved: true,
          relevance,
        });
      });

    // 3. Interest-based lessons (strictly NOT completed)
    interestsItems
      .filter(item => !isItemFinished(item))
      .forEach(item => {
        if (!seenIds.has(item.id)) {
          seenIds.add(item.id);
          list.push({
            ...item,
            isCompleted: false,
            progressPercentage: (item.progressPercentage !== undefined && item.progressPercentage < 100) ? item.progressPercentage : 0,
          });
        }
      });

    // Strict guarantee: No item with 100% or isCompleted can ever be in En proceso
    return list.filter(item => !isItemFinished(item));
  })();

  // 4. Completadas (All completed lessons: completed assignments + completed active/interest lessons)
  const completedItems: CatalogItem[] = (() => {
    const list: CatalogItem[] = [];
    const seenIds = new Set<string>();

    // 1. Completed teacher assignments
    assignedItems
      .filter(item => item.isCompleted || (item.progressPercentage !== undefined && item.progressPercentage >= 100))
      .forEach(item => {
        seenIds.add(item.id);
        if (item.originalAssignment?.lessonId) {
          seenIds.add(item.originalAssignment.lessonId);
        }
        list.push({
          ...item,
          isCompleted: true,
          progressPercentage: 100,
        });
      });

    // 2. Completed active lessons from allMasterLessons / myLessons
    allMasterLessons
      .filter(lesson => {
        const active = myLessons.find(l => l.lessonId === lesson.id || l.id === lesson.id);
        const isDone = active && (active.status === 'completed' || (active?.progressPercentage !== undefined && active.progressPercentage >= 100));
        return isDone && !seenIds.has(lesson.id);
      })
      .forEach(lesson => {
        seenIds.add(lesson.id);
        const relevance = calculateRelevance(lesson);
        list.push({
          id: lesson.id,
          sourceType: 'lesson' as const,
          originalLesson: lesson,
          title: lesson.title,
          category: lesson.category,
          level: lesson.level,
          estimatedMinutes: lesson.estimatedMinutes,
          imageUrl: lesson.imageUrl || getLessonImageUrl(lesson.id, lesson.category),
          description: lesson.subtitle,
          progressPercentage: 100,
          isCompleted: true,
          isInProgress: false,
          isSaved: true,
          relevance,
        });
      });

    // 3. Completed interest items
    interestsItems
      .filter(item => (item.isCompleted || (item.progressPercentage !== undefined && item.progressPercentage >= 100)) && !seenIds.has(item.id))
      .forEach(item => {
        seenIds.add(item.id);
        list.push({
          ...item,
          isCompleted: true,
          progressPercentage: 100,
        });
      });

    return list;
  })();

  // 5. All Lessons (Sorted by personal relevance)
  const allCatalogItems: CatalogItem[] = [...allMasterLessons]
    .map(lesson => {
      const isSaved = myLessons.some(l => l.lessonId === lesson.id || l.id === lesson.id);
      const active = myLessons.find(l => l.lessonId === lesson.id || l.id === lesson.id);
      const isCompleted = active?.status === 'completed' || (active?.progressPercentage !== undefined && active.progressPercentage >= 100);
      const isInProgress = active?.status === 'in_progress';
      const relevance = calculateRelevance(lesson);
      return {
        id: lesson.id,
        sourceType: 'lesson' as const,
        originalLesson: lesson,
        title: lesson.title,
        category: lesson.category,
        level: lesson.level,
        estimatedMinutes: lesson.estimatedMinutes,
        imageUrl: lesson.imageUrl || getLessonImageUrl(lesson.id, lesson.category),
        description: lesson.subtitle,
        progressPercentage: isCompleted ? 100 : (isInProgress ? (active?.progressPercentage || 30) : 0),
        isCompleted,
        isInProgress,
        isSaved,
        relevance,
      };
    })
    .sort((a, b) => (b.relevance?.score || 0) - (a.relevance?.score || 0));

  const currentTabItems: CatalogItem[] = 
    activeTab === 'assigned' ? assignedItems :
    activeTab === 'to_complete' ? toCompleteItems :
    completedItems;

  const totalTabItems = currentTabItems.length;
  const totalPages = Math.max(1, Math.ceil(totalTabItems / itemsPerPage));
  const pageStartIndex = (catalogPage - 1) * itemsPerPage;
  const paginatedItems = currentTabItems.slice(pageStartIndex, pageStartIndex + itemsPerPage);

  const totalAssignedLessonsCount = assignmentData.assignments.length > 0 
    ? assignmentData.assignments.length 
    : (assignedItems.length > 0 ? assignedItems.length : 12);

  const catalogTabs = [
    {
      id: 'assigned' as const,
      labelEN: 'Assigned',
      labelES: 'Asignadas',
      color: 'bg-[#EF4444]',
      count: totalAssignedLessonsCount,
    },
    {
      id: 'to_complete' as const,
      labelEN: 'In Progress',
      labelES: 'En proceso',
      color: 'bg-[#FBBF24]',
      count: toCompleteItems.length,
    },
    {
      id: 'completed' as const,
      labelEN: 'Completed',
      labelES: 'Completadas',
      color: 'bg-[#00E676]',
      count: completedItems.length,
    },
  ];

  const handleToggleBookmarkItem = (e: React.MouseEvent, item: CatalogItem) => {
    e.stopPropagation();
    if (item.originalLesson) {
      handleToggleSaveLesson(e, item.originalLesson);
    } else if (item.originalAssignment) {
      const match = allMasterLessons.find(l => l.id === item.originalAssignment?.lessonId);
      if (match) {
        handleToggleSaveLesson(e, match);
      } else {
        const exists = myLessons.some(l => l.lessonId === item.id || l.id === item.id);
        if (exists) {
          saveMyLessonsToStorage(myLessons.filter(l => l.lessonId !== item.id && l.id !== item.id));
          setToastMessage(selectedLang === 'EN' ? 'Lesson removed from saved.' : 'Lección quitada de guardadas.');
        } else {
          const newActive: ActiveLesson = {
            id: `user-saved-${Date.now()}`,
            lessonId: item.id,
            title: item.title,
            subtitle: item.description,
            category: item.category,
            level: item.level,
            estimatedMinutes: item.estimatedMinutes,
            objective: item.description,
            scenario: item.category,
            status: 'in_progress',
            progressPercentage: 20,
            startedAt: new Date().toISOString()
          };
          saveMyLessonsToStorage([newActive, ...myLessons]);
          setToastMessage(selectedLang === 'EN' ? 'Saved to your Lesson Catalog!' : '¡Guardada en tu Catálogo de Lecciones!');
        }
        setTimeout(() => setToastMessage(null), 3000);
      }
    }
  };

  const handlePlayItemAudio = (e: React.MouseEvent, item: CatalogItem) => {
    e.stopPropagation();
    if (item.originalAssignment) {
      handlePlayAssignmentAudio(e, item.originalAssignment);
    } else if (item.originalLesson) {
      handlePlayLessonAudio(e, item.originalLesson);
    }
  };

  const handleOpenDetailedView = (item: CatalogItem) => {
    const idx = currentTabItems.findIndex(i => i.id === item.id);
    if (idx !== -1) {
      setDetailedItemIndex(idx);
    } else {
      setDetailedItemIndex(0);
    }
  };

  const handleItemCardClick = (item: CatalogItem) => {
    handleOpenDetailedView(item);
  };

  const handleItemActionClick = (e: React.MouseEvent, item: CatalogItem) => {
    e.stopPropagation();
    if (item.sourceType === 'assignment' && item.originalAssignment) {
      if (typeof onStartLesson === 'function') {
        onStartLesson(item.originalAssignment, item.originalAssignment);
      } else {
        handleStartAssignment(item.originalAssignment);
      }
    } else if (item.originalLesson) {
      if (typeof onStartLesson === 'function') {
        onStartLesson(item.originalLesson);
      } else {
        setSelectedLesson(item.originalLesson);
        setSelectedLessonRelevance(item.relevance || null);
      }
    }
  };

  // ───────────────────────────────────────────────────────────────────────────
  // RENDER
  // ───────────────────────────────────────────────────────────────────────────
  return (
    <div className={`w-full ${hideHeader ? 'p-0 m-0' : 'pt-2 pb-3 my-2'} animate-fade-in text-left font-sans overflow-visible`}>
      {/* Dark Gold (#8F6305) + White (#FFFFFF) Duotone SVG Filter */}
      <svg aria-hidden="true" className="w-0 h-0 absolute overflow-hidden pointer-events-none">
        <defs>
          <filter id="voyager-duotone-gold-white" colorInterpolationFilters="sRGB">
            <feColorMatrix
              type="matrix"
              values="0.2126 0.7152 0.0722 0 0  0.2126 0.7152 0.0722 0 0  0.2126 0.7152 0.0722 0 0  0 0 0 1 0"
            />
            <feComponentTransfer>
              <feFuncR type="linear" slope="1.15" intercept="-0.075" />
              <feFuncG type="linear" slope="1.15" intercept="-0.075" />
              <feFuncB type="linear" slope="1.15" intercept="-0.075" />
            </feComponentTransfer>
            <feComponentTransfer>
              <feFuncR type="table" tableValues="0.56 1" />
              <feFuncG type="table" tableValues="0.39 1" />
              <feFuncB type="table" tableValues="0.02 1" />
            </feComponentTransfer>
          </filter>
        </defs>
      </svg>
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 max-w-md bg-neutral-900 text-amber-300 px-4 py-3 rounded-xl shadow-2xl flex items-center gap-3 border border-amber-400">
          <span className="text-sm font-medium">{toastMessage}</span>
          <button 
            type="button"
            onClick={() => setToastMessage(null)}
            className="ml-auto text-neutral-400 hover:text-white cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* ────── MAIN HEADER (Hotlink with Voyager Voice Explanation) ────── */}
      {!hideHeader && (
        <div className="mb-6 px-1 pt-4 sm:pt-5 pb-1 text-left overflow-visible">
          <button
            type="button"
            onClick={() => {
              if (typeof window !== 'undefined' && window.speechSynthesis) {
                try { window.speechSynthesis.cancel(); } catch (err) {}
              }
              if (typeof onAskVoyager === 'function') {
                const prompt = selectedLang === 'EN'
                  ? `[AUTO_SYSTEM: MANDATORY VOYAGER VOICE INSTRUCTION]
As USA Voyager, speak directly to the student in your warm, encouraging voice.
Explain this Lesson Catalog section in 2-3 engaging, clear sentences:
Tell the student that here they can explore teacher assignments, selected lessons, active practice modules, and completed achievements organized into focused tabs.
MANDATORY: Speak aloud in your official Voyager voice only.`
                  : `[AUTO_SYSTEM: INSTRUCCIÓN MANDATORIA DE VOZ DE VOYAGER]
Como USA Voyager, habla directamente al estudiante con tu voz oficial cálida y motivadora en español.
Explica esta sección del Catálogo de Lecciones en 2 o 3 oraciones claras y motivadoras:
Dile al estudiante que aquí encontrará las tareas de su profesor, sus lecciones seleccionadas, módulos por completar y lecciones completadas organizadas en pestañas claras.
MANDATORIO: Habla en voz alta con tu voz oficial de Voyager únicamente.`;
                onAskVoyager(prompt);
              }
            }}
            title={
              selectedLang === 'EN'
                ? 'Click to hear Voyager explain this section'
                : 'Haz clic para escuchar la explicación de Voyager'
            }
            className="inline-block pt-2 pb-1 text-base sm:text-lg font-bold tracking-normal leading-relaxed text-neutral-900 uppercase cursor-pointer hover:text-[#0D224A] hover:underline underline-offset-4 transition-colors overflow-visible"
          >
            {selectedLang === 'EN' ? 'Lesson Catalog' : 'Catálogo de Lecciones'}
          </button>
          <p className="text-sm sm:text-base text-neutral-600 mt-1 leading-relaxed">
            {selectedLang === 'EN'
              ? 'Connected educational ecosystem: teacher assignments, personalized practice modules, and progress tracking.'
              : 'Ecosistema educativo conectado: tareas asignadas por profesores, módulos prácticos personalizados y seguimiento.'}
          </p>

          {/* Simplified Demo Mode Notice — Discreet neutral text directly under heading, no yellow pill or border */}
          {assignmentData.isDemoMode && activeTab === 'assigned' && (
            <p className="text-xs text-neutral-500 mt-1.5 leading-normal">
              {selectedLang === 'EN'
                ? 'Demonstration mode · Sample teacher assignments displayed.'
                : 'Modo demostración · Se muestran asignaciones de prueba.'}
            </p>
          )}
        </div>
      )}

      {/* ───────────────────────────────────────────────────────────────────── */}
      {/* VINTAGE INDEX-CARD TABS (Standardized to Student Calendar styling)     */}
      {/* ───────────────────────────────────────────────────────────────────── */}
      <div className="w-full flex items-end relative pt-2 px-[14px] sm:px-[15px] z-10 overflow-visible">
        <div className="flex items-end gap-2 sm:gap-2.5 relative">
          {catalogTabs.map((tab, idx) => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => {
                  setActiveTab(tab.id);
                  setCatalogPage(1);
                  setDetailedItemIndex(null);
                }}
                className={`group relative h-[56px] sm:h-[62px] px-3.5 sm:px-4 md:px-5 min-w-[92px] sm:min-w-[110px] md:min-w-[124px] flex flex-col items-center pt-2 sm:pt-2.5 pb-1.5 sm:pb-2 justify-start cursor-pointer transition-colors ${
                  isActive
                    ? 'bg-[#F8ECC0] text-[#F8ECC0] z-30 rounded-t-[14px] sm:rounded-t-[18px] -mb-[2px] after:content-[\'\'] after:absolute after:-bottom-[3px] after:left-0 after:right-0 after:h-[5px] after:bg-[#F8ECC0] after:z-30'
                    : 'bg-[#EADBB3] hover:bg-[#E0CF9E] text-[#EADBB3] hover:text-[#E0CF9E] rounded-t-[14px] sm:rounded-t-[18px] z-10'
                }`}
              >
                {/* Left Concave Flare / Inverted Fillet (Vintage filing index-card tab) */}
                {idx > 0 && (
                  <svg
                    className="absolute -left-[14px] sm:-left-[15px] bottom-0 w-[14px] sm:w-[15px] h-[14px] sm:h-[15px] pointer-events-none overflow-visible transition-colors"
                    viewBox="0 0 16 16"
                    fill="currentColor"
                  >
                    <path d="M 16 0 L 16 16.5 L 0 16.5 Q 16 16.5 16 0 Z" />
                  </svg>
                )}

                {/* Right Concave Flare / Inverted Fillet */}
                <svg
                  className="absolute -right-[14px] sm:-right-[15px] bottom-0 w-[14px] sm:w-[15px] h-[14px] sm:h-[15px] pointer-events-none overflow-visible transition-colors"
                  viewBox="0 0 16 16"
                  fill="currentColor"
                >
                  <path d="M 0 0 L 0 16.5 L 16 16.5 Q 0 16.5 0 0 Z" />
                </svg>

                {/* Tab Label: Consistent typography and shared baseline on top */}
                <div className="inline-flex flex-col items-center justify-start max-w-full px-0.5 leading-tight">
                  <span className={`text-[13.5px] sm:text-[15px] md:text-[16px] font-bold leading-none text-center whitespace-nowrap ${
                    isActive ? 'text-[#1F1A14]' : 'text-[#221D17] group-hover:text-black'
                  }`}>
                    {selectedLang === 'EN' ? tab.labelEN : tab.labelES}
                  </span>
                </div>

                {/* Plain task count number centered beneath tab title */}
                {tab.count !== undefined && tab.count > 0 && (
                  <div className="relative mt-1 sm:mt-1.5 flex items-center justify-center">
                    <span
                      className={`select-none text-[11px] sm:text-[12px] font-semibold font-sans not-italic leading-none ${
                        isActive ? 'text-[#1F1A14]' : 'text-[#221D17] group-hover:text-black'
                      }`}
                    >
                      {tab.count}
                    </span>
                  </div>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* ───────────────────────────────────────────────────────────────────── */}
      {/* FOLDER CONTENT CARD BODY (Visually connected to active index tab)     */}
      {/* ───────────────────────────────────────────────────────────────────── */}
      <div className={`bg-[#F8ECC0] rounded-b-[24px] sm:rounded-b-[28px] rounded-t-[14px] sm:rounded-t-[18px] p-4 sm:p-6 md:p-8 flex flex-col w-full relative z-0 shadow-xs ${hideHeader ? 'mb-0' : 'mb-8'}`}>
        {detailedItemIndex !== null && currentTabItems[detailedItemIndex] ? (() => {
          const item = currentTabItems[detailedItemIndex];

          return (
            <div className="w-full text-left space-y-5 animate-fade-in">
              {/* Top Navigation & Back Action */}
              <div className="flex items-center justify-between border-b border-[#EAE2D7]/70 pb-3 flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => setDetailedItemIndex(null)}
                  className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-semibold text-[#1F1A14] hover:text-amber-800 transition-colors cursor-pointer"
                >
                  <ChevronLeft className="w-4 h-4 stroke-[2.5]" />
                  <span>{selectedLang === 'EN' ? 'Back to all lessons' : 'Volver a lecciones'}</span>
                </button>
                <span className="text-xs sm:text-sm font-medium text-neutral-600">
                  {selectedLang === 'EN'
                    ? `Lesson ${detailedItemIndex + 1} of ${currentTabItems.length}`
                    : `Lección ${detailedItemIndex + 1} de ${currentTabItems.length}`}
                </span>
              </div>

              {/* Main 1-Lesson Layout: Left photo, Right specifics */}
              <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-start">
                {/* Photo Column */}
                <div className="md:col-span-5 flex flex-col items-start">
                  <div
                    onClick={(e) => {
                      e.stopPropagation();
                      handlePlayItemAudio(e, item);
                    }}
                    title={selectedLang === 'EN' ? 'Click photo for Voyager course explanation' : 'Haz clic en la foto para escuchar la explicación de Voyager'}
                    className="relative w-full max-w-[320px] aspect-square rounded-[18px] sm:rounded-[22px] overflow-hidden bg-neutral-200/60 shrink-0 shadow-xs cursor-pointer group/photo"
                  >
                    <img
                      src={item.imageUrl}
                      alt={item.title}
                      className="w-full h-full object-cover voyager-duotone-gold-white transition-all duration-300"
                      loading="lazy"
                    />
                  </div>

                  {/* Progress Indicator for detailed view */}
                  {(() => {
                    if (activeTab === 'completed') {
                      return null;
                    }

                    const isCompleted = item.isCompleted || (item.progressPercentage !== undefined && item.progressPercentage >= 100);
                    const pctVal = isCompleted ? 100 : (item.progressPercentage ?? 0);

                    // ASIGNADAS: Circle indicators (0% red, 35% yellow, 100% solid green dot)
                    if (activeTab === 'assigned') {
                      if (isCompleted || pctVal >= 100) {
                        return (
                          <div className="mt-2.5 mb-1 flex items-center select-none" title={selectedLang === 'EN' ? 'Completed (100%)' : 'Completada (100%)'}>
                            <div className="w-5 h-5 rounded-full bg-[#00E676] shadow-2xs" />
                          </div>
                        );
                      }

                      if (pctVal > 0) {
                        return (
                          <div className="mt-2.5 mb-1 flex items-center select-none" title={`${pctVal}%`}>
                            <div className="w-6 h-6 rounded-full bg-[#FBBF24] text-[#1F1A14] flex items-center justify-center text-[9px] sm:text-[10px] font-bold font-sans shadow-2xs">
                              {pctVal}%
                            </div>
                          </div>
                        );
                      }

                      return (
                        <div className="mt-2.5 mb-1 flex items-center select-none" title="0%">
                          <div className="w-6 h-6 rounded-full bg-[#EF4444] text-white flex items-center justify-center text-[9px] sm:text-[10px] font-bold font-sans shadow-2xs">
                            0%
                          </div>
                        </div>
                      );
                    }

                    // EN PROCESO / HORIZONTAL PROGRESS BAR:
                    // Yellow fill in En proceso, straight square end (rounded-none), white bar with "0%" when 0%
                    const isYellowSection = activeTab === 'to_complete';
                    const fillColor = isYellowSection ? 'bg-[#FBBF24]' : 'bg-[#EF4444]';
                    const textColor = isYellowSection ? 'text-[#1F1A14]' : 'text-white';

                    return (
                      <div className="w-full max-w-[320px] mt-2.5 mb-1 select-none">
                        <div className="w-full h-3.5 sm:h-4 rounded-full bg-white overflow-hidden flex items-center relative">
                          {pctVal === 0 ? (
                            <div className="w-full h-full flex items-center justify-center select-none">
                              <span className="text-[9px] sm:text-[10px] font-bold text-[#1F1A14] font-sans leading-none">
                                0%
                              </span>
                            </div>
                          ) : (
                            <div
                              className={`h-full ${fillColor} rounded-none flex items-center justify-center transition-all duration-300`}
                              style={{
                                width: `${Math.min(100, Math.max(16, pctVal))}%`,
                                minWidth: '28px'
                              }}
                            >
                              <span className={`text-[9px] sm:text-[10px] font-bold ${textColor} font-sans leading-none px-1`}>
                                {pctVal}%
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })()}

                  <p className="text-[11px] text-neutral-500 mt-1 italic">
                    {selectedLang === 'EN'
                      ? 'Click photo to hear Voyager explanation'
                      : 'Haz clic en la foto para escuchar la explicación de Voyager'}
                  </p>
                </div>

                {/* Specifics Column */}
                <div className="md:col-span-7 space-y-3.5">
                  {/* Category, Level, Duration */}
                  <div className="flex items-center gap-2 text-xs font-semibold text-neutral-600 uppercase tracking-wide flex-wrap">
                    <span className="text-[#1F1A14] font-bold">{item.category}</span>
                    <span>·</span>
                    <span>{item.level}</span>
                    <span>·</span>
                    <span>{item.estimatedMinutes} min</span>
                    {item.originalAssignment && (
                      <>
                        <span>·</span>
                        <span className="text-red-700 font-bold lowercase">
                          {selectedLang === 'EN' ? `Due: ${item.originalAssignment.dueDate || 'Class'}` : `Entrega: ${item.originalAssignment.dueDate || 'Clase'}`}
                        </span>
                      </>
                    )}
                  </div>

                  {/* Title with standalone Play Icon */}
                  <div className="flex items-center gap-2 flex-wrap">
                    <button
                      type="button"
                      onClick={(e) => handleItemActionClick(e, item)}
                      title={selectedLang === 'EN' ? 'Practice with Voyager' : 'Practicar con Voyager'}
                      className="p-1 -ml-1 text-[#1F1A14] hover:text-amber-800 hover:scale-115 active:scale-95 transition-all cursor-pointer shrink-0"
                    >
                      <Play className="w-4 h-4 fill-[#1F1A14] text-[#1F1A14]" />
                    </button>
                    <h3 className="text-lg sm:text-xl font-bold text-neutral-900 leading-snug">
                      {item.title}
                    </h3>
                  </div>

                  {item.originalAssignment?.teacherName && (
                    <p className="text-xs sm:text-sm text-neutral-600 font-medium flex items-center gap-1.5">
                      <GraduationCap className="w-4 h-4 text-neutral-600" />
                      <span>{selectedLang === 'EN' ? 'Assigned by:' : 'Asignada por:'} {item.originalAssignment.teacherName}</span>
                    </p>
                  )}

                  {/* Pedagogical Objective */}
                  <div className="space-y-1">
                    <h5 className="font-bold text-neutral-900 text-xs sm:text-sm uppercase tracking-wide">
                      {selectedLang === 'EN' ? 'Pedagogical Objective' : 'Objetivo Pedagógico'}
                    </h5>
                    <p className="text-[10pt] font-normal not-italic text-neutral-700 font-sans leading-relaxed text-left">
                      {item.originalLesson?.objective || item.originalAssignment?.objective || item.description}
                    </p>
                  </div>

                  {/* Instructions (if assignment) */}
                  {item.originalAssignment?.instructions && (
                    <div className="space-y-1">
                      <h5 className="font-bold text-neutral-900 text-xs sm:text-sm uppercase tracking-wide">
                        {selectedLang === 'EN' ? 'Teacher Instructions' : 'Instrucciones del Profesor'}
                      </h5>
                      <p className="text-[10pt] font-normal not-italic text-neutral-700 font-sans leading-relaxed text-left">
                        {item.originalAssignment.instructions}
                      </p>
                    </div>
                  )}

                  {/* Feedback (if completed assignment) */}
                  {item.originalAssignment?.feedback && (
                    <div className="p-3 rounded-xl bg-amber-50/90 border border-amber-200 text-amber-950">
                      <h5 className="font-bold text-amber-900 text-xs mb-0.5 flex items-center gap-1.5">
                        <MessageSquareQuote className="w-3.5 h-3.5 text-amber-700" />
                        <span>{selectedLang === 'EN' ? 'Teacher Feedback' : 'Retroalimentación Docente'}</span>
                      </h5>
                      <p className="text-[10pt] font-normal not-italic text-amber-900/90 font-sans leading-relaxed text-left">
                        "{item.originalAssignment.feedback}"
                      </p>
                    </div>
                  )}

                  {/* Description / Subtitle */}
                  {item.originalLesson?.subtitle && (
                    <p className="text-[10pt] font-normal not-italic text-neutral-700 font-sans leading-relaxed text-left">
                      {item.originalLesson.subtitle}
                    </p>
                  )}

                  {/* Key outcomes if available */}
                  {item.originalLesson?.keyOutcomes && item.originalLesson.keyOutcomes.length > 0 && (
                    <div className="space-y-1">
                      <h5 className="font-bold text-neutral-900 text-xs sm:text-sm uppercase tracking-wide">
                        {selectedLang === 'EN' ? 'Key Outcomes' : 'Logros Clave'}
                      </h5>
                      <ul className="list-disc list-inside text-xs sm:text-sm text-neutral-700 space-y-0.5">
                        {item.originalLesson.keyOutcomes.map((outcome, oIdx) => (
                          <li key={oIdx}>{outcome}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Google NotebookLM & Google Doc Integration */}
                  {item.originalLesson && (
                    <div className="pt-2 flex items-center gap-2 flex-wrap text-xs">
                      <button
                        type="button"
                        onClick={() => handleCopyNotebookLM(item.originalLesson!)}
                        className="py-1 px-3 rounded-full bg-white hover:bg-neutral-100 border border-neutral-300 text-neutral-800 font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
                      >
                        {copiedNotebookSource ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5 text-neutral-600" />}
                        <span>{copiedNotebookSource ? (selectedLang === 'EN' ? 'Copied!' : '¡Copiado!') : 'NotebookLM'}</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => handleExportGoogleDoc(item.originalLesson!)}
                        disabled={isExportingGoogleDoc}
                        className="py-1 px-3 rounded-full bg-white hover:bg-neutral-100 border border-neutral-300 text-neutral-800 font-semibold flex items-center gap-1.5 transition-colors cursor-pointer disabled:opacity-50"
                      >
                        {isExportingGoogleDoc ? <Loader2 className="w-3.5 h-3.5 text-neutral-600 animate-spin" /> : <FileText className="w-3.5 h-3.5 text-neutral-600" />}
                        <span>{isExportingGoogleDoc ? (selectedLang === 'EN' ? 'Saving...' : 'Guardando...') : 'Google Doc'}</span>
                      </button>
                    </div>
                  )}

                  {/* Practice with Voyager Call to Action */}
                  <div className="pt-2 flex items-center gap-3 flex-wrap">
                    <button
                      type="button"
                      onClick={(e) => handleItemActionClick(e, item)}
                      className="px-5 py-2.5 rounded-full bg-[#1F1A14] hover:bg-[#3D352E] text-white font-bold text-xs sm:text-sm flex items-center gap-2 transition-all cursor-pointer shadow-xs active:scale-95"
                    >
                      <Play className="w-3.5 h-3.5 fill-white" />
                      <span>{selectedLang === 'EN' ? 'Practice with Voyager' : 'Practicar con Voyager'}</span>
                    </button>

                    {item.originalAssignment && item.originalAssignment.status !== 'COMPLETED' && (
                      <button
                        type="button"
                        onClick={() => handleCompleteAssignment(item.originalAssignment!)}
                        className="px-4 py-2 rounded-full bg-white hover:bg-neutral-100 border border-[#1F1A14]/30 text-neutral-800 text-xs font-semibold transition-colors cursor-pointer"
                      >
                        {selectedLang === 'EN' ? 'Mark as Completed' : 'Marcar como Completada'}
                      </button>
                    )}
                  </div>
                </div>
              </div>

              {/* Bottom Navigation: Circular previous and next arrows */}
              <div className="flex items-center justify-between pt-4 border-t border-[#EAE2D7]/70">
                <button
                  type="button"
                  disabled={detailedItemIndex === 0}
                  onClick={() => setDetailedItemIndex(prev => Math.max(0, (prev ?? 0) - 1))}
                  aria-label={selectedLang === 'EN' ? 'Previous lesson' : 'Lección anterior'}
                  title={selectedLang === 'EN' ? 'Previous lesson' : 'Lección anterior'}
                  className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-white flex items-center justify-center text-[#1A1816] shadow-xs hover:bg-[#FBBF24] active:scale-95 transition-colors duration-200 cursor-pointer border border-[#EAE2D7]/60 disabled:opacity-30 disabled:cursor-not-allowed"
                >
                  <ChevronLeft className="w-4 h-4 sm:w-5 sm:h-5 stroke-[2.4]" />
                </button>

                <div className="flex items-center gap-1.5">
                  {currentTabItems.map((_, dotIdx) => (
                    <button
                      key={dotIdx}
                      type="button"
                      onClick={() => setDetailedItemIndex(dotIdx)}
                      className={`h-2 rounded-full transition-all cursor-pointer ${
                        dotIdx === detailedItemIndex
                          ? 'w-6 bg-[#1F1A14]'
                          : 'w-2 bg-[#1F1A14]/20 hover:bg-[#1F1A14]/40'
                      }`}
                      aria-label={`Go to lesson ${dotIdx + 1}`}
                    />
                  ))}
                </div>

                <button
                  type="button"
                  disabled={detailedItemIndex >= currentTabItems.length - 1}
                  onClick={() => setDetailedItemIndex(prev => Math.min(currentTabItems.length - 1, (prev ?? 0) + 1))}
                  aria-label={selectedLang === 'EN' ? 'Next lesson' : 'Lección siguiente'}
                  title={selectedLang === 'EN' ? 'Next lesson' : 'Lección siguiente'}
                  className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-white flex items-center justify-center text-[#1A1816] shadow-xs hover:bg-[#FBBF24] active:scale-95 transition-colors duration-200 cursor-pointer border border-[#EAE2D7]/60 disabled:opacity-30 disabled:cursor-not-allowed"
                >
                  <ChevronRight className="w-4 h-4 sm:w-5 sm:h-5 stroke-[2.4]" />
                </button>
              </div>
            </div>
          );
        })() : isAssignmentsLoading && activeTab === 'assigned' ? (
          <div className="py-16 flex items-center justify-center gap-3 text-neutral-600">
            <Loader2 className="w-5 h-5 animate-spin text-neutral-800" />
            <span className="text-[14px]">{selectedLang === 'EN' ? 'Loading assignments...' : 'Cargando asignaciones del profesor...'}</span>
          </div>
        ) : paginatedItems.length === 0 ? (
          <div className="py-14 text-center space-y-2">
            <CheckCircle2 className="w-8 h-8 text-neutral-500 mx-auto" />
            <h4 className="text-[17px] font-bold text-[#1F1A14]">
              {activeTab === 'assigned'
                ? (selectedLang === 'EN' ? 'All caught up!' : '¡Al día con tus asignaciones!')
                : activeTab === 'to_complete'
                ? (selectedLang === 'EN' ? 'No tasks pending' : 'No tienes tareas pendientes')
                : (selectedLang === 'EN' ? 'No completed lessons yet' : 'Aún no tienes lecciones completadas')}
            </h4>
            <p className="text-[10pt] font-normal not-italic text-neutral-700 font-sans leading-relaxed max-w-md mx-auto">
              {activeTab === 'assigned'
                ? (selectedLang === 'EN'
                    ? 'You do not have any pending assignments from your teacher. Explore all lessons using the tabs above.'
                    : 'No tienes asignaciones pendientes de tu profesor. Explora todas las lecciones usando las pestañas de arriba.')
                : activeTab === 'to_complete'
                ? (selectedLang === 'EN'
                    ? 'Explore lessons matching your goals and conversation practice.'
                    : 'Explora lecciones alineadas con tus metas e intereses de conversación.')
                : (selectedLang === 'EN'
                    ? 'Explore the full curriculum to start your next practice session.'
                    : 'Explora el catálogo completo para comenzar tu próxima sesión de práctica.')}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5 w-full">
            {paginatedItems.map((item) => (
              <div
                key={item.id}
                onClick={() => handleItemCardClick(item)}
                className="group flex flex-col justify-between text-left cursor-pointer"
              >
                <div>
                  {/* Circular Photo Wrapped in Circle-Graph Progress Ring (#333333 track + #FACC15 arc) */}
                  {(() => {
                    const isCompleted = item.isCompleted || (item.progressPercentage !== undefined && item.progressPercentage >= 100);
                    const pctVal = isCompleted ? 100 : Math.max(0, Math.min(100, item.progressPercentage ?? 0));
                    const ringRadius = 45.5;
                    const ringStrokeWidth = 9;
                    const ringCircumference = 2 * Math.PI * ringRadius;
                    const ringDashoffset = ringCircumference - (pctVal / 100) * ringCircumference;

                    return (
                      <div className="relative w-full aspect-square shrink-0">
                        <svg
                          viewBox="0 0 100 100"
                          className="w-full h-full -rotate-90 pointer-events-none select-none"
                          aria-hidden="true"
                        >
                          <circle
                            cx="50"
                            cy="50"
                            r={ringRadius}
                            fill="transparent"
                            stroke="#333333"
                            strokeWidth={ringStrokeWidth}
                          />
                          {pctVal > 0 && (
                            <circle
                              cx="50"
                              cy="50"
                              r={ringRadius}
                              fill="transparent"
                              stroke="#FACC15"
                              strokeWidth={ringStrokeWidth}
                              strokeDasharray={ringCircumference}
                              strokeDashoffset={ringDashoffset}
                              strokeLinecap="butt"
                              className="transition-all duration-700 ease-out group-hover:stroke-amber-400"
                            />
                          )}
                        </svg>

                        <div
                          onClick={(e) => {
                            e.stopPropagation();
                            handlePlayItemAudio(e, item);
                          }}
                          title={selectedLang === 'EN' ? 'Click photo for Voyager course explanation' : 'Haz clic en la foto para escuchar la explicación de Voyager'}
                          className="absolute inset-[10%] rounded-full overflow-hidden bg-neutral-200/60 shadow-2xs cursor-pointer"
                        >
                          <img
                            src={item.imageUrl}
                            alt={item.title}
                            className="w-full h-full object-cover rounded-full voyager-duotone-gold-white transition-all duration-300"
                            loading="lazy"
                            onError={(e) => {
                              const target = e.currentTarget;
                              if (!target.dataset.hasFallback) {
                                target.dataset.hasFallback = 'true';
                                const cat = (item.category || '').toLowerCase();
                                if (cat.includes('cívic') || cat.includes('civic') || item.id.includes('civic') || item.id.includes('constitution')) {
                                  target.src = '/assets/lessons/photo-civics-flag.jpg';
                                } else if (cat.includes('career') || cat.includes('negocio') || item.id.includes('job') || item.id.includes('salary')) {
                                  target.src = '/assets/lessons/photo-job-interview.jpg';
                                } else if (cat.includes('health') || cat.includes('salud') || item.id.includes('doctor')) {
                                  target.src = '/assets/lessons/photo-doctor-clinic.jpg';
                                } else if (cat.includes('travel') || cat.includes('viaje') || item.id.includes('airport') || item.id.includes('flight')) {
                                  target.src = '/assets/lessons/photo-airport-transit.jpg';
                                } else {
                                  target.src = '/assets/lessons/photo-job-interview.jpg';
                                }
                              }
                            }}
                          />
                        </div>

                        {(activeTab === 'assigned' || activeTab === 'to_complete') && (
                          isCompleted || pctVal >= 100 ? (
                            <div
                              className="absolute bottom-[17.8%] right-[17.8%] translate-x-1/2 translate-y-1/2 z-10 pointer-events-none select-none"
                              title={selectedLang === 'EN' ? 'Completed (100%)' : 'Completada (100%)'}
                            >
                              <div className="w-5 h-5 rounded-full bg-[#00E676] shadow-2xs" />
                            </div>
                          ) : pctVal > 0 ? (
                            <div
                              className="absolute bottom-[17.8%] right-[17.8%] translate-x-1/2 translate-y-1/2 z-10 pointer-events-none select-none"
                              title={`${pctVal}%`}
                            >
                              <div className="w-6 h-6 rounded-full bg-[#FBBF24] text-[#1F1A14] flex items-center justify-center text-[9px] sm:text-[10px] font-bold font-sans shadow-2xs">
                                {pctVal}%
                              </div>
                            </div>
                          ) : (
                            <div
                              className="absolute bottom-[17.8%] right-[17.8%] translate-x-1/2 translate-y-1/2 z-10 pointer-events-none select-none"
                              title="0%"
                            >
                              <div className="w-6 h-6 rounded-full bg-[#EF4444] text-white flex items-center justify-center text-[9px] sm:text-[10px] font-bold font-sans shadow-2xs">
                                0%
                              </div>
                            </div>
                          )
                        )}
                      </div>
                    );
                  })()}

                  {/* 4. Lesson Name as Main Title with Play icon next to it */}
                  <div className="mt-1.5 sm:mt-2">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleItemActionClick(e, item);
                      }}
                      title={selectedLang === 'EN' ? `Practice ${item.title} in Chat` : `Practicar ${item.title} en el Chat`}
                      aria-label={selectedLang === 'EN' ? `Practice ${item.title} in Chat` : `Practicar ${item.title} en el Chat`}
                      className="group/title flex items-start gap-1.5 text-left cursor-pointer border-0 outline-hidden ring-0 w-full"
                    >
                      <Play className="w-3.5 h-3.5 sm:w-4 sm:h-4 fill-[#1F1A14] text-[#1F1A14] shrink-0 mt-0.5 group-hover/title:fill-amber-800 group-hover/title:text-amber-800 transition-colors" />
                      <span className="text-[13px] sm:text-[14px] font-bold text-neutral-900 leading-snug group-hover/title:text-amber-800 group-hover/title:underline underline-offset-2 transition-colors line-clamp-2">
                        {item.title}
                      </span>
                    </button>
                  </div>

                  {/* 5. Topic / Interest Chip below Title (in Spanish, lowercase, styled like reference chips) */}
                  <div className="mt-1.5 flex items-center">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full border border-black bg-transparent text-black text-[11px] sm:text-[11.5px] font-semibold leading-normal select-none">
                      {getTopicInSpanish(item.category)}
                    </span>
                  </div>

                  {/* 6. Metadata Row with Information Icon bold and clearly visible in former play icon position */}
                  <div className="mt-2 flex items-center justify-between gap-1.5">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleOpenDetailedView(item);
                      }}
                      title={selectedLang === 'EN' ? 'Lesson specifics & objectives' : 'Detalles y objetivos de la lección'}
                      aria-label={selectedLang === 'EN' ? 'Lesson specifics' : 'Detalles de la lección'}
                      className="group/meta flex items-center gap-1.5 text-left cursor-pointer hover:underline underline-offset-2 transition-all border-0 outline-hidden ring-0 min-w-0"
                    >
                      <Info className="w-3.5 h-3.5 sm:w-4 sm:h-4 stroke-[2.8] text-black shrink-0 group-hover/meta:text-amber-800 transition-colors" />
                      <span className="text-[11px] sm:text-[12px] text-neutral-700 group-hover/meta:text-neutral-900 font-medium truncate">
                        {item.level} · {item.estimatedMinutes} min
                      </span>
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Established Voyager Circular Navigation Arrows: Only displayed conditionally when navigation is possible */}
        {detailedItemIndex === null && totalTabItems > itemsPerPage && (catalogPage > 1 || catalogPage < totalPages) && (
          <div className="mt-6 flex items-center gap-2 sm:gap-2.5 justify-start select-none">
            {catalogPage > 1 && (
              <button
                type="button"
                onClick={() => setCatalogPage(p => Math.max(1, p - 1))}
                aria-label={selectedLang === 'EN' ? 'Previous lessons' : 'Lecciones anteriores'}
                title={selectedLang === 'EN' ? 'Previous lessons' : 'Lecciones anteriores'}
                className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-white flex items-center justify-center text-[#1A1816] shadow-xs hover:bg-[#FBBF24] active:scale-95 transition-colors duration-200 cursor-pointer border border-[#EAE2D7]/60"
              >
                <ChevronLeft className="w-4 h-4 sm:w-5 sm:h-5 stroke-[2.4]" />
              </button>
            )}
            {catalogPage < totalPages && (
              <button
                type="button"
                onClick={() => setCatalogPage(p => Math.min(totalPages, p + 1))}
                aria-label={selectedLang === 'EN' ? 'Next lessons' : 'Lecciones siguientes'}
                title={selectedLang === 'EN' ? 'Next lessons' : 'Lecciones siguientes'}
                className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-white flex items-center justify-center text-[#1A1816] shadow-xs hover:bg-[#FBBF24] active:scale-95 transition-colors duration-200 cursor-pointer border border-[#EAE2D7]/60"
              >
                <ChevronRight className="w-4 h-4 sm:w-5 sm:h-5 stroke-[2.4]" />
              </button>
            )}
          </div>
        )}
      </div>



      {/* Voyager Fundamentals Modal */}
      {selectedFundamentalsLesson && (
        <VoyagerFundamentalsModal
          lesson={selectedFundamentalsLesson}
          selectedLang={selectedLang}
          allLessons={VOYAGER_FUNDAMENTALS_LESSONS}
          onClose={() => setSelectedFundamentalsLesson(null)}
          onSelectLesson={(l) => setSelectedFundamentalsLesson(l)}
          onAskVoyager={onAskVoyager}
        />
      )}
    </div>
  );
};
