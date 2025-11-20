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
  RefreshCw,
} from "lucide-react";

const DailyPage: React.FC = () => {
  const navigate = useNavigate();
  const {
    user,
    habits,
    setHabits,
    checkins,
    setCheckins,
    currentStreak,
    setCurrentStreak,
  } = useStore();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [todayCheckins, setTodayCheckins] = useState<{
    [habitId: number]: boolean;
  }>({});
  const today = new Date().toISOString().split("T")[0]; // YYYY-MM-DD format

  // Load habits and checkins from backend
  useEffect(() => {
    const loadData = async () => {
      try {
        // Load habits if not already in store
        if (!habits || habits.length === 0) {
          console.log("📥 Fetching habits from backend...");

          const habitsResponse = await fetch("http://localhost:8000/habits", {
            method: "GET",
            credentials: "include",
            headers: {
              "Content-Type": "application/json",
            },
          });

          if (!habitsResponse.ok) {
            console.error("Failed to fetch habits");
            navigate("/onboarding");
            return;
          }

          const habitsData = await habitsResponse.json();
          console.log("✅ Habits loaded:", habitsData);

          if (!habitsData || habitsData.length === 0) {
            navigate("/onboarding");
            return;
          }

          setHabits(habitsData);
        }

        // Load today's checkins
        console.log("📥 Fetching today's checkins...");
        const checkinsResponse = await fetch(
          `http://localhost:8000/checkins/${today}`,
          {
            method: "GET",
            credentials: "include",
            headers: {
              "Content-Type": "application/json",
            },
          }
        );

        if (checkinsResponse.ok) {
          const checkinsData = await checkinsResponse.json();
          console.log("✅ Checkins loaded:", checkinsData);

          // Convert to map
          const checkinsMap: { [habitId: number]: boolean } = {};
          checkinsData.forEach((checkin: any) => {
            checkinsMap[checkin.habit_id] = checkin.completed;
          });

          setTodayCheckins(checkinsMap);
          setCheckins(today, checkinsData);
        }

        // Load stats
        const statsResponse = await fetch("http://localhost:8000/stats", {
          method: "GET",
          credentials: "include",
          headers: {
            "Content-Type": "application/json",
          },
        });

        if (statsResponse.ok) {
          const stats = await statsResponse.json();
          setCurrentStreak(stats.current_streak);
        }

        setLoading(false);
      } catch (error) {
        console.error("Error loading data:", error);
        setLoading(false);
      }
    };

    loadData();
  }, [navigate, habits, setHabits, setCheckins, today, setCurrentStreak]);

  // Toggle habit completion
  const toggleHabit = async (habitId: number) => {
    if (saving) return;

    const newValue = !todayCheckins[habitId];

    // Update UI immediately
    setTodayCheckins({
      ...todayCheckins,
      [habitId]: newValue,
    });

    setSaving(true);

    try {
      // Save to backend
      const response = await fetch("http://localhost:8000/checkins", {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          habit_id: habitId,
          date: today,
          completed: newValue,
        }),
      });

      if (!response.ok) {
        console.error("Failed to save checkin");
        // Revert on error
        setTodayCheckins({
          ...todayCheckins,
          [habitId]: !newValue,
        });
      } else {
        console.log(`✅ Checkin saved for habit ${habitId}`);
      }
    } catch (error) {
      console.error("Error saving checkin:", error);
      // Revert on error
      setTodayCheckins({
        ...todayCheckins,
        [habitId]: !newValue,
      });
    } finally {
      setSaving(false);
    }
  };

  // Calculate progress
  const completedToday = Object.values(todayCheckins).filter(Boolean).length;
  const totalHabits = habits?.length || 0;
  const progressPercentage =
    totalHabits > 0 ? (completedToday / totalHabits) * 100 : 0;

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
            <div>
              <h1 className="text-3xl font-bold">Daily Check-In</h1>
              <p className="text-slate-400">
                Welcome back, {user?.name?.split(" ")[0]}!
              </p>
            </div>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2 bg-slate-800 px-4 py-2 rounded-lg">
                <Flame className="w-6 h-6 text-orange-500" />
                <span className="text-xl font-bold">{currentStreak}</span>
                <span className="text-slate-400">days</span>
              </div>
              <div className="flex items-center gap-2 bg-slate-800 px-4 py-2 rounded-lg">
                <Trophy className="w-6 h-6 text-yellow-500" />
                <span className="text-xl font-bold">
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
          {habits.map((habit, index) => {
            const isCompleted = todayCheckins[habit.id] || false;

            return (
              <motion.div
                key={habit.id}
                initial={{ x: -50, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ delay: index * 0.1 }}
                className={`bg-slate-800 rounded-xl p-6 border-2 transition-all cursor-pointer ${
                  isCompleted
                    ? "border-green-500 bg-green-900/20"
                    : "border-slate-700 hover:border-orange-500"
                } ${saving ? "opacity-75 cursor-wait" : ""}`}
                onClick={() => toggleHabit(habit.id)}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <button className="text-2xl" disabled={saving}>
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

        {/* Saving indicator */}
        {saving && (
          <div className="fixed bottom-4 right-4 bg-slate-800 px-4 py-2 rounded-lg flex items-center gap-2">
            <RefreshCw className="w-4 h-4 animate-spin text-orange-500" />
            <span className="text-sm">Saving...</span>
          </div>
        )}

        {/* Navigation Buttons */}
        <div className="mt-8 grid grid-cols-2 gap-4">
          <button
            onClick={() => navigate("/insights")}
            className="bg-slate-800 hover:bg-slate-700 text-white py-4 rounded-lg font-semibold"
          >
            View Insights 📊
          </button>
          <button
            onClick={() => navigate("/streak")}
            className="bg-orange-500 hover:bg-orange-600 text-white py-4 rounded-lg font-semibold"
          >
            Streak Details 🔥
          </button>
        </div>
      </div>
    </div>
  );
};

export default DailyPage;
