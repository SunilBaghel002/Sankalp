// src/pages/OnboardingPage.tsx
import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { useStore } from "../store/useStore";
import {
  Target,
  Clock,
  Check,
  AlertCircle,
  Flame,
  ArrowRight,
  ArrowLeft,
  Lightbulb,
  ChevronDown,
  ChevronUp,
  Zap,
  Trophy,
  CheckCircle2,
  PlayCircle
} from "lucide-react";

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
  const [currentHabitIndex, setCurrentHabitIndex] = useState(0);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [showSuggestions, setShowSuggestions] = useState(false);

  // Enhanced habit suggestions with categories
  const habitSuggestions = [
    {
      category: "🏃‍♂️ Fitness",
      habits: [
        { name: "30 minutes exercise", time: "07:00" },
        { name: "10,000 steps daily", time: "18:00" },
        { name: "20 push-ups", time: "06:30" },
        { name: "5-minute stretching", time: "08:00" },
        { name: "Yoga session (15 min)", time: "06:00" },
      ]
    },
    {
      category: "📚 Learning",
      habits: [
        { name: "Read 20 pages", time: "21:00" },
        { name: "Learn a new language (15 min)", time: "19:00" },
        { name: "Practice coding (30 min)", time: "20:00" },
        { name: "Watch educational video", time: "14:00" },
        { name: "Practice a skill (30 min)", time: "16:00" },
      ]
    },
    {
      category: "🧘‍♀️ Wellness",
      habits: [
        { name: "10-minute meditation", time: "06:00" },
        { name: "Drink 8 glasses of water", time: "09:00" },
        { name: "Write 3 gratitudes", time: "22:00" },
        { name: "No phone 1 hour before bed", time: "22:30" },
        { name: "Deep breathing (5 min)", time: "12:00" },
      ]
    },
    {
      category: "🎯 Productivity",
      habits: [
        { name: "Plan tomorrow's tasks", time: "21:30" },
        { name: "Clean desk/workspace", time: "17:00" },
        { name: "Review today's progress", time: "20:30" },
        { name: "Wake up before 7 AM", time: "06:30" },
        { name: "No social media for 2 hours", time: "09:00" },
      ]
    }
  ];

  useEffect(() => {
    const checkExistingHabits = async () => {
      try {
        const response = await fetch("http://localhost:8000/habits", {
          method: "GET",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
        });

        if (response.ok) {
          const existingHabits = await response.json();
          if (existingHabits && existingHabits.length > 0) {
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

  const updateCurrentHabit = (field: keyof LocalHabit, value: string) => {
    setLocalHabits(prev =>
      prev.map((h, index) =>
        index === currentHabitIndex ? { ...h, [field]: value } : h
      )
    );
  };

  const addSuggestionToCurrentHabit = (suggestion: any) => {
    updateCurrentHabit("name", suggestion.name);
    updateCurrentHabit("time", suggestion.time);
    setShowSuggestions(false);
  };

  const currentHabit = localHabits[currentHabitIndex];
  const isCurrentHabitComplete = currentHabit?.name.trim() && currentHabit?.why.trim();
  const completedHabits = localHabits.filter((h) => h.name.trim() && h.why.trim()).length;
  const isLastHabit = currentHabitIndex === 4;
  const allHabitsComplete = completedHabits === 5;

  const handleNext = () => {
    if (isCurrentHabitComplete && !isLastHabit) {
      setCurrentHabitIndex(prev => prev + 1);
      setShowSuggestions(false);
    }
  };

  const handlePrevious = () => {
    if (currentHabitIndex > 0) {
      setCurrentHabitIndex(prev => prev - 1);
      setShowSuggestions(false);
    }
  };

  const handleSubmit = async () => {
    if (!allHabitsComplete) return;

    setSaving(true);
    try {
      const habitsData = localHabits.map((h) => ({
        name: h.name.trim(),
        why: h.why.trim(),
        time: h.time,
      }));

      const response = await fetch("http://localhost:8000/habits", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(habitsData),
      });

      if (!response.ok) throw new Error("Failed to save habits");

      const data = await response.json();
      if (data.habits) setHabits(data.habits);

      await new Promise(resolve => setTimeout(resolve, 1000));
      navigate("/daily", { replace: true });
    } catch (error) {
      alert("Failed to save habits. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="h-screen bg-slate-950 flex items-center justify-center">
        <div className="text-center">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
            className="w-16 h-16 border-4 border-orange-500 border-t-transparent rounded-full mx-auto mb-4"
          />
          <p className="text-white text-lg">Setting up your transformation...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen bg-slate-950 text-white flex flex-col overflow-hidden">
      {/* Header */}
      <div className="flex-shrink-0 p-6 border-b border-slate-800">
        <div className="max-w-4xl mx-auto">
          {/* Logo & Title */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <Flame className="w-8 h-8 text-orange-500 fill-orange-500" />
              <span className="text-xl font-bold">Sankalp</span>
            </div>
            <div className="text-right">
              <p className="text-sm text-slate-400">Welcome back,</p>
              <p className="font-semibold text-orange-400">{user?.name?.split(" ")[0]}</p>
            </div>
          </div>

          {/* Progress Bar */}
          <div className="mb-4">
            <div className="flex items-center justify-between mb-2">
              <h1 className="text-2xl font-bold">Define Your 5 Daily Habits</h1>
              <span className="text-sm font-medium text-orange-400">
                Habit {currentHabitIndex + 1} of 5
              </span>
            </div>

            <div className="bg-slate-800 rounded-full h-2 overflow-hidden mb-4">
              <motion.div
                className="h-full bg-gradient-to-r from-orange-500 to-red-500 rounded-full"
                initial={{ width: 0 }}
                animate={{ width: `${((currentHabitIndex + (isCurrentHabitComplete ? 1 : 0)) / 5) * 100}%` }}
                transition={{ duration: 0.3 }}
              />
            </div>

            {/* Step indicators */}
            <div className="flex justify-center gap-3">
              {[0, 1, 2, 3, 4].map((index) => {
                const habit = localHabits[index];
                const isCompleted = habit?.name?.trim() && habit?.why?.trim();
                const isCurrent = index === currentHabitIndex;

                return (
                  <motion.div
                    key={index}
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: index * 0.1 }}
                    className={`w-10 h-10 rounded-full flex items-center justify-center font-bold border-2 transition-all cursor-pointer ${isCompleted
                        ? "bg-green-500 border-green-400 text-white shadow-lg shadow-green-500/25"
                        : isCurrent
                          ? "bg-orange-500 border-orange-400 text-white shadow-lg shadow-orange-500/25"
                          : "bg-slate-700 border-slate-600 text-slate-400"
                      }`}
                    onClick={() => setCurrentHabitIndex(index)}
                  >
                    {isCompleted ? <Check className="w-5 h-5" /> : index + 1}
                  </motion.div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col p-6 overflow-hidden">
        <div className="max-w-4xl mx-auto w-full flex-1 flex flex-col">

          {/* Current Habit Card */}
          <div className="flex-1 flex items-center justify-center">
            <AnimatePresence mode="wait">
              <motion.div
                key={currentHabitIndex}
                initial={{ x: 50, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                exit={{ x: -50, opacity: 0 }}
                transition={{ duration: 0.3 }}
                className="w-full max-w-2xl"
              >
                <div className="bg-slate-800 p-8 rounded-3xl border-2 border-slate-700 shadow-2xl">
                  {/* Card Header */}
                  <div className="text-center mb-8">
                    <div className={`w-16 h-16 rounded-full flex items-center justify-center font-bold mx-auto mb-4 ${isCurrentHabitComplete
                        ? "bg-green-500 shadow-lg shadow-green-500/25"
                        : "bg-gradient-to-br from-orange-500 to-red-500"
                      }`}>
                      {isCurrentHabitComplete ? (
                        <Check className="w-8 h-8 text-white" />
                      ) : (
                        <span className="text-2xl text-white">{currentHabitIndex + 1}</span>
                      )}
                    </div>
                    <h2 className="text-3xl font-bold mb-2">Habit #{currentHabitIndex + 1}</h2>
                    <p className="text-slate-400">What habit will transform your life?</p>
                  </div>

                  {/* Suggestion Button */}
                  <div className="mb-6">
                    <button
                      onClick={() => setShowSuggestions(!showSuggestions)}
                      className="w-full flex items-center justify-center gap-3 bg-slate-700 hover:bg-slate-600 px-4 py-3 rounded-xl border border-slate-600 transition-all"
                    >
                      <Lightbulb className="w-5 h-5 text-yellow-400" />
                      <span>Need inspiration? Browse ideas</span>
                      {showSuggestions ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                    </button>
                  </div>

                  {/* Suggestions Panel */}
                  <AnimatePresence>
                    {showSuggestions && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="mb-6 overflow-hidden"
                      >
                        <div className="bg-slate-700 rounded-xl p-4 max-h-40 overflow-y-auto">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            {habitSuggestions.map((category, categoryIndex) => (
                              <div key={categoryIndex}>
                                <h4 className="font-semibold mb-2 text-orange-400 text-sm">{category.category}</h4>
                                <div className="space-y-1">
                                  {category.habits.slice(0, 3).map((habit, habitIndex) => (
                                    <button
                                      key={habitIndex}
                                      onClick={() => addSuggestionToCurrentHabit(habit)}
                                      className="w-full text-left p-2 bg-slate-600 hover:bg-slate-500 rounded-lg transition-all text-sm group"
                                    >
                                      <div className="flex items-center justify-between">
                                        <span>{habit.name}</span>
                                        <span className="text-xs text-slate-400 group-hover:text-orange-400">
                                          {habit.time}
                                        </span>
                                      </div>
                                    </button>
                                  ))}
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {/* Habit Input */}
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium mb-2 text-slate-300">
                        What's your habit?
                      </label>
                      <input
                        type="text"
                        placeholder="e.g., 30 minutes exercise, Read 10 pages, Meditate"
                        value={currentHabit?.name || ""}
                        onChange={(e) => updateCurrentHabit("name", e.target.value)}
                        className="w-full bg-slate-700 px-6 py-4 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 text-lg placeholder-slate-400"
                        maxLength={50}
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium mb-2 text-slate-300">
                        Why is this important to you?
                      </label>
                      <input
                        type="text"
                        placeholder="This will help me become healthier and more disciplined..."
                        value={currentHabit?.why || ""}
                        onChange={(e) => updateCurrentHabit("why", e.target.value)}
                        className="w-full bg-slate-700 px-6 py-4 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 text-lg placeholder-slate-400"
                        maxLength={100}
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium mb-2 text-slate-300">
                        Daily reminder time
                      </label>
                      <div className="flex items-center gap-3">
                        <Clock className="w-5 h-5 text-slate-400" />
                        <input
                          type="time"
                          value={currentHabit?.time || "08:00"}
                          onChange={(e) => updateCurrentHabit("time", e.target.value)}
                          className="bg-slate-700 px-4 py-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500"
                        />
                        <span className="text-slate-400">every day</span>
                      </div>
                    </div>
                  </div>

                  {/* Validation Message */}
                  {!isCurrentHabitComplete && (currentHabit?.name || currentHabit?.why) && (
                    <div className="mt-4 p-3 bg-orange-900/20 border border-orange-500/50 rounded-xl flex items-center gap-2">
                      <AlertCircle className="w-5 h-5 text-orange-500 flex-shrink-0" />
                      <span className="text-orange-200 text-sm">
                        {!currentHabit.name.trim() ? "Please enter your habit" : "Please explain why this is important"}
                      </span>
                    </div>
                  )}
                </div>
              </motion.div>
            </AnimatePresence>
          </div>

          {/* Navigation Buttons */}
          <div className="flex-shrink-0 mt-6">
            <div className="flex items-center justify-between">
              <button
                onClick={handlePrevious}
                disabled={currentHabitIndex === 0}
                className="flex items-center gap-2 px-6 py-3 bg-slate-700 hover:bg-slate-600 disabled:bg-slate-800 disabled:text-slate-500 rounded-xl transition-all disabled:cursor-not-allowed"
              >
                <ArrowLeft className="w-5 h-5" />
                Previous
              </button>

              <div className="text-center">
                <p className="text-slate-400 text-sm">
                  {completedHabits} of 5 habits completed
                </p>
              </div>

              {isLastHabit && allHabitsComplete ? (
                <button
                  onClick={handleSubmit}
                  disabled={saving}
                  className="flex items-center gap-3 px-8 py-4 bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 disabled:from-slate-700 disabled:to-slate-700 text-white rounded-xl transition-all font-bold shadow-lg shadow-green-500/25 disabled:shadow-none"
                >
                  {saving ? (
                    <>
                      <motion.div
                        animate={{ rotate: 360 }}
                        transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                        className="w-5 h-5 border-2 border-white border-t-transparent rounded-full"
                      />
                      Saving...
                    </>
                  ) : (
                    <>
                      <PlayCircle className="w-5 h-5" />
                      Begin Journey
                    </>
                  )}
                </button>
              ) : (
                <button
                  onClick={handleNext}
                  disabled={!isCurrentHabitComplete || isLastHabit}
                  className="flex items-center gap-2 px-6 py-3 bg-orange-500 hover:bg-orange-600 disabled:bg-slate-700 disabled:text-slate-400 text-white rounded-xl transition-all disabled:cursor-not-allowed"
                >
                  Next
                  <ArrowRight className="w-5 h-5" />
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Footer Stats */}
      <div className="flex-shrink-0 bg-slate-900 border-t border-slate-800 p-4">
        <div className="max-w-4xl mx-auto flex items-center justify-center gap-8 text-center">
          <div className="flex items-center gap-2">
            <Trophy className="w-5 h-5 text-yellow-400" />
            <span className="text-sm">₹500 at stake</span>
          </div>
          <div className="flex items-center gap-2">
            <Target className="w-5 h-5 text-orange-400" />
            <span className="text-sm">100 days challenge</span>
          </div>
          <div className="flex items-center gap-2">
            <Zap className="w-5 h-5 text-blue-400" />
            <span className="text-sm">Zero tolerance</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OnboardingPage;