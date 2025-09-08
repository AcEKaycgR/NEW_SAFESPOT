import { create } from 'zustand';
import { Plane, Hotel, MapPin, LucideIcon } from 'lucide-react';

type ItineraryItem = {
    icon: LucideIcon;
    title: string;
    date: string;
    details: string | undefined;
    type: 'flight' | 'hotel' | 'activity' | 'other';
}

type ItineraryState = {
  items: ItineraryItem[];
  addItems: (items: ItineraryItem[]) => void;
  removeItem: (title: string) => void;
};

export const useItineraryStore = create<ItineraryState>((set) => ({
  items: [],
  addItems: (newItems) => set((state) => ({ items: [...state.items, ...newItems] })),
  removeItem: (title) => set((state) => ({ items: state.items.filter(item => item.title !== title) })),
}));
