export interface CivicsExamRecord {
  timestamp: number;
  format: '10_standard' | '20_extended' | '65_20';
  correctCount: number;
  totalQuestions: number;
  passed: boolean;
}

export interface CivicsExamStats {
  testsTaken: number;
  testsPassed: number;
  testsFailed: number;
  records: CivicsExamRecord[];
}

export class CivicsExamTracker {
  private static STORAGE_KEY = 'voyager_civics_stats';

  public static getStats(): CivicsExamStats {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        const saved = localStorage.getItem(this.STORAGE_KEY);
        if (saved) {
          const parsed = JSON.parse(saved);
          return {
            testsTaken: Number(parsed.testsTaken) || 0,
            testsPassed: Number(parsed.testsPassed) || 0,
            testsFailed: Number(parsed.testsFailed) || 0,
            records: Array.isArray(parsed.records) ? parsed.records.slice(-30) : []
          };
        }
      }
    } catch (e) {
      console.warn('Error reading civics exam stats:', e);
    }
    return { testsTaken: 0, testsPassed: 0, testsFailed: 0, records: [] };
  }

  public static recordExam(
    format: '10_standard' | '20_extended' | '65_20',
    correctCount: number,
    totalQuestions: number
  ): CivicsExamStats {
    const stats = this.getStats();
    const passThreshold = format === '20_extended' ? 12 : 6;
    const passed = correctCount >= passThreshold;

    const newRecord: CivicsExamRecord = {
      timestamp: Date.now(),
      format,
      correctCount,
      totalQuestions,
      passed
    };

    const updatedStats: CivicsExamStats = {
      testsTaken: stats.testsTaken + 1,
      testsPassed: stats.testsPassed + (passed ? 1 : 0),
      testsFailed: stats.testsFailed + (passed ? 0 : 1),
      records: [...stats.records, newRecord].slice(-30)
    };

    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        localStorage.setItem(this.STORAGE_KEY, JSON.stringify(updatedStats));
      }
    } catch (e) {
      console.warn('Failed to save civics exam stats:', e);
    }

    return updatedStats;
  }

  public static getExerciseProgressSummary(lang: 'EN' | 'ES' = 'EN') {
    const stats = this.getStats();
    const { testsTaken, testsPassed, testsFailed } = stats;
    
    // 6 mockup tests complete a full exercise (128-question bank coverage)
    const TOTAL_EXERCISE_TESTS = 6;
    let testsRemaining = 0;

    if (testsTaken < TOTAL_EXERCISE_TESTS) {
      testsRemaining = TOTAL_EXERCISE_TESTS - testsTaken;
    } else {
      const remainder = testsTaken % TOTAL_EXERCISE_TESTS;
      testsRemaining = remainder === 0 ? 0 : TOTAL_EXERCISE_TESTS - remainder;
    }

    const exerciseCompleted = testsTaken >= TOTAL_EXERCISE_TESTS;

    let summaryText = '';
    if (lang === 'ES') {
      if (exerciseCompleted && testsRemaining === 0) {
        summaryText = `¡Has completado el ejercicio completo de 6 exámenes! Has tomado ${testsTaken} examen(es) simulado(s) (${testsPassed} aprobado(s), ${testsFailed} reprobado(s)).`;
      } else {
        summaryText = `Resumen de tu avance: Has tomado ${testsTaken} examen(es) simulado(s) (${testsPassed} aprobado(s), ${testsFailed} reprobado(s)). Te quedan ${testsRemaining} examen(es) simulado(s) para completar el ejercicio de 6 exámenes.`;
      }
    } else {
      if (exerciseCompleted && testsRemaining === 0) {
        summaryText = `You have completed the full 6-exam exercise! You have taken ${testsTaken} mockup exam(s) so far (${testsPassed} passed, ${testsFailed} failed).`;
      } else {
        summaryText = `Your Civics Exam Progress Summary: You have taken ${testsTaken} mockup exam(s) so far (${testsPassed} passed, ${testsFailed} failed). You have ${testsRemaining} mockup test(s) remaining to complete the full 6-exam exercise.`;
      }
    }

    return {
      testsTaken,
      testsPassed,
      testsFailed,
      testsRemaining,
      exerciseCompleted,
      summaryText
    };
  }
}
