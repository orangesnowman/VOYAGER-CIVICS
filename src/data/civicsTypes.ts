export type CivicsCategory = 
  | 'AMERICAN_GOVERNMENT'
  | 'AMERICAN_HISTORY'
  | 'INTEGRATED_CIVICS';

export type CivicsSubcategory =
  | 'Principles of American Government'
  | 'System of Government'
  | 'Rights and Responsibilities'
  | 'Colonial Period and Independence'
  | '1800s'
  | 'Recent American History and Other Important Historical Information'
  | 'Symbols'
  | 'Holidays';

export interface CivicsQuestion {
  id: number; // 1 - 128
  category: CivicsCategory;
  subcategory: CivicsSubcategory;
  categoryEn: string;
  categoryEs: string;
  subcategoryEn: string;
  subcategoryEs: string;
  questionEn: string;
  questionEs: string;
  answersEn: string[];
  answersEs: string[];
  isExemption65_20?: boolean; // Questions marked with an asterisk * for 65/20 applicants
  uscisCitation: string;
  notesEn?: string;
  notesEs?: string;
}

export interface CivicsExamSession {
  totalQuestions: number; // 20 questions in 2020 civics test
  passingScore: number; // 12 of 20 to pass
  questions: CivicsQuestion[];
  userAnswers: Record<number, { selectedAnswer: string; isCorrect: boolean }>;
  completed: boolean;
  score: number;
}
