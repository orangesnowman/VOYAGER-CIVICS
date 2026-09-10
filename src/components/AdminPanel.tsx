import React, { useState, useEffect, useMemo } from 'react';
import { 
  ShieldCheck, 
  RotateCcw, 
  Users, 
  GraduationCap, 
  Apple, 
  Settings, 
  Activity, 
  Trash2, 
  CheckCircle2, 
  AlertCircle,
  Key,
  RefreshCw,
  Clock,
  BookOpen,
  DollarSign,
  Sparkles,
  Lock,
  UserCheck,
  ChevronRight,
  LogOut,
  Mail,
  User,
  Sliders,
  Award,
  Briefcase,
  Plane,
  BarChart3,
  School,
  Laptop,
  MapPin,
  Building2,
  Compass,
  Plus,
  Globe,
  Search,
  X,
  ChevronDown,
  Layers,
  Filter,
  Database
} from 'lucide-react';
import { useDataSourceMode, DataSourceProvider, DataSourceMode } from '../services/dataSourceProvider';
import { useAdminRoleSim, SIMULATED_ROLES } from '../services/adminRoleSimProvider';
import { AdminRoleSwitcherBar } from './AdminRoleSwitcherBar';
import { auth } from '../services/firebaseAuth';
import { onAuthStateChanged } from 'firebase/auth';

export interface StatSectionDef {
  id: string;
  categoryEn: string;
  categoryEs: string;
  titleEn: string;
  titleEs: string;
  keywords: string[];
  badgeEn: string;
  badgeEs: string;
  icon: React.ComponentType<{ className?: string }>;
}

const STAT_SECTIONS: StatSectionDef[] = [
  {
    id: 'stats-revenue-country',
    categoryEn: 'Financial & Regional',
    categoryEs: 'Finanzas y Regiones',
    titleEn: 'Revenue by Country',
    titleEs: 'Ingresos por País',
    keywords: ['revenue', 'ingresos', 'country', 'país', 'regional', 'usa', 'estados unidos', 'méxico', 'colombia', 'costa rica', 'latam', 'money', 'dinero', 'dollar', '18450'],
    badgeEn: '$18,450 Total',
    badgeEs: '$18,450 Total',
    icon: Globe
  },
  {
    id: 'stats-enrolled-students',
    categoryEn: 'Student Demographics',
    categoryEs: 'Demografía Estudiantil',
    titleEn: 'Enrolled Students',
    titleEs: 'Estudiantes Inscritos',
    keywords: ['enrolled', 'estudiantes', 'inscritos', 'categories', 'categorías', 'negocios', 'turistas', 'docentes', 'students', '160'],
    badgeEn: '160 Total',
    badgeEs: '160 Total',
    icon: Users
  },
  {
    id: 'stats-students-organization',
    categoryEn: 'Student Demographics',
    categoryEs: 'Demografía Estudiantil',
    titleEn: 'Students per Org',
    titleEs: 'Estudiantes por Org',
    keywords: ['organization', 'organización', 'escuela', 'academia', 'empresa', 'independiente', 'school', 'academy', 'company', 'independent', '60.5%'],
    badgeEn: '60.5% Dominant',
    badgeEs: '60.5% Dominante',
    icon: Building2
  },
  {
    id: 'stats-teaching-modality',
    categoryEn: 'Student Demographics',
    categoryEs: 'Demografía Estudiantil',
    titleEn: 'Teaching Modality',
    titleEs: 'Modalidad de Enseñanza',
    keywords: ['modality', 'modalidad', 'online', 'en línea', 'híbrido', 'hybrid', 'in-person', 'personalmente', 'docentes', 'clases', 'teach', '58.3%'],
    badgeEn: '58.3% Online',
    badgeEs: '58.3% En Línea',
    icon: Laptop
  },
  {
    id: 'stats-gender',
    categoryEn: 'Student Demographics',
    categoryEs: 'Demografía Estudiantil',
    titleEn: 'Gender Distribution',
    titleEs: 'Distribución de Género',
    keywords: ['gender', 'género', 'femenino', 'masculino', 'female', 'male', 'unspecified', '148', '60.8%'],
    badgeEn: '60.8% Female',
    badgeEs: '60.8% Femenino',
    icon: UserCheck
  },
  {
    id: 'stats-age',
    categoryEn: 'Student Demographics',
    categoryEs: 'Demografía Estudiantil',
    titleEn: 'Age Distribution',
    titleEs: 'Distribución de Edad',
    keywords: ['age', 'edad', 'range', 'rango', '18-25', '26-40', '41-60', '60+', 'años', 'years', '45.9%'],
    badgeEn: '26 - 40 Yrs',
    badgeEs: '26 - 40 Años',
    icon: Clock
  },
  {
    id: 'stats-la-profe',
    categoryEn: 'Coaching & Management',
    categoryEs: 'Gestión y Citas',
    titleEn: 'La Profe Diagnostic',
    titleEs: 'Diagnósticos La Profe',
    keywords: ['profe', 'diagnostic', 'diagnóstico', 'coaching', 'bookings', 'citas', '29', '1-on-1', 'requests', 'maria', 'carlos'],
    badgeEn: '2 Pending',
    badgeEs: '2 Pendientes',
    icon: Apple
  },
  {
    id: 'stats-student-monitor',
    categoryEn: 'Student Analytics',
    categoryEs: 'Análisis de Estudiantes',
    titleEn: 'Student Monitor & Civics',
    titleEs: 'Monitor de Estudiantes y Cívica',
    keywords: ['student', 'monitor', 'civics', 'cívica', '128', 'streak', 'racha', 'fluency', 'fluidez', 'scores', 'progress', 'analytics'],
    badgeEn: '3 Registered',
    badgeEs: '3 Registrados',
    icon: GraduationCap
  },
  {
    id: 'stats-system-engine',
    categoryEn: 'System & AI Engine',
    categoryEs: 'Sistema y Motor IA',
    titleEn: 'Voyager Engine & AI Parameters',
    titleEs: 'Motor Voyager y Parámetros IA',
    keywords: ['system', 'motor', 'gemini', 'ai', 'live api', 'voice', 'persona', 'puck', 'parameters', 'engine', 'operational'],
    badgeEn: 'Live API Active',
    badgeEs: 'Live API Activo',
    icon: Settings
  }
];

const AdminStatsNavigator: React.FC<{ selectedLang: 'EN' | 'ES' }> = ({ selectedLang }) => {
  const isEn = selectedLang === 'EN';
  const [activeId, setActiveId] = useState<string>('stats-revenue-country');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [dataSourceMode, setDataSourceMode] = useDataSourceMode();

  useEffect(() => {
    const container = document.getElementById('admin-scroll-container');
    if (!container) return;

    const handleScroll = () => {
      const containerTop = container.getBoundingClientRect().top;
      let closestId = STAT_SECTIONS[0].id;
      let minDistance = Infinity;

      for (const item of STAT_SECTIONS) {
        const el = document.getElementById(item.id);
        if (el) {
          const rect = el.getBoundingClientRect();
          const dist = Math.abs(rect.top - containerTop - 80);
          if (dist < minDistance && rect.top - containerTop < 350) {
            minDistance = dist;
            closestId = item.id;
          }
        }
      }
      setActiveId(closestId);
    };

    container.addEventListener('scroll', handleScroll, { passive: true });
    return () => container.removeEventListener('scroll', handleScroll);
  }, []);

  const handleJump = (id: string) => {
    setActiveId(id);
    setSearchQuery('');
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  const filteredSections = useMemo(() => {
    if (!searchQuery.trim()) return STAT_SECTIONS;
    const q = searchQuery.toLowerCase().trim();
    return STAT_SECTIONS.filter(s => {
      const title = (isEn ? s.titleEn : s.titleEs).toLowerCase();
      const cat = (isEn ? s.categoryEn : s.categoryEs).toLowerCase();
      return title.includes(q) || cat.includes(q) || s.keywords.some(k => k.toLowerCase().includes(q));
    });
  }, [searchQuery, isEn]);

  const categories = useMemo(() => {
    return Array.from(new Set(STAT_SECTIONS.map(s => isEn ? s.categoryEn : s.categoryEs)));
  }, [isEn]);

  return (
    <div className="pt-1 pb-4 mb-4 select-none border-b border-slate-100">
      
      {/* Header with Data Source Mode Switcher */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2.5 mb-3">
        <div>
          <h3 className="text-xs font-black text-black uppercase tracking-wider flex items-center gap-2">
            <span>{isEn ? 'STATISTICS INDEX' : 'ÍNDICE DE ESTADÍSTICAS'}</span>
          </h3>
        </div>

        {/* DATA SOURCE SELECTOR (DEMO | LIVE | HYBRID) - CLEAN TEXT CONTROLS */}
        <div className="flex items-center gap-3 text-xs font-extrabold uppercase tracking-wider">
          <div className="flex items-center gap-1 text-slate-500 font-mono text-[10px] uppercase tracking-wider">
            <Database className="w-3.5 h-3.5 text-slate-600 shrink-0" />
            <span className="hidden xs:inline">{isEn ? 'DATA SOURCE:' : 'FUENTE:'}</span>
          </div>

          <button
            type="button"
            onClick={() => setDataSourceMode('demo')}
            className={`py-0.5 transition-all cursor-pointer bg-transparent border-none ${
              dataSourceMode === 'demo'
                ? 'text-amber-900 font-black border-b-2 border-amber-500'
                : 'text-slate-600 hover:text-black font-bold border-b-2 border-transparent'
            }`}
            title={isEn ? 'Demo mode: uses static sample datasets' : 'Modo Demo: usa datos de ejemplo estáticos'}
          >
            {isEn ? 'Demo only' : 'Solo Demo'}
          </button>

          <button
            type="button"
            onClick={() => setDataSourceMode('live')}
            className={`py-0.5 transition-all cursor-pointer bg-transparent border-none ${
              dataSourceMode === 'live'
                ? 'text-emerald-800 font-black border-b-2 border-emerald-600'
                : 'text-slate-600 hover:text-black font-bold border-b-2 border-transparent'
            }`}
            title={isEn ? 'Live mode: pulls exclusively from Firestore' : 'Modo En Vivo: consulta exclusivamente Firestore'}
          >
            {isEn ? 'Live only' : 'Solo En Vivo'}
          </button>

          <button
            type="button"
            onClick={() => setDataSourceMode('hybrid')}
            className={`py-0.5 transition-all cursor-pointer bg-transparent border-none ${
              dataSourceMode === 'hybrid'
                ? 'text-blue-900 font-black border-b-2 border-blue-600'
                : 'text-slate-600 hover:text-black font-bold border-b-2 border-transparent'
            }`}
            title={isEn ? 'Hybrid mode: uses real data with demo fallback' : 'Modo Híbrido: datos reales con respaldo demo'}
          >
            {isEn ? 'Hybrid' : 'Híbrido'}
          </button>
        </div>
      </div>

      {/* Index Directory List */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-8 gap-y-2">
        {categories.map((cat) => {
          const catSections = filteredSections.filter(s => (isEn ? s.categoryEn : s.categoryEs) === cat);
          if (catSections.length === 0) return null;

          return (
            <div key={cat} className="space-y-1">
              <div className="text-[10px] font-black text-slate-400 uppercase tracking-wider">
                {cat}
              </div>
              <div className="space-y-0.5">
                {catSections.map((sec) => {
                  const globalIndex = STAT_SECTIONS.findIndex(s => s.id === sec.id) + 1;
                  const formattedIndex = globalIndex < 10 ? `0${globalIndex}` : `${globalIndex}`;
                  const isActive = sec.id === activeId;

                  return (
                    <button
                      key={sec.id}
                      type="button"
                      onClick={() => handleJump(sec.id)}
                      className={`w-full text-left py-0.5 text-xs flex items-center justify-between gap-2 transition-colors cursor-pointer group ${
                        isActive ? 'text-[#0D224A] font-black' : 'text-slate-700 hover:text-black font-semibold'
                      }`}
                    >
                      <div className="flex items-center gap-1.5 min-w-0">
                        <span className="text-[10px] font-mono text-slate-400 shrink-0">
                          {formattedIndex}.
                        </span>
                        <span className="truncate group-hover:underline">
                          {isEn ? sec.titleEn : sec.titleEs}
                        </span>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>

    </div>
  );
};

interface AdminPanelProps {
  selectedLang: 'EN' | 'ES';
  onNavigateTab?: (tab: 'home' | 'chat' | 'citizenship' | 'civics' | 'roadmap' | 'teachers' | 'progress' | 'settings' | 'shopping' | 'admin') => void;
  onOpenAuthModal?: () => void;
  hideTopStats?: boolean;
  isEmptyAdmin?: boolean;
}

export const AdminPanel: React.FC<AdminPanelProps> = ({
  selectedLang,
  onNavigateTab,
  onOpenAuthModal,
  hideTopStats = false,
  isEmptyAdmin = false
}) => {
  const isEn = selectedLang === 'EN';
  const [simulatedRole] = useAdminRoleSim();

  if (isEmptyAdmin) {
    return (
      <div className="w-full max-w-5xl mx-auto p-6 md:p-8 animate-fade-in">
        <div className="bg-white rounded-2xl border-2 border-dashed border-slate-200/90 p-12 text-center flex flex-col items-center justify-center min-h-[360px] shadow-2xs">
          <div className="w-14 h-14 rounded-full bg-slate-100 flex items-center justify-center text-black mb-3.5">
            <Plus className="w-7 h-7 text-black" />
          </div>
          <h3 className="text-sm font-black text-black uppercase tracking-wider">
            {isEn ? 'ADMIN PANEL (EMPTY)' : 'PANEL DE ADMINISTRACIÓN (VACÍO)'}
          </h3>
          <p className="text-xs text-black mt-1 max-w-sm font-semibold">
            {isEn ? 'Content deleted. Ready for new admin content.' : 'Contenido eliminado. Listo para agregar nuevo contenido.'}
          </p>
        </div>
      </div>
    );
  }

  // State
  const [activeAdminSubTab, setActiveAdminSubTab] = useState<'scratch' | 'profe' | 'students' | 'system'>('scratch');
  const [currentUser, setCurrentUser] = useState<{
    name: string;
    email: string;
    role: string;
    isAdmin: boolean;
    adminId?: string;
  } | null>(null);

  const [notification, setNotification] = useState<string | null>(null);
  const [isResetting, setIsResetting] = useState(false);

  // Dynamic Regional Revenue CircleGraph state
  const [hoveredRegion, setHoveredRegion] = useState<string | null>(null);
  const [selectedRegion, setSelectedRegion] = useState<string | null>(null);

  const regionRevenues = [
    { 
      country: isEn ? 'USA' : 'EEUU', 
      flag: '🇺🇸', 
      code: 'US', 
      revenue: '$7,749', 
      share: 42, 
      users: 173,
      color: '#3b82f6',
      hoverColor: '#60a5fa',
      accentColor: 'text-blue-700',
      dotBg: 'bg-blue-500',
      dashArray: '137.2 326.7',
      dashOffset: '0'
    },
    { 
      country: 'México', 
      flag: '🇲🇽', 
      code: 'MX', 
      revenue: '$4,428', 
      share: 24, 
      users: 99,
      color: '#10b981',
      hoverColor: '#34d399',
      accentColor: 'text-emerald-700',
      dotBg: 'bg-emerald-500',
      dashArray: '78.4 326.7',
      dashOffset: '-137.2'
    },
    { 
      country: 'Colombia', 
      flag: '🇨🇴', 
      code: 'CO', 
      revenue: '$3,321', 
      share: 18, 
      users: 74,
      color: '#f59e0b',
      hoverColor: '#fbbf24',
      accentColor: 'text-amber-700',
      dotBg: 'bg-amber-500',
      dashArray: '58.8 326.7',
      dashOffset: '-215.6'
    },
    { 
      country: 'Costa Rica', 
      flag: '🇨🇷', 
      code: 'CR', 
      revenue: '$1,660', 
      share: 9, 
      users: 37,
      color: '#ef4444',
      hoverColor: '#f87171',
      accentColor: 'text-red-700',
      dotBg: 'bg-red-500',
      dashArray: '29.4 326.7',
      dashOffset: '-274.4'
    },
    { 
      country: isEn ? 'Other' : 'Otros', 
      flag: '🌐', 
      code: 'LA', 
      revenue: '$1,292', 
      share: 7, 
      users: 29,
      color: '#8b5cf6',
      hoverColor: '#a78bfa',
      accentColor: 'text-purple-700',
      dotBg: 'bg-purple-500',
      dashArray: '22.9 326.7',
      dashOffset: '-303.8'
    },
  ];

  const activeRegionCode = hoveredRegion || selectedRegion;
  const activeRegion = regionRevenues.find(r => r.code === activeRegionCode);

  // Dynamic Student Categories CircleGraph state
  const [hoveredStudentCategory, setHoveredStudentCategory] = useState<string | null>(null);
  const [selectedStudentCategory, setSelectedStudentCategory] = useState<string | null>(null);

  const studentCategories = [
    {
      id: 'estudiantes',
      label: isEn ? 'Academics' : 'Estudiantes',
      shortLabel: isEn ? 'Academics' : 'Estudiantes',
      count: 62,
      percentage: '38.8%',
      color: '#059669',
      hoverColor: '#10b981',
      accentColor: 'text-emerald-700',
      dotBg: 'bg-emerald-600',
      dashArray: '126.6 326.7',
      dashOffset: '0'
    },
    {
      id: 'negocios',
      label: isEn ? 'Business' : 'Negocios',
      shortLabel: isEn ? 'Business' : 'Negocios',
      count: 54,
      percentage: '33.8%',
      color: '#4f46e5',
      hoverColor: '#6366f1',
      accentColor: 'text-indigo-700',
      dotBg: 'bg-indigo-600',
      dashArray: '110.3 326.7',
      dashOffset: '-126.6'
    },
    {
      id: 'turistas',
      label: isEn ? 'Tourists' : 'Turistas',
      shortLabel: isEn ? 'Tourists' : 'Turistas',
      count: 32,
      percentage: '20.0%',
      color: '#0284c7',
      hoverColor: '#38bdf8',
      accentColor: 'text-sky-700',
      dotBg: 'bg-sky-600',
      dashArray: '65.3 326.7',
      dashOffset: '-236.9'
    },
    {
      id: 'docentes',
      label: isEn ? 'Teachers' : 'Docentes',
      shortLabel: isEn ? 'Teachers' : 'Docentes',
      count: 12,
      percentage: '7.5%',
      color: '#8b5cf6',
      hoverColor: '#a78bfa',
      accentColor: 'text-purple-700',
      dotBg: 'bg-purple-600',
      dashArray: '24.5 326.7',
      dashOffset: '-302.2'
    }
  ];

  const activeStudentCatId = hoveredStudentCategory || selectedStudentCategory;
  const activeStudentCat = studentCategories.find(c => c.id === activeStudentCatId);

  // Dynamic Demographic Info CircleGraph state for each individual chart
  const [hoveredGenderItem, setHoveredGenderItem] = useState<string | null>(null);
  const [selectedGenderItem, setSelectedGenderItem] = useState<string | null>(null);

  const [hoveredAgeItem, setHoveredAgeItem] = useState<string | null>(null);
  const [selectedAgeItem, setSelectedAgeItem] = useState<string | null>(null);

  // 1. Gender Demographic Items
  const genderItems = [
    {
      id: 'hombres',
      label: isEn ? 'Men' : 'Hombres',
      shortLabel: isEn ? 'Men' : 'Hombres',
      count: 84,
      percentage: '52.5%',
      subtitle: isEn ? '84 enrolled' : '84 inscritos',
      color: '#0284c7',
      hoverColor: '#38bdf8',
      accentColor: 'text-sky-700',
      dotBg: 'bg-sky-600',
      dashArray: '171.5 326.7',
      dashOffset: '0'
    },
    {
      id: 'mujeres',
      label: isEn ? 'Women' : 'Mujeres',
      shortLabel: isEn ? 'Women' : 'Mujeres',
      count: 60,
      percentage: '37.5%',
      subtitle: isEn ? '60 enrolled' : '60 inscritos',
      color: '#ec4899',
      hoverColor: '#f472b6',
      accentColor: 'text-pink-700',
      dotBg: 'bg-pink-500',
      dashArray: '122.5 326.7',
      dashOffset: '-171.5'
    },
    {
      id: 'lgtb',
      label: 'LGTB+',
      shortLabel: 'LGTB+',
      count: 16,
      percentage: '10.0%',
      subtitle: isEn ? '16 enrolled' : '16 inscritos',
      color: '#8b5cf6',
      hoverColor: '#a78bfa',
      accentColor: 'text-purple-700',
      dotBg: 'bg-purple-600',
      dashArray: '32.7 326.7',
      dashOffset: '-294.0'
    }
  ];

  // 2. Age Demographic Items
  const ageItems = [
    {
      id: 'age_18_25',
      label: '18 - 25 ' + (isEn ? 'years' : 'años'),
      shortLabel: '18 - 25',
      count: 45,
      percentage: '28.1%',
      subtitle: isEn ? '45 enrolled' : '45 inscritos',
      color: '#f59e0b',
      hoverColor: '#fbbf24',
      accentColor: 'text-amber-700',
      dotBg: 'bg-amber-500',
      dashArray: '91.8 326.7',
      dashOffset: '0'
    },
    {
      id: 'age_26_40',
      label: '26 - 40 ' + (isEn ? 'years' : 'años'),
      shortLabel: '26 - 40',
      count: 65,
      percentage: '40.6%',
      subtitle: isEn ? '65 enrolled' : '65 inscritos',
      color: '#10b981',
      hoverColor: '#34d399',
      accentColor: 'text-emerald-700',
      dotBg: 'bg-emerald-500',
      dashArray: '132.6 326.7',
      dashOffset: '-91.8'
    },
    {
      id: 'age_41_60',
      label: '41 - 60 ' + (isEn ? 'years' : 'años'),
      shortLabel: '41 - 60',
      count: 36,
      percentage: '22.5%',
      subtitle: isEn ? '36 enrolled' : '36 inscritos',
      color: '#6366f1',
      hoverColor: '#818cf8',
      accentColor: 'text-indigo-700',
      dotBg: 'bg-indigo-500',
      dashArray: '73.5 326.7',
      dashOffset: '-224.4'
    },
    {
      id: 'age_60_plus',
      label: '60+ ' + (isEn ? 'years' : 'años'),
      shortLabel: '60+',
      count: 14,
      percentage: '8.8%',
      subtitle: isEn ? '14 enrolled' : '14 inscritos',
      color: '#ec4899',
      hoverColor: '#f472b6',
      accentColor: 'text-pink-700',
      dotBg: 'bg-pink-500',
      dashArray: '28.8 326.7',
      dashOffset: '-297.9'
    }
  ];

  // Dynamic Interactive Organization Donut Chart State
  const [hoveredOrgCategory, setHoveredOrgCategory] = useState<string | null>(null);
  const [selectedOrgCategory, setSelectedOrgCategory] = useState<string | null>(null);

  // Dynamic Interactive Modality Donut Chart State
  const [hoveredModalityCategory, setHoveredModalityCategory] = useState<string | null>(null);
  const [selectedModalityCategory, setSelectedModalityCategory] = useState<string | null>(null);

  const orgCategories = [
    {
      id: 'escuela',
      label: isEn ? 'School' : 'Escuela',
      shortLabel: isEn ? 'School' : 'Escuela',
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
      label: isEn ? 'Academy' : 'Academia',
      shortLabel: isEn ? 'Academy' : 'Academia',
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
      label: isEn ? 'Company' : 'Empresa',
      shortLabel: isEn ? 'Company' : 'Empresa',
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
      label: isEn ? 'Independent' : 'Independiente',
      shortLabel: isEn ? 'Independent' : 'Independiente',
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
      label: isEn ? 'Online' : 'En línea',
      shortLabel: isEn ? 'Online' : 'En línea',
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
      label: isEn ? 'Hybrid System' : 'Sistema híbrido',
      shortLabel: isEn ? 'Hybrid' : 'Híbrido',
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
      label: isEn ? 'In-Person' : 'Personalmente',
      shortLabel: isEn ? 'In-Person' : 'Personalmente',
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

  const activeOrgId = hoveredOrgCategory || selectedOrgCategory;
  const activeOrg = orgCategories.find(c => c.id === activeOrgId);

  const activeModalityId = hoveredModalityCategory || selectedModalityCategory;
  const activeModality = modalityCategories.find(c => c.id === activeModalityId);

  const activeGenderId = hoveredGenderItem || selectedGenderItem;
  const activeGenderItem = genderItems.find(d => d.id === activeGenderId);

  const activeAgeId = hoveredAgeItem || selectedAgeItem;
  const activeAgeItem = ageItems.find(d => d.id === activeAgeId);

  // Mock student stats & diagnostics state for demonstration
  const [studentsList, setStudentsList] = useState([
    { id: 'STU-001', name: 'Federico Sandoval (Student View)', email: 'theorangesnowman@gmail.com', civicsScore: '94/128', streak: 14, fluency: '88% (B2)', status: 'Active' },
    { id: 'STU-002', name: 'Maria Rodriguez', email: 'maria.rodriguez@example.com', civicsScore: '112/128', streak: 21, fluency: '92% (C1)', status: 'Active' },
    { id: 'STU-003', name: 'Carlos Mendez', email: 'carlos.m@example.com', civicsScore: '45/128', streak: 3, fluency: '64% (A2)', status: 'Pending Review' }
  ]);

  const [diagnosticBookings, setDiagnosticBookings] = useState([
    { id: 'DIAG-101', studentName: 'Maria Rodriguez', date: '2026-08-30 15:00', type: '1-on-1 Diagnostic ($29)', status: 'Confirmed', paid: true },
    { id: 'DIAG-102', studentName: 'Carlos Mendez', date: '2026-09-02 11:00', type: 'Monthly Intensive ($199)', status: 'Pending Slot', paid: true }
  ]);

  const [adminPhotoUrl, setAdminPhotoUrl] = useState<string>(() => {
    try {
      const saved = localStorage.getItem('voyager_user_account');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.photoURL || parsed.avatarUrl) return parsed.photoURL || parsed.avatarUrl;
      }
      return localStorage.getItem('voyager_admin_photo_url') || '';
    } catch (e) {
      return '';
    }
  });

  // Read auth user from Firebase or localStorage
  const loadUser = () => {
    if (typeof window === 'undefined') return;

    // 1. Check live Firebase Auth user first
    const fbUser = auth.currentUser;
    if (fbUser) {
      const fbEmail = (fbUser.email || '').toLowerCase().trim();
      const isFbAdmin = fbEmail === 'theorangesnowman@gmail.com' || fbEmail.startsWith('theorangesnowman');
      if (fbUser.photoURL) {
        setAdminPhotoUrl(fbUser.photoURL);
      }
      if (isFbAdmin) {
        setCurrentUser({
          name: fbUser.displayName || 'Federico Sandoval (Admin)',
          email: fbUser.email || 'theorangesnowman@gmail.com',
          role: 'SUPER_ADMIN',
          isAdmin: true,
          adminId: 'ADMIN-VOYAGER-001'
        });
        return;
      }
    }

    // 2. Check localStorage
    const saved = localStorage.getItem('voyager_user_account');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed.photoURL || parsed.avatarUrl) {
          setAdminPhotoUrl(parsed.photoURL || parsed.avatarUrl);
        }
        const parsedEmail = (parsed?.email || '').toLowerCase().trim();
        if (parsed?.isAdmin || parsedEmail === 'theorangesnowman@gmail.com' || parsedEmail.startsWith('theorangesnowman')) {
          setCurrentUser({
            name: parsed.name || 'Federico Sandoval (Admin)',
            email: parsed.email || 'theorangesnowman@gmail.com',
            role: 'SUPER_ADMIN',
            isAdmin: true,
            adminId: 'ADMIN-VOYAGER-001'
          });
          return;
        }
        if (parsed?.email) {
          setCurrentUser({
            name: parsed.name || 'User',
            email: parsed.email,
            role: parsed.role || 'USER',
            isAdmin: !!parsed.isAdmin,
            adminId: parsed.adminId
          });
          return;
        }
      } catch (e) {}
    }
    const adminSaved = localStorage.getItem('voyager_admin_photo_url');
    if (adminSaved) setAdminPhotoUrl(adminSaved);
    setCurrentUser(null);
  };

  useEffect(() => {
    loadUser();
    const handleStorageChange = () => loadUser();
    const unsubAuth = onAuthStateChanged(auth, () => {
      loadUser();
    });
    window.addEventListener('voyager_profile_updated', handleStorageChange);
    window.addEventListener('storage', handleStorageChange);
    return () => {
      unsubAuth();
      window.removeEventListener('voyager_profile_updated', handleStorageChange);
      window.removeEventListener('storage', handleStorageChange);
    };
  }, []);

  // Quick Login as Admin
  const handleDirectAdminLogin = () => {
    const adminSavedPhoto = localStorage.getItem('voyager_admin_photo_url') || auth.currentUser?.photoURL || '';
    const adminAccount = {
      name: 'Federico Sandoval (Admin)',
      email: 'theorangesnowman@gmail.com',
      role: 'ADMIN',
      isAdmin: true,
      adminId: 'ADMIN-VOYAGER-001',
      provider: 'email',
      photoURL: adminSavedPhoto || undefined,
      avatarUrl: adminSavedPhoto || undefined,
      loginTime: new Date().toISOString()
    };
    localStorage.setItem('voyager_user_account', JSON.stringify(adminAccount));
    if (adminSavedPhoto) {
      setAdminPhotoUrl(adminSavedPhoto);
    }
    setCurrentUser({
      name: 'Federico Sandoval (Admin)',
      email: 'theorangesnowman@gmail.com',
      role: 'SUPER_ADMIN',
      isAdmin: true,
      adminId: 'ADMIN-VOYAGER-001'
    });
    window.dispatchEvent(new Event('voyager_profile_updated'));
    showNotify(isEn ? 'Authenticated as Super Admin: Federico Sandoval' : 'Autenticado como Super Admin: Federico Sandoval');
  };

  const showNotify = (msg: string) => {
    setNotification(msg);
    setTimeout(() => setNotification(null), 4000);
  };

  // Reset actions
  const handleResetScratch = (type: 'all' | 'progress' | 'chat' | 'cache') => {
    setIsResetting(true);
    setTimeout(() => {
      if (type === 'all' || type === 'progress') {
        localStorage.removeItem('voyager_civics_progress');
        localStorage.removeItem('voyager_streak_data');
        localStorage.removeItem('voyager_english_assessment');
      }
      if (type === 'all' || type === 'chat') {
        localStorage.removeItem('voyager_chat_history');
        localStorage.removeItem('voyager_session_transcript');
      }
      if (type === 'all' || type === 'cache') {
        localStorage.removeItem('voyager_travel_presets');
        localStorage.removeItem('voyager_settings');
      }
      setIsResetting(false);
      showNotify(
        type === 'all'
          ? (isEn ? 'USA Voyager system reset to zero state successfully!' : '¡Sistema USA Voyager reiniciado desde cero con éxito!')
          : (isEn ? `Reset completed for category: ${type.toUpperCase()}` : `Reinicio completado para la categoría: ${type.toUpperCase()}`)
      );
    }, 600);
  };

  const isAdminAuthenticated = Boolean(
    (currentUser && (currentUser.isAdmin || currentUser.email?.toLowerCase() === 'theorangesnowman@gmail.com' || currentUser.email?.toLowerCase().startsWith('theorangesnowman')))
    || (auth.currentUser && (auth.currentUser.email?.toLowerCase() === 'theorangesnowman@gmail.com' || auth.currentUser.email?.toLowerCase().startsWith('theorangesnowman')))
  );

  return (
    <div className="flex-1 flex flex-col bg-white h-full overflow-hidden animate-fade-in font-sans text-[#231d17] text-left">
      
      {/* Toast Notification */}
      {notification && (
        <div className="bg-[#0D224A] text-amber-300 px-4 py-2.5 text-xs font-bold border-b-2 border-amber-400 flex items-center justify-between shadow-lg animate-bounce">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-amber-400" />
            <span>{notification}</span>
          </div>
          <button onClick={() => setNotification(null)} className="text-white/70 hover:text-white font-black text-xs">✕</button>
        </div>
      )}

      {/* Main Container */}
      <div id="admin-scroll-container" className="flex-1 overflow-y-auto px-3.5 pt-3 pb-6 flex flex-col gap-4 min-h-0 relative scroll-smooth">

        {/* IF NOT AUTHENTICATED AS ADMIN, SHOW GATED GATEWAY */}
        {!isAdminAuthenticated ? (
          <div className="bg-amber-50/70 border-2 border-amber-300 rounded-3xl p-6 text-center shadow-md my-auto flex flex-col items-center justify-center gap-4">
            <div className="w-16 h-16 rounded-full bg-amber-100 border-2 border-amber-400 flex items-center justify-center text-3xl">
              🔒
            </div>
            <div>
              <h3 className="text-base font-black text-black uppercase">
                {isEn ? 'RESTRICTED ADMIN PORTAL' : 'PORTAL ADMINISTRATIVO RESTRENGIDO'}
              </h3>
              <p className="text-xs text-black max-w-md mx-auto mt-1">
                {isEn 
                  ? 'Only Federico Sandoval (theorangesnowman@gmail.com) is authorized to access the system administration tools.' 
                  : 'Solo Federico Sandoval (theorangesnowman@gmail.com) está autorizado para acceder a las herramientas de administración.'}
              </p>
            </div>

            <div className="flex flex-col sm:flex-row items-center gap-3 mt-2">
              <button
                type="button"
                onClick={handleDirectAdminLogin}
                className="bg-[#0D224A] hover:bg-[#1A365D] text-amber-300 border-2 border-amber-400 font-black text-xs px-6 py-2.5 rounded-full shadow-lg flex items-center gap-2 cursor-pointer transition-all active:scale-95"
              >
                <ShieldCheck className="w-4 h-4 text-amber-400" />
                <span>{isEn ? 'Log In as Federico Sandoval' : 'Iniciar Sesión como Federico Sandoval'}</span>
              </button>

              {onOpenAuthModal && (
                <button
                  type="button"
                  onClick={onOpenAuthModal}
                  className="bg-white hover:bg-slate-100 text-black border border-slate-300 font-bold text-xs px-5 py-2.5 rounded-full shadow-xs cursor-pointer"
                >
                  {isEn ? 'Open Sign-In Modal' : 'Abrir Modal de Ingreso'}
                </button>
              )}
            </div>
          </div>
        ) : (
          /* AUTHENTICATED SUPER ADMIN CONTENT */
          <>
            {/* MODULAR ADMIN ROLE SWITCHER BAR */}
            <AdminRoleSwitcherBar selectedLang={selectedLang} onNavigateTab={onNavigateTab} className="mb-3" />

            {/* SIMULATED ROLE: STUDENT PERSPECTIVE */}
            {simulatedRole === 'student' && (
              <div className="space-y-4 animate-fade-in">
                <div className="bg-blue-50/90 border-2 border-blue-300 p-5 rounded-3xl shadow-xs text-left">
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-4">
                    <div className="flex items-center gap-2.5">
                      <div className="w-10 h-10 rounded-2xl bg-blue-600 text-white flex items-center justify-center text-xl font-bold shadow-xs">
                        🎓
                      </div>
                      <div>
                        <h3 className="text-sm font-black text-blue-950 uppercase tracking-wide">
                          {isEn ? 'SIMULATED STUDENT PERSPECTIVE' : 'PERSPECTIVA SIMULADA DE ESTUDIANTE'}
                        </h3>
                        <p className="text-xs text-blue-900 font-medium">
                          {isEn 
                            ? 'Previewing student learning dashboard, Civics 128 mastery, and active progress.' 
                            : 'Previsualizando panel de aprendizaje, dominio de Cívica 128 y progreso activo del estudiante.'}
                        </p>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => onNavigateTab && onNavigateTab('roadmap')}
                      className="bg-[#0D224A] hover:bg-[#1A365D] text-amber-300 px-4 py-2 rounded-full font-black text-xs uppercase flex items-center gap-2 transition-all shadow-2xs cursor-pointer"
                    >
                      <span>{isEn ? 'Launch Student Roadmap' : 'Lanzar Ruta de Estudiante'}</span>
                      <ChevronRight className="w-4 h-4 text-amber-400" />
                    </button>
                  </div>

                  {/* STUDENT HIGHLIGHT METRICS */}
                  <div className="grid grid-cols-2 md:grid-cols-5 gap-2.5 mb-4">
                    <div className="bg-white p-3 rounded-2xl border border-blue-200 shadow-2xs">
                      <span className="text-[10px] font-bold text-slate-500 uppercase block">{isEn ? 'Student ID' : 'ID Estudiante'}</span>
                      <span className="text-base font-black text-blue-900 font-mono">STU-001</span>
                      <span className="text-[10px] font-bold text-emerald-600 block">✓ {isEn ? 'Verified Account' : 'Cuenta Verificada'}</span>
                    </div>

                    <div className="bg-white p-3 rounded-2xl border border-blue-200">
                      <span className="text-[10px] font-bold text-slate-500 uppercase block">{isEn ? 'Civics 128 Score' : 'Puntaje Cívica 128'}</span>
                      <span className="text-lg font-black text-blue-900">94 / 128</span>
                      <span className="text-[10px] font-bold text-emerald-600 block">73.4% {isEn ? 'Mastery' : 'Dominio'}</span>
                    </div>

                    <div className="bg-white p-3 rounded-2xl border border-blue-200">
                      <span className="text-[10px] font-bold text-slate-500 uppercase block">{isEn ? 'Daily Streak' : 'Racha Diaria'}</span>
                      <span className="text-lg font-black text-amber-600">🔥 14 {isEn ? 'Days' : 'Días'}</span>
                      <span className="text-[10px] font-bold text-slate-500 block">{isEn ? 'Active Learner' : 'Estudiante Activo'}</span>
                    </div>

                    <div className="bg-white p-3 rounded-2xl border border-blue-200">
                      <span className="text-[10px] font-bold text-slate-500 uppercase block">{isEn ? 'Fluency Assessment' : 'Diagnóstico Fluidez'}</span>
                      <span className="text-lg font-black text-emerald-700">88% (B2)</span>
                      <span className="text-[10px] font-bold text-emerald-600 block">{isEn ? 'Intermediate' : 'Intermedio'}</span>
                    </div>

                    <div className="bg-white p-3 rounded-2xl border border-blue-200">
                      <span className="text-[10px] font-bold text-slate-500 uppercase block">{isEn ? 'Primary Goal' : 'Meta Principal'}</span>
                      <span className="text-xs font-black text-slate-900 block truncate">🇺🇸 Naturalization</span>
                      <span className="text-[10px] font-bold text-blue-700 block">{isEn ? 'Interview Prep' : 'Prep Entrevista'}</span>
                    </div>
                  </div>

                  {/* REGISTERED STUDENTS LIST PREVIEW */}
                  <div className="bg-white rounded-2xl border border-blue-200 overflow-hidden shadow-2xs">
                    <div className="bg-[#0D224A] text-white px-3.5 py-2.5 text-xs font-black uppercase tracking-wider flex items-center justify-between">
                      <span className="text-amber-300">{isEn ? 'STUDENT DATABASE MONITOR' : 'MONITOR BASE DE DATOS DE ESTUDIANTES'}</span>
                      <span className="text-[10px] bg-amber-400/20 text-amber-300 px-2 py-0.5 rounded-full border border-amber-400/30 font-bold">
                        {isEn ? 'ADMIN ACCESS' : 'ACCESO ADMIN'}
                      </span>
                    </div>

                    <div className="divide-y divide-slate-100 text-xs">
                      {studentsList.map((s) => (
                        <div key={s.id} className="p-3 flex items-center justify-between hover:bg-slate-50">
                          <div>
                            <div className="font-bold text-slate-900 flex flex-wrap items-center gap-2">
                              <span>{s.name}</span>
                              <span className="text-[10px] font-mono font-black bg-blue-100 text-blue-950 px-2 py-0.5 rounded-md border border-blue-300 shadow-2xs">
                                ID: {s.id}
                              </span>
                              <span className="text-[10px] text-slate-500 font-normal">({s.email})</span>
                            </div>
                            <div className="text-[11px] text-slate-700 flex flex-wrap items-center gap-3 mt-1">
                              <span className="font-bold text-blue-900">🏛️ Civics: {s.civicsScore}</span>
                              <span className="font-bold text-amber-700">🔥 Streak: {s.streak} Days</span>
                              <span className="font-bold text-emerald-800">🗣️ Fluency: {s.fluency}</span>
                            </div>
                          </div>

                          <button
                            type="button"
                            onClick={() => showNotify(isEn ? `Inspecting details for ${s.name}` : `Inspeccionando detalles de ${s.name}`)}
                            className="bg-slate-100 hover:bg-slate-200 text-slate-900 font-bold text-xs px-3 py-1 rounded-full cursor-pointer transition-all"
                          >
                            {isEn ? 'Details' : 'Detalles'}
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* SIMULATED ROLE: TEACHER PERSPECTIVE */}
            {simulatedRole === 'teacher' && (
              <div className="space-y-4 animate-fade-in">
                <div className="bg-amber-50/90 border-2 border-amber-300 p-5 rounded-3xl shadow-xs text-left">
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-4">
                    <div className="flex items-center gap-2.5">
                      <div className="w-10 h-10 rounded-2xl bg-amber-600 text-white flex items-center justify-center text-xl font-bold shadow-xs">
                        👩‍🏫
                      </div>
                      <div>
                        <h3 className="text-sm font-black text-amber-950 uppercase tracking-wide">
                          {isEn ? 'SIMULATED TEACHER / LA PROFE PERSPECTIVE' : 'PERSPECTIVA SIMULADA DE PROFESOR / LA PROFE'}
                        </h3>
                        <p className="text-xs text-amber-900 font-medium">
                          {isEn 
                            ? 'Managing 1-on-1 diagnostic sessions ($29), student phonetics logs, and monthly packages.' 
                            : 'Gestionando citas diagnósticas 1-a-1 ($29), bitácoras fonéticas y planes mensuales.'}
                        </p>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => onNavigateTab && onNavigateTab('teachers')}
                      className="bg-[#0D224A] hover:bg-[#1A365D] text-amber-300 px-4 py-2 rounded-full font-black text-xs uppercase flex items-center gap-2 transition-all shadow-2xs cursor-pointer"
                    >
                      <span>{isEn ? 'Launch Teacher Module' : 'Lanzar Módulo Docente'}</span>
                      <ChevronRight className="w-4 h-4 text-amber-400" />
                    </button>
                  </div>

                  {/* TEACHER METRICS */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-2.5 mb-4">
                    <div className="bg-white p-3 rounded-2xl border border-amber-200">
                      <span className="text-[10px] font-bold text-slate-500 uppercase block">{isEn ? 'Active Bookings' : 'Citas Activas'}</span>
                      <span className="text-lg font-black text-amber-700">2 {isEn ? 'Pending' : 'Pendientes'}</span>
                      <span className="text-[10px] font-bold text-emerald-600 block">PAID $29 {isEn ? 'Each' : 'c/u'}</span>
                    </div>

                    <div className="bg-white p-3 rounded-2xl border border-amber-200">
                      <span className="text-[10px] font-bold text-slate-500 uppercase block">{isEn ? 'Diagnostic Price' : 'Tarifa Cita'}</span>
                      <span className="text-lg font-black text-slate-900">$29 USD</span>
                      <span className="text-[10px] font-bold text-slate-500 block">1-on-1 Session</span>
                    </div>

                    <div className="bg-white p-3 rounded-2xl border border-amber-200">
                      <span className="text-[10px] font-bold text-slate-500 uppercase block">{isEn ? 'Monthly Subscriptions' : 'Suscripciones Mensuales'}</span>
                      <span className="text-lg font-black text-blue-900">$199 / mo</span>
                      <span className="text-[10px] font-bold text-emerald-600 block">{isEn ? 'Active Package' : 'Paquete Activo'}</span>
                    </div>

                    <div className="bg-white p-3 rounded-2xl border border-amber-200">
                      <span className="text-[10px] font-bold text-slate-500 uppercase block">{isEn ? 'Primary Voice Persona' : 'Voz Docente'}</span>
                      <span className="text-xs font-black text-slate-900 block truncate">🎙️ Puck (Gemini Live)</span>
                      <span className="text-[10px] font-bold text-amber-700 block">{isEn ? 'USA Voyager Accent' : 'Acento Voyager'}</span>
                    </div>
                  </div>

                  {/* DIAGNOSTIC BOOKINGS TABLE */}
                  <div className="bg-white rounded-2xl border border-amber-200 overflow-hidden shadow-2xs">
                    <div className="bg-[#0D224A] text-amber-300 px-3.5 py-2.5 text-xs font-black uppercase tracking-wider flex items-center justify-between">
                      <span>{isEn ? 'ACTIVE DIAGNOSTIC BOOKINGS' : 'CITAS DIAGNÓSTICAS SOLICITADAS'}</span>
                      <span className="text-[10px] bg-amber-400/20 text-amber-300 px-2 py-0.5 rounded-full font-bold">2 Slots</span>
                    </div>

                    <div className="divide-y divide-slate-100 text-xs">
                      {diagnosticBookings.map((b) => (
                        <div key={b.id} className="p-3 flex items-center justify-between hover:bg-slate-50">
                          <div>
                            <div className="font-bold text-slate-900 flex items-center gap-2">
                              <span>{b.studentName}</span>
                              <span className="text-[9.5px] font-black bg-emerald-100 text-emerald-800 px-1.5 py-0.5 rounded-full uppercase">PAID $29</span>
                            </div>
                            <div className="text-[11px] text-slate-600 flex items-center gap-3 mt-0.5">
                              <span>📅 {b.date}</span>
                              <span>📋 {b.type}</span>
                            </div>
                          </div>

                          <button
                            type="button"
                            onClick={() => showNotify(isEn ? `Session confirmed with ${b.studentName}` : `Sesión confirmada con ${b.studentName}`)}
                            className="bg-emerald-600 hover:bg-emerald-700 text-white font-black text-[10.5px] px-3 py-1 rounded-full cursor-pointer transition-all"
                          >
                            {isEn ? 'Confirm' : 'Confirmar'}
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* SIMULATED ROLE: FULL ADMIN DASHBOARD */}
            {simulatedRole === 'admin' && (
              <>
                {/* MULTI-TAB NAVIGATION BAR FOR ADMIN PANEL (NO BUBBLES, NO BORDER, NO PILL, NO FILL) */}
                <div className="py-2 mb-4 border-b border-slate-200 flex flex-wrap items-center gap-4 sm:gap-7 overflow-x-auto scrollbar-none select-none">
                  <button
                    type="button"
                    onClick={() => setActiveAdminSubTab('scratch')}
                    className={`py-1 text-xs font-black uppercase tracking-wider transition-all flex items-center gap-1.5 cursor-pointer whitespace-nowrap bg-transparent border-none ${
                      activeAdminSubTab === 'scratch'
                        ? 'text-amber-900 font-black border-b-2 border-amber-500'
                        : 'text-slate-600 hover:text-slate-900 font-bold border-b-2 border-transparent'
                    }`}
                  >
                    <span>📊</span>
                    <span>{isEn ? 'Stats & Revenue' : 'Estadísticas y Ventas'}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setActiveAdminSubTab('profe')}
                    className={`py-1 text-xs font-black uppercase tracking-wider transition-all flex items-center gap-1.5 cursor-pointer whitespace-nowrap bg-transparent border-none ${
                      activeAdminSubTab === 'profe'
                        ? 'text-amber-900 font-black border-b-2 border-amber-500'
                        : 'text-slate-600 hover:text-slate-900 font-bold border-b-2 border-transparent'
                    }`}
                  >
                    <span>👩‍🏫</span>
                    <span>{isEn ? 'La Profe & Diagnostics' : 'La Profe y Diagnósticos'}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setActiveAdminSubTab('students')}
                    className={`py-1 text-xs font-black uppercase tracking-wider transition-all flex items-center gap-1.5 cursor-pointer whitespace-nowrap bg-transparent border-none ${
                      activeAdminSubTab === 'students'
                        ? 'text-amber-900 font-black border-b-2 border-amber-500'
                        : 'text-slate-600 hover:text-slate-900 font-bold border-b-2 border-transparent'
                    }`}
                  >
                    <span>🎓</span>
                    <span>{isEn ? 'Student Monitor' : 'Monitor Estudiantes'}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setActiveAdminSubTab('system')}
                    className={`py-1 text-xs font-black uppercase tracking-wider transition-all flex items-center gap-1.5 cursor-pointer whitespace-nowrap bg-transparent border-none ${
                      activeAdminSubTab === 'system'
                        ? 'text-amber-900 font-black border-b-2 border-amber-500'
                        : 'text-slate-600 hover:text-slate-900 font-bold border-b-2 border-transparent'
                    }`}
                  >
                    <span>⚙️</span>
                    <span>{isEn ? 'Engine & AI' : 'Motor y Parámetros IA'}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setActiveAdminSubTab('overview')}
                    className={`py-1 text-xs font-black uppercase tracking-wider transition-all flex items-center gap-1.5 cursor-pointer whitespace-nowrap bg-transparent border-none ${
                      activeAdminSubTab === 'overview'
                        ? 'text-amber-900 font-black border-b-2 border-amber-500'
                        : 'text-slate-600 hover:text-slate-900 font-bold border-b-2 border-transparent'
                    }`}
                  >
                    <span>👁️</span>
                    <span>{isEn ? 'Full View (All Tabs)' : 'Vista Completa (Todas)'}</span>
                  </button>
                </div>

                {/* TAB 1: STATS & REVENUE OVERVIEW */}
                {(activeAdminSubTab === 'scratch' || activeAdminSubTab === 'overview') && (
                  <>
                    {/* STICKY STATISTICS NAVIGATOR BAR */}
                    <AdminStatsNavigator selectedLang={selectedLang} />

                    {/* ADMIN SYSTEM STATS & ENROLLMENT OVERVIEW */}
                    <div className="animate-fade-in space-y-4">
              
              {/* CIRCLEGRAPH 1 - REGIONAL REVENUE BREAKDOWN */}
              <div id="stats-revenue-country" className="py-2 space-y-4 scroll-mt-24">
                <div className="grid grid-cols-1 md:grid-cols-3 items-center gap-6">
                  {/* CircleGraph (Multi-segment Dynamic Donut Wheel) - 2/3 col */}
                  <div 
                    className="md:col-span-2 flex flex-col items-center justify-center p-2 select-none group"
                    onMouseLeave={() => setHoveredRegion(null)}
                  >
                    <div className="relative flex items-center justify-center">
                      <svg width="200" height="200" viewBox="0 0 140 140" className="transform -rotate-90 drop-shadow-sm transition-all duration-300">
                        <circle cx="70" cy="70" r="52" stroke="#f1f5f9" strokeWidth="14" fill="transparent" />

                        {regionRevenues.map((reg) => {
                          const isActive = activeRegionCode === reg.code;
                          const isDimmed = activeRegionCode && !isActive;

                          return (
                            <circle
                              key={reg.code}
                              cx="70"
                              cy="70"
                              r="52"
                              stroke={isActive ? reg.hoverColor : reg.color}
                              strokeWidth={isActive ? 18 : 14}
                              strokeDasharray={reg.dashArray}
                              strokeDashoffset={reg.dashOffset}
                              strokeLinecap="round"
                              fill="transparent"
                              opacity={isDimmed ? 0.35 : 1}
                              className="transition-all duration-300 cursor-pointer"
                              onMouseEnter={() => setHoveredRegion(reg.code)}
                              onClick={() => setSelectedRegion(selectedRegion === reg.code ? null : reg.code)}
                            />
                          );
                        })}
                      </svg>

                      {/* INNER DONUT CENTER DISPLAY */}
                      <div 
                        className="absolute inset-0 flex flex-col items-center justify-center text-center cursor-pointer p-2 transition-all duration-300"
                        onClick={() => { setSelectedRegion(null); setHoveredRegion(null); }}
                        title={isEn ? 'Click to reset selection' : 'Clic para restablecer selección'}
                      >
                        <span 
                          className={`text-3xl font-black leading-none transition-all duration-300 ${
                            activeRegion ? activeRegion.accentColor : 'text-blue-700'
                          }`}
                        >
                          {activeRegion ? `${activeRegion.share}%` : '42%'}
                        </span>
                        <span className="text-[10px] font-black uppercase tracking-wider mt-1 text-black flex items-center justify-center gap-1">
                          <span>{activeRegion ? activeRegion.flag : '🇺🇸'}</span>
                          <span>{activeRegion ? activeRegion.country : (isEn ? 'USA' : 'EEUU')}</span>
                        </span>
                        <span className="text-[9px] font-bold text-black mt-0.5">
                          {activeRegion ? `${activeRegion.revenue} (${activeRegion.users} ${isEn ? 'accounts' : 'cuentas'})` : (isEn ? '42% Dominant ($7,749)' : '42% Dominante ($7,749)')}
                        </span>
                      </div>
                    </div>

                    <h4 className="text-xs font-black text-black uppercase tracking-wider text-center mt-3">
                      <span>{isEn ? 'REVENUE BY COUNTRY' : 'INGRESOS POR PAIS'}</span>
                    </h4>
                  </div>

                  {/* REGIONAL INTERACTIVE LEGEND LIST - 1/3 col */}
                  <div className="md:col-span-1 flex flex-col gap-2.5 w-full">
                    {regionRevenues.map((reg) => {
                      const isActive = activeRegionCode === reg.code;
                      const isDimmed = activeRegionCode && !isActive;

                      return (
                        <div
                          key={reg.code}
                          onMouseEnter={() => setHoveredRegion(reg.code)}
                          onMouseLeave={() => setHoveredRegion(null)}
                          onClick={() => setSelectedRegion(selectedRegion === reg.code ? null : reg.code)}
                          className={`p-1 transition-all duration-200 cursor-pointer flex items-center justify-start gap-4 ${
                            isActive 
                              ? 'opacity-100 scale-[1.02]' 
                              : isDimmed 
                              ? 'opacity-40 hover:opacity-100' 
                              : 'opacity-100'
                          }`}
                        >
                          <div className="flex items-center gap-2.5 min-w-0 shrink-0">
                            <span className="text-xl shrink-0">{reg.flag}</span>
                            <div className="text-xs font-black text-black truncate">
                              {reg.country}
                            </div>
                          </div>

                          <div className="shrink-0 flex items-center gap-2">
                            <span className={`text-xs font-black ${reg.accentColor}`}>
                              {reg.share}%
                            </span>
                            <span className="text-[11px] font-bold text-black">
                              ({reg.revenue})
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>

              <div className="flex flex-col gap-6">
                
                {/* CIRCLEGRAPH - DYNAMIC INFORMATION CIRCLE FOR STUDENT CATEGORIES */}
                <div id="stats-enrolled-students" className="scroll-mt-24 py-2">
                  <div>
                    <div className="grid grid-cols-1 md:grid-cols-3 items-center gap-6">
                      
                      {/* CircleGraph (Multi-segment Dynamic Donut Wheel) - 2/3 col */}
                      <div 
                        className="md:col-span-2 flex flex-col items-center justify-center p-2 group select-none"
                        onMouseLeave={() => setHoveredStudentCategory(null)}
                      >
                        <div className="relative flex items-center justify-center">
                          <svg width="200" height="200" viewBox="0 0 140 140" className="transform -rotate-90 drop-shadow-sm transition-all duration-300">
                            {/* Background track circle */}
                            <circle cx="70" cy="70" r="52" stroke="#f1f5f9" strokeWidth="14" fill="transparent" />

                            {/* Render Segments Dynamically */}
                            {studentCategories.map((cat) => {
                              const isActive = activeStudentCatId === cat.id;
                              const isDimmed = activeStudentCatId && !isActive;

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
                                  onMouseEnter={() => setHoveredStudentCategory(cat.id)}
                                  onClick={() => setSelectedStudentCategory(selectedStudentCategory === cat.id ? null : cat.id)}
                                />
                              );
                            })}
                          </svg>

                          {/* Inner Dynamic Content of the Circle */}
                          <div 
                            className="absolute inset-0 flex flex-col items-center justify-center text-center cursor-pointer p-2 transition-all duration-300"
                            onClick={() => { setSelectedStudentCategory(null); setHoveredStudentCategory(null); }}
                            title={isEn ? 'Click to reset selection' : 'Clic para restablecer selección'}
                          >
                            <span 
                              className={`text-3xl font-black leading-none transition-all duration-300 ${
                                activeStudentCat ? activeStudentCat.accentColor : 'text-emerald-700'
                              }`}
                            >
                              {activeStudentCat ? activeStudentCat.percentage : '38.8%'}
                            </span>
                            <span 
                              className={`text-[10px] font-black uppercase tracking-wider mt-1 transition-all duration-300 ${
                                activeStudentCat ? activeStudentCat.accentColor : 'text-black'
                              }`}
                            >
                              {activeStudentCat ? activeStudentCat.shortLabel : (isEn ? 'STUDENTS' : 'ESTUDIANTES')}
                            </span>
                            <span className="text-[9px] font-bold text-black mt-0.5 transition-all duration-300">
                              {activeStudentCat ? (isEn ? 'Share of Total' : 'Porcentaje del Total') : (isEn ? '38.8% Dominant' : '38.8% Dominante')}
                            </span>
                          </div>
                        </div>

                        {/* Title centered under the circle */}
                        <h4 className="text-xs font-black text-black uppercase tracking-wider text-center mt-3">
                          <span>{isEn ? 'ENROLLED STUDENTS' : 'ESTUDIANTES INSCRITOS'}</span>
                        </h4>
                      </div>

                      {/* Student Category Legend & Details Grid - 1/3 col */}
                      <div className="md:col-span-1 flex flex-col gap-2.5 w-full">
                        {studentCategories.map((cat) => {
                          const isActive = activeStudentCatId === cat.id;
                          const isDimmed = activeStudentCatId && !isActive;

                          return (
                            <div
                              key={cat.id}
                              onMouseEnter={() => setHoveredStudentCategory(cat.id)}
                              onMouseLeave={() => setHoveredStudentCategory(null)}
                              onClick={() => setSelectedStudentCategory(selectedStudentCategory === cat.id ? null : cat.id)}
                              className={`p-1 transition-all duration-200 cursor-pointer flex items-center justify-start gap-4 ${
                                isActive 
                                  ? 'opacity-100 scale-[1.02]' 
                                  : isDimmed 
                                  ? 'opacity-40 hover:opacity-100' 
                                  : 'opacity-100'
                              }`}
                            >
                              <div className="flex items-center gap-2.5 min-w-0 shrink-0">
                                <div className={`w-3.5 h-3.5 rounded-full ${cat.dotBg} shrink-0 shadow-2xs transition-transform duration-200 ${isActive ? 'scale-125 ring-2 ring-white' : ''}`} />
                                <div className={`text-xs font-black truncate transition-colors duration-200 ${isActive ? cat.accentColor : 'text-black'}`}>
                                  {cat.label}
                                </div>
                              </div>

                              <div className="shrink-0">
                                <span className={`text-xs font-black ${cat.accentColor}`}>
                                  {cat.percentage}
                                </span>
                              </div>
                            </div>
                          );
                        })}
                      </div>

                    </div>
                  </div>
                </div>

                {/* CIRCLEGRAPH - ESTUDIANTES POR ORGANIZACIÓN (COPIED FROM TEACHERS) */}
                <div id="stats-students-organization" className="scroll-mt-24 py-2">
                  <div>
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
                              const isActive = activeOrgId === cat.id;
                              const isDimmed = activeOrgId && !isActive;

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
                            title={isEn ? 'Click to reset selection' : 'Clic para restablecer selección'}
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
                                activeOrg ? activeOrg.accentColor : 'text-black'
                              }`}
                            >
                              {activeOrg ? activeOrg.shortLabel : (isEn ? 'SCHOOL' : 'ESCUELA')}
                            </span>
                            <span className="text-[9px] font-bold text-black mt-0.5 transition-all duration-300">
                              {activeOrg ? (isEn ? 'Share of Total' : 'Porcentaje del Total') : (isEn ? '60.5% Dominant' : '60.5% Dominante')}
                            </span>
                          </div>
                        </div>

                        {/* Title centered under the circle */}
                        <h4 className="text-xs font-black text-black uppercase tracking-wider text-center mt-3">
                          <span>{isEn ? 'ESTIMATED STUDENTS PER ORGANIZATION' : 'ESTUDIANTES POR ORGANIZACIÓN'}</span>
                        </h4>
                      </div>

                      {/* Institution Legend & Details Grid - 1/3 col */}
                      <div className="md:col-span-1 flex flex-col gap-2.5 w-full">
                        {orgCategories.map((cat) => {
                          const isActive = activeOrgId === cat.id;
                          const isDimmed = activeOrgId && !isActive;

                          return (
                            <div
                              key={cat.id}
                              onMouseEnter={() => setHoveredOrgCategory(cat.id)}
                              onMouseLeave={() => setHoveredOrgCategory(null)}
                              onClick={() => setSelectedOrgCategory(selectedOrgCategory === cat.id ? null : cat.id)}
                              className={`p-1 transition-all duration-200 cursor-pointer flex items-center justify-start gap-4 ${
                                isActive 
                                  ? 'opacity-100 scale-[1.02]' 
                                  : isDimmed 
                                  ? 'opacity-40 hover:opacity-100' 
                                  : 'opacity-100'
                              }`}
                            >
                              <div className="flex items-center gap-2.5 min-w-0 shrink-0">
                                <div className={`w-3.5 h-3.5 rounded-full ${cat.dotBg} shrink-0 shadow-2xs transition-transform duration-200 ${isActive ? 'scale-125 ring-2 ring-white' : ''}`} />
                                <div className={`text-xs font-black truncate transition-colors duration-200 ${isActive ? cat.accentColor : 'text-black'}`}>
                                  {cat.label} <span className="text-black font-bold">({cat.orgCount})</span>
                                </div>
                              </div>

                              <div className="shrink-0">
                                <span className={`text-xs font-black ${cat.accentColor}`}>
                                  {cat.percentage}
                                </span>
                              </div>
                            </div>
                          );
                        })}
                      </div>

                    </div>
                  </div>
                </div>

                {/* CIRCLEGRAPH - ¿CÓMO Y DE DÓNDE DAS TUS CLASES? (COPIED FROM TEACHERS) */}
                <div id="stats-teaching-modality" className="scroll-mt-24 py-2">
                  <div>
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
                            title={isEn ? 'Click to reset selection' : 'Clic para restablecer selección'}
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
                                activeModality ? activeModality.accentColor : 'text-black'
                              }`}
                            >
                              {activeModality ? activeModality.shortLabel : (isEn ? 'ONLINE' : 'EN LÍNEA')}
                            </span>
                            <span className="text-[9px] font-bold text-black mt-0.5 transition-all duration-300">
                              {activeModality ? (isEn ? 'Share of Total' : 'Porcentaje del Total') : (isEn ? '58.3% Dominant' : '58.3% Dominante')}
                            </span>
                          </div>
                        </div>

                        {/* Title centered under the circle */}
                        <h4 className="text-xs font-black text-black uppercase tracking-wider text-center mt-3">
                          <span>{isEn ? 'HOW AND FROM WHERE DO YOU TEACH?' : '¿CÓMO Y DE DÓNDE DAS TUS CLASES?'}</span>
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
                              className={`p-1 transition-all duration-200 cursor-pointer flex items-center justify-start gap-4 ${
                                isActive 
                                  ? 'opacity-100 scale-[1.02]' 
                                  : isDimmed 
                                  ? 'opacity-40 hover:opacity-100' 
                                  : 'opacity-100'
                              }`}
                            >
                              <div className="flex items-center gap-2.5 min-w-0 shrink-0">
                                <div className={`w-3.5 h-3.5 rounded-full ${cat.dotBg} shrink-0 shadow-2xs transition-transform duration-200 ${isActive ? 'scale-125 ring-2 ring-white' : ''}`} />
                                <div className={`text-xs font-black truncate transition-colors duration-200 ${isActive ? cat.accentColor : 'text-black'}`}>
                                  {cat.label}
                                </div>
                              </div>

                              <div className="shrink-0">
                                <span className={`text-xs font-black ${cat.accentColor}`}>
                                  {cat.percentage}
                                </span>
                              </div>
                            </div>
                          );
                        })}
                      </div>

                    </div>
                  </div>
                </div>

                {/* CIRCLEGRAPH 2 - GÉNERO (GENDER) */}
                <div id="stats-gender" className="scroll-mt-24 py-2">
                  <div>
                    <div className="grid grid-cols-1 md:grid-cols-3 items-center gap-6">
                      
                      {/* CircleGraph Donut Wheel (Género) - 2/3 col */}
                      <div 
                        className="md:col-span-2 flex flex-col items-center justify-center p-2 group select-none"
                        onMouseLeave={() => setHoveredGenderItem(null)}
                      >
                        <div className="relative flex items-center justify-center">
                          <svg width="200" height="200" viewBox="0 0 140 140" className="transform -rotate-90 drop-shadow-sm transition-all duration-300">
                            {/* Background track circle */}
                            <circle cx="70" cy="70" r="52" stroke="#f1f5f9" strokeWidth="14" fill="transparent" />

                            {/* Render Gender Segments */}
                            {genderItems.map((item) => {
                              const isActive = activeGenderId === item.id;
                              const isDimmed = activeGenderId && !isActive;

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
                                  onMouseEnter={() => setHoveredGenderItem(item.id)}
                                  onClick={() => setSelectedGenderItem(selectedGenderItem === item.id ? null : item.id)}
                                />
                              );
                            })}
                          </svg>

                          {/* Inner Dynamic Content of the Gender Circle */}
                          <div 
                            className="absolute inset-0 flex flex-col items-center justify-center text-center cursor-pointer p-2 transition-all duration-300"
                            onClick={() => { setSelectedGenderItem(null); setHoveredGenderItem(null); }}
                            title={isEn ? 'Click to reset selection' : 'Clic para restablecer selección'}
                          >
                            <span 
                              className={`text-3xl font-black leading-none transition-all duration-300 ${
                                activeGenderItem ? activeGenderItem.accentColor : 'text-sky-700'
                              }`}
                            >
                              {activeGenderItem ? activeGenderItem.percentage : '52.5%'}
                            </span>
                            <span 
                              className={`text-[10px] font-black uppercase tracking-wider mt-1 transition-all duration-300 ${
                                activeGenderItem ? activeGenderItem.accentColor : 'text-black'
                              }`}
                            >
                              {activeGenderItem ? activeGenderItem.shortLabel : (isEn ? 'DOMINANT' : 'DOMINANTE')}
                            </span>
                            <span className="text-[9px] font-bold text-black mt-0.5 transition-all duration-300">
                              {activeGenderItem ? (isEn ? 'Share of Total' : 'Porcentaje del Total') : (isEn ? '52.5% Men' : '52.5% Hombres')}
                            </span>
                          </div>
                        </div>

                        {/* Title centered under the circle */}
                        <h4 className="text-xs font-black text-black uppercase tracking-wider text-center mt-3">
                          <span>{isEn ? 'GENDER' : 'GÉNERO'}</span>
                        </h4>
                      </div>

                      {/* Gender Legend & Details Grid - 1/3 col */}
                      <div className="md:col-span-1 flex flex-col gap-2.5 w-full">
                        {genderItems.map((item) => {
                          const isActive = activeGenderId === item.id;
                          const isDimmed = activeGenderId && !isActive;

                          return (
                            <div
                              key={item.id}
                              onMouseEnter={() => setHoveredGenderItem(item.id)}
                              onMouseLeave={() => setHoveredGenderItem(null)}
                              onClick={() => setSelectedGenderItem(selectedGenderItem === item.id ? null : item.id)}
                              className={`p-1 transition-all duration-200 cursor-pointer flex items-center justify-start gap-4 ${
                                isActive 
                                  ? 'opacity-100 scale-[1.02]' 
                                  : isDimmed 
                                  ? 'opacity-40 hover:opacity-100' 
                                  : 'opacity-100'
                              }`}
                            >
                              <div className="flex items-center gap-2.5 min-w-0 shrink-0">
                                <div className={`w-3.5 h-3.5 rounded-full ${item.dotBg} shrink-0 shadow-2xs transition-transform duration-200 ${isActive ? 'scale-125 ring-2 ring-white' : ''}`} />
                                <div className={`text-xs font-black truncate transition-colors duration-200 ${isActive ? item.accentColor : 'text-black'}`}>
                                  {item.label}
                                </div>
                              </div>

                              <div className="shrink-0">
                                <span className={`text-xs font-black ${item.accentColor}`}>
                                  {item.percentage}
                                </span>
                              </div>
                            </div>
                          );
                        })}
                      </div>

                    </div>
                  </div>
                </div>

                {/* CIRCLEGRAPH 3 - EDAD (AGE) */}
                <div id="stats-age" className="scroll-mt-24 py-2">
                  <div>
                    <div className="grid grid-cols-1 md:grid-cols-3 items-center gap-6">
                      
                      {/* CircleGraph Donut Wheel (Edad) - 2/3 col */}
                      <div 
                        className="md:col-span-2 flex flex-col items-center justify-center p-2 group select-none"
                        onMouseLeave={() => setHoveredAgeItem(null)}
                      >
                        <div className="relative flex items-center justify-center">
                          <svg width="200" height="200" viewBox="0 0 140 140" className="transform -rotate-90 drop-shadow-sm transition-all duration-300">
                            {/* Background track circle */}
                            <circle cx="70" cy="70" r="52" stroke="#f1f5f9" strokeWidth="14" fill="transparent" />

                            {/* Render Age Segments */}
                            {ageItems.map((item) => {
                              const isActive = activeAgeId === item.id;
                              const isDimmed = activeAgeId && !isActive;

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
                                  onMouseEnter={() => setHoveredAgeItem(item.id)}
                                  onClick={() => setSelectedAgeItem(selectedAgeItem === item.id ? null : item.id)}
                                />
                              );
                            })}
                          </svg>

                          {/* Inner Dynamic Content of the Age Circle */}
                          <div 
                            className="absolute inset-0 flex flex-col items-center justify-center text-center cursor-pointer p-2 transition-all duration-300"
                            onClick={() => { setSelectedAgeItem(null); setHoveredAgeItem(null); }}
                            title={isEn ? 'Click to reset selection' : 'Clic para restablecer selección'}
                          >
                            <span 
                              className={`text-3xl font-black leading-none transition-all duration-300 ${
                                activeAgeItem ? activeAgeItem.accentColor : 'text-emerald-700'
                              }`}
                            >
                              {activeAgeItem ? activeAgeItem.percentage : '45.9%'}
                            </span>
                            <span 
                              className={`text-[10px] font-black uppercase tracking-wider mt-1 transition-all duration-300 ${
                                activeAgeItem ? activeAgeItem.accentColor : 'text-black'
                              }`}
                            >
                              {activeAgeItem ? activeAgeItem.shortLabel : (isEn ? '26 - 40 YRS' : '26 - 40 AÑOS')}
                            </span>
                            <span className="text-[9px] font-bold text-black mt-0.5 transition-all duration-300">
                              {activeAgeItem ? (isEn ? 'Share of Total' : 'Porcentaje del Total') : (isEn ? '45.9% Dominant' : '45.9% Dominante')}
                            </span>
                          </div>
                        </div>

                        {/* Title centered under the circle */}
                        <h4 className="text-xs font-black text-black uppercase tracking-wider text-center mt-3">
                          <span>{isEn ? 'AGE' : 'EDAD'}</span>
                        </h4>
                      </div>

                      {/* Age Legend & Details Grid - 1/3 col */}
                      <div className="md:col-span-1 flex flex-col gap-2.5 w-full">
                        {ageItems.map((item) => {
                          const isActive = activeAgeId === item.id;
                          const isDimmed = activeAgeId && !isActive;

                          return (
                            <div
                              key={item.id}
                              onMouseEnter={() => setHoveredAgeItem(item.id)}
                              onMouseLeave={() => setHoveredAgeItem(null)}
                              onClick={() => setSelectedAgeItem(selectedAgeItem === item.id ? null : item.id)}
                              className={`p-1 transition-all duration-200 cursor-pointer flex items-center justify-start gap-4 ${
                                isActive 
                                  ? 'opacity-100 scale-[1.02]' 
                                  : isDimmed 
                                  ? 'opacity-40 hover:opacity-100' 
                                  : 'opacity-100'
                              }`}
                            >
                              <div className="flex items-center gap-2.5 min-w-0 shrink-0">
                                <div className={`w-3.5 h-3.5 rounded-full ${item.dotBg} shrink-0 shadow-2xs transition-transform duration-200 ${isActive ? 'scale-125 ring-2 ring-white' : ''}`} />
                                <div className={`text-xs font-black truncate transition-colors duration-200 ${isActive ? item.accentColor : 'text-black'}`}>
                                  {item.label}
                                </div>
                              </div>

                              <div className="shrink-0">
                                <span className={`text-xs font-black ${item.accentColor}`}>
                                  {item.percentage}
                                </span>
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
          </>
        )}

            {/* TAB 2: LA PROFE ADMIN */}
            {(activeAdminSubTab === 'profe' || activeAdminSubTab === 'overview') && (
              <div id="stats-la-profe" className="space-y-4 animate-fade-in scroll-mt-24">
                <div className="bg-amber-50/80 border-2 border-amber-300 p-4 rounded-3xl">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <Apple className="w-5 h-5 text-amber-700" />
                      <div>
                        <h3 className="text-sm font-black text-black uppercase">
                          {isEn ? 'LA PROFE: DIAGNOSTIC & COACHING MANAGEMENT' : 'LA PROFE: GESTIÓN DE DIAGNÓSTICOS Y ASESORÍAS'}
                        </h3>
                        <p className="text-xs text-black">
                          {isEn ? 'Manage 1-on-1 diagnostic sessions ($29) and monthly student subscriptions.' : 'Gestione sesiones diagnósticas 1-a-1 ($29) y suscripciones mensuales.'}
                        </p>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => onNavigateTab && onNavigateTab('teachers')}
                      className="bg-[#0D224A] hover:bg-[#1A365D] text-amber-300 px-3 py-1.5 rounded-full font-black text-xs uppercase flex items-center gap-1.5 transition-all"
                    >
                      <span>{isEn ? 'Open La Profe View' : 'Abrir Vista La Profe'}</span>
                      <ChevronRight className="w-3.5 h-3.5 text-amber-400" />
                    </button>
                  </div>

                  {/* DIAGNOSTIC BOOKINGS TABLE */}
                  <div className="bg-white rounded-2xl border border-amber-200 overflow-hidden shadow-xs">
                    <div className="bg-[#0D224A] text-amber-300 px-3.5 py-2 text-xs font-black uppercase tracking-wider flex items-center justify-between">
                      <span>{isEn ? 'ACTIVE BOOKING REQUESTS' : 'SOLICITUDES DE CITAS ACTIVAS'}</span>
                      <span className="text-[10px] bg-amber-400/20 text-amber-300 px-2 py-0.5 rounded-full">2 Pending</span>
                    </div>

                    <div className="divide-y divide-slate-100 text-xs">
                      {diagnosticBookings.map((b) => (
                        <div key={b.id} className="p-3 flex items-center justify-between hover:bg-slate-50">
                          <div>
                            <div className="font-bold text-black flex items-center gap-2">
                              <span>{b.studentName}</span>
                              <span className="text-[9.5px] font-black bg-emerald-100 text-emerald-800 px-1.5 py-0.5 rounded-full uppercase">PAID $29</span>
                            </div>
                            <div className="text-[11px] text-black flex items-center gap-3 mt-0.5">
                              <span>📅 {b.date}</span>
                              <span>📋 {b.type}</span>
                            </div>
                          </div>

                          <div className="flex items-center gap-2">
                            <button
                              type="button"
                              onClick={() => showNotify(isEn ? `Session confirmed with ${b.studentName}` : `Sesión confirmada con ${b.studentName}`)}
                              className="bg-emerald-600 hover:bg-emerald-700 text-white font-black text-[10.5px] px-3 py-1 rounded-full cursor-pointer"
                            >
                              {isEn ? 'Confirm' : 'Confirmar'}
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* TAB 3: STUDENTS ADMIN */}
            {(activeAdminSubTab === 'students' || activeAdminSubTab === 'overview') && (
              <div id="stats-student-monitor" className="space-y-4 animate-fade-in scroll-mt-24">
                <div className="bg-blue-50/80 border-2 border-blue-200 p-4 rounded-3xl">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <GraduationCap className="w-5 h-5 text-blue-900" />
                      <div>
                        <h3 className="text-sm font-black text-black uppercase">
                          {isEn ? 'STUDENT MONITOR & ANALYTICS' : 'MONITOR Y ANÁLISIS DE ESTUDIANTES'}
                        </h3>
                        <p className="text-xs text-black">
                          {isEn ? 'Inspect student progress, Civics 128 mastery, and daily streak counts.' : 'Inspeccione el avance de estudiantes, Cívica 128 y racha diaria.'}
                        </p>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => onNavigateTab && onNavigateTab('roadmap')}
                      className="bg-[#0D224A] hover:bg-[#1A365D] text-amber-300 px-3 py-1.5 rounded-full font-black text-xs uppercase flex items-center gap-1.5 transition-all"
                    >
                      <span>{isEn ? 'Open Roadmap View' : 'Abrir Vista Ruta'}</span>
                      <ChevronRight className="w-3.5 h-3.5 text-amber-400" />
                    </button>
                  </div>

                  {/* STUDENTS LIST */}
                  <div className="bg-white rounded-2xl border border-blue-200 overflow-hidden shadow-xs">
                    <div className="bg-[#0D224A] text-white px-3.5 py-2 text-xs font-black uppercase tracking-wider flex items-center justify-between">
                      <span className="text-amber-300">{isEn ? 'REGISTERED STUDENTS' : 'ESTUDIANTES REGISTRADOS'}</span>
                      <span className="text-[10px] bg-white/10 text-white px-2 py-0.5 rounded-full">Total: 3</span>
                    </div>

                    <div className="divide-y divide-slate-100 text-xs">
                      {studentsList.map((s) => (
                        <div key={s.id} className="p-3 flex items-center justify-between hover:bg-slate-50">
                          <div>
                            <div className="font-bold text-black flex flex-wrap items-center gap-2">
                              <span>{s.name}</span>
                              <span className="text-[10px] font-mono font-black bg-blue-100 text-blue-950 px-2 py-0.5 rounded-md border border-blue-300 shadow-2xs">
                                ID: {s.id}
                              </span>
                              <span className="text-[10px] text-black font-normal">({s.email})</span>
                            </div>
                            <div className="text-[11px] text-black flex items-center gap-3 mt-1">
                              <span className="font-bold text-blue-900">🏛️ Civics: {s.civicsScore}</span>
                              <span className="font-bold text-amber-700">🔥 Streak: {s.streak} Days</span>
                              <span className="font-bold text-emerald-800">🗣️ Fluency: {s.fluency}</span>
                            </div>
                          </div>

                          <button
                            type="button"
                            onClick={() => showNotify(isEn ? `Inspecting details for ${s.name}` : `Inspeccionando detalles de ${s.name}`)}
                            className="bg-slate-100 hover:bg-slate-200 text-black font-bold text-xs px-3 py-1 rounded-full cursor-pointer"
                          >
                            {isEn ? 'Details' : 'Detalles'}
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* TAB 4: SYSTEM ENGINE */}
            {(activeAdminSubTab === 'system' || activeAdminSubTab === 'overview') && (
              <div id="stats-system-engine" className="space-y-4 animate-fade-in scroll-mt-24">
                <div className="bg-slate-50 border-2 border-slate-300 p-4 rounded-3xl">
                  <h3 className="text-sm font-black text-black uppercase mb-3 flex items-center gap-2">
                    <Settings className="w-4 h-4 text-black" />
                    {isEn ? 'VOYAGER ENGINE & AI PARAMETERS' : 'MOTOR VOYAGER Y PARÁMETROS IA'}
                  </h3>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                    <div className="bg-white p-3.5 rounded-2xl border border-slate-200">
                      <h4 className="font-bold text-black mb-1">🤖 Gemini Live API Model</h4>
                      <p className="text-[11px] text-black mb-2">antigravity-gemini-live-2.0-flash</p>
                      <span className="bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded text-[10px] uppercase">OPERATIONAL</span>
                    </div>

                    <div className="bg-white p-3.5 rounded-2xl border border-slate-200">
                      <h4 className="font-bold text-black mb-1">🎙️ Primary Voice Persona</h4>
                      <p className="text-[11px] text-black mb-2">Puck (Male American Accent)</p>
                      <span className="bg-blue-100 text-blue-800 font-bold px-2 py-0.5 rounded text-[10px] uppercase">ENFORCED (VOYAGER ONLY)</span>
                    </div>
                  </div>
                </div>
              </div>
            )}
              </>
            )}

          </>
        )}

      </div>
    </div>
  );
};
