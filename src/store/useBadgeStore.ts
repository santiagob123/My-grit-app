import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from '../api/supabase';
import { Alert } from 'react-native';

export interface Badge {
  id: string;
  title: string;
  description: string;
  icon: string;
  requirementType: 'streak' | 'total_completions' | 'level' | 'count';
  requirementValue: number;
  unlockedAt?: string;
}

export const ALL_BADGES: Badge[] = [
  { id: 'first_step', title: 'Iniciado', description: 'Completa tu primer hábito.', icon: '🌱', requirementType: 'total_completions', requirementValue: 1 },
  { id: 'seven_days', title: 'Constante', description: 'Consigue una racha de 7 días.', icon: '🔥', requirementType: 'streak', requirementValue: 7 },
  { id: 'steel_discipline', title: 'Guerrero de Acero', description: 'Consigue una racha de 30 días.', icon: '⚔️', requirementType: 'streak', requirementValue: 30 },
  { id: 'level_5', title: 'Veterano', description: 'Llega al nivel 5.', icon: '🎖️', requirementType: 'level', requirementValue: 5 },
  { id: 'level_10', title: 'Comandante', description: 'Llega al nivel 10.', icon: '👑', requirementType: 'level', requirementValue: 10 },
  { id: 'counter_master', title: 'Maestro Contador', description: 'Completa un hábito de contador.', icon: '📊', requirementType: 'count', requirementValue: 1 },
];

interface BadgeState {
  unlockedBadgeIds: string[];
  checkBadges: (stats: { streaks: number[], totalCompletions: number, level: number }) => void;
  resetBadges: () => void;
}

export const useBadgeStore = create<BadgeState>()(
  persist(
    (set, get) => ({
      unlockedBadgeIds: [],

      checkBadges: ({ streaks, totalCompletions, level }) => {
        const { unlockedBadgeIds } = get();
        const newUnlocks: string[] = [];

        ALL_BADGES.forEach(badge => {
          if (unlockedBadgeIds.includes(badge.id)) return;

          let isEligible = false;
          switch (badge.requirementType) {
            case 'streak':
              isEligible = streaks.some(s => s >= badge.requirementValue);
              break;
            case 'total_completions':
              isEligible = totalCompletions >= badge.requirementValue;
              break;
            case 'level':
              isEligible = level >= badge.requirementValue;
              break;
            case 'count':
              // Este se maneja por evento específico o por el total de completados si es de contador
              isEligible = totalCompletions >= badge.requirementValue; 
              break;
          }

          if (isEligible) {
            newUnlocks.push(badge.id);
            Alert.alert(
              "¡LOGRO DESBLOQUEADO! 🎖️",
              `Has ganado la medalla: ${badge.title}\n${badge.description}`,
              [{ text: "¡BRUTAL!" }]
            );
          }
        });

        if (newUnlocks.length > 0) {
          set({ unlockedBadgeIds: [...unlockedBadgeIds, ...newUnlocks] });
        }
      },

      resetBadges: () => set({ unlockedBadgeIds: [] }),
    }),
    {
      name: 'grit-badges-storage-v1',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);
