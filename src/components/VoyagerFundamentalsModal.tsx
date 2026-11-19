import React, { useState } from 'react';
import { X, Volume2, Play, CheckCircle, CheckCircle2, ArrowRight, ArrowLeft, HelpCircle, Sparkles, BookOpen, MessageSquare, Compass, Award } from 'lucide-react';
import { FundamentalsLesson, markFundamentalsLessonCompleted, isFundamentalsCompleted } from '../data/voyagerFundamentalsData';

interface VoyagerFundamentalsModalProps {
  lesson: FundamentalsLesson;
  selectedLang: string;
  onClose: () => void;
  onSelectLesson: (lesson: FundamentalsLesson) => void;
  allLessons: FundamentalsLesson[];
  onAskVoyager?: (prompt: string) => void;
  onActionTrigger?: (actionType: string) => void;
}

export const VoyagerFundamentalsModal: React.FC<VoyagerFundamentalsModalProps> = ({
  lesson,
  selectedLang,
  onClose,
  onSelectLesson,
  allLessons,
  onAskVoyager,
  onActionTrigger,
}) => {
  const isEn = selectedLang === 'EN';
  const [scriptLang, setScriptLang] = useState<'EN' | 'ES'>(isEn ? 'EN' : 'ES');
  const [selectedAnswers, setSelectedAnswers] = useState<Record<string, number>>({});
  const [showAnswers, setShowAnswers] = useState<Record<string, boolean>>({});
  const [isCompleted, setIsCompleted] = useState<boolean>(() => isFundamentalsCompleted(lesson.id));
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);

  const handlePlayScriptAudio = () => {
    setIsPlayingAudio(true);
    const textToSpeak = scriptLang === 'EN' ? lesson.videoScriptEn : lesson.videoScriptEs;

    if (onAskVoyager) {
      const prompt = isEn
        ? `[VOYAGER_FUNDAMENTALS: Read aloud the following introductory lesson script with encouraging clarity]: "${lesson.videoScriptEn}"`
        : `[VOYAGER_FUNDAMENTALS: Lee en voz alta el siguiente guion de lección introductoria con claridad y entusiasmo]: "${lesson.videoScriptEs}"`;
      onAskVoyager(prompt);
      setTimeout(() => setIsPlayingAudio(false), 4000);
    } else {
      if (typeof window !== 'undefined' && window.speechSynthesis) {
        try { window.speechSynthesis.cancel(); } catch (e) {}
      }
      setIsPlayingAudio(false);
    }
  };

  const handleSelectOption = (questionId: string, optionIndex: number) => {
    setSelectedAnswers(prev => ({ ...prev, [questionId]: optionIndex }));
    setShowAnswers(prev => ({ ...prev, [questionId]: true }));
  };

  const handleCompleteCurrentLesson = () => {
    markFundamentalsLessonCompleted(lesson.id);
    setIsCompleted(true);

    // If there is a next lesson, prompt or advance
    const currentIndex = allLessons.findIndex(l => l.id === lesson.id);
    if (currentIndex >= 0 && currentIndex < allLessons.length - 1) {
      onSelectLesson(allLessons[currentIndex + 1]);
    } else {
      setTimeout(() => {
        onClose();
      }, 700);
    }
  };

  const handleTriggerAction = () => {
    if (onActionTrigger) {
      onActionTrigger(lesson.actionType);
    }

    if (lesson.actionType === 'voice_test' && onAskVoyager) {
      onAskVoyager(
        isEn
          ? "[AUTO_SYSTEM: The student is completing Lesson 3 of Voyager Fundamentals. Greet them warmly in American English, introduce your role as their voice tutor, and ask how their day is going in simple conversational English.]"
          : "[AUTO_SYSTEM: El estudiante está completando la Lección 3 de Fundamentos de Voyager. Salúdalo cálidamente en inglés americano, preséntate como su tutor de voz y pregúntale cómo va su día en inglés conversacional sencillo.]"
      );
      onClose();
    } else if (lesson.actionType === 'edit_profile') {
      onClose();
      // Dispatch or scroll to profile
      const profElem = document.querySelector('.profile-details');
      if (profElem) {
        profElem.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    } else if (lesson.actionType === 'teacher_mail') {
      onClose();
      const mailBtn = document.querySelector('button[title*="Comunicación Interna"], button[title*="Internal Communication"]') as HTMLElement;
      if (mailBtn) mailBtn.click();
    } else if (lesson.actionType === 'inspect_metrics') {
      onClose();
      const metricsElem = document.querySelector('h4');
      if (metricsElem) {
        metricsElem.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    } else {
      // General feedback
      onClose();
    }
  };

  const currentIndex = allLessons.findIndex(l => l.id === lesson.id);
  const prevLesson = currentIndex > 0 ? allLessons[currentIndex - 1] : null;
  const nextLesson = currentIndex < allLessons.length - 1 ? allLessons[currentIndex + 1] : null;

  return (
    <div
      className="fixed inset-0 z-50 bg-neutral-950/70 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 animate-fade-in"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl max-w-2xl w-full max-h-[92vh] flex flex-col shadow-2xl border-2 border-neutral-200 text-left relative animate-scale-up overflow-hidden"
        onClick={e => e.stopPropagation()}
      >
        {/* Top Sticky Header */}
        <div className="p-4 sm:p-5 border-b border-neutral-100 flex items-start justify-between gap-4 bg-white sticky top-0 z-10">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-amber-700 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-full">
                {isEn ? `Lesson ${lesson.number} of 6` : `Lección ${lesson.number} de 6`}
              </span>
              <span className="text-[10.5px] font-mono font-bold text-neutral-500">
                {lesson.durationMinutes} min · {isEn ? 'Fundamentals' : 'Fundamentos'}
              </span>
              {isCompleted && (
                <span className="text-[10px] font-mono font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full flex items-center gap-1">
                  <CheckCircle className="w-3 h-3 text-emerald-600" />
                  <span>{isEn ? 'Completed' : 'Completada'}</span>
                </span>
              )}
            </div>
            <h3 className="text-base sm:text-lg font-bold text-neutral-900 leading-tight">
              {isEn ? lesson.titleEn : lesson.titleEs}
            </h3>
            <p className="text-xs text-neutral-600 font-sans mt-0.5 leading-snug">
              {isEn ? lesson.subtitleEn : lesson.subtitleEs}
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-full text-neutral-400 hover:text-neutral-800 hover:bg-neutral-100 transition-colors cursor-pointer shrink-0"
            title={isEn ? 'Close' : 'Cerrar'}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Scrollable Body */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-5 text-neutral-800 text-xs sm:text-[13px] leading-relaxed">
          
          {/* Pedagogical Objective */}
          <div className="p-3 bg-neutral-50 border border-neutral-200/80 rounded-xl">
            <span className="text-[10.5px] font-mono font-bold uppercase tracking-wider text-neutral-500 block mb-1">
              {isEn ? 'Objective' : 'Objetivo Pedagógico'}
            </span>
            <p className="text-xs font-medium text-neutral-900">
              {isEn ? lesson.objectiveEn : lesson.objectiveEs}
            </p>
          </div>

          {/* Section 1: Video Presentation Placeholder */}
          <div className="border border-neutral-200 rounded-xl overflow-hidden bg-neutral-900 text-white">
            {/* 16:9 Video Canvas Placeholder */}
            <div className="relative aspect-video bg-gradient-to-br from-neutral-950 via-[#0B1530] to-neutral-900 flex flex-col items-center justify-center p-4 text-center">
              <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-full bg-amber-400 text-neutral-950 flex items-center justify-center mb-3 shadow-lg group hover:scale-105 transition-transform cursor-pointer"
                onClick={handlePlayScriptAudio}
                title={isEn ? 'Play video presentation audio' : 'Reproducir audio de presentación'}
              >
                <Play className="w-5 h-5 sm:w-6 sm:h-6 fill-current ml-0.5" />
              </div>

              <div className="max-w-md px-2">
                <span className="text-[10px] font-mono font-bold uppercase tracking-widest text-amber-400 block mb-1">
                  {lesson.videoPresenter}
                </span>
                <h4 className="text-xs sm:text-sm font-bold text-neutral-100 line-clamp-2">
                  {isEn ? lesson.videoPlaceholderTextEn : lesson.videoPlaceholderTextEs}
                </h4>
                <p className="text-[11px] text-neutral-400 mt-1 font-mono">
                  {isEn ? 'Video Player Placeholder · Audio Voice Ready' : 'Espacio de Video · Audio y Voz Listos'}
                </p>
              </div>

              {/* Bottom Video Controls Bar */}
              <div className="absolute bottom-2 left-3 right-3 flex items-center justify-between text-[11px] font-mono text-neutral-300 bg-neutral-950/60 backdrop-blur-xs px-2.5 py-1 rounded-lg">
                <span className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                  <span>{lesson.durationMinutes}:00</span>
                </span>
                <span className="text-[10px] text-neutral-400">
                  USA Voyager Interactive Classroom
                </span>
              </div>
            </div>

            {/* Video Script Presentation Box */}
            <div className="p-3 sm:p-4 bg-neutral-900 border-t border-neutral-800">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <span className="text-[10.5px] font-mono font-bold text-neutral-400 uppercase">
                    {isEn ? 'Lesson Script' : 'Guion de la Lección'}
                  </span>
                  <div className="inline-flex rounded-md p-0.5 bg-neutral-800 border border-neutral-700">
                    <button
                      type="button"
                      onClick={() => setScriptLang('EN')}
                      className={`px-2 py-0.5 text-[10px] font-mono rounded font-bold cursor-pointer ${
                        scriptLang === 'EN' ? 'bg-amber-400 text-neutral-950' : 'text-neutral-400 hover:text-white'
                      }`}
                    >
                      EN
                    </button>
                    <button
                      type="button"
                      onClick={() => setScriptLang('ES')}
                      className={`px-2 py-0.5 text-[10px] font-mono rounded font-bold cursor-pointer ${
                        scriptLang === 'ES' ? 'bg-amber-400 text-neutral-950' : 'text-neutral-400 hover:text-white'
                      }`}
                    >
                      ES
                    </button>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handlePlayScriptAudio}
                  disabled={isPlayingAudio}
                  className="px-2.5 py-1 rounded-lg bg-amber-400 hover:bg-amber-300 text-neutral-950 text-[10.5px] font-mono font-bold flex items-center gap-1.5 transition-colors cursor-pointer disabled:opacity-50"
                  title={isEn ? 'Listen with Voyager voice' : 'Escuchar con la voz de Voyager'}
                >
                  <Volume2 className={`w-3.5 h-3.5 ${isPlayingAudio ? 'animate-bounce' : ''}`} />
                  <span>{isPlayingAudio ? (isEn ? 'Speaking...' : 'Hablando...') : (isEn ? 'Listen with Voyager' : 'Escuchar con Voyager')}</span>
                </button>
              </div>

              <p className="text-xs text-neutral-200 leading-relaxed font-sans italic bg-neutral-950/50 p-2.5 rounded-lg border border-neutral-800">
                "{scriptLang === 'EN' ? lesson.videoScriptEn : lesson.videoScriptEs}"
              </p>
            </div>
          </div>

          {/* Section 2: Interactive Practical Activity on Platform */}
          <div className="p-4 rounded-xl border border-amber-300 bg-amber-50/50">
            <div className="flex items-center gap-2 mb-1.5 text-neutral-900 font-mono font-bold text-xs uppercase tracking-wider">
              <Compass className="w-4 h-4 text-amber-600" />
              <span>{isEn ? 'Practical Activity on Voyager' : 'Actividad Práctica en la Plataforma'}</span>
            </div>
            <p className="text-xs text-neutral-800 font-sans leading-relaxed mb-3">
              {isEn ? lesson.practicalTaskEn : lesson.practicalTaskEs}
            </p>

            <button
              type="button"
              onClick={handleTriggerAction}
              className="px-3.5 py-2 rounded-lg bg-black hover:bg-neutral-800 text-white text-xs font-mono font-bold flex items-center gap-2 transition-colors cursor-pointer active:scale-95"
            >
              <span>{isEn ? 'Try This on Platform Now' : 'Probar en la Plataforma Ahora'}</span>
              <ArrowRight className="w-3.5 h-3.5 text-amber-400" />
            </button>
          </div>

          {/* Section 3: Comprehension Check */}
          <div className="space-y-4 pt-1">
            <div className="flex items-center gap-2 text-neutral-900 font-mono font-bold text-xs uppercase tracking-wider">
              <HelpCircle className="w-4 h-4 text-neutral-700" />
              <span>{isEn ? 'Quick Comprehension Check' : 'Comprobación Rápida de Comprensión'}</span>
            </div>

            {lesson.comprehensionQuestions.map((q, qIdx) => {
              const selectedOpt = selectedAnswers[q.id];
              const isAnswered = showAnswers[q.id];
              const isCorrect = selectedOpt === q.correctIndex;

              return (
                <div key={q.id} className="p-3.5 rounded-xl border border-neutral-200 bg-white space-y-2.5">
                  <p className="text-xs font-bold text-neutral-900">
                    {qIdx + 1}. {isEn ? q.questionEn : q.questionEs}
                  </p>

                  <div className="space-y-1.5">
                    {(isEn ? q.optionsEn : q.optionsEs).map((opt, optIdx) => {
                      const isChosen = selectedOpt === optIdx;
                      let btnStyle = 'border-neutral-200 hover:border-black text-neutral-800 bg-white';

                      if (isAnswered) {
                        if (optIdx === q.correctIndex) {
                          btnStyle = 'border-emerald-500 bg-emerald-50 text-emerald-950 font-semibold';
                        } else if (isChosen && !isCorrect) {
                          btnStyle = 'border-rose-400 bg-rose-50 text-rose-950';
                        }
                      }

                      return (
                        <button
                          key={optIdx}
                          type="button"
                          onClick={() => handleSelectOption(q.id, optIdx)}
                          className={`w-full text-left p-2.5 rounded-lg border text-xs transition-colors cursor-pointer flex items-center justify-between gap-2 ${btnStyle}`}
                        >
                          <span>{opt}</span>
                          {isAnswered && optIdx === q.correctIndex && (
                            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                          )}
                        </button>
                      );
                    })}
                  </div>

                  {isAnswered && (
                    <div className={`p-2.5 rounded-lg text-xs leading-relaxed font-sans ${isCorrect ? 'bg-emerald-50 text-emerald-900 border border-emerald-200' : 'bg-amber-50 text-amber-900 border border-amber-200'}`}>
                      <strong>{isCorrect ? (isEn ? 'Correct! ' : '¡Correcto! ') : (isEn ? 'Explanation: ' : 'Explicación: ')}</strong>
                      {isEn ? q.explanationEn : q.explanationEs}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Bottom Actions Bar */}
        <div className="p-4 sm:p-5 border-t border-neutral-200 bg-neutral-50 flex items-center justify-between gap-3">
          {prevLesson ? (
            <button
              type="button"
              onClick={() => onSelectLesson(prevLesson)}
              className="px-3 py-2 text-xs font-mono font-bold text-neutral-700 hover:text-black flex items-center gap-1.5 cursor-pointer"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>{isEn ? 'Previous' : 'Anterior'}</span>
            </button>
          ) : <div />}

          <button
            type="button"
            onClick={handleCompleteCurrentLesson}
            className="px-5 py-2.5 rounded-xl bg-amber-400 hover:bg-amber-300 text-neutral-950 font-bold font-mono text-xs uppercase tracking-wider flex items-center gap-2 shadow-sm transition-transform active:scale-95 cursor-pointer ml-auto"
          >
            <span>{isCompleted ? (isEn ? 'Completed ✓ (Next)' : 'Completada ✓ (Siguiente)') : (isEn ? 'Complete Lesson' : 'Completar Lección')}</span>
            <CheckCircle className="w-4 h-4 text-neutral-950" />
          </button>
        </div>
      </div>
    </div>
  );
};
