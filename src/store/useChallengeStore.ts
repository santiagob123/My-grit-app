import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useUserStore } from './useUserStore';
import { Alert } from 'react-native';

export interface Challenge {
  id: string;
  title: string;
  description: string;
  xpReward: number;
  icon: string;
}

const ALL_CHALLENGES: Challenge[] = [
  { id: '1', title: 'Ducha Glacial', description: 'Termina tu ducha con 1 minuto de agua totalmente fría.', xpReward: 50, icon: '❄️' },
  { id: '2', title: 'Fuerza Explosiva', description: 'Haz 30 flexiones de pecho (push-ups) ahora mismo.', xpReward: 40, icon: '💪' },
  { id: '3', title: 'Mente Serena', description: 'Medita en silencio total durante 5 minutos.', xpReward: 30, icon: '🧘' },
  { id: '4', title: 'Guerrero Lector', description: 'Lee al menos 5 páginas de un libro productivo.', xpReward: 30, icon: '📚' },
  { id: '5', title: 'Cero Azúcar', description: 'No consumas nada con azúcar añadida durante todo el día.', xpReward: 60, icon: '🚫' },
  { id: '6', title: 'Caminata de Poder', description: 'Camina 20 minutos al aire libre sin usar el móvil.', xpReward: 40, icon: '🚶' },
  { id: '7', title: 'Ayuno Digital', description: 'No uses redes sociales durante las próximas 3 horas.', xpReward: 50, icon: '📱' },
];

interface ChallengeState {
  currentChallenge: Challenge | null;
  lastGeneratedDate: string | null; // Formato YYYY-MM-DD
  isCompleted: boolean;
  
  generateDailyChallenge: () => void;
  completeChallenge: () => Promise<void>;
}

export const useChallengeStore = create<ChallengeState>()(
  persist(
    (set, get) => ({
      currentChallenge: null,
      lastGeneratedDate: null,
      isCompleted: false,

      generateDailyChallenge: () => {
        const today = new Date().toISOString().split('T')[0];
        const { lastGeneratedDate } = get();

        // Si ya generamos uno hoy, no hacemos nada
        if (lastGeneratedDate === today && get().currentChallenge) return;

        // Generar uno aleatorio
        const randomIndex = Math.floor(Math.random() * ALL_CHALLENGES.length);
        set({
          currentChallenge: ALL_CHALLENGES[randomIndex],
          lastGeneratedDate: today,
          isCompleted: false
        });
      },

      completeChallenge: async () => {
        if (get().isCompleted) return;

        const challenge = get().currentChallenge;
        if (challenge) {
          await useUserStore.getState().addXP(challenge.xpReward);
          set({ isCompleted: true });
          Alert.alert("¡RETO COMPLETADO! ⚔️", `Has ganado ${challenge.xpReward} XP por tu disciplina.`);
        }
      },
    }),
    {
      name: 'grit-challenges-storage',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);
