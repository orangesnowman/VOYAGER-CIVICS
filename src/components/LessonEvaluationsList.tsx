import React, { useState } from 'react';
import { 
  Award, 
  CheckCircle2, 
  AlertTriangle, 
  ChevronDown, 
  ChevronUp, 
  Clock, 
  Calendar, 
  RotateCcw, 
  BarChart3, 
  Sparkles, 
  Layers,
  ArrowRight
} from 'lucide-react';
import { LessonEvaluationRecord } from '../domain/LessonGradingSystem';

export interface LessonEvaluationsListProps {
  attempts: LessonEvaluationRecord[];
  selectedLang: 'EN' | 'ES';
  onStartLesson?: (lesson: any) => void;
  onAskVoyager?: (prompt: string) => void;
}

export const LessonEvaluationsList: React.FC<LessonEvaluationsListProps> = ({
  attempts,
  selectedLang,
  onStartLesson,
  onAskVoyager
}) => {
  const isEn = selectedLang === 'EN';
  const [expandedId, setExpandedId] = useState<string | null>(attempts[0]?.id || null);

  const toggleExpand = (id: string) => {
    setExpandedId(prev => prev === id ? null : id);
  };

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  // Summary statistics
  const totalEvaluations = attempts.length;
  const passedCount = attempts.filter(a => a.passed).length;
  const passRate = totalEvaluations > 0 ? Math.round((passedCount / totalEvaluations) * 100) : 0;
  const avgScore = totalEvaluations > 0 
    ? Math.round(attempts.reduce((sum, a) => sum + a.numericalScore, 0) / totalEvaluations) 
    : 0;

  if (totalEvaluations === 0) {
    return (
      <div className="p-6 bg-slate-50 rounded-2xl border border-slate-200 text-center space-y-3 font-['Raleway']">
        <div className="w-12 h-12 rounded-2xl bg-blue-100 text-blue-600 flex items-center justify-center mx-auto">
          <Award className="w-6 h-6 stroke-[2]" />
        </div>
        <div>
          <h3 className="text-sm sm:text-base font-bold text-slate-900">
            {isEn ? 'No Evaluated Lessons Yet' : 'Aún no tienes evaluaciones de lecciones'}
          </h3>
          <p className="text-xs text-slate-600 max-w-md mx-auto mt-1 font-normal leading-relaxed">
            {isEn
              ? 'Complete sufficient interactive practice with Voyager in any lesson to receive an official American Letter Grade (A–F) and detailed rubric evaluation.'
              : 'Completa suficiente práctica interactiva con Voyager en cualquier lección para recibir tu Calificación con Letra Americana (A–F) y evaluación detallada de rúbrica.'}
          </p>
        </div>

        <div className="pt-2">
          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-white border border-slate-200 text-slate-700 shadow-2xs">
            <Sparkles className="w-3.5 h-3.5 text-blue-600" />
            <span>{isEn ? 'Minimum passing grade: C (70%)' : 'Calificación mínima aprobatoria: C (70%)'}</span>
          </span>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-3 font-['Raleway'] text-slate-800 animate-fade-in text-left">
      {/* Overview Metric Highlights */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-left">
        <div className="p-2.5 bg-white rounded-xl border border-slate-200 shadow-2xs text-left">
          <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-slate-500 block">
            {isEn ? 'Evaluations' : 'Evaluaciones'}
          </span>
          <span className="text-lg font-black text-slate-900 font-mono">
            {totalEvaluations}
          </span>
        </div>

        <div className="p-2.5 bg-white rounded-xl border border-slate-200 shadow-2xs text-left">
          <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-slate-500 block">
            {isEn ? 'Average Score' : 'Promedio'}
          </span>
          <span className="text-lg font-black text-blue-600 font-mono">
            {avgScore}%
          </span>
        </div>

        <div className="p-2.5 bg-white rounded-xl border border-slate-200 shadow-2xs text-left">
          <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-slate-500 block">
            {isEn ? 'Passing Rate' : 'Tasa de Aprobación'}
          </span>
          <span className={`text-lg font-black font-mono ${passRate >= 70 ? 'text-emerald-600' : 'text-amber-600'}`}>
            {passRate}%
          </span>
        </div>

        <div className="p-2.5 bg-white rounded-xl border border-slate-200 shadow-2xs text-left">
          <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-slate-500 block">
            {isEn ? 'Min. Passing Grade' : 'Mínimo Aprobatorio'}
          </span>
          <span className="text-lg font-black text-slate-900 font-mono">
            C (70%)
          </span>
        </div>
      </div>

      {/* Attempts List */}
      <div className="space-y-2.5 max-h-[460px] overflow-y-auto pr-1 no-scrollbar text-left">
        {attempts.map((att) => {
          const isExpanded = expandedId === att.id;
          const isPassed = att.passed;

          let gradeBadgeColor = 'bg-emerald-600 text-white';
          let borderAccent = 'border-emerald-300';
          if (att.letterGrade.startsWith('C')) {
            gradeBadgeColor = 'bg-sky-600 text-white';
            borderAccent = 'border-sky-300';
          } else if (att.letterGrade.startsWith('D') || att.letterGrade === 'F') {
            gradeBadgeColor = 'bg-rose-600 text-white';
            borderAccent = 'border-rose-300';
          }

          return (
            <div
              key={att.id}
              className={`rounded-xl border transition-all bg-white shadow-2xs text-left ${
                isExpanded ? `${borderAccent} ring-1 ring-blue-100` : 'border-slate-200 hover:border-slate-300'
              }`}
            >
              {/* Card Header Row */}
              <div 
                onClick={() => toggleExpand(att.id)}
                className="p-3 sm:p-3.5 flex items-start justify-between gap-3 cursor-pointer select-none text-left"
              >
                <div className="flex items-start gap-3 min-w-0">
                  {/* Grade Icon Badge */}
                  <div className={`w-11 h-11 sm:w-12 sm:h-12 rounded-xl ${gradeBadgeColor} flex flex-col items-center justify-center shrink-0 shadow-xs`}>
                    <span className="text-base sm:text-lg font-black leading-none">{att.letterGrade}</span>
                    <span className="text-[9px] font-mono opacity-90 mt-0.5">{att.numericalScore}%</span>
                  </div>

                  <div className="min-w-0 text-left">
                    <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
                      <h4 className="text-xs sm:text-sm font-bold text-slate-900 truncate">
                        {att.lessonTitle}
                      </h4>
                      <span className={`px-1.5 py-0.2 rounded text-[10px] font-bold uppercase tracking-wider ${
                        isPassed ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
                      }`}>
                        {isPassed ? (isEn ? 'Passed' : 'Aprobado') : (isEn ? 'Needs Improvement' : 'No Aprobado')}
                      </span>
                    </div>

                    {/* Metadata Row */}
                    <div className="flex flex-wrap items-center gap-2.5 mt-1 text-[11px] font-mono text-slate-500">
                      <span className="px-1.5 py-0.2 rounded bg-slate-100 text-slate-700 font-bold">
                        {isEn ? `Attempt #${att.attemptNumber}` : `Intento #${att.attemptNumber}`}
                      </span>
                      {att.level && (
                        <span className="text-blue-600 font-bold">
                          {att.level}
                        </span>
                      )}
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3 text-slate-400" />
                        <span>{formatDuration(att.durationSeconds)}</span>
                      </span>
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3 h-3 text-slate-400" />
                        <span>{new Date(att.date).toLocaleDateString()}</span>
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-1 shrink-0 pt-1">
                  <button
                    type="button"
                    className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100"
                    title={isExpanded ? 'Collapse' : 'Expand'}
                  >
                    {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Expanded Rubric & Qualitative Breakdown */}
              {isExpanded && (
                <div className="px-3.5 pb-3.5 pt-1 border-t border-slate-100 space-y-3 animate-fade-in text-left">
                  {/* Explanation */}
                  <p className="text-xs text-slate-700 bg-slate-50 p-2.5 rounded-lg border border-slate-200/70 leading-relaxed font-normal text-left">
                    {att.explanation}
                  </p>

                  {/* 6 Criteria Breakdown */}
                  <div className="space-y-1.5 text-left">
                    <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-slate-500 block">
                      {isEn ? 'Rubric Criteria Scores' : 'Puntuación por Criterios'}
                    </span>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5 text-left">
                      {[
                        { label: isEn ? 'Objective' : 'Objetivo', val: att.criteriaScores.objectiveCompletion },
                        { label: isEn ? 'Vocabulary' : 'Vocabulario', val: att.criteriaScores.vocabulary },
                        { label: isEn ? 'Fluency' : 'Fluidez', val: att.criteriaScores.fluency },
                        { label: isEn ? 'Comprehension' : 'Comprensión', val: att.criteriaScores.comprehension },
                        { label: isEn ? 'Grammar' : 'Gramática', val: att.criteriaScores.grammar },
                        { label: isEn ? 'Pronunciation' : 'Pronunciación', val: att.criteriaScores.pronunciation },
                      ].map((crit, idx) => (
                        <div key={idx} className="bg-slate-50 p-1.5 rounded-lg border border-slate-200 text-left">
                          <div className="flex items-center justify-between text-[10px] font-semibold text-slate-700">
                            <span className="truncate">{crit.label}</span>
                            <span className="font-mono text-blue-600">{crit.val}%</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Strengths & Recommendations */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-left">
                    {att.strengths.length > 0 && (
                      <div className="p-2 rounded-lg bg-emerald-50/60 border border-emerald-200 text-left">
                        <span className="text-[10px] font-bold text-emerald-900 block mb-1">
                          {isEn ? 'Skills Demonstrated' : 'Habilidades Demostradas'}
                        </span>
                        <ul className="text-[11px] text-emerald-950 space-y-0.5 font-normal">
                          {att.strengths.map((str, idx) => (
                            <li key={idx}>• {str}</li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {att.recommendations.length > 0 && (
                      <div className="p-2 rounded-lg bg-blue-50/60 border border-blue-200 text-left">
                        <span className="text-[10px] font-bold text-blue-900 block mb-1">
                          {isEn ? 'Recommendations' : 'Recomendaciones'}
                        </span>
                        <ul className="text-[11px] text-blue-950 space-y-0.5 font-normal">
                          {att.recommendations.map((rec, idx) => (
                            <li key={idx}>→ {rec}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>

                  {/* Actions for this lesson */}
                  {onStartLesson && (
                    <div className="pt-1 flex items-center justify-end gap-2 text-left">
                      <button
                        type="button"
                        onClick={() => onStartLesson({
                          id: att.lessonId,
                          title: att.lessonTitle,
                          category: att.category,
                          level: att.level
                        })}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold text-slate-800 bg-slate-100 hover:bg-slate-200 transition-colors cursor-pointer"
                      >
                        <RotateCcw className="w-3.5 h-3.5" />
                        <span>{isEn ? 'Practice Again (Improve Grade)' : 'Practicar Nuevamente (Mejorar Nota)'}</span>
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default LessonEvaluationsList;
