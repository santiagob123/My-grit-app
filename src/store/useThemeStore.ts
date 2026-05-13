import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { ThemeMode } from '../theme/colors';
import { SkinID } from '../theme/skins';

interface ThemeState {
  mode: ThemeMode;
  skinId: SkinID;
  reduceMotion: boolean; // Nueva preferencia
  toggleTheme: () => void;
  setMode: (mode: ThemeMode) => void;
  setSkin: (skinId: SkinID) => void;
  setReduceMotion: (reduce: boolean) => void;
}

export const useThemeStore = create<ThemeState>()(
  persist(
    (set) => ({
      mode: 'dark',
      skinId: 'classic',
      reduceMotion: false,
      toggleTheme: () => set((s) => ({ mode: s.mode === 'dark' ? 'light' : 'dark' })),
      setMode: (mode) => set({ mode }),
      setSkin: (skinId) => set({ skinId }),
      setReduceMotion: (reduceMotion) => set({ reduceMotion }),
    }),
    { name: 'grit-theme', storage: createJSONStorage(() => AsyncStorage) }
  )
);
