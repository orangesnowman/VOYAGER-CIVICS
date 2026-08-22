import React, { useState } from 'react';
import { Award, Trophy, Star, Zap, Flame, BookOpen, Target, Sparkles, CheckCircle2, Lock, ChevronRight, ArrowRight } from 'lucide-react';

export interface Badge {
  id: string;
  titleEN: string;
  titleES: string;
  descriptionEN: string;
  descriptionES: string;
  category: 'streak' | 'vocabulary' | 'speaking' | 'curriculum';
  iconName: string;
  unlocked: boolean;
  progress: number; // 0 to 100
  targetLabelEN: string;
  targetLabelES: string;
  unlockedAt?: string;
  color: string;
}

interface AchievementsProps {
  selectedLang: 'EN' | 'ES';
  streakCount?: number;
  learnedWordsCount?: number;
  completedLessonsCount?: number;
  completedDays?: number[];
  scores?: { grammar: number; pronunciation: number; naturalness: number; vocabulary: number };
  onAskVoyager?: (prompt: string) => void;
}

export const Achievements: React.FC<AchievementsProps> = ({
  selectedLang,
  streakCount = 7,
  learnedWordsCount = 95,
  completedLessonsCount = 12,
  completedDays = [1, 2, 3, 4, 5, 6, 7],
  scores = { grammar: 82, pronunciation: 78, naturalness: 88, vocabulary: 85 },
  onAskVoyager
}) => {
  const [selectedBadge, setSelectedBadge] = useState<Badge | null>(null);
  const [filterCategory, setFilterCategory] = useState<'all' | 'unlocked' | 'in_progress'>('all');

  // Subtle synthesized audio effect using Web Audio API for offline/instant feedback
  const playAchievementSound = (isUnlocked: boolean = true) => {
    try {
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioContextClass) return;
      const ctx = new AudioContextClass();

      if (isUnlocked) {
        // Bright 4-note ascending triumph chime: C5 (523Hz), E5 (659Hz), G5 (784Hz), C6 (1046Hz)
        const notes = [
          { freq: 523.25, time: 0, duration: 0.15 },
          { freq: 659.25, time: 0.10, duration: 0.18 },
          { freq: 784.00, time: 0.20, duration: 0.22 },
          { freq: 1046.50, time: 0.32, duration: 0.45 }
        ];
        notes.forEach(({ freq, time, duration }) => {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.type = 'sine';
          osc.frequency.setValueAtTime(freq, ctx.currentTime + time);

          gain.gain.setValueAtTime(0.001, ctx.currentTime + time);
          gain.gain.exponentialRampToValueAtTime(0.18, ctx.currentTime + time + 0.02);
          gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + time + duration);

          osc.connect(gain);
          gain.connect(ctx.destination);
          osc.start(ctx.currentTime + time);
          osc.stop(ctx.currentTime + time + duration);
        });
      } else {
        // Soft focus chime for locked badges
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(440, ctx.currentTime);
        gain.gain.setValueAtTime(0.08, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.12);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(ctx.currentTime);
        osc.stop(ctx.currentTime + 0.12);
      }
    } catch (e) {
      console.warn('AudioContext sound effect not enabled:', e);
    }
  };

  const badges: Badge[] = [
    {
      id: 'first_steps',
      titleEN: 'First Steps',
      titleES: 'Primeros Pasos',
      descriptionEN: 'Completed your very first interactive English practice session with VOYAGER.',
      descriptionES: 'Completaste tu primera sesión interactiva de práctica de inglés con VOYAGER.',
      category: 'speaking',
      iconName: 'star',
      unlocked: true,
      progress: 100,
      targetLabelEN: '1 session completed',
      targetLabelES: '1 sesión completada',
      unlockedAt: 'Day 1',
      color: 'from-amber-500 to-yellow-400'
    },
    {
      id: 'streak_7',
      titleEN: '7-Day Voyager',
      titleES: 'Racha de 7 Días',
      descriptionEN: 'Maintained a consistent 7-day English learning streak.',
      descriptionES: 'Mantuviste una racha constante de aprendizaje de inglés durante 7 días.',
      category: 'streak',
      iconName: 'flame',
      unlocked: streakCount >= 7,
      progress: Math.min(100, Math.round((streakCount / 7) * 100)),
      targetLabelEN: `${streakCount}/7 days active`,
      targetLabelES: `${streakCount}/7 días activos`,
      unlockedAt: streakCount >= 7 ? 'This week' : undefined,
      color: 'from-red-500 to-orange-500'
    },
    {
      id: 'vocab_50',
      titleEN: 'Vocab Builder',
      titleES: 'Maestro del Vocabulario',
      descriptionEN: 'Mastered over 50 real-world English words and idioms.',
      descriptionES: 'Dominaste más de 50 palabras y modismos en inglés del mundo real.',
      category: 'vocabulary',
      iconName: 'book',
      unlocked: learnedWordsCount >= 50,
      progress: Math.min(100, Math.round((learnedWordsCount / 50) * 100)),
      targetLabelEN: `${learnedWordsCount}/50 words learned`,
      targetLabelES: `${learnedWordsCount}/50 palabras aprendidas`,
      unlockedAt: 'Recently',
      color: 'from-sky-500 to-blue-600'
    },
    {
      id: 'phonetics_pro',
      titleEN: 'NYC Accent Pioneer',
      titleES: 'Pionero de Fonética NYC',
      descriptionEN: 'Practiced classic NYC pronunciation and vowel softening.',
      descriptionES: 'Practicaste la pronunciación clásica de Nueva York y la suavización de vocales.',
      category: 'speaking',
      iconName: 'sparkles',
      unlocked: true,
      progress: 100,
      targetLabelEN: 'Mastered NYC Vowels',
      targetLabelES: 'Dominio de Vocales NYC',
      unlockedAt: 'Yesterday',
      color: 'from-purple-500 to-indigo-600'
    },
    {
      id: 'nyc_subway',
      titleEN: 'Subway & City Navigator',
      titleES: 'Navegante de la Ciudad',
      descriptionEN: 'Successfully ordered food and asked for NYC directions in English.',
      descriptionES: 'Pediste comida y pediste direcciones en inglés con éxito en Nueva York.',
      category: 'curriculum',
      iconName: 'trophy',
      unlocked: completedLessonsCount >= 5,
      progress: Math.min(100, Math.round((completedLessonsCount / 5) * 100)),
      targetLabelEN: 'Scenario completed',
      targetLabelES: 'Escenario completado',
      unlockedAt: '3 days ago',
      color: 'from-emerald-500 to-teal-600'
    },
    {
      id: 'fluency_80',
      titleEN: 'Fluency Champion',
      titleES: 'Campeón de Fluidez',
      descriptionEN: 'Achieved an overall naturalness score above 80%.',
      descriptionES: 'Lograste una puntuación general de naturalidad superior al 80%.',
      category: 'speaking',
      iconName: 'zap',
      unlocked: (scores.naturalness || 0) >= 80,
      progress: Math.min(100, scores.naturalness || 75),
      targetLabelEN: `${scores.naturalness || 75}% / 80% Fluency`,
      targetLabelES: `${scores.naturalness || 75}% / 80% Fluidez`,
      unlockedAt: (scores.naturalness || 0) >= 80 ? 'Active' : undefined,
      color: 'from-rose-500 to-pink-600'
    },
    {
      id: 'streak_30',
      titleEN: '30-Day Master',
      titleES: 'Maestro de 30 Días',
      descriptionEN: 'Complete 30 consecutive daily practice sessions with VOYAGER.',
      descriptionES: 'Completa 30 sesiones diarias consecutivas de práctica con VOYAGER.',
      category: 'streak',
      iconName: 'flame',
      unlocked: streakCount >= 30,
      progress: Math.min(100, Math.round((streakCount / 30) * 100)),
      targetLabelEN: `${streakCount}/30 days`,
      targetLabelES: `${streakCount}/30 días`,
      color: 'from-amber-600 to-red-600'
    },
    {
      id: 'curriculum_100',
      titleEN: 'USA Voyager Scholar',
      titleES: 'Becario USA Voyager',
      descriptionEN: 'Complete all 24 immersive immersion roadmap modules.',
      descriptionES: 'Completa los 24 módulos del mapa de inmersión total.',
      category: 'curriculum',
      iconName: 'award',
      unlocked: completedLessonsCount >= 24,
      progress: Math.min(100, Math.round((completedLessonsCount / 24) * 100)),
      targetLabelEN: `${completedLessonsCount}/24 modules`,
      targetLabelES: `${completedLessonsCount}/24 módulos`,
      color: 'from-violet-600 to-fuchsia-600'
    }
  ];

  const unlockedCount = badges.filter(b => b.unlocked).length;

  const filteredBadges = badges.filter(badge => {
    if (filterCategory === 'unlocked') return badge.unlocked;
    if (filterCategory === 'in_progress') return !badge.unlocked;
    return true;
  });

  const renderBadgeIcon = (iconName: string, className: string = "w-6 h-6") => {
    switch (iconName) {
      case 'flame': return <Flame className={className} />;
      case 'star': return <Star className={className} />;
      case 'book': return <BookOpen className={className} />;
      case 'sparkles': return <Sparkles className={className} />;
      case 'trophy': return <Trophy className={className} />;
      case 'zap': return <Zap className={className} />;
      default: return <Award className={className} />;
    }
  };

  return (
    <div className="space-y-4 animate-fade-in text-left">
      {/* HEADER METRICS SUMMARY BANNER */}
      <div className="bg-gradient-to-r from-[#1e293b] via-[#0f172a] to-[#1e1b4b] text-white p-4 sm:p-5 rounded-2xl shadow-xl border border-slate-700/60 relative overflow-hidden">
        {/* Background Decorative Glow */}
        <div className="absolute -top-10 -right-10 w-40 h-40 bg-red-600/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-10 -left-10 w-40 h-40 bg-amber-500/20 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <Trophy className="w-5 h-5 text-amber-400 animate-bounce" />
              <h3 style={{ fontFamily: '"American Typewriter", "Courier New", Courier, serif' }} className="text-lg font-bold text-white font-serif tracking-wide">
                {selectedLang === 'EN' ? 'Learning Achievements & Milestones' : 'Logros y Hitos de Aprendizaje'}
              </h3>
            </div>
            <p className="text-xs text-slate-300 max-w-md leading-relaxed">
              {selectedLang === 'EN'
                ? 'Earn official USA Voyager badges as you practice speaking, expand vocabulary, and build fluency habits.'
                : 'Gana insignias oficiales de USA Voyager a medida que practicas, amplías tu vocabulario y desarrollas fluidez.'}
            </p>
          </div>

          <div className="flex items-center gap-2.5 bg-white/10 backdrop-blur-md px-3.5 py-2 rounded-xl border border-white/10 flex-shrink-0 self-start sm:self-center">
            <Award className="w-7 h-7 text-amber-400" />
            <div>
              <div className="text-[10px] font-bold text-slate-300 uppercase tracking-wider">
                {selectedLang === 'EN' ? 'Badges Unlocked' : 'Insignias Ganadas'}
              </div>
              <div className="text-base font-extrabold text-white font-mono">
                {unlockedCount} <span className="text-xs text-slate-400 font-normal">/ {badges.length}</span>
              </div>
            </div>
          </div>
        </div>

        {/* METRICS PROGRESS BAR */}
        <div className="mt-4 pt-3 border-t border-slate-700/80 grid grid-cols-2 sm:grid-cols-4 gap-2 text-center text-xs">
          <div className="bg-slate-800/60 p-2 rounded-lg border border-slate-700/50">
            <span className="text-[10px] text-slate-400 block uppercase font-bold">{selectedLang === 'EN' ? 'Streak' : 'Racha'}</span>
            <span className="font-extrabold text-amber-400 text-sm font-mono flex items-center justify-center gap-1">
              <Flame className="w-3.5 h-3.5 fill-amber-400 text-amber-400" /> {streakCount} {selectedLang === 'EN' ? 'Days' : 'Días'}
            </span>
          </div>
          <div className="bg-slate-800/60 p-2 rounded-lg border border-slate-700/50">
            <span className="text-[10px] text-slate-400 block uppercase font-bold">{selectedLang === 'EN' ? 'Words' : 'Palabras'}</span>
            <span className="font-extrabold text-sky-400 text-sm font-mono flex items-center justify-center gap-1">
              <BookOpen className="w-3.5 h-3.5" /> {learnedWordsCount}
            </span>
          </div>
          <div className="bg-slate-800/60 p-2 rounded-lg border border-slate-700/50">
            <span className="text-[10px] text-slate-400 block uppercase font-bold">{selectedLang === 'EN' ? 'Modules' : 'Módulos'}</span>
            <span className="font-extrabold text-emerald-400 text-sm font-mono flex items-center justify-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5" /> {completedLessonsCount}/24
            </span>
          </div>
          <div className="bg-slate-800/60 p-2 rounded-lg border border-slate-700/50">
            <span className="text-[10px] text-slate-400 block uppercase font-bold">{selectedLang === 'EN' ? 'Fluency' : 'Fluidez'}</span>
            <span className="font-extrabold text-rose-400 text-sm font-mono flex items-center justify-center gap-1">
              <Zap className="w-3.5 h-3.5" /> {scores.naturalness || 88}%
            </span>
          </div>
        </div>
      </div>

      {/* FILTER TABS */}
      <div className="flex items-center justify-between gap-2 pt-1 flex-wrap">
        <div className="flex items-center gap-1.5 bg-neutral-200/60 p-1 rounded-xl">
          <button
            onClick={() => setFilterCategory('all')}
            className={`px-3 py-1 rounded-lg text-[11px] font-extrabold uppercase tracking-wider transition-all cursor-pointer ${
              filterCategory === 'all'
                ? 'bg-white text-neutral-900 shadow-sm'
                : 'text-neutral-600 hover:text-black'
            }`}
          >
            {selectedLang === 'EN' ? 'All Badges' : 'Todas'} ({badges.length})
          </button>
          <button
            onClick={() => setFilterCategory('unlocked')}
            className={`px-3 py-1 rounded-lg text-[11px] font-extrabold uppercase tracking-wider transition-all cursor-pointer ${
              filterCategory === 'unlocked'
                ? 'bg-white text-neutral-900 shadow-sm'
                : 'text-neutral-600 hover:text-black'
            }`}
          >
            {selectedLang === 'EN' ? 'Earned' : 'Ganadas'} ({unlockedCount})
          </button>
          <button
            onClick={() => setFilterCategory('in_progress')}
            className={`px-3 py-1 rounded-lg text-[11px] font-extrabold uppercase tracking-wider transition-all cursor-pointer ${
              filterCategory === 'in_progress'
                ? 'bg-white text-neutral-900 shadow-sm'
                : 'text-neutral-600 hover:text-black'
            }`}
          >
            {selectedLang === 'EN' ? 'In Progress' : 'En Progreso'} ({badges.length - unlockedCount})
          </button>
        </div>
      </div>

      {/* BADGES GRID */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 pt-1">
        {filteredBadges.map((badge) => {
          const title = selectedLang === 'EN' ? badge.titleEN : badge.titleES;
          const description = selectedLang === 'EN' ? badge.descriptionEN : badge.descriptionES;
          const targetLabel = selectedLang === 'EN' ? badge.targetLabelEN : badge.targetLabelES;

          return (
            <div
              key={badge.id}
              onClick={() => {
                playAchievementSound(badge.unlocked);
                setSelectedBadge(badge);
              }}
              className={`p-4 rounded-2xl border transition-all cursor-pointer relative overflow-hidden flex flex-col justify-between group ${
                badge.unlocked
                  ? 'bg-white border-neutral-200/80 hover:border-amber-400 hover:shadow-md'
                  : 'bg-neutral-100/70 border-neutral-200 opacity-80 hover:opacity-100'
              }`}
            >
              <div className="flex items-start gap-3.5">
                {/* Badge Icon Badge Box */}
                <div
                  className={`w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0 shadow-md text-white bg-gradient-to-br ${badge.color} ${
                    !badge.unlocked ? 'grayscale opacity-60' : 'group-hover:scale-110 transition-transform duration-300'
                  }`}
                >
                  {renderBadgeIcon(badge.iconName, "w-6 h-6")}
                </div>

                <div className="space-y-1 min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-1">
                    <h4 className="text-xs font-bold text-neutral-900 truncate font-serif">
                      {title}
                    </h4>
                    {badge.unlocked ? (
                      <span className="bg-amber-100 text-amber-800 text-[9px] font-black px-2 py-0.5 rounded-full uppercase flex items-center gap-0.5">
                        <CheckCircle2 className="w-2.5 h-2.5 text-amber-600" />
                        {selectedLang === 'EN' ? 'Unlocked' : 'Desbloqueado'}
                      </span>
                    ) : (
                      <span className="bg-neutral-200 text-neutral-600 text-[9px] font-extrabold px-2 py-0.5 rounded-full uppercase flex items-center gap-0.5">
                        <Lock className="w-2.5 h-2.5" />
                        {selectedLang === 'EN' ? 'Locked' : 'Bloqueado'}
                      </span>
                    )}
                  </div>

                  <p className="text-[10.5px] text-neutral-600 line-clamp-2 leading-relaxed">
                    {description}
                  </p>
                </div>
              </div>

              {/* Progress Bar & Footer */}
              <div className="mt-3.5 pt-2.5 border-t border-neutral-100 space-y-1">
                <div className="flex items-center justify-between text-[10px] font-bold text-neutral-500">
                  <span>{targetLabel}</span>
                  <span className="font-mono font-black text-neutral-700">{badge.progress}%</span>
                </div>
                <div className="w-full bg-neutral-200 rounded-full h-1.5 overflow-hidden">
                  <div
                    className={`h-full transition-all duration-500 rounded-full bg-gradient-to-r ${badge.color}`}
                    style={{ width: `${badge.progress}%` }}
                  />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* DETAIL MODAL FOR SELECTED BADGE */}
      {selectedBadge && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs z-50 flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-white rounded-3xl border-4 border-amber-400 p-6 max-w-sm w-full space-y-4 shadow-2xl relative text-left">
            <button
              onClick={() => setSelectedBadge(null)}
              className="absolute top-4 right-4 text-neutral-400 hover:text-black font-bold text-lg w-8 h-8 flex items-center justify-center rounded-full bg-neutral-100 hover:bg-neutral-200"
            >
              ✕
            </button>

            <div className="text-center space-y-3 pt-2">
              <div
                className={`w-20 h-20 mx-auto rounded-3xl flex items-center justify-center shadow-xl text-white bg-gradient-to-br ${selectedBadge.color}`}
              >
                {renderBadgeIcon(selectedBadge.iconName, "w-10 h-10")}
              </div>

              <h3 style={{ fontFamily: '"American Typewriter", "Courier New", Courier, serif' }} className="text-lg font-bold text-neutral-900 font-serif">
                {selectedLang === 'EN' ? selectedBadge.titleEN : selectedBadge.titleES}
              </h3>

              <p className="text-xs text-neutral-600 leading-relaxed">
                {selectedLang === 'EN' ? selectedBadge.descriptionEN : selectedBadge.descriptionES}
              </p>
            </div>

            <div className="bg-neutral-50 p-3.5 rounded-2xl border border-neutral-200 space-y-2 text-xs">
              <div className="flex justify-between items-center font-bold text-neutral-700">
                <span>{selectedLang === 'EN' ? 'Target Milestone' : 'Meta del Hito'}</span>
                <span className="font-mono text-amber-600">{selectedBadge.progress}%</span>
              </div>
              <div className="w-full bg-neutral-200 rounded-full h-2 overflow-hidden">
                <div
                  className={`h-full rounded-full bg-gradient-to-r ${selectedBadge.color}`}
                  style={{ width: `${selectedBadge.progress}%` }}
                />
              </div>
              <p className="text-[10px] text-neutral-500 font-medium">
                {selectedLang === 'EN' ? selectedBadge.targetLabelEN : selectedBadge.targetLabelES}
              </p>
            </div>

            <div className="pt-2">
              <button
                onClick={() => {
                  setSelectedBadge(null);
                  if (onAskVoyager) {
                    onAskVoyager(
                      selectedLang === 'EN'
                        ? `I want to work towards unlocking my "${selectedBadge.titleEN}" badge! Let us practice English now.`
                        : `¡Quiero avanzar para desbloquear mi insignia de "${selectedBadge.titleES}"! Practiquemos inglés ahora.`
                    );
                  }
                }}
                className="w-full bg-red-600 hover:bg-red-700 text-white font-extrabold py-3 px-4 rounded-xl text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-md transition-all cursor-pointer"
              >
                <span>{selectedLang === 'EN' ? 'Practice Now with VOYAGER' : 'Practicar Ahora con VOYAGER'}</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
