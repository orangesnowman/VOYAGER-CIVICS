import React, { useState, useMemo, useEffect } from 'react';
import { 
  FolderOpen, 
  Search, 
  MoreHorizontal, 
  Edit3, 
  Trash2, 
  Check, 
  X, 
  Clock, 
  Calendar,
  MessageSquare,
  Sparkles,
  Layers,
  Play,
  RotateCcw,
  BookOpen,
  Award
} from 'lucide-react';
import { translations } from './Translations';
import { SavedChatSession } from './SavedChatsModal';
import { fetchUnifiedStudentAssignments, UnifiedAssignment } from '../services/teacherStudentService';

export interface GroupedSavedChat {
  id: string;
  allSessionIds: string[];
  title: string;
  normalizedTitle: string;
  date: string;
  durationSeconds: number;
  messageCount: number;
  interactionCount: number;
  snippet: string;
  messages: { sender: string; text: string; timestamp?: any }[];
  isDeliberatelySaved?: boolean;
  progressPercentage?: number;
  isCompleted?: boolean;
}

export interface AssignedCharla {
  id: string;
  title: string;
  category: string;
  level: string;
  durationMinutes: number;
  description: string;
  objective?: string;
  progressPercentage: number;
  isCompleted?: boolean;
  assignedBy?: string;
}

export interface ConversationsPageProps {
  selectedLang: 'EN' | 'ES';
  savedChats: SavedChatSession[];
  currentBookmarkedChatId: string | null;
  onLoadChat: (chat: SavedChatSession) => void;
  onRenameChat: (chatId: string, newTitle: string) => void;
  onDeleteChat: (chatId: string | string[]) => void;
  onBack: () => void;
  onStartNewChat?: () => void;
  onStartLesson?: (lesson: any, assignment?: any) => void;
}

export const ConversationsPage: React.FC<ConversationsPageProps> = ({
  selectedLang,
  savedChats,
  currentBookmarkedChatId,
  onLoadChat,
  onRenameChat,
  onDeleteChat,
  onStartNewChat,
  onStartLesson,
}) => {
  const [activeTab, setActiveTab] = useState<'assigned' | 'my_chats' | 'completed'>('assigned');
  const [searchQuery, setSearchQuery] = useState('');
  const [editingChatId, setEditingChatId] = useState<string | null>(null);
  const [editingTitleText, setEditingTitleText] = useState('');
  const [activeMenuChatId, setActiveMenuChatId] = useState<string | null>(null);
  const [deleteConfirmChatId, setDeleteConfirmChatId] = useState<string | null>(null);
  const [teacherAssignments, setTeacherAssignments] = useState<UnifiedAssignment[]>([]);

  const t = translations[selectedLang];

  // Load teacher-assigned coursework
  useEffect(() => {
    let isMounted = true;
    fetchUnifiedStudentAssignments()
      .then((res: any) => {
        if (isMounted) {
          const list = Array.isArray(res) ? res : res?.assignments || [];
          setTeacherAssignments(list);
        }
      })
      .catch(() => {});
    return () => {
      isMounted = false;
    };
  }, []);

  // Standard curriculum assigned practice charlas
  const defaultAssignedCharlas: AssignedCharla[] = useMemo(() => [
    {
      id: 'assigned-star-interview',
      title: selectedLang === 'EN' ? 'Job Interview (STAR Method)' : 'Simulación de Entrevista de Trabajo: Método STAR',
      category: selectedLang === 'EN' ? 'Career & Business' : 'Negocios y Carrera',
      level: 'B2',
      durationMinutes: 20,
      description: selectedLang === 'EN' 
        ? 'Practice answering 3 situational interview questions using the STAR framework with Voyager.' 
        : 'Practica responder 3 preguntas situacionales con el marco STAR para entrevistas ejecutivas.',
      objective: selectedLang === 'EN' ? 'Structure concise, impactful behavioral responses.' : 'Estructurar respuestas conductuales concisas y de impacto.',
      progressPercentage: 35,
      assignedBy: selectedLang === 'EN' ? 'Prof. García' : 'Profesor García'
    },
    {
      id: 'assigned-civics-128',
      title: selectedLang === 'EN' ? 'USCIS Civics 128: Judicial Branch' : 'Cívica USCIS 128: Rama Judicial y Constitución',
      category: selectedLang === 'EN' ? 'Citizenship & Rights' : 'Cívica y Derechos',
      level: 'B1-B2',
      durationMinutes: 20,
      description: selectedLang === 'EN'
        ? 'Oral simulation covering official naturalization questions 37 to 57.'
        : 'Simulación oral de las preguntas oficiales 37 a 57 para el examen de naturalización.',
      objective: selectedLang === 'EN' ? 'Master constitutional structure terminology.' : 'Dominar terminología constitucional y poderes del Estado.',
      progressPercentage: 0,
      assignedBy: selectedLang === 'EN' ? 'Prof. García' : 'Profesor García'
    },
    {
      id: 'assigned-workplace-dialogue',
      title: selectedLang === 'EN' ? 'American Workplace Cross-Alignment' : 'Diálogo Profesional en el Entorno Laboral',
      category: selectedLang === 'EN' ? 'Professional English' : 'Inglés Profesional',
      level: 'B2',
      durationMinutes: 15,
      description: selectedLang === 'EN'
        ? 'Propose an initiative to team leads and navigate constructive feedback diplomatically.'
        : 'Presenta una propuesta estratégica y gestiona retroalimentación con diplomacia ejecutiva.',
      objective: selectedLang === 'EN' ? 'Assertive workplace communication.' : 'Comunicación asertiva en el trabajo.',
      progressPercentage: 0,
      assignedBy: selectedLang === 'EN' ? 'USA Voyager' : 'USA Voyager'
    },
    {
      id: 'assigned-tsa-airport',
      title: selectedLang === 'EN' ? 'Airport Customs & Border Checkpoint' : 'Control Migratorio y Seguridad de Aeropuerto',
      category: selectedLang === 'EN' ? 'Travel & Daily Living' : 'Viajes y Vida Diaria',
      level: 'A2-B1',
      durationMinutes: 15,
      description: selectedLang === 'EN'
        ? 'Navigate standard TSA security screening and CBP passport control questions with ease.'
        : 'Responde con seguridad a preguntas de oficiales de aduana y seguridad TSA en el aeropuerto.',
      objective: selectedLang === 'EN' ? 'Clear answers to travel and immigration prompts.' : 'Respuestas claras ante autoridades de frontera.',
      progressPercentage: 100,
      isCompleted: true,
      assignedBy: selectedLang === 'EN' ? 'USA Voyager' : 'USA Voyager'
    }
  ], [selectedLang]);

  // Combined assigned list incorporating teacher assignments
  const allAssignedCharlas = useMemo(() => {
    const list: AssignedCharla[] = [...defaultAssignedCharlas];
    teacherAssignments.forEach((ta) => {
      if (!list.some((l) => l.id === ta.id || l.title.toLowerCase() === ta.title.toLowerCase())) {
        list.push({
          id: ta.id,
          title: ta.title,
          category: selectedLang === 'EN' ? 'Teacher Assignment' : 'Tarea Docente',
          level: ta.level || 'B1-B2',
          durationMinutes: 20,
          description: (ta as any).description || ta.instructions || ta.objective || '',
          objective: ta.objective,
          progressPercentage: ta.progressPercentage || (ta.status === 'COMPLETED' ? 100 : 0),
          isCompleted: ta.status === 'COMPLETED' || (ta.progressPercentage || 0) >= 100,
          assignedBy: selectedLang === 'EN' ? 'Prof. García' : 'Profesor García'
        });
      }
    });
    return list;
  }, [defaultAssignedCharlas, teacherAssignments, selectedLang]);

  // Group and deduplicate saved chats
  const groupedChats = useMemo<GroupedSavedChat[]>(() => {
    const deliberate = savedChats.filter((c) => c.isDeliberatelySaved !== false);
    const groups = new Map<string, GroupedSavedChat>();

    deliberate.forEach((chat) => {
      const cleanTitle = (chat.title || '').trim();
      const normKey = (chat.lessonId || cleanTitle.toLowerCase()).replace(/\.+$/, '');

      // Estimate progress percentage based on message exchanges or stored completion
      const msgCount = (chat.messages && chat.messages.length) || chat.messageCount || 1;
      const progress = Math.min(100, Math.max(15, msgCount * 12));
      const isCompleted = progress >= 100 || (chat as any).completed === true;

      if (!groups.has(normKey)) {
        groups.set(normKey, {
          id: chat.id,
          allSessionIds: [chat.id],
          title: cleanTitle,
          normalizedTitle: normKey,
          date: chat.date,
          durationSeconds: chat.durationSeconds || 0,
          messageCount: msgCount,
          interactionCount: 1,
          snippet: chat.snippet || '',
          messages: chat.messages ? [...chat.messages] : [],
          isDeliberatelySaved: chat.isDeliberatelySaved,
          progressPercentage: progress,
          isCompleted: isCompleted,
        });
      } else {
        const existing = groups.get(normKey)!;
        existing.allSessionIds.push(chat.id);
        existing.interactionCount += 1;
        existing.durationSeconds += (chat.durationSeconds || 0);
        existing.messageCount += msgCount;
        existing.progressPercentage = Math.min(100, Math.max(existing.progressPercentage || 0, progress));
        if (isCompleted) existing.isCompleted = true;

        if (cleanTitle.length > existing.title.length) {
          existing.title = cleanTitle;
        }

        const existingTime = new Date(existing.date).getTime();
        const incomingTime = new Date(chat.date).getTime();
        if (!isNaN(incomingTime) && incomingTime > existingTime) {
          existing.date = chat.date;
          if (chat.snippet) existing.snippet = chat.snippet;
        }

        if (chat.messages && chat.messages.length > 0) {
          chat.messages.forEach((m) => {
            const last = existing.messages[existing.messages.length - 1];
            if (!last || last.text !== m.text || last.sender !== m.sender) {
              existing.messages.push(m);
            }
          });
        }
      }
    });

    return Array.from(groups.values());
  }, [savedChats]);

  // Tab 1: Assigned (Charlas asignadas) - pending or in-progress
  const assignedList = useMemo(() => {
    return allAssignedCharlas.filter((c) => !c.isCompleted && c.progressPercentage < 100);
  }, [allAssignedCharlas]);

  // Tab 2: My Chats (Mis charlas) - student in-progress conversations
  const myChatsList = useMemo(() => {
    return groupedChats.filter((c) => !c.isCompleted && (c.progressPercentage || 0) < 100);
  }, [groupedChats]);

  // Tab 3: Completed (Completadas) - all completed charlas without resetting
  const completedList = useMemo(() => {
    const list: (GroupedSavedChat | (AssignedCharla & { isAssigned: true }))[] = [];
    allAssignedCharlas
      .filter((c) => c.isCompleted || c.progressPercentage >= 100)
      .forEach((c) => list.push({ ...c, isAssigned: true }));
    groupedChats
      .filter((c) => c.isCompleted || (c.progressPercentage || 0) >= 100)
      .forEach((c) => list.push(c));
    return list;
  }, [allAssignedCharlas, groupedChats]);

  // Numerical indicator counts
  const assignedCount = assignedList.length;
  const myChatsCount = myChatsList.length;
  const completedCount = completedList.length;

  // Filter items by search query
  const q = searchQuery.toLowerCase().trim();

  const filteredAssigned = useMemo(() => {
    if (!q) return assignedList;
    return assignedList.filter(
      (c) =>
        c.title.toLowerCase().includes(q) ||
        c.category.toLowerCase().includes(q) ||
        c.description.toLowerCase().includes(q)
    );
  }, [assignedList, q]);

  const filteredMyChats = useMemo(() => {
    if (!q) return myChatsList;
    return myChatsList.filter(
      (c) =>
        c.title.toLowerCase().includes(q) ||
        (c.snippet && c.snippet.toLowerCase().includes(q))
    );
  }, [myChatsList, q]);

  const filteredCompleted = useMemo(() => {
    if (!q) return completedList;
    return completedList.filter((item) => {
      const title = 'title' in item ? item.title : '';
      const desc = 'description' in item ? item.description : ('snippet' in item ? item.snippet : '');
      return title.toLowerCase().includes(q) || desc.toLowerCase().includes(q);
    });
  }, [completedList, q]);

  const handleSaveRename = (chat: GroupedSavedChat) => {
    if (editingTitleText.trim()) {
      chat.allSessionIds.forEach((id) => {
        onRenameChat(id, editingTitleText.trim());
      });
    }
    setEditingChatId(null);
  };

  const handleDeleteGroup = (chat: GroupedSavedChat) => {
    chat.allSessionIds.forEach((id) => {
      onDeleteChat(id);
    });
    setDeleteConfirmChatId(null);
    setActiveMenuChatId(null);
  };

  const handleSelectGroup = (chat: GroupedSavedChat) => {
    const mergedSession: SavedChatSession = {
      id: chat.id,
      date: chat.date,
      title: chat.title,
      durationSeconds: chat.durationSeconds,
      messageCount: chat.messageCount,
      snippet: chat.snippet,
      messages: chat.messages,
      isDeliberatelySaved: true,
    };
    onLoadChat(mergedSession);
  };

  const handleStartAssignedCharla = (charla: AssignedCharla) => {
    if (onStartLesson) {
      onStartLesson({
        id: charla.id,
        title: charla.title,
        category: charla.category,
        level: charla.level,
        description: charla.description,
        prompt: `[PRACTICE TOPIC: ${charla.title}. Level: ${charla.level}. Objective: ${charla.objective || charla.description}]`
      });
    } else {
      onLoadChat({
        id: charla.id,
        date: new Date().toISOString(),
        title: charla.title,
        durationSeconds: 0,
        messageCount: 1,
        snippet: charla.description,
        messages: [
          {
            sender: 'splash',
            text: selectedLang === 'EN'
              ? `Hello! Welcome to our session on "${charla.title}". Let's begin our conversation!`
              : `¡Hola! Bienvenido a nuestra charla sobre "${charla.title}". ¡Comencemos nuestra práctica!`
          }
        ],
        isDeliberatelySaved: true
      });
    }
  };

  const formatDate = (dateStr: string) => {
    try {
      const d = new Date(dateStr);
      if (isNaN(d.getTime())) return dateStr;
      return d.toLocaleDateString(selectedLang === 'EN' ? 'en-US' : 'es-ES', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      });
    } catch {
      return dateStr;
    }
  };

  const formatDuration = (seconds?: number) => {
    if (!seconds || seconds <= 0) return null;
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  return (
    <div className="w-full h-full flex flex-col bg-white text-slate-800 font-['Raleway'] select-none overflow-hidden animate-fade-in">
      {/* Search Bar & Action Header */}
      <div className="px-4 sm:px-6 py-2.5 border-b border-slate-200/80 bg-slate-50/50 flex items-center justify-between gap-3 shrink-0">
        <div className="relative flex-1 max-w-sm sm:max-w-md">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={selectedLang === 'EN' ? 'Search conversations...' : 'Buscar conversaciones...'}
            className="w-full pl-8 pr-7 py-1.5 text-xs bg-white border border-slate-200 rounded-xl text-slate-800 placeholder-slate-400 focus:outline-none focus:border-blue-500 transition-all font-normal shadow-2xs"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
            >
              <X className="w-3 h-3" />
            </button>
          )}
        </div>

        {onStartNewChat && (
          <button
            type="button"
            onClick={onStartNewChat}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer active:scale-95 shrink-0"
            title={selectedLang === 'EN' ? 'Start a fresh conversation' : 'Iniciar una nueva conversación'}
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>{selectedLang === 'EN' ? 'New Chat' : 'Nueva Charla'}</span>
          </button>
        )}
      </div>

      {/* Three Tabs with Centered Circular Counters Directly Beneath Titles */}
      <div className="px-4 sm:px-6 pt-2 pb-0 border-b border-slate-200/80 bg-slate-50/30 flex items-center justify-start gap-4 sm:gap-6 shrink-0 overflow-x-auto no-scrollbar">
        {/* Tab 1: Charlas asignadas */}
        <button
          type="button"
          onClick={() => setActiveTab('assigned')}
          className={`pb-2 flex flex-col items-center gap-1 border-b-2 transition-all cursor-pointer shrink-0 ${
            activeTab === 'assigned'
              ? 'border-red-500 text-slate-900 font-bold'
              : 'border-transparent text-slate-500 hover:text-slate-800 font-normal'
          }`}
        >
          <span className="text-xs sm:text-sm whitespace-nowrap">
            {selectedLang === 'EN' ? 'Assigned' : 'Charlas asignadas'}
          </span>
          <span 
            className="w-5 h-5 rounded-full bg-[#EF4444] text-white text-[11px] font-bold flex items-center justify-center shadow-xs"
            title={selectedLang === 'EN' ? `${assignedCount} assigned` : `${assignedCount} asignadas`}
          >
            {assignedCount}
          </span>
        </button>

        {/* Tab 2: Mis charlas */}
        <button
          type="button"
          onClick={() => setActiveTab('my_chats')}
          className={`pb-2 flex flex-col items-center gap-1 border-b-2 transition-all cursor-pointer shrink-0 ${
            activeTab === 'my_chats'
              ? 'border-amber-500 text-slate-900 font-bold'
              : 'border-transparent text-slate-500 hover:text-slate-800 font-normal'
          }`}
        >
          <span className="text-xs sm:text-sm whitespace-nowrap">
            {selectedLang === 'EN' ? 'My Chats' : 'Mis charlas'}
          </span>
          <span 
            className="w-5 h-5 rounded-full bg-[#F59E0B] text-white text-[11px] font-bold flex items-center justify-center shadow-xs"
            title={selectedLang === 'EN' ? `${myChatsCount} in progress` : `${myChatsCount} en curso`}
          >
            {myChatsCount}
          </span>
        </button>

        {/* Tab 3: Completadas */}
        <button
          type="button"
          onClick={() => setActiveTab('completed')}
          className={`pb-2 flex flex-col items-center gap-1 border-b-2 transition-all cursor-pointer shrink-0 ${
            activeTab === 'completed'
              ? 'border-[#059669] text-slate-900 font-bold'
              : 'border-transparent text-slate-500 hover:text-slate-800 font-normal'
          }`}
        >
          <span className="text-xs sm:text-sm whitespace-nowrap">
            {selectedLang === 'EN' ? 'Completed' : 'Completadas'}
          </span>
          <span 
            className="w-5 h-5 rounded-full bg-[#059669] text-white text-[11px] font-bold flex items-center justify-center shadow-xs"
            title={selectedLang === 'EN' ? `${completedCount} completed` : `${completedCount} completadas`}
          >
            {completedCount}
          </span>
        </button>
      </div>

      {/* Content Area */}
      <div className="flex-1 overflow-y-auto px-4 sm:px-6 py-4 space-y-3 no-scrollbar">
        {/* TAB 1: CHARLAS ASIGNADAS */}
        {activeTab === 'assigned' && (
          filteredAssigned.length === 0 ? (
            <div className="h-64 flex flex-col items-center justify-center text-center p-6 text-slate-400">
              <div className="w-12 h-12 rounded-2xl bg-slate-100 flex items-center justify-center mb-3 text-slate-400">
                <BookOpen className="w-6 h-6" />
              </div>
              <p className="text-sm font-medium text-slate-600 mb-1">
                {selectedLang === 'EN' ? 'No pending assigned chats' : 'No tienes charlas asignadas pendientes'}
              </p>
              <p className="text-xs text-slate-400 max-w-xs font-normal">
                {selectedLang === 'EN'
                  ? 'All assigned practice sessions are completed or new ones will appear here.'
                  : 'Todas las prácticas asignadas están al día o las nuevas aparecerán aquí.'}
              </p>
            </div>
          ) : (
            filteredAssigned.map((charla) => (
              <div
                key={charla.id}
                onClick={() => handleStartAssignedCharla(charla)}
                className="group relative rounded-xl border border-slate-200/90 bg-white hover:border-slate-300 hover:bg-slate-50/70 p-3 sm:p-4 flex flex-col gap-2 transition-all cursor-pointer shadow-2xs hover:shadow-xs"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-xs sm:text-sm font-bold text-slate-900 group-hover:text-blue-600 transition-colors">
                        {charla.title}
                      </span>
                      <span className="px-1.5 py-0.2 rounded text-[10px] font-bold uppercase tracking-wider bg-red-50 text-red-700 border border-red-200">
                        {charla.level} · {charla.durationMinutes} min
                      </span>
                      {charla.assignedBy && (
                        <span className="text-[11px] text-slate-500 font-normal">
                          · {charla.assignedBy}
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-slate-600 mt-1 font-normal line-clamp-2">
                      {charla.description}
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleStartAssignedCharla(charla);
                    }}
                    className="flex items-center gap-1 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold transition-all shadow-xs cursor-pointer active:scale-95 shrink-0"
                  >
                    <Play className="w-3 h-3 fill-current" />
                    <span>{selectedLang === 'EN' ? 'Practice' : 'Practicar'}</span>
                  </button>
                </div>

                {/* Calendar-Styled Progress Bar */}
                <div className="w-full mt-1">
                  <div className="flex items-center justify-between text-[10px] text-slate-500 mb-1 font-mono">
                    <span>{selectedLang === 'EN' ? 'Progress' : 'Progreso'}</span>
                    <span className="font-bold text-slate-700">{charla.progressPercentage}%</span>
                  </div>
                  <div className="w-full bg-slate-100 rounded-full p-0.5 border border-slate-200/80">
                    <div 
                      className={`h-2 rounded-full transition-all duration-500 ${
                        charla.progressPercentage > 0 ? 'bg-[#F59E0B]' : 'bg-slate-300'
                      }`}
                      style={{ width: `${Math.max(charla.progressPercentage, 4)}%` }}
                    />
                  </div>
                </div>
              </div>
            ))
          )
        )}

        {/* TAB 2: MIS CHARLAS */}
        {activeTab === 'my_chats' && (
          filteredMyChats.length === 0 ? (
            <div className="h-64 flex flex-col items-center justify-center text-center p-6 text-slate-400">
              <div className="w-12 h-12 rounded-2xl bg-slate-100 flex items-center justify-center mb-3 text-slate-400">
                <FolderOpen className="w-6 h-6" />
              </div>
              <p className="text-sm font-medium text-slate-600 mb-1">
                {searchQuery
                  ? (selectedLang === 'EN' ? 'No matching conversations' : 'No se encontraron conversaciones')
                  : (t.noConversations || (selectedLang === 'EN' ? 'No saved conversations yet' : 'Aún no tienes conversaciones guardadas'))}
              </p>
              <p className="text-xs text-slate-400 max-w-xs font-normal mb-3">
                {searchQuery
                  ? (selectedLang === 'EN' ? 'Try a different search term.' : 'Prueba con otro término de búsqueda.')
                  : (selectedLang === 'EN'
                      ? 'Conversations you save during practice with Voyager will appear here.'
                      : 'Las conversaciones que guardes al practicar con Voyager aparecerán en esta página.')}
              </p>
              {onStartNewChat && (
                <button
                  type="button"
                  onClick={onStartNewChat}
                  className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer active:scale-95"
                >
                  {selectedLang === 'EN' ? 'Start First Chat' : 'Iniciar Primera Charla'}
                </button>
              )}
            </div>
          ) : (
            filteredMyChats.map((chat) => {
              const isActive = chat.allSessionIds.includes(currentBookmarkedChatId || '');
              const isEditing = editingChatId === chat.id;
              const isDeleting = deleteConfirmChatId === chat.id;
              const durationFormatted = formatDuration(chat.durationSeconds);
              const progress = chat.progressPercentage || 25;

              return (
                <div
                  key={chat.id}
                  onClick={() => {
                    if (!isEditing && !isDeleting) {
                      handleSelectGroup(chat);
                    }
                  }}
                  className={`group relative rounded-xl border transition-all cursor-pointer p-3 sm:p-3.5 flex flex-col gap-1.5 ${
                    isActive
                      ? 'border-blue-300 bg-blue-50/50 shadow-xs ring-1 ring-blue-200'
                      : 'border-slate-200/80 bg-white hover:border-slate-300 hover:bg-slate-50/70 hover:shadow-xs'
                  }`}
                >
                  {isDeleting ? (
                    <div
                      className="flex items-center justify-between bg-rose-50 border border-rose-200 rounded-lg p-2.5 text-xs text-rose-900"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <span className="font-semibold text-rose-800">
                        {t.deleteConfirm || (selectedLang === 'EN' ? 'Delete this conversation permanently?' : '¿Eliminar esta conversación permanentemente?')}
                      </span>
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteGroup(chat);
                          }}
                          className="px-2.5 py-1 rounded-lg bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs transition-colors cursor-pointer"
                        >
                          {t.confirmDelete || (selectedLang === 'EN' ? 'Delete' : 'Eliminar')}
                        </button>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setDeleteConfirmChatId(null);
                            setActiveMenuChatId(null);
                          }}
                          className="px-2 py-1 rounded-lg text-slate-600 hover:text-slate-900 text-xs transition-colors cursor-pointer"
                        >
                          {t.cancel || (selectedLang === 'EN' ? 'Cancel' : 'Cancelar')}
                        </button>
                      </div>
                    </div>
                  ) : isEditing ? (
                    <form
                      onSubmit={(e) => {
                        e.preventDefault();
                        handleSaveRename(chat);
                      }}
                      onClick={(e) => e.stopPropagation()}
                      className="flex items-center gap-2 w-full"
                    >
                      <input
                        type="text"
                        autoFocus
                        value={editingTitleText}
                        onChange={(e) => setEditingTitleText(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Escape') setEditingChatId(null);
                        }}
                        className="flex-1 bg-white border border-blue-400 rounded-lg px-2.5 py-1 text-xs text-slate-900 focus:outline-none ring-1 ring-blue-300"
                      />
                      <button
                        type="submit"
                        className="p-1.5 text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 rounded-lg cursor-pointer"
                        title={selectedLang === 'EN' ? 'Save title' : 'Guardar título'}
                      >
                        <Check className="w-4 h-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => setEditingChatId(null)}
                        className="px-2 py-1 text-xs text-slate-500 hover:text-slate-800 rounded-lg cursor-pointer"
                      >
                        {selectedLang === 'EN' ? 'Cancel' : 'Cancelar'}
                      </button>
                    </form>
                  ) : (
                    <>
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="text-xs sm:text-sm font-semibold text-slate-900 truncate">
                              {chat.title}
                            </span>
                            {isActive && (
                              <span className="shrink-0 px-1.5 py-0.2 rounded text-[10px] font-bold uppercase tracking-wider bg-blue-100 text-blue-700 border border-blue-200">
                                {selectedLang === 'EN' ? 'Active' : 'Activa'}
                              </span>
                            )}
                          </div>

                          {chat.snippet && (
                            <p className="text-xs text-slate-500 line-clamp-1 mt-0.5 font-normal">
                              {chat.snippet}
                            </p>
                          )}

                          <div className="flex flex-wrap items-center gap-2.5 sm:gap-3.5 mt-2 text-[11px] font-mono text-slate-500">
                            {chat.date && (
                              <div className="flex items-center gap-1" title={selectedLang === 'EN' ? 'Latest interaction' : 'Última interacción'}>
                                <Calendar className="w-3.5 h-3.5 text-slate-400" />
                                <span>{formatDate(chat.date)}</span>
                              </div>
                            )}

                            <div 
                              className="flex items-center gap-1 font-semibold text-blue-700 bg-blue-50 px-1.5 py-0.5 rounded border border-blue-200/80" 
                              title={selectedLang === 'EN' ? 'Total interaction sessions' : 'Sesiones de interacción totales'}
                            >
                              <Layers className="w-3 h-3 text-blue-600" />
                              <span>
                                {chat.interactionCount} {chat.interactionCount === 1 
                                  ? (selectedLang === 'EN' ? 'interaction' : 'interacción') 
                                  : (selectedLang === 'EN' ? 'interactions' : 'interacciones')}
                              </span>
                            </div>

                            <div className="flex items-center gap-1" title={selectedLang === 'EN' ? 'Total messages' : 'Mensajes totales'}>
                              <MessageSquare className="w-3.5 h-3.5 text-slate-400" />
                              <span>
                                {chat.messageCount} {chat.messageCount === 1 
                                  ? (selectedLang === 'EN' ? 'message' : 'mensaje') 
                                  : (selectedLang === 'EN' ? 'messages' : 'mensajes')}
                              </span>
                            </div>

                            {durationFormatted && (
                              <div className="flex items-center gap-1" title={selectedLang === 'EN' ? 'Total practice time' : 'Tiempo acumulado'}>
                                <Clock className="w-3.5 h-3.5 text-slate-400" />
                                <span>{durationFormatted}</span>
                              </div>
                            )}
                          </div>
                        </div>

                        <div className="relative shrink-0" onClick={(e) => e.stopPropagation()}>
                          <button
                            type="button"
                            onClick={() => {
                              setActiveMenuChatId(activeMenuChatId === chat.id ? null : chat.id);
                            }}
                            className={`p-1.5 rounded-lg text-slate-400 hover:text-slate-800 hover:bg-slate-100 transition-colors cursor-pointer ${
                              activeMenuChatId === chat.id ? 'bg-slate-100 text-slate-900' : ''
                            }`}
                            title={selectedLang === 'EN' ? 'Options' : 'Opciones'}
                            aria-label={selectedLang === 'EN' ? 'Options' : 'Opciones'}
                          >
                            <MoreHorizontal className="w-4 h-4" />
                          </button>

                          {activeMenuChatId === chat.id && (
                            <div className="absolute right-0 top-full mt-1 z-30 w-32 bg-white border border-slate-200 rounded-xl shadow-lg py-1 flex flex-col text-xs text-slate-700 animate-fade-in">
                              <button
                                type="button"
                                onClick={() => {
                                  setEditingChatId(chat.id);
                                  setEditingTitleText(chat.title);
                                  setActiveMenuChatId(null);
                                }}
                                className="flex items-center gap-2 px-3 py-1.5 hover:bg-slate-50 text-left text-slate-700 hover:text-slate-900 transition-colors cursor-pointer font-normal"
                              >
                                <Edit3 className="w-3.5 h-3.5 text-slate-400" />
                                <span>{t.rename || (selectedLang === 'EN' ? 'Rename' : 'Renombrar')}</span>
                              </button>
                              <button
                                type="button"
                                onClick={() => {
                                  setDeleteConfirmChatId(chat.id);
                                  setActiveMenuChatId(null);
                                }}
                                className="flex items-center gap-2 px-3 py-1.5 hover:bg-rose-50 text-left text-rose-600 transition-colors cursor-pointer font-normal"
                              >
                                <Trash2 className="w-3.5 h-3.5 text-rose-500" />
                                <span>{t.delete || (selectedLang === 'EN' ? 'Delete' : 'Eliminar')}</span>
                              </button>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Calendar-Styled Progress Bar */}
                      <div className="w-full mt-1.5">
                        <div className="flex items-center justify-between text-[10px] text-slate-500 mb-1 font-mono">
                          <span>{selectedLang === 'EN' ? 'Practice Progress' : 'Progreso de Práctica'}</span>
                          <span className="font-bold text-slate-700">{progress}%</span>
                        </div>
                        <div className="w-full bg-slate-100 rounded-full p-0.5 border border-slate-200/80">
                          <div 
                            className="h-2 rounded-full transition-all duration-500 bg-[#F59E0B]"
                            style={{ width: `${Math.max(progress, 6)}%` }}
                          />
                        </div>
                      </div>
                    </>
                  )}
                </div>
              );
            })
          )
        )}

        {/* TAB 3: COMPLETADAS */}
        {activeTab === 'completed' && (
          filteredCompleted.length === 0 ? (
            <div className="h-64 flex flex-col items-center justify-center text-center p-6 text-slate-400">
              <div className="w-12 h-12 rounded-2xl bg-emerald-50 flex items-center justify-center mb-3 text-emerald-600">
                <Award className="w-6 h-6" />
              </div>
              <p className="text-sm font-medium text-slate-600 mb-1">
                {selectedLang === 'EN' ? 'No completed conversations yet' : 'Aún no tienes conversaciones completadas'}
              </p>
              <p className="text-xs text-slate-400 max-w-xs font-normal">
                {selectedLang === 'EN'
                  ? 'As you reach 100% completion in your conversations and assignments, they will appear here for review without losing progress.'
                  : 'Al alcanzar el 100% en tus charlas y tareas, se archivarán aquí para repasarlas sin reiniciar tu progreso.'}
              </p>
            </div>
          ) : (
            filteredCompleted.map((item) => {
              const isAssigned = 'isAssigned' in item;
              const title = item.title;
              const snippet = 'description' in item ? item.description : ('snippet' in item ? item.snippet : '');

              return (
                <div
                  key={item.id}
                  onClick={() => {
                    if (isAssigned) {
                      handleStartAssignedCharla(item as AssignedCharla);
                    } else {
                      handleSelectGroup(item as GroupedSavedChat);
                    }
                  }}
                  className="group relative rounded-xl border border-emerald-200/90 bg-emerald-50/20 hover:bg-emerald-50/40 p-3 sm:p-4 flex flex-col gap-2 transition-all cursor-pointer shadow-2xs hover:shadow-xs"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-xs sm:text-sm font-bold text-slate-900 group-hover:text-emerald-700 transition-colors">
                          {title}
                        </span>
                        <span className="px-1.5 py-0.2 rounded text-[10px] font-bold uppercase tracking-wider bg-emerald-100 text-emerald-800 border border-emerald-200 flex items-center gap-1">
                          <Check className="w-3 h-3 stroke-[3]" />
                          <span>100% {selectedLang === 'EN' ? 'Completed' : 'Completada'}</span>
                        </span>
                      </div>
                      {snippet && (
                        <p className="text-xs text-slate-600 mt-1 font-normal line-clamp-2">
                          {snippet}
                        </p>
                      )}
                    </div>

                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        if (isAssigned) {
                          handleStartAssignedCharla(item as AssignedCharla);
                        } else {
                          handleSelectGroup(item as GroupedSavedChat);
                        }
                      }}
                      className="flex items-center gap-1 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold transition-all shadow-xs cursor-pointer active:scale-95 shrink-0"
                      title={selectedLang === 'EN' ? 'Review conversation' : 'Repasar conversación'}
                    >
                      <RotateCcw className="w-3 h-3" />
                      <span>{selectedLang === 'EN' ? 'Review' : 'Repasar'}</span>
                    </button>
                  </div>

                  {/* Calendar-Styled 100% Progress Bar */}
                  <div className="w-full mt-1">
                    <div className="w-full bg-slate-100 rounded-full p-0.5 border border-slate-200/80">
                      <div 
                        className="h-2 rounded-full transition-all duration-500 bg-[#059669] flex items-center justify-end pr-1 text-[8px] font-bold text-white"
                        style={{ width: '100%' }}
                      />
                    </div>
                  </div>
                </div>
              );
            })
          )
        )}
      </div>
    </div>
  );
};

export default ConversationsPage;
