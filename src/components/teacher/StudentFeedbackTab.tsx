import React, { useState } from 'react';
import { StudentSummary, TeacherFeedbackItem, addTeacherFeedback } from '../../services/teacherStudentService';
import { Plus, MessageSquare, Send } from 'lucide-react';

interface StudentFeedbackTabProps {
  selectedStudent: StudentSummary;
  currentUser: any;
  selectedLang: 'EN' | 'ES';
  feedbackList: TeacherFeedbackItem[];
  onFeedbackUpdated: (items: TeacherFeedbackItem[]) => void;
}

export const StudentFeedbackTab: React.FC<StudentFeedbackTabProps> = ({
  selectedStudent,
  currentUser,
  selectedLang,
  feedbackList,
  onFeedbackUpdated
}) => {
  const [text, setText] = useState('');
  const [category, setCategory] = useState(selectedLang === 'EN' ? 'General Observation' : 'Observación General');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handlePostFeedback = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!text.trim()) return;

    setIsSubmitting(true);
    try {
      const newItem = await addTeacherFeedback({
        studentId: selectedStudent.id,
        text: text.trim(),
        category,
        teacherName: currentUser?.displayName || currentUser?.email || 'Teacher'
      });
      onFeedbackUpdated([newItem, ...feedbackList]);
      setText('');
    } catch (err) {
      console.error('Error adding feedback:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-4 text-left">
      <h4 className="text-xs font-bold uppercase tracking-wider text-neutral-700 font-mono">
        {selectedLang === 'EN' ? 'Teacher Notes & Feedback Log' : 'Notas del Profesor y Registro de Comentarios'}
      </h4>

      <form onSubmit={handlePostFeedback} className="p-3 bg-neutral-50 rounded-xl border border-neutral-200 space-y-2.5">
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          rows={3}
          placeholder={selectedLang === 'EN' ? 'Write personalized note or feedback for student...' : 'Escribe una nota o recomendación personalizada...'}
          className="w-full px-3 py-2 bg-white border border-neutral-300 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-amber-500/20"
        />

        <div className="flex items-center justify-between gap-2">
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="px-2.5 py-1.5 bg-white border border-neutral-300 rounded-lg text-xs text-neutral-700 font-medium focus:outline-none"
          >
            <option value={selectedLang === 'EN' ? 'General Observation' : 'Observación General'}>
              {selectedLang === 'EN' ? 'General Observation' : 'Observación General'}
            </option>
            <option value={selectedLang === 'EN' ? 'Pronunciation Focus' : 'Enfoque en Pronunciación'}>
              {selectedLang === 'EN' ? 'Pronunciation Focus' : 'Enfoque en Pronunciación'}
            </option>
            <option value={selectedLang === 'EN' ? 'Civics & History' : 'Civismo e Historia'}>
              {selectedLang === 'EN' ? 'Civics & History' : 'Civismo e Historia'}
            </option>
          </select>

          <button
            type="submit"
            disabled={isSubmitting || !text.trim()}
            className="inline-flex items-center gap-1.5 px-4 py-1.5 bg-neutral-900 text-amber-300 hover:bg-neutral-800 disabled:opacity-50 text-xs font-bold rounded-lg transition-all"
          >
            <Send className="w-3.5 h-3.5" />
            <span>{selectedLang === 'EN' ? 'Post Note' : 'Publicar Nota'}</span>
          </button>
        </div>
      </form>

      {feedbackList.length === 0 ? (
        <div className="p-6 text-center text-xs text-neutral-500 bg-neutral-50 rounded-xl border border-dashed border-neutral-300">
          <MessageSquare className="w-8 h-8 text-neutral-300 mx-auto mb-1.5" />
          <p>{selectedLang === 'EN' ? 'No feedback notes posted yet.' : 'No hay notas publicadas aún.'}</p>
        </div>
      ) : (
        <div className="space-y-2.5">
          {feedbackList.map((fb) => (
            <div key={fb.id} className="p-3.5 bg-neutral-50 rounded-xl border border-neutral-200 text-xs space-y-1">
              <div className="flex items-center justify-between text-[11px] text-neutral-500">
                <span className="font-bold text-neutral-800">{fb.teacherName || 'Teacher'}</span>
                <span>{fb.createdAt}</span>
              </div>
              <p className="text-neutral-800">{fb.text}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
