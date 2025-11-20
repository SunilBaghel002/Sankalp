// src/pages/DailyPage.tsx
import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { useStore } from "../store/useStore";
import {
  CheckCircle,
  Circle,
  Flame,
  Trophy,
  Calendar,
  Clock,
  Target,
} from "lucide-react";

interface HabitCheckIn {
  [habitId: string]: boolean;
}

const DailyPage: React.FC = () => {
  const navigate = useNavigate();
  const { user, habits, checkins = {}, setCheckins } = useStore();
  const [loading, setLoading] = useState(true);
  const [todayCheckins, setTodayCheckins] = useState<HabitCheckIn>({});
  const today = new Date().toDateString();

  // ✅ Initialize habits if not loaded
  useEffect(() => {
    const loadHabits = async () => {
      try {
        // If habits not in store, fetch from backend
        if (!habits || habits.length === 0) {
          console.log("📥 Fetching habits from backend...");

          const response = await fetch("http://localhost:8000/habits", {
            method: "GET",
            credentials: "include",
            headers: {
              "Content-Type": "application/json",
            },
          });

          if (!response.ok) {
            console.error("Failed to fetch habits");
            navigate("/onboarding");
            return;
          }

          const habitsData = await response.json();
          console.log("✅ Habits loaded:", habitsData);

          // Store habits in Zustand
          useStore.getState().setHabits(habitsData);
        }

        setLoading(false);
      } catch (error) {
        console.error("Error loading habits:", error);
        navigate("/onboarding");
      }
    };

    loadHabits();
  }, [habits, navigate]);

  // ✅ Load today's checkins
  useEffect(() => {
    // Safely check if checkins exists and has today's data
    if (checkins && typeof checkins === "object" && checkins[today]) {
      setTodayCheckins(checkins[today]);
    } else {
      // Initialize empty checkins for today
      setTodayCheckins({});
    }
  }, [checkins, today]);

  // ✅ Toggle habit completion
  const toggleHabit = (habitId: string) => {
    const newCheckins = {
      ...todayCheckins,
      [habitId]: !todayCheckins[habitId],
    };

    setTodayCheckins(newCheckins);

    // Update global store
    const updatedCheckins = {
      ...(checkins || {}),
      [today]: newCheckins,
    };
    setCheckins(updatedCheckins);

    // Optional: Save to backend
    saveCheckinsToBackend(habitId, !todayCheckins[habitId]);
  };

  // ✅ Save checkin to backend
  const saveCheckinsToBackend = async (habitId: string, completed: boolean) => {
    try {
      const response = await fetch("http://localhost:8000/checkins", {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          habit_id: habitId,
          date: today,
          completed: completed,
        }),
      });

      if (!response.ok) {
        console.error("Failed to save checkin");
      }
    } catch (error) {
      console.error("Error saving checkin:", error);
    }
  };

  // ✅ Calculate progress
  const completedToday = habits
    ? habits.filter((habit: any) => todayCheckins[habit.id || habit.name])
        .length
    : 0;
  const totalHabits = habits ? habits.length : 0;
  const progressPercentage =
    totalHabits > 0 ? (completedToday / totalHabits) * 100 : 0;

  // ✅ Calculate streak (simplified version)
  const calculateStreak = () => {
    if (!checkins || typeof checkins !== "object") return 0;

    let streak = 0;
    const dates = Object.keys(checkins).sort().reverse();

    for (const date of dates) {
      const dayCheckins = checkins[date];
      if (dayCheckins && typeof dayCheckins === "object") {
        const completedCount =
          Object.values(dayCheckins).filter(Boolean).length;
        if (completedCount === totalHabits) {
          streak++;
        } else {
          break;
        }
      }
    }

    return streak;
  };

  const currentStreak = calculateStreak();

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-orange-500 mx-auto mb-4"></div>
          <p className="text-white text-lg">Loading your habits...</p>
        </div>
      </div>
    );
  }

  // ✅ Handle no habits case
  if (!habits || habits.length === 0) {
    return (
      <div className="min-h-screen bg-slate-900 text-white flex items-center justify-center p-4">
        <div className="text-center">
          <Target className="w-20 h-20 text-orange-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold mb-4">No Habits Found</h2>
          <p className="text-slate-400 mb-6">
            You need to set up your habits first!
          </p>
          <button
            onClick={() => navigate("/onboarding")}
            className="bg-orange-500 hover:bg-orange-600 text-white px-6 py-3 rounded-lg font-semibold"
          >
            Set Up Habits
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-900 text-white p-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="mb-8"
        >
          <div className="flex justify-between items-center mb-4">
            <h1 className="text-3xl font-bold">Daily Check-In</h1>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <Flame className="w-6 h-6 text-orange-500" />
                <span className="text-xl font-bold">{currentStreak} days</span>
              </div>
              <div className="flex items-center gap-2">
                <Trophy className="w-6 h-6 text-yellow-500" />
                <span className="text-xl">
                  {completedToday}/{totalHabits}
                </span>
              </div>
            </div>
          </div>

          {/* Progress Bar */}
          <div className="bg-slate-800 rounded-full h-4 overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${progressPercentage}%` }}
              transition={{ duration: 0.5 }}
              className="bg-gradient-to-r from-orange-500 to-yellow-500 h-full"
            />
          </div>
          <p className="text-center mt-2 text-slate-400">
            {progressPercentage === 100
              ? "🎉 All habits completed today!"
              : `${completedToday} of ${totalHabits} habits completed`}
          </p>
        </motion.div>

        {/* Today's Date */}
        <div className="bg-slate-800 rounded-lg p-4 mb-6 flex items-center justify-center gap-2">
          <Calendar className="w-5 h-5 text-orange-500" />
          <span className="text-lg font-semibold">
            {new Date().toLocaleDateString("en-IN", {
              weekday: "long",
              year: "numeric",
              month: "long",
              day: "numeric",
            })}
          </span>
        </div>

        {/* Habits List */}
        <div className="space-y-4">
          {habits.map((habit: any, index: number) => {
            const habitId = habit.id || habit.name;
            const isCompleted = todayCheckins[habitId] || false;

            return (
              <motion.div
                key={habitId}
                initial={{ x: -50, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ delay: index * 0.1 }}
                className={`bg-slate-800 rounded-xl p-6 border-2 transition-all cursor-pointer ${
                  isCompleted
                    ? "border-green-500 bg-green-900/20"
                    : "border-slate-700 hover:border-orange-500"
                }`}
                onClick={() => toggleHabit(habitId)}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <button className="text-2xl">
                      {isCompleted ? (
                        <CheckCircle className="w-8 h-8 text-green-500" />
                      ) : (
                        <Circle className="w-8 h-8 text-slate-500" />
                      )}
                    </button>
                    <div>
                      <h3
                        className={`text-xl font-semibold ${
                          isCompleted ? "line-through text-slate-400" : ""
                        }`}
                      >
                        {habit.name}
                      </h3>
                      <p className="text-sm text-slate-400">{habit.why}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 text-slate-400">
                    <Clock className="w-4 h-4" />
                    <span className="text-sm">{habit.time}</span>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>

        {/* Navigation Buttons */}
        <div className="mt-8 flex gap-4">
          <button
            onClick={() => navigate("/insights")}
            className="flex-1 bg-slate-800 hover:bg-slate-700 text-white py-3 rounded-lg font-semibold"
          >
            View Insights 📊
          </button>
          <button
            onClick={() => navigate("/streak")}
            className="flex-1 bg-orange-500 hover:bg-orange-600 text-white py-3 rounded-lg font-semibold"
          >
            Streak Details 🔥
          </button>
        </div>

        {/* Debug Info (Development only) */}
        {import.meta.env.DEV && (
          <div className="mt-8 p-4 bg-slate-800 rounded-lg text-xs text-slate-400 border border-slate-700">
            <p className="font-semibold mb-2 text-orange-400">🔧 Debug Info:</p>
            <p>User: {user?.name}</p>
            <p>Total Habits: {totalHabits}</p>
            <p>Completed Today: {completedToday}</p>
            <p>Current Streak: {currentStreak} days</p>
            <p>Today's Date: {today}</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default DailyPage;
