import { useState, useEffect } from 'react';

export type SimulatedRole = 'admin' | 'student' | 'teacher';

const STORAGE_KEY = 'voyager_admin_simulated_role';

export interface SimulatedRoleMeta {
  id: SimulatedRole;
  labelEn: string;
  labelEs: string;
  icon: string;
  descriptionEn: string;
  descriptionEs: string;
  badgeEn: string;
  badgeEs: string;
}

export const SIMULATED_ROLES: Record<SimulatedRole, SimulatedRoleMeta> = {
  admin: {
    id: 'admin',
    labelEn: 'Admin View',
    labelEs: 'Vista Admin',
    icon: '🛡️',
    descriptionEn: 'Full Administrator Dashboard & System Control',
    descriptionEs: 'Panel Principal de Administración y Control del Sistema',
    badgeEn: 'FULL ADMIN RIGHTS',
    badgeEs: 'PRIVILEGIOS ADMIN COMPLETOS'
  },
  student: {
    id: 'student',
    labelEn: 'Student View',
    labelEs: 'Vista Estudiante',
    icon: '🎓',
    descriptionEn: 'Simulated Student Experience (Roadmap, Civics 128, Practice)',
    descriptionEs: 'Experiencia de Estudiante Simulada (Ruta de Aprendizaje, Cívica 128, Práctica)',
    badgeEn: 'SIMULATING STUDENT',
    badgeEs: 'SIMULANDO ESTUDIANTE'
  },
  teacher: {
    id: 'teacher',
    labelEn: 'Teacher View',
    labelEs: 'Vista Profesor',
    icon: '👩‍🏫',
    descriptionEn: 'Simulated Teacher/Profe Experience (Diagnostics, Phonetics, Students)',
    descriptionEs: 'Experiencia de Profesor Simulada (Diagnósticos, Fonética, Alumnos)',
    badgeEn: 'SIMULATING TEACHER',
    badgeEs: 'SIMULANDO PROFESOR'
  }
};

class AdminRoleSimManager {
  private role: SimulatedRole = 'admin';
  private listeners: Set<(role: SimulatedRole) => void> = new Set();

  constructor() {
    if (typeof window !== 'undefined') {
      try {
        const saved = localStorage.getItem(STORAGE_KEY) as SimulatedRole;
        if (saved === 'admin' || saved === 'student' || saved === 'teacher') {
          this.role = saved;
        }
      } catch (e) {
        console.warn('AdminRoleSimProvider: Error reading from localStorage', e);
      }
    }
  }

  getRole(): SimulatedRole {
    return this.role;
  }

  setRole(newRole: SimulatedRole) {
    this.role = newRole;
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem(STORAGE_KEY, newRole);
      } catch (e) {
        console.warn('AdminRoleSimProvider: Error writing to localStorage', e);
      }
    }
    this.notify();
  }

  isSimulating(): boolean {
    return this.role !== 'admin';
  }

  subscribe(listener: (role: SimulatedRole) => void): () => void {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  private notify() {
    this.listeners.forEach(fn => fn(this.role));
  }
}

export const AdminRoleSimProvider = new AdminRoleSimManager();

export function useAdminRoleSim(): [SimulatedRole, (role: SimulatedRole) => void] {
  const [role, setRoleState] = useState<SimulatedRole>(() => AdminRoleSimProvider.getRole());

  useEffect(() => {
    const unsubscribe = AdminRoleSimProvider.subscribe((newRole) => {
      setRoleState(newRole);
    });
    return unsubscribe;
  }, []);

  const changeRole = (newRole: SimulatedRole) => {
    AdminRoleSimProvider.setRole(newRole);
  };

  return [role, changeRole];
}
