import React, { useState, useMemo } from 'react';
import { BusinessAdvisorFrameworkCard } from './BusinessAdvisorFrameworkCard';
import { 
  Target, 
  UserCheck, 
  Sliders, 
  Sparkles, 
  CheckCircle2, 
  Users, 
  Brain, 
  TrendingUp, 
  Globe, 
  Clock, 
  DollarSign, 
  Zap, 
  Award,
  Laptop,
  Check,
  RefreshCw,
  Heart,
  BarChart3,
  ShieldCheck,
  Smile
} from 'lucide-react';

export interface UxPanelProps {
  selectedLang: 'EN' | 'ES';
  onNavigateTab?: (tab: string) => void;
}

export const UxPanel: React.FC<UxPanelProps> = ({ selectedLang, onNavigateTab }) => {
  const isEn = selectedLang === 'EN';

  // Interactive Ideal Client Definition Inputs State
  const [targetAge, setTargetAge] = useState<string>('26-40');
  const [primaryGoal, setPrimaryGoal] = useState<string>('PROFESSIONAL');
  const [incomeBracket, setIncomeBracket] = useState<string>('3k-6k');
  const [targetRegion, setTargetRegion] = useState<string>('EEUU');
  const [preferredModality, setPreferredModality] = useState<string>('ONLINE');
  const [primaryPainPoint, setPrimaryPainPoint] = useState<string>('ACCENT_ANXIETY');
  const [weeklyFrequency, setWeeklyFrequency] = useState<string>('DAILY_20');

  const [savedNotification, setSavedNotification] = useState<string | null>(null);

  // Dynamic Match Score calculation based on current parameters
  const matchScore = useMemo(() => {
    let base = 85;
    if (targetAge === '26-40') base += 5;
    if (primaryGoal === 'PROFESSIONAL' || primaryGoal === 'CITIZENSHIP') base += 4;
    if (targetRegion === 'EEUU' || targetRegion === 'MEXICO') base += 3;
    if (preferredModality === 'ONLINE') base += 2;
    return Math.min(99, base);
  }, [targetAge, primaryGoal, targetRegion, preferredModality]);

  // Archetype distribution data for Circlegraph
  const archetypes = [
    { 
      id: 'prof', 
      label: isEn ? 'US Professional Immigrant' : 'Profesional e Inmigrante EE. UU.', 
      shortLabel: isEn ? 'US Professional' : 'Profesional EE. UU.',
      percentage: '48%', 
      revenue: '$8,856', 
      pctVal: 48, 
      color: '#3b82f6', 
      strokeDash: '150.79 314.16', 
      strokeOffset: '0', 
      dotBg: 'bg-blue-500', 
      accentColor: 'text-blue-600' 
    },
    { 
      id: 'citi', 
      label: isEn ? 'USCIS Citizenship Candidate' : 'Candidato Ciudadanía USCIS', 
      shortLabel: isEn ? 'USCIS Candidate' : 'Candidato USCIS',
      percentage: '28%', 
      revenue: '$5,166', 
      pctVal: 28, 
      color: '#10b981', 
      strokeDash: '87.96 314.16', 
      strokeOffset: '-150.79', 
      dotBg: 'bg-emerald-500', 
      accentColor: 'text-emerald-600' 
    },
    { 
      id: 'acad', 
      label: isEn ? 'Academic & University Student' : 'Estudiante Académico y Univ.', 
      shortLabel: isEn ? 'Academic Student' : 'Estudiante Académico',
      percentage: '16%', 
      revenue: '$2,952', 
      pctVal: 16, 
      color: '#f59e0b', 
      strokeDash: '50.26 314.16', 
      strokeOffset: '-238.75', 
      dotBg: 'bg-amber-500', 
      accentColor: 'text-amber-600' 
    },
    { 
      id: 'exec', 
      label: isEn ? 'Business Exec & Entrepreneur' : 'Ejecutivo y Emprendedor', 
      shortLabel: isEn ? 'Business Exec' : 'Ejecutivo de Negocios',
      percentage: '8%', 
      revenue: '$1,476', 
      pctVal: 8, 
      color: '#8b5cf6', 
      strokeDash: '25.13 314.16', 
      strokeOffset: '-289.01', 
      dotBg: 'bg-purple-500', 
      accentColor: 'text-purple-600' 
    }
  ];

  const [hoveredArchetype, setHoveredArchetype] = useState<string | null>(null);
  const [selectedArchetype, setSelectedArchetype] = useState<string | null>(null);

  const activeArchetypeId = selectedArchetype || hoveredArchetype;
  const activeArchetype = archetypes.find(a => a.id === activeArchetypeId);

  const handleSaveProfile = () => {
    setSavedNotification(
      isEn 
        ? 'Ideal Client Profile successfully configured and saved to UX Engine!' 
        : '¡Perfil de Cliente Ideal configurado y guardado exitosamente en el Motor UX!'
    );
    setTimeout(() => setSavedNotification(null), 4000);
  };

  const handleResetProfile = () => {
    setTargetAge('26-40');
    setPrimaryGoal('PROFESSIONAL');
    setIncomeBracket('3k-6k');
    setTargetRegion('EEUU');
    setPreferredModality('ONLINE');
    setPrimaryPainPoint('ACCENT_ANXIETY');
    setWeeklyFrequency('DAILY_20');
    setSavedNotification(
      isEn ? 'UX parameters reset to baseline.' : 'Parámetros UX restablecidos al estado inicial.'
    );
    setTimeout(() => setSavedNotification(null), 3000);
  };

  return (
    <div className="flex-1 flex flex-col bg-slate-50 text-slate-900 overflow-y-auto p-3 sm:p-5 md:p-6 space-y-5 text-left font-sans animate-fade-in">
      
      {/* Toast Notification */}
      {savedNotification && (
        <div className="bg-[#0D224A] text-amber-300 px-4 py-2.5 text-xs font-bold border-b-2 border-amber-400 flex items-center justify-between shadow-lg rounded-2xl animate-bounce">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-amber-400 shrink-0" />
            <span>{savedNotification}</span>
          </div>
          <button onClick={() => setSavedNotification(null)} className="text-white/70 hover:text-white font-black text-xs">✕</button>
        </div>
      )}

      {/* HEADER BAR */}
      <div className="bg-white rounded-3xl p-4 sm:p-6 border border-slate-200/90 shadow-2xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-[#0D224A] text-amber-400 flex items-center justify-center font-bold shadow-2xs">
              <Target className="w-6 h-6 text-amber-400" />
            </div>
            <div>
              <h2 className="text-lg sm:text-xl font-black text-slate-900 tracking-tight">
                {isEn ? 'UX DESIGN & IDEAL CLIENT PROFILE (ICP)' : 'DISEÑO UX Y CLIENTE IDEAL (ICP)'}
              </h2>
              <p className="text-xs text-slate-500 font-semibold mt-0.5">
                {isEn 
                  ? 'Define persona parameters, target demographics, pain points, and live experience statistics' 
                  : 'Define parámetros de persona, demografía objetivo, puntos de dolor y estadísticas de experiencia'}
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-300 text-xs font-bold">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span>{isEn ? 'UX Engine Active' : 'Motor UX Activo'}</span>
          </span>
        </div>
      </div>

      {/* VOYAGER BUSINESS INTELLIGENCE ADVISOR FRAMEWORK */}
      <BusinessAdvisorFrameworkCard selectedLang={selectedLang} currentTab="ux" onNavigateTab={onNavigateTab} />

      {/* TOP SUMMARY STATS ROW */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Ideal Client Match */}
        <div className="bg-white rounded-3xl p-4 border border-slate-200/90 shadow-2xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center font-black shrink-0">
            <UserCheck className="w-6 h-6" />
          </div>
          <div>
            <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider block">
              {isEn ? 'Ideal Client Match' : 'Coincidencia Cliente Ideal'}
            </span>
            <div className="text-2xl font-black text-slate-900 mt-0.5">
              {matchScore}%
            </div>
            <span className="text-[10px] font-bold text-emerald-600 inline-flex items-center gap-1">
              <span>↑ +4.2%</span> {isEn ? 'vs baseline' : 'vs promedio'}
            </span>
          </div>
        </div>

        {/* Card 2: Net Promoter Score */}
        <div className="bg-white rounded-3xl p-4 border border-slate-200/90 shadow-2xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center font-black shrink-0">
            <Smile className="w-6 h-6" />
          </div>
          <div>
            <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider block">
              {isEn ? 'Net Promoter Score' : 'NPS de Satisfacción'}
            </span>
            <div className="text-2xl font-black text-slate-900 mt-0.5">
              +88 / 100
            </div>
            <span className="text-[10px] font-bold text-emerald-600">
              {isEn ? 'World Class Delight' : 'Calificación Sobresaliente'}
            </span>
          </div>
        </div>

        {/* Card 3: Avg Session Duration */}
        <div className="bg-white rounded-3xl p-4 border border-slate-200/90 shadow-2xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-purple-50 text-purple-600 flex items-center justify-center font-black shrink-0">
            <Clock className="w-6 h-6" />
          </div>
          <div>
            <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider block">
              {isEn ? 'Avg Session Duration' : 'Duración Promedio Sesión'}
            </span>
            <div className="text-2xl font-black text-slate-900 mt-0.5">
              18.4 min
            </div>
            <span className="text-[10px] font-bold text-purple-600">
              {isEn ? 'High Daily Engagement' : 'Alta Retención Diaria'}
            </span>
          </div>
        </div>

        {/* Card 4: Forecasted LTV */}
        <div className="bg-white rounded-3xl p-4 border border-slate-200/90 shadow-2xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-black shrink-0">
            <TrendingUp className="w-6 h-6" />
          </div>
          <div>
            <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider block">
              {isEn ? 'Forecasted LTV / User' : 'LTV Proyectado / Usuario'}
            </span>
            <div className="text-2xl font-black text-slate-900 mt-0.5">
              $380 USD
            </div>
            <span className="text-[10px] font-bold text-emerald-600">
              {isEn ? '14.8% Conv. Rate' : 'Tasa Conv. 14.8%'}
            </span>
          </div>
        </div>
      </div>

      {/* MAIN TWO-COLUMN SECTION: INPUTS FORM & STATS CIRCLEGRAPH */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* LEFT 7 COLS: INTERACTIVE INPUTS TO DEFINE IDEAL CLIENT */}
        <div className="lg:col-span-7 bg-white rounded-3xl p-5 sm:p-6 border border-slate-200/90 shadow-2xs space-y-5">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2">
              <Sliders className="w-5 h-5 text-[#0D224A]" />
              <h3 className="text-sm font-black text-slate-900 uppercase tracking-wider">
                {isEn ? 'Define Ideal Client Parameters' : 'Definir Parámetros del Cliente Ideal'}
              </h3>
            </div>
            <button
              onClick={handleResetProfile}
              type="button"
              className="text-[11px] font-bold text-slate-400 hover:text-slate-700 flex items-center gap-1 cursor-pointer"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>{isEn ? 'Reset' : 'Restablecer'}</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            
            {/* Input 1: Age Range */}
            <div className="space-y-1.5">
              <label className="text-xs font-extrabold text-slate-700 block">
                {isEn ? '1. Target Age Group' : '1. Rango de Edad Objetivo'}
              </label>
              <select
                value={targetAge}
                onChange={(e) => setTargetAge(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-2xl border-2 border-slate-200 bg-slate-50 text-slate-900 font-bold text-xs focus:outline-none focus:border-[#0D224A] cursor-pointer transition-all"
              >
                <option value="18-25">{isEn ? '18 - 25 Yrs (Students)' : '18 - 25 Años (Estudiantes)'}</option>
                <option value="26-40">{isEn ? '26 - 40 Yrs (Dominant 45.9%)' : '26 - 40 Años (Dominante 45.9%)'}</option>
                <option value="41-55">{isEn ? '41 - 55 Yrs (Career Mid)' : '41 - 55 Años (Carrera Media)'}</option>
                <option value="55+">{isEn ? '55+ Yrs (Seniors & Civics)' : '55+ Años (Seniors y Cívica)'}</option>
              </select>
            </div>

            {/* Input 2: Primary Goal */}
            <div className="space-y-1.5">
              <label className="text-xs font-extrabold text-slate-700 block">
                {isEn ? '2. Core User Goal' : '2. Objetivo Principal del Usuario'}
              </label>
              <select
                value={primaryGoal}
                onChange={(e) => setPrimaryGoal(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-2xl border-2 border-slate-200 bg-slate-50 text-slate-900 font-bold text-xs focus:outline-none focus:border-[#0D224A] cursor-pointer transition-all"
              >
                <option value="PROFESSIONAL">{isEn ? 'Professional & Salary Growth' : 'Crecimiento Profesional y Empleo'}</option>
                <option value="CITIZENSHIP">{isEn ? 'USCIS Civics 128 Exam Pass' : 'Examen Cívico 128 USCIS'}</option>
                <option value="ACADEMIC">{isEn ? 'Academic & University Study' : 'Estudios Universitarios'}</option>
                <option value="TRAVEL">{isEn ? 'Travel, Culture & Everyday Life' : 'Viajes, Cultura y Vida Diaria'}</option>
              </select>
            </div>

            {/* Input 3: Target Monthly Income */}
            <div className="space-y-1.5">
              <label className="text-xs font-extrabold text-slate-700 block">
                {isEn ? '3. Estimated Monthly Income' : '3. Ingreso Mensual Estimado'}
              </label>
              <select
                value={incomeBracket}
                onChange={(e) => setIncomeBracket(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-2xl border-2 border-slate-200 bg-slate-50 text-slate-900 font-bold text-xs focus:outline-none focus:border-[#0D224A] cursor-pointer transition-all"
              >
                <option value="1k-3k">$1,000 - $3,000 USD / mo</option>
                <option value="3k-6k">$3,000 - $6,000 USD / mo ({isEn ? 'Dominant' : 'Dominante'})</option>
                <option value="6k+">$6,000+ USD / mo ({isEn ? 'Executive' : 'Ejecutivo'})</option>
              </select>
            </div>

            {/* Input 4: Primary Geographic Origin */}
            <div className="space-y-1.5">
              <label className="text-xs font-extrabold text-slate-700 block">
                {isEn ? '4. Primary Geographic Origin' : '4. Origen Geográfico Prioritario'}
              </label>
              <select
                value={targetRegion}
                onChange={(e) => setTargetRegion(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-2xl border-2 border-slate-200 bg-slate-50 text-slate-900 font-bold text-xs focus:outline-none focus:border-[#0D224A] cursor-pointer transition-all"
              >
                <option value="EEUU">{isEn ? 'USA / EEUU (42% Dominant)' : 'EEUU (42% Dominante)'}</option>
                <option value="MEXICO">{isEn ? 'Mexico (24%)' : 'México (24%)'}</option>
                <option value="COLOMBIA">{isEn ? 'Colombia (18%)' : 'Colombia (18%)'}</option>
                <option value="COSTA_RICA">{isEn ? 'Costa Rica (9%)' : 'Costa Rica (9%)'}</option>
                <option value="LATAM">{isEn ? 'Other (7%)' : 'Otros (7%)'}</option>
              </select>
            </div>

            {/* Input 5: Teaching Modality */}
            <div className="space-y-1.5">
              <label className="text-xs font-extrabold text-slate-700 block">
                {isEn ? '5. Preferred Modality' : '5. Modalidad Preferida'}
              </label>
              <select
                value={preferredModality}
                onChange={(e) => setPreferredModality(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-2xl border-2 border-slate-200 bg-slate-50 text-slate-900 font-bold text-xs focus:outline-none focus:border-[#0D224A] cursor-pointer transition-all"
              >
                <option value="ONLINE">{isEn ? 'Online / Remote AI (58.3%)' : 'En Línea / IA Remota (58.3%)'}</option>
                <option value="HYBRID">{isEn ? 'Hybrid 1-on-1 + AI (29.2%)' : 'Híbrido 1-a-1 + IA (29.2%)'}</option>
                <option value="IN_PERSON">{isEn ? 'In-Person Coaching (12.5%)' : 'Coaching Presencial (12.5%)'}</option>
              </select>
            </div>

            {/* Input 6: Primary Pain Point */}
            <div className="space-y-1.5">
              <label className="text-xs font-extrabold text-slate-700 block">
                {isEn ? '6. Core Pain Point / Obstacle' : '6. Punto de Dolor Principal'}
              </label>
              <select
                value={primaryPainPoint}
                onChange={(e) => setPrimaryPainPoint(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-2xl border-2 border-slate-200 bg-slate-50 text-slate-900 font-bold text-xs focus:outline-none focus:border-[#0D224A] cursor-pointer transition-all"
              >
                <option value="ACCENT_ANXIETY">{isEn ? 'Speaking Anxiety & Accent Fear' : 'Ansiedad al Hablar e Inseguridad de Acento'}</option>
                <option value="SCHEDULE_LIMIT">{isEn ? 'Lack of Time for Fixed Classes' : 'Falta de Tiempo para Clases Fijas'}</option>
                <option value="USCIS_FEAR">{isEn ? 'Fear of USCIS Oral Civics Exam' : 'Miedo al Examen Oral de USCIS'}</option>
                <option value="TECHNICAL_VOCAB">{isEn ? 'Need for Technical / Work Terms' : 'Vocabulario Técnico de Trabajo'}</option>
              </select>
            </div>

          </div>

          {/* Action Row */}
          <div className="pt-2 border-t border-slate-100 flex items-center justify-between gap-3">
            <div className="text-[11px] font-bold text-slate-500">
              {isEn ? 'Live Match Engine Score:' : 'Puntaje de Motor de Coincidencia:'} <span className="text-[#0D224A] font-black">{matchScore}%</span>
            </div>
            <button
              onClick={handleSaveProfile}
              type="button"
              className="px-6 py-2.5 bg-[#0D224A] hover:bg-[#1A365D] text-amber-300 font-black text-xs rounded-full shadow-md transition-all active:scale-95 cursor-pointer flex items-center gap-2"
            >
              <CheckCircle2 className="w-4 h-4 text-amber-400" />
              <span>{isEn ? 'Save Ideal Client Profile' : 'Guardar Perfil de Cliente Ideal'}</span>
            </button>
          </div>
        </div>

        {/* RIGHT 5 COLS: CIRCLEGRAPH STATS & ARCHETYPE BREAKDOWN */}
        <div className="lg:col-span-5 bg-white rounded-3xl p-5 sm:p-6 border border-slate-200/90 shadow-2xs space-y-5 flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 border-b border-slate-100 pb-3 mb-4">
              <BarChart3 className="w-5 h-5 text-[#0D224A]" />
              <h3 className="text-sm font-black text-slate-900 uppercase tracking-wider">
                {isEn ? 'Ideal Client Archetype Distribution' : 'Distribución del Cliente Ideal'}
              </h3>
            </div>

            {/* CIRCLEGRAPH WHEEL */}
            <div className="flex flex-col items-center justify-center p-2 select-none group" onMouseLeave={() => setHoveredArchetype(null)}>
              <div className="relative flex items-center justify-center">
                <svg width="180" height="180" viewBox="0 0 140 140" className="transform -rotate-90 drop-shadow-sm transition-all duration-300">
                  <circle cx="70" cy="70" r="52" stroke="#f1f5f9" strokeWidth="14" fill="transparent" />

                  {archetypes.map((arch) => {
                    const isActive = activeArchetypeId === arch.id;
                    const isDimmed = activeArchetypeId && !isActive;

                    return (
                      <circle
                        key={arch.id}
                        cx="70"
                        cy="70"
                        r="52"
                        stroke={arch.color}
                        strokeWidth={isActive ? '18' : '14'}
                        strokeDasharray={arch.strokeDash}
                        strokeDashoffset={arch.strokeOffset}
                        fill="transparent"
                        className={`transition-all duration-300 cursor-pointer ${
                          isDimmed ? 'opacity-30' : 'opacity-100'
                        }`}
                        onMouseEnter={() => setHoveredArchetype(arch.id)}
                        onMouseLeave={() => setHoveredArchetype(null)}
                        onClick={() => setSelectedArchetype(selectedArchetype === arch.id ? null : arch.id)}
                      />
                    );
                  })}
                </svg>

                {/* Donut Wheel Inner Text */}
                <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-2 pointer-events-none">
                  <span className="text-2xl font-black text-slate-900 leading-none transition-all duration-300">
                    {activeArchetype ? activeArchetype.percentage : '48%'}
                  </span>
                  <span className="text-[10px] font-black uppercase tracking-wider mt-1 text-slate-800 flex items-center justify-center gap-1">
                    <span>{activeArchetype ? activeArchetype.shortLabel : (isEn ? 'US Professional' : 'Profesional EE. UU.')}</span>
                  </span>
                  <span className="text-[9px] font-bold text-slate-500 mt-0.5">
                    {activeArchetype ? `${activeArchetype.revenue}` : (isEn ? 'Dominant Archetype' : 'Arquetipo Dominante')}
                  </span>
                </div>
              </div>
            </div>

            {/* CIRCLEGRAPH LEGEND LIST (LEFT ALIGNED FLEX FORMAT) */}
            <div className="mt-4 space-y-2">
              {archetypes.map((arch) => {
                const isActive = activeArchetypeId === arch.id;
                const isDimmed = activeArchetypeId && !isActive;

                return (
                  <div
                    key={arch.id}
                    onMouseEnter={() => setHoveredArchetype(arch.id)}
                    onMouseLeave={() => setHoveredArchetype(null)}
                    onClick={() => setSelectedArchetype(selectedArchetype === arch.id ? null : arch.id)}
                    className={`p-1.5 rounded-xl transition-all duration-200 cursor-pointer flex items-center justify-start gap-4 ${
                      isActive 
                        ? 'bg-slate-50 opacity-100 scale-[1.02]' 
                        : isDimmed 
                        ? 'opacity-40 hover:opacity-100' 
                        : 'opacity-100'
                    }`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0 shrink-0">
                      <div className={`w-3.5 h-3.5 rounded-full ${arch.dotBg} shrink-0 shadow-2xs transition-transform duration-200 ${isActive ? 'scale-125 ring-2 ring-white' : ''}`} />
                      <div className={`text-xs font-black truncate transition-colors duration-200 ${isActive ? arch.accentColor : 'text-slate-800'}`}>
                        {arch.label}
                      </div>
                    </div>

                    <div className="shrink-0 flex items-center gap-1.5">
                      <span className={`text-xs font-black ${arch.accentColor}`}>
                        {arch.percentage}
                      </span>
                      <span className="text-[11px] font-semibold text-slate-400">
                        ({arch.revenue})
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="p-3 bg-amber-50/70 border border-amber-200/90 rounded-2xl text-[11px] font-semibold text-amber-900 flex items-center gap-2.5">
            <Sparkles className="w-4 h-4 text-amber-600 shrink-0" />
            <span>
              {isEn 
                ? 'Targeting US Professional Immigrants yields the highest retention rate (92.4%) and conversion velocity.' 
                : 'Priorizar a Profesionales Inmigrantes en EE. UU. genera la mayor retención (92.4%) y velocidad de conversión.'}
            </span>
          </div>
        </div>

      </div>

      {/* IDEAL TARGET AUDIENCE SUMMARY CARD */}
      <div className="bg-[#0D224A] text-white rounded-3xl p-5 sm:p-6 border border-slate-800 shadow-lg space-y-4">
        <div className="flex items-center justify-between border-b border-white/10 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-amber-400 text-[#0D224A] flex items-center justify-center font-black">
              <Brain className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-black text-amber-300 uppercase tracking-wider">
                {isEn ? 'Ideal Target Audience Profile (ICP Summary)' : 'Perfil Resumido de Audiencia Objetivo Ideal (ICP)'}
              </h3>
              <p className="text-[11px] text-slate-300 font-medium">
                {isEn ? 'Synthesized from platform analytics, demography, and usage behavior' : 'Sintetizado a partir de analítica de plataforma, demografía y comportamiento'}
              </p>
            </div>
          </div>
          <span className="px-3 py-1 rounded-full bg-amber-400/20 text-amber-300 text-[11px] font-black uppercase tracking-wider border border-amber-400/30">
            {isEn ? 'Primary Persona: Professional Immigrant' : 'Persona Principal: Profesional Inmigrante'}
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 text-xs">
          {/* Demographic Pillar */}
          <div className="p-3.5 rounded-2xl bg-white/5 border border-white/10 space-y-1.5">
            <div className="flex items-center gap-1.5 text-amber-300 font-black uppercase text-[10px] tracking-wider">
              <Users className="w-4 h-4" />
              <span>{isEn ? 'Demographics' : 'Demografía'}</span>
            </div>
            <ul className="space-y-1 text-slate-200 text-[11px]">
              <li>• <strong>{isEn ? 'Age:' : 'Edad:'}</strong> 26 – 40 {isEn ? 'years' : 'años'} (45.9% {isEn ? 'Dominant' : 'Dominante'})</li>
              <li>• <strong>{isEn ? 'Location:' : 'Ubicación:'}</strong> EEUU / USA (42%) & México (24%)</li>
              <li>• <strong>{isEn ? 'Income:' : 'Ingreso:'}</strong> $3,000 – $6,000 USD / {isEn ? 'month' : 'mes'}</li>
              <li>• <strong>{isEn ? 'Gender Split:' : 'Género:'}</strong> 52.5% {isEn ? 'Men' : 'Hombres'} / 37.5% {isEn ? 'Women' : 'Mujeres'}</li>
            </ul>
          </div>

          {/* Psychographics & Intent */}
          <div className="p-3.5 rounded-2xl bg-white/5 border border-white/10 space-y-1.5">
            <div className="flex items-center gap-1.5 text-blue-300 font-black uppercase text-[10px] tracking-wider">
              <Target className="w-4 h-4" />
              <span>{isEn ? 'Core Objectives' : 'Objetivos Clave'}</span>
            </div>
            <ul className="space-y-1 text-slate-200 text-[11px]">
              <li>• <strong>{isEn ? 'Career:' : 'Carrera:'}</strong> {isEn ? 'Job promotion & US salary increases' : 'Ascensos laborales y mejores ingresos en EE. UU.'}</li>
              <li>• <strong>{isEn ? 'Civics:' : 'Cívica:'}</strong> {isEn ? 'USCIS N-400 128 Oral Civics Exam' : 'Examen cívico oral de ciudadanía USCIS'}</li>
              <li>• <strong>{isEn ? 'Confidence:' : 'Confianza:'}</strong> {isEn ? 'Overcoming accent anxiety in public' : 'Superar el miedo y timidez al hablar'}</li>
            </ul>
          </div>

          {/* Preferred Experience */}
          <div className="p-3.5 rounded-2xl bg-white/5 border border-white/10 space-y-1.5">
            <div className="flex items-center gap-1.5 text-emerald-300 font-black uppercase text-[10px] tracking-wider">
              <Laptop className="w-4 h-4" />
              <span>{isEn ? 'UX & Modality' : 'UX y Modalidad'}</span>
            </div>
            <ul className="space-y-1 text-slate-200 text-[11px]">
              <li>• <strong>{isEn ? 'Format:' : 'Formato:'}</strong> Online / Remote AI (58.3%)</li>
              <li>• <strong>{isEn ? 'Cadence:' : 'Cadencia:'}</strong> 15–20 {isEn ? 'min daily voice micro-lessons' : 'min diarios de micro-lecciones'}</li>
              <li>• <strong>{isEn ? 'Pace:' : 'Ritmo:'}</strong> {isEn ? 'Self-paced conversational practice' : 'Autoguiado con retroalimentación IA'}</li>
            </ul>
          </div>

          {/* Value Proposition & Retention */}
          <div className="p-3.5 rounded-2xl bg-white/5 border border-white/10 space-y-1.5">
            <div className="flex items-center gap-1.5 text-purple-300 font-black uppercase text-[10px] tracking-wider">
              <Award className="w-4 h-4" />
              <span>{isEn ? 'Value Drivers' : 'Factores de Valor'}</span>
            </div>
            <ul className="space-y-1 text-slate-200 text-[11px]">
              <li>• <strong>{isEn ? 'Retention:' : 'Retención:'}</strong> 92.4% {isEn ? 'for professional tracks' : 'en rutas profesionales'}</li>
              <li>• <strong>{isEn ? 'NPS:' : 'NPS:'}</strong> +88 / 100 {isEn ? 'satisfaction rating' : 'satisfacción general'}</li>
              <li>• <strong>{isEn ? 'Est. LTV:' : 'LTV Est.:'}</strong> $380 USD {isEn ? 'average lifetime value' : 'valor promedio por vida'}</li>
            </ul>
          </div>
        </div>
      </div>

      {/* FEATURE ADOPTION & USER EXPERIENCE HEATMAP METRICS */}
      <div className="bg-white rounded-3xl p-5 sm:p-6 border border-slate-200/90 shadow-2xs space-y-4">
        <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
          <Zap className="w-5 h-5 text-[#0D224A]" />
          <h3 className="text-sm font-black text-slate-900 uppercase tracking-wider">
            {isEn ? 'Feature Adoption & UX Engagement Metrics' : 'Adopción de Funcionalidades y Métricas de Experiencia (UX)'}
          </h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          
          {/* Feature 1: AI Voice Agent */}
          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-black text-slate-900 uppercase">
                {isEn ? 'Live Voice AI Agent' : 'Agente de Voz IA en Vivo'}
              </span>
              <span className="text-xs font-black text-blue-600">88.5%</span>
            </div>
            <div className="w-full h-2 rounded-full bg-slate-200 overflow-hidden">
              <div className="h-full bg-blue-500 rounded-full" style={{ width: '88.5%' }} />
            </div>
            <p className="text-[11px] font-medium text-slate-500">
              {isEn ? 'Primary interaction channel for daily practice' : 'Canal primario para práctica conversacional diaria'}
            </p>
          </div>

          {/* Feature 2: Civics 128 Simulator */}
          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-black text-slate-900 uppercase">
                {isEn ? 'Civics 128 Exam Simulator' : 'Simulador Cívica 128'}
              </span>
              <span className="text-xs font-black text-emerald-600">74.2%</span>
            </div>
            <div className="w-full h-2 rounded-full bg-slate-200 overflow-hidden">
              <div className="h-full bg-emerald-500 rounded-full" style={{ width: '74.2%' }} />
            </div>
            <p className="text-[11px] font-medium text-slate-500">
              {isEn ? 'High mastery completion rate among N-400 candidates' : 'Alta tasa de respuesta correcta entre candidatos N-400'}
            </p>
          </div>

          {/* Feature 3: La Profe 1-on-1 Diagnostics */}
          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-black text-slate-900 uppercase">
                {isEn ? 'La Profe 1-on-1 Diagnostics' : 'Diagnóstico 1-a-1 La Profe'}
              </span>
              <span className="text-xs font-black text-amber-600">62.0%</span>
            </div>
            <div className="w-full h-2 rounded-full bg-slate-200 overflow-hidden">
              <div className="h-full bg-amber-500 rounded-full" style={{ width: '62.0%' }} />
            </div>
            <p className="text-[11px] font-medium text-slate-500">
              {isEn ? 'Top driver of premium tutoring conversions' : 'Principal motor de conversión a planes con tutoría'}
            </p>
          </div>

        </div>
      </div>

    </div>
  );
};

export default UxPanel;
