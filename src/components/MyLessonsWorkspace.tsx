import React, { useState, useMemo, useEffect } from 'react';
import { 
  Search, 
  MessageSquare, 
  Folder, 
  FolderOpen,
  FolderPlus,
  ChevronRight,
  ChevronDown,
  Clock,
  X,
  Check,
  Edit2,
  Trash2,
  Download,
  BookOpen,
  ClipboardList
} from 'lucide-react';
import { SavedChatSession } from './SavedChatsModal';
import { ActiveGuidedLessonState } from './LiveAgent';
import { fetchUnifiedStudentAssignments, UnifiedAssignment } from '../services/teacherStudentService';

export interface MyLessonsWorkspaceProps {
  selectedLang: 'EN' | 'ES';
  isDarkMode?: boolean;
  activeGuidedLesson?: ActiveGuidedLessonState | null;
  onStartLesson: (lesson: any, rawAssignment?: UnifiedAssignment) => void;
  savedChats?: SavedChatSession[];
  onLoadChat?: (chat: SavedChatSession) => void;
  onStartNewChat?: () => void;
  onSendMessage?: (text: string) => void;
}

interface WorkspaceLessonItem {
  id: string;
  title: { EN: string; ES: string };
  status: { EN: string; ES: string };
  category: { EN: string; ES: string };
  folderKey: string;
  level: string;
  objective: { EN: string; ES: string };
  durationMinutes: number;
}

interface LibraryAttachmentItem {
  id: string;
  name: string;
  size: string;
  date: string;
  description: { EN: string; ES: string };
}

interface CustomFolder {
  id: string;
  key: string;
  name: string;
  isCustom: boolean;
}

// Canonical lessons organized automatically by Voyager into academic tracks
const CANONICAL_LESSONS: WorkspaceLessonItem[] = [
  {
    id: 'lesson-job-interview-star',
    title: {
      EN: 'Job Interview Simulation — STAR Method',
      ES: 'Simulación de entrevista de trabajo — Método STAR'
    },
    status: {
      EN: 'In progress',
      ES: 'En curso'
    },
    category: {
      EN: 'Professional English',
      ES: 'Inglés profesional'
    },
    folderKey: 'profesional',
    level: 'B2',
    durationMinutes: 25,
    objective: {
      EN: 'Structure professional responses clearly in English using the STAR framework.',
      ES: 'Estructurar respuestas profesionales con claridad en inglés usando el marco STAR.'
    }
  },
  {
    id: 'lesson-customer-service',
    title: {
      EN: 'Customer Service & Conflict Resolution',
      ES: 'Servicio al cliente y resolución de conflictos'
    },
    status: {
      EN: 'In progress',
      ES: 'En curso'
    },
    category: {
      EN: 'Professional English',
      ES: 'Inglés profesional'
    },
    folderKey: 'profesional',
    level: 'B2',
    durationMinutes: 20,
    objective: {
      EN: 'Handle polite customer inquiries and resolve unexpected issues with confidence.',
      ES: 'Atender consultas con cortesía y resolver imprevistos con seguridad.'
    }
  },
  {
    id: 'lesson-civics-128',
    title: {
      EN: 'USCIS Civics 128: Judicial Branch & Bill of Rights',
      ES: 'USCIS Cívica 128: Rama Judicial y Carta de Derechos'
    },
    status: {
      EN: 'In progress',
      ES: 'En curso'
    },
    category: {
      EN: 'Citizenship Prep',
      ES: 'Preparación para ciudadanía'
    },
    folderKey: 'ciudadania',
    level: 'B1-B2',
    durationMinutes: 20,
    objective: {
      EN: 'Master official citizenship questions 37 to 57 with accurate spoken English responses.',
      ES: 'Dominar las preguntas 37 a 57 de cívica con respuestas orales fluidas.'
    }
  },
  {
    id: 'lesson-civics-system-gov',
    title: {
      EN: 'USCIS Civics 128: System of Government & Constitution',
      ES: 'USCIS Cívica 128: Sistema de Gobierno y Constitución'
    },
    status: {
      EN: 'In progress',
      ES: 'En curso'
    },
    category: {
      EN: 'Citizenship Prep',
      ES: 'Preparación para ciudadanía'
    },
    folderKey: 'ciudadania',
    level: 'B1',
    durationMinutes: 25,
    objective: {
      EN: 'Explain branches of government and the US Supreme Court structure.',
      ES: 'Explicar los poderes del gobierno y la estructura de la Corte Suprema.'
    }
  },
  {
    id: 'lesson-doctor-pharmacy',
    title: {
      EN: 'Healthcare & Prescription Consultation',
      ES: 'Consulta médica y recetas en farmacia'
    },
    status: {
      EN: 'Completed',
      ES: 'Completada'
    },
    category: {
      EN: 'Everyday English',
      ES: 'Inglés cotidiano'
    },
    folderKey: 'cotidiano',
    level: 'B1',
    durationMinutes: 15,
    objective: {
      EN: 'Describe medical symptoms accurately and understand pharmacist instructions.',
      ES: 'Describir síntomas con precisión y comprender las indicaciones médicas.'
    }
  },
  {
    id: 'lesson-supermarket-shopping',
    title: {
      EN: 'Navigating Supermarkets & Asking for Assistance',
      ES: 'Compras en el supermercado y consultas en tienda'
    },
    status: {
      EN: 'Completed',
      ES: 'Completada'
    },
    category: {
      EN: 'Everyday English',
      ES: 'Inglés cotidiano'
    },
    folderKey: 'cotidiano',
    level: 'A2',
    durationMinutes: 15,
    objective: {
      EN: 'Ask store staff for ingredients, clarify prices, and handle checkout.',
      ES: 'Preguntar por productos, consultar precios y pagar en caja con cortesía.'
    }
  },
  {
    id: 'lesson-grammar-perfect',
    title: {
      EN: 'Applied Grammar: Present Perfect vs Past Simple',
      ES: 'Gramática aplicada: Presente Perfecto vs Pasado Simple'
    },
    status: {
      EN: 'In progress',
      ES: 'En curso'
    },
    category: {
      EN: "Teacher's Lessons",
      ES: 'Lecciones de mi profesora'
    },
    folderKey: 'docente',
    level: 'B1',
    durationMinutes: 20,
    objective: {
      EN: 'Distinguish between indefinite past experiences and specific completed events.',
      ES: 'Distinguir entre experiencias pasadas no específicas y eventos con fecha.'
    }
  }
];

// Authorized Educational Attachments in the Library (PDFs, Diagrams, Teacher Materials)
const INITIAL_LIBRARY_ATTACHMENTS: LibraryAttachmentItem[] = [
  {
    id: 'lib-star-guide',
    name: 'Guia_Metodo_STAR_Entrevistas.pdf',
    size: '1.2 MB',
    date: '3 Nov',
    description: {
      EN: 'Structured response rubric for STAR method interview questions.',
      ES: 'Rúbrica de respuestas estructuradas para entrevistas método STAR.'
    }
  },
  {
    id: 'lib-civics-128',
    name: 'USCIS_Civics_128_Preguntas_Oficiales.pdf',
    size: '850 KB',
    date: '2 Nov',
    description: {
      EN: 'Official USCIS Civics 128 study questions with phonetic key.',
      ES: 'Cuestionario oficial de 128 preguntas con guía fonética.'
    }
  },
  {
    id: 'lib-tenses-diagram',
    name: 'Infografia_Tiempos_Verbales_Ingles.png',
    size: '2.4 MB',
    date: '28 Oct',
    description: {
      EN: 'Visual timeline comparing Past Simple and Present Perfect.',
      ES: 'Línea de tiempo visual comparando Pasado Simple y Presente Perfecto.'
    }
  },
  {
    id: 'lib-teacher-rubric',
    name: 'Rubrica_Evaluacion_Oral_Docente_Garcia.pdf',
    size: '420 KB',
    date: '15 Oct',
    description: {
      EN: 'Evaluation criteria shared by Professor García for oral fluency.',
      ES: 'Criterios de fluidez oral compartidos por el Profesor García.'
    }
  }
];

// Helper to extract uppercase file extension for clean rectangular tags
function getFileExtension(filename: string): string {
  const parts = filename.split('.');
  if (parts.length > 1) {
    const ext = parts.pop()?.toUpperCase() || 'FILE';
    return ext.length > 5 ? ext.slice(0, 4) : ext;
  }
  return 'DOC';
}

export const MyLessonsWorkspace: React.FC<MyLessonsWorkspaceProps> = ({
  selectedLang,
  activeGuidedLesson,
  onStartLesson,
  savedChats = [],
  onLoadChat,
  onSendMessage
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeLessonId, setActiveLessonId] = useState<string | null>(
    activeGuidedLesson?.id || CANONICAL_LESSONS[0].id
  );

  // Student assignments loaded from teacherStudentService
  const [studentAssignments, setStudentAssignments] = useState<UnifiedAssignment[]>([]);

  // Collapsible section headers — all open by default for scanning
  const [collapsedSections, setCollapsedSections] = useState<Record<string, boolean>>({
    assigned: false,
    lessons: false,
    library: false,
    recent: false
  });

  // Collapsible custom folders within the Library
  const [openFolders, setOpenFolders] = useState<Record<string, boolean>>({});

  // Custom user-managed folders state (stored in localStorage)
  const [customFolders, setCustomFolders] = useState<CustomFolder[]>(() => {
    try {
      const saved = localStorage.getItem('voyager_custom_folders');
      if (saved) return JSON.parse(saved);
    } catch (e) {}
    return [];
  });

  // Inline folder creation state within the Library
  const [isCreatingFolder, setIsCreatingFolder] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');
  const [editingFolderId, setEditingFolderId] = useState<string | null>(null);
  const [editingFolderName, setEditingFolderName] = useState('');
  const [libraryFeedback, setLibraryFeedback] = useState<string | null>(null);

  // Load assignments assigned by teachers
  useEffect(() => {
    let isSubscribed = true;
    const loadAssignments = async () => {
      try {
        let studentId = 'STU-001';
        let studentEmail = 'theorangesnowman@gmail.com';
        const userAccount = localStorage.getItem('voyager_user_account');
        if (userAccount) {
          const parsed = JSON.parse(userAccount);
          if (parsed.id || parsed.uid) studentId = parsed.id || parsed.uid;
          if (parsed.email) studentEmail = parsed.email;
        }
        const res = await fetchUnifiedStudentAssignments(studentId, studentEmail);
        if (isSubscribed && res?.assignments) {
          setStudentAssignments(res.assignments);
        }
      } catch (err) {
        console.warn('Failed to load assignments in MyLessonsWorkspace:', err);
      }
    };

    loadAssignments();

    // Listen for updates from teacher assignments
    const handleAssignmentsUpdated = () => {
      loadAssignments();
    };
    window.addEventListener('voyager_assignments_updated', handleAssignmentsUpdated);

    return () => {
      isSubscribed = false;
      window.removeEventListener('voyager_assignments_updated', handleAssignmentsUpdated);
    };
  }, []);

  // Sync active lesson ID if external guided lesson changes
  useEffect(() => {
    if (activeGuidedLesson?.id) {
      setActiveLessonId(activeGuidedLesson.id);
    }
  }, [activeGuidedLesson?.id]);

  // Persist custom folders
  useEffect(() => {
    try {
      localStorage.setItem('voyager_custom_folders', JSON.stringify(customFolders));
    } catch (e) {}
  }, [customFolders]);

  const toggleSection = (sectionKey: string) => {
    setCollapsedSections((prev) => ({
      ...prev,
      [sectionKey]: !prev[sectionKey]
    }));
  };

  const toggleFolder = (folderKey: string) => {
    setOpenFolders((prev) => ({
      ...prev,
      [folderKey]: !prev[folderKey]
    }));
  };

  // Folder creation handler within the Library
  const handleCreateFolder = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = newFolderName.trim();
    if (!trimmed) return;

    const newKey = `folder-${Date.now()}`;
    const newFolder: CustomFolder = {
      id: newKey,
      key: newKey,
      name: trimmed,
      isCustom: true
    };

    setCustomFolders((prev) => [...prev, newFolder]);
    setOpenFolders((prev) => ({ ...prev, [newKey]: true }));
    setNewFolderName('');
    setIsCreatingFolder(false);
  };

  // Folder rename handler
  const handleSaveRenameFolder = (folderId: string) => {
    const trimmed = editingFolderName.trim();
    if (!trimmed) return;
    setCustomFolders((prev) =>
      prev.map((f) => (f.id === folderId ? { ...f, name: trimmed } : f))
    );
    setEditingFolderId(null);
    setEditingFolderName('');
  };

  // Folder delete handler (for empty custom folders)
  const handleDeleteFolder = (folderId: string) => {
    setCustomFolders((prev) => prev.filter((f) => f.id !== folderId));
  };

  const handleSelectLesson = (lesson: WorkspaceLessonItem) => {
    setActiveLessonId(lesson.id);
    onStartLesson({
      id: lesson.id,
      title: lesson.title[selectedLang],
      category: lesson.category[selectedLang],
      level: lesson.level,
      objective: lesson.objective[selectedLang]
    });
  };

  const handleSelectAssignment = (assignment: UnifiedAssignment) => {
    setActiveLessonId(assignment.lessonId || assignment.id);
    onStartLesson({
      id: assignment.lessonId || assignment.id,
      title: assignment.title,
      category: assignment.category || 'Teacher Assignment',
      level: assignment.level || 'B2',
      objective: assignment.objective || assignment.instructions,
      instructions: assignment.instructions,
      assignmentId: assignment.id,
      rawAssignment: assignment
    }, assignment);
  };

  const handleLibraryAttachmentClick = (attachment: LibraryAttachmentItem) => {
    setLibraryFeedback(
      selectedLang === 'EN'
        ? `Opening ${attachment.name}...`
        : `Abriendo ${attachment.name}...`
    );
    setTimeout(() => setLibraryFeedback(null), 2500);
  };

  // Filter lessons based on search query
  const filteredLessons = useMemo(() => {
    if (!searchQuery.trim()) return CANONICAL_LESSONS;
    const q = searchQuery.toLowerCase();
    return CANONICAL_LESSONS.filter(
      (l) =>
        l.title[selectedLang].toLowerCase().includes(q) ||
        l.category[selectedLang].toLowerCase().includes(q) ||
        l.objective[selectedLang].toLowerCase().includes(q)
    );
  }, [searchQuery, selectedLang]);

  // Filter assigned activities based on search query
  const filteredAssignments = useMemo(() => {
    if (!searchQuery.trim()) return studentAssignments;
    const q = searchQuery.toLowerCase();
    return studentAssignments.filter(
      (a) =>
        (a.title && a.title.toLowerCase().includes(q)) ||
        (a.objective && a.objective.toLowerCase().includes(q)) ||
        (a.category && a.category.toLowerCase().includes(q))
    );
  }, [searchQuery, studentAssignments]);

  return (
    <div className="w-full h-full bg-[#000000] text-zinc-100 flex flex-col overflow-y-auto select-none font-sans px-4 sm:px-6 md:px-8 py-3 text-left no-scrollbar">
      {/* ========================================================================= */}
      {/* 1. SEARCH BAR (FLUSH LEFT, ENHANCED CONTRAST)                              */}
      {/* ========================================================================= */}
      <div className="shrink-0 mb-4 max-w-xl text-left">
        <div className="relative">
          <Search className="w-4 h-4 text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={
              selectedLang === 'EN'
                ? 'Search lessons, topics, or objectives...'
                : 'Buscar lecciones, temas u objetivos...'
            }
            className="w-full bg-[#1e1e24] border border-zinc-700 hover:border-zinc-600 focus:border-amber-400/80 rounded-xl pl-9 pr-8 py-2 text-xs text-zinc-100 placeholder:text-zinc-400 focus:outline-none transition-colors"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-200 p-0.5 cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Library download/open toast feedback */}
      {libraryFeedback && (
        <div className="mb-3 px-3 py-1.5 rounded-lg bg-zinc-800 border border-amber-500/50 text-amber-300 text-xs flex items-center gap-2 max-w-md animate-fade-in">
          <Check className="w-3.5 h-3.5 text-amber-400" />
          <span>{libraryFeedback}</span>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 2. ASIGNADOS / ASSIGNED (REPLACES PINNED — TEACHER ASSIGNMENTS)            */}
      {/* ========================================================================= */}
      <div className="mb-4 text-left">
        <button
          type="button"
          onClick={() => toggleSection('assigned')}
          className="w-full flex items-center justify-between py-1.5 text-[11px] font-semibold text-zinc-300 uppercase tracking-wider hover:text-white transition-colors cursor-pointer border-b border-zinc-750 mb-1"
        >
          <div className="flex items-center gap-2">
            {collapsedSections.assigned ? (
              <ChevronRight className="w-3.5 h-3.5 text-zinc-400" />
            ) : (
              <ChevronDown className="w-3.5 h-3.5 text-zinc-400" />
            )}
            <ClipboardList className="w-3.5 h-3.5 text-amber-400" />
            <span className="text-zinc-200 font-bold">
              {selectedLang === 'EN' ? 'Assigned' : 'Asignados'}
            </span>
          </div>
          <span className="text-[10px] font-mono text-zinc-400">
            {filteredAssignments.length} {selectedLang === 'EN' ? 'tasks' : 'tareas'}
          </span>
        </button>

        {!collapsedSections.assigned && (
          <div className="space-y-1 mt-1 pl-2">
            {filteredAssignments.length === 0 ? (
              <div className="py-2.5 px-3 text-xs text-zinc-400 italic">
                {selectedLang === 'EN'
                  ? 'No assignments currently assigned by your teachers.'
                  : 'No tienes tareas asignadas por tus docentes actualmente.'}
              </div>
            ) : (
              filteredAssignments.map((assignment) => {
                const isActive =
                  activeLessonId === assignment.lessonId || activeLessonId === assignment.id;
                const statusNorm = (assignment.status || 'PENDING').toUpperCase();
                const isDone = statusNorm === 'COMPLETED' || statusNorm === 'GRADED';
                const isInProgress = statusNorm === 'IN_PROGRESS';

                const statusLabel = isDone
                  ? (selectedLang === 'EN' ? 'Completed' : 'Completada')
                  : isInProgress
                  ? (selectedLang === 'EN' ? 'In Progress' : 'En curso')
                  : (selectedLang === 'EN' ? 'Pending' : 'Pendiente');

                const statusBadgeStyle = isDone
                  ? 'bg-emerald-950/80 text-emerald-300 border-emerald-800'
                  : isInProgress
                  ? 'bg-amber-950/80 text-amber-300 border-amber-800'
                  : 'bg-zinc-800 text-zinc-300 border-zinc-700';

                return (
                  <div
                    key={assignment.id}
                    onClick={() => handleSelectAssignment(assignment)}
                    className={`group flex items-center justify-between px-3 py-2.5 rounded-lg cursor-pointer transition-colors ${
                      isActive
                        ? 'bg-zinc-800 text-white font-medium border border-zinc-600 shadow-xs'
                        : 'text-zinc-200 hover:bg-[#222228] hover:text-white'
                    }`}
                  >
                    <div className="flex items-center gap-3 min-w-0 pr-3">
                      <span
                        className={`w-2 h-2 rounded-full shrink-0 ${
                          isDone
                            ? 'bg-emerald-400'
                            : isInProgress
                            ? 'bg-amber-400'
                            : 'bg-zinc-400'
                        }`}
                      />
                      <div className="min-w-0">
                        <div className="text-xs truncate font-medium group-hover:text-amber-300">
                          {assignment.title}
                        </div>
                        <div className="text-[11px] text-zinc-300 truncate">
                          {assignment.teacherName ? `${assignment.teacherName} · ` : ''}
                          {assignment.objective || assignment.instructions}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0 text-right">
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-zinc-800 text-zinc-300 border border-zinc-700">
                        {assignment.level || 'B2'}
                      </span>
                      <span
                        className={`text-[10px] font-mono px-2 py-0.5 rounded-md border ${statusBadgeStyle}`}
                      >
                        {statusLabel}
                      </span>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        )}
      </div>

      {/* ========================================================================= */}
      {/* 3. MIS LECCIONES / MY LESSONS (ORGANIZED AUTOMATICALLY BY VOYAGER)         */}
      {/* ========================================================================= */}
      <div className="mb-4 text-left">
        <button
          type="button"
          onClick={() => toggleSection('lessons')}
          className="w-full flex items-center justify-between py-1.5 text-[11px] font-semibold text-zinc-300 uppercase tracking-wider hover:text-white transition-colors cursor-pointer border-b border-zinc-750 mb-1"
        >
          <div className="flex items-center gap-2">
            {collapsedSections.lessons ? (
              <ChevronRight className="w-3.5 h-3.5 text-zinc-400" />
            ) : (
              <ChevronDown className="w-3.5 h-3.5 text-zinc-400" />
            )}
            <span className="text-zinc-200 font-bold">
              {selectedLang === 'EN' ? 'My Lessons' : 'Mis lecciones'}
            </span>
          </div>
          <span className="text-[10px] font-mono text-zinc-400">
            {filteredLessons.length}
          </span>
        </button>

        {!collapsedSections.lessons && (
          <div className="space-y-1 mt-1 pl-2">
            {filteredLessons.map((lesson) => {
              const isActive = activeLessonId === lesson.id;
              const isCompleted =
                lesson.status[selectedLang] === 'Completed' ||
                lesson.status[selectedLang] === 'Completada';
              return (
                <div
                  key={lesson.id}
                  onClick={() => handleSelectLesson(lesson)}
                  className={`group flex items-center justify-between px-3 py-2.5 rounded-lg cursor-pointer transition-colors ${
                    isActive
                      ? 'bg-zinc-800 text-white font-medium border border-zinc-600 shadow-xs'
                      : 'text-zinc-200 hover:bg-[#222228] hover:text-white'
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0 pr-3">
                    <span
                      className={`w-2 h-2 rounded-full shrink-0 ${
                        isActive
                          ? 'bg-amber-400 ring-2 ring-amber-400/20'
                          : isCompleted
                          ? 'bg-emerald-400'
                          : 'bg-zinc-500'
                      }`}
                    />
                    <div className="min-w-0">
                      <div className="text-xs truncate font-medium group-hover:text-amber-300">
                        {lesson.title[selectedLang]}
                      </div>
                      <div className="text-[11px] text-zinc-300 truncate">
                        <span className="text-zinc-400 mr-1.5 font-medium">
                          {lesson.category[selectedLang]} ·
                        </span>
                        {lesson.objective[selectedLang]}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0 text-right">
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-zinc-800 text-zinc-300 border border-zinc-700">
                      {lesson.level}
                    </span>
                    {isCompleted ? (
                      <span className="text-[10px] font-mono text-emerald-400 shrink-0 font-medium">
                        {selectedLang === 'EN' ? 'Done' : 'Listo'}
                      </span>
                    ) : (
                      <span className="text-[10px] font-mono text-zinc-400 shrink-0">
                        {lesson.durationMinutes}m
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ========================================================================= */}
      {/* 4. BIBLIOTECA (LIBRARY MATERIALS + INLINE PERSONAL FOLDERS)               */}
      {/* ========================================================================= */}
      <div className="mb-4 text-left">
        <button
          type="button"
          onClick={() => toggleSection('library')}
          className="w-full flex items-center justify-between py-1.5 text-[11px] font-semibold text-zinc-300 uppercase tracking-wider hover:text-white transition-colors cursor-pointer border-b border-zinc-750 mb-1"
        >
          <div className="flex items-center gap-2">
            {collapsedSections.library ? (
              <ChevronRight className="w-3.5 h-3.5 text-zinc-400" />
            ) : (
              <ChevronDown className="w-3.5 h-3.5 text-zinc-400" />
            )}
            <BookOpen className="w-3.5 h-3.5 text-amber-400" />
            <span className="text-zinc-200 font-bold">
              {selectedLang === 'EN' ? 'Library' : 'Biblioteca'}
            </span>
          </div>
          <span className="text-[10px] font-mono text-zinc-400">
            {INITIAL_LIBRARY_ATTACHMENTS.length} {selectedLang === 'EN' ? 'materials' : 'materiales'}
          </span>
        </button>

        {!collapsedSections.library && (
          <div className="space-y-1 mt-1 pl-2">
            {/* Library Attachments List — Minimalist rectangular gray labels */}
            {INITIAL_LIBRARY_ATTACHMENTS.map((item) => {
              const fileExt = getFileExtension(item.name);
              return (
                <div
                  key={item.id}
                  onClick={() => handleLibraryAttachmentClick(item)}
                  className="group flex items-center justify-between px-3 py-2 rounded-lg text-zinc-200 hover:bg-[#222228] hover:text-white transition-colors cursor-pointer"
                >
                  <div className="flex items-center gap-2.5 min-w-0 pr-2">
                    {/* Small neutral-gray rectangular extension label (no colorful decorative icons) */}
                    <span className="w-10 h-5 rounded-[4px] bg-zinc-700 text-zinc-200 text-[10px] font-mono font-bold flex items-center justify-center shrink-0 tracking-wider">
                      {fileExt}
                    </span>

                    <div className="min-w-0">
                      <div className="text-xs font-medium truncate group-hover:text-amber-300">
                        {item.name}
                      </div>
                      <div className="text-[11px] text-zinc-300 truncate">
                        {item.description[selectedLang]}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0 text-right text-[10px] font-mono text-zinc-400">
                    <span>{item.size}</span>
                    <span>·</span>
                    <span>{item.date}</span>
                    <Download className="w-3.5 h-3.5 text-zinc-400 group-hover:text-amber-400 ml-1" />
                  </div>
                </div>
              );
            })}

            {/* Subsection: Personal Folders inside Library */}
            <div className="mt-3 pt-3 border-t border-zinc-750">
              <div className="flex items-center justify-between mb-2 px-1">
                <span className="text-[11px] font-semibold text-zinc-300 uppercase tracking-wider">
                  {selectedLang === 'EN' ? 'Personal Folders' : 'Carpetas personales'}
                </span>
                {!isCreatingFolder && (
                  <button
                    type="button"
                    onClick={() => setIsCreatingFolder(true)}
                    className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 text-[11px] font-medium text-zinc-200 transition-colors cursor-pointer active:scale-[0.98]"
                    title={selectedLang === 'EN' ? 'New Folder' : 'Nueva carpeta'}
                  >
                    <FolderPlus className="w-3.5 h-3.5 text-amber-400" />
                    <span>{selectedLang === 'EN' ? 'New Folder' : 'Nueva carpeta'}</span>
                  </button>
                )}
              </div>

              {/* Inline Folder Creation Form */}
              {isCreatingFolder && (
                <form
                  onSubmit={handleCreateFolder}
                  className="flex items-center gap-2 mb-2 p-1.5 bg-zinc-800 border border-zinc-700 rounded-lg animate-fade-in"
                >
                  <Folder className="w-4 h-4 text-amber-400 shrink-0 ml-1.5" />
                  <input
                    type="text"
                    autoFocus
                    value={newFolderName}
                    onChange={(e) => setNewFolderName(e.target.value)}
                    placeholder={
                      selectedLang === 'EN'
                        ? 'Folder name (e.g. Work Vocabulary)...'
                        : 'Nombre de la carpeta (ej. Vocabulario laboral)...'
                    }
                    className="flex-1 bg-transparent text-xs text-white placeholder:text-zinc-400 focus:outline-none px-1"
                  />
                  <button
                    type="submit"
                    disabled={!newFolderName.trim()}
                    className="px-2.5 py-1 bg-amber-500 hover:bg-amber-400 disabled:opacity-40 text-black text-xs font-bold rounded-md transition-colors cursor-pointer"
                  >
                    {selectedLang === 'EN' ? 'Create' : 'Crear'}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setIsCreatingFolder(false);
                      setNewFolderName('');
                    }}
                    className="p-1 text-zinc-400 hover:text-zinc-200 rounded-md cursor-pointer"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </form>
              )}

              {/* Custom Folders list */}
              {customFolders.length === 0 && !isCreatingFolder && (
                <div className="py-1 px-1 text-[11px] text-zinc-400 italic">
                  {selectedLang === 'EN'
                    ? 'No personal folders yet. Click "New Folder" to create one.'
                    : 'Aún no tienes carpetas personales. Haz clic en "Nueva carpeta" para crear una.'}
                </div>
              )}

              {customFolders.map((folder) => {
                const isOpen = !!openFolders[folder.key];
                const isEditing = editingFolderId === folder.id;

                return (
                  <div key={folder.id} className="space-y-1 mt-1">
                    <div className="flex items-center justify-between px-3 py-2 rounded-lg text-zinc-200 hover:bg-[#222228] hover:text-white transition-colors group">
                      {isEditing ? (
                        <div className="flex items-center gap-2 flex-1 mr-2">
                          <Folder className="w-4 h-4 text-amber-400 shrink-0" />
                          <input
                            type="text"
                            autoFocus
                            value={editingFolderName}
                            onChange={(e) => setEditingFolderName(e.target.value)}
                            className="flex-1 bg-zinc-800 border border-zinc-700 px-2 py-0.5 rounded text-xs text-white focus:outline-none"
                          />
                          <button
                            type="button"
                            onClick={() => handleSaveRenameFolder(folder.id)}
                            className="p-1 text-emerald-400 hover:text-emerald-300 cursor-pointer"
                          >
                            <Check className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => setEditingFolderId(null)}
                            className="p-1 text-zinc-400 hover:text-zinc-200 cursor-pointer"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ) : (
                        <>
                          <div
                            onClick={() => toggleFolder(folder.key)}
                            className="flex items-center gap-2.5 min-w-0 pr-2 flex-1 cursor-pointer"
                          >
                            {isOpen ? (
                              <FolderOpen className="w-4 h-4 text-amber-400 shrink-0" />
                            ) : (
                              <Folder className="w-4 h-4 text-zinc-400 group-hover:text-amber-400 shrink-0" />
                            )}
                            <span className="text-xs font-semibold truncate text-zinc-200">
                              {folder.name}
                            </span>
                            <span className="text-[10px] font-mono text-zinc-400">(0)</span>
                          </div>

                          <div className="flex items-center gap-1.5 shrink-0">
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                setEditingFolderId(folder.id);
                                setEditingFolderName(folder.name);
                              }}
                              className="p-1 text-zinc-400 hover:text-zinc-200 rounded opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                              title={selectedLang === 'EN' ? 'Rename folder' : 'Renombrar carpeta'}
                            >
                              <Edit2 className="w-3 h-3" />
                            </button>
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDeleteFolder(folder.id);
                              }}
                              className="p-1 text-zinc-400 hover:text-rose-400 rounded opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                              title={selectedLang === 'EN' ? 'Delete folder' : 'Eliminar carpeta'}
                            >
                              <Trash2 className="w-3 h-3" />
                            </button>
                            <div
                              onClick={() => toggleFolder(folder.key)}
                              className="cursor-pointer text-zinc-400 pl-1"
                            >
                              {isOpen ? (
                                <ChevronDown className="w-3.5 h-3.5" />
                              ) : (
                                <ChevronRight className="w-3.5 h-3.5" />
                              )}
                            </div>
                          </div>
                        </>
                      )}
                    </div>

                    {/* Empty custom folder placeholder */}
                    {isOpen && !isEditing && (
                      <div className="pl-6 pr-2 py-1.5 border-l border-zinc-700 ml-4 text-xs text-zinc-400 italic">
                        {selectedLang === 'EN'
                          ? 'Empty folder. Add notes and study materials here.'
                          : 'Carpeta vacía. Guarda notas y materiales de estudio aquí.'}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* ========================================================================= */}
      {/* 5. CONVERSACIONES RECIENTES / RECENT CONVERSATIONS                         */}
      {/* ========================================================================= */}
      <div className="mb-6 text-left">
        <button
          type="button"
          onClick={() => toggleSection('recent')}
          className="w-full flex items-center justify-between py-1.5 text-[11px] font-semibold text-zinc-300 uppercase tracking-wider hover:text-white transition-colors cursor-pointer border-b border-zinc-750 mb-1"
        >
          <div className="flex items-center gap-2">
            {collapsedSections.recent ? (
              <ChevronRight className="w-3.5 h-3.5 text-zinc-400" />
            ) : (
              <ChevronDown className="w-3.5 h-3.5 text-zinc-400" />
            )}
            <span className="text-zinc-200 font-bold">
              {selectedLang === 'EN' ? 'Recent Conversations' : 'Conversaciones recientes'}
            </span>
          </div>
          <Clock className="w-3.5 h-3.5 text-zinc-400" />
        </button>

        {!collapsedSections.recent && (
          <div className="space-y-1 mt-1 pl-2">
            {savedChats && savedChats.length > 0 ? (
              savedChats.slice(0, 5).map((chat) => (
                <div
                  key={chat.id}
                  onClick={() => onLoadChat && onLoadChat(chat)}
                  className="flex items-center justify-between px-3 py-2 rounded-lg text-zinc-200 hover:bg-[#222228] hover:text-white transition-colors cursor-pointer"
                >
                  <div className="flex items-center gap-2.5 min-w-0 pr-2">
                    <MessageSquare className="w-3.5 h-3.5 text-zinc-400 shrink-0" />
                    <span className="text-xs truncate">{chat.title}</span>
                  </div>
                  <span className="text-[10px] text-zinc-400 font-mono shrink-0">
                    {chat.date || (selectedLang === 'EN' ? 'Recent' : 'Reciente')}
                  </span>
                </div>
              ))
            ) : (
              <>
                <div
                  onClick={() => {
                    if (onSendMessage) {
                      onSendMessage(
                        selectedLang === 'EN'
                          ? 'Practice job interview STAR method questions.'
                          : 'Practicar preguntas de entrevista con método STAR.'
                      );
                    }
                  }}
                  className="flex items-center justify-between px-3 py-2 rounded-lg text-zinc-200 hover:bg-[#222228] hover:text-white transition-colors cursor-pointer"
                >
                  <div className="flex items-center gap-2.5 min-w-0 pr-2">
                    <MessageSquare className="w-3.5 h-3.5 text-zinc-400 shrink-0" />
                    <span className="text-xs truncate">
                      {selectedLang === 'EN'
                        ? 'Job Interview Practice Session'
                        : 'Sesión de práctica: Entrevista STAR'}
                    </span>
                  </div>
                  <span className="text-[10px] text-zinc-400 font-mono shrink-0">
                    {selectedLang === 'EN' ? 'Today' : 'Hoy'}
                  </span>
                </div>

                <div
                  onClick={() => {
                    if (onSendMessage) {
                      onSendMessage(
                        selectedLang === 'EN'
                          ? 'Civics questions: Bill of rights and Constitution.'
                          : 'Preguntas de ciudadanía: Derechos y Constitución.'
                      );
                    }
                  }}
                  className="flex items-center justify-between px-3 py-2 rounded-lg text-zinc-200 hover:bg-[#222228] hover:text-white transition-colors cursor-pointer"
                >
                  <div className="flex items-center gap-2.5 min-w-0 pr-2">
                    <MessageSquare className="w-3.5 h-3.5 text-zinc-400 shrink-0" />
                    <span className="text-xs truncate">
                      {selectedLang === 'EN'
                        ? 'USCIS Civics 128 Naturalization Review'
                        : 'Repaso Cívica 128 Naturalización'}
                    </span>
                  </div>
                  <span className="text-[10px] text-zinc-400 font-mono shrink-0">
                    {selectedLang === 'EN' ? 'Yesterday' : 'Ayer'}
                  </span>
                </div>

                <div
                  onClick={() => {
                    if (onSendMessage) {
                      onSendMessage(
                        selectedLang === 'EN'
                          ? 'Past simple vs Present perfect practice dialogue.'
                          : 'Diálogo de práctica: Pasado simple vs Presente perfecto.'
                      );
                    }
                  }}
                  className="flex items-center justify-between px-3 py-2 rounded-lg text-zinc-200 hover:bg-[#222228] hover:text-white transition-colors cursor-pointer"
                >
                  <div className="flex items-center gap-2.5 min-w-0 pr-2">
                    <MessageSquare className="w-3.5 h-3.5 text-zinc-400 shrink-0" />
                    <span className="text-xs truncate">
                      {selectedLang === 'EN'
                        ? 'Applied Grammar: Verb Tenses Dialogue'
                        : 'Gramática aplicada: Tiempos verbales'}
                    </span>
                  </div>
                  <span className="text-[10px] text-zinc-400 font-mono shrink-0">
                    3 nov
                  </span>
                </div>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default MyLessonsWorkspace;
