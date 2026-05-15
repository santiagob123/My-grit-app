import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from '../api/supabase';
import { Alert } from 'react-native';
import { useNotificationStore } from './useNotificationStore';
import { useBadgeStore } from './useBadgeStore';
import { useUserStore } from './useUserStore';

export interface Habit {
  id: string;
  user_id?: string;
  title: string;
  icon: string;
  color: string;
  completed_today: boolean;
  streak: number;
  history: string[]; 
  type: 'boolean' | 'counter';
  daily_target: number;
  current_count: number;
  unit: string;
  reminder_enabled: boolean;
  reminder_time: string;
  sort_order?: number; 
  notes?: string;
  scheduled_days?: number[]; // 0=Sun, 1=Mon, ..., 6=Sat. Empty = all days.
  time_block?: 'morning' | 'afternoon' | 'evening' | 'anytime';
}

interface HabitState {
  habits: Habit[];
  isLoading: boolean;
  fetchHabits: () => Promise<void>;
  validateStreaks: () => void;
  addHabit: (habit: any) => Promise<void>;
  toggleHabit: (id: string) => Promise<void>;
  incrementCount: (id: string) => Promise<void>;
  decrementCount: (id: string) => Promise<void>;
  deleteHabit: (id: string) => Promise<void>;
  resetHabits: () => Promise<void>;
  rescueStreak: (id: string) => Promise<void>;
  reorderHabits: (newHabits: Habit[]) => Promise<void>;
  updateHabit: (id: string, updates: Partial<Habit>) => Promise<void>;
  getWeeklyReport: () => { 
    days: { date: string, percent: number }[], 
    average: number, 
    grade: string,
    label: string,
    xpReward: number
  };
}

export const useHabitStore = create<HabitState>()(
  persist(
    (set, get) => ({
      habits: [],
      isLoading: false,

      fetchHabits: async () => {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) return;

        // Solo marcamos carga si no hay hábitos locales para no parpadear
        const currentHabits = get().habits;
        if (currentHabits.length === 0) set({ isLoading: true });

        try {
          const { data, error } = await supabase.from('habits').select('*').eq('user_id', session.user.id);
          
          if (!error && data) {
            const today = new Date().toISOString().split('T')[0];
            const cloudHabits: Habit[] = data.map(h => ({
              ...h,
              history: Array.isArray(h.history) ? h.history : (h.history ? JSON.parse(h.history as any) : []),
              completed_today: (Array.isArray(h.history) ? h.history : []).includes(today)
            }));
            
            // ESTRATEGIA DE MEZCLA: Solo actualizamos si no tenemos el hábito o si hay cambios reales
            // Pero si el hábito local está completado hoy, respetamos eso sobre la nube lenta
            const mergedHabits = cloudHabits.map(cloudH => {
              const localH = currentHabits.find(lh => lh.id === cloudH.id);
              if (localH && localH.completed_today && !cloudH.completed_today) {
                return { ...cloudH, completed_today: true, history: Array.from(new Set([...cloudH.history, today])) };
              }
              return cloudH;
            }).sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0));

            set({ habits: mergedHabits });
            get().validateStreaks();
            
            // Notificaciones inteligentes
            const allDone = mergedHabits.length > 0 && mergedHabits.every(h => h.completed_today);
            useNotificationStore.getState().checkStreakStatus(allDone);
          }
        } finally {
          set({ isLoading: false });
        }
      },

      validateStreaks: () => {
        const todayStr = new Date().toISOString().split('T')[0];
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        const yesterdayStr = yesterday.toISOString().split('T')[0];

        const updatedHabits = (get().habits || []).map(habit => {
          const lastDate = habit.history && habit.history.length > 0 ? habit.history[habit.history.length - 1] : null;
          if (lastDate && lastDate !== todayStr && lastDate !== yesterdayStr && habit.streak > 0) {
            get().updateHabit(habit.id, { streak: 0 });
            return { ...habit, streak: 0 };
          }
          return habit;
        });
        set({ habits: updatedHabits });
      },

      reorderHabits: async (newHabits) => {
        const ordered = newHabits.map((h, i) => ({ ...h, sort_order: i }));
        set({ habits: ordered });
        // No sincronizamos sort_order con DB por ahora para evitar errores
      },

      rescueStreak: async (id) => {
        const habit = (get().habits || []).find(h => h.id === id);
        if (!habit) return;
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        const yesterdayStr = yesterday.toISOString().split('T')[0];
        const newHistory = Array.from(new Set([...(habit.history || []), yesterdayStr])).sort();
        await get().updateHabit(id, { 
          streak: Math.max(1, habit.streak + 1),
          history: newHistory
        });
      },

      addHabit: async (newHabit) => {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) return;
        
        // CAMPOS SEGUROS (sin sort_order)
        const habitData: any = {
          title: newHabit.title || 'Nuevo Hábito',
          icon: newHabit.icon || '🎯',
          color: newHabit.color || '#0A84FF',
          type: newHabit.type || 'boolean',
          daily_target: Number(newHabit.daily_target) || 1,
          unit: newHabit.unit || 'veces',
          reminder_enabled: Boolean(newHabit.reminder_enabled),
          reminder_time: newHabit.reminder_time || '09:00',
          user_id: session.user.id,
          streak: 0,
          current_count: 0,
          scheduled_days: newHabit.scheduled_days || [],
          time_block: newHabit.time_block || 'anytime'
        };

        const { data, error } = await supabase.from('habits').insert(habitData).select().single();
        
        if (error) {
          Alert.alert("Error Supabase", error.message);
          return;
        }

        if (data) {
          set((state) => ({ 
            habits: [...(state.habits || []), { ...data, completed_today: false, history: [], sort_order: state.habits.length }] 
          }));
        }
      },

      updateHabit: async (id, updates) => {
        const cleanUpdates: any = {};
        const validFields = ['title', 'icon', 'color', 'type', 'daily_target', 'unit', 'reminder_enabled', 'reminder_time', 'streak', 'current_count', 'history', 'notes', 'scheduled_days', 'time_block'];
        Object.keys(updates).forEach(key => {
          if (validFields.includes(key)) cleanUpdates[key] = (updates as any)[key];
        });

        set((state) => ({
          habits: (state.habits || []).map(h => h.id === id ? { ...h, ...updates } : h)
        }));

        await supabase.from('habits').update(cleanUpdates).eq('id', id);
      },

      toggleHabit: async (id) => {
        const habit = (get().habits || []).find(h => h.id === id);
        if (!habit) return;
        const today = new Date().toISOString().split('T')[0];
        const history = habit.history || [];
        const isCurrentlyCompleted = history.includes(today);
        const newHistory = isCurrentlyCompleted 
          ? history.filter(d => d !== today)
          : [...history, today];
        const newStatus = !isCurrentlyCompleted;
        const newStreak = newStatus ? habit.streak + 1 : Math.max(0, habit.streak - 1);

        await get().updateHabit(id, { completed_today: newStatus, streak: newStreak, history: newHistory } as any);
        
        // Notificaciones inteligentes
        const updatedHabits = get().habits;
        const allDone = updatedHabits.length > 0 && updatedHabits.every(h => h.completed_today);
        useNotificationStore.getState().checkStreakStatus(allDone);

        // Sistema de Logros
        useBadgeStore.getState().checkBadges({
          streaks: updatedHabits.map(h => h.streak),
          totalCompletions: updatedHabits.reduce((acc, h) => acc + (h.history?.length || 0), 0),
          level: useUserStore.getState().level
        });
      },

      incrementCount: async (id) => {
        const habit = (get().habits || []).find(h => h.id === id);
        if (!habit || habit.current_count >= habit.daily_target) return;
        const newCount = habit.current_count + 1;
        const isNowCompleted = newCount >= habit.daily_target;
        const today = new Date().toISOString().split('T')[0];
        const history = habit.history || [];
        const wasAlreadyCompletedToday = history.includes(today);

        const updates: any = { current_count: newCount };
        if (isNowCompleted && !wasAlreadyCompletedToday) {
          updates.completed_today = true;
          updates.history = [...history, today];
          updates.streak = habit.streak + 1;
        }
        await get().updateHabit(id, updates);

        // Notificaciones inteligentes
        const updatedHabits = get().habits;
        const allDone = updatedHabits.length > 0 && updatedHabits.every(h => h.completed_today);
        useNotificationStore.getState().checkStreakStatus(allDone);

        // Sistema de Logros
        useBadgeStore.getState().checkBadges({
          streaks: updatedHabits.map(h => h.streak),
          totalCompletions: updatedHabits.reduce((acc, h) => acc + (h.history?.length || 0), 0),
          level: useUserStore.getState().level
        });
      },

      decrementCount: async (id) => {
        const habit = (get().habits || []).find(h => h.id === id);
        if (!habit || habit.current_count <= 0) return;
        const newCount = habit.current_count - 1;
        const today = new Date().toISOString().split('T')[0];
        const history = habit.history || [];
        const wasCompletedToday = history.includes(today);
        const isStillCompleted = newCount >= habit.daily_target;
        
        const updates: any = { current_count: newCount };
        if (wasCompletedToday && !isStillCompleted) {
          updates.completed_today = false;
          updates.history = history.filter(d => d !== today);
          updates.streak = Math.max(0, habit.streak - 1);
        }
        await get().updateHabit(id, updates);

        // Notificaciones inteligentes
        const updatedHabits = get().habits;
        const allDone = updatedHabits.length > 0 && updatedHabits.every(h => h.completed_today);
        useNotificationStore.getState().checkStreakStatus(allDone);

        // Sistema de Logros
        useBadgeStore.getState().checkBadges({
          streaks: updatedHabits.map(h => h.streak),
          totalCompletions: updatedHabits.reduce((acc, h) => acc + (h.history?.length || 0), 0),
          level: useUserStore.getState().level
        });
      },

      resetHabits: async () => {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) return;
        const resetHabits = (get().habits || []).map(h => ({
          ...h, streak: 0, current_count: 0, history: [], completed_today: false
        }));
        set({ habits: resetHabits });
        await supabase.from('habits').update({ streak: 0, current_count: 0 }).eq('user_id', session.user.id);
      },

      deleteHabit: async (id) => {
        const { error } = await supabase.from('habits').delete().eq('id', id);
        if (!error) {
          set((state) => ({ habits: (state.habits || []).filter(h => h.id !== id) }));
        }
      },
      getWeeklyReport: () => {
        const habits = get().habits;
        if (habits.length === 0) return { days: [], average: 0, grade: 'C', label: 'Sin datos', xpReward: 0 };

        const days = [];
        let totalPercent = 0;
        const today = new Date();

        for (let i = 6; i >= 0; i--) {
          const d = new Date();
          d.setDate(today.getDate() - i);
          const dateStr = d.toISOString().split('T')[0];
          
          const scheduledForDay = habits.filter(h => 
            !h.scheduled_days || h.scheduled_days.length === 0 || h.scheduled_days.includes(d.getDay())
          );
          
          if (scheduledForDay.length === 0) {
            days.push({ date: dateStr, percent: 100 });
            totalPercent += 100;
          } else {
            const completed = scheduledForDay.filter(h => (h.history || []).includes(dateStr)).length;
            const percent = (completed / scheduledForDay.length) * 100;
            days.push({ date: dateStr, percent });
            totalPercent += percent;
          }
        }

        const average = totalPercent / 7;
        let grade = 'C';
        let label = 'Iniciado';
        let xpReward = 50;

        if (average >= 95) { grade = 'S'; label = 'Guerrero Divino'; xpReward = 500; }
        else if (average >= 80) { grade = 'A'; label = 'Maestro'; xpReward = 250; }
        else if (average >= 60) { grade = 'B'; label = 'Soldado'; xpReward = 125; }

        return { days, average, grade, label, xpReward };
      }
    }),
    {
      name: 'grit-habits-storage-v7', // VOLVEMOS A V7 PARA RECUPERAR DATOS
      storage: createJSONStorage(() => AsyncStorage),
      version: 7,
    }
  )
);
