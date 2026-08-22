import React, { useState, useEffect } from 'react';
import { Flame, Calendar, CheckCircle2, Award, Sparkles, Zap, ArrowRight, RefreshCw, Trophy, AlertCircle } from 'lucide-react';

interface DailyStreakTrackerProps {
  selectedLang: 'EN' | 'ES';
  initialStreak?: number;
  completedDays?: number[];
  onAskVoyager?: (prompt: string) => void;
  onStreakUpdate?: (newStreak: number) => void;
}

export const DailyStreakTracker: React.FC<DailyStreakTrackerProps> = ({
  selectedLang,
  initialStreak = 7,
  completedDays = [1, 2, 3, 4, 5, 6, 7],
  onAskVoyager,
  onStreakUpdate
}) => {
  // Load persistent streak from localStorage if available
  const [streak, setStreak] = useState<number>(() => {
    try {
      const saved = localStorage.getItem('voyager_daily_streak');
      return saved ? parseInt(saved, 10) : initialStreak;
    } catch {
      return initialStreak;
    }
  });

  const [hasCheckedInToday, setHasCheckedInToday] = useState<boolean>(() => {
    try {
      const lastCheckIn = localStorage.getItem('voyager_last_checkin_date');
      const todayStr = new Date().toISOString().slice(0, 10);
      return lastCheckIn === todayStr;
    } catch {
      return false;
    }
  });

  const [activeWeek, setActiveWeek] = useState<Array<{ dayNameEN: string; dayNameES: string; dateNumber: number; isCompleted: boolean; isToday: boolean }>>([]);
  const [showCelebration, setShowCelebration] = useState(false);

  useEffect(() => {
    // Generate current week days (Mon-Sun)
    const now = new Date();
    const currentDayOfWeek = now.getDay(); // 0 is Sun, 1 is Mon...
    // Adjust to Monday start
    const distanceToMon = currentDayOfWeek === 0 ? -6 : 1 - currentDayOfWeek;
    const monday = new Date(now);
    monday.setDate(now.getDate() + distanceToMon);

    const daysEN = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    const daysES = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];

    const weekArr = [];
    for (let i = 0; i < 7; i++) {
      const d = new Date(monday);
      d.setDate(monday.getDate() + i);
      const isToday = d.toDateString() === now.toDateString();
      // Completed if before today or today if checked in
      const isPast = d < now && !isToday;
      const isCompleted = isPast || (isToday && hasCheckedInToday);

      weekArr.push({
        dayNameEN: daysEN[i],
        dayNameES: daysES[i],
        dateNumber: d.getDate(),
        isCompleted,
        isToday
      });
    }
    setActiveWeek(weekArr);
  }, [hasCheckedInToday]);

  const playCheckInSound = () => {
    try {
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioContextClass) return;
      const ctx = new AudioContextClass();
      
      // Warm flame/chime swell
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(440, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(880, ctx.currentTime + 0.3);

      gain.gain.setValueAtTime(0.01, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.2, ctx.currentTime + 0.1);
      gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.4);

      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + 0.4);
    } catch {
      // ignore
    }
  };

  const handleCheckInToday = () => {
    if (hasCheckedInToday) return;

    playCheckInSound();
    const newStreak = streak + 1;
    setStreak(newStreak);
    setHasCheckedInToday(true);
    setShowCelebration(true);

    try {
      const todayStr = new Date().toISOString().slice(0, 10);
      localStorage.setItem('voyager_daily_streak', newStreak.toString());
      localStorage.setItem('voyager_last_checkin_date', todayStr);
    } catch {
      // ignore
    }

    if (onStreakUpdate) {
      onStreakUpdate(newStreak);
    }

    setTimeout(() => {
      setShowCelebration(false);
    }, 4000);
  };

  // Milestone targets
  const nextMilestone = streak < 10 ? 10 : streak < 14 ? 14 : streak < 30 ? 30 : 50;
  const progressPercent = Math.min(100, Math.round((streak / nextMilestone) * 100));

  return (
    <div className="bg-gradient-to-br from-neutral-900 via-slate-900 to-black text-white p-5 rounded-3xl border border-slate-800 shadow-2xl space-y-4 text-left relative overflow-hidden">
      {/* Background Flame Glow Effects */}
      <div className="absolute -top-12 -right-12 w-36 h-36 bg-amber-500/20 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-12 -left-12 w-36 h-36 bg-red-600/20 rounded-full blur-3xl pointer-events-none" />

      {/* HEADER ROW */}
      <div className="relative z-10 flex items-center justify-between flex-wrap gap-3 border-b border-slate-800/80 pb-3.5">
        <div className="flex items-center gap-3">
          <div className="relative">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-red-600 to-amber-500 flex items-center justify-center shadow-lg shadow-amber-500/30 animate-pulse">
              <Flame className="w-7 h-7 text-white fill-white" />
            </div>
            {hasCheckedInToday && (
              <span className="absolute -bottom-1 -right-1 bg-emerald-500 text-white p-0.5 rounded-full border-2 border-black">
                <CheckCircle2 className="w-3.5 h-3.5" />
              </span>
            )}
          </div>

          <div>
            <div className="flex items-center gap-2">
              <span style={{ fontFamily: '"American Typewriter", "Courier New", Courier, serif' }} className="text-2xl font-extrabold text-amber-400 font-mono tracking-tight leading-none">
                {streak} {selectedLang === 'EN' ? 'DAYS' : 'DÍAS'}
              </span>
              <span className="bg-amber-500/20 border border-amber-500/40 text-amber-300 text-[10px] font-black px-2 py-0.5 rounded-full uppercase tracking-wider">
                {selectedLang === 'EN' ? 'Daily Streak' : 'Racha Diaria'}
              </span>
            </div>
            <p className="text-xs text-slate-300 mt-1 leading-snug">
              {hasCheckedInToday
                ? (selectedLang === 'EN' ? 'You logged in today! Streak active.' : '¡Ingresaste hoy! Racha activa.')
                : (selectedLang === 'EN' ? 'Keep your momentum going. Practice today!' : 'Mantén tu impulso. ¡Practica hoy!')}
            </p>
          </div>
        </div>

        {/* Dynamic Action Button */}
        <button
          onClick={handleCheckInToday}
          disabled={hasCheckedInToday}
          className={`px-4 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all cursor-pointer flex items-center gap-2 shadow-lg ${
            hasCheckedInToday
              ? 'bg-slate-800 text-slate-400 border border-slate-700 cursor-default'
              : 'bg-gradient-to-r from-amber-500 to-red-600 hover:from-amber-400 hover:to-red-500 text-white shadow-amber-500/25 hover:scale-102 active:scale-98'
          }`}
        >
          {hasCheckedInToday ? (
            <>
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              <span>{selectedLang === 'EN' ? 'Checked In Today' : 'Completado Hoy'}</span>
            </>
          ) : (
            <>
              <Zap className="w-4 h-4 text-amber-200 fill-amber-200" />
              <span>{selectedLang === 'EN' ? 'Check In & Boost Streak' : 'Marcar Racha de Hoy'}</span>
            </>
          )}
        </button>
      </div>

      {/* CELEBRATION BANNER */}
      {showCelebration && (
        <div className="bg-gradient-to-r from-amber-500/30 via-red-500/20 to-amber-500/30 border border-amber-400/50 p-3 rounded-2xl animate-fade-in flex items-center justify-between gap-2">
          <div className="flex items-center gap-2.5">
            <Trophy className="w-5 h-5 text-amber-300 animate-bounce" />
            <span className="text-xs font-bold text-amber-200">
              {selectedLang === 'EN'
                ? `Streak increased to ${streak} days! You earn +50 practice points.`
                : `¡Racha aumentada a ${streak} días! Ganaste +50 puntos de práctica.`}
            </span>
          </div>
          <Sparkles className="w-4 h-4 text-amber-300 animate-spin" />
        </div>
      )}

      {/* WEEKLY ACTIVITY CALENDAR */}
      <div className="space-y-2">
        <div className="flex items-center justify-between text-[11px] font-bold text-slate-400 uppercase tracking-wider">
          <span className="flex items-center gap-1.5 font-serif text-slate-200">
            <Calendar className="w-3.5 h-3.5 text-amber-400" />
            {selectedLang === 'EN' ? 'This Week Practice Habit' : 'Hábito de Práctica Semanal'}
          </span>
          <span className="text-slate-400 font-mono text-[10px]">
            {activeWeek.filter(w => w.isCompleted).length}/7 {selectedLang === 'EN' ? 'Days Completed' : 'Días'}
          </span>
        </div>

        <div className="grid grid-cols-7 gap-1.5 text-center">
          {activeWeek.map((day, idx) => {
            const dayLabel = selectedLang === 'EN' ? day.dayNameEN : day.dayNameES;
            return (
              <div
                key={idx}
                className={`p-2 rounded-2xl border transition-all flex flex-col items-center justify-center gap-1 ${
                  day.isCompleted
                    ? 'bg-gradient-to-b from-amber-500/20 to-red-600/20 border-amber-500/60 text-amber-300 shadow-sm'
                    : day.isToday
                    ? 'bg-slate-800 border-amber-400 text-slate-100 ring-2 ring-amber-400/30'
                    : 'bg-slate-800/40 border-slate-800 text-slate-500'
                }`}
              >
                <span className="text-[10px] font-black uppercase">{dayLabel}</span>
                <span className="text-xs font-extrabold font-mono">{day.dateNumber}</span>
                {day.isCompleted ? (
                  <Flame className="w-3.5 h-3.5 fill-amber-400 text-amber-400 mt-0.5" />
                ) : day.isToday ? (
                  <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping mt-1" />
                ) : (
                  <span className="w-1.5 h-1.5 rounded-full bg-slate-700 mt-1" />
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* MILESTONE PROGRESS FOOTER */}
      <div className="bg-slate-800/60 border border-slate-700/60 p-3 rounded-2xl space-y-2">
        <div className="flex items-center justify-between text-xs font-bold">
          <span className="text-slate-300 flex items-center gap-1.5">
            <Award className="w-4 h-4 text-amber-400" />
            {selectedLang === 'EN' ? `Next Goal: ${nextMilestone}-Day Streak` : `Siguiente Meta: Racha de ${nextMilestone} Días`}
          </span>
          <span className="text-amber-400 font-mono">{progressPercent}%</span>
        </div>

        <div className="w-full bg-slate-900 rounded-full h-2 overflow-hidden border border-slate-800">
          <div
            className="h-full bg-gradient-to-r from-amber-500 via-orange-500 to-red-600 rounded-full transition-all duration-700"
            style={{ width: `${progressPercent}%` }}
          />
        </div>

        <div className="flex items-center justify-between text-[10px] text-slate-400 pt-0.5">
          <span>{selectedLang === 'EN' ? `${streak} days active` : `${streak} días activos`}</span>
          {onAskVoyager && (
            <button
              onClick={() =>
                onAskVoyager(
                  selectedLang === 'EN'
                    ? `I want to keep my ${streak}-day English learning streak going! What quick 3-minute practice should we do right now?`
                    : `¡Quiero mantener mi racha de ${streak} días aprendiendo inglés! ¿Qué práctica rápida de 3 minutos podemos hacer ahora mismo?`
                )
              }
              className="text-amber-400 hover:text-amber-300 font-bold flex items-center gap-1 cursor-pointer hover:underline"
            >
              <span>{selectedLang === 'EN' ? 'Practice with VOYAGER' : 'Practicar con VOYAGER'}</span>
              <ArrowRight className="w-3 h-3" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
