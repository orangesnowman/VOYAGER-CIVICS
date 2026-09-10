import { 
  ExpertFramework, 
  FrameworkConsultationContext, 
  ExpertFrameworkResult, 
  ClassifiedDataPoint, 
  MissingKPIRequirement, 
  BIAdvisorAnalysis 
} from '../advisors/types';
import { businessIntelligenceAdvisor, BusinessIntelligenceAdvisor } from '../advisors/BusinessIntelligenceAdvisor';
import { languageLearningAdvisor } from '../advisors/LanguageLearningAdvisor';
import { citizenshipAdvisor } from '../advisors/CitizenshipAdvisor';
import { getLocalProfileCache } from '../../services/userProfileService';
import { DataSourceProvider } from '../../services/dataSourceProvider';

export interface OrchestratedConsultationResult {
  timestamp: string;
  primaryFrameworkId: string;
  consultedFrameworks: string[];
  singleVoicePersona: string;
  aggregatedFacts: ClassifiedDataPoint[];
  aggregatedEstimates: ClassifiedDataPoint[];
  aggregatedRecommendations: ClassifiedDataPoint[];
  aggregatedMissingKPIs: MissingKPIRequirement[];
  dataCompletenessPercentage: number;
  unifiedSystemPromptAugmentation: string;
  biAdvisorAnalysis?: BIAdvisorAnalysis;
}

class VoyagerOrchestratorEngine {
  private frameworks: Map<string, ExpertFramework> = new Map();

  constructor() {
    this.registerFramework(businessIntelligenceAdvisor);
    this.registerFramework(languageLearningAdvisor);
    this.registerFramework(citizenshipAdvisor);
  }

  public registerFramework(framework: ExpertFramework) {
    this.frameworks.set(framework.id, framework);
  }

  public getRegisteredFrameworks(): ExpertFramework[] {
    return Array.from(this.frameworks.values());
  }

  /**
   * Orchestrates multi-expert framework consultation behind the single VOYAGER persona.
   */
  public async orchestrate(context: FrameworkConsultationContext): Promise<OrchestratedConsultationResult> {
    const isEn = context.language === 'EN';
    const profile = context.userProfile || getLocalProfileCache();
    const dataMode = context.dataMode || DataSourceProvider.getMode();

    const evaluations = Array.from(this.frameworks.values()).map(fw => ({
      framework: fw,
      score: fw.evaluateRelevance(context)
    }));

    // Sort frameworks by relevance
    evaluations.sort((a, b) => b.score - a.score);

    // Select frameworks with relevance score > 0.40 (or top 2)
    const selectedEvaluations = evaluations.filter(e => e.score >= 0.40);
    const frameworksToConsult = selectedEvaluations.length > 0
      ? selectedEvaluations.map(e => e.framework)
      : [evaluations[0].framework];

    const results: ExpertFrameworkResult[] = await Promise.all(
      frameworksToConsult.map(fw => fw.consult(context))
    );

    // Aggregate Data Points
    const aggregatedFacts: ClassifiedDataPoint[] = [];
    const aggregatedEstimates: ClassifiedDataPoint[] = [];
    const aggregatedRecommendations: ClassifiedDataPoint[] = [];
    const aggregatedMissingKPIs: MissingKPIRequirement[] = [];

    const factSet = new Set<string>();
    const estSet = new Set<string>();
    const recSet = new Set<string>();
    const kpiSet = new Set<string>();

    results.forEach(res => {
      res.facts.forEach(f => {
        if (!factSet.has(f.id)) {
          factSet.add(f.id);
          aggregatedFacts.push(f);
        }
      });

      res.estimates.forEach(e => {
        if (!estSet.has(e.id)) {
          estSet.add(e.id);
          aggregatedEstimates.push(e);
        }
      });

      res.recommendations.forEach(r => {
        if (!recSet.has(r.id)) {
          recSet.add(r.id);
          aggregatedRecommendations.push(r);
        }
      });

      res.missingKPIs.forEach(m => {
        if (!kpiSet.has(m.id)) {
          kpiSet.add(m.id);
          aggregatedMissingKPIs.push(m);
        }
      });
    });

    // Calculate overall data completeness
    const totalRequiredKPIs = aggregatedMissingKPIs.length + 5;
    const collectedKPIs = 5;
    const completenessPercentage = Math.min(100, Math.round((collectedKPIs / totalRequiredKPIs) * 100));

    // Construct unified system prompt augmentation while preserving SINGLE VOYAGER PERSONA
    const consultedNames = results.map(r => r.frameworkName).join(' + ');
    const promptAugmentations = results
      .map(r => r.systemPromptAugmentation)
      .filter(Boolean)
      .join('\n');

    const unifiedSystemPromptAugmentation = `
[VOYAGER ORCHESTRATOR - SINGLE VOICE PERSONA ENGINE]
User Identity: ${profile.name || 'Learner'} | Goal: "${profile.goal || 'General'}" | Country: "${profile.country || 'N/A'}"
Active Consultation Frameworks: ${consultedNames}
Data Source Mode: ${dataMode.toUpperCase()}
Data Completeness Score: ${completenessPercentage}%

VOYAGER PERSONA DIRECTIVE:
- Maintain USA Voyager as the single, encouraging voice persona.
- Do NOT sound like multiple competing assistants. Speak with unified authority, clarity, and warmth.
- Explicitly differentiate between:
  1. FACTS: Verifiable measured data points.
  2. ESTIMATES: Projections, models, or assumptions.
  3. RECOMMENDATIONS: Strategic AI partner guidance and next actions.
- When key data is missing, point out why it matters and what data to collect next.

${promptAugmentations}
`;

    const biAdvisorAnalysis = BusinessIntelligenceAdvisor.runFullBIAnalysis(isEn, dataMode);

    return {
      timestamp: new Date().toISOString(),
      primaryFrameworkId: results[0]?.frameworkId || 'business_intelligence',
      consultedFrameworks: results.map(r => r.frameworkId),
      singleVoicePersona: 'USA Voyager (Puck Voice Persona)',
      aggregatedFacts,
      aggregatedEstimates,
      aggregatedRecommendations,
      aggregatedMissingKPIs,
      dataCompletenessPercentage: completenessPercentage,
      unifiedSystemPromptAugmentation,
      biAdvisorAnalysis
    };
  }
}

export const VoyagerOrchestrator = new VoyagerOrchestratorEngine();
