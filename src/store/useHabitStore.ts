import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

export interface Habit {
  id: string;
  title: string;
  description?: string;
  icon: string;
  color: string;
  frequency: 'daily' | 'weekly';
  category: string;
  streak: number;
  completed_today: boolean;
  // Counter fields
  type: 'boolean' | 'counter';
  daily_target: number;
  current_count: number;
  unit: string;
  // Notification fields
  reminder_enabled: boolean;
  reminder_hour: number;    // 0-23
  reminder_minute: number;  // 0-59
  notification_id?: string; // Expo notification identifier
}

interface HabitState {
  habits: Habit[];
  setHabits: (habits: Habit[]) => void;
  addHabit: (habit: Habit) => void;
  updateHabit: (id: string, habit: Partial<Habit>) => void;
  deleteHabit: (id: string) => void;
  toggleHabit: (id: string) => void;
  incrementCount: (id: string) => void;
  decrementCount: (id: string) => void;
  resetDaily: () => void;
}

export const useHabitStore = create<HabitState>()(
  persist(
    (set) => ({
      habits: [],
      setHabits: (habits) => set({ habits }),
      addHabit: (habit) => set((state) => ({ habits: [...state.habits, habit] })),
      updateHabit: (id, updatedHabit) =>
        set((state) => ({
          habits: state.habits.map((h) => (h.id === id ? { ...h, ...updatedHabit } : h)),
        })),
      deleteHabit: (id) =>
        set((state) => ({ habits: state.habits.filter((h) => h.id !== id) })),
      toggleHabit: (id) =>
        set((state) => ({
          habits: state.habits.map((h) =>
            h.id === id ? { ...h, completed_today: !h.completed_today } : h
          ),
        })),
      incrementCount: (id) =>
        set((state) => ({
          habits: state.habits.map((h) => {
            if (h.id !== id) return h;
            const newCount = Math.min(h.current_count + 1, h.daily_target);
            return {
              ...h,
              current_count: newCount,
              completed_today: newCount >= h.daily_target,
              streak: newCount >= h.daily_target && !h.completed_today
                ? h.streak + 1
                : h.streak,
            };
          }),
        })),
      decrementCount: (id) =>
        set((state) => ({
          habits: state.habits.map((h) => {
            if (h.id !== id) return h;
            const newCount = Math.max(h.current_count - 1, 0);
            return {
              ...h,
              current_count: newCount,
              completed_today: newCount >= h.daily_target,
            };
          }),
        })),
      resetDaily: () =>
        set((state) => ({
          habits: state.habits.map((h) => ({
            ...h,
            completed_today: false,
            current_count: 0,
          })),
        })),
    }),
    {
      name: 'grit-habit-storage',
      storage: createJSONStorage(() => AsyncStorage),
      version: 3,
      migrate: (persistedState: any, version: number) => {
        if (version < 2 && persistedState?.habits) {
          persistedState.habits = persistedState.habits.map((h: any) => ({
            type: 'boolean', daily_target: 1, current_count: 0, unit: 'veces',
            reminder_enabled: false, reminder_hour: 9, reminder_minute: 0,
            ...h,
          }));
        }
        if (version < 3 && persistedState?.habits) {
          persistedState.habits = persistedState.habits.map((h: any) => ({
            reminder_enabled: false, reminder_hour: 9, reminder_minute: 0,
            ...h,
          }));
        }
        return persistedState;
      },
    }
  )
);
