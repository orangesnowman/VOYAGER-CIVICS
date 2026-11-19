import { db } from './firebaseAuth';
import { collection, query, where, getDocs, addDoc, doc, updateDoc, serverTimestamp, getDoc } from 'firebase/firestore';
import { isFirestoreQuotaExceeded, handleFirestoreWriteError } from './userProfileService';

export interface StudentSummary {
  id: string;
  name: string;
  email: string;
  cefrLevel?: string;
  levelEstimate?: string;
  goal?: string;
  timePerWeek?: string;
  education?: string;
  category?: string;
  interests?: string;
  scores?: {
    pronunciation?: number;
    grammar?: number;
    naturalness?: number;
    confidence?: number;
    fluency?: number;
    vocabulary?: number;
  };
  [key: string]: any;
}

export interface HomeworkItem {
  id: string;
  studentId: string;
  title: string;
  description?: string;
  status?: 'PENDING' | 'SUBMITTED' | 'GRADED' | string;
  dueDate?: string;
  assignedBy?: string;
  createdAt?: string;
  grade?: string;
  feedback?: string;
  [key: string]: any;
}

export interface TeacherFeedbackItem {
  id: string;
  studentId: string;
  text: string;
  teacherName?: string;
  createdAt?: string;
  category?: string;
  [key: string]: any;
}

const DEFAULT_DEMO_STUDENTS: StudentSummary[] = [
  {
    id: 'STU-001',
    name: 'Federico Sandoval',
    email: 'theorangesnowman@gmail.com',
    cefrLevel: 'B2',
    levelEstimate: 'Intermediate',
    goal: 'Travel & Academic Success',
    timePerWeek: '5 hr/wk',
    education: 'University',
    category: 'Administrator',
    interests: 'Travel, technology, music',
    scores: {
      pronunciation: 82,
      grammar: 88,
      naturalness: 74,
      confidence: 68
    }
  },
  {
    id: 'STU-002',
    name: 'María García',
    email: 'mgarcia@example.com',
    cefrLevel: 'B1',
    levelEstimate: 'Intermediate',
    goal: 'Business Conversation',
    timePerWeek: '3 hr/wk',
    education: 'University',
    category: 'Student',
    interests: 'Finance, business',
    scores: {
      pronunciation: 85,
      grammar: 90,
      naturalness: 80,
      confidence: 88
    }
  },
  {
    id: 'STU-003',
    name: 'Carlos Rodríguez',
    email: 'crodriguez@example.com',
    cefrLevel: 'A2',
    levelEstimate: 'Beginner',
    goal: 'US Citizenship Interview',
    timePerWeek: '4 hr/wk',
    education: 'High School',
    category: 'Student',
    interests: 'Civics, history',
    scores: {
      pronunciation: 75,
      grammar: 70,
      naturalness: 72,
      confidence: 80
    }
  }
];

export async function fetchAssignedStudents(teacherUid?: string, teacherEmail?: string): Promise<StudentSummary[]> {
  try {
    if (db && !isFirestoreQuotaExceeded()) {
      const usersRef = collection(db, 'users');
      const snapshot = await getDocs(usersRef);
      if (!snapshot.empty) {
        const firestoreStudents: StudentSummary[] = [];
        snapshot.forEach(docSnap => {
          const data = docSnap.data();
          if (data.email || data.name || data.firstName) {
            firestoreStudents.push({
              id: docSnap.id,
              name: data.name || `${data.firstName || ''} ${data.lastName || ''}`.trim() || 'Learner',
              email: data.email || 'learner@voyager.com',
              cefrLevel: data.cefrLevel || data.levelEstimate || 'B1',
              levelEstimate: data.levelEstimate || 'Intermediate',
              goal: data.goal || 'Travel & Daily Conversation',
              timePerWeek: data.timePerWeek || '5 hr/wk',
              education: data.education || 'University',
              category: data.category || 'Student',
              interests: data.interests || 'General',
              scores: data.scores || { pronunciation: 82, grammar: 88, naturalness: 74, confidence: 68 }
            });
          }
        });
        if (firestoreStudents.length > 0) return firestoreStudents;
      }
    }
  } catch (err) {
    handleFirestoreWriteError(err, 'fetch assigned students');
    console.warn('Firestore student fetch fallback to demo:', err);
  }
  return DEFAULT_DEMO_STUDENTS;
}

export async function fetchStudentHomework(studentId: string): Promise<HomeworkItem[]> {
  try {
    if (db && !isFirestoreQuotaExceeded()) {
      const hwRef = collection(db, 'homework');
      const q = query(hwRef, where('studentId', '==', studentId));
      const snapshot = await getDocs(q);
      if (!snapshot.empty) {
        const items: HomeworkItem[] = [];
        snapshot.forEach(docSnap => {
          items.push({ id: docSnap.id, ...docSnap.data() } as HomeworkItem);
        });
        return items;
      }
    }
  } catch (err) {
    handleFirestoreWriteError(err, 'fetch student homework');
    console.warn('Firestore homework fetch fallback:', err);
  }

  // Load from local unified demo assignment state so student and teacher view stay synchronized
  if (typeof window !== 'undefined') {
    try {
      const cached = localStorage.getItem('voyager_demo_assignments_state');
      const list: UnifiedAssignment[] = cached ? JSON.parse(cached) : DEMO_ASSIGNMENTS;
      const filtered = list.filter(a => !studentId || a.studentId === studentId || studentId === 'STU-001');
      if (filtered.length > 0) {
        return filtered.map(a => ({
          id: a.id,
          studentId: a.studentId || studentId,
          title: a.title,
          description: a.instructions || a.objective,
          objective: a.objective,
          level: a.level,
          status: a.status,
          dueDate: a.dueDate,
          assignedBy: a.teacherName,
          teacherName: a.teacherName,
          progressPercentage: a.progressPercentage || (a.status === 'COMPLETED' ? 100 : a.status === 'IN_PROGRESS' ? 50 : 0),
          grade: a.grade,
          feedback: a.feedback,
          createdAt: a.assignedDate || a.createdAt || new Date().toLocaleDateString()
        }));
      }
    } catch (e) {}
  }

  return [
    {
      id: 'HW-101',
      studentId,
      title: 'STAR Method Interview',
      description: 'Practice answering 3 situational interview questions using the STAR framework.',
      objective: 'Structure professional responses clearly in English using STAR framework.',
      level: 'B2',
      status: 'PENDING',
      progressPercentage: 0,
      dueDate: '31/10/2026',
      createdAt: new Date().toLocaleDateString()
    }
  ];
}

export async function fetchStudentFeedback(studentId: string): Promise<TeacherFeedbackItem[]> {
  try {
    if (db && !isFirestoreQuotaExceeded()) {
      const fbRef = collection(db, 'feedback');
      const q = query(fbRef, where('studentId', '==', studentId));
      const snapshot = await getDocs(q);
      if (!snapshot.empty) {
        const items: TeacherFeedbackItem[] = [];
        snapshot.forEach(docSnap => {
          items.push({ id: docSnap.id, ...docSnap.data() } as TeacherFeedbackItem);
        });
        return items;
      }
    }
  } catch (err) {
    handleFirestoreWriteError(err, 'fetch student feedback');
    console.warn('Firestore feedback fetch fallback:', err);
  }
  return [
    {
      id: 'FB-201',
      studentId,
      text: 'Excellent pronunciation and natural phrasing on civic history vocabulary. Keep building fluency!',
      teacherName: 'Voyager Tutor',
      createdAt: new Date().toLocaleDateString(),
      category: 'Fluency & Pronunciation'
    }
  ];
}

export async function assignHomeworkToStudent(item: Omit<HomeworkItem, 'id'>): Promise<HomeworkItem> {
  const newItem: HomeworkItem = {
    studentId: item.studentId || 'STU-001',
    title: item.title || 'Practice Task',
    description: item.description || '',
    objective: (item as any).objective || item.description || '',
    level: (item as any).level || 'B2',
    dueDate: item.dueDate || '',
    teacherName: item.teacherName || 'Voyager Tutor',
    ...item,
    id: `HW-${Date.now()}`,
    createdAt: new Date().toLocaleDateString(),
    status: item.status || 'PENDING',
    progressPercentage: item.progressPercentage || 0
  };

  // 1. Save to Firestore if available
  try {
    if (db && !isFirestoreQuotaExceeded()) {
      const ref = await addDoc(collection(db, 'homework'), {
        ...newItem,
        createdAt: serverTimestamp()
      });
      newItem.id = ref.id;
    }
  } catch (err) {
    handleFirestoreWriteError(err, 'assign homework');
  }

  // 2. Also save to local unified assignments state so student immediately sees it in ASIGNADOS
  if (typeof window !== 'undefined') {
    try {
      const cached = localStorage.getItem('voyager_demo_assignments_state');
      const currentList: UnifiedAssignment[] = cached ? JSON.parse(cached) : [...DEMO_ASSIGNMENTS];
      const newUnified: UnifiedAssignment = {
        id: newItem.id,
        studentId: newItem.studentId,
        teacherName: newItem.teacherName || 'Voyager Tutor',
        lessonId: (item as any).lessonId || `lesson-${Date.now()}`,
        title: newItem.title,
        instructions: newItem.description || (item as any).instructions || '',
        objective: (item as any).objective || newItem.description || '',
        category: (item as any).category || 'Teacher Assignment',
        level: (item as any).level || 'B2',
        estimatedMinutes: Number((item as any).estimatedMinutes) || 20,
        assignedDate: new Date().toLocaleDateString(),
        dueDate: newItem.dueDate || 'Próxima Sesión',
        status: 'PENDING',
        progressPercentage: 0,
        isDemo: true
      };
      localStorage.setItem('voyager_demo_assignments_state', JSON.stringify([newUnified, ...currentList]));
      window.dispatchEvent(new Event('voyager_assignments_updated'));
    } catch (e) {}
  }

  return newItem;
}

export async function addTeacherFeedback(item: Omit<TeacherFeedbackItem, 'id'>): Promise<TeacherFeedbackItem> {
  const newItem: TeacherFeedbackItem = {
    studentId: item.studentId || '',
    text: item.text || '',
    teacherName: item.teacherName || 'Voyager Tutor',
    category: item.category || 'General Feedback',
    ...item,
    id: `FB-${Date.now()}`,
    createdAt: new Date().toLocaleDateString()
  };
  try {
    if (db && !isFirestoreQuotaExceeded()) {
      const ref = await addDoc(collection(db, 'feedback'), {
        ...newItem,
        createdAt: serverTimestamp()
      });
      newItem.id = ref.id;
    }
  } catch (err) {
    handleFirestoreWriteError(err, 'add feedback');
  }
  return newItem;
}

export async function linkStudentToTeacher(studentEmail: string, teacherUid: string): Promise<boolean> {
  try {
    if (db && !isFirestoreQuotaExceeded()) {
      const usersRef = collection(db, 'users');
      const q = query(usersRef, where('email', '==', studentEmail.toLowerCase().trim()));
      const snapshot = await getDocs(q);
      if (!snapshot.empty) {
        const docSnap = snapshot.docs[0];
        await updateDoc(doc(db, 'users', docSnap.id), {
          teacherUid,
          updatedAt: serverTimestamp()
        });
        return true;
      }
    }
  } catch (err) {
    handleFirestoreWriteError(err, 'link student');
  }
  return true;
}

// ─────────────────────────────────────────────────────────────────────────────
// UNIFIED ASSIGNMENT ARCHITECTURE (STUDENT EXPERIENCE FIRST)
// Supports seamless transition between Demonstration Mode and Production Mode.
// ─────────────────────────────────────────────────────────────────────────────

export interface UnifiedAssignment {
  id: string;
  studentId: string;
  teacherName: string;
  lessonId: string;
  title: string;
  instructions: string;
  objective: string;
  category: string;
  level: string; // Authentic CEFR level: A1-A2, B1, B2, C1
  estimatedMinutes: number;
  assignedDate: string;
  dueDate: string;
  status: 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'GRADED';
  progressPercentage?: number;
  grade?: string;
  feedback?: string;
  isDemo?: boolean;
  createdAt?: string;
  completedAt?: string;
}

export interface FetchAssignmentsResult {
  assignments: UnifiedAssignment[];
  source: 'production' | 'demo' | 'empty';
  isDemoMode: boolean;
  error?: string;
}

/**
 * Normalizes any assignment date format (DD/MM/YYYY, DD/MM/YY, YYYY-MM-DD, ISO string)
 * into a standardized YYYY-MM-DD calendar key.
 */
export function parseDateToKey(dateStr?: string): string | null {
  if (!dateStr) return null;
  const trimmed = dateStr.trim();
  // Check YYYY-MM-DD or ISO
  if (/^\d{4}-\d{2}-\d{2}/.test(trimmed)) {
    return trimmed.slice(0, 10);
  }
  // Check DD/MM/YYYY
  const matchFull = trimmed.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})/);
  if (matchFull) {
    const day = matchFull[1].padStart(2, '0');
    const month = matchFull[2].padStart(2, '0');
    const year = matchFull[3];
    return `${year}-${month}-${day}`;
  }
  // Check DD/MM/YY
  const matchShort = trimmed.match(/^(\d{1,2})\/(\d{1,2})\/(\d{2})/);
  if (matchShort) {
    const day = matchShort[1].padStart(2, '0');
    const month = matchShort[2].padStart(2, '0');
    const year = `20${matchShort[3]}`;
    return `${year}-${month}-${day}`;
  }
  return null;
}

export const DEMO_ASSIGNMENTS: UnifiedAssignment[] = [
  {
    id: 'demo-assign-1',
    studentId: 'STU-001',
    teacherName: 'Profesor García',
    lessonId: 'cat-job-interview',
    title: 'STAR Method Interview',
    instructions: 'Practice answering 3 situational interview questions using the STAR framework. Quantify your actions and maintain clear enunciation.',
    objective: 'Structure professional responses clearly in English using Situation, Task, Action, and Result.',
    category: 'Career & Business',
    level: 'B2',
    estimatedMinutes: 20,
    assignedDate: '26/10/2026',
    dueDate: '31/10/2026',
    status: 'PENDING',
    progressPercentage: 0,
    feedback: 'Excellent opening on the Situation phase. In your next practice, add specific metric results to your final sentence.',
    isDemo: true
  },
  {
    id: 'demo-assign-2',
    studentId: 'STU-001',
    teacherName: 'Prof. Sarah Jenkins',
    lessonId: 'cat-civics-128',
    title: 'USCIS Civics 128: Judicial',
    instructions: 'Review civics questions 37-57. Practice natural oral responses with Voyager without hesitation.',
    objective: 'Master spoken accuracy for official USCIS naturalization questions on rights and judicial checks.',
    category: 'Civics & Rights',
    level: 'B1-B2',
    estimatedMinutes: 20,
    assignedDate: '27/10/2026',
    dueDate: '02/11/2026',
    status: 'IN_PROGRESS',
    progressPercentage: 35,
    isDemo: true
  },
  {
    id: 'demo-assign-3',
    studentId: 'STU-001',
    teacherName: 'Profesor García',
    lessonId: 'cat-doctor-pharmacy',
    title: 'Healthcare & Prescription',
    instructions: 'Simulate a medical consultation: describe sudden symptoms, clarify medication dosages, and ask about side effects.',
    objective: 'Communicate essential medical needs accurately and understand healthcare instructions.',
    category: 'Health & Living',
    level: 'B1',
    estimatedMinutes: 15,
    assignedDate: '20/10/2026',
    dueDate: '25/10/2026',
    status: 'COMPLETED',
    progressPercentage: 100,
    grade: 'A',
    feedback: 'Outstanding medical vocabulary and clear pronunciation of medication frequency terms.',
    isDemo: true
  },
  {
    id: 'demo-assign-4',
    studentId: 'STU-001',
    teacherName: 'Prof. Sarah Jenkins',
    lessonId: 'cat-salary-negotiation',
    title: 'Salary & Compensation Discussion',
    instructions: 'Engage in a professional discussion around salary expectations and benefits package.',
    objective: 'Practice polite assertion, comparative grammar, and salary negotiation terms.',
    category: 'Career & Business',
    level: 'B2-C1',
    estimatedMinutes: 25,
    assignedDate: '28/10/2026',
    dueDate: '05/11/2026',
    status: 'IN_PROGRESS',
    progressPercentage: 50,
    isDemo: true
  },
  {
    id: 'demo-assign-5',
    studentId: 'STU-001',
    teacherName: 'Prof. Michael Chang',
    lessonId: 'cat-airport-tsa',
    title: 'Airport TSA & Customs Inspection',
    instructions: 'Practice answering immigration and customs officer questions smoothly without long pauses.',
    objective: 'Confidently navigate airport security checkpoints and express travel details clearly.',
    category: 'Travel & Transit',
    level: 'A2-B1',
    estimatedMinutes: 15,
    assignedDate: '29/10/2026',
    dueDate: '06/11/2026',
    status: 'PENDING',
    progressPercentage: 0,
    isDemo: true
  },
  {
    id: 'demo-assign-6',
    studentId: 'STU-001',
    teacherName: 'Prof. Sarah Jenkins',
    lessonId: 'cat-constitution-branches',
    title: 'US Constitution & Bill of Rights',
    instructions: 'Explain the three branches of the US government and the core individual rights protected by the First Amendment.',
    objective: 'Understand and articulate fundamental principles of American democratic governance.',
    category: 'Civics & Rights',
    level: 'B1-B2',
    estimatedMinutes: 20,
    assignedDate: '18/10/2026',
    dueDate: '24/10/2026',
    status: 'COMPLETED',
    progressPercentage: 100,
    grade: 'A+',
    feedback: 'Flawless distinction between Executive, Legislative, and Judicial duties.',
    isDemo: true
  },
  {
    id: 'demo-assign-7',
    studentId: 'STU-001',
    teacherName: 'Profesor García',
    lessonId: 'cat-urgent-care',
    title: 'Urgent Care & ER Triage',
    instructions: 'Communicate pain levels, acute allergy reactions, and current medications to a triage nurse.',
    objective: 'Use urgent medical vocabulary and describe immediate physical conditions accurately.',
    category: 'Health & Living',
    level: 'B1',
    estimatedMinutes: 18,
    assignedDate: '30/10/2026',
    dueDate: '08/11/2026',
    status: 'IN_PROGRESS',
    progressPercentage: 20,
    isDemo: true
  },
  {
    id: 'demo-assign-8',
    studentId: 'STU-001',
    teacherName: 'Prof. Elena Torres',
    lessonId: 'cat-housing-lease',
    title: 'Apartment Lease & Repairs Request',
    instructions: 'Request urgent maintenance from a property manager and discuss lease renewal conditions.',
    objective: 'Master formal spoken English for housing agreements and domestic service issues.',
    category: 'Daily Life & Living',
    level: 'A2-B1',
    estimatedMinutes: 15,
    assignedDate: '01/11/2026',
    dueDate: '10/11/2026',
    status: 'PENDING',
    progressPercentage: 0,
    isDemo: true
  },
  {
    id: 'demo-assign-9',
    studentId: 'STU-001',
    teacherName: 'Prof. Michael Chang',
    lessonId: 'cat-banking-credit',
    title: 'US Banking & Credit Score Basics',
    instructions: 'Inquire about opening a checking account, managing credit limits, and reporting a fraudulent charge.',
    objective: 'Navigate American financial terms, routing numbers, and consumer protection phrases.',
    category: 'Finance & Banking',
    level: 'B1-B2',
    estimatedMinutes: 20,
    assignedDate: '02/11/2026',
    dueDate: '12/11/2026',
    status: 'IN_PROGRESS',
    progressPercentage: 65,
    isDemo: true
  },
  {
    id: 'demo-assign-10',
    studentId: 'STU-001',
    teacherName: 'Prof. Sarah Jenkins',
    lessonId: 'cat-n400-interview',
    title: 'Naturalization Oral Interview N-400',
    instructions: 'Practice answering personal eligibility, travel history, and oath requirements from Form N-400.',
    objective: 'Respond clearly and confidently under simulated USCIS oral examination conditions.',
    category: 'Civics & Rights',
    level: 'B1',
    estimatedMinutes: 25,
    assignedDate: '03/11/2026',
    dueDate: '14/11/2026',
    status: 'PENDING',
    progressPercentage: 0,
    isDemo: true
  },
  {
    id: 'demo-assign-11',
    studentId: 'STU-001',
    teacherName: 'Profesor García',
    lessonId: 'cat-team-presentation',
    title: 'Quarterly Team Presentation',
    instructions: 'Present quarterly project results, field peer questions, and summarize executive action items.',
    objective: 'Use confident transition phrases, graph descriptions, and persuasive rhetoric.',
    category: 'Career & Business',
    level: 'B2',
    estimatedMinutes: 20,
    assignedDate: '15/10/2026',
    dueDate: '22/10/2026',
    status: 'COMPLETED',
    progressPercentage: 100,
    grade: 'A',
    feedback: 'Excellent vocal modulation and command of corporate presentation transition phrases.',
    isDemo: true
  },
  {
    id: 'demo-assign-12',
    studentId: 'STU-001',
    teacherName: 'Prof. Elena Torres',
    lessonId: 'cat-school-conference',
    title: 'Parent-Teacher School Conference',
    instructions: 'Discuss academic progress, extracurricular interests, and behavioral milestones with an American schoolteacher.',
    objective: 'Express educational support, ask clarifying questions, and establish school partnerships.',
    category: 'Daily Life & Living',
    level: 'A2-B1',
    estimatedMinutes: 15,
    assignedDate: '04/11/2026',
    dueDate: '15/11/2026',
    status: 'PENDING',
    progressPercentage: 0,
    isDemo: true
  }
];

export async function fetchUnifiedStudentAssignments(
  studentId?: string,
  studentEmail?: string,
  options?: { forceDemo?: boolean }
): Promise<FetchAssignmentsResult> {
  const normEmail = (studentEmail || '').toLowerCase().trim();
  const isDemoAccount = options?.forceDemo || normEmail === 'theorangesnowman@gmail.com' || studentId === 'STU-001' || !studentId;

  // If real Firestore is available and this is NOT a demo account:
  if (db && !isFirestoreQuotaExceeded() && !options?.forceDemo && normEmail !== 'theorangesnowman@gmail.com') {
    try {
      const hwRef = collection(db, 'homework');
      let q = query(hwRef, where('studentId', '==', studentId || ''));
      let snapshot = await getDocs(q);

      if (snapshot.empty && normEmail) {
        q = query(hwRef, where('studentEmail', '==', normEmail));
        snapshot = await getDocs(q);
      }

      if (!snapshot.empty) {
        const prodItems: UnifiedAssignment[] = [];
        snapshot.forEach(docSnap => {
          const data = docSnap.data();
          prodItems.push({
            id: docSnap.id,
            studentId: data.studentId || studentId || '',
            teacherName: data.teacherName || data.assignedBy || 'Voyager Tutor',
            lessonId: data.lessonId || data.activityId || '',
            title: data.title || 'Assigned Lesson',
            instructions: data.instructions || data.description || '',
            objective: data.objective || data.pedagogicalObjective || '',
            category: data.category || 'General',
            level: data.level || 'B1',
            estimatedMinutes: Number(data.estimatedMinutes) || 15,
            assignedDate: data.assignedDate || data.createdAt || '',
            dueDate: data.dueDate || '',
            status: (data.status as any) || 'PENDING',
            progressPercentage: typeof data.progressPercentage === 'number' 
              ? data.progressPercentage 
              : (data.status === 'COMPLETED' ? 100 : 0),
            grade: data.grade,
            feedback: data.feedback,
            isDemo: false
          });
        });
        return {
          assignments: prodItems,
          source: 'production',
          isDemoMode: false
        };
      } else {
        // Authentic student has 0 assignments in Firestore -> Clean Empty State!
        return {
          assignments: [],
          source: 'empty',
          isDemoMode: false
        };
      }
    } catch (err: any) {
      handleFirestoreWriteError(err, 'fetch unified assignments');
      console.warn('Firestore assignments fetch error:', err);
      return {
        assignments: [],
        source: 'empty',
        isDemoMode: false,
        error: err?.message || 'Error fetching assignments'
      };
    }
  }

  // Demonstration Mode: load local edits if user modified demo items, else default demo list
  if (typeof window !== 'undefined') {
    try {
      const cached = localStorage.getItem('voyager_demo_assignments_state');
      if (cached) {
        const parsed = JSON.parse(cached);
        if (Array.isArray(parsed) && parsed.length > 0) {
          if (parsed.length < 4) {
            const existingIds = new Set(parsed.map((a: any) => a.id));
            const existingLessonIds = new Set(parsed.map((a: any) => a.lessonId).filter(Boolean));
            const extraDemo = DEMO_ASSIGNMENTS.filter(
              d => !existingIds.has(d.id) && (!d.lessonId || !existingLessonIds.has(d.lessonId))
            );
            const fourthLesson = extraDemo.find(d => d.lessonId === 'cat-airport-tsa') || extraDemo[0];
            if (fourthLesson) {
              const supplemented = [...parsed, fourthLesson];
              localStorage.setItem('voyager_demo_assignments_state', JSON.stringify(supplemented));
              return {
                assignments: supplemented,
                source: 'demo',
                isDemoMode: true
              };
            }
          }
          return {
            assignments: parsed,
            source: 'demo',
            isDemoMode: true
          };
        }
      }
    } catch (e) {}
  }

  return {
    assignments: DEMO_ASSIGNMENTS,
    source: 'demo',
    isDemoMode: true
  };
}

export async function updateUnifiedAssignmentStatus(
  assignment: UnifiedAssignment,
  newStatus: UnifiedAssignment['status'],
  progressPercentage?: number,
  feedback?: string
): Promise<boolean> {
  const updatedPct = typeof progressPercentage === 'number'
    ? progressPercentage
    : (newStatus === 'COMPLETED' ? 100 : newStatus === 'IN_PROGRESS' ? 50 : 0);

  // 1. Always update local storage state for instant UI reactivity and persistence across reloads
  if (typeof window !== 'undefined') {
    try {
      const cached = localStorage.getItem('voyager_demo_assignments_state');
      const currentList: UnifiedAssignment[] = cached ? JSON.parse(cached) : [...DEMO_ASSIGNMENTS];
      const updated = currentList.map(a => {
        if (a.id === assignment.id || (a.lessonId && a.lessonId === assignment.lessonId)) {
          return {
            ...a,
            status: newStatus,
            progressPercentage: updatedPct,
            feedback: feedback || a.feedback,
            completedAt: newStatus === 'COMPLETED' ? new Date().toISOString() : a.completedAt
          };
        }
        return a;
      });
      localStorage.setItem('voyager_demo_assignments_state', JSON.stringify(updated));
    } catch (e) {
      console.error('Failed to update local assignment state:', e);
    }
  }

  // 2. Also update Firestore if available
  if (db && !isFirestoreQuotaExceeded() && assignment.id && !assignment.id.startsWith('demo-')) {
    try {
      const docRef = doc(db, 'homework', assignment.id);
      await updateDoc(docRef, {
        status: newStatus,
        progressPercentage: updatedPct,
        ...(feedback ? { feedback } : {}),
        ...(newStatus === 'COMPLETED' ? { completedAt: serverTimestamp() } : {}),
        updatedAt: serverTimestamp()
      });
    } catch (err) {
      handleFirestoreWriteError(err, 'update assignment status');
    }
  }

  // 3. Dispatch global event so student and teacher views update immediately
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new Event('voyager_assignments_updated'));
  }

  return true;
}
