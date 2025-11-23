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
  PlayCircle,
  X,
  Sparkles
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
  const [showMobileSuggestions, setShowMobileSuggestions] = useState(false);

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
        { name: "Run for 20 minutes", time: "07:30" },
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
        { name: "Listen to podcast", time: "08:30" },
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
        { name: "Cold shower", time: "07:00" },
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
        { name: "Journal for 10 minutes", time: "21:00" },
      ]
    },
    {
      category: "🎨 Creative",
      habits: [
        { name: "Draw/sketch for 15 min", time: "19:30" },
        { name: "Write 500 words", time: "20:00" },
        { name: "Practice music (20 min)", time: "18:30" },
        { name: "Learn something new (15 min)", time: "15:00" },
        { name: "Take creative photos", time: "17:30" },
        { name: "Work on side project", time: "19:00" },
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
    setShowMobileSuggestions(false);
  };

  const currentHabit = localHabits[currentHabitIndex];
  const isCurrentHabitComplete = currentHabit?.name.trim() && currentHabit?.why.trim();
  const completedHabits = localHabits.filter((h) => h.name.trim() && h.why.trim()).length;
  const isLastHabit = currentHabitIndex === 4;
  const allHabitsComplete = completedHabits === 5;

  const handleNext = () => {
    if (isCurrentHabitComplete && !isLastHabit) {
      setCurrentHabitIndex(prev => prev + 1);
    }
  };

  const handlePrevious = () => {
    if (currentHabitIndex > 0) {
      setCurrentHabitIndex(prev => prev - 1);
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

  const SuggestionsPanel = ({ className = "" }) => (
    <div className={`bg-slate-800 rounded-2xl p-6 border border-slate-700 ${className}`}>
      <div className="flex items-center gap-3 mb-6">
        <Lightbulb className="w-6 h-6 text-yellow-400" />
        <h3 className="text-xl font-bold">Habit Ideas</h3>
        <Sparkles className="w-5 h-5 text-orange-400" />
      </div>

      <div className="space-y-6 max-h-96 overflow-y-auto pr-2 custom-scrollbar">
        {habitSuggestions.map((category, categoryIndex) => (
          <div key={categoryIndex}>
            <h4 className="font-semibold mb-3 text-orange-400 text-sm flex items-center gap-2">
              <span>{category.category}</span>
            </h4>
            <div className="space-y-2">
              {category.habits.map((habit, habitIndex) => (
                <motion.button
                  key={habitIndex}
                  onClick={() => addSuggestionToCurrentHabit(habit)}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="w-full text-left p-3 bg-slate-700 hover:bg-slate-600 rounded-xl transition-all group border border-slate-600 hover:border-orange-500/50"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium group-hover:text-orange-300">
                      {habit.name}
                    </span>
                    <span className="text-xs text-slate-400 group-hover:text-orange-400 bg-slate-600 group-hover:bg-slate-500 px-2 py-1 rounded">
                      {habit.time}
                    </span>
                  </div>
                </motion.button>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
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
    <div className="min-h-screen bg-slate-950 text-white pb-24">
      {/* Header */}
      <div className="sticky top-0 bg-slate-950/90 backdrop-blur-md border-b border-slate-800 z-40 p-6">
        <div className="max-w-7xl mx-auto">
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
              <h1 className="text-2xl lg:text-3xl font-bold">Define Your 5 Daily Habits</h1>
              <span className="text-sm font-medium text-orange-400">
                Habit {currentHabitIndex + 1} of 5
              </span>
            </div>

            <div className="bg-slate-800 rounded-full h-3 overflow-hidden mb-4">
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
                  <motion.button
                    key={index}
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: index * 0.1 }}
                    className={`w-10 h-10 rounded-full flex items-center justify-center font-bold border-2 transition-all ${isCompleted
                        ? "bg-green-500 border-green-400 text-white shadow-lg shadow-green-500/25"
                        : isCurrent
                          ? "bg-orange-500 border-orange-400 text-white shadow-lg shadow-orange-500/25"
                          : "bg-slate-700 border-slate-600 text-slate-400 hover:border-slate-500"
                      }`}
                    onClick={() => setCurrentHabitIndex(index)}
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    {isCompleted ? <Check className="w-5 h-5" /> : index + 1}
                  </motion.button>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="p-6">
        <div className="max-w-7xl mx-auto">
          <div className="flex gap-8">

            {/* Main Habit Card */}
            <div className="flex-1 max-w-2xl mx-auto lg:mx-0">
              <AnimatePresence mode="wait">
                <motion.div
                  key={currentHabitIndex}
                  initial={{ x: 50, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  exit={{ x: -50, opacity: 0 }}
                  transition={{ duration: 0.3 }}
                  className="w-full"
                >
                  <div className="bg-slate-800 p-8 rounded-3xl border-2 border-slate-700 shadow-2xl">
                    {/* Card Header */}
                    <div className="text-center mb-8">
                      <div className={`w-20 h-20 rounded-full flex items-center justify-center font-bold mx-auto mb-6 ${isCurrentHabitComplete
                          ? "bg-green-500 shadow-lg shadow-green-500/25"
                          : "bg-gradient-to-br from-orange-500 to-red-500"
                        }`}>
                        {isCurrentHabitComplete ? (
                          <Check className="w-10 h-10 text-white" />
                        ) : (
                          <span className="text-3xl text-white">{currentHabitIndex + 1}</span>
                        )}
                      </div>
                      <h2 className="text-3xl font-bold mb-3">Habit #{currentHabitIndex + 1}</h2>
                      <p className="text-slate-400 text-lg">What habit will transform your life?</p>
                    </div>

                    {/* Mobile Suggestion Button */}
                    <div className="lg:hidden mb-6">
                      <button
                        onClick={() => setShowMobileSuggestions(true)}
                        className="w-full flex items-center justify-center gap-3 bg-slate-700 hover:bg-slate-600 px-4 py-4 rounded-xl border border-slate-600 transition-all"
                      >
                        <Lightbulb className="w-5 h-5 text-yellow-400" />
                        <span className="font-medium">Browse Habit Ideas</span>
                        <Sparkles className="w-4 h-4 text-orange-400" />
                      </button>
                    </div>

                    {/* Habit Input */}
                    <div className="space-y-6">
                      <div>
                        <label className="block text-sm font-medium mb-3 text-slate-300">
                          What's your habit?
                        </label>
                        <input
                          type="text"
                          placeholder="e.g., 30 minutes exercise, Read 10 pages, Meditate"
                          value={currentHabit?.name || ""}
                          onChange={(e) => updateCurrentHabit("name", e.target.value)}
                          className="w-full bg-slate-700 px-6 py-4 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 text-lg placeholder-slate-400 border border-slate-600 focus:border-orange-500"
                          maxLength={50}
                        />
                        <p className="text-xs text-slate-500 mt-2">{currentHabit?.name?.length || 0}/50 characters</p>
                      </div>

                      <div>
                        <label className="block text-sm font-medium mb-3 text-slate-300">
                          Why is this important to you?
                        </label>
                        <textarea
                          placeholder="This will help me become healthier and more disciplined..."
                          value={currentHabit?.why || ""}
                          onChange={(e) => updateCurrentHabit("why", e.target.value)}
                          className="w-full bg-slate-700 px-6 py-4 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 text-lg placeholder-slate-400 border border-slate-600 focus:border-orange-500 resize-none h-24"
                          maxLength={100}
                        />
                        <p className="text-xs text-slate-500 mt-2">{currentHabit?.why?.length || 0}/100 characters</p>
                      </div>

                      <div>
                        <label className="block text-sm font-medium mb-3 text-slate-300">
                          Daily reminder time
                        </label>
                        <div className="flex items-center gap-4 bg-slate-700 px-6 py-4 rounded-xl border border-slate-600">
                          <Clock className="w-6 h-6 text-slate-400" />
                          <input
                            type="time"
                            value={currentHabit?.time || "08:00"}
                            onChange={(e) => updateCurrentHabit("time", e.target.value)}
                            className="bg-transparent focus:outline-none text-lg"
                          />
                          <span className="text-slate-400 ml-auto">every day</span>
                        </div>
                      </div>
                    </div>

                    {/* Validation Message */}
                    {!isCurrentHabitComplete && (currentHabit?.name || currentHabit?.why) && (
                      <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="mt-6 p-4 bg-orange-900/20 border border-orange-500/50 rounded-xl flex items-start gap-3"
                      >
                        <AlertCircle className="w-5 h-5 text-orange-500 flex-shrink-0 mt-0.5" />
                        <span className="text-orange-200 text-sm">
                          {!currentHabit.name.trim() ? "Please enter your habit" : "Please explain why this is important to you"}
                        </span>
                      </motion.div>
                    )}
                  </div>
                </motion.div>
              </AnimatePresence>
            </div>

            {/* Desktop Suggestions Panel */}
            <div className="hidden lg:block w-96 flex-shrink-0">
              <div className="sticky top-24">
                <SuggestionsPanel />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Fixed Bottom Navigation */}
      <div className="fixed bottom-0 left-0 right-0 bg-slate-900/95 backdrop-blur-md border-t border-slate-700 p-4 z-50">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
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
            <div className="flex items-center gap-2 mt-1">
              <span className="text-orange-400 font-medium text-sm">
                Habit {currentHabitIndex + 1} of 5
              </span>
            </div>
          </div>

          {isLastHabit && allHabitsComplete ? (
            <button
              onClick={handleSubmit}
              disabled={saving}
              className="flex items-center gap-3 px-8 py-3 bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 disabled:from-slate-700 disabled:to-slate-700 text-white rounded-xl transition-all font-bold shadow-lg shadow-green-500/25 disabled:shadow-none"
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

      {/* Mobile Suggestions Modal */}
      <AnimatePresence>
        {showMobileSuggestions && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 lg:hidden"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-slate-900 rounded-2xl p-6 w-full max-w-md max-h-[80vh] overflow-y-auto border border-slate-700"
            >
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <Lightbulb className="w-6 h-6 text-yellow-400" />
                  <h3 className="text-xl font-bold">Habit Ideas</h3>
                </div>
                <button
                  onClick={() => setShowMobileSuggestions(false)}
                  className="p-2 hover:bg-slate-700 rounded-lg transition-all"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-6">
                {habitSuggestions.map((category, categoryIndex) => (
                  <div key={categoryIndex}>
                    <h4 className="font-semibold mb-3 text-orange-400 text-sm">
                      {category.category}
                    </h4>
                    <div className="space-y-2">
                      {category.habits.map((habit, habitIndex) => (
                        <button
                          key={habitIndex}
                          onClick={() => addSuggestionToCurrentHabit(habit)}
                          className="w-full text-left p-3 bg-slate-700 hover:bg-slate-600 rounded-xl transition-all group border border-slate-600 hover:border-orange-500/50"
                        >
                          <div className="flex items-center justify-between">
                            <span className="text-sm font-medium group-hover:text-orange-300">
                              {habit.name}
                            </span>
                            <span className="text-xs text-slate-400 group-hover:text-orange-400 bg-slate-600 group-hover:bg-slate-500 px-2 py-1 rounded">
                              {habit.time}
                            </span>
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <style jsx>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: #334155;
          border-radius: 3px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #f97316;
          border-radius: 3px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: #ea580c;
        }
      `}</style>
    </div>
  );
};

export default OnboardingPage;