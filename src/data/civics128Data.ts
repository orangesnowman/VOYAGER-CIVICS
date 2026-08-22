import { CivicsQuestion, CivicsCategory } from './civicsTypes';
import { CIVICS_GOVERNMENT_QUESTIONS } from './civicsGovernment';
import { CIVICS_HISTORY_QUESTIONS } from './civicsHistory';
import { CIVICS_INTEGRATED_QUESTIONS } from './civicsIntegrated';

export * from './civicsTypes';

export const ALL_CIVICS_128_QUESTIONS: CivicsQuestion[] = [
  ...CIVICS_GOVERNMENT_QUESTIONS,
  ...CIVICS_HISTORY_QUESTIONS,
  ...CIVICS_INTEGRATED_QUESTIONS
];

// Verify we have all 128 questions indexed 1-128
export const TOTAL_QUESTIONS_COUNT = ALL_CIVICS_128_QUESTIONS.length;

export function getQuestionById(id: number): CivicsQuestion | undefined {
  return ALL_CIVICS_128_QUESTIONS.find(q => q.id === id);
}

export function getQuestionsByCategory(category: CivicsCategory): CivicsQuestion[] {
  return ALL_CIVICS_128_QUESTIONS.filter(q => q.category === category);
}

export function get65_20ExemptionQuestions(): CivicsQuestion[] {
  return ALL_CIVICS_128_QUESTIONS.filter(q => q.isExemption65_20);
}

export function searchQuestions(query: string, lang: 'EN' | 'ES' = 'EN'): CivicsQuestion[] {
  if (!query || query.trim() === '') return ALL_CIVICS_128_QUESTIONS;
  const q = query.toLowerCase().trim();
  
  // Check if query is a number
  const num = parseInt(q, 10);
  if (!isNaN(num) && num >= 1 && num <= 128) {
    const directMatch = getQuestionById(num);
    if (directMatch) return [directMatch];
  }

  return ALL_CIVICS_128_QUESTIONS.filter(item => {
    const matchId = item.id.toString() === q;
    const matchEnQ = item.questionEn.toLowerCase().includes(q);
    const matchEsQ = item.questionEs.toLowerCase().includes(q);
    const matchEnAns = item.answersEn.some(a => a.toLowerCase().includes(q));
    const matchEsAns = item.answersEs.some(a => a.toLowerCase().includes(q));
    const matchCitation = item.uscisCitation.toLowerCase().includes(q);
    const matchSubcategory = item.subcategoryEn.toLowerCase().includes(q) || item.subcategoryEs.toLowerCase().includes(q);
    
    return matchId || matchEnQ || matchEsQ || matchEnAns || matchEsAns || matchCitation || matchSubcategory;
  });
}

export function generate20QuestionExam(only65_20: boolean = false): CivicsQuestion[] {
  const pool = only65_20 ? get65_20ExemptionQuestions() : [...ALL_CIVICS_128_QUESTIONS];
  const shuffled = [...pool].sort(() => Math.random() - 0.5);
  const count = Math.min(20, shuffled.length);
  return shuffled.slice(0, count);
}
