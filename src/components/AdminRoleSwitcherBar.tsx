import React from 'react';
import { useAdminRoleSim, SIMULATED_ROLES, SimulatedRole } from '../services/adminRoleSimProvider';
import { ShieldCheck, GraduationCap, Apple, Eye, CheckCircle2, RotateCcw } from 'lucide-react';

interface AdminRoleSwitcherBarProps {
  selectedLang?: 'EN' | 'ES';
  onNavigateTab?: (tab: string) => void;
  className?: string;
}

export const AdminRoleSwitcherBar: React.FC<AdminRoleSwitcherBarProps> = ({
  selectedLang = 'ES',
  onNavigateTab,
  className = ''
}) => {
  const [simulatedRole, setSimulatedRole] = useAdminRoleSim();
  const isEn = selectedLang === 'EN';

  const roleOptions: { id: SimulatedRole; icon: React.ComponentType<{ className?: string }>; emoji: string }[] = [
    { id: 'admin', icon: ShieldCheck, emoji: '🛡️' },
    { id: 'student', icon: GraduationCap, emoji: '🎓' },
    { id: 'teacher', icon: Apple, emoji: '👩‍🏫' }
  ];

  const currentMeta = SIMULATED_ROLES[simulatedRole];

  return (
    <div className={`space-y-2 ${className}`}>
      {/* MINIMALIST TEXT-BASED ROLE SELECTOR (NO BUBBLES, NO BORDER, NO PILL, NO FILL) */}
      <div className="flex flex-wrap items-center justify-between gap-3 py-2 border-b border-slate-200/80">
        <div className="flex items-center gap-2">
          <span className="text-base">👑</span>
          <div>
            <div className="text-[11px] font-extrabold uppercase tracking-wider text-slate-900 flex items-center gap-2">
              <span>{isEn ? 'ADMIN SIMULATION SELECTOR' : 'SELECTOR DE SIMULACIÓN ADMIN'}</span>
              <span className="text-[9px] text-amber-800 font-extrabold uppercase tracking-wider bg-amber-50 px-1.5 py-0.5 rounded">
                {isEn ? currentMeta.badgeEn : currentMeta.badgeEs}
              </span>
            </div>
            <p className="text-[11px] text-slate-500 font-medium leading-tight mt-0.5">
              {isEn ? 'Switch perspective instantly without changing auth state.' : 'Cambie la vista instantáneamente sin alterar su autenticación.'}
            </p>
          </div>
        </div>

        {/* CLEAN TEXT TABS - NO PILLS, NO FILL, NO BORDERS */}
        <div className="flex items-center gap-3 sm:gap-5">
          {roleOptions.map((opt) => {
            const meta = SIMULATED_ROLES[opt.id];
            const isActive = simulatedRole === opt.id;

            return (
              <button
                key={opt.id}
                type="button"
                onClick={() => {
                  setSimulatedRole(opt.id);
                  if (opt.id === 'student' && onNavigateTab) {
                    // Navigate if requested
                  } else if (opt.id === 'teacher' && onNavigateTab) {
                    // Navigate if requested
                  }
                }}
                className={`flex items-center gap-1.5 py-1 text-xs uppercase tracking-wider transition-all cursor-pointer bg-transparent border-none ${
                  isActive
                    ? 'text-amber-900 font-black border-b-2 border-amber-500'
                    : 'text-slate-600 hover:text-slate-900 font-bold border-b-2 border-transparent'
                }`}
                title={isEn ? meta.descriptionEn : meta.descriptionEs}
              >
                <span className="text-sm">{opt.emoji}</span>
                <span>{isEn ? meta.labelEn : meta.labelEs}</span>
                {isActive && <CheckCircle2 className="w-3.5 h-3.5 text-amber-600 ml-0.5" />}
              </button>
            );
          })}
        </div>
      </div>

      {/* BANNER INDICATOR WHEN SIMULATING NON-ADMIN ROLE */}
      {simulatedRole !== 'admin' && (
        <div className="bg-amber-50 border-2 border-amber-400 p-3 rounded-2xl flex items-center justify-between gap-3 animate-fade-in shadow-xs">
          <div className="flex items-center gap-2.5 text-xs text-amber-950 font-medium">
            <Eye className="w-4 h-4 text-amber-700 flex-shrink-0 animate-pulse" />
            <div>
              <span className="font-extrabold text-amber-900 uppercase">
                {isEn ? `Active View Simulation: ` : `Simulación de Vista Activa: `}
              </span>
              <span className="font-bold underline text-amber-950">
                {isEn ? currentMeta.labelEn : currentMeta.labelEs}
              </span>
              <p className="text-[11px] text-amber-800 mt-0.5">
                {isEn
                  ? 'Authenticated as Administrator (Federico Sandoval). All admin privileges remain active.'
                  : 'Autenticado como Administrador (Federico Sandoval). Todos los privilegios de administrador siguen activos.'}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setSimulatedRole('admin')}
            className="flex-shrink-0 bg-amber-400 hover:bg-amber-500 text-slate-950 font-black text-[11px] px-3 py-1.5 rounded-xl flex items-center gap-1 transition-all shadow-2xs cursor-pointer"
          >
            <RotateCcw className="w-3 h-3" />
            <span>{isEn ? 'Return to Admin' : 'Volver a Admin'}</span>
          </button>
        </div>
      )}
    </div>
  );
};
