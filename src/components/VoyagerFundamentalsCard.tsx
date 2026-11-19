import React, { useState, useEffect } from 'react';
import { BookOpen, CheckCircle, Play, ArrowRight, Sparkles, RotateCcw } from 'lucide-react';
import {
  VOYAGER_FUNDAMENTALS_LESSONS,
  FundamentalsLesson,
  getCompletedFundamentals,
  getFundamentalsCompletionPercent,
} from '../data/voyagerFundamentalsData';
import { VoyagerFundamentalsModal } from './VoyagerFundamentalsModal';

interface VoyagerFundamentalsCardProps {
  selectedLang: string;
  onAskVoyager?: (prompt: string) => void;
  onActionTrigger?: (actionType: string) => void;
}

export const VoyagerFundamentalsCard: React.FC<VoyagerFundamentalsCardProps> = ({
  selectedLang,
  onAskVoyager,
  onActionTrigger,
}) => {
  const isEn = selectedLang === 'EN';
  const [completedIds, setCompletedIds] = useState<string[]>([]);
  const [activeLesson, setActiveLesson] = useState<FundamentalsLesson | null>(null);

  const loadProgress = () => {
    setCompletedIds(getCompletedFundamentals());
  };

  useEffect(() => {
    loadProgress();
    const handleUpdate = () => loadProgress();
    window.addEventListener('voyager_fundamentals_updated', handleUpdate);
    return () => window.removeEventListener('voyager_fundamentals_updated', handleUpdate);
  }, []);

  const totalLessons = VOYAGER_FUNDAMENTALS_LESSONS.length;
  const completedCount = completedIds.length;
  const isAllFinished = completedCount >= totalLessons;
  const percent = Math.round((completedCount / totalLessons) * 100);

  // Find next uncompleted lesson
  const nextLesson = VOYAGER_FUNDAMENTALS_LESSONS.find(l => !completedIds.includes(l.id)) || VOYAGER_FUNDAMENTALS_LESSONS[0];

  return (
    <div className="w-full bg-neutral-50/70 rounded-2xl p-5 sm:p-6 mb-8 text-left">
      {/* Top Banner Row */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4 pb-4 border-b border-neutral-200/60">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="text-xs font-semibold uppercase tracking-wider text-neutral-950 bg-amber-400 px-3 py-0.5 rounded-full">
              {isEn ? 'Recommended Starter Course' : 'Curso Inicial Recomendado'}
            </span>
            <span className="text-[13px] font-medium text-neutral-500">
              6 {isEn ? 'interactive lessons' : 'lecciones interactivas'} · ~45 min
            </span>
          </div>

          <h4 className="text-[19px] sm:text-[21px] font-bold text-neutral-900 leading-snug">
            {isEn
              ? 'Voyager Fundamentals — Learn English While Learning Voyager'
              : 'Fundamentos de Voyager — Aprende Inglés Mientras Aprendes Voyager'}
          </h4>
          <p className="text-[15px] text-neutral-600 font-sans mt-1 max-w-xl leading-relaxed">
            {isEn
              ? 'Master every feature of USA Voyager while building speaking confidence and core vocabulary.'
              : 'Domina cada herramienta de USA Voyager mientras desarrollas confianza al hablar y vocabulario clave.'}
          </p>
        </div>

        {/* Progress & CTA */}
        <div className="flex items-center gap-3 shrink-0 sm:self-center">
          {/* Progress Circular Badge */}
          <div className="flex items-center gap-2">
            <div className="relative w-9 h-9 sm:w-10 sm:h-10 flex items-center justify-center">
              <svg viewBox="0 0 36 36" className="w-full h-full -rotate-90">
                <path
                  className="text-neutral-200"
                  strokeWidth="3.5"
                  stroke="currentColor"
                  fill="none"
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                />
                <path
                  className="text-amber-400 transition-all duration-500"
                  strokeDasharray={`${percent}, 100`}
                  strokeWidth="3.5"
                  strokeLinecap="round"
                  stroke="currentColor"
                  fill="none"
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                />
              </svg>
              <span className="absolute text-[11px] font-bold text-neutral-900">
                {percent}%
              </span>
            </div>

            <div className="text-left font-sans">
              <span className="block text-[12px] font-bold text-neutral-900 leading-none">
                {completedCount} / {totalLessons}
              </span>
              <span className="text-[11px] text-neutral-500">
                {isEn ? 'Completed' : 'Completadas'}
              </span>
            </div>
          </div>

          {/* Primary Action Button — Voyager yellow capsule */}
          <button
            type="button"
            onClick={() => setActiveLesson(nextLesson)}
            className="px-4 py-2 bg-amber-400 hover:bg-amber-300 text-neutral-950 rounded-full font-bold text-xs flex items-center gap-1.5 transition-all active:scale-95 cursor-pointer"
          >
            <span>
              {isAllFinished
                ? (isEn ? 'Review Course' : 'Repasar Curso')
                : completedCount > 0
                ? (isEn ? 'Continue Course' : 'Continuar Curso')
                : (isEn ? 'Start Course' : 'Comenzar Curso')}
            </span>
            <ArrowRight className="w-3.5 h-3.5 text-neutral-950" />
          </button>
        </div>
      </div>

      {/* 6 Lessons Mini-Grid (Clean, unbordered) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
        {VOYAGER_FUNDAMENTALS_LESSONS.map((lesson) => {
          const isDone = completedIds.includes(lesson.id);

          return (
            <div
              key={lesson.id}
              onClick={() => setActiveLesson(lesson)}
              className={`p-3.5 rounded-xl transition-all cursor-pointer flex flex-col justify-between group ${
                isDone
                  ? 'bg-neutral-100/70 hover:bg-neutral-100'
                  : 'bg-white hover:bg-white/90'
              }`}
            >
              <div>
                <div className="flex items-center justify-between gap-1 mb-1.5">
                  <span className="text-[12px] font-medium text-neutral-500">
                    0{lesson.number} · {lesson.durationMinutes} min
                  </span>

                  {isDone ? (
                    <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full">
                      <CheckCircle className="w-3 h-3 text-emerald-600" />
                      <span>{isEn ? 'Done' : 'Listo'}</span>
                    </span>
                  ) : (
                    <span className="text-[12px] font-semibold text-neutral-400 group-hover:text-amber-600 transition-colors">
                      {isEn ? 'Start →' : 'Iniciar →'}
                    </span>
                  )}
                </div>

                <h5 className="text-[14px] font-bold text-neutral-900 group-hover:text-amber-600 transition-colors leading-snug">
                  {isEn ? lesson.titleEn : lesson.titleEs}
                </h5>

                <p className="text-[13px] text-neutral-600 font-sans mt-0.5 line-clamp-2 leading-relaxed">
                  {isEn ? lesson.subtitleEn : lesson.subtitleEs}
                </p>
              </div>

              <div className="mt-2.5 pt-2 border-t border-neutral-100 flex items-center justify-between text-[12px] text-neutral-500">
                <span className="truncate max-w-[170px]">
                  {isEn ? lesson.platformFeatureEn : lesson.platformFeatureEs}
                </span>
                <Play className="w-3.5 h-3.5 text-neutral-400 group-hover:text-black shrink-0 transition-colors" />
              </div>
            </div>
          );
        })}
      </div>

      {/* Lesson Interactive Modal */}
      {activeLesson && (
        <VoyagerFundamentalsModal
          lesson={activeLesson}
          selectedLang={selectedLang}
          allLessons={VOYAGER_FUNDAMENTALS_LESSONS}
          onClose={() => setActiveLesson(null)}
          onSelectLesson={(lesson) => setActiveLesson(lesson)}
          onAskVoyager={onAskVoyager}
          onActionTrigger={onActionTrigger}
        />
      )}
    </div>
  );
};
