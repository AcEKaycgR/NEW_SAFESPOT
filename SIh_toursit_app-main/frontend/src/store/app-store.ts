import { create } from 'zustand';

interface User {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  location?: {
    lat: number;
    lng: number;
    city: string;
  };
}

interface AppState {
  user: User | null;
  isLoading: boolean;
  currentLocation: { lat: number; lng: number } | null;
  safetyScore: number;
  sosState: 'idle' | 'pending' | 'dispatched';
  
  // Actions
  setUser: (user: User) => void;
  setLoading: (loading: boolean) => void;
  setCurrentLocation: (location: { lat: number; lng: number }) => void;
  updateSafetyScore: (score: number) => void;
  setSosState: (state: 'idle' | 'pending' | 'dispatched') => void;
}

export const useAppStore = create<AppState>((set) => ({
  user: null,
  isLoading: false,
  currentLocation: null,
  safetyScore: 85,
  sosState: 'idle',
  
  setUser: (user) => set({ user }),
  setLoading: (isLoading) => set({ isLoading }),
  setCurrentLocation: (currentLocation) => set({ currentLocation }),
  updateSafetyScore: (safetyScore) => set({ safetyScore }),
  setSosState: (sosState) => set({ sosState }),
}));