import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { ChevronLeft, ChevronRight, Play, X, Clock, Plus, Trash2, CheckCircle2, Calendar } from 'lucide-react';
import { SavedChatSession } from './SavedChatsModal';
import { UnifiedAssignment, fetchUnifiedStudentAssignments, updateUnifiedAssignmentStatus, parseDateToKey, assignHomeworkToStudent } from '../services/teacherStudentService';

export interface StudentPersonalTask {
  id: string;
  studentId: string;
  dateKey: string; // YYYY-MM-DD
  title: string;
  objective?: string;
  category: 'task' | 'reminder' | 'interest' | 'goal' | 'event';
  completed: boolean;
  createdAt: string;
}

interface ActivityCalendarProps {
  selectedLang: 'EN' | 'ES';
  savedChats: SavedChatSession[];
  targetGoalMinutes?: number;
  onLoadChat?: (chat: SavedChatSession) => void;
  onAskVoyager?: (prompt: string) => void;
  user?: any;
}

export const ActivityCalendar: React.FC<ActivityCalendarProps> = ({
  selectedLang,
  savedChats,
  targetGoalMinutes = 20,
  onLoadChat,
  onAskVoyager,
  user,
}) => {
  // Helper to format a Date into user's local YYYY-MM-DD
  const formatLocalDateKey = (d: Date) => {
    const yr = d.getFullYear();
    const mo = String(d.getMonth() + 1).padStart(2, '0');
    const dy = String(d.getDate()).padStart(2, '0');
    return `${yr}-${mo}-${dy}`;
  };

  // Automatic current local date detection using device time zone
  const [todayKey, setTodayKey] = useState<string>(() => formatLocalDateKey(new Date()));
  const [currentMonth, setCurrentMonth] = useState<Date>(() => {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), 1);
  });
  const [viewMode, setViewMode] = useState<'month' | 'week' | 'day' | 'tasks'>('month');
  const [taskFilter, setTaskFilter] = useState<'all' | 'assigned' | 'personal' | 'completed'>('all');
  const [selectedDay, setSelectedDay] = useState<string>(() => formatLocalDateKey(new Date()));
  const [assignments, setAssignments] = useState<UnifiedAssignment[]>([]);
  const [isLoadingAssignments, setIsLoadingAssignments] = useState<boolean>(false);
  const [isAddingTask, setIsAddingTask] = useState<boolean>(false);
  const [newTaskTitle, setNewTaskTitle] = useState<string>('');
  const [newTaskObjective, setNewTaskObjective] = useState<string>('');
  const [newTaskCategory, setNewTaskCategory] = useState<'task' | 'reminder' | 'interest' | 'goal' | 'event'>('task');
  const [newTaskDateKey, setNewTaskDateKey] = useState<string>(() => formatLocalDateKey(new Date()));
  const [isSavingTask, setIsSavingTask] = useState<boolean>(false);



  // Additional student-scheduled practice dates for teacher assignments
  const [extraPracticeDates, setExtraPracticeDates] = useState<Record<string, string[]>>(() => {
    if (typeof window === 'undefined') return {};
    try {
      const raw = localStorage.getItem('voyager_assignment_extra_dates');
      if (raw) return JSON.parse(raw);
    } catch (e) {}
    return {};
  });

  const handleAddPracticeDateToAssignment = (assignmentId: string, dateKey: string) => {
    if (!dateKey) return;
    setExtraPracticeDates(prev => {
      const existing = prev[assignmentId] || [];
      if (existing.includes(dateKey)) return prev;
      const updated = { ...prev, [assignmentId]: [...existing, dateKey] };
      try {
        localStorage.setItem('voyager_assignment_extra_dates', JSON.stringify(updated));
      } catch (e) {}
      return updated;
    });
  };

  // Student-owned personal tasks & reminders (persisted locally, strictly separate from teacher assignments)
  const [personalTasks, setPersonalTasks] = useState<StudentPersonalTask[]>(() => {
    if (typeof window === 'undefined') return [];
    try {
      const raw = localStorage.getItem('voyager_student_personal_tasks');
      if (raw) return JSON.parse(raw);
    } catch (e) {}
    return [];
  });

  const savePersonalTasks = (updated: StudentPersonalTask[]) => {
    setPersonalTasks(updated);
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem('voyager_student_personal_tasks', JSON.stringify(updated));
      } catch (e) {}
    }
  };

  // Automatically update the detected current date when the date changes
  useEffect(() => {
    const syncCurrentDate = () => {
      const key = formatLocalDateKey(new Date());
      setTodayKey(prev => (prev !== key ? key : prev));
    };

    const interval = setInterval(syncCurrentDate, 60000);
    const handleVisibility = () => {
      if (!document.hidden) syncCurrentDate();
    };
    window.addEventListener('visibilitychange', handleVisibility);
    window.addEventListener('focus', syncCurrentDate);

    return () => {
      clearInterval(interval);
      window.removeEventListener('visibilitychange', handleVisibility);
      window.removeEventListener('focus', syncCurrentDate);
    };
  }, []);

  const loadCalendarAssignments = useCallback(async () => {
    setIsLoadingAssignments(true);
    try {
      const studentId = user?.id || user?.studentId || 'STU-001';
      const studentEmail = user?.email || 'theorangesnowman@gmail.com';
      const result = await fetchUnifiedStudentAssignments(studentId, studentEmail);
      setAssignments(result.assignments || []);
    } catch (e) {
      console.error('Failed to load calendar assignments:', e);
    } finally {
      setIsLoadingAssignments(false);
    }
  }, [user?.id, user?.studentId, user?.email]);

  useEffect(() => {
    loadCalendarAssignments();

    const handleUpdate = () => {
      loadCalendarAssignments();
    };

    window.addEventListener('voyager_assignments_updated', handleUpdate);
    return () => {
      window.removeEventListener('voyager_assignments_updated', handleUpdate);
    };
  }, [loadCalendarAssignments]);

  const handleCreateStudentPersonalTask = (fallbackDayKey?: string) => {
    const finalDate = newTaskDateKey || fallbackDayKey || selectedDay;
    if (!finalDate || !newTaskTitle.trim()) return;
    setIsSavingTask(true);
    try {
      const studentId = user?.id || user?.studentId || 'STU-001';
      const newTask: StudentPersonalTask = {
        id: `ptask-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
        studentId,
        dateKey: finalDate,
        title: newTaskTitle.trim(),
        objective: newTaskObjective.trim() || undefined,
        category: newTaskCategory,
        completed: false,
        createdAt: new Date().toISOString()
      };
      const updated = [newTask, ...personalTasks];
      savePersonalTasks(updated);
      setNewTaskTitle('');
      setNewTaskObjective('');
      setIsAddingTask(false);
    } catch (err) {
      console.error('Failed to create personal task:', err);
    } finally {
      setIsSavingTask(false);
    }
  };

  const handleTogglePersonalTask = (taskId: string) => {
    const updated = personalTasks.map(t => t.id === taskId ? { ...t, completed: !t.completed } : t);
    savePersonalTasks(updated);
  };

  const handleDeletePersonalTask = (taskId: string) => {
    const updated = personalTasks.filter(t => t.id !== taskId);
    savePersonalTasks(updated);
  };

  // Index assignments by standardized YYYY-MM-DD date key
  const assignmentsByDate = useMemo(() => {
    const map: Record<string, UnifiedAssignment[]> = {};
    assignments.forEach((assign) => {
      const dueKey = parseDateToKey(assign.dueDate);
      if (dueKey) {
        if (!map[dueKey]) map[dueKey] = [];
        map[dueKey].push(assign);
      }
      const assignedKey = parseDateToKey(assign.assignedDate);
      if (assignedKey && assignedKey !== dueKey) {
        if (!map[assignedKey]) map[assignedKey] = [];
        if (!map[assignedKey].some(a => a.id === assign.id)) {
          map[assignedKey].push(assign);
        }
      }
      // Scheduled calendar practice dates added by student
      const extraDates = extraPracticeDates[assign.id] || [];
      extraDates.forEach((extraKey) => {
        if (!map[extraKey]) map[extraKey] = [];
        if (!map[extraKey].some(a => a.id === assign.id)) {
          map[extraKey].push(assign);
        }
      });
    });
    return map;
  }, [assignments, extraPracticeDates]);

  // Parse and aggregate actual active conversation time by YYYY-MM-DD
  const dailyDataMap = useMemo(() => {
    const map: Record<string, {
      dateKey: string;
      totalSeconds: number;
      totalMinutes: number;
      sessions: Array<{
        id: string;
        title: string;
        startTime: string;
        endTime: string;
        durationSeconds: number;
        messageCount: number;
        snippet: string;
        messages: { sender: string; text: string; timestamp?: Date | string }[];
        rawChat: SavedChatSession;
      }>;
    }> = {};

    savedChats.forEach((chat) => {
      const chatDate = new Date(chat.date || Date.now());
      if (isNaN(chatDate.getTime())) return;

      const yr = chatDate.getFullYear();
      const mo = String(chatDate.getMonth() + 1).padStart(2, '0');
      const dy = String(chatDate.getDate()).padStart(2, '0');
      const dateKey = `${yr}-${mo}-${dy}`;

      const durSec = chat.durationSeconds || 0;
      const startTimeStr = chatDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      const endDate = new Date(chatDate.getTime() + durSec * 1000);
      const endTimeStr = endDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

      if (!map[dateKey]) {
        map[dateKey] = {
          dateKey,
          totalSeconds: 0,
          totalMinutes: 0,
          sessions: [],
        };
      }

      map[dateKey].totalSeconds += durSec;
      map[dateKey].totalMinutes = Math.round(map[dateKey].totalSeconds / 60);
      map[dateKey].sessions.push({
        id: chat.id,
        title: chat.topic || (selectedLang === 'EN' ? 'Practice Session' : 'Sesión de Práctica'),
        startTime: startTimeStr,
        endTime: endTimeStr,
        durationSeconds: durSec,
        messageCount: chat.messages ? chat.messages.length : 0,
        snippet: chat.previewSnippet || (chat.messages && chat.messages[0] ? chat.messages[0].text : ''),
        messages: chat.messages || [],
        rawChat: chat,
      });
    });

    return map;
  }, [savedChats, selectedLang]);

  // Baseline mockup indicator data for November 2026 (merged with any live data)
  const mockupNovemberIndicators: Record<number, { completed?: number; inProgress?: number; assigned?: number }> = useMemo(() => ({
    2: { assigned: 1 },
    8: { inProgress: 1 },
    13: { inProgress: 1, assigned: 1 },
    14: { assigned: 1 },
    21: { completed: 1 },
    25: { completed: 2, inProgress: 1, assigned: 1 },
    27: { assigned: 1 },
  }), []);

  // Detailed task descriptions for mockup dates in November 2026
  const mockupDayTasks: Record<string, {
    assigned?: Array<{ id: string; title: string; objective: string; duration: string }>;
    completed?: Array<{ id: string; title: string; score: string; duration: string }>;
  }> = useMemo(() => ({
    '2026-11-02': {
      assigned: [
        {
          id: 'mock-assign-2',
          title: selectedLang === 'EN' ? 'Workplace Dialogues: Formal Greetings & Introductions' : 'Saludos Formales e Introducciones Profesionales',
          objective: selectedLang === 'EN' ? 'Master formal greetings, workplace etiquette, and self-introductions in American English.' : 'Dominar el registro profesional, fórmulas de cortesía y presentaciones personales en inglés.',
          duration: '15 min',
        },
      ],
    },
    '2026-11-13': {
      assigned: [
        {
          id: 'mock-assign-13-1',
          title: selectedLang === 'EN' ? 'Civics 128: Branches of Government & Constitution' : 'Cívica 128: Ramas del Gobierno y Constitución',
          objective: selectedLang === 'EN' ? 'Master the 3 branches of government and constitutional checks & balances.' : 'Entender las tres ramas del gobierno y el sistema de Pesos y Contrapesos.',
          duration: '20 min',
        },
        {
          id: 'mock-assign-13-2',
          title: selectedLang === 'EN' ? 'Medical Vocabulary: Symptoms & Pharmacy Visit' : 'Vocabulario Médico: Síntomas y Farmacia',
          objective: selectedLang === 'EN' ? 'Practice symptoms description, pharmacy conversations, and prescription comprehension.' : 'Vocabulario esencial para describir síntomas, consultas médicas y farmacia.',
          duration: '15 min',
        },
      ],
    },
    '2026-11-14': {
      assigned: [
        {
          id: 'mock-assign-14',
          title: selectedLang === 'EN' ? 'Supermarket Dialogues & Customer Service' : 'Simulación de Compra en Supermercado y Atención al Cliente',
          objective: selectedLang === 'EN' ? 'Ask for item locations, check prices, and resolve billing questions with Voyager.' : 'Preguntar por productos, precios y resolver consultas en caja con Voyager.',
          duration: '15 min',
        },
      ],
    },
    '2026-11-21': {
      completed: [
        {
          id: 'mock-comp-21',
          title: selectedLang === 'EN' ? 'NYC Subway Navigation & Urban Directions' : 'Navegación del Metro de NYC y Direcciones Urbanas',
          score: selectedLang === 'EN' ? 'Grade A' : 'Calificación A',
          duration: '18 min',
        },
      ],
    },
    '2026-11-25': {
      assigned: [
        {
          id: 'mock-assign-25',
          title: selectedLang === 'EN' ? 'Citizenship Interview Simulation: Form N-400' : 'Simulación de Entrevista de Ciudadanía: Formulario N-400',
          objective: selectedLang === 'EN' ? 'Respond naturally and confidently to personal background, residence, and moral character questions.' : 'Responder con naturalidad y seguridad preguntas sobre antecedentes, residencia y carácter moral.',
          duration: '20 min',
        },
      ],
      completed: [
        {
          id: 'mock-comp-25-1',
          title: selectedLang === 'EN' ? 'Civics Questions 1-20: Principles of Democracy' : 'Preguntas Cívicas 1-20: Principios de la Democracia',
          score: selectedLang === 'EN' ? 'Score: 100% (Grade A)' : 'Puntuación: 100% (Calificación A)',
          duration: '20 min',
        },
        {
          id: 'mock-comp-25-2',
          title: selectedLang === 'EN' ? 'Consulate Oral Practice: Required Documentation' : 'Práctica Oral para el Consulado: Trámites y Documentación',
          score: selectedLang === 'EN' ? 'Grade A-' : 'Calificación A-',
          duration: '15 min',
        },
      ],
    },
    '2026-11-27': {
      assigned: [
        {
          id: 'mock-assign-27',
          title: selectedLang === 'EN' ? 'Conversational Fluency: Holiday Plans & Family' : 'Conversación Espontánea: Planes Festivos y Familia',
          objective: selectedLang === 'EN' ? 'Practice future tense forms and conversational transitions in casual dialogue.' : 'Practicar tiempos futuros, planes y transiciones conversacionales fluidas con Voyager.',
          duration: '15 min',
        },
      ],
    },
  }), [selectedLang]);

  // Year & Month computations
  const year = currentMonth.getFullYear();
  const month = currentMonth.getMonth(); // 0-indexed (10 = November)
  const firstDayOfMonth = new Date(year, month, 1).getDay(); // 0 = Sunday
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const handlePrevMonth = () => {
    setCurrentMonth(new Date(year, month - 1, 1));
  };

  const handleNextMonth = () => {
    setCurrentMonth(new Date(year, month + 1, 1));
  };

  // Week navigation state and handlers - automatically defaults to user's current week
  const [weekStartDate, setWeekStartDate] = useState<Date>(() => {
    const base = new Date();
    const dayOfWeek = base.getDay();
    base.setDate(base.getDate() - dayOfWeek);
    base.setHours(0, 0, 0, 0);
    return base;
  });

  const handlePrevWeek = () => {
    setWeekStartDate((prev) => {
      const d = new Date(prev);
      d.setDate(d.getDate() - 7);
      return d;
    });
  };

  const handleNextWeek = () => {
    setWeekStartDate((prev) => {
      const d = new Date(prev);
      d.setDate(d.getDate() + 7);
      return d;
    });
  };

  // Synchronize week to active selectedDay if clicked in month view
  useEffect(() => {
    if (selectedDay) {
      const d = new Date(`${selectedDay}T00:00:00`);
      if (!isNaN(d.getTime())) {
        const start = new Date(d);
        start.setDate(d.getDate() - d.getDay());
        setWeekStartDate(start);
      }
    }
  }, [selectedDay]);

  const weekDays = useMemo(() => {
    return Array.from({ length: 7 }).map((_, i) => {
      const d = new Date(weekStartDate);
      d.setDate(d.getDate() + i);
      return d;
    });
  }, [weekStartDate]);

  // Capitalize month name helper
  const monthNameRaw = currentMonth.toLocaleString(selectedLang === 'EN' ? 'en-US' : 'es-ES', { month: 'long' });
  const monthTabName = monthNameRaw.charAt(0).toUpperCase() + monthNameRaw.slice(1);
  const yearTabNumber = String(year);

  // Selected Day Data
  const selectedDayData = selectedDay ? dailyDataMap[selectedDay] : null;

  // Day-of-week labels aligned flush left
  const weekDaysLabels = selectedLang === 'EN'
    ? ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa']
    : ['Do', 'Lu', 'Ma', 'Mi', 'Ju', 'Vi', 'Sá'];

  // Handle clicking on a date card to open the Día section with specific details
  const handleDayClick = (dateKey: string) => {
    setSelectedDay(dateKey);
    setViewMode('day');
  };

  const handlePrevDay = () => {
    const current = new Date(`${selectedDay || todayKey}T00:00:00`);
    if (!isNaN(current.getTime())) {
      current.setDate(current.getDate() - 1);
      const yr = current.getFullYear();
      const mo = String(current.getMonth() + 1).padStart(2, '0');
      const dy = String(current.getDate()).padStart(2, '0');
      setSelectedDay(`${yr}-${mo}-${dy}`);
    }
  };

  const handleNextDay = () => {
    const current = new Date(`${selectedDay || todayKey}T00:00:00`);
    if (!isNaN(current.getTime())) {
      current.setDate(current.getDate() + 1);
      const yr = current.getFullYear();
      const mo = String(current.getMonth() + 1).padStart(2, '0');
      const dy = String(current.getDate()).padStart(2, '0');
      setSelectedDay(`${yr}-${mo}-${dy}`);
    }
  };

  // Week range in compact numerical format: D/M - D/M/YYYY (Latin American format with forward slashes)
  const weekRangeFormatted = useMemo(() => {
    if (!weekDays || weekDays.length < 7) return '';
    const start = weekDays[0];
    const end = weekDays[6];
    const sD = start.getDate();
    const sM = start.getMonth() + 1;
    const eD = end.getDate();
    const eM = end.getMonth() + 1;
    const eY = end.getFullYear();
    return `${sD}/${sM} - ${eD}/${eM}/${eY}`;
  }, [weekDays]);

  // Day date in Latin American format: D/M/YYYY (e.g. 7/11/2026, complete four-digit year, forward slashes)
  const daySubLabel = useMemo(() => {
    const activeKey = selectedDay || todayKey;
    const parts = activeKey.split('-');
    if (parts.length === 3) {
      const y = parseInt(parts[0], 10);
      const m = parseInt(parts[1], 10);
      const d = parseInt(parts[2], 10);
      if (!isNaN(y) && !isNaN(m) && !isNaN(d)) {
        return `${d}/${m}/${y}`;
      }
    }
    return activeKey;
  }, [selectedDay, todayKey]);

  const tasksSubLabel = useMemo(() => {
    const pendingPersonal = personalTasks.filter(t => !t.completed).length;
    const pendingTeacher = assignments.filter(a => a.status !== 'completed').length;
    const total = pendingPersonal + pendingTeacher + 2;
    return `${total} ${selectedLang === 'EN' ? 'active' : 'activas'}`;
  }, [personalTasks, assignments, selectedLang]);

  const calendarTabs = [
    {
      id: 'month' as const,
      label: monthTabName,
      subLabel: yearTabNumber,
    },
    {
      id: 'week' as const,
      label: selectedLang === 'EN' ? 'Week' : 'Semana',
      subLabel: weekRangeFormatted,
    },
    {
      id: 'day' as const,
      label: selectedLang === 'EN' ? 'Day' : 'Día',
      subLabel: daySubLabel,
    },
    {
      id: 'tasks' as const,
      label: selectedLang === 'EN' ? 'Tasks' : 'Tareas',
      subLabel: tasksSubLabel,
    },
  ];

  return (
    <div className="w-full font-sans select-none overflow-visible">
      {/* VINTAGE INDEX-CARD TABS (Exact shape, colors, and concave fillets from CATALOGO DE LECCIONES without icons) */}
      <div className="w-full flex items-end relative pt-2 px-[10px] sm:px-[14px] z-10 overflow-visible max-w-full">
        <div className="flex items-end gap-1 sm:gap-1.5 relative w-full max-w-full">
          {calendarTabs.map((tab, idx) => {
            const isActive = viewMode === tab.id;

            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setViewMode(tab.id)}
                className={`group relative h-[54px] sm:h-[60px] px-1.5 sm:px-2.5 md:px-3.5 min-w-0 flex-1 sm:flex-initial sm:min-w-[78px] md:min-w-[88px] max-w-[132px] flex flex-col items-center pt-2 sm:pt-2.5 pb-1.5 sm:pb-2 justify-start cursor-pointer transition-colors ${
                  isActive
                    ? 'bg-[#F8ECC0] text-[#F8ECC0] z-30 rounded-t-[14px] sm:rounded-t-[18px] -mb-[2px] after:content-[\'\'] after:absolute after:-bottom-[3px] after:left-0 after:right-0 after:h-[5px] after:bg-[#F8ECC0] after:z-30'
                    : 'bg-[#EADBB3] hover:bg-[#E0CF9E] text-[#EADBB3] hover:text-[#E0CF9E] rounded-t-[14px] sm:rounded-t-[18px] z-10'
                }`}
              >
                {/* Left Concave Flare / Inverted Fillet (Vintage filing index-card tab) */}
                {idx > 0 && (
                  <svg
                    className="absolute -left-[12px] sm:-left-[14px] bottom-0 w-[12px] sm:w-[14px] h-[12px] sm:h-[14px] pointer-events-none overflow-visible transition-colors"
                    viewBox="0 0 16 16"
                    fill="currentColor"
                  >
                    <path d="M 16 0 L 16 16.5 L 0 16.5 Q 16 16.5 16 0 Z" />
                  </svg>
                )}

                {/* Right Concave Flare / Inverted Fillet */}
                <svg
                  className="absolute -right-[12px] sm:-right-[14px] bottom-0 w-[12px] sm:w-[14px] h-[12px] sm:h-[14px] pointer-events-none overflow-visible transition-colors"
                  viewBox="0 0 16 16"
                  fill="currentColor"
                >
                  <path d="M 0 0 L 0 16.5 L 16 16.5 Q 0 16.5 0 0 Z" />
                </svg>

                {/* Tab Label: Shared baseline across all month and view tabs */}
                <div className="inline-flex flex-col items-center justify-start w-full max-w-full px-0.5 leading-tight overflow-hidden">
                  <span className={`text-[12.5px] sm:text-[14.5px] md:text-[15.5px] font-bold leading-none text-center truncate max-w-full ${
                    isActive ? 'text-[#1F1A14]' : 'text-[#221D17] group-hover:text-black'
                  }`}>
                    {tab.label}
                  </span>
                  <span className="text-[10px] sm:text-[11.5px] font-normal text-neutral-600 leading-none mt-1 sm:mt-1.5 text-center truncate max-w-full">
                    {tab.subLabel}
                  </span>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Main Calendar Panel: Matches #F8ECC0 color scheme from top section */}
      <div className="bg-[#F8ECC0] rounded-b-[24px] sm:rounded-b-[28px] rounded-t-[14px] sm:rounded-t-[18px] p-4 sm:p-6 md:p-8 shadow-xs relative z-0">
        {/* VIEW 1: MONTH VIEW (Noviembre: contains monthly goal, progress bar, legend, and full month grid) */}
        {viewMode === 'month' && (
          <div className="w-full">
            {/* Header: Legend and Navigation Arrows (monthly goal label & progress bar removed per user request) */}
            <div className="flex items-center justify-between flex-wrap gap-x-3 sm:gap-x-4 gap-y-2 mb-4 sm:mb-5">
              <div className="flex items-center justify-start flex-wrap gap-x-3 sm:gap-x-4 gap-y-1.5 text-xs sm:text-sm font-medium text-black leading-none">
                {/* Legend: Asignada first (solid red circle) */}
                <div className="flex items-center gap-1.5 shrink-0">
                  <span className="w-3.5 h-3.5 sm:w-4 sm:h-4 rounded-full bg-[#EF4444] shrink-0 inline-block" />
                  <span className="whitespace-nowrap text-black">{selectedLang === 'EN' ? 'Assigned' : 'Asignada'}</span>
                </div>

                {/* Legend: En proceso second (solid yellow circle #FBBF24) */}
                <div className="flex items-center gap-1.5 shrink-0">
                  <span className="w-3.5 h-3.5 sm:w-4 sm:h-4 rounded-full bg-[#FBBF24] shrink-0 inline-block" />
                  <span className="whitespace-nowrap text-black">{selectedLang === 'EN' ? 'In progress' : 'En proceso'}</span>
                </div>

                {/* Legend: Completada third (solid slightly darkened green circle #059669) */}
                <div className="flex items-center gap-1.5 shrink-0">
                  <span className="w-3.5 h-3.5 sm:w-4 sm:h-4 rounded-full bg-[#059669] shrink-0 inline-block" />
                  <span className="whitespace-nowrap text-black">{selectedLang === 'EN' ? 'Completed' : 'Completada'}</span>
                </div>
              </div>

              {/* Prev / Next Month Navigation Buttons */}
              <div className="flex items-center gap-1.5 sm:gap-2">
                <button
                  type="button"
                  onClick={handlePrevMonth}
                  aria-label={selectedLang === 'EN' ? 'Previous Month' : 'Mes Anterior'}
                  className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-white hover:bg-[#FBBF24] text-black flex items-center justify-center active:scale-95 transition-colors duration-200 cursor-pointer"
                >
                  <ChevronLeft className="w-3.5 h-3.5 sm:w-4 sm:h-4 stroke-[2.4] text-black" />
                </button>
                <button
                  type="button"
                  onClick={handleNextMonth}
                  aria-label={selectedLang === 'EN' ? 'Next Month' : 'Mes Siguiente'}
                  className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-white hover:bg-[#FBBF24] text-black flex items-center justify-center active:scale-95 transition-colors duration-200 cursor-pointer"
                >
                  <ChevronRight className="w-3.5 h-3.5 sm:w-4 sm:h-4 stroke-[2.4] text-black" />
                </button>
              </div>
            </div>

            {/* Days of the week: Do, Lu, Ma, Mi, Ju, Vi, Sá - Aligned with day columns */}
            <div className="grid grid-cols-7 gap-1 sm:gap-1.5 md:gap-2 w-full mb-1.5 sm:mb-2">
              {weekDaysLabels.map((lbl, idx) => (
                <div
                  key={idx}
                  className="text-left text-xs sm:text-sm md:text-[15px] font-medium text-[#1A1816] pl-1 truncate"
                >
                  {lbl}
                </div>
              ))}
            </div>

            {/* Calendar Grid: Individual day cards with tighter gaps and equal horizontal padding */}
            <div className="grid grid-cols-7 gap-1 sm:gap-1.5 md:gap-2 w-full">
              {/* Empty leading padding cells for month start */}
              {Array.from({ length: firstDayOfMonth }).map((_, idx) => (
                <div key={`empty-${idx}`} className="w-full min-w-0 aspect-[1.15/1] rounded-[7px] sm:rounded-[9px] md:rounded-[10px]" />
              ))}

              {/* Month Day Cells */}
              {Array.from({ length: daysInMonth }).map((_, idx) => {
                const dayNum = idx + 1;
                const dyStr = String(dayNum).padStart(2, '0');
                const moStr = String(month + 1).padStart(2, '0');
                const dateKey = `${year}-${moStr}-${dyStr}`;

                const isToday = dateKey === todayKey;
                const isSelected = selectedDay === dateKey;

                // Live data + mockup data merge
                const liveDayData = dailyDataMap[dateKey];
                const liveAssignments = assignmentsByDate[dateKey] || [];
                const dayPersonal = personalTasks.filter(t => t.dateKey === dateKey);
                const personalCompleted = dayPersonal.filter(t => t.completed).length;
                const personalPending = dayPersonal.filter(t => !t.completed).length;

                const liveCompleted = liveAssignments.filter(a => a.status === 'COMPLETED').length + (liveDayData && liveDayData.totalSeconds > 0 ? 1 : 0) + personalCompleted;
                const liveInProgress = liveAssignments.filter(a => a.status === 'IN_PROGRESS').length;
                const liveAssigned = liveAssignments.filter(a => a.status === 'PENDING' || (!a.status && a.status !== 'IN_PROGRESS' && a.status !== 'COMPLETED')).length + personalPending;

                const mockupInfo = (year === 2026 && month === 10) ? mockupNovemberIndicators[dayNum] : null;

                const completedCount = (mockupInfo?.completed ?? 0) + liveCompleted;
                const inProgressCount = (mockupInfo?.inProgress ?? 0) + liveInProgress;
                const assignedCount = (mockupInfo?.assigned ?? 0) + liveAssigned;
                const hasActivity = completedCount > 0 || inProgressCount > 0 || assignedCount > 0;

                return (
                  <button
                    key={dateKey}
                    type="button"
                    onClick={() => handleDayClick(dateKey)}
                    className={`w-full min-w-0 aspect-[1.15/1] rounded-[7px] sm:rounded-[9px] md:rounded-[10px] bg-[#FFFDF9] px-2 py-1.5 sm:px-2.5 sm:py-2 md:px-2.5 md:py-2 flex flex-col justify-between text-left transition-all cursor-pointer relative hover:shadow-2xs overflow-hidden group border-2 sm:border-[2.5px] ${
                      isToday
                        ? 'border-[#1A1816] z-10 shadow-xs'
                        : isSelected
                          ? 'border-[#8C827A] hover:border-neutral-500 z-10'
                          : 'border-transparent hover:border-neutral-500 hover:z-10'
                    }`}
                  >
                    {/* Date Number & Assigned (Red) Indicator always to the right of the number */}
                    <div className="flex items-center justify-start gap-1 sm:gap-1.5 w-full min-w-0">
                      <span className={`inline-flex items-center justify-start h-6 sm:h-7 text-xs sm:text-sm md:text-base text-[#1A1816] leading-none transition-all shrink-0 ${
                        isToday || hasActivity ? 'font-bold' : 'font-normal'
                      }`}>
                        {dayNum}
                      </span>

                      {assignedCount > 0 && (
                        <svg
                          className="w-4 h-4 sm:w-[18px] sm:h-[18px] shrink-0 select-none"
                          viewBox="0 0 20 20"
                          aria-label={`${assignedCount} ${selectedLang === 'EN' ? 'assigned' : 'asignadas'}`}
                        >
                          <circle cx="10" cy="10" r="10" fill="#EF4444" />
                          <text
                            x="10"
                            y="10"
                            textAnchor="middle"
                            dominantBaseline="central"
                            fill="#FFFFFF"
                            fontWeight="bold"
                            fontFamily="sans-serif"
                            fontSize="11"
                          >
                            {assignedCount}
                          </text>
                        </svg>
                      )}
                    </div>

                    {/* Activity Indicators: Completed (green) and In Progress (yellow) circles on bottom row */}
                    <div className="flex items-center gap-1.5 sm:gap-2 mt-auto max-w-full overflow-hidden pb-0.5">
                      {completedCount > 0 && (
                        <svg
                          className="w-4 h-4 sm:w-[18px] sm:h-[18px] shrink-0 select-none"
                          viewBox="0 0 20 20"
                          aria-label={`${completedCount} ${selectedLang === 'EN' ? 'completed' : 'completadas'}`}
                        >
                          <circle cx="10" cy="10" r="10" fill="#059669" />
                          <text
                            x="10"
                            y="10"
                            textAnchor="middle"
                            dominantBaseline="central"
                            fill="#FFFFFF"
                            fontWeight="bold"
                            fontFamily="sans-serif"
                            fontSize="11"
                          >
                            {completedCount}
                          </text>
                        </svg>
                      )}

                      {inProgressCount > 0 && (
                        <svg
                          className="w-4 h-4 sm:w-[18px] sm:h-[18px] shrink-0 select-none"
                          viewBox="0 0 20 20"
                          aria-label={`${inProgressCount} ${selectedLang === 'EN' ? 'in progress' : 'en proceso'}`}
                        >
                          <circle cx="10" cy="10" r="10" fill="#FBBF24" />
                          <text
                            x="10"
                            y="10"
                            textAnchor="middle"
                            dominantBaseline="central"
                            fill="#1F1A14"
                            fontWeight="bold"
                            fontFamily="sans-serif"
                            fontSize="11"
                          >
                            {inProgressCount}
                          </text>
                        </svg>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* VIEW 2: WEEK VIEW (Unified design matching month view: tight gaps, 50% reduced radius, clean indicator badges) */}
        {viewMode === 'week' && (
          <div className="w-full">
            {/* Days of the week: Do, Lu, Ma, Mi, Ju, Vi, Sá - Aligned with day columns */}
            <div className="grid grid-cols-7 gap-1 sm:gap-1.5 md:gap-2 w-full mb-1.5 sm:mb-2">
              {weekDaysLabels.map((lbl, idx) => (
                <div
                  key={idx}
                  className="text-left text-xs sm:text-sm md:text-[15px] font-medium text-[#1A1816] pl-1 truncate"
                >
                  {lbl}
                </div>
              ))}
            </div>

            {/* Week Day Cells */}
            <div className="grid grid-cols-7 gap-1 sm:gap-1.5 md:gap-2 w-full">
              {weekDays.map((d) => {
                const dayNum = d.getDate();
                const dyStr = String(dayNum).padStart(2, '0');
                const moStr = String(d.getMonth() + 1).padStart(2, '0');
                const yr = d.getFullYear();
                const dateKey = `${yr}-${moStr}-${dyStr}`;
                const isToday = dateKey === todayKey;
                const isSelected = selectedDay === dateKey;

                // Live data + mockup data merge
                const liveDayData = dailyDataMap[dateKey];
                const liveAssignments = assignmentsByDate[dateKey] || [];
                const dayPersonal = personalTasks.filter(t => t.dateKey === dateKey);
                const personalCompleted = dayPersonal.filter(t => t.completed).length;
                const personalPending = dayPersonal.filter(t => !t.completed).length;

                const liveCompleted = liveAssignments.filter(a => a.status === 'COMPLETED').length + (liveDayData && liveDayData.totalSeconds > 0 ? 1 : 0) + personalCompleted;
                const liveInProgress = liveAssignments.filter(a => a.status === 'IN_PROGRESS').length;
                const liveAssigned = liveAssignments.filter(a => a.status === 'PENDING' || (!a.status && a.status !== 'IN_PROGRESS' && a.status !== 'COMPLETED')).length + personalPending;

                const mockupInfo = (yr === 2026 && d.getMonth() === 10) ? mockupNovemberIndicators[dayNum] : null;

                const completedCount = (mockupInfo?.completed ?? 0) + liveCompleted;
                const inProgressCount = (mockupInfo?.inProgress ?? 0) + liveInProgress;
                const assignedCount = (mockupInfo?.assigned ?? 0) + liveAssigned;

                const hasActivity = completedCount > 0 || inProgressCount > 0 || assignedCount > 0;

                return (
                  <button
                    key={dateKey}
                    type="button"
                    onClick={() => handleDayClick(dateKey)}
                    className={`w-full min-w-0 aspect-[1.15/1] rounded-[7px] sm:rounded-[9px] md:rounded-[10px] bg-[#FFFDF9] px-2 py-1.5 sm:px-2.5 sm:py-2 md:px-2.5 md:py-2 flex flex-col justify-between text-left transition-all cursor-pointer relative hover:shadow-2xs overflow-hidden border-2 sm:border-[2.5px] ${
                      isToday
                        ? 'border-[#1A1816] z-10 shadow-xs'
                        : isSelected
                          ? 'border-[#8C827A] hover:border-neutral-500 z-10'
                          : 'border-transparent hover:border-neutral-500 hover:z-10'
                    }`}
                  >
                    {/* Date Number & Assigned (Red) Indicator always to the right of the number */}
                    <div className="flex items-center justify-start gap-1.5 sm:gap-2 w-full min-w-0">
                      <span className={`text-xs sm:text-sm md:text-base text-[#1A1816] leading-none shrink-0 ${
                        isToday || hasActivity ? 'font-bold' : 'font-normal'
                      }`}>
                        {dayNum}
                      </span>

                      {assignedCount > 0 && (
                        <svg
                          className="w-[18px] h-[18px] sm:w-5 sm:h-5 shrink-0 select-none"
                          viewBox="0 0 20 20"
                          aria-label={`${assignedCount} ${selectedLang === 'EN' ? 'assigned' : 'asignadas'}`}
                        >
                          <circle cx="10" cy="10" r="10" fill="#EF4444" />
                          <text
                            x="10"
                            y="10"
                            textAnchor="middle"
                            dominantBaseline="central"
                            fill="#FFFFFF"
                            fontWeight="bold"
                            fontFamily="sans-serif"
                            fontSize="11"
                          >
                            {assignedCount}
                          </text>
                        </svg>
                      )}
                    </div>

                    {/* Activity Indicators: Completed (green) and In Progress (yellow) circles on bottom row */}
                    <div className="flex items-center gap-1.5 sm:gap-2 mt-auto max-w-full overflow-hidden">
                      {completedCount > 0 && (
                        <svg
                          className="w-[18px] h-[18px] sm:w-5 sm:h-5 shrink-0 select-none"
                          viewBox="0 0 20 20"
                          aria-label={`${completedCount} ${selectedLang === 'EN' ? 'completed' : 'completadas'}`}
                        >
                          <circle cx="10" cy="10" r="10" fill="#059669" />
                          <text
                            x="10"
                            y="10"
                            textAnchor="middle"
                            dominantBaseline="central"
                            fill="#FFFFFF"
                            fontWeight="bold"
                            fontFamily="sans-serif"
                            fontSize="11"
                          >
                            {completedCount}
                          </text>
                        </svg>
                      )}

                      {inProgressCount > 0 && (
                        <svg
                          className="w-[18px] h-[18px] sm:w-5 sm:h-5 shrink-0 select-none"
                          viewBox="0 0 20 20"
                          aria-label={`${inProgressCount} ${selectedLang === 'EN' ? 'in progress' : 'en proceso'}`}
                        >
                          <circle cx="10" cy="10" r="10" fill="#FBBF24" />
                          <text
                            x="10"
                            y="10"
                            textAnchor="middle"
                            dominantBaseline="central"
                            fill="#1F1A14"
                            fontWeight="bold"
                            fontFamily="sans-serif"
                            fontSize="11"
                          >
                            {inProgressCount}
                          </text>
                        </svg>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Bottom-left Navigation Arrows (< and >) with minimal vertical spacing */}
            <div className="flex items-center gap-2.5 mt-2.5 sm:mt-3 justify-start">
              <button
                type="button"
                onClick={handlePrevWeek}
                aria-label={selectedLang === 'EN' ? 'Previous Week' : 'Semana Anterior'}
                className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-white hover:bg-[#FBBF24] text-black flex items-center justify-center shadow-xs active:scale-95 transition-colors duration-200 cursor-pointer border border-[#EAE2D7]/60"
              >
                <ChevronLeft className="w-4 h-4 sm:w-5 sm:h-5 stroke-[2.4] text-black" />
              </button>
              <button
                type="button"
                onClick={handleNextWeek}
                aria-label={selectedLang === 'EN' ? 'Next Week' : 'Semana Siguiente'}
                className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-white hover:bg-[#FBBF24] text-black flex items-center justify-center shadow-xs active:scale-95 transition-colors duration-200 cursor-pointer border border-[#EAE2D7]/60"
              >
                <ChevronRight className="w-4 h-4 sm:w-5 sm:h-5 stroke-[2.4] text-black" />
              </button>
            </div>
          </div>
        )}

        {/* VIEW 3: DAY VIEW (Exclusively shown in the "Día" tab view) */}
        {viewMode === 'day' && (
          <div>
            {(() => {
              const activeDayKey = selectedDay || todayKey;

              const dayAssignments = assignmentsByDate[activeDayKey] || [];
              const dayData = dailyDataMap[activeDayKey];
              const mockupTasks = mockupDayTasks[activeDayKey];
              const dayPersonalTasks = personalTasks.filter(t => t.dateKey === activeDayKey);

              const totalPracticeMinutes = (dayData && dayData.totalSeconds > 0)
                ? Math.round(dayData.totalSeconds / 60)
                : (mockupTasks?.completed ? mockupTasks.completed.reduce((acc, c) => acc + parseInt(c.duration || '0'), 0) : 0);
              return (
                <div className="space-y-4">
                  {/* Top Day Header: Prominent "+ Tarea" Action (No duplicate date heading, no top arrows) */}
                  <div className="flex items-center justify-between pb-2 border-b border-[#EAE2D7]/70">
                    <button
                      type="button"
                      onClick={() => {
                        setIsAddingTask(prev => !prev);
                        setNewTaskDateKey(activeDayKey);
                      }}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white hover:bg-neutral-100 text-[#1A1816] text-xs font-semibold border border-[#1A1816] transition-all active:scale-95 cursor-pointer shadow-2xs"
                    >
                      <span className="w-4 h-4 rounded-full border border-[#1A1816] flex items-center justify-center shrink-0">
                        <Plus className="w-2.5 h-2.5 stroke-[2.8]" />
                      </span>
                      <span>
                        {isAddingTask
                          ? (selectedLang === 'EN' ? 'Cancel' : 'Cancelar')
                          : (selectedLang === 'EN' ? '+ Task' : '+ Tarea')}
                      </span>
                    </button>
                  </div>

                  {/* Inline Student Task Creation Form with Mandatory Date */}
                  {isAddingTask && (
                    <div className="p-4 rounded-[18px] bg-[#F8ECC0]/45 border border-[#E0D19E] space-y-3 shadow-xs animate-fade-in">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-[#1A1816] block uppercase tracking-wide">
                          {selectedLang === 'EN' ? 'New Task or Reminder' : 'Nueva Tarea o Recordatorio'}
                        </span>
                        <span className="text-[11px] text-[#7A736B]">
                          {selectedLang === 'EN' ? 'Mandatory date required' : 'Fecha obligatoria'}
                        </span>
                      </div>

                      {/* Mandatory Date Picker */}
                      <div className="flex items-center gap-2">
                        <label className="text-xs font-semibold text-[#1A1816] shrink-0">
                          {selectedLang === 'EN' ? 'Date:' : 'Fecha:'}
                        </label>
                        <input
                          type="date"
                          value={newTaskDateKey}
                          onChange={(e) => setNewTaskDateKey(e.target.value)}
                          required
                          className="px-2.5 py-1 text-xs bg-white border border-[#E4D4BE] rounded-lg text-[#1A1816] focus:outline-none focus:ring-1 focus:ring-[#1A1816] font-semibold"
                        />
                      </div>

                      {/* Category selector pills */}
                      <div className="flex items-center gap-1.5 flex-wrap">
                        {[
                          { id: 'task', labelEN: 'Personal Task', labelES: 'Tarea personal' },
                          { id: 'reminder', labelEN: 'Reminder', labelES: 'Recordatorio' },
                          { id: 'interest', labelEN: 'Interest', labelES: 'Interés' },
                          { id: 'goal', labelEN: 'Goal', labelES: 'Meta' },
                          { id: 'event', labelEN: 'Event', labelES: 'Evento' },
                        ].map((cat) => (
                          <button
                            key={cat.id}
                            type="button"
                            onClick={() => setNewTaskCategory(cat.id as any)}
                            className={`text-[11px] px-2.5 py-1 rounded-full transition-colors cursor-pointer border ${
                              newTaskCategory === cat.id
                                ? 'bg-[#1A1816] text-white border-[#1A1816]'
                                : 'bg-white text-[#5C554E] hover:text-[#1A1816] border-[#E4D4BE]/70'
                            }`}
                          >
                            {selectedLang === 'EN' ? cat.labelEN : cat.labelES}
                          </button>
                        ))}
                      </div>

                      <div className="space-y-2">
                        <input
                          type="text"
                          value={newTaskTitle}
                          onChange={(e) => setNewTaskTitle(e.target.value)}
                          placeholder={selectedLang === 'EN' ? 'Task title (required)...' : 'Título de la tarea (obligatorio)...'}
                          className="w-full px-3 py-2 text-xs bg-white border border-[#E4D4BE] rounded-lg text-[#1A1816] placeholder-[#A3988C] focus:outline-hidden focus:ring-1 focus:ring-[#1A1816] font-medium"
                          autoFocus
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              e.preventDefault();
                              handleCreateStudentPersonalTask(activeDayKey);
                            }
                          }}
                        />
                        <input
                          type="text"
                          value={newTaskObjective}
                          onChange={(e) => setNewTaskObjective(e.target.value)}
                          placeholder={selectedLang === 'EN' ? 'Details or notes (optional)...' : 'Detalles o recordatorio (opcional)...'}
                          className="w-full px-3 py-2 text-xs bg-white border border-[#E4D4BE] rounded-lg text-[#1A1816] placeholder-[#A3988C] focus:outline-hidden focus:ring-1 focus:ring-[#1A1816]"
                        />
                      </div>

                      <div className="flex items-center justify-end gap-2 pt-1">
                        <button
                          type="button"
                          onClick={() => {
                            setIsAddingTask(false);
                            setNewTaskTitle('');
                            setNewTaskObjective('');
                          }}
                          className="px-3 py-1.5 text-xs text-[#5C554E] hover:text-[#1A1816] rounded-full transition-colors cursor-pointer"
                        >
                          {selectedLang === 'EN' ? 'Cancel' : 'Cancelar'}
                        </button>
                        <button
                          type="button"
                          disabled={!newTaskTitle.trim() || !newTaskDateKey || isSavingTask}
                          onClick={() => handleCreateStudentPersonalTask(activeDayKey)}
                          className="px-4 py-1.5 bg-[#1A1816] text-white text-xs font-semibold rounded-full hover:bg-[#332E29] transition-colors disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer flex items-center gap-1.5 shadow-2xs"
                        >
                          <span>{isSavingTask ? (selectedLang === 'EN' ? 'Saving...' : 'Guardando...') : (selectedLang === 'EN' ? 'Save Task' : 'Guardar Tarea')}</span>
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Tasks List: Google Tasks-inspired clean list */}
                  <div className="space-y-2.5">
                    {/* Student-owned Personal Tasks */}
                    {dayPersonalTasks.length > 0 && (
                      <div className="space-y-2">
                        <span className="text-xs font-semibold text-[#1A1816] block uppercase tracking-wide">
                          {selectedLang === 'EN' ? 'My Tasks:' : 'Mis Tareas:'}
                        </span>

                        <div className="space-y-1.5">
                          {dayPersonalTasks.map((t) => (
                            <div
                              key={t.id}
                              className="p-3 rounded-[14px] bg-white border border-[#E4D4BE]/70 flex items-center justify-between text-xs gap-3 shadow-2xs hover:border-[#1A1816]/30 transition-colors"
                            >
                              <div className="flex items-start gap-2.5 min-w-0 flex-1">
                                <button
                                  type="button"
                                  onClick={() => handleTogglePersonalTask(t.id)}
                                  className="mt-0.5 text-neutral-500 hover:text-black cursor-pointer shrink-0"
                                  title={t.completed ? (selectedLang === 'EN' ? 'Mark incomplete' : 'Marcar pendiente') : (selectedLang === 'EN' ? 'Mark complete' : 'Marcar completada')}
                                >
                                  {t.completed ? (
                                    <CheckCircle2 className="w-4 h-4 text-[#059669] fill-[#059669]/20" />
                                  ) : (
                                    <div className="w-4 h-4 rounded-full border-2 border-[#1A1816]/40 hover:border-[#1A1816]" />
                                  )}
                                </button>
                                <div className="min-w-0 flex-1">
                                  <div className="flex items-center gap-2 flex-wrap">
                                    <span className={`font-semibold text-sm text-[#1A1816] truncate ${t.completed ? 'line-through text-[#7A736B]' : ''}`}>
                                      {t.title}
                                    </span>
                                    <span className="text-[10px] font-normal text-[#5C554E] px-2 py-0.5 rounded-full bg-[#F8ECC0]/50 border border-[#E0D19E]/50">
                                      {t.category === 'reminder' ? (selectedLang === 'EN' ? 'Reminder' : 'Recordatorio') :
                                       t.category === 'goal' ? (selectedLang === 'EN' ? 'Goal' : 'Meta') :
                                       t.category === 'event' ? (selectedLang === 'EN' ? 'Event' : 'Evento') :
                                       t.category === 'interest' ? (selectedLang === 'EN' ? 'Interest' : 'Interés') :
                                       (selectedLang === 'EN' ? 'Personal Task' : 'Tarea Personal')}
                                    </span>
                                  </div>
                                  {t.objective && (
                                    <span className="text-xs text-[#5C554E] block mt-0.5 truncate">{t.objective}</span>
                                  )}
                                </div>
                              </div>

                              <div className="flex items-center gap-1.5 shrink-0">
                                {onAskVoyager && (
                                  <button
                                    type="button"
                                    onClick={() => {
                                      const prompt = selectedLang === 'EN'
                                        ? `[VOYAGER: Student selected their task "${t.title}". Guide them in practice.]`
                                        : `[VOYAGER: El estudiante seleccionó su tarea "${t.title}". Guíale en la práctica.]`;
                                      onAskVoyager(prompt);
                                    }}
                                    className="px-2.5 py-1 bg-[#FAF6F0] hover:bg-[#F8ECC0]/60 border border-[#E0D19E] text-[#1A1816] rounded-full text-xs transition-colors flex items-center gap-1 cursor-pointer font-medium"
                                  >
                                    <Play className="w-2.5 h-2.5 fill-current" />
                                    <span>{selectedLang === 'EN' ? 'Practice' : 'Practicar'}</span>
                                  </button>
                                )}
                                <button
                                  type="button"
                                  onClick={() => handleDeletePersonalTask(t.id)}
                                  className="p-1 text-[#8C827A] hover:text-[#EF4444] transition-colors cursor-pointer"
                                  title={selectedLang === 'EN' ? 'Delete task' : 'Eliminar tarea'}
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Teacher-assigned Tasks (with "Add to Calendar" practice scheduler) */}
                    {(dayAssignments.length > 0 || (mockupTasks?.assigned && mockupTasks.assigned.length > 0)) && (
                      <div className="space-y-2 pt-1">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-semibold text-[#1A1816] block uppercase tracking-wide">
                            {selectedLang === 'EN' ? 'Teacher Assignments:' : 'Tareas del Profesor:'}
                          </span>
                          <span className="text-[11px] text-[#7A736B]">
                            {selectedLang === 'EN' ? 'Synchronized with Teacher' : 'Sincronizadas con Docente'}
                          </span>
                        </div>

                        <div className="space-y-2">
                          {dayAssignments.map((assign) => (
                            <div key={assign.id} className="p-3 sm:p-3.5 rounded-[14px] bg-[#F8ECC0]/30 border border-[#E0D19E]/60 flex items-center justify-between text-xs gap-3">
                              <div className="space-y-0.5 min-w-0 flex-1">
                                <div className="flex items-center gap-2 flex-wrap">
                                  <span className="font-semibold text-[#1A1816] text-sm block truncate">{assign.title}</span>
                                  {assign.teacherName && (
                                    <span className="text-[10px] text-[#5C554E] px-2 py-0.5 rounded-full bg-white/80 border border-[#E0D19E]/50">
                                      {assign.teacherName}
                                    </span>
                                  )}
                                  <span className="text-[10px] text-[#EF4444] font-semibold bg-red-50 px-2 py-0.5 rounded-full border border-red-200">
                                    {selectedLang === 'EN' ? `Due: ${assign.dueDate || 'Class'}` : `Entrega: ${assign.dueDate || 'Clase'}`}
                                  </span>
                                </div>
                                <span className="text-xs text-[#5C554E] block truncate">{assign.objective}</span>
                              </div>

                              <div className="flex items-center gap-1.5 shrink-0 flex-wrap">
                                {/* Add to Calendar button allowing additional practice date without modifying original deadline */}
                                <button
                                  type="button"
                                  onClick={() => {
                                    const nextDate = prompt(
                                      selectedLang === 'EN'
                                        ? `Schedule an extra practice session for "${assign.title}". Enter date (YYYY-MM-DD):`
                                        : `Programa una fecha adicional de práctica en tu calendario para "${assign.title}". Ingresa fecha (AAAA-MM-DD):`,
                                      activeDayKey
                                    );
                                    if (nextDate && nextDate.trim()) {
                                      handleAddPracticeDateToAssignment(assign.id, nextDate.trim());
                                    }
                                  }}
                                  className="px-2.5 py-1 bg-white hover:bg-neutral-100 border border-[#1A1816]/40 text-[#1A1816] rounded-full text-xs transition-colors flex items-center gap-1 cursor-pointer font-medium"
                                  title={selectedLang === 'EN' ? 'Add extra practice session date to calendar' : 'Programar fecha extra de práctica en calendario'}
                                >
                                  <Calendar className="w-3 h-3 text-[#1A1816]" />
                                  <span>{selectedLang === 'EN' ? '+ Calendar' : '+ Calendario'}</span>
                                </button>

                                {onAskVoyager && (
                                  <button
                                    type="button"
                                    onClick={() => {
                                      const prompt = selectedLang === 'EN'
                                        ? `[VOYAGER: Begin assignment "${assign.title}". Objective: ${assign.objective}]`
                                        : `[VOYAGER: Inicia la tarea "${assign.title}". Objetivo: ${assign.objective}]`;
                                      onAskVoyager(prompt);
                                    }}
                                    className="px-3 py-1 bg-[#1A1816] text-white rounded-full text-xs hover:bg-[#332E29] transition-colors flex items-center gap-1.5 cursor-pointer font-medium"
                                  >
                                    <Play className="w-2.5 h-2.5 fill-white" />
                                    <span>{selectedLang === 'EN' ? 'Practice' : 'Practicar'}</span>
                                  </button>
                                )}
                              </div>
                            </div>
                          ))}

                          {dayAssignments.length === 0 && mockupTasks?.assigned?.map((task) => (
                            <div key={task.id} className="p-3 sm:p-3.5 rounded-[14px] bg-[#F8ECC0]/30 border border-[#E0D19E]/60 flex items-center justify-between text-xs gap-3">
                              <div className="space-y-0.5 min-w-0 flex-1">
                                <div className="flex items-center gap-2 flex-wrap">
                                  <span className="font-semibold text-[#1A1816] text-sm block truncate">{task.title}</span>
                                  <span className="text-[11px] font-normal text-[#7A736B] px-2 py-0.5 rounded-full bg-white/70 border border-[#E0D19E]/40">
                                    {task.duration}
                                  </span>
                                </div>
                                <span className="text-xs text-[#5C554E] block truncate">{task.objective}</span>
                              </div>

                              <div className="flex items-center gap-1.5 shrink-0 flex-wrap">
                                <button
                                  type="button"
                                  onClick={() => {
                                    const nextDate = prompt(
                                      selectedLang === 'EN'
                                        ? `Schedule an extra practice session for "${task.title}". Enter date (YYYY-MM-DD):`
                                        : `Programa una fecha adicional de práctica para "${task.title}". Ingresa fecha (AAAA-MM-DD):`,
                                      activeDayKey
                                    );
                                    if (nextDate && nextDate.trim()) {
                                      handleAddPracticeDateToAssignment(task.id, nextDate.trim());
                                    }
                                  }}
                                  className="px-2.5 py-1 bg-white hover:bg-neutral-100 border border-[#1A1816]/40 text-[#1A1816] rounded-full text-xs transition-colors flex items-center gap-1 cursor-pointer font-medium"
                                >
                                  <Calendar className="w-3 h-3 text-[#1A1816]" />
                                  <span>{selectedLang === 'EN' ? '+ Calendar' : '+ Calendario'}</span>
                                </button>
                                {onAskVoyager && (
                                  <button
                                    type="button"
                                    onClick={() => {
                                      const prompt = selectedLang === 'EN'
                                        ? `[VOYAGER: Begin practice task "${task.title}". Objective: ${task.objective}]`
                                        : `[VOYAGER: Inicia la tarea de práctica "${task.title}". Objetivo: ${task.objective}]`;
                                      onAskVoyager(prompt);
                                    }}
                                    className="px-3 py-1 bg-[#1A1816] text-white rounded-full text-xs hover:bg-[#332E29] transition-colors flex items-center gap-1.5 cursor-pointer font-medium"
                                  >
                                    <Play className="w-2.5 h-2.5 fill-white" />
                                    <span>{selectedLang === 'EN' ? 'Practice' : 'Practicar'}</span>
                                  </button>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Completed Sessions & Activities */}
                    {(dayData?.sessions?.length || (mockupTasks?.completed && mockupTasks.completed.length > 0)) ? (
                      <div className="space-y-2 pt-2 border-t border-[#EAE2D7]/50">
                        <span className="text-xs font-semibold text-[#1A1816] block uppercase tracking-wide">
                          {selectedLang === 'EN' ? 'Completed Activities:' : 'Actividades Completadas:'}
                        </span>

                        <div className="space-y-1.5">
                          {dayData?.sessions?.map((s) => (
                            <div key={s.id} className="p-3 rounded-[14px] bg-white border border-[#E4D4BE]/70 flex items-center justify-between text-xs gap-3 shadow-2xs">
                              <div>
                                <span className="font-semibold text-[#1A1816] block text-sm">{s.title}</span>
                                <span className="text-xs text-[#7A736B]">{s.startTime} - {s.endTime} ({Math.round(s.durationSeconds / 60)} min)</span>
                              </div>
                              {onLoadChat && (
                                <button
                                  type="button"
                                  onClick={() => onLoadChat(s.rawChat)}
                                  className="px-3 py-1 bg-[#FAF6F0] border border-[#E0D19E] text-[#1A1816] rounded-full text-xs hover:bg-[#F8ECC0]/40 transition-colors cursor-pointer font-medium"
                                >
                                  {selectedLang === 'EN' ? 'View Transcript' : 'Ver Transcripción'}
                                </button>
                              )}
                            </div>
                          ))}

                          {!dayData?.sessions?.length && mockupTasks?.completed?.map((comp) => (
                            <div key={comp.id} className="p-3 rounded-[14px] bg-white border border-[#E4D4BE]/70 flex items-center justify-between text-xs gap-3 shadow-2xs">
                              <div>
                                <div className="flex items-center gap-2">
                                  <span className="font-semibold text-[#1A1816] block text-sm">{comp.title}</span>
                                  <span className="text-[11px] font-normal text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200/60">
                                    {comp.score}
                                  </span>
                                </div>
                                <span className="text-xs text-[#7A736B]">{comp.duration} • {selectedLang === 'EN' ? 'Evaluated by Voyager' : 'Evaluado por Voyager'}</span>
                              </div>
                              <span className="text-xs text-[#059669] font-bold flex items-center gap-1">
                                ✓ {selectedLang === 'EN' ? 'Completed' : 'Completada'}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    ) : null}
                  </div>

                  {/* ─────────────────────────────────────────────────────────────
                      DAILY PRACTICE GOAL (One fixed 20-minute daily target)
                      ───────────────────────────────────────────────────────────── */}
                  <div className="pt-3 border-t border-[#EAE2D7]/70 space-y-2">
                    <div className="space-y-0.5">
                      <span className="text-xs sm:text-sm font-bold text-[#1A1816] block">
                        {selectedLang === 'EN' ? 'Daily Practice Goal' : 'Meta Diaria de Práctica'}
                      </span>
                      <p className="text-[11px] text-[#7A736B]">
                        {totalPracticeMinutes >= 20
                          ? (selectedLang === 'EN'
                              ? `${totalPracticeMinutes} / 20 min — goal reached (+${totalPracticeMinutes - 20} min)`
                              : `${totalPracticeMinutes} / 20 min — meta alcanzada (+${totalPracticeMinutes - 20} min)`)
                          : totalPracticeMinutes > 0
                            ? (selectedLang === 'EN'
                                ? `${totalPracticeMinutes} / 20 min (${20 - totalPracticeMinutes} min remaining)`
                                : `${totalPracticeMinutes} / 20 min (faltan ${20 - totalPracticeMinutes} min)`)
                            : '0 / 20 min'}
                      </p>
                    </div>

                    {/* Compact Practice Goal Progress Bar: No wider than 3/4 (75%) */}
                    <div className="w-[75%] max-w-[360px] h-5 sm:h-6 rounded-full bg-white overflow-hidden flex items-center">
                      {totalPracticeMinutes > 0 && (
                        <div
                          className="h-full bg-[#059669] rounded-full transition-all duration-500"
                          style={{
                            width: `${Math.min(100, Math.round((totalPracticeMinutes / 20) * 100))}%`
                          }}
                        />
                      )}
                    </div>
                  </div>

                  {/* Day View Footer Navigation Arrows (< and >) */}
                  <div className="flex items-center gap-2 pt-3 border-t border-[#EAE2D7]/60 justify-start">
                    <button
                      type="button"
                      onClick={handlePrevDay}
                      aria-label={selectedLang === 'EN' ? 'Previous Day' : 'Día Anterior'}
                      className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-white hover:bg-[#FBBF24] text-black flex items-center justify-center shadow-xs active:scale-95 transition-colors duration-200 cursor-pointer border border-[#EAE2D7]/60"
                    >
                      <ChevronLeft className="w-3.5 h-3.5 sm:w-4 sm:h-4 stroke-[2.4] text-black" />
                    </button>
                    <button
                      type="button"
                      onClick={handleNextDay}
                      aria-label={selectedLang === 'EN' ? 'Next Day' : 'Día Siguiente'}
                      className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-white hover:bg-[#FBBF24] text-black flex items-center justify-center shadow-xs active:scale-95 transition-colors duration-200 cursor-pointer border border-[#EAE2D7]/60"
                    >
                      <ChevronRight className="w-3.5 h-3.5 sm:w-4 sm:h-4 stroke-[2.4] text-black" />
                    </button>
                  </div>
                </div>
              );
            })()}
          </div>
        )}

        {/* VIEW 4: TASKS VIEW (Exclusively shown in the "Tareas" tab view) */}
        {viewMode === 'tasks' && (
          <div className="space-y-4">
            {/* Top Control Bar: Category Filters & "+ Tarea" Action */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 pb-3 border-b border-[#EAE2D7]/70">
              {/* Filter Tabs */}
              <div className="flex items-center gap-1 sm:gap-1.5 overflow-x-auto no-scrollbar py-0.5">
                {[
                  { id: 'all', labelEN: 'All', labelES: 'Todas' },
                  { id: 'assigned', labelEN: 'Teacher Assigned', labelES: 'Asignadas' },
                  { id: 'personal', labelEN: 'Personal', labelES: 'Personales' },
                  { id: 'completed', labelEN: 'Completed', labelES: 'Completadas' },
                ].map((f) => (
                  <button
                    key={f.id}
                    type="button"
                    onClick={() => setTaskFilter(f.id as any)}
                    className={`text-xs px-2.5 sm:px-3 py-1 rounded-full font-medium transition-colors cursor-pointer whitespace-nowrap ${
                      taskFilter === f.id
                        ? 'bg-[#1A1816] text-white shadow-2xs'
                        : 'bg-white hover:bg-neutral-100 text-[#5C554E] hover:text-[#1A1816] border border-[#E0D19E]/60'
                    }`}
                  >
                    {selectedLang === 'EN' ? f.labelEN : f.labelES}
                  </button>
                ))}
              </div>

              {/* + Tarea Action Button */}
              <button
                type="button"
                onClick={() => {
                  setIsAddingTask(prev => !prev);
                  setNewTaskDateKey(todayKey);
                }}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white hover:bg-neutral-100 text-[#1A1816] text-xs font-semibold border border-[#1A1816] transition-all active:scale-95 cursor-pointer shadow-2xs self-start sm:self-auto shrink-0"
              >
                <span className="w-4 h-4 rounded-full border border-[#1A1816] flex items-center justify-center shrink-0">
                  <Plus className="w-2.5 h-2.5 stroke-[2.8]" />
                </span>
                <span>
                  {isAddingTask
                    ? (selectedLang === 'EN' ? 'Cancel' : 'Cancelar')
                    : (selectedLang === 'EN' ? '+ Task' : '+ Tarea')}
                </span>
              </button>
            </div>

            {/* Inline Student Task Creation Form */}
            {isAddingTask && (
              <div className="p-4 rounded-[18px] bg-[#F8ECC0]/45 border border-[#E0D19E] space-y-3 shadow-xs animate-fade-in">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-[#1A1816] block uppercase tracking-wide">
                    {selectedLang === 'EN' ? 'New Task or Reminder' : 'Nueva Tarea o Recordatorio'}
                  </span>
                  <span className="text-[11px] text-[#7A736B]">
                    {selectedLang === 'EN' ? 'Mandatory date required' : 'Fecha obligatoria'}
                  </span>
                </div>

                {/* Mandatory Date Picker */}
                <div className="flex items-center gap-2">
                  <label className="text-xs font-semibold text-[#1A1816] shrink-0">
                    {selectedLang === 'EN' ? 'Date:' : 'Fecha:'}
                  </label>
                  <input
                    type="date"
                    value={newTaskDateKey}
                    onChange={(e) => setNewTaskDateKey(e.target.value)}
                    required
                    className="px-2.5 py-1 text-xs bg-white border border-[#E4D4BE] rounded-lg text-[#1A1816] focus:outline-hidden focus:ring-1 focus:ring-[#1A1816] font-semibold"
                  />
                </div>

                {/* Category selector pills */}
                <div className="flex items-center gap-1.5 flex-wrap">
                  {[
                    { id: 'task', labelEN: 'Personal Task', labelES: 'Tarea personal' },
                    { id: 'reminder', labelEN: 'Reminder', labelES: 'Recordatorio' },
                    { id: 'interest', labelEN: 'Interest', labelES: 'Interés' },
                    { id: 'goal', labelEN: 'Goal', labelES: 'Meta' },
                    { id: 'event', labelEN: 'Event', labelES: 'Evento' },
                  ].map((cat) => (
                    <button
                      key={cat.id}
                      type="button"
                      onClick={() => setNewTaskCategory(cat.id as any)}
                      className={`text-[11px] px-2.5 py-1 rounded-full transition-colors cursor-pointer border ${
                        newTaskCategory === cat.id
                          ? 'bg-[#1A1816] text-white border-[#1A1816]'
                          : 'bg-white text-[#5C554E] hover:text-[#1A1816] border-[#E4D4BE]/70'
                      }`}
                    >
                      {selectedLang === 'EN' ? cat.labelEN : cat.labelES}
                    </button>
                  ))}
                </div>

                <div className="space-y-2">
                  <input
                    type="text"
                    value={newTaskTitle}
                    onChange={(e) => setNewTaskTitle(e.target.value)}
                    placeholder={selectedLang === 'EN' ? 'Task title (required)...' : 'Título de la tarea (obligatorio)...'}
                    className="w-full px-3 py-2 text-xs bg-white border border-[#E4D4BE] rounded-lg text-[#1A1816] placeholder-[#A3988C] focus:outline-hidden focus:ring-1 focus:ring-[#1A1816] font-medium"
                    autoFocus
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleCreateStudentPersonalTask(newTaskDateKey);
                      }
                    }}
                  />
                  <input
                    type="text"
                    value={newTaskObjective}
                    onChange={(e) => setNewTaskObjective(e.target.value)}
                    placeholder={selectedLang === 'EN' ? 'Details or notes (optional)...' : 'Detalles o recordatorio (opcional)...'}
                    className="w-full px-3 py-2 text-xs bg-white border border-[#E4D4BE] rounded-lg text-[#1A1816] placeholder-[#A3988C] focus:outline-hidden focus:ring-1 focus:ring-[#1A1816]"
                  />
                </div>

                <div className="flex items-center justify-end gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => {
                      setIsAddingTask(false);
                      setNewTaskTitle('');
                      setNewTaskObjective('');
                    }}
                    className="px-3 py-1.5 text-xs text-[#5C554E] hover:text-[#1A1816] rounded-full transition-colors cursor-pointer"
                  >
                    {selectedLang === 'EN' ? 'Cancel' : 'Cancelar'}
                  </button>
                  <button
                    type="button"
                    disabled={!newTaskTitle.trim() || !newTaskDateKey || isSavingTask}
                    onClick={() => handleCreateStudentPersonalTask(newTaskDateKey)}
                    className="px-4 py-1.5 bg-[#1A1816] text-white text-xs font-semibold rounded-full hover:bg-[#332E29] transition-colors disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer flex items-center gap-1.5 shadow-2xs"
                  >
                    <span>{isSavingTask ? (selectedLang === 'EN' ? 'Saving...' : 'Guardando...') : (selectedLang === 'EN' ? 'Save Task' : 'Guardar Tarea')}</span>
                  </button>
                </div>
              </div>
            )}

            {/* List of Tasks */}
            <div className="space-y-4">
              {/* SECTION A: Teacher Assignments */}
              {(taskFilter === 'all' || taskFilter === 'assigned') && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-[#1A1816] uppercase tracking-wide flex items-center gap-1.5">
                      <span className="w-2.5 h-2.5 rounded-full bg-[#EF4444]" />
                      {selectedLang === 'EN' ? 'Teacher Assignments & Practice' : 'Tareas Asignadas por el Docente'}
                    </span>
                    <span className="text-[11px] text-[#7A736B]">
                      {selectedLang === 'EN' ? 'Curriculum Tasks' : 'Plan de Estudio'}
                    </span>
                  </div>

                  <div className="space-y-2">
                    {/* Real Firestore / Database assignments */}
                    {assignments.map((assign) => (
                      <div key={assign.id} className="p-3 sm:p-3.5 rounded-[14px] bg-[#F8ECC0]/30 border border-[#E0D19E]/60 flex items-center justify-between text-xs gap-3 shadow-2xs hover:border-[#1A1816]/30 transition-colors">
                        <div className="space-y-0.5 min-w-0 flex-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-semibold text-[#1A1816] text-sm block truncate">{assign.title}</span>
                            {assign.teacherName && (
                              <span className="text-[10px] text-[#5C554E] px-2 py-0.5 rounded-full bg-white/80 border border-[#E0D19E]/50">
                                {assign.teacherName}
                              </span>
                            )}
                            <span className="text-[10px] text-[#EF4444] font-semibold bg-red-50 px-2 py-0.5 rounded-full border border-red-200">
                              {selectedLang === 'EN' ? `Due: ${assign.dueDate || 'Class'}` : `Entrega: ${assign.dueDate || 'Clase'}`}
                            </span>
                          </div>
                          <span className="text-xs text-[#5C554E] block truncate">{assign.objective}</span>
                        </div>

                        <div className="flex items-center gap-1.5 shrink-0 flex-wrap">
                          <button
                            type="button"
                            onClick={() => {
                              const nextDate = prompt(
                                selectedLang === 'EN'
                                  ? `Schedule an extra practice session for "${assign.title}". Enter date (YYYY-MM-DD):`
                                  : `Programa una fecha adicional de práctica en tu calendario para "${assign.title}". Ingresa fecha (AAAA-MM-DD):`,
                                todayKey
                              );
                              if (nextDate && nextDate.trim()) {
                                handleAddPracticeDateToAssignment(assign.id, nextDate.trim());
                              }
                            }}
                            className="px-2.5 py-1 bg-white hover:bg-neutral-100 border border-[#1A1816]/40 text-[#1A1816] rounded-full text-xs transition-colors flex items-center gap-1 cursor-pointer font-medium"
                            title={selectedLang === 'EN' ? 'Add extra practice session date to calendar' : 'Programar fecha extra de práctica en calendario'}
                          >
                            <Calendar className="w-3 h-3 text-[#1A1816]" />
                            <span>{selectedLang === 'EN' ? '+ Calendar' : '+ Calendario'}</span>
                          </button>

                          {onAskVoyager && (
                            <button
                              type="button"
                              onClick={() => {
                                const prompt = selectedLang === 'EN'
                                  ? `[VOYAGER: Begin assignment "${assign.title}". Objective: ${assign.objective}]`
                                  : `[VOYAGER: Inicia la tarea "${assign.title}". Objetivo: ${assign.objective}]`;
                                onAskVoyager(prompt);
                              }}
                              className="px-3 py-1 bg-[#1A1816] text-white rounded-full text-xs hover:bg-[#332E29] transition-colors flex items-center gap-1.5 cursor-pointer font-medium"
                            >
                              <Play className="w-2.5 h-2.5 fill-white" />
                              <span>{selectedLang === 'EN' ? 'Practice' : 'Practicar'}</span>
                            </button>
                          )}
                        </div>
                      </div>
                    ))}

                    {/* Curated baseline assignments */}
                    {[
                      {
                        id: 'task-civics-128',
                        title: selectedLang === 'EN' ? 'Civics 128: Branches of Government & Constitution' : 'Cívica 128: Ramas del Gobierno y Constitución',
                        teacher: 'Alejandra François',
                        due: '13/11/2026',
                        objective: selectedLang === 'EN' ? 'Master the 3 branches of government and constitutional checks & balances.' : 'Entender las tres ramas del gobierno y el sistema de Pesos y Contrapesos.',
                      },
                      {
                        id: 'task-medical-vocab',
                        title: selectedLang === 'EN' ? 'Medical Vocabulary: Symptoms & Pharmacy Visit' : 'Vocabulario Médico: Síntomas y Farmacia',
                        teacher: 'Alejandra François',
                        due: '13/11/2026',
                        objective: selectedLang === 'EN' ? 'Practice symptoms description, pharmacy conversations, and prescription comprehension.' : 'Vocabulario esencial para describir síntomas, consultas médicas y farmacia.',
                      },
                      {
                        id: 'task-supermarket',
                        title: selectedLang === 'EN' ? 'Supermarket Dialogues & Customer Service' : 'Simulación de Compra en Supermercado y Atención al Cliente',
                        teacher: 'Alejandra François',
                        due: '14/11/2026',
                        objective: selectedLang === 'EN' ? 'Ask for item locations, check prices, and resolve billing questions with Voyager.' : 'Preguntar por productos, precios y resolver consultas en caja con Voyager.',
                      },
                      {
                        id: 'task-n400',
                        title: selectedLang === 'EN' ? 'Citizenship Interview Simulation: Form N-400' : 'Simulación de Entrevista de Ciudadanía: Formulario N-400',
                        teacher: 'Alejandra François',
                        due: '25/11/2026',
                        objective: selectedLang === 'EN' ? 'Respond naturally and confidently to personal background, residence, and moral character questions.' : 'Responder con naturalidad y seguridad preguntas sobre antecedentes, residencia y carácter moral.',
                      },
                    ].map((task) => (
                      <div key={task.id} className="p-3 sm:p-3.5 rounded-[14px] bg-[#F8ECC0]/30 border border-[#E0D19E]/60 flex items-center justify-between text-xs gap-3 shadow-2xs hover:border-[#1A1816]/30 transition-colors">
                        <div className="space-y-0.5 min-w-0 flex-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-semibold text-[#1A1816] text-sm block truncate">{task.title}</span>
                            <span className="text-[10px] text-[#5C554E] px-2 py-0.5 rounded-full bg-white/80 border border-[#E0D19E]/50">
                              {task.teacher}
                            </span>
                            <span className="text-[10px] text-[#EF4444] font-semibold bg-red-50 px-2 py-0.5 rounded-full border border-red-200">
                              {selectedLang === 'EN' ? `Due: ${task.due}` : `Entrega: ${task.due}`}
                            </span>
                          </div>
                          <span className="text-xs text-[#5C554E] block truncate">{task.objective}</span>
                        </div>

                        <div className="flex items-center gap-1.5 shrink-0 flex-wrap">
                          <button
                            type="button"
                            onClick={() => {
                              const nextDate = prompt(
                                selectedLang === 'EN'
                                  ? `Schedule an extra practice session for "${task.title}". Enter date (YYYY-MM-DD):`
                                  : `Programa una fecha adicional de práctica para "${task.title}". Ingresa fecha (AAAA-MM-DD):`,
                                todayKey
                              );
                              if (nextDate && nextDate.trim()) {
                                handleAddPracticeDateToAssignment(task.id, nextDate.trim());
                              }
                            }}
                            className="px-2.5 py-1 bg-white hover:bg-neutral-100 border border-[#1A1816]/40 text-[#1A1816] rounded-full text-xs transition-colors flex items-center gap-1 cursor-pointer font-medium"
                            title={selectedLang === 'EN' ? 'Add extra practice session date to calendar' : 'Programar fecha extra de práctica en calendario'}
                          >
                            <Calendar className="w-3 h-3 text-[#1A1816]" />
                            <span>{selectedLang === 'EN' ? '+ Calendar' : '+ Calendario'}</span>
                          </button>

                          {onAskVoyager && (
                            <button
                              type="button"
                              onClick={() => {
                                const prompt = selectedLang === 'EN'
                                  ? `[VOYAGER: Begin assignment "${task.title}". Objective: ${task.objective}]`
                                  : `[VOYAGER: Inicia la tarea "${task.title}". Objetivo: ${task.objective}]`;
                                onAskVoyager(prompt);
                              }}
                              className="px-3 py-1 bg-[#1A1816] text-white rounded-full text-xs hover:bg-[#332E29] transition-colors flex items-center gap-1.5 cursor-pointer font-medium"
                            >
                              <Play className="w-2.5 h-2.5 fill-white" />
                              <span>{selectedLang === 'EN' ? 'Practice' : 'Practicar'}</span>
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* SECTION B: Student Personal Tasks */}
              {(taskFilter === 'all' || taskFilter === 'personal' || taskFilter === 'completed') && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-[#1A1816] uppercase tracking-wide flex items-center gap-1.5">
                      <span className="w-2.5 h-2.5 rounded-full bg-[#F59E0B]" />
                      {selectedLang === 'EN' ? 'My Personal Tasks & Goals' : 'Mis Tareas Personales y Metas'}
                    </span>
                    <span className="text-[11px] text-[#7A736B]">
                      {personalTasks.length} {selectedLang === 'EN' ? 'registered' : 'registradas'}
                    </span>
                  </div>

                  {personalTasks.filter(t => taskFilter === 'completed' ? t.completed : (taskFilter === 'personal' ? true : !t.completed)).length === 0 ? (
                    <div className="p-4 rounded-[14px] bg-white/70 border border-[#E4D4BE]/60 text-center text-xs text-[#7A736B]">
                      {taskFilter === 'completed'
                        ? (selectedLang === 'EN' ? 'No completed personal tasks yet.' : 'Aún no tienes tareas personales completadas.')
                        : (selectedLang === 'EN' ? 'No personal tasks added. Click "+ Task" to create one.' : 'No tienes tareas personales. Haz clic en "+ Tarea" para crear una.')}
                    </div>
                  ) : (
                    <div className="space-y-1.5">
                      {personalTasks
                        .filter(t => taskFilter === 'completed' ? t.completed : (taskFilter === 'personal' ? true : !t.completed))
                        .map((t) => (
                          <div
                            key={t.id}
                            className="p-3 rounded-[14px] bg-white border border-[#E4D4BE]/70 flex items-center justify-between text-xs gap-3 shadow-2xs hover:border-[#1A1816]/30 transition-colors"
                          >
                            <div className="flex items-start gap-2.5 min-w-0 flex-1">
                              <button
                                type="button"
                                onClick={() => handleTogglePersonalTask(t.id)}
                                className="mt-0.5 text-neutral-500 hover:text-black cursor-pointer shrink-0"
                                title={t.completed ? (selectedLang === 'EN' ? 'Mark incomplete' : 'Marcar pendiente') : (selectedLang === 'EN' ? 'Mark complete' : 'Marcar completada')}
                              >
                                {t.completed ? (
                                  <CheckCircle2 className="w-4 h-4 text-[#059669] fill-[#059669]/20" />
                                ) : (
                                  <div className="w-4 h-4 rounded-full border-2 border-[#1A1816]/40 hover:border-[#1A1816]" />
                                )}
                              </button>
                              <div className="min-w-0 flex-1">
                                <div className="flex items-center gap-2 flex-wrap">
                                  <span className={`font-semibold text-sm text-[#1A1816] truncate ${t.completed ? 'line-through text-[#7A736B]' : ''}`}>
                                    {t.title}
                                  </span>
                                  <span className="text-[10px] font-normal text-[#5C554E] px-2 py-0.5 rounded-full bg-[#F8ECC0]/50 border border-[#E0D19E]/50">
                                    {t.category === 'reminder' ? (selectedLang === 'EN' ? 'Reminder' : 'Recordatorio') :
                                     t.category === 'goal' ? (selectedLang === 'EN' ? 'Goal' : 'Meta') :
                                     t.category === 'event' ? (selectedLang === 'EN' ? 'Event' : 'Evento') :
                                     t.category === 'interest' ? (selectedLang === 'EN' ? 'Interest' : 'Interés') :
                                     (selectedLang === 'EN' ? 'Personal Task' : 'Tarea Personal')}
                                  </span>
                                  <span className="text-[10px] text-[#7A736B] font-mono">
                                    {t.dateKey}
                                  </span>
                                </div>
                                {t.objective && (
                                  <span className="text-xs text-[#5C554E] block mt-0.5 truncate">{t.objective}</span>
                                )}
                              </div>
                            </div>

                            <div className="flex items-center gap-1.5 shrink-0">
                              {onAskVoyager && (
                                <button
                                  type="button"
                                  onClick={() => {
                                    const prompt = selectedLang === 'EN'
                                      ? `[VOYAGER: Student selected their task "${t.title}". Guide them in practice.]`
                                      : `[VOYAGER: El estudiante seleccionó su tarea "${t.title}". Guíale en la práctica.]`;
                                    onAskVoyager(prompt);
                                  }}
                                  className="px-2.5 py-1 bg-[#FAF6F0] hover:bg-[#F8ECC0]/60 border border-[#E0D19E] text-[#1A1816] rounded-full text-xs transition-colors flex items-center gap-1 cursor-pointer font-medium"
                                >
                                  <Play className="w-2.5 h-2.5 fill-current" />
                                  <span>{selectedLang === 'EN' ? 'Practice' : 'Practicar'}</span>
                                </button>
                              )}
                              <button
                                type="button"
                                onClick={() => handleDeletePersonalTask(t.id)}
                                className="p-1 text-[#8C827A] hover:text-[#EF4444] transition-colors cursor-pointer"
                                title={selectedLang === 'EN' ? 'Delete task' : 'Eliminar tarea'}
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>
                        ))}
                    </div>
                  )}
                </div>
              )}

              {/* SECTION C: Completed Tasks & Activities */}
              {(taskFilter === 'all' || taskFilter === 'completed') && (
                <div className="space-y-2 pt-2 border-t border-[#EAE2D7]/50">
                  <span className="text-xs font-bold text-[#1A1816] uppercase tracking-wide flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-[#10B981]" />
                    {selectedLang === 'EN' ? 'Completed Tasks & Evaluations' : 'Tareas y Prácticas Completadas'}
                  </span>

                  <div className="space-y-1.5">
                    {[
                      {
                        id: 'comp-subway',
                        title: selectedLang === 'EN' ? 'NYC Subway Navigation & Urban Directions' : 'Navegación del Metro de NYC y Direcciones Urbanas',
                        score: selectedLang === 'EN' ? 'Grade A' : 'Calificación A',
                        duration: '18 min',
                        date: '21/11/2026',
                      },
                      {
                        id: 'comp-civics-1-20',
                        title: selectedLang === 'EN' ? 'Civics Questions 1-20: Principles of Democracy' : 'Preguntas Cívicas 1-20: Principios de la Democracia',
                        score: selectedLang === 'EN' ? 'Score: 100% (Grade A)' : 'Puntuación: 100% (Calificación A)',
                        duration: '20 min',
                        date: '25/11/2026',
                      },
                      {
                        id: 'comp-consulate',
                        title: selectedLang === 'EN' ? 'Consulate Oral Practice: Required Documentation' : 'Práctica Oral para el Consulado: Trámites y Documentación',
                        score: selectedLang === 'EN' ? 'Grade A-' : 'Calificación A-',
                        duration: '15 min',
                        date: '25/11/2026',
                      },
                    ].map((comp) => (
                      <div key={comp.id} className="p-3 rounded-[14px] bg-white border border-[#E4D4BE]/70 flex items-center justify-between text-xs gap-3 shadow-2xs">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-semibold text-[#1A1816] block text-sm">{comp.title}</span>
                            <span className="text-[11px] font-normal text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200/60">
                              {comp.score}
                            </span>
                          </div>
                          <span className="text-xs text-[#7A736B]">{comp.date} • {comp.duration} • {selectedLang === 'EN' ? 'Evaluated by Voyager' : 'Evaluado por Voyager'}</span>
                        </div>
                        <span className="text-xs text-[#059669] font-bold flex items-center gap-1 shrink-0">
                          ✓ {selectedLang === 'EN' ? 'Completed' : 'Completada'}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Status Indicator Legend */}
            <div className="flex items-center gap-3 pt-3 border-t border-[#EAE2D7]/70 text-xs text-[#5C554E] flex-wrap justify-start">
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-[#EF4444]" />
                <span>{selectedLang === 'EN' ? 'Assigned' : 'Asignada'}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-[#F59E0B]" />
                <span>{selectedLang === 'EN' ? 'In progress' : 'En proceso'}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-[#10B981]" />
                <span>{selectedLang === 'EN' ? 'Completed' : 'Completada'}</span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
