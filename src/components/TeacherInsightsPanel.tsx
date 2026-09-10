import React, { useState } from 'react';
import { 
  Star, 
  Award,
  Sparkles,
  UserCheck,
  Globe,
  Clock,
  Check,
  MessageSquareText,
  Video,
  CreditCard,
  Lock,
  Bot,
  MessageSquare,
  Pause,
  Play,
  Apple,
  ChevronRight,
  User,
  BookOpen,
  School,
  Laptop,
  MapPin,
  Building2,
  Compass,
  Sliders
} from 'lucide-react';
import { StripePaymentModal } from './StripePaymentModal';
import { parseAndRenderEmojis } from './VoyagerEmoji';
import { ChatInputBox } from './ChatInputBox';

interface TeacherInsightsPanelProps {
  selectedLang: 'EN' | 'ES';
  chatMessages: any[];
  isPaused: boolean;
  isConnected: boolean;
  pause: () => void;
  resume: () => void;
  onAskVoyager: (text: string) => void;
  scores?: {
    grammar: number;
    pronunciation: number;
    confidence: number;
    naturalness: number;
  };
  learnedWords?: string[];
  accentPatterns?: string[];
  onNavigateTab?: (tab: 'home' | 'chat' | 'progress' | 'roadmap' | 'teachers' | 'settings') => void;
}

export const TeacherInsightsPanel: React.FC<TeacherInsightsPanelProps> = ({
  selectedLang,
  chatMessages,
  isPaused,
  isConnected,
  pause,
  resume,
  onAskVoyager,
  scores,
  learnedWords,
  accentPatterns,
  onNavigateTab
}) => {
  const [activeSubTab, setActiveSubTab] = useState<'welcome' | 'classes' | 'phonetics' | 'support' | 'hire'>('welcome');
  
  // Admin detection for Federico Sandoval
  const savedAccount = typeof window !== 'undefined' ? localStorage.getItem('voyager_user_account') : null;
  let isAdminUser = false;
  let adminName = 'Federico Sandoval';
  if (savedAccount) {
    try {
      const parsed = JSON.parse(savedAccount);
      if (parsed?.isAdmin || parsed?.email?.toLowerCase() === 'theorangesnowman@gmail.com') {
        isAdminUser = true;
        adminName = parsed?.name || 'Federico Sandoval';
      }
    } catch (e) {}
  }
  
  // Booking state
  const [bookingModal, setBookingModal] = useState<'sample' | 'monthly' | null>(null);
  const [stripeModalOpen, setStripeModalOpen] = useState(false);
  const [bookingDate, setBookingDate] = useState('2026-07-30');
  const [bookingTime, setBookingTime] = useState('10:00 AM');
  const [bookingName, setBookingName] = useState('');
  const [bookingEmail, setBookingEmail] = useState('');
  const [monthlyPackage, setMonthlyPackage] = useState<'4_sessions' | '8_sessions'>('4_sessions');
  const [bookingSuccess, setBookingSuccess] = useState<string | null>(null);

  // Dynamic Interactive Organization Donut Chart State
  const [hoveredOrgCategory, setHoveredOrgCategory] = useState<string | null>(null);
  const [selectedOrgCategory, setSelectedOrgCategory] = useState<string | null>(null);

  // Dynamic Interactive Modality Donut Chart State
  const [hoveredModalityCategory, setHoveredModalityCategory] = useState<string | null>(null);
  const [selectedModalityCategory, setSelectedModalityCategory] = useState<string | null>(null);

  // Dynamic Teacher Demographics Circlegraph States (Gender & Age)
  const [hoveredTeacherGender, setHoveredTeacherGender] = useState<string | null>(null);
  const [selectedTeacherGender, setSelectedTeacherGender] = useState<string | null>(null);

  const [hoveredTeacherAge, setHoveredTeacherAge] = useState<string | null>(null);
  const [selectedTeacherAge, setSelectedTeacherAge] = useState<string | null>(null);

  const teacherGenderItems = [
    {
      id: 'mujeres_docentes',
      label: selectedLang === 'EN' ? 'Women' : 'Mujeres',
      shortLabel: selectedLang === 'EN' ? 'Women' : 'Mujeres',
      count: 18,
      percentage: '56.3%',
      color: '#ec4899',
      hoverColor: '#f472b6',
      accentColor: 'text-pink-700',
      dotBg: 'bg-pink-500',
      dashArray: '184.0 326.7',
      dashOffset: '0'
    },
    {
      id: 'hombres_docentes',
      label: selectedLang === 'EN' ? 'Men' : 'Hombres',
      shortLabel: selectedLang === 'EN' ? 'Men' : 'Hombres',
      count: 11,
      percentage: '34.4%',
      color: '#0284c7',
      hoverColor: '#38bdf8',
      accentColor: 'text-sky-700',
      dotBg: 'bg-sky-600',
      dashArray: '112.3 326.7',
      dashOffset: '-184.0'
    },
    {
      id: 'lgtb_docentes',
      label: 'LGTB+',
      shortLabel: 'LGTB+',
      count: 3,
      percentage: '9.3%',
      color: '#8b5cf6',
      hoverColor: '#a78bfa',
      accentColor: 'text-purple-700',
      dotBg: 'bg-purple-600',
      dashArray: '30.4 326.7',
      dashOffset: '-296.3'
    }
  ];

  const teacherAgeItems = [
    {
      id: 't_age_18_25',
      label: '18 - 25 ' + (selectedLang === 'EN' ? 'years' : 'años'),
      shortLabel: '18 - 25',
      count: 4,
      percentage: '12.5%',
      color: '#f59e0b',
      hoverColor: '#fbbf24',
      accentColor: 'text-amber-700',
      dotBg: 'bg-amber-500',
      dashArray: '40.8 326.7',
      dashOffset: '0'
    },
    {
      id: 't_age_26_40',
      label: '26 - 40 ' + (selectedLang === 'EN' ? 'years' : 'años'),
      shortLabel: '26 - 40',
      count: 18,
      percentage: '56.3%',
      color: '#10b981',
      hoverColor: '#34d399',
      accentColor: 'text-emerald-700',
      dotBg: 'bg-emerald-500',
      dashArray: '183.8 326.7',
      dashOffset: '-40.8'
    },
    {
      id: 't_age_41_60',
      label: '41 - 60 ' + (selectedLang === 'EN' ? 'years' : 'años'),
      shortLabel: '41 - 60',
      count: 8,
      percentage: '25.0%',
      color: '#3b82f6',
      hoverColor: '#60a5fa',
      accentColor: 'text-blue-700',
      dotBg: 'bg-blue-600',
      dashArray: '81.7 326.7',
      dashOffset: '-224.6'
    },
    {
      id: 't_age_60_plus',
      label: '60+ ' + (selectedLang === 'EN' ? 'years' : 'años'),
      shortLabel: '60+',
      count: 2,
      percentage: '6.2%',
      color: '#8b5cf6',
      hoverColor: '#a78bfa',
      accentColor: 'text-purple-700',
      dotBg: 'bg-purple-600',
      dashArray: '20.4 326.7',
      dashOffset: '-306.3'
    }
  ];

  const orgCategories = [
    {
      id: 'escuela',
      label: selectedLang === 'EN' ? 'School' : 'Escuela',
      shortLabel: selectedLang === 'EN' ? 'School' : 'Escuela',
      orgCount: 3,
      count: 72,
      percentage: '60.5%',
      color: '#0f766e',
      hoverColor: '#14b8a6',
      accentColor: 'text-teal-700',
      badgeColor: 'bg-teal-100 text-teal-800 border-teal-200',
      dotBg: 'bg-teal-600',
      activeBg: 'bg-teal-50/80 border-teal-300 shadow-xs',
      dashArray: '197.7 326.7',
      dashOffset: '0'
    },
    {
      id: 'academia',
      label: selectedLang === 'EN' ? 'Academy' : 'Academia',
      shortLabel: selectedLang === 'EN' ? 'Academy' : 'Academia',
      orgCount: 3,
      count: 36,
      percentage: '30.3%',
      color: '#7e22ce',
      hoverColor: '#a855f7',
      accentColor: 'text-purple-700',
      badgeColor: 'bg-purple-100 text-purple-800 border-purple-200',
      dotBg: 'bg-purple-600',
      activeBg: 'bg-purple-50/80 border-purple-300 shadow-xs',
      dashArray: '98.8 326.7',
      dashOffset: '-197.7'
    },
    {
      id: 'empresa',
      label: selectedLang === 'EN' ? 'Company' : 'Empresa',
      shortLabel: selectedLang === 'EN' ? 'Company' : 'Empresa',
      orgCount: 1,
      count: 6,
      percentage: '5.0%',
      color: '#be123c',
      hoverColor: '#f43f5e',
      accentColor: 'text-rose-700',
      badgeColor: 'bg-rose-100 text-rose-800 border-rose-200',
      dotBg: 'bg-rose-600',
      activeBg: 'bg-rose-50/80 border-rose-300 shadow-xs',
      dashArray: '16.5 326.7',
      dashOffset: '-296.5'
    },
    {
      id: 'independiente',
      label: selectedLang === 'EN' ? 'Independent' : 'Independiente',
      shortLabel: selectedLang === 'EN' ? 'Independent' : 'Independiente',
      orgCount: 5,
      count: 5,
      percentage: '4.2%',
      color: '#d97706',
      hoverColor: '#f59e0b',
      accentColor: 'text-amber-700',
      badgeColor: 'bg-amber-100 text-amber-800 border-amber-200',
      dotBg: 'bg-amber-600',
      activeBg: 'bg-amber-50/80 border-amber-300 shadow-xs',
      dashArray: '13.7 326.7',
      dashOffset: '-313.0'
    }
  ];

  const modalityCategories = [
    {
      id: 'en_linea',
      label: selectedLang === 'EN' ? 'Online' : 'En línea',
      shortLabel: selectedLang === 'EN' ? 'Online' : 'En línea',
      count: 7,
      percentage: '58.3%',
      color: '#2563eb',
      hoverColor: '#3b82f6',
      accentColor: 'text-blue-700',
      dotBg: 'bg-blue-600',
      dashArray: '190.6 326.7',
      dashOffset: '0'
    },
    {
      id: 'hibrido',
      label: selectedLang === 'EN' ? 'Hybrid System' : 'Sistema híbrido',
      shortLabel: selectedLang === 'EN' ? 'Hybrid' : 'Híbrido',
      count: 3,
      percentage: '25.0%',
      color: '#7c3aed',
      hoverColor: '#8b5cf6',
      accentColor: 'text-violet-700',
      dotBg: 'bg-violet-600',
      dashArray: '81.7 326.7',
      dashOffset: '-190.6'
    },
    {
      id: 'personalmente',
      label: selectedLang === 'EN' ? 'In-Person' : 'Personalmente',
      shortLabel: selectedLang === 'EN' ? 'In-Person' : 'Personalmente',
      count: 2,
      percentage: '16.7%',
      color: '#d97706',
      hoverColor: '#f59e0b',
      accentColor: 'text-amber-700',
      dotBg: 'bg-amber-600',
      dashArray: '54.5 326.7',
      dashOffset: '-272.3'
    }
  ];

  const activeCategoryId = hoveredOrgCategory || selectedOrgCategory;
  const activeOrg = orgCategories.find(c => c.id === activeCategoryId);

  const activeModalityId = hoveredModalityCategory || selectedModalityCategory;
  const activeModality = modalityCategories.find(c => c.id === activeModalityId);

  const activeTeacherGenderId = hoveredTeacherGender || selectedTeacherGender;
  const activeTeacherGender = teacherGenderItems.find(g => g.id === activeTeacherGenderId);

  const activeTeacherAgeId = hoveredTeacherAge || selectedTeacherAge;
  const activeTeacherAge = teacherAgeItems.find(a => a.id === activeTeacherAgeId);

  const activeStripeItemType = bookingModal === 'sample' 
    ? 'sample' 
    : (monthlyPackage === '8_sessions' ? 'monthly_8' : 'monthly_4');

  const triggerAutoExplanation = (tab: 'welcome' | 'classes' | 'phonetics' | 'support' | 'hire') => {
    let prompt = '';
    const noTutoringRule = 'REGLA INQUEBRANTABLE: NO intentes enseñar inglés, NO invites al usuario a practicar inglés, NO inicies juegos de conversación en inglés y NO ofrezcas lecciones. Tu único trabajo aquí es explicar en español la información de esta subsección de La Profe, y preguntarle amigablemente si tiene alguna duda sobre la información mostrada.';
    if (tab === 'welcome') {
      prompt = `[AUTO_SYSTEM: El usuario ha ingresado a la subsección 'BIENVENIDO' de La Profe. Explícale brevemente en español quién es Alejandra Francois (La Profe), su especialidad en acento de Nueva York (NYC) y su metodología 1-a-1 en vivo. ${noTutoringRule}]`;
    } else if (tab === 'classes') {
      prompt = `[AUTO_SYSTEM: El usuario ha ingresado a la subsección 'CLASES' de La Profe. Explícale en español las opciones de clases particulares semanales (4 clases) y clases intensivas (8 clases), las videollamadas privadas de 30 minutos o 1 hora, y cómo se calendarizan. ${noTutoringRule}]`;
    } else if (tab === 'phonetics') {
      prompt = `[AUTO_SYSTEM: El usuario ha ingresado a la subsección 'FONETICA' de La Profe. Explícale en español los análisis de acento personalizado, la corrección de vicios de pronunciación comunes en hispanohablantes (como la diferencia de B vs V o reducción de vocales) y cómo Alejandra diseña las metas fonéticas del estudiante. ${noTutoringRule}]`;
    } else if (tab === 'support') {
      prompt = `[AUTO_SYSTEM: El usuario ha ingresado a la subsección 'SOPORTE' de La Profe. Explícale en español que Alejandra ofrece soporte asincrónico directo por chat para revisar audios diariamente, aclarar dudas de tareas y acompañamiento diario para acelerar la fluidez. ${noTutoringRule}]`;
    } else if (tab === 'hire') {
      prompt = `[AUTO_SYSTEM: El usuario ha ingresado a la subsección 'CONTRATA' de La Profe. Explícale en español los paquetes oficiales disponibles: Clase Diagnóstica única de $29, el Coaching Mensual de $199 (4 sesiones) o el Coaching Intensivo de $349 (8 sesiones), todos incluyendo plan PRO gratis. ${noTutoringRule}]`;
    }
    if (prompt) {
      onAskVoyager(prompt);
    }
  };

  const handleProceedToStripe = (e: React.FormEvent) => {
    e.preventDefault();
    if (!bookingName || !bookingEmail) return;
    setStripeModalOpen(true);
  };

  const handlePaymentCompleted = (receipt: any) => {
    const typeLabel = bookingModal === 'sample' 
      ? (selectedLang === 'EN' ? '30-Min Sample Diagnostic Class' : 'Clase de Prueba Diagnóstica de 30 Min')
      : (selectedLang === 'EN' ? `Monthly Package (${monthlyPackage === '4_sessions' ? '4 Sessions/mo' : '8 Sessions/mo'})` : `Plan Mensual (${monthlyPackage === '4_sessions' ? '4 Sesiones/mes' : '8 Sesiones/mes'})`);
    
    setBookingSuccess(
      selectedLang === 'EN'
        ? `Payment Approved! You are scheduled for ${typeLabel} with Alejandra Francois (La Profe). Receipt #${receipt.receiptId} sent to ${bookingEmail}.`
        : `¡Pago Aprobado con Éxito! Has agendado ${typeLabel} con Alejandra Francois (La Profe). Recibo #${receipt.receiptId} enviado a ${bookingEmail}.`
    );
  };

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

  return (
    <div className="flex-1 flex flex-col bg-white h-full overflow-hidden animate-fade-in font-sans text-[#231d17]">
      
      {/* Scrollable content area */}
      <div className="flex-1 overflow-y-auto px-3 pt-2 pb-4 flex flex-col gap-3.5 min-h-0">

        {/* TEACHER DEMOGRAPHIC & DELIVERY MODALITY STATS CARD */}
        <div className="space-y-5 text-left flex flex-col flex-shrink-0">
          
          {/* Teacher Stats Section 1: ¿A qué tipo de organización perteneces? */}
          <div>
            {/* CIRCLEGRAPH - DYNAMIC INFORMATION CIRCLE FOR INSTITUTIONS */}
            <div className="py-2">
              <div className="grid grid-cols-1 md:grid-cols-3 items-center gap-6">
                
                {/* CircleGraph (Multi-segment Dynamic Donut Wheel) - 2/3 col */}
                <div 
                  className="md:col-span-2 flex flex-col items-center justify-center p-2 group select-none"
                  onMouseLeave={() => setHoveredOrgCategory(null)}
                >
                  <div className="relative flex items-center justify-center">
                    <svg width="200" height="200" viewBox="0 0 140 140" className="transform -rotate-90 drop-shadow-sm transition-all duration-300">
                      {/* Background track circle */}
                      <circle cx="70" cy="70" r="52" stroke="#f1f5f9" strokeWidth="14" fill="transparent" />

                      {/* Render Segments Dynamically */}
                      {orgCategories.map((cat) => {
                        const isActive = activeCategoryId === cat.id;
                        const isDimmed = activeCategoryId && !isActive;

                        return (
                          <circle
                            key={cat.id}
                            cx="70"
                            cy="70"
                            r="52"
                            stroke={isActive ? cat.hoverColor : cat.color}
                            strokeWidth={isActive ? 18 : 14}
                            strokeDasharray={cat.dashArray}
                            strokeDashoffset={cat.dashOffset}
                            strokeLinecap="round"
                            fill="transparent"
                            opacity={isDimmed ? 0.35 : 1}
                            className="transition-all duration-300 cursor-pointer"
                            onMouseEnter={() => setHoveredOrgCategory(cat.id)}
                            onClick={() => setSelectedOrgCategory(selectedOrgCategory === cat.id ? null : cat.id)}
                          />
                        );
                      })}
                    </svg>

                    {/* Inner Dynamic Content of the Circle */}
                    <div 
                      className="absolute inset-0 flex flex-col items-center justify-center text-center cursor-pointer p-2 transition-all duration-300"
                      onClick={() => { setSelectedOrgCategory(null); setHoveredOrgCategory(null); }}
                      title={selectedLang === 'EN' ? 'Click to reset selection' : 'Clic para restablecer selección'}
                    >
                      <span 
                        className={`text-3xl font-black leading-none transition-all duration-300 ${
                          activeOrg ? activeOrg.accentColor : 'text-teal-700'
                        }`}
                      >
                        {activeOrg ? activeOrg.percentage : '60.5%'}
                      </span>
                      <span 
                        className={`text-[10px] font-black uppercase tracking-wider mt-1 transition-all duration-300 ${
                          activeOrg ? activeOrg.accentColor : 'text-slate-800'
                        }`}
                      >
                        {activeOrg ? activeOrg.shortLabel : (selectedLang === 'EN' ? 'SCHOOL' : 'ESCUELA')}
                      </span>
                      <span className="text-[9px] font-bold text-slate-400 mt-0.5 transition-all duration-300">
                        {activeOrg ? (activeOrg.count + (selectedLang === 'EN' ? ' Students' : ' Estudiantes')) : (selectedLang === 'EN' ? 'Dominant Category' : 'Categoría Dominante')}
                      </span>
                    </div>
                  </div>

                  {/* Title centered under the circle */}
                  <h4 className="text-xs font-black text-slate-800 uppercase tracking-wider text-center mt-3">
                    <span>{selectedLang === 'EN' ? 'ESTIMATED STUDENTS PER ORGANIZATION' : 'ESTUDIANTES POR ORGANIZACIÓN'}</span>
                  </h4>
                </div>

                {/* Institution Legend & Details Grid - 1/3 col */}
                <div className="md:col-span-1 flex flex-col gap-2.5 w-full">
                  {orgCategories.map((cat) => {
                    const isActive = activeCategoryId === cat.id;
                    const isDimmed = activeCategoryId && !isActive;

                    return (
                      <div
                        key={cat.id}
                        onMouseEnter={() => setHoveredOrgCategory(cat.id)}
                        onMouseLeave={() => setHoveredOrgCategory(null)}
                        onClick={() => setSelectedOrgCategory(selectedOrgCategory === cat.id ? null : cat.id)}
                        className={`flex items-start gap-2.5 p-1 rounded-xl transition-all duration-200 cursor-pointer ${
                          isDimmed ? 'opacity-40 hover:opacity-100' : 'opacity-100'
                        }`}
                      >
                        <div className={`w-3 h-3 rounded-full ${cat.dotBg} shrink-0 mt-1 shadow-2xs transition-transform duration-200 ${isActive ? 'scale-125 ring-2 ring-white' : ''}`} />
                        <div className="flex-1 min-w-0">
                          <div className={`text-xs font-black truncate transition-colors duration-200 ${isActive ? cat.accentColor : 'text-slate-900'}`}>
                            {cat.label} <span className="text-slate-500 font-bold">({cat.orgCount})</span>
                          </div>
                          <p className="text-[11px] font-semibold text-slate-600 mt-0.5 whitespace-nowrap">
                            {cat.count} {selectedLang === 'EN' ? 'students' : 'estudiantes'} <span className={`font-extrabold ${cat.accentColor}`}>({cat.percentage})</span>
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>

              </div>
            </div>
          </div>

          {/* Teacher Stats Section 2: ¿Cómo y de dónde das tus clases? */}
          <div className="pt-2">
            {/* CIRCLEGRAPH - DYNAMIC INFORMATION CIRCLE FOR MODALITIES */}
            <div className="py-2">
              <div className="grid grid-cols-1 md:grid-cols-3 items-center gap-6">
                
                {/* CircleGraph (Multi-segment Dynamic Donut Wheel) - 2/3 col */}
                <div 
                  className="md:col-span-2 flex flex-col items-center justify-center p-2 group select-none"
                  onMouseLeave={() => setHoveredModalityCategory(null)}
                >
                  <div className="relative flex items-center justify-center">
                    <svg width="200" height="200" viewBox="0 0 140 140" className="transform -rotate-90 drop-shadow-sm transition-all duration-300">
                      {/* Background track circle */}
                      <circle cx="70" cy="70" r="52" stroke="#f1f5f9" strokeWidth="14" fill="transparent" />

                      {/* Render Segments Dynamically */}
                      {modalityCategories.map((cat) => {
                        const isActive = activeModalityId === cat.id;
                        const isDimmed = activeModalityId && !isActive;

                        return (
                          <circle
                            key={cat.id}
                            cx="70"
                            cy="70"
                            r="52"
                            stroke={isActive ? cat.hoverColor : cat.color}
                            strokeWidth={isActive ? 18 : 14}
                            strokeDasharray={cat.dashArray}
                            strokeDashoffset={cat.dashOffset}
                            strokeLinecap="round"
                            fill="transparent"
                            opacity={isDimmed ? 0.35 : 1}
                            className="transition-all duration-300 cursor-pointer"
                            onMouseEnter={() => setHoveredModalityCategory(cat.id)}
                            onClick={() => setSelectedModalityCategory(selectedModalityCategory === cat.id ? null : cat.id)}
                          />
                        );
                      })}
                    </svg>

                    {/* Inner Dynamic Content of the Circle */}
                    <div 
                      className="absolute inset-0 flex flex-col items-center justify-center text-center cursor-pointer p-2 transition-all duration-300"
                      onClick={() => { setSelectedModalityCategory(null); setHoveredModalityCategory(null); }}
                      title={selectedLang === 'EN' ? 'Click to reset selection' : 'Clic para restablecer selección'}
                    >
                      <span 
                        className={`text-3xl font-black leading-none transition-all duration-300 ${
                          activeModality ? activeModality.accentColor : 'text-blue-700'
                        }`}
                      >
                        {activeModality ? activeModality.percentage : '58.3%'}
                      </span>
                      <span 
                        className={`text-[10px] font-black uppercase tracking-wider mt-1 transition-all duration-300 ${
                          activeModality ? activeModality.accentColor : 'text-slate-800'
                        }`}
                      >
                        {activeModality ? activeModality.shortLabel : (selectedLang === 'EN' ? 'ONLINE' : 'EN LÍNEA')}
                      </span>
                      <span className="text-[9px] font-bold text-slate-400 mt-0.5 transition-all duration-300">
                        {activeModality ? (activeModality.count + (selectedLang === 'EN' ? ' Teachers' : ' Docentes')) : (selectedLang === 'EN' ? 'Dominant Modality' : 'Modalidad Dominante')}
                      </span>
                    </div>
                  </div>

                  {/* Title centered under the circle */}
                  <h4 className="text-xs font-black text-slate-800 uppercase tracking-wider text-center mt-3">
                    <span>{selectedLang === 'EN' ? 'HOW AND FROM WHERE DO YOU TEACH?' : '¿CÓMO Y DE DÓNDE DAS TUS CLASES?'}</span>
                  </h4>
                </div>

                {/* Modality Legend & Details Grid - 1/3 col */}
                <div className="md:col-span-1 flex flex-col gap-2.5 w-full">
                  {modalityCategories.map((cat) => {
                    const isActive = activeModalityId === cat.id;
                    const isDimmed = activeModalityId && !isActive;

                    return (
                      <div
                        key={cat.id}
                        onMouseEnter={() => setHoveredModalityCategory(cat.id)}
                        onMouseLeave={() => setHoveredModalityCategory(null)}
                        onClick={() => setSelectedModalityCategory(selectedModalityCategory === cat.id ? null : cat.id)}
                        className={`flex items-start gap-2.5 p-1 rounded-xl transition-all duration-200 cursor-pointer ${
                          isDimmed ? 'opacity-40 hover:opacity-100' : 'opacity-100'
                        }`}
                      >
                        <div className={`w-3 h-3 rounded-full ${cat.dotBg} shrink-0 mt-1 shadow-2xs transition-transform duration-200 ${isActive ? 'scale-125 ring-2 ring-white' : ''}`} />
                        <div className="flex-1 min-w-0">
                          <div className={`text-xs font-black truncate transition-colors duration-200 ${isActive ? cat.accentColor : 'text-slate-900'}`}>
                            {cat.label}
                          </div>
                          <p className="text-[11px] font-semibold text-slate-600 mt-0.5 whitespace-nowrap">
                            {cat.count} {selectedLang === 'EN' ? 'teachers' : 'docentes'} <span className={`font-extrabold ${cat.accentColor}`}>({cat.percentage})</span>
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>

              </div>
            </div>
          </div>

          {/* Teacher Stats Section 3: GÉNERO Y EDAD DE DOCENTES (Gender & Age Circlegraphs - Seamless No Card/Borders) */}
          <div className="space-y-8 pt-2">
            <div className="flex flex-col gap-8">
              
              {/* CIRCLEGRAPH 1 - GÉNERO DOCENTES (NO CARD / NO BORDER) */}
              <div className="w-full">
                <div className="grid grid-cols-1 md:grid-cols-3 items-center gap-6">
                  
                  {/* CircleGraph Wheel (Género) - 2/3 col */}
                  <div 
                    className="md:col-span-2 flex flex-col items-center justify-center p-2 group select-none"
                    onMouseLeave={() => setHoveredTeacherGender(null)}
                  >
                    <div className="relative flex items-center justify-center">
                      <svg width="200" height="200" viewBox="0 0 140 140" className="transform -rotate-90 drop-shadow-sm transition-all duration-300">
                        <circle cx="70" cy="70" r="52" stroke="#f1f5f9" strokeWidth="14" fill="transparent" />
                        {teacherGenderItems.map((item) => {
                          const isActive = activeTeacherGenderId === item.id;
                          const isDimmed = activeTeacherGenderId && !isActive;
                          return (
                            <circle
                              key={item.id}
                              cx="70"
                              cy="70"
                              r="52"
                              stroke={isActive ? item.hoverColor : item.color}
                              strokeWidth={isActive ? 18 : 14}
                              strokeDasharray={item.dashArray}
                              strokeDashoffset={item.dashOffset}
                              strokeLinecap="round"
                              fill="transparent"
                              opacity={isDimmed ? 0.35 : 1}
                              className="transition-all duration-300 cursor-pointer"
                              onMouseEnter={() => setHoveredTeacherGender(item.id)}
                              onClick={() => setSelectedTeacherGender(selectedTeacherGender === item.id ? null : item.id)}
                            />
                          );
                        })}
                      </svg>

                      {/* Inner Content */}
                      <div 
                        className="absolute inset-0 flex flex-col items-center justify-center text-center cursor-pointer p-2 transition-all duration-300"
                        onClick={() => { setSelectedTeacherGender(null); setHoveredTeacherGender(null); }}
                        title={selectedLang === 'EN' ? 'Click to reset selection' : 'Clic para restablecer selección'}
                      >
                        <span className={`text-3xl font-black leading-none transition-all duration-300 ${activeTeacherGender ? activeTeacherGender.accentColor : 'text-pink-700'}`}>
                          {activeTeacherGender ? activeTeacherGender.percentage : '56.3%'}
                        </span>
                        <span className={`text-[10px] font-black uppercase tracking-wider mt-1 ${activeTeacherGender ? activeTeacherGender.accentColor : 'text-slate-900'}`}>
                          {activeTeacherGender ? activeTeacherGender.shortLabel : (selectedLang === 'EN' ? 'WOMEN' : 'MUJERES')}
                        </span>
                        <span className="text-[9px] font-bold text-slate-400 mt-0.5">
                          {activeTeacherGender ? `${activeTeacherGender.count} ${selectedLang === 'EN' ? 'teachers' : 'docentes'}` : (selectedLang === 'EN' ? '56.3% Dominant' : '56.3% Dominante')}
                        </span>
                      </div>
                    </div>

                    <h4 className="text-xs font-black text-slate-800 uppercase tracking-wider text-center mt-3">
                      <span>{selectedLang === 'EN' ? 'TEACHER GENDER DISTRIBUTION' : 'DISTRIBUCIÓN DE GÉNERO DE DOCENTES'}</span>
                    </h4>
                  </div>

                  {/* Gender Legend - 1/3 col (Left-aligned flex with close gap) */}
                  <div className="md:col-span-1 flex flex-col gap-2.5 w-full">
                    {teacherGenderItems.map((item) => {
                      const isActive = activeTeacherGenderId === item.id;
                      const isDimmed = activeTeacherGenderId && !isActive;
                      return (
                        <div
                          key={item.id}
                          onMouseEnter={() => setHoveredTeacherGender(item.id)}
                          onMouseLeave={() => setHoveredTeacherGender(null)}
                          onClick={() => setSelectedTeacherGender(selectedTeacherGender === item.id ? null : item.id)}
                          className={`flex items-start gap-2.5 p-1 rounded-xl transition-all duration-200 cursor-pointer ${
                            isActive ? 'bg-slate-100/80 opacity-100' : isDimmed ? 'opacity-40 hover:opacity-100' : 'opacity-100'
                          }`}
                        >
                          <div className={`w-3 h-3 rounded-full ${item.dotBg} shrink-0 mt-1 transition-transform duration-200 ${isActive ? 'scale-125 ring-2 ring-white' : ''}`} />
                          <div className="flex-1 min-w-0">
                            <div className={`text-xs font-black truncate ${isActive ? item.accentColor : 'text-slate-900'}`}>
                              {item.label}
                            </div>
                            <p className="text-[11px] font-semibold text-slate-600 mt-0.5 whitespace-nowrap">
                              {item.count} {selectedLang === 'EN' ? 'teachers' : 'docentes'} <span className={`font-extrabold ${item.accentColor}`}>({item.percentage})</span>
                            </p>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                </div>
              </div>

              {/* CIRCLEGRAPH 2 - EDAD DOCENTES (NO CARD / NO BORDER) */}
              <div className="w-full">
                <div className="grid grid-cols-1 md:grid-cols-3 items-center gap-6">
                  
                  {/* CircleGraph Wheel (Edad) - 2/3 col */}
                  <div 
                    className="md:col-span-2 flex flex-col items-center justify-center p-2 group select-none"
                    onMouseLeave={() => setHoveredTeacherAge(null)}
                  >
                    <div className="relative flex items-center justify-center">
                      <svg width="200" height="200" viewBox="0 0 140 140" className="transform -rotate-90 drop-shadow-sm transition-all duration-300">
                        <circle cx="70" cy="70" r="52" stroke="#f1f5f9" strokeWidth="14" fill="transparent" />
                        {teacherAgeItems.map((item) => {
                          const isActive = activeTeacherAgeId === item.id;
                          const isDimmed = activeTeacherAgeId && !isActive;
                          return (
                            <circle
                              key={item.id}
                              cx="70"
                              cy="70"
                              r="52"
                              stroke={isActive ? item.hoverColor : item.color}
                              strokeWidth={isActive ? 18 : 14}
                              strokeDasharray={item.dashArray}
                              strokeDashoffset={item.dashOffset}
                              strokeLinecap="round"
                              fill="transparent"
                              opacity={isDimmed ? 0.35 : 1}
                              className="transition-all duration-300 cursor-pointer"
                              onMouseEnter={() => setHoveredTeacherAge(item.id)}
                              onClick={() => setSelectedTeacherAge(selectedTeacherAge === item.id ? null : item.id)}
                            />
                          );
                        })}
                      </svg>

                      {/* Inner Content */}
                      <div 
                        className="absolute inset-0 flex flex-col items-center justify-center text-center cursor-pointer p-2 transition-all duration-300"
                        onClick={() => { setSelectedTeacherAge(null); setHoveredTeacherAge(null); }}
                        title={selectedLang === 'EN' ? 'Click to reset selection' : 'Clic para restablecer selección'}
                      >
                        <span className={`text-3xl font-black leading-none transition-all duration-300 ${activeTeacherAge ? activeTeacherAge.accentColor : 'text-emerald-700'}`}>
                          {activeTeacherAge ? activeTeacherAge.percentage : '56.3%'}
                        </span>
                        <span className={`text-[10px] font-black uppercase tracking-wider mt-1 ${activeTeacherAge ? activeTeacherAge.accentColor : 'text-slate-900'}`}>
                          {activeTeacherAge ? activeTeacherAge.shortLabel : (selectedLang === 'EN' ? '26 - 40 YRS' : '26 - 40 AÑOS')}
                        </span>
                        <span className="text-[9px] font-bold text-slate-400 mt-0.5">
                          {activeTeacherAge ? `${activeTeacherAge.count} ${selectedLang === 'EN' ? 'teachers' : 'docentes'}` : (selectedLang === 'EN' ? '56.3% Dominant' : '56.3% Dominante')}
                        </span>
                      </div>
                    </div>

                    <h4 className="text-xs font-black text-slate-800 uppercase tracking-wider text-center mt-3">
                      <span>{selectedLang === 'EN' ? 'TEACHER AGE DISTRIBUTION' : 'DISTRIBUCIÓN DE EDAD DE DOCENTES'}</span>
                    </h4>
                  </div>

                  {/* Age Legend - 1/3 col (Left-aligned flex with close gap) */}
                  <div className="md:col-span-1 flex flex-col gap-2.5 w-full">
                    {teacherAgeItems.map((item) => {
                      const isActive = activeTeacherAgeId === item.id;
                      const isDimmed = activeTeacherAgeId && !isActive;
                      return (
                        <div
                          key={item.id}
                          onMouseEnter={() => setHoveredTeacherAge(item.id)}
                          onMouseLeave={() => setHoveredTeacherAge(null)}
                          onClick={() => setSelectedTeacherAge(selectedTeacherAge === item.id ? null : item.id)}
                          className={`flex items-start gap-2.5 p-1 rounded-xl transition-all duration-200 cursor-pointer ${
                            isActive ? 'bg-slate-100/80 opacity-100' : isDimmed ? 'opacity-40 hover:opacity-100' : 'opacity-100'
                          }`}
                        >
                          <div className={`w-3 h-3 rounded-full ${item.dotBg} shrink-0 mt-1 transition-transform duration-200 ${isActive ? 'scale-125 ring-2 ring-white' : ''}`} />
                          <div className="flex-1 min-w-0">
                            <div className={`text-xs font-black truncate ${isActive ? item.accentColor : 'text-slate-900'}`}>
                              {item.label}
                            </div>
                            <p className="text-[11px] font-semibold text-slate-600 mt-0.5 whitespace-nowrap">
                              {item.count} {selectedLang === 'EN' ? 'teachers' : 'docentes'} <span className={`font-extrabold ${item.accentColor}`}>({item.percentage})</span>
                            </p>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                </div>
              </div>

            </div>
          </div>

        </div>

        {/* Separate Chat messages sibling list - Only show messages from 'teachers' tab */}
        {(() => {
          const teacherMessages = chatMessages.filter(msg => {
            if (msg.sender === 'system') return false;
            if (msg.sender === 'user' && msg.text.startsWith('[')) return false;
            return msg.tab === 'teachers';
          });

          const messagesToRender = teacherMessages;

          return messagesToRender.map((msg, index) => {
          const isUser = msg.sender === 'user';
          let displayTxt = msg.text || '';
          
          // Clean system tags from user profile / teachers questions
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
          }

          return (
            <div 
              key={msg.id || index}
              className={`w-full flex ${isUser ? 'justify-end' : 'justify-start'} animate-fade-in`}
            >
              <div className={`max-w-[88%] flex flex-col ${isUser ? 'items-end' : 'items-start'}`}>
                <div className={`
                  px-4 py-2.5 rounded-full text-sm leading-snug transition-all bg-white border-[5px]
                  ${isUser 
                    ? 'border-blue-600/30 text-black' 
                    : 'border-[#FFD700] text-black font-serif'
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
        <div ref={chatEndRef} />
      </div>

      {/* STRIPE PAYMENT GATEWAY MODAL */}
      <StripePaymentModal 
        isOpen={stripeModalOpen}
        onClose={() => setStripeModalOpen(false)}
        selectedLang={selectedLang}
        itemType={activeStripeItemType}
        initialName={bookingName}
        initialEmail={bookingEmail}
        initialDate={bookingDate}
        initialTime={bookingTime}
        onPaymentSuccess={handlePaymentCompleted}
      />
    </div>
  );
};
