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
  return [
    {
      id: 'HW-101',
      studentId,
      title: 'USCIS Civics Session Practice',
      description: 'Practice 10 key questions regarding the US Constitution and Legislative Branch.',
      status: 'SUBMITTED',
      dueDate: 'Tomorrow',
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
    studentId: item.studentId || '',
    title: item.title || 'Practice Task',
    description: item.description || '',
    dueDate: item.dueDate || '',
    teacherName: item.teacherName || 'Voyager Tutor',
    ...item,
    id: `HW-${Date.now()}`,
    createdAt: new Date().toLocaleDateString(),
    status: item.status || 'PENDING'
  };
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
