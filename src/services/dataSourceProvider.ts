import { useState, useEffect } from 'react';
import { db, auth } from './firebaseAuth';
import { collection, getDocs } from 'firebase/firestore';
import { withTimeout } from './userProfileService';

export type DataSourceMode = 'demo' | 'live' | 'hybrid';

const STORAGE_KEY = 'voyager_data_source_mode';

class DataSourceProviderManager {
  private mode: DataSourceMode = 'hybrid';
  private listeners: Set<(mode: DataSourceMode) => void> = new Set();

  constructor() {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem(STORAGE_KEY) as DataSourceMode;
      if (saved === 'demo' || saved === 'live' || saved === 'hybrid') {
        this.mode = saved;
      }
    }
  }

  getMode(): DataSourceMode {
    return this.mode;
  }

  setMode(newMode: DataSourceMode) {
    this.mode = newMode;
    if (typeof window !== 'undefined') {
      localStorage.setItem(STORAGE_KEY, newMode);
    }
    this.notify();
  }

  subscribe(listener: (mode: DataSourceMode) => void): () => void {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  private notify() {
    this.listeners.forEach(fn => fn(this.mode));
  }

  /**
   * Helper method to fetch student statistics based on selected DataSourceMode.
   */
  async getStudentStats(): Promise<{
    totalEnrolled: number;
    activeUsersCount: number;
    source: 'firestore' | 'demo' | 'hybrid-live' | 'hybrid-demo';
  }> {
    const demoData = { totalEnrolled: 160, activeUsersCount: 160, source: 'demo' as const };

    if (this.mode === 'demo') {
      return demoData;
    }

    try {
      if (auth.currentUser) {
        const snap = await withTimeout(getDocs(collection(db, 'users')), 3000);
        if (!snap.empty) {
          const liveCount = snap.size;
          if (this.mode === 'live') {
            return { totalEnrolled: liveCount, activeUsersCount: liveCount, source: 'firestore' };
          } else {
            return { 
              totalEnrolled: Math.max(liveCount, 160), 
              activeUsersCount: liveCount, 
              source: 'hybrid-live' 
            };
          }
        }
      }
    } catch (err) {
      console.warn('DataSourceProvider: Error fetching live user stats from Firestore', err);
    }

    if (this.mode === 'live') {
      return { totalEnrolled: 0, activeUsersCount: 0, source: 'firestore' };
    }

    return { ...demoData, source: 'hybrid-demo' };
  }
}

export const DataSourceProvider = new DataSourceProviderManager();

export function useDataSourceMode(): [DataSourceMode, (mode: DataSourceMode) => void] {
  const [mode, setModeState] = useState<DataSourceMode>(() => DataSourceProvider.getMode());

  useEffect(() => {
    const unsubscribe = DataSourceProvider.subscribe((newMode) => {
      setModeState(newMode);
    });
    return unsubscribe;
  }, []);

  const changeMode = (newMode: DataSourceMode) => {
    DataSourceProvider.setMode(newMode);
  };

  return [mode, changeMode];
}

