import React, { useState, useEffect, useRef } from 'react';
import { 
  ArrowLeft, 
  MessageSquare, 
  BookOpen, 
  Compass, 
  MoreHorizontal, 
  Edit3, 
  Trash2, 
  Check, 
  Home, 
  Star, 
  Bot, 
  Apple, 
  User, 
  ShoppingCart, 
  Settings, 
  ShieldCheck, 
  ChevronRight,
  LogOut,
  LogIn
} from 'lucide-react';
import { translations } from './Translations';
import { SavedChatSession, ActiveLessonItem } from './SavedChatsModal';
import { UnifiedAssignment, fetchUnifiedStudentAssignments } from '../services/teacherStudentService';

export interface NavigationDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  selectedLang: 'EN' | 'ES';
  navView: 'main' | 'conversations' | 'lessons';
  onNavigateView: (view: 'main' | 'conversations' | 'lessons') => void;
  savedChats: SavedChatSession[];
  currentBookmarkedChatId: string | null;
  onLoadChat: (chat: SavedChatSession) => void;
  onRenameChat: (chatId: string, newTitle: string) => void;
  onDeleteChat: (chatId: string) => void;
  onStartLesson: (lesson: any, assignment?: any) => void;
  rightPanelTab: string;
  onSelectTab: (tabId: string, hash?: string) => void;
  onOpenExploreCatalog: () => void;
  authUser?: any;
  userEmail?: string | null;
  visitorFullName?: string;
  userName?: string;
  cartCount?: number;
  onLoginClick?: () => void;
  onLogoutClick?: () => void;
}

export const NavigationDrawer: React.FC<NavigationDrawerProps> = ({
  isOpen,
  onClose,
  selectedLang,
  navView,
  onNavigateView,
  savedChats,
  currentBookmarkedChatId,
  onLoadChat,
  onRenameChat,
  onDeleteChat,
  onStartLesson,
  rightPanelTab,
  onSelectTab,
  onOpenExploreCatalog,
  authUser,
  userEmail,
  visitorFullName,
  userName,
  cartCount = 0,
  onLoginClick,
  onLogoutClick,
}) => {
  const [editingChatId, setEditingChatId] = useState<string | null>(null);
  const [editingTitleText, setEditingTitleText] = useState('');
  const [activeMenuChatId, setActiveMenuChatId] = useState<string | null>(null);
  const [deleteConfirmChatId, setDeleteConfirmChatId] = useState<string | null>(null);

  const drawerRef = useRef<HTMLDivElement>(null);
  const optionsMenuRef = useRef<HTMLDivElement>(null);

  const [activeLessons, setActiveLessons] = useState<ActiveLessonItem[]>([]);
  const [studentAssignments, setStudentAssignments] = useState<UnifiedAssignment[]>([]);

  const t = translations[selectedLang];

  // Outside click listener to dismiss navigation menu without darkening or blurring Voyager
  useEffect(() => {
    if (!isOpen) return;

    const handleClickOutside = (e: MouseEvent | TouchEvent) => {
      if (drawerRef.current && drawerRef.current.contains(e.target as Node)) {
        return;
      }
      const target = e.target as HTMLElement;
      if (target.closest('.hamburger-hover-growth') || target.closest('[data-nav-toggle="true"]')) {
        return;
      }
      onClose();
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('touchstart', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('touchstart', handleClickOutside);
    };
  }, [isOpen, onClose]);

  // Outside click listener for the discreet 3-dot options menu
  useEffect(() => {
    if (!activeMenuChatId) return;

    const handleClickOutsideMenu = (e: MouseEvent | TouchEvent) => {
      if (optionsMenuRef.current && !optionsMenuRef.current.contains(e.target as Node)) {
        setActiveMenuChatId(null);
      }
    };

    document.addEventListener('mousedown', handleClickOutsideMenu);
    document.addEventListener('touchstart', handleClickOutsideMenu);
    return () => {
      document.removeEventListener('mousedown', handleClickOutsideMenu);
      document.removeEventListener('touchstart', handleClickOutsideMenu);
    };
  }, [activeMenuChatId]);

  // Browser Back navigation support
  useEffect(() => {
    if (!isOpen) return;

    const handlePopState = (e: PopStateEvent) => {
      if (navView !== 'main') {
        onNavigateView('main');
      } else {
        onClose();
      }
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, [isOpen, navView, onNavigateView, onClose]);

  // Load student lessons & assignments when drawer is open
  useEffect(() => {
    if (!isOpen) return;

    try {
      const saved = localStorage.getItem('voyager_active_lessons');
      if (saved) {
        setActiveLessons(JSON.parse(saved));
      }
    } catch (e) {}

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
        console.warn('Failed to load assignments in nav drawer:', err);
      }
    };
    loadAssignments();

    return () => {
      isSubscribed = false;
    };
  }, [isOpen]);

  // Only conversations deliberately saved by the student appear under "Mis conversaciones"
  const deliberatelySavedChats = savedChats.filter(chat => {
    return (
      chat &&
      typeof chat.id === 'string' &&
      typeof chat.title === 'string' &&
      chat.title.trim() !== '' &&
      Array.isArray(chat.messages) &&
      chat.messages.length > 0 &&
      chat.sessionType !== 'guided_lesson' &&
      chat.isDeliberatelySaved !== false
    );
  });

  // Student active lessons (Pilot STAR lesson + active + assignments)
  const defaultStarLesson = {
    id: 'cat-job-interview',
    lessonId: 'cat-job-interview',
    title: selectedLang === 'EN' ? 'Job Interview Simulation — STAR Method' : 'Simulación de entrevista de trabajo — Método STAR',
    category: selectedLang === 'EN' ? 'Career & Business' : 'Negocios y Carrera',
    level: 'B2',
    status: 'in_progress' as const,
  };

  const combinedLessons: { id: string; title: string; status?: string; level?: string; raw: any }[] = [
    {
      id: defaultStarLesson.id,
      title: defaultStarLesson.title,
      status: selectedLang === 'EN' ? t.inProgress || 'In progress' : t.inProgress || 'En curso',
      level: defaultStarLesson.level,
      raw: defaultStarLesson,
    }
  ];

  activeLessons.forEach(al => {
    if (al.lessonId !== 'cat-job-interview' && !combinedLessons.some(l => l.id === al.lessonId)) {
      combinedLessons.push({
        id: al.lessonId,
        title: al.title,
        status: al.status === 'completed' 
          ? (t.completed || (selectedLang === 'EN' ? 'Completed' : 'Completada'))
          : (t.inProgress || (selectedLang === 'EN' ? 'In progress' : 'En curso')),
        level: al.level,
        raw: al,
      });
    }
  });

  studentAssignments.forEach(sa => {
    if (sa.lessonId !== 'cat-job-interview' && !combinedLessons.some(l => l.id === sa.lessonId)) {
      combinedLessons.push({
        id: sa.lessonId,
        title: sa.title || 'Assigned Lesson',
        status: sa.status === 'COMPLETED' 
          ? (t.completed || (selectedLang === 'EN' ? 'Completed' : 'Completada'))
          : (t.inProgress || (selectedLang === 'EN' ? 'In progress' : 'En curso')),
        level: sa.level,
        raw: sa,
      });
    }
  });

  const handleBackToMain = () => {
    setEditingChatId(null);
    setActiveMenuChatId(null);
    setDeleteConfirmChatId(null);
    onNavigateView('main');
  };

  const handleSaveRename = (chatId: string) => {
    if (editingTitleText.trim()) {
      onRenameChat(chatId, editingTitleText.trim());
    }
    setEditingChatId(null);
  };

  const formatCompactDate = (dateStr: string) => {
    try {
      const d = new Date(dateStr);
      if (isNaN(d.getTime())) return '';
      return d.toLocaleDateString(selectedLang === 'EN' ? 'en-US' : 'es-ES', {
        month: 'short',
        day: 'numeric'
      });
    } catch (e) {
      return '';
    }
  };

  const cleanDeduplicatedName = (name: string) => {
    return name.replace(/\s+/g, ' ').trim();
  };

  if (!isOpen) return null;

  return (
    <div 
      ref={drawerRef}
      className="absolute top-full left-2 sm:left-4 mt-2 w-72 sm:w-80 max-w-[calc(100vw-24px)] z-50 bg-white border border-slate-200/90 rounded-2xl shadow-xl p-2.5 flex flex-col text-slate-800 font-['Raleway'] select-none animate-fade-in max-h-[85vh] overflow-hidden"
    >
        
        {/* ========================================================= */}
        {/* VIEW 1: MAIN MENU                                         */}
        {/* ========================================================= */}
        {navView === 'main' && (
          <div className="flex flex-col h-full overflow-hidden">
            {/* Header */}
            <div className="pl-2 pr-1 pt-0.5 pb-2 mb-1 border-b border-slate-100 shrink-0">
              <span className="text-[11px] font-bold tracking-wider uppercase text-slate-500">
                {selectedLang === 'EN' ? 'Menu' : 'Menú'}
              </span>
            </div>

            {/* Menu List */}
            <div className="overflow-y-auto space-y-0.5 pr-0.5 no-scrollbar">
              {/* Home */}
              <button
                type="button"
                onClick={() => onSelectTab('home', '')}
                className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-xl text-left transition-colors cursor-pointer ${
                  rightPanelTab === 'home' ? 'bg-slate-100 text-slate-900 font-bold' : 'text-slate-700 hover:text-slate-900 hover:bg-slate-50 font-normal'
                }`}
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <Home className="w-4 h-4 text-slate-500 shrink-0" />
                  <span className="text-xs">{selectedLang === 'EN' ? 'Home' : 'Inicio'}</span>
                </div>
              </button>

              {/* Citizenship */}
              <button
                type="button"
                onClick={() => onSelectTab('citizenship', '#/citizenship')}
                className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-xl text-left transition-colors cursor-pointer ${
                  rightPanelTab === 'citizenship' || rightPanelTab === 'civics' ? 'bg-slate-100 text-slate-900 font-bold' : 'text-slate-700 hover:text-slate-900 hover:bg-slate-50 font-normal'
                }`}
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <Star className="w-4 h-4 text-slate-500 shrink-0" />
                  <span className="text-xs">{selectedLang === 'EN' ? 'Citizenship' : 'Ciudadanía'}</span>
                </div>
              </button>

              {/* Chat */}
              <button
                type="button"
                onClick={() => onSelectTab('chat', '#/chat')}
                className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-xl text-left transition-colors cursor-pointer ${
                  rightPanelTab === 'chat' ? 'bg-slate-100 text-slate-900 font-bold' : 'text-slate-700 hover:text-slate-900 hover:bg-slate-50 font-normal'
                }`}
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <Bot className="w-4 h-4 text-slate-500 shrink-0" />
                  <span className="text-xs">{selectedLang === 'EN' ? 'Chats' : 'Chats'}</span>
                </div>
              </button>

              {/* My Lessons Workspace */}
              <button
                type="button"
                onClick={() => {
                  onSelectTab('lessons', '#/lessons');
                  onClose();
                }}
                className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-xl text-left transition-colors cursor-pointer ${
                  rightPanelTab === 'lessons' ? 'bg-slate-100 text-slate-900 font-bold' : 'text-slate-700 hover:text-slate-900 hover:bg-slate-50 font-normal'
                }`}
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <BookOpen className="w-4 h-4 text-slate-500 shrink-0" />
                  <span className="text-xs">{t.myLessons || (selectedLang === 'EN' ? 'My Lessons' : 'Mis lecciones')}</span>
                </div>
                <div className="flex items-center gap-1">
                  {combinedLessons.length > 0 && (
                    <span className="text-[11px] font-mono text-slate-400">
                      {combinedLessons.length}
                    </span>
                  )}
                  <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
                </div>
              </button>

              {/* Scenarios & Capstones (Phase 5) */}
              <button
                type="button"
                onClick={() => {
                  onSelectTab('simulations', '#/simulations');
                  onClose();
                }}
                className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-xl text-left transition-colors cursor-pointer ${
                  rightPanelTab === 'simulations' ? 'bg-slate-100 text-slate-900 font-bold' : 'text-slate-700 hover:text-slate-900 hover:bg-slate-50 font-normal'
                }`}
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <Compass className="w-4 h-4 text-slate-500 shrink-0" />
                  <span className="text-xs">{selectedLang === 'EN' ? 'Scenarios & Capstones' : 'Escenarios y Capstones'}</span>
                </div>
                <span className="text-[9px] font-mono px-1.5 py-0.2 rounded bg-amber-100 text-amber-800 font-bold">
                  CEFR
                </span>
              </button>

              {/* Link to existing Student Lesson Catalog */}
              <button
                type="button"
                onClick={onOpenExploreCatalog}
                className="w-full flex items-center justify-between px-2.5 py-1.5 rounded-xl text-left text-slate-700 hover:text-slate-900 hover:bg-slate-50 transition-colors cursor-pointer font-normal"
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <Compass className="w-4 h-4 text-slate-500 shrink-0" />
                  <span className="text-xs">{t.exploreLessons || (selectedLang === 'EN' ? 'Explore Lessons' : 'Explorar lecciones')}</span>
                </div>
              </button>

              {/* Teachers */}
              <button
                type="button"
                onClick={() => onSelectTab('teachers', '#/teachers')}
                className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-xl text-left transition-colors cursor-pointer ${
                  rightPanelTab === 'teachers' ? 'bg-slate-100 text-slate-900 font-bold' : 'text-slate-700 hover:text-slate-900 hover:bg-slate-50 font-normal'
                }`}
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <Apple className="w-4 h-4 text-slate-500 shrink-0" />
                  <span className="text-xs">{selectedLang === 'EN' ? 'Teachers' : 'Docentes'}</span>
                </div>
              </button>

              {/* My Journey / Profile */}
              <button
                type="button"
                onClick={() => onSelectTab('roadmap', '#/roadmap')}
                className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-xl text-left transition-colors cursor-pointer ${
                  rightPanelTab === 'roadmap' ? 'bg-slate-100 text-slate-900 font-bold' : 'text-slate-700 hover:text-slate-900 hover:bg-slate-50 font-normal'
                }`}
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <User className="w-4 h-4 text-slate-500 shrink-0" />
                  <span className="text-xs truncate">
                    {cleanDeduplicatedName((visitorFullName || userName || (selectedLang === 'EN' ? 'My Journey' : 'Mi Ruta')).replace(/\s*\([a-z0-9\s_-]+\)/gi, ''))}
                  </span>
                </div>
              </button>

              {/* Shop */}
              <button
                type="button"
                onClick={() => onSelectTab('shopping', '#/shop')}
                className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-xl text-left transition-colors cursor-pointer ${
                  rightPanelTab === 'shopping' ? 'bg-slate-100 text-slate-900 font-bold' : 'text-slate-700 hover:text-slate-900 hover:bg-slate-50 font-normal'
                }`}
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <ShoppingCart className="w-4 h-4 text-slate-500 shrink-0" />
                  <span className="text-xs">{selectedLang === 'EN' ? 'Shop' : 'Tienda'}</span>
                </div>
                {cartCount > 0 && (
                  <span className="bg-slate-900 text-white text-[10px] font-bold px-1.5 py-0.2 rounded-full font-mono">
                    {cartCount}
                  </span>
                )}
              </button>

              {/* Settings */}
              <button
                type="button"
                onClick={() => onSelectTab('settings', '#/settings')}
                className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-xl text-left transition-colors cursor-pointer ${
                  rightPanelTab === 'settings' ? 'bg-slate-100 text-slate-900 font-bold' : 'text-slate-700 hover:text-slate-900 hover:bg-slate-50 font-normal'
                }`}
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <Settings className="w-4 h-4 text-slate-500 shrink-0" />
                  <span className="text-xs">{selectedLang === 'EN' ? 'Settings' : 'Configuración'}</span>
                </div>
              </button>

              {/* Administration (if admin) */}
              {(authUser || (userEmail && userEmail.includes('@') && !userEmail.includes('learner@usavoyager.com')) || (typeof window !== 'undefined' && localStorage.getItem('voyager_admin_logged_in') === 'true')) && (
                <button
                  type="button"
                  onClick={() => onSelectTab('admin', '#/admin')}
                  className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-xl text-left transition-colors cursor-pointer ${
                    rightPanelTab === 'admin' ? 'bg-slate-100 text-slate-900 font-bold' : 'text-slate-700 hover:text-slate-900 hover:bg-slate-50 font-normal'
                  }`}
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <ShieldCheck className="w-4 h-4 text-slate-500 shrink-0" />
                    <span className="text-xs">{selectedLang === 'EN' ? 'Administration' : 'Administración'}</span>
                  </div>
                </button>
              )}

              {/* Auth section */}
              <div className="pt-1.5 mt-1 border-t border-slate-100">
                {!authUser && !userEmail ? (
                  <button
                    type="button"
                    onClick={onLoginClick}
                    className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-xl text-xs font-medium text-slate-700 hover:text-slate-900 hover:bg-slate-50 transition-colors cursor-pointer"
                  >
                    <LogIn className="w-3.5 h-3.5 text-slate-500" />
                    <span>{selectedLang === 'EN' ? 'Sign In / Register' : 'Iniciar Sesión / Registro'}</span>
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={onLogoutClick}
                    className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-xl text-xs font-medium text-slate-600 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                  >
                    <LogOut className="w-3.5 h-3.5 text-slate-400" />
                    <span>{selectedLang === 'EN' ? 'Sign Out' : 'Cerrar Sesión'}</span>
                  </button>
                )}
              </div>
            </div>
          </div>
        )}

        {/* ========================================================= */}
        {/* VIEW 2: MIS CONVERSACIONES                                */}
        {/* ========================================================= */}
        {navView === 'conversations' && (
          <div className="flex flex-col h-full overflow-hidden">
            {/* Top Navigation Row: Back Button consistently positioned */}
            <div className="flex items-center pb-2 mb-1.5 border-b border-slate-100 shrink-0">
              <button
                type="button"
                onClick={handleBackToMain}
                className="flex items-center gap-1.5 py-1 px-1.5 -ml-1 text-xs font-medium text-slate-700 hover:text-slate-950 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
                title={t.back || (selectedLang === 'EN' ? 'Back' : 'Volver')}
                aria-label={t.back || (selectedLang === 'EN' ? 'Back' : 'Volver')}
              >
                <ArrowLeft className="w-4 h-4 text-slate-600" />
                <span>{t.back || (selectedLang === 'EN' ? 'Back' : 'Volver')}</span>
              </button>
            </div>

            {/* Section Heading: Icon ONLY at section-heading level */}
            <div className="px-2 py-1 flex items-center justify-between text-xs font-bold text-slate-800 shrink-0">
              <div className="flex items-center gap-2">
                <MessageSquare className="w-4 h-4 text-slate-600 shrink-0" />
                <span>{t.myConversations || (selectedLang === 'EN' ? 'My Conversations' : 'Mis conversaciones')}</span>
              </div>
              {deliberatelySavedChats.length > 0 && (
                <span className="text-[11px] font-mono text-slate-400 font-normal">
                  {deliberatelySavedChats.length}
                </span>
              )}
            </div>

            {/* List: Compact text-only entries, one line per item, NO icons on items */}
            <div className="overflow-y-auto space-y-0.5 mt-1 pr-0.5 no-scrollbar flex-1">
              {deliberatelySavedChats.length === 0 ? (
                <div className="px-2 py-4 text-xs text-slate-400 italic text-center">
                  {t.noConversations || (selectedLang === 'EN' ? 'No saved conversations' : 'Sin conversaciones guardadas')}
                </div>
              ) : (
                deliberatelySavedChats.map((chat) => {
                  const isActive = chat.id === currentBookmarkedChatId;
                  const isEditing = editingChatId === chat.id;
                  const isDeleting = deleteConfirmChatId === chat.id;

                  return (
                    <div
                      key={chat.id}
                      onClick={() => {
                        if (!isEditing && !isDeleting) {
                          onLoadChat(chat);
                          onClose();
                        }
                      }}
                      className={`group relative flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs cursor-pointer transition-colors ${
                        isActive
                          ? 'bg-slate-100 text-slate-900 font-medium'
                          : 'text-slate-700 hover:text-slate-900 hover:bg-slate-50'
                      }`}
                    >
                      {/* Inline Delete Confirmation */}
                      {isDeleting ? (
                        <div 
                          className="flex items-center gap-1.5 bg-rose-50 border border-rose-200/60 px-2 py-1 rounded text-xs text-slate-800 w-full justify-between"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <span className="text-[11px] font-medium text-rose-700">
                            {t.deleteConfirm || (selectedLang === 'EN' ? 'Delete conversation?' : '¿Eliminar conversación?')}
                          </span>
                          <div className="flex items-center gap-1 shrink-0">
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                onDeleteChat(chat.id);
                                setDeleteConfirmChatId(null);
                                setActiveMenuChatId(null);
                              }}
                              className="px-2 py-0.5 rounded bg-rose-600 text-white font-medium text-[11px] hover:bg-rose-700 transition-colors cursor-pointer"
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
                              className="px-1.5 py-0.5 rounded text-slate-500 hover:text-slate-800 text-[11px] transition-colors cursor-pointer"
                            >
                              {t.cancel || (selectedLang === 'EN' ? 'Cancel' : 'Cancelar')}
                            </button>
                          </div>
                        </div>
                      ) : isEditing ? (
                        /* Inline Rename Form */
                        <form
                          onSubmit={(e) => {
                            e.preventDefault();
                            handleSaveRename(chat.id);
                          }}
                          onClick={(e) => e.stopPropagation()}
                          className="flex items-center gap-1 w-full"
                        >
                          <input
                            type="text"
                            autoFocus
                            value={editingTitleText}
                            onChange={(e) => setEditingTitleText(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === 'Escape') setEditingChatId(null);
                            }}
                            className="w-full bg-white border border-slate-300 rounded px-1.5 py-0.5 text-xs text-slate-900 focus:outline-none focus:border-slate-500"
                          />
                          <button
                            type="submit"
                            className="p-1 text-slate-600 hover:text-slate-900 cursor-pointer"
                            title={selectedLang === 'EN' ? 'Save' : 'Guardar'}
                          >
                            <Check className="w-3 h-3" />
                          </button>
                          <button
                            type="button"
                            onClick={() => setEditingChatId(null)}
                            className="px-1.5 py-0.5 text-[11px] text-slate-400 hover:text-slate-700 cursor-pointer"
                            title={selectedLang === 'EN' ? 'Cancel' : 'Cancelar'}
                          >
                            {selectedLang === 'EN' ? 'Cancel' : 'Cancelar'}
                          </button>
                        </form>
                      ) : (
                        /* Standard Text-Only Row */
                        <>
                          <span className="truncate text-xs text-slate-800 group-hover:text-slate-950 flex-1 pr-1 font-normal">
                            {chat.title}
                          </span>

                          <div className="flex items-center shrink-0 ml-1">
                            {chat.date && (
                              <span className="text-[11px] text-slate-400 group-hover:hidden shrink-0 font-mono">
                                {formatCompactDate(chat.date)}
                              </span>
                            )}

                            {/* Discreet three-dot menu */}
                            <div className="relative">
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setActiveMenuChatId(activeMenuChatId === chat.id ? null : chat.id);
                                  setDeleteConfirmChatId(null);
                                }}
                                className="hidden group-hover:flex items-center justify-center p-1 rounded hover:bg-slate-200/70 text-slate-400 hover:text-slate-700 transition-colors cursor-pointer"
                                title={selectedLang === 'EN' ? 'Options' : 'Opciones'}
                                aria-label={selectedLang === 'EN' ? 'Options' : 'Opciones'}
                              >
                                <MoreHorizontal className="w-3.5 h-3.5" />
                              </button>

                              {/* Action Menu */}
                              {activeMenuChatId === chat.id && (
                                <div 
                                  ref={optionsMenuRef}
                                  className="absolute right-0 top-full mt-1 z-50 w-28 bg-white border border-slate-200 rounded-lg shadow-xl py-1 text-slate-800 text-xs"
                                  onClick={(e) => e.stopPropagation()}
                                >
                                  <button
                                    type="button"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setActiveMenuChatId(null);
                                      setEditingChatId(chat.id);
                                      setEditingTitleText(chat.title);
                                    }}
                                    className="w-full flex items-center gap-2 px-2.5 py-1.5 text-slate-700 hover:text-slate-900 hover:bg-slate-100 text-left transition-colors cursor-pointer"
                                  >
                                    <Edit3 className="w-3 h-3 text-slate-400" />
                                    <span>{t.rename || (selectedLang === 'EN' ? 'Rename' : 'Renombrar')}</span>
                                  </button>
                                  <button
                                    type="button"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setActiveMenuChatId(null);
                                      setDeleteConfirmChatId(chat.id);
                                    }}
                                    className="w-full flex items-center gap-2 px-2.5 py-1.5 text-rose-600 hover:text-rose-700 hover:bg-rose-50 text-left transition-colors cursor-pointer"
                                  >
                                    <Trash2 className="w-3 h-3 text-rose-600" />
                                    <span>{t.delete || (selectedLang === 'EN' ? 'Delete' : 'Eliminar')}</span>
                                  </button>
                                </div>
                              )}
                            </div>
                          </div>
                        </>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          </div>
        )}

        {/* ========================================================= */}
        {/* VIEW 3: MIS LECCIONES                                     */}
        {/* ========================================================= */}
        {navView === 'lessons' && (
          <div className="flex flex-col h-full overflow-hidden">
            {/* Top Navigation Row: Back Button consistently positioned */}
            <div className="flex items-center pb-2 mb-1.5 border-b border-slate-100 shrink-0">
              <button
                type="button"
                onClick={handleBackToMain}
                className="flex items-center gap-1.5 py-1 px-1.5 -ml-1 text-xs font-medium text-slate-700 hover:text-slate-950 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
                title={t.back || (selectedLang === 'EN' ? 'Back' : 'Volver')}
                aria-label={t.back || (selectedLang === 'EN' ? 'Back' : 'Volver')}
              >
                <ArrowLeft className="w-4 h-4 text-slate-600" />
                <span>{t.back || (selectedLang === 'EN' ? 'Back' : 'Volver')}</span>
              </button>
            </div>

            {/* Section Heading: Icon ONLY at section-heading level */}
            <div className="px-2 py-1 flex items-center justify-between text-xs font-bold text-slate-800 shrink-0">
              <div className="flex items-center gap-2">
                <BookOpen className="w-4 h-4 text-slate-600 shrink-0" />
                <span>{t.myLessons || (selectedLang === 'EN' ? 'My Lessons' : 'Mis lecciones')}</span>
              </div>
              {combinedLessons.length > 0 && (
                <span className="text-[11px] font-mono text-slate-400 font-normal">
                  {combinedLessons.length}
                </span>
              )}
            </div>

            {/* List: Compact text-only entries, one line per item, NO icons on items */}
            <div className="overflow-y-auto space-y-0.5 mt-1 pr-0.5 no-scrollbar flex-1">
              {combinedLessons.length === 0 ? (
                <div className="px-2 py-4 text-xs text-slate-400 italic text-center">
                  {t.noLessons || (selectedLang === 'EN' ? 'No active lessons' : 'Sin lecciones activas')}
                </div>
              ) : (
                combinedLessons.map((lesson) => (
                  <div
                    key={lesson.id}
                    onClick={() => {
                      onStartLesson(lesson.raw);
                      onClose();
                    }}
                    className="group flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs cursor-pointer text-slate-700 hover:text-slate-900 hover:bg-slate-50 transition-colors"
                  >
                    <span className="truncate text-xs text-slate-800 group-hover:text-slate-950 flex-1 pr-2 font-normal">
                      {lesson.title}
                    </span>
                    {lesson.status && (
                      <span className="text-[11px] text-slate-400 shrink-0 font-mono">
                        {lesson.status}
                      </span>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        )}

      </div>
  );
};

export default NavigationDrawer;
