import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useUserStore } from './useUserStore';

export interface SoberMission {
  id: string;
  name: string;
  startDate: string;
  bestRecordMs: number;
  history: { date: string; durationMs: number }[];
  icon: string;
}

interface SoberState {
  missions: SoberMission[];
  
  addMission: (name: string, icon: string) => void;
  relapseMission: (id: string) => Promise<void>;
  finishMission: (id: string) => void;
  deleteMission: (id: string) => void;
  getTimeElapsed: (startDate: string) => {
    days: number;
    hours: number;
    minutes: number;
    seconds: number;
    totalMs: number;
  };
}

export const useSoberStore = create<SoberState>()(
  persist(
    (set, get) => ({
      missions: [],

      addMission: (name, icon) => {
        const newMission: SoberMission = {
          id: Date.now().toString(),
          name,
          icon,
          startDate: new Date().toISOString(),
          bestRecordMs: 0,
          history: [],
        };
        set({ missions: [...get().missions, newMission] });
      },

      relapseMission: async (id) => {
        const mission = get().missions.find(m => m.id === id);
        if (!mission) return;

        const now = new Date().getTime();
        const start = new Date(mission.startDate).getTime();
        const durationMs = now - start;

        const updatedHistory = [{ date: new Date().toISOString(), durationMs }, ...mission.history].slice(0, 7);
        
        // Penalización de XP
        await useUserStore.getState().removeXP(50);

        set({
          missions: get().missions.map(m => 
            m.id === id 
              ? { 
                  ...m, 
                  startDate: new Date().toISOString(), 
                  bestRecordMs: Math.max(m.bestRecordMs, durationMs),
                  history: updatedHistory
                } 
              : m
          )
        });
      },

      finishMission: (id) => {
        set({ missions: get().missions.filter(m => m.id !== id) });
      },

      deleteMission: (id) => {
        set({ missions: get().missions.filter(m => m.id !== id) });
      },

      getTimeElapsed: (startDate) => {
        const now = new Date().getTime();
        const startTime = new Date(startDate).getTime();
        const totalMs = now - startTime;
        
        const days = Math.floor(totalMs / (1000 * 60 * 60 * 24));
        const hours = Math.floor((totalMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const minutes = Math.floor((totalMs % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((totalMs % (1000 * 60)) / 1000);
        
        return { days, hours, minutes, seconds, totalMs };
      },
    }),
    {
      name: 'grit-sober-tracker-v4',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);
