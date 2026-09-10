export type DataClassificationCategory = 'FACT' | 'ESTIMATE' | 'RECOMMENDATION';

export interface ClassifiedDataPoint {
  id: string;
  category: DataClassificationCategory;
  metricName: string;
  value: string | number;
  unit?: string;
  source: string; // e.g., 'Firestore (Live Data)', 'Financial Projection Model', 'VOYAGER AI Engine'
  description: string;
  confidenceScore?: number; // 0.0 to 1.0
}

export interface MissingKPIRequirement {
  id: string;
  kpiName: string;
  domain: 'finance' | 'growth' | 'marketing' | 'operations' | 'learning' | 'citizenship';
  importance: 'CRITICAL' | 'HIGH' | 'MEDIUM';
  whyItMatters: string;
  recommendedDataToCollect: string;
  targetCollectionOrSource: string;
  isCollected: boolean;
}

export interface BIAdvisorAnalysis {
  timestamp: string;
  dataMode: 'demo' | 'live' | 'hybrid';
  executiveSummary: string;
  whatIsHappening: string;
  whyItIsHappening: string;
  whatToDoNext: string[];
  facts: ClassifiedDataPoint[];
  estimates: ClassifiedDataPoint[];
  recommendations: ClassifiedDataPoint[];
  missingKPIs: MissingKPIRequirement[];
  dataCompletenessPercentage: number;
}

export interface FrameworkConsultationContext {
  userRole?: string;
  userGoal?: string;
  userProfile?: any;
  currentTab?: string;
  dataMode?: 'demo' | 'live' | 'hybrid';
  userQuery?: string;
  language?: 'EN' | 'ES';
}

export interface ExpertFrameworkResult {
  frameworkId: string;
  frameworkName: string;
  relevanceScore: number; // 0.0 to 1.0
  summary: string;
  facts: ClassifiedDataPoint[];
  estimates: ClassifiedDataPoint[];
  recommendations: ClassifiedDataPoint[];
  missingKPIs: MissingKPIRequirement[];
  systemPromptAugmentation?: string;
}

export interface ExpertFramework {
  id: string;
  name: string;
  description: string;
  evaluateRelevance(context: FrameworkConsultationContext): number;
  consult(context: FrameworkConsultationContext): Promise<ExpertFrameworkResult>;
}
