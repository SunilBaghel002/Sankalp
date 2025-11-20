// src/pages/OnboardingPage.tsx
import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { useStore } from "../store/useStore";
import { Target, Clock, Check, AlertCircle } from "lucide-react";

interface LocalHabit {
  id: number;
  name: string;
  why: string;
  time: string;
}

const OnboardingPage: React.FC = () => {
  const navigate = useNavigate();
  const { user, setHabits } = useStore();
  const [localHabits, setLocalHabits] = useState<LocalHabit[]>([]);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);

  // Check if user already has habits
  useEffect(() => {
    const checkExistingHabits = async () => {
      try {
        const response = await fetch("http://localhost:8000/habits", {
          method: "GET",
          credentials: "include",
          headers: {
            "Content-Type": "application/json",
          },
        });

        if (response.ok) {
          const existingHabits = await response.json();

          if (existingHabits && existingHabits.length > 0) {
            console.log("User already has habits, redirecting to daily page");
            setHabits(existingHabits);
            navigate("/daily", { replace: true });
            return;
          }
        }
      } catch (error) {
        console.error("Error checking existing habits:", error);
      }

      // Initialize empty habit slots
      const initialHabits = Array.from({ length: 5 }, (_, i) => ({
        id: i + 1,
        name: "",
        why: "",
        time: "08:00",
      }));
      setLocalHabits(initialHabits);
      setLoading(false);
    };

    checkExistingHabits();
  }, [navigate, setHabits]);

  const updateHabit = (id: number, field: keyof LocalHabit, value: string) => {
    setLocalHabits(
      localHabits.map((h) => (h.id === id ? { ...h, [field]: value } : h))
    );
  };

  const handleSubmit = async () => {
    const valid = localHabits.filter((h) => h.name.trim() && h.why.trim());
    if (valid.length < 5) {
      alert("Please complete all 5 habits!");
      return;
    }

    setSaving(true);

    try {
      const habitsData = valid.map((h) => ({
        name: h.name.trim(),
        why: h.why.trim(),
        time: h.time,
      }));

      console.log("📤 Sending habits data:", habitsData);

      const response = await fetch("http://localhost:8000/habits", {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(habitsData),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error("Backend response error:", response.status, errorText);

        try {
          const errorJson = JSON.parse(errorText);
          alert(
            `Failed to save habits: ${errorJson.detail || "Unknown error"}`
          );
        } catch {
          alert(`Failed to save habits: ${errorText}`);
        }

        setSaving(false);
        return;
      }

      const data = await response.json();
      console.log("✅ Habits saved successfully:", data);

      // Store the actual habits with IDs from backend
      if (data.habits) {
        setHabits(data.habits);
      }

      // Navigate to daily page
      navigate("/daily", { replace: true });
    } catch (error) {
      console.error("Error saving habits:", error);
      alert("Failed to save habits. Please try again.");
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-orange-500 mx-auto mb-4"></div>
          <p className="text-white text-lg">Setting up your habits...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-900 text-white p-4 py-8">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="text-center mb-8"
        >
          <Target className="w-16 h-16 text-orange-500 mx-auto mb-4" />
          <h1 className="text-3xl font-bold mb-2">
            Welcome {user?.name?.split(" ")[0]}! 👋
          </h1>
          <p className="text-xl mb-2">Choose Your 5 Daily Habits</p>
          <p className="text-slate-400">
            These will be your daily commitments for 100 days
          </p>
        </motion.div>

        {/* Progress indicator */}
        <div className="flex justify-center gap-2 mb-8">
          {[1, 2, 3, 4, 5].map((num) => {
            const habit = localHabits[num - 1];
            const isComplete = habit?.name?.trim() && habit?.why?.trim();
            return (
              <div
                key={num}
                className={`w-10 h-10 rounded-full flex items-center justify-center font-bold transition-all ${
                  isComplete
                    ? "bg-green-500 text-white"
                    : "bg-slate-700 text-slate-400"
                }`}
              >
                {isComplete ? <Check className="w-5 h-5" /> : num}
              </div>
            );
          })}
        </div>

        {/* Habit Cards */}
        <div className="space-y-4 mb-6">
          {localHabits.map((habit, index) => (
            <motion.div
              key={habit.id}
              initial={{ x: -50, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ delay: index * 0.1 }}
              className={`bg-slate-800 p-6 rounded-xl border-2 transition-all ${
                habit.name && habit.why
                  ? "border-green-500"
                  : "border-slate-700"
              }`}
            >
              <div className="flex items-center gap-3 mb-4">
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center font-bold ${
                    habit.name && habit.why
                      ? "bg-green-500 text-white"
                      : "bg-orange-500"
                  }`}
                >
                  {habit.name && habit.why ? (
                    <Check className="w-5 h-5" />
                  ) : (
                    index + 1
                  )}
                </div>
                <input
                  type="text"
                  placeholder="e.g., 30 min exercise, Read 10 pages"
                  value={habit.name}
                  onChange={(e) =>
                    updateHabit(habit.id, "name", e.target.value)
                  }
                  className="flex-1 bg-slate-700 px-4 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                  maxLength={50}
                />
              </div>

              <input
                type="text"
                placeholder="Why is this important to you?"
                value={habit.why}
                onChange={(e) => updateHabit(habit.id, "why", e.target.value)}
                className="w-full bg-slate-700 px-4 py-2 rounded-lg mb-3 focus:outline-none focus:ring-2 focus:ring-orange-500"
                maxLength={100}
              />

              <div className="flex items-center gap-2">
                <Clock className="w-5 h-5 text-slate-400" />
                <span className="text-slate-400">Daily reminder at:</span>
                <input
                  type="time"
                  value={habit.time}
                  onChange={(e) =>
                    updateHabit(habit.id, "time", e.target.value)
                  }
                  className="bg-slate-700 px-4 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                />
              </div>
            </motion.div>
          ))}
        </div>

        {/* Submit Button */}
        <button
          onClick={handleSubmit}
          disabled={
            localHabits.filter((h) => h.name && h.why).length < 5 || saving
          }
          className="w-full bg-orange-500 hover:bg-orange-600 disabled:bg-slate-700 disabled:cursor-not-allowed text-white py-4 rounded-lg text-lg font-bold transition-all transform hover:scale-105 disabled:scale-100"
        >
          {saving ? (
            <span className="flex items-center justify-center gap-2">
              <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-white"></div>
              Saving your habits...
            </span>
          ) : (
            `Start My 100-Day Journey 🚀`
          )}
        </button>

        {/* Helper text */}
        {localHabits.filter((h) => h.name && h.why).length < 5 && (
          <div className="mt-4 p-4 bg-orange-900/20 border border-orange-500 rounded-lg flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-orange-500 mt-0.5" />
            <p className="text-orange-200 text-sm">
              Complete {5 - localHabits.filter((h) => h.name && h.why).length}{" "}
              more habit
              {5 - localHabits.filter((h) => h.name && h.why).length > 1
                ? "s"
                : ""}{" "}
              to continue
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default OnboardingPage;
