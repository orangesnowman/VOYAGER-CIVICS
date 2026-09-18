import React, { useState } from 'react';
import { StudentSummary, HomeworkItem, assignHomeworkToStudent } from '../../services/teacherStudentService';
import { Plus, BookOpen, CheckCircle, Clock } from 'lucide-react';

interface StudentHomeworkTabProps {
  selectedStudent: StudentSummary;
  currentUser: any;
  selectedLang: 'EN' | 'ES';
  homeworkList: HomeworkItem[];
  onHomeworkUpdated: (items: HomeworkItem[]) => void;
}

export const StudentHomeworkTab: React.FC<StudentHomeworkTabProps> = ({
  selectedStudent,
  currentUser,
  selectedLang,
  homeworkList,
  onHomeworkUpdated
}) => {
  const [showAddForm, setShowAddForm] = useState(false);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleAssign = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    setIsSubmitting(true);
    try {
      const newItem = await assignHomeworkToStudent({
        studentId: selectedStudent.id,
        title: title.trim(),
        description: description.trim(),
        dueDate: dueDate || (selectedLang === 'EN' ? 'Next Session' : 'Próxima Sesión'),
        assignedBy: currentUser?.email || 'Teacher',
        status: 'PENDING'
      });
      onHomeworkUpdated([newItem, ...homeworkList]);
      setTitle('');
      setDescription('');
      setDueDate('');
      setShowAddForm(false);
    } catch (err) {
      console.error('Error assigning homework:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-4 text-left">
      <div className="flex items-center justify-between">
        <h4 className="text-xs font-bold uppercase tracking-wider text-neutral-700 font-mono">
          {selectedLang === 'EN' ? 'Assigned Tasks & Practice Modules' : 'Tareas Asignadas y Módulos de Práctica'}
        </h4>
        <button
          onClick={() => setShowAddForm(!showAddForm)}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-neutral-900 text-amber-300 hover:bg-neutral-800 text-xs font-bold rounded-lg transition-all"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>{selectedLang === 'EN' ? 'Assign Homework' : 'Asignar Tarea'}</span>
        </button>
      </div>

      {showAddForm && (
        <form onSubmit={handleAssign} className="p-4 bg-amber-50/50 border border-amber-200 rounded-xl space-y-3">
          <div>
            <label className="block text-xs font-bold text-neutral-800 mb-1">
              {selectedLang === 'EN' ? 'Task Title' : 'Título de la Tarea'}
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder={selectedLang === 'EN' ? 'e.g. Practice Civic History Interview' : 'ej. Practicar Entrevista de Civismo'}
              className="w-full px-3 py-2 bg-white border border-neutral-300 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-amber-500/20"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-neutral-800 mb-1">
              {selectedLang === 'EN' ? 'Instructions / Guidelines' : 'Instrucciones / Indicaciones'}
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={2}
              placeholder={selectedLang === 'EN' ? 'Specific focus points for session...' : 'Puntos clave para la sesión...'}
              className="w-full px-3 py-2 bg-white border border-neutral-300 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-amber-500/20"
            />
          </div>

          <div className="flex items-center gap-2 pt-1">
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-4 py-2 bg-neutral-900 text-white font-bold rounded-lg text-xs hover:bg-neutral-800 disabled:opacity-50"
            >
              {selectedLang === 'EN' ? 'Save Assignment' : 'Guardar Tarea'}
            </button>
            <button
              type="button"
              onClick={() => setShowAddForm(false)}
              className="px-4 py-2 bg-neutral-200 text-neutral-800 font-bold rounded-lg text-xs hover:bg-neutral-300"
            >
              {selectedLang === 'EN' ? 'Cancel' : 'Cancelar'}
            </button>
          </div>
        </form>
      )}

      {homeworkList.length === 0 ? (
        <div className="p-6 text-center text-xs text-neutral-500 bg-neutral-50 rounded-xl border border-dashed border-neutral-300">
          <BookOpen className="w-8 h-8 text-neutral-300 mx-auto mb-1.5" />
          <p>{selectedLang === 'EN' ? 'No homework assigned yet.' : 'No hay tareas asignadas aún.'}</p>
        </div>
      ) : (
        <div className="space-y-2.5">
          {homeworkList.map((hw) => (
            <div key={hw.id} className="p-3.5 bg-neutral-50 rounded-xl border border-neutral-200 flex items-start justify-between gap-3">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <h5 className="text-xs font-bold text-neutral-900">{hw.title}</h5>
                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                    hw.status === 'GRADED' ? 'bg-emerald-100 text-emerald-800' :
                    hw.status === 'SUBMITTED' ? 'bg-blue-100 text-blue-800' : 'bg-amber-100 text-amber-800'
                  }`}>
                    {hw.status}
                  </span>
                </div>
                {hw.description && <p className="text-xs text-neutral-600">{hw.description}</p>}
              </div>

              {hw.dueDate && (
                <div className="flex items-center gap-1 text-[11px] text-neutral-500 shrink-0">
                  <Clock className="w-3 h-3 text-neutral-400" />
                  <span>{hw.dueDate}</span>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
