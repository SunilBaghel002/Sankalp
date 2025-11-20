// src/store/useStore.ts
import { create } from "zustand";

interface StoreState {
  user: any | null;
  depositPaid: boolean;
  habits: any[];

  setUser: (user: any) => void;
  setDepositPaid: (paid: boolean) => void;
  setHabits: (habits: any[]) => void;
  reset: () => void;
}

export const useStore = create<StoreState>((set) => ({
  user: null,
  depositPaid: false,
  habits: [],

  setUser: (user) => set({ user }),
  setDepositPaid: (paid) => set({ depositPaid: paid }),
  setHabits: (habits) => set({ habits }),
  reset: () => set({ user: null, depositPaid: false, habits: [] }),
}));
