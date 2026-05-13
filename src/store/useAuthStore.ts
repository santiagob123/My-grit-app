import { create } from 'zustand';
import { Session } from '@supabase/supabase-js';

interface AuthState {
  session: Session | null;
  isLoading: boolean;
  setSession: (session: Session | null) => void;
  setIsLoading: (loading: boolean) => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  session: null, // Empezamos sin sesión
  isLoading: true,
  setSession: (session) => set({ session }),
  setIsLoading: (isLoading) => set({ isLoading }),
}));
