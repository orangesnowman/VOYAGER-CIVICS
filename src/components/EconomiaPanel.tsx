import React, { useState } from 'react';
import { BusinessAdvisorFrameworkCard } from './BusinessAdvisorFrameworkCard';
import { 
  DollarSign, 
  TrendingUp, 
  Users, 
  CreditCard, 
  PieChart, 
  BarChart3, 
  Globe2, 
  ArrowUpRight, 
  Sparkles, 
  Building2, 
  ShieldCheck, 
  Sliders, 
  Download, 
  RefreshCw, 
  ChevronRight,
  CheckCircle2,
  Calendar,
  Zap,
  Award
} from 'lucide-react';

interface EconomiaPanelProps {
  selectedLang: 'EN' | 'ES';
  onNavigateTab?: (tab: string) => void;
}

export const EconomiaPanel: React.FC<EconomiaPanelProps> = ({
  selectedLang,
  onNavigateTab
}) => {
  const isEn = selectedLang === 'EN';

  // Interactive hover states for metric sparkline charts
  const [activeMrrIndex, setActiveMrrIndex] = useState<number | null>(null);
  const [activeSubIndex, setActiveSubIndex] = useState<number | null>(null);
  const [activeArpuIndex, setActiveArpuIndex] = useState<number | null>(null);
  const [activeLtvIndex, setActiveLtvIndex] = useState<number | null>(null);

  // 6-Month Trend Data for Metric Cards
  const mrrData = [
    { month: 'Mar', val: 11200, label: '$11,200' },
    { month: 'Abr', val: 13100, label: '$13,100' },
    { month: 'May', val: 14500, label: '$14,500' },
    { month: 'Jun', val: 15800, label: '$15,800' },
    { month: 'Jul', val: 16170, label: '$16,170' },
    { month: 'Ago', val: 18450, label: '$18,450' }
  ];

  // Full-width Financial Performance Chart State & Data
  const [financialTimeframe, setFinancialTimeframe] = useState<'6m' | '12m' | 'proj'>('6m');
  const [financialMetricView, setFinancialMetricView] = useState<'all' | 'revenue' | 'costs' | 'profit'>('all');
  const [hoveredFinancialMonth, setHoveredFinancialMonth] = useState<number | null>(null);

  const fullFinancialTimeline = [
    { month: isEn ? 'Jan' : 'Ene', revenue: 9400, costs: 7100, profit: 2300, margin: '24.5%', pro: 210, inst: 80 },
    { month: isEn ? 'Feb' : 'Feb', revenue: 10200, costs: 7600, profit: 2600, margin: '25.5%', pro: 240, inst: 95 },
    { month: isEn ? 'Mar' : 'Mar', revenue: 11200, costs: 8200, profit: 3000, margin: '26.8%', pro: 260, inst: 110 },
    { month: isEn ? 'Apr' : 'Abr', revenue: 13100, costs: 9300, profit: 3800, margin: '29.0%', pro: 285, inst: 135 },
    { month: isEn ? 'May' : 'May', revenue: 14500, costs: 10100, profit: 4400, margin: '30.3%', pro: 310, inst: 150 },
    { month: isEn ? 'Jun' : 'Jun', revenue: 15800, costs: 10900, profit: 4900, margin: '31.0%', pro: 345, inst: 165 },
    { month: isEn ? 'Jul' : 'Jul', revenue: 16170, costs: 11150, profit: 5020, margin: '31.0%', pro: 380, inst: 185 },
    { month: isEn ? 'Aug' : 'Ago', revenue: 18450, costs: 13099, profit: 5351, margin: '29.0%', pro: 415, inst: 200 },
    { month: isEn ? 'Sep (Est)' : 'Sep (Est)', revenue: 20800, costs: 14200, profit: 6600, margin: '31.7%', pro: 460, inst: 220, isProjection: true },
    { month: isEn ? 'Oct (Est)' : 'Oct (Est)', revenue: 23200, costs: 15500, profit: 7700, margin: '33.2%', pro: 510, inst: 240, isProjection: true },
    { month: isEn ? 'Nov (Est)' : 'Nov (Est)', revenue: 25500, costs: 16800, profit: 8700, margin: '34.1%', pro: 560, inst: 260, isProjection: true },
    { month: isEn ? 'Dec (Est)' : 'Dic (Est)', revenue: 28500, costs: 18100, profit: 10400, margin: '36.5%', pro: 620, inst: 280, isProjection: true }
  ];

  const displayedTimeline = financialTimeframe === '6m' 
    ? fullFinancialTimeline.slice(2, 8) 
    : financialTimeframe === '12m'
    ? fullFinancialTimeline.slice(0, 8)
    : fullFinancialTimeline;

  const subData = [
    { month: 'Mar', total: 370, pro: 260, inst: 110 },
    { month: 'Abr', total: 420, pro: 285, inst: 135 },
    { month: 'May', total: 460, pro: 310, inst: 150 },
    { month: 'Jun', total: 510, pro: 345, inst: 165 },
    { month: 'Jul', total: 565, pro: 380, inst: 185 },
    { month: 'Ago', total: 615, pro: 415, inst: 200 }
  ];

  const arpuData = [
    { month: 'Mar', val: 26.5, label: '$26.50' },
    { month: 'Abr', val: 27.2, label: '$27.20' },
    { month: 'May', val: 28.1, label: '$28.10' },
    { month: 'Jun', val: 28.8, label: '$28.80' },
    { month: 'Jul', val: 29.4, label: '$29.40' },
    { month: 'Ago', val: 30.0, label: '$30.00' }
  ];

  const ltvCacData = [
    { month: 'Mar', ratio: 9.5, ltv: 210, cac: 22.0 },
    { month: 'Abr', ratio: 10.9, ltv: 230, cac: 21.0 },
    { month: 'May', ratio: 12.2, ltv: 245, cac: 20.0 },
    { month: 'Jun', ratio: 13.3, ltv: 260, cac: 19.5 },
    { month: 'Jul', ratio: 14.2, ltv: 270, cac: 19.0 },
    { month: 'Ago', ratio: 15.1, ltv: 280, cac: 18.5 }
  ];
  const [hoveredPlan, setHoveredPlan] = useState<string | null>(null);
  const [selectedPlan, setSelectedPlan] = useState<string | null>(null);

  // Interactive price simulator state
  const [simulatedProUsers, setSimulatedProUsers] = useState<number>(320);
  const [simulatedProPrice, setSimulatedProPrice] = useState<number>(29.99);

  // Subscription plan data
  const subscriptionPlans = [
    {
      id: 'pro_monthly',
      label: isEn ? 'Pro Monthly Plan ($29.99/mo)' : 'Plan Pro Mensual ($29.99/mes)',
      shortLabel: 'Pro Mensual',
      count: 320,
      percentage: '52.0%',
      revenue: '$9,596.80',
      color: '#059669',
      hoverColor: '#10b981',
      accentColor: 'text-emerald-700',
      dotBg: 'bg-emerald-600',
      dashArray: '169.8 326.7',
      dashOffset: '0'
    },
    {
      id: 'premium_annual',
      label: isEn ? 'Premium Annual ($199/yr)' : 'Plan Premium Anual ($199/año)',
      shortLabel: 'Premium Anual',
      count: 172,
      percentage: '28.0%',
      revenue: '$5,166.00',
      color: '#2563eb',
      hoverColor: '#60a5fa',
      accentColor: 'text-blue-700',
      dotBg: 'bg-blue-600',
      dashArray: '91.4 326.7',
      dashOffset: '-169.8'
    },
    {
      id: 'institutional',
      label: isEn ? 'Institutional / Schools' : 'Docentes / Instituciones',
      shortLabel: 'Institucional',
      count: 92,
      percentage: '15.0%',
      revenue: '$2,767.50',
      color: '#f59e0b',
      hoverColor: '#fbbf24',
      accentColor: 'text-amber-700',
      dotBg: 'bg-amber-500',
      dashArray: '49.0 326.7',
      dashOffset: '-261.2'
    },
    {
      id: 'certifications',
      label: isEn ? 'Civics Certificates & Add-ons' : 'Certificaciones & Exámenes',
      shortLabel: 'Certificaciones',
      count: 31,
      percentage: '5.0%',
      revenue: '$922.50',
      color: '#8b5cf6',
      hoverColor: '#a78bfa',
      accentColor: 'text-purple-700',
      dotBg: 'bg-purple-500',
      dashArray: '16.5 326.7',
      dashOffset: '-310.2'
    }
  ];

  const activePlanId = hoveredPlan || selectedPlan;
  const activePlan = subscriptionPlans.find(p => p.id === activePlanId);

  // Cost structure items
  const costItems = [
    { name: isEn ? 'Gemini Live Audio API & AI Synth' : 'Consumo API Gemini Live Audio & Sintetizador', amount: '$4,059', percent: 22, color: 'bg-amber-500' },
    { name: isEn ? 'Cloud Run Infrastructure & Database' : 'Infraestructura Cloud Run & Base de Datos', amount: '$2,767', percent: 15, color: 'bg-blue-600' },
    { name: isEn ? 'User Acquisition & Digital Marketing' : 'Adquisición de Usuarios & Marketing Digital', amount: '$3,690', percent: 20, color: 'bg-purple-600' },
    { name: isEn ? 'Content & Educational Licensing' : 'Licencias de Contenido & Material Educativo', amount: '$2,583', percent: 14, color: 'bg-rose-500' },
    { name: isEn ? 'Net Profit / Operational Margin' : 'Margen Neto / Utilidad Operativa', amount: '$5,351', percent: 29, color: 'bg-emerald-600' },
  ];

  // Calculated simulated revenue
  const simulatedMRR = (simulatedProUsers * simulatedProPrice) + 5166 + 2767.5 + 922.5;

  return (
    <div className="flex-1 flex flex-col bg-slate-50 text-slate-900 overflow-y-auto p-3 sm:p-5 md:p-6 space-y-5 text-left font-sans animate-fade-in">
      
      {/* HEADER BAR */}
      <div className="bg-white rounded-3xl p-4 sm:p-6 border border-slate-200/90 shadow-2xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-2xl bg-[#0D224A] text-amber-400 flex items-center justify-center font-bold shadow-2xs">
              <DollarSign className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-lg sm:text-xl font-black text-slate-900 tracking-tight">
                {isEn ? 'ECONOMICS & FINANCIAL DASHBOARD' : 'PANEL ECONÓMICO Y FINANCIERO'}
              </h2>
              <p className="text-xs text-slate-500 font-semibold">
                {isEn ? 'USA Voyager Business Revenue, Subscriptions & Cost Analysis' : 'Ingresos, Suscripciones y Análisis de Costos Operativos de USA Voyager'}
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-300 text-xs font-bold">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span>{isEn ? 'Live Financial Feed' : 'Datos Financieros en Vivo'}</span>
          </span>
          <button
            type="button"
            onClick={() => alert(isEn ? 'Exporting financial summary PDF...' : 'Exportando informe financiero en PDF...')}
            className="px-3.5 py-1.5 bg-[#0D224A] hover:bg-[#15346e] text-amber-300 rounded-xl text-xs font-bold transition-all shadow-2xs flex items-center gap-1.5 cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" />
            <span>{isEn ? 'Export Report' : 'Exportar Informe'}</span>
          </button>
        </div>
      </div>

      {/* VOYAGER BUSINESS INTELLIGENCE ADVISOR FRAMEWORK */}
      <BusinessAdvisorFrameworkCard selectedLang={selectedLang} currentTab="economia" onNavigateTab={onNavigateTab} />

      {/* TOP SUMMARY STAT CARDS WITH INTEGRATED MINI CHARTS (4 CARDS) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
        
        {/* CARD 1: MRR WITH AREA SPARKLINE CHART */}
        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/90 shadow-2xs space-y-3 relative overflow-hidden group">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-black text-slate-500 uppercase tracking-wider">
              {isEn ? 'MONTHLY REVENUE (MRR)' : 'INGRESOS MENSUALES (MRR)'}
            </span>
            <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center shadow-2xs">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          
          <div className="flex items-baseline justify-between">
            <div>
              <div className="flex items-baseline gap-1.5">
                <span className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
                  {activeMrrIndex !== null ? mrrData[activeMrrIndex].label : '$18,450'}
                </span>
                <span className="text-xs font-bold text-emerald-600 flex items-center gap-0.5">
                  <ArrowUpRight className="w-3.5 h-3.5" />
                  +14.2%
                </span>
              </div>
              <p className="text-[10px] text-slate-500 font-semibold mt-0.5">
                {activeMrrIndex !== null 
                  ? `${mrrData[activeMrrIndex].month}: ${mrrData[activeMrrIndex].label}`
                  : (isEn ? '+$2,280 vs previous month' : '+$2,280 respecto al mes anterior')}
              </p>
            </div>
          </div>

          {/* SVG Sparkline Area Chart */}
          <div className="pt-1">
            <div className="flex items-center justify-between text-[9px] font-black text-slate-400 mb-1">
              <span>{isEn ? '6-Mo Trend' : 'Tendencia 6 Meses'}</span>
              <span>{activeMrrIndex !== null ? mrrData[activeMrrIndex].month : 'Ago'}</span>
            </div>
            <div className="h-14 w-full relative">
              <svg className="w-full h-full overflow-visible" viewBox="0 0 100 40" preserveAspectRatio="none">
                <defs>
                  <linearGradient id="mrrGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#10b981" stopOpacity="0.4" />
                    <stop offset="100%" stopColor="#10b981" stopOpacity="0.0" />
                  </linearGradient>
                </defs>
                {/* Area under curve */}
                <polygon
                  points="0,40 0,32 20,24 40,18 60,12 80,10 100,2 100,40"
                  fill="url(#mrrGradient)"
                />
                {/* Curve Path */}
                <path
                  d="M 0,32 L 20,24 L 40,18 L 60,12 L 80,10 L 100,2"
                  fill="none"
                  stroke="#10b981"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                />
                {/* Hover Nodes */}
                {mrrData.map((d, i) => {
                  const x = i * 20;
                  const y = 32 - (i * 6);
                  const isSelected = activeMrrIndex === i;
                  return (
                    <circle
                      key={d.month}
                      cx={x}
                      cy={y}
                      r={isSelected ? "4" : "2.5"}
                      className="cursor-pointer transition-all"
                      fill={isSelected ? "#047857" : "#10b981"}
                      stroke="#ffffff"
                      strokeWidth="1.5"
                      onMouseEnter={() => setActiveMrrIndex(i)}
                      onMouseLeave={() => setActiveMrrIndex(null)}
                    />
                  );
                })}
              </svg>
            </div>
          </div>
        </div>

        {/* CARD 2: ACTIVE SUBSCRIPTIONS WITH AREA SPARKLINE CHART */}
        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/90 shadow-2xs space-y-3 relative overflow-hidden group">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-black text-slate-500 uppercase tracking-wider">
              {isEn ? 'ACTIVE SUBSCRIBERS' : 'SUSCRIPTORES ACTIVOS'}
            </span>
            <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-700 flex items-center justify-center shadow-2xs">
              <Users className="w-4 h-4" />
            </div>
          </div>
          
          <div className="flex items-baseline justify-between">
            <div>
              <div className="flex items-baseline gap-1.5">
                <span className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
                  {activeSubIndex !== null ? subData[activeSubIndex].total : '615'}
                </span>
                <span className="text-xs font-bold text-blue-600 flex items-center gap-0.5">
                  <ArrowUpRight className="w-3.5 h-3.5" />
                  +8.5%
                </span>
              </div>
              <p className="text-[10px] text-slate-500 font-semibold mt-0.5">
                {activeSubIndex !== null 
                  ? `${subData[activeSubIndex].month}: ${subData[activeSubIndex].pro} Pro / ${subData[activeSubIndex].inst} Inst.`
                  : (isEn ? '415 Pro / 200 Enterprise & Schools' : '415 Pro / 200 Institucionales')}
              </p>
            </div>
          </div>

          {/* SVG Area Sparkline Chart */}
          <div className="pt-1">
            <div className="flex items-center justify-between text-[9px] font-black text-slate-400 mb-1">
              <span>{isEn ? '6-Mo Growth Trend' : 'Tendencia 6 Meses'}</span>
              <span>{activeSubIndex !== null ? subData[activeSubIndex].month : 'Ago'}</span>
            </div>
            <div className="h-14 w-full relative">
              <svg className="w-full h-full overflow-visible" viewBox="0 0 100 40" preserveAspectRatio="none">
                <defs>
                  <linearGradient id="blueGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.4" />
                    <stop offset="100%" stopColor="#3b82f6" stopOpacity="0.0" />
                  </linearGradient>
                </defs>
                {/* Area under curve */}
                <polygon
                  points="0,40 0,33 20,26.7 40,21.6 60,15.3 80,8.3 100,2 100,40"
                  fill="url(#blueGradient)"
                />
                {/* Curve Path */}
                <path
                  d="M 0,33 L 20,26.7 L 40,21.6 L 60,15.3 L 80,8.3 L 100,2"
                  fill="none"
                  stroke="#3b82f6"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                />
                {/* Hover Nodes */}
                {subData.map((d, i) => {
                  const x = i * 20;
                  const y = 33 - ((d.total - 370) / (615 - 370) * 31);
                  const isSelected = activeSubIndex === i;
                  return (
                    <circle
                      key={d.month}
                      cx={x}
                      cy={y}
                      r={isSelected ? "4" : "2.5"}
                      className="cursor-pointer transition-all"
                      fill={isSelected ? "#1d4ed8" : "#3b82f6"}
                      stroke="#ffffff"
                      strokeWidth="1.5"
                      onMouseEnter={() => setActiveSubIndex(i)}
                      onMouseLeave={() => setActiveSubIndex(null)}
                    />
                  );
                })}
              </svg>
            </div>
          </div>
        </div>

        {/* CARD 3: ARPU WITH STEPPED SPARKLINE */}
        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/90 shadow-2xs space-y-3 relative overflow-hidden group">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-black text-slate-500 uppercase tracking-wider">
              {isEn ? 'AVG REVENUE PER USER' : 'INGRESO PROMEDIO (ARPU)'}
            </span>
            <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center shadow-2xs">
              <CreditCard className="w-4 h-4" />
            </div>
          </div>
          
          <div className="flex items-baseline justify-between">
            <div>
              <div className="flex items-baseline gap-1.5">
                <span className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
                  {activeArpuIndex !== null ? arpuData[activeArpuIndex].label : '$30.00'}
                </span>
                <span className="text-xs font-bold text-amber-600">USD / mo</span>
              </div>
              <p className="text-[10px] text-slate-500 font-semibold mt-0.5">
                {activeArpuIndex !== null 
                  ? `${arpuData[activeArpuIndex].month}: ${arpuData[activeArpuIndex].label} / user`
                  : (isEn ? 'Annual churn rate: < 2.4%' : 'Tasa de cancelación anual: < 2.4%')}
              </p>
            </div>
          </div>

          {/* SVG Step Line Chart */}
          <div className="pt-1">
            <div className="flex items-center justify-between text-[9px] font-black text-slate-400 mb-1">
              <span>{isEn ? 'ARPU Expansion' : 'Expansión de ARPU'}</span>
              <span>{activeArpuIndex !== null ? arpuData[activeArpuIndex].month : 'Ago'}</span>
            </div>
            <div className="h-14 w-full relative">
              <svg className="w-full h-full overflow-visible" viewBox="0 0 100 40" preserveAspectRatio="none">
                <defs>
                  <linearGradient id="amberGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#f59e0b" stopOpacity="0.35" />
                    <stop offset="100%" stopColor="#f59e0b" stopOpacity="0.0" />
                  </linearGradient>
                </defs>
                <polygon
                  points="0,40 0,34 20,30 40,22 60,16 80,10 100,4 100,40"
                  fill="url(#amberGradient)"
                />
                <path
                  d="M 0,34 L 20,30 L 40,22 L 60,16 L 80,10 L 100,4"
                  fill="none"
                  stroke="#f59e0b"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                />
                {arpuData.map((d, i) => {
                  const x = i * 20;
                  const y = 34 - (i * 6);
                  const isSelected = activeArpuIndex === i;
                  return (
                    <circle
                      key={d.month}
                      cx={x}
                      cy={y}
                      r={isSelected ? "4" : "2.5"}
                      className="cursor-pointer transition-all"
                      fill={isSelected ? "#b45309" : "#f59e0b"}
                      stroke="#ffffff"
                      strokeWidth="1.5"
                      onMouseEnter={() => setActiveArpuIndex(i)}
                      onMouseLeave={() => setActiveArpuIndex(null)}
                    />
                  );
                })}
              </svg>
            </div>
          </div>
        </div>

        {/* CARD 4: LTV / CAC WITH DUAL METRIC SPARKLINE CHART */}
        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/90 shadow-2xs space-y-3 relative overflow-hidden group">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-black text-slate-500 uppercase tracking-wider">
              {isEn ? 'LTV / CAC RATIO' : 'RELACIÓN LTV / CAC'}
            </span>
            <div className="w-8 h-8 rounded-xl bg-purple-50 text-purple-700 flex items-center justify-center shadow-2xs">
              <Zap className="w-4 h-4" />
            </div>
          </div>
          
          <div className="flex items-baseline justify-between">
            <div>
              <div className="flex items-baseline gap-1.5">
                <span className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
                  {activeLtvIndex !== null ? `${ltvCacData[activeLtvIndex].ratio}x` : '15.1x'}
                </span>
                <span className="text-xs font-bold text-purple-600">
                  {activeLtvIndex !== null ? `LTV $${ltvCacData[activeLtvIndex].ltv}` : 'LTV $280'}
                </span>
              </div>
              <p className="text-[10px] text-slate-500 font-semibold mt-0.5">
                {activeLtvIndex !== null 
                  ? `${ltvCacData[activeLtvIndex].month}: CAC $${ltvCacData[activeLtvIndex].cac} USD`
                  : (isEn ? 'CAC: $18.50 USD per user' : 'CAC: $18.50 USD por usuario')}
              </p>
            </div>
          </div>

          {/* SVG Ratio Expansion Curve */}
          <div className="pt-1">
            <div className="flex items-center justify-between text-[9px] font-black text-slate-400 mb-1">
              <span>{isEn ? 'Ratio Trajectory' : 'Evolución de Eficiencia'}</span>
              <span>{activeLtvIndex !== null ? ltvCacData[activeLtvIndex].month : 'Ago'}</span>
            </div>
            <div className="h-14 w-full relative">
              <svg className="w-full h-full overflow-visible" viewBox="0 0 100 40" preserveAspectRatio="none">
                <defs>
                  <linearGradient id="purpleGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#8b5cf6" stopOpacity="0.4" />
                    <stop offset="100%" stopColor="#8b5cf6" stopOpacity="0.0" />
                  </linearGradient>
                </defs>
                <polygon
                  points="0,40 0,35 20,29 40,22 60,16 80,10 100,3 100,40"
                  fill="url(#purpleGradient)"
                />
                <path
                  d="M 0,35 L 20,29 L 40,22 L 60,16 L 80,10 L 100,3"
                  fill="none"
                  stroke="#8b5cf6"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                />
                {ltvCacData.map((d, i) => {
                  const x = i * 20;
                  const y = 35 - (i * 6.4);
                  const isSelected = activeLtvIndex === i;
                  return (
                    <circle
                      key={d.month}
                      cx={x}
                      cy={y}
                      r={isSelected ? "4" : "2.5"}
                      className="cursor-pointer transition-all"
                      fill={isSelected ? "#6d28d9" : "#8b5cf6"}
                      stroke="#ffffff"
                      strokeWidth="1.5"
                      onMouseEnter={() => setActiveLtvIndex(i)}
                      onMouseLeave={() => setActiveLtvIndex(null)}
                    />
                  );
                })}
              </svg>
            </div>
          </div>
        </div>

      </div>

      {/* FULL-WIDTH FINANCIAL PERFORMANCE CHART */}
      <div className="bg-white p-5 sm:p-6 rounded-3xl border border-slate-200/90 shadow-2xs space-y-4 w-full">
        {/* Chart Header & Controls */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 pb-4">
          <div>
            <div className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-emerald-600" />
              <h3 className="text-sm sm:text-base font-black text-slate-900 uppercase tracking-wider">
                {isEn ? 'FINANCIAL EVOLUTION & REVENUE PERFORMANCE' : 'EVOLUCIÓN Y RENDIMIENTO FINANCIERO'}
              </h3>
              <span className="px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-black uppercase tracking-wider">
                {isEn ? 'Full Width' : 'Ancho Completo'}
              </span>
            </div>
            <p className="text-xs text-slate-500 font-semibold mt-0.5">
              {isEn ? 'Monthly breakdown of gross revenue, operational expenses, and net surplus margin' : 'Desglose mensual de ingresos brutos, costos operativos y margen de utilidad neta'}
            </p>
          </div>

          {/* Filter Controls */}
          <div className="flex flex-wrap items-center gap-2">
            {/* Metric Mode Filter */}
            <div className="flex items-center p-1 bg-slate-100 rounded-xl text-xs font-extrabold">
              <button
                type="button"
                onClick={() => setFinancialMetricView('all')}
                className={`px-3 py-1 rounded-lg transition-all cursor-pointer ${
                  financialMetricView === 'all' ? 'bg-white text-slate-900 shadow-2xs font-black' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {isEn ? 'All Metrics' : 'Todos'}
              </button>
              <button
                type="button"
                onClick={() => setFinancialMetricView('revenue')}
                className={`px-3 py-1 rounded-lg transition-all cursor-pointer ${
                  financialMetricView === 'revenue' ? 'bg-white text-emerald-700 shadow-2xs font-black' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {isEn ? 'Revenue' : 'Ingresos'}
              </button>
              <button
                type="button"
                onClick={() => setFinancialMetricView('costs')}
                className={`px-3 py-1 rounded-lg transition-all cursor-pointer ${
                  financialMetricView === 'costs' ? 'bg-white text-rose-700 shadow-2xs font-black' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {isEn ? 'Costs' : 'Costos'}
              </button>
              <button
                type="button"
                onClick={() => setFinancialMetricView('profit')}
                className={`px-3 py-1 rounded-lg transition-all cursor-pointer ${
                  financialMetricView === 'profit' ? 'bg-white text-amber-700 shadow-2xs font-black' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {isEn ? 'Net Margin' : 'Margen'}
              </button>
            </div>

            {/* Timeframe Filter */}
            <div className="flex items-center p-1 bg-[#0D224A] text-white rounded-xl text-xs font-extrabold">
              <button
                type="button"
                onClick={() => { setFinancialTimeframe('6m'); setHoveredFinancialMonth(null); }}
                className={`px-3 py-1 rounded-lg transition-all cursor-pointer ${
                  financialTimeframe === '6m' ? 'bg-amber-400 text-slate-950 font-black' : 'text-slate-300 hover:text-white'
                }`}
              >
                6M
              </button>
              <button
                type="button"
                onClick={() => { setFinancialTimeframe('12m'); setHoveredFinancialMonth(null); }}
                className={`px-3 py-1 rounded-lg transition-all cursor-pointer ${
                  financialTimeframe === '12m' ? 'bg-amber-400 text-slate-950 font-black' : 'text-slate-300 hover:text-white'
                }`}
              >
                8M (YTD)
              </button>
              <button
                type="button"
                onClick={() => { setFinancialTimeframe('proj'); setHoveredFinancialMonth(null); }}
                className={`px-3 py-1 rounded-lg transition-all cursor-pointer ${
                  financialTimeframe === 'proj' ? 'bg-amber-400 text-slate-950 font-black' : 'text-slate-300 hover:text-white'
                }`}
              >
                2026 {isEn ? 'Full Year' : 'Año Completo'}
              </button>
            </div>
          </div>
        </div>

        {/* Legend Indicator & Interactive Summary */}
        <div className="flex flex-wrap items-center justify-between gap-3 text-xs font-bold pt-1">
          <div className="flex items-center gap-4">
            {(financialMetricView === 'all' || financialMetricView === 'revenue') && (
              <div className="flex items-center gap-1.5">
                <div className="w-3 h-3 rounded-full bg-emerald-500 shadow-2xs" />
                <span className="text-slate-800">{isEn ? 'Gross Revenue ($ MRR)' : 'Ingresos Brutos ($ MRR)'}</span>
              </div>
            )}
            {(financialMetricView === 'all' || financialMetricView === 'costs') && (
              <div className="flex items-center gap-1.5">
                <div className="w-3 h-3 rounded-full bg-rose-500 shadow-2xs" />
                <span className="text-slate-800">{isEn ? 'Operational Expenses ($ Costs)' : 'Costos Operativos ($ Gastos)'}</span>
              </div>
            )}
            {(financialMetricView === 'all' || financialMetricView === 'profit') && (
              <div className="flex items-center gap-1.5">
                <div className="w-3 h-3 rounded-full bg-amber-500 shadow-2xs" />
                <span className="text-slate-800">{isEn ? 'Net Profit ($ Surplus)' : 'Utilidad Neta ($ Excedente)'}</span>
              </div>
            )}
          </div>

          <span className="text-[11px] font-semibold text-slate-400">
            {isEn ? 'Hover nodes for monthly values' : 'Pasa el cursor sobre los nodos para ver valores'}
          </span>
        </div>

        {/* Full-width SVG Timeline Chart */}
        <div className="w-full h-64 sm:h-72 relative bg-slate-50/60 rounded-2xl p-3 border border-slate-100 flex items-center justify-center">
          <svg className="w-full h-full overflow-visible" viewBox="0 0 800 200" preserveAspectRatio="none">
            <defs>
              <linearGradient id="fullRevGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#10b981" stopOpacity="0.35" />
                <stop offset="100%" stopColor="#10b981" stopOpacity="0.0" />
              </linearGradient>
              <linearGradient id="fullCostGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#f43f5e" stopOpacity="0.25" />
                <stop offset="100%" stopColor="#f43f5e" stopOpacity="0.0" />
              </linearGradient>
              <linearGradient id="fullProfitGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#f59e0b" stopOpacity="0.25" />
                <stop offset="100%" stopColor="#f59e0b" stopOpacity="0.0" />
              </linearGradient>
            </defs>

            {/* Horizontal Grid lines */}
            {[0, 1, 2, 3, 4].map((gridIndex) => {
              const yPos = 20 + gridIndex * 37.5;
              const valLabel = Math.round(30000 - (gridIndex * 7500));
              return (
                <g key={gridIndex}>
                  <line x1="40" y1={yPos} x2="780" y2={yPos} stroke="#e2e8f0" strokeDasharray="4 4" strokeWidth="1" />
                  <text x="35" y={yPos + 4} textAnchor="end" className="text-[9px] font-bold fill-slate-400">
                    ${(valLabel / 1000).toFixed(1)}k
                  </text>
                </g>
              );
            })}

            {/* Area & Line for Revenue */}
            {(financialMetricView === 'all' || financialMetricView === 'revenue') && (
              <>
                <polygon
                  points={`40,170 ${displayedTimeline.map((d, i) => {
                    const x = 40 + (i / (displayedTimeline.length - 1)) * 740;
                    const y = 170 - (d.revenue / 30000) * 150;
                    return `${x},${y}`;
                  }).join(' ')} 780,170`}
                  fill="url(#fullRevGrad)"
                />
                <polyline
                  points={displayedTimeline.map((d, i) => {
                    const x = 40 + (i / (displayedTimeline.length - 1)) * 740;
                    const y = 170 - (d.revenue / 30000) * 150;
                    return `${x},${y}`;
                  }).join(' ')}
                  fill="none"
                  stroke="#10b981"
                  strokeWidth="3.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </>
            )}

            {/* Area & Line for Costs */}
            {(financialMetricView === 'all' || financialMetricView === 'costs') && (
              <>
                <polygon
                  points={`40,170 ${displayedTimeline.map((d, i) => {
                    const x = 40 + (i / (displayedTimeline.length - 1)) * 740;
                    const y = 170 - (d.costs / 30000) * 150;
                    return `${x},${y}`;
                  }).join(' ')} 780,170`}
                  fill="url(#fullCostGrad)"
                />
                <polyline
                  points={displayedTimeline.map((d, i) => {
                    const x = 40 + (i / (displayedTimeline.length - 1)) * 740;
                    const y = 170 - (d.costs / 30000) * 150;
                    return `${x},${y}`;
                  }).join(' ')}
                  fill="none"
                  stroke="#f43f5e"
                  strokeWidth="2.5"
                  strokeDasharray={displayedTimeline.some(d => d.isProjection) ? "6 3" : undefined}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </>
            )}

            {/* Area & Line for Profit */}
            {(financialMetricView === 'all' || financialMetricView === 'profit') && (
              <>
                <polygon
                  points={`40,170 ${displayedTimeline.map((d, i) => {
                    const x = 40 + (i / (displayedTimeline.length - 1)) * 740;
                    const y = 170 - (d.profit / 30000) * 150;
                    return `${x},${y}`;
                  }).join(' ')} 780,170`}
                  fill="url(#fullProfitGrad)"
                />
                <polyline
                  points={displayedTimeline.map((d, i) => {
                    const x = 40 + (i / (displayedTimeline.length - 1)) * 740;
                    const y = 170 - (d.profit / 30000) * 150;
                    return `${x},${y}`;
                  }).join(' ')}
                  fill="none"
                  stroke="#f59e0b"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </>
            )}

            {/* Interactive Data Nodes & Month Labels */}
            {displayedTimeline.map((d, i) => {
              const x = 40 + (i / (displayedTimeline.length - 1)) * 740;
              const yRev = 170 - (d.revenue / 30000) * 150;
              const yCost = 170 - (d.costs / 30000) * 150;
              const yProf = 170 - (d.profit / 30000) * 150;
              const isSelected = hoveredFinancialMonth === i;

              return (
                <g 
                  key={i}
                  className="cursor-pointer group"
                  onMouseEnter={() => setHoveredFinancialMonth(i)}
                  onMouseLeave={() => setHoveredFinancialMonth(null)}
                >
                  {/* Vertical Guide Hover Line */}
                  {isSelected && (
                    <line x1={x} y1="20" x2={x} y2="170" stroke="#0D224A" strokeWidth="1.5" strokeDasharray="3 3" />
                  )}

                  {/* Revenue Circle Node */}
                  {(financialMetricView === 'all' || financialMetricView === 'revenue') && (
                    <circle
                      cx={x}
                      cy={yRev}
                      r={isSelected ? "6" : "4"}
                      fill={isSelected ? "#047857" : "#10b981"}
                      stroke="#ffffff"
                      strokeWidth="2"
                      className="transition-all duration-200"
                    />
                  )}

                  {/* Costs Circle Node */}
                  {(financialMetricView === 'all' || financialMetricView === 'costs') && (
                    <circle
                      cx={x}
                      cy={yCost}
                      r={isSelected ? "5" : "3.5"}
                      fill={isSelected ? "#be123c" : "#f43f5e"}
                      stroke="#ffffff"
                      strokeWidth="2"
                      className="transition-all duration-200"
                    />
                  )}

                  {/* Profit Circle Node */}
                  {(financialMetricView === 'all' || financialMetricView === 'profit') && (
                    <circle
                      cx={x}
                      cy={yProf}
                      r={isSelected ? "5" : "3.5"}
                      fill={isSelected ? "#b45309" : "#f59e0b"}
                      stroke="#ffffff"
                      strokeWidth="2"
                      className="transition-all duration-200"
                    />
                  )}

                  {/* Month X Label */}
                  <text 
                    x={x} 
                    y="188" 
                    textAnchor="middle" 
                    className={`text-[10px] ${isSelected ? 'font-black fill-slate-900 scale-110' : 'font-bold fill-slate-500'} ${d.isProjection ? 'fill-amber-600' : ''}`}
                  >
                    {d.month}
                  </text>
                </g>
              );
            })}
          </svg>
        </div>

        {/* Selected Month Interactive Detail Bar */}
        {(() => {
          const activeItem = hoveredFinancialMonth !== null 
            ? displayedTimeline[hoveredFinancialMonth] 
            : displayedTimeline[displayedTimeline.length - 1];

          return (
            <div className="bg-[#0D224A] text-white p-4 rounded-2xl flex flex-wrap items-center justify-between gap-4 border border-amber-400/30 shadow-md animate-fade-in">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-amber-400 text-slate-950 flex items-center justify-center font-black text-sm">
                  {activeItem.month.slice(0, 3)}
                </div>
                <div>
                  <h4 className="text-xs font-black uppercase tracking-wider text-amber-300">
                    {isEn ? 'MONTHLY FINANCIAL SUMMARY' : 'RESUMEN FINANCIERO MENSUAL'} ({activeItem.month})
                  </h4>
                  <p className="text-[11px] text-slate-300 font-semibold">
                    {activeItem.pro} {isEn ? 'Pro users' : 'suscriptores Pro'} • {activeItem.inst} {isEn ? 'Institutions' : 'Institucionales'}
                  </p>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-6 text-xs">
                <div>
                  <span className="text-[10px] font-bold text-slate-400 block uppercase">{isEn ? 'Gross Revenue' : 'Ingresos Brutos'}</span>
                  <span className="text-sm font-black text-emerald-400">${activeItem.revenue.toLocaleString()}</span>
                </div>
                <div>
                  <span className="text-[10px] font-bold text-slate-400 block uppercase">{isEn ? 'Operational Costs' : 'Costos Operativos'}</span>
                  <span className="text-sm font-black text-rose-400">${activeItem.costs.toLocaleString()}</span>
                </div>
                <div>
                  <span className="text-[10px] font-bold text-slate-400 block uppercase">{isEn ? 'Net Profit' : 'Utilidad Neta'}</span>
                  <span className="text-sm font-black text-amber-300">${activeItem.profit.toLocaleString()}</span>
                </div>
                <div>
                  <span className="text-[10px] font-bold text-slate-400 block uppercase">{isEn ? 'Net Margin %' : 'Margen Neto'}</span>
                  <span className="text-sm font-black text-blue-300">{activeItem.margin}</span>
                </div>
              </div>
            </div>
          );
        })()}
      </div>

      {/* MIDDLE SECTION: SUBSCRIPTION REVENUE DONUT + OPERATIONAL COSTS */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        
        {/* LEFT: SUBSCRIPTION REVENUE BREAKDOWN DONUT WHEEL */}
        <div className="bg-white p-5 sm:p-6 rounded-3xl border border-slate-200/90 shadow-2xs space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2">
              <PieChart className="w-5 h-5 text-emerald-600" />
              <h3 className="text-sm font-black text-slate-900 uppercase tracking-wider">
                {isEn ? 'REVENUE BY SUBSCRIPTION TIER' : 'INGRESOS POR PLAN DE SUSCRIPCIÓN'}
              </h3>
            </div>
            <span className="text-xs font-extrabold text-slate-500">$18,450.00 Total</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 items-center gap-6">
            
            {/* DONUT SVG */}
            <div 
              className="flex flex-col items-center justify-center p-2 select-none"
              onMouseLeave={() => setHoveredPlan(null)}
            >
              <div className="relative flex items-center justify-center">
                <svg width="200" height="200" viewBox="0 0 140 140" className="transform -rotate-90 drop-shadow-sm transition-all duration-300">
                  <circle cx="70" cy="70" r="52" stroke="#f1f5f9" strokeWidth="14" fill="transparent" />

                  {subscriptionPlans.map((plan) => {
                    const isActive = activePlanId === plan.id;
                    const isDimmed = activePlanId && !isActive;

                    return (
                      <circle
                        key={plan.id}
                        cx="70"
                        cy="70"
                        r="52"
                        stroke={isActive ? plan.hoverColor : plan.color}
                        strokeWidth={isActive ? 18 : 14}
                        strokeDasharray={plan.dashArray}
                        strokeDashoffset={plan.dashOffset}
                        strokeLinecap="round"
                        fill="transparent"
                        opacity={isDimmed ? 0.35 : 1}
                        className="transition-all duration-300 cursor-pointer"
                        onMouseEnter={() => setHoveredPlan(plan.id)}
                        onClick={() => setSelectedPlan(selectedPlan === plan.id ? null : plan.id)}
                      />
                    );
                  })}
                </svg>

                {/* INNER DONUT TEXT */}
                <div 
                  className="absolute inset-0 flex flex-col items-center justify-center text-center cursor-pointer p-2 transition-all duration-300"
                  onClick={() => { setSelectedPlan(null); setHoveredPlan(null); }}
                >
                  <span className={`text-xl font-black leading-none ${activePlan ? activePlan.accentColor : 'text-slate-900'}`}>
                    {activePlan ? activePlan.revenue : '$18,450'}
                  </span>
                  <span className="text-[10px] font-black uppercase tracking-wider mt-1 text-slate-500">
                    {activePlan ? activePlan.shortLabel : (isEn ? 'Total Monthly' : 'Mensual Total')}
                  </span>
                  <span className="text-[9px] font-bold text-slate-400 mt-0.5">
                    {activePlan ? activePlan.percentage : '100%'}
                  </span>
                </div>
              </div>
            </div>

            {/* PLAN LEGEND */}
            <div className="flex flex-col gap-2.5 w-full">
              {subscriptionPlans.map((plan) => {
                const isActive = activePlanId === plan.id;
                const isDimmed = activePlanId && !isActive;

                return (
                  <div
                    key={plan.id}
                    onMouseEnter={() => setHoveredPlan(plan.id)}
                    onMouseLeave={() => setHoveredPlan(null)}
                    onClick={() => setSelectedPlan(selectedPlan === plan.id ? null : plan.id)}
                    className={`p-2.5 rounded-2xl border transition-all duration-200 cursor-pointer flex items-center justify-between gap-2 ${
                      isActive 
                        ? 'bg-slate-50 border-slate-300 shadow-2xs scale-[1.02]' 
                        : isDimmed 
                        ? 'opacity-40 border-transparent hover:opacity-100' 
                        : 'bg-white border-slate-100 hover:border-slate-200'
                    }`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className={`w-3 h-3 rounded-full ${plan.dotBg} shrink-0`} />
                      <div className="min-w-0">
                        <div className="text-xs font-extrabold text-slate-900 truncate">
                          {plan.label}
                        </div>
                        <div className="text-[10px] text-slate-500 font-medium">
                          {plan.count} {isEn ? 'subscribers' : 'suscriptores'}
                        </div>
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <div className={`text-xs font-black ${plan.accentColor}`}>
                        {plan.revenue}
                      </div>
                      <div className="text-[10px] text-slate-500 font-bold">
                        {plan.percentage}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

          </div>
        </div>

        {/* RIGHT: OPERATIONAL COST STRUCTURE & NET MARGIN */}
        <div className="bg-white p-5 sm:p-6 rounded-3xl border border-slate-200/90 shadow-2xs space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-blue-600" />
              <h3 className="text-sm font-black text-slate-900 uppercase tracking-wider">
                {isEn ? 'OPERATIONAL COSTS & NET MARGIN' : 'ESTRUCTURA DE COSTOS Y MARGEN NETO'}
              </h3>
            </div>
            <span className="text-xs font-extrabold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-1 rounded-full">
              {isEn ? 'Net Profit: 29%' : 'Ganancia Neta: 29%'}
            </span>
          </div>

          <div className="space-y-3.5 pt-1">
            {costItems.map((item, idx) => (
              <div key={idx} className="space-y-1.5">
                <div className="flex items-center justify-between text-xs font-extrabold">
                  <span className="text-slate-800">{item.name}</span>
                  <div className="flex items-center gap-2">
                    <span className="text-slate-500 font-medium">{item.percent}%</span>
                    <span className="text-slate-900 font-black">{item.amount}</span>
                  </div>
                </div>
                <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden flex">
                  <div 
                    className={`h-full ${item.color} transition-all duration-500 rounded-full`} 
                    style={{ width: `${item.percent}%` }}
                  />
                </div>
              </div>
            ))}
          </div>

          {/* NET PROFIT HIGHLIGHT BOX */}
          <div className="bg-emerald-50/80 border border-emerald-200 rounded-2xl p-4 flex items-center justify-between mt-4">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-emerald-600 text-white flex items-center justify-center font-bold">
                ✓
              </div>
              <div>
                <h4 className="text-xs font-black text-emerald-950 uppercase">
                  {isEn ? 'OPERATIONAL SURPLUS (MONTHLY)' : 'EXCEDENTE OPERATIVO NETO (MENSUAL)'}
                </h4>
                <p className="text-[11px] text-emerald-800 font-semibold">
                  {isEn ? 'Reinvested in course expansion & Gemini live optimization' : 'Reinvertido en expansión de cursos y optimizaciones de IA'}
                </p>
              </div>
            </div>
            <span className="text-lg font-black text-emerald-900">$5,351.00</span>
          </div>
        </div>

      </div>

      {/* LOWER SECTION: PRICE SIMULATOR */}
      <div className="w-full">
        
        {/* INTERACTIVE REVENUE SIMULATOR */}
        <div className="bg-white p-5 sm:p-6 rounded-3xl border border-slate-200/90 shadow-2xs space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2">
              <Sliders className="w-5 h-5 text-amber-600" />
              <h3 className="text-sm font-black text-slate-900 uppercase tracking-wider">
                {isEn ? 'INTERACTIVE REVENUE SIMULATOR' : 'SIMULADOR INTERACTIVO DE INGRESOS'}
              </h3>
            </div>
            <span className="text-xs font-extrabold text-amber-700 bg-amber-50 border border-amber-200 px-2.5 py-1 rounded-full">
              {isEn ? 'Projection Tool' : 'Proyección'}
            </span>
          </div>

          <div className="space-y-4 pt-1">
            {/* Slider 1: Number of Pro Users */}
            <div className="space-y-1.5">
              <div className="flex justify-between items-center text-xs font-bold">
                <label className="text-slate-700">
                  {isEn ? 'Pro Subscribers Count' : 'Cantidad de Suscriptores Pro'}:
                </label>
                <span className="font-black text-slate-900 bg-slate-100 px-2 py-0.5 rounded-lg">{simulatedProUsers}</span>
              </div>
              <input 
                type="range"
                min="100"
                max="1000"
                step="10"
                value={simulatedProUsers}
                onChange={(e) => setSimulatedProUsers(Number(e.target.value))}
                className="w-full accent-[#0D224A] cursor-pointer"
              />
            </div>

            {/* Slider 2: Monthly Price */}
            <div className="space-y-1.5">
              <div className="flex justify-between items-center text-xs font-bold">
                <label className="text-slate-700">
                  {isEn ? 'Pro Monthly Price ($USD)' : 'Precio Mensual Plan Pro ($USD)'}:
                </label>
                <span className="font-black text-slate-900 bg-slate-100 px-2 py-0.5 rounded-lg">${simulatedProPrice.toFixed(2)}</span>
              </div>
              <input 
                type="range"
                min="14.99"
                max="49.99"
                step="1"
                value={simulatedProPrice}
                onChange={(e) => setSimulatedProPrice(Number(e.target.value))}
                className="w-full accent-emerald-600 cursor-pointer"
              />
            </div>

            {/* PROJECTION RESULT BOX */}
            <div className="bg-[#0D224A] text-white p-4 rounded-2xl space-y-2 border border-amber-400/40 shadow-md">
              <div className="flex items-center justify-between text-xs font-bold text-amber-400">
                <span>{isEn ? 'PROJECTED MONTHLY REVENUE (MRR)' : 'INGRESO MENSUAL PROYECTADO (MRR)'}</span>
                <Sparkles className="w-4 h-4" />
              </div>
              <div className="text-2xl sm:text-3xl font-black text-white tracking-tight">
                ${simulatedMRR.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </div>
              <p className="text-[11px] text-slate-300 font-medium">
                {isEn
                  ? `Based on ${simulatedProUsers} Pro subscribers at $${simulatedProPrice.toFixed(2)}/mo plus static institutional fees.`
                  : `Basado en ${simulatedProUsers} usuarios Pro a $${simulatedProPrice.toFixed(2)}/mes más ingresos institucionales.`}
              </p>
            </div>
          </div>
        </div>

      </div>

      {/* QUARTERLY FINANCIAL PROJECTION TABLE */}
      <div className="bg-white p-5 sm:p-6 rounded-3xl border border-slate-200/90 shadow-2xs space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2">
            <Calendar className="w-5 h-5 text-purple-600" />
            <h3 className="text-sm font-black text-slate-900 uppercase tracking-wider">
              {isEn ? 'QUARTERLY GROWTH PROJECTIONS (2026)' : 'PROYECCIONES TRIMESTRALES DE CRECIMIENTO (2026)'}
            </h3>
          </div>
          <span className="text-xs font-extrabold text-slate-500">Q1 - Q4 2026</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="bg-slate-50 text-slate-700 font-black uppercase text-[10px] tracking-wider border-b border-slate-200">
                <th className="p-3">Periodo</th>
                <th className="p-3">Suscriptores</th>
                <th className="p-3">MRR Meta</th>
                <th className="p-3">Costo IA & Nube</th>
                <th className="p-3">Margen Neto %</th>
                <th className="p-3 text-right">Estado</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium text-slate-900">
              <tr className="hover:bg-slate-50">
                <td className="p-3 font-bold text-slate-900">Q1 2026 (Actual)</td>
                <td className="p-3 font-semibold">615 usuarios</td>
                <td className="p-3 font-black text-emerald-700">$18,450 USD</td>
                <td className="p-3">$6,826 USD</td>
                <td className="p-3 font-bold text-blue-700">29%</td>
                <td className="p-3 text-right">
                  <span className="px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-extrabold">Alcanzado ✓</span>
                </td>
              </tr>
              <tr className="hover:bg-slate-50">
                <td className="p-3 font-bold text-slate-900">Q2 2026 (Proyección)</td>
                <td className="p-3 font-semibold">850 usuarios</td>
                <td className="p-3 font-black text-emerald-700">$25,500 USD</td>
                <td className="p-3">$8,900 USD</td>
                <td className="p-3 font-bold text-blue-700">32%</td>
                <td className="p-3 text-right">
                  <span className="px-2.5 py-0.5 rounded-full bg-blue-100 text-blue-800 text-[10px] font-extrabold">En Progreso</span>
                </td>
              </tr>
              <tr className="hover:bg-slate-50">
                <td className="p-3 font-bold text-slate-900">Q3 2026 (Objetivo)</td>
                <td className="p-3 font-semibold">1,200 usuarios</td>
                <td className="p-3 font-black text-emerald-700">$36,000 USD</td>
                <td className="p-3">$11,500 USD</td>
                <td className="p-3 font-bold text-blue-700">35%</td>
                <td className="p-3 text-right">
                  <span className="px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700 text-[10px] font-extrabold">Programado</span>
                </td>
              </tr>
              <tr className="hover:bg-slate-50">
                <td className="p-3 font-bold text-slate-900">Q4 2026 (Meta Anual)</td>
                <td className="p-3 font-semibold">1,800 usuarios</td>
                <td className="p-3 font-black text-emerald-700">$54,000 USD</td>
                <td className="p-3">$15,000 USD</td>
                <td className="p-3 font-bold text-blue-700">38%</td>
                <td className="p-3 text-right">
                  <span className="px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-900 text-[10px] font-extrabold">Meta Final</span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
};
