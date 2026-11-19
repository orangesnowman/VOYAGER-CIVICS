import React from 'react';
import { 
  Award, 
  CheckCircle2, 
  AlertTriangle, 
  RotateCcw, 
  Compass, 
  X, 
  TrendingUp, 
  Sparkles,
  BarChart3,
  Calendar,
  Clock
} from 'lucide-react';
import { LessonEvaluationRecord } from '../domain/LessonGradingSystem';

export interface EndLessonEvaluationModalProps {
  evaluation: LessonEvaluationRecord | null;
  isOpen: boolean;
  onClose: () => void;
  onRepeatLesson: () => void;
  onViewInJourney: () => void;
  selectedLang: 'EN' | 'ES';
  previousAttempts?: LessonEvaluationRecord[];
}

export const EndLessonEvaluationModal: React.FC<EndLessonEvaluationModalProps> = ({
  evaluation,
  isOpen,
  onClose,
  onRepeatLesson,
  onViewInJourney,
  selectedLang,
  previousAttempts = []
}) => {
  if (!isOpen || !evaluation) return null;

  const isEn = selectedLang === 'EN';
  const isPassed = evaluation.passed;

  // Grade color theme
  let gradeBg = 'bg-emerald-50 border-emerald-300 text-emerald-800';
  let badgeBg = 'bg-emerald-600 text-white';
  if (evaluation.letterGrade.startsWith('C')) {
    gradeBg = 'bg-sky-50 border-sky-300 text-sky-800';
    badgeBg = 'bg-sky-600 text-white';
  } else if (evaluation.letterGrade.startsWith('D') || evaluation.letterGrade === 'F') {
    gradeBg = 'bg-rose-50 border-rose-300 text-rose-800';
    badgeBg = 'bg-rose-600 text-white';
  }

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/60 backdrop-blur-xs select-none animate-fade-in font-['Raleway']">
      <div 
        className="w-full max-w-xl max-h-[90vh] bg-white rounded-2xl shadow-2xl border border-slate-200 flex flex-col overflow-hidden text-slate-800 animate-scale-in"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="px-5 py-3.5 border-b border-slate-200/80 bg-slate-50 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center">
              <Award className="w-5 h-5 stroke-[2.2]" />
            </div>
            <div>
              <h2 className="text-sm sm:text-base font-bold text-slate-900 leading-tight">
                {isEn ? 'Lesson Evaluation & Grade' : 'Evaluación y Calificación de Lección'}
              </h2>
              <p className="text-[11px] text-slate-500 font-normal">
                {evaluation.lessonTitle} • {isEn ? `Attempt #${evaluation.attemptNumber}` : `Intento #${evaluation.attemptNumber}`}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-slate-800 hover:bg-slate-200/60 rounded-lg transition-colors cursor-pointer"
            title={isEn ? 'Close' : 'Cerrar'}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Scrollable Body */}
        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4 no-scrollbar">
          {/* Main Grade Hero Card */}
          <div className={`p-4 rounded-xl border ${gradeBg} flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-xs`}>
            <div className="flex items-center gap-3.5">
              <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-white border border-current/20 shadow-sm flex flex-col items-center justify-center shrink-0">
                <span className="text-3xl sm:text-4xl font-black tracking-tight leading-none">
                  {evaluation.letterGrade}
                </span>
                <span className="text-[11px] font-mono font-bold mt-0.5 opacity-80">
                  {evaluation.numericalScore}%
                </span>
              </div>

              <div>
                <div className="flex items-center gap-2">
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${badgeBg}`}>
                    {isPassed 
                      ? (isEn ? 'Passed' : 'Aprobado') 
                      : (isEn ? 'Needs Improvement' : 'No Aprobado')}
                  </span>
                  <span className="text-xs font-semibold">
                    {evaluation.resultLabel}
                  </span>
                </div>
                <p className="text-xs mt-1.5 opacity-90 max-w-sm leading-relaxed">
                  {evaluation.explanation}
                </p>
              </div>
            </div>

            {/* Quick Session Stats */}
            <div className="flex sm:flex-col items-center sm:items-end gap-3 sm:gap-1 text-[11px] font-mono shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-current/20 w-full sm:w-auto justify-between sm:justify-start">
              <span className="flex items-center gap-1 opacity-80">
                <Clock className="w-3.5 h-3.5" />
                <span>{formatDuration(evaluation.durationSeconds)}</span>
              </span>
              <span className="flex items-center gap-1 opacity-80">
                <Calendar className="w-3.5 h-3.5" />
                <span>{new Date(evaluation.date).toLocaleDateString()}</span>
              </span>
            </div>
          </div>

          {/* Criteria Rubric Breakdown (Compact & Flush Left) */}
          <div className="p-3.5 bg-slate-50/80 rounded-xl border border-slate-200/80">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 mb-2.5 flex items-center gap-1.5">
              <BarChart3 className="w-3.5 h-3.5 text-blue-600" />
              <span>{isEn ? 'Evaluation Rubric Breakdown' : 'Desglose por Criterios Pedagógicos'}</span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-left">
              {[
                { label: isEn ? 'Objective Mastery (STAR)' : 'Cumplimiento de Objetivos (STAR)', val: evaluation.criteriaScores.objectiveCompletion },
                { label: isEn ? 'Vocabulary & Register' : 'Vocabulario y Registro', val: evaluation.criteriaScores.vocabulary },
                { label: isEn ? 'Fluency & Confidence' : 'Fluidez y Confianza', val: evaluation.criteriaScores.fluency },
                { label: isEn ? 'Comprehension & Relevance' : 'Comprensión y Relevancia', val: evaluation.criteriaScores.comprehension },
                { label: isEn ? 'Grammar Accuracy' : 'Precisión Gramatical', val: evaluation.criteriaScores.grammar },
                { label: isEn ? 'Pronunciation Clarity' : 'Pronunciación y Fonética', val: evaluation.criteriaScores.pronunciation },
              ].map((crit, idx) => (
                <div key={idx} className="bg-white p-2 rounded-lg border border-slate-200/60 shadow-2xs text-left">
                  <div className="flex items-center justify-between text-[11px] font-semibold text-slate-800 mb-1">
                    <span className="truncate pr-1">{crit.label}</span>
                    <span className="font-mono text-blue-600">{crit.val}%</span>
                  </div>
                  <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
                    <div 
                      className={`h-full rounded-full transition-all duration-500 ${
                        crit.val >= 80 ? 'bg-emerald-500' : crit.val >= 70 ? 'bg-blue-500' : 'bg-amber-500'
                      }`}
                      style={{ width: `${Math.min(100, crit.val)}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Qualitative Feedback: Strengths & Areas to Improve */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-left">
            {/* Strengths */}
            <div className="p-3 bg-emerald-50/50 rounded-xl border border-emerald-200/70 text-left">
              <h4 className="text-xs font-bold text-emerald-900 mb-1.5 flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                <span>{isEn ? 'Skills Demonstrated' : 'Habilidades Demostradas'}</span>
              </h4>
              <ul className="space-y-1 text-xs text-emerald-950 font-normal">
                {evaluation.strengths.map((str, idx) => (
                  <li key={idx} className="flex items-start gap-1.5">
                    <span className="text-emerald-500 font-bold">•</span>
                    <span>{str}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Areas to Improve */}
            <div className="p-3 bg-amber-50/50 rounded-xl border border-amber-200/70 text-left">
              <h4 className="text-xs font-bold text-amber-900 mb-1.5 flex items-center gap-1.5">
                <AlertTriangle className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                <span>{isEn ? 'Areas Needing Improvement' : 'Áreas por Mejorar'}</span>
              </h4>
              <ul className="space-y-1 text-xs text-amber-950 font-normal">
                {evaluation.areasToImprove.map((area, idx) => (
                  <li key={idx} className="flex items-start gap-1.5">
                    <span className="text-amber-500 font-bold">•</span>
                    <span>{area}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Actionable Recommendations */}
          {evaluation.recommendations.length > 0 && (
            <div className="p-3.5 bg-blue-50/50 rounded-xl border border-blue-200/70 text-left">
              <h4 className="text-xs font-bold text-blue-900 mb-1.5 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                <span>{isEn ? 'Recommendations for Practice' : 'Recomendaciones para tu Práctica'}</span>
              </h4>
              <ul className="space-y-1 text-xs text-blue-950 font-normal">
                {evaluation.recommendations.map((rec, idx) => (
                  <li key={idx} className="flex items-start gap-1.5">
                    <span className="text-blue-500 font-bold">→</span>
                    <span>{rec}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Historical Attempts Progression if multiple exist */}
          {previousAttempts.length > 0 && (
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-left">
              <div className="flex items-center justify-between text-xs font-bold text-slate-700 mb-1.5">
                <span className="flex items-center gap-1">
                  <TrendingUp className="w-3.5 h-3.5 text-slate-500" />
                  <span>{isEn ? 'Attempt History for this Lesson' : 'Historial de Intentos de esta Lección'}</span>
                </span>
                <span className="text-[11px] font-mono text-slate-500 font-normal">
                  {previousAttempts.length + 1} {isEn ? 'total attempts' : 'intentos totales'}
                </span>
              </div>
              <div className="space-y-1 text-xs">
                {/* Current attempt */}
                <div className="flex items-center justify-between py-1 px-2 rounded-lg bg-white border border-blue-200 font-semibold text-blue-900">
                  <span>{isEn ? `Attempt #${evaluation.attemptNumber} (Current)` : `Intento #${evaluation.attemptNumber} (Actual)`}</span>
                  <span className="font-mono">{evaluation.letterGrade} ({evaluation.numericalScore}%)</span>
                </div>
                {/* Previous attempts */}
                {previousAttempts.map((att) => (
                  <div key={att.id} className="flex items-center justify-between py-1 px-2 rounded-lg text-slate-600 font-normal">
                    <span>{isEn ? `Attempt #${att.attemptNumber}` : `Intento #${att.attemptNumber}`} ({new Date(att.date).toLocaleDateString()})</span>
                    <span className="font-mono">{att.letterGrade} ({att.numericalScore}%)</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer Actions */}
        <div className="px-5 py-3 border-t border-slate-200 bg-slate-50 flex flex-wrap items-center justify-between gap-2 shrink-0">
          <button
            type="button"
            onClick={onViewInJourney}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold text-slate-700 hover:text-slate-950 hover:bg-slate-200/70 transition-colors cursor-pointer"
          >
            <Compass className="w-4 h-4 text-slate-600" />
            <span>{isEn ? 'View in My Journey' : 'Ver en Mi Trayectoria'}</span>
          </button>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onRepeatLesson}
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold text-slate-800 bg-white border border-slate-300 hover:border-slate-400 hover:bg-slate-100 transition-all shadow-2xs cursor-pointer active:scale-95"
            >
              <RotateCcw className="w-3.5 h-3.5 text-slate-600" />
              <span>{isEn ? 'Repeat Lesson (Improve Grade)' : 'Repetir Lección (Mejorar Nota)'}</span>
            </button>

            <button
              type="button"
              onClick={onClose}
              className="flex items-center gap-1 px-4 py-1.5 rounded-xl text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 transition-all shadow-xs cursor-pointer active:scale-95"
            >
              <span>{isEn ? 'Continue' : 'Continuar'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EndLessonEvaluationModal;
