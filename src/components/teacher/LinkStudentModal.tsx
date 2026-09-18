import React, { useState } from 'react';
import { linkStudentToTeacher } from '../../services/teacherStudentService';
import { X, UserPlus, Mail } from 'lucide-react';

interface LinkStudentModalProps {
  currentUser: any;
  selectedLang: 'EN' | 'ES';
  onClose: () => void;
  onStudentLinked: () => void;
}

export const LinkStudentModal: React.FC<LinkStudentModalProps> = ({
  currentUser,
  selectedLang,
  onClose,
  onStudentLinked
}) => {
  const [email, setEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;

    setIsSubmitting(true);
    setErrorMsg('');
    try {
      const ok = await linkStudentToTeacher(email, currentUser?.uid || 'teacher');
      if (ok) {
        onStudentLinked();
        onClose();
      } else {
        setErrorMsg(selectedLang === 'EN' ? 'Student not found with that email.' : 'No se encontró estudiante con ese correo.');
      }
    } catch (err) {
      console.error('Link student error:', err);
      setErrorMsg(selectedLang === 'EN' ? 'Failed to link student.' : 'Error al vincular estudiante.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white w-full max-w-md rounded-2xl p-6 shadow-2xl text-left border border-neutral-200 space-y-4 animate-fade-in">
        <div className="flex items-center justify-between pb-2 border-b border-neutral-100">
          <div className="flex items-center gap-2">
            <UserPlus className="w-5 h-5 text-amber-500" />
            <h3 className="text-base font-bold text-neutral-900">
              {selectedLang === 'EN' ? 'Link Enrolled Student' : 'Vincular Estudiante Inscrito'}
            </h3>
          </div>
          <button onClick={onClose} className="p-1 text-neutral-400 hover:text-neutral-700 rounded-lg">
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-neutral-800 mb-1">
              {selectedLang === 'EN' ? 'Student Email Address' : 'Correo del Estudiante'}
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 text-neutral-400 absolute left-3 top-2.5" />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="student@example.com"
                className="w-full pl-9 pr-3 py-2 bg-neutral-50 border border-neutral-300 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-amber-500/20"
                required
              />
            </div>
          </div>

          {errorMsg && <div className="text-xs text-rose-600 font-medium">{errorMsg}</div>}

          <div className="flex items-center justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-neutral-100 text-neutral-800 font-bold text-xs rounded-xl hover:bg-neutral-200"
            >
              {selectedLang === 'EN' ? 'Cancel' : 'Cancelar'}
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-4 py-2 bg-neutral-900 text-amber-300 font-bold text-xs rounded-xl hover:bg-neutral-800 disabled:opacity-50"
            >
              {selectedLang === 'EN' ? 'Link Student' : 'Vincular Estudiante'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
