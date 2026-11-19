import React, { useState, useEffect } from 'react';
import { 
  Award, 
  CheckCircle2, 
  ShieldCheck, 
  Clock, 
  FileCheck, 
  Sparkles, 
  AlertCircle, 
  RefreshCw,
  History,
  TrendingUp,
  Download
} from 'lucide-react';
import { 
  CertificateRecord, 
  fetchActiveCertificate, 
  fetchCertificateHistory, 
  approveStudentCertificate, 
  startNextLearningGoal, 
  evaluateReadiness, 
  CEFR_TITLES, 
  CEFR_PATH_TITLES,
  CefrLevel 
} from '../../services/certificateService';

interface StudentCertificationTabProps {
  selectedStudent: any;
  currentUser: any;
  selectedLang: 'EN' | 'ES';
}

export const StudentCertificationTab: React.FC<StudentCertificationTabProps> = ({
  selectedStudent,
  currentUser,
  selectedLang
}) => {
  const [cert, setCert] = useState<CertificateRecord | null>(null);
  const [historyList, setHistoryList] = useState<CertificateRecord[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [readingScore, setReadingScore] = useState<number>(88);
  const [writingScore, setWritingScore] = useState<number>(86);
  const [notes, setNotes] = useState<string>(
    selectedLang === 'EN'
      ? 'Demonstrated advanced conversational fluency, accurate pronunciation, and solid syntax mastery.'
      : 'Demostró fluidez conversacional avanzada, pronunciación precisa y sólida estructura sintáctica.'
  );
  const [isApproving, setIsApproving] = useState<boolean>(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const studentId = selectedStudent?.id || 'STU-001';
  const studentName = selectedStudent?.name || 'Federico Sandoval';
  const studentEmail = selectedStudent?.email || 'theorangesnowman@gmail.com';

  const loadData = async () => {
    setIsLoading(true);
    try {
      const active = await fetchActiveCertificate(studentId, studentName, studentEmail, 'PRO');
      setCert(active);
      const history = await fetchCertificateHistory(studentId);
      setHistoryList(history);
      if (active.teacherApproval?.readingScore) {
        setReadingScore(active.teacherApproval.readingScore);
      }
      if (active.teacherApproval?.writingScore) {
        setWritingScore(active.teacherApproval.writingScore);
      }
      if (active.teacherApproval?.evidenceNotes) {
        setNotes(active.teacherApproval.evidenceNotes);
      }
    } catch (e) {
      console.error('Error loading certificate data for teacher:', e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [studentId, studentName, studentEmail]);

  if (isLoading || !cert) {
    return (
      <div className="p-8 text-center text-xs text-neutral-400 flex items-center justify-center gap-2">
        <RefreshCw className="w-4 h-4 animate-spin" />
        <span>{selectedLang === 'EN' ? 'Loading certificate data...' : 'Cargando datos del certificado...'}</span>
      </div>
    );
  }

  const evaluation = evaluateReadiness({
    ...cert.competencyScores,
    readingComprehension: readingScore,
    writingAccuracy: writingScore
  });

  const isAchieved = cert.status === 'GOAL_ACHIEVED';

  const handleApprove = async () => {
    setIsApproving(true);
    try {
      const teacherInfo = {
        id: currentUser?.uid || 'TCH-001',
        name: currentUser?.displayName || 'Alejandra Francois (La Profe)'
      };
      const updated = await approveStudentCertificate(
        cert,
        teacherInfo,
        readingScore,
        writingScore,
        notes
      );
      setCert(updated);
      setSuccessMessage(
        selectedLang === 'EN'
          ? `Certificate for CEFR ${updated.targetLevel} approved and issued successfully!`
          : `¡Certificado para CEFR ${updated.targetLevel} aprobado y emitido con éxito!`
      );
      setTimeout(() => setSuccessMessage(null), 3500);
      loadData();
    } catch (e) {
      console.error('Approval error:', e);
    } finally {
      setIsApproving(false);
    }
  };

  const handleNextGoal = async () => {
    const nextLevel: CefrLevel = cert.targetLevel === 'C1' ? 'C2' : 'C1';
    await startNextLearningGoal(cert, nextLevel);
    loadData();
  };

  return (
    <div className="space-y-4 text-left">
      {successMessage && (
        <div className="p-3 bg-emerald-50 border border-emerald-300 text-emerald-900 rounded-xl text-xs font-bold flex items-center gap-2 animate-fade-in">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{successMessage}</span>
        </div>
      )}

      {/* Active Certificate Banner */}
      <div className="p-4 rounded-2xl border border-neutral-200 bg-neutral-50 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Award className="w-5 h-5 text-amber-500" />
            <h4 className="font-bold text-sm text-neutral-900">
              {selectedLang === 'EN' ? 'Active Certification Path' : 'Ruta Activa de Certificación'}: CEFR {cert.targetLevel}
            </h4>
            <span className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase ${
              isAchieved ? 'bg-emerald-600 text-white' : 'bg-amber-400 text-black'
            }`}>
              {isAchieved ? (selectedLang === 'EN' ? 'Goal Achieved' : 'Meta Alcanzada') : (selectedLang === 'EN' ? 'In Progress' : 'En Progreso')}
            </span>
          </div>
          <p className="text-xs text-neutral-600">
            {CEFR_TITLES[cert.targetLevel]?.en} · {selectedLang === 'EN' ? 'Current assessed level' : 'Nivel actual'}: <strong>{cert.currentLevel}</strong>
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="text-right">
            <span className="text-[10px] uppercase font-bold text-neutral-500 block">
              {selectedLang === 'EN' ? 'Readiness Score' : 'Preparación'}
            </span>
            <span className="text-xl font-black text-neutral-900">
              {isAchieved ? 100 : cert.readinessPercentage}%
            </span>
          </div>

          {isAchieved && (
            <button
              type="button"
              onClick={handleNextGoal}
              className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer shadow-xs"
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-300" />
              <span>{selectedLang === 'EN' ? 'Start Next Goal' : 'Iniciar Siguiente Meta'}</span>
            </button>
          )}
        </div>
      </div>

      {/* Competencies Breakdown Card */}
      <div className="p-4 rounded-2xl border border-neutral-200 bg-white space-y-3">
        <h5 className="text-xs font-bold uppercase tracking-wider text-neutral-700 font-mono">
          {selectedLang === 'EN' ? 'Measurable Progress Competency Model' : 'Modelo de Competencias y Progreso'}
        </h5>

        <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5 text-xs text-center">
          <div className="p-2.5 bg-neutral-50 rounded-xl border border-neutral-200">
            <div className="text-[10px] font-semibold text-neutral-500">Pronunciation (20%)</div>
            <div className="text-sm font-black text-neutral-900 mt-1">{cert.competencyScores.pronunciation}%</div>
          </div>
          <div className="p-2.5 bg-neutral-50 rounded-xl border border-neutral-200">
            <div className="text-[10px] font-semibold text-neutral-500">Fluency (20%)</div>
            <div className="text-sm font-black text-neutral-900 mt-1">{cert.competencyScores.speakingFluency}%</div>
          </div>
          <div className="p-2.5 bg-neutral-50 rounded-xl border border-neutral-200">
            <div className="text-[10px] font-semibold text-neutral-500">Vocabulary (20%)</div>
            <div className="text-sm font-black text-neutral-900 mt-1">{cert.competencyScores.vocabulary}%</div>
          </div>
          <div className="p-2.5 bg-neutral-50 rounded-xl border border-neutral-200">
            <div className="text-[10px] font-semibold text-neutral-500">Grammar (20%)</div>
            <div className="text-sm font-black text-neutral-900 mt-1">{cert.competencyScores.grammarAccuracy}%</div>
          </div>
          <div className="p-2.5 bg-neutral-50 rounded-xl border border-neutral-200 col-span-2 sm:col-span-1">
            <div className="text-[10px] font-semibold text-neutral-500">Listening (20%)</div>
            <div className="text-sm font-black text-neutral-900 mt-1">{cert.competencyScores.listeningComprehension}%</div>
          </div>
        </div>

        <div className="p-2.5 bg-blue-50/60 rounded-xl border border-blue-200 text-xs text-blue-950 flex items-center justify-between">
          <span>
            {selectedLang === 'EN'
              ? 'Weighted Core Oral Readiness Indicator:'
              : 'Indicador Ponderado de Preparación Oral:'}
          </span>
          <span className="font-black text-sm text-blue-900">{evaluation.readinessPercentage}%</span>
        </div>
      </div>

      {/* Teacher Evaluation & Approval Form */}
      <div className="p-4 rounded-2xl border border-neutral-200 bg-white space-y-3">
        <div className="flex items-center justify-between">
          <h5 className="text-xs font-bold uppercase tracking-wider text-neutral-700 font-mono">
            {selectedLang === 'EN' ? 'Teacher Assessment & Validation' : 'Evaluación y Validación Docente'}
          </h5>
          <span className="text-[11px] text-neutral-500">
            {selectedLang === 'EN' ? 'Authorized Teachers Only' : 'Exclusivo Docentes Autorizados'}
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
          <div>
            <label className="block text-neutral-600 font-semibold mb-1">
              {selectedLang === 'EN' ? 'Reading Comprehension Score (%)' : 'Nota Comprensión de Lectura (%)'}
            </label>
            <input
              type="number"
              min={0}
              max={100}
              value={readingScore}
              onChange={(e) => setReadingScore(Number(e.target.value))}
              disabled={isAchieved}
              className="w-full px-3 py-1.5 bg-white border border-neutral-300 rounded-lg font-bold text-neutral-900 focus:outline-none focus:ring-1 focus:ring-neutral-500 disabled:bg-neutral-100"
            />
          </div>

          <div>
            <label className="block text-neutral-600 font-semibold mb-1">
              {selectedLang === 'EN' ? 'Writing Accuracy Score (%)' : 'Nota Precisión de Redacción (%)'}
            </label>
            <input
              type="number"
              min={0}
              max={100}
              value={writingScore}
              onChange={(e) => setWritingScore(Number(e.target.value))}
              disabled={isAchieved}
              className="w-full px-3 py-1.5 bg-white border border-neutral-300 rounded-lg font-bold text-neutral-900 focus:outline-none focus:ring-1 focus:ring-neutral-500 disabled:bg-neutral-100"
            />
          </div>
        </div>

        <div className="text-xs">
          <label className="block text-neutral-600 font-semibold mb-1">
            {selectedLang === 'EN' ? 'Teacher Evidence Notes' : 'Notas de Evidencia y Observaciones'}
          </label>
          <textarea
            rows={2}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            disabled={isAchieved}
            className="w-full px-3 py-1.5 bg-white border border-neutral-300 rounded-lg text-xs text-neutral-900 focus:outline-none focus:ring-1 focus:ring-neutral-500 disabled:bg-neutral-100"
          />
        </div>

        <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="text-[11px] text-neutral-500 leading-tight">
            {isAchieved ? (
              <span className="text-emerald-700 font-bold flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" />
                {selectedLang === 'EN'
                  ? `Approved by ${cert.teacherApproval?.teacherName || 'Alejandra Francois (La Profe)'} on ${cert.achievementDate}`
                  : `Aprobado por ${cert.teacherApproval?.teacherName || 'Alejandra Francois (La Profe)'} el ${cert.achievementDate}`}
              </span>
            ) : (
              <span>
                {selectedLang === 'EN'
                  ? 'Minimum 70% threshold required in all areas before certificate can be approved.'
                  : 'Se requiere umbral mínimo del 70% en todas las áreas para aprobar.'}
              </span>
            )}
          </div>

          {!isAchieved && (
            <button
              type="button"
              onClick={handleApprove}
              disabled={isApproving}
              className="w-full sm:w-auto px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer shadow-xs disabled:opacity-50"
            >
              <ShieldCheck className="w-4 h-4" />
              <span>
                {isApproving
                  ? (selectedLang === 'EN' ? 'Approving...' : 'Aprobando...')
                  : (selectedLang === 'EN' ? 'Approve & Issue Certificate' : 'Aprobar y Emitir Certificado')}
              </span>
            </button>
          )}
        </div>
      </div>

      {/* Permanent Historical Certificates Record */}
      {historyList.length > 0 && (
        <div className="p-4 rounded-2xl border border-neutral-200 bg-white space-y-2">
          <div className="flex items-center gap-2">
            <History className="w-4 h-4 text-neutral-600" />
            <h5 className="text-xs font-bold uppercase tracking-wider text-neutral-700 font-mono">
              {selectedLang === 'EN' ? 'Permanent Historical Certificates' : 'Historial Permanente de Certificados'}
            </h5>
          </div>

          <div className="space-y-2">
            {historyList.map(h => (
              <div 
                key={h.id}
                className="p-3 bg-neutral-50 rounded-xl border border-neutral-200 flex items-center justify-between gap-3 text-xs"
              >
                <div>
                  <div className="font-bold text-neutral-900">
                    CEFR {h.targetLevel} — {CEFR_TITLES[h.targetLevel]?.en}
                  </div>
                  <div className="text-[11px] text-neutral-500">
                    {h.achievementDate} · {h.teacherApproval?.teacherName || 'Alejandra Francois (La Profe)'} · {h.certificateNumber}
                  </div>
                </div>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                  {selectedLang === 'EN' ? 'Achieved' : 'Alcanzado'}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
