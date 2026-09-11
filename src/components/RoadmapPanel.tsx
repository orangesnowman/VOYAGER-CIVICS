import React, { useState, useEffect } from 'react';
import { User, LogOut, Compass, Calendar, Award, CheckCircle2, Circle, Target, ChevronRight, Mail, Key, Users, Sparkles, Activity, BookOpen, Volume2, Apple, Lock, Bot, MessageSquare, Pause, TrendingUp, Play, Flame, Camera, Upload, X, Globe, Heart, Clock, Settings, Pencil, Plus, Tag, Check } from 'lucide-react';
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
  let rawName = (profile.name || '').replace(/\(Admin\)/gi, '').trim();
  let rawFirst = (profile.firstName || '').replace(/\(Admin\)/gi, '').trim();
  let rawLast = (profile.lastName || '').replace(/\(Admin\)/gi, '').trim();

  // Deduplicate repeated adjacent words in rawFirst if present
  if (rawFirst.includes(' ')) {
    const firstWords = rawFirst.split(/\s+/);
    const uniqueFirstWords = firstWords.filter((w, i) => i === 0 || w.toLowerCase() !== firstWords[i - 1].toLowerCase());
    rawFirst = uniqueFirstWords[0] || 'Federico';
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
    rawFirst = nameParts[0] || 'Federico';
    if (!rawLast && nameParts.length > 1) {
      rawLast = nameParts.slice(1).join(' ');
    }
  }

  if (!rawFirst) rawFirst = 'Federico';
  if (!rawLast) rawLast = 'Sandoval';

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
  activeSubTab: externalActiveSubTab,
  onSelectSubTab
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

  const defaultUser: UserProfile = {
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
    const isLoggedIn = Boolean(auth.currentUser);
    const adminPhoto = isLoggedIn && typeof window !== 'undefined' ? (localStorage.getItem('voyager_admin_photo_url') || auth.currentUser?.photoURL || undefined) : undefined;
    const saved = typeof window !== 'undefined' ? localStorage.getItem('voyager_user_account') : null;
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed) {
          const resolvedPhoto = isLoggedIn ? (parsed.avatarUrl || parsed.photoURL || adminPhoto) : undefined;
          const names = sanitizeUserProfileNames(parsed);
          return {
            ...defaultUser,
            ...parsed,
            name: names.fullName,
            firstName: names.firstName,
            lastName: names.lastName,
            avatarUrl: resolvedPhoto,
            avatarType: parsed.avatarType || (resolvedPhoto ? 'custom' : 'user')
          };
        }
      } catch (e) {}
    }
    const defaultNames = sanitizeUserProfileNames(defaultUser);
    return {
      ...defaultUser,
      name: defaultNames.fullName,
      firstName: defaultNames.firstName,
      lastName: defaultNames.lastName,
      avatarUrl: adminPhoto,
      avatarType: adminPhoto ? 'custom' : 'user'
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
  const [isEditingProfile, setIsEditingProfile] = useState(false);
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
        setSavedChatsCount(raw ? JSON.parse(raw).length : 0);
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
      setEditAge(user.age ?? 21);
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
    const noTutoringRule = 'REGLA INQUEBRANTABLE: NO intentes enseñar inglés, NO invites al usuario a practicar inglés, NO inicies juegos de conversación en inglés y NO ofrezcas lecciones. Tu único trabajo aquí es explicar en español la información de esta subsección del Perfil del usuario, y preguntarle amigablemente si tiene alguna duda sobre la información mostrada.';
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

  // Load user from storage on mount
  useEffect(() => {
    // Check Firebase auth state and sync with Firestore
    const unsubscribe = auth.onAuthStateChanged(async (fbUser) => {
      if (fbUser) {
        try {
          const synced = await syncOrMigrateUserOnAuth(fbUser);
          const localCache = getLocalProfileCache() || {};
          const mergedData = { ...defaultUser, ...localCache, ...synced };
          const names = sanitizeUserProfileNames(mergedData);
          const newUser: UserProfile = {
            ...mergedData,
            name: names.fullName,
            firstName: names.firstName,
            lastName: names.lastName,
            email: mergedData.email || fbUser.email || 'learner@usavoyager.com',
            provider: (fbUser.providerData?.[0]?.providerId === 'google.com' ? 'Google' : (mergedData.provider || 'Email')) as any,
            goal: mergedData.goal || 'Academic success',
            levelEstimate: mergedData.levelEstimate || 'Intermediate',
            completedDays: mergedData.completedDays || [1],
            country: mergedData.country || 'Guatemala',
            age: mergedData.age ?? 63,
            plan: (mergedData.plan as any) || 'FREE',
            avatarUrl: fbUser.photoURL || mergedData.photoURL || mergedData.avatarUrl || (typeof window !== 'undefined' ? localStorage.getItem('voyager_admin_photo_url') : undefined) || undefined,
            avatarType: (fbUser.photoURL || mergedData.photoURL || mergedData.avatarUrl) ? 'custom' : ((mergedData.avatarType as any) || 'user')
          };
          setUser(newUser);
        } catch (err) {
          console.error('Error syncing user on auth state change:', err);
        }
      } else {
        try {
          localStorage.removeItem('voyager_admin_photo_url');
        } catch (e) {}
        setUser((prev) => ({
          ...prev,
          avatarUrl: undefined,
          photoURL: undefined,
          avatarType: (prev.avatarType && prev.avatarType !== 'custom' ? prev.avatarType : 'user')
        }));
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
      localStorage.removeItem('voyager_user_account');
    } catch (e) {}
    if (onLogout) onLogout();
    const loggedOutUser: UserProfile = {
      ...defaultUser,
      avatarUrl: undefined,
      photoURL: undefined,
      avatarType: 'user'
    };
    saveUser(loggedOutUser);
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
      interests: editInterests.trim() || user.interests || (selectedLang === 'EN' ? 'Travel, technology, music' : 'Viajes, tecnología, música')
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
              <div className="animate-fade-in py-1 space-y-6">

                {/* 📊 Student Performance Metrics (Top / First Row) */}
                <div className="pt-0.5 pb-1">
                  <div className="flex items-center gap-2 mb-2">
                    <Activity className="w-5 h-5 text-amber-500" />
                    <span className="text-sm sm:text-[15.5px] font-black uppercase tracking-wider text-neutral-800 font-mono">
                      {selectedLang === 'EN' 
                        ? `Performance Metrics for ${(sanitizeUserProfileNames(user).firstName || 'Federico').toUpperCase()}` 
                        : `ESTADÍSTICAS DE ${(sanitizeUserProfileNames(user).firstName || 'FEDERICO').toUpperCase()}`}
                    </span>
                  </div>

                  {/* Score Circular Rings Section */}
                  {(() => {
                    const getPct = (val?: number, fallback: number = 80) => {
                      if (val === undefined || val === null || val <= 1) return fallback;
                      if (val <= 5) return Math.min(100, Math.round(val * 20));
                      return Math.min(100, Math.round(val));
                    };

                    const statItems = [
                      {
                        title: selectedLang === 'EN' ? 'Pronunciation' : 'Pronunciación',
                        val: getPct(scores?.pronunciation || pronunciationScore, 82),
                        sub: selectedLang === 'EN' 
                          ? 'Accuracy score after 30 days practice' 
                          : 'Puntuación de precisión después de 30 días'
                      },
                      {
                        title: selectedLang === 'EN' ? 'Fluency' : 'Fluidez',
                        val: getPct(scores?.naturalness, 74),
                        sub: selectedLang === 'EN' 
                          ? 'Improvement in natural conversation flow' 
                          : 'Mejora en el flujo natural de conversación'
                      },
                      {
                        title: selectedLang === 'EN' ? 'Vocabulary' : 'Vocabulario',
                        val: getPct(scores?.grammar || grammarScore, 88),
                        sub: selectedLang === 'EN' 
                          ? 'New words retained after real use' 
                          : 'Palabras nuevas retenidas tras su uso real'
                      },
                      {
                        title: selectedLang === 'EN' ? 'Confidence' : 'Confianza',
                        val: getPct(scores?.confidence, 68),
                        sub: selectedLang === 'EN' 
                          ? 'Users reporting speaking with more security' 
                          : 'Usuarios que reportan hablar con más seguridad'
                      }
                    ];

                    const radius = 38;
                    const strokeWidth = 11;
                    const circumference = 2 * Math.PI * radius; // ~238.76

                    return (
                      <div className="bg-white p-3 sm:p-4 rounded-2xl space-y-1">
                        <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-4">
                          {statItems.map((item, idx) => {
                            const pct = Math.max(0, Math.min(100, item.val));
                            const strokeDashoffset = circumference - (pct / 100) * circumference;

                            return (
                              <div key={idx} className="flex flex-col items-center text-center group">
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

                                  {/* Percentage Text Centered */}
                                  <div className="absolute inset-0 flex items-center justify-center">
                                    <span className="text-xl sm:text-2xl font-black font-mono tracking-tight text-neutral-900">
                                      {pct}%
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
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })()}
                </div>

                {/* Minimalist 2-Column Identity Card */}
                <div className="flex flex-col md:flex-row items-center md:items-start justify-between gap-6 sm:gap-10 pt-2">
                  
                  {/* Left Column (approx 30-35% width): Avatar */}
                  <div className="w-full md:w-[35%] flex flex-col items-start justify-start text-left">
                    {/* Circular Avatar Container with Camera Icon & Gear Logout Badge on Border */}
                    <div className="relative group flex-shrink-0 w-36 h-36 sm:w-44 sm:h-44">
                      {/* Avatar Circle */}
                      <div 
                        onClick={async () => {
                          if (!auth.currentUser) {
                            try {
                              const res = await googleSignIn();
                              if (res?.user) {
                                const synced = await syncOrMigrateUserOnAuth(res.user);
                                const rawEmail = (synced.email || res.user.email || '').toLowerCase().trim();
                                const isAdminUser = rawEmail === 'theorangesnowman@gmail.com';
                                const finalName = isAdminUser ? 'Federico Sandoval (Admin)' : (synced.name || res.user.displayName || 'Google Learner');
                                const photoURL = res.user.photoURL || synced.photoURL || synced.avatarUrl || '';
                                const updatedUser: UserProfile = {
                                  ...defaultUser,
                                  ...synced,
                                  name: finalName,
                                  email: isAdminUser ? 'theorangesnowman@gmail.com' : rawEmail,
                                  photoURL,
                                  avatarUrl: photoURL,
                                  avatarType: photoURL ? 'custom' : 'user'
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
                        className="w-full h-full rounded-full bg-neutral-100 border border-neutral-200/80 shadow-xs cursor-pointer overflow-hidden flex items-center justify-center transition-transform duration-200 hover:scale-[1.02]"
                        title={!auth.currentUser ? (selectedLang === 'EN' ? 'Click to login' : 'Haz clic para iniciar sesión') : (selectedLang === 'EN' ? 'Change photo' : 'Cambiar foto')}
                      >
                        {renderAvatarContent(user)}
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
                                <p className="text-[10px] uppercase tracking-wider text-[#FFD700] font-bold">
                                  {selectedLang === 'EN' ? 'Logged Account' : 'Cuenta de Usuario'}
                                </p>
                                <p className="text-xs font-bold text-white truncate">
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
                                className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold text-white/90 hover:bg-white/10 transition-colors text-left cursor-pointer"
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
                                className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-black text-rose-300 hover:bg-rose-500/20 hover:text-rose-200 transition-colors text-left cursor-pointer group"
                              >
                                <LogOut className="w-4 h-4 text-rose-400 group-hover:scale-110 transition-transform shrink-0" />
                                <span>{selectedLang === 'EN' ? 'Log Out' : 'Cerrar Sesión'}</span>
                              </button>
                            </div>
                          </div>
                        </>
                      )}
                    </div>

                    {/* ID, Status & Edit Link directly under Photo */}
                    <div className="mt-3.5 flex flex-col items-start text-left gap-2 w-full">
                      <span className="font-bold text-slate-800 text-xs sm:text-sm tracking-wide">
                        {user.studentId || 'STU-001'}
                      </span>

                      <div className="inline-flex items-center gap-1.5 p-1 bg-slate-100 border border-slate-200/90 rounded-full shadow-2xs">
                        {/* 1. Photo Editor Button */}
                        <button
                          type="button"
                          onClick={async () => {
                            if (!auth.currentUser) {
                              try {
                                const res = await googleSignIn();
                                if (res?.user) {
                                  const synced = await syncOrMigrateUserOnAuth(res.user);
                                  const rawEmail = (synced.email || res.user.email || '').toLowerCase().trim();
                                  const isAdminUser = rawEmail === 'theorangesnowman@gmail.com';
                                  const finalName = isAdminUser ? 'Federico Sandoval (Admin)' : (synced.name || res.user.displayName || 'Google Learner');
                                  const photoURL = res.user.photoURL || synced.photoURL || synced.avatarUrl || '';
                                  const updatedUser: UserProfile = {
                                    ...defaultUser,
                                    ...synced,
                                    name: finalName,
                                    email: isAdminUser ? 'theorangesnowman@gmail.com' : rawEmail,
                                    photoURL,
                                    avatarUrl: photoURL,
                                    avatarType: photoURL ? 'custom' : 'user'
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
                          className="w-8 h-8 rounded-full bg-white text-slate-800 hover:bg-slate-200/80 hover:text-slate-900 transition-all cursor-pointer flex items-center justify-center shadow-2xs active:scale-95 border border-slate-200/80"
                          title={!auth.currentUser ? (selectedLang === 'EN' ? 'Click to login' : 'Haz clic para iniciar sesión') : (selectedLang === 'EN' ? 'Change photo' : 'Cambiar foto')}
                        >
                          <Camera className="w-4 h-4 text-slate-700 stroke-[2.2]" />
                        </button>

                        {/* 2. Active Account Status Badge */}
                        <div
                          className="w-8 h-8 rounded-full bg-emerald-50 text-emerald-600 transition-all cursor-default flex items-center justify-center shadow-2xs border border-emerald-200/90"
                          title={selectedLang === 'EN' ? 'Active Account' : 'Cuenta Activa'}
                        >
                          <Check className="w-4.5 h-4.5 text-emerald-600 stroke-[3]" />
                        </div>

                        {/* 3. Edit Answers Button */}
                        {!isEditingProfile ? (
                          <button
                            type="button"
                            onClick={() => setIsEditingProfile(true)}
                            className="w-8 h-8 rounded-full bg-white text-emerald-700 hover:bg-emerald-50 hover:text-emerald-800 transition-all cursor-pointer flex items-center justify-center shadow-2xs active:scale-95 border border-slate-200/80"
                            title={selectedLang === 'EN' ? 'Edit Profile Answers' : 'Editar Respuestas'}
                          >
                            <Pencil className="w-4 h-4 stroke-[2.2]" />
                          </button>
                        ) : (
                          <button
                            type="button"
                            onClick={() => setIsEditingProfile(false)}
                            className="w-8 h-8 rounded-full bg-slate-200 text-slate-800 hover:bg-slate-300 transition-all cursor-pointer flex items-center justify-center shadow-2xs active:scale-95 border border-slate-300"
                            title={selectedLang === 'EN' ? 'View Saved Profile' : 'Ver Guardado'}
                          >
                            <X className="w-4 h-4 stroke-[2.2]" />
                          </button>
                        )}

                        {/* 4. Log Out Button */}
                        <button
                          type="button"
                          onClick={handleLogout}
                          className="w-8 h-8 rounded-full bg-white text-rose-600 hover:bg-rose-50 hover:text-rose-700 transition-all cursor-pointer flex items-center justify-center shadow-2xs active:scale-95 border border-slate-200/80"
                          title={selectedLang === 'EN' ? 'Log Out' : 'Cerrar Sesión'}
                        >
                          <LogOut className="w-4 h-4 text-rose-600 stroke-[2.2]" />
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Right Column: Clean Label-Value Identity Details or Onboarding Editor Card */}
                  {isEditingProfile ? (
                    <div className="w-full md:w-[65%] flex flex-col bg-white p-5 sm:p-6 rounded-[24px] border-2 border-amber-400 shadow-xl animate-fade-in text-neutral-900">
                      {/* Header with Save/Cancel Controls */}
                      <div className="mb-4 pb-3 border-b border-neutral-200">
                        <div className="flex items-center justify-between gap-2 flex-wrap">
                          <div className="flex items-center gap-2">
                            <h3 className="font-black text-neutral-900 text-base sm:text-lg">
                              {selectedLang === 'EN' ? 'Update Onboarding Answers' : 'Actualizar Respuestas de Registro'}
                            </h3>
                          </div>

                          <button
                            type="button"
                            onClick={() => setIsEditingProfile(false)}
                            className="px-3 py-1.5 bg-neutral-100 hover:bg-neutral-200 text-neutral-800 rounded-xl font-bold text-xs flex items-center gap-1.5 cursor-pointer transition-all active:scale-95 border border-neutral-300 shadow-2xs"
                          >
                            <span>{selectedLang === 'EN' ? 'View Saved Profile' : 'Ver Guardado'}</span>
                          </button>
                        </div>
                        <p className="text-xs font-medium text-neutral-600 mt-1">
                          {selectedLang === 'EN'
                            ? 'Modify your responses to personalize your learning path and AI tutor instructions.'
                            : 'Modifica tus respuestas para personalizar tu ruta de aprendizaje e instrucciones del tutor IA.'}
                        </p>
                      </div>

                      {/* Toast Notification */}
                      {saveNotification && (
                        <div className="mb-4 p-3 bg-emerald-100 border border-emerald-400 text-emerald-950 font-black rounded-xl text-xs sm:text-sm flex items-center gap-2 animate-fade-in shadow-2xs">
                          <span>{saveNotification}</span>
                        </div>
                      )}

                      <div className="space-y-4">
                        {/* Section 1: Personal Info */}
                        <div className="bg-amber-50/70 p-3.5 sm:p-4 rounded-2xl border border-amber-200/80">
                          <h4 className="text-xs font-black uppercase tracking-wider text-amber-900 mb-2.5 flex items-center gap-1.5">
                            {selectedLang === 'EN' ? 'Personal Information' : 'Información Personal'}
                          </h4>
                          
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-3">
                            <div>
                              <label className="block font-bold text-neutral-800 text-xs mb-1">
                                {selectedLang === 'EN' ? 'First Name' : 'Nombre'}
                              </label>
                              <input
                                type="text"
                                value={editFirstName}
                                onChange={(e) => setEditFirstName(e.target.value)}
                                className="w-full px-3.5 py-2 bg-white border border-neutral-300 rounded-xl font-bold text-neutral-900 focus:outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 text-xs sm:text-sm"
                                placeholder="Federico"
                              />
                            </div>

                            <div>
                              <label className="block font-bold text-neutral-800 text-xs mb-1">
                                {selectedLang === 'EN' ? 'Last Name' : 'Apellido'}
                              </label>
                              <input
                                type="text"
                                value={editLastName}
                                onChange={(e) => setEditLastName(e.target.value)}
                                className="w-full px-3.5 py-2 bg-white border border-neutral-300 rounded-xl font-bold text-neutral-900 focus:outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 text-xs sm:text-sm"
                                placeholder="Sandoval"
                              />
                            </div>
                          </div>

                          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                            <div>
                              <label className="block font-bold text-neutral-800 text-xs mb-1">
                                {selectedLang === 'EN' ? 'Category' : 'Categoría'}
                              </label>
                              <select
                                value={editCategory}
                                onChange={(e) => setEditCategory(e.target.value)}
                                className="w-full px-3.5 py-2 bg-white border border-neutral-300 rounded-xl font-bold text-neutral-900 focus:outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 text-xs sm:text-sm"
                              >
                                <option value="Estudiante">{selectedLang === 'EN' ? 'Student' : 'Estudiante'}</option>
                                <option value="Profesional">{selectedLang === 'EN' ? 'Professional' : 'Profesional'}</option>
                                <option value="Viajante">{selectedLang === 'EN' ? 'Traveler' : 'Viajante'}</option>
                                <option value="Docente">{selectedLang === 'EN' ? 'Teacher' : 'Docente'}</option>
                              </select>
                            </div>

                            <div>
                              <label className="block font-bold text-neutral-800 text-xs mb-1">
                                {selectedLang === 'EN' ? 'Country' : 'País'}
                              </label>
                              <select
                                value={editCountry}
                                onChange={(e) => setEditCountry(e.target.value)}
                                className="w-full px-3.5 py-2 bg-white border border-neutral-300 rounded-xl font-bold text-neutral-900 focus:outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 text-xs sm:text-sm"
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
                              <label className="block font-bold text-neutral-800 text-xs mb-1">
                                {selectedLang === 'EN' ? 'Age' : 'Edad'}
                              </label>
                              <input
                                type="number"
                                value={editAge}
                                onChange={(e) => setEditAge(e.target.value)}
                                min={10}
                                max={100}
                                className="w-full px-3.5 py-2 bg-white border border-neutral-300 rounded-xl font-bold text-neutral-900 focus:outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 text-xs sm:text-sm"
                              />
                            </div>
                          </div>
                        </div>

                        {/* Section 2: Learning Profile */}
                        <div className="bg-blue-50/70 p-3.5 sm:p-4 rounded-2xl border border-blue-200/80">
                          <h4 className="text-xs font-black uppercase tracking-wider text-blue-900 mb-2.5 flex items-center gap-1.5">
                            {selectedLang === 'EN' ? 'Learning Profile' : 'Perfil de Aprendizaje'}
                          </h4>

                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-3">
                            <div>
                              <label className="block font-bold text-neutral-800 text-xs mb-1">
                                {selectedLang === 'EN' ? 'English Level' : 'Nivel de Inglés'}
                              </label>
                              <select
                                value={selectedLevel}
                                onChange={(e) => setSelectedLevel(e.target.value)}
                                className="w-full px-3.5 py-2 bg-white border border-neutral-300 rounded-xl font-bold text-neutral-900 focus:outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 text-xs sm:text-sm"
                              >
                                <option value="Intermediate">{selectedLang === 'EN' ? 'Intermediate (B1-B2)' : 'Intermedio (B1-B2)'}</option>
                                <option value="Beginner">{selectedLang === 'EN' ? 'Beginner (A1-A2)' : 'Principiante (A1-A2)'}</option>
                                <option value="Advanced">{selectedLang === 'EN' ? 'Advanced (C1-C2)' : 'Avanzado (C1-C2)'}</option>
                                <option value="Not Sure">{selectedLang === 'EN' ? 'Not Sure' : 'No estoy seguro'}</option>
                              </select>
                            </div>

                            <div>
                              <label className="block font-bold text-neutral-800 text-xs mb-1">
                                {selectedLang === 'EN' ? 'Education Level' : 'Nivel de Educación'}
                              </label>
                              <select
                                value={editEducation}
                                onChange={(e) => setEditEducation(e.target.value)}
                                className="w-full px-3.5 py-2 bg-white border border-neutral-300 rounded-xl font-bold text-neutral-900 focus:outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 text-xs sm:text-sm"
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
                              <label className="block font-bold text-neutral-800 text-xs mb-1">
                                {selectedLang === 'EN' ? 'Learning Goal' : 'Meta de Aprendizaje'}
                              </label>
                              <select
                                value={selectedGoal}
                                onChange={(e) => setSelectedGoal(e.target.value)}
                                className="w-full px-3.5 py-2 bg-white border border-neutral-300 rounded-xl font-bold text-neutral-900 focus:outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 text-xs sm:text-sm"
                              >
                                <option value="Éxito académico">{selectedLang === 'EN' ? 'Academic success' : 'Éxito académico'}</option>
                                <option value="Inglés profesional y carrera">{selectedLang === 'EN' ? 'Career & Business English' : 'Inglés profesional y carrera'}</option>
                                <option value="Viajes y cultura">{selectedLang === 'EN' ? 'Travel & Culture' : 'Viajes y cultura'}</option>
                                <option value="Cívica 128 y Ciudadanía EE.UU.">{selectedLang === 'EN' ? 'US Civics 128 & Citizenship' : 'Cívica 128 y Ciudadanía EE.UU.'}</option>
                                <option value="Fluidez diaria">{selectedLang === 'EN' ? 'Daily Fluency' : 'Fluidez diaria'}</option>
                              </select>
                            </div>

                            <div>
                              <label className="block font-bold text-neutral-800 text-xs mb-1">
                                {selectedLang === 'EN' ? 'Weekly Study Time' : 'Tiempo de Estudio Semanal'}
                              </label>
                              <select
                                value={formatStudyTimeCompact(editTimePerWeek)}
                                onChange={(e) => setEditTimePerWeek(e.target.value)}
                                className="w-full px-3.5 py-2 bg-white border border-neutral-300 rounded-xl font-bold text-neutral-900 focus:outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 text-xs sm:text-sm"
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
                            <label className="block font-black text-xs uppercase tracking-wider text-purple-900">
                              💡 {selectedLang === 'EN' ? 'Interests & Favorite Topics' : 'Intereses y Temas Favoritos'}
                            </label>
                            <span className="text-[10px] font-extrabold text-purple-700 bg-purple-100 px-2 py-0.5 rounded-full border border-purple-200">
                              {editInterests ? editInterests.split(',').map(s => s.trim()).filter(Boolean).length : 0} {selectedLang === 'EN' ? 'active' : 'activos'}
                            </span>
                          </div>

                          {/* Active Interest Badges */}
                          <div className="flex flex-wrap gap-1.5 min-h-[38px] bg-white p-2.5 rounded-xl border border-neutral-200/90 shadow-2xs">
                            {editInterests && editInterests.split(',').map(s => s.trim()).filter(Boolean).length > 0 ? (
                              editInterests.split(',').map(s => s.trim()).filter(Boolean).map((interest, idx) => (
                                <span
                                  key={idx}
                                  className="inline-flex items-center gap-1.5 px-3 py-1 bg-purple-100 text-purple-950 border border-purple-300 rounded-full text-xs font-black shadow-2xs transition-all hover:bg-purple-200"
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
                              <span className="text-xs font-medium italic text-neutral-400 py-0.5 px-1">
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
                                className="w-full pl-3.5 pr-9 py-2 bg-white border border-neutral-300 rounded-xl font-bold text-neutral-900 focus:outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 text-xs sm:text-sm placeholder:font-normal placeholder:text-neutral-400"
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
                              className={`px-3.5 py-2 rounded-xl font-black text-xs sm:text-sm flex items-center justify-center gap-1.5 shadow-sm transition-all cursor-pointer active:scale-95 ${
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
                            <span className="text-[11px] font-extrabold text-purple-900/80 block mb-1.5">
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
                                    className={`text-[11px] font-bold px-2.5 py-1 rounded-lg border transition-all flex items-center gap-1 cursor-pointer active:scale-95 ${
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
                          className="px-5 py-3 bg-amber-400 hover:bg-amber-500 text-black font-black rounded-xl text-xs sm:text-sm flex items-center justify-center gap-2 shadow-sm transition-all cursor-pointer active:scale-95 border border-amber-500"
                        >
                          <span>💾</span>
                          <span>{selectedLang === 'EN' ? 'Save Changes' : 'Guardar Cambios'}</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => setIsEditingProfile(false)}
                          className="px-5 py-3 bg-neutral-100 hover:bg-neutral-200 text-neutral-800 font-extrabold rounded-xl text-xs sm:text-sm cursor-pointer transition-all active:scale-95 border border-neutral-300"
                        >
                          {selectedLang === 'EN' ? 'Cancel' : 'Cancelar'}
                        </button>
                      </div>
                    </div>
                  ) : (
                    /* LIGHT MODE SAVED VIEW CARD */
                    <div className="w-full md:w-[65%] flex flex-col bg-white p-5 sm:p-6 rounded-[24px] animate-fade-in text-neutral-900">
                      
                      {/* Clean Light Metric Grid */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs sm:text-sm">
                        
                        {/* Nombre */}
                        <div className="py-1.5 px-1">
                          <span className="text-[11px] font-black uppercase tracking-wider text-slate-500 block mb-0.5 font-mono">
                            {selectedLang === 'EN' ? 'First Name' : 'Nombre'}
                          </span>
                          <span className="font-black text-neutral-900 text-sm sm:text-base font-mono tracking-tight">
                            {sanitizeUserProfileNames(user).firstName}
                          </span>
                        </div>

                        {/* Apellido */}
                        <div className="py-1.5 px-1">
                          <span className="text-[11px] font-black uppercase tracking-wider text-slate-500 block mb-0.5 font-mono">
                            {selectedLang === 'EN' ? 'Last Name' : 'Apellido'}
                          </span>
                          <span className="font-black text-neutral-900 text-sm sm:text-base font-mono tracking-tight">
                            {sanitizeUserProfileNames(user).lastName}
                          </span>
                        </div>

                        {/* Categoría */}
                        <div className="py-1.5 px-1">
                          <span className="text-[11px] font-black uppercase tracking-wider text-slate-500 block mb-0.5 font-mono">
                            {selectedLang === 'EN' ? 'Category' : 'Categoría'}
                          </span>
                          <span className="font-black text-neutral-900 text-sm sm:text-base font-mono tracking-tight">
                            {user.category || (selectedLang === 'EN' ? 'Student' : 'Estudiante')}
                          </span>
                        </div>

                        {/* País */}
                        <div className="py-1.5 px-1">
                          <span className="text-[11px] font-black uppercase tracking-wider text-slate-500 block mb-0.5 font-mono">
                            {selectedLang === 'EN' ? 'Country' : 'País'}
                          </span>
                          <span className="font-black text-neutral-900 text-sm sm:text-base font-mono tracking-tight">
                            {user.country ? user.country.replace(/[\uD83C-\uDBFF\uDC00-\uDFFF]/g, '').trim() || user.country : 'Guatemala'}
                          </span>
                        </div>

                        {/* Edad */}
                        <div className="py-1.5 px-1">
                          <span className="text-[11px] font-black uppercase tracking-wider text-slate-500 block mb-0.5 font-mono">
                            {selectedLang === 'EN' ? 'Age' : 'Edad'}
                          </span>
                          <span className="font-black text-neutral-900 text-sm sm:text-base font-mono tracking-tight">
                            {user.age ?? 21}
                          </span>
                        </div>

                        {/* Nivel de Inglés */}
                        <div className="py-1.5 px-1">
                          <span className="text-[11px] font-black uppercase tracking-wider text-slate-500 block mb-0.5 font-mono">
                            {selectedLang === 'EN' ? 'English Level' : 'Nivel de Inglés'}
                          </span>
                          <span className="font-black text-neutral-900 text-sm sm:text-base font-mono tracking-tight">
                            {getTranslatedLevel(user.levelEstimate || 'Intermediate')}
                          </span>
                        </div>

                        {/* Educación */}
                        <div className="py-1.5 px-1">
                          <span className="text-[11px] font-black uppercase tracking-wider text-slate-500 block mb-0.5 font-mono">
                            {selectedLang === 'EN' ? 'Education' : 'Educación'}
                          </span>
                          <span className="font-black text-neutral-900 text-sm sm:text-base font-mono tracking-tight">
                            {user.education || (selectedLang === 'EN' ? 'University' : 'Universidad')}
                          </span>
                        </div>

                        {/* Tiempo de Estudio */}
                        <div className="py-1.5 px-1">
                          <span className="text-[11px] font-black uppercase tracking-wider text-slate-500 block mb-0.5 font-mono">
                            {selectedLang === 'EN' ? 'Study Time' : 'Tiempo de Estudio'}
                          </span>
                          <span className="font-black text-neutral-900 text-sm sm:text-base font-mono tracking-tight">
                            {formatStudyTimeCompact(user.timePerWeek)}
                          </span>
                        </div>

                        {/* Meta de Aprendizaje */}
                        <div className="py-1.5 px-1 sm:col-span-2">
                          <span className="text-[11px] font-black uppercase tracking-wider text-slate-500 block mb-0.5 font-mono">
                            {selectedLang === 'EN' ? 'Learning Goal' : 'Meta de Aprendizaje'}
                          </span>
                          <span className="font-black text-neutral-900 text-sm sm:text-base font-mono tracking-tight">
                            {user.goal || (selectedLang === 'EN' ? 'Travel & Daily Conversation' : 'Travel & Daily Conversation')}
                          </span>
                        </div>

                        {/* Intereses */}
                        <div className="py-1.5 px-1 sm:col-span-2">
                          <span className="text-[11px] font-black uppercase tracking-wider text-slate-500 block mb-0.5 font-mono">
                            {selectedLang === 'EN' ? 'Interests' : 'Intereses'}
                          </span>
                          <span className="font-black text-neutral-900 text-sm sm:text-base font-mono tracking-tight">
                            {user.interests || (selectedLang === 'EN' ? 'Travel, technology, music' : 'Viajes, tecnología, música')}
                          </span>
                        </div>

                      </div>
                    </div>
                  )}

                </div>

                {/* 📊 Student Performance Metrics (Second Row) */}
                <div className="pt-4 border-t border-neutral-200/80">
                  <div className="flex items-center gap-2 mb-2">
                    <Activity className="w-5 h-5 text-amber-500" />
                    <span className="text-sm sm:text-[15.5px] font-black uppercase tracking-wider text-neutral-800 font-mono">
                      {selectedLang === 'EN' 
                        ? `Performance Metrics for ${(sanitizeUserProfileNames(user).firstName || 'Federico').toUpperCase()}` 
                        : `ESTADÍSTICAS DE ${(sanitizeUserProfileNames(user).firstName || 'FEDERICO').toUpperCase()}`}
                    </span>
                  </div>

                  {/* Score Circular Rings Section matching exact format from level tab */}
                  {(() => {
                    const getPct = (val?: number, fallback: number = 80) => {
                      if (val === undefined || val === null || val <= 1) return fallback;
                      if (val <= 5) return Math.min(100, Math.round(val * 20));
                      return Math.min(100, Math.round(val));
                    };

                    const statItems = [
                      {
                        title: selectedLang === 'EN' ? 'Pronunciation' : 'Pronunciación',
                        val: getPct(scores?.pronunciation || pronunciationScore, 82),
                        sub: selectedLang === 'EN' 
                          ? 'Accuracy score after 30 days practice' 
                          : 'Puntuación de precisión después de 30 días'
                      },
                      {
                        title: selectedLang === 'EN' ? 'Fluency' : 'Fluidez',
                        val: getPct(scores?.naturalness, 74),
                        sub: selectedLang === 'EN' 
                          ? 'Improvement in natural conversation flow' 
                          : 'Mejora en el flujo natural de conversación'
                      },
                      {
                        title: selectedLang === 'EN' ? 'Vocabulary' : 'Vocabulario',
                        val: getPct(scores?.grammar || grammarScore, 88),
                        sub: selectedLang === 'EN' 
                          ? 'New words retained after real use' 
                          : 'Palabras nuevas retenidas tras su uso real'
                      },
                      {
                        title: selectedLang === 'EN' ? 'Confidence' : 'Confianza',
                        val: getPct(scores?.confidence, 68),
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
                        <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-4">
                          {statItems.map((item, idx) => {
                            const pct = Math.max(0, Math.min(100, item.val));
                            const strokeDashoffset = circumference - (pct / 100) * circumference;

                            return (
                              <div key={idx} className="flex flex-col items-center text-center group">
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

                                  {/* Percentage Text Centered */}
                                  <div className="absolute inset-0 flex items-center justify-center">
                                    <span className="text-xl sm:text-2xl font-black font-mono tracking-tight text-neutral-900">
                                      {pct}%
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
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })()}
                </div>

                {/* 📊 Student Activity & Real-Time Statistics Section */}
                <div className="mt-8 pt-6 border-t border-neutral-200/80 animate-fade-in">
                  <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
                    <div>
                      <h3 className="font-black text-black text-lg sm:text-xl flex items-center gap-2">
                        <span>
                          {selectedLang === 'EN' ? 'Student Activity & Real-Time Statistics' : 'Estadísticas y Registro de Actividad del Estudiante'}
                        </span>
                      </h3>
                      <p className="text-xs sm:text-sm text-neutral-600 font-medium mt-0.5">
                        {selectedLang === 'EN'
                          ? 'Track your practice sessions, USCIS Civics exam progress, fluency scores, and saved materials.'
                          : 'Consulta el registro en tiempo real de tus sesiones de práctica, progreso de cívica USCIS, calificaciones de inglés y material guardado.'}
                      </p>
                    </div>

                    {onNavigateTab && (
                      <button
                        type="button"
                        onClick={() => onNavigateTab('progress')}
                        className="px-3.5 py-1.5 bg-neutral-900 hover:bg-black text-white font-extrabold text-xs rounded-xl flex items-center gap-1.5 transition-all cursor-pointer shadow-2xs hover:scale-[1.02]"
                      >
                        <span>{selectedLang === 'EN' ? 'Full Progress Report' : 'Ver Informe Completo'}</span>
                      </button>
                    )}
                  </div>

                  {/* Stat Cards Grid */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    {/* Card 1: USCIS Civics Exam Mastery */}
                    <div className="bg-gradient-to-br from-blue-50 to-indigo-50/60 p-4 rounded-2xl border border-blue-200/80 shadow-2xs">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs font-black uppercase tracking-wider text-blue-900 flex items-center gap-1.5">
                          <BookOpen className="w-4 h-4 text-blue-600" />
                          {selectedLang === 'EN' ? 'Civics 128 Questions' : 'Cívica 128 Preguntas'}
                        </span>
                        <span className="text-xs font-black bg-blue-600 text-white px-2 py-0.5 rounded-full">
                          {CivicsProgressTracker.calculateMasteryMetrics().masteryPercentage}%
                        </span>
                      </div>
                      <div className="text-2xl font-black text-blue-950 mb-1">
                        {CivicsProgressTracker.calculateMasteryMetrics().knownCount} <span className="text-xs font-bold text-neutral-500">/ 128</span>
                      </div>
                      <div className="space-y-1 text-xs font-medium text-neutral-700 mt-2 pt-2 border-t border-blue-200/60">
                        <div className="flex items-center gap-1.5">
                          <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                          <span className="font-bold text-emerald-950">{CivicsProgressTracker.calculateMasteryMetrics().knownCount}</span>
                          <span className="text-neutral-600">{selectedLang === 'EN' ? 'Mastered' : 'Dominadas'}</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <span className="w-2 h-2 rounded-full bg-amber-500"></span>
                          <span className="font-bold text-amber-950">{CivicsProgressTracker.calculateMasteryMetrics().reviewCount + CivicsProgressTracker.calculateMasteryMetrics().unsureCount}</span>
                          <span className="text-neutral-600">{selectedLang === 'EN' ? 'In Review' : 'En Revisión'}</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <span className="w-2 h-2 rounded-full bg-slate-300"></span>
                          <span className="font-bold text-slate-800">{CivicsProgressTracker.calculateMasteryMetrics().unattemptedCount}</span>
                          <span className="text-neutral-600">{selectedLang === 'EN' ? 'Pending' : 'Sin Practicar'}</span>
                        </div>
                      </div>
                    </div>

                    {/* Card 2: Speaking & Language Performance */}
                    <div className="bg-gradient-to-br from-emerald-50 to-teal-50/60 p-4 rounded-2xl border border-emerald-200/80 shadow-2xs">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs font-black uppercase tracking-wider text-emerald-900 flex items-center gap-1.5">
                          <Volume2 className="w-4 h-4 text-emerald-600" />
                          {selectedLang === 'EN' ? 'English Fluency' : 'Fluidez e Inglés'}
                        </span>
                        <span className="text-xs font-black bg-emerald-600 text-white px-2 py-0.5 rounded-full">
                          {scores?.confidence || 85}%
                        </span>
                      </div>
                      <div className="text-2xl font-black text-emerald-950 mb-1">
                        {learnedWordsCount || learnedWords?.length || 0} <span className="text-xs font-bold text-neutral-500">{selectedLang === 'EN' ? 'Words' : 'Palabras'}</span>
                      </div>
                      <div className="space-y-1 text-xs font-medium text-neutral-700 mt-2 pt-2 border-t border-emerald-200/60">
                        <div className="flex items-center gap-1.5">
                          <span className="font-bold text-emerald-950">{grammarScore || 90}%</span>
                          <span className="text-neutral-600">{selectedLang === 'EN' ? 'Grammar Score' : 'Gramática'}</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <span className="font-bold text-emerald-950">{pronunciationScore || 88}%</span>
                          <span className="text-neutral-600">{selectedLang === 'EN' ? 'Pronunciation' : 'Pronunciación'}</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <span className="font-bold text-emerald-950">{scores?.naturalness || 85}%</span>
                          <span className="text-neutral-600">{selectedLang === 'EN' ? 'Naturalness' : 'Naturalidad'}</span>
                        </div>
                      </div>
                    </div>

                    {/* Card 3: Study Plan Days & Mock Exams */}
                    <div className="bg-gradient-to-br from-purple-50 to-pink-50/60 p-4 rounded-2xl border border-purple-200/80 shadow-2xs">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs font-black uppercase tracking-wider text-purple-900 flex items-center gap-1.5">
                          <Calendar className="w-4 h-4 text-purple-600" />
                          {selectedLang === 'EN' ? '6-Day Study Sessions' : 'Plan de 6 Días'}
                        </span>
                        <span className="text-xs font-black bg-purple-600 text-white px-2 py-0.5 rounded-full">
                          {CivicsProgressTracker.getOverallStats().completedDaysCount} / 6
                        </span>
                      </div>
                      <div className="text-2xl font-black text-purple-950 mb-1">
                        {CivicsProgressTracker.getOverallStats().completedDaysCount} <span className="text-xs font-bold text-neutral-500">{selectedLang === 'EN' ? 'Days Done' : 'Días Completados'}</span>
                      </div>
                      <div className="space-y-1 text-xs font-medium text-neutral-700 mt-2 pt-2 border-t border-purple-200/60">
                        <div className="flex items-center gap-1.5">
                          <Flame className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                          <span className="font-bold text-purple-950">{user.completedDays?.length || 1} {selectedLang === 'EN' ? 'Day Streak' : 'Días en Racha'}</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <Award className="w-3.5 h-3.5 text-purple-600 shrink-0" />
                          <span className="font-bold text-purple-950">{civicsData.achievements?.length || 1}</span>
                          <span className="text-neutral-600">{selectedLang === 'EN' ? 'Badges Earned' : 'Insignias Ganadas'}</span>
                        </div>
                      </div>
                    </div>

                    {/* Card 4: Saved Conversations & Audio Transcripts */}
                    <div className="bg-gradient-to-br from-amber-50 to-orange-50/60 p-4 rounded-2xl border border-amber-200/80 shadow-2xs">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs font-black uppercase tracking-wider text-amber-900 flex items-center gap-1.5">
                          <MessageSquare className="w-4 h-4 text-amber-600" />
                          {selectedLang === 'EN' ? 'Saved Study Material' : 'Diálogos Guardados'}
                        </span>
                        <span className="text-xs font-black bg-amber-600 text-white px-2 py-0.5 rounded-full">
                          🔖 {savedChatsCount}
                        </span>
                      </div>
                      <div className="text-2xl font-black text-amber-950 mb-1">
                        {savedChatsCount} <span className="text-xs font-bold text-neutral-500">{selectedLang === 'EN' ? 'Saved Chats' : 'Sesiones Guardadas'}</span>
                      </div>
                      <div className="space-y-1 text-xs font-medium text-neutral-700 mt-2 pt-2 border-t border-amber-200/60">
                        <div className="flex items-center gap-1.5">
                          <span className="font-bold text-amber-950">✓ Firestore Sync</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <span className="text-neutral-600">{selectedLang === 'EN' ? 'Audio transcripts stored automatically' : 'Transcripciones guardadas automáticamente'}</span>
                        </div>
                      </div>
                    </div>
                  </div>
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
                      if (val === undefined || val === null || val <= 1) return fallback;
                      if (val <= 5) return Math.min(100, Math.round(val * 20));
                      return Math.min(100, Math.round(val));
                    };

                    const statItems = [
                      {
                        title: selectedLang === 'EN' ? 'Pronunciation' : 'Pronunciación',
                        val: getPct(scores?.pronunciation || pronunciationScore, 82),
                        sub: selectedLang === 'EN' 
                          ? 'Accuracy score after 30 days practice' 
                          : 'Puntuación de precisión después de 30 días'
                      },
                      {
                        title: selectedLang === 'EN' ? 'Fluency' : 'Fluidez',
                        val: getPct(scores?.naturalness, 74),
                        sub: selectedLang === 'EN' 
                          ? 'Improvement in natural conversation flow' 
                          : 'Mejora en el flujo natural de conversación'
                      },
                      {
                        title: selectedLang === 'EN' ? 'Vocabulary' : 'Vocabulario',
                        val: getPct(scores?.grammar || grammarScore, 88),
                        sub: selectedLang === 'EN' 
                          ? 'New words retained after real use' 
                          : 'Palabras nuevas retenidas tras su uso real'
                      },
                      {
                        title: selectedLang === 'EN' ? 'Confidence' : 'Confianza',
                        val: getPct(scores?.confidence, 68),
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
                        <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-4">
                          {statItems.map((item, idx) => {
                            const pct = Math.max(0, Math.min(100, item.val));
                            const strokeDashoffset = circumference - (pct / 100) * circumference;

                            return (
                              <div key={idx} className="flex flex-col items-center text-center group">
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

                                  {/* Percentage Text Centered */}
                                  <div className="absolute inset-0 flex items-center justify-center">
                                    <span className="text-xl sm:text-2xl font-black font-mono tracking-tight text-neutral-900">
                                      {pct}%
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
                              </div>
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
                  <div className="w-full md:w-[35%] flex flex-col items-center justify-center text-center">
                    <div className="relative group flex-shrink-0 w-32 h-32 sm:w-40 sm:h-40">
                      <div 
                        onClick={() => setIsAvatarModalOpen(true)}
                        className="w-full h-full rounded-full bg-neutral-100 border border-neutral-200/80 shadow-xs cursor-pointer overflow-hidden flex items-center justify-center transition-transform duration-200 hover:scale-[1.02]"
                      >
                        {renderAvatarContent(user)}
                      </div>

                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setIsAvatarModalOpen(true);
                        }}
                        className="absolute bottom-1 right-1 sm:bottom-1.5 sm:right-1.5 w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-neutral-900 hover:bg-black text-white border-[3px] border-black ring-2 ring-white flex items-center justify-center shadow-md transition-all duration-200 cursor-pointer hover:scale-105 z-10"
                        title={selectedLang === 'EN' ? 'Change photo' : 'Cambiar foto'}
                      >
                        <Camera className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-white stroke-[2.5]" />
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
                        {user.firstName || (user.name ? user.name.trim().split(/\s+/)[0] : 'Federico')}
                      </div>

                      <div className="font-bold text-neutral-900">
                        {selectedLang === 'EN' ? 'Apellido:' : 'Apellido:'}
                      </div>
                      <div className="font-semibold text-neutral-800">
                        {user.lastName || (user.name ? user.name.trim().split(/\s+/).slice(1).join(' ') : 'Sandoval')}
                      </div>
                      
                      <div className="font-bold text-neutral-900">
                        {selectedLang === 'EN' ? 'Category:' : 'Categoría:'}
                      </div>
                      <div className="text-neutral-800">
                        {user.category || (selectedLang === 'EN' ? 'Student' : 'Estudiante')}
                      </div>

                      <div className="font-bold text-neutral-900">
                        {selectedLang === 'EN' ? 'Country:' : 'País:'}
                      </div>
                      <div className="text-neutral-800">
                        {user.country ? getCountryWithFlag(user.country) : 'Guatemala 🇬🇹'}
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

    </div>
  );
};
