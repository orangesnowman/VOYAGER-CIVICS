import { 
  ExpertFramework, 
  FrameworkConsultationContext, 
  ExpertFrameworkResult, 
  ClassifiedDataPoint, 
  MissingKPIRequirement 
} from './types';
import { CivicsProgressTracker } from '../CivicsProgressTracker';
import { getLocalProfileCache } from '../../services/userProfileService';

export class CitizenshipAdvisor implements ExpertFramework {
  id = 'citizenship_civics';
  name = 'USCIS Citizenship N-400 & Civics 128 Expert';
  description = 'USCIS N-400 Naturalization oral exam preparation, official Civics 128 question mastery, and federal interview readiness.';

  evaluateRelevance(context: FrameworkConsultationContext): number {
    const tab = context.currentTab || '';
    const query = (context.userQuery || '').toLowerCase();

    if (tab === 'civics128' || tab === 'citizenship') {
      return 0.98;
    }

    if (
      query.includes('civics') || 
      query.includes('cívica') || 
      query.includes('uscis') || 
      query.includes('n400') || 
      query.includes('n-400') || 
      query.includes('ciudadanía') || 
      query.includes('citizenship') || 
      query.includes('entrevista') || 
      query.includes('examen')
    ) {
      return 0.95;
    }

    return 0.30;
  }

  async consult(context: FrameworkConsultationContext): Promise<ExpertFrameworkResult> {
    const isEn = context.language === 'EN';
    const profile = context.userProfile || getLocalProfileCache();
    const progress = CivicsProgressTracker.getProgressData();
    const metrics = CivicsProgressTracker.calculateMasteryMetrics();

    const facts: ClassifiedDataPoint[] = [
      {
        id: 'fact_civics_questions_mastered',
        category: 'FACT',
        metricName: isEn ? 'Mastered Civics Questions (Known)' : 'Preguntas Cívicas Dominadas (Conocidas)',
        value: metrics.knownCount,
        unit: 'questions / 128',
        source: 'CivicsProgressTracker (Firestore / Local)',
        description: isEn ? 'Verified questions answered correctly in practice.' : 'Preguntas verificadas respondidas correctamente.',
        confidenceScore: 1.0
      },
      {
        id: 'fact_civics_mastery_percentage',
        category: 'FACT',
        metricName: isEn ? 'Civics Bank Mastery %' : '% de Dominio del Banco Cívico',
        value: `${metrics.masteryPercentage}%`,
        source: 'CivicsProgressTracker Engine',
        description: isEn ? 'Percentage of the full 128 question bank mastered.' : 'Porcentaje del banco completo de 128 preguntas dominado.',
        confidenceScore: 1.0
      },
      {
        id: 'fact_n400_applicant_age',
        category: 'FACT',
        metricName: isEn ? 'Applicant Age & Exemptions Check' : 'Edad del Solicitante y Exenciones',
        value: profile.age ? `${profile.age} years old` : 'Not specified',
        source: 'Onboarding Single Source of Truth',
        description: profile.age && profile.age >= 65 
          ? (isEn ? 'Qualifies for 65/20 special consideration rule if resident 20+ yrs.' : 'Califica para la regla especial 65/20 si es residente 20+ años.')
          : (isEn ? 'Standard 128 question bank requirements apply.' : 'Aplican requisitos del banco estándar de 128 preguntas.'),
        confidenceScore: 1.0
      }
    ];

    const estimates: ClassifiedDataPoint[] = [
      {
        id: 'est_readiness_score',
        category: 'ESTIMATE',
        metricName: isEn ? 'USCIS Oral Exam Pass Probability' : 'Probabilidad de Aprobar Examen Oral USCIS',
        value: `${Math.min(99, Math.round(metrics.masteryPercentage * 1.1))}%`,
        source: 'USCIS Exam Simulation Model',
        description: isEn 
          ? 'Requires 6 correct answers out of 10 randomly selected questions.' 
          : 'Requiere 6 respuestas correctas de 10 preguntas seleccionadas al azar.',
        confidenceScore: 0.88
      }
    ];

    const missingKPIs: MissingKPIRequirement[] = [
      {
        id: 'kpi_n400_interview_date',
        kpiName: isEn ? 'Scheduled USCIS Interview Date' : 'Fecha de Cita de Entrevista USCIS',
        domain: 'citizenship',
        importance: 'HIGH',
        whyItMatters: isEn 
          ? 'Having a target interview date allows calculating optimal daily study review volume.' 
          : 'Tener una fecha de entrevista permite calcular el volumen de estudio diario óptimo.',
        recommendedDataToCollect: isEn ? 'Capture optional interview date in onboarding or profile.' : 'Capturar fecha de entrevista opcional en onboarding o perfil.',
        targetCollectionOrSource: 'users/{uid}/n400_details',
        isCollected: Boolean(profile.onboardingResponses?.n400InterviewDate)
      }
    ];

    const recommendations: ClassifiedDataPoint[] = [
      {
        id: 'rec_prioritize_review_bank',
        category: 'RECOMMENDATION',
        metricName: isEn ? 'Targeted Review Queue' : 'Cola de Repaso Dirigido',
        value: metrics.reviewCount > 0 ? `${metrics.reviewCount} questions pending` : 'Bank in good standing',
        source: 'VOYAGER Citizenship Advisor Engine',
        description: isEn 
          ? 'Focus upcoming study sessions on questions flagged for review.' 
          : 'Enfocar las próximas sesiones de estudio en preguntas marcadas para repaso.',
        confidenceScore: 0.95
      }
    ];

    const summary = isEn
      ? `VOYAGER Citizenship Advisor Analysis: Civics 128 Bank Mastery is at ${metrics.masteryPercentage}% (${metrics.knownCount} known, ${metrics.reviewCount} review). Oral exam readiness is high.`
      : `Análisis del Asesor de Ciudadanía VOYAGER: El dominio del banco cívico es del ${metrics.masteryPercentage}% (${metrics.knownCount} conocidas, ${metrics.reviewCount} por repasar). La preparación para el examen oral es alta.`;

    const systemPromptAugmentation = `
[VOYAGER USCIS CITIZENSHIP N-400 EXPERT CONTEXT]
Mastered Questions: ${metrics.knownCount}/128 (${metrics.masteryPercentage}%)
Pending Review: ${metrics.reviewCount}
Unsure: ${metrics.unsureCount}
Expert Directives:
1. Conduct oral citizenship practice according to federal USCIS M-1778 standards.
2. Emulate the official USCIS Officer demeanor while maintaining VOYAGER's encouraging tone.
3. Keep track of correct answers (target: 6 out of 10) during citizenship simulations.
`;

    return {
      frameworkId: this.id,
      frameworkName: this.name,
      relevanceScore: this.evaluateRelevance(context),
      summary,
      facts,
      estimates,
      recommendations,
      missingKPIs,
      systemPromptAugmentation
    };
  }
}

export const citizenshipAdvisor = new CitizenshipAdvisor();
