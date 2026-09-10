import React, { useState } from 'react';
import { 
  Settings, 
  Globe, 
  Volume2, 
  Mic, 
  Subtitles, 
  Sparkles, 
  Check, 
  ShieldCheck, 
  RotateCcw,
  Sliders,
  Headphones,
  SlidersHorizontal,
  User,
  Mail,
  MapPin,
  Activity,
  Award,
  LogOut,
  Building2
} from 'lucide-react';
import { AdminRoleSwitcherBar } from './AdminRoleSwitcherBar';
import { saveUserProfile, getLocalProfileCache } from '../services/userProfileService';

const US_STATES = [
  'Alabama', 'Alaska', 'Arizona', 'Arkansas', 'California', 'Colorado', 'Connecticut',
  'Delaware', 'Florida', 'Georgia', 'Hawaii', 'Idaho', 'Illinois', 'Indiana', 'Iowa',
  'Kansas', 'Kentucky', 'Louisiana', 'Maine', 'Maryland', 'Massachusetts', 'Michigan',
  'Minnesota', 'Mississippi', 'Missouri', 'Montana', 'Nebraska', 'Nevada', 'New Hampshire',
  'New Jersey', 'New Mexico', 'New York', 'North Carolina', 'North Dakota', 'Ohio',
  'Oklahoma', 'Oregon', 'Pennsylvania', 'Rhode Island', 'South Carolina', 'South Dakota',
  'Tennessee', 'Texas', 'Utah', 'Vermont', 'Virginia', 'Washington', 'West Virginia',
  'Wisconsin', 'Wyoming', 'Puerto Rico', 'Washington D.C.'
];

interface SettingsPanelProps {
  selectedLang: 'EN' | 'ES';
  setSelectedLang: (lang: 'EN' | 'ES') => void;
  isListenOnly: boolean;
  setIsListenOnly: (val: boolean) => void;
  isTranslateMode: boolean;
  setIsTranslateMode: (val: boolean) => void;
  isBilingualMode: boolean;
  setIsBilingualMode: (val: boolean) => void;
  isSpanishOnlyMode: boolean;
  setIsSpanishOnlyMode: (val: boolean) => void;
  isEnglishOnlyMode: boolean;
  setIsEnglishOnlyMode: (val: boolean) => void;
  onClose?: () => void;
  onRedoOnboarding?: () => void;
  onLogout?: () => void;
  onNavigateTab?: (tab: 'home' | 'chat' | 'progress' | 'roadmap' | 'teachers' | 'settings') => void;
}

export const SettingsPanel: React.FC<SettingsPanelProps> = ({
  selectedLang,
  setSelectedLang,
  isListenOnly,
  setIsListenOnly,
  isTranslateMode,
  setIsTranslateMode,
  isBilingualMode,
  setIsBilingualMode,
  isSpanishOnlyMode,
  setIsSpanishOnlyMode,
  isEnglishOnlyMode,
  setIsEnglishOnlyMode,
  onRedoOnboarding,
  onLogout,
  onNavigateTab
}) => {
  const [voiceSpeed, setVoiceSpeed] = useState<'slow' | 'normal' | 'fast'>('normal');
  const [autoPlayAudio, setAutoPlayAudio] = useState<boolean>(true);
  const [feedbackLevel, setFeedbackLevel] = useState<'detailed' | 'standard' | 'minimal'>('standard');
  const [dailyGoalMinutes, setDailyGoalMinutes] = useState<number>(15);
  const [saveSuccess, setSaveSuccess] = useState<boolean>(false);

  const handleSave = () => {
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 2500);
  };

  const isEn = selectedLang === 'EN';

  const handleSubtitleOptionChange = (mode: 'bilingual' | 'english' | 'spanish') => {
    if (mode === 'bilingual') {
      setIsBilingualMode(true);
      setIsEnglishOnlyMode(false);
      setIsSpanishOnlyMode(false);
    } else if (mode === 'english') {
      setIsBilingualMode(false);
      setIsEnglishOnlyMode(true);
      setIsSpanishOnlyMode(false);
    } else if (mode === 'spanish') {
      setIsBilingualMode(false);
      setIsEnglishOnlyMode(false);
      setIsSpanishOnlyMode(true);
    }
  };

  const activeSubtitleMode = isSpanishOnlyMode 
    ? 'spanish' 
    : isEnglishOnlyMode 
    ? 'english' 
    : 'bilingual';

  return (
    <div className="flex-1 p-4 md:p-6 overflow-y-auto tab-content-area bg-white text-black">
      <div className="max-w-3xl mx-auto space-y-6">
        
        {/* SETTINGS SECTION EXPLANATION BANNER */}
        <div className="bg-gradient-to-r from-zinc-700 via-zinc-800 to-[#231d17] rounded-2xl p-5 md:p-6 text-white text-left shadow-lg space-y-3 relative overflow-hidden border border-zinc-500/20 flex-shrink-0">
          <div className="absolute right-0 bottom-0 opacity-10 pointer-events-none transform translate-y-8 translate-x-8">
            <Settings className="w-48 h-48 text-white" />
          </div>
          <div className="relative z-10 flex flex-col justify-between gap-3">
            <div className="space-y-1.5">
              <span style={{ fontFamily: "'Lato', sans-serif" }} className="text-[9px] md:text-[10px] font-black uppercase tracking-widest bg-white/20 px-2.5 py-0.5 rounded-full border border-white/10 inline-block">
                {isEn ? 'PREFERENCES & CONFIGURATION' : 'PREFERENCIAS Y CONFIGURACIÓN'}
              </span>
              <h2 style={{ fontFamily: "'Lato', sans-serif" }} className="text-xl md:text-2xl font-black tracking-tight uppercase">
                {isEn ? 'Adjust Your Settings' : 'Ajusta tus Preferencias'}
              </h2>
              <p style={{ fontFamily: '"American Typewriter", "Courier New", Courier, serif' }} className="text-[10.5pt] text-white/90 leading-relaxed font-serif">
                {isEn 
                  ? 'Welcome to the Settings panel. Here you can configure the interface language, select translation and subtitle modes, toggle text-only listen-only mode, adjust voice speech rates, set your daily practice goals, and customize pedagogical feedback levels.'
                  : 'Bienvenido al panel de Configuración. Aquí puedes graduar el idioma de la interfaz, elegir los modos de traducción y subtítulos, activar el modo de solo escucha (sin audio), ajustar la velocidad de reproducción de voz de Voyager, establecer tus metas de práctica diarias y personalizar el nivel de feedback pedagógico.'}
              </p>
            </div>
          </div>
        </div>

        {/* MI PERFIL / MY PROFILE SECTION */}
        {(() => {
          const savedAccount = localStorage.getItem('voyager_user_account');
          if (!savedAccount) return null;
          let userAccount = null;
          try {
            userAccount = JSON.parse(savedAccount);
          } catch (e) {
            return null;
          }
          if (!userAccount) return null;

          const visitorFullName = (() => {
            if (userAccount?.name && userAccount.name !== 'Estudiante' && userAccount.name !== 'Learner') {
              const name = userAccount.name.trim();
              if (name && name !== 'Estudiante' && name !== 'Learner') return name;
            }
            return '';
          })();

          return (
            <div className="bg-white rounded-xl p-5 border border-[#e8ded0] shadow-sm space-y-4 text-left">
              <div className="flex items-center gap-2 text-[#865918]">
                <User className="w-4 h-4" />
                <h3 style={{ fontFamily: "'Lato', sans-serif" }} className="text-xs font-sans font-bold uppercase tracking-wider text-[#231d17]">
                  {visitorFullName 
                    ? (isEn ? `${visitorFullName.toUpperCase()}'S PROFILE` : `PERFIL DE ${visitorFullName.toUpperCase()}`) 
                    : (isEn ? 'MY PROFILE' : 'MI PERFIL')}
                </h3>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5 divide-y md:divide-y-0 md:divide-x divide-neutral-200/80">
                {/* Left Side: Personal Info */}
                <div className="space-y-3 pb-3 md:pb-0">
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-full ${userAccount.isAdmin || userAccount.email?.toLowerCase() === 'theorangesnowman@gmail.com' ? 'bg-amber-100 text-amber-800 border-2 border-amber-400 ring-2 ring-amber-300/50' : 'bg-neutral-100 text-zinc-700'} flex items-center justify-center flex-shrink-0`}>
                      {userAccount.isAdmin || userAccount.email?.toLowerCase() === 'theorangesnowman@gmail.com' ? (
                        <ShieldCheck className="w-5 h-5 text-amber-600" />
                      ) : (
                        <User className="w-5 h-5" />
                      )}
                    </div>
                    <div>
                      <div style={{ fontFamily: "'Lato', sans-serif" }} className="text-[14px] font-black uppercase text-[#231d17] tracking-wide flex items-center gap-1.5">
                        <span>{userAccount.name}</span>
                        {(userAccount.isAdmin || userAccount.email?.toLowerCase() === 'theorangesnowman@gmail.com') && (
                          <span className="px-2 py-0.5 text-[9px] font-black bg-amber-500 text-slate-950 rounded-md border border-amber-300 uppercase tracking-wider">
                            ADMIN
                          </span>
                        )}
                      </div>
                      <div className="text-[10px] text-zinc-500 uppercase font-medium">
                        {userAccount.isAdmin || userAccount.email?.toLowerCase() === 'theorangesnowman@gmail.com'
                          ? (isEn ? 'ADMINISTRATOR ID (ADMIN-VOYAGER-001)' : 'ID ADMINISTRATIVO (ADMIN-VOYAGER-001)')
                          : (isEn ? 'LEARNER' : 'ESTUDIANTE')}
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2 pt-1">
                    <div className="flex items-center gap-2 text-zinc-600">
                      <Mail className="w-3.5 h-3.5 flex-shrink-0" />
                      <span className="text-xs font-medium truncate">{userAccount.email}</span>
                    </div>
                    <div className="flex items-center gap-2 text-zinc-600">
                      <MapPin className="w-3.5 h-3.5 flex-shrink-0" />
                      <span className="text-xs font-medium">
                        {userAccount.age ? `${userAccount.age} ${isEn ? 'years old' : 'años'}, ` : ''}
                        {userAccount.usState || userAccount.state ? `${userAccount.usState || userAccount.state}, ` : ''}
                        {userAccount.country}
                      </span>
                    </div>

                    {/* U.S. Residence State Selection */}
                    <div className="pt-1.5 border-t border-neutral-200/80 mt-2">
                      <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider block mb-1 flex items-center gap-1.5">
                        <Building2 className="w-3 h-3 text-[#865918]" />
                        {isEn ? 'U.S. State Residence (USCIS Civics Location)' : 'Estado de Residencia EE.UU. (Cívica USCIS)'}
                      </label>
                      <select
                        value={userAccount.usState || userAccount.state || ''}
                        onChange={(e) => {
                          const val = e.target.value;
                          saveUserProfile(userAccount.uid || 'guest', { usState: val, state: val });
                          setSaveSuccess(true);
                          setTimeout(() => setSaveSuccess(false), 2000);
                        }}
                        className="w-full text-xs font-semibold bg-amber-50/50 border border-amber-200 text-zinc-800 rounded-lg px-2.5 py-1.5 focus:outline-none focus:ring-2 focus:ring-amber-500/50 cursor-pointer"
                      >
                        <option value="">{isEn ? '-- Select Your U.S. State --' : '-- Selecciona tu Estado de EE.UU. --'}</option>
                        {US_STATES.map((st) => (
                          <option key={st} value={st}>{st}</option>
                        ))}
                      </select>
                      <p className="text-[9.5px] text-zinc-500 mt-1 leading-tight">
                        {isEn 
                          ? 'Officer Voyager uses your state to accurately evaluate questions about your U.S. Senators, Governor, and State Capital.' 
                          : 'Officer Voyager utiliza tu estado para evaluar con precisión preguntas sobre tus Senadores de EE.UU., Gobernador y Capital Estatal.'}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Right Side: Learning Track */}
                <div className="space-y-3 pt-3 md:pt-0 md:pl-5">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2.5">
                      <Activity className="w-4 h-4 text-[#865918] flex-shrink-0" />
                      <div>
                        <div className="text-[10px] text-zinc-400 font-bold uppercase tracking-wider">
                          {isEn ? 'LEARNING TRACK' : 'RUTA DE APRENDIZAJE'}
                        </div>
                        <div style={{ fontFamily: "'Lato', sans-serif" }} className="text-xs font-extrabold text-[#231d17] uppercase tracking-wide">
                          {userAccount.goal}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2.5">
                      <Award className="w-4 h-4 text-[#865918] flex-shrink-0" />
                      <div>
                        <div className="text-[10px] text-zinc-400 font-bold uppercase tracking-wider">
                          {isEn ? 'ESTIMATED LEVEL' : 'NIVEL ESTIMADO'}
                        </div>
                        <div style={{ fontFamily: "'Lato', sans-serif" }} className="text-xs font-extrabold text-[#231d17] uppercase tracking-wide">
                          {userAccount.levelEstimate}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* SUPER ADMIN COMMAND CENTER FOR FEDERICO SANDOVAL */}
              {(userAccount.isAdmin || userAccount.email?.toLowerCase() === 'theorangesnowman@gmail.com') && (
                <div className="mt-4 pt-4 border-t border-amber-200 bg-amber-50/60 p-3.5 rounded-xl border border-amber-300 text-left space-y-3">
                  <AdminRoleSwitcherBar selectedLang={selectedLang} onNavigateTab={onNavigateTab} />
                  <div className="flex items-center gap-2 mb-2.5">
                    <span className="text-base">👑</span>
                    <div>
                      <h4 className="text-xs font-black text-slate-900 uppercase tracking-wide">
                        {isEn ? 'SUPER ADMIN PERSPECTIVE SWITCHER' : 'VISTAS DE ADMINISTRACIÓN DISPONIBLES'}
                      </h4>
                      <p className="text-[10.5px] text-zinc-600">
                        {isEn 
                          ? 'As sole Administrator (Federico Sandoval), access La Profe Admin and Student Admin views below:' 
                          : 'Como Administrador Único (Federico Sandoval), acceda a las vistas de La Profe y del Estudiante:'}
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
                    {/* La Profe Admin Card */}
                    <button
                      type="button"
                      onClick={() => onNavigateTab && onNavigateTab('teachers')}
                      className="p-3 bg-white hover:bg-amber-100/60 border border-amber-300 rounded-xl text-left transition-all cursor-pointer group shadow-2xs"
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs font-extrabold text-[#0D224A] flex items-center gap-1.5">
                          <span>👩‍🏫</span> {isEn ? 'LA PROFE ADMIN VISTA' : 'VISTA ADMIN LA PROFE'}
                        </span>
                        <span className="text-amber-700 text-xs font-black group-hover:translate-x-1 transition-transform">→</span>
                      </div>
                      <p className="text-[10.5px] text-zinc-600">
                        {isEn ? 'Manage 1-on-1 bookings ($29), student phonetics logs, monthly packages.' : 'Gestione citas diagnósticas ($29), bitácoras fonéticas y planes mensuales.'}
                      </p>
                    </button>

                    {/* Student Admin Card */}
                    <button
                      type="button"
                      onClick={() => onNavigateTab && onNavigateTab('roadmap')}
                      className="p-3 bg-white hover:bg-amber-100/60 border border-amber-300 rounded-xl text-left transition-all cursor-pointer group shadow-2xs"
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs font-extrabold text-[#0D224A] flex items-center gap-1.5">
                          <span>🎓</span> {isEn ? 'STUDENT ADMIN VISTA' : 'VISTA ADMIN ESTUDIANTE'}
                        </span>
                        <span className="text-amber-700 text-xs font-black group-hover:translate-x-1 transition-transform">→</span>
                      </div>
                      <p className="text-[10.5px] text-zinc-600">
                        {isEn ? 'Inspect student progress, Civics 128 mastery, daily streak analytics.' : 'Inspeccione el avance del estudiante, Cívica 128 y racha diaria.'}
                      </p>
                    </button>
                  </div>
                </div>
              )}

              {/* Account Management & Onboarding Reset Actions */}
              <div className="pt-3 border-t border-neutral-200/80 flex flex-wrap items-center justify-between gap-2.5">
                {onRedoOnboarding && (
                  <button
                    type="button"
                    onClick={onRedoOnboarding}
                    className="px-3.5 py-1.5 bg-neutral-100 hover:bg-neutral-200 text-[#231d17] border border-neutral-300 rounded-lg text-xs font-bold tracking-wide transition-all cursor-pointer flex items-center gap-1.5 active:scale-95 shadow-xs"
                  >
                    <RotateCcw className="w-3.5 h-3.5 text-[#865918]" />
                    <span>{isEn ? 'Redo Onboarding Questionnaire' : 'Rehacer Cuestionario de Perfil'}</span>
                  </button>
                )}
                {onLogout && (
                  <button
                    type="button"
                    onClick={onLogout}
                    className="px-3.5 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-lg text-xs font-bold tracking-wide transition-all cursor-pointer flex items-center gap-1.5 active:scale-95 shadow-xs"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                    <span>{isEn ? 'Log Out & Restart' : 'Cerrar Sesión'}</span>
                  </button>
                )}
              </div>
            </div>
          );
        })()}

        {/* GUEST FALLBACK PROFILE CARD (When no saved user account exists) */}
        {(() => {
          const savedAccount = localStorage.getItem('voyager_user_account');
          if (savedAccount) return null;

          return (
            <div className="bg-white rounded-xl p-5 border border-[#e8ded0] shadow-sm space-y-3 text-left">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-[#865918]">
                  <User className="w-4 h-4" />
                  <h3 style={{ fontFamily: "'Lato', sans-serif" }} className="text-xs font-sans font-bold uppercase tracking-wider text-[#231d17]">
                    {isEn ? 'GUEST SESSION / ONBOARDING' : 'MI PERFIL / CUESTIONARIO'}
                  </h3>
                </div>
              </div>
              <p className="text-xs text-neutral-600 font-medium">
                {isEn 
                  ? 'Redo the onboarding questionnaire at any time to configure your background, learning track, and English level.'
                  : 'Rehaz el cuestionario de perfil en cualquier momento para configurar tus metas, trasfondo y nivel de inglés.'}
              </p>
              <div className="flex flex-wrap items-center gap-2.5 pt-1">
                {onRedoOnboarding && (
                  <button
                    type="button"
                    onClick={onRedoOnboarding}
                    className="px-4 py-2 bg-[#865918] hover:bg-[#6e4813] text-white rounded-lg text-xs font-bold tracking-wide transition-all cursor-pointer flex items-center gap-1.5 active:scale-95 shadow-sm"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>{isEn ? 'Start Onboarding Questionnaire' : 'Iniciar Cuestionario de Perfil'}</span>
                  </button>
                )}
                {onLogout && (
                  <button
                    type="button"
                    onClick={onLogout}
                    className="px-4 py-2 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-lg text-xs font-bold tracking-wide transition-all cursor-pointer flex items-center gap-1.5 active:scale-95"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                    <span>{isEn ? 'Reset Session' : 'Reiniciar Sesión'}</span>
                  </button>
                )}
              </div>
            </div>
          );
        })()}

        {/* HEADER */}
        <div className="flex items-center justify-between pb-4 border-b border-black/10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-[#231d17] flex items-center justify-center text-amber-400 shadow-md">
              <Settings className="w-5 h-5 animate-spin-slow" />
            </div>
            <div>
              <h2 className="text-lg font-serif font-bold text-black">
                {isEn ? 'Application Settings' : 'Configuración de la Aplicación'}
              </h2>
              <p className="text-xs text-black/70">
                {isEn ? 'Customize voice output, subtitle modes, and learning targets.' : 'Personaliza la voz, subtítulos y metas de aprendizaje.'}
              </p>
            </div>
          </div>

          {saveSuccess && (
            <div className="flex items-center gap-1.5 px-3 py-1 bg-emerald-100 text-emerald-800 border border-emerald-300 rounded-full text-xs font-medium animate-fade-in">
              <Check className="w-3.5 h-3.5" />
              <span>{isEn ? 'Settings Saved!' : '¡Guardado!'}</span>
            </div>
          )}
        </div>

        {/* SECTION 1: INTERFACE LANGUAGE */}
        <div className="bg-white rounded-xl p-4 border border-[#e8ded0] shadow-sm space-y-3">
          <div className="flex items-center gap-2 text-[#865918]">
            <Globe className="w-4 h-4" />
            <h3 className="text-xs font-sans font-bold uppercase tracking-wider text-[#231d17]">
              {isEn ? 'Interface Language' : 'Idioma de la Interfaz'}
            </h3>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => setSelectedLang('EN')}
              className={`p-3 rounded-lg border text-left flex items-center justify-between transition-all cursor-pointer ${
                selectedLang === 'EN'
                  ? 'border-[#865918] bg-amber-50/50 ring-2 ring-amber-500/20'
                  : 'border-[#e8ded0] hover:border-amber-300 bg-neutral-50'
              }`}
            >
              <div>
                <div className="font-bold text-xs text-[#231d17]">English</div>
                <div className="text-[10px] text-neutral-500">English Interface</div>
              </div>
              {selectedLang === 'EN' && <Check className="w-4 h-4 text-[#865918]" />}
            </button>

            <button
              type="button"
              onClick={() => setSelectedLang('ES')}
              className={`p-3 rounded-lg border text-left flex items-center justify-between transition-all cursor-pointer ${
                selectedLang === 'ES'
                  ? 'border-[#865918] bg-amber-50/50 ring-2 ring-amber-500/20'
                  : 'border-[#e8ded0] hover:border-amber-300 bg-neutral-50'
              }`}
            >
              <div>
                <div className="font-bold text-xs text-[#231d17]">Español</div>
                <div className="text-[10px] text-neutral-500">Interfaz en Español</div>
              </div>
              {selectedLang === 'ES' && <Check className="w-4 h-4 text-[#865918]" />}
            </button>
          </div>
        </div>

        {/* SECTION 2: VOYAGER VOICE & AUDIO */}
        <div className="bg-white rounded-xl p-4 border border-[#e8ded0] shadow-sm space-y-4">
          <div className="flex items-center gap-2 text-[#865918]">
            <Volume2 className="w-4 h-4" />
            <h3 className="text-xs font-sans font-bold uppercase tracking-wider text-[#231d17]">
              {isEn ? 'VOYAGER Voice & Speech Settings' : 'Configuración de Voz y Audio de VOYAGER'}
            </h3>
          </div>

          <div className="space-y-3">
            {/* Voice Engine */}
            <div className="flex items-center justify-between p-3 bg-neutral-50 rounded-lg border border-[#e8ded0]">
              <div className="flex items-center gap-2.5">
                <Headphones className="w-4 h-4 text-[#865918]" />
                <div>
                  <div className="text-xs font-bold text-[#231d17]">
                    {isEn ? 'Voice Model' : 'Modelo de Voz'}
                  </div>
                  <div className="text-[10px] text-neutral-500">
                    {isEn ? 'Gemini Live Male Voice ("Puck")' : 'Voz Masculina Gemini Live ("Puck")'}
                  </div>
                </div>
              </div>
              <span className="px-2.5 py-1 bg-amber-100 text-[#865918] text-[10px] font-bold rounded-full border border-amber-300">
                Active / Activo
              </span>
            </div>

            {/* Voice Speed */}
            <div className="flex items-center justify-between p-3 bg-neutral-50 rounded-lg border border-[#e8ded0]">
              <div>
                <div className="text-xs font-bold text-[#231d17]">
                  {isEn ? 'Playback Speed' : 'Velocidad de Reproducción'}
                </div>
                <div className="text-[10px] text-neutral-500">
                  {isEn ? 'Pace of Voyager pronunciation' : 'Velocidad de pronunciación de Voyager'}
                </div>
              </div>
              <div className="flex bg-neutral-200/80 p-0.5 rounded-lg border border-neutral-300">
                {(['slow', 'normal', 'fast'] as const).map((spd) => (
                  <button
                    key={spd}
                    type="button"
                    onClick={() => setVoiceSpeed(spd)}
                    className={`px-2.5 py-1 rounded text-[10px] font-bold uppercase transition-all cursor-pointer ${
                      voiceSpeed === spd
                        ? 'bg-[#231d17] text-white shadow-sm'
                        : 'text-neutral-600 hover:text-black'
                    }`}
                  >
                    {spd === 'slow' ? (isEn ? 'Slow 0.8x' : 'Lento 0.8x') : spd === 'normal' ? '1.0x' : (isEn ? 'Fast 1.2x' : 'Rápido 1.2x')}
                  </button>
                ))}
              </div>
            </div>

            {/* Auto Play Audio */}
            <div className="flex items-center justify-between p-3 bg-neutral-50 rounded-lg border border-[#e8ded0]">
              <div>
                <div className="text-xs font-bold text-[#231d17]">
                  {isEn ? 'Auto-play Voyager Responses' : 'Reproducción Automática de Respuestas'}
                </div>
                <div className="text-[10px] text-neutral-500">
                  {isEn ? 'Automatically speak responses upon arrival' : 'Reproduce la voz automáticamente al recibir mensaje'}
                </div>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={autoPlayAudio}
                  onChange={(e) => setAutoPlayAudio(e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-9 h-5 bg-neutral-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-neutral-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-[#865918]"></div>
              </label>
            </div>

            {/* Listen Only Mode Toggle */}
            <div className="flex items-center justify-between p-3 bg-neutral-50 rounded-lg border border-[#e8ded0]">
              <div className="flex items-center gap-2">
                <Mic className="w-4 h-4 text-[#865918]" />
                <div>
                  <div className="text-xs font-bold text-[#231d17]">
                    {isEn ? 'Listen-Only Practice Mode' : 'Modo Solo Escuchar'}
                  </div>
                  <div className="text-[10px] text-neutral-500">
                    {isEn ? 'Mute microphone and interact strictly via text/audio clips' : 'Desactiva micrófono y practica respondiendo por texto'}
                  </div>
                </div>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={isListenOnly}
                  onChange={(e) => setIsListenOnly(e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-9 h-5 bg-neutral-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-neutral-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-[#865918]"></div>
              </label>
            </div>
          </div>
        </div>

        {/* SECTION 3: SUBTITLES & TRANSLATION MODES */}
        <div className="bg-white rounded-xl p-4 border border-[#e8ded0] shadow-sm space-y-4">
          <div className="flex items-center gap-2 text-[#865918]">
            <Subtitles className="w-4 h-4" />
            <h3 className="text-xs font-sans font-bold uppercase tracking-wider text-[#231d17]">
              {isEn ? 'Subtitles & Live Translation' : 'Subtítulos y Traducción en Vivo'}
            </h3>
          </div>

          <div className="space-y-3">
            {/* Subtitle Language Display */}
            <div>
              <label className="block text-[11px] font-bold text-neutral-700 mb-1.5">
                {isEn ? 'Live Captions Style' : 'Estilo de Subtítulos en Vivo'}
              </label>
              <div className="grid grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => handleSubtitleOptionChange('bilingual')}
                  className={`p-2.5 rounded-lg border text-center transition-all cursor-pointer ${
                    activeSubtitleMode === 'bilingual'
                      ? 'border-[#865918] bg-amber-50 text-[#231d17] font-bold shadow-xs'
                      : 'border-[#e8ded0] bg-neutral-50 text-neutral-600 hover:border-amber-300'
                  }`}
                >
                  <div className="text-xs">{isEn ? 'Bilingual' : 'Bilingüe'}</div>
                  <div className="text-[9px] text-neutral-500">EN + ES</div>
                </button>

                <button
                  type="button"
                  onClick={() => handleSubtitleOptionChange('english')}
                  className={`p-2.5 rounded-lg border text-center transition-all cursor-pointer ${
                    activeSubtitleMode === 'english'
                      ? 'border-[#865918] bg-amber-50 text-[#231d17] font-bold shadow-xs'
                      : 'border-[#e8ded0] bg-neutral-50 text-neutral-600 hover:border-amber-300'
                  }`}
                >
                  <div className="text-xs">English Only</div>
                  <div className="text-[9px] text-neutral-500">Immersion</div>
                </button>

                <button
                  type="button"
                  onClick={() => handleSubtitleOptionChange('spanish')}
                  className={`p-2.5 rounded-lg border text-center transition-all cursor-pointer ${
                    activeSubtitleMode === 'spanish'
                      ? 'border-[#865918] bg-amber-50 text-[#231d17] font-bold shadow-xs'
                      : 'border-[#e8ded0] bg-neutral-50 text-neutral-600 hover:border-amber-300'
                  }`}
                >
                  <div className="text-xs">Solo Español</div>
                  <div className="text-[9px] text-neutral-500">Traducción</div>
                </button>
              </div>
            </div>

            {/* Translation helper */}
            <div className="flex items-center justify-between p-3 bg-neutral-50 rounded-lg border border-[#e8ded0]">
              <div>
                <div className="text-xs font-bold text-[#231d17]">
                  {isEn ? 'Instant Spanish Translation' : 'Traducción Instantánea al Español'}
                </div>
                <div className="text-[10px] text-neutral-500">
                  {isEn ? 'Show instant Spanish translations under Voyager phrases' : 'Muestra traducción bajo cada frase en inglés de Voyager'}
                </div>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={isTranslateMode}
                  onChange={(e) => setIsTranslateMode(e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-9 h-5 bg-neutral-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-neutral-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-[#865918]"></div>
              </label>
            </div>
          </div>
        </div>

        {/* SECTION 4: LEARNING & FEEDBACK GOALS */}
        <div className="bg-white rounded-xl p-4 border border-[#e8ded0] shadow-sm space-y-4">
          <div className="flex items-center gap-2 text-[#865918]">
            <Sparkles className="w-4 h-4" />
            <h3 className="text-xs font-sans font-bold uppercase tracking-wider text-[#231d17]">
              {isEn ? 'Feedback & Learning Goals' : 'Meta de Aprendizaje y Correcciones'}
            </h3>
          </div>

          <div className="space-y-3">
            {/* Feedback Detail Level */}
            <div>
              <label className="block text-[11px] font-bold text-neutral-700 mb-1">
                {isEn ? 'Pronunciation & Grammar Feedback' : 'Nivel de Corrección Gramatical y Pronunciación'}
              </label>
              <select
                value={feedbackLevel}
                onChange={(e) => setFeedbackLevel(e.target.value as any)}
                className="w-full p-2 bg-neutral-50 border border-[#e8ded0] rounded-lg text-xs font-medium text-[#231d17] focus:outline-none focus:border-[#865918]"
              >
                <option value="detailed">
                  {isEn ? 'Detailed (Correct every mistake & suggest idioms)' : 'Detallado (Corregir cada detalle y sugerir modismos)'}
                </option>
                <option value="standard">
                  {isEn ? 'Standard (Correct key mistakes & maintain conversation flow)' : 'Estándar (Corregir errores clave sin cortar fluidez)'}
                </option>
                <option value="minimal">
                  {isEn ? 'Minimal (Encouragement focus, smooth flow)' : 'Mínimo (Enfocado en fluidez y confianza)'}
                </option>
              </select>
            </div>

            {/* Daily Goal Minutes */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-[11px] font-bold text-neutral-700">
                  {isEn ? 'Daily Practice Goal' : 'Meta Diaria de Práctica'}
                </label>
                <span className="text-xs font-bold text-[#865918]">
                  {dailyGoalMinutes} {isEn ? 'min/day' : 'min/día'}
                </span>
              </div>
              <input
                type="range"
                min="5"
                max="60"
                step="5"
                value={dailyGoalMinutes}
                onChange={(e) => setDailyGoalMinutes(Number(e.target.value))}
                className="w-full accent-[#865918] cursor-pointer"
              />
              <div className="flex justify-between text-[9px] text-neutral-400 font-mono mt-0.5">
                <span>5 min</span>
                <span>30 min</span>
                <span>60 min</span>
              </div>
            </div>
          </div>
        </div>

        {/* FOOTER ACTIONS */}
        <div className="pt-2 flex items-center justify-between">
          <div className="flex items-center gap-1.5 text-[10px] text-neutral-500">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
            <span>{isEn ? 'All preferences saved locally' : 'Preferencias guardadas localmente'}</span>
          </div>

          <button
            type="button"
            onClick={handleSave}
            className="px-6 py-2 bg-[#231d17] hover:bg-black text-amber-400 border border-amber-500/30 rounded-xl text-xs font-bold tracking-wider uppercase cursor-pointer shadow-md transition-all active:scale-95 flex items-center gap-2"
          >
            <Check className="w-4 h-4" />
            <span>{isEn ? 'Save Preferences' : 'Guardar Preferencias'}</span>
          </button>
        </div>

      </div>
    </div>
  );
};
