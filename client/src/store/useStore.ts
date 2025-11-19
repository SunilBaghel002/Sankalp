import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { Habit, User, DailyCheckins } from "../types";

interface SankalpState {
  user: User | null;
  depositPaid: boolean;
  habits: Habit[];
  todayCheckins: DailyCheckins;
  currentStreak: number;
  longestStreak: number;
  totalDays: number;

  setUser: (user: User | null) => void;
  setDepositPaid: (paid: boolean) => void;
  setHabits: (habits: Habit[]) => void;
  checkInHabit: (habitId: number) => void;
  updateStreaks: (current: number, longest: number, total: number) => void;
  logout: () => void;
}

export const useStore = create<SankalpState>()(
  persist(
    (set) => ({
      user: null,
      depositPaid: false,
      habits: [],
      todayCheckins: {},
      currentStreak: 0,
      longestStreak: 0,
      totalDays: 0,

      setUser: (user) => set({ user }),
      setDepositPaid: (paid) => set({ depositPaid: paid }),
      setHabits: (habits) => set({ habits }),
      checkInHabit: (habitId) =>
        set((state) => ({
          todayCheckins: { ...state.todayCheckins, [habitId]: true },
        })),
      updateStreaks: (current, longest, total) =>
        set({
          currentStreak: current,
          longestStreak: longest,
          totalDays: total,
        }),
      logout: () =>
        set({
          user: null,
          depositPaid: false,
          habits: [],
          todayCheckins: {},
          currentStreak: 0,
          longestStreak: 0,
          totalDays: 0,
        }),
    }),
    {
      name: "sankalp-storage",
    }
  )
);
