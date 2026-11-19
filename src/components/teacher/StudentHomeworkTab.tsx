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
  const [objective, setObjective] = useState('');
  const [description, setDescription] = useState('');
  const [level, setLevel] = useState('B2');
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
        objective: objective.trim() || description.trim(),
        description: description.trim(),
        instructions: description.trim(),
        level: level || 'B2',
        dueDate: dueDate || (selectedLang === 'EN' ? 'Next Session' : 'Próxima Sesión'),
        assignedBy: currentUser?.email || 'Teacher',
        teacherName: currentUser?.displayName || currentUser?.email || 'Voyager Tutor',
        status: 'PENDING',
        progressPercentage: 0
      });
      onHomeworkUpdated([newItem, ...homeworkList]);
      setTitle('');
      setObjective('');
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
    <div className="space-y-4 text-left font-['Raleway']">
      <div className="flex items-center justify-between">
        <h4 className="text-xs font-bold uppercase tracking-wider text-neutral-700 font-mono">
          {selectedLang === 'EN' ? 'Assigned Tasks & Practice Modules' : 'Tareas Asignadas y Módulos de Práctica'}
        </h4>
        <button
          onClick={() => setShowAddForm(!showAddForm)}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-neutral-900 text-amber-300 hover:bg-neutral-800 text-xs font-bold rounded-lg transition-all cursor-pointer"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>{selectedLang === 'EN' ? 'Assign Homework' : 'Asignar Tarea'}</span>
        </button>
      </div>

      {showAddForm && (
        <form onSubmit={handleAssign} className="p-4 bg-amber-50/50 border border-amber-200 rounded-xl space-y-3">
          <div>
            <label className="block text-xs font-bold text-neutral-800 mb-1">
              {selectedLang === 'EN' ? 'Task / Lesson Title' : 'Título de la Lección / Tarea'}
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder={selectedLang === 'EN' ? 'e.g. Job Interview STAR Method Practice' : 'ej. Práctica de Entrevista Método STAR'}
              className="w-full px-3 py-2 bg-white border border-neutral-300 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-amber-500/20"
              required
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-neutral-800 mb-1">
                {selectedLang === 'EN' ? 'Target CEFR Level' : 'Nivel CEFR'}
              </label>
              <select
                value={level}
                onChange={(e) => setLevel(e.target.value)}
                className="w-full px-3 py-2 bg-white border border-neutral-300 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-amber-500/20"
              >
                <option value="A1">A1 — Principiante / Beginner</option>
                <option value="A2">A2 — Elemental / Elementary</option>
                <option value="B1">B1 — Intermedio / Intermediate</option>
                <option value="B2">B2 — Intermedio Alto / Upper Intermediate</option>
                <option value="C1">C1 — Avanzado / Advanced</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-neutral-800 mb-1">
                {selectedLang === 'EN' ? 'Due Date / Timeline' : 'Fecha de Entrega / Plazo'}
              </label>
              <input
                type="text"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                placeholder={selectedLang === 'EN' ? 'e.g. 15/11/2026 or Next Session' : 'ej. 15/11/2026 o Próxima Sesión'}
                className="w-full px-3 py-2 bg-white border border-neutral-300 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-amber-500/20"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-neutral-800 mb-1">
              {selectedLang === 'EN' ? 'Learning Objective' : 'Objetivo Pedagógico'}
            </label>
            <input
              type="text"
              value={objective}
              onChange={(e) => setObjective(e.target.value)}
              placeholder={selectedLang === 'EN' ? 'e.g. Structure clear responses using Situation, Task, Action, Result' : 'ej. Estructurar respuestas con marco Situación, Tarea, Acción, Resultado'}
              className="w-full px-3 py-2 bg-white border border-neutral-300 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-amber-500/20"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-neutral-800 mb-1">
              {selectedLang === 'EN' ? 'Instructions for Student & Voyager' : 'Instrucciones para el Estudiante y Voyager'}
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={2}
              placeholder={selectedLang === 'EN' ? 'Provide specific guidelines for Voyager to evaluate...' : 'Indicaciones específicas para la sesión con Voyager...'}
              className="w-full px-3 py-2 bg-white border border-neutral-300 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-amber-500/20"
            />
          </div>

          <div className="flex items-center gap-2 pt-1">
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-4 py-2 bg-neutral-900 text-white font-bold rounded-lg text-xs hover:bg-neutral-800 disabled:opacity-50 cursor-pointer"
            >
              {selectedLang === 'EN' ? 'Save Assignment' : 'Guardar Tarea'}
            </button>
            <button
              type="button"
              onClick={() => setShowAddForm(false)}
              className="px-4 py-2 bg-neutral-200 text-neutral-800 font-bold rounded-lg text-xs hover:bg-neutral-300 cursor-pointer"
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
          {homeworkList.map((hw) => {
            const statusNorm = (hw.status || 'PENDING').toUpperCase();
            const isDone = statusNorm === 'COMPLETED' || statusNorm === 'GRADED';
            const isInProgress = statusNorm === 'IN_PROGRESS';
            
            const badgeClass = isDone
              ? 'bg-emerald-100 text-emerald-800 border-emerald-300'
              : isInProgress
              ? 'bg-amber-100 text-amber-800 border-amber-300'
              : 'bg-zinc-100 text-zinc-700 border-zinc-200';

            const statusText = isDone
              ? (selectedLang === 'EN' ? 'Completed' : 'Completada')
              : isInProgress
              ? (selectedLang === 'EN' ? 'In Progress' : 'En curso')
              : (selectedLang === 'EN' ? 'Pending' : 'Pendiente');

            return (
              <div key={hw.id} className="p-3.5 bg-neutral-50 rounded-xl border border-neutral-200 flex items-start justify-between gap-3 text-left">
                <div className="space-y-1.5 min-w-0 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h5 className="text-xs font-bold text-neutral-900">{hw.title}</h5>
                    {hw.level && (
                      <span className="px-1.5 py-0.5 rounded text-[10px] font-mono font-bold bg-neutral-200 text-neutral-800">
                        {hw.level}
                      </span>
                    )}
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${badgeClass}`}>
                      {statusText}
                    </span>
                    {typeof hw.progressPercentage === 'number' && hw.progressPercentage > 0 && (
                      <span className="text-[10px] font-mono text-neutral-500 font-bold">
                        ({hw.progressPercentage}%)
                      </span>
                    )}
                    {hw.grade && (
                      <span className="px-1.5 py-0.5 rounded text-[10px] font-mono font-extrabold bg-amber-100 text-amber-900">
                        Nota: {hw.grade}
                      </span>
                    )}
                  </div>
                  
                  {hw.objective && (
                    <p className="text-xs text-neutral-700 font-medium">
                      <span className="font-bold text-neutral-900">{selectedLang === 'EN' ? 'Objective: ' : 'Objetivo: '}</span>
                      {hw.objective}
                    </p>
                  )}

                  {hw.description && hw.description !== hw.objective && (
                    <p className="text-xs text-neutral-600">
                      {hw.description}
                    </p>
                  )}

                  {hw.feedback && (
                    <div className="p-2 bg-emerald-50 border border-emerald-200 rounded-lg text-[11px] text-emerald-900 mt-1">
                      <span className="font-bold">{selectedLang === 'EN' ? 'Voyager Evaluation Feedback: ' : 'Evaluación de Voyager: '}</span>
                      {hw.feedback}
                    </div>
                  )}
                </div>

                {hw.dueDate && (
                  <div className="flex items-center gap-1 text-[11px] text-neutral-500 shrink-0">
                    <Clock className="w-3.5 h-3.5 text-neutral-400" />
                    <span>{hw.dueDate}</span>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
