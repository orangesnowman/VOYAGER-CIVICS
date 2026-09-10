import React, { useState, useEffect } from 'react';
import { 
  Sparkles, 
  BrainCircuit, 
  CheckCircle2, 
  TrendingUp, 
  AlertTriangle, 
  Database, 
  ChevronRight, 
  ShieldCheck, 
  Target, 
  HelpCircle,
  Lightbulb,
  BarChart2,
  Info
} from 'lucide-react';
import { useDataSourceMode } from '../services/dataSourceProvider';
import { VoyagerOrchestrator } from '../domain/orchestrator/VoyagerOrchestrator';
import { ClassifiedDataPoint, MissingKPIRequirement, BIAdvisorAnalysis } from '../domain/advisors/types';

interface BusinessAdvisorFrameworkCardProps {
  selectedLang: 'EN' | 'ES';
  currentTab?: string;
  onNavigateTab?: (tab: string) => void;
}

export const BusinessAdvisorFrameworkCard: React.FC<BusinessAdvisorFrameworkCardProps> = ({
  selectedLang,
  currentTab = 'economia',
  onNavigateTab
}) => {
  const isEn = selectedLang === 'EN';
  const [dataMode] = useDataSourceMode();
  const [activeTab, setActiveTab] = useState<'all' | 'facts' | 'estimates' | 'recommendations' | 'missing'>('all');
  const [analysis, setAnalysis] = useState<BIAdvisorAnalysis | null>(null);
  const [completenessScore, setCompletenessScore] = useState<number>(78);
  const [facts, setFacts] = useState<ClassifiedDataPoint[]>([]);
  const [estimates, setEstimates] = useState<ClassifiedDataPoint[]>([]);
  const [recommendations, setRecommendations] = useState<ClassifiedDataPoint[]>([]);
  const [missingKPIs, setMissingKPIs] = useState<MissingKPIRequirement[]>([]);

  useEffect(() => {
    let isMounted = true;
    async function loadOrchestration() {
      const result = await VoyagerOrchestrator.orchestrate({
        currentTab,
        dataMode,
        language: selectedLang
      });

      if (isMounted) {
        setFacts(result.aggregatedFacts);
        setEstimates(result.aggregatedEstimates);
        setRecommendations(result.aggregatedRecommendations);
        setMissingKPIs(result.aggregatedMissingKPIs);
        setCompletenessScore(result.dataCompletenessPercentage);
        if (result.biAdvisorAnalysis) {
          setAnalysis(result.biAdvisorAnalysis);
        }
      }
    }

    loadOrchestration();
    return () => { isMounted = false; };
  }, [currentTab, dataMode, selectedLang]);

  return (
    <div className="bg-gradient-to-br from-[#0D224A] via-[#102A5C] to-[#0A1938] text-white rounded-3xl p-5 sm:p-6 border border-blue-900/40 shadow-xl space-y-5 text-left font-sans relative overflow-hidden">
      
      {/* Decorative background ambient lighting */}
      <div className="absolute top-0 right-0 w-80 h-80 bg-amber-400/5 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-80 h-80 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />

      {/* TOP HEADER & DATA SOURCE BADGE */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-blue-800/50 pb-4 relative z-10">
        <div className="flex items-center gap-2.5">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-amber-400 to-amber-300 text-slate-950 flex items-center justify-center font-black shadow-md shrink-0">
            <BrainCircuit className="w-5 h-5 text-slate-950" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-base sm:text-lg font-black tracking-tight text-white">
                {isEn ? 'VOYAGER Business Intelligence Advisor' : 'Asesor de Inteligencia de Negocios VOYAGER'}
              </h3>
              <span className="px-2 py-0.5 rounded-full bg-amber-400/20 text-amber-300 text-[10px] font-black tracking-wider uppercase border border-amber-400/30">
                AI Partner
              </span>
            </div>
            <p className="text-xs text-blue-200/80 font-medium mt-0.5">
              {isEn 
                ? 'Strategic decision engine: Facts vs Estimates vs AI Guidance' 
                : 'Motor de decisión estratégica: Datos Medidos vs Estimaciones vs Recomendaciones IA'}
            </p>
          </div>
        </div>

        {/* DATA COMPLETENESS SCORE & DATA MODE BADGE */}
        <div className="flex items-center gap-3 shrink-0">
          <div className="flex flex-col items-end">
            <span className="text-[10px] font-mono text-blue-200/70 uppercase tracking-wider">
              {isEn ? 'Data Completeness:' : 'Compleitud de Datos:'}
            </span>
            <div className="flex items-center gap-1.5 mt-0.5">
              <div className="w-20 h-2 rounded-full bg-blue-950 overflow-hidden border border-blue-800/60">
                <div 
                  className="h-full bg-gradient-to-r from-amber-400 to-emerald-400 transition-all duration-500" 
                  style={{ width: `${completenessScore}%` }}
                />
              </div>
              <span className="text-xs font-black text-amber-300 font-mono">{completenessScore}%</span>
            </div>
          </div>

          <div className="px-3 py-1.5 rounded-full bg-blue-950/80 border border-blue-700/60 text-blue-200 text-xs font-bold flex items-center gap-1.5 shadow-2xs font-mono">
            <Database className="w-3.5 h-3.5 text-amber-400" />
            <span className="uppercase text-[10px] tracking-wider">
              {dataMode === 'demo' ? (isEn ? 'Demo Mode' : 'Modo Demo') : dataMode === 'live' ? (isEn ? 'Live Firestore' : 'Firestore en Vivo') : (isEn ? 'Hybrid Mode' : 'Modo Híbrido')}
            </span>
          </div>
        </div>
      </div>

      {/* EXECUTIVE SUMMARY & AI PARTNER DIAGNOSTIC */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5 relative z-10">
        
        {/* WHAT IS HAPPENING */}
        <div className="bg-blue-950/50 p-4 rounded-2xl border border-blue-800/40 space-y-1.5">
          <div className="flex items-center gap-1.5 text-xs font-bold text-amber-300 uppercase tracking-wider">
            <BarChart2 className="w-3.5 h-3.5" />
            <span>{isEn ? '1. What is Happening' : '1. Qué Está Sucediendo'}</span>
          </div>
          <p className="text-xs text-blue-100/90 leading-relaxed font-medium">
            {analysis?.whatIsHappening || (isEn 
              ? 'MRR is growing smoothly ($18,450/mo) powered by 615 active learner subscriptions across Pro and Educational packages.'
              : 'El MRR crece sostenidamente ($18,450/mes) impulsado por 615 suscripciones activas entre paquetes Pro e Institucionales.')}
          </p>
        </div>

        {/* WHY IT IS HAPPENING */}
        <div className="bg-blue-950/50 p-4 rounded-2xl border border-blue-800/40 space-y-1.5">
          <div className="flex items-center gap-1.5 text-xs font-bold text-blue-300 uppercase tracking-wider">
            <Info className="w-3.5 h-3.5" />
            <span>{isEn ? '2. Why It Is Happening' : '2. Por Qué Sucede'}</span>
          </div>
          <p className="text-xs text-blue-100/90 leading-relaxed font-medium">
            {analysis?.whyItIsHappening || (isEn 
              ? 'Onboarding single source of truth aligns student intent to specialized tracks, driving 14.2x LTV/CAC unit economics.'
              : 'La fuente única de onboarding alinea la intención con rutas especializadas, generando una relación LTV/CAC de 14.2x.')}
          </p>
        </div>

        {/* WHAT TO DO NEXT */}
        <div className="bg-amber-400/10 p-4 rounded-2xl border border-amber-400/30 space-y-1.5">
          <div className="flex items-center gap-1.5 text-xs font-bold text-amber-300 uppercase tracking-wider">
            <Target className="w-3.5 h-3.5" />
            <span>{isEn ? '3. What To Do Next' : '3. Qué Hacer Ahora'}</span>
          </div>
          <ul className="text-xs text-amber-100/90 leading-relaxed font-medium space-y-1">
            {(analysis?.whatToDoNext || [
              isEn ? 'Log UTM channel params during onboarding.' : 'Registrar parámetros UTM en el onboarding.',
              isEn ? 'Scale B2B university partnerships.' : 'Escalar alianzas universitarias B2B.'
            ]).map((step, idx) => (
              <li key={idx} className="flex items-start gap-1.5">
                <span className="text-amber-400 font-bold">•</span>
                <span>{step}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* FILTER TABS FOR CLASSIFIED DATA */}
      <div className="flex items-center gap-2 border-b border-blue-800/40 pb-2 overflow-x-auto relative z-10 text-xs">
        <button
          type="button"
          onClick={() => setActiveTab('all')}
          className={`px-3 py-1.5 rounded-full font-bold transition-all cursor-pointer whitespace-nowrap ${
            activeTab === 'all' 
              ? 'bg-amber-400 text-slate-950 font-black shadow-2xs' 
              : 'text-blue-200/80 hover:text-white hover:bg-blue-900/40'
          }`}
        >
          {isEn ? 'All Data Points' : 'Todos los Datos'} ({facts.length + estimates.length + recommendations.length})
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('facts')}
          className={`px-3 py-1.5 rounded-full font-bold transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
            activeTab === 'facts' 
              ? 'bg-emerald-500 text-white font-black shadow-2xs' 
              : 'text-emerald-300/80 hover:text-emerald-200 hover:bg-emerald-950/40'
          }`}
        >
          <ShieldCheck className="w-3.5 h-3.5" />
          <span>{isEn ? 'Facts (Measured Data)' : 'Datos Medidos (Facts)'}</span>
          <span className="px-1.5 py-0.2 rounded-full bg-emerald-950 text-emerald-300 text-[10px]">{facts.length}</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('estimates')}
          className={`px-3 py-1.5 rounded-full font-bold transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
            activeTab === 'estimates' 
              ? 'bg-blue-600 text-white font-black shadow-2xs' 
              : 'text-blue-300/80 hover:text-blue-200 hover:bg-blue-950/40'
          }`}
        >
          <TrendingUp className="w-3.5 h-3.5" />
          <span>{isEn ? 'Estimates (Projections)' : 'Estimaciones (Modelos)'}</span>
          <span className="px-1.5 py-0.2 rounded-full bg-blue-950 text-blue-300 text-[10px]">{estimates.length}</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('recommendations')}
          className={`px-3 py-1.5 rounded-full font-bold transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
            activeTab === 'recommendations' 
              ? 'bg-amber-400 text-slate-950 font-black shadow-2xs' 
              : 'text-amber-300/80 hover:text-amber-200 hover:bg-amber-950/40'
          }`}
        >
          <Lightbulb className="w-3.5 h-3.5" />
          <span>{isEn ? 'AI Recommendations' : 'Recomendaciones IA'}</span>
          <span className="px-1.5 py-0.2 rounded-full bg-amber-950 text-amber-300 text-[10px]">{recommendations.length}</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('missing')}
          className={`px-3 py-1.5 rounded-full font-bold transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
            activeTab === 'missing' 
              ? 'bg-rose-600 text-white font-black shadow-2xs' 
              : 'text-rose-300/80 hover:text-rose-200 hover:bg-rose-950/40'
          }`}
        >
          <AlertTriangle className="w-3.5 h-3.5" />
          <span>{isEn ? 'Missing KPIs' : 'KPIs Faltantes'}</span>
          <span className="px-1.5 py-0.2 rounded-full bg-rose-950 text-rose-300 text-[10px]">{missingKPIs.length}</span>
        </button>
      </div>

      {/* DATA GRID DISPLAY */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 relative z-10">
        
        {/* FACTS */}
        {(activeTab === 'all' || activeTab === 'facts') && facts.map(item => (
          <div key={item.id} className="bg-emerald-950/30 border border-emerald-500/40 p-3.5 rounded-2xl space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 text-[9px] font-black uppercase tracking-wider border border-emerald-500/30 flex items-center gap-1">
                <ShieldCheck className="w-3 h-3" />
                <span>FACT (MEASURED)</span>
              </span>
              <span className="text-[10px] font-mono text-emerald-300/80">{item.source}</span>
            </div>
            <div className="flex items-baseline justify-between pt-0.5">
              <h4 className="text-xs font-bold text-white">{item.metricName}</h4>
              <span className="text-sm font-black text-emerald-300 font-mono">{item.value} {item.unit || ''}</span>
            </div>
            <p className="text-[11px] text-emerald-100/70 leading-normal">{item.description}</p>
          </div>
        ))}

        {/* ESTIMATES */}
        {(activeTab === 'all' || activeTab === 'estimates') && estimates.map(item => (
          <div key={item.id} className="bg-blue-950/40 border border-blue-500/40 p-3.5 rounded-2xl space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-300 text-[9px] font-black uppercase tracking-wider border border-blue-500/30 flex items-center gap-1">
                <TrendingUp className="w-3 h-3" />
                <span>ESTIMATE (MODEL)</span>
              </span>
              <span className="text-[10px] font-mono text-blue-300/80">{item.source}</span>
            </div>
            <div className="flex items-baseline justify-between pt-0.5">
              <h4 className="text-xs font-bold text-white">{item.metricName}</h4>
              <span className="text-sm font-black text-blue-300 font-mono">{item.value} {item.unit || ''}</span>
            </div>
            <p className="text-[11px] text-blue-100/70 leading-normal">{item.description}</p>
          </div>
        ))}

        {/* RECOMMENDATIONS */}
        {(activeTab === 'all' || activeTab === 'recommendations') && recommendations.map(item => (
          <div key={item.id} className="bg-amber-950/30 border border-amber-500/40 p-3.5 rounded-2xl space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 text-[9px] font-black uppercase tracking-wider border border-amber-500/30 flex items-center gap-1">
                <Lightbulb className="w-3 h-3" />
                <span>AI RECOMMENDATION</span>
              </span>
              <span className="text-[10px] font-mono text-amber-300/80">{item.source}</span>
            </div>
            <div className="flex items-baseline justify-between pt-0.5">
              <h4 className="text-xs font-bold text-white">{item.metricName}</h4>
              <span className="text-xs font-black text-amber-300 font-mono uppercase">{item.value}</span>
            </div>
            <p className="text-[11px] text-amber-100/70 leading-normal">{item.description}</p>
          </div>
        ))}

        {/* MISSING KPIS */}
        {(activeTab === 'all' || activeTab === 'missing') && missingKPIs.map(item => (
          <div key={item.id} className="bg-rose-950/30 border border-rose-500/40 p-3.5 rounded-2xl space-y-1.5 md:col-span-2">
            <div className="flex items-center justify-between">
              <span className="px-2 py-0.5 rounded-full bg-rose-500/20 text-rose-300 text-[9px] font-black uppercase tracking-wider border border-rose-500/30 flex items-center gap-1">
                <AlertTriangle className="w-3 h-3" />
                <span>MISSING KPI • {item.importance} PRIORITY</span>
              </span>
              <span className="text-[10px] font-mono text-rose-300/80">Target: {item.targetCollectionOrSource}</span>
            </div>
            <h4 className="text-xs font-bold text-white">{item.kpiName}</h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px] text-rose-100/80 pt-1">
              <div className="bg-rose-950/60 p-2 rounded-xl border border-rose-800/40">
                <span className="font-bold text-amber-300 block mb-0.5">{isEn ? 'Why It Matters:' : 'Por qué importa:'}</span>
                <span>{item.whyItMatters}</span>
              </div>
              <div className="bg-rose-950/60 p-2 rounded-xl border border-rose-800/40">
                <span className="font-bold text-emerald-300 block mb-0.5">{isEn ? 'Next Data To Collect:' : 'Dato a recolectar:'}</span>
                <span>{item.recommendedDataToCollect}</span>
              </div>
            </div>
          </div>
        ))}
      </div>

    </div>
  );
};
