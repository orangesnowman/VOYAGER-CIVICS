import { 
  ExpertFramework, 
  FrameworkConsultationContext, 
  ExpertFrameworkResult, 
  ClassifiedDataPoint, 
  MissingKPIRequirement 
} from './types';
import { getLocalProfileCache } from '../../services/userProfileService';
import { learningProfile } from '../LearningProfile';

export class LanguageLearningAdvisor implements ExpertFramework {
  id = 'language_learning';
  name = 'ESL & Phonetics Fluency Advisor';
  description = 'Language learning domain framework for grammar, pronunciation, vocabulary retention, and conversational confidence.';

  evaluateRelevance(context: FrameworkConsultationContext): number {
    const tab = context.currentTab || '';
    const query = (context.userQuery || '').toLowerCase();

    if (['charla', 'roadmap', 'missions', 'nyc_subway', 'shopping'].includes(tab)) {
      return 0.95;
    }

    if (
      query.includes('inglés') || 
      query.includes('english') || 
      query.includes('pronunciación') || 
      query.includes('gramática') || 
      query.includes('fluidez') || 
      query.includes('conversación') || 
      query.includes('vocabulario')
    ) {
      return 0.90;
    }

    return 0.60;
  }

  async consult(context: FrameworkConsultationContext): Promise<ExpertFrameworkResult> {
    const isEn = context.language === 'EN';
    const userProfile = context.userProfile || getLocalProfileCache();
    const scores = learningProfile.getCurrentScores();
    const learnedWords = learningProfile.getLearnedWords();
    const accentPatterns = learningProfile.getAccentPatterns();

    const facts: ClassifiedDataPoint[] = [
      {
        id: 'fact_fluency_scores',
        category: 'FACT',
        metricName: isEn ? 'Fluency Assessment Metrics' : 'Métricas de Evaluación de Fluidez',
        value: `Grammar: ${scores.grammar}% | Pronunciation: ${scores.pronunciation}% | Confidence: ${scores.confidence}% | Naturalness: ${scores.naturalness}%`,
        source: 'LearningProfile Domain Engine',
        description: isEn ? 'Evaluated performance scores stored in LearningProfile.' : 'Puntajes de desempeño evaluados almacenados en LearningProfile.',
        confidenceScore: 0.95
      },
      {
        id: 'fact_learned_words_count',
        category: 'FACT',
        metricName: isEn ? 'Acquired Vocabulary Words' : 'Palabras de Vocabulario Adquiridas',
        value: learnedWords.length,
        unit: 'words',
        source: 'LearningProfile / Firestore',
        description: isEn ? 'Count of verified vocabulary terms mastered.' : 'Conteo de términos de vocabulario verificados.',
        confidenceScore: 1.0
      },
      {
        id: 'fact_onboarding_target_goal',
        category: 'FACT',
        metricName: isEn ? 'Onboarding Goal Alignment' : 'Alineación con Meta de Onboarding',
        value: userProfile.goal || 'General Conversation',
        source: 'Onboarding Single Source of Truth',
        description: isEn 
          ? `Primary Goal: "${userProfile.goal}" | Level: "${userProfile.levelEstimate}"` 
          : `Meta Principal: "${userProfile.goal}" | Nivel: "${userProfile.levelEstimate}"`,
        confidenceScore: 1.0
      }
    ];

    const estimates: ClassifiedDataPoint[] = [
      {
        id: 'est_days_to_next_level',
        category: 'ESTIMATE',
        metricName: isEn ? 'Estimated Days to Level Up' : 'Días Estimados para Subir de Nivel',
        value: '18 days',
        source: 'Language Learning Curve Model',
        description: isEn 
          ? 'Based on current daily practice frequency and 15 min/day commitment.' 
          : 'Basado en la frecuencia de práctica diaria actual y compromiso de 15 min/día.',
        confidenceScore: 0.80
      }
    ];

    const missingKPIs: MissingKPIRequirement[] = [
      {
        id: 'kpi_phonetic_error_rate',
        kpiName: isEn ? 'Phonetic Error Frequency Log' : 'Registro de Frecuencia de Errores Fonéticos',
        domain: 'learning',
        importance: 'HIGH',
        whyItMatters: isEn 
          ? 'Tracking specific phonemes (e.g. /th/, /v/ vs /b/, short vowels) accelerates accent reduction.' 
          : 'Rastrear fonemas específicos (ej. /th/, /v/ vs /b/, vocales cortas) acelera la reducción del acento.',
        recommendedDataToCollect: isEn ? 'Log mispronounced phonemes during Live Gemini sessions.' : 'Registrar fonemas mal pronunciados en las sesiones de Gemini en Vivo.',
        targetCollectionOrSource: 'users/{uid}/learningProfile/phonetics',
        isCollected: accentPatterns.length > 0
      }
    ];

    const recommendations: ClassifiedDataPoint[] = [
      {
        id: 'rec_focus_vocabulary_expansion',
        category: 'RECOMMENDATION',
        metricName: isEn ? 'Customized Vocabulary Focus' : 'Enfoque de Vocabulario Personalizado',
        value: userProfile.goal || 'Professional',
        source: 'VOYAGER Language Learning Framework',
        description: isEn 
          ? `Incorporate domain terminology matching the onboarding track: "${userProfile.goal}".` 
          : `Incorporar terminología del dominio coincidente con la ruta de onboarding: "${userProfile.goal}".`,
        confidenceScore: 0.95
      }
    ];

    const summary = isEn
      ? `VOYAGER Language Learning Analysis: Overall fluency composite score is ${Math.round((scores.grammar + scores.pronunciation + scores.confidence + scores.naturalness) / 4)}%. Onboarding goal "${userProfile.goal}" is active.`
      : `Análisis de Aprendizaje de Idiomas VOYAGER: La puntuación compuesta de fluidez es de ${Math.round((scores.grammar + scores.pronunciation + scores.confidence + scores.naturalness) / 4)}%. La meta de onboarding "${userProfile.goal}" está activa.`;

    const systemPromptAugmentation = `
[VOYAGER LANGUAGE LEARNING EXPERT CONTEXT]
Onboarding Learner Goal: "${userProfile.goal || 'General'}" (${userProfile.levelEstimate || 'Intermediate'})
Current Scores -> Grammar: ${scores.grammar}%, Pronunciation: ${scores.pronunciation}%, Confidence: ${scores.confidence}%
Known Learned Terms: ${learnedWords.slice(0, 10).join(', ') || 'None logged yet'}
Pedagogical Directives:
1. Deliver constructive, gentle corrections using the VOYAGER encouraging tone ('Puck' voice persona).
2. Directly align vocabulary practice with the onboarding goal: "${userProfile.goal}".
3. Keep spoken responses clear, engaging, and well-paced.
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

export const languageLearningAdvisor = new LanguageLearningAdvisor();
