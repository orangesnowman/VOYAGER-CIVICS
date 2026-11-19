import React, { useState, useEffect } from 'react';
import { 
  CertificateRecord, 
  fetchActiveCertificate, 
  fetchCertificateHistory, 
  CefrLevel 
} from '../services/certificateService';
import { sanitizeUserProfileNames } from './RoadmapPanel';

interface StudentCertificatePreviewProps {
  user: any;
  selectedLang: 'EN' | 'ES';
  onAskVoyager?: (prompt: string) => void;
  isDarkMode?: boolean;
}

type TabCefrLevel = 'A2' | 'B1' | 'B2' | 'C1';

interface LevelCertificateConfig {
  level: TabCefrLevel;
  bgImage: string;
  hasBakedLogo: boolean;
  hasBakedSeal: boolean;
  hasBakedSignatureLine: boolean;
  landmarkLabel: { en: string; es: string };
  defaultTransition: string;
  defaultDescription: { en: string; es: string };
}

const LEVEL_CERT_CONFIGS: Record<TabCefrLevel, LevelCertificateConfig> = {
  A2: {
    level: 'A2',
    bgImage: '/assets/aistudio/cert_base_a2.jpg',
    hasBakedLogo: false,
    hasBakedSeal: false,
    hasBakedSignatureLine: false,
    landmarkLabel: {
      en: 'Historic Philadelphia: Independence Hall & Liberty Bell',
      es: 'Filadelfia Histórica: Independence Hall y Campana de la Libertad'
    },
    defaultTransition: 'A1 → A2',
    defaultDescription: {
      en: 'Has demonstrated foundational English language\ncommunication and everyday routine proficiency.',
      es: 'Ha demostrado suficiencia en comunicación elemental\ndel idioma inglés y situaciones de la vida cotidiana.'
    }
  },
  B1: {
    level: 'B1',
    bgImage: '/assets/aistudio/cert_base_b1.jpg',
    hasBakedLogo: true,
    hasBakedSeal: true,
    hasBakedSignatureLine: true,
    landmarkLabel: {
      en: 'American Coast & Heritage: Golden Gate Bridge & Lincoln Memorial',
      es: 'Costa y Patrimonio Estadounidense: Golden Gate y Monumento a Lincoln'
    },
    defaultTransition: 'A2 → B1',
    defaultDescription: {
      en: 'Has demonstrated independent English conversational\nfluency, travel readiness, and connected discourse.',
      es: 'Ha demostrado fluidez conversacional independiente en inglés,\npreparación para viajes y expresión conectada.'
    }
  },
  B2: {
    level: 'B2',
    bgImage: '/assets/aistudio/cert_base_b2.jpg',
    hasBakedLogo: true,
    hasBakedSeal: true,
    hasBakedSignatureLine: true,
    landmarkLabel: {
      en: 'National Monumental Honors: Mount Rushmore & Washington Monument',
      es: 'Honores Monumentales: Monte Rushmore y Monumento a Washington'
    },
    defaultTransition: 'B1 → B2',
    defaultDescription: {
      en: 'Has demonstrated high spontaneous fluency,\ntechnical comprehension, and professional discourse.',
      es: 'Ha demostrado alta fluidez espontánea,\ncomprensión técnica y expresión profesional en inglés.'
    }
  },
  C1: {
    level: 'C1',
    bgImage: '/assets/aistudio/voyager_cert_clean_base.png',
    hasBakedLogo: true,
    hasBakedSeal: true,
    hasBakedSignatureLine: true,
    landmarkLabel: {
      en: 'American Democracy & Freedom: Statue of Liberty & U.S. Capitol',
      es: 'Democracia y Libertad: Estatua de la Libertad y Capitolio de EE.UU.'
    },
    defaultTransition: 'B2 → C1',
    defaultDescription: {
      en: 'Has demonstrated a high level of\nEnglish language proficiency.',
      es: 'Ha demostrado un alto nivel de suficiencia\ny dominio del idioma inglés.'
    }
  }
};

const CEFR_LEVEL_SUMMARIES: Record<TabCefrLevel, { en: string; es: string }> = {
  A2: {
    en: 'A2 (Elementary): Can communicate in simple and routine tasks, understand common everyday expressions, and describe immediate needs.',
    es: 'A2 (Elemental): Capaz de comunicarse en tareas simples y cotidianas, comprender expresiones comunes y describir necesidades inmediatas.'
  },
  B1: {
    en: 'B1 (Intermediate): Can understand main points on familiar topics, navigate travel situations, and express opinions and experiences.',
    es: 'B1 (Intermedio): Capaz de comprender temas familiares, desenvolverse al viajar y expresar opiniones, planes y experiencias.'
  },
  B2: {
    en: 'B2 (Upper-Intermediate): Can interact with spontaneous fluency with native speakers, understand complex discussions, and communicate clearly.',
    es: 'B2 (Intermedio Alto): Capaz de interactuar con fluidez espontánea con hablantes nativos, comprender debates complejos y comunicarse con claridad.'
  },
  C1: {
    en: 'C1 (Advanced): Can express ideas fluently and spontaneously, understand demanding texts, and use English flexibly for academic and professional goals.',
    es: 'C1 (Avanzado): Capaz de expresarse con fluidez y espontaneidad, comprender textos exigentes y utilizar el inglés con flexibilidad profesional.'
  }
};

export const StudentCertificatePreview: React.FC<StudentCertificatePreviewProps> = ({
  user,
  selectedLang,
}) => {
  const [cert, setCert] = useState<CertificateRecord | null>(null);
  const [historyList, setHistoryList] = useState<CertificateRecord[]>([]);
  const [selectedLevel, setSelectedLevel] = useState<TabCefrLevel>('C1');

  // Compute student name dynamically
  const nameInfo = sanitizeUserProfileNames(user || {});
  const studentFullName = nameInfo.fullName || user?.name || 'Federico Sandoval';
  const studentId = user?.studentId || user?.uid || 'STU-001';
  const userPlan: 'FREE' | 'PRO' = (user?.plan || 'PRO').toUpperCase() === 'FREE' ? 'FREE' : 'PRO';

  const loadCertificateData = async () => {
    const active = await fetchActiveCertificate(studentId, studentFullName, user?.email || '', userPlan);
    setCert(active);
    const history = await fetchCertificateHistory(studentId);
    setHistoryList(history);
  };

  useEffect(() => {
    loadCertificateData();

    const handleUpdate = () => {
      loadCertificateData();
    };
    window.addEventListener('voyager_certificate_updated', handleUpdate);
    return () => window.removeEventListener('voyager_certificate_updated', handleUpdate);
  }, [studentId, studentFullName, userPlan]);

  const activeCert = cert || {
    id: 'cert-stu001-c1',
    studentId,
    studentName: studentFullName,
    studentEmail: user?.email || 'theorangesnowman@gmail.com',
    currentLevel: 'B2' as CefrLevel,
    targetLevel: 'C1' as CefrLevel,
    status: 'IN_PROGRESS' as const,
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
    plan: userPlan
  };

  // Combine active and historical certificates
  const allCertificates: CertificateRecord[] = [
    activeCert,
    ...historyList.filter(h => h.id !== activeCert.id)
  ];

  // Resolve certificate for the selected CEFR level
  const getCertificateForLevel = (level: TabCefrLevel): CertificateRecord => {
    const existing = allCertificates.find(c => c.targetLevel === level);
    if (existing) return existing;

    if (level === 'C1') {
      return activeCert;
    }

    if (level === 'B2') {
      return {
        id: 'cert-stu001-b2',
        studentId,
        studentName: studentFullName,
        studentEmail: user?.email || 'theorangesnowman@gmail.com',
        currentLevel: 'B1' as CefrLevel,
        targetLevel: 'B2' as CefrLevel,
        status: 'GOAL_ACHIEVED' as const,
        readinessPercentage: 100,
        competencyScores: {
          pronunciation: 92,
          speakingFluency: 90,
          vocabulary: 92,
          grammarAccuracy: 90,
          listeningComprehension: 94
        },
        teacherApproval: {
          approved: true,
          teacherId: 'tch-001',
          teacherName: 'Alejandra Francois',
          approvedAt: '2026-09-30'
        },
        achievementDate: 'September 30, 2026',
        createdAt: '2026-07-01',
        updatedAt: '2026-09-30',
        certificateNumber: 'VOY-2026-B2-06781',
        isHistorical: true,
        plan: userPlan
      };
    }

    if (level === 'B1') {
      return {
        id: 'cert-stu001-b1',
        studentId,
        studentName: studentFullName,
        studentEmail: user?.email || 'theorangesnowman@gmail.com',
        currentLevel: 'A2' as CefrLevel,
        targetLevel: 'B1' as CefrLevel,
        status: 'GOAL_ACHIEVED' as const,
        readinessPercentage: 100,
        competencyScores: {
          pronunciation: 90,
          speakingFluency: 88,
          vocabulary: 88,
          grammarAccuracy: 92,
          listeningComprehension: 90
        },
        teacherApproval: {
          approved: true,
          teacherId: 'tch-001',
          teacherName: 'Alejandra Francois',
          approvedAt: '2026-06-20'
        },
        achievementDate: 'June 20, 2026',
        createdAt: '2026-04-01',
        updatedAt: '2026-06-20',
        certificateNumber: 'VOY-2026-B1-04532',
        isHistorical: true,
        plan: userPlan
      };
    }

    // Level A2
    return {
      id: 'cert-stu001-a2',
      studentId,
      studentName: studentFullName,
      studentEmail: user?.email || 'theorangesnowman@gmail.com',
      currentLevel: 'A1' as CefrLevel,
      targetLevel: 'A2' as CefrLevel,
      status: 'GOAL_ACHIEVED' as const,
      readinessPercentage: 100,
      competencyScores: {
        pronunciation: 94,
        speakingFluency: 92,
        vocabulary: 90,
        grammarAccuracy: 92,
        listeningComprehension: 96
      },
      teacherApproval: {
        approved: true,
        teacherId: 'tch-001',
        teacherName: 'Alejandra Francois',
        approvedAt: '2026-03-15'
      },
      achievementDate: 'March 15, 2026',
      createdAt: '2026-01-10',
      updatedAt: '2026-03-15',
      certificateNumber: 'VOY-2026-A2-02114',
      isHistorical: true,
      plan: userPlan
    };
  };

  const currentConfig = LEVEL_CERT_CONFIGS[selectedLevel];
  const currentDisplayCert = getCertificateForLevel(selectedLevel);

  // Render the Dynamic Certificate Canvas for each CEFR Level
  const renderDynamicCertificate = (data: CertificateRecord, config: LevelCertificateConfig) => {
    const rawPct = Math.max(0, Math.min(100, Math.round(data.readinessPercentage || 0)));
    const isTeacherApproved = Boolean(data.teacherApproval?.approved);
    const isCompletedAndApproved = data.status === 'GOAL_ACHIEVED' && isTeacherApproved;
    const isPendingTeacherApproval = !isCompletedAndApproved && (data.status === 'GOAL_ACHIEVED' || rawPct >= 100);
    const isInProgress = !isCompletedAndApproved && !isPendingTeacherApproval && rawPct > 0;
    const isNotStarted = !isCompletedAndApproved && !isPendingTeacherApproval && rawPct <= 0;
    const rawTeacherName = (data.teacherApproval?.teacherName || 'Alejandra Francois').replace(/\s*\(.*?\)\s*/g, '').trim() || 'Alejandra Francois';

    return (
      <div 
        className="relative w-full aspect-[1427/1102] overflow-hidden select-none"
        style={{
          backgroundImage: `url('${config.bgImage}')`,
          backgroundSize: '100% 100%',
          backgroundPosition: 'center',
          backgroundRepeat: 'no-repeat',
          containerType: 'inline-size'
        }}
      >
        {/* Print Stylesheet Hook */}
        <style>{`
          @media print {
            body * { visibility: hidden !important; }
            .voyager-certificate-printable, .voyager-certificate-printable * { visibility: visible !important; }
            .voyager-certificate-printable {
              position: fixed !important;
              left: 0 !important;
              top: 0 !important;
              width: 100vw !important;
              height: 100vh !important;
              margin: 0 !important;
              padding: 0 !important;
              background-size: contain !important;
              background-repeat: no-repeat !important;
              background-position: center !important;
            }
          }
        `}</style>

        {/* Parchment Warmth Enhancement */}
        <div 
          className="absolute inset-0 pointer-events-none z-0" 
          style={{ 
            background: 'radial-gradient(circle at 50% 48%, rgba(254, 243, 199, 0.22) 0%, rgba(253, 242, 208, 0.10) 60%, transparent 100%)' 
          }} 
        />

        {/* ─── DYNAMIC ELEMENTS ON THE APPROVED VOYAGER TEMPLATE ─── */}

        {/* 0. USA Voyager Branding (rendered only if not baked into the background) */}
        {!config.hasBakedLogo && (
          <div 
            className="absolute left-1/2 pointer-events-none select-none z-10"
            style={{
              top: '2.2%',
              transform: 'translateX(-50%)',
              transformOrigin: 'top center',
              width: '25%'
            }}
          >
            <img 
              src="/assets/aistudio/cert_logo_crop.png" 
              alt="USA Voyager" 
              className="w-full h-auto object-contain block drop-shadow-xs"
            />
          </div>
        )}

        {/* 1. Three-Line Certificate Title + Centered Decorative Horizontal Line */}
        <div 
          className="absolute w-full text-center font-serif text-[#0C1753] select-none z-10 px-6 flex flex-col items-center"
          style={{
            top: '27.5%',
            left: '0',
            fontFamily: "'Playfair Display', 'Georgia', 'Merriweather', 'Times New Roman', serif"
          }}
        >
          <div
            style={{
              fontWeight: 600,
              fontSize: 'clamp(19px, 3.55cqw, 43px)',
              letterSpacing: '0.03em',
              lineHeight: 1.18
            }}
          >
            <div>{selectedLang === 'EN' ? 'Certificate of' : 'Certificado de'}</div>
            <div>{selectedLang === 'EN' ? 'English Proficiency' : 'Suficiencia en Inglés'}</div>
          </div>

          <div
            style={{
              fontWeight: 700,
              fontSize: 'clamp(23px, 4.2cqw, 52px)',
              letterSpacing: '0.04em',
              lineHeight: 1.08,
              marginTop: 'clamp(2px, 0.45cqw, 6px)'
            }}
          >
            {config.level}
          </div>
        </div>

        {/* 2. Center Body: Conditional Progress Bar (only when incomplete & started) + Proficiency Statement */}
        <div
          className="absolute w-full px-6 select-none z-10 flex flex-col items-center justify-center text-center"
          style={{
            top: isInProgress ? '51.0%' : '53.5%',
            left: '0'
          }}
        >
          {/* Progress Indicator: Only shown when actively in progress (never 100% on completed certs, never misleading 0%) */}
          {isInProgress && (
            <div 
              className="rounded-full overflow-hidden bg-[#00E5FF] flex items-center mx-auto mb-[1.6cqw]"
              style={{
                width: '44.0%',
                height: 'clamp(18px, 2.55cqw, 30px)'
              }}
            >
              <div 
                className="h-full bg-[#0066EE] rounded-l-full rounded-r-none flex items-center justify-center transition-all duration-700 ease-out"
                style={{ width: `${Math.max(12, Math.min(99, rawPct))}%` }}
              >
                <span 
                  className="text-white font-sans font-bold select-none whitespace-nowrap px-1.5"
                  style={{ fontSize: 'clamp(10px, 1.45cqw, 16px)' }}
                >
                  {rawPct}%
                </span>
              </div>
            </div>
          )}

          {/* Pending Teacher Approval or Not Started subtle non-issued state */}
          {isPendingTeacherApproval && (
            <div
              className="font-sans font-semibold tracking-[0.06em] uppercase text-[#0C1753]/85 mb-[1.2cqw]"
              style={{ fontSize: 'clamp(8px, 1.1cqw, 13px)' }}
            >
              {selectedLang === 'EN' ? 'Pending Teacher Approval' : 'Pendiente de Aprobación Docente'}
            </div>
          )}

          {isNotStarted && (
            <div
              className="font-sans font-semibold tracking-[0.06em] uppercase text-[#0C1753]/75 mb-[1.2cqw]"
              style={{ fontSize: 'clamp(8px, 1.1cqw, 13px)' }}
            >
              {selectedLang === 'EN' ? 'Not Started' : 'Sin Iniciar'}
            </div>
          )}

          {/* Proficiency Transition & Description */}
          <div 
            className="w-full text-center font-serif text-[#0C1753]"
            style={{
              fontSize: 'clamp(9px, 1.35cqw, 15.5px)',
              lineHeight: 1.38,
              fontFamily: "'Playfair Display', 'Georgia', 'Merriweather', 'Times New Roman', serif"
            }}
          >
            <div className="font-semibold tracking-[0.035em] text-[#0C1753]">
              {config.defaultTransition}
            </div>
            <div
              className="font-normal mt-0.5 tracking-[0.015em] text-[#0C1753] mx-auto whitespace-pre-line"
              style={{ maxWidth: '64%' }}
            >
              {config.defaultDescription[selectedLang === 'EN' ? 'en' : 'es']}
            </div>
            {isCompletedAndApproved && data.achievementDate && (
              <div
                className="font-sans font-medium text-[#0C1753]/80 mt-[0.9cqw]"
                style={{ fontSize: 'clamp(7.5px, 1.0cqw, 12px)' }}
              >
                {selectedLang === 'EN' ? `Approved: ${data.achievementDate}` : `Aprobado: ${data.achievementDate}`}
              </div>
            )}
          </div>
        </div>

        {/* Central Gold Medal Overlay for templates without baked seal (e.g. A2) */}
        {!config.hasBakedSeal && (
          <div 
            className="absolute left-1/2 -translate-x-1/2 pointer-events-none select-none z-10"
            style={{
              top: '75.5%',
              width: 'clamp(54px, 8.5cqw, 105px)',
              height: 'clamp(54px, 8.5cqw, 105px)'
            }}
          >
            <svg viewBox="0 0 100 100" className="w-full h-full drop-shadow-md">
              <circle cx="50" cy="50" r="48" fill="#FBBF24" stroke="#D97706" strokeWidth="2" />
              <circle cx="50" cy="50" r="44" fill="#F59E0B" />
              <circle cx="50" cy="50" r="41" fill="none" stroke="#FEF3C7" strokeWidth="1.5" strokeDasharray="3 2" />
              <circle cx="50" cy="50" r="37" fill="#FBBF24" stroke="#B45309" strokeWidth="1" />
              <polygon points="50,18 53,42 66,24 57,45 80,36 60,50 80,64 57,55 66,76 53,58 50,82 47,58 34,76 43,55 20,64 40,50 20,36 43,45 34,24 47,42" fill="#D97706" />
              <polygon points="50,22 52,44 64,28 55,46 76,38 58,50 76,62 55,54 64,72 52,56 50,78 48,56 36,72 45,54 24,62 42,50 24,38 45,46 36,28 48,44" fill="#FEF3C7" />
              <circle cx="50" cy="50" r="7" fill="#78350F" />
              <circle cx="50" cy="50" r="4" fill="#FDE68A" />
            </svg>
          </div>
        )}

        {/* 4. Student Signature — Lower Left */}
        <div 
          className="absolute flex items-end justify-center pointer-events-none z-10"
          style={{
            top: '78.5%',
            left: '6.0%',
            width: '31.0%',
            height: '10.0%'
          }}
        >
          <span 
            className="text-[#0C1753] select-none whitespace-nowrap"
            style={{ 
              fontFamily: "'Sacramento', cursive",
              fontSize: 'clamp(28px, 4.6cqw, 56px)',
              lineHeight: 1,
              marginBottom: '-4px',
              whiteSpace: 'nowrap'
            }}
          >
            {studentFullName}
          </span>
        </div>

        {/* Lower Left Delicate Signature Line */}
        <div 
          className="absolute z-10"
          style={{
            top: '88.6%',
            left: '8.0%',
            width: '27.0%',
            borderTop: '1px solid #0C1753'
          }}
        />

        {/* Lower Left Label & Student ID */}
        <div 
          className="absolute text-center font-sans tracking-[0.14em] text-[#0C1753] font-semibold truncate px-1 z-10"
          style={{
            top: '89.6%',
            left: '8.0%',
            width: '27.0%',
            fontSize: 'clamp(6px, 0.85cqw, 10px)',
            lineHeight: 1
          }}
        >
          {selectedLang === 'EN' ? 'STUDENT' : 'ESTUDIANTE'} | ID: {studentId}
        </div>

        {/* 5. Instructor Signature — Lower Right (Only signed when completed & teacher approved; no opaque background patch) */}
        {isCompletedAndApproved && (
          <div 
            className="absolute flex items-end justify-center pointer-events-none z-10"
            style={{
              top: '78.5%',
              left: '65.0%',
              width: '27.0%',
              height: '10.0%'
            }}
          >
            <span 
              className="text-[#0C1753] select-none whitespace-nowrap"
              style={{ 
                fontFamily: "'Sacramento', cursive",
                fontSize: 'clamp(28px, 4.6cqw, 56px)',
                lineHeight: 1,
                marginBottom: '-4px',
                whiteSpace: 'nowrap'
              }}
            >
              {rawTeacherName}
            </span>
          </div>
        )}

        {/* Lower Right Delicate 1px Signature Line (Rendered when template lacks baked line) */}
        {!config.hasBakedSignatureLine && (
          <div 
            className="absolute z-10"
            style={{
              top: '88.6%',
              left: '65.0%',
              width: '27.0%',
              borderTop: '1px solid #0C1753'
            }}
          />
        )}

        {/* Instructor Designation (Transparent background, matching student signature line gap) */}
        <div 
          className="absolute text-center px-1 z-10"
          style={{
            top: config.hasBakedSignatureLine ? '90.2%' : '89.6%',
            left: '65.0%',
            width: '27.0%'
          }}
        >
          <div 
            className="font-sans tracking-[0.14em] text-[#0C1753] font-semibold uppercase truncate"
            style={{
              fontSize: 'clamp(5.5px, 0.78cqw, 9px)',
              lineHeight: 1
            }}
          >
            {isCompletedAndApproved
              ? rawTeacherName.toUpperCase()
              : (selectedLang === 'EN' ? 'USA VOYAGER INSTRUCTOR' : 'DOCENTE USA VOYAGER')}
          </div>
          {!config.hasBakedSignatureLine && (
            <div
              className="font-sans tracking-[0.18em] text-[#0C1753] font-semibold uppercase truncate mt-1"
              style={{
                fontSize: 'clamp(5.5px, 0.78cqw, 9px)',
                lineHeight: 1.15
              }}
            >
              USA VOYAGER
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="w-full flex flex-col">
      <div className="w-full min-w-0">
        {/* VINTAGE INDEX-CARD TABS FOR CEFR LEVELS (A2, B1, B2, C1) */}
        <div className="w-full flex items-end relative pt-2 px-[14px] sm:px-[15px] z-10 overflow-hidden sm:overflow-visible max-w-full">
          <div className="flex items-end gap-1.5 sm:gap-2 relative max-w-full">
            {(['A2', 'B1', 'B2', 'C1'] as const).map((level, idx) => {
              const isActive = selectedLevel === level;
              return (
                <button
                  key={level}
                  type="button"
                  onClick={() => setSelectedLevel(level)}
                  className={`group relative h-[42px] sm:h-[48px] px-3.5 sm:px-5 min-w-0 flex-initial flex flex-col items-center pt-2 sm:pt-2.5 pb-1 sm:pb-1.5 justify-center cursor-pointer transition-colors ${
                    isActive
                      ? 'bg-[#F8ECC0] text-[#F8ECC0] z-30 rounded-t-[14px] sm:rounded-t-[18px] -mb-[2px] after:content-[\'\'] after:absolute after:-bottom-[3px] after:left-0 after:right-0 after:h-[5px] after:bg-[#F8ECC0] after:z-30'
                      : 'bg-[#EADBB3] hover:bg-[#E0CF9E] text-[#EADBB3] hover:text-[#E0CF9E] rounded-t-[14px] sm:rounded-t-[18px] z-10'
                  }`}
                >
                  {/* Left Concave Flare / Inverted Fillet */}
                  {idx > 0 && (
                    <svg
                      className="absolute -left-[14px] sm:-left-[15px] bottom-0 w-[14px] sm:w-[15px] h-[14px] sm:h-[15px] pointer-events-none overflow-visible transition-colors"
                      viewBox="0 0 16 16"
                      fill="currentColor"
                    >
                      <path d="M 16 0 L 16 16.5 L 0 16.5 Q 16 16.5 16 0 Z" />
                    </svg>
                  )}

                  {/* Right Concave Flare / Inverted Fillet */}
                  <svg
                    className="absolute -right-[14px] sm:-right-[15px] bottom-0 w-[14px] sm:w-[15px] h-[14px] sm:h-[15px] pointer-events-none overflow-visible transition-colors"
                    viewBox="0 0 16 16"
                    fill="currentColor"
                  >
                    <path d="M 0 0 L 0 16.5 L 16 16.5 Q 0 16.5 0 0 Z" />
                  </svg>

                  {/* Tab Label */}
                  <div className="inline-flex items-center justify-center px-1 leading-tight">
                    <span className={`text-[13px] sm:text-[14.5px] font-bold leading-none text-center ${
                      isActive ? 'text-[#1F1A14]' : 'text-[#221D17] group-hover:text-black'
                    }`}>
                      {level}
                    </span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* IndexCard Body (Single container keeping tabs, explanation, and certificate together) */}
        <div className="w-full bg-[#F8ECC0] rounded-b-[24px] sm:rounded-b-[28px] rounded-t-[14px] sm:rounded-t-[18px] p-3.5 sm:p-5 md:p-6 shadow-xs relative z-0 text-neutral-900 flex flex-col items-center">
          {/* CEFR Level Summary Line directly below tabs and above certificate */}
          <div className="w-full mb-2.5 px-0.5 text-left">
            <p className="text-[10pt] font-normal not-italic text-neutral-700 font-sans leading-relaxed text-left">
              {CEFR_LEVEL_SUMMARIES[selectedLevel][selectedLang === 'EN' ? 'en' : 'es']}
            </p>
          </div>

          {/* Approved Certificate Artwork (No newly introduced rigid outer frame, no pop-ups, no black PDF button) */}
          <div className="relative w-full overflow-hidden select-none voyager-certificate-printable">
            {renderDynamicCertificate(currentDisplayCert, currentConfig)}
          </div>
        </div>
      </div>
    </div>
  );
};

