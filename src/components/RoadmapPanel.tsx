import React, { useState, useEffect } from 'react';
import { User, LogOut, Compass, Calendar, Award, CheckCircle2, Circle, Target, ChevronRight, Mail, Key, Users, Sparkles, Activity, BookOpen, Volume2, Apple, Lock, Bot, MessageSquare, Pause, TrendingUp, Play, Flame, Camera, Upload, X, Globe, Heart, Clock } from 'lucide-react';
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip } from 'recharts';
import { googleSignIn, logout, auth } from '../services/firebaseAuth';
import voyagerRobot from '../assets/images/voyager_robot_1783082204380.png';
import { IMMERSION_CURRICULUM } from '../constants';
import { TeacherInsightsPanel } from './TeacherInsightsPanel';
import { parseAndRenderEmojis } from './VoyagerEmoji';
import { Achievements } from './Achievements';
import { DailyStreakTracker } from './DailyStreakTracker';
import { ChatInputBox } from './ChatInputBox';

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
}

interface UserProfile {
  name: string;
  email: string;
  provider: 'Google' | 'Apple' | 'Email' | 'Guest';
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
  avatarType?: 'user' | 'man' | 'woman' | 'student' | 'astronaut' | 'female_robot' | 'male_robot' | 'custom';
  bookedLesson?: {
    teacherName: string;
    dateTime: string;
  };
}

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
  onNavigateTab
}) => {
  const defaultUser: UserProfile = {
    name: 'Alex Johnson',
    email: 'alex.johnson@example.com',
    provider: 'Guest',
    category: selectedLang === 'EN' ? 'Student' : 'Estudiante',
    goal: selectedLang === 'EN' ? 'Academic success' : 'Éxito académico',
    levelEstimate: 'Intermediate',
    country: 'Costa Rica',
    age: 21,
    education: selectedLang === 'EN' ? 'University' : 'Universidad',
    interests: selectedLang === 'EN' ? 'Travel, technology, music' : 'Viajes, tecnología, música',
    timePerWeek: selectedLang === 'EN' ? '5 hours per week' : '5 horas por semana',
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
  const [user, setUser] = useState<UserProfile>(() => {
    const saved = localStorage.getItem('voyager_user_account');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed) {
          if (!parsed.name || parsed.name === 'Estudiante' || parsed.name === 'Learner') {
            parsed.name = 'Alex Johnson';
          }
          if (parsed.avatarType === 'female_robot' || !parsed.avatarType) {
            parsed.avatarType = 'user';
          }
          return parsed;
        }
      } catch (e) {}
    }
    return defaultUser;
  });

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
  const [editName, setEditName] = useState(user.name || 'Alex Johnson');
  const [editCountry, setEditCountry] = useState(user.country || 'Costa Rica');
  const [editInterests, setEditInterests] = useState(user.interests || (selectedLang === 'EN' ? 'Travel, technology, music' : 'Viajes, tecnología, música'));
  const [editTimePerWeek, setEditTimePerWeek] = useState(user.timePerWeek || (selectedLang === 'EN' ? '5 hours per week' : '5 horas por semana'));
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [activeSubTab, setActiveSubTab] = useState<'welcome' | 'level' | 'lessons' | 'achievements' | 'streak'>('welcome');
  const [isAvatarModalOpen, setIsAvatarModalOpen] = useState(false);
  const avatarFileInputRef = React.useRef<HTMLInputElement>(null);

  const visitorFullName = React.useMemo(() => {
    if (user?.name && user.name !== 'Estudiante' && user.name !== 'Learner' && user.name !== 'Alex Johnson') {
      const name = user.name.trim();
      if (name && name !== 'Estudiante' && name !== 'Learner' && name !== 'Alex Johnson') return name;
    }
    const saved = typeof window !== 'undefined' ? localStorage.getItem('voyager_user_account') : null;
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed.name && parsed.name !== 'Estudiante' && parsed.name !== 'Learner' && parsed.name !== 'Alex Johnson') {
          const name = parsed.name.trim();
          if (name && name !== 'Estudiante' && name !== 'Learner' && name !== 'Alex Johnson') return name;
        }
      } catch (e) {}
    }
    return '';
  }, [user?.name]);

  useEffect(() => {
    if (user) {
      setEditName(user.name || (selectedLang === 'EN' ? 'Learner' : 'Estudiante'));
      setEditCountry(user.country || 'United States');
      setSelectedGoal(user.goal || 'Business English & Networking');
      setEditInterests(user.interests || (selectedLang === 'EN' ? 'Travel, Technology, Culture, Music' : 'Viajes, Tecnología, Cultura, Música'));
      setSelectedLevel(user.levelEstimate || 'Intermediate');
      setEditTimePerWeek(user.timePerWeek || (selectedLang === 'EN' ? '3.5 hrs / week' : '3.5 hrs / semana'));
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
    if (u.avatarUrl) {
      return (
        <img
          src={u.avatarUrl}
          alt={u.name}
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

    // Default neutral user icon in a clean light-neutral grey circle
    return (
      <div className="w-full h-full rounded-full bg-[#eaeced] text-neutral-400 flex items-center justify-center overflow-hidden">
        <svg className="w-full h-full" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
          <circle cx="50" cy="38" r="22" fill="#cbd5e1" />
          <path d="M 16 95 C 16 70, 30 60, 50 60 C 70 60, 84 70, 84 95 Z" fill="#cbd5e1" />
        </svg>
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
    // Check Firebase auth state
    const unsubscribe = auth.onAuthStateChanged((fbUser) => {
      if (fbUser) {
        const saved = localStorage.getItem('voyager_user_account');
        let existing: any = {};
        if (saved) {
          try {
            existing = JSON.parse(saved);
          } catch (e) {}
        }

        const newUser: UserProfile = {
          ...existing,
          name: fbUser.displayName || fbUser.email?.split('@')[0] || existing.name || 'Learner',
          email: fbUser.email || existing.email || 'learner@usavoyager.com',
          provider: 'Google',
          goal: existing.goal || 'Business English & Networking',
          levelEstimate: existing.levelEstimate || 'Intermediate',
          completedDays: existing.completedDays || [1],
          country: existing.country || '',
          age: existing.age || undefined,
          plan: existing.plan || 'FREE'
        };
        setUser(newUser);
        localStorage.setItem('voyager_user_account', JSON.stringify(newUser));
      }
    });

    return () => unsubscribe();
  }, []);

  const saveUser = (updated: UserProfile) => {
    setUser(updated);
    localStorage.setItem('voyager_user_account', JSON.stringify(updated));
  };

  const handleLogout = async () => {
    try {
      await logout();
    } catch (e) {}
    saveUser(defaultUser);
  };

  const handleUpdateProfile = () => {
    if (!user) return;
    const updated: UserProfile = {
      ...user,
      name: editName.trim() || user.name,
      country: editCountry.trim() || user.country || 'United States',
      goal: selectedGoal,
      interests: editInterests.trim() || user.interests || (selectedLang === 'EN' ? 'Travel, Technology, Culture, Music' : 'Viajes, Tecnología, Cultura, Música'),
      levelEstimate: selectedLevel,
      timePerWeek: editTimePerWeek.trim() || (selectedLang === 'EN' ? '3.5 hrs / week' : '3.5 hrs / semana')
    };
    saveUser(updated);
    setIsEditingProfile(false);
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
  return (
    <div className="flex-1 flex flex-col bg-white h-full overflow-hidden animate-fade-in font-sans text-[#231d17]">
      
      {/* Scrollable content area */}
      <div className="flex-1 overflow-y-auto px-3 pt-2 pb-4 flex flex-col gap-3.5 min-h-0">
        
        {/* THE MAIN WELCOME STATEMENT CARD FOR PROFILE */}
        <div className="space-y-3.5 text-left flex flex-col flex-shrink-0 p-0">
          
          {/* Header & Navigation Row */}
          <div className="flex flex-col gap-3">
            <div className="flex items-center justify-between gap-3.5 flex-wrap select-none">
              <span 
                style={{ fontFamily: '"American Typewriter", "Courier New", Courier, serif' }} 
                className="text-[42px] md:text-[52.5px] font-normal tracking-tight text-[#1a202c] !font-serif block leading-none"
              >
                {visitorFullName 
                  ? (selectedLang === 'EN' ? `${visitorFullName}'s Profile` : `Perfil de ${visitorFullName}`) 
                  : (selectedLang === 'EN' ? 'Your Profile' : 'Tu Perfil')}
              </span>

              <button 
                onClick={() => {
                  if (isEditingProfile) {
                    handleUpdateProfile();
                  } else {
                    setActiveSubTab('level');
                    setIsEditingProfile(true);
                  }
                }}
                className={`transition-colors uppercase cursor-pointer bg-transparent border-none p-0 font-extrabold text-xs tracking-wider underline underline-offset-4 ${
                  isEditingProfile 
                    ? 'text-red-600 hover:text-red-700' 
                    : 'text-neutral-700 hover:text-red-600'
                }`}
              >
                {isEditingProfile
                  ? (selectedLang === 'EN' ? 'SAVE' : 'GUARDAR')
                  : (selectedLang === 'EN' ? 'EDIT' : 'EDITAR')
                }
              </button>
            </div>

            <div className="flex flex-wrap items-center gap-4 md:gap-5 text-[11.2px] font-extrabold uppercase tracking-wider select-none mt-1">
              <button 
                onClick={() => {
                  setActiveSubTab('welcome');
                  triggerAutoExplanation('welcome');
                }}
                className={`group flex items-center gap-1.5 transition-colors uppercase cursor-pointer bg-transparent border-none p-0 ${
                  activeSubTab === 'welcome' ? 'text-red-600 font-black' : 'text-black hover:text-red-600'
                }`}
              >
                <User className={`w-4.5 h-4.5 transition-colors ${activeSubTab === 'welcome' ? 'text-red-600' : 'text-black group-hover:text-red-600'}`} />
                <span>{visitorFullName ? visitorFullName.toUpperCase() : (selectedLang === 'EN' ? 'PROFILE' : 'PERFIL')}</span>
              </button>

              <button 
                onClick={() => {
                  setActiveSubTab('level');
                  triggerAutoExplanation('level');
                }}
                className={`group flex items-center gap-1.5 transition-colors uppercase cursor-pointer bg-transparent border-none p-0 ${
                  activeSubTab === 'level' ? 'text-red-600 font-black' : 'text-black hover:text-red-600'
                }`}
              >
                <TrendingUp className={`w-4.5 h-4.5 transition-colors ${activeSubTab === 'level' ? 'text-red-600' : 'text-black group-hover:text-red-600'}`} />
                <span>{selectedLang === 'EN' ? 'YOUR LEVEL' : 'TU NIVEL'}</span>
              </button>

              <button 
                onClick={() => {
                  setActiveSubTab('lessons');
                  triggerAutoExplanation('lessons');
                }}
                className={`group flex items-center gap-1.5 transition-colors uppercase cursor-pointer bg-transparent border-none p-0 ${
                  activeSubTab === 'lessons' ? 'text-red-600 font-black' : 'text-black hover:text-red-600'
                }`}
              >
                <Compass className={`w-4.5 h-4.5 transition-colors ${activeSubTab === 'lessons' ? 'text-red-600' : 'text-black group-hover:text-red-600'}`} />
                <span>{selectedLang === 'EN' ? 'LESSONS' : 'LECCIONES'}</span>
              </button>

              <button 
                onClick={() => {
                  setActiveSubTab('achievements');
                  triggerAutoExplanation('achievements');
                }}
                className={`group flex items-center gap-1.5 transition-colors uppercase cursor-pointer bg-transparent border-none p-0 ${
                  activeSubTab === 'achievements' ? 'text-red-600 font-black' : 'text-black hover:text-red-600'
                }`}
              >
                <Award className={`w-4.5 h-4.5 transition-colors ${activeSubTab === 'achievements' ? 'text-red-600' : 'text-black group-hover:text-red-600'}`} />
                <span>{selectedLang === 'EN' ? 'ACHIEVEMENTS' : 'LOGROS'}</span>
              </button>

              <button 
                onClick={() => {
                  setActiveSubTab('streak');
                  triggerAutoExplanation('streak');
                }}
                className={`group flex items-center gap-1.5 transition-colors uppercase cursor-pointer bg-transparent border-none p-0 ${
                  activeSubTab === 'streak' ? 'text-red-600 font-black' : 'text-black hover:text-red-600'
                }`}
              >
                <Flame className={`w-4.5 h-4.5 transition-colors ${activeSubTab === 'streak' ? 'text-red-600' : 'text-black group-hover:text-red-600'}`} />
                <span>{selectedLang === 'EN' ? 'STREAKS' : 'RACHAS'}</span>
              </button>
            </div>
          </div>

        {/* MAIN PROFILE DETAILS CONTAINER */}
        <div className="space-y-4 text-left flex flex-col flex-shrink-0">

          {/* Tab Body Content */}
          <div className="pt-1">
            {activeSubTab === 'welcome' && (
              <div className="animate-fade-in py-2">
                {/* Minimalist 2-Column Identity Card */}
                <div className="flex flex-col md:flex-row items-center md:items-start justify-between gap-6 sm:gap-10">
                  
                  {/* Left Column (approx 30-35% width): Avatar */}
                  <div className="w-full md:w-[35%] flex flex-col items-center justify-center text-center">
                    {/* Circular Avatar Container with Camera Icon Badge on Border */}
                    <div className="relative group flex-shrink-0 w-36 h-36 sm:w-44 sm:h-44">
                      {/* Avatar Circle */}
                      <div 
                        onClick={() => setIsAvatarModalOpen(true)}
                        className="w-full h-full rounded-full bg-neutral-100 border border-neutral-200/80 shadow-xs cursor-pointer overflow-hidden flex items-center justify-center transition-transform duration-200 hover:scale-[1.02]"
                      >
                        {renderAvatarContent(user)}
                      </div>

                      {/* Camera Badge Button Positioned on Circle Border with 3pt Black Stroke */}
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setIsAvatarModalOpen(true);
                        }}
                        className="absolute bottom-1 right-1 sm:bottom-1.5 sm:right-1.5 w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-neutral-900 hover:bg-black text-white border-[3px] border-black ring-2 ring-white flex items-center justify-center shadow-md transition-all duration-200 cursor-pointer hover:scale-105 z-10"
                        title={selectedLang === 'EN' ? 'Change photo' : 'Cambiar foto'}
                      >
                        <Camera className="w-4 h-4 sm:w-4.5 sm:h-4.5 text-white stroke-[2.5]" />
                      </button>
                    </div>
                  </div>

                  {/* Right Column: Clean Label-Value Identity Details List */}
                  <div className="w-full md:w-[63%] flex flex-col justify-center pt-2 md:pt-4">
                    <div className="grid grid-cols-[140px_1fr] sm:grid-cols-[180px_1fr] gap-y-3.5 sm:gap-y-4 text-sm sm:text-base leading-relaxed">
                      
                      {/* 1. Categoría */}
                      <div className="font-bold text-neutral-900">
                        {selectedLang === 'EN' ? 'Category:' : 'Categoría:'}
                      </div>
                      <div className="text-neutral-800">
                        {user.category || (selectedLang === 'EN' ? 'Student' : 'Estudiante')}
                      </div>

                      {/* 2. País */}
                      <div className="font-bold text-neutral-900">
                        {selectedLang === 'EN' ? 'Country:' : 'País:'}
                      </div>
                      <div className="text-neutral-800">
                        {user.country ? getCountryWithFlag(user.country) : (selectedLang === 'EN' ? 'Costa Rica' : 'Costa Rica')}
                      </div>

                      {/* 3. Edad */}
                      <div className="font-bold text-neutral-900">
                        {selectedLang === 'EN' ? 'Age:' : 'Edad:'}
                      </div>
                      <div className="text-neutral-800">
                        {user.age ?? 21}
                      </div>

                      {/* 4. Nivel de inglés */}
                      <div className="font-bold text-neutral-900">
                        {selectedLang === 'EN' ? 'English level:' : 'Nivel de inglés:'}
                      </div>
                      <div className="text-neutral-800">
                        {getTranslatedLevel(user.levelEstimate || 'Intermediate')}
                      </div>

                      {/* 5. Educación */}
                      <div className="font-bold text-neutral-900">
                        {selectedLang === 'EN' ? 'Education:' : 'Educación:'}
                      </div>
                      <div className="text-neutral-800">
                        {user.education || (selectedLang === 'EN' ? 'University' : 'Universidad')}
                      </div>

                      {/* 6. Meta de aprendizaje */}
                      <div className="font-bold text-neutral-900">
                        {selectedLang === 'EN' ? 'Learning goal:' : 'Meta de aprendizaje:'}
                      </div>
                        <div className="text-neutral-800">
                        {user.goal || (selectedLang === 'EN' ? 'Academic success' : 'Éxito académico')}
                      </div>

                      {/* 7. Tiempo de estudio */}
                      <div className="font-bold text-neutral-900">
                        {selectedLang === 'EN' ? 'Study time:' : 'Tiempo de estudio:'}
                      </div>
                      <div className="text-neutral-800">
                        {user.timePerWeek || (selectedLang === 'EN' ? '5 hours per week' : '5 horas por semana')}
                      </div>

                      {/* 8. Intereses */}
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

            {activeSubTab === 'level' && (
              <div className="animate-fade-in py-1 space-y-3">
                {/* Student Stats Divider & Section Header */}
                <div className="pt-0.5">
                  <div className="flex items-center gap-2 mb-2">
                    <Activity className="w-4 h-4 text-amber-500" />
                    <span className="text-xs font-black uppercase tracking-wider text-neutral-800 font-mono">
                      {selectedLang === 'EN' ? 'Student Performance Metrics' : 'ESTADÍSTICAS DEL ESTUDIANTE'}
                    </span>
                  </div>

                  {/* Score Circular Rings Section matching exact format from image */}
                  {(() => {
                    const getPct = (val?: number, fallback: number = 80) => {
                      if (val === undefined || val === null || val <= 0) return fallback;
                      if (val <= 5) return Math.min(100, Math.round(val * 20));
                      return Math.min(100, Math.round(val));
                    };

                    const statItems = [
                      {
                        title: selectedLang === 'EN' ? 'Pronunciation' : 'Pronunciación',
                        val: getPct(scores?.pronunciation || pronunciationScore, 80),
                        sub: selectedLang === 'EN' 
                          ? 'Accuracy score after 30 days practice' 
                          : 'Puntuación de precisión después de 30 días'
                      },
                      {
                        title: selectedLang === 'EN' ? 'Fluency' : 'Fluidez',
                        val: getPct(scores?.naturalness, 60),
                        sub: selectedLang === 'EN' 
                          ? 'Improvement in natural conversation flow' 
                          : 'Mejora en el flujo natural de conversación'
                      },
                      {
                        title: selectedLang === 'EN' ? 'Vocabulary' : 'Vocabulario',
                        val: getPct(scores?.grammar || grammarScore, 80),
                        sub: selectedLang === 'EN' 
                          ? 'New words retained after real use' 
                          : 'Palabras nuevas retenidas tras su uso real'
                      },
                      {
                        title: selectedLang === 'EN' ? 'Confidence' : 'Confianza',
                        val: getPct(scores?.confidence, 60),
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
                        {selectedLang === 'EN' ? 'Category:' : 'Categoría:'}
                      </div>
                      <div className="text-neutral-800">
                        {user.category || (selectedLang === 'EN' ? 'Student' : 'Estudiante')}
                      </div>

                      <div className="font-bold text-neutral-900">
                        {selectedLang === 'EN' ? 'Country:' : 'País:'}
                      </div>
                      <div className="text-neutral-800">
                        {user.country ? getCountryWithFlag(user.country) : (selectedLang === 'EN' ? 'Costa Rica' : 'Costa Rica')}
                      </div>

                      <div className="font-bold text-neutral-900">
                        {selectedLang === 'EN' ? 'Age:' : 'Edad:'}
                      </div>
                      <div className="text-neutral-800">
                        {user.age ?? 21}
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
                        {user.timePerWeek || (selectedLang === 'EN' ? '5 hours per week' : '5 horas por semana')}
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

          {activeSubTab === 'lessons' && (
            <div className="animate-fade-in space-y-3 py-1">
              {/* Header section with balanced typography & high contrast */}
              <div className="flex items-center justify-between pb-0.5">
                <h4 className="text-sm sm:text-base font-black uppercase tracking-wider text-black flex items-center gap-1.5">
                  <Compass className="w-5 h-5 text-red-600 stroke-[2.5]" />
                  <span>{selectedLang === 'EN' ? 'Lessons' : 'Lecciones'}</span>
                </h4>
                <span className="text-[11px] sm:text-xs font-mono font-black bg-neutral-900 text-white px-2.5 py-0.5 rounded-full uppercase tracking-tight shadow-xs">
                  {user.completedDays.length} / {IMMERSION_CURRICULUM.length} {selectedLang === 'EN' ? 'Completed' : 'Completados'}
                </span>
              </div>

              {/* Cards list with scaled fonts, padding, and readable black text */}
              <div className="space-y-2.5 max-h-[400px] overflow-y-auto pr-1">
                {IMMERSION_CURRICULUM.map((day) => {
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
                              <span>Day {day.dayNum}: {selectedLang === 'EN' ? day.title : day.titleEs}</span>
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
                                ? `Let's practice the Day ${day.dayNum} topic: ${day.title}. What is the first mission?`
                                : `¡Practiquemos el tema del Día ${day.dayNum}: ${day.titleEs}! ¿Cuál es la primera misión?`
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
          )}

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

          {/* Streaks Sub-tab Render */}
          {activeSubTab === 'streak' && (
            <div className="animate-fade-in">
              <DailyStreakTracker
                selectedLang={selectedLang}
                initialStreak={user?.completedDays?.length ? Math.max(7, user.completedDays.length) : 7}
                completedDays={user?.completedDays || [1, 2, 3, 4, 5, 6, 7]}
                onAskVoyager={onAskVoyager}
              />
            </div>
          )}
        </div>
      </div>

        {/* Separate Chat messages sibling list */}
        {(() => {
          const profileMessages = chatMessages.filter(msg => msg.tab === 'roadmap');
          const messagesToRender = profileMessages.length > 0 ? profileMessages : [
            {
              id: 'profile_welcome',
              sender: 'splash' as const,
              text: selectedLang === 'EN'
                ? "Welcome to your Profile space. Here you can edit your fluency goals, view your Google account authentication details, monitor your grammar and pronunciation scores, track your daily learning curriculum roadmap, and check your master instructor session logs."
                : "Bienvenido a tu sección de Perfil. Aquí puedes configurar tus metas de fluidez, revisar tu cuenta de Google, monitorear tus puntajes de gramática y pronunciación, seguir tu currículo diario de aprendizaje y ver el registro de tus clases particulares.",
              timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
              timeMs: Date.now(),
              tab: 'roadmap'
            }
          ];
          return messagesToRender.filter(msg => {
            if (msg.sender === 'system') return false;
            if (msg.sender === 'user' && msg.text.startsWith('[')) return false;
            return true;
          }).map((msg, index) => {
            const isUser = msg.sender === 'user';
            let displayTxt = msg.text || '';
            
            // Clean system tags from user profile / roadmap questions
            if (displayTxt.includes('INSTRUCCIÓN DE SISTEMA:')) {
              const match = displayTxt.match(/Pregunta del usuario:\s*"(.*)"/i) || displayTxt.match(/Pregunta:\s*"(.*)"/i) || displayTxt.match(/Question:\s*"(.*)"/i);
              if (match && match[1]) {
                displayTxt = match[1];
              } else {
                displayTxt = displayTxt
                  .replace(/\[INSTRUCCIÓN DE SISTEMA:[^]*?Pregunta del usuario:\s*"/i, '')
                  .replace(/\[INSTRUCCIÓN DE SISTEMA:[^]*?Pregunta:\s*"/i, '')
                  .replace(/"\]$/, '');
              }
            } else if (displayTxt.includes('INSTRUCCIÓN DE SISTEMA CRÍTICA Y MANDATORIA:')) {
              const match = displayTxt.match(/Pregunta del usuario:\s*"(.*)"/i) || displayTxt.match(/Pregunta:\s*"(.*)"/i) || displayTxt.match(/Question:\s*"(.*)"/i);
              if (match && match[1]) {
                displayTxt = match[1];
              }
            }

            return (
              <div 
                key={msg.id || index}
                className={`w-full flex ${isUser ? 'justify-end' : 'justify-start'} animate-fade-in`}
              >
                <div className={`max-w-[88%] flex flex-col ${isUser ? 'items-end' : 'items-start'}`}>
                  <div className={`
                    px-4 py-2.5 rounded-2xl text-sm leading-snug transition-all bg-white border-[5px]
                    ${isUser 
                      ? 'border-blue-600/30 text-black rounded-tr-none' 
                      : 'border-[#FFD700] text-black rounded-tl-none font-serif'
                    }
                  `}>
                    {isUser ? (
                      <div className="flex items-center justify-end gap-2.5 mb-1.5 select-none">
                        <button
                          type="button"
                          onClick={() => {
                            if (!isConnected) return;
                            if (isPaused) {
                              resume();
                              if (window.speechSynthesis && window.speechSynthesis.paused) {
                                window.speechSynthesis.resume();
                              }
                            } else {
                              pause();
                              if (window.speechSynthesis && window.speechSynthesis.speaking) {
                                window.speechSynthesis.pause();
                              }
                            }
                          }}
                          disabled={!isConnected}
                          className={`flex items-center gap-1 group cursor-pointer transition-all duration-300 ${
                            !isConnected ? 'opacity-30 cursor-not-allowed' : 'hover:scale-105 active:scale-95'
                          }`}
                        >
                          {!isPaused && (
                            <span 
                              style={{ fontFamily: "'Lato', sans-serif" }} 
                              className="text-[9px] font-black tracking-wider transition-all duration-300 text-blue-600/70 group-hover:text-red-600"
                            >
                              {selectedLang === 'EN' ? 'PAUSE' : 'PAUSA'}
                            </span>
                          )}
                          {isPaused ? (
                            <Play fill="currentColor" stroke="none" className="w-3.5 h-3.5 text-red-600 transition-all animate-pulse" />
                          ) : (
                            <Pause fill="currentColor" stroke="none" className="w-3.5 h-3.5 text-blue-600/70 group-hover:text-red-600 transition-all duration-300" />
                          )}
                        </button>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2 mb-2 select-none">
                        <Bot strokeWidth={2.5} className="w-5 h-5 text-red-600" />
                      </div>
                    )}
                    <div className={`chat-message-text whitespace-pre-line tracking-wider leading-snug ${isUser ? 'text-right font-normal' : 'text-left'}`}>
                      {(() => {
                        if (!isUser && displayTxt.includes(" / ")) {
                          const parts = displayTxt.split(" / ");
                          if (parts.length >= 2) {
                            return (
                              <>
                                <div style={{ fontFamily: '"Raleway", sans-serif', fontWeight: 600 }} className="text-black font-semibold leading-snug">{parseAndRenderEmojis(parts[0])}</div>
                                <div style={{ fontFamily: '"Raleway", sans-serif', fontWeight: 600 }} className="chat-message-english text-black font-semibold leading-snug mt-2">
                                  {parseAndRenderEmojis(parts.slice(1).join(" / "))}
                                </div>
                              </>
                            );
                          }
                        }
                        return <div style={{ fontFamily: '"Raleway", sans-serif', fontWeight: 600 }} className="text-black font-semibold leading-snug">{parseAndRenderEmojis(displayTxt)}</div>;
                      })()}
                    </div>
                  </div>
                </div>
              </div>
            );
          });
        })()}
        <div className="flex justify-end w-full animate-fade-in my-1">
          <ChatInputBox
            selectedLang={selectedLang}
            isConnected={isConnected}
            isPaused={isPaused}
            pause={pause}
            resume={resume}
            onSubmitText={onAskVoyager}
          />
        </div>
        <div ref={chatEndRef} />
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
