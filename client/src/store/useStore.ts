// src/store/useStore.ts
import { create } from "zustand";
import { persist } from "zustand/middleware";

interface Habit {
  id: number;
  user_id: number;
  name: string;
  why: string;
  time: string;
}

interface CheckIn {
  habit_id: number;
  date: string;
  completed: boolean;
}

interface User {
  id: number;
  email: string;
  name: string;
  deposit_paid: boolean;
}

interface StoreState {
  // User data
  user: User | null;
  depositPaid: boolean;

  // Habits data
  habits: Habit[];

  // Checkins data
  checkins: { [date: string]: CheckIn[] };

  // Stats
  currentStreak: number;

  // Actions
  setUser: (user: User | null) => void;
  setDepositPaid: (paid: boolean) => void;
  setHabits: (habits: Habit[]) => void;
  setCheckins: (date: string, checkins: CheckIn[]) => void;
  setCurrentStreak: (streak: number) => void;
  reset: () => void;
}

export const useStore = create<StoreState>()(
  persist(
    (set) => ({
      // Initial state
      user: null,
      depositPaid: false,
      habits: [],
      checkins: {},
      currentStreak: 0,

      // Actions
      setUser: (user) =>
        set({
          user,
          depositPaid: user?.deposit_paid || false,
        }),

      setDepositPaid: (paid) => set({ depositPaid: paid }),

      setHabits: (habits) => set({ habits }),

      setCheckins: (date, checkins) =>
        set((state) => ({
          checkins: { ...state.checkins, [date]: checkins },
        })),

      setCurrentStreak: (streak) => set({ currentStreak: streak }),

      reset: () =>
        set({
          user: null,
          depositPaid: false,
          habits: [],
          checkins: {},
          currentStreak: 0,
        }),
    }),
    {
      name: "sankalp-storage", // unique name for localStorage
      partialize: (state) => ({
        user: state.user,
        depositPaid: state.depositPaid,
      }), // Only persist user data
    }
  )
);
