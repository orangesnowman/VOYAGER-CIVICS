import React from 'react';
import { Award, BookOpen, Star, RefreshCw, BarChart2, AlertCircle, Mail, MapPin, Target, Edit3, UserCheck } from 'lucide-react';

interface ProgressDashboardProps {
  selectedLang: 'EN' | 'ES';
  scores: {
    grammar: number;
    pronunciation: number;
    confidence: number;
    naturalness: number;
  };
  learnedWords: string[];
  accentPatterns: string[];
  onAskVoyager: (text: string) => void;
  userProfile?: {
    name?: string;
    email?: string;
    age?: string | number;
    country?: string;
    goal?: string;
    level?: string;
  };
  onEditProfile?: () => void;
}

export const ProgressDashboard: React.FC<ProgressDashboardProps> = ({
  selectedLang,
  scores,
  learnedWords,
  accentPatterns,
  onAskVoyager,
  userProfile,
  onEditProfile
}) => {
  // Retrieve saved account if not provided via props
  const savedAccount = React.useMemo(() => {
    if (userProfile?.name || userProfile?.email) {
      return {
        name: userProfile.name || (selectedLang === 'EN' ? 'Learner' : 'Estudiante'),
        email: userProfile.email || 'learner@usavoyager.com',
        age: userProfile.age || '',
        country: userProfile.country || (selectedLang === 'EN' ? 'Not specified' : 'No especificado'),
        goal: userProfile.goal || (selectedLang === 'EN' ? 'Travel & Conversation' : 'Viaje y Conversación'),
        levelEstimate: userProfile.level || 'Intermediate'
      };
    }
    const saved = typeof window !== 'undefined' ? localStorage.getItem('voyager_user_account') : null;
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        return {
          name: parsed.name || (selectedLang === 'EN' ? 'Learner' : 'Estudiante'),
          email: parsed.email || 'learner@usavoyager.com',
          age: parsed.age || '',
          country: parsed.country || (selectedLang === 'EN' ? 'Not specified' : 'No especificado'),
          goal: parsed.goal || (selectedLang === 'EN' ? 'Travel & Conversation' : 'Viaje y Conversación'),
          levelEstimate: parsed.levelEstimate || 'Intermediate'
        };
      } catch (e) {}
    }
    return {
      name: selectedLang === 'EN' ? 'Learner' : 'Estudiante',
      email: 'learner@usavoyager.com',
      age: '',
      country: selectedLang === 'EN' ? 'Not specified' : 'No especificado',
      goal: selectedLang === 'EN' ? 'Travel & Conversation' : 'Viaje y Conversación',
      levelEstimate: 'Intermediate'
    };
  }, [userProfile, selectedLang]);

  const visitorFullName = React.useMemo(() => {
    if (savedAccount.name && savedAccount.name !== 'Estudiante' && savedAccount.name !== 'Learner') {
      const name = savedAccount.name.trim();
      if (name && name !== 'Estudiante' && name !== 'Learner') return name;
    }
    return '';
  }, [savedAccount.name]);

  const scoreMetrics = [
    { key: 'grammar', name: selectedLang === 'EN' ? 'Grammar' : 'Gramática', val: scores.grammar },
    { key: 'pronunciation', name: selectedLang === 'EN' ? 'Pronunciation' : 'Pronunciación', val: scores.pronunciation },
    { key: 'confidence', name: selectedLang === 'EN' ? 'Confidence' : 'Confianza', val: scores.confidence },
    { key: 'naturalness', name: selectedLang === 'EN' ? 'Naturalness' : 'Naturalidad', val: scores.naturalness }
  ];

  const getMetricRatingStars = (rating: number) => {
    return (
      <div className="flex gap-0.5 text-yellow-500">
        {[1, 2, 3, 4, 5].map((s) => (
          <Star 
            key={s} 
            className={`w-3.5 h-3.5 ${s <= rating ? 'fill-yellow-500 text-yellow-500' : 'text-neutral-600'}`} 
          />
        ))}
      </div>
    );
  };

  return (
    <div className="w-full h-full flex flex-col bg-black/85 border border-white/10 rounded-2xl p-4 font-sans text-white overflow-hidden max-h-[500px]">
      
      {/* Title Header */}
      <div className="flex justify-between items-center border-b border-white/10 pb-2.5 mb-3">
        <span className="text-[10px] font-mono font-bold tracking-widest text-yellow-400 uppercase flex items-center gap-1">
          <UserCheck className="w-3.5 h-3.5 text-yellow-500" />
          {visitorFullName 
            ? (selectedLang === 'EN' ? `${visitorFullName.toUpperCase()}'S PROFILE & PROGRESS` : `PERFIL DE ${visitorFullName.toUpperCase()} Y PROGRESO`) 
            : (selectedLang === 'EN' ? 'USER PROFILE & PROGRESS' : 'PERFIL DE USUARIO Y PROGRESO')}
        </span>
        <span className="text-[9px] font-mono text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20 flex items-center gap-1">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
          {selectedLang === 'EN' ? 'LIVE DATA' : 'DATOS EN VIVO'}
        </span>
      </div>

      {/* Main Container */}
      <div className="flex-1 overflow-y-auto pr-1 space-y-4 max-h-[420px]">
        
        {/* Dynamic User Contact Profile Card */}
        <div className="bg-gradient-to-r from-red-950/60 via-zinc-900 to-black/80 border border-red-500/30 rounded-xl p-3.5 space-y-3 relative overflow-hidden shadow-md">
          <div className="flex items-center justify-between border-b border-white/10 pb-2">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-full bg-red-600 text-white flex items-center justify-center font-bold text-sm uppercase shadow-sm border border-white/20">
                {savedAccount.name ? savedAccount.name.charAt(0) : 'U'}
              </div>
              <div>
                <div className="text-xs font-black tracking-wide text-white uppercase flex items-center gap-2 font-sans">
                  <span>{savedAccount.name}</span>
                  <span className="inline-flex items-center px-1.5 py-0.5 rounded-full text-[8px] font-mono bg-red-500/20 text-red-300 border border-red-500/30">
                    {savedAccount.levelEstimate}
                  </span>
                </div>
                <div className="text-[10px] text-zinc-300 font-mono flex items-center gap-2 mt-0.5">
                  {savedAccount.email && (
                    <span className="flex items-center gap-1">
                      <Mail className="w-2.5 h-2.5 text-red-400" />
                      {savedAccount.email}
                    </span>
                  )}
                </div>
              </div>
            </div>
            {onEditProfile && (
              <button 
                onClick={onEditProfile}
                className="px-2.5 py-1 rounded-lg bg-white/10 hover:bg-white/20 text-white border border-white/20 text-[9px] font-mono font-bold uppercase transition-all flex items-center gap-1 cursor-pointer active:scale-95"
                title={selectedLang === 'EN' ? 'Edit Profile & Contact' : 'Editar Perfil y Contacto'}
              >
                <Edit3 className="w-2.5 h-2.5 text-red-400" />
                <span>{selectedLang === 'EN' ? 'Edit' : 'Editar'}</span>
              </button>
            )}
          </div>

          <div className="grid grid-cols-2 gap-2 text-[10px] font-sans">
            <div className="bg-black/50 p-2 rounded-lg border border-white/10 flex flex-col justify-center">
              <span className="text-[8.5px] font-mono uppercase text-zinc-400 flex items-center gap-1">
                <Target className="w-2.5 h-2.5 text-yellow-400" />
                {selectedLang === 'EN' ? 'Learning Goal' : 'Objetivo Principal'}
              </span>
              <span className="font-bold text-white truncate mt-0.5 text-[10.5px]">
                {savedAccount.goal}
              </span>
            </div>

            <div className="bg-black/50 p-2 rounded-lg border border-white/10 flex flex-col justify-center">
              <span className="text-[8.5px] font-mono uppercase text-zinc-400 flex items-center gap-1">
                <MapPin className="w-2.5 h-2.5 text-red-400" />
                {selectedLang === 'EN' ? 'Country & Age' : 'País y Edad'}
              </span>
              <span className="font-bold text-white truncate mt-0.5 text-[10.5px]">
                {savedAccount.country} {savedAccount.age ? `(${savedAccount.age} ${selectedLang === 'EN' ? 'yrs' : 'años'})` : ''}
              </span>
            </div>
          </div>
        </div>

        {/* Scores Meter Section */}
        <div className="bg-white/5 border border-white/10 rounded-xl p-3 space-y-2">
          <span className="block text-[9px] font-mono font-bold tracking-widest text-neutral-400 uppercase">
            🏆 {selectedLang === 'EN' ? 'CONFIDENCE SCORES' : 'PUNTUACIONES DE CONFIANZA'}
          </span>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1">
            {(() => {
              const radius = 28;
              const strokeWidth = 8;
              const circumference = 2 * Math.PI * radius; // ~175.9

              const getPct = (val?: number, fallback: number = 85) => {
                if (val === undefined || val === null || val <= 0) return fallback;
                if (val <= 5) return Math.min(100, Math.round(val * 20));
                return Math.min(100, Math.round(val));
              };

              const items = [
                {
                  title: selectedLang === 'EN' ? 'Pronunciation' : 'Pronunciación',
                  pct: getPct(scores.pronunciation, 94),
                  sub: selectedLang === 'EN' ? '30-day accuracy' : 'Precisión 30d'
                },
                {
                  title: selectedLang === 'EN' ? 'Fluency' : 'Fluidez',
                  pct: getPct(scores.naturalness, 87),
                  sub: selectedLang === 'EN' ? 'Natural flow' : 'Flujo natural'
                },
                {
                  title: selectedLang === 'EN' ? 'Vocabulary' : 'Vocabulario',
                  pct: getPct(scores.grammar, 76),
                  sub: selectedLang === 'EN' ? 'Words retained' : 'Palabras retenidas'
                },
                {
                  title: selectedLang === 'EN' ? 'Confidence' : 'Confianza',
                  pct: getPct(scores.confidence, 91),
                  sub: selectedLang === 'EN' ? 'More security' : 'Más seguridad'
                }
              ];

              return items.map((item, idx) => {
                const strokeDashoffset = circumference - (item.pct / 100) * circumference;

                return (
                  <div key={idx} className="flex flex-col items-center text-center bg-black/30 p-2 rounded-lg border border-white/5">
                    <div className="relative w-16 h-16 flex items-center justify-center my-0.5">
                      <svg viewBox="0 0 80 80" className="w-full h-full -rotate-90 transform">
                        <circle
                          cx="40"
                          cy="40"
                          r={radius}
                          fill="transparent"
                          stroke="#333333"
                          strokeWidth={strokeWidth}
                        />
                        <circle
                          cx="40"
                          cy="40"
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
                      <span className="absolute inset-0 flex items-center justify-center text-xs font-mono font-black text-white">
                        {item.pct}%
                      </span>
                    </div>
                    <span className="text-[10px] font-bold text-neutral-200 mt-1 font-mono">{item.title}</span>
                    <span className="text-[8px] text-neutral-400 font-mono">{item.sub}</span>
                  </div>
                );
              });
            })()}
          </div>
        </div>

        {/* Vocabulary Memory Section */}
        <div className="space-y-2">
          <span className="block text-[9px] font-mono font-bold tracking-widest text-neutral-400 uppercase flex items-center justify-between">
            <span>{selectedLang === 'EN' ? 'VOCABULARY MEMORY' : 'MEMORIA DE VOCABULARIO'}</span>
            <span className="text-[8px] text-yellow-500 font-bold">{learnedWords.length} {selectedLang === 'EN' ? 'words' : 'palabras'}</span>
          </span>
          
          {learnedWords.length === 0 ? (
            <div className="bg-white/5 border border-white/5 rounded-xl p-3 text-center text-xs text-neutral-400 italic">
              {selectedLang === 'EN' ? 'No words captured yet. Speak with VOYAGER to build memory.' : 'Aún no hay palabras. Habla con VOYAGER para guardarlas.'}
            </div>
          ) : (
            <div className="flex flex-wrap gap-1.5 p-1 bg-black/25 rounded-xl border border-white/5">
              {learnedWords.map((word, i) => (
                <span 
                  key={i}
                  onClick={() => onAskVoyager(selectedLang === 'EN' ? `Remind me, what does the vocabulary word "${word}" mean?` : `Recuérdame, ¿qué significa la palabra de vocabulario "${word}"?`)}
                  className="px-2 py-0.5 bg-yellow-500/10 border border-yellow-500/25 hover:border-yellow-400/50 hover:bg-yellow-500/20 text-yellow-400 text-[10px] font-mono font-bold rounded-lg cursor-pointer transition-all"
                >
                  {word}
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Accent Reduction / Coach Section */}
        <div className="space-y-2">
          <span className="block text-[9px] font-mono font-bold tracking-widest text-neutral-400 uppercase">
            🎙️ {selectedLang === 'EN' ? 'ACCENT REDUCTION PATTERNS' : 'PATRONES DE REDUCCIÓN DE ACENTO'}
          </span>

          {accentPatterns.length === 0 ? (
            <div className="bg-white/5 border border-white/5 rounded-xl p-3 text-center text-xs text-neutral-400 italic">
              {selectedLang === 'EN' ? 'No pronunciation warnings flagged yet.' : 'Aún no se han detectado advertencias de pronunciación.'}
            </div>
          ) : (
            <div className="grid gap-2">
              {accentPatterns.map((pattern, i) => (
                <div 
                  key={i}
                  onClick={() => onAskVoyager(selectedLang === 'EN' ? `Let's practice the accent reduction exercise for: "${pattern}".` : `Practiquemos el ejercicio de reducción de acento para: "${pattern}".`)}
                  className="bg-red-500/5 border border-red-500/10 hover:border-red-500/35 p-2.5 rounded-xl transition-all cursor-pointer flex items-start gap-2.5 leading-normal group"
                >
                  <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0 mt-0.5 group-hover:scale-105 transition-all" />
                  <div className="flex-1 flex flex-col gap-0.5">
                    <span className="text-[11px] font-bold text-neutral-200 group-hover:text-white transition-colors">{pattern}</span>
                    <span className="text-[8px] font-mono text-neutral-500 uppercase tracking-wider group-hover:text-neutral-400 transition-colors">
                      {selectedLang === 'EN' ? 'Click to trigger coach practice' : 'Toca para iniciar práctica de acento'}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

      </div>
    </div>
  );
};

