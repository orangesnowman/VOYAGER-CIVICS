import React from 'react';
import { StudentSummary } from '../../services/teacherStudentService';
import { Mail, Volume2 } from 'lucide-react';

interface StudentCardProps {
  student: StudentSummary;
  isSelected: boolean;
  selectedLang: 'EN' | 'ES';
  onSelect: () => void;
  onHearReport?: (student: StudentSummary) => void;
}

export const StudentCard: React.FC<StudentCardProps> = ({
  student,
  isSelected,
  selectedLang,
  onSelect,
  onHearReport
}) => {
  return (
    <div
      onClick={onSelect}
      className={`p-4 rounded-xl border text-left transition-all cursor-pointer ${
        isSelected
          ? 'bg-amber-50/80 border-amber-400 shadow-sm ring-2 ring-amber-400/20'
          : 'bg-white border-neutral-200 hover:border-neutral-300 hover:bg-neutral-50/50'
      }`}
    >
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-3 min-w-0">
          <div 
            onClick={(e) => {
              e.stopPropagation();
              onSelect();
              if (onHearReport) onHearReport(student);
            }}
            className="w-10 h-10 rounded-xl bg-neutral-900 text-amber-300 font-bold flex items-center justify-center shrink-0 text-sm relative group/avatar hover:scale-105 transition-transform"
            title={selectedLang === 'EN' ? 'Click photo to hear Voyager report' : 'Haz clic para escuchar el informe de Voyager'}
          >
            {student.name.charAt(0).toUpperCase()}
            <div className="absolute inset-0 bg-black/40 rounded-xl opacity-0 group-hover/avatar:opacity-100 transition-opacity flex items-center justify-center pointer-events-none">
              <Volume2 className="w-4 h-4 text-amber-300 animate-pulse" />
            </div>
          </div>
          <div className="min-w-0">
            <h4 className="text-sm font-bold text-neutral-900 truncate">{student.name}</h4>
            <div className="flex items-center gap-1.5 text-xs text-neutral-500 truncate">
              <Mail className="w-3 h-3 text-neutral-400 shrink-0" />
              <span className="truncate">{student.email}</span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          <span className="px-2 py-0.5 rounded-md text-[11px] font-mono font-bold bg-neutral-100 text-neutral-800 uppercase">
            {student.cefrLevel || student.levelEstimate || 'B1'}
          </span>
          {onHearReport && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onSelect();
                onHearReport(student);
              }}
              className="p-1.5 rounded-lg bg-amber-100 hover:bg-amber-200 text-amber-900 transition-all cursor-pointer"
              title={selectedLang === 'EN' ? 'Hear Voyager Oral Report' : 'Escuchar Informe Oral Voyager'}
            >
              <Volume2 className="w-3.5 h-3.5 text-amber-800" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
