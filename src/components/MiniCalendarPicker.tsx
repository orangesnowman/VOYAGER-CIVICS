import React, { useState, useEffect, useRef } from 'react';
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight, X, Lock } from 'lucide-react';

interface MiniCalendarPickerProps {
  value: string; // Format: YYYY-MM-DD
  onChange: (dateStr: string, calculatedAge: number) => void;
  selectedLang: 'EN' | 'ES';
}

const MONTHS_ES = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
];

const MONTHS_EN = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

const WEEKDAYS_ES = ['D', 'L', 'M', 'M', 'J', 'V', 'S'];
const WEEKDAYS_EN = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

export const calculateAgeFromDate = (dateStr: string): number => {
  if (!dateStr) return 63;
  const parts = dateStr.split('-');
  if (parts.length < 3) return 63;
  const birthYear = parseInt(parts[0], 10);
  const birthMonth = parseInt(parts[1], 10) - 1;
  const birthDay = parseInt(parts[2], 10);
  const today = new Date();
  let age = today.getFullYear() - birthYear;
  const m = today.getMonth() - birthMonth;
  if (m < 0 || (m === 0 && today.getDate() < birthDay)) {
    age--;
  }
  return Math.max(10, Math.min(100, isNaN(age) ? 63 : age));
};

export const MiniCalendarPicker: React.FC<MiniCalendarPickerProps> = ({
  value,
  onChange,
  selectedLang,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Parse initial year, month, day
  const initialParts = (value || '1963-05-15').split('-');
  const initialYear = parseInt(initialParts[0], 10) || 1963;
  const initialMonth = (parseInt(initialParts[1], 10) || 5) - 1;
  const initialDay = parseInt(initialParts[2], 10) || 15;

  const [viewYear, setViewYear] = useState<number>(initialYear);
  const [viewMonth, setViewMonth] = useState<number>(initialMonth);

  // Update view when value changes externally
  useEffect(() => {
    if (value) {
      const parts = value.split('-');
      if (parts.length === 3) {
        setViewYear(parseInt(parts[0], 10) || 1963);
        setViewMonth((parseInt(parts[1], 10) || 5) - 1);
      }
    }
  }, [value]);

  // Close calendar when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const months = selectedLang === 'EN' ? MONTHS_EN : MONTHS_ES;
  const weekdays = selectedLang === 'EN' ? WEEKDAYS_EN : WEEKDAYS_ES;

  // Days in month calculation
  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
  const firstDayOfWeek = new Date(viewYear, viewMonth, 1).getDay();

  // Selected date components
  const selectedParts = (value || '').split('-');
  const selectedYear = parseInt(selectedParts[0], 10);
  const selectedMonth = parseInt(selectedParts[1], 10) - 1;
  const selectedDay = parseInt(selectedParts[2], 10);

  const calculatedAge = calculateAgeFromDate(value);

  const handleSelectDay = (day: number) => {
    const formattedMonth = String(viewMonth + 1).padStart(2, '0');
    const formattedDay = String(day).padStart(2, '0');
    const dateStr = `${viewYear}-${formattedMonth}-${formattedDay}`;
    const age = calculateAgeFromDate(dateStr);
    onChange(dateStr, age);
    setIsOpen(false);
  };

  const handlePrevMonth = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (viewMonth === 0) {
      setViewMonth(11);
      setViewYear(prev => prev - 1);
    } else {
      setViewMonth(prev => prev - 1);
    }
  };

  const handleNextMonth = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (viewMonth === 11) {
      setViewMonth(0);
      setViewYear(prev => prev + 1);
    } else {
      setViewMonth(prev => prev + 1);
    }
  };

  // Generate list of years from current year down to 1920
  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: currentYear - 1920 + 1 }, (_, i) => currentYear - i);

  return (
    <div className="relative w-full" ref={containerRef}>
      {/* Input Display Bar */}
      <div
        onClick={() => setIsOpen(prev => !prev)}
        className="w-full h-[27px] px-2.5 py-0.5 bg-white border border-neutral-300 hover:border-neutral-500 rounded-lg flex items-center justify-between text-xs sm:text-[12.5px] cursor-pointer transition-colors select-none shadow-2xs group"
        title={selectedLang === 'EN' ? 'Click to select birth date with calendar' : 'Haz clic para seleccionar fecha con el calendario'}
      >
        <span className="font-semibold text-neutral-900 truncate">
          {value ? `${value} (${calculatedAge} ${selectedLang === 'EN' ? 'yrs' : 'años'})` : (selectedLang === 'EN' ? 'Select Date' : 'Seleccionar Fecha')}
        </span>
        <div className="flex items-center gap-1 text-neutral-500 group-hover:text-amber-600 transition-colors shrink-0">
          <CalendarIcon className="w-3.5 h-3.5 stroke-[2.2]" />
        </div>
      </div>

      {/* Mini Calendar Popover Dropdown */}
      {isOpen && (
        <div className="absolute left-0 sm:left-auto sm:right-0 top-full mt-1.5 z-50 w-[275px] sm:w-[290px] bg-white rounded-xl shadow-xl border border-neutral-300 p-3 animate-fade-in text-neutral-900">
          {/* Calendar Header with Selectors */}
          <div className="flex items-center justify-between gap-1 mb-2.5 pb-2 border-b border-neutral-200">
            <button
              type="button"
              onClick={handlePrevMonth}
              className="p-1 rounded-md hover:bg-neutral-100 text-neutral-700 transition-colors cursor-pointer"
              aria-label="Previous month"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>

            <div className="flex items-center gap-1.5 text-xs font-bold">
              {/* Month Selector */}
              <select
                value={viewMonth}
                onChange={(e) => setViewMonth(parseInt(e.target.value, 10))}
                className="bg-neutral-100 hover:bg-neutral-200 text-neutral-900 font-semibold px-2 py-1 rounded-md text-xs cursor-pointer border-0 outline-hidden transition-colors"
              >
                {months.map((m, idx) => (
                  <option key={idx} value={idx}>
                    {m}
                  </option>
                ))}
              </select>

              {/* Year Selector */}
              <select
                value={viewYear}
                onChange={(e) => setViewYear(parseInt(e.target.value, 10))}
                className="bg-neutral-100 hover:bg-neutral-200 text-neutral-900 font-semibold px-2 py-1 rounded-md text-xs cursor-pointer border-0 outline-hidden transition-colors"
              >
                {years.map((y) => (
                  <option key={y} value={y}>
                    {y}
                  </option>
                ))}
              </select>
            </div>

            <button
              type="button"
              onClick={handleNextMonth}
              className="p-1 rounded-md hover:bg-neutral-100 text-neutral-700 transition-colors cursor-pointer"
              aria-label="Next month"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          {/* Weekday Names */}
          <div className="grid grid-cols-7 gap-1 text-center mb-1">
            {weekdays.map((wd, i) => (
              <span key={i} className="text-[10px] font-bold text-neutral-400 select-none">
                {wd}
              </span>
            ))}
          </div>

          {/* Days Grid */}
          <div className="grid grid-cols-7 gap-1 text-center">
            {/* Empty slots before the first day */}
            {Array.from({ length: firstDayOfWeek }).map((_, i) => (
              <div key={`empty-${i}`} className="w-8 h-7" />
            ))}

            {/* Days of month */}
            {Array.from({ length: daysInMonth }).map((_, i) => {
              const day = i + 1;
              const isSelected =
                viewYear === selectedYear &&
                viewMonth === selectedMonth &&
                day === selectedDay;

              return (
                <button
                  key={day}
                  type="button"
                  onClick={() => handleSelectDay(day)}
                  className={`w-8 h-7 rounded-md text-xs font-semibold flex items-center justify-center transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-amber-400 text-black font-bold shadow-xs'
                      : 'hover:bg-neutral-100 text-neutral-800'
                  }`}
                >
                  {day}
                </button>
              );
            })}
          </div>

          {/* Calendar Footer: Privacy & Internal Records Note */}
          <div className="mt-2.5 pt-2 border-t border-neutral-100 flex items-center justify-between text-[10px] text-neutral-500">
            <span className="flex items-center gap-1 truncate text-neutral-500 font-medium">
              <Lock className="w-3 h-3 text-neutral-400 shrink-0" />
              {selectedLang === 'EN' ? 'Internal record only' : 'Solo registro interno'}
            </span>
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="text-neutral-700 hover:text-black font-bold hover:underline cursor-pointer"
            >
              {selectedLang === 'EN' ? 'Done' : 'Listo'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
