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
  Award
} from 'lucide-react';

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
                    <div className="w-10 h-10 rounded-full bg-neutral-100 flex items-center justify-center text-zinc-700 flex-shrink-0">
                      <User className="w-5 h-5" />
                    </div>
                    <div>
                      <div style={{ fontFamily: "'Lato', sans-serif" }} className="text-[14px] font-black uppercase text-[#231d17] tracking-wide">
                        {userAccount.name}
                      </div>
                      <div className="text-[10px] text-zinc-500 uppercase font-medium">
                        {isEn ? 'LEARNER' : 'ESTUDIANTE'}
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
                        {userAccount.country}
                      </span>
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
