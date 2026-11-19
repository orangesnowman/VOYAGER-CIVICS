import { db, auth } from './firebaseAuth';
import { collection, doc, getDoc, getDocs, setDoc, updateDoc, serverTimestamp, query, where, orderBy } from 'firebase/firestore';
import { isFirestoreQuotaExceeded, handleFirestoreWriteError } from './userProfileService';

export type CefrLevel = 'A1' | 'A2' | 'B1' | 'B2' | 'C1' | 'C2';
export type CertificateStatus = 'IN_PROGRESS' | 'GOAL_ACHIEVED';

export interface CompetencyScores {
  pronunciation: number;           // 20%
  speakingFluency: number;         // 20%
  vocabulary: number;              // 20%
  grammarAccuracy: number;         // 20%
  listeningComprehension: number;  // 20%
  readingComprehension?: number;   // Teacher-assessed required evidence
  writingAccuracy?: number;        // Teacher-assessed required evidence
}

export interface TeacherApprovalData {
  approved: boolean;
  teacherId: string;
  teacherName: string;
  approvedAt: string;
  evidenceNotes?: string;
  readingScore?: number;
  writingScore?: number;
}

export interface CertificateRecord {
  id: string;
  studentId: string;
  studentName: string;
  studentEmail: string;
  currentLevel: CefrLevel;
  targetLevel: CefrLevel;
  status: CertificateStatus;
  readinessPercentage: number;     // Estimated readiness indicator (e.g. 90%)
  competencyScores: CompetencyScores;
  teacherApproval?: TeacherApprovalData;
  achievementDate?: string;        // Official completion date (e.g. "October 27, 2026")
  createdAt: string;
  updatedAt: string;
  certificateNumber: string;
  isHistorical: boolean;
  plan?: 'FREE' | 'PRO';
}

export const CEFR_LEVELS_ORDER: CefrLevel[] = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2'];

export const CEFR_TITLES: Record<CefrLevel, { en: string; es: string }> = {
  A1: { en: 'Beginner English Proficiency', es: 'Suficiencia en Inglés Principiante' },
  A2: { en: 'Elementary English Proficiency', es: 'Suficiencia en Inglés Elemental' },
  B1: { en: 'Intermediate English Proficiency', es: 'Suficiencia en Inglés Intermedio' },
  B2: { en: 'Upper-Intermediate English Proficiency', es: 'Suficiencia en Inglés Intermedio Alto' },
  C1: { en: 'Advanced English Proficiency', es: 'Suficiencia en Inglés Avanzado' },
  C2: { en: 'Mastery English Proficiency', es: 'Suficiencia en Maestría del Inglés' }
};

export const CEFR_PATH_TITLES: Record<CefrLevel, { en: string; es: string }> = {
  A1: { en: 'Your Path to Beginner English', es: 'Tu Camino al Inglés Principiante' },
  A2: { en: 'Your Path to Elementary English', es: 'Tu Camino al Inglés Elemental' },
  B1: { en: 'Your Path to Intermediate English', es: 'Tu Camino al Inglés Intermedio' },
  B2: { en: 'Your Path to Upper-Intermediate English', es: 'Tu Camino al Inglés Intermedio Alto' },
  C1: { en: 'Your Path to Advanced English', es: 'Tu Camino al Inglés Avanzado' },
  C2: { en: 'Your Path to English Mastery', es: 'Tu Camino a la Maestría del Inglés' }
};

export const COMPETENCY_WEIGHTS = {
  pronunciation: 0.20,
  speakingFluency: 0.20,
  vocabulary: 0.20,
  grammarAccuracy: 0.20,
  listeningComprehension: 0.20
};

export interface EvaluationResult {
  readinessPercentage: number;
  eligibleForApproval: boolean;
  thresholdsMet: boolean;
  missingEvidence: string[];
  breakdown: {
    pronunciation: { score: number; weight: number; weighted: number };
    speakingFluency: { score: number; weight: number; weighted: number };
    vocabulary: { score: number; weight: number; weighted: number };
    grammarAccuracy: { score: number; weight: number; weighted: number };
    listeningComprehension: { score: number; weight: number; weighted: number };
    readingComprehension?: { score: number; verified: boolean };
    writingAccuracy?: { score: number; verified: boolean };
  };
}

/**
 * Measurable Progress Algorithm
 * Calculates readiness indicator from 5 core weighted competencies (20% each)
 * and validates minimum competency thresholds (>= 70%) & teacher evidence.
 */
export function evaluateReadiness(scores: CompetencyScores): EvaluationResult {
  const pron = Math.max(0, Math.min(100, scores.pronunciation ?? 80));
  const fluency = Math.max(0, Math.min(100, scores.speakingFluency ?? 80));
  const vocab = Math.max(0, Math.min(100, scores.vocabulary ?? 80));
  const grammar = Math.max(0, Math.min(100, scores.grammarAccuracy ?? 80));
  const listening = Math.max(0, Math.min(100, scores.listeningComprehension ?? 80));

  const weightedScore = Math.round(
    pron * COMPETENCY_WEIGHTS.pronunciation +
    fluency * COMPETENCY_WEIGHTS.speakingFluency +
    vocab * COMPETENCY_WEIGHTS.vocabulary +
    grammar * COMPETENCY_WEIGHTS.grammarAccuracy +
    listening * COMPETENCY_WEIGHTS.listeningComprehension
  );

  // Each core competency must be >= 70% to meet readiness standards
  const allCoreMeetThreshold =
    pron >= 70 && fluency >= 70 && vocab >= 70 && grammar >= 70 && listening >= 70;
  const overallThresholdMet = weightedScore >= 75;

  const missingEvidence: string[] = [];
  if (scores.readingComprehension === undefined || scores.readingComprehension === null) {
    missingEvidence.push('Comprensión de Lectura (Evaluada por Profesor)');
  }
  if (scores.writingAccuracy === undefined || scores.writingAccuracy === null) {
    missingEvidence.push('Precisión Escrita y Redacción (Evaluada por Profesor)');
  }

  const readingOk = (scores.readingComprehension ?? 0) >= 70;
  const writingOk = (scores.writingAccuracy ?? 0) >= 70;

  const thresholdsMet = allCoreMeetThreshold && overallThresholdMet;
  const eligibleForApproval = thresholdsMet && readingOk && writingOk;

  return {
    readinessPercentage: weightedScore,
    thresholdsMet,
    eligibleForApproval,
    missingEvidence,
    breakdown: {
      pronunciation: { score: pron, weight: 0.20, weighted: Math.round(pron * 0.20) },
      speakingFluency: { score: fluency, weight: 0.20, weighted: Math.round(fluency * 0.20) },
      vocabulary: { score: vocab, weight: 0.20, weighted: Math.round(vocab * 0.20) },
      grammarAccuracy: { score: grammar, weight: 0.20, weighted: Math.round(grammar * 0.20) },
      listeningComprehension: { score: listening, weight: 0.20, weighted: Math.round(listening * 0.20) },
      readingComprehension: scores.readingComprehension !== undefined ? {
        score: scores.readingComprehension,
        verified: readingOk
      } : undefined,
      writingAccuracy: scores.writingAccuracy !== undefined ? {
        score: scores.writingAccuracy,
        verified: writingOk
      } : undefined
    }
  };
}

const DEFAULT_DEMO_CERTIFICATE: CertificateRecord = {
  id: 'cert-stu001-c1',
  studentId: 'STU-001',
  studentName: 'Federico Sandoval',
  studentEmail: 'theorangesnowman@gmail.com',
  currentLevel: 'B2',
  targetLevel: 'C1',
  status: 'IN_PROGRESS',
  readinessPercentage: 90,
  competencyScores: {
    pronunciation: 88,
    speakingFluency: 92,
    vocabulary: 90,
    grammarAccuracy: 88,
    listeningComprehension: 92,
    readingComprehension: 86,
    writingAccuracy: 88
  },
  certificateNumber: 'VOY-2026-C1-08492',
  achievementDate: undefined,
  createdAt: '2026-10-01',
  updatedAt: '2026-10-27',
  isHistorical: false,
  plan: 'PRO'
};

const DEFAULT_HISTORICAL_CERTIFICATES: CertificateRecord[] = [
  {
    id: 'cert-stu001-b2',
    studentId: 'STU-001',
    studentName: 'Federico Sandoval',
    studentEmail: 'theorangesnowman@gmail.com',
    currentLevel: 'B1',
    targetLevel: 'B2',
    status: 'GOAL_ACHIEVED',
    readinessPercentage: 100,
    competencyScores: {
      pronunciation: 85,
      speakingFluency: 88,
      vocabulary: 86,
      grammarAccuracy: 84,
      listeningComprehension: 90,
      readingComprehension: 88,
      writingAccuracy: 86
    },
    teacherApproval: {
      approved: true,
      teacherId: 'TCH-001',
      teacherName: 'Alejandra Francois (La Profe)',
      approvedAt: 'September 15, 2026',
      readingScore: 88,
      writingScore: 86,
      evidenceNotes: 'Excepcional fluidez conversacional y dominio del vocabulario intermedio alto.'
    },
    certificateNumber: 'VOY-2026-B2-04182',
    achievementDate: 'September 15, 2026',
    createdAt: '2026-08-01',
    updatedAt: '2026-09-15',
    isHistorical: true,
    plan: 'PRO'
  }
];

const LOCAL_STORAGE_CERT_ACTIVE = 'voyager_active_certificate';
const LOCAL_STORAGE_CERT_HISTORY = 'voyager_certificate_history';

/**
 * Fetches the active certificate for a student.
 * If in Live mode and Firestore has a record, returns Firestore record.
 * Otherwise returns local cache or demo fallback.
 */
export async function fetchActiveCertificate(
  studentId: string = 'STU-001',
  studentName: string = 'Federico Sandoval',
  studentEmail: string = 'theorangesnowman@gmail.com',
  userPlan: 'FREE' | 'PRO' = 'PRO'
): Promise<CertificateRecord> {
  // 1. Try Firestore if available and user is authenticated
  if (db && !isFirestoreQuotaExceeded() && auth.currentUser?.uid) {
    try {
      const uid = auth.currentUser.uid;
      const certRef = doc(db, 'users', uid, 'certificates', 'active');
      const snap = await getDoc(certRef);
      if (snap.exists()) {
        const data = snap.data() as CertificateRecord;
        return {
          ...data,
          studentName: studentName || data.studentName,
          plan: userPlan
        };
      }
    } catch (err) {
      handleFirestoreWriteError(err, 'fetch active certificate');
    }
  }

  // 2. LocalStorage Cache check
  if (typeof window !== 'undefined') {
    try {
      const cached = localStorage.getItem(`${LOCAL_STORAGE_CERT_ACTIVE}_${studentId}`);
      if (cached) {
        const parsed = JSON.parse(cached);
        return {
          ...parsed,
          studentName: studentName || parsed.studentName,
          plan: userPlan
        };
      }
    } catch (e) {}
  }

  // 3. Fallback to default demo certificate with student's dynamic name
  return {
    ...DEFAULT_DEMO_CERTIFICATE,
    studentId,
    studentName,
    studentEmail,
    plan: userPlan
  };
}

/**
 * Saves or updates an active certificate record to Firestore & LocalStorage
 */
export async function saveActiveCertificate(cert: CertificateRecord): Promise<void> {
  const updated = {
    ...cert,
    updatedAt: new Date().toISOString()
  };

  // 1. LocalStorage
  if (typeof window !== 'undefined') {
    try {
      localStorage.setItem(`${LOCAL_STORAGE_CERT_ACTIVE}_${cert.studentId}`, JSON.stringify(updated));
      window.dispatchEvent(new Event('voyager_certificate_updated'));
    } catch (e) {}
  }

  // 2. Firestore
  if (db && !isFirestoreQuotaExceeded() && auth.currentUser?.uid) {
    try {
      const uid = auth.currentUser.uid;
      const certRef = doc(db, 'users', uid, 'certificates', 'active');
      await setDoc(certRef, updated, { merge: true });
    } catch (err) {
      handleFirestoreWriteError(err, 'save active certificate');
    }
  }
}

/**
 * Fetches permanent historical certificates for the student.
 */
export async function fetchCertificateHistory(studentId: string = 'STU-001'): Promise<CertificateRecord[]> {
  // 1. Try Firestore
  if (db && !isFirestoreQuotaExceeded() && auth.currentUser?.uid) {
    try {
      const uid = auth.currentUser.uid;
      const historyCol = collection(db, 'users', uid, 'certificates');
      const q = query(historyCol, where('isHistorical', '==', true));
      const snap = await getDocs(q);
      if (!snap.empty) {
        const items: CertificateRecord[] = [];
        snap.forEach(d => items.push(d.data() as CertificateRecord));
        return items;
      }
    } catch (err) {
      handleFirestoreWriteError(err, 'fetch certificate history');
    }
  }

  // 2. Try LocalStorage
  if (typeof window !== 'undefined') {
    try {
      const cached = localStorage.getItem(`${LOCAL_STORAGE_CERT_HISTORY}_${studentId}`);
      if (cached) {
        const parsed = JSON.parse(cached);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed;
        }
      }
    } catch (e) {}
  }

  return DEFAULT_HISTORICAL_CERTIFICATES;
}

/**
 * Teacher formally approves a certificate.
 * Transitions status from IN_PROGRESS to GOAL_ACHIEVED, stamps 100% progress,
 * and saves immutable history record.
 */
export async function approveStudentCertificate(
  activeCert: CertificateRecord,
  teacherInfo: { id: string; name: string },
  readingScore: number = 88,
  writingScore: number = 86,
  notes: string = 'Aprobado formalmente por docente de USA Voyager.'
): Promise<CertificateRecord> {
  const now = new Date();
  const achievementFormattedDate = now.toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric'
  });

  const updatedCert: CertificateRecord = {
    ...activeCert,
    status: 'GOAL_ACHIEVED',
    readinessPercentage: 100,
    achievementDate: achievementFormattedDate,
    updatedAt: now.toISOString(),
    competencyScores: {
      ...activeCert.competencyScores,
      readingComprehension: readingScore,
      writingAccuracy: writingScore
    },
    teacherApproval: {
      approved: true,
      teacherId: teacherInfo.id,
      teacherName: teacherInfo.name,
      approvedAt: achievementFormattedDate,
      readingScore,
      writingScore,
      evidenceNotes: notes
    }
  };

  // 1. Save active certificate state
  await saveActiveCertificate(updatedCert);

  // 2. Also save to permanent history
  const history = await fetchCertificateHistory(activeCert.studentId);
  const exists = history.some(h => h.id === updatedCert.id);
  const updatedHistory = exists
    ? history.map(h => h.id === updatedCert.id ? { ...updatedCert, isHistorical: true } : h)
    : [{ ...updatedCert, isHistorical: true }, ...history];

  if (typeof window !== 'undefined') {
    try {
      localStorage.setItem(`${LOCAL_STORAGE_CERT_HISTORY}_${activeCert.studentId}`, JSON.stringify(updatedHistory));
      window.dispatchEvent(new Event('voyager_certificate_updated'));
    } catch (e) {}
  }

  if (db && !isFirestoreQuotaExceeded() && auth.currentUser?.uid) {
    try {
      const uid = auth.currentUser.uid;
      const historyDoc = doc(db, 'users', uid, 'certificates', updatedCert.id);
      await setDoc(historyDoc, { ...updatedCert, isHistorical: true }, { merge: true });
    } catch (err) {
      handleFirestoreWriteError(err, 'archive historical certificate');
    }
  }

  return updatedCert;
}

/**
 * Initiates the next learning goal when an existing certificate has been achieved.
 * Archives current achieved certificate into permanent history without overwriting it,
 * and initializes a new IN_PROGRESS certificate toward the next CEFR level.
 */
export async function startNextLearningGoal(
  achievedCert: CertificateRecord,
  newTargetLevel: CefrLevel
): Promise<CertificateRecord> {
  const currentLevel = achievedCert.targetLevel; // previous target becomes current starting point
  const now = new Date().toISOString();
  const newCertId = `cert-${achievedCert.studentId}-${newTargetLevel.toLowerCase()}-${Date.now()}`;

  const newActiveCert: CertificateRecord = {
    id: newCertId,
    studentId: achievedCert.studentId,
    studentName: achievedCert.studentName,
    studentEmail: achievedCert.studentEmail,
    currentLevel,
    targetLevel: newTargetLevel,
    status: 'IN_PROGRESS',
    readinessPercentage: 45, // Initial baseline for next level
    competencyScores: {
      pronunciation: 70,
      speakingFluency: 65,
      vocabulary: 68,
      grammarAccuracy: 70,
      listeningComprehension: 72
    },
    certificateNumber: `VOY-2026-${newTargetLevel}-${Math.floor(10000 + Math.random() * 90000)}`,
    createdAt: now,
    updatedAt: now,
    isHistorical: false,
    plan: achievedCert.plan || 'PRO'
  };

  await saveActiveCertificate(newActiveCert);
  return newActiveCert;
}
