import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { User, LogOut, Compass, Calendar, Award, CheckCircle2, Circle, Target, ChevronRight, ChevronDown, Mail, Key, Users, Sparkles, Activity, BookOpen, Volume2, Apple, Lock, Bot, MessageSquare, Pause, TrendingUp, Play, Flame, Camera, Upload, X, Globe, Heart, Clock, Settings, Pencil, Plus, Tag, Check, History, FileText, Bookmark, Info, Bell, Send, PieChart, FileBadge } from 'lucide-react';
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
import { VoyagerMessagingModal } from './VoyagerMessagingModal';
import { StudentCertificatePreview } from './StudentCertificatePreview';
import { MiniCalendarPicker, calculateAgeFromDate } from './MiniCalendarPicker';
import { getStoredLessonAttempts, LessonEvaluationRecord } from '../domain/LessonGradingSystem';
import { LessonEvaluationsList } from './LessonEvaluationsList';
import { fetchUnifiedStudentAssignments, UnifiedAssignment } from '../services/teacherStudentService';
import { StripePaymentModal } from './StripePaymentModal';
import { getMasterLessons, MasterLesson } from '../data/masterLessonsData';
import { fetchActiveCertificate, fetchCertificateHistory, CEFR_TITLES } from '../services/certificateService';
import certSymA2 from '../assets/images/cert_sym_y_a2_1794971425455.jpg';
import certSymB1 from '../assets/images/cert_sym_y_b1_1794971430724.jpg';
import certSymB2 from '../assets/images/cert_sym_y_b2_1794971428386.jpg';
import certSymC1 from '../assets/images/cert_sym_y_c1_1794971428460.jpg';

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
  isDarkMode?: boolean;
  onStartLesson?: (lesson: any, assignment?: any) => void;
}

interface UserProfile {
  name: string;
  firstName?: string;
  lastName?: string;
  email: string;
  phone?: string;
  city?: string;
  studentId?: string;
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
  birthDate?: string;
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
  onToggleEditProfile,
  isDarkMode = false,
  onStartLesson
}) => {
  const formatStudyTimeCompact = (rawTime?: string): string => {
    const isEn = selectedLang === 'EN';
    if (!rawTime) return isEn ? '5 hrs./week' : '5 hrs./semana';
    const val = rawTime.trim().toLowerCase();
    if (val.includes('2')) return isEn ? '2 hrs./week' : '2 hrs./semana';
    if (val.includes('10')) return isEn ? '10 hrs./week' : '10 hrs./semana';
    if (val.includes('7') || val.includes('diaria') || val.includes('daily')) return isEn ? '7 hrs./week' : '7 hrs./semana';
    if (val.includes('1')) return isEn ? '1 hr./week' : '1 hr./semana';
    if (val.includes('3')) return isEn ? '3 hrs./week' : '3 hrs./semana';
    if (val.includes('4')) return isEn ? '4 hrs./week' : '4 hrs./semana';
    if (val.includes('5')) return isEn ? '5 hrs./week' : '5 hrs./semana';
    return rawTime.replace(/horas/gi, 'hrs.').replace(/hora/gi, 'hr.').replace(/hours/gi, 'hrs.').replace(/hour/gi, 'hr.');
  };

  const formatStudyHoursOption = (rawTime?: string): string => {
    const isEn = selectedLang === 'EN';
    if (!rawTime) return isEn ? '5 hrs./week' : '5 hrs./semana';
    const val = rawTime.trim().toLowerCase();
    if (val.includes('2')) return isEn ? '2 hrs./week' : '2 hrs./semana';
    if (val.includes('10')) return isEn ? '10 hrs./week' : '10 hrs./semana';
    if (val.includes('7') || val.includes('diaria') || val.includes('daily')) return isEn ? '7 hrs./week' : '7 hrs./semana';
    return isEn ? '5 hrs./week' : '5 hrs./semana';
  };

  const formatPhoneNumber = (raw?: string): string => {
    if (!raw) return '+502 34262524';
    let clean = raw.replace(/[()]/g, '').trim();
    if (clean.includes('555') && clean.includes('123-4567')) {
      return '+502 34262524';
    }
    if (clean.startsWith('+')) {
      const afterPlus = clean.slice(1).trim();
      if (afterPlus.includes(' ')) {
        return `+${afterPlus}`;
      }
      if (afterPlus.startsWith('502') && afterPlus.length > 3) {
        return `+502 ${afterPlus.slice(3).trim()}`;
      }
      if (afterPlus.startsWith('1') && afterPlus.length > 1) {
        return `+1 ${afterPlus.slice(1).trim()}`;
      }
      return `+${afterPlus}`;
    }
    if (clean.startsWith('502')) {
      return `+502 ${clean.slice(3).trim()}`;
    }
    if (clean.startsWith('1') && clean.length > 1) {
      return `+1 ${clean.slice(1).trim()}`;
    }
    return `+${clean}`;
  };

  const guestUser: UserProfile = {
    name: selectedLang === 'EN' ? 'Guest Learner' : 'Estudiante Invitado',
    firstName: selectedLang === 'EN' ? 'Guest' : 'Invitado',
    lastName: '',
    email: 'federico.sandoval@example.com',
    phone: '+502 34262524',
    city: selectedLang === 'EN' ? 'Guatemala City' : 'Ciudad de Guatemala',
    studentId: 'STU-001',
    provider: 'Guest',
    category: selectedLang === 'EN' ? 'Student' : 'Estudiante',
    goal: selectedLang === 'EN' ? 'Travel & Daily Conversation' : 'Viajes y conversación diaria',
    levelEstimate: 'Medium',
    country: selectedLang === 'EN' ? 'Not specified' : 'No especificado',
    age: undefined,
    education: selectedLang === 'EN' ? 'General' : 'General',
    interests: selectedLang === 'EN' ? 'English Learning' : 'Aprendizaje de Inglés',
    timePerWeek: '5 hr/wk',
    avatarType: 'user',
    completedDays: [1],
    plan: 'PRO'
  };

  const adminUser: UserProfile = {
    name: 'Federico Sandoval',
    firstName: 'Federico',
    lastName: 'Sandoval',
    email: 'theorangesnowman@gmail.com',
    phone: '+502 34262524',
    city: 'Ciudad de Guatemala',
    studentId: 'STU-001',
    provider: 'Admin',
    category: selectedLang === 'EN' ? 'Student' : 'Estudiante',
    goal: selectedLang === 'EN' ? 'Academic success' : 'Éxito académico',
    levelEstimate: 'Medium',
    country: 'Guatemala',
    age: 63,
    education: selectedLang === 'EN' ? 'University' : 'Universidad',
    interests: selectedLang === 'EN' ? 'Technology, Culture, Travel, Business, Music' : 'Tecnología, Cultura, Viajes, Negocios, Música',
    timePerWeek: '5 hr/wk',
    avatarType: 'user',
    completedDays: [1],
    plan: 'PRO'
  };

  const defaultUser = guestUser;

  const getTranslatedLevel = (lvl: string) => {
    const l = (lvl || '').trim().toLowerCase();
    if (l.includes('medium') || l.includes('medio') || l.includes('intermediate') || l.includes('intermedio') || l.includes('b1') || l.includes('b2')) {
      return selectedLang === 'EN' ? 'Medium (B1-B2)' : 'Medio (B1-B2)';
    }
    if (l.includes('beginner') || l.includes('principiante') || l.includes('a1') || l.includes('a2')) {
      return selectedLang === 'EN' ? 'Beginner (A1-A2)' : 'Principiante (A1-A2)';
    }
    if (l.includes('advanced') || l.includes('avanzado') || l.includes('c1') || l.includes('c2')) {
      return selectedLang === 'EN' ? 'Advanced (C1-C2)' : 'Avanzado (C1-C2)';
    }
    if (l.includes('sure') || l.includes('seguro')) {
      return selectedLang === 'EN' ? 'Not Sure' : 'No estoy seguro';
    }
    return selectedLang === 'EN' ? 'Medium (B1-B2)' : 'Medio (B1-B2)';
  };

  const getTranslatedCategory = (cat?: string) => {
    if (!cat) return selectedLang === 'EN' ? 'Student' : 'Estudiante';
    const c = cat.trim();
    if (selectedLang === 'EN') {
      if (c === 'Estudiante') return 'Student';
      if (c === 'Profesional') return 'Professional';
      if (c === 'Viajante' || c === 'Viajero') return 'Traveler';
      if (c === 'Docente' || c === 'Profesor') return 'Teacher';
      return c;
    } else {
      if (c === 'Student') return 'Estudiante';
      if (c === 'Professional') return 'Profesional';
      if (c === 'Traveler') return 'Viajante';
      if (c === 'Teacher') return 'Docente';
      return c;
    }
  };

  const getTranslatedEducation = (edu?: string) => {
    if (!edu) return selectedLang === 'EN' ? 'University' : 'Universidad';
    const e = edu.trim();
    if (selectedLang === 'EN') {
      if (e === 'Universidad') return 'University';
      if (e === 'Secundaria') return 'High School';
      if (e === 'Posgrado') return 'Postgraduate';
      if (e === 'Autodidacta') return 'Self-Taught';
      return e;
    } else {
      if (e === 'University') return 'Universidad';
      if (e === 'High School' || e === 'Secondary') return 'Secundaria';
      if (e === 'Postgraduate') return 'Posgrado';
      if (e === 'Self-Taught') return 'Autodidacta';
      return e;
    }
  };

  const getTranslatedGoal = (goal?: string) => {
    if (!goal) return selectedLang === 'EN' ? 'Academic success' : 'Éxito académico';
    const g = goal.trim();
    if (selectedLang === 'EN') {
      if (g === 'Éxito académico') return 'Academic success';
      if (g === 'Inglés profesional y carrera') return 'Career & Business English';
      if (g === 'Viajes y conversación diaria') return 'Travel & Daily Conversation';
      if (g === 'Viajes y cultura') return 'Travel & Culture';
      if (g === 'Cívica 128 y Ciudadanía EE.UU.') return 'US Civics 128 & Citizenship';
      if (g === 'Fluidez diaria') return 'Daily Fluency';
      return g;
    } else {
      if (g === 'Travel & Daily Conversation') return 'Viajes y conversación diaria';
      if (g === 'Academic success') return 'Éxito académico';
      if (g === 'Career & Business English') return 'Inglés profesional y carrera';
      if (g === 'Travel & Culture') return 'Viajes y cultura';
      if (g === 'US Civics 128 & Citizenship') return 'Cívica 128 y Ciudadanía EE.UU.';
      if (g === 'Daily Fluency') return 'Fluidez diaria';
      return g;
    }
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

          const resolvedPlan = (isBaseAdmin && !localStorage.getItem('voyager_plan_explicitly_set'))
            ? 'PRO'
            : (parsed.plan === 'FREE' ? 'FREE' : 'PRO');

          return {
            ...baseProfile,
            ...parsed,
            plan: resolvedPlan,
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
      const nextUser = readAccountFromStorage();
      setUser(prev => {
        if (
          prev.name === nextUser.name &&
          prev.firstName === nextUser.firstName &&
          prev.lastName === nextUser.lastName &&
          prev.email === nextUser.email &&
          prev.country === nextUser.country &&
          prev.age === nextUser.age &&
          prev.category === nextUser.category &&
          prev.education === nextUser.education &&
          prev.goal === nextUser.goal &&
          prev.levelEstimate === nextUser.levelEstimate &&
          prev.timePerWeek === nextUser.timePerWeek &&
          prev.interests === nextUser.interests &&
          prev.avatarUrl === nextUser.avatarUrl &&
          prev.avatarType === nextUser.avatarType &&
          prev.plan === nextUser.plan &&
          prev.studentId === nextUser.studentId
        ) {
          return prev;
        }
        return nextUser;
      });
    };
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
  const [selectedLevel, setSelectedLevel] = useState(user.levelEstimate || 'Medium');
  const [editFirstName, setEditFirstName] = useState(user.firstName || 'Federico');
  const [editLastName, setEditLastName] = useState(user.lastName || 'Sandoval');
  const [editCategory, setEditCategory] = useState(user.category || (selectedLang === 'EN' ? 'Student' : 'Estudiante'));
  const [editCountry, setEditCountry] = useState(user.country || 'Guatemala');
  const [editAge, setEditAge] = useState<number | string>(user.age ?? 63);
  const [editBirthDate, setEditBirthDate] = useState<string>(
    user.birthDate || (user.age ? `${new Date().getFullYear() - user.age}-05-15` : '1963-05-15')
  );
  const [editPhone, setEditPhone] = useState(formatPhoneNumber(user.phone));
  const [editEmail, setEditEmail] = useState(user.email || 'federico.sandoval@example.com');
  const [editCity, setEditCity] = useState(user.city || (selectedLang === 'EN' ? 'Guatemala City' : 'Ciudad de Guatemala'));
  const [editEducation, setEditEducation] = useState(user.education || (selectedLang === 'EN' ? 'University' : 'Universidad'));
  const [editInterests, setEditInterests] = useState(user.interests || (selectedLang === 'EN' ? 'Technology, Culture, Travel, Business, Music' : 'Tecnología, Cultura, Viajes, Negocios, Música'));
  const [editPlan, setEditPlan] = useState<string>(user.plan === 'NORMAL' || user.plan === 'FREE' ? 'NORMAL' : 'PRO');
  const [newInterestInput, setNewInterestInput] = useState('');
  const [isAddingInterest, setIsAddingInterest] = useState(false);

  // Photo replacement interaction state (Screen #2)
  const [isPhotoEditActive, setIsPhotoEditActive] = useState(false);
  const [pendingPhotoPreview, setPendingPhotoPreview] = useState<string | null>(null);
  const photoInputRef = React.useRef<HTMLInputElement | null>(null);

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

  // ───────────────────────────────────────────────────────────────────────────
  // TEACHER ASSIGNMENT RECORDS (Single Source of Truth for Assigned Lessons)
  // ───────────────────────────────────────────────────────────────────────────
  const [teacherAssignments, setTeacherAssignments] = useState<UnifiedAssignment[]>([]);

  useEffect(() => {
    let isMounted = true;
    const loadAssignments = async () => {
      try {
        const u = user as any;
        const studentId = u?.id || u?.uid || u?.studentId || 'STU-001';
        const studentEmail = user?.email || 'theorangesnowman@gmail.com';
        const result = await fetchUnifiedStudentAssignments(studentId, studentEmail);
        if (isMounted && result?.assignments) {
          setTeacherAssignments(result.assignments);
        }
      } catch (err) {
        console.warn('Failed to load assignments in RoadmapPanel:', err);
      }
    };
    loadAssignments();
    window.addEventListener('voyager_assignments_updated', loadAssignments);
    return () => {
      isMounted = false;
      window.removeEventListener('voyager_assignments_updated', loadAssignments);
    };
  }, [(user as any)?.id, (user as any)?.uid, (user as any)?.studentId, user?.email]);

  // Maps lesson category from assignments to authentic lowercase topic consistent with Asignadas tab
  const getAssignedLessonTopic = useCallback((category: string): string => {
    const c = (category || '').trim().toLowerCase();
    if (selectedLang === 'EN') {
      if (c.includes('civic') || c.includes('cívic') || c.includes('right') || c.includes('derecho') || c.includes('government') || c.includes('constitu')) {
        return 'civics & rights';
      }
      if (c.includes('career') || c.includes('carrera') || c.includes('business') || c.includes('negocio') || c.includes('trabajo') || c.includes('interview')) {
        return 'career & business';
      }
      if (c.includes('health') || c.includes('salud') || c.includes('medical') || c.includes('médic')) {
        return 'health & living';
      }
      if (c.includes('travel') || c.includes('viaje') || c.includes('transit') || c.includes('tránsito') || c.includes('airport')) {
        return 'travel & transit';
      }
      if (c.includes('daily') || c.includes('vida diaria') || c.includes('living') || c.includes('rutina')) {
        return 'daily life';
      }
      if (c.includes('finance') || c.includes('finanza') || c.includes('bank') || c.includes('banca') || c.includes('dinero')) {
        return 'finance & banking';
      }
      return c;
    }
    // Spanish: matches 'Asignadas' catalog tab chips exactly
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
    return c;
  }, [selectedLang]);

  // Actual topics confirmed by teacher-assignment records for assigned lessons
  const confirmedTeacherAssignedTopics = useMemo(() => {
    const topicsSet = new Set<string>();
    const list = teacherAssignments.length > 0 ? teacherAssignments : [
      { category: 'Career & Business' },
      { category: 'Civics & Rights' },
      { category: 'Health & Living' },
    ];
    list.forEach((assign: any) => {
      const topic = getAssignedLessonTopic(assign.category);
      if (topic) topicsSet.add(topic);
    });
    return Array.from(topicsSet);
  }, [teacherAssignments, getAssignedLessonTopic]);

  // Strictly checks against confirmed teacher assignment records (no hardcoded keywords)
  const isTeacherAssignedTopic = (topic: string): boolean => {
    const t = (topic || '').trim().toLowerCase();
    if (!t) return false;
    return confirmedTeacherAssignedTopics.some(assigned => {
      const a = assigned.toLowerCase().trim();
      return t === a || t.includes(a) || a.includes(t);
    });
  };

  // Intereses y Temas Asignados: confirmed assigned topics linked to Asignadas lessons + personal interests
  const displayedInterestsAndTopics = useMemo(() => {
    const rawPersonal = (user.interests || (selectedLang === 'EN' ? 'Travel, technology, music' : 'Viajes, tecnología, música'))
      .split(',')
      .map(s => s.trim())
      .filter(Boolean);

    const items: { text: string; isAssigned: boolean }[] = [];
    const seen = new Set<string>();

    // 1. Confirmed assigned topics from teacher records (with red outline)
    confirmedTeacherAssignedTopics.forEach(topic => {
      const key = topic.toLowerCase().trim();
      if (!seen.has(key)) {
        seen.add(key);
        items.push({ text: topic, isAssigned: true });
      }
    });

    // 2. Personal profile interests (black outline unless confirmed by teacher records)
    rawPersonal.forEach(interest => {
      const key = interest.toLowerCase().trim();
      if (!seen.has(key)) {
        seen.add(key);
        const assigned = isTeacherAssignedTopic(interest);
        items.push({ text: interest, isAssigned: assigned });
      }
    });

    return items;
  }, [confirmedTeacherAssignedTopics, user.interests, selectedLang]);

  // 3 Voyager-recommended lessons derived from the lowest metrics shown in Lesson Analysis
  const voyagerRecommendedLessons = useMemo(() => {
    const getAnalysisPct = (val?: number, fallback: number = 80) => {
      if (val === undefined || val === null || val <= 0) return fallback;
      if (val <= 5) return Math.min(100, Math.round(val * 20));
      return Math.min(100, Math.round(val));
    };

    const catalog = getMasterLessons(selectedLang);
    const byId = (id: string): MasterLesson | undefined => catalog.find(l => l.id === id);

    const skillCandidates = [
      {
        key: 'confidence',
        label: selectedLang === 'EN' ? 'Confidence' : 'Confianza',
        pct: getAnalysisPct(scores?.confidence, 68),
        lesson: byId('cat-confidence-drills'),
      },
      {
        key: 'fluency',
        label: selectedLang === 'EN' ? 'Fluency' : 'Fluidez',
        pct: getAnalysisPct(scores?.naturalness, 74),
        lesson: byId('cat-connectors-flow'),
      },
      {
        key: 'pronunciation',
        label: selectedLang === 'EN' ? 'Pronunciation' : 'Pronunciación',
        pct: getAnalysisPct(scores?.pronunciation || pronunciationScore, 82),
        lesson: byId('cat-phonetics-th-v'),
      },
      {
        key: 'vocabulary',
        label: selectedLang === 'EN' ? 'Vocabulary' : 'Vocabulario',
        pct: getAnalysisPct(scores?.grammar || grammarScore, 88),
        lesson: byId('cat-tech-debate'),
      },
    ]
      .filter((entry): entry is { key: string; label: string; pct: number; lesson: MasterLesson } => Boolean(entry.lesson))
      .sort((a, b) => a.pct - b.pct);

    return skillCandidates.slice(0, 3);
  }, [scores, pronunciationScore, grammarScore, selectedLang]);

  const [isAddingLiveInterest, setIsAddingLiveInterest] = useState(false);
  const [newLiveInterestInput, setNewLiveInterestInput] = useState('');

  const handleAddLiveInterest = () => {
    const item = newLiveInterestInput.trim();
    if (!item || !user) return;
    const currentList = (user.interests || (selectedLang === 'EN' ? 'Travel, technology, music' : 'Viajes, tecnología, música'))
      .split(',')
      .map(s => s.trim())
      .filter(Boolean);
    if (!currentList.some(i => i.toLowerCase() === item.toLowerCase())) {
      const updated = [...currentList, item].join(', ');
      saveUser({
        ...user,
        interests: updated
      });
      setEditInterests(updated);
    }
    setNewLiveInterestInput('');
    setIsAddingLiveInterest(false);
  };

  const suggestedInterests = selectedLang === 'EN'
    ? ['Travel', 'Technology', 'Music', 'US Civics', 'Movies', 'Sports', 'Cooking', 'History', 'Business']
    : ['Viajes', 'Tecnología', 'Música', 'Cívica EE.UU.', 'Cine & Series', 'Deportes', 'Gastronomía', 'Historia', 'Negocios'];
  const [editTimePerWeek, setEditTimePerWeek] = useState(formatStudyTimeCompact(user.timePerWeek));
  const [activeProfileTab, setActiveProfileTab] = useState<'personal' | 'interests' | 'packages'>('personal');
  const [isPlanPaymentOpen, setIsPlanPaymentOpen] = useState(false);
  const [selectedPlanPaymentType, setSelectedPlanPaymentType] = useState<'pro_upgrade' | 'monthly_4' | 'sample'>('pro_upgrade');
  const [reachedCertificates, setReachedCertificates] = useState<Array<{ level: 'A2' | 'B1' | 'B2' | 'C1'; approvedAt?: string }>>([
    { level: 'A2', approvedAt: 'March 15, 2026' },
    { level: 'B1', approvedAt: 'June 20, 2026' },
    { level: 'B2', approvedAt: 'September 15, 2026' },
  ]);

  useEffect(() => {
    let isMounted = true;
    const studentId = user.studentId || 'STU-001';
    const studentName = sanitizeUserProfileNames(user).fullName || user.name || 'Federico Sandoval';
    const userPlan: 'FREE' | 'PRO' = (user.plan || 'PRO').toUpperCase() === 'FREE' ? 'FREE' : 'PRO';

    const syncReachedCertificates = async () => {
      try {
        const [activeCert, historyList] = await Promise.all([
          fetchActiveCertificate(studentId, studentName, user.email || '', userPlan),
          fetchCertificateHistory(studentId),
        ]);
        if (!isMounted) return;

        const allRecords = [activeCert, ...historyList.filter(h => h.id !== activeCert.id)];
        const levels: Array<'A2' | 'B1' | 'B2' | 'C1'> = ['A2', 'B1', 'B2', 'C1'];

        const defaultHistoricalDates: Record<'A2' | 'B1' | 'B2', string> = {
          A2: 'March 15, 2026',
          B1: 'June 20, 2026',
          B2: 'September 15, 2026',
        };

        const reached = levels.reduce<Array<{ level: 'A2' | 'B1' | 'B2' | 'C1'; approvedAt?: string }>>((acc, lvl) => {
          const explicit = allRecords.find(r => r.targetLevel === lvl);
          if (explicit) {
            if (explicit.status === 'GOAL_ACHIEVED' && explicit.teacherApproval?.approved) {
              acc.push({
                level: lvl,
                approvedAt: explicit.achievementDate || explicit.teacherApproval.approvedAt,
              });
            }
          } else if (lvl !== 'C1') {
            acc.push({
              level: lvl,
              approvedAt: defaultHistoricalDates[lvl],
            });
          }
          return acc;
        }, []);

        setReachedCertificates(reached);
      } catch (e) {}
    };

    syncReachedCertificates();
    window.addEventListener('voyager_certificate_updated', syncReachedCertificates);
    return () => {
      isMounted = false;
      window.removeEventListener('voyager_certificate_updated', syncReachedCertificates);
    };
  }, [user.studentId, user.name, user.firstName, user.lastName, user.email, user.plan]);
  const [internalIsEditingProfile, setInternalIsEditingProfile] = useState(true);
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
  // The approved Student Profile is the comprehensive, unified view ('welcome').
  // It contains Personal Info, Certificate, Analysis/Stats, Lessons Catalog, Calendar, and Messaging.
  // We keep activeSubTab on 'welcome' so the Student Profile is never replaced or hidden.
  const activeSubTab = 'welcome';

  const setActiveSubTab = (tab: 'welcome' | 'level' | 'lessons' | 'achievements' | 'streak') => {
    setInternalSubTab('welcome');
    if (onSelectSubTab) {
      onSelectSubTab('welcome');
    }
  };
  const [isAvatarModalOpen, setIsAvatarModalOpen] = useState(false);
  const [pendingAvatarUrl, setPendingAvatarUrl] = useState<string | undefined>(undefined);
  const [pendingAvatarType, setPendingAvatarType] = useState<'user' | 'man' | 'woman' | 'student' | 'astronaut' | 'female_robot' | 'male_robot' | 'custom'>('user');
  const [isGearMenuOpen, setIsGearMenuOpen] = useState(false);
  const avatarFileInputRef = React.useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isAvatarModalOpen) {
      setPendingAvatarUrl(user.avatarUrl);
      setPendingAvatarType(user.avatarType || 'user');
    }
  }, [isAvatarModalOpen, user.avatarUrl, user.avatarType]);

  // Internal Mail Modal & Dynamic Letter Grade State
  const [isMailModalOpen, setIsMailModalOpen] = useState(false);
  const [messagingUnreadCount, setMessagingUnreadCount] = useState(5);
  const [mailTab, setMailTab] = useState<'inbox' | 'compose'>('inbox');
  const [mailSubject, setMailSubject] = useState('');
  const [mailBody, setMailBody] = useState('');
  const [mailRecipient, setMailRecipient] = useState<'Voyager AI' | 'Equipo Académico' | 'Docentes'>('Voyager AI');
  const [mailSentToast, setMailSentToast] = useState<string | null>(null);

  // Real messaging channels state
  const [mailChannel, setMailChannel] = useState<'teacher' | 'group' | 'announcements'>('teacher');
  const [teacherChatInput, setTeacherChatInput] = useState('');
  const [groupChatInput, setGroupChatInput] = useState('');

  const [teacherChatMessages, setTeacherChatMessages] = useState<any[]>(() => {
    try {
      const saved = localStorage.getItem('voyager_teacher_chat_messages');
      if (saved) return JSON.parse(saved);
    } catch (e) {}
    return [
      {
        id: 'tc-1',
        sender: 'Profesora Voyager',
        role: 'teacher',
        text: '¡Hola Federico! Soy tu profesora y tutora académica. En este espacio directo podemos resolver cualquier duda sobre tus lecciones, gramática o pronunciación. ¿En qué te puedo ayudar hoy?',
        date: 'Hoy, 09:00'
      }
    ];
  });

  const [groupChatMessages, setGroupChatMessages] = useState<any[]>(() => {
    try {
      const saved = localStorage.getItem('voyager_group_chat_messages');
      if (saved) return JSON.parse(saved);
    } catch (e) {}
    return [
      {
        id: 'gc-1',
        sender: 'Profesora Voyager',
        role: 'teacher',
        text: '¡Bienvenidos al grupo de práctica conversacional! Aquí compartimos consultas, ejercicios y temas de interés de la semana.',
        date: 'Hoy, 08:30'
      },
      {
        id: 'gc-2',
        sender: 'María G.',
        role: 'student',
        text: '¡Hola a todos! Saludos desde la clase de práctica oral.',
        date: 'Hoy, 08:45'
      },
      {
        id: 'gc-3',
        sender: 'Carlos R.',
        role: 'student',
        text: '¿Alguien más repasando las preguntas de Cívica 128 hoy?',
        date: 'Hoy, 09:10'
      }
    ];
  });

  const [announcementMessages] = useState<any[]>([
    {
      id: 'anc-1',
      sender: 'USA Voyager Academic Team',
      tag: 'Aviso Oficial',
      title: 'Bienvenido a la Plataforma USA Voyager',
      date: 'Ayer, 14:30',
      body: 'Hola Federico, bienvenido a la plataforma de aprendizaje interactivo. Tu perfil de nivel Intermedio ha sido activado con seguimiento de fluidez y análisis de pronunciación.'
    },
    {
      id: 'anc-2',
      sender: 'Coordinación de Cívica y Docencia',
      tag: 'Aviso Oficial',
      title: 'Actualización de Módulo de Cívica 128',
      date: 'Hace 2 horas',
      body: 'Recordatorio oficial: Los artículos sobre la Constitución y el sistema de gobierno de EE.UU. ya están disponibles para tu práctica conversacional intensiva.'
    }
  ]);

  const handleSendTeacherMessage = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const txt = teacherChatInput.trim();
    if (!txt) return;

    const studentName = user.firstName ? `${user.firstName} ${user.lastName || ''}`.trim() : 'Federico Sandoval';
    const userMsg = {
      id: `tc-${Date.now()}`,
      sender: studentName,
      role: 'student',
      text: txt,
      date: 'Ahora mismo'
    };

    const updated = [...teacherChatMessages, userMsg];
    setTeacherChatMessages(updated);
    setTeacherChatInput('');
    try {
      localStorage.setItem('voyager_teacher_chat_messages', JSON.stringify(updated));
    } catch (err) {}

    // Simulate direct pedagogical teacher response
    setTimeout(() => {
      const replyMsg = {
        id: `tc-reply-${Date.now()}`,
        sender: 'Profesora Voyager',
        role: 'teacher',
        text: `¡Hola ${user.firstName || 'Federico'}! He recibido tu consulta: "${txt}". Muy buen punto. Recuerda que puedes practicar la pronunciación de esa frase activando el micrófono en cualquier momento. ¡Sigue así!`,
        date: 'Ahora mismo'
      };
      setTeacherChatMessages(prev => {
        const next = [...prev, replyMsg];
        try {
          localStorage.setItem('voyager_teacher_chat_messages', JSON.stringify(next));
        } catch (e) {}
        return next;
      });
    }, 1200);
  };

  const handleSendGroupMessage = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const txt = groupChatInput.trim();
    if (!txt) return;

    const studentName = user.firstName ? `${user.firstName} ${user.lastName || ''}`.trim() : 'Federico Sandoval';
    const userMsg = {
      id: `gc-${Date.now()}`,
      sender: studentName,
      role: 'student',
      text: txt,
      date: 'Ahora mismo'
    };

    const updated = [...groupChatMessages, userMsg];
    setGroupChatMessages(updated);
    setGroupChatInput('');
    try {
      localStorage.setItem('voyager_group_chat_messages', JSON.stringify(updated));
    } catch (err) {}
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

    const gradeExplanationPrompt = `[INSTRUCCIÓN DE SISTEMA MANDATORIA: ANÁLISIS GLOBAL DE GRÁFICA CIRCULAR DE CALIFICACIÓN DE PROGRESO DE ESTUDIANTE]
El estudiante hizo clic en su gráfica circular de calificación general de inglés estadounidense: ${gradeData.grade} (Promedio real actual: ${gradeData.average}%).

DESGLOSE REAL DE MÉTRICAS DEL ESTUDIANTE:
- Pronunciación: ${gradeData.pron}%
- Fluidez: ${gradeData.flu}%
- Vocabulario: ${gradeData.vocab}%
- Confianza: ${gradeData.conf}%

MANDATOS OBLIGATORIOS PARA TU RESPUESTA DE VOZ (EN ESPAÑOL O INGLÉS SEGÚN IDIOMA ACTIVO):
1. Explica qué representa esta gráfica circular (su nivel y calificación global actual ${gradeData.grade}).
2. Explica qué significan los datos reales actuales de sus métricas, destacando las áreas de menor desempeño: ${lowest1.name} (${lowest1.score}%) y ${lowest2.name} (${lowest2.score}%).
3. Explica por qué importa para su aprendizaje y comunicación fluida en EE. UU.
4. Concluye con una recomendación práctica y motivadora sobre en qué enfocarse para subir de nivel.
REGLA ESTRICTA: NO des clases de inglés, NO hagas preguntas de práctica. Mantén la respuesta ágil, motivadora y 100% enfocada en explicar la gráfica y su progreso.`;

    onAskVoyager(gradeExplanationPrompt);
  }, [computeLetterGrade, onAskVoyager]);

  const [lessonAttempts, setLessonAttempts] = useState<LessonEvaluationRecord[]>(() => getStoredLessonAttempts());

  useEffect(() => {
    const handleAttemptsUpdate = () => {
      setLessonAttempts(getStoredLessonAttempts());
    };
    window.addEventListener('voyager_lesson_attempts_updated', handleAttemptsUpdate);
    return () => window.removeEventListener('voyager_lesson_attempts_updated', handleAttemptsUpdate);
  }, []);

  const [curriculumTrack, setCurriculumTrack] = useState<'immersion' | 'ciudadania' | 'evaluations'>(() => {
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

  // Weekly study progress computed from verified study records (savedChatsList) and 5 hrs/week target
  const weeklyStudyProgress = useMemo(() => {
    let targetHours = 5;
    if (user?.timePerWeek) {
      const match = String(user.timePerWeek).match(/(\d+)/);
      if (match) {
        targetHours = parseInt(match[1], 10) || 5;
      }
    }
    const targetSeconds = targetHours * 3600;

    if (!Array.isArray(savedChatsList) || savedChatsList.length === 0) {
      return {
        recordedSeconds: 0,
        recordedHours: 0,
        targetHours,
        progressPercent: 0,
      };
    }

    // Current calendar week (Monday 00:00:00 to now)
    const now = new Date();
    const dayOfWeek = now.getDay(); // 0 is Sunday, 1 is Monday...
    const distanceToMonday = (dayOfWeek + 6) % 7;
    const startOfWeek = new Date(now);
    startOfWeek.setDate(now.getDate() - distanceToMonday);
    startOfWeek.setHours(0, 0, 0, 0);

    let weeklySeconds = 0;
    savedChatsList.forEach((chat: any) => {
      if (!chat) return;
      const chatDate = new Date(chat.date || chat.timestamp || 0);
      if (!isNaN(chatDate.getTime()) && chatDate >= startOfWeek) {
        const dur = typeof chat.durationSeconds === 'number'
          ? chat.durationSeconds
          : (parseFloat(chat.durationSeconds) || 0);
        weeklySeconds += dur;
      }
    });

    const progressPercent = targetSeconds > 0
      ? Math.min(100, Math.round((weeklySeconds / targetSeconds) * 100))
      : 0;

    return {
      recordedSeconds: weeklySeconds,
      recordedHours: Math.round((weeklySeconds / 3600) * 10) / 10,
      targetHours,
      progressPercent,
    };
  }, [savedChatsList, user?.timePerWeek]);

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
      setEditPhone(formatPhoneNumber(user.phone));
      setEditEmail(user.email || 'federico.sandoval@example.com');
      setEditCity(user.city || (selectedLang === 'EN' ? 'Guatemala City' : 'Ciudad de Guatemala'));
      setSelectedGoal(user.goal || (selectedLang === 'EN' ? 'Academic success' : 'Éxito académico'));
      setEditInterests(user.interests || (selectedLang === 'EN' ? 'Technology, Culture, Travel, Business, Music' : 'Tecnología, Cultura, Viajes, Negocios, Música'));
      setSelectedLevel(user.levelEstimate || 'Medium');
      setEditEducation(user.education || (selectedLang === 'EN' ? 'University' : 'Universidad'));
      setEditTimePerWeek(formatStudyTimeCompact(user.timePerWeek));
    }
  }, [user, isEditingProfile]);

  const getAiStudentSummary = (u: UserProfile, lang: 'EN' | 'ES') => {
    const goalText = u.goal || 'Business English & Networking';
    const levelText = getTranslatedLevel(u.levelEstimate || 'Medium');
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
        setPendingAvatarUrl(reader.result);
        setPendingAvatarType('custom');
      }
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  const handleSaveAvatar = () => {
    const updated: UserProfile = {
      ...user,
      avatarUrl: pendingAvatarUrl,
      avatarType: pendingAvatarType
    };
    saveUser(updated);
    setIsAvatarModalOpen(false);
  };

  const renderAvatarContent = (u: UserProfile) => {
    const isLoggedIn = Boolean(auth.currentUser);
    const photoUrl = u.avatarUrl || (isLoggedIn
      ? (u.photoURL || (typeof window !== 'undefined' ? (localStorage.getItem('voyager_admin_photo_url') || auth.currentUser?.photoURL) : null))
      : null);

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
          <img 
            src={voyagerRobot} 
            alt="Voyager Robot" 
            loading="eager"
            decoding="async"
            referrerPolicy="no-referrer"
            onError={(e) => {
              const target = e.currentTarget;
              if (!target.src.includes('lh3.googleusercontent.com')) {
                target.src = 'https://lh3.googleusercontent.com/d/1uCm4fqE6Qfxg1lm1FsCbo35fVQcI_E5k';
              } else if (!target.src.includes('voyager_robot')) {
                target.src = voyagerRobot;
              }
            }}
            className="w-full h-full object-contain" 
          />
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
            plan: (mergedData.plan === 'FREE' ? 'FREE' : 'PRO'),
            avatarUrl: fbUser?.photoURL || mergedData?.photoURL || mergedData?.avatarUrl || (typeof window !== 'undefined' ? localStorage.getItem('voyager_admin_photo_url') : undefined) || undefined,
            avatarType: (fbUser?.photoURL || mergedData?.photoURL || mergedData?.avatarUrl) ? 'custom' : ((mergedData?.avatarType as any) || 'user')
          };
          setUser(prev => {
            if (
              prev.name === newUser.name &&
              prev.firstName === newUser.firstName &&
              prev.lastName === newUser.lastName &&
              prev.email === newUser.email &&
              prev.avatarUrl === newUser.avatarUrl &&
              prev.avatarType === newUser.avatarType &&
              prev.country === newUser.country &&
              prev.age === newUser.age &&
              prev.plan === newUser.plan
            ) {
              return prev;
            }
            return newUser;
          });
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
      email: editEmail.trim() || user.email || 'theorangesnowman@gmail.com',
      phone: formatPhoneNumber(editPhone.trim()),
      city: editCity.trim(),
      category: editCategory.trim() || user.category || (selectedLang === 'EN' ? 'Student' : 'Estudiante'),
      country: editCountry.trim() || user.country || 'Guatemala',
      age: calculateAgeFromDate(editBirthDate),
      birthDate: editBirthDate,
      levelEstimate: selectedLevel,
      education: editEducation.trim() || user.education || (selectedLang === 'EN' ? 'University' : 'Universidad'),
      goal: editInterests.split(',')[0]?.trim() || selectedGoal || user.goal || 'Travel & Daily Conversation',
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
    <div className={`flex-1 flex flex-col ${isDarkMode ? 'bg-[#0B1832] text-slate-100' : 'bg-white text-[#231d17]'} h-full overflow-hidden animate-fade-in font-sans`}>
      
      {/* Scrollable content area */}
      <div className="flex-1 overflow-y-auto px-3 pt-0.5 pb-4 flex flex-col gap-2 min-h-0 no-scrollbar">

        {/* TOP GRADE HEADER CARD - IN-FLOW & SCROLLABLE WITH PAGE */}
        {(() => {
          const gradeData = computeLetterGrade();
          const pct = gradeData.hasData ? gradeData.average : 0;
          const strokeWidth = 11;
          const radius = 38;
          const circumference = 2 * Math.PI * radius;
          const strokeDashoffset = circumference - (pct / 100) * circumference;
          const rawStudentName = user.name || (user.firstName ? `${user.firstName} ${user.lastName || ''}`.trim() : 'Federico Sandoval');
          const dynamicStudentFullName = rawStudentName
            .toLowerCase()
            .split(' ')
            .filter(Boolean)
            .map(w => w.charAt(0).toUpperCase() + w.slice(1))
            .join(' ');

          return (
            <div className={`w-full shrink-0 ${isDarkMode ? 'bg-[#0B1832]' : 'bg-white'} pt-2 pb-2`}>
              <div className="flex items-center justify-center gap-[12.5px] sm:gap-[16px] w-full">
                {/* C+ Circular Ring Grade Badge */}
                <button
                  type="button"
                  onClick={triggerGradeVoiceExplanation}
                  className="flex items-center justify-center text-center group cursor-pointer focus:outline-none p-0 border-0 hover:scale-105 active:scale-95 transition-all duration-200 shrink-0"
                  title={selectedLang === "EN" ? "Click for Voyager grade voice analysis" : "Haz clic para escuchar la explicación de tu calificación por voz"}
                >
                  <div className="relative w-[66px] h-[66px] sm:w-[83px] sm:h-[83px] flex items-center justify-center shrink-0">
                    <svg viewBox="0 0 100 100" className="w-full h-full -rotate-90 transform group-hover:scale-110 transition-all duration-300">
                      <circle cx="50" cy="50" r={radius} fill="transparent" stroke={isDarkMode ? '#1E293B' : '#333333'} strokeWidth={strokeWidth} />
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
                        className="transition-all duration-700 ease-out group-hover:stroke-amber-400"
                      />
                    </svg>
                    <div className="absolute inset-0 flex items-center justify-center">
                      <span className={`text-[21px] sm:text-[25px] font-black font-mono tracking-tight ${isDarkMode ? 'text-white group-hover:text-amber-400' : 'text-neutral-900 group-hover:text-amber-600'} transition-all`}>
                        {gradeData.displayLabel}
                      </span>
                    </div>
                  </div>
                </button>

                {/* Student Name & Subtitle Column */}
                <div className="flex flex-col justify-center items-start min-w-0 text-left">
                  {/* Student Name as clickable text link for Voyager Oral Report */}
                  <button
                    type="button"
                    onClick={triggerStudentOralReport}
                    className={`text-[21px] sm:text-[23.5px] md:text-[26px] font-semibold tracking-normal ${
                      isDarkMode ? 'text-white hover:text-amber-400' : 'text-neutral-900 hover:text-amber-700'
                    } truncate leading-tight block text-left cursor-pointer transition-colors hover:underline underline-offset-4 p-0 bg-transparent border-0`}
                    title={selectedLang === 'EN' ? 'Click to hear Voyager oral progress report' : 'Haz clic para escuchar el informe oral de progreso de Voyager'}
                  >
                    {dynamicStudentFullName.trim()}
                  </button>

                  {/* Subtitle & ID */}
                  <div className={`flex items-center gap-2 mt-[4.5px] ${isDarkMode ? 'text-slate-400' : 'text-black'} font-semibold text-[11.4px] leading-tight text-left`}>
                    <span className="uppercase tracking-wider">
                      {selectedLang === 'EN' ? 'Student Profile' : 'Perfil de Estudiante'}
                    </span>
                    <span className={`${isDarkMode ? 'text-slate-600' : 'text-black'} select-none`}>|</span>
                    <span>
                      ID: {user.studentId || 'STU-001'}
                    </span>
                  </div>

                  {/* Icon Action Buttons Row (Placed directly under Perfil de Estudiante) */}
                  <div className="flex items-center justify-start gap-[4.5px] sm:gap-[6px] mt-[6px] flex-wrap">
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
                                plan: (synced.plan === 'FREE' ? 'FREE' : 'PRO')
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
                      className={`w-[33px] h-[33px] rounded-full ${isDarkMode ? 'bg-slate-800/80 text-slate-200 hover:bg-amber-400 hover:text-black border border-slate-700/60' : 'bg-transparent text-black hover:bg-yellow-400 hover:text-black'} flex items-center justify-center transition-all duration-200 hover:scale-105 active:scale-95 cursor-pointer select-none group shrink-0`}
                      title={!auth.currentUser ? (selectedLang === 'EN' ? 'Click to login' : 'Haz clic para iniciar sesión') : (selectedLang === 'EN' ? 'Change photo' : 'Cambiar foto')}
                    >
                      <Camera className="w-[18px] h-[18px] text-current stroke-[2.2] group-hover:scale-110 transition-all" />
                    </button>

                    {/* Certificates (Diploma) Navigation Button */}
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        if (activeSubTab !== 'welcome') {
                          setActiveSubTab('welcome');
                        }
                        setTimeout(() => {
                          const el = document.getElementById('voyager-certificates-section');
                          if (el) {
                            el.scrollIntoView({ behavior: 'smooth', block: 'start' });
                            el.classList.add('ring-2', 'ring-amber-400', 'transition-all');
                            setTimeout(() => {
                              el.classList.remove('ring-2', 'ring-amber-400');
                            }, 1500);
                          }
                        }, 60);
                      }}
                      className={`w-[33px] h-[33px] rounded-full ${isDarkMode ? 'bg-slate-800/80 text-slate-200 hover:bg-amber-400 hover:text-black border border-slate-700/60' : 'bg-transparent text-black hover:bg-yellow-400 hover:text-black'} flex items-center justify-center transition-all duration-200 hover:scale-105 active:scale-95 cursor-pointer select-none group shrink-0`}
                      title={selectedLang === 'EN' ? 'Certificates' : 'Certificados'}
                      aria-label={selectedLang === 'EN' ? 'Certificates' : 'Certificados'}
                    >
                      <FileBadge className="w-[18px] h-[18px] text-current stroke-[2.2] group-hover:scale-110 transition-all" />
                    </button>

                    {/* Analysis & Lesson Progress Navigation Button */}
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        if (activeSubTab !== 'welcome') {
                          setActiveSubTab('welcome');
                        }
                        setTimeout(() => {
                          const el = document.getElementById('voyager-analysis-progress-section');
                          if (el) {
                            el.scrollIntoView({ behavior: 'smooth', block: 'start' });
                            el.classList.add('ring-2', 'ring-amber-400', 'transition-all');
                            setTimeout(() => {
                              el.classList.remove('ring-2', 'ring-amber-400');
                            }, 1500);
                          }
                        }, 60);
                      }}
                      className={`w-[33px] h-[33px] rounded-full ${isDarkMode ? 'bg-slate-800/80 text-slate-200 hover:bg-amber-400 hover:text-black border border-slate-700/60' : 'bg-transparent text-black hover:bg-yellow-400 hover:text-black'} flex items-center justify-center transition-all duration-200 hover:scale-105 active:scale-95 cursor-pointer select-none group shrink-0`}
                      title={selectedLang === 'EN' ? 'Analysis & Lesson Progress' : 'Análisis y Progreso de Lecciones'}
                      aria-label={selectedLang === 'EN' ? 'Analysis & Lesson Progress' : 'Análisis y Progreso de Lecciones'}
                    >
                      <PieChart className="w-[18px] h-[18px] text-current stroke-[2.2] group-hover:scale-110 transition-all" />
                    </button>

                    {/* Lessons & Scenarios Catalog Navigation Button */}
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        if (activeSubTab !== 'welcome') {
                          setActiveSubTab('welcome');
                        }
                        setTimeout(() => {
                          const el = document.getElementById('voyager-lessons-section');
                          if (el) {
                            el.scrollIntoView({ behavior: 'smooth', block: 'start' });
                            el.classList.add('ring-2', 'ring-amber-400', 'transition-all');
                            setTimeout(() => {
                              el.classList.remove('ring-2', 'ring-amber-400');
                            }, 1500);
                          }
                        }, 60);
                      }}
                      className={`w-[33px] h-[33px] rounded-full ${isDarkMode ? 'bg-slate-800/80 text-slate-200 hover:bg-amber-400 hover:text-black border border-slate-700/60' : 'bg-transparent text-black hover:bg-yellow-400 hover:text-black'} flex items-center justify-center transition-all duration-200 hover:scale-105 active:scale-95 cursor-pointer select-none group shrink-0`}
                      title={selectedLang === 'EN' ? 'Lessons & Scenarios Catalog' : 'Catálogo de Lecciones y Escenarios'}
                      aria-label={selectedLang === 'EN' ? 'Lessons & Scenarios Catalog' : 'Catálogo de Lecciones y Escenarios'}
                    >
                      <BookOpen className="w-[18px] h-[18px] text-current stroke-[2.2] group-hover:scale-110 transition-all" />
                    </button>

                    {/* Internal Communication Mail Button */}
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        if (activeSubTab !== 'welcome') {
                          setActiveSubTab('welcome');
                        }
                        setTimeout(() => {
                          const el = document.getElementById('voyager-messaging-section');
                          if (el) {
                            el.scrollIntoView({ behavior: 'smooth', block: 'start' });
                            el.classList.add('ring-2', 'ring-amber-400', 'transition-all');
                            setTimeout(() => {
                              el.classList.remove('ring-2', 'ring-amber-400');
                            }, 1500);
                          }
                        }, 60);
                      }}
                      className={`w-[33px] h-[33px] rounded-full ${isDarkMode ? 'bg-slate-800/80 text-slate-200 hover:bg-amber-400 hover:text-black border border-slate-700/60' : 'bg-transparent text-black hover:bg-yellow-400 hover:text-black'} flex items-center justify-center transition-all duration-200 hover:scale-105 active:scale-95 cursor-pointer select-none group shrink-0 relative`}
                      title={selectedLang === 'EN' ? 'Voyager Messaging (below calendar)' : 'Mensajería Voyager (debajo del calendario)'}
                      aria-label={selectedLang === 'EN' ? 'Voyager Messaging' : 'Mensajería Voyager'}
                    >
                      <Mail className="w-[18px] h-[18px] text-current stroke-[2.2] group-hover:scale-110 transition-all" />
                      {messagingUnreadCount > 0 && (
                        <span className="absolute -top-0.5 -right-0.5 w-[10.5px] h-[10.5px] rounded-full bg-[#FF0000]" />
                      )}
                    </button>

                    {/* Activity Calendar Navigation Button */}
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        if (activeSubTab !== 'welcome') {
                          setActiveSubTab('welcome');
                        }
                        setTimeout(() => {
                          const el = document.getElementById('voyager-activity-calendar-section');
                          if (el) {
                            el.scrollIntoView({ behavior: 'smooth', block: 'start' });
                            el.classList.add('ring-2', 'ring-amber-400', 'transition-all');
                            setTimeout(() => {
                              el.classList.remove('ring-2', 'ring-amber-400');
                            }, 1500);
                          }
                        }, 60);
                      }}
                      className={`w-[33px] h-[33px] rounded-full ${isDarkMode ? 'bg-slate-800/80 text-slate-200 hover:bg-amber-400 hover:text-black border border-slate-700/60' : 'bg-transparent text-black hover:bg-yellow-400 hover:text-black'} flex items-center justify-center transition-all duration-200 hover:scale-105 active:scale-95 cursor-pointer select-none group shrink-0`}
                      title={selectedLang === 'EN' ? 'Activity Calendar' : 'Calendario de Actividades'}
                      aria-label={selectedLang === 'EN' ? 'Activity Calendar' : 'Calendario de Actividades'}
                    >
                      <Calendar className="w-[18px] h-[18px] text-current stroke-[2.2] group-hover:scale-110 transition-all" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          );
        })()}

        {/* SCROLLABLE STUDENT JOURNEY & ROADMAP */}
        
        {/* THE MAIN WELCOME STATEMENT CARD FOR PROFILE */}
        <div className="space-y-1 text-left flex flex-col flex-shrink-0 p-0">

        {/* MAIN PROFILE DETAILS CONTAINER */}
        <div className="space-y-1 text-left flex flex-col flex-shrink-0">

          {/* Tab Body Content */}
          <div className="pt-0">
            {activeSubTab === 'welcome' && (
              <div className="animate-fade-in py-0 space-y-4" style={{ containerType: 'inline-size' }}>

                <div className="w-full min-w-0 pt-[3em]">
                  {/* VINTAGE INDEX-CARD TABS FOR STUDENT PROFILE */}
                  <div className="w-full flex items-end relative pt-2 px-[14px] sm:px-[15px] z-10 overflow-hidden sm:overflow-visible max-w-full">
                    <div className="flex items-end gap-1.5 sm:gap-2.5 relative max-w-full">
                      {[
                        { id: 'personal' as const, label: 'Info' },
                        { id: 'interests' as const, label: selectedLang === 'EN' ? 'Interests & Topics' : 'Intereses & Temas' },
                        { id: 'packages' as const, label: selectedLang === 'EN' ? 'Packages' : 'Paquetes' },
                      ].map((tab, idx) => {
                        const isActive = activeProfileTab === tab.id;
                        return (
                          <button
                            key={tab.id}
                            type="button"
                            onClick={() => setActiveProfileTab(tab.id)}
                            className={`group relative h-[52px] sm:h-[58px] px-3 sm:px-4 md:px-5 min-w-0 flex-initial flex flex-col items-center pt-2 sm:pt-2.5 pb-1.5 sm:pb-2 justify-center cursor-pointer transition-colors ${
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

                            {/* Tab Label */}
                            <div className="inline-flex flex-col items-center justify-center max-w-full px-0.5 leading-tight">
                              <span className={`text-[13px] sm:text-[14.5px] md:text-[15.5px] font-bold leading-none text-center whitespace-nowrap ${
                                isActive ? 'text-[#1F1A14]' : 'text-[#221D17] group-hover:text-black'
                              }`}>
                                {tab.label}
                              </span>
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Main IndexCard Body with Minimum Height & Vertical Centering */}
                  <div className="bg-[#F8ECC0] rounded-b-[24px] sm:rounded-b-[28px] rounded-t-[14px] sm:rounded-t-[18px] p-4 sm:p-6 md:p-7 shadow-xs relative z-0 text-neutral-900 min-h-[230px] sm:min-h-[260px] flex flex-col justify-center">
                    
                    {/* TAB 1: INFORMACIÓN PERSONAL (with circular profile photo moved here) */}
                    {activeProfileTab === 'personal' && (
                      <div className="w-full text-left animate-fade-in my-auto">
                        <div className="flex flex-col md:flex-row items-center md:items-start gap-5 sm:gap-6 w-full">
                          {/* Circular Profile Photo */}
                          <div className="flex flex-col items-center justify-start shrink-0">
                            <div className="relative group w-[116px] h-[116px] sm:w-[132px] sm:h-[132px] aspect-square shrink-0">
                              {/* Hidden Photo Input for file selection */}
                              <input
                                ref={photoInputRef}
                                type="file"
                                accept="image/*"
                                className="hidden"
                                onChange={(e) => {
                                  const file = e.target.files?.[0];
                                  if (file) {
                                    const reader = new FileReader();
                                    reader.onload = () => {
                                      if (typeof reader.result === 'string') {
                                        setPendingPhotoPreview(reader.result);
                                        setIsPhotoEditActive(true);
                                      }
                                    };
                                    reader.readAsDataURL(file);
                                  }
                                }}
                              />

                              {/* Avatar Circle with Dimmed Overlay and Camera Indicator */}
                              <div 
                                onClick={() => {
                                  setIsPhotoEditActive(prev => !prev);
                                }}
                                className="w-full h-full rounded-full bg-white border border-neutral-300 cursor-pointer overflow-hidden flex items-center justify-center transition-all duration-200 active:scale-95 group/avatar relative shadow-xs"
                                title={selectedLang === 'EN' ? 'Click photo to replace profile picture' : 'Haz clic en la foto para cambiar tu foto de perfil'}
                              >
                                {pendingPhotoPreview ? (
                                  <img 
                                    src={pendingPhotoPreview} 
                                    alt="Preview" 
                                    className="w-full h-full object-cover rounded-full" 
                                  />
                                ) : (
                                  renderAvatarContent(user)
                                )}

                                {/* Dimmed Overlay with Camera Icon */}
                                <div 
                                  className={`absolute inset-0 bg-black/60 backdrop-blur-[1px] rounded-full flex flex-col items-center justify-center transition-opacity duration-200 ${
                                    isPhotoEditActive ? 'opacity-100' : 'opacity-0 group-hover/avatar:opacity-100'
                                  }`}
                                >
                                  <button
                                    type="button"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      photoInputRef.current?.click();
                                    }}
                                    className="p-2.5 rounded-full bg-white/25 hover:bg-white/40 text-white transition-transform hover:scale-110 active:scale-95 cursor-pointer"
                                    title={selectedLang === 'EN' ? 'Upload new photo' : 'Subir nueva foto'}
                                  >
                                    <Camera className="w-6 h-6 text-white stroke-[2]" />
                                  </button>
                                </div>
                              </div>

                              {/* Pending Photo Confirmation & Cancel Buttons */}
                              {pendingPhotoPreview && (
                                <div className="absolute -bottom-1 -right-1 flex items-center gap-1.5 z-20">
                                  <button
                                    type="button"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      const updated: UserProfile = {
                                        ...user,
                                        photoURL: pendingPhotoPreview,
                                        avatarUrl: pendingPhotoPreview
                                      };
                                      setUser(updated);
                                      localStorage.setItem('voyager_student_profile', JSON.stringify(updated));
                                      window.dispatchEvent(new CustomEvent('voyager_profile_updated', { detail: updated }));
                                      setPendingPhotoPreview(null);
                                      setIsPhotoEditActive(false);
                                      if (photoInputRef.current) photoInputRef.current.value = '';
                                    }}
                                    className="w-8 h-8 rounded-full bg-[#059669] hover:bg-[#047857] text-white border-2 border-white shadow-lg flex items-center justify-center cursor-pointer transition-transform hover:scale-110 active:scale-95"
                                    title={selectedLang === 'EN' ? 'Confirm and save photo' : 'Confirmar y guardar foto'}
                                  >
                                    <Check className="w-4 h-4 stroke-[3] text-white" />
                                  </button>
                                  <button
                                    type="button"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setPendingPhotoPreview(null);
                                      setIsPhotoEditActive(false);
                                      if (photoInputRef.current) photoInputRef.current.value = '';
                                    }}
                                    className="w-8 h-8 rounded-full bg-neutral-800 hover:bg-neutral-900 text-white border-2 border-white shadow-lg flex items-center justify-center cursor-pointer transition-transform hover:scale-110 active:scale-95"
                                    title={selectedLang === 'EN' ? 'Cancel and discard' : 'Cancelar y descartar'}
                                  >
                                    <X className="w-4 h-4 stroke-[2.5] text-white" />
                                  </button>
                                </div>
                              )}
                            </div>
                          </div>

                          {/* Personal Information Details / Editor */}
                          <div className="flex-1 min-w-0 w-full">
                            {isEditingProfile ? (
                              <div>
                                <div className="flex items-center gap-2 mb-2.5">
                                  <button
                                    type="button"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setIsEditingProfile(false);
                                    }}
                                    className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-yellow-400 text-black hover:bg-yellow-500 flex items-center justify-center transition-all duration-200 hover:scale-105 active:scale-95 cursor-pointer select-none group shrink-0"
                                    title={selectedLang === 'EN' ? 'Cancel editing' : 'Cancelar edición'}
                                  >
                                    <Pencil className="w-[16px] h-[16px] sm:w-[17.5px] sm:h-[17.5px] text-black stroke-[2.2]" />
                                  </button>
                                  <h3 className="font-bold text-[#1F1A14] text-[15px] sm:text-[16.5px] md:text-[17px] tracking-normal leading-tight font-sans">
                                    {selectedLang === 'EN' ? 'Edit Personal Information' : 'Edita tu información personal'}
                                  </h3>
                                </div>

                                {saveNotification && (
                                  <div className="mb-3 p-2.5 bg-emerald-50 border border-emerald-200 text-emerald-900 font-normal rounded-xl text-xs sm:text-sm flex items-center gap-2">
                                    <Check className="w-4 h-4 text-emerald-600 stroke-[2.5]" />
                                    <span>{saveNotification}</span>
                                  </div>
                                )}

                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-4 gap-y-3">
                                  <div>
                                    <label className="block text-[10px] font-semibold text-neutral-600 tracking-wider uppercase mb-1">
                                      {selectedLang === 'EN' ? 'First Name' : 'Nombre'}
                                    </label>
                                    <input
                                      type="text"
                                      value={editFirstName}
                                      onChange={(e) => setEditFirstName(e.target.value)}
                                      className="w-full h-[29px] px-3 py-0.5 bg-white border border-neutral-300 rounded-lg font-semibold text-neutral-900 focus:outline-none focus:border-neutral-500 text-xs sm:text-[12.5px]"
                                    />
                                  </div>
                                  <div>
                                    <label className="block text-[10px] font-semibold text-neutral-600 tracking-wider uppercase mb-1">
                                      {selectedLang === 'EN' ? 'Last Name' : 'Apellido'}
                                    </label>
                                    <input
                                      type="text"
                                      value={editLastName}
                                      onChange={(e) => setEditLastName(e.target.value)}
                                      className="w-full h-[29px] px-3 py-0.5 bg-white border border-neutral-300 rounded-lg font-semibold text-neutral-900 focus:outline-none focus:border-neutral-500 text-xs sm:text-[12.5px]"
                                    />
                                  </div>
                                  <div>
                                    <label className="block text-[10px] font-semibold text-neutral-600 tracking-wider uppercase mb-1">
                                      {selectedLang === 'EN' ? 'Country' : 'País'}
                                    </label>
                                    <input
                                      type="text"
                                      value={editCountry}
                                      onChange={(e) => setEditCountry(e.target.value)}
                                      className="w-full h-[29px] px-3 py-0.5 bg-white border border-neutral-300 rounded-lg font-semibold text-neutral-900 focus:outline-none focus:border-neutral-500 text-xs sm:text-[12.5px]"
                                    />
                                  </div>
                                  <div>
                                    <label className="block text-[10px] font-semibold text-neutral-600 tracking-wider uppercase mb-1">
                                      {selectedLang === 'EN' ? 'English Level' : 'Nivel de Inglés'}
                                    </label>
                                    <select
                                      value={selectedLevel}
                                      onChange={(e) => setSelectedLevel(e.target.value)}
                                      className="w-full h-[29px] px-2.5 py-0.5 bg-white border border-neutral-300 rounded-lg font-semibold text-neutral-900 focus:outline-none text-xs sm:text-[12.5px] cursor-pointer"
                                    >
                                      <option value="Medium">{selectedLang === 'EN' ? 'Medium (B1-B2)' : 'Medio (B1-B2)'}</option>
                                      <option value="Beginner">{selectedLang === 'EN' ? 'Beginner (A1-A2)' : 'Principiante (A1-A2)'}</option>
                                      <option value="Advanced">{selectedLang === 'EN' ? 'Advanced (C1-C2)' : 'Avanzado (C1-C2)'}</option>
                                      <option value="Not Sure">{selectedLang === 'EN' ? 'Not Sure' : 'No estoy seguro'}</option>
                                    </select>
                                  </div>
                                  <div>
                                    <label className="block text-[10px] font-semibold text-neutral-600 tracking-wider uppercase mb-1">
                                      {selectedLang === 'EN' ? 'Education Level' : 'Nivel de Educación'}
                                    </label>
                                    <select
                                      value={editEducation}
                                      onChange={(e) => setEditEducation(e.target.value)}
                                      className="w-full h-[29px] px-2.5 py-0.5 bg-white border border-neutral-300 rounded-lg font-semibold text-neutral-900 focus:outline-none text-xs sm:text-[12.5px] cursor-pointer"
                                    >
                                      <option value="Universidad">{selectedLang === 'EN' ? 'University' : 'Universidad'}</option>
                                      <option value="Secundaria">{selectedLang === 'EN' ? 'Secondary / High School' : 'Secundaria'}</option>
                                      <option value="Posgrado">{selectedLang === 'EN' ? 'Postgraduate' : 'Posgrado'}</option>
                                      <option value="Autodidacta">{selectedLang === 'EN' ? 'Self-Taught' : 'Autodidacta'}</option>
                                    </select>
                                  </div>
                                  <div>
                                    <label className="block text-[10px] font-semibold text-neutral-600 tracking-wider uppercase mb-1">
                                      {selectedLang === 'EN' ? 'Phone (Optional)' : 'Teléfono (Opcional)'}
                                    </label>
                                    <input
                                      type="tel"
                                      value={editPhone}
                                      onChange={(e) => setEditPhone(e.target.value)}
                                      className="w-full h-[29px] px-3 py-0.5 bg-white border border-neutral-300 rounded-lg font-semibold text-neutral-900 focus:outline-none focus:border-neutral-500 text-xs sm:text-[12.5px]"
                                    />
                                  </div>
                                  <div className="col-span-full">
                                    <label className="block text-[10px] font-semibold text-neutral-600 tracking-wider uppercase mb-1">
                                      {selectedLang === 'EN' ? 'Email Address' : 'Correo Electrónico'}
                                    </label>
                                    <input
                                      type="email"
                                      value={editEmail}
                                      onChange={(e) => setEditEmail(e.target.value)}
                                      className="w-full h-[29px] px-3 py-0.5 bg-white border border-neutral-300 rounded-lg font-semibold text-neutral-900 focus:outline-none focus:border-neutral-500 text-xs sm:text-[12.5px]"
                                    />
                                  </div>
                                </div>

                                <div className="flex justify-start pt-3 mt-1">
                                  <button
                                    type="button"
                                    onClick={handleUpdateProfile}
                                    className="px-7 py-2 bg-amber-400 hover:bg-[#081545] text-black hover:text-white font-bold rounded-full text-xs sm:text-[11.5px] transition-colors duration-200 cursor-pointer active:scale-95 flex items-center justify-center gap-1.5 shadow-xs"
                                  >
                                    <span>{selectedLang === 'EN' ? 'Save' : 'Guardar'}</span>
                                  </button>
                                </div>
                              </div>
                            ) : (
                              <div>
                                {/* Header: Title with Pencil Edit Button */}
                                <div className="flex items-center gap-2 mb-3">
                                  <button
                                    type="button"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setIsEditingProfile(prev => !prev);
                                    }}
                                    className="w-[22px] h-[22px] sm:w-[26px] sm:h-[26px] rounded-full bg-yellow-400 text-black hover:bg-black hover:text-white flex items-center justify-center transition-all duration-200 hover:scale-105 active:scale-95 cursor-pointer select-none group shrink-0"
                                    title={selectedLang === 'EN' ? 'Edit Personal Information' : 'Editar Información Personal'}
                                    aria-label={selectedLang === 'EN' ? 'Edit Personal Information' : 'Editar Información Personal'}
                                  >
                                    <Pencil className="w-[13px] h-[13px] sm:w-[14px] sm:h-[14px] text-current stroke-[2.2] group-hover:scale-110 transition-all" />
                                  </button>
                                  <h4 className="text-sm sm:text-[15.5px] font-bold tracking-wider text-neutral-900 font-mono uppercase text-left">
                                    {selectedLang === 'EN' ? 'Personal Information' : 'Información Personal'}
                                  </h4>
                                </div>

                                {/* Metric Fields Grid */}
                                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-x-5 gap-y-3.5">
                                  <div className="min-w-0">
                                    <span className="block text-[10px] font-semibold uppercase tracking-wider text-black mb-1 leading-tight">
                                      {selectedLang === 'EN' ? 'Country' : 'País'}
                                    </span>
                                    <span className="block font-semibold text-neutral-900 text-sm leading-snug">
                                      {(() => {
                                        const c = user.country;
                                        return (!c || c === 'No especificado' || c === 'Not specified') ? 'Guatemala' : c;
                                      })()}
                                    </span>
                                  </div>

                                  <div className="min-w-0">
                                    <span className="block text-[10px] font-semibold uppercase tracking-wider text-black mb-1 leading-tight">
                                      {selectedLang === 'EN' ? 'English Level' : 'Nivel de Inglés'}
                                    </span>
                                    <span className="block font-semibold text-neutral-900 text-sm leading-snug">
                                      {getTranslatedLevel(user.levelEstimate || 'Intermediate')}
                                    </span>
                                  </div>

                                  <div className="min-w-0">
                                    <span className="block text-[10px] font-semibold uppercase tracking-wider text-black mb-1 leading-tight">
                                      {selectedLang === 'EN' ? 'Education' : 'Educación'}
                                    </span>
                                    <span className="block font-semibold text-neutral-900 text-sm leading-snug">
                                      {getTranslatedEducation(user.education)}
                                    </span>
                                  </div>

                                  <div className="min-w-0">
                                    <span className="block text-[10px] font-semibold uppercase tracking-wider text-black mb-1 leading-tight">
                                      {selectedLang === 'EN' ? 'Phone (Optional)' : 'Teléfono (Opcional)'}
                                    </span>
                                    <span className="block font-semibold text-neutral-900 text-sm leading-snug">
                                      {formatPhoneNumber(user.phone) || (selectedLang === 'EN' ? 'Not specified' : 'No especificado')}
                                    </span>
                                  </div>

                                  <div className="col-span-1 sm:col-span-2 min-w-0">
                                    <span className="block text-[10px] font-semibold uppercase tracking-wider text-black mb-1 leading-tight">
                                      {selectedLang === 'EN' ? 'Email Address' : 'Correo Electrónico'}
                                    </span>
                                    <span className="block font-semibold text-neutral-900 text-sm leading-snug truncate" title={user.email || 'theorangesnowman@gmail.com'}>
                                      {user.email || 'theorangesnowman@gmail.com'}
                                    </span>
                                  </div>
                                </div>

                                {/* TIEMPO ASIGNADO (debajo de Información Personal) */}
                                <div className="mt-3.5">
                                  <div className="flex items-center gap-2 mb-1">
                                    <h5 className="text-[10px] font-semibold uppercase tracking-wider text-black font-mono">
                                      {selectedLang === 'EN' ? 'Assigned Time' : 'Tiempo Asignado'}
                                    </h5>
                                  </div>
                                  <span className="block font-semibold text-neutral-900 text-sm leading-snug">
                                    {formatStudyTimeCompact(user.timePerWeek)}
                                  </span>

                                  {/* Progress bar directly below it, aligned with the start of column 3 */}
                                  {(() => {
                                    const displayProgressPercent = Math.max(weeklyStudyProgress.progressPercent, 15);
                                    return (
                                      <div className="w-full md:w-[calc(66.6667%+0.8333rem)] h-7 rounded-full bg-white overflow-hidden flex items-center mt-2">
                                        <div
                                          className="h-full bg-yellow-400 rounded-l-full rounded-r-none flex items-center justify-center transition-all duration-500"
                                          style={{ width: `${displayProgressPercent}%` }}
                                        >
                                          <span className="text-black font-sans text-[11px] font-bold tracking-wide whitespace-nowrap px-1.5">
                                            {displayProgressPercent} %
                                          </span>
                                        </div>
                                      </div>
                                    );
                                  })()}
                                </div>

                                {/* METAS ALCANZADAS / GOALS REACHED (Certificados alcanzados debajo de Tiempo Asignado) */}
                                <div className="mt-3.5">
                                  <div className="flex items-center gap-2 mb-2">
                                    <h5 className="text-[10px] font-semibold uppercase tracking-wider text-black font-mono">
                                      {selectedLang === 'EN' ? 'Goals Reached' : 'Metas Alcanzadas'}
                                    </h5>
                                  </div>

                                  {reachedCertificates.length > 0 ? (
                                    <div className="flex items-start gap-4 sm:gap-5 flex-wrap">
                                      {reachedCertificates.map((certItem) => {
                                        const symbolMap: Record<'A2' | 'B1' | 'B2' | 'C1', { src: string; scaleClass: string }> = {
                                          A2: { src: certSymA2, scaleClass: 'scale-[1.02]' },
                                          B1: { src: certSymB1, scaleClass: 'scale-[1.02]' },
                                          B2: { src: certSymB2, scaleClass: 'scale-[1.02]' },
                                          C1: { src: certSymC1, scaleClass: 'scale-[1.02]' },
                                        };
                                        const certTitle = CEFR_TITLES[certItem.level][selectedLang === 'EN' ? 'en' : 'es'];
                                        const symbolSpec = symbolMap[certItem.level];
                                        return (
                                          <button
                                            key={certItem.level}
                                            type="button"
                                            onClick={(e) => {
                                              e.stopPropagation();
                                              window.dispatchEvent(
                                                new CustomEvent('voyager_select_certificate_level', { detail: certItem.level })
                                              );
                                              const el = document.getElementById('voyager-certificates-section');
                                              if (el) {
                                                el.scrollIntoView({ behavior: 'smooth', block: 'start' });
                                              }
                                            }}
                                            className="group flex flex-col items-center text-center cursor-pointer transition-transform duration-200 hover:scale-105 active:scale-95 focus:outline-none select-none"
                                            title={`${certItem.level} — ${certTitle}${certItem.approvedAt ? ` (${certItem.approvedAt})` : ''}`}
                                            aria-label={`${certItem.level} ${certTitle}`}
                                          >
                                            <div className="w-[54px] h-[54px] sm:w-[60px] sm:h-[60px] rounded-full overflow-hidden shrink-0 bg-yellow-400">
                                              <img
                                                src={symbolSpec.src}
                                                alt={`${certItem.level} ${certTitle}`}
                                                referrerPolicy="no-referrer"
                                                className={`w-full h-full object-cover ${symbolSpec.scaleClass}`}
                                              />
                                            </div>
                                            <span className="mt-1.5 text-[11.5px] font-bold text-neutral-900 font-sans leading-tight">
                                              {certItem.level}
                                            </span>
                                          </button>
                                        );
                                      })}
                                    </div>
                                  ) : (
                                    <p className="text-[10pt] font-normal not-italic text-neutral-700 font-sans leading-relaxed text-left">
                                      {selectedLang === 'EN'
                                        ? 'No approved certificates yet.'
                                        : 'Aún no hay certificados aprobados.'}
                                    </p>
                                  )}
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    )}

                    {/* TAB 2: INTERESES Y TEMAS ASIGNADOS */}
                    {activeProfileTab === 'interests' && (
                      <div className="w-full text-left animate-fade-in space-y-3 my-auto">
                        <div className="flex items-center gap-2 mb-1">
                          <button
                            type="button"
                            onClick={() => setIsAddingLiveInterest(prev => !prev)}
                            className="w-[22px] h-[22px] sm:w-[26px] sm:h-[26px] rounded-full bg-yellow-400 text-black hover:bg-black hover:text-white flex items-center justify-center transition-all duration-200 hover:scale-105 active:scale-95 cursor-pointer select-none group shrink-0"
                            title={selectedLang === 'EN' ? 'Add another interest' : 'Agregar otro interés'}
                            aria-label={selectedLang === 'EN' ? 'Add another interest' : 'Agregar otro interés'}
                          >
                            <Plus className="w-[13px] h-[13px] sm:w-[14px] sm:h-[14px] text-current stroke-[2.5] group-hover:scale-110 transition-all" />
                          </button>
                          <h4 className="text-sm sm:text-[15.5px] font-bold tracking-wider text-neutral-900 font-mono uppercase">
                            {selectedLang === 'EN' ? 'Interests & Assigned Topics' : 'Intereses y Temas Asignados'}
                          </h4>
                        </div>

                        <p className="text-[10pt] font-normal not-italic text-neutral-700 font-sans leading-relaxed text-left max-w-[620px] mb-2">
                          {selectedLang === 'EN'
                            ? 'Topics with a red outline are assigned by your teacher, dark-outlined topics are your personal interests, and blue-outlined lessons are 3 Voyager recommendations tailored to your lowest Analysis areas.'
                            : 'Los temas con borde rojo son asignados por tu docente, los de borde oscuro son tus intereses personales y los de borde azul son 3 lecciones recomendadas por Voyager según tus áreas más débiles en el Análisis.'}
                        </p>

                        <div className="flex flex-wrap items-center gap-2 pt-1">
                          {displayedInterestsAndTopics.map((item, idx) => (
                            <span
                              key={idx}
                              title={item.isAssigned ? (selectedLang === 'EN' ? 'Assigned by teacher' : 'Asignado por el docente') : undefined}
                              className={`inline-flex items-center px-3.5 py-1.5 bg-transparent text-black rounded-full text-xs sm:text-[13px] font-semibold transition-all border ${
                                item.isAssigned ? 'border-[#EF4444] border-[1.5px]' : 'border-black'
                              }`}
                            >
                              {item.text}
                            </span>
                          ))}

                          {/* Inline input to add another interest in live view */}
                          {isAddingLiveInterest && (
                            <div className="inline-flex items-center gap-1.5 bg-transparent px-2.5 py-1 rounded-full border border-black animate-fade-in">
                              <input
                                type="text"
                                autoFocus
                                value={newLiveInterestInput}
                                onChange={(e) => setNewLiveInterestInput(e.target.value)}
                                onKeyDown={(e) => {
                                  if (e.key === 'Enter') {
                                    e.preventDefault();
                                    handleAddLiveInterest();
                                  } else if (e.key === 'Escape') {
                                    setIsAddingLiveInterest(false);
                                    setNewLiveInterestInput('');
                                  }
                                }}
                                placeholder={selectedLang === 'EN' ? 'New...' : 'Nuevo...'}
                                className="w-24 text-xs bg-transparent focus:outline-none text-neutral-900 font-semibold placeholder:text-neutral-500 placeholder:font-normal"
                              />
                              <button
                                type="button"
                                onClick={handleAddLiveInterest}
                                disabled={!newLiveInterestInput.trim()}
                                className="text-xs font-semibold text-neutral-900 hover:text-black disabled:opacity-40 cursor-pointer"
                              >
                                ✓
                              </button>
                              <button
                                type="button"
                                onClick={() => {
                                  setIsAddingLiveInterest(false);
                                  setNewLiveInterestInput('');
                                }}
                                className="text-neutral-500 hover:text-neutral-700 cursor-pointer"
                              >
                                <X className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          )}

                          {/* 3 Voyager Recommended Lessons (Blue outline) based on Lesson Analysis weaknesses */}
                          {voyagerRecommendedLessons.map((rec) => (
                            <button
                              key={rec.key}
                              type="button"
                              onClick={() => {
                                if (typeof onStartLesson === 'function') {
                                  onStartLesson(rec.lesson);
                                } else if (typeof onAskVoyager === 'function') {
                                  const prompt = selectedLang === 'EN'
                                    ? `As USA Voyager, let's practice the recommended lesson "${rec.lesson.title}" to strengthen my ${rec.label} (${rec.pct}%).`
                                    : `Como USA Voyager, practiquemos la lección recomendada "${rec.lesson.title}" para fortalecer mi ${rec.label} (${rec.pct}%).`;
                                  onAskVoyager(prompt);
                                }
                              }}
                              title={
                                selectedLang === 'EN'
                                  ? `Recommended by Voyager · ${rec.label} (${rec.pct}%)`
                                  : `Recomendada por Voyager · ${rec.label} (${rec.pct}%)`
                              }
                              className="inline-flex items-center px-3.5 py-1.5 bg-transparent hover:bg-blue-50/70 text-black rounded-full text-xs sm:text-[13px] font-semibold transition-all border border-[#2563EB] border-[1.5px] cursor-pointer"
                            >
                              {rec.lesson.title}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* TAB 3: PAQUETES (Standardized 3 Columns: Gratis, Básico, Pro) */}
                    {activeProfileTab === 'packages' && (
                      <div className="w-full text-left animate-fade-in my-auto py-1">
                        {/* 3 Columns Grid: No pill cards, separated by 1pt dotted black lines */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-0 w-full items-stretch divide-y-[1pt] md:divide-y-0 md:divide-x-[1pt] divide-dotted divide-black">
                          
                          {/* Col 1: Gratis */}
                          <div className="py-4 md:py-1 px-2 sm:px-4 md:pl-2 md:pr-5 flex flex-col justify-between h-full">
                            <div>
                              <h5 className="text-xl sm:text-2xl font-semibold text-black font-sans tracking-tight text-center mb-3">
                                {selectedLang === 'EN' ? 'Free' : 'Gratis'} $0
                              </h5>

                              <p className="text-[10pt] font-normal not-italic text-black mb-3.5 leading-relaxed font-sans min-h-[36px]">
                                {selectedLang === 'EN' 
                                  ? 'Self-guided practice and official citizenship questions.' 
                                  : 'Práctica guiada y preguntas cívicas oficiales.'}
                              </p>

                              <div className="space-y-2.5 pt-2 text-xs text-black">
                                <div className="flex items-start gap-2">
                                  <Check className="w-4 h-4 text-emerald-600 mt-0.5 shrink-0 stroke-[3.25]" />
                                  <span>{selectedLang === 'EN' ? '128 Official USCIS Civics Questions' : '128 Preguntas cívicas oficiales USCIS'}</span>
                                </div>
                                <div className="flex items-start gap-2">
                                  <Check className="w-4 h-4 text-emerald-600 mt-0.5 shrink-0 stroke-[3.25]" />
                                  <span>{selectedLang === 'EN' ? 'Conversations with USA Voyager AI' : 'Conversaciones con USA Voyager AI'}</span>
                                </div>
                                <div className="flex items-start gap-2">
                                  <Check className="w-4 h-4 text-emerald-600 mt-0.5 shrink-0 stroke-[3.25]" />
                                  <span>{selectedLang === 'EN' ? 'Initial English level estimation' : 'Diagnóstico inicial de nivel de inglés'}</span>
                                </div>
                                <div className="flex items-start gap-2 text-black">
                                  <X className="w-4 h-4 text-black mt-0.5 shrink-0 stroke-[3.25]" />
                                  <span>{selectedLang === 'EN' ? 'No live teacher classes' : 'Sin acceso a clases con docentes'}</span>
                                </div>
                              </div>
                            </div>

                            <div className="pt-4 mt-auto flex justify-center">
                              <button
                                type="button"
                                disabled={user.plan !== 'PRO'}
                                onClick={() => {
                                  if (typeof window !== 'undefined') {
                                    localStorage.setItem('voyager_plan_explicitly_set', '1');
                                  }
                                  const updated = { ...user, plan: 'FREE' as const };
                                  saveUser(updated);
                                }}
                                title={user.plan !== 'PRO' ? (selectedLang === 'EN' ? 'Current Plan' : 'Plan Actual') : (selectedLang === 'EN' ? 'Downgrade to Free' : 'Cambiar a Gratis')}
                                className={`h-8 px-5 rounded-full text-xs font-bold uppercase tracking-wide transition-all inline-flex items-center justify-center bg-white text-black ${
                                  user.plan === 'PRO'
                                    ? 'hover:bg-neutral-100 cursor-pointer active:scale-95'
                                    : 'cursor-default'
                                }`}
                              >
                                {selectedLang === 'EN' ? 'Free' : 'Gratis'}
                              </button>
                            </div>
                          </div>

                          {/* Col 2: Básico */}
                          <div className="py-4 md:py-1 px-2 sm:px-4 md:px-5 flex flex-col justify-between h-full">
                            <div>
                              <h5 className="text-xl sm:text-2xl font-semibold text-black font-sans tracking-tight text-center mb-3">
                                {selectedLang === 'EN' ? 'Basic' : 'Básico'} $19
                              </h5>

                              <p className="text-[10pt] font-normal not-italic text-black mb-3.5 leading-relaxed font-sans min-h-[36px]">
                                {selectedLang === 'EN' 
                                  ? 'Full scenario library plus weekly live group classes with teachers.' 
                                  : 'Catálogo completo y clases grupales en vivo semanales con docentes.'}
                              </p>

                              <div className="space-y-2.5 pt-2 text-xs text-black">
                                <div className="flex items-start gap-2">
                                  <Check className="w-4 h-4 text-emerald-600 mt-0.5 shrink-0 stroke-[3.25]" />
                                  <span className="font-semibold text-black">
                                    {selectedLang === 'EN' ? '1 Weekly live group class (4/mo)' : '1 Clase grupal semanal en vivo (4/mes)'}
                                  </span>
                                </div>
                                <div className="flex items-start gap-2">
                                  <Check className="w-4 h-4 text-emerald-600 mt-0.5 shrink-0 stroke-[3.25]" />
                                  <span>{selectedLang === 'EN' ? 'Full interactive lessons & scenarios' : 'Acceso a todas las lecciones y escenarios'}</span>
                                </div>
                                <div className="flex items-start gap-2">
                                  <Check className="w-4 h-4 text-emerald-600 mt-0.5 shrink-0 stroke-[3.25]" />
                                  <span>{selectedLang === 'EN' ? 'Unlimited voice practice with Voyager' : 'Práctica ilimitada de voz con Voyager'}</span>
                                </div>
                                <div className="flex items-start gap-2">
                                  <Check className="w-4 h-4 text-emerald-600 mt-0.5 shrink-0 stroke-[3.25]" />
                                  <span>{selectedLang === 'EN' ? 'Accent & pronunciation feedback' : 'Revisión auditiva de pronunciación'}</span>
                                </div>
                              </div>
                            </div>

                            <div className="pt-4 mt-auto flex justify-center">
                              <button
                                type="button"
                                onClick={() => {
                                  setSelectedPlanPaymentType('pro_upgrade');
                                  setIsPlanPaymentOpen(true);
                                }}
                                className="h-8 px-5 rounded-full text-xs font-bold uppercase tracking-wide bg-white hover:bg-neutral-100 text-black transition-all active:scale-95 cursor-pointer inline-flex items-center justify-center gap-1.5"
                              >
                                <span>{selectedLang === 'EN' ? 'Basic' : 'Básico'}</span>
                              </button>
                            </div>
                          </div>

                          {/* Col 3: Pro */}
                          <div className="py-4 md:py-1 px-2 sm:px-4 md:pl-5 md:pr-2 flex flex-col justify-between h-full">
                            <div>
                              <h5 className="text-xl sm:text-2xl font-semibold text-black font-sans tracking-tight text-center mb-3">
                                {selectedLang === 'EN' ? 'Pro' : 'Pro'} $49
                              </h5>

                              <p className="text-[10pt] font-normal not-italic text-black mb-3.5 leading-relaxed font-sans min-h-[36px]">
                                {selectedLang === 'EN' 
                                  ? 'Private 1-on-1 certified classes, mock interviews, and official certificate.' 
                                  : 'Clases privadas 1-a-1 con docentes, simulacros y certificado oficial.'}
                              </p>

                              <div className="space-y-2.5 pt-2 text-xs text-black">
                                <div className="flex items-start gap-2">
                                  <Check className="w-4 h-4 text-emerald-600 mt-0.5 shrink-0 stroke-[3.25]" />
                                  <span className="font-semibold text-black">
                                    {selectedLang === 'EN' ? '4 Private 1-on-1 video classes / mo' : '4 Clases privadas 1-a-1 al mes'}
                                  </span>
                                </div>
                                <div className="flex items-start gap-2">
                                  <Check className="w-4 h-4 text-emerald-600 mt-0.5 shrink-0 stroke-[3.25]" />
                                  <span>{selectedLang === 'EN' ? 'Simulated USCIS & job interviews' : 'Simulacros de examen y entrevistas'}</span>
                                </div>
                                <div className="flex items-start gap-2">
                                  <Check className="w-4 h-4 text-emerald-600 mt-0.5 shrink-0 stroke-[3.25]" />
                                  <span>{selectedLang === 'EN' ? 'Official English Proficiency Certificate' : 'Certificado oficial emitido por Voyager'}</span>
                                </div>
                                <div className="flex items-start gap-2">
                                  <Check className="w-4 h-4 text-emerald-600 mt-0.5 shrink-0 stroke-[3.25]" />
                                  <span>{selectedLang === 'EN' ? 'Priority 1-on-1 coach chat support' : 'Acompañamiento prioritario continuo'}</span>
                                </div>
                              </div>
                            </div>

                            <div className="pt-4 mt-auto flex justify-center">
                              <button
                                type="button"
                                disabled={user.plan === 'PRO'}
                                onClick={() => {
                                  if (user.plan !== 'PRO') {
                                    if (typeof window !== 'undefined') {
                                      localStorage.setItem('voyager_plan_explicitly_set', '1');
                                    }
                                    setSelectedPlanPaymentType('monthly_4');
                                    setIsPlanPaymentOpen(true);
                                  }
                                }}
                                title={user.plan === 'PRO' ? (selectedLang === 'EN' ? 'Current Plan (PRO)' : 'Plan Actual (PRO)') : (selectedLang === 'EN' ? 'Choose Pro' : 'Elegir Pro')}
                                className={`h-8 px-5 rounded-full text-xs font-bold uppercase tracking-wide transition-all inline-flex items-center justify-center gap-1.5 bg-amber-400 text-black ${
                                  user.plan === 'PRO'
                                    ? 'cursor-default'
                                    : 'hover:bg-amber-300 active:scale-95 cursor-pointer'
                                }`}
                              >
                                <span>{selectedLang === 'EN' ? 'Pro' : 'Pro'}</span>
                              </button>
                            </div>
                          </div>

                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Certificates Section */}
                <div id="voyager-certificates-section" className="w-full min-w-0 pt-[3em] space-y-1 scroll-mt-6 rounded-[24px]">
                  <div className="text-left">
                    <h3 className={`text-sm sm:text-[15.5px] font-bold tracking-wider ${isDarkMode ? 'text-slate-100' : 'text-neutral-900'} font-sans uppercase text-left`}>
                      {selectedLang === 'EN' ? 'Certificates' : 'Certificados'}
                    </h3>
                    <p className={`mt-1 text-[10pt] font-normal not-italic ${isDarkMode ? 'text-slate-300' : 'text-neutral-700'} font-sans leading-relaxed text-left`}>
                      {selectedLang === 'EN'
                        ? 'Select each CEFR level to preview your official USA Voyager progress certificate and download it once approved.'
                        : 'Selecciona cada nivel MCER para ver tu certificado oficial de progreso USA Voyager y descargarlo cuando sea aprobado.'}
                    </p>
                  </div>

                  {/* USA VOYAGER PROGRESS CERTIFICATE (Positioned below Personal Information per user request) */}
                  <div className="w-full min-w-0 pt-[1.5em]">
                    <StudentCertificatePreview
                      user={user}
                      selectedLang={selectedLang}
                      onAskVoyager={onAskVoyager}
                      isDarkMode={isDarkMode}
                    />
                  </div>
                </div>

                {/* 📊 Lesson Analysis Section: Vintage Index Card matching the rest of the application */}
                <div className="w-full min-w-0 pt-[3em]">
                  {/* VINTAGE INDEX-CARD TAB FOR LESSON ANALYSIS */}
                  <div className="w-full flex items-end relative pt-2 px-[14px] sm:px-[15px] z-10 overflow-hidden sm:overflow-visible max-w-full">
                    <div className="flex items-end gap-1.5 sm:gap-2.5 relative max-w-full">
                      <button
                        type="button"
                        onClick={() => {
                          if (typeof window !== 'undefined' && window.speechSynthesis) {
                            try {
                              window.speechSynthesis.cancel();
                            } catch (err) {}
                          }
                          if (typeof onAskVoyager === 'function') {
                            const prompt = selectedLang === 'EN'
                              ? `[AUTO_SYSTEM: MANDATORY VOYAGER VOICE INSTRUCTION]
As USA Voyager, speak directly to the student in your warm, encouraging voice.
Explain this Lesson Analysis section in 2-3 engaging, clear sentences:
Tell the student that these metrics track their real conversational performance in pronunciation, fluency, vocabulary, and confidence, showing their growth and areas to reinforce.
MANDATORY: Speak aloud in your official Voyager voice only.`
                              : `[AUTO_SYSTEM: INSTRUCCIÓN MANDATORIA DE VOZ DE VOYAGER]
Como USA Voyager, habla directamente al estudiante con tu voz oficial cálida y motivadora en español.
Explica esta sección de Análisis de Lecciones en 2 o 3 oraciones claras y motivadoras:
Dile al estudiante que estas métricas evalúan su desempeño real en pronunciación, fluidez, vocabulario y confianza, mostrando sus avances y áreas a reforzar.
MANDATORIO: Habla en voz alta con tu voz oficial de Voyager únicamente.`;
                            onAskVoyager(prompt);
                          }
                        }}
                        className="group relative h-[48px] sm:h-[54px] px-4 sm:px-5 md:px-6 min-w-0 flex-initial flex flex-col items-center pt-2 sm:pt-2.5 pb-1.5 sm:pb-2 justify-center cursor-pointer transition-colors bg-[#F8ECC0] text-[#F8ECC0] z-30 rounded-t-[14px] sm:rounded-t-[18px] -mb-[2px] after:content-[''] after:absolute after:-bottom-[3px] after:left-0 after:right-0 after:h-[5px] after:bg-[#F8ECC0] after:z-30 select-none"
                        title={
                          selectedLang === 'EN'
                            ? 'Click to hear Voyager explain this section'
                            : 'Haz clic para escuchar la explicación de Voyager'
                        }
                      >
                        {/* Right Concave Flare / Inverted Fillet (Vintage filing index-card tab) */}
                        <svg
                          className="absolute -right-[14px] sm:-right-[15px] bottom-0 w-[14px] sm:w-[15px] h-[14px] sm:h-[15px] pointer-events-none overflow-visible transition-colors"
                          viewBox="0 0 16 16"
                          fill="currentColor"
                        >
                          <path d="M 0 0 L 0 16.5 L 16 16.5 Q 0 16.5 0 0 Z" />
                        </svg>

                        {/* Tab Label */}
                        <div className="inline-flex items-center justify-center max-w-full px-0.5 leading-tight">
                          <span className="text-[13px] sm:text-[14.5px] md:text-[15.5px] font-bold leading-none text-center whitespace-nowrap text-[#1F1A14] group-hover:text-black uppercase tracking-wide">
                            {selectedLang === 'EN' ? 'Lesson Analysis' : 'Análisis de Lecciones'}
                          </span>
                        </div>
                      </button>
                    </div>
                  </div>

                  {/* Main IndexCard Body */}
                  <div 
                    id="voyager-analysis-progress-section" 
                    className="bg-[#F8ECC0] rounded-b-[24px] sm:rounded-b-[28px] rounded-t-[14px] sm:rounded-t-[18px] p-3.5 sm:p-5 md:p-6 shadow-xs relative z-0 text-neutral-900 scroll-mt-6"
                  >
                    {/* Score Circular Rings Section - Row 1: Conversation Analysis */}
                    {(() => {
                      const getPct = (val?: number, fallback: number = 80) => {
                        if (val === undefined || val === null || val <= 0) return fallback;
                        if (val <= 5) return Math.min(100, Math.round(val * 20));
                        return Math.min(100, Math.round(val));
                      };

                      const metricSupportRuleEn = 'IMPORTANT VOYAGER MANDATE FOR INTERACTIVE GRAPH ANALYSIS: As Voyager, when the user clicks this graph or metric, you MUST analyze and explain in natural dynamic language: 1) What this graph/chart represents, 2) What the user\'s current real data/percentage means, 3) Why this metric matters for their real-world English communication and citizenship/immersion goals, and 4) What key conclusion or actionable recommendation can be drawn. Do NOT use fixed static scripts or simply repeat numbers. Do NOT teach an English lesson or ask practice questions in this response.';
                      const metricSupportRuleEs = 'REGLA Y MANDATO OBLIGATORIO DE VOYAGER PARA ANÁLISIS DE GRÁFICAS: Como Voyager, cuando el usuario hace clic en esta gráfica o métrica, DEBES explicar y analizar en lenguaje natural y dinámico: 1) Qué representa la gráfica, 2) Qué significan sus datos reales actuales y porcentaje, 3) Por qué importa esta métrica para su comunicación real en inglés y sus metas (como ciudadanía o inserción laboral), y 4) Qué conclusión o recomendación clave se puede sacar. NO uses textos fijos ni te limites a repetir números. NO des una clase de inglés ni hagas preguntas de práctica en esta respuesta.';

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
                        <div className="p-1 sm:p-2 space-y-3">
                          <p className="text-[10pt] font-normal not-italic text-neutral-700 font-sans leading-relaxed text-left px-0.5">
                            {selectedLang === 'EN'
                              ? 'These metrics track your conversational performance across pronunciation, fluency, vocabulary, and confidence. Click any circle to hear Voyager analyze your progress and recommend next steps.'
                              : 'Estas métricas evalúan tu desempeño conversacional en pronunciación, fluidez, vocabulario y confianza. Haz clic en cualquier círculo para escuchar el análisis de Voyager y tus próximos pasos.'}
                          </p>
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
                                  className="flex flex-col items-center text-center group cursor-pointer hover:scale-105 active:scale-95 transition-all duration-200 focus:outline-none p-2 rounded-xl border border-transparent"
                                  title={selectedLang === 'EN' ? `Click to ask Voyager about ${item.title}` : `Haz clic para que Voyager te explique ${item.title}`}
                                >
                                  {/* SVG Donut Circle */}
                                  <div className="relative w-24 h-24 sm:w-28 sm:h-28 flex items-center justify-center my-0.5">
                                    <svg viewBox="0 0 100 100" className="w-full h-full -rotate-90 transform group-hover:scale-110 transition-all duration-300">
                                      {/* Background Dark Arc */}
                                      <circle
                                        cx="50"
                                        cy="50"
                                        r={radius}
                                        fill="transparent"
                                        stroke={isDarkMode ? '#1E293B' : '#333333'}
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
                                        className="transition-all duration-700 ease-out group-hover:stroke-amber-400"
                                      />
                                    </svg>

                                    {/* Percentage / Letter Grade Text Centered */}
                                    <div className="absolute inset-0 flex items-center justify-center">
                                      <span className={`text-xl sm:text-2xl font-bold font-sans tracking-tight ${isDarkMode ? 'text-white group-hover:text-amber-400' : 'text-neutral-900 group-hover:text-amber-600'} transition-colors`}>
                                        {item.displayText || `${pct}%`}
                                      </span>
                                    </div>
                                  </div>

                                  {/* Metric Title: Demi-Bold (font-semibold) */}
                                  <h5 className={`text-xs sm:text-sm font-semibold ${isDarkMode ? 'text-slate-100 group-hover:text-amber-400' : 'text-neutral-900 group-hover:text-amber-600'} mt-1 font-sans tracking-tight transition-colors`}>
                                    {item.title}
                                  </h5>

                                  {/* Subtitle description: Approximately 12 pts (~12px) */}
                                  <p className={`text-[12px] sm:text-[12.5px] ${isDarkMode ? 'text-slate-400' : 'text-neutral-600'} font-sans font-normal mt-0.5 leading-tight max-w-[155px]`}>
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
                </div>

                {/* Lessons Section */}
                <div className="w-full min-w-0 pt-[3em] space-y-1">
                  <div className="text-left">
                    <h3 className={`text-sm sm:text-[15.5px] font-bold tracking-wider ${isDarkMode ? 'text-slate-100' : 'text-neutral-900'} font-sans uppercase text-left`}>
                      {selectedLang === 'EN' ? 'Lessons' : 'Lecciones'}
                    </h3>
                    <p className={`mt-1 text-[10pt] font-normal not-italic ${isDarkMode ? 'text-slate-300' : 'text-neutral-700'} font-sans leading-relaxed text-left`}>
                      {selectedLang === 'EN'
                        ? 'Explore your assigned, in-progress, and completed lessons, and click any card to practice directly with Voyager.'
                        : 'Explora tus lecciones asignadas, en proceso y completadas, y haz clic en cualquier tarjeta para practicar con Voyager.'}
                    </p>
                  </div>

                  {/* 🌟 Lesson Progress Tabs Section (Calendar-style folder tabs with horizontal progress bars) */}
                  <div id="voyager-lessons-section" className="pt-[1.5em] scroll-mt-6 rounded-[24px] overflow-visible">
                    <RecommendedProLessonsCarousel
                      user={user}
                      scores={scores}
                      pronunciationScore={pronunciationScore}
                      civicsScore={CivicsProgressTracker.calculateMasteryMetrics().masteryPercentage}
                      selectedLang={selectedLang}
                      onAskVoyager={onAskVoyager}
                      onStartLesson={onStartLesson}
                      onNavigateTab={onNavigateTab}
                      hideHeader={true}
                    />
                  </div>
                </div>

                {/* Calendar Section */}
                <div className="w-full min-w-0 pt-[3em] space-y-1">
                  <div className="text-left">
                    <h3 className={`text-sm sm:text-[15.5px] font-bold tracking-wider ${isDarkMode ? 'text-slate-100' : 'text-neutral-900'} font-sans uppercase text-left`}>
                      {selectedLang === 'EN' ? 'Calendar' : 'Calendario'}
                    </h3>
                    <p className={`mt-1 text-[10pt] font-normal not-italic ${isDarkMode ? 'text-slate-300' : 'text-neutral-700'} font-sans leading-relaxed text-left`}>
                      {selectedLang === 'EN'
                        ? 'Track your assigned lessons, active practice, completed sessions, and personal study tasks by month, week, or day.'
                        : 'Consulta tus lecciones asignadas, prácticas en proceso, sesiones completadas y tareas personales por mes, semana o día.'}
                    </p>
                  </div>

                  {/* 📊 Voyager Real Activity Calendar Section */}
                  <div id="voyager-activity-calendar-section" className="pt-[1.5em] animate-fade-in scroll-mt-6 rounded-[24px]">
                    <ActivityCalendar 
                      selectedLang={selectedLang}
                      savedChats={savedChatsList}
                      targetGoalMinutes={15}
                      onLoadChat={onLoadChat}
                      onAskVoyager={onAskVoyager}
                      user={user}
                    />
                  </div>
                </div>

                {/* ✉️ Mensajería Voyager — Sección Integrada en Pasaporte */}
                <div id="voyager-messaging-section" className="pt-[3em] pb-2 animate-fade-in scroll-mt-6 rounded-[24px]">
                  <VoyagerMessagingModal
                    selectedLang={selectedLang}
                    user={user}
                    onUnreadCountChange={setMessagingUnreadCount}
                    onAskVoyager={onAskVoyager}
                  />
                </div>
              </div>
            )}

            {activeSubTab === 'level' && (
              <div className="animate-fade-in py-1 space-y-3">
                {/* Student Stats Divider & Section Header */}
                <div className="pt-0.5">
                  <div className="flex items-center mb-2">
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

                    const metricSupportRuleEn = 'IMPORTANT VOYAGER MANDATE FOR INTERACTIVE GRAPH ANALYSIS: As Voyager, when the user clicks this graph or metric, you MUST analyze and explain in natural dynamic language: 1) What this graph/chart represents, 2) What the user\'s current real data/percentage means, 3) Why this metric matters for their real-world English communication and citizenship/immersion goals, and 4) What key conclusion or actionable recommendation can be drawn. Do NOT use fixed static scripts or simply repeat numbers. Do NOT teach an English lesson or ask practice questions in this response.';
                    const metricSupportRuleEs = 'REGLA Y MANDATO OBLIGATORIO DE VOYAGER PARA ANÁLISIS DE GRÁFICAS: Como Voyager, cuando el usuario hace clic en esta gráfica o métrica, DEBES explicar y analizar en lenguaje natural y dinámico: 1) Qué representa la gráfica, 2) Qué significan sus datos reales actuales y porcentaje, 3) Por qué importa esta métrica para su comunicación real en inglés y sus metas (como ciudadanía o inserción laboral), y 4) Qué conclusión o recomendación clave se puede sacar. NO uses textos fijos ni te limites a repetir números. NO des una clase de inglés ni hagas preguntas de práctica en esta respuesta.';

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
                      <div className="bg-white p-3 sm:p-4 rounded-2xl border border-neutral-200/90 shadow-2xs space-y-1">
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
                                className="flex flex-col items-center text-center group cursor-pointer hover:scale-105 active:scale-95 transition-all duration-200 focus:outline-none p-2 rounded-xl border border-transparent"
                                title={selectedLang === 'EN' ? `Click to ask Voyager about ${item.title}` : `Haz clic para que Voyager te explique ${item.title}`}
                              >
                                {/* SVG Donut Circle */}
                                <div className="relative w-24 h-24 sm:w-28 sm:h-28 flex items-center justify-center my-0.5">
                                  <svg viewBox="0 0 100 100" className="w-full h-full -rotate-90 transform group-hover:scale-110 transition-all duration-300">
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
                                      className="transition-all duration-700 ease-out group-hover:stroke-amber-400"
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
                <div className="flex flex-col md:flex-row items-center md:items-start justify-between gap-3 sm:gap-5 pt-1.5 border-t border-black">
                  
                  {/* Left Column: Avatar */}
                  <div className="w-full md:w-[35%] flex flex-col items-center md:items-start justify-center text-center md:text-left">
                    <div className="relative group flex-shrink-0 w-32 h-32 sm:w-40 sm:h-40">
                      <div 
                        onClick={() => triggerStudentOralReport()}
                        className="w-full h-full rounded-full bg-transparent border-0 cursor-pointer overflow-hidden flex items-center justify-center transition-all duration-200 hover:scale-[1.02] active:scale-95 group/avatar relative"
                        title={selectedLang === 'EN' ? 'Click photo to hear Voyager oral progress report' : 'Haz clic en la foto para escuchar el informe oral de progreso de Voyager'}
                      >
                        {renderAvatarContent(user)}
                        <div className="absolute inset-0 bg-black/20 opacity-0 group-hover/avatar:opacity-100 transition-opacity flex items-center justify-center pointer-events-none">
                          <Volume2 className="w-8 h-8 text-amber-300 drop-shadow-md animate-pulse" />
                        </div>
                      </div>
                    </div>

                    {/* Icon Action Buttons Below Picture (Flush Left, No Overlap, No Pill Shapes) */}
                    <div className="flex items-center justify-start gap-2 mt-2 flex-wrap">
                      {/* Pencil Edit Profile Button (Swapped from header) */}
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setIsEditingProfile(prev => !prev);
                        }}
                        className="w-8.5 h-8.5 sm:w-9 sm:h-9 rounded-full bg-black text-white hover:bg-amber-400 hover:text-black shadow-xs flex items-center justify-center transition-all duration-200 hover:scale-105 active:scale-95 cursor-pointer select-none group shrink-0"
                        title={isEditingProfile ? (selectedLang === 'EN' ? 'View Saved Profile' : 'Ver Guardado') : (selectedLang === 'EN' ? 'Edit Profile' : 'Editar Perfil')}
                        aria-label={isEditingProfile ? (selectedLang === 'EN' ? 'View Saved Profile' : 'Ver Guardado') : (selectedLang === 'EN' ? 'Edit Profile' : 'Editar Perfil')}
                      >
                        <Pencil className="w-4 h-4 text-white group-hover:text-black stroke-[2.2] group-hover:scale-110 transition-all" />
                      </button>

                      {/* Camera Photo Badge Button */}
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setIsAvatarModalOpen(true);
                        }}
                        className="w-8.5 h-8.5 sm:w-9 sm:h-9 rounded-full bg-black text-white hover:bg-amber-400 hover:text-black shadow-xs flex items-center justify-center transition-all duration-200 hover:scale-105 active:scale-95 cursor-pointer select-none group shrink-0"
                        title={selectedLang === 'EN' ? 'Change photo' : 'Cambiar foto'}
                      >
                        <Camera className="w-4 h-4 sm:w-4.5 sm:h-4.5 text-white group-hover:text-black stroke-[2.2] group-hover:scale-110 transition-all" />
                      </button>

                      {/* Internal Communication Mail Button */}
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setIsMailModalOpen(true);
                        }}
                        className="w-8.5 h-8.5 sm:w-9 sm:h-9 rounded-full bg-black text-white hover:bg-amber-400 hover:text-black shadow-xs flex items-center justify-center transition-all duration-200 hover:scale-105 active:scale-95 cursor-pointer select-none group shrink-0 relative"
                        title={selectedLang === 'EN' ? 'Internal Communication & Messages' : 'Comunicación Interna y Mensajes'}
                        aria-label={selectedLang === 'EN' ? 'Internal Communication & Messages' : 'Comunicación Interna y Mensajes'}
                      >
                        <Mail className="w-4 h-4 text-white group-hover:text-black stroke-[2.2] group-hover:scale-110 transition-all" />
                        {messagingUnreadCount > 0 && (
                          <span className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-[#FF0000]" />
                        )}
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
                <div className="flex flex-wrap items-center justify-between gap-2 pb-1.5 border-b border-black">
                  <div className="flex flex-wrap items-center gap-1.5">
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
                    <button
                      onClick={() => setCurriculumTrack('evaluations')}
                      className={`px-3 py-1.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all cursor-pointer border flex items-center gap-1.5 ${
                        curriculumTrack === 'evaluations'
                          ? 'bg-blue-600 text-white border-blue-600 shadow-xs'
                          : 'bg-white text-neutral-800 border-neutral-300 hover:border-black'
                      }`}
                    >
                      <Award className="w-3.5 h-3.5 stroke-[2.5]" />
                      <span>{selectedLang === 'EN' ? 'Lesson Grades' : 'Calificaciones & Evaluaciones'}</span>
                      {lessonAttempts.length > 0 && (
                        <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-mono font-bold ${
                          curriculumTrack === 'evaluations' ? 'bg-white text-blue-900' : 'bg-blue-100 text-blue-900 border border-blue-200'
                        }`}>
                          {lessonAttempts.length}
                        </span>
                      )}
                    </button>
                  </div>
                  <span className="text-[11px] sm:text-xs font-mono font-bold text-neutral-900 uppercase tracking-tight">
                    {curriculumTrack === 'evaluations'
                      ? `${lessonAttempts.filter(a => a.passed).length} / ${lessonAttempts.length} ${selectedLang === 'EN' ? 'Passed' : 'Aprobadas'}`
                      : `${user.completedDays.length} / ${activeCurriculum.length} ${selectedLang === 'EN' ? 'Completed' : 'Completados'}`}
                  </span>
                </div>

                {/* Content: Either Evaluations List or Curriculum Cards List */}
                {curriculumTrack === 'evaluations' ? (
                  <LessonEvaluationsList
                    attempts={lessonAttempts}
                    selectedLang={selectedLang}
                    onStartLesson={onStartLesson}
                    onAskVoyager={onAskVoyager}
                  />
                ) : (
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
                                onClick={() => {
                                  const lessonTitle = selectedLang === 'EN' 
                                    ? (curriculumTrack === 'ciudadania' ? `USCIS Civics Module ${day.dayNum}: ${day.title}` : `Day ${day.dayNum}: ${day.title}`) 
                                    : (curriculumTrack === 'ciudadania' ? `Módulo ${day.dayNum}: ${day.titleEs}` : `Día ${day.dayNum}: ${day.titleEs}`);
                                  const lessonCategory = curriculumTrack === 'ciudadania' 
                                    ? (selectedLang === 'EN' ? 'Civics & Citizenship 128' : 'Cívica y Ciudadanía 128') 
                                    : (selectedLang === 'EN' ? 'English Immersion' : 'Inglés de Inmersión');
                                  const lessonLevel = curriculumTrack === 'ciudadania' ? 'B1' : (day.dayNum <= 2 ? 'A2/B1' : 'B2');
                                  const lessonObj = {
                                    id: curriculumTrack === 'ciudadania' ? `civics-module-${day.dayNum}` : `immersion-day-${day.dayNum}`,
                                    title: lessonTitle,
                                    category: lessonCategory,
                                    level: lessonLevel,
                                    estimatedMinutes: 20,
                                    objective: selectedLang === 'EN' ? day.objectives.join(' ') : day.objectivesEs.join(' '),
                                    instructions: selectedLang === 'EN'
                                      ? `Guide the student through: ${day.objectives.join('; ')}. Teach vocabulary: ${day.vocabulary.map(v => v.word).join(', ')}. Guide missions: ${day.missions.map(m => m.en).join('; ')}.`
                                      : `Guía al estudiante a través de: ${day.objectivesEs.join('; ')}. Vocabulario clave: ${day.vocabulary.map(v => v.word).join(', ')}. Guía las misiones: ${day.missions.map(m => m.es).join('; ')}.`,
                                    rawDay: day
                                  };

                                  if (onStartLesson) {
                                    onStartLesson(lessonObj);
                                  } else {
                                    onNavigateTab('chat');
                                  }
                                }}
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
                )}
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

      {/* Avatar Customization Modal - Clean Blue Card Design */}
      {isAvatarModalOpen && (
        <div 
          className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in"
          onClick={() => setIsAvatarModalOpen(false)}
        >
          <div 
            className="relative w-full max-w-[320px] sm:max-w-[330px] aspect-square bg-gradient-to-b from-[#162D55] via-[#0E2042] to-[#08152B] rounded-3xl border border-blue-400/40 p-6 sm:p-7 shadow-[0_20px_60px_rgba(0,0,0,0.85)] text-center text-white flex flex-col items-center justify-between"
            onClick={(e) => e.stopPropagation()}
          >
            {/* White 'X' Close Icon at Top Right */}
            <button 
              type="button"
              onClick={() => setIsAvatarModalOpen(false)}
              className="absolute top-4 right-4 text-white/70 hover:text-white transition-colors cursor-pointer p-1"
              aria-label={selectedLang === 'EN' ? 'Close' : 'Cerrar'}
            >
              <X className="w-5 h-5" />
            </button>

            {/* Large Circular Avatar Preview */}
            <div 
              className="relative group/avatar cursor-pointer my-auto flex items-center justify-center"
              onClick={() => avatarFileInputRef.current?.click()}
              title={selectedLang === 'EN' ? 'Click to choose image file' : 'Haz clic para seleccionar imagen'}
            >
              <div className="w-32 h-32 sm:w-36 sm:h-36 rounded-full overflow-hidden bg-transparent shadow-2xl flex items-center justify-center transition-transform duration-300 group-hover/avatar:scale-[1.02]">
                {renderAvatarContent({
                  ...user,
                  avatarUrl: pendingAvatarUrl,
                  avatarType: pendingAvatarType
                })}
              </div>
              <div className="absolute inset-0 rounded-full bg-black/40 opacity-0 group-hover/avatar:opacity-100 transition-opacity flex flex-col items-center justify-center text-white gap-1 pointer-events-none">
                <Camera className="w-6 h-6 text-blue-200" />
                <span className="text-[10px] font-semibold text-blue-100 tracking-wide">
                  {selectedLang === 'EN' ? 'Upload Photo' : 'Subir Foto'}
                </span>
              </div>
            </div>

            {/* Change | Save Actions Below Large Avatar (No pill shapes, no background, no outline) */}
            <div className="flex items-center justify-center gap-8 w-full pb-1">
              <button
                type="button"
                onClick={() => avatarFileInputRef.current?.click()}
                className="text-white/85 hover:text-white text-sm font-semibold flex items-center gap-2 transition-colors cursor-pointer group"
              >
                <Camera className="w-4.5 h-4.5 text-neutral-300 group-hover:text-yellow-400 transition-colors duration-200" />
                <span>{selectedLang === 'EN' ? 'Change' : 'Cambiar'}</span>
              </button>
              <button
                type="button"
                onClick={handleSaveAvatar}
                className="text-white/85 hover:text-white text-sm font-semibold flex items-center gap-2 transition-colors cursor-pointer group"
              >
                <Check className="w-4.5 h-4.5 text-neutral-300 group-hover:text-yellow-400 transition-colors duration-200 stroke-[2.5]" />
                <span>{selectedLang === 'EN' ? 'Save' : 'Guardar'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Stripe Payment Modal for Selected Plan */}
      {isPlanPaymentOpen && (
        <StripePaymentModal
          isOpen={isPlanPaymentOpen}
          onClose={() => setIsPlanPaymentOpen(false)}
          selectedLang={selectedLang}
          itemType={selectedPlanPaymentType}
          initialName={user.name || `${user.firstName || ''} ${user.lastName || ''}`.trim()}
          initialEmail={user.email}
          onPaymentSuccess={() => {
            setIsPlanPaymentOpen(false);
            const updated: UserProfile = {
              ...user,
              plan: 'PRO'
            };
            saveUser(updated);
          }}
        />
      )}

    </div>
  );
};
