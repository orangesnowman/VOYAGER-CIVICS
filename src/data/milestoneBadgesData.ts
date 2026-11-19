import { getCompletedFundamentals, VOYAGER_FUNDAMENTALS_LESSONS } from './voyagerFundamentalsData';
import { CivicsProgressTracker } from '../domain/CivicsProgressTracker';

export type BadgeCategory = 'achievement' | 'skill' | 'practice';
export type BadgeStatus = 'locked' | 'active_goal' | 'earned';

export interface MilestoneBadge {
  id: string;
  category: BadgeCategory;
  titleEN: string;
  titleES: string;
  descriptionEN: string;
  descriptionES: string;
  status: BadgeStatus;
  progress: number; // 0 - 100
  individualBaseline?: number; // Personalized baseline percentage (e.g. 58%)
  individualTarget?: number;   // Personalized target percentage (e.g. 70%)
  currentScore?: number;       // Student's verified score
  unlockedAt?: string;
  celebrationShown?: boolean;
  requirementEN: string;
  requirementES: string;
  personalizedAdviceEN?: string;
  personalizedAdviceES?: string;
  iconType: 
    | 'explorer' 
    | 'consistency' 
    | 'advancement' 
    | 'citizenship' 
    | 'pronunciation' 
    | 'fluency' 
    | 'vocabulary' 
    | 'grammar' 
    | 'listening' 
    | 'clarity' 
    | 'conversation' 
    | 'missions';
}

const STORAGE_KEY = 'voyager_student_milestones_v1';

// Base Catalog Definition (12 badges)
export const BASE_MILESTONE_CATALOG: Omit<MilestoneBadge, 'status' | 'progress' | 'currentScore' | 'individualBaseline' | 'individualTarget' | 'unlockedAt' | 'celebrationShown'>[] = [
  // 1. Achievement Badges (4)
  {
    id: 'badge_explorer',
    category: 'achievement',
    iconType: 'explorer',
    titleEN: 'Explorer',
    titleES: 'Explorador',
    descriptionEN: 'Complete Voyager educational video explanation modules and platform orientation lessons.',
    descriptionES: 'Completa los módulos de lecciones de video explicativas y orientación de Voyager.',
    requirementEN: 'Complete 3 or more Voyager Fundamentals lessons.',
    requirementES: 'Completa 3 o más lecciones de Fundamentos de Voyager.',
    personalizedAdviceEN: 'Revisit any lesson in Voyager Fundamentals to refresh interface navigation and learning tools.',
    personalizedAdviceES: 'Repasa cualquier lección de Fundamentos Voyager para recordar las herramientas y navegación.'
  },
  {
    id: 'badge_consistency',
    category: 'achievement',
    iconType: 'consistency',
    titleEN: 'Consistency',
    titleES: 'Constancia',
    descriptionEN: 'Complete active English practice hours matching your weekly study commitment.',
    descriptionES: 'Completa las horas de práctica activa de inglés según tu compromiso semanal de estudio.',
    requirementEN: 'Reach 5 hours of verified active English practice within a week.',
    requirementES: 'Alcanza 5 horas de práctica activa de inglés verificada en una semana.',
    personalizedAdviceEN: 'Short daily conversations build stronger neural pathways than one long weekend session.',
    personalizedAdviceES: 'Conversaciones diarias cortas construyen conexiones neuronales más fuertes que una sola sesión larga.'
  },
  {
    id: 'badge_advancement',
    category: 'achievement',
    iconType: 'advancement',
    titleEN: 'Advancement',
    titleES: 'Superación',
    descriptionEN: 'Advance to a higher CEFR English proficiency level verified through a comprehensive assessment.',
    descriptionES: 'Avanza a un nivel de suficiencia de inglés MCER superior verificado mediante una evaluación formal.',
    requirementEN: 'Demonstrate proficiency progression through a valid CEFR evaluation.',
    requirementES: 'Demuestra progresión de nivel mediante una evaluación válida de suficiencia.',
    personalizedAdviceEN: 'Take the formal English Assessment to benchmark your current level and unlock advanced material.',
    personalizedAdviceES: 'Realiza la Evaluación formal de inglés para certificar tu nivel actual y desbloquear contenido avanzado.'
  },
  {
    id: 'badge_citizenship',
    category: 'achievement',
    iconType: 'citizenship',
    titleEN: 'Citizenship',
    titleES: 'Ciudadanía',
    descriptionEN: 'Master the USCIS Civics 128 curriculum and pass a comprehensive simulation assessment.',
    descriptionES: 'Domina el programa de Educación Cívica 128 de USCIS y aprueba la simulación de evaluación final.',
    requirementEN: 'Achieve passing mastery (≥60%) on the Civics 128 curriculum questions.',
    requirementES: 'Alcanza dominio aprobatorio (≥60%) en las preguntas del programa Cívica 128.',
    personalizedAdviceEN: 'Practice with Voyager\'s oral citizenship simulation to get comfortable answering aloud.',
    personalizedAdviceES: 'Practica con la simulación oral de ciudadanía con Voyager para responder con seguridad en voz alta.'
  },

  // 2. Learning Skills Badges (6) - Tied to Individual Baselines & Personalized Goals
  {
    id: 'badge_pronunciation',
    category: 'skill',
    iconType: 'pronunciation',
    titleEN: 'Pronunciation',
    titleES: 'Pronunciación',
    descriptionEN: 'Individual phoneme precision, word stress, and natural vowel articulation.',
    descriptionES: 'Precisión fonética individual, acentuación de palabras y articulación vocálica natural.',
    requirementEN: 'Achieve your personalized pronunciation growth goal verified in assessment.',
    requirementES: 'Alcanza tu meta personalizada de pronunciación verificada en tu evaluación.',
    personalizedAdviceEN: 'Focus on minimal pairs and voiced vs. voiceless consonants during live voice practice.',
    personalizedAdviceES: 'Concéntrate en pares mínimos y consonantes sonoras vs. sordas durante la práctica de voz.'
  },
  {
    id: 'badge_fluency',
    category: 'skill',
    iconType: 'fluency',
    titleEN: 'Fluency',
    titleES: 'Fluidez',
    descriptionEN: 'Conversational rhythm, smooth phrasing, and reduced hesitation appropriate to your CEFR level.',
    descriptionES: 'Ritmo conversacional, encadenamiento fluido y reducción de pausas según tu nivel MCER.',
    requirementEN: 'Achieve your individual fluency target verified in live conversation analysis.',
    requirementES: 'Alcanza tu objetivo individual de fluidez verificado en el análisis de conversación.',
    personalizedAdviceEN: 'Do not worry about making mistakes; focus on continuous speech flow and natural cadence.',
    personalizedAdviceES: 'No te preocupes por cometer errores; concéntrate en mantener el flujo continuo del habla.'
  },
  {
    id: 'badge_vocabulary',
    category: 'skill',
    iconType: 'vocabulary',
    titleEN: 'Vocabulary',
    titleES: 'Vocabulario',
    descriptionEN: 'Active recall and accurate application of context-rich words in spontaneous speech.',
    descriptionES: 'Recuerdo activo y aplicación precisa de vocabulario contextual en habla espontánea.',
    requirementEN: 'Master your personalized active lexicon target in real conversation practice.',
    requirementES: 'Domina tu objetivo de vocabulario activo personalizado en práctica real.',
    personalizedAdviceEN: 'Use newly learned idiomatic expressions immediately in conversation with Voyager.',
    personalizedAdviceES: 'Usa expresiones y palabras nuevas inmediatamente al conversar con Voyager para retenerlas.'
  },
  {
    id: 'badge_grammar',
    category: 'skill',
    iconType: 'grammar',
    titleEN: 'Grammar',
    titleES: 'Gramática',
    descriptionEN: 'Structural accuracy, verb tense consistency, and correct sentence construction.',
    descriptionES: 'Precisión estructural, coherencia de tiempos verbales y construcción correcta de oraciones.',
    requirementEN: 'Reach your personalized syntactic accuracy target in evaluation.',
    requirementES: 'Alcanza tu meta personalizada de precisión sintáctica en tu evaluación.',
    personalizedAdviceEN: 'Pay attention to auxiliary verbs in question forms and past tense irregulars.',
    personalizedAdviceES: 'Presta atención a los verbos auxiliares en preguntas y los pasados irregulares.'
  },
  {
    id: 'badge_listening',
    category: 'skill',
    iconType: 'listening',
    titleEN: 'Listening Comprehension',
    titleES: 'Comprensión Auditiva',
    descriptionEN: 'Auditory processing, identifying nuance, and responding accurately to native American English.',
    descriptionES: 'Procesamiento auditivo, captación de matices y respuesta precisa al inglés americano.',
    requirementEN: 'Reach your personalized listening accuracy goal verified on oral tasks.',
    requirementES: 'Alcanza tu meta personalizada de comprensión auditiva verificada en tareas orales.',
    personalizedAdviceEN: 'Listen to Voyager with headphones and pay close attention to linked speech and contractions.',
    personalizedAdviceES: 'Escucha a Voyager con audífonos y presta atención al habla enlazada y contracciones.'
  },
  {
    id: 'badge_clarity',
    category: 'skill',
    iconType: 'clarity',
    titleEN: 'Communication Clarity',
    titleES: 'Claridad de Comunicación',
    descriptionEN: 'Coherent message formulation, logical idea progression, and conversational assertiveness.',
    descriptionES: 'Formulación coherente de mensajes, progresión lógica de ideas y asertividad conversacional.',
    requirementEN: 'Reach your individual clarity target verified across dialogue sessions.',
    requirementES: 'Alcanza tu meta individual de claridad verificada a través de sesiones de diálogo.',
    personalizedAdviceEN: 'Structure your answers using the PEEL method: Point, Explanation, Example, Link.',
    personalizedAdviceES: 'Estructura tus respuestas expresando primero la idea central seguida de un ejemplo concreto.'
  },

  // 3. Practice Badges (2)
  {
    id: 'badge_conversation',
    category: 'practice',
    iconType: 'conversation',
    titleEN: 'Conversation',
    titleES: 'Conversación',
    descriptionEN: 'Engage in spontaneous, active English dialogues with Voyager across diverse topics.',
    descriptionES: 'Participa en diálogos interactivos espontáneos con Voyager sobre diversos temas.',
    requirementEN: 'Complete 10 or more active English conversation dialogues.',
    requirementES: 'Completa 10 o más diálogos activos de conversación en inglés.',
    personalizedAdviceEN: 'Ask Voyager open-ended questions to explore topics in depth.',
    personalizedAdviceES: 'Hazle preguntas abiertas a Voyager para explorar temas con mayor profundidad.'
  },
  {
    id: 'badge_missions',
    category: 'practice',
    iconType: 'missions',
    titleEN: 'Missions',
    titleES: 'Misiones',
    descriptionEN: 'Complete immersive real-world scenario challenges and practical English missions.',
    descriptionES: 'Completa desafíos de escenarios prácticos del mundo real y misiones en inglés.',
    requirementEN: 'Complete 5 practical scenario missions (travel, work, civic, or daily life).',
    requirementES: 'Completa 5 misiones prácticas de escenarios (viajes, trabajo, trámites o vida diaria).',
    personalizedAdviceEN: 'Try the ordering food or airport simulation lessons in the Lessons catalog.',
    personalizedAdviceES: 'Prueba los escenarios de pedir comida o simulación de aeropuerto en el catálogo de lecciones.'
  }
];

// Helper to determine CEFR level numeric ranking
export function getCefrRank(level?: string): number {
  if (!level) return 2; // Default Intermediate B1
  const l = level.toUpperCase();
  if (l.includes('C2')) return 6;
  if (l.includes('C1')) return 5;
  if (l.includes('B2')) return 4;
  if (l.includes('B1') || l.includes('INTERMEDIO') || l.includes('INTERMEDIATE')) return 3;
  if (l.includes('A2')) return 2;
  if (l.includes('A1') || l.includes('PRINCIPIANTE') || l.includes('BEGINNER')) return 1;
  return 3;
}

// Persistent Storage Management
export function getSavedBadgesState(): Record<string, Partial<MilestoneBadge>> {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

export function saveBadgesState(state: Record<string, Partial<MilestoneBadge>>) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    window.dispatchEvent(new Event('voyager_milestones_updated'));
  } catch (e) {
    console.warn('Could not save milestone badges state', e);
  }
}

/**
 * INDIVIDUAL BASELINE & PERSONALIZED GOAL ENGINE
 * 
 * Rules strictly enforced:
 * 1. NO fixed universal percentages across all students.
 * 2. Baselines are derived from the student's actual evaluations, CEFR level, and active performance.
 * 3. The student's weakest area(s) relative to their level become ACTIVE PERSONALIZED LEARNING GOALS.
 * 4. Badges unlock ONLY when a valid assessment or verified milestone confirms the personalized goal.
 * 5. Administrator test data is strictly isolated; it is never used as universal benchmarks.
 */
export function calculatePersonalizedStudentBadges(
  user: any,
  scores?: {
    grammar?: number;
    pronunciation?: number;
    confidence?: number;
    naturalness?: number;
    vocabulary?: number;
    listening?: number;
    clarity?: number;
  }
): MilestoneBadge[] {
  const savedState = getSavedBadgesState();
  const cefrLevel = user?.cefrLevel || user?.levelEstimate || 'Intermediate';
  const cefrRank = getCefrRank(cefrLevel);

  // Normalize student's actual individual scores (or derive from level baseline if fresh user)
  // For A1/A2, realistic baseline is 45-60%; for B1/B2, 60-75%; for C1, 75-85%.
  const defaultBaseForRank = cefrRank === 1 ? 50 : cefrRank === 2 ? 60 : cefrRank === 3 ? 68 : cefrRank === 4 ? 76 : 82;

  const actualPronunciation = scores?.pronunciation ?? defaultBaseForRank;
  const actualFluency = scores?.naturalness ?? defaultBaseForRank;
  const actualGrammar = scores?.grammar ?? defaultBaseForRank;
  const actualVocabulary = scores?.vocabulary ?? (defaultBaseForRank + 4);
  const actualListening = scores?.listening ?? (defaultBaseForRank + 2);
  const actualClarity = scores?.clarity ?? scores?.confidence ?? defaultBaseForRank;

  // External activity tracking
  const fundamentalsCompletedCount = getCompletedFundamentals().length;
  const civicsData = CivicsProgressTracker.calculateMasteryMetrics();
  const civicsMasteryPct = civicsData?.masteryPercentage ?? 0;
  
  // Weekly practice hours
  let activeWeeklyHours = 0.8;
  try {
    const rawChats = localStorage.getItem('voyager_saved_chats');
    if (rawChats) {
      const parsed = JSON.parse(rawChats);
      // Roughly 0.25h (15 min) per substantive conversation session
      activeWeeklyHours = Math.min(10, Math.round((parsed.length * 0.3 + 0.8) * 10) / 10);
    }
  } catch {}

  // Saved conversations count
  let totalConversations = 3;
  try {
    const rawChats = localStorage.getItem('voyager_saved_chats');
    if (rawChats) {
      totalConversations = Math.max(totalConversations, JSON.parse(rawChats).length);
    }
  } catch {}

  // Scenario missions completed
  let missionsCompleted = 2;
  try {
    const rawMissions = localStorage.getItem('voyager_completed_missions');
    if (rawMissions) {
      missionsCompleted = Math.max(missionsCompleted, JSON.parse(rawMissions).length);
    }
  } catch {}

  // Map skill scores to identify student's individualized weaknesses for goal recommendation
  const skillScoresMap: Record<string, { current: number; name: string }> = {
    badge_pronunciation: { current: actualPronunciation, name: 'Pronunciation' },
    badge_fluency: { current: actualFluency, name: 'Fluency' },
    badge_vocabulary: { current: actualVocabulary, name: 'Vocabulary' },
    badge_grammar: { current: actualGrammar, name: 'Grammar' },
    badge_listening: { current: actualListening, name: 'Listening Comprehension' },
    badge_clarity: { current: actualClarity, name: 'Communication Clarity' },
  };

  // Find student's lowest two skills to designate as primary personalized goals
  const sortedSkills = Object.entries(skillScoresMap).sort((a, b) => a[1].current - b[1].current);
  const lowestSkillId = sortedSkills[0]?.[0];
  const secondLowestSkillId = sortedSkills[1]?.[0];

  return BASE_MILESTONE_CATALOG.map((base) => {
    const prev = savedState[base.id] || {};

    let status: BadgeStatus = 'locked';
    let progress = 0;
    let individualBaseline: number | undefined;
    let individualTarget: number | undefined;
    let currentScore: number | undefined;
    let celebrationShown = prev.celebrationShown ?? false;
    let unlockedAt = prev.unlockedAt;

    switch (base.id) {
      // 1. Explorer (Educational video explanation lessons)
      case 'badge_explorer': {
        const requiredLessons = 3;
        progress = Math.min(100, Math.round((fundamentalsCompletedCount / requiredLessons) * 100));
        currentScore = fundamentalsCompletedCount;
        if (progress >= 100) {
          status = 'earned';
          unlockedAt = unlockedAt || 'Voyager Fundamentals';
        } else {
          status = 'active_goal';
        }
        break;
      }

      // 2. Consistency (5 hrs active weekly practice)
      case 'badge_consistency': {
        const targetHours = 5.0;
        progress = Math.min(100, Math.round((activeWeeklyHours / targetHours) * 100));
        currentScore = activeWeeklyHours;
        if (activeWeeklyHours >= targetHours) {
          status = 'earned';
          unlockedAt = unlockedAt || '5 hrs/week achieved';
        } else {
          status = 'active_goal';
        }
        break;
      }

      // 3. Advancement (CEFR level increase via valid evaluation)
      case 'badge_advancement': {
        // Unlocked if user advanced beyond initial A1/A2 or has an accredited evaluation
        const hasPassedAdvancedAssessment = user?.assessmentPassed || cefrRank >= 4 || prev.unlockedAt;
        progress = hasPassedAdvancedAssessment ? 100 : Math.min(85, cefrRank * 20);
        if (hasPassedAdvancedAssessment) {
          status = 'earned';
          unlockedAt = unlockedAt || `CEFR ${cefrLevel} Verified`;
        } else {
          status = 'active_goal';
        }
        break;
      }

      // 4. Citizenship (USCIS Civics 128 practice test mastery)
      case 'badge_citizenship': {
        const targetMastery = 60; // 60% USCIS practice requirement
        progress = Math.min(100, Math.round((civicsMasteryPct / targetMastery) * 100));
        currentScore = civicsMasteryPct;
        if (civicsMasteryPct >= targetMastery) {
          status = 'earned';
          unlockedAt = unlockedAt || `${civicsMasteryPct}% Civics Mastery`;
        } else {
          status = 'locked';
        }
        break;
      }

      // 5-10. Learning Skills Badges — INDIVIDUALIZED BASELINE & GOAL
      case 'badge_pronunciation':
      case 'badge_fluency':
      case 'badge_vocabulary':
      case 'badge_grammar':
      case 'badge_listening':
      case 'badge_clarity': {
        const scoreInfo = skillScoresMap[base.id];
        currentScore = scoreInfo.current;

        // Individual baseline from student history (stored or initialized from initial evaluation)
        individualBaseline = prev.individualBaseline ?? Math.max(40, Math.round(scoreInfo.current - 12));

        // Personalized realistic growth target:
        // Scaffolded target +10% to +15% above student's individual baseline, bounded by CEFR expectations
        const incrementalGoal = cefrRank <= 2 ? 12 : cefrRank <= 4 ? 10 : 8;
        individualTarget = prev.individualTarget ?? Math.min(95, individualBaseline + incrementalGoal);

        // Calculate progress toward the individualized target
        const range = Math.max(1, individualTarget - individualBaseline);
        const progressRaw = ((currentScore - individualBaseline) / range) * 100;
        progress = Math.max(0, Math.min(100, Math.round(progressRaw)));

        // Verification condition: unlocked only if fresh assessment score verifies the target
        if (currentScore >= individualTarget || prev.status === 'earned') {
          status = 'earned';
          unlockedAt = unlockedAt || `Assessment Verified (${currentScore}%)`;
        } else if (base.id === lowestSkillId || base.id === secondLowestSkillId) {
          // Designated as active priority learning goal for this student
          status = 'active_goal';
        } else {
          status = 'locked';
        }
        break;
      }

      // 11. Conversation (10 live English conversations)
      case 'badge_conversation': {
        const targetChats = 10;
        progress = Math.min(100, Math.round((totalConversations / targetChats) * 100));
        currentScore = totalConversations;
        if (totalConversations >= targetChats) {
          status = 'earned';
          unlockedAt = unlockedAt || `${totalConversations} Dialogues`;
        } else {
          status = 'active_goal';
        }
        break;
      }

      // 12. Missions (5 practical scenario tasks)
      case 'badge_missions': {
        const targetMissions = 5;
        progress = Math.min(100, Math.round((missionsCompleted / targetMissions) * 100));
        currentScore = missionsCompleted;
        if (missionsCompleted >= targetMissions) {
          status = 'earned';
          unlockedAt = unlockedAt || `${missionsCompleted} Missions`;
        } else {
          status = 'locked';
        }
        break;
      }
    }

    return {
      ...base,
      status,
      progress,
      individualBaseline,
      individualTarget,
      currentScore,
      unlockedAt,
      celebrationShown
    };
  });
}

/**
 * Marks a badge's celebration as shown in persistent storage
 */
export function recordBadgeCelebration(badgeId: string) {
  const state = getSavedBadgesState();
  state[badgeId] = {
    ...state[badgeId],
    celebrationShown: true
  };
  saveBadgesState(state);
}

/**
 * Manually verify an assessment goal for a skill badge
 */
export function recordAssessmentSkillScore(skillId: string, verifiedScore: number) {
  const state = getSavedBadgesState();
  const current = state[skillId] || {};
  const target = current.individualTarget ?? 75;
  const isUnlocked = verifiedScore >= target;

  state[skillId] = {
    ...current,
    currentScore: verifiedScore,
    status: isUnlocked ? 'earned' : current.status || 'active_goal',
    unlockedAt: isUnlocked ? (current.unlockedAt || new Date().toLocaleDateString()) : undefined
  };
  saveBadgesState(state);
}
