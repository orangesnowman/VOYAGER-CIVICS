import React, { useState } from 'react';
import { Calendar as CalendarIcon, Clock, CheckCircle2, AlertCircle, ChevronLeft, ChevronRight, MessageSquare, X, Play, Sparkles, Award, Maximize, Minimize, Activity, Sun, Moon } from 'lucide-react';
import { SavedChatSession } from './SavedChatsModal';

interface ActivityCalendarProps {
  selectedLang: 'EN' | 'ES';
  savedChats: SavedChatSession[];
  targetGoalMinutes?: number;
  onLoadChat?: (chat: SavedChatSession) => void;
}

export const ActivityCalendar: React.FC<ActivityCalendarProps> = ({
  selectedLang,
  savedChats,
  targetGoalMinutes = 15,
  onLoadChat,
}) => {
  const [currentMonth, setCurrentMonth] = useState<Date>(new Date());
  const [viewMode, setViewMode] = useState<'month' | 'week'>('month');
  const [selectedDay, setSelectedDay] = useState<string | null>(null);
  const [isExpanded, setIsExpanded] = useState<boolean>(false);
  const [calendarTheme, setCalendarTheme] = useState<'light' | 'dark'>('light');

  // Calculate current week Sunday start
  const [currentWeekStart, setCurrentWeekStart] = useState<Date>(() => {
    const d = new Date();
    const day = d.getDay();
    const diff = d.getDate() - day;
    const sunday = new Date(d);
    sunday.setDate(diff);
    sunday.setHours(0, 0, 0, 0);
    return sunday;
  });

  // Parse and aggregate actual active conversation time by YYYY-MM-DD
  const dailyDataMap = React.useMemo(() => {
    const map: Record<string, {
      dateKey: string;
      totalSeconds: number;
      totalMinutes: number;
      sessions: Array<{
        id: string;
        title: string;
        startTime: string;
        endTime: string;
        durationSeconds: number;
        messageCount: number;
        snippet: string;
        messages: { sender: string; text: string; timestamp?: Date | string }[];
        rawChat: SavedChatSession;
      }>;
    }> = {};

    savedChats.forEach((chat) => {
      const chatDate = new Date(chat.date || Date.now());
      if (isNaN(chatDate.getTime())) return;

      const yr = chatDate.getFullYear();
      const mo = String(chatDate.getMonth() + 1).padStart(2, '0');
      const dy = String(chatDate.getDate()).padStart(2, '0');
      const dateKey = `${yr}-${mo}-${dy}`;

      const durSec = chat.durationSeconds || 0;
      const startTimeStr = chatDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      
      const endDate = new Date(chatDate.getTime() + (durSec * 1000));
      const endTimeStr = endDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

      if (!map[dateKey]) {
        map[dateKey] = {
          dateKey,
          totalSeconds: 0,
          totalMinutes: 0,
          sessions: []
        };
      }

      map[dateKey].totalSeconds += durSec;
      map[dateKey].totalMinutes = Math.round((map[dateKey].totalSeconds / 60) * 10) / 10;
      map[dateKey].sessions.push({
        id: chat.id,
        title: chat.title || (selectedLang === 'EN' ? 'Practice Session' : 'Sesión de Práctica'),
        startTime: startTimeStr,
        endTime: endTimeStr,
        durationSeconds: durSec,
        messageCount: chat.messageCount || chat.messages?.length || 0,
        snippet: chat.snippet || '',
        messages: chat.messages || [],
        rawChat: chat
      });
    });

    return map;
  }, [savedChats, selectedLang]);

  // Calendar math helpers
  const year = currentMonth.getFullYear();
  const month = currentMonth.getMonth();

  const firstDayOfMonth = new Date(year, month, 1).getDay();
  // Adjust Monday as first day if needed, but standard Sunday-first or Monday-first is fine
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const handlePrevMonth = () => {
    setCurrentMonth(new Date(year, month - 1, 1));
  };

  const handleNextMonth = () => {
    setCurrentMonth(new Date(year, month + 1, 1));
  };

  const handlePrevWeek = () => {
    const prev = new Date(currentWeekStart);
    prev.setDate(prev.getDate() - 7);
    setCurrentWeekStart(prev);
  };

  const handleNextWeek = () => {
    const next = new Date(currentWeekStart);
    next.setDate(next.getDate() + 7);
    setCurrentWeekStart(next);
  };

  const weekDays = React.useMemo(() => {
    const days = [];
    for (let i = 0; i < 7; i++) {
      const d = new Date(currentWeekStart);
      d.setDate(currentWeekStart.getDate() + i);
      const yr = d.getFullYear();
      const mo = String(d.getMonth() + 1).padStart(2, '0');
      const dy = String(d.getDate()).padStart(2, '0');
      const dateKey = `${yr}-${mo}-${dy}`;
      days.push({
        date: d,
        dateKey,
        dayNum: d.getDate(),
        dayNameEN: d.toLocaleDateString('en-US', { weekday: 'short' }),
        dayNameES: d.toLocaleDateString('es-ES', { weekday: 'short' }),
      });
    }
    return days;
  }, [currentWeekStart]);

  const weekRangeLabel = React.useMemo(() => {
    const end = new Date(currentWeekStart);
    end.setDate(end.getDate() + 6);
    const locale = selectedLang === 'EN' ? 'en-US' : 'es-ES';
    return `${currentWeekStart.toLocaleDateString(locale, { month: 'short', day: 'numeric' })} - ${end.toLocaleDateString(locale, { month: 'short', day: 'numeric', year: 'numeric' })}`;
  }, [currentWeekStart, selectedLang]);

  const todayStr = React.useMemo(() => {
    const d = new Date();
    const yr = d.getFullYear();
    const mo = String(d.getMonth() + 1).padStart(2, '0');
    const dy = String(d.getDate()).padStart(2, '0');
    return `${yr}-${mo}-${dy}`;
  }, []);

  const selectedDayData = selectedDay ? dailyDataMap[selectedDay] : null;

  const toggleExpanded = (expand?: boolean) => {
    const nextState = expand !== undefined ? expand : !isExpanded;
    setIsExpanded(nextState);
    if (nextState && !document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
    } else if (!nextState && document.fullscreenElement) {
      if (document.exitFullscreen) {
        document.exitFullscreen().catch(() => {});
      }
    }
  };

  const calendarContent = (
    <div 
      onClick={() => {
        if (!isExpanded) {
          toggleExpanded(true);
        }
      }}
      className={`font-sans transition-colors duration-200 ${
        calendarTheme === 'dark' ? 'text-slate-100' : 'text-slate-900'
      } ${
        isExpanded 
          ? calendarTheme === 'dark'
            ? 'fixed inset-0 z-50 w-screen h-screen bg-[#0b162c] p-4 sm:p-8 md:p-10 flex flex-col justify-between overflow-y-auto'
            : 'fixed inset-0 z-50 w-screen h-screen bg-slate-50 p-4 sm:p-8 md:p-10 flex flex-col justify-between overflow-y-auto' 
          : calendarTheme === 'dark'
            ? 'p-2.5 sm:p-4 rounded-2xl bg-[#0f1d38] border border-slate-700/80 space-y-3 cursor-pointer group/cal shadow-xl'
            : 'p-1.5 sm:p-3 rounded-2xl bg-white border border-slate-200 space-y-3 cursor-pointer group/cal shadow-sm'
      }`}
    >
      {/* Calendar Header - Top Row: Title & Top-Right Control Buttons (Dark/Light + Full Screen) */}
      <div className="flex items-center justify-between gap-3 w-full">
        <div className="flex items-center gap-2.5">
          <CalendarIcon className={`${isExpanded ? 'w-7 h-7 sm:w-8 sm:h-8' : 'w-5 h-5'} text-sky-500 transition-transform group-hover/cal:scale-110`} />
          <h4 className={`font-black font-mono tracking-tight ${
            calendarTheme === 'dark' ? 'text-sky-100' : 'text-slate-900'
          } ${isExpanded ? 'text-base sm:text-xl md:text-2xl' : 'text-sm sm:text-base group-hover/cal:text-sky-500 transition-colors'}`}>
            {selectedLang === 'EN' ? 'Voyager Activity Calendar' : 'Calendario de Actividades Voyager'}
          </h4>
        </div>

        {/* Control Buttons Container (Dark/Light Theme Toggle + Full Screen Toggle) */}
        <div className="flex items-center gap-2 shrink-0 z-10">
          {/* Dark / Light Mode Toggle Button */}
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setCalendarTheme(prev => prev === 'light' ? 'dark' : 'light');
            }}
            className={`rounded-full transition-all cursor-pointer shadow-md flex items-center justify-center shrink-0 p-2 ${
              isExpanded ? 'w-10 h-10' : 'w-9 h-9'
            } ${
              calendarTheme === 'dark' 
                ? 'bg-slate-800 text-sky-300 border border-sky-400/40 hover:bg-slate-700 hover:scale-110' 
                : 'bg-slate-100 text-slate-800 border border-slate-300 hover:bg-slate-200 hover:scale-110'
            }`}
            title={calendarTheme === 'dark' ? (selectedLang === 'EN' ? 'Switch to Light Mode' : 'Cambiar a Modo Claro') : (selectedLang === 'EN' ? 'Switch to Dark Mode' : 'Cambiar a Modo Oscuro')}
            aria-label={calendarTheme === 'dark' ? (selectedLang === 'EN' ? 'Switch to Light Mode' : 'Cambiar a Modo Claro') : (selectedLang === 'EN' ? 'Switch to Dark Mode' : 'Cambiar a Modo Oscuro')}
          >
            {calendarTheme === 'dark' ? (
              <Sun className="w-5 h-5 text-amber-400 pointer-events-none stroke-[2.5]" />
            ) : (
              <Moon className="w-5 h-5 text-slate-800 pointer-events-none stroke-[2.5]" />
            )}
          </button>

          {/* Full Screen Toggle Button */}
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              toggleExpanded();
            }}
            className={`rounded-full transition-all cursor-pointer shadow-md flex items-center justify-center shrink-0 p-2 ${
              isExpanded ? 'w-10 h-10' : 'w-9 h-9'
            } ${
              calendarTheme === 'dark'
                ? 'bg-blue-600 text-white hover:bg-blue-500 shadow-blue-900/50 hover:scale-110'
                : 'bg-slate-900 text-white hover:bg-slate-800 hover:scale-110'
            }`}
            title={isExpanded ? (selectedLang === 'EN' ? 'Exit Full Screen' : 'Salir de Pantalla Completa') : (selectedLang === 'EN' ? 'Full Screen Calendar' : 'Pantalla Completa')}
            aria-label={isExpanded ? (selectedLang === 'EN' ? 'Exit Full Screen' : 'Salir de Pantalla Completa') : (selectedLang === 'EN' ? 'Full Screen Calendar' : 'Pantalla Completa')}
          >
            {isExpanded ? (
              <Minimize className="w-5 h-5 stroke-[2.5] text-white pointer-events-none" />
            ) : (
              <Maximize className="w-5 h-5 stroke-[2.5] text-white pointer-events-none" />
            )}
          </button>
        </div>
      </div>

      {/* Calendar Header - Controls Row: View Switcher & Date Navigation */}
      <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
        {/* View Switcher Segmented Pill */}
        <div className={`flex items-center p-1 rounded-xl border text-xs font-mono font-bold ${
          calendarTheme === 'dark' ? 'bg-slate-900/90 border-slate-700/80' : 'bg-slate-100 border-slate-200/90'
        }`}>
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); setViewMode('month'); }}
            className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
              viewMode === 'month' 
                ? 'bg-blue-600 text-white shadow-sm font-black' 
                : calendarTheme === 'dark' ? 'text-slate-400 hover:text-slate-100' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            {selectedLang === 'EN' ? 'Month' : 'Mes'}
          </button>
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); setViewMode('week'); }}
            className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
              viewMode === 'week' 
                ? 'bg-blue-600 text-white shadow-sm font-black' 
                : calendarTheme === 'dark' ? 'text-slate-400 hover:text-slate-100' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            {selectedLang === 'EN' ? 'Week' : 'Semana'}
          </button>
        </div>

        {/* Date Navigator Controls */}
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); viewMode === 'month' ? handlePrevMonth() : handlePrevWeek(); }}
            className={`${isExpanded ? 'p-2 sm:p-2.5' : 'p-1.5'} active:scale-95 rounded-xl border transition-all cursor-pointer ${
              calendarTheme === 'dark' 
                ? 'bg-slate-800/90 hover:bg-slate-700 text-slate-100 border-slate-700' 
                : 'bg-white hover:bg-slate-100 text-slate-800 border-slate-300'
            }`}
            title={viewMode === 'month' ? (selectedLang === 'EN' ? 'Previous Month' : 'Mes Anterior') : (selectedLang === 'EN' ? 'Previous Week' : 'Semana Anterior')}
          >
            <ChevronLeft className={`${isExpanded ? 'w-5 h-5' : 'w-4 h-4'} stroke-[2.5]`} />
          </button>
          <span className={`font-mono font-black uppercase text-center px-1 ${
            calendarTheme === 'dark' ? 'text-sky-100' : 'text-slate-900'
          } ${isExpanded ? 'text-sm sm:text-lg min-w-[150px]' : 'text-xs sm:text-sm min-w-[120px]'}`}>
            {viewMode === 'month'
              ? currentMonth.toLocaleString(selectedLang === 'EN' ? 'en-US' : 'es-ES', { month: 'long', year: 'numeric' })
              : weekRangeLabel}
          </span>
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); viewMode === 'month' ? handleNextMonth() : handleNextWeek(); }}
            className={`${isExpanded ? 'p-2 sm:p-2.5' : 'p-1.5'} active:scale-95 rounded-xl border transition-all cursor-pointer ${
              calendarTheme === 'dark' 
                ? 'bg-slate-800/90 hover:bg-slate-700 text-slate-100 border-slate-700' 
                : 'bg-white hover:bg-slate-100 text-slate-800 border-slate-300'
            }`}
            title={viewMode === 'month' ? (selectedLang === 'EN' ? 'Next Month' : 'Mes Siguiente') : (selectedLang === 'EN' ? 'Next Week' : 'Semana Siguiente')}
          >
            <ChevronRight className={`${isExpanded ? 'w-5 h-5' : 'w-4 h-4'} stroke-[2.5]`} />
          </button>
        </div>
      </div>

      {/* Subheader info: Goal explanation */}
      <div className={`flex flex-wrap items-center justify-between gap-2 font-mono rounded-xl font-medium ${
        calendarTheme === 'dark'
          ? 'bg-blue-950/60 border border-blue-800/80 text-sky-200'
          : 'bg-blue-50/90 border border-blue-200 text-blue-950'
      } ${isExpanded ? 'px-4 py-2.5 text-sm my-2' : 'px-3 py-2 text-xs mb-3'}`}>
        <span className="flex items-center gap-2 font-bold">
          <Award className={`${isExpanded ? 'w-5 h-5' : 'w-4 h-4'} text-sky-500 shrink-0`} />
          {selectedLang === 'EN' ? `Daily Target Goal: ${targetGoalMinutes} mins` : `Meta Diaria Asignada: ${targetGoalMinutes} min`}
        </span>
        <span className={`${isExpanded ? 'text-xs' : 'text-[11px]'} ${calendarTheme === 'dark' ? 'text-sky-300/80' : 'text-blue-800/90'}`}>
          {selectedLang === 'EN' ? '*Click any day card to inspect full day activity & transcripts' : '*Haz clic en cualquier día para ver la actividad completa del día'}
        </span>
      </div>

      {/* MONTH VIEW */}
      {viewMode === 'month' && (
        <>
          {/* Days of week header */}
          <div className={`grid grid-cols-7 gap-2 text-center font-mono font-black uppercase tracking-wider ${
            calendarTheme === 'dark' ? 'text-sky-300/90' : 'text-slate-700'
          } ${isExpanded ? 'text-sm sm:text-base my-2' : 'text-xs mb-2'}`}>
            <span>{selectedLang === 'EN' ? 'SU' : 'DO'}</span>
            <span>{selectedLang === 'EN' ? 'MO' : 'LU'}</span>
            <span>{selectedLang === 'EN' ? 'TU' : 'MA'}</span>
            <span>{selectedLang === 'EN' ? 'WE' : 'MI'}</span>
            <span>{selectedLang === 'EN' ? 'TH' : 'JU'}</span>
            <span>{selectedLang === 'EN' ? 'FR' : 'VI'}</span>
            <span>{selectedLang === 'EN' ? 'SA' : 'SÁ'}</span>
          </div>

          {/* Month Calendar Grid */}
          <div className={`grid grid-cols-7 gap-2 text-center flex-1 ${isExpanded ? 'my-2' : ''}`}>
            {/* Leading empty cells */}
            {Array.from({ length: firstDayOfMonth }).map((_, idx) => (
              <div key={`empty-${idx}`} className={`rounded-xl border border-transparent ${
                calendarTheme === 'dark' ? 'bg-slate-900/40 border-slate-800/50' : 'bg-slate-100/50'
              } ${isExpanded ? 'h-20 sm:h-24 md:h-28' : 'h-12 sm:h-14'}`} />
            ))}

            {/* Days cells */}
            {Array.from({ length: daysInMonth }).map((_, idx) => {
              const dayNum = idx + 1;
              const dyStr = String(dayNum).padStart(2, '0');
              const moStr = String(month + 1).padStart(2, '0');
              const dateKey = `${year}-${moStr}-${dyStr}`;

              const dayData = dailyDataMap[dateKey];
              const hasActivity = Boolean(dayData && dayData.totalSeconds > 0);
              const activeMinutes = dayData ? Math.round(dayData.totalSeconds / 60) : 0;
              const goalMet = activeMinutes >= targetGoalMinutes;
              const isToday = dateKey === todayStr;
              const isSelected = selectedDay === dateKey;

              return (
                <button
                  key={dateKey}
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelectedDay(dateKey);
                  }}
                  className={`rounded-xl flex flex-col items-center justify-between font-mono transition-all cursor-pointer relative group ${
                    isExpanded ? 'h-20 sm:h-24 md:h-28 p-2 sm:p-3 text-sm sm:text-base' : 'h-12 sm:h-14 p-1 sm:p-1.5 text-xs'
                  } ${
                    isSelected
                      ? 'bg-sky-400 text-slate-950 font-black ring-3 ring-sky-500 shadow-md scale-[1.02]'
                      : isToday
                      ? calendarTheme === 'dark'
                        ? 'border-2 border-sky-400 bg-blue-950/80 text-sky-100 font-black shadow-sm'
                        : 'border-2 border-blue-600 bg-blue-50/90 text-blue-950 font-black shadow-sm'
                      : hasActivity
                      ? goalMet
                        ? calendarTheme === 'dark'
                          ? 'bg-blue-900/80 border border-sky-500/70 text-sky-100 font-bold hover:bg-blue-800/90 shadow-2xs'
                          : 'bg-sky-100/90 border border-sky-300 text-sky-950 font-bold hover:bg-sky-200/90 shadow-2xs'
                        : calendarTheme === 'dark'
                          ? 'bg-slate-800 border border-slate-600 text-slate-100 font-bold hover:bg-slate-700 shadow-2xs'
                          : 'bg-slate-100 border border-slate-300 text-slate-900 font-bold hover:bg-slate-200 shadow-2xs'
                      : calendarTheme === 'dark'
                        ? 'bg-slate-800/70 border border-slate-700/70 text-slate-200 hover:bg-slate-700/90 hover:border-sky-500/80 shadow-2xs'
                        : 'bg-white border border-slate-200 text-slate-800 hover:bg-blue-50 hover:border-blue-300 shadow-2xs'
                  }`}
                >
                  <div className="w-full flex justify-between items-center px-1">
                    <span className={`font-medium ${
                      isSelected 
                        ? 'text-slate-950' 
                        : isToday 
                        ? 'text-sky-400 font-semibold' 
                        : calendarTheme === 'dark' 
                        ? 'text-slate-100' 
                        : 'text-slate-800'
                    } ${isExpanded ? 'text-base sm:text-lg' : 'text-xs'}`}>
                      {dayNum}
                    </span>
                    {goalMet ? (
                      <CheckCircle2 className={`${isExpanded ? 'w-4.5 h-4.5 sm:w-5 sm:h-5' : 'w-3 h-3'} ${isSelected ? 'text-slate-950' : 'text-sky-400'}`} />
                    ) : hasActivity ? (
                      <Clock className={`${isExpanded ? 'w-4.5 h-4.5 sm:w-5 sm:h-5' : 'w-3 h-3'} ${isSelected ? 'text-slate-950' : 'text-blue-400'}`} />
                    ) : null}
                  </div>

                  {hasActivity ? (
                    <span className={`font-medium rounded-lg my-auto ${
                      isExpanded ? 'text-xs sm:text-sm px-2.5 py-1' : 'text-[10px] px-1.5 py-0.5'
                    } ${
                      isSelected 
                        ? 'bg-slate-950/20 text-slate-950'
                        : goalMet
                        ? calendarTheme === 'dark' ? 'bg-sky-500/30 text-sky-100 border border-sky-400/50' : 'bg-sky-200/90 text-sky-950 border border-sky-300'
                        : calendarTheme === 'dark' ? 'bg-slate-700 text-slate-100 border border-slate-600' : 'bg-slate-200 text-slate-900 border border-slate-300'
                    }`}>
                      {activeMinutes > 0 ? `${activeMinutes}m` : `${dayData?.totalSeconds}s`}
                    </span>
                  ) : (
                    <span className={`font-mono my-auto ${calendarTheme === 'dark' ? 'text-slate-400' : 'text-slate-400'} ${isExpanded ? 'text-sm' : 'text-[10px]'}`}>-</span>
                  )}
                </button>
              );
            })}
          </div>
        </>
      )}

      {/* WEEK VIEW */}
      {viewMode === 'week' && (
        <div className="space-y-3 flex-1 flex flex-col">
          <div className="grid grid-cols-1 sm:grid-cols-7 gap-3 flex-1">
            {weekDays.map((wd) => {
              const dayData = dailyDataMap[wd.dateKey];
              const hasActivity = Boolean(dayData && dayData.totalSeconds > 0);
              const activeMinutes = dayData ? Math.round(dayData.totalSeconds / 60) : 0;
              const goalMet = activeMinutes >= targetGoalMinutes;
              const isToday = wd.dateKey === todayStr;
              const isSelected = selectedDay === wd.dateKey;

              return (
                <div
                  key={wd.dateKey}
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelectedDay(wd.dateKey);
                  }}
                  className={`rounded-2xl p-3 sm:p-4 flex flex-col justify-between transition-all cursor-pointer border ${
                    isSelected
                      ? 'bg-sky-400 border-sky-500 text-slate-950 ring-3 ring-sky-500 shadow-md scale-[1.02]'
                      : isToday
                      ? calendarTheme === 'dark'
                        ? 'bg-blue-950/80 border-2 border-sky-400 text-sky-100 shadow-sm'
                        : 'bg-blue-50/90 border-2 border-blue-600 text-blue-950 shadow-sm'
                      : hasActivity
                      ? goalMet
                        ? calendarTheme === 'dark'
                          ? 'bg-blue-900/80 border-sky-500/70 text-sky-100 hover:bg-blue-800/90 shadow-2xs'
                          : 'bg-sky-100/90 border-sky-300 text-sky-950 hover:bg-sky-200/90 shadow-2xs'
                        : calendarTheme === 'dark'
                          ? 'bg-slate-800 border-slate-600 text-slate-100 hover:bg-slate-700 shadow-2xs'
                          : 'bg-slate-100 border-slate-300 text-slate-900 hover:bg-slate-200 shadow-2xs'
                      : calendarTheme === 'dark'
                        ? 'bg-slate-800/70 border-slate-700/70 text-slate-300 hover:bg-slate-700/90'
                        : 'bg-white border-slate-200 text-slate-700 hover:bg-blue-50'
                  }`}
                >
                  {/* Day Header */}
                  <div className={`flex items-center justify-between border-b pb-2 ${
                    calendarTheme === 'dark' ? 'border-slate-700/80' : 'border-slate-200'
                  }`}>
                    <div className="flex flex-col">
                      <span className={`text-xs font-mono font-black uppercase ${
                        calendarTheme === 'dark' ? 'text-sky-300/80' : 'text-slate-600'
                      }`}>
                        {selectedLang === 'EN' ? wd.dayNameEN : wd.dayNameES}
                      </span>
                      <span className={`text-lg sm:text-xl font-normal font-mono ${
                        calendarTheme === 'dark' ? 'text-slate-100' : 'text-slate-900'
                      }`}>
                        {wd.dayNum}
                      </span>
                    </div>
                    {goalMet ? (
                      <CheckCircle2 className="w-5 h-5 text-sky-400 shrink-0" />
                    ) : hasActivity ? (
                      <Clock className="w-5 h-5 text-blue-400 shrink-0" />
                    ) : null}
                  </div>

                  {/* Activity Stats for the Day */}
                  <div className="my-3 space-y-1.5">
                    {hasActivity ? (
                      <>
                        <div className="flex items-center justify-between text-xs font-mono font-bold">
                          <span>⏱️ {selectedLang === 'EN' ? 'Active:' : 'Activo:'}</span>
                          <span className={`px-2 py-0.5 rounded-md ${
                            calendarTheme === 'dark' ? 'bg-sky-500/30 text-sky-100 border border-sky-400/40' : 'bg-sky-200 text-sky-950 border border-sky-300'
                          }`}>
                            {activeMinutes > 0 ? `${activeMinutes} min` : `${dayData?.totalSeconds} sec`}
                          </span>
                        </div>
                        <div className={`flex items-center justify-between text-[11px] font-mono ${
                          calendarTheme === 'dark' ? 'text-slate-300' : 'text-slate-600'
                        }`}>
                          <span>💬 {selectedLang === 'EN' ? 'Sessions:' : 'Sesiones:'}</span>
                          <span className={`font-bold ${calendarTheme === 'dark' ? 'text-slate-100' : 'text-slate-900'}`}>{dayData?.sessions.length}</span>
                        </div>
                      </>
                    ) : (
                      <div className={`py-4 text-center text-xs font-mono italic ${
                        calendarTheme === 'dark' ? 'text-slate-400' : 'text-slate-400'
                      }`}>
                        {selectedLang === 'EN' ? 'No activity' : 'Sin actividad'}
                      </div>
                    )}
                  </div>

                  {/* Mini Session Previews */}
                  {hasActivity && dayData && dayData.sessions.length > 0 && (
                    <div className={`space-y-1 pt-2 border-t ${
                      calendarTheme === 'dark' ? 'border-slate-700/80' : 'border-slate-200'
                    }`}>
                      {dayData.sessions.slice(0, 2).map((s) => (
                        <div key={s.id} className={`text-[10px] font-mono p-1.5 rounded-lg border truncate ${
                          calendarTheme === 'dark' 
                            ? 'bg-slate-950/80 border-slate-800 text-slate-200' 
                            : 'bg-white/90 border-slate-200 text-slate-800'
                        }`}>
                          🕒 {s.startTime} - {s.title}
                        </div>
                      ))}
                      {dayData.sessions.length > 2 && (
                        <div className="text-[9.5px] font-mono text-sky-400 font-bold text-center">
                          +{dayData.sessions.length - 2} {selectedLang === 'EN' ? 'more' : 'más'}
                        </div>
                      )}
                    </div>
                  )}

                  <div className={`mt-2 text-[10px] font-mono font-black uppercase tracking-wider text-center py-1 rounded-md border ${
                    calendarTheme === 'dark'
                      ? 'bg-blue-950/80 text-sky-200 border-sky-800/80'
                      : 'bg-blue-100/90 text-blue-900 border-blue-200'
                  }`}>
                    {selectedLang === 'EN' ? 'Click for Full Day' : 'Ver Día Completo'}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Selected Day Full Activity Inspector Sheet/Modal */}
      {selectedDay && (
        <div className={`mt-4 p-4 sm:p-5 border-2 border-blue-500/80 rounded-2xl space-y-4 shadow-xl animate-fadeIn ${
          calendarTheme === 'dark' ? 'bg-[#0c1829] text-slate-100 border-sky-500/50' : 'bg-slate-50 text-slate-900 border-blue-300'
        }`}>
          <div className={`flex flex-wrap items-center justify-between gap-2 border-b pb-3 ${
            calendarTheme === 'dark' ? 'border-slate-800' : 'border-slate-200'
          }`}>
            <div>
              <div className={`text-base sm:text-lg font-black font-mono flex items-center gap-2 ${
                calendarTheme === 'dark' ? 'text-sky-100' : 'text-slate-900'
              }`}>
                <Activity className="w-5 h-5 text-sky-400" />
                <span>
                  {new Date(`${selectedDay}T00:00:00`).toLocaleDateString(selectedLang === 'EN' ? 'en-US' : 'es-ES', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}
                </span>
              </div>
              <div className="text-xs font-mono mt-1.5 flex flex-wrap items-center gap-2">
                {selectedDayData ? (
                  <>
                    <span className={`font-bold px-2.5 py-1 rounded-xl border ${
                      calendarTheme === 'dark'
                        ? 'text-sky-200 bg-blue-950/80 border-sky-800'
                        : 'text-blue-950 bg-blue-100 border-blue-300'
                    }`}>
                      ⏱️ {selectedLang === 'EN' ? `Total Active: ${Math.round(selectedDayData.totalSeconds / 60)} min (${selectedDayData.totalSeconds} sec)` : `Tiempo Total: ${Math.round(selectedDayData.totalSeconds / 60)} min (${selectedDayData.totalSeconds} seg)`}
                    </span>
                    <span className={selectedDayData.totalSeconds >= targetGoalMinutes * 60 
                      ? (calendarTheme === 'dark' ? 'text-sky-100 font-bold bg-sky-950/80 px-2.5 py-1 rounded-xl border border-sky-600' : 'text-blue-950 font-bold bg-sky-100 px-2.5 py-1 rounded-xl border border-sky-300')
                      : (calendarTheme === 'dark' ? 'text-slate-200 font-bold bg-slate-800 px-2.5 py-1 rounded-xl border border-slate-700' : 'text-slate-900 font-bold bg-slate-200 px-2.5 py-1 rounded-xl border border-slate-300')
                    }>
                      {selectedDayData.totalSeconds >= targetGoalMinutes * 60 
                        ? (selectedLang === 'EN' ? '✅ Daily Goal Met!' : '✅ ¡Meta Diaria Cumplida!')
                        : (selectedLang === 'EN' ? `Target: ${targetGoalMinutes}m` : `Meta: ${targetGoalMinutes}m`)}
                    </span>
                    <span className={`font-bold px-2.5 py-1 rounded-xl border ${
                      calendarTheme === 'dark'
                        ? 'text-slate-200 bg-slate-800 border-slate-700'
                        : 'text-slate-950 bg-slate-200/80 border-slate-300'
                    }`}>
                      💬 {selectedDayData.sessions.length} {selectedLang === 'EN' ? 'Sessions Recorded' : 'Sesiones Grabadas'}
                    </span>
                  </>
                ) : (
                  <span className={`italic ${calendarTheme === 'dark' ? 'text-slate-400' : 'text-slate-500'}`}>
                    {selectedLang === 'EN' ? 'No recorded active conversation time on this day.' : 'No se registró tiempo activo de conversación este día.'}
                  </span>
                )}
              </div>
            </div>

            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setSelectedDay(null);
              }}
              className={`p-2 rounded-xl transition-colors cursor-pointer border ${
                calendarTheme === 'dark' 
                  ? 'hover:bg-slate-800 text-slate-300 border-slate-700' 
                  : 'hover:bg-slate-200 text-slate-600 hover:text-slate-950 border-slate-300'
              }`}
              title={selectedLang === 'EN' ? 'Close Inspector' : 'Cerrar Inspección'}
            >
              <X className="w-5 h-5 stroke-[2.5]" />
            </button>
          </div>

          {/* Full Day Sessions Stream */}
          {selectedDayData && selectedDayData.sessions.length > 0 ? (
            <div className="space-y-3 max-h-80 overflow-y-auto pr-1">
              <h5 className={`text-xs font-mono font-black uppercase tracking-wider flex items-center gap-1.5 ${
                calendarTheme === 'dark' ? 'text-slate-300' : 'text-slate-600'
              }`}>
                <Clock className="w-4 h-4 text-sky-400" />
                {selectedLang === 'EN' ? 'Full Day Activity Timeline:' : 'Línea de Tiempo de la Actividad del Día:'}
              </h5>

              {selectedDayData.sessions.map((s, idx) => (
                <div key={s.id} className={`border rounded-xl p-3.5 space-y-2.5 text-xs font-sans shadow-2xs ${
                  calendarTheme === 'dark'
                    ? 'bg-[#0f1d38] border-slate-700 text-slate-100'
                    : 'bg-white border-slate-200 text-slate-900'
                }`}>
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <span className={`font-bold flex items-center gap-2 text-sm ${
                      calendarTheme === 'dark' ? 'text-slate-100' : 'text-slate-900'
                    }`}>
                      <span className="w-6 h-6 rounded-full bg-blue-100 border border-blue-300 text-blue-950 text-xs font-mono font-black flex items-center justify-center">
                        {idx + 1}
                      </span>
                      {s.title}
                    </span>
                    <span className={`text-xs font-mono font-bold px-3 py-1 rounded-lg border shrink-0 ${
                      calendarTheme === 'dark'
                        ? 'text-sky-200 bg-blue-950/80 border-sky-700'
                        : 'text-blue-950 bg-blue-100 border-blue-300'
                    }`}>
                      ⏱️ {Math.floor(s.durationSeconds / 60)}m {s.durationSeconds % 60}s
                    </span>
                  </div>

                  {/* Start / End Timestamps */}
                  <div className={`flex flex-wrap items-center gap-3 text-xs font-mono p-2.5 rounded-xl border ${
                    calendarTheme === 'dark'
                      ? 'text-slate-300 bg-slate-900/90 border-slate-800'
                      : 'text-slate-800 bg-slate-100/90 border-slate-200'
                  }`}>
                    <span>🕒 {selectedLang === 'EN' ? 'Start:' : 'Inicio:'} <strong className={calendarTheme === 'dark' ? 'text-slate-100' : 'text-slate-950'}>{s.startTime}</strong></span>
                    <span>➔</span>
                    <span>🏁 {selectedLang === 'EN' ? 'End:' : 'Fin:'} <strong className={calendarTheme === 'dark' ? 'text-slate-100' : 'text-slate-950'}>{s.endTime}</strong></span>
                    <span className={`ml-auto font-bold ${calendarTheme === 'dark' ? 'text-slate-400' : 'text-slate-700'}`}>({s.messageCount} {selectedLang === 'EN' ? 'messages' : 'mensajes'})</span>
                  </div>

                  {/* Complete Transcript Dialogue Box */}
                  {s.messages && s.messages.length > 0 ? (
                    <div className="space-y-2 mt-2 max-h-48 overflow-y-auto pr-1 text-xs">
                      {s.messages.map((m, mIdx) => (
                        <div key={mIdx} className={`p-2.5 rounded-xl leading-relaxed ${
                          m.sender === 'user' 
                            ? calendarTheme === 'dark'
                              ? 'bg-blue-950/90 text-sky-100 text-right border border-sky-700/80 font-medium ml-6'
                              : 'bg-blue-100/90 text-blue-950 text-right border border-blue-300/80 font-medium ml-6'
                            : calendarTheme === 'dark'
                              ? 'bg-slate-900 text-slate-100 text-left border border-slate-800 font-medium mr-6'
                              : 'bg-slate-100 text-slate-900 text-left border border-slate-200/90 font-medium mr-6'
                        }`}>
                          <span className="text-[10px] font-mono font-bold block opacity-70 mb-0.5">
                            {m.sender === 'user' ? (selectedLang === 'EN' ? 'You' : 'Tú') : 'VOYAGER'}
                          </span>
                          <span>{m.text}</span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className={`text-xs italic ${calendarTheme === 'dark' ? 'text-slate-400' : 'text-slate-600'}`}>"{s.snippet}"</p>
                  )}

                  {onLoadChat && (
                    <div className="pt-1.5 flex justify-end">
                      <button
                        type="button"
                        onClick={() => {
                          onLoadChat(s.rawChat);
                          setSelectedDay(null);
                        }}
                        className="px-3.5 py-2 bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs rounded-xl transition-all flex items-center gap-2 shadow-xs cursor-pointer active:scale-95"
                      >
                        <Play className="w-3.5 h-3.5 fill-white" />
                        <span>{selectedLang === 'EN' ? 'Load Session Transcript' : 'Cargar Transcripción de Sesión'}</span>
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <p className="text-xs text-slate-400 italic text-center py-4">
              {selectedLang === 'EN' ? 'No active conversation recorded for this date.' : 'No hay conversación activa registrada en esta fecha.'}
            </p>
          )}
        </div>
      )}
    </div>
  );

  return calendarContent;
};
