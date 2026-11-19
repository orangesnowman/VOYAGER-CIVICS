import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { 
  Compass, 
  Clock, 
  TrendingUp, 
  Landmark, 
  Mic, 
  Volume2, 
  BookMarked, 
  FileCheck, 
  Headphones, 
  MessageSquare, 
  CheckCircle2, 
  Lock, 
  Target, 
  ChevronLeft, 
  ChevronRight, 
  X, 
  Sparkles,
  ArrowRight
} from 'lucide-react';
import { 
  MilestoneBadge, 
  calculatePersonalizedStudentBadges, 
  recordBadgeCelebration, 
  saveBadgesState, 
  getSavedBadgesState 
} from '../data/milestoneBadgesData';

interface MilestoneBadgesCarouselProps {
  user: any;
  scores?: {
    grammar?: number;
    pronunciation?: number;
    confidence?: number;
    naturalness?: number;
    vocabulary?: number;
    listening?: number;
    clarity?: number;
  };
  selectedLang: 'EN' | 'ES';
  onAskVoyager?: (prompt: string) => void;
}

export const MilestoneBadgesCarousel: React.FC<MilestoneBadgesCarouselProps> = ({
  user,
  scores,
  selectedLang,
  onAskVoyager,
}) => {
  const isEn = selectedLang === 'EN';
  const containerRef = useRef<HTMLDivElement>(null);
  const scrollTrackRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const [selectedBadge, setSelectedBadge] = useState<MilestoneBadge | null>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);
  const [hasOverflow, setHasOverflow] = useState(false);

  // Mouse drag state
  const isDraggingRef = useRef(false);
  const startXRef = useRef(0);
  const scrollLeftRef = useRef(0);
  const hasMovedRef = useRef(false);

  // Calculate badges dynamically based on student's actual individual baselines & scores
  const [badges, setBadges] = useState<MilestoneBadge[]>(() => 
    calculatePersonalizedStudentBadges(user, scores)
  );

  const refreshBadges = useCallback(() => {
    setBadges(calculatePersonalizedStudentBadges(user, scores));
  }, [user, scores]);

  useEffect(() => {
    refreshBadges();
  }, [refreshBadges]);

  useEffect(() => {
    const handleStorage = () => refreshBadges();
    window.addEventListener('voyager_milestones_updated', handleStorage);
    window.addEventListener('voyager_fundamentals_updated', handleStorage);
    window.addEventListener('storage', handleStorage);
    return () => {
      window.removeEventListener('voyager_milestones_updated', handleStorage);
      window.removeEventListener('voyager_fundamentals_updated', handleStorage);
      window.removeEventListener('storage', handleStorage);
    };
  }, [refreshBadges]);

  // Audio synthesis chime for celebration
  const playTriumphChime = useCallback(() => {
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
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
        gain.gain.exponentialRampToValueAtTime(0.15, ctx.currentTime + time + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + time + duration);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(ctx.currentTime + time);
        osc.stop(ctx.currentTime + time + duration);
      });
    } catch {}
  }, []);

  // Subtle confetti burst
  const triggerConfettiCelebration = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width;
    canvas.height = rect.height;

    const particles: Array<{
      x: number;
      y: number;
      vx: number;
      vy: number;
      size: number;
      color: string;
      alpha: number;
      rotation: number;
      vRot: number;
    }> = [];

    const colors = ['#FACC15', '#0B1B3D', '#38BDF8', '#F59E0B', '#10B981', '#E11D48'];
    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2;

    for (let i = 0; i < 40; i++) {
      const angle = (Math.random() * Math.PI * 2);
      const speed = 2 + Math.random() * 4;
      particles.push({
        x: centerX,
        y: centerY,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - 1.5,
        size: 3 + Math.random() * 4,
        color: colors[Math.floor(Math.random() * colors.length)],
        alpha: 1,
        rotation: Math.random() * 360,
        vRot: (Math.random() - 0.5) * 10
      });
    }

    let animationId: number;
    const startTime = Date.now();

    const animate = () => {
      const elapsed = Date.now() - startTime;
      if (elapsed > 1800) {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        return;
      }

      ctx.clearRect(0, 0, canvas.width, canvas.height);
      particles.forEach(p => {
        p.x += p.vx;
        p.y += p.vy;
        p.vy += 0.12; // gravity
        p.alpha = Math.max(0, 1 - elapsed / 1800);
        p.rotation += p.vRot;

        ctx.save();
        ctx.globalAlpha = p.alpha;
        ctx.fillStyle = p.color;
        ctx.translate(p.x, p.y);
        ctx.rotate((p.rotation * Math.PI) / 180);
        ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size * 0.7);
        ctx.restore();
      });

      animationId = requestAnimationFrame(animate);
    };

    animationId = requestAnimationFrame(animate);
  }, []);

  // Check for newly earned badges that haven't shown celebration yet
  useEffect(() => {
    const uncelebrated = badges.find(b => b.status === 'earned' && !b.celebrationShown);
    if (uncelebrated) {
      playTriumphChime();
      triggerConfettiCelebration();
      recordBadgeCelebration(uncelebrated.id);
      // Update local state without triggering full rebuild
      setBadges(prev => prev.map(b => b.id === uncelebrated.id ? { ...b, celebrationShown: true } : b));
    }
  }, [badges, playTriumphChime, triggerConfettiCelebration]);

  // Check overflow and scroll boundaries to conditionally show/hide arrows
  const checkScrollState = useCallback(() => {
    const track = scrollTrackRef.current;
    if (!track) return;
    const { scrollLeft, scrollWidth, clientWidth } = track;
    const hasMoreContent = scrollWidth > clientWidth + 4;
    setHasOverflow(hasMoreContent);
    setCanScrollLeft(scrollLeft > 6);
    setCanScrollRight(scrollLeft + clientWidth < scrollWidth - 6);
  }, []);

  useEffect(() => {
    checkScrollState();
    const track = scrollTrackRef.current;
    if (!track) return;

    const observer = new ResizeObserver(() => {
      checkScrollState();
    });
    observer.observe(track);

    window.addEventListener('resize', checkScrollState);
    return () => {
      observer.disconnect();
      window.removeEventListener('resize', checkScrollState);
    };
  }, [checkScrollState, badges]);

  const handleScroll = (direction: 'left' | 'right') => {
    const track = scrollTrackRef.current;
    if (!track) return;
    const scrollAmount = Math.max(160, track.clientWidth * 0.65);
    track.scrollBy({
      left: direction === 'left' ? -scrollAmount : scrollAmount,
      behavior: 'smooth'
    });
  };

  // Mouse Drag handlers
  const handleMouseDown = (e: React.MouseEvent) => {
    const track = scrollTrackRef.current;
    if (!track) return;
    isDraggingRef.current = true;
    hasMovedRef.current = false;
    startXRef.current = e.pageX - track.offsetLeft;
    scrollLeftRef.current = track.scrollLeft;
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDraggingRef.current) return;
    const track = scrollTrackRef.current;
    if (!track) return;
    e.preventDefault();
    const x = e.pageX - track.offsetLeft;
    const walk = (x - startXRef.current) * 1.2;
    if (Math.abs(walk) > 5) {
      hasMovedRef.current = true;
    }
    track.scrollLeft = scrollLeftRef.current - walk;
    checkScrollState();
  };

  const handleMouseUp = () => {
    isDraggingRef.current = false;
    checkScrollState();
  };

  const handleMouseLeave = () => {
    isDraggingRef.current = false;
    checkScrollState();
  };

  // Helper to render icon for badge
  const renderBadgeIcon = (iconType: MilestoneBadge['iconType'], status: MilestoneBadge['status']) => {
    const iconClass = "w-5 h-5 sm:w-5.5 sm:h-5.5 stroke-[2]";
    switch (iconType) {
      case 'explorer': return <Compass className={iconClass} />;
      case 'consistency': return <Clock className={iconClass} />;
      case 'advancement': return <TrendingUp className={iconClass} />;
      case 'citizenship': return <Landmark className={iconClass} />;
      case 'pronunciation': return <Mic className={iconClass} />;
      case 'fluency': return <Volume2 className={iconClass} />;
      case 'vocabulary': return <BookMarked className={iconClass} />;
      case 'grammar': return <FileCheck className={iconClass} />;
      case 'listening': return <Headphones className={iconClass} />;
      case 'clarity': return <MessageSquare className={iconClass} />;
      case 'conversation': return <MessageSquare className={iconClass} />;
      case 'missions': return <Target className={iconClass} />;
      default: return <Sparkles className={iconClass} />;
    }
  };

  return (
    <div ref={containerRef} className="relative w-full min-w-0 select-none py-1">
      {/* Invisible Canvas for Subtle Confetti */}
      <canvas
        ref={canvasRef}
        className="pointer-events-none absolute inset-0 z-30 w-full h-full"
      />

      {/* Conditional Left Navigation Arrow */}
      {hasOverflow && (
        <button
          type="button"
          onClick={() => handleScroll('left')}
          disabled={!canScrollLeft}
          aria-label={isEn ? "Scroll badges left" : "Desplazar insignias a la izquierda"}
          className={`absolute left-0 top-1/2 -translate-y-1/2 z-20 w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-white/95 border border-neutral-300 shadow-md flex items-center justify-center transition-all duration-200 cursor-pointer ${
            canScrollLeft 
              ? 'opacity-100 hover:bg-neutral-100 hover:scale-105 active:scale-95 text-neutral-800' 
              : 'opacity-0 pointer-events-none'
          }`}
        >
          <ChevronLeft className="w-4 h-4 text-black stroke-[2.5]" />
        </button>
      )}

      {/* Conditional Right Navigation Arrow */}
      {hasOverflow && (
        <button
          type="button"
          onClick={() => handleScroll('right')}
          disabled={!canScrollRight}
          aria-label={isEn ? "Scroll badges right" : "Desplazar insignias a la derecha"}
          className={`absolute right-0 top-1/2 -translate-y-1/2 z-20 w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-white/95 border border-neutral-300 shadow-md flex items-center justify-center transition-all duration-200 cursor-pointer ${
            canScrollRight 
              ? 'opacity-100 hover:bg-neutral-100 hover:scale-105 active:scale-95 text-neutral-800' 
              : 'opacity-0 pointer-events-none'
          }`}
        >
          <ChevronRight className="w-4 h-4 text-black stroke-[2.5]" />
        </button>
      )}

      {/* Single-Row Non-Wrapping Horizontal Track */}
      <div
        ref={scrollTrackRef}
        onScroll={checkScrollState}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseLeave}
        className="flex items-center gap-3 sm:gap-3.5 overflow-x-auto scrollbar-none py-1.5 px-1 sm:px-2 flex-nowrap cursor-grab active:cursor-grabbing transition-all scroll-smooth"
        style={{
          scrollbarWidth: 'none',
          msOverflowStyle: 'none',
          WebkitOverflowScrolling: 'touch'
        }}
      >
        {badges.map((badge) => {
          const isEarned = badge.status === 'earned';
          const isActiveGoal = badge.status === 'active_goal';

          return (
            <div
              key={badge.id}
              onClick={() => {
                if (!hasMovedRef.current) {
                  setSelectedBadge(badge);
                }
              }}
              title={`${isEn ? badge.titleEN : badge.titleES}: ${isEn ? badge.requirementEN : badge.requirementES}`}
              className="flex-shrink-0 flex flex-col items-center group cursor-pointer focus:outline-none"
            >
              {/* Circular Badge Medallion */}
              <div className="relative">
                {/* Active Goal Amber Target Ring */}
                {isActiveGoal && (
                  <span className="absolute -inset-1 rounded-full border-2 border-amber-400 animate-pulse pointer-events-none opacity-80" />
                )}

                <div
                  className={`w-12 h-12 sm:w-13 sm:h-13 rounded-full flex items-center justify-center transition-all duration-300 transform group-hover:scale-105 active:scale-95 shadow-xs relative ${
                    isEarned
                      ? 'bg-gradient-to-b from-amber-300 via-yellow-400 to-amber-500 text-[#081545] border-2 border-amber-400 shadow-amber-200/50'
                      : isActiveGoal
                      ? 'bg-neutral-100 text-amber-700 border-2 border-amber-400'
                      : 'bg-neutral-100 text-neutral-400 border border-neutral-300 opacity-60'
                  }`}
                >
                  {renderBadgeIcon(badge.iconType, badge.status)}

                  {/* Corner Status Indicator */}
                  {isEarned && (
                    <span className="absolute -bottom-0.5 -right-0.5 w-4 h-4 rounded-full bg-emerald-500 border-2 border-white flex items-center justify-center text-white">
                      <CheckCircle2 className="w-2.5 h-2.5 stroke-[3]" />
                    </span>
                  )}

                  {isActiveGoal && (
                    <span className="absolute -top-0.5 -right-0.5 w-4 h-4 rounded-full bg-amber-500 border-2 border-white flex items-center justify-center text-white" title={isEn ? "Personalized Goal" : "Meta Personalizada"}>
                      <Target className="w-2.5 h-2.5 stroke-[3]" />
                    </span>
                  )}

                  {!isEarned && !isActiveGoal && (
                    <span className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full bg-neutral-300 border border-white flex items-center justify-center text-neutral-600">
                      <Lock className="w-2 h-2 stroke-[2.5]" />
                    </span>
                  )}
                </div>
              </div>

              {/* Badge Label */}
              <span className={`mt-1 text-[10px] sm:text-[10.5px] font-semibold tracking-tight text-center truncate max-w-[72px] sm:max-w-[78px] ${
                isEarned 
                  ? 'text-neutral-900 font-bold' 
                  : isActiveGoal 
                  ? 'text-amber-800' 
                  : 'text-neutral-500 font-normal'
              }`}>
                {isEn ? badge.titleEN : badge.titleES}
              </span>
            </div>
          );
        })}
      </div>

      {/* Accessible Badge Details & Personalized Goal Modal */}
      {selectedBadge && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-fade-in"
          onClick={() => setSelectedBadge(null)}
        >
          <div 
            className="w-full max-w-md bg-white rounded-2xl shadow-2xl p-5 text-neutral-900 border border-neutral-200 animate-scale-in relative text-left"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Close Button */}
            <button
              type="button"
              onClick={() => setSelectedBadge(null)}
              className="absolute top-4 right-4 p-1.5 rounded-full text-neutral-400 hover:text-neutral-700 hover:bg-neutral-100 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Header: Icon + Titles */}
            <div className="flex items-center gap-3.5 mb-3.5">
              <div className={`w-14 h-14 rounded-full flex items-center justify-center shrink-0 border-2 ${
                selectedBadge.status === 'earned'
                  ? 'bg-gradient-to-b from-amber-300 to-amber-500 text-[#081545] border-amber-400'
                  : selectedBadge.status === 'active_goal'
                  ? 'bg-amber-50 text-amber-700 border-amber-400'
                  : 'bg-neutral-100 text-neutral-400 border-neutral-300'
              }`}>
                {renderBadgeIcon(selectedBadge.iconType, selectedBadge.status)}
              </div>
              <div className="min-w-0 pr-6">
                <span className="text-[10.5px] font-bold uppercase tracking-wider text-neutral-500 block">
                  {selectedBadge.category === 'achievement' 
                    ? (isEn ? 'Achievement Badge' : 'Insignia de Logro')
                    : selectedBadge.category === 'skill'
                    ? (isEn ? 'Personalized Skill Goal' : 'Meta Personalizada de Habilidad')
                    : (isEn ? 'Practice Badge' : 'Insignia de Práctica')}
                </span>
                <h3 className="text-lg font-bold text-neutral-900 leading-tight">
                  {isEn ? selectedBadge.titleEN : selectedBadge.titleES}
                </h3>
              </div>
            </div>

            {/* Status Strip */}
            <div className="mb-3.5">
              {selectedBadge.status === 'earned' ? (
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200 text-xs font-semibold">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                  <span>
                    {isEn ? 'Earned Achievement' : 'Insignia Obtenida'} 
                    {selectedBadge.unlockedAt ? ` (${selectedBadge.unlockedAt})` : ''}
                  </span>
                </div>
              ) : selectedBadge.status === 'active_goal' ? (
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-50 text-amber-900 border border-amber-300 text-xs font-semibold">
                  <Target className="w-3.5 h-3.5 text-amber-600" />
                  <span>{isEn ? 'Active Personalized Goal' : 'Meta Activa Personalizada'}</span>
                </div>
              ) : (
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-neutral-100 text-neutral-600 text-xs font-semibold">
                  <Lock className="w-3.5 h-3.5 text-neutral-500" />
                  <span>{isEn ? 'Locked' : 'Por Desbloquear'}</span>
                </div>
              )}
            </div>

            {/* Description */}
            <p className="text-xs sm:text-sm text-neutral-700 font-normal leading-relaxed mb-3">
              {isEn ? selectedBadge.descriptionEN : selectedBadge.descriptionES}
            </p>

            {/* Personalized Learning Goal Box (For Skill Badges) */}
            {selectedBadge.category === 'skill' && (
              <div className="mb-3.5 p-3 bg-neutral-50 rounded-xl border border-neutral-200 space-y-2">
                <div className="flex items-center justify-between text-xs font-semibold">
                  <span className="text-neutral-500">
                    {isEn ? 'Individual Baseline:' : 'Línea Base Individual:'}
                  </span>
                  <span className="text-neutral-900 font-bold">
                    {selectedBadge.individualBaseline}%
                  </span>
                </div>
                <div className="flex items-center justify-between text-xs font-semibold">
                  <span className="text-amber-800">
                    {isEn ? 'Personalized Target Goal:' : 'Meta Personalizada:'}
                  </span>
                  <span className="text-amber-700 font-bold">
                    {selectedBadge.individualTarget}%
                  </span>
                </div>
                <div className="flex items-center justify-between text-xs font-semibold">
                  <span className="text-neutral-500">
                    {isEn ? 'Current Verified Score:' : 'Puntuación Actual:'}
                  </span>
                  <span className="text-neutral-900 font-bold">
                    {selectedBadge.currentScore ?? 0}%
                  </span>
                </div>

                {/* Progress Bar */}
                <div className="w-full bg-neutral-200 rounded-full h-2 overflow-hidden mt-1">
                  <div 
                    className={`h-full rounded-full transition-all duration-500 ${
                      selectedBadge.status === 'earned' 
                        ? 'bg-emerald-500' 
                        : 'bg-amber-500'
                    }`}
                    style={{ width: `${selectedBadge.progress}%` }}
                  />
                </div>
                <p className="text-[11px] text-neutral-500 italic">
                  {isEn 
                    ? '*Target is tailored to your CEFR proficiency level and unlocks upon verified assessment.' 
                    : '*La meta está adaptada a tu nivel MCER y se desbloquea al verificarla en tu evaluación.'}
                </p>
              </div>
            )}

            {/* Requirement */}
            <div className="mb-3 p-2.5 bg-neutral-50 rounded-lg text-xs text-neutral-700">
              <strong className="block text-neutral-900 font-semibold mb-0.5">
                {isEn ? 'How to unlock:' : 'Cómo desbloquear:'}
              </strong>
              {isEn ? selectedBadge.requirementEN : selectedBadge.requirementES}
            </div>

            {/* Personalized Advice */}
            {selectedBadge.personalizedAdviceEN && (
              <p className="text-xs text-neutral-600 mb-4 bg-amber-50/60 p-2.5 rounded-lg border border-amber-100">
                <span className="font-semibold text-amber-900 block mb-0.5">
                  {isEn ? 'Voyager Recommendation:' : 'Recomendación de Voyager:'}
                </span>
                {isEn ? selectedBadge.personalizedAdviceEN : selectedBadge.personalizedAdviceES}
              </p>
            )}

            {/* Action Buttons */}
            <div className="flex items-center justify-end gap-2 pt-2 border-t border-neutral-100">
              {onAskVoyager && (
                <button
                  type="button"
                  onClick={() => {
                    const prompt = isEn
                      ? `Voyager, how can I improve my ${selectedBadge.titleEN} to reach my personalized target of ${selectedBadge.individualTarget || 75}%? Give me practical tips.`
                      : `Voyager, ¿cómo puedo mejorar mi ${selectedBadge.titleES} para alcanzar mi meta personalizada de ${selectedBadge.individualTarget || 75}%? Dame consejos prácticos.`;
                    onAskVoyager(prompt);
                    setSelectedBadge(null);
                  }}
                  className="px-3.5 py-2 bg-amber-400 hover:bg-[#081545] text-black hover:text-white font-semibold rounded-full text-xs transition-colors cursor-pointer flex items-center gap-1.5"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>{isEn ? 'Practice with Voyager' : 'Practicar con Voyager'}</span>
                </button>
              )}
              <button
                type="button"
                onClick={() => setSelectedBadge(null)}
                className="px-4 py-2 bg-neutral-100 hover:bg-neutral-200 text-neutral-800 font-semibold rounded-full text-xs transition-colors cursor-pointer"
              >
                {isEn ? 'Close' : 'Cerrar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
