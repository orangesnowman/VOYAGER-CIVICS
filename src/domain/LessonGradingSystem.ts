// VOYAGER USA — American Letter Grading & Lesson Evaluation System
// Version 1.0 | November 2026

import { db, auth } from '../services/firebaseAuth';
import { doc, setDoc, getDocs, collection, query, orderBy } from 'firebase/firestore';
import { isFirestoreQuotaExceeded, handleFirestoreWriteError } from '../services/userProfileService';

export interface LessonCriteriaScores {
  grammar: number; // 0 - 100
  pronunciation: number; // 0 - 100
  fluency: number; // 0 - 100
  vocabulary: number; // 0 - 100
  comprehension: number; // 0 - 100
  objectiveCompletion: number; // 0 - 100
  objective?: number; // alias
}

export interface LessonEvaluationRecord {
  id: string;
  studentId?: string;
  lessonId: string;
  lessonTitle: string;
  category: string;
  level: string;
  attemptNumber: number;
  date: string; // ISO string
  timestamp?: string | number; // alias
  durationSeconds: number;
  numericalScore: number; // 0 - 100
  score?: number; // alias
  letterGrade: string; // A+, A, A-, B+, B, B-, C+, C, C-, D+, D, D-, F
  grade?: string; // alias
  passed: boolean; // numericalScore >= 70
  resultLabel: string; // e.g. "Excellent", "Very Good", "Fair — Passing", "Needs Improvement — Failing", "Failing"
  criteriaScores: LessonCriteriaScores;
  explanation: string;
  strengths: string[];
  areasToImprove: string[];
  recommendations: string[];
  assignmentId?: string;
}

export interface EvidenceCheckResult {
  isSufficient: boolean;
  substantiveUserMessages: number;
  requiredMessages: number;
  durationSeconds: number;
  requiredDurationSeconds: number;
  missingAspects: string[];
  guidanceMessage: string;
}

/**
 * Maps a numerical score (0-100) to the standard American Letter Grade scale.
 * Minimum passing grade is C- (70%).
 */
export function scoreToLetterGrade(score: number): {
  grade: string;
  resultLabelEn: string;
  resultLabelEs: string;
  passed: boolean;
} {
  const rounded = Math.max(0, Math.min(100, Math.round(score)));

  if (rounded >= 97) {
    return { grade: 'A+', resultLabelEn: 'Excellent', resultLabelEs: 'Excelente', passed: true };
  } else if (rounded >= 93) {
    return { grade: 'A', resultLabelEn: 'Excellent', resultLabelEs: 'Excelente', passed: true };
  } else if (rounded >= 90) {
    return { grade: 'A-', resultLabelEn: 'Excellent', resultLabelEs: 'Excelente', passed: true };
  } else if (rounded >= 87) {
    return { grade: 'B+', resultLabelEn: 'Very Good', resultLabelEs: 'Muy Bueno', passed: true };
  } else if (rounded >= 83) {
    return { grade: 'B', resultLabelEn: 'Very Good', resultLabelEs: 'Muy Bueno', passed: true };
  } else if (rounded >= 80) {
    return { grade: 'B-', resultLabelEn: 'Very Good', resultLabelEs: 'Muy Bueno', passed: true };
  } else if (rounded >= 77) {
    return { grade: 'C+', resultLabelEn: 'Fair — Passing', resultLabelEs: 'Aprobado', passed: true };
  } else if (rounded >= 73) {
    return { grade: 'C', resultLabelEn: 'Fair — Passing', resultLabelEs: 'Aprobado', passed: true };
  } else if (rounded >= 70) {
    return { grade: 'C-', resultLabelEn: 'Fair — Passing', resultLabelEs: 'Aprobado', passed: true };
  } else if (rounded >= 67) {
    return { grade: 'D+', resultLabelEn: 'Needs Improvement — Failing', resultLabelEs: 'Necesita Mejorar — No Aprobado', passed: false };
  } else if (rounded >= 63) {
    return { grade: 'D', resultLabelEn: 'Needs Improvement — Failing', resultLabelEs: 'Necesita Mejorar — No Aprobado', passed: false };
  } else if (rounded >= 60) {
    return { grade: 'D-', resultLabelEn: 'Needs Improvement — Failing', resultLabelEs: 'Necesita Mejorar — No Aprobado', passed: false };
  } else {
    return { grade: 'F', resultLabelEn: 'Failing', resultLabelEs: 'No Aprobado', passed: false };
  }
}

/**
 * Checks whether the student has provided sufficient educational evidence
 * to warrant a fair, comprehensive evaluation.
 */
export function checkEducationalEvidence(
  lessonId: string,
  lessonTitle: string,
  level: string,
  chatMessages: { sender: string; text: string }[],
  durationSeconds: number,
  lang: 'EN' | 'ES' = 'ES',
  estimatedMinutes: number = 20
): EvidenceCheckResult {
  // Count substantive user responses (> 3 words)
  const userMessages = chatMessages.filter(m => m.sender === 'user');
  const substantiveUserMessages = userMessages.filter(m => {
    const wordCount = (m.text || '').trim().split(/\s+/).length;
    return wordCount >= 3;
  }).length;

  // Determine required responses based on CEFR level and lesson type
  const isStarInterview = lessonId === 'cat-job-interview' || lessonTitle.toLowerCase().includes('star');
  const isBeginner = (level || '').toUpperCase().startsWith('A');
  const isAdvanced = (level || '').toUpperCase().startsWith('C');

  let requiredMessages = 4;
  if (isBeginner) {
    requiredMessages = 3;
  } else if (isStarInterview) {
    // STAR requires the 4 pillars: Situation, Task, Action, Result
    requiredMessages = 4;
  } else if (isAdvanced) {
    requiredMessages = 5;
  }

  // 20-minute genuine active instructional participation required for 20-minute lessons
  const targetMinutes = estimatedMinutes && estimatedMinutes > 0 ? estimatedMinutes : 20;
  const requiredDurationSeconds = targetMinutes * 60; // 1200s for a 20-min lesson

  const missingAspects: string[] = [];

  // Check specific STAR elements if interview
  if (isStarInterview) {
    const combinedUserText = userMessages.map(m => m.text.toLowerCase()).join(' ');
    const hasSituation = /situation|when|while|at my|trabajaba|cuando|en mi|situaci[oó]n/i.test(combinedUserText);
    const hasTask = /task|responsible|role|my job|tarea|responsabilidad|ten[ií]a que|mi rol/i.test(combinedUserText);
    const hasAction = /action|i did|i decided|i solved|i created|i coordinated|executed|execute|applied|fixed|developed|led|hice|decid[ií]|resolv[ií]|cre[eé]|implement[eé]|ejecut[eé]/i.test(combinedUserText);
    const hasResult = /result|outcome|finally|succeeded|improved|as a result|resultado|logr[eé]|finalmente|mejor[oó]/i.test(combinedUserText);

    if (!hasSituation) missingAspects.push(lang === 'EN' ? 'Situation (Context)' : 'Situación (Contexto del reto)');
    if (!hasTask) missingAspects.push(lang === 'EN' ? 'Task (Your responsibility)' : 'Tarea (Tu rol y objetivo)');
    if (!hasAction) missingAspects.push(lang === 'EN' ? 'Action (What you executed)' : 'Acción (Qué ejecutaste tú)');
    if (!hasResult) missingAspects.push(lang === 'EN' ? 'Result (Outcome & metrics)' : 'Resultado (Impacto y logros)');
  }

  const hasEnoughTurns = substantiveUserMessages >= requiredMessages;
  const hasEnoughTime = durationSeconds >= requiredDurationSeconds;
  const isSufficient = hasEnoughTurns && hasEnoughTime;

  let guidanceMessage = '';
  if (!isSufficient) {
    const remainingMins = Math.max(0, Math.ceil((requiredDurationSeconds - durationSeconds) / 60));
    if (lang === 'EN') {
      guidanceMessage = `To ensure an accurate and rigorous grade, this lesson requires at least ${requiredMessages} comprehensive practice turns (you have completed ${substantiveUserMessages}) and at least ${targetMinutes} minutes of active learning (you have completed ${Math.floor(durationSeconds / 60)} min). Please continue practicing with Voyager.`;
      if (missingAspects.length > 0) {
        guidanceMessage += ` Key parts still needed: ${missingAspects.join(', ')}.`;
      }
    } else {
      guidanceMessage = `Para asegurar una calificación justa y rigurosa, esta lección requiere al menos ${requiredMessages} intervenciones sustantivas de práctica (llevas ${substantiveUserMessages}) y un mínimo de ${targetMinutes} minutos de aprendizaje activo (llevas ${Math.floor(durationSeconds / 60)} min). Continúa practicando con Voyager.`;
      if (missingAspects.length > 0) {
        guidanceMessage += ` Partes aún por demostrar: ${missingAspects.join(', ')}.`;
      }
    }
  }

  return {
    isSufficient,
    substantiveUserMessages,
    requiredMessages,
    durationSeconds,
    requiredDurationSeconds,
    missingAspects,
    guidanceMessage
  };
}

/**
 * Calculates criteria scores using specialized rubrics per lesson type.
 */
export function evaluateLessonPerformance(
  lessonId: string,
  lessonTitle: string,
  category: string,
  level: string,
  chatMessages: { sender: string; text: string }[],
  durationSeconds: number,
  globalScores: { grammar: number; pronunciation: number; confidence: number; naturalness: number },
  lang: 'EN' | 'ES' = 'ES'
): LessonEvaluationRecord {
  const isStarInterview = lessonId === 'cat-job-interview' || lessonTitle.toLowerCase().includes('star');
  const isCivics = lessonId.includes('civics') || lessonId.includes('ciudadania') || category.toLowerCase().includes('cívica');

  const userMessages = chatMessages.filter(m => m.sender === 'user');
  const totalUserWords = userMessages.reduce((sum, m) => sum + (m.text || '').trim().split(/\s+/).length, 0);
  const avgWordsPerTurn = userMessages.length > 0 ? totalUserWords / userMessages.length : 0;
  const combinedUserText = userMessages.map(m => m.text.toLowerCase()).join(' ');

  // 1. Grammar Accuracy
  const baseGrammar = globalScores.grammar || 78;
  const grammarScore = Math.min(100, Math.max(45, Math.round(baseGrammar + (avgWordsPerTurn > 8 ? 4 : 0))));

  // 2. Pronunciation
  const basePronunciation = globalScores.pronunciation || 75;
  const pronunciationScore = Math.min(100, Math.max(50, Math.round(basePronunciation)));

  // 3. Fluency & Confidence
  const baseFluency = Math.round(((globalScores.confidence || 70) + (globalScores.naturalness || 72)) / 2);
  const turnBonus = Math.min(10, userMessages.length * 1.5);
  const fluencyScore = Math.min(100, Math.max(50, Math.round(baseFluency + turnBonus)));

  // 4. Vocabulary (professional, domain-specific, transitions)
  let vocabHits = 0;
  const vocabList = [
    'because', 'however', 'therefore', 'furthermore', 'specifically', 'collaborated',
    'implemented', 'resolved', 'improved', 'increased', 'strategy', 'effective',
    'responsible', 'managed', 'developed', 'coordinated', 'achieved', 'successfully'
  ];
  vocabList.forEach(w => {
    if (combinedUserText.includes(w)) vocabHits += 1;
  });
  const vocabScore = Math.min(100, Math.max(55, Math.round(65 + Math.min(30, vocabHits * 4))));

  // 5. Comprehension & Relevance
  const comprehensionScore = Math.min(100, Math.max(60, Math.round(75 + (userMessages.length >= 4 ? 15 : 5))));

  // 6. Lesson-Specific Objective Completion
  let objectiveScore = 70;
  if (isStarInterview) {
    let starComponents = 0;
    if (/situation|when|while|at my|trabajaba|cuando|en mi|situaci[oó]n/i.test(combinedUserText)) starComponents += 25;
    if (/task|responsible|role|my job|tarea|responsabilidad|ten[ií]a que|mi rol/i.test(combinedUserText)) starComponents += 25;
    if (/action|i did|i decided|i solved|i created|hice|decid[ií]|resolv[ií]|implement[eé]/i.test(combinedUserText)) starComponents += 25;
    if (/result|outcome|finally|succeeded|improved|resultado|logr[eé]|mejor[oó]/i.test(combinedUserText)) starComponents += 25;
    objectiveScore = Math.min(100, Math.max(45, starComponents));
  } else if (isCivics) {
    objectiveScore = Math.min(100, Math.max(55, Math.round(70 + userMessages.length * 5)));
  } else {
    objectiveScore = Math.min(100, Math.max(50, Math.round(70 + (userMessages.length >= 5 ? 20 : 10))));
  }

  // Weightings based on lesson rubric
  let numericalScore = 0;
  if (isStarInterview) {
    // Rubric: Objective 30%, Vocabulary 20%, Fluency 20%, Comprehension 15%, Grammar 10%, Pronunciation 5%
    numericalScore = (
      objectiveScore * 0.30 +
      vocabScore * 0.20 +
      fluencyScore * 0.20 +
      comprehensionScore * 0.15 +
      grammarScore * 0.10 +
      pronunciationScore * 0.05
    );
  } else if (isCivics) {
    // Rubric: Comprehension 35%, Objective 25%, Pronunciation 15%, Grammar 15%, Fluency 10%
    numericalScore = (
      comprehensionScore * 0.35 +
      objectiveScore * 0.25 +
      pronunciationScore * 0.15 +
      grammarScore * 0.15 +
      fluencyScore * 0.10
    );
  } else {
    // Standard Immersion Rubric
    numericalScore = (
      fluencyScore * 0.25 +
      vocabScore * 0.20 +
      grammarScore * 0.20 +
      comprehensionScore * 0.20 +
      objectiveScore * 0.10 +
      pronunciationScore * 0.05
    );
  }

  const finalScore = Math.round(numericalScore);
  const gradeInfo = scoreToLetterGrade(finalScore);

  // Generate qualitative feedback
  const strengths: string[] = [];
  const areasToImprove: string[] = [];
  const recommendations: string[] = [];

  if (lang === 'EN') {
    if (objectiveScore >= 80) strengths.push('Strong adherence to the lesson objective framework.');
    if (fluencyScore >= 80) strengths.push('Fluid speaking pace and active conversational engagement.');
    if (vocabScore >= 75) strengths.push('Appropriate professional terminology and transitional vocabulary.');
    if (grammarScore >= 80) strengths.push('Solid grammatical accuracy in past-tense narrative.');
    if (strengths.length === 0) strengths.push('Consistent participation throughout the practice dialogue.');

    if (objectiveScore < 75) areasToImprove.push('Structuring answers strictly around Situation, Task, Action, and Result.');
    if (vocabScore < 75) areasToImprove.push('Expanding formal workplace vocabulary and descriptive verbs.');
    if (grammarScore < 75) areasToImprove.push('Refining past tense agreement and preposition usage.');
    if (areasToImprove.length === 0) areasToImprove.push('Adding concrete metrics or quantifiable outcomes to your examples.');

    recommendations.push('Practice linking your actions directly to business results using phrases like "As a result, our team achieved..."');
    recommendations.push('In your next attempt, try quantifying your impact with specific numbers or percentages.');
    if (!gradeInfo.passed) {
      recommendations.push('Repeat this lesson focusing specifically on providing a complete 4-part STAR response.');
    }
  } else {
    if (objectiveScore >= 80) strengths.push('Excelente dominio de la estructura del objetivo de la lección.');
    if (fluencyScore >= 80) strengths.push('Ritmo conversacional ágil y buena seguridad al hablar.');
    if (vocabScore >= 75) strengths.push('Uso acertado de vocabulario profesional y conectores en inglés.');
    if (grammarScore >= 80) strengths.push('Precisión gramatical sólida al narrar experiencias pasadas.');
    if (strengths.length === 0) strengths.push('Participación activa y constante a lo largo de la práctica.');

    if (objectiveScore < 75) areasToImprove.push('Estructurar la respuesta cubriendo claramente Situación, Tarea, Acción y Resultado.');
    if (vocabScore < 75) areasToImprove.push('Incorporar verbos de acción más precisos en lugar de términos genéricos.');
    if (grammarScore < 75) areasToImprove.push('Cuidar la concordancia en tiempos pasados (did, coordinated, improved).');
    if (areasToImprove.length === 0) areasToImprove.push('Cuantificar el impacto con métricas o porcentajes concretos.');

    recommendations.push('Conecta tus acciones directamente al resultado usando frases como "As a result, we improved efficiency by..."');
    recommendations.push('En tu próximo intento, comparte una anécdota con detalles medibles (tiempo ahorrado, clientes atendidos).');
    if (!gradeInfo.passed) {
      recommendations.push('Te recomendamos repetir esta lección con práctica dirigida para consolidar los 4 pasos del marco STAR.');
    }
  }

  // Explanation
  const explanation = lang === 'EN'
    ? `You earned a ${gradeInfo.grade} (${finalScore}%) based on ${userMessages.length} responses evaluated across 6 criteria. ${gradeInfo.passed ? 'You have demonstrated the primary competencies for this lesson.' : 'Additional practice is recommended to reach passing proficiency (C or above).'}`
    : `Obtuviste una calificación de ${gradeInfo.grade} (${finalScore}%) tras evaluar ${userMessages.length} respuestas en 6 criterios pedagógicos. ${gradeInfo.passed ? 'Demostraste las competencias clave requeridas para aprobar esta lección.' : 'Se recomienda práctica adicional para alcanzar el nivel aprobatorio (C o superior).'}`;

  // Attempt count lookup
  const previousAttempts = getStoredAttemptsForLesson(lessonId);
  const attemptNumber = previousAttempts.length + 1;

  return {
    id: `eval_${lessonId}_${Date.now()}`,
    lessonId,
    lessonTitle,
    category,
    level,
    attemptNumber,
    date: new Date().toISOString(),
    durationSeconds,
    numericalScore: finalScore,
    letterGrade: gradeInfo.grade,
    passed: gradeInfo.passed,
    resultLabel: lang === 'EN' ? gradeInfo.resultLabelEn : gradeInfo.resultLabelEs,
    criteriaScores: {
      grammar: grammarScore,
      pronunciation: pronunciationScore,
      fluency: fluencyScore,
      vocabulary: vocabScore,
      comprehension: comprehensionScore,
      objectiveCompletion: objectiveScore
    },
    explanation,
    strengths,
    areasToImprove,
    recommendations
  };
}

/**
 * Storage helpers for lesson evaluation records.
 */
const STORAGE_KEY = 'voyager_lesson_attempts';

export function getStoredLessonAttempts(): LessonEvaluationRecord[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    return JSON.parse(raw);
  } catch (e) {
    return [];
  }
}

export function getStoredAttemptsForLesson(lessonId: string): LessonEvaluationRecord[] {
  const all = getStoredLessonAttempts();
  return all.filter(a => a.lessonId === lessonId);
}

export function saveLessonEvaluationRecord(record: LessonEvaluationRecord): void {
  try {
    const studentId = record.studentId || auth.currentUser?.uid || 'STU-001';
    const enrichedRecord: LessonEvaluationRecord = {
      ...record,
      studentId
    };

    const all = getStoredLessonAttempts();
    const updated = [enrichedRecord, ...all];
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    window.dispatchEvent(new Event('voyager_lesson_attempts_updated'));

    // Asynchronously synchronize evaluation record to Firestore
    if (db && !isFirestoreQuotaExceeded()) {
      const docRef = doc(db, 'users', studentId, 'evaluations', enrichedRecord.id);
      setDoc(docRef, enrichedRecord).catch(err => {
        handleFirestoreWriteError(err, 'save lesson evaluation record');
      });
    }
  } catch (e) {
    console.warn('Error saving lesson evaluation record:', e);
  }
}

/**
 * Retrieves evaluated lesson records for a specific student, querying Firestore with fallback to local storage.
 */
export async function fetchStudentEvaluations(studentId: string): Promise<LessonEvaluationRecord[]> {
  try {
    if (db && !isFirestoreQuotaExceeded() && studentId) {
      const colRef = collection(db, 'users', studentId, 'evaluations');
      const q = query(colRef, orderBy('date', 'desc'));
      const snapshot = await getDocs(q);
      if (!snapshot.empty) {
        const remoteItems: LessonEvaluationRecord[] = [];
        snapshot.forEach(d => {
          remoteItems.push(d.data() as LessonEvaluationRecord);
        });
        return remoteItems;
      }
    }
  } catch (err) {
    handleFirestoreWriteError(err, 'fetch student evaluations');
  }

  // Fallback to local evaluations for this student or demo student
  const local = getStoredLessonAttempts();
  return local.filter(a => !a.studentId || a.studentId === studentId || studentId === 'STU-001');
}

export interface LessonProgressionStatus {
  isReadyForEvaluation: boolean;
  completedObjectives: string[];
  pendingObjectives: string[];
  progressPercentage: number;
  substantiveTurnCount: number;
  hasMetMinimumDuration: boolean;
  activeDurationSeconds: number;
  requiredDurationSeconds: number;
}

/**
 * Tracks objective completion across conversational turns.
 * Ensures completion is based on demonstrated learning and minimum active duration (20 minutes).
 */
export function trackLessonProgression(
  lessonId: string,
  lessonTitle: string,
  chatMessages: { sender: string; text: string; isEvaluation?: boolean }[],
  durationSeconds: number = 0,
  estimatedMinutes: number = 20
): LessonProgressionStatus {
  // If an evaluation has already been rendered in this session, do not re-trigger
  const alreadyEvaluated = chatMessages.some(m => m.isEvaluation || (m.sender === 'assistant' && m.text && m.text.includes('🎓 **')));

  const targetMinutes = estimatedMinutes && estimatedMinutes > 0 ? estimatedMinutes : 20;
  const requiredDurationSeconds = targetMinutes * 60; // 1200s for a 20-minute lesson
  const hasMetMinimumDuration = durationSeconds >= requiredDurationSeconds;

  const userMessages = chatMessages.filter(m => m.sender === 'user');
  const substantiveMessages = userMessages.filter(m => (m.text || '').trim().split(/\s+/).length >= 3);
  const combinedUserText = userMessages.map(m => (m.text || '').toLowerCase()).join(' ');

  // Check if assistant tagged explicit evaluation signal
  const hasExplicitEvaluationTag = chatMessages.some(m => 
    m.sender === 'assistant' && (m.text?.includes('[EVALUATE_LESSON_NOW]') || m.text?.includes('EVALUATE_LESSON_NOW'))
  );

  const isStarInterview = lessonId === 'cat-job-interview' || lessonTitle.toLowerCase().includes('star');

  if (isStarInterview) {
    const hasS = /situation|when|while|at my|trabajaba|cuando|en mi|situaci[oó]n|my challenge/i.test(combinedUserText);
    const hasT = /task|responsible|role|my job|tarea|responsabilidad|ten[ií]a que|mi rol|assigned/i.test(combinedUserText);
    const hasA = /action|i did|i decided|i solved|i created|i coordinated|executed|execute|applied|fixed|developed|led|hice|decid[ií]|resolv[ií]|cre[eé]|implement[eé]|ejecut[eé]/i.test(combinedUserText);
    const hasR = /result|outcome|finally|succeeded|improved|as a result|resultado|logr[eé]|finalmente|mejor[oó]|boost|reduced|increased/i.test(combinedUserText);

    const completed: string[] = [];
    const pending: string[] = [];
    if (hasS) completed.push('Situation'); else pending.push('Situation');
    if (hasT) completed.push('Task'); else pending.push('Task');
    if (hasA) completed.push('Action'); else pending.push('Action');
    if (hasR) completed.push('Result'); else pending.push('Result');

    const progressPercentage = Math.round((completed.length / 4) * 100);
    // Ready only if all 4 components are demonstrated, at least 4 substantive turns, AND minimum active duration is met
    const hasMetObjectives = (completed.length === 4 && substantiveMessages.length >= 4) || hasExplicitEvaluationTag;
    const isReady = !alreadyEvaluated && hasMetMinimumDuration && hasMetObjectives;

    return {
      isReadyForEvaluation: isReady,
      completedObjectives: completed,
      pendingObjectives: pending,
      progressPercentage,
      substantiveTurnCount: substantiveMessages.length,
      hasMetMinimumDuration,
      activeDurationSeconds: durationSeconds,
      requiredDurationSeconds
    };
  }

  // General curriculum / Immersion / Civics
  const completed: string[] = [];
  const pending: string[] = [];

  const hasGreeting = /hello|hi|good morning|good afternoon|good evening|hola|buenos|buenas/i.test(combinedUserText);
  const hasInquiry = /i'd like|could i|can i|where|how|price|cost|quiero|me gustar[ií]a|podr[ií]a|d[oó]nde/i.test(combinedUserText);
  const hasDetail = /please|because|with|without|paper|plastic|cash|card|size|large|medium|small|por favor|tarjeta|efectivo/i.test(combinedUserText);
  const hasConclusion = /thank|thanks|receipt|have a good|have a nice|gracias|recibo|que tenga/i.test(combinedUserText);

  if (hasGreeting) completed.push('Greeting & Courtesy'); else pending.push('Greeting & Courtesy');
  if (hasInquiry) completed.push('Core Request / Ordering'); else pending.push('Core Request / Ordering');
  if (hasDetail) completed.push('Specifications & Adjustments'); else pending.push('Specifications & Adjustments');
  if (hasConclusion) completed.push('Polite Checkout & Closure'); else pending.push('Polite Checkout & Closure');

  const progressPercentage = Math.min(100, Math.round((completed.length / 4) * 100));
  const hasMetObjectives = (completed.length >= 4 && substantiveMessages.length >= 4) || (hasExplicitEvaluationTag && substantiveMessages.length >= 3);
  const isReady = !alreadyEvaluated && hasMetMinimumDuration && hasMetObjectives;

  return {
    isReadyForEvaluation: isReady,
    completedObjectives: completed,
    pendingObjectives: pending,
    progressPercentage,
    substantiveTurnCount: substantiveMessages.length,
    hasMetMinimumDuration,
    activeDurationSeconds: durationSeconds,
    requiredDurationSeconds
  };
}

/**
 * Generates natural spoken American English teacher feedback and formatted in-chat Markdown.
 */
export function generateEvaluationFeedback(
  evaluation: LessonEvaluationRecord,
  lang: 'EN' | 'ES' = 'ES'
): { spokenText: string; formattedMessage: string } {
  const isEn = lang === 'EN';
  const grade = evaluation.letterGrade;
  const score = evaluation.numericalScore;
  const passed = evaluation.passed;
  const statusLabel = passed 
    ? (isEn ? 'PASSED' : 'APROBADO')
    : (isEn ? 'NEEDS IMPROVEMENT — NOT PASSED' : 'NECESITA MEJORAR — NO APROBADO');

  // Spoken teacher feedback (natural, warm, professional American teacher)
  const spokenText = isEn
    ? `Great job completing the lesson activities for ${evaluation.lessonTitle}. Based on your performance across our exercises, your final American letter grade is ${grade}, with a score of ${score} out of 100. ${evaluation.explanation} Your key strengths were: ${evaluation.strengths.slice(0, 2).join('; ')}. For next steps, ${evaluation.recommendations[0]} ${passed ? 'Congratulations on passing! You can continue to the next lesson or practice again anytime.' : 'Remember, minimum passing grade is a C (70%). I recommend repeating this lesson with targeted practice to earn your passing grade.'}`
    : `¡Excelente esfuerzo completando las actividades de la lección ${evaluation.lessonTitle}! Con base en tu desempeño demostrado en nuestros ejercicios, tu calificación oficial es ${grade}, con un puntaje de ${score} sobre 100. ${evaluation.explanation} Tus fortalezas principales fueron: ${evaluation.strengths.slice(0, 2).join('; ')}. Como recomendación: ${evaluation.recommendations[0]} ${passed ? '¡Felicitaciones por aprobar! Puedes continuar a la siguiente lección o practicar voluntariamente de nuevo para perfeccionar tu nota.' : 'Recuerda que la nota mínima aprobatoria es C (70%). Te recomiendo repetir esta lección con práctica dirigida para obtener tu calificación aprobatoria.'}`;

  // In-chat Markdown text format (clear, structured, editorial)
  const formattedMessage = isEn
    ? `🎓 **Official Lesson Evaluation — ${evaluation.lessonTitle}**

**Final Letter Grade:** **${grade}** (${score}/100) — *${statusLabel}*
*Level:* ${evaluation.level} | *Duration:* ${Math.floor(evaluation.durationSeconds / 60)} min. ${evaluation.durationSeconds % 60} sec. | *Attempt #${evaluation.attemptNumber}*

**Assessment Breakdown (6 Criteria):**
• Grammar Accuracy: **${evaluation.criteriaScores.grammar}%**
• Pronunciation & Phonetics: **${evaluation.criteriaScores.pronunciation}%**
• Fluency & Pacing: **${evaluation.criteriaScores.fluency}%**
• Vocabulary & Connectors: **${evaluation.criteriaScores.vocabulary}%**
• Comprehension & Relevance: **${evaluation.criteriaScores.comprehension}%**
• Objective Completion: **${evaluation.criteriaScores.objectiveCompletion}%**

**Teacher Explanation:**
${evaluation.explanation}

**Key Strengths Demonstrated:**
${evaluation.strengths.map(s => `• ${s}`).join('\n')}

**Areas for Development:**
${evaluation.areasToImprove.map(a => `• ${a}`).join('\n')}

**Targeted Recommendations:**
${evaluation.recommendations.map(r => `• ${r}`).join('\n')}

**Next Step:** ${passed ? 'You have officially earned a passing grade (C or higher). You may voluntarily repeat this lesson to aim for a higher score, or proceed to your next lesson in Mi Trayectoria.' : 'A minimum grade of C (70%) is required to pass. Please repeat this lesson to reinforce these learning objectives and earn your passing grade.'}`
    : `🎓 **Evaluación Oficial de Lección — ${evaluation.lessonTitle}**

**Calificación Final:** **${grade}** (${score}/100) — *${statusLabel}*
*Nivel:* ${evaluation.level} | *Duración:* ${Math.floor(evaluation.durationSeconds / 60)} min. ${evaluation.durationSeconds % 60} sec. | *Intento #${evaluation.attemptNumber}*

**Desglose Pedagógico (6 Criterios Americanos):**
• Precisión Gramatical: **${evaluation.criteriaScores.grammar}%**
• Pronunciación y Fonética: **${evaluation.criteriaScores.pronunciation}%**
• Fluidez y Ritmo: **${evaluation.criteriaScores.fluency}%**
• Vocabulario y Conectores: **${evaluation.criteriaScores.vocabulary}%**
• Comprensión y Relevancia: **${evaluation.criteriaScores.comprehension}%**
• Demostración de Objetivos: **${evaluation.criteriaScores.objectiveCompletion}%**

**Evaluación del Docente:**
${evaluation.explanation}

**Fortalezas Demostradas:**
${evaluation.strengths.map(s => `• ${s}`).join('\n')}

**Áreas por Desarrollar:**
${evaluation.areasToImprove.map(a => `• ${a}`).join('\n')}

**Recomendaciones de Práctica:**
${evaluation.recommendations.map(r => `• ${r}`).join('\n')}

**Siguiente Paso:** ${passed ? 'Has alcanzado oficialmente la nota aprobatoria (C o superior). Puedes repetir voluntariamente esta lección para mejorar tu calificación, o continuar con tu siguiente tema en Mi Trayectoria.' : 'Se requiere una nota mínima de C (70%) para aprobar. Te recomendamos repetir esta lección para afianzar estos objetivos y obtener tu calificación aprobatoria.'}`;

  return { spokenText, formattedMessage };
}
