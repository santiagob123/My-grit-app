import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

export interface Boss {
  name: string;
  maxHp: number;
  currentHp: number;
  icon: string;
  level: number;
  description: string;
  rewardXP: number;
}

interface BossState {
  currentBoss: Boss | null;
  isDefeated: boolean;
  initializeWeeklyBoss: (habitCount: number) => void;
  dealDamage: (amount: number) => void;
  resetBoss: () => void;
}

const BOSS_POOL = [
  { name: "Rey de la Procrastinación", icon: "🦖", description: "Te roba el tiempo con distracciones infinitas." },
  { name: "Gigante del Sueño", icon: "😴", description: "Su aura te hace querer quedarte en la cama." },
  { name: "Sombra de la Duda", icon: "👥", description: "Susurra que no eres capaz de lograrlo." },
  { name: "Titán de la Pereza", icon: "🦥", description: "Una fuerza inamovible que drena tu energía." },
  { name: "Dragón del Desorden", icon: "🐉", description: "Convierte tu vida en un caos de tareas pendientes." }
];

export const useBossStore = create<BossState>()(
  persist(
    (set, get) => ({
      currentBoss: null,
      isDefeated: false,

      initializeWeeklyBoss: (habitCount) => {
        if (get().currentBoss && !get().isDefeated) return;

        const baseBoss = BOSS_POOL[Math.floor(Math.random() * BOSS_POOL.length)];
        // Dificultad basada en el número de hábitos (ej: 100 HP por cada hábito semanal esperado)
        const difficulty = Math.max(habitCount * 7, 50); 
        
        set({
          currentBoss: {
            ...baseBoss,
            maxHp: difficulty,
            currentHp: difficulty,
            level: Math.floor(Math.random() * 5) + 1,
            rewardXP: difficulty * 5
          },
          isDefeated: false
        });
      },

      dealDamage: (amount) => {
        const boss = get().currentBoss;
        if (!boss || get().isDefeated) return;

        const newHp = Math.max(boss.currentHp - amount, 0);
        set({
          currentBoss: { ...boss, currentHp: newHp },
          isDefeated: newHp === 0
        });
      },

      resetBoss: () => set({ currentBoss: null, isDefeated: false })
    }),
    {
      name: 'grit-boss-storage',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);
