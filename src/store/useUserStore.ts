import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from '../api/supabase';

interface UserState {
  xp: number;
  level: number;
  totalHabitsCompleted: number;
  name: string;
  avatar: string;
  
  fetchProfile: () => Promise<void>;
  updateProfile: (updates: { name?: string, avatar?: string }) => Promise<void>;
  addXP: (amount: number) => Promise<void>;
  removeXP: (amount: number) => Promise<void>;
  incrementCompletions: () => Promise<void>;
  decrementCompletions: () => Promise<void>;
  resetStats: () => Promise<void>;
}

export const getXPForNextLevel = (level: number) => level * 100;

export const useUserStore = create<UserState>()(
  persist(
    (set, get) => ({
      xp: 0,
      level: 1,
      totalHabitsCompleted: 0,
      name: 'Guerrero Grit',
      avatar: '🔱',

      fetchProfile: async () => {
        try {
          const { data: { session } } = await supabase.auth.getSession();
          if (!session) return;

          const { data, error } = await supabase
            .from('profiles')
            .select('xp, level, name, avatar')
            .eq('id', session.user.id)
            .single();

          if (error && error.code === 'PGRST116') {
            const { data: newData, error: createError } = await supabase
              .from('profiles')
              .insert({ id: session.user.id, xp: 0, level: 1, name: 'Guerrero Grit', avatar: '🔱' })
              .select()
              .single();
            
            if (!createError && newData) {
              set({ xp: newData.xp, level: newData.level, name: newData.name, avatar: newData.avatar });
            }
          } else if (!error && data) {
            set({ 
              xp: data.xp, 
              level: data.level, 
              name: data.name || 'Guerrero Grit', 
              avatar: data.avatar || '🔱' 
            });
          }
        } catch (err) {
          console.error("Error cargando perfil:", err);
        }
      },

      updateProfile: async (updates) => {
        set((state) => ({ ...state, ...updates }));
        const { data: { session } } = await supabase.auth.getSession();
        if (session) {
          await supabase.from('profiles').update(updates).eq('id', session.user.id);
        }
      },

      addXP: async (amount: number) => {
        let { xp, level } = get();
        const oldLevel = level;
        xp += amount;
        let xpNeeded = getXPForNextLevel(level);
        while (xp >= xpNeeded) {
          xp -= xpNeeded;
          level += 1;
          xpNeeded = getXPForNextLevel(level);
        }
        set({ xp, level });
        const { data: { session } } = await supabase.auth.getSession();
        if (session) await supabase.from('profiles').update({ xp, level }).eq('id', session.user.id);
        
        return level > oldLevel; // Retorna true si subió de nivel
      },

      removeXP: async (amount: number) => {
        let { xp, level } = get();
        xp -= amount;
        while (xp < 0 && level > 1) {
          level -= 1;
          xp += getXPForNextLevel(level);
        }
        if (xp < 0) xp = 0;
        set({ xp, level });
        const { data: { session } } = await supabase.auth.getSession();
        if (session) await supabase.from('profiles').update({ xp, level }).eq('id', session.user.id);
      },

      incrementCompletions: async () => {
        set({ totalHabitsCompleted: get().totalHabitsCompleted + 1 });
      },

      decrementCompletions: async () => {
        set({ totalHabitsCompleted: Math.max(0, get().totalHabitsCompleted - 1) });
      },

      resetStats: async () => {
        set({ xp: 0, level: 1, totalHabitsCompleted: 0, name: 'Guerrero Grit', avatar: '🔱' });
        const { data: { session } } = await supabase.auth.getSession();
        if (session) {
          await supabase.from('profiles').update({ xp: 0, level: 1, name: 'Guerrero Grit', avatar: '🔱' }).eq('id', session.user.id);
        }
      },
    }),
    {
      name: 'grit-user-stats-v3',
      storage: createJSONStorage(() => AsyncStorage),
      version: 3,
    }
  )
);
