import { create } from "zustand";

interface WhatsNewStore {
  isOpen: boolean;
  startTourSignal: number;
  open: () => void;
  close: () => void;
  startTour: () => void;
}

export const useWhatsNewStore = create<WhatsNewStore>((set) => ({
  isOpen: false,
  startTourSignal: 0,
  open: () => set({ isOpen: true }),
  close: () => set({ isOpen: false }),
  startTour: () =>
    set((state) => ({
      isOpen: false,
      startTourSignal: state.startTourSignal + 1,
    })),
}));
