// src/pages/OnboardingPage.tsx
import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { useStore } from "../store/useStore";
import { Target, Clock, Plus, Check } from "lucide-react";

interface LocalHabit {
  id: number;
  name: string;
  why: string;
  time: string;
}

const OnboardingPage: React.FC = () => {
  const navigate = useNavigate();
  const { user, setHabits } = useStore();
  const [localHabits, setLocalHabits] = useState<LocalHabit[]>([
    { id: 1, name: "", why: "", time: "08:00" },
  ]);
  const [saving, setSaving] = useState(false);

  // Pre-fill all 5 habit slots
  useEffect(() => {
    const initialHabits = Array.from({ length: 5 }, (_, i) => ({
      id: i + 1,
      name: "",
      why: "",
      time: "08:00",
    }));
    setLocalHabits(initialHabits);
  }, []);

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
      // Save habits to backend
      const response = await fetch("http://localhost:8000/habits", {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(
          valid.map((h) => ({
            name: h.name,
            description: h.why,
            target_time: h.time,
          }))
        ),
      });

      if (!response.ok) {
        throw new Error("Failed to save habits");
      }

      // Save to local store
      setHabits(valid as any);

      // Navigate to daily page
      navigate("/daily");
    } catch (error) {
      console.error("Error saving habits:", error);
      alert("Failed to save habits. Please try again.");
      setSaving(false);
    }
  };

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
          <p className="text-xl mb-2">Apne 5 Habits Choose Karo</p>
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
                />
              </div>

              <input
                type="text"
                placeholder="Why is this important to you?"
                value={habit.why}
                onChange={(e) => updateHabit(habit.id, "why", e.target.value)}
                className="w-full bg-slate-700 px-4 py-2 rounded-lg mb-3 focus:outline-none focus:ring-2 focus:ring-orange-500"
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
              Saving...
            </span>
          ) : (
            `Start My 100-Day Journey 🚀`
          )}
        </button>

        {/* Helper text */}
        <p className="text-center text-slate-500 text-sm mt-4">
          {5 - localHabits.filter((h) => h.name && h.why).length > 0 &&
            `Complete ${
              5 - localHabits.filter((h) => h.name && h.why).length
            } more habit${
              5 - localHabits.filter((h) => h.name && h.why).length > 1
                ? "s"
                : ""
            } to continue`}
        </p>
      </div>
    </div>
  );
};

export default OnboardingPage;
