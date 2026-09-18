import React, { useState, useEffect } from 'react';
import { User, LogOut, Compass, Calendar, Award, CheckCircle2, Circle, Target, ChevronRight, Mail, Key, Users, Sparkles, Activity, BookOpen, Volume2, Apple, Lock, Bot, MessageSquare, Pause, TrendingUp, Play, Flame, Camera, Upload, X, Globe, Heart, Clock, Settings, Pencil, Plus, Tag, Check, History, FileText, Bookmark, Info } from 'lucide-react';
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip } from 'recharts';
import { googleSignIn, logout, auth } from '../services/firebaseAuth';
import { saveUserProfile, syncOrMigrateUserOnAuth, getLocalProfileCache, setLocalProfileCache } from '../services/userProfileService';
import voyagerRobot from '../assets/images/voyager_robot_1783082204380.png';
import { IMMERSION_CURRICULUM, CIUDADANIA_CURRICULUM } from '../constants';
import { TeacherInsightsPanel } from './TeacherInsightsPanel';
import { parseAndRenderEmojis } from './VoyagerEmoji';
import { Achievements } from './Achievements';
import { ChatInputBox } from './ChatInputBox';
import { CivicsProgressTracker } from '../domain/CivicsProgressTracker';
import { ActivityCalendar } from './ActivityCalendar';
import { RecommendedProLessonsCarousel } from './RecommendedProLessonsCarousel';

interface RoadmapPanelProps {
  selectedLang: 'EN' | 'ES';
  learnedWordsCount: number;
  grammarScore: number;
  pronunciationScore: number;
  chatMessages: any[];
  isPaused: boolean;
  isConnected: boolean;
  pause: () => void;
  resume: () => void;
  activeSubTab?: 'welcome' | 'level' | 'lessons' | 'achievements' | 'streak';
  onSelectSubTab?: (subTab: 'welcome' | 'level' | 'lessons' | 'achievements' | 'streak') => void;
  scores?: {
    grammar: number;
    pronunciation: number;
    confidence: number;
    naturalness: number;
  };
  learnedWords?: string[];
  accentPatterns?: string[];
  onAskVoyager: (text: string) => void;
  onNavigateTab?: (tab: 'home' | 'chat' | 'progress' | 'teachers' | 'settings') => void;
  onLogout?: () => void;
  onRedoOnboarding?: () => void;
  onLoadChat?: (chat: any) => void;
  onOpenSavedChats?: () => void;
  isEditingProfile?: boolean;
  onToggleEditProfile?: () => void;
}

interface UserProfile {
  name: string;
  firstName?: string;
  lastName?: string;
  email: string;
  provider: 'Google' | 'Apple' | 'Email' | 'Guest' | 'Admin';
  goal: string;
  levelEstimate: string;
  completedDays: number[];
  plan?: 'FREE' | 'PRO';
  country?: string;
  category?: string;
  education?: string;
  interests?: string;
  timePerWeek?: string;
  age?: number;
  avatarUrl?: string;
  photoURL?: string;
  avatarType?: 'user' | 'man' | 'woman' | 'student' | 'astronaut' | 'female_robot' | 'male_robot' | 'custom';
  bookedLesson?: {
    teacherName: string;
    dateTime: string;
  };
}

export const sanitizeUserProfileNames = (profile: Partial<UserProfile>): { firstName: string; lastName: string; fullName: string } => {
  let rawName = (profile.name || '').replace(/\(Admin\)/gi, '').replace(/\(Student View\)/gi, '').trim();
  let rawFirst = (profile.firstName || '').replace(/\(Admin\)/gi, '').trim();
  let rawLast = (profile.lastName || '').replace(/\(Admin\)/gi, '').trim();

  const isGuestPlaceholder = (str: string) => {
    if (!str) return true;
    const s = str.trim().toLowerCase();
    return s === 'invitado' || s === 'guest' || s === 'estudiante' || s === 'learner' || s === 'guest learner' || s === 'estudiante invitado' || s === 'invitado voyager' || s === 'guest voyager';
  };

  const isRealName = (str: string) => {
    return Boolean(str && str.trim() && !isGuestPlaceholder(str));
  };

  // If rawFirst is a placeholder or empty, but rawName is a real name (e.g. "Federico Sandoval")
  if (isGuestPlaceholder(rawFirst) && isRealName(rawName)) {
    const parts = rawName.split(/\s+/).filter(Boolean);
    rawFirst = parts[0] || '';
    if (parts.length > 1) {
      rawLast = parts.slice(1).join(' ');
    } else {
      rawLast = '';
    }
  } else if (rawFirst && isRealName(rawFirst) && !rawLast && isRealName(rawName) && rawName.includes(' ')) {
    // If rawFirst is "Federico", but rawName is "Federico Sandoval" and rawLast is empty
    const parts = rawName.split(/\s+/).filter(Boolean);
    if (parts.length > 1 && parts[0].toLowerCase() === rawFirst.toLowerCase()) {
      rawLast = parts.slice(1).join(' ');
    }
  }

  // Deduplicate repeated adjacent words in rawFirst if present
  if (rawFirst.includes(' ')) {
    const firstWords = rawFirst.split(/\s+/);
    const uniqueFirstWords = firstWords.filter((w, i) => i === 0 || w.toLowerCase() !== firstWords[i - 1].toLowerCase());
    rawFirst = uniqueFirstWords[0] || '';
    if (!rawLast && uniqueFirstWords.length > 1) {
      rawLast = uniqueFirstWords.slice(1).join(' ');
    }
  }

  // Deduplicate repeated adjacent words in rawLast if present
  if (rawLast.includes(' ')) {
    const lastWords = rawLast.split(/\s+/);
    const uniqueLastWords = lastWords.filter((w, i) => i === 0 || w.toLowerCase() !== lastWords[i - 1].toLowerCase());
    rawLast = uniqueLastWords.join(' ');
  }

  // If rawFirst and rawLast overlap (e.g. rawFirst = "Federico Sandoval", rawLast = "Sandoval")
  if (rawFirst && rawLast && rawFirst.toLowerCase().endsWith(rawLast.toLowerCase())) {
    rawFirst = rawFirst.slice(0, rawFirst.toLowerCase().lastIndexOf(rawLast.toLowerCase())).trim();
  }

  // If rawFirst is missing, extract from rawName
  if (!rawFirst && rawName) {
    const nameParts = rawName.split(/\s+/).filter((w, i, arr) => i === 0 || w.toLowerCase() !== arr[i - 1].toLowerCase());
    rawFirst = nameParts[0] || '';
    if (!rawLast && nameParts.length > 1) {
      rawLast = nameParts.slice(1).join(' ');
    }
  }

  if (!rawFirst) rawFirst = 'Estudiante';
  if (!rawLast) rawLast = '';

  // Construct full clean name without repeated words
  const fullParts = [rawFirst, ...rawLast.split(/\s+/)].filter(Boolean);
  const deduplicatedParts: string[] = [];
  fullParts.forEach(part => {
    if (deduplicatedParts.length === 0 || deduplicatedParts[deduplicatedParts.length - 1].toLowerCase() !== part.toLowerCase()) {
      deduplicatedParts.push(part);
    }
  });

  return {
    firstName: rawFirst,
    lastName: rawLast,
    fullName: deduplicatedParts.join(' ')
  };
};

export const RoadmapPanel: React.FC<RoadmapPanelProps> = ({
  selectedLang,
  learnedWordsCount,
  grammarScore,
  pronunciationScore,
  chatMessages,
  isPaused,
  isConnected,
  pause,
  resume,
  scores,
  learnedWords,
  accentPatterns,
  onAskVoyager,
  onNavigateTab,
  onLogout,
  onRedoOnboarding,
  onLoadChat,
  onOpenSavedChats,
  activeSubTab: externalActiveSubTab,
  onSelectSubTab,
  isEditingProfile: externalIsEditingProfile,
  onToggleEditProfile
}) => {
  const formatStudyTimeCompact = (rawTime?: string): string => {
    if (!rawTime) return '5 hr/wk';
    const val = rawTime.trim().toLowerCase();
    if (val.includes('5')) return '5 hr/wk';
    if (val.includes('2')) return '2 hr/wk';
    if (val.includes('10')) return '10 hr/wk';
    if (val.includes('7') || val.includes('diaria') || val.includes('daily')) return '7 hr/wk';
    if (val.includes('1')) return '1 hr/wk';
    if (val.includes('3')) return '3 hr/wk';
    if (val.includes('4')) return '4 hr/wk';
    if (val.includes('hr') || val.includes('wk')) return rawTime;
    return '5 hr/wk';
  };

  const guestUser: UserProfile = {
    name: selectedLang === 'EN' ? 'Guest Learner' : 'Estudiante Invitado',
    firstName: selectedLang === 'EN' ? 'Guest' : 'Invitado',
    lastName: '',
    email: selectedLang === 'EN' ? 'Not signed in' : 'Sin iniciar sesión',
    provider: 'Guest',
    category: selectedLang === 'EN' ? 'Student' : 'Estudiante',
    goal: selectedLang === 'EN' ? 'Travel & Conversation' : 'Viaje y Conversación',
    levelEstimate: 'Intermediate',
    country: selectedLang === 'EN' ? 'Not specified' : 'No especificado',
    age: undefined,
    education: selectedLang === 'EN' ? 'General' : 'General',
    interests: selectedLang === 'EN' ? 'English Learning' : 'Aprendizaje de Inglés',
    timePerWeek: '5 hr/wk',
    avatarType: 'user',
    completedDays: [1],
    plan: 'FREE'
  };

  const adminUser: UserProfile = {
    name: 'Federico Sandoval',
    firstName: 'Federico',
    lastName: 'Sandoval',
    email: 'theorangesnowman@gmail.com',
    provider: 'Admin',
    category: selectedLang === 'EN' ? 'Administrator' : 'Administrador',
    goal: selectedLang === 'EN' ? 'Academic success' : 'Éxito académico',
    levelEstimate: 'Intermediate',
    country: 'Guatemala',
    age: 63,
    education: selectedLang === 'EN' ? 'University' : 'Universidad',
    interests: selectedLang === 'EN' ? 'Travel, technology, music' : 'Viajes, tecnología, música',
    timePerWeek: '5 hr/wk',
    avatarType: 'user',
    completedDays: [1],
    plan: 'FREE'
  };

  const defaultUser = guestUser;

  const getTranslatedLevel = (lvl: string) => {
    if (selectedLang === 'EN') return lvl;
    if (lvl === 'Beginner') return 'Principiante';
    if (lvl === 'Intermediate') return 'Intermedio';
    if (lvl === 'Advanced') return 'Avanzado';
    if (lvl === 'Not Sure') return 'No estoy seguro';
    return lvl;
  };

  const getCountryWithFlag = (country: string) => {
    if (!country) return '';
    const clean = country.trim().toLowerCase();
    if (clean.includes('costa rica')) return `${country} 🇨🇷`;
    if (clean.includes('mexico') || clean.includes('méxico')) return `${country} 🇲🇽`;
    if (clean.includes('colombia')) return `${country} 🇨🇴`;
    if (clean.includes('spain') || clean.includes('españa')) return `${country} 🇪🇸`;
    if (clean.includes('argentina')) return `${country} 🇦🇷`;
    if (clean.includes('chile')) return `${country} 🇨🇱`;
    if (clean.includes('peru') || clean.includes('perú')) return `${country} 🇵🇪`;
    if (clean.includes('venezuela')) return `${country} 🇻🇪`;
    if (clean.includes('ecuador')) return `${country} 🇪🇨`;
    if (clean.includes('guatemala')) return `${country} 🇬🇹`;
    if (clean.includes('cuba')) return `${country} 🇨🇺`;
    if (clean.includes('bolivia')) return `${country} 🇧🇴`;
    if (clean.includes('dominicana')) return `${country} 🇩🇴`;
    if (clean.includes('honduras')) return `${country} 🇭🇳`;
    if (clean.includes('paraguay')) return `${country} 🇵🇾`;
    if (clean.includes('uruguay')) return `${country} 🇺🇾`;
    if (clean.includes('nicaragua')) return `${country} 🇳🇮`;
    if (clean.includes('panama') || clean.includes('panamá')) return `${country} 🇵🇦`;
    if (clean.includes('salvador')) return `${country} 🇸🇻`;
    if (clean.includes('puerto rico')) return `${country} 🇵🇷`;
    if (clean.includes('united states') || clean.includes('estados unidos') || clean.includes('usa')) return `${country} 🇺🇸`;
    return country;
  };

  const getProfileBadges = (u: UserProfile) => {
    const isEn = selectedLang === 'EN';
    const goalText = u.goal || '';
    
    let trackLabel = isEn ? 'STUDENT' : 'ESTUDIANTE';
    let subGoalLabel = goalText;
    
    if (goalText.startsWith('Professional:')) {
      trackLabel = isEn ? 'PROFESSIONAL' : 'PROFESIONAL';
      subGoalLabel = goalText.replace('Professional:', '').trim();
    } else if (goalText.startsWith('Academic:')) {
      trackLabel = isEn ? 'STUDENT' : 'ESTUDIANTE';
      subGoalLabel = goalText.replace('Academic:', '').trim();
    } else if (goalText.startsWith('Travel:')) {
      trackLabel = isEn ? 'TRAVELER' : 'VIAJANTE';
      subGoalLabel = goalText.replace('Travel:', '').trim();
    } else if (goalText.startsWith('Teachers:') || goalText.startsWith('Docentes') || goalText.startsWith('Docente')) {
      trackLabel = isEn ? 'TEACHER' : 'DOCENTE';
      subGoalLabel = goalText.replace('Teachers:', '').trim();
    }
    
    trackLabel = trackLabel.toUpperCase();
    subGoalLabel = subGoalLabel.toUpperCase();
    
    let levelLabel = u.levelEstimate || 'Intermediate';
    if (levelLabel === 'Beginner') {
      levelLabel = isEn ? 'BEGINNER (A1-A2)' : 'PRINCIPIANTE (A1-A2)';
    } else if (levelLabel === 'Intermediate') {
      levelLabel = isEn ? 'INTERMEDIATE (B1-B2)' : 'INTERMEDIO (B1-B2)';
    } else if (levelLabel === 'Advanced') {
      levelLabel = isEn ? 'ADVANCED (C1-C2)' : 'AVANZADO (C1-C2)';
    } else if (levelLabel === 'Not Sure') {
      levelLabel = isEn ? "I'M NOT SURE" : 'NO ESTOY SEGURO';
    } else {
      levelLabel = levelLabel.toUpperCase();
    }
    
    return {
      trackLabel,
      subGoalLabel: `${isEn ? 'GOAL' : 'META'}: ${subGoalLabel}`,
      levelLabel: `${isEn ? 'LEVEL' : 'NIVEL'}: ${levelLabel}`
    };
  };

  const readAccountFromStorage = React.useCallback((): UserProfile => {
    const fbUser = auth.currentUser;
    const isLoggedIn = Boolean(fbUser);
    const adminSession = typeof window !== 'undefined' ? localStorage.getItem('voyager_admin_logged_in') : null;

    if (!isLoggedIn && adminSession !== 'true') {
      return guestUser;
    }

    if (adminSession === 'true' && !fbUser) {
      return adminUser;
    }

    const isBaseAdmin = fbUser?.email === 'theorangesnowman@gmail.com';
    const baseProfile = isBaseAdmin ? adminUser : guestUser;
    const adminPhoto = typeof window !== 'undefined' ? (localStorage.getItem('voyager_admin_photo_url') || fbUser?.photoURL || undefined) : undefined;
    const saved = typeof window !== 'undefined' ? localStorage.getItem('voyager_user_account') : null;
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed) {
          const resolvedPhoto = parsed.avatarUrl || parsed.photoURL || adminPhoto;
          const names = sanitizeUserProfileNames({
            ...parsed,
            name: parsed.name || fbUser?.displayName || baseProfile.name
          });
          const rawCountry = parsed.country;
          const countryVal = (!rawCountry || rawCountry === 'No especificado' || rawCountry === 'Not specified')
            ? (isBaseAdmin ? 'Guatemala' : baseProfile.country)
            : rawCountry;

          return {
            ...baseProfile,
            ...parsed,
            name: names.fullName || fbUser?.displayName || baseProfile.name,
            firstName: names.firstName || (isBaseAdmin ? 'Federico' : baseProfile.firstName),
            lastName: names.lastName || (isBaseAdmin ? 'Sandoval' : baseProfile.lastName),
            country: countryVal,
            age: parsed.age ?? (isBaseAdmin ? 63 : baseProfile.age),
            email: parsed.email || fbUser?.email || baseProfile.email,
            avatarUrl: resolvedPhoto,
            avatarType: parsed.avatarType || (resolvedPhoto ? 'custom' : 'user')
          };
        }
      } catch (e) {}
    }
    const defaultNames = sanitizeUserProfileNames({
      name: fbUser?.displayName || (fbUser?.email === 'theorangesnowman@gmail.com' ? 'Federico Sandoval' : baseProfile.name)
    });
    return {
      ...baseProfile,
      name: defaultNames.fullName || baseProfile.name,
      firstName: defaultNames.firstName || baseProfile.firstName,
      lastName: defaultNames.lastName || baseProfile.lastName,
      email: fbUser?.email || baseProfile.email,
      avatarUrl: fbUser?.photoURL || adminPhoto,
      avatarType: (fbUser?.photoURL || adminPhoto) ? 'custom' : 'user'
    };
  }, [selectedLang]);

  const [user, setUser] = useState<UserProfile>(readAccountFromStorage);

  useEffect(() => {
    const syncUser = () => {
      setUser(readAccountFromStorage());
    };
    syncUser();
    window.addEventListener('voyager_profile_updated', syncUser);
    window.addEventListener('storage', syncUser);
    return () => {
      window.removeEventListener('voyager_profile_updated', syncUser);
      window.removeEventListener('storage', syncUser);
    };
  }, [readAccountFromStorage]);

  const chatEndRef = React.useRef<HTMLDivElement>(null);
  React.useEffect(() => {
    if (chatEndRef.current) {
      if (chatEndRef.current.parentElement) {
        chatEndRef.current.parentElement.scrollTo({
          top: chatEndRef.current.parentElement.scrollHeight,
          behavior: 'smooth'
        });
      }
    }
  }, [chatMessages]);

  // Roadmap preferences
  const [selectedGoal, setSelectedGoal] = useState(user.goal || (selectedLang === 'EN' ? 'Academic success' : 'Éxito académico'));
  const [selectedLevel, setSelectedLevel] = useState(user.levelEstimate || 'Intermediate');
  const [editFirstName, setEditFirstName] = useState(user.firstName || 'Federico');
  const [editLastName, setEditLastName] = useState(user.lastName || 'Sandoval');
  const [editCategory, setEditCategory] = useState(user.category || (selectedLang === 'EN' ? 'Student' : 'Estudiante'));
  const [editCountry, setEditCountry] = useState(user.country || 'Guatemala');
  const [editAge, setEditAge] = useState<number | string>(user.age ?? 63);
  const [editEducation, setEditEducation] = useState(user.education || (selectedLang === 'EN' ? 'University' : 'Universidad'));
  const [editInterests, setEditInterests] = useState(user.interests || (selectedLang === 'EN' ? 'Travel, technology, music' : 'Viajes, tecnología, música'));
  const [editPlan, setEditPlan] = useState<string>(user.plan === 'NORMAL' || user.plan === 'FREE' ? 'NORMAL' : 'PRO');
  const [newInterestInput, setNewInterestInput] = useState('');

  const handleAddInterest = (itemToAdd?: string) => {
    const item = (itemToAdd || newInterestInput).trim();
    if (!item) return;
    const currentList = editInterests
      ? editInterests.split(',').map(s => s.trim()).filter(Boolean)
      : [];
    if (!currentList.some(i => i.toLowerCase() === item.toLowerCase())) {
      const updated = [...currentList, item].join(', ');
      setEditInterests(updated);
    }
    setNewInterestInput('');
  };

  const handleRemoveInterest = (itemToRemove: string) => {
    const currentList = editInterests
      ? editInterests.split(',').map(s => s.trim()).filter(Boolean)
      : [];
    const updated = currentList.filter(i => i.toLowerCase() !== itemToRemove.toLowerCase()).join(', ');
    setEditInterests(updated);
  };

  const suggestedInterests = selectedLang === 'EN'
    ? ['Travel', 'Technology', 'Music', 'US Civics', 'Movies', 'Sports', 'Cooking', 'History', 'Business']
    : ['Viajes', 'Tecnología', 'Música', 'Cívica EE.UU.', 'Cine & Series', 'Deportes', 'Gastronomía', 'Historia', 'Negocios'];
  const [editTimePerWeek, setEditTimePerWeek] = useState(formatStudyTimeCompact(user.timePerWeek));
  const [internalIsEditingProfile, setInternalIsEditingProfile] = useState(false);
  const isEditingProfile = externalIsEditingProfile !== undefined ? externalIsEditingProfile : internalIsEditingProfile;
  const setIsEditingProfile = (val: boolean | ((prev: boolean) => boolean)) => {
    const nextVal = typeof val === 'function' ? val(isEditingProfile) : val;
    if (onToggleEditProfile) {
      if (nextVal !== isEditingProfile) {
        onToggleEditProfile();
      }
    } else {
      setInternalIsEditingProfile(nextVal);
    }
  };
  const [saveNotification, setSaveNotification] = useState<string | null>(null);
  const [internalSubTab, setInternalSubTab] = useState<'welcome' | 'level' | 'lessons' | 'achievements' | 'streak'>('welcome');
  const activeSubTab = externalActiveSubTab || internalSubTab;

  const setActiveSubTab = (tab: 'welcome' | 'level' | 'lessons' | 'achievements' | 'streak') => {
    setInternalSubTab(tab);
    if (onSelectSubTab) {
      onSelectSubTab(tab);
    }
  };
  const [isAvatarModalOpen, setIsAvatarModalOpen] = useState(false);
  const [isGearMenuOpen, setIsGearMenuOpen] = useState(false);
  const avatarFileInputRef = React.useRef<HTMLInputElement>(null);

  // Internal Mail Modal & Dynamic Letter Grade State
  const [isMailModalOpen, setIsMailModalOpen] = useState(false);
  const [mailTab, setMailTab] = useState<'inbox' | 'compose'>('inbox');
  const [mailSubject, setMailSubject] = useState('');
  const [mailBody, setMailBody] = useState('');
  const [mailRecipient, setMailRecipient] = useState<'Voyager AI' | 'Equipo Académico' | 'Docentes'>('Voyager AI');
  const [mailSentToast, setMailSentToast] = useState<string | null>(null);

  const [mailMessages, setMailMessages] = useState<any[]>(() => {
    try {
      const saved = localStorage.getItem('voyager_internal_mail_messages');
      if (saved) return JSON.parse(saved);
    } catch (e) {}
    return [
      {
        id: 'msg-1',
        sender: 'USA Voyager Academic Team',
        recipient: 'Federico Sandoval',
        subject: 'Bienvenido a la Plataforma USA Voyager',
        date: 'Ayer, 14:30',
        body: 'Hola Federico, bienvenido a la plataforma de aprendizaje interactivo. Tu perfil de nivel Intermedio ha sido activado con seguimiento de fluidez y análisis de pronunciación.',
        read: true,
        tag: 'Sistema'
      },
      {
        id: 'msg-2',
        sender: 'Tutor IA Voyager',
        recipient: 'Federico Sandoval',
        subject: 'Informe de Rendimiento de Conversación',
        date: 'Hoy, 09:15',
        body: 'Hemos analizado tus últimas intervenciones orales. Tu vocabulario muestra una gran retención (88%) y tu pronunciación alcanza 82%. ¡Continúa con la práctica regular!',
        read: false,
        tag: 'Reporte'
      },
      {
        id: 'msg-3',
        sender: 'Departamento de Cívica y Docencia',
        recipient: 'Federico Sandoval',
        subject: 'Retroalimentación de Módulo de Cívica 128',
        date: 'Hace 2 horas',
        body: 'Tus respuestas sobre el sistema de gobierno de EE.UU. y la Constitución fueron evaluadas con precisión. Recuerda repasar los artículos de los Padres Fundadores para reforzar tu fluidez.',
        read: false,
        tag: 'Docentes'
      }
    ];
  });

  const handleSendInternalMail = () => {
    if (!mailBody.trim()) return;
    const newMsg = {
      id: `msg-${Date.now()}`,
      sender: user.firstName ? `${user.firstName} ${user.lastName || ''}`.trim() : 'Federico Sandoval',
      recipient: mailRecipient,
      subject: mailSubject.trim() || 'Consulta de aprendizaje',
      date: 'Ahora mismo',
      body: mailBody.trim(),
      read: true,
      tag: 'Estudiante'
    };
    const updated = [newMsg, ...mailMessages];
    setMailMessages(updated);
    try {
      localStorage.setItem('voyager_internal_mail_messages', JSON.stringify(updated));
    } catch (e) {}

    setMailSentToast(selectedLang === 'EN' ? 'Internal message sent successfully.' : 'Mensaje interno enviado con éxito.');
    setTimeout(() => setMailSentToast(null), 3500);

    const bodyText = mailBody.trim();
    const subjectText = mailSubject.trim() || 'Consulta interna';
    setMailSubject('');
    setMailBody('');
    setMailTab('inbox');

    if (mailRecipient === 'Voyager AI') {
      const mailAckPrompt = `[INSTRUCCIÓN DE SISTEMA MANDATORIA: CONFIRMACIÓN DE COMUNICACIÓN INTERNA DE ESTUDIANTE]
El estudiante te acaba de enviar un mensaje de comunicación interna desde la bandeja de mensajes de su perfil:
"Asunto: ${subjectText}"
"Mensaje: ${bodyText}"

INSTRUCCIONES DE RESPUESTA PARA VOYAGER:
1. Confirma amablemente en voz alta (en español) que has recibido su mensaje de comunicación interna en su bandeja.
2. Responde directamente a su consulta o inquietud de forma servicial, profesional y motivadora.
3. REGLA CRÍTICA MANDATORIA: NO des una clase de inglés, NO hagas preguntas de práctica, NO propongas ejercicios en esta respuesta. Esta intervención es exclusivamente para atender su mensaje de comunicación interna.
4. Habla 100% en español con tu voz natural de Voyager (de 20 a 25 segundos).`;
      onAskVoyager(mailAckPrompt);
    }
  };

  const computeLetterGrade = React.useCallback(() => {
    const getPct = (val?: number, fallback: number = 80) => {
      if (val === undefined || val === null) return fallback;
      if (val <= 0) return 0;
      if (val <= 5) return Math.min(100, Math.round(val * 20));
      return Math.min(100, Math.round(val));
    };

    const pron = getPct(scores?.pronunciation, pronunciationScore || 82);
    const flu = getPct(scores?.naturalness, 74);
    const vocab = getPct(scores?.grammar, grammarScore || 88);
    const conf = getPct(scores?.confidence, 68);

    const total = pron + flu + vocab + conf;
    if (total === 0) {
      return {
        grade: 'N/A',
        displayLabel: selectedLang === 'EN' ? 'Insufficient Data' : 'Sin datos suficientes',
        average: 0,
        hasData: false,
        pron, flu, vocab, conf
      };
    }

    const average = Math.round(total / 4);

    let grade = 'F';
    if (average >= 97) grade = 'A+';
    else if (average >= 93) grade = 'A';
    else if (average >= 90) grade = 'A-';
    else if (average >= 87) grade = 'B+';
    else if (average >= 83) grade = 'B';
    else if (average >= 80) grade = 'B-';
    else if (average >= 77) grade = 'C+';
    else if (average >= 73) grade = 'C';
    else if (average >= 70) grade = 'C-';
    else if (average >= 65) grade = 'D';
    else grade = 'F';

    return {
      grade,
      displayLabel: grade,
      average,
      hasData: true,
      pron, flu, vocab, conf
    };
  }, [scores, pronunciationScore, grammarScore, selectedLang]);

  const triggerGradeVoiceExplanation = React.useCallback(() => {
    const gradeData = computeLetterGrade();

    if (!gradeData.hasData) {
      const noDataPrompt = `[INSTRUCCIÓN DE SISTEMA MANDATORIA: ANÁLISIS DE CALIFICACIÓN DE PROGRESO DE ESTUDIANTE]
El estudiante hizo clic en su botón de calificación general. Actualmente no hay suficientes datos registrados de sus métricas de voz.
Por favor, dile amablemente en voz alta (en español) que aún no hay suficientes datos de evaluación registrados ("no hay datos suficientes"), pero que a medida que interactúe con Voyager se registrarán sus métricas de pronunciación, fluidez, vocabulario y confianza.
MANDATORIO: NO des clase de inglés ni propongas práctica ahora. Mantén la respuesta breve (15-20 segundos).`;
      onAskVoyager(noDataPrompt);
      return;
    }

    const subScores = [
      { name: 'Pronunciación', score: gradeData.pron },
      { name: 'Fluidez', score: gradeData.flu },
      { name: 'Vocabulario', score: gradeData.vocab },
      { name: 'Confianza', score: gradeData.conf }
    ].sort((a, b) => a.score - b.score);

    const lowest1 = subScores[0];
    const lowest2 = subScores[1];

    const gradeExplanationPrompt = `[INSTRUCCIÓN DE SISTEMA MANDATORIA: ANÁLISIS DE CALIFICACIÓN DE PROGRESO DE ESTUDIANTE]
El estudiante seleccionó su calificación general de inglés estadounidense: ${gradeData.grade} (Promedio de métricas: ${gradeData.average}%).

DESGLOSE REAL DE MÉTRICAS DEL ESTUDIANTE:
- Pronunciación: ${gradeData.pron}%
- Fluidez: ${gradeData.flu}%
- Vocabulario: ${gradeData.vocab}%
- Confianza: ${gradeData.conf}%

MANDATOS OBLIGATORIOS PARA TU RESPUESTA DE VOZ EN ESPAÑOL:
1. Explica amablemente por qué el estudiante recibió la letra ${gradeData.grade} según la escala estándar de evaluación (su promedio ponderado es ${gradeData.average}%).
2. Explica brevemente en 2 o 3 puntos las áreas de mejora específicas basadas en sus métricas más bajas: ${lowest1.name} (${lowest1.score}%) y ${lowest2.name} (${lowest2.score}%).
3. REGLA ESTRICTA Y SOBERANA: NO des clases de inglés, NO hagas preguntas en inglés para responder, NO propongas practicar ni iniciar ejercicios en esta respuesta. Esta interacción es exclusivamente para analizar y explicar su progreso actual.
4. Habla 100% en español con tu voz natural de Voyager, con un tono motivador, amable y profesional (20 a 25 segundos).`;

    onAskVoyager(gradeExplanationPrompt);
  }, [computeLetterGrade, onAskVoyager]);

  const [curriculumTrack, setCurriculumTrack] = useState<'immersion' | 'ciudadania'>(() => {
    const goalStr = (user.goal || '').toLowerCase();
    if (goalStr.includes('ciudadan') || goalStr.includes('cívica') || goalStr.includes('civic') || goalStr.includes('citizenship')) {
      return 'ciudadania';
    }
    return 'ciudadania';
  });

  useEffect(() => {
    const goalStr = (selectedGoal || user.goal || '').toLowerCase();
    if (goalStr.includes('ciudadan') || goalStr.includes('cívica') || goalStr.includes('civic') || goalStr.includes('citizenship')) {
      setCurriculumTrack('ciudadania');
    }
  }, [selectedGoal, user.goal]);

  const [civicsData, setCivicsData] = useState(() => CivicsProgressTracker.getProgressData());
  const [savedChatsList, setSavedChatsList] = useState<any[]>(() => {
    try {
      const raw = localStorage.getItem('voyager_saved_chats');
      return raw ? JSON.parse(raw) : [];
    } catch (e) {
      return [];
    }
  });
  const [savedChatsCount, setSavedChatsCount] = useState<number>(() => {
    try {
      const raw = localStorage.getItem('voyager_saved_chats');
      return raw ? JSON.parse(raw).length : 0;
    } catch (e) {
      return 0;
    }
  });

  useEffect(() => {
    const unsub = CivicsProgressTracker.subscribe((updated) => {
      setCivicsData(updated);
    });
    const updateSavedChats = () => {
      try {
        const raw = localStorage.getItem('voyager_saved_chats');
        const parsed = raw ? JSON.parse(raw) : [];
        setSavedChatsCount(parsed.length);
        setSavedChatsList(parsed);
      } catch (e) {}
    };
    updateSavedChats();
    window.addEventListener('storage', updateSavedChats);
    return () => {
      unsub();
      window.removeEventListener('storage', updateSavedChats);
    };
  }, []);

  const visitorFullName = React.useMemo(() => {
    if (user?.name && user.name !== 'Estudiante' && user.name !== 'Learner' && user.name !== 'Alex Johnson Placeholder') {
      const name = user.name.trim();
      if (name && name !== 'Estudiante' && name !== 'Learner' && name !== 'Alex Johnson Placeholder') return name;
    }
    const saved = typeof window !== 'undefined' ? localStorage.getItem('voyager_user_account') : null;
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed.name && parsed.name !== 'Estudiante' && parsed.name !== 'Learner' && parsed.name !== 'Alex Johnson Placeholder') {
          const name = parsed.name.trim();
          if (name && name !== 'Estudiante' && name !== 'Learner' && name !== 'Alex Johnson Placeholder') return name;
        }
      } catch (e) {}
    }
    return '';
  }, [user?.name]);

  useEffect(() => {
    if (user && !isEditingProfile) {
      const names = sanitizeUserProfileNames(user);
      setEditFirstName(names.firstName);
      setEditLastName(names.lastName);
      setEditCategory(user.category || (selectedLang === 'EN' ? 'Student' : 'Estudiante'));
      setEditCountry(user.country || 'Guatemala');
      setEditAge(user.age ?? 63);
      setSelectedGoal(user.goal || (selectedLang === 'EN' ? 'Academic success' : 'Éxito académico'));
      setEditInterests(user.interests || (selectedLang === 'EN' ? 'Travel, technology, music' : 'Viajes, tecnología, música'));
      setSelectedLevel(user.levelEstimate || 'Intermediate');
      setEditEducation(user.education || (selectedLang === 'EN' ? 'University' : 'Universidad'));
      setEditTimePerWeek(formatStudyTimeCompact(user.timePerWeek));
    }
  }, [user, isEditingProfile]);

  const getAiStudentSummary = (u: UserProfile, lang: 'EN' | 'ES') => {
    const goalText = u.goal || 'Business English & Networking';
    const levelText = getTranslatedLevel(u.levelEstimate || 'Intermediate');
    if (lang === 'EN') {
      return `Dedicated learner focusing on ${goalText} at the ${levelText} level. Practicing daily with USA Voyager to develop natural speaking fluency, expand vocabulary retention, and communicate with authentic confidence.`;
    } else {
      return `Estudiante activo enfocado en ${goalText} en nivel ${levelText}. Practica diariamente con USA Voyager para desarrollar fluidez oral natural, ampliar la retención de vocabulario y comunicarse con máxima confianza.`;
    }
  };

  const handleAvatarFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      alert(selectedLang === 'EN' ? 'File is too large (max 5MB)' : 'El archivo es demasiado grande (máximo 5MB)');
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      if (typeof reader.result === 'string') {
        const updated: UserProfile = {
          ...user,
          avatarUrl: reader.result,
          avatarType: 'custom'
        };
        saveUser(updated);
        setIsAvatarModalOpen(false);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleSelectAvatarType = (type: 'user' | 'man' | 'woman' | 'student' | 'astronaut' | 'female_robot' | 'male_robot') => {
    const updated: UserProfile = {
      ...user,
      avatarUrl: undefined,
      avatarType: type
    };
    saveUser(updated);
    setIsAvatarModalOpen(false);
  };

  const renderAvatarContent = (u: UserProfile) => {
    const isLoggedIn = Boolean(auth.currentUser);
    const photoUrl = isLoggedIn
      ? (u.avatarUrl || u.photoURL || (typeof window !== 'undefined' ? (localStorage.getItem('voyager_admin_photo_url') || auth.currentUser?.photoURL) : null))
      : null;

    if (photoUrl) {
      return (
        <img
          src={photoUrl}
          alt={u.name || 'User'}
          referrerPolicy="no-referrer"
          className="w-full h-full rounded-full object-cover"
        />
      );
    }

    const type = u.avatarType || 'user';

    if (type === 'female_robot') {
      return (
        <div className="w-full h-full rounded-full bg-gradient-to-b from-pink-50 to-rose-100 border-2 border-pink-300 text-rose-500 flex items-center justify-center p-1.5 overflow-hidden">
          <svg className="w-full h-full" viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
            <circle cx="32" cy="10" r="4" fill="#EC4899" />
            <rect x="30" y="14" width="4" height="6" fill="#F472B6" rx="1" />
            <path d="M25 10 C27 8, 30 10, 32 10 C34 10, 37 8, 39 10 C37 12, 34 10, 32 10 C30 10, 27 12, 25 10 Z" fill="#F43F5E" />
            <rect x="10" y="27" width="6" height="10" rx="3" fill="#F472B6" />
            <rect x="48" y="27" width="6" height="10" rx="3" fill="#F472B6" />
            <rect x="14" y="18" width="36" height="28" rx="12" fill="#FFFFFF" stroke="#F43F5E" strokeWidth="3" />
            <circle cx="21" cy="36" r="3" fill="#FDA4AF" opacity="0.9" />
            <circle cx="43" cy="36" r="3" fill="#FDA4AF" opacity="0.9" />
            <circle cx="24" cy="28" r="4" fill="#E11D48" />
            <circle cx="40" cy="28" r="4" fill="#E11D48" />
            <circle cx="25.5" cy="26.5" r="1.5" fill="#FFFFFF" />
            <circle cx="41.5" cy="26.5" r="1.5" fill="#FFFFFF" />
            <path d="M20 23 L22 25 M44 23 L42 25" stroke="#BE123C" strokeWidth="2" strokeLinecap="round" />
            <path d="M27 34 Q32 39 37 34" stroke="#BE123C" strokeWidth="2.5" strokeLinecap="round" fill="none" />
            <path d="M20 46 C20 46, 24 58, 32 58 C40 58, 44 46, 44 46" fill="#F472B6" stroke="#E11D48" strokeWidth="2" />
          </svg>
        </div>
      );
    }

    if (type === 'male_robot') {
      return (
        <div className="w-full h-full rounded-full bg-gradient-to-b from-sky-50 to-indigo-100 border-2 border-sky-300 text-indigo-600 flex items-center justify-center p-1.5 overflow-hidden">
          <svg className="w-full h-full" viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
            <circle cx="32" cy="10" r="4" fill="#3B82F6" />
            <rect x="30" y="14" width="4" height="6" fill="#60A5FA" rx="1" />
            <rect x="10" y="27" width="6" height="10" rx="2" fill="#3B82F6" />
            <rect x="48" y="27" width="6" height="10" rx="2" fill="#3B82F6" />
            <rect x="14" y="18" width="36" height="28" rx="8" fill="#FFFFFF" stroke="#2563EB" strokeWidth="3" />
            <rect x="20" y="24" width="24" height="10" rx="5" fill="#1E293B" />
            <circle cx="26" cy="29" r="3" fill="#38BDF8" />
            <circle cx="38" cy="29" r="3" fill="#38BDF8" />
            <circle cx="27" cy="28" r="1" fill="#FFFFFF" />
            <circle cx="39" cy="28" r="1" fill="#FFFFFF" />
            <path d="M26 38 H38" stroke="#2563EB" strokeWidth="2.5" strokeLinecap="round" />
            <path d="M29 36 V40 M32 36 V40 M35 36 V40" stroke="#93C5FD" strokeWidth="1.5" strokeLinecap="round" />
            <path d="M18 46 C18 46, 23 58, 32 58 C41 58, 46 46, 46 46" fill="#3B82F6" stroke="#1D4ED8" strokeWidth="2" />
          </svg>
        </div>
      );
    }

    if (type === 'man') {
      return (
        <div className="w-full h-full rounded-full bg-white text-indigo-700 flex items-center justify-center">
          <svg className="w-3/5 h-3/5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
            <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" />
            <circle cx="12" cy="7" r="4" fill="rgba(99, 102, 241, 0.2)" />
          </svg>
        </div>
      );
    }

    if (type === 'woman') {
      return (
        <div className="w-full h-full rounded-full bg-white text-rose-600 flex items-center justify-center">
          <svg className="w-3/5 h-3/5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
            <path d="M19 21v-2a4 4 0 0 0-3-3.87" />
            <path d="M5 21v-2a4 4 0 0 1 3-3.87" />
            <circle cx="12" cy="8" r="4" fill="rgba(244, 63, 94, 0.2)" />
            <path d="M8 12c1 2 2.5 3 4 3s3-1 4-3" />
          </svg>
        </div>
      );
    }

    if (type === 'student') {
      return (
        <div className="w-full h-full rounded-full bg-white text-emerald-800 flex items-center justify-center">
          <span className="text-xl md:text-2xl">🎓</span>
        </div>
      );
    }

    if (type === 'astronaut') {
      return (
        <div className="w-full h-full rounded-full bg-white flex items-center justify-center p-1.5 overflow-hidden">
          <img src={voyagerRobot} alt="Voyager Robot" className="w-full h-full object-contain" />
        </div>
      );
    }

    // Default neutral outline user icon
    return (
      <div className="w-full h-full rounded-full bg-[#102244] text-slate-300 flex items-center justify-center border-2 border-slate-400/40 shadow-inner hover:border-amber-400/80 transition-colors p-2">
        <User className="w-3/5 h-3/5 text-slate-300 hover:text-amber-300 transition-colors" strokeWidth={1.8} />
      </div>
    );
  };

  const triggerAutoExplanation = (tab: 'welcome' | 'level' | 'lessons' | 'progress' | 'achievements' | 'streak') => {
    let prompt = '';
    const noTutoringRule = 'DIRECTIVA MANDATORIA DE ROL: Tu función aquí NO es enseñar inglés, ni dar una clase, ni iniciar práctica conversacional en inglés. Tu único rol es brindar soporte al usuario para comprender las métricas y estadísticas de su perfil, explicar el significado de sus indicadores de progreso y responder preguntas sobre cómo o qué hacer para mejorar, de forma clara, directa y servicial en español, sin impartir una lección de idioma.';
    if (tab === 'welcome') {
      prompt = `[AUTO_SYSTEM: El usuario ha ingresado a la subsección de 'BIENVENIDO' de su Perfil. Explícale brevemente en español qué información puede gestionar aquí (progreso general, metas, ruta diaria y historial de clases). ${noTutoringRule}]`;
    } else if (tab === 'level') {
      prompt = `[AUTO_SYSTEM: El usuario ha ingresado a la subsección de 'TU NIVEL' de su Perfil. Explícale brevemente en español lo que significan sus puntuaciones de Gramática (${grammarScore}%) y Pronunciación (${pronunciationScore}%) y su nivel estimado (${user?.levelEstimate || 'Intermedio'}). ${noTutoringRule}]`;
    } else if (tab === 'lessons') {
      prompt = `[AUTO_SYSTEM: El usuario ha ingresado a la subsección de 'LECCIONES' de su Perfil. Explícale en español que aquí puede ver su mapa de aprendizaje interactivo del día 1 en adelante y su estado completado. ${noTutoringRule}]`;
    } else if (tab === 'progress') {
      prompt = `[AUTO_SYSTEM: El usuario ha ingresado a la subsección de 'PROGRESO' de su Perfil. Explícale brevemente en español lo que significan sus palabras aprendidas (${learnedWordsCount}) y sus patrones de acento. ${noTutoringRule}]`;
    } else if (tab === 'achievements') {
      prompt = `[AUTO_SYSTEM: El usuario ha ingresado a la subsección de 'LOGROS / ACHIEVEMENTS' de su Perfil. Explícale en español que aquí puede ver sus insignias ganadas por racha, vocabulario, fonética y lecciones completadas para motivar su avance. ${noTutoringRule}]`;
    } else if (tab === 'streak') {
      prompt = `[AUTO_SYSTEM: El usuario ha ingresado a la subsección de 'RACHA DIARIA / DAILY STREAK' de su Perfil. Explícale en español que aquí puede ver su contador de días consecutivos practicando inglés, marcar su ingreso de hoy y ver su calendario semanal. ${noTutoringRule}]`;
    }
    if (prompt) {
      onAskVoyager(prompt);
    }
  };

  const triggerStudentOralReport = () => {
    const studentName = user?.name || (user?.firstName ? `${user.firstName} ${user.lastName || ''}`.trim() : 'Federico Sandoval');
    const level = user?.englishLevel || user?.cefrLevel || user?.levelEstimate || 'Intermedio';
    const studyHours = user?.timePerWeek || '5 hr/wk';
    const goal = user?.learningGoal || user?.goal || 'Travel & Daily Conversation';
    const interests = user?.interests || 'Viajes, tecnología, música';
    
    const pron = scores?.pronunciation ?? (user?.scores?.pronunciation || 82);
    const flu = scores?.naturalness ?? (user?.scores?.naturalness || 74);
    const vocab = scores?.vocabulary ?? (user?.scores?.vocabulary || 88);
    const conf = scores?.confidence ?? (user?.scores?.confidence || 68);

    const reportPrompt = `[INSTRUCCIÓN DE SISTEMA MANDATORIA: INFORME ORAL Y RESUMEN DE PROGRESO DE ESTUDIANTE]
El estudiante ${studentName} ha solicitado su informe de progreso.
Habla en voz alta con tu voz natural de Voyager para darle un informe oral breve, claro y directo (de 20 a 30 segundos) en español explicando su estado y datos reales.

INFORMACIÓN REAL DEL PERFIL DEL ESTUDIANTE:
- Nombre: ${studentName}
- Nivel de inglés: ${level}
- Tiempo de estudio dedicado: ${studyHours}
- Meta de aprendizaje: ${goal}
- Intereses: ${interests}
- Puntuaciones actuales de Análisis de Conversación:
  • Pronunciación: ${pron}%
  • Fluidez: ${flu}%
  • Vocabulario: ${vocab}%
  • Confianza: ${conf}%

REGLAS STRICTAS E INQUEBRANTABLES PARA ESTA SECCIÓN:
1. PROHIBIDO DAR CLASES O ENSEÑAR INGLÉS: En este espacio está ESTRICTAMENTE PROHIBIDO dar clases de inglés, enseñar gramática, proponer ejercicios o intentar hacer prácticas conversacionales en inglés. Las prácticas van en otras partes de la app, NO AQUÍ.
2. PROPÓSITO EXCLUSIVO: Este espacio es ÚNICAMENTE para explicar cómo va el estudiante según sus datos.
3. RESUMEN CLARO Y CORTO: Usa tu voz para dar un resumen corto y claro de su progreso en español (por ejemplo, destaca su fortaleza en vocabulario del ${vocab}% y aconseja enfocar práctica en aumentar su confianza del ${conf}% o fluidez del ${flu}%).
4. HONESTIDAD TOTAL SOBRE DATOS HISTÓRICOS: Si no hay suficientes datos históricos acumulados para evaluar tendencias a largo plazo, dilo con total honestidad. Explica que esta puntuación es su evaluación base inicial y que el sistema registrará sus cambios según continúe sus lecciones.
5. PREGUNTAS DE SEGUIMIENTO: Si el usuario te hace preguntas, responde únicamente enfocándote en explicar sus datos de progreso o estadísticas en español, sin intentar enseñarle ni hacer prácticas de inglés.`;

    if (typeof onAskVoyager === 'function') {
      onAskVoyager(reportPrompt);
    }
  };

  // Load user from storage on mount
  useEffect(() => {
    // Check Firebase auth state and sync with Firestore
    const unsubscribe = auth.onAuthStateChanged(async (fbUser) => {
      if (fbUser) {
        try {
          const synced = await syncOrMigrateUserOnAuth(fbUser);
          const localCache = getLocalProfileCache() || {};
          const isBaseAdmin = fbUser.email === 'theorangesnowman@gmail.com';
          const baseProfile = isBaseAdmin ? adminUser : guestUser;
          const mergedData = { ...baseProfile, ...localCache, ...synced };
          if (isBaseAdmin) {
            mergedData.country = (mergedData.country && mergedData.country !== 'No especificado' && mergedData.country !== 'Not specified') ? mergedData.country : 'Guatemala';
            mergedData.age = mergedData.age ?? 63;
          }
          const names = sanitizeUserProfileNames({
            ...mergedData,
            name: mergedData.name || fbUser.displayName || (isBaseAdmin ? 'Federico Sandoval' : 'Estudiante')
          } as any);
          const newUser: UserProfile = {
            ...mergedData,
            name: names.fullName || fbUser.displayName || (isBaseAdmin ? 'Federico Sandoval' : 'Estudiante'),
            firstName: names.firstName || (isBaseAdmin ? 'Federico' : 'Estudiante'),
            lastName: names.lastName || (isBaseAdmin ? 'Sandoval' : ''),
            country: (mergedData.country && mergedData.country !== 'No especificado' && mergedData.country !== 'Not specified') ? mergedData.country : (isBaseAdmin ? 'Guatemala' : 'Guatemala'),
            age: mergedData.age ?? (isBaseAdmin ? 63 : undefined),
            email: fbUser.email || mergedData.email || '',
            provider: (fbUser.providerData?.[0]?.providerId === 'google.com' ? 'Google' : (mergedData.provider || 'Email')) as any,
            plan: (mergedData.plan === 'PRO' ? 'PRO' : 'FREE'),
            avatarUrl: fbUser?.photoURL || mergedData?.photoURL || mergedData?.avatarUrl || (typeof window !== 'undefined' ? localStorage.getItem('voyager_admin_photo_url') : undefined) || undefined,
            avatarType: (fbUser?.photoURL || mergedData?.photoURL || mergedData?.avatarUrl) ? 'custom' : ((mergedData?.avatarType as any) || 'user')
          };
          setUser(newUser);
          setLocalProfileCache(newUser);
        } catch (err) {
          console.error('Error syncing user on auth state change:', err);
        }
      } else {
        try {
          localStorage.removeItem('voyager_admin_photo_url');
          localStorage.removeItem('voyager_admin_logged_in');
          localStorage.removeItem('voyager_user_account');
        } catch (e) {}
        setUser(guestUser);
      }
    });

    return () => unsubscribe();
  }, []);

  const saveUser = (updated: UserProfile) => {
    const names = sanitizeUserProfileNames(updated);
    const cleanedUser: UserProfile = {
      ...updated,
      name: names.fullName,
      firstName: names.firstName,
      lastName: names.lastName
    };
    setUser(cleanedUser);
    setLocalProfileCache(cleanedUser);
    try {
      localStorage.setItem('voyager_user_account', JSON.stringify(cleanedUser));
      window.dispatchEvent(new Event('voyager_profile_updated'));
    } catch (e) {}
    saveUserProfile(auth.currentUser?.uid || '', cleanedUser);
  };

  const handleLogout = async () => {
    try {
      await logout();
      localStorage.removeItem('voyager_admin_photo_url');
      localStorage.removeItem('voyager_admin_logged_in');
      localStorage.removeItem('voyager_user_account');
    } catch (e) {}
    if (onLogout) onLogout();
    setUser(guestUser);
  };

  const handleUpdateProfile = () => {
    if (!user) return;
    const numAge = typeof editAge === 'number' ? editAge : parseInt(String(editAge), 10);
    const names = sanitizeUserProfileNames({
      name: `${editFirstName} ${editLastName}`,
      firstName: editFirstName,
      lastName: editLastName
    });
    const updated: UserProfile = {
      ...user,
      name: names.fullName,
      firstName: names.firstName,
      lastName: names.lastName,
      category: editCategory.trim() || user.category || (selectedLang === 'EN' ? 'Student' : 'Estudiante'),
      country: editCountry.trim() || user.country || 'Guatemala',
      age: !isNaN(numAge) ? numAge : (user.age ?? 63),
      levelEstimate: selectedLevel,
      education: editEducation.trim() || user.education || (selectedLang === 'EN' ? 'University' : 'Universidad'),
      goal: selectedGoal,
      timePerWeek: formatStudyTimeCompact(editTimePerWeek),
      interests: editInterests.trim() || user.interests || (selectedLang === 'EN' ? 'Travel, technology, music' : 'Viajes, tecnología, música'),
      plan: editPlan
    };
    saveUser(updated);
    setIsEditingProfile(false);
    setSaveNotification(selectedLang === 'EN' ? '✓ Onboarding responses saved successfully!' : '✓ ¡Respuestas de registro guardadas exitosamente!');
    setTimeout(() => {
      setSaveNotification(null);
    }, 4000);
  };

  const toggleDayCompleted = (dayNum: number) => {
    if (!user) return;
    let newCompleted = [...user.completedDays];
    if (newCompleted.includes(dayNum)) {
      newCompleted = newCompleted.filter(d => d !== dayNum);
    } else {
      newCompleted.push(dayNum);
    }
    saveUser({
      ...user,
      completedDays: newCompleted
    });
  };

  // Logged-in screen (Profile Dashboard + Learning Roadmap + Live Lessons)
  const savedAccountForAdmin = typeof window !== 'undefined' ? localStorage.getItem('voyager_user_account') : null;
  let isAdminUser = false;
  let adminName = 'Federico Sandoval';
  if (savedAccountForAdmin) {
    try {
      const parsed = JSON.parse(savedAccountForAdmin);
      if (parsed?.isAdmin || parsed?.email?.toLowerCase() === 'theorangesnowman@gmail.com') {
        isAdminUser = true;
        adminName = parsed?.name || 'Federico Sandoval';
      }
    } catch (e) {}
  }

  return (
    <div className="flex-1 flex flex-col bg-white h-full overflow-hidden animate-fade-in font-sans text-[#231d17]">
      
      {/* Scrollable content area */}
      <div className="flex-1 overflow-y-auto px-3 pt-2 pb-4 flex flex-col gap-3.5 min-h-0">

        {/* SCROLLABLE STUDENT JOURNEY & ROADMAP */}
        
        {/* THE MAIN WELCOME STATEMENT CARD FOR PROFILE */}
        <div className="space-y-3.5 text-left flex flex-col flex-shrink-0 p-0">

        {/* MAIN PROFILE DETAILS CONTAINER */}
        <div className="space-y-4 text-left flex flex-col flex-shrink-0">

          {/* Tab Body Content */}
          <div className="pt-1">
            {activeSubTab === 'welcome' && (
              <div className="animate-fade-in py-1 space-y-4" style={{ containerType: 'inline-size' }}>

                {/* Compact Three-Column Profile */}
                <style>{`
.profile-identity-grid { display:grid; grid-template-columns:minmax(120px,.8fr) minmax(0,2fr); gap:20px; align-items:start; padding-top:4px; }
.profile-fields { display:grid; grid-template-columns:repeat(2,minmax(0,1fr)); column-gap:20px; row-gap:12px; align-items:start; }
@container (max-width: 440px) { .profile-identity-grid { grid-template-columns:minmax(0,1fr); gap:16px; } }
`}</style>
                <div className="profile-identity-grid">
                  
                  {/* Left Column (approx 30-35% width): Avatar */}
                  <div className="min-w-0 flex flex-col items-start text-left">
                    {/* Circular Avatar Container */}
                    <div className="relative group flex-shrink-0 w-full max-w-[160px] aspect-square">
                      {/* Avatar Circle */}
                      <div 
                        onClick={() => {
                          triggerStudentOralReport();
                        }}
                        className="w-full h-full rounded-full bg-neutral-100 border-2 border-amber-400/60 hover:border-amber-500 shadow-sm cursor-pointer overflow-hidden flex items-center justify-center transition-all duration-200 hover:scale-[1.03] active:scale-95 group/avatar relative"
                        title={selectedLang === 'EN' ? 'Click photo to hear Voyager oral progress report' : 'Haz clic en la foto para escuchar el informe oral de progreso de Voyager'}
                      >
                        {renderAvatarContent(user)}
                        <div className="absolute inset-0 bg-black/20 opacity-0 group-hover/avatar:opacity-100 transition-opacity flex items-center justify-center pointer-events-none">
                          <Volume2 className="w-8 h-8 text-amber-300 drop-shadow-md animate-pulse" />
                        </div>
                      </div>

                      {/* Gear Account & Logout Popover Menu */}
                      {isGearMenuOpen && (
                        <>
                          <div 
                            className="fixed inset-0 z-30 bg-black/20 backdrop-blur-2xs" 
                            onClick={() => setIsGearMenuOpen(false)} 
                          />
                          <div className="absolute top-12 left-1/2 -translate-x-1/2 sm:translate-x-0 sm:-right-12 w-64 z-40 bg-[#0B1B3D] border-2 border-[#FFD700] rounded-2xl p-3 shadow-2xl animate-fade-in text-white text-left">
                            <div className="flex items-center justify-between pb-2 mb-2 border-b border-white/10">
                              <div className="min-w-0 pr-2">
                                <p className="text-[10px] uppercase tracking-wider text-[#FFD700] font-normal">
                                  {selectedLang === 'EN' ? 'Logged Account' : 'Cuenta de Usuario'}
                                </p>
                                <p className="text-xs font-normal text-white truncate">
                                  {user.email || 'learner@usavoyager.com'}
                                </p>
                              </div>
                              <button 
                                type="button"
                                onClick={() => setIsGearMenuOpen(false)}
                                className="text-white/60 hover:text-white p-1 rounded-lg"
                              >
                                <X className="w-3.5 h-3.5" />
                              </button>
                            </div>

                            <div className="space-y-1">
                              <button
                                type="button"
                                onClick={() => {
                                  setIsGearMenuOpen(false);
                                  setIsEditingProfile(true);
                                }}
                                className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-normal text-white/90 hover:bg-white/10 transition-colors text-left cursor-pointer"
                              >
                                <Settings className="w-4 h-4 text-[#FFD700] shrink-0" />
                                <span>{selectedLang === 'EN' ? 'Edit Answers' : 'Editar Respuestas'}</span>
                              </button>

                              <button
                                type="button"
                                onClick={async () => {
                                  setIsGearMenuOpen(false);
                                  await handleLogout();
                                }}
                                className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-normal text-rose-300 hover:bg-rose-500/20 hover:text-rose-200 transition-colors text-left cursor-pointer group"
                              >
                                <LogOut className="w-4 h-4 text-rose-400 group-hover:scale-110 transition-transform shrink-0" />
                                <span>{selectedLang === 'EN' ? 'Log Out' : 'Cerrar Sesión'}</span>
                              </button>
                            </div>
                          </div>
                        </>
                      )}
                    </div>

                    {/* Icon Action Buttons Below Picture (Flush Left, No Overlap) */}
                    <div className="flex items-center justify-start gap-2 mt-2 flex-wrap">
                      {/* Pencil Edit Profile Button (Swapped from header) */}
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setIsEditingProfile(prev => !prev);
                        }}
                        className="w-8.5 h-8.5 sm:w-9 sm:h-9 rounded-full bg-black text-white hover:bg-neutral-800 border-2 border-white shadow-md flex items-center justify-center transition-all duration-200 hover:scale-105 active:scale-95 cursor-pointer select-none group shrink-0"
                        title={isEditingProfile ? (selectedLang === 'EN' ? 'View Saved Profile' : 'Ver Guardado') : (selectedLang === 'EN' ? 'Edit Profile' : 'Editar Perfil')}
                        aria-label={isEditingProfile ? (selectedLang === 'EN' ? 'View Saved Profile' : 'Ver Guardado') : (selectedLang === 'EN' ? 'Edit Profile' : 'Editar Perfil')}
                      >
                        <Pencil className="w-4 h-4 text-white stroke-[2.2] group-hover:scale-110 transition-transform" />
                      </button>

                      {/* Camera Photo Badge Button */}
                      <button
                        type="button"
                        onClick={async (e) => {
                          e.stopPropagation();
                          if (!auth.currentUser) {
                            try {
                              const res = await googleSignIn();
                              if (res?.user) {
                                const synced = await syncOrMigrateUserOnAuth(res.user);
                                const rawEmail = (synced.email || res.user.email || '').toLowerCase().trim();
                                const isAdminUser = rawEmail === 'theorangesnowman@gmail.com';
                                const finalName = isAdminUser ? 'Federico Sandoval (Admin)' : (synced.name || res.user.displayName || 'Google Learner');
                                const photoURL = res?.user?.photoURL || synced?.photoURL || synced?.avatarUrl || '';
                                const updatedUser: UserProfile = {
                                  ...defaultUser,
                                  ...synced,
                                  name: finalName,
                                  email: isAdminUser ? 'theorangesnowman@gmail.com' : rawEmail,
                                  photoURL,
                                  avatarUrl: photoURL,
                                  avatarType: photoURL ? 'custom' : 'user',
                                  provider: (synced.provider || 'Google') as any,
                                  plan: (synced.plan === 'PRO' ? 'PRO' : 'FREE')
                                };
                                saveUser(updatedUser);
                              }
                            } catch (err) {
                              console.error('Google sign in error:', err);
                            }
                          } else {
                            setIsAvatarModalOpen(true);
                          }
                        }}
                        className="w-8.5 h-8.5 sm:w-9 sm:h-9 rounded-full bg-black text-white hover:bg-neutral-800 transition-all cursor-pointer flex items-center justify-center shadow-md active:scale-95 border-2 border-white shrink-0 group"
                        title={!auth.currentUser ? (selectedLang === 'EN' ? 'Click to login' : 'Haz clic para iniciar sesión') : (selectedLang === 'EN' ? 'Change photo' : 'Cambiar foto')}
                      >
                        <Camera className="w-4 h-4 sm:w-4.5 sm:h-4.5 text-white stroke-[2.2] group-hover:scale-110 transition-transform" />
                      </button>

                      {/* Internal Communication Mail Button */}
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setIsMailModalOpen(true);
                        }}
                        className="w-8.5 h-8.5 sm:w-9 sm:h-9 rounded-full bg-black text-white hover:bg-neutral-800 border-2 border-white shadow-md flex items-center justify-center transition-all duration-200 hover:scale-105 active:scale-95 cursor-pointer select-none group shrink-0 relative"
                        title={selectedLang === 'EN' ? 'Internal Communication & Messages' : 'Comunicación Interna y Mensajes'}
                        aria-label={selectedLang === 'EN' ? 'Internal Communication & Messages' : 'Comunicación Interna y Mensajes'}
                      >
                        <Mail className="w-4 h-4 text-white stroke-[2.2] group-hover:scale-110 transition-transform" />
                        <span className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-rose-500 border border-white animate-pulse" />
                      </button>
                    </div>
                  </div>

                  {/* Right Column: Clean Label-Value Identity Details or Onboarding Editor Card */}
                  {isEditingProfile ? (
                    <div className="profile-details min-w-0 flex flex-col bg-white p-4 rounded-[24px] border-2 border-amber-400 shadow-xl animate-fade-in text-neutral-900">
                      {/* Header with Save/Cancel Controls */}
                      <div className="mb-4 pb-3 border-b border-neutral-200">
                        <div className="flex items-center justify-between gap-2 flex-wrap">
                          <div className="flex items-center gap-2">
                            <h3 className="font-normal text-neutral-900 text-base sm:text-lg">
                              {selectedLang === 'EN' ? 'Update Onboarding Answers' : 'Actualizar Respuestas de Registro'}
                            </h3>
                          </div>

                          <button
                            type="button"
                            onClick={() => setIsEditingProfile(false)}
                            className="px-3 py-1.5 bg-neutral-100 hover:bg-neutral-200 text-neutral-800 rounded-xl font-normal text-xs flex items-center gap-1.5 cursor-pointer transition-all active:scale-95 border border-neutral-300 shadow-2xs"
                          >
                            <span>{selectedLang === 'EN' ? 'View Saved Profile' : 'Ver Guardado'}</span>
                          </button>
                        </div>
                        <p className="text-xs font-normal text-neutral-600 mt-1">
                          {selectedLang === 'EN'
                            ? 'Modify your responses to personalize your learning path and AI tutor instructions.'
                            : 'Modifica tus respuestas para personalizar tu ruta de aprendizaje e instrucciones del tutor IA.'}
                        </p>
                      </div>

                      {/* Toast Notification */}
                      {saveNotification && (
                        <div className="mb-4 p-3 bg-emerald-100 border border-emerald-400 text-emerald-950 font-normal rounded-xl text-xs sm:text-sm flex items-center gap-2 animate-fade-in shadow-2xs">
                          <span>{saveNotification}</span>
                        </div>
                      )}

                      <div className="space-y-4">
                        {/* Section 1: Personal Info */}
                        <div className="bg-amber-50/70 p-3.5 sm:p-4 rounded-2xl border border-amber-200/80">
                          <h4 className="text-xs font-normal uppercase tracking-wider text-amber-900 mb-2.5 flex items-center gap-1.5">
                            {selectedLang === 'EN' ? 'Personal Information' : 'Información Personal'}
                          </h4>
                          
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-3">
                            <div>
                              <label className="block font-normal text-neutral-800 text-xs mb-1">
                                {selectedLang === 'EN' ? 'First Name' : 'Nombre'}
                              </label>
                              <input
                                type="text"
                                value={editFirstName}
                                onChange={(e) => setEditFirstName(e.target.value)}
                                className="w-full px-3.5 py-2 bg-white border border-neutral-300 rounded-xl font-normal text-neutral-900 focus:outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 text-xs sm:text-sm"
                                placeholder="Federico"
                              />
                            </div>

                            <div>
                              <label className="block font-normal text-neutral-800 text-xs mb-1">
                                {selectedLang === 'EN' ? 'Last Name' : 'Apellido'}
                              </label>
                              <input
                                type="text"
                                value={editLastName}
                                onChange={(e) => setEditLastName(e.target.value)}
                                className="w-full px-3.5 py-2 bg-white border border-neutral-300 rounded-xl font-normal text-neutral-900 focus:outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 text-xs sm:text-sm"
                                placeholder="Sandoval"
                              />
                            </div>
                          </div>

                          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                            <div>
                              <label className="block font-normal text-neutral-800 text-xs mb-1">
                                {selectedLang === 'EN' ? 'Category' : 'Categoría'}
                              </label>
                              <select
                                value={editCategory}
                                onChange={(e) => setEditCategory(e.target.value)}
                                className="w-full px-3.5 py-2 bg-white border border-neutral-300 rounded-xl font-normal text-neutral-900 focus:outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 text-xs sm:text-sm"
                              >
                                <option value="Estudiante">{selectedLang === 'EN' ? 'Student' : 'Estudiante'}</option>
                                <option value="Profesional">{selectedLang === 'EN' ? 'Professional' : 'Profesional'}</option>
                                <option value="Viajante">{selectedLang === 'EN' ? 'Traveler' : 'Viajante'}</option>
                                <option value="Docente">{selectedLang === 'EN' ? 'Teacher' : 'Docente'}</option>
                              </select>
                            </div>

                            <div>
                              <label className="block font-normal text-neutral-800 text-xs mb-1">
                                {selectedLang === 'EN' ? 'Country' : 'País'}
                              </label>
                              <select
                                value={editCountry}
                                onChange={(e) => setEditCountry(e.target.value)}
                                className="w-full px-3.5 py-2 bg-white border border-neutral-300 rounded-xl font-normal text-neutral-900 focus:outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 text-xs sm:text-sm"
                              >
                                <option value="Costa Rica">🇨🇷 Costa Rica</option>
                                <option value="Mexico">🇲🇽 México</option>
                                <option value="Colombia">🇨🇴 Colombia</option>
                                <option value="Spain">🇪🇸 España</option>
                                <option value="United States">🇺🇸 United States</option>
                                <option value="Argentina">🇦🇷 Argentina</option>
                                <option value="Peru">🇵🇪 Perú</option>
                                <option value="Chile">🇨🇱 Chile</option>
                                <option value="Guatemala">🇬🇹 Guatemala</option>
                                <option value="Dominican Republic">🇩🇴 República Dominicana</option>
                                <option value="Venezuela">🇻🇪 Venezuela</option>
                                <option value="Ecuador">🇪🇨 Ecuador</option>
                                <option value="Honduras">🇭🇳 Honduras</option>
                                <option value="El Salvador">🇸🇻 El Salvador</option>
                                <option value="Nicaragua">🇳🇮 Nicaragua</option>
                                <option value="Panama">🇵🇦 Panamá</option>
                              </select>
                            </div>

                            <div>
                              <label className="block font-normal text-neutral-800 text-xs mb-1">
                                {selectedLang === 'EN' ? 'Age' : 'Edad'}
                              </label>
                              <input
                                type="number"
                                value={editAge}
                                onChange={(e) => setEditAge(e.target.value)}
                                min={10}
                                max={100}
                                className="w-full px-3.5 py-2 bg-white border border-neutral-300 rounded-xl font-normal text-neutral-900 focus:outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 text-xs sm:text-sm"
                              />
                            </div>
                          </div>
                        </div>

                        {/* Section ESTATUS */}
                        <div className="bg-emerald-50/70 p-3.5 sm:p-4 rounded-2xl border border-emerald-200/80">
                          <h4 className="text-xs font-normal uppercase tracking-wider text-emerald-900 mb-2.5 flex items-center justify-between">
                            <span>{selectedLang === 'EN' ? 'STATUS' : 'ESTATUS'}</span>
                          </h4>

                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            <div>
                              <label className="block font-normal text-neutral-800 text-xs mb-1 flex items-center justify-between">
                                <span>{selectedLang === 'EN' ? 'Student ID' : 'ID Estudiante'}</span>
                                <span className="text-[10px] text-neutral-500 font-normal">
                                  {selectedLang === 'EN' ? 'Auto-assigned' : 'Asignado automáticamente'}
                                </span>
                              </label>
                              <input
                                type="text"
                                value={user.studentId || 'STU-001'}
                                disabled
                                readOnly
                                className="w-full px-3.5 py-2 bg-neutral-100 border border-neutral-300 rounded-xl font-mono text-neutral-600 cursor-not-allowed text-xs sm:text-sm"
                              />
                            </div>

                            <div>
                              <label className="block font-normal text-neutral-800 text-xs mb-1">
                                {selectedLang === 'EN' ? 'Account Type' : 'Tipo de Cuenta'}
                              </label>
                              <select
                                value={editPlan}
                                onChange={(e) => setEditPlan(e.target.value)}
                                className="w-full px-3.5 py-2 bg-white border border-neutral-300 rounded-xl font-normal text-neutral-900 focus:outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 text-xs sm:text-sm"
                              >
                                <option value="PRO">PRO</option>
                                <option value="NORMAL">NORMAL</option>
                              </select>
                            </div>
                          </div>
                        </div>

                        {/* Section 2: Learning Profile */}
                        <div className="bg-blue-50/70 p-3.5 sm:p-4 rounded-2xl border border-blue-200/80">
                          <h4 className="text-xs font-normal uppercase tracking-wider text-blue-900 mb-2.5 flex items-center gap-1.5">
                            {selectedLang === 'EN' ? 'Learning Profile' : 'Perfil de Aprendizaje'}
                          </h4>

                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-3">
                            <div>
                              <label className="block font-normal text-neutral-800 text-xs mb-1">
                                {selectedLang === 'EN' ? 'English Level' : 'Nivel de Inglés'}
                              </label>
                              <select
                                value={selectedLevel}
                                onChange={(e) => setSelectedLevel(e.target.value)}
                                className="w-full px-3.5 py-2 bg-white border border-neutral-300 rounded-xl font-normal text-neutral-900 focus:outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 text-xs sm:text-sm"
                              >
                                <option value="Intermediate">{selectedLang === 'EN' ? 'Intermediate (B1-B2)' : 'Intermedio (B1-B2)'}</option>
                                <option value="Beginner">{selectedLang === 'EN' ? 'Beginner (A1-A2)' : 'Principiante (A1-A2)'}</option>
                                <option value="Advanced">{selectedLang === 'EN' ? 'Advanced (C1-C2)' : 'Avanzado (C1-C2)'}</option>
                                <option value="Not Sure">{selectedLang === 'EN' ? 'Not Sure' : 'No estoy seguro'}</option>
                              </select>
                            </div>

                            <div>
                              <label className="block font-normal text-neutral-800 text-xs mb-1">
                                {selectedLang === 'EN' ? 'Education Level' : 'Nivel de Educación'}
                              </label>
                              <select
                                value={editEducation}
                                onChange={(e) => setEditEducation(e.target.value)}
                                className="w-full px-3.5 py-2 bg-white border border-neutral-300 rounded-xl font-normal text-neutral-900 focus:outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 text-xs sm:text-sm"
                              >
                                <option value="Universidad">{selectedLang === 'EN' ? 'University / College' : 'Universidad'}</option>
                                <option value="Secundaria">{selectedLang === 'EN' ? 'High School / Secondary' : 'Secundaria'}</option>
                                <option value="Posgrado">{selectedLang === 'EN' ? 'Postgraduate / Master' : 'Posgrado'}</option>
                                <option value="Autodidacta">{selectedLang === 'EN' ? 'Self-Taught' : 'Autodidacta'}</option>
                              </select>
                            </div>
                          </div>

                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            <div>
                              <label className="block font-normal text-neutral-800 text-xs mb-1">
                                {selectedLang === 'EN' ? 'Learning Goal' : 'Meta de Aprendizaje'}
                              </label>
                              <select
                                value={selectedGoal}
                                onChange={(e) => setSelectedGoal(e.target.value)}
                                className="w-full px-3.5 py-2 bg-white border border-neutral-300 rounded-xl font-normal text-neutral-900 focus:outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 text-xs sm:text-sm"
                              >
                                <option value="Éxito académico">{selectedLang === 'EN' ? 'Academic success' : 'Éxito académico'}</option>
                                <option value="Inglés profesional y carrera">{selectedLang === 'EN' ? 'Career & Business English' : 'Inglés profesional y carrera'}</option>
                                <option value="Viajes y cultura">{selectedLang === 'EN' ? 'Travel & Culture' : 'Viajes y cultura'}</option>
                                <option value="Cívica 128 y Ciudadanía EE.UU.">{selectedLang === 'EN' ? 'US Civics 128 & Citizenship' : 'Cívica 128 y Ciudadanía EE.UU.'}</option>
                                <option value="Fluidez diaria">{selectedLang === 'EN' ? 'Daily Fluency' : 'Fluidez diaria'}</option>
                              </select>
                            </div>

                            <div>
                              <label className="block font-normal text-neutral-800 text-xs mb-1">
                                {selectedLang === 'EN' ? 'Weekly Study Time' : 'Tiempo de Estudio Semanal'}
                              </label>
                              <select
                                value={formatStudyTimeCompact(editTimePerWeek)}
                                onChange={(e) => setEditTimePerWeek(e.target.value)}
                                className="w-full px-3.5 py-2 bg-white border border-neutral-300 rounded-xl font-normal text-neutral-900 focus:outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 text-xs sm:text-sm"
                              >
                                <option value="5 hr/wk">5 hr/wk</option>
                                <option value="2 hr/wk">2 hr/wk</option>
                                <option value="10 hr/wk">10 hr/wk</option>
                                <option value="7 hr/wk">7 hr/wk</option>
                              </select>
                            </div>
                          </div>
                        </div>

                        {/* Section 3: Interests */}
                        <div className="bg-purple-50/70 p-3.5 sm:p-4 rounded-2xl border border-purple-200/80 space-y-3">
                          <div className="flex items-center justify-between">
                            <label className="block font-normal text-xs uppercase tracking-wider text-purple-900">
                              💡 {selectedLang === 'EN' ? 'Interests & Favorite Topics' : 'Intereses y Temas Favoritos'}
                            </label>
                            <span className="text-[10px] font-normal text-purple-700 bg-purple-100 px-2 py-0.5 rounded-full border border-purple-200">
                              {editInterests ? editInterests.split(',').map(s => s.trim()).filter(Boolean).length : 0} {selectedLang === 'EN' ? 'active' : 'activos'}
                            </span>
                          </div>

                          {/* Active Interest Badges */}
                          <div className="flex flex-wrap gap-1.5 min-h-[38px] bg-white p-2.5 rounded-xl border border-neutral-200/90 shadow-2xs">
                            {editInterests && editInterests.split(',').map(s => s.trim()).filter(Boolean).length > 0 ? (
                              editInterests.split(',').map(s => s.trim()).filter(Boolean).map((interest, idx) => (
                                <span
                                  key={idx}
                                  className="inline-flex items-center gap-1.5 px-3 py-1 bg-purple-100 text-purple-950 border border-purple-300 rounded-full text-xs font-normal shadow-2xs transition-all hover:bg-purple-200"
                                >
                                  <span>{interest}</span>
                                  <button
                                    type="button"
                                    onClick={() => handleRemoveInterest(interest)}
                                    className="p-0.5 hover:bg-purple-300 rounded-full text-purple-700 hover:text-purple-950 transition-colors cursor-pointer"
                                    title={selectedLang === 'EN' ? 'Remove interest' : 'Eliminar interés'}
                                  >
                                    <X className="w-3 h-3 stroke-[2.5]" />
                                  </button>
                                </span>
                              ))
                            ) : (
                              <span className="text-xs font-normal italic text-neutral-400 py-0.5 px-1">
                                {selectedLang === 'EN' ? 'No interests added yet. Add one below!' : 'Sin temas añadidos. ¡Agrega uno abajo!'}
                              </span>
                            )}
                          </div>

                          {/* Input and Plus (+) Button to Add Interest */}
                          <div className="flex items-center gap-2">
                            <div className="relative flex-1">
                              <input
                                type="text"
                                value={newInterestInput}
                                onChange={(e) => setNewInterestInput(e.target.value)}
                                onKeyDown={(e) => {
                                  if (e.key === 'Enter') {
                                    e.preventDefault();
                                    handleAddInterest();
                                  }
                                }}
                                className="w-full pl-3.5 pr-9 py-2 bg-white border border-neutral-300 rounded-xl font-normal text-neutral-900 focus:outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 text-xs sm:text-sm placeholder:font-normal placeholder:text-neutral-400"
                                placeholder={selectedLang === 'EN' ? 'Type new interest (e.g. History, Cooking)...' : 'Escribe un nuevo interés (ej. Historia, Cocina)...'}
                              />
                              {newInterestInput.trim() && (
                                <button
                                  type="button"
                                  onClick={() => setNewInterestInput('')}
                                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-600 p-0.5"
                                >
                                  <X className="w-3.5 h-3.5" />
                                </button>
                              )}
                            </div>

                            {/* Prominent Plus (+) Button */}
                            <button
                              type="button"
                              onClick={() => handleAddInterest()}
                              disabled={!newInterestInput.trim()}
                              className={`px-3.5 py-2 rounded-xl font-normal text-xs sm:text-sm flex items-center justify-center gap-1.5 shadow-sm transition-all cursor-pointer active:scale-95 ${
                                newInterestInput.trim()
                                  ? 'bg-purple-600 hover:bg-purple-700 text-white border border-purple-700 shadow-purple-600/20'
                                  : 'bg-purple-200 text-purple-400 border border-purple-300 cursor-not-allowed opacity-75'
                              }`}
                              title={selectedLang === 'EN' ? 'Add interest' : 'Agregar interés'}
                            >
                              <Plus className="w-4 h-4 stroke-[3]" />
                              <span>{selectedLang === 'EN' ? 'Add' : 'Agregar'}</span>
                            </button>
                          </div>

                          {/* Quick Add Suggestions */}
                          <div className="pt-1">
                            <span className="text-[11px] font-normal text-purple-900/80 block mb-1.5">
                              {selectedLang === 'EN' ? 'Quick suggestions (click + to add):' : 'Sugerencias rápidas (haz clic en + para agregar):'}
                            </span>
                            <div className="flex flex-wrap gap-1.5">
                              {suggestedInterests.map((suggested, idx) => {
                                const currentList = editInterests ? editInterests.split(',').map(s => s.trim().toLowerCase()) : [];
                                const isAdded = currentList.includes(suggested.toLowerCase());
                                return (
                                  <button
                                    key={idx}
                                    type="button"
                                    disabled={isAdded}
                                    onClick={() => handleAddInterest(suggested)}
                                    className={`text-[11px] font-normal px-2.5 py-1 rounded-lg border transition-all flex items-center gap-1 cursor-pointer active:scale-95 ${
                                      isAdded
                                        ? 'bg-purple-100/70 text-purple-400 border-purple-200 cursor-default opacity-60'
                                        : 'bg-white hover:bg-purple-100 text-purple-900 border-purple-200 hover:border-purple-300 shadow-2xs'
                                    }`}
                                  >
                                    <Plus className="w-3 h-3 text-purple-600 stroke-[2.5]" />
                                    <span>{suggested}</span>
                                  </button>
                                );
                              })}
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Action Buttons */}
                      <div className="flex items-center gap-3 pt-4 mt-2 border-t border-neutral-200">
                        <button
                          type="button"
                          onClick={handleUpdateProfile}
                          className="px-5 py-3 bg-amber-400 hover:bg-amber-500 text-black font-normal rounded-xl text-xs sm:text-sm flex items-center justify-center gap-2 shadow-sm transition-all cursor-pointer active:scale-95 border border-amber-500"
                        >
                          <span>💾</span>
                          <span>{selectedLang === 'EN' ? 'Save Changes' : 'Guardar Cambios'}</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => setIsEditingProfile(false)}
                          className="px-5 py-3 bg-neutral-100 hover:bg-neutral-200 text-neutral-800 font-normal rounded-xl text-xs sm:text-sm cursor-pointer transition-all active:scale-95 border border-neutral-300"
                        >
                          {selectedLang === 'EN' ? 'Cancel' : 'Cancelar'}
                        </button>
                      </div>
                    </div>
                  ) : (
                    /* LIGHT MODE SAVED VIEW CARD */
                    <div className="profile-details min-w-0 bg-white animate-fade-in text-neutral-900">
                      
                      {/* Clean Light Metric Grid */}
                      <div className="profile-fields">
                        
                        {/* Nombre */}
                        <div className="min-w-0">
                          <span className="block text-[10px] font-normal uppercase tracking-wide text-slate-500 mb-1 leading-tight break-words">
                            {selectedLang === 'EN' ? 'First Name' : 'Nombre'}
                          </span>
                          <span className="block font-semibold text-neutral-900 text-sm leading-snug [overflow-wrap:anywhere]">
                            {sanitizeUserProfileNames(user).firstName}
                          </span>
                        </div>

                        {/* Apellido */}
                        <div className="min-w-0">
                          <span className="block text-[10px] font-normal uppercase tracking-wide text-slate-500 mb-1 leading-tight break-words">
                            {selectedLang === 'EN' ? 'Last Name' : 'Apellido'}
                          </span>
                          <span className="block font-semibold text-neutral-900 text-sm leading-snug [overflow-wrap:anywhere]">
                            {sanitizeUserProfileNames(user).lastName}
                          </span>
                        </div>

                        {/* ID Estudiante */}
                        <div className="min-w-0">
                          <span className="block text-[10px] font-normal uppercase tracking-wide text-slate-500 mb-1 leading-tight break-words">
                            {selectedLang === 'EN' ? 'Student ID' : 'ID Estudiante'}
                          </span>
                          <span className="block font-semibold text-neutral-900 text-sm leading-snug [overflow-wrap:anywhere]">
                            {user.studentId || 'STU-001'}
                          </span>
                        </div>

                        {/* Tipo de Cuenta */}
                        <div className="min-w-0">
                          <span className="block text-[10px] font-normal uppercase tracking-wide text-slate-500 mb-1 leading-tight break-words">
                            {selectedLang === 'EN' ? 'Account Type' : 'Tipo de Cuenta'}
                          </span>
                          <span className="block font-semibold text-neutral-900 text-sm leading-snug [overflow-wrap:anywhere]">
                            {user.plan === 'NORMAL' || user.plan === 'FREE' ? 'NORMAL' : 'PRO'}
                          </span>
                        </div>

                        {/* Categoría */}
                        <div className="min-w-0">
                          <span className="block text-[10px] font-normal uppercase tracking-wide text-slate-500 mb-1 leading-tight break-words">
                            {selectedLang === 'EN' ? 'Category' : 'Categoría'}
                          </span>
                          <span className="block font-semibold text-neutral-900 text-sm leading-snug [overflow-wrap:anywhere]">
                            {user.category || (selectedLang === 'EN' ? 'Student' : 'Estudiante')}
                          </span>
                        </div>

                        {/* País */}
                        <div className="min-w-0">
                          <span className="block text-[10px] font-normal uppercase tracking-wide text-slate-500 mb-1 leading-tight break-words">
                            {selectedLang === 'EN' ? 'Country' : 'País'}
                          </span>
                          <span className="block font-semibold text-neutral-900 text-sm leading-snug [overflow-wrap:anywhere]">
                            {(() => {
                              const c = user.country;
                              const isPlaceholder = !c || c === 'No especificado' || c === 'Not specified';
                              if (isPlaceholder) {
                                return 'Guatemala';
                              }
                              return c.replace(/[\uD83C-\uDBFF\uDC00-\uDFFF]/g, '').trim() || c;
                            })()}
                          </span>
                        </div>

                        {/* Edad */}
                        <div className="min-w-0">
                          <span className="block text-[10px] font-normal uppercase tracking-wide text-slate-500 mb-1 leading-tight break-words">
                            {selectedLang === 'EN' ? 'Age' : 'Edad'}
                          </span>
                          <span className="block font-semibold text-neutral-900 text-sm leading-snug [overflow-wrap:anywhere]">
                            {user.age ?? 63}
                          </span>
                        </div>

                        {/* Nivel de Inglés */}
                        <div className="min-w-0">
                          <span className="block text-[10px] font-normal uppercase tracking-wide text-slate-500 mb-1 leading-tight break-words">
                            {selectedLang === 'EN' ? 'English Level' : 'Nivel de Inglés'}
                          </span>
                          <span className="block font-semibold text-neutral-900 text-sm leading-snug [overflow-wrap:anywhere]">
                            {getTranslatedLevel(user.levelEstimate || 'Intermediate')}
                          </span>
                        </div>

                        {/* Educación */}
                        <div className="min-w-0">
                          <span className="block text-[10px] font-normal uppercase tracking-wide text-slate-500 mb-1 leading-tight break-words">
                            {selectedLang === 'EN' ? 'Education' : 'Educación'}
                          </span>
                          <span className="block font-semibold text-neutral-900 text-sm leading-snug [overflow-wrap:anywhere]">
                            {user.education || (selectedLang === 'EN' ? 'University' : 'Universidad')}
                          </span>
                        </div>

                        {/* Tiempo de Estudio */}
                        <div className="min-w-0">
                          <span className="block text-[10px] font-normal uppercase tracking-wide text-slate-500 mb-1 leading-tight break-words">
                            {selectedLang === 'EN' ? 'Study Time' : 'Tiempo de Estudio'}
                          </span>
                          <span className="block font-semibold text-neutral-900 text-sm leading-snug [overflow-wrap:anywhere]">
                            {formatStudyTimeCompact(user.timePerWeek)}
                          </span>
                        </div>

                        {/* Meta de Aprendizaje */}
                        <div className="min-w-0">
                          <span className="block text-[10px] font-normal uppercase tracking-wide text-slate-500 mb-1 leading-tight break-words">
                            {selectedLang === 'EN' ? 'Learning Goal' : 'Meta de Aprendizaje'}
                          </span>
                          <span className="block font-semibold text-neutral-900 text-sm leading-snug [overflow-wrap:anywhere]">
                            {user.goal || (selectedLang === 'EN' ? 'Travel & Daily Conversation' : 'Travel & Daily Conversation')}
                          </span>
                        </div>

                        {/* Intereses */}
                        <div className="min-w-0">
                          <span className="block text-[10px] font-normal uppercase tracking-wide text-slate-500 mb-1 leading-tight break-words">
                            {selectedLang === 'EN' ? 'Interests' : 'Intereses'}
                          </span>
                          <span className="block font-semibold text-neutral-900 text-sm leading-snug [overflow-wrap:anywhere]">
                            {user.interests || (selectedLang === 'EN' ? 'Travel, technology, music' : 'Viajes, tecnología, música')}
                          </span>
                        </div>

                      </div>
                    </div>
                  )}

                </div>

                {/* ────── Horizontal Divider Rule ────── */}
                <div className="w-full my-5 border-t border-slate-200/90" />

                {/* 📊 Student Performance Metrics Section - Instance 1: Conversation Analysis */}
                <div className="pt-0.5 pb-1">

                  <div className="flex items-center justify-start gap-2 pb-3 text-left w-full">
                    <Activity className="w-5 h-5 text-amber-500 flex-shrink-0" />
                    <span className="text-sm sm:text-[15.5px] font-black tracking-wider text-neutral-800 font-mono text-left">
                      {selectedLang === 'EN' ? 'Conversation Analysis' : 'Análisis de Conversación'}
                    </span>
                  </div>

                  {/* Score Circular Rings Section */}
                  {(() => {
                    const getPct = (val?: number, fallback: number = 80) => {
                      if (val === undefined || val === null || val <= 0) return fallback;
                      if (val <= 5) return Math.min(100, Math.round(val * 20));
                      return Math.min(100, Math.round(val));
                    };

                    const metricSupportRuleEn = 'RULE: Your role here is strictly to explain this metric/stat to the user and answer questions about how or what to do to improve this score. Do NOT teach an English lesson or engage in conversational English practice.';
                    const metricSupportRuleEs = 'REGLA: Tu rol aquí es estrictamente explicar esta métrica/estadística al usuario y responder preguntas sobre cómo o qué hacer para mejorar este puntaje. NO des una clase de inglés ni inicies práctica conversacional.';

                    const gradeInfo = computeLetterGrade();

                    const statItems = [

                      {
                        title: selectedLang === 'EN' ? 'Pronunciation' : 'Pronunciación',
                        val: getPct(scores?.pronunciation || pronunciationScore, 82),
                        displayText: `${getPct(scores?.pronunciation || pronunciationScore, 82)}%`,
                        sub: selectedLang === 'EN' 
                          ? 'Accuracy score after 30 days practice' 
                          : 'Puntuación de precisión después de 30 días',
                        prompt: selectedLang === 'EN'
                          ? `[AUTO_SYSTEM: The user clicked on their Pronunciation metric (${getPct(scores?.pronunciation || pronunciationScore, 82)}%). Explain what this metric means, how speech accuracy is evaluated, and what steps to take to improve it. ${metricSupportRuleEn}]`
                          : `[AUTO_SYSTEM: El usuario hizo clic en su métrica de Pronunciación (${getPct(scores?.pronunciation || pronunciationScore, 82)}%). Explícale qué significa esta métrica, cómo se mide la precisión al hablar y qué pasos tomar para mejorarla. ${metricSupportRuleEs}]`
                      },
                      {
                        title: selectedLang === 'EN' ? 'Fluency' : 'Fluidez',
                        val: getPct(scores?.naturalness, 74),
                        displayText: `${getPct(scores?.naturalness, 74)}%`,
                        sub: selectedLang === 'EN' 
                          ? 'Improvement in natural conversation flow' 
                          : 'Mejora en el flujo natural de conversación',
                        prompt: selectedLang === 'EN'
                          ? `[AUTO_SYSTEM: The user clicked on their Fluency metric (${getPct(scores?.naturalness, 74)}%). Explain what this metric means, how conversation flow is evaluated, and actions to improve it. ${metricSupportRuleEn}]`
                          : `[AUTO_SYSTEM: El usuario hizo clic en su métrica de Fluidez (${getPct(scores?.naturalness, 74)}%). Explícale qué significa esta métrica, cómo se evalúa el ritmo conversacional y acciones para mejorarla. ${metricSupportRuleEs}]`
                      },
                      {
                        title: selectedLang === 'EN' ? 'Vocabulary' : 'Vocabulario',
                        val: getPct(scores?.grammar || grammarScore, 88),
                        displayText: `${getPct(scores?.grammar || grammarScore, 88)}%`,
                        sub: selectedLang === 'EN' 
                          ? 'New words retained after real use' 
                          : 'Palabras nuevas retenidas tras su uso real',
                        prompt: selectedLang === 'EN'
                          ? `[AUTO_SYSTEM: The user clicked on their Vocabulary metric (${getPct(scores?.grammar || grammarScore, 88)}%). Explain what this metric means, how word retention is tracked, and strategies to improve active vocabulary. ${metricSupportRuleEn}]`
                          : `[AUTO_SYSTEM: El usuario hizo clic en su métrica de Vocabulario (${getPct(scores?.grammar || grammarScore, 88)}%). Explícale qué significa esta métrica, cómo se registra la retención y estrategias para mejorar el vocabulario activo. ${metricSupportRuleEs}]`
                      },
                      {
                        title: selectedLang === 'EN' ? 'Confidence' : 'Confianza',
                        val: getPct(scores?.confidence, 68),
                        displayText: `${getPct(scores?.confidence, 68)}%`,
                        sub: selectedLang === 'EN' 
                          ? 'Users reporting speaking with more security' 
                          : 'Usuarios que reportan hablar con más seguridad',
                        prompt: selectedLang === 'EN'
                          ? `[AUTO_SYSTEM: The user clicked on their Confidence metric (${getPct(scores?.confidence, 68)}%). Explain what this metric means and practical recommendations on how to build speaking confidence. ${metricSupportRuleEn}]`
                          : `[AUTO_SYSTEM: El usuario hizo clic en su métrica de Confianza (${getPct(scores?.confidence, 68)}%). Explícale qué significa esta métrica y recomendaciones prácticas sobre cómo desarrollar mayor confianza al hablar. ${metricSupportRuleEs}]`
                      }
                    ];

                    const radius = 38;
                    const strokeWidth = 11;
                    const circumference = 2 * Math.PI * radius; // ~238.76

                    return (
                      <div className="bg-white p-3 sm:p-4 rounded-2xl space-y-1">
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-4">
                          {statItems.map((item, idx) => {
                            const pct = Math.max(0, Math.min(100, item.val));
                            const strokeDashoffset = circumference - (pct / 100) * circumference;

                            return (
                              <button
                                key={idx}
                                type="button"
                                onClick={() => {
                                  if ((item as any).onClick) (item as any).onClick();
                                  else if ((item as any).prompt) onAskVoyager((item as any).prompt);
                                }}
                                className="flex flex-col items-center text-center group cursor-pointer hover:scale-[1.04] active:scale-95 transition-all duration-200 focus:outline-none p-1.5 rounded-xl hover:bg-neutral-50/80 border border-transparent hover:border-amber-200/60"
                                title={selectedLang === 'EN' ? `Click to ask Voyager about ${item.title}` : `Haz clic para que Voyager te explique ${item.title}`}
                              >
                                {/* SVG Donut Circle */}
                                <div className="relative w-24 h-24 sm:w-28 sm:h-28 flex items-center justify-center my-0.5">
                                  <svg viewBox="0 0 100 100" className="w-full h-full -rotate-90 transform group-hover:drop-shadow-sm transition-all">
                                    {/* Background Dark Arc */}
                                    <circle
                                      cx="50"
                                      cy="50"
                                      r={radius}
                                      fill="transparent"
                                      stroke="#333333"
                                      strokeWidth={strokeWidth}
                                    />
                                    {/* Foreground Bright Yellow Arc */}
                                    <circle
                                      cx="50"
                                      cy="50"
                                      r={radius}
                                      fill="transparent"
                                      stroke="#FACC15"
                                      strokeWidth={strokeWidth}
                                      strokeDasharray={circumference}
                                      strokeDashoffset={strokeDashoffset}
                                      strokeLinecap="butt"
                                      className="transition-all duration-700 ease-out"
                                    />
                                  </svg>

                                  {/* Percentage / Letter Grade Text Centered */}
                                  <div className="absolute inset-0 flex items-center justify-center">
                                    <span className="text-xl sm:text-2xl font-black font-mono tracking-tight text-neutral-900 group-hover:text-amber-600 transition-colors">
                                      {item.displayText || `${pct}%`}
                                    </span>
                                  </div>
                                </div>

                                {/* Metric Title */}
                                <h5 className="text-xs sm:text-sm font-black text-neutral-900 mt-1 font-mono tracking-tight group-hover:text-amber-600 transition-colors">
                                  {item.title}
                                </h5>

                                {/* Subtitle description */}
                                <p className="text-[10px] sm:text-[11px] text-neutral-600 font-mono mt-0.5 leading-tight max-w-[150px]">
                                  {item.sub}
                                </p>
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })()}
                </div>

                {/* ────── Divider Rule ────── */}
                <div className="w-full my-5 border-t border-slate-200/90" />

                {/* 📊 Student Performance Metrics Section - Instance 2: Lesson Progress */}
                <div className="pt-0.5 pb-1">

                  <div className="flex items-center justify-start gap-2 pb-3 text-left w-full">
                    <BookOpen className="w-5 h-5 text-amber-500 flex-shrink-0" />
                    <span className="text-sm sm:text-[15.5px] font-black tracking-wider text-neutral-800 font-mono text-left">
                      {selectedLang === 'EN' ? 'Lesson Progress' : 'Progreso de Lecciones'}
                    </span>
                  </div>

                  {/* Score Circular Rings Section */}
                  {(() => {
                    const getPct = (val?: number, fallback: number = 80) => {
                      if (val === undefined || val === null || val <= 0) return fallback;
                      if (val <= 5) return Math.min(100, Math.round(val * 20));
                      return Math.min(100, Math.round(val));
                    };

                    const getCefrCode = () => {
                      if (user?.cefrLevel) {
                        const match = String(user.cefrLevel).match(/A1|A2|B1|B2|C1|C2/i);
                        if (match) return match[0].toUpperCase();
                        return String(user.cefrLevel).toUpperCase();
                      }
                      const est = user?.levelEstimate || selectedLevel || '';
                      const match = String(est).match(/A1|A2|B1|B2|C1|C2/i);
                      if (match) return match[0].toUpperCase();
                      if (/beginner|principiante|basic/i.test(est)) return 'A2';
                      if (/intermediate|intermedio/i.test(est)) return 'B2';
                      if (/advanced|avanzado/i.test(est)) return 'C1';
                      return 'B2';
                    };

                    const metricSupportRuleEn = 'RULE: Your role here is strictly to explain this metric/stat to the user and answer questions about how or what to do to improve this score. Do NOT teach an English lesson or engage in conversational English practice.';
                    const metricSupportRuleEs = 'REGLA: Tu rol aquí es estrictamente explicar esta métrica/estadística al usuario y responder preguntas sobre cómo o qué hacer para mejorar este puntaje. NO des una clase de inglés ni inicies práctica conversacional.';

                    const cefrCode = getCefrCode();
                    const cefrPctMap: Record<string, number> = {
                      A1: 25,
                      A2: 45,
                      B1: 65,
                      B2: 80,
                      C1: 90,
                      C2: 100
                    };
                    const cefrRingVal = cefrPctMap[cefrCode] || 80;

                    const civicsMetrics = CivicsProgressTracker.calculateMasteryMetrics();
                    const dailyLifeDone = Math.max(12, user?.completedDays?.length || 12);
                    const totalDailyModules = IMMERSION_CURRICULUM?.length || 60;
                    const dailyLifePct = Math.min(100, Math.round((dailyLifeDone / totalDailyModules) * 100));

                    const statItems = [
                      {
                        title: selectedLang === 'EN' ? 'Level Assessment' : 'Evaluación de Nivel',
                        val: cefrRingVal,
                        displayText: cefrCode,
                        sub: selectedLang === 'EN' 
                          ? `Diagnostic result determining level (${user.levelEstimate || 'Intermediate B2'})` 
                          : `Resultado del examen que determina tu nivel (${user.levelEstimate || 'Intermedio B2'})`,
                        prompt: selectedLang === 'EN'
                          ? `[AUTO_SYSTEM: The user clicked on their Level Assessment metric (${cefrCode}). Explain what CEFR level ${cefrCode} means and recommendations on how to advance to the next level. ${metricSupportRuleEn}]`
                          : `[AUTO_SYSTEM: El usuario hizo clic en su Evaluación de Nivel (${cefrCode}). Explícale qué significa el nivel ${cefrCode} (Marco Común Europeo) y recomendaciones sobre cómo avanzar al siguiente nivel. ${metricSupportRuleEs}]`
                      },
                      {
                        title: selectedLang === 'EN' ? 'Civics 128 Mastery' : 'Progreso Cívica 128',
                        val: civicsMetrics.masteryPercentage,
                        displayText: `${civicsMetrics.masteryPercentage}%`,
                        sub: selectedLang === 'EN' 
                          ? `${civicsMetrics.knownCount} of ${civicsMetrics.totalCount} citizenship questions mastered` 
                          : `${civicsMetrics.knownCount} de ${civicsMetrics.totalCount} preguntas de ciudadanía dominadas`,
                        prompt: selectedLang === 'EN'
                          ? `[AUTO_SYSTEM: The user clicked on their Civics 128 Mastery metric (${civicsMetrics.knownCount} of ${civicsMetrics.totalCount} questions mastered). Explain how this citizenship progress is calculated and how to increase question mastery. ${metricSupportRuleEn}]`
                          : `[AUTO_SYSTEM: El usuario hizo clic en su Progreso de Cívica 128 (${civicsMetrics.knownCount} de ${civicsMetrics.totalCount} preguntas dominadas). Explícale cómo se calcula este avance y cómo incrementar el dominio de preguntas. ${metricSupportRuleEs}]`
                      },
                      {
                        title: selectedLang === 'EN' ? 'Everyday Life Progress' : 'Progreso Vida Diaria',
                        val: dailyLifePct,
                        displayText: `${dailyLifePct}%`,
                        sub: selectedLang === 'EN' 
                          ? `${dailyLifeDone} of ${totalDailyModules} everyday conversation modules completed` 
                          : `${dailyLifeDone} de ${totalDailyModules} módulos de conversación diaria completados`,
                        prompt: selectedLang === 'EN'
                          ? `[AUTO_SYSTEM: The user clicked on their Everyday Life Progress metric (${dailyLifeDone} of ${totalDailyModules} modules, ${dailyLifePct}%). Explain what this module progress means and advice on advancing through remaining modules. ${metricSupportRuleEn}]`
                          : `[AUTO_SYSTEM: El usuario hizo clic en su Progreso de Vida Diaria (${dailyLifeDone} de ${totalDailyModules} módulos completados, ${dailyLifePct}%). Explícale qué significa este avance de módulos y consejos para completar los módulos restantes. ${metricSupportRuleEs}]`
                      }
                    ];

                    const radius = 38;
                    const strokeWidth = 11;
                    const circumference = 2 * Math.PI * radius; // ~238.76

                    return (
                      <div className="bg-white p-3 sm:p-4 rounded-2xl space-y-1">
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-4">
                          {statItems.map((item, idx) => {
                            const pct = Math.max(0, Math.min(100, item.val));
                            const strokeDashoffset = circumference - (pct / 100) * circumference;

                            return (
                              <button
                                key={idx}
                                type="button"
                                onClick={() => item.prompt && onAskVoyager(item.prompt)}
                                className="flex flex-col items-center text-center group cursor-pointer hover:scale-[1.04] active:scale-95 transition-all duration-200 focus:outline-none p-1.5 rounded-xl hover:bg-neutral-50/80 border border-transparent hover:border-amber-200/60"
                                title={selectedLang === 'EN' ? `Click to ask Voyager about ${item.title}` : `Haz clic para que Voyager te explique ${item.title}`}
                              >
                                {/* SVG Donut Circle */}
                                <div className="relative w-24 h-24 sm:w-28 sm:h-28 flex items-center justify-center my-0.5">
                                  <svg viewBox="0 0 100 100" className="w-full h-full -rotate-90 transform group-hover:drop-shadow-sm transition-all">
                                    {/* Background Dark Arc */}
                                    <circle
                                      cx="50"
                                      cy="50"
                                      r={radius}
                                      fill="transparent"
                                      stroke="#333333"
                                      strokeWidth={strokeWidth}
                                    />
                                    {/* Foreground Bright Yellow Arc */}
                                    <circle
                                      cx="50"
                                      cy="50"
                                      r={radius}
                                      fill="transparent"
                                      stroke="#FACC15"
                                      strokeWidth={strokeWidth}
                                      strokeDasharray={circumference}
                                      strokeDashoffset={strokeDashoffset}
                                      strokeLinecap="butt"
                                      className="transition-all duration-700 ease-out"
                                    />
                                  </svg>

                                  {/* Text Centered */}
                                  <div className="absolute inset-0 flex items-center justify-center">
                                    <span className="text-xl sm:text-2xl font-black font-mono tracking-tight text-neutral-900 group-hover:text-amber-600 transition-colors">
                                      {item.displayText || `${pct}%`}
                                    </span>
                                  </div>
                                </div>

                                {/* Metric Title */}
                                <h5 className="text-xs sm:text-sm font-black text-neutral-900 mt-1 font-mono tracking-tight group-hover:text-amber-600 transition-colors">
                                  {item.title}
                                </h5>

                                {/* Subtitle description */}
                                <p className="text-[10px] sm:text-[11px] text-neutral-600 font-mono mt-0.5 leading-tight max-w-[150px]">
                                  {item.sub}
                                </p>
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })()}
                </div>

                {/* ────── Divider Rule ────── */}
                <div className="w-full my-5 border-t border-slate-200/90" />

                {/* 🌟 Recommended Pro Lessons Carousel Section */}
                <RecommendedProLessonsCarousel
                  user={user}
                  scores={scores}
                  pronunciationScore={pronunciationScore}
                  civicsScore={CivicsProgressTracker.calculateMasteryMetrics().masteryPercentage}
                  selectedLang={selectedLang}
                  onAskVoyager={onAskVoyager}
                />

                {/* ────── Divider Rule ────── */}
                <div className="w-full my-5 border-t border-slate-200/90" />

                {/* 📊 Voyager Real Activity Calendar Section */}
                <div className="mt-6 animate-fade-in">
                  <ActivityCalendar 
                    selectedLang={selectedLang}
                    savedChats={savedChatsList}
                    targetGoalMinutes={15}
                    onLoadChat={onLoadChat}
                  />
                </div>
              </div>
            )}

            {activeSubTab === 'level' && (
              <div className="animate-fade-in py-1 space-y-3">
                {/* Student Stats Divider & Section Header */}
                <div className="pt-0.5">
                  <div className="flex items-center gap-2 mb-2">
                    <Activity className="w-5 h-5 text-amber-500" />
                    <span className="text-sm sm:text-[15.5px] font-black uppercase tracking-wider text-neutral-800 font-mono">
                      {selectedLang === 'EN' 
                        ? `Performance Metrics for ${(sanitizeUserProfileNames(user).firstName || 'Federico').toUpperCase()}` 
                        : `ESTADÍSTICAS DE ${(sanitizeUserProfileNames(user).firstName || 'FEDERICO').toUpperCase()}`}
                    </span>
                  </div>

                  {/* Score Circular Rings Section matching exact format from image */}
                  {(() => {
                    const getPct = (val?: number, fallback: number = 80) => {
                      if (val === undefined || val === null || val <= 0) return fallback;
                      if (val <= 5) return Math.min(100, Math.round(val * 20));
                      return Math.min(100, Math.round(val));
                    };

                    const gradeInfo = computeLetterGrade();

                    const statItems = [

                      {
                        title: selectedLang === 'EN' ? 'Pronunciation' : 'Pronunciación',
                        val: getPct(scores?.pronunciation || pronunciationScore, 82),
                        displayText: `${getPct(scores?.pronunciation || pronunciationScore, 82)}%`,
                        sub: selectedLang === 'EN' 
                          ? 'Accuracy score after 30 days practice' 
                          : 'Puntuación de precisión después de 30 días'
                      },
                      {
                        title: selectedLang === 'EN' ? 'Fluency' : 'Fluidez',
                        val: getPct(scores?.naturalness, 74),
                        displayText: `${getPct(scores?.naturalness, 74)}%`,
                        sub: selectedLang === 'EN' 
                          ? 'Improvement in natural conversation flow' 
                          : 'Mejora en el flujo natural de conversación'
                      },
                      {
                        title: selectedLang === 'EN' ? 'Vocabulary' : 'Vocabulario',
                        val: getPct(scores?.grammar || grammarScore, 88),
                        displayText: `${getPct(scores?.grammar || grammarScore, 88)}%`,
                        sub: selectedLang === 'EN' 
                          ? 'New words retained after real use' 
                          : 'Palabras nuevas retenidas tras su uso real'
                      },
                      {
                        title: selectedLang === 'EN' ? 'Confidence' : 'Confianza',
                        val: getPct(scores?.confidence, 68),
                        displayText: `${getPct(scores?.confidence, 68)}%`,
                        sub: selectedLang === 'EN' 
                          ? 'Users reporting speaking with more security' 
                          : 'Usuarios que reportan hablar con más seguridad'
                      }
                    ];

                    const radius = 38;
                    const strokeWidth = 11;
                    const circumference = 2 * Math.PI * radius; // ~238.76

                    return (
                      <div className="bg-white p-3 sm:p-4 rounded-2xl border border-neutral-200/90 shadow-2xs space-y-1">
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-4">
                          {statItems.map((item, idx) => {
                            const pct = Math.max(0, Math.min(100, item.val));
                            const strokeDashoffset = circumference - (pct / 100) * circumference;

                            return (
                              <button
                                key={idx}
                                type="button"
                                onClick={() => (item as any).onClick && (item as any).onClick()}
                                className="flex flex-col items-center text-center group cursor-pointer hover:scale-[1.04] active:scale-95 transition-all duration-200 focus:outline-none p-1.5 rounded-xl hover:bg-neutral-50/80 border border-transparent hover:border-amber-200/60"
                                title={selectedLang === 'EN' ? `Click to ask Voyager about ${item.title}` : `Haz clic para que Voyager te explique ${item.title}`}
                              >
                                {/* SVG Donut Circle */}
                                <div className="relative w-24 h-24 sm:w-28 sm:h-28 flex items-center justify-center my-0.5">
                                  <svg viewBox="0 0 100 100" className="w-full h-full -rotate-90 transform">
                                    {/* Background Dark Arc */}
                                    <circle
                                      cx="50"
                                      cy="50"
                                      r={radius}
                                      fill="transparent"
                                      stroke="#333333"
                                      strokeWidth={strokeWidth}
                                    />
                                    {/* Foreground Bright Yellow Arc */}
                                    <circle
                                      cx="50"
                                      cy="50"
                                      r={radius}
                                      fill="transparent"
                                      stroke="#FACC15"
                                      strokeWidth={strokeWidth}
                                      strokeDasharray={circumference}
                                      strokeDashoffset={strokeDashoffset}
                                      strokeLinecap="butt"
                                      className="transition-all duration-700 ease-out"
                                    />
                                  </svg>

                                  {/* Percentage / Letter Grade Text Centered */}
                                  <div className="absolute inset-0 flex items-center justify-center">
                                    <span className="text-xl sm:text-2xl font-black font-mono tracking-tight text-neutral-900">
                                      {item.displayText || `${pct}%`}
                                    </span>
                                  </div>
                                </div>

                                {/* Metric Title */}
                                <h5 className="text-xs sm:text-sm font-black text-neutral-900 mt-1 font-mono tracking-tight">
                                  {item.title}
                                </h5>

                                 {/* Subtitle description */}
                                <p className="text-[10px] sm:text-[11px] text-neutral-600 font-mono mt-0.5 leading-tight max-w-[150px]">
                                  {item.sub}
                                </p>
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })()}
                </div>

                {/* Minimalist 2-Column Identity / Level Details Card */}
                <div className="flex flex-col md:flex-row items-center md:items-start justify-between gap-3 sm:gap-5 pt-1.5 border-t border-neutral-200/80">
                  
                  {/* Left Column: Avatar */}
                  <div className="w-full md:w-[35%] flex flex-col items-center md:items-start justify-center text-center md:text-left">
                    <div className="relative group flex-shrink-0 w-32 h-32 sm:w-40 sm:h-40">
                      <div 
                        onClick={() => triggerStudentOralReport()}
                        className="w-full h-full rounded-full bg-neutral-100 border-2 border-amber-400/60 hover:border-amber-500 shadow-xs cursor-pointer overflow-hidden flex items-center justify-center transition-all duration-200 hover:scale-[1.03] active:scale-95 group/avatar relative"
                        title={selectedLang === 'EN' ? 'Click photo to hear Voyager oral progress report' : 'Haz clic en la foto para escuchar el informe oral de progreso de Voyager'}
                      >
                        {renderAvatarContent(user)}
                        <div className="absolute inset-0 bg-black/20 opacity-0 group-hover/avatar:opacity-100 transition-opacity flex items-center justify-center pointer-events-none">
                          <Volume2 className="w-8 h-8 text-amber-300 drop-shadow-md animate-pulse" />
                        </div>
                      </div>
                    </div>

                    {/* Icon Action Buttons Below Picture (Flush Left, No Overlap) */}
                    <div className="flex items-center justify-start gap-2 mt-2 flex-wrap">
                      {/* Pencil Edit Profile Button (Swapped from header) */}
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setIsEditingProfile(prev => !prev);
                        }}
                        className="w-8.5 h-8.5 sm:w-9 sm:h-9 rounded-full bg-black text-white hover:bg-neutral-800 border-2 border-white shadow-md flex items-center justify-center transition-all duration-200 hover:scale-105 active:scale-95 cursor-pointer select-none group shrink-0"
                        title={isEditingProfile ? (selectedLang === 'EN' ? 'View Saved Profile' : 'Ver Guardado') : (selectedLang === 'EN' ? 'Edit Profile' : 'Editar Perfil')}
                        aria-label={isEditingProfile ? (selectedLang === 'EN' ? 'View Saved Profile' : 'Ver Guardado') : (selectedLang === 'EN' ? 'Edit Profile' : 'Editar Perfil')}
                      >
                        <Pencil className="w-4 h-4 text-white stroke-[2.2] group-hover:scale-110 transition-transform" />
                      </button>

                      {/* Camera Photo Badge Button */}
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setIsAvatarModalOpen(true);
                        }}
                        className="w-8.5 h-8.5 sm:w-9 sm:h-9 rounded-full bg-black hover:bg-neutral-800 text-white border-2 border-white flex items-center justify-center shadow-md transition-all duration-200 cursor-pointer hover:scale-105 shrink-0 group"
                        title={selectedLang === 'EN' ? 'Change photo' : 'Cambiar foto'}
                      >
                        <Camera className="w-4 h-4 sm:w-4.5 sm:h-4.5 text-white stroke-[2.2] group-hover:scale-110 transition-transform" />
                      </button>

                      {/* Internal Communication Mail Button */}
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setIsMailModalOpen(true);
                        }}
                        className="w-8.5 h-8.5 sm:w-9 sm:h-9 rounded-full bg-black text-white hover:bg-neutral-800 border-2 border-white shadow-md flex items-center justify-center transition-all duration-200 hover:scale-105 active:scale-95 cursor-pointer select-none group shrink-0 relative"
                        title={selectedLang === 'EN' ? 'Internal Communication & Messages' : 'Comunicación Interna y Mensajes'}
                        aria-label={selectedLang === 'EN' ? 'Internal Communication & Messages' : 'Comunicación Interna y Mensajes'}
                      >
                        <Mail className="w-4 h-4 text-white stroke-[2.2] group-hover:scale-110 transition-transform" />
                        <span className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-rose-500 border border-white animate-pulse" />
                      </button>
                    </div>
                  </div>

                  {/* Right Column: Identity / Level Details */}
                  <div className="w-full md:w-[63%] flex flex-col justify-center pt-1 md:pt-2">
                    <div className="grid grid-cols-[130px_1fr] sm:grid-cols-[160px_1fr] gap-y-1.5 sm:gap-y-2 text-xs sm:text-sm leading-snug">
                      
                      <div className="font-bold text-neutral-900">
                        {selectedLang === 'EN' ? 'Name:' : 'Nombre:'}
                      </div>
                      <div className="font-semibold text-neutral-800">
                        {sanitizeUserProfileNames(user).firstName}
                      </div>

                      <div className="font-bold text-neutral-900">
                        {selectedLang === 'EN' ? 'Apellido:' : 'Apellido:'}
                      </div>
                      <div className="font-semibold text-neutral-800">
                        {sanitizeUserProfileNames(user).lastName}
                      </div>
                      
                      <div className="font-bold text-neutral-900">
                        {selectedLang === 'EN' ? 'Category:' : 'Categoría:'}
                      </div>
                      <div className="text-neutral-800">
                        {user.category || (selectedLang === 'EN' ? 'Student' : 'Estudiante')}
                      </div>

                      <div className="font-bold text-neutral-900">
                        {selectedLang === 'EN' ? 'Student ID:' : 'ID Estudiante:'}
                      </div>
                      <div className="font-semibold text-neutral-800">
                        {user.studentId || 'STU-001'}
                      </div>

                      <div className="font-bold text-neutral-900">
                        {selectedLang === 'EN' ? 'Account Status:' : 'Estatus de Cuenta:'}
                      </div>
                      <div className="font-semibold text-emerald-800">
                        {user.plan === 'NORMAL' || user.plan === 'FREE' ? 'NORMAL' : 'PRO'}
                      </div>

                      <div className="font-bold text-neutral-900">
                        {selectedLang === 'EN' ? 'Country:' : 'País:'}
                      </div>
                      <div className="text-neutral-800">
                        {(() => {
                          const c = user.country;
                          const isPlaceholder = !c || c === 'No especificado' || c === 'Not specified';
                          if (isPlaceholder) {
                            return getCountryWithFlag('Guatemala');
                          }
                          return getCountryWithFlag(c);
                        })()}
                      </div>

                      <div className="font-bold text-neutral-900">
                        {selectedLang === 'EN' ? 'Age:' : 'Edad:'}
                      </div>
                      <div className="text-neutral-800">
                        {user.age ?? 63}
                      </div>

                      <div className="font-bold text-neutral-900">
                        {selectedLang === 'EN' ? 'English level:' : 'Nivel de inglés:'}
                      </div>
                      <div className="text-neutral-800">
                        {getTranslatedLevel(user.levelEstimate || 'Intermediate')}
                      </div>

                      <div className="font-bold text-neutral-900">
                        {selectedLang === 'EN' ? 'Education:' : 'Educación:'}
                      </div>
                      <div className="text-neutral-800">
                        {user.education || (selectedLang === 'EN' ? 'University' : 'Universidad')}
                      </div>

                      <div className="font-bold text-neutral-900">
                        {selectedLang === 'EN' ? 'Learning goal:' : 'Meta de aprendizaje:'}
                      </div>
                      <div className="text-neutral-800">
                        {user.goal || (selectedLang === 'EN' ? 'Academic success' : 'Éxito académico')}
                      </div>

                      <div className="font-bold text-neutral-900">
                        {selectedLang === 'EN' ? 'Study time:' : 'Tiempo de estudio:'}
                      </div>
                      <div className="text-neutral-800">
                        {formatStudyTimeCompact(user.timePerWeek)}
                      </div>

                      <div className="font-bold text-neutral-900">
                        {selectedLang === 'EN' ? 'Interests:' : 'Intereses:'}
                      </div>
                      <div className="text-neutral-800">
                        {user.interests || (selectedLang === 'EN' ? 'Travel, technology, music' : 'Viajes, tecnología, música')}
                      </div>

                    </div>
                  </div>

                </div>
              </div>
            )}
            </div>

          {activeSubTab === 'lessons' && (() => {
            const activeCurriculum = curriculumTrack === 'ciudadania' ? CIUDADANIA_CURRICULUM : IMMERSION_CURRICULUM;
            return (
              <div className="animate-fade-in space-y-3 py-1">
                {/* Track Switcher Bar */}
                <div className="flex flex-wrap items-center justify-between gap-2 pb-1.5 border-b border-neutral-200">
                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => setCurriculumTrack('ciudadania')}
                      className={`px-3 py-1.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all cursor-pointer border flex items-center gap-1.5 ${
                        curriculumTrack === 'ciudadania'
                          ? 'bg-red-600 text-white border-red-600 shadow-xs'
                          : 'bg-white text-neutral-800 border-neutral-300 hover:border-black'
                      }`}
                    >
                      <BookOpen className="w-3.5 h-3.5 stroke-[2.5]" />
                      <span>{selectedLang === 'EN' ? 'USCIS Ciudadanía 128' : 'Cívica y Ciudadanía 128'}</span>
                    </button>
                    <button
                      onClick={() => setCurriculumTrack('immersion')}
                      className={`px-3 py-1.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all cursor-pointer border flex items-center gap-1.5 ${
                        curriculumTrack === 'immersion'
                          ? 'bg-red-600 text-white border-red-600 shadow-xs'
                          : 'bg-white text-neutral-800 border-neutral-300 hover:border-black'
                      }`}
                    >
                      <Compass className="w-3.5 h-3.5 stroke-[2.5]" />
                      <span>{selectedLang === 'EN' ? 'English Immersion' : 'Inglés de Inmersión'}</span>
                    </button>
                  </div>
                  <span className="text-[11px] sm:text-xs font-mono font-black bg-neutral-900 text-white px-2.5 py-0.5 rounded-full uppercase tracking-tight shadow-xs">
                    {user.completedDays.length} / {activeCurriculum.length} {selectedLang === 'EN' ? 'Completed' : 'Completados'}
                  </span>
                </div>

                {/* Cards list with scaled fonts, padding, and readable black text */}
                <div className="space-y-2.5 max-h-[400px] overflow-y-auto pr-1">
                  {activeCurriculum.map((day) => {
                    const isCompleted = user.completedDays.includes(day.dayNum);
                    const isLocked = (user.plan || 'FREE') === 'FREE' && day.dayNum > 1;

                    return (
                      <div 
                        key={day.dayNum}
                        className={`p-3 sm:p-3.5 rounded-xl border-[1.5px] transition-all ${
                          isLocked
                            ? 'bg-neutral-100/90 border-neutral-300'
                            : isCompleted 
                              ? 'bg-emerald-50/70 border-emerald-500/60 shadow-xs' 
                              : 'bg-white border-black/20 hover:border-black shadow-xs'
                        }`}
                      >
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                          <div className="flex items-start gap-2.5">
                            {isLocked ? (
                              <div className="mt-0.5 text-black select-none flex-shrink-0">
                                <Lock className="w-5 h-5 stroke-[2.5]" />
                              </div>
                            ) : (
                              <button
                                onClick={() => toggleDayCompleted(day.dayNum)}
                                className="mt-0.5 bg-transparent border-none p-0 cursor-pointer text-black hover:text-emerald-700 flex items-center flex-shrink-0"
                                title={selectedLang === 'EN' ? 'Toggle completed status' : 'Marcar estado de completado'}
                              >
                                {isCompleted ? (
                                  <CheckCircle2 className="w-5.5 h-5.5 text-emerald-600 fill-emerald-100 stroke-[2.5]" />
                                ) : (
                                  <Circle className="w-5.5 h-5.5 text-black stroke-[2]" />
                                )}
                              </button>
                            )}
                            <div className="space-y-0.5">
                              <h5 className="text-xs sm:text-sm font-extrabold leading-snug text-black flex items-center flex-wrap gap-1.5">
                                <span>{curriculumTrack === 'ciudadania' ? `Módulo ${day.dayNum}` : `Day ${day.dayNum}`}: {selectedLang === 'EN' ? day.title : day.titleEs}</span>
                                {isLocked && (
                                  <span className="text-[10px] bg-red-600 text-white font-black uppercase px-1.5 py-0.5 rounded shadow-xs select-none">
                                    PRO
                                  </span>
                                )}
                              </h5>
                              <p className="text-[11px] sm:text-xs text-black font-medium leading-relaxed">
                                {selectedLang === 'EN' ? day.objectives[0] : day.objectivesEs[0]}
                              </p>
                            </div>
                          </div>

                          <div className="flex-shrink-0 self-end sm:self-center pt-0.5 sm:pt-0">
                            {isLocked ? (
                              <button
                                onClick={() => alert(selectedLang === 'EN' 
                                  ? 'This lesson requires a PRO account. Change your account to PRO above to unlock all lessons!'
                                  : 'Esta lección requiere una cuenta PRO. ¡Cambia tu cuenta a PRO arriba para desbloquear todas las lecciones!'
                                )}
                                className="px-2.5 py-1 bg-neutral-200 hover:bg-neutral-300 text-black border border-black/20 rounded-lg text-xs font-black uppercase transition-all flex items-center gap-1 cursor-pointer"
                              >
                                <Lock className="w-3.5 h-3.5 text-black stroke-[2.5]" />
                                <span>{selectedLang === 'EN' ? 'Locked' : 'Bloqueado'}</span>
                              </button>
                            ) : (
                              <button
                                onClick={() => onAskVoyager(selectedLang === 'EN' 
                                  ? (curriculumTrack === 'ciudadania' 
                                    ? `Let's practice the USCIS Ciudadanía 128 Module ${day.dayNum}: ${day.title}. What is the first question?` 
                                    : `Let's practice the Day ${day.dayNum} topic: ${day.title}. What is the first mission?`)
                                  : (curriculumTrack === 'ciudadania'
                                    ? `¡Practiquemos el tema de Ciudadanía y Cívica 128 para el Módulo ${day.dayNum}: ${day.titleEs}! ¿Cuál es la primera pregunta oficial?`
                                    : `¡Practiquemos el tema del Día ${day.dayNum}: ${day.titleEs}! ¿Cuál es la primera misión?`)
                                )}
                                className="px-3 py-1.5 bg-black hover:bg-neutral-800 text-white rounded-lg text-xs font-black uppercase transition-all flex items-center gap-1 cursor-pointer shadow-xs border-none"
                              >
                                <span>{selectedLang === 'EN' ? 'Start' : 'Iniciar'}</span>
                                <ChevronRight className="w-3.5 h-3.5 text-white stroke-[3]" />
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })()}

          {/* Achievements Sub-tab Render */}
          {activeSubTab === 'achievements' && (
            <Achievements
              selectedLang={selectedLang}
              streakCount={user?.completedDays?.length ? Math.max(7, user.completedDays.length) : 7}
              learnedWordsCount={learnedWordsCount || 95}
              completedLessonsCount={user?.completedDays?.length || 12}
              completedDays={user?.completedDays || [1, 2, 3, 4, 5, 6, 7]}
              scores={{
                grammar: grammarScore || 82,
                pronunciation: pronunciationScore || 78,
                naturalness: scores?.naturalness || 88,
                vocabulary: learnedWordsCount || 85
              }}
              onAskVoyager={onAskVoyager}
            />
          )}
        </div>
      </div>


      </div>

      {/* Hidden File Input for Avatar Upload */}
      <input 
        type="file" 
        ref={avatarFileInputRef} 
        accept="image/*" 
        onChange={handleAvatarFileUpload} 
        className="hidden" 
      />

      {/* Avatar Customization Modal */}
      {isAvatarModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-white rounded-2xl max-w-sm w-full p-5 shadow-2xl border border-neutral-200 text-left space-y-4 relative">
            <div className="flex items-center justify-between border-b border-neutral-100 pb-3">
              <h3 className="text-sm font-bold text-neutral-900 font-serif">
                {selectedLang === 'EN' ? 'Customize Profile Avatar' : 'Personalizar Avatar de Perfil'}
              </h3>
              <button 
                type="button"
                onClick={() => setIsAvatarModalOpen(false)}
                className="p-1 text-neutral-400 hover:text-neutral-700 rounded-lg hover:bg-neutral-100 transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Current Avatar Preview */}
            <div className="flex flex-col items-center justify-center py-1">
              <div className="w-24 h-24 rounded-full relative overflow-hidden bg-white shadow-md">
                {renderAvatarContent(user)}
              </div>
              <p className="text-[11px] text-neutral-500 mt-2 font-medium">
                {selectedLang === 'EN' ? 'Selected Avatar' : 'Avatar Seleccionado'}
              </p>
            </div>

            {/* Action 1: Upload Photo */}
            <div className="space-y-1.5">
              <label className="block text-[10px] font-bold uppercase tracking-wider text-neutral-500">
                {selectedLang === 'EN' ? '1. Upload Photo' : '1. Cargar Foto desde tu dispositivo'}
              </label>
              <button
                type="button"
                onClick={() => avatarFileInputRef.current?.click()}
                className="w-full py-2 px-3 bg-red-600 hover:bg-red-700 text-white font-bold text-xs rounded-xl flex items-center justify-center gap-2 transition-colors cursor-pointer shadow-xs"
              >
                <Upload className="w-4 h-4 text-white" />
                <span>{selectedLang === 'EN' ? 'Select Image File...' : 'Seleccionar imagen...'}</span>
              </button>
            </div>

            {/* Action 2: Choose Preset Icon */}
            <div className="space-y-1.5 pt-2 border-t border-neutral-100">
              <label className="block text-[10px] font-bold uppercase tracking-wider text-neutral-500">
                {selectedLang === 'EN' ? '2. Choose Preset Avatar' : '2. Elegir ícono prediseñado'}
              </label>
              
              <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                {/* Female Robot Preset */}
                <button
                  type="button"
                  onClick={() => handleSelectAvatarType('female_robot')}
                  className={`p-2 rounded-xl border flex flex-col items-center justify-center gap-1 transition-all cursor-pointer ${
                    !user.avatarUrl && user.avatarType === 'female_robot' 
                      ? 'border-red-600 bg-red-50 text-red-700 font-bold shadow-xs' 
                      : 'border-neutral-200 hover:border-neutral-300 bg-neutral-50 text-neutral-700'
                  }`}
                  title={selectedLang === 'EN' ? 'Female Robot' : 'Robot Femenino'}
                >
                  <div className="w-8 h-8 rounded-full overflow-hidden">
                    {renderAvatarContent({ name: '', email: '', provider: 'Guest', goal: '', levelEstimate: '', completedDays: [], avatarType: 'female_robot' })}
                  </div>
                  <span className="text-[9px] font-bold">
                    {selectedLang === 'EN' ? 'Robot ♀' : 'Robot ♀'}
                  </span>
                </button>

                {/* Male Robot Preset */}
                <button
                  type="button"
                  onClick={() => handleSelectAvatarType('male_robot')}
                  className={`p-2 rounded-xl border flex flex-col items-center justify-center gap-1 transition-all cursor-pointer ${
                    !user.avatarUrl && user.avatarType === 'male_robot' 
                      ? 'border-red-600 bg-red-50 text-red-700 font-bold shadow-xs' 
                      : 'border-neutral-200 hover:border-neutral-300 bg-neutral-50 text-neutral-700'
                  }`}
                  title={selectedLang === 'EN' ? 'Male Robot' : 'Robot Masculino'}
                >
                  <div className="w-8 h-8 rounded-full overflow-hidden">
                    {renderAvatarContent({ name: '', email: '', provider: 'Guest', goal: '', levelEstimate: '', completedDays: [], avatarType: 'male_robot' })}
                  </div>
                  <span className="text-[9px] font-bold">
                    {selectedLang === 'EN' ? 'Robot ♂' : 'Robot ♂'}
                  </span>
                </button>

                {/* Voyager Robot */}
                <button
                  type="button"
                  onClick={() => handleSelectAvatarType('astronaut')}
                  className={`p-2 rounded-xl border flex flex-col items-center justify-center gap-1 transition-all cursor-pointer ${
                    !user.avatarUrl && user.avatarType === 'astronaut' 
                      ? 'border-red-600 bg-red-50 text-red-700 font-bold shadow-xs' 
                      : 'border-neutral-200 hover:border-neutral-300 bg-neutral-50 text-neutral-700'
                  }`}
                >
                  <div className="w-8 h-8 rounded-full bg-slate-900 flex items-center justify-center p-0.5 overflow-hidden">
                    <img src={voyagerRobot} alt="Voyager" className="w-full h-full object-contain" />
                  </div>
                  <span className="text-[9px] font-bold">
                    Voyager
                  </span>
                </button>

                {/* Student Preset */}
                <button
                  type="button"
                  onClick={() => handleSelectAvatarType('student')}
                  className={`p-2 rounded-xl border flex flex-col items-center justify-center gap-1 transition-all cursor-pointer ${
                    !user.avatarUrl && user.avatarType === 'student' 
                      ? 'border-red-600 bg-red-50 text-red-700 font-bold shadow-xs' 
                      : 'border-neutral-200 hover:border-neutral-300 bg-neutral-50 text-neutral-700'
                  }`}
                >
                  <div className="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center text-sm">
                    🎓
                  </div>
                  <span className="text-[9px] font-bold">
                    {selectedLang === 'EN' ? 'Student' : 'Alumn@'}
                  </span>
                </button>

                {/* Woman Preset */}
                <button
                  type="button"
                  onClick={() => handleSelectAvatarType('woman')}
                  className={`p-2 rounded-xl border flex flex-col items-center justify-center gap-1 transition-all cursor-pointer ${
                    !user.avatarUrl && user.avatarType === 'woman' 
                      ? 'border-red-600 bg-red-50 text-red-700 font-bold shadow-xs' 
                      : 'border-neutral-200 hover:border-neutral-300 bg-neutral-50 text-neutral-700'
                  }`}
                  title={selectedLang === 'EN' ? 'Woman Avatar' : 'Avatar Femenino'}
                >
                  <div className="w-8 h-8 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center">
                    <svg className="w-4.5 h-4.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M19 21v-2a4 4 0 0 0-3-3.87" />
                      <path d="M5 21v-2a4 4 0 0 1 3-3.87" />
                      <circle cx="12" cy="8" r="4" />
                    </svg>
                  </div>
                  <span className="text-[9px] font-bold">
                    {selectedLang === 'EN' ? 'Woman' : 'Mujer'}
                  </span>
                </button>

                {/* Man Preset */}
                <button
                  type="button"
                  onClick={() => handleSelectAvatarType('man')}
                  className={`p-2 rounded-xl border flex flex-col items-center justify-center gap-1 transition-all cursor-pointer ${
                    !user.avatarUrl && user.avatarType === 'man' 
                      ? 'border-red-600 bg-red-50 text-red-700 font-bold shadow-xs' 
                      : 'border-neutral-200 hover:border-neutral-300 bg-neutral-50 text-neutral-700'
                  }`}
                  title={selectedLang === 'EN' ? 'Man Avatar' : 'Avatar Masculino'}
                >
                  <div className="w-8 h-8 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center">
                    <svg className="w-4.5 h-4.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" />
                      <circle cx="12" cy="7" r="4" />
                    </svg>
                  </div>
                  <span className="text-[9px] font-bold">
                    {selectedLang === 'EN' ? 'Man' : 'Hombre'}
                  </span>
                </button>

                {/* Neutral User */}
                <button
                  type="button"
                  onClick={() => handleSelectAvatarType('user')}
                  className={`p-2 rounded-xl border flex flex-col items-center justify-center gap-1 transition-all cursor-pointer ${
                    !user.avatarUrl && (user.avatarType === 'user' || !user.avatarType) 
                      ? 'border-red-600 bg-red-50 text-red-700 font-bold shadow-xs' 
                      : 'border-neutral-200 hover:border-neutral-300 bg-neutral-50 text-neutral-700'
                  }`}
                >
                  <div className="w-8 h-8 rounded-full bg-white border border-neutral-300 text-neutral-600 flex items-center justify-center">
                    <User className="w-4.5 h-4.5" />
                  </div>
                  <span className="text-[9px] font-bold">
                    {selectedLang === 'EN' ? 'User' : 'Usuario'}
                  </span>
                </button>
              </div>
            </div>

            {/* Remove Custom Photo if present */}
            {user.avatarUrl && (
              <div className="pt-1.5 border-t border-neutral-100 text-center">
                <button
                  type="button"
                  onClick={() => {
                    const updated = { ...user, avatarUrl: undefined, avatarType: 'user' as const };
                    saveUser(updated);
                  }}
                  className="text-xs text-red-600 hover:text-red-700 font-bold underline cursor-pointer"
                >
                  {selectedLang === 'EN' ? 'Remove custom photo' : 'Quitar foto personal'}
                </button>
              </div>
            )}

            <div className="pt-2 flex justify-end border-t border-neutral-100">
              <button
                type="button"
                onClick={() => setIsAvatarModalOpen(false)}
                className="px-4 py-1.5 bg-neutral-800 hover:bg-black text-white font-bold text-xs rounded-xl cursor-pointer transition-colors"
              >
                {selectedLang === 'EN' ? 'Close' : 'Cerrar'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Internal Communication Mail Modal */}
      {isMailModalOpen && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fade-in"
          onClick={() => setIsMailModalOpen(false)}
        >
          <div 
            className="bg-white text-neutral-900 rounded-[28px] max-w-xl w-full p-5 sm:p-6 shadow-2xl border-2 border-amber-400 space-y-4 max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-3 border-b border-neutral-200">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-full bg-black text-white flex items-center justify-center shadow-sm shrink-0">
                  <Mail className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h3 className="font-extrabold text-neutral-900 text-base sm:text-lg leading-tight">
                    {selectedLang === 'EN' ? 'Internal Communication & Messages' : 'Comunicación Interna y Mensajes'}
                  </h3>
                  <p className="text-xs text-neutral-500 font-normal">
                    {selectedLang === 'EN' ? 'Direct messages with Voyager AI & Academic Team' : 'Bandeja directa con Voyager IA y el Equipo Académico'}
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setIsMailModalOpen(false)}
                className="w-8 h-8 rounded-full bg-neutral-100 hover:bg-neutral-200 text-neutral-700 flex items-center justify-center transition-colors cursor-pointer shrink-0"
              >
                <X className="w-4.5 h-4.5" />
              </button>
            </div>

            {/* Notification Toast */}
            {mailSentToast && (
              <div className="p-3 bg-emerald-100 border border-emerald-400 text-emerald-900 text-xs sm:text-sm font-semibold rounded-xl flex items-center gap-2 animate-fade-in shadow-2xs">
                <span>✅</span>
                <span>{mailSentToast}</span>
              </div>
            )}

            {/* Tab Nav: Inbox vs Compose */}
            <div className="flex items-center gap-2 p-1 bg-neutral-100 rounded-xl border border-neutral-200">
              <button
                type="button"
                onClick={() => setMailTab('inbox')}
                className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                  mailTab === 'inbox' 
                    ? 'bg-black text-white shadow-xs' 
                    : 'text-neutral-600 hover:text-neutral-900 hover:bg-neutral-200/60'
                }`}
              >
                <Mail className="w-3.5 h-3.5" />
                <span>{selectedLang === 'EN' ? `Inbox (${mailMessages.length})` : `Bandeja de Entrada (${mailMessages.length})`}</span>
              </button>

              <button
                type="button"
                onClick={() => setMailTab('compose')}
                className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                  mailTab === 'compose' 
                    ? 'bg-black text-white shadow-xs' 
                    : 'text-neutral-600 hover:text-neutral-900 hover:bg-neutral-200/60'
                }`}
              >
                <Pencil className="w-3.5 h-3.5" />
                <span>{selectedLang === 'EN' ? 'Send Message' : 'Enviar Mensaje Interno'}</span>
              </button>
            </div>

            {/* Content: Inbox Tab */}
            {mailTab === 'inbox' && (
              <div className="space-y-3">
                {mailMessages.map((msg) => (
                  <div 
                    key={msg.id}
                    className="p-3.5 sm:p-4 rounded-2xl border border-neutral-200 hover:border-amber-400/80 bg-slate-50/70 transition-all space-y-1.5"
                  >
                    <div className="flex items-center justify-between gap-2 flex-wrap">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-black text-neutral-900">{msg.sender}</span>
                        <span className="text-[10px] px-2 py-0.5 rounded-full font-bold bg-amber-100 text-amber-900 border border-amber-300">
                          {msg.tag}
                        </span>
                      </div>
                      <span className="text-[11px] font-normal text-neutral-500">{msg.date}</span>
                    </div>

                    <h4 className="text-xs sm:text-sm font-bold text-neutral-800">{msg.subject}</h4>
                    <p className="text-xs text-neutral-600 font-normal leading-relaxed">{msg.body}</p>
                  </div>
                ))}
              </div>
            )}

            {/* Content: Compose Tab */}
            {mailTab === 'compose' && (
              <div className="space-y-3 pt-1">
                <div>
                  <label className="block text-xs font-bold text-neutral-800 mb-1">
                    {selectedLang === 'EN' ? 'Recipient' : 'Destinatario'}
                  </label>
                  <select
                    value={mailRecipient}
                    onChange={(e: any) => setMailRecipient(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-neutral-50 border border-neutral-300 rounded-xl text-xs font-medium text-neutral-900 focus:outline-none focus:border-amber-500"
                  >
                    <option value="Voyager AI">🤖 Tutor IA Voyager (Respuesta con voz)</option>
                    <option value="Equipo Académico">🎓 Equipo Académico y Docencia USA Voyager</option>
                    <option value="Docentes">👨‍🏫 Coordinación de Profesores</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-neutral-800 mb-1">
                    {selectedLang === 'EN' ? 'Subject' : 'Asunto'}
                  </label>
                  <input
                    type="text"
                    value={mailSubject}
                    onChange={(e) => setMailSubject(e.target.value)}
                    placeholder={selectedLang === 'EN' ? 'e.g. Question about my progress grade...' : 'Ej. Consulta sobre mi calificación o progreso...'}
                    className="w-full px-3.5 py-2.5 bg-neutral-50 border border-neutral-300 rounded-xl text-xs font-medium text-neutral-900 focus:outline-none focus:border-amber-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-neutral-800 mb-1">
                    {selectedLang === 'EN' ? 'Internal Message Body' : 'Cuerpo del Mensaje Interno'}
                  </label>
                  <textarea
                    rows={4}
                    value={mailBody}
                    onChange={(e) => setMailBody(e.target.value)}
                    placeholder={selectedLang === 'EN' ? 'Write your message to the academic team or Voyager...' : 'Escribe tu mensaje o consulta directa para el equipo académico o Voyager...'}
                    className="w-full px-3.5 py-2.5 bg-neutral-50 border border-neutral-300 rounded-xl text-xs font-medium text-neutral-900 focus:outline-none focus:border-amber-500 resize-none"
                  />
                </div>

                <div className="pt-2 flex items-center justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setMailTab('inbox')}
                    className="px-4 py-2 bg-neutral-100 hover:bg-neutral-200 text-neutral-800 rounded-xl font-bold text-xs cursor-pointer transition-colors"
                  >
                    {selectedLang === 'EN' ? 'Cancel' : 'Cancelar'}
                  </button>

                  <button
                    type="button"
                    onClick={handleSendInternalMail}
                    disabled={!mailBody.trim()}
                    className={`px-5 py-2 rounded-xl font-bold text-xs flex items-center gap-1.5 shadow-sm transition-all cursor-pointer active:scale-95 ${
                      mailBody.trim()
                        ? 'bg-amber-400 hover:bg-amber-500 text-black border border-amber-500'
                        : 'bg-neutral-200 text-neutral-400 border border-neutral-300 cursor-not-allowed'
                    }`}
                  >
                    <Mail className="w-3.5 h-3.5" />
                    <span>{selectedLang === 'EN' ? 'Send Message' : 'Enviar Mensaje'}</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

    </div>
  );
};
