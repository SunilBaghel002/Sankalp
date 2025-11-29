// src/pages/DailyPage.tsx
import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
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
  TrendingUp,
  Award,
  AlertCircle,
  ChevronRight,
  Zap,
  Menu,
  X,
  User,
  LogOut,
  Settings,
  BarChart3,
  DollarSign,
  CalendarDays,
  Sparkles,
  Star,
  Check,
  Moon,
  Sun,
  Lightbulb,
  Brain,
  PenLine,
  Save,
  BedDouble,
} from "lucide-react";
import Confetti from "react-confetti";
import { useWindowSize } from "react-use";

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
  const [todayCheckins, setTodayCheckins] = useState<{ [habitId: number]: boolean }>({});
  const [showConfetti, setShowConfetti] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const [stats, setStats] = useState({
    total_completed_days: 0,
    total_habits: 0,
    total_checkins: 0,
  });
  const [lastSevenDays, setLastSevenDays] = useState<{ date: string; completed: boolean }[]>([]);

  // New state for thought and sleep
  const [dailyThought, setDailyThought] = useState("");
  const [sleepTime, setSleepTime] = useState("");
  const [wakeTime, setWakeTime] = useState("");
  const [sleepHours, setSleepHours] = useState<number | null>(null);
  const [savingThought, setSavingThought] = useState(false);
  const [savingSleep, setSavingSleep] = useState(false);
  const [thoughtSaved, setThoughtSaved] = useState(false);
  const [sleepSaved, setSleepSaved] = useState(false);

  const today = new Date().toISOString().split("T")[0];
  const { width, height } = useWindowSize();

  // Motivational messages
  const motivationalMessages = [
    { progress: 0, message: "Let's start the day strong! 💪", color: "text-orange-400" },
    { progress: 20, message: "Great start! Keep going! 🚀", color: "text-blue-400" },
    { progress: 40, message: "You're on fire! 🔥", color: "text-orange-400" },
    { progress: 60, message: "More than halfway there! ⚡", color: "text-yellow-400" },
    { progress: 80, message: "Almost done! Finish strong! 🎯", color: "text-green-400" },
    { progress: 100, message: "Perfect day! You're unstoppable! 🏆", color: "text-green-400" },
  ];

  // Calculate sleep hours
  const calculateSleepHours = (sleep: string, wake: string): number => {
    if (!sleep || !wake) return 0;

    const [sleepH, sleepM] = sleep.split(":").map(Number);
    const [wakeH, wakeM] = wake.split(":").map(Number);

    let sleepMinutes = sleepH * 60 + sleepM;
    let wakeMinutes = wakeH * 60 + wakeM;

    // If wake time is earlier than sleep time, assume next day
    if (wakeMinutes < sleepMinutes) {
      wakeMinutes += 24 * 60;
    }

    const totalMinutes = wakeMinutes - sleepMinutes;
    return Math.round((totalMinutes / 60) * 100) / 100;
  };

  // Update sleep hours when times change
  useEffect(() => {
    if (sleepTime && wakeTime) {
      const hours = calculateSleepHours(sleepTime, wakeTime);
      setSleepHours(hours);
    }
  }, [sleepTime, wakeTime]);

  // Load habits and checkins
  useEffect(() => {
    const loadData = async () => {
      try {
        // Load habits
        if (!habits || habits.length === 0) {
          const habitsResponse = await fetch("http://localhost:8000/habits", {
            method: "GET",
            credentials: "include",
            headers: { "Content-Type": "application/json" },
          });

          if (!habitsResponse.ok) {
            navigate("/onboarding");
            return;
          }

          const habitsData = await habitsResponse.json();
          if (!habitsData || habitsData.length === 0) {
            navigate("/onboarding");
            return;
          }

          setHabits(habitsData);
        }

        // Load today's checkins
        const checkinsResponse = await fetch(`http://localhost:8000/checkins/${today}`, {
          method: "GET",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
        });

        if (checkinsResponse.ok) {
          const checkinsData = await checkinsResponse.json();
          const checkinsMap: { [habitId: number]: boolean } = {};
          checkinsData.forEach((checkin: any) => {
            checkinsMap[checkin.habit_id] = checkin.completed;
          });
          setTodayCheckins(checkinsMap);
          setCheckins(today, checkinsData);
        }

        // Load today's thought
        const thoughtResponse = await fetch(`http://localhost:8000/daily-thought/${today}`, {
          method: "GET",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
        });

        if (thoughtResponse.ok) {
          const thoughtData = await thoughtResponse.json();
          if (thoughtData && thoughtData.thought) {
            setDailyThought(thoughtData.thought);
            setThoughtSaved(true);
          }
        }

        // Load today's sleep record
        const sleepResponse = await fetch(`http://localhost:8000/sleep-record/${today}`, {
          method: "GET",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
        });

        if (sleepResponse.ok) {
          const sleepData = await sleepResponse.json();
          if (sleepData) {
            setSleepTime(sleepData.sleep_time || "");
            setWakeTime(sleepData.wake_time || "");
            setSleepHours(sleepData.sleep_hours || null);
            setSleepSaved(true);
          }
        }

        // Load stats
        const statsResponse = await fetch("http://localhost:8000/stats", {
          method: "GET",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
        });

        if (statsResponse.ok) {
          const statsData = await statsResponse.json();
          setCurrentStreak(statsData.current_streak);
          setStats(statsData);
        }

        // Load last 7 days for mini calendar
        await loadLastSevenDays();

        setLoading(false);
      } catch (error) {
        console.error("Error loading data:", error);
        setLoading(false);
      }
    };

    loadData();
  }, [navigate, habits, setHabits, setCheckins, today, setCurrentStreak]);

  // Load last 7 days data
  const loadLastSevenDays = async () => {
    const days = [];
    for (let i = 6; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split("T")[0];

      try {
        const response = await fetch(`http://localhost:8000/checkins/${dateStr}`, {
          method: "GET",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
        });

        if (response.ok) {
          const checkinsData = await response.json();
          const completed = checkinsData.length === (habits?.length || 0) &&
            checkinsData.every((c: any) => c.completed);
          days.push({ date: dateStr, completed });
        } else {
          days.push({ date: dateStr, completed: false });
        }
      } catch {
        days.push({ date: dateStr, completed: false });
      }
    }
    setLastSevenDays(days);
  };

  // Check for all habits completed
  useEffect(() => {
    const completedToday = Object.values(todayCheckins).filter(Boolean).length;
    const totalHabits = habits?.length || 0;

    if (completedToday === totalHabits && totalHabits > 0 && !showConfetti) {
      setShowConfetti(true);
      setTimeout(() => setShowConfetti(false), 5000);
    }
  }, [todayCheckins, habits]);

  // Toggle habit completion
  const toggleHabit = async (habitId: number) => {
    if (saving) return;

    const newValue = !todayCheckins[habitId];
    setTodayCheckins({ ...todayCheckins, [habitId]: newValue });
    setSaving(true);

    try {
      const response = await fetch("http://localhost:8000/checkins", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          habit_id: habitId,
          date: today,
          completed: newValue,
        }),
      });

      if (!response.ok) {
        setTodayCheckins({ ...todayCheckins, [habitId]: !newValue });
      }
    } catch (error) {
      setTodayCheckins({ ...todayCheckins, [habitId]: !newValue });
    } finally {
      setSaving(false);
    }
  };

  // Save daily thought
  const saveThought = async () => {
    if (!dailyThought.trim() || savingThought) return;

    setSavingThought(true);
    try {
      const response = await fetch("http://localhost:8000/daily-thought", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          date: today,
          thought: dailyThought.trim(),
        }),
      });

      if (response.ok) {
        setThoughtSaved(true);
        setTimeout(() => setThoughtSaved(false), 2000);
      }
    } catch (error) {
      console.error("Error saving thought:", error);
    } finally {
      setSavingThought(false);
    }
  };

  // Save sleep record
  const saveSleepRecord = async () => {
    if (!sleepTime || !wakeTime || savingSleep) return;

    setSavingSleep(true);
    try {
      const response = await fetch("http://localhost:8000/sleep-record", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          date: today,
          sleep_time: sleepTime,
          wake_time: wakeTime,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setSleepHours(data.sleep_hours);
        setSleepSaved(true);
        setTimeout(() => setSleepSaved(false), 2000);
      }
    } catch (error) {
      console.error("Error saving sleep record:", error);
    } finally {
      setSavingSleep(false);
    }
  };

  const handleLogout = () => {
    document.cookie = "access_token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
    navigate("/");
  };

  // Calculate progress
  const completedToday = Object.values(todayCheckins).filter(Boolean).length;
  const totalHabits = habits?.length || 0;
  const progressPercentage = totalHabits > 0 ? (completedToday / totalHabits) * 100 : 0;
  const daysRemaining = 100 - (stats.total_completed_days || 0);

  // Get current motivational message
  const currentMessage = [...motivationalMessages]
    .reverse()
    .find((msg) => progressPercentage >= msg.progress) || motivationalMessages[0];

  // Get sleep quality indicator
  const getSleepQuality = (hours: number | null) => {
    if (!hours) return { label: "Not tracked", color: "text-slate-400", bg: "bg-slate-700" };
    if (hours < 5) return { label: "Poor", color: "text-red-400", bg: "bg-red-900/30" };
    if (hours < 7) return { label: "Fair", color: "text-yellow-400", bg: "bg-yellow-900/30" };
    if (hours < 9) return { label: "Good", color: "text-green-400", bg: "bg-green-900/30" };
    return { label: "Excellent", color: "text-blue-400", bg: "bg-blue-900/30" };
  };

  const sleepQuality = getSleepQuality(sleepHours);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="text-center">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
            className="w-16 h-16 border-4 border-orange-500 border-t-transparent rounded-full mx-auto mb-4"
          />
          <p className="text-white text-lg">Loading your habits...</p>
        </div>
      </div>
    );
  }

  if (!habits || habits.length === 0) {
    return (
      <div className="min-h-screen bg-slate-950 text-white flex items-center justify-center p-4">
        <div className="text-center">
          <Target className="w-20 h-20 text-orange-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold mb-4">No Habits Found</h2>
          <p className="text-slate-400 mb-6">You need to set up your habits first!</p>
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
    <div className="min-h-screen bg-slate-950 text-white overflow-x-hidden">
      {/* Confetti Effect */}
      {showConfetti && <Confetti width={width - 50} height={height} recycle={false} numberOfPieces={500} />}

      {/* Header/Navbar */}
      <div className="sticky top-0 bg-slate-950/90 backdrop-blur-md border-b border-slate-800 z-40">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            {/* Logo */}
            <div className="flex items-center gap-3">
              <Flame className="w-8 h-8 text-orange-500 fill-orange-500" />
              <span className="text-xl font-bold hidden sm:block">Sankalp</span>
            </div>

            {/* Desktop Stats */}
            <div className="hidden lg:flex items-center gap-4">
              <div className="flex items-center gap-2 bg-slate-800 px-4 py-2 rounded-xl border border-slate-700">
                <Flame className="w-5 h-5 text-orange-500" />
                <span className="font-bold">{currentStreak}</span>
                <span className="text-slate-400 text-sm">day streak</span>
              </div>
              <div className="flex items-center gap-2 bg-slate-800 px-4 py-2 rounded-xl border border-slate-700">
                <Trophy className="w-5 h-5 text-yellow-500" />
                <span className="font-bold">{stats.total_completed_days}/100</span>
                <span className="text-slate-400 text-sm">days</span>
              </div>
              <div className="flex items-center gap-2 bg-slate-800 px-4 py-2 rounded-xl border border-slate-700">
                <DollarSign className="w-5 h-5 text-green-500" />
                <span className="font-bold">₹500</span>
                <span className="text-slate-400 text-sm">at stake</span>
              </div>
            </div>

            {/* User Menu */}
            <div className="relative">
              <button
                onClick={() => setShowMenu(!showMenu)}
                className="flex items-center gap-2 bg-slate-800 hover:bg-slate-700 px-4 py-2 rounded-xl border border-slate-700 transition-all"
              >
                <User className="w-5 h-5" />
                <span className="hidden sm:block">{user?.name?.split(" ")[0]}</span>
                <ChevronRight className={`w-4 h-4 transition-transform ${showMenu ? 'rotate-90' : ''}`} />
              </button>

              <AnimatePresence>
                {showMenu && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="absolute right-0 mt-2 w-56 bg-slate-800 rounded-xl border border-slate-700 shadow-2xl overflow-hidden"
                  >
                    <div className="p-4 border-b border-slate-700">
                      <p className="font-semibold">{user?.name}</p>
                      <p className="text-sm text-slate-400">{user?.email}</p>
                    </div>
                    <button
                      onClick={() => navigate("/analysis")}
                      className="w-full flex items-center gap-3 px-4 py-3 hover:bg-slate-700 transition-all"
                    >
                      <BarChart3 className="w-5 h-5 text-purple-400" />
                      <span>Analysis</span>
                    </button>
                    <button
                      onClick={() => navigate("/insights")}
                      className="w-full flex items-center gap-3 px-4 py-3 hover:bg-slate-700 transition-all"
                    >
                      <TrendingUp className="w-5 h-5 text-blue-400" />
                      <span>Insights</span>
                    </button>
                    <button
                      onClick={() => navigate("/streak")}
                      className="w-full flex items-center gap-3 px-4 py-3 hover:bg-slate-700 transition-all"
                    >
                      <Flame className="w-5 h-5 text-orange-400" />
                      <span>Streak Details</span>
                    </button>
                    <button
                      onClick={() => navigate("/settings")}
                      className="w-full flex items-center gap-3 px-4 py-3 hover:bg-slate-700 transition-all"
                    >
                      <Settings className="w-5 h-5 text-slate-400" />
                      <span>Settings</span>
                    </button>
                    <div className="border-t border-slate-700">
                      <button
                        onClick={handleLogout}
                        className="w-full flex items-center gap-3 px-4 py-3 hover:bg-red-900/20 text-red-400 transition-all"
                      >
                        <LogOut className="w-5 h-5" />
                        <span>Logout</span>
                      </button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="grid lg:grid-cols-3 gap-8">

          {/* Left Column - Main Content */}
          <div className="lg:col-span-2 space-y-6">

            {/* Welcome Section */}
            <motion.div
              initial={{ y: -20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              className="bg-gradient-to-br from-orange-500 to-red-600 rounded-3xl p-8 text-white"
            >
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h1 className="text-3xl font-bold mb-2">
                    Welcome back, {user?.name?.split(" ")[0]}! 👋
                  </h1>
                  <p className="text-orange-100 text-lg">
                    {new Date().toLocaleDateString("en-IN", {
                      weekday: "long",
                      month: "long",
                      day: "numeric",
                      year: "numeric",
                    })}
                  </p>
                </div>
                <CalendarDays className="w-16 h-16 text-orange-200" />
              </div>

              {/* Progress Ring */}
              <div className="flex items-center gap-6">
                <div className="relative">
                  <svg className="w-32 h-32 transform -rotate-90">
                    <circle
                      cx="64"
                      cy="64"
                      r="56"
                      stroke="rgba(255,255,255,0.2)"
                      strokeWidth="12"
                      fill="none"
                    />
                    <motion.circle
                      cx="64"
                      cy="64"
                      r="56"
                      stroke="white"
                      strokeWidth="12"
                      fill="none"
                      strokeLinecap="round"
                      strokeDasharray={`${2 * Math.PI * 56}`}
                      initial={{ strokeDashoffset: 2 * Math.PI * 56 }}
                      animate={{
                        strokeDashoffset: 2 * Math.PI * 56 * (1 - progressPercentage / 100),
                      }}
                      transition={{ duration: 1, ease: "easeOut" }}
                    />
                  </svg>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="text-center">
                      <div className="text-3xl font-bold">{Math.round(progressPercentage)}%</div>
                      <div className="text-xs text-orange-100">Complete</div>
                    </div>
                  </div>
                </div>

                <div className="flex-1">
                  <p className={`text-2xl font-bold mb-2 ${currentMessage.color}`}>
                    {currentMessage.message}
                  </p>
                  <p className="text-orange-100">
                    {completedToday} of {totalHabits} habits completed today
                  </p>
                </div>
              </div>
            </motion.div>

            {/* Mobile Stats Cards */}
            <div className="grid grid-cols-3 gap-4 lg:hidden">
              <div className="bg-slate-800 rounded-xl p-4 border border-slate-700">
                <Flame className="w-6 h-6 text-orange-500 mb-2" />
                <div className="text-2xl font-bold">{currentStreak}</div>
                <div className="text-xs text-slate-400">Day Streak</div>
              </div>
              <div className="bg-slate-800 rounded-xl p-4 border border-slate-700">
                <Trophy className="w-6 h-6 text-yellow-500 mb-2" />
                <div className="text-2xl font-bold">{stats.total_completed_days}</div>
                <div className="text-xs text-slate-400">Days Done</div>
              </div>
              <div className="bg-slate-800 rounded-xl p-4 border border-slate-700">
                <Target className="w-6 h-6 text-green-500 mb-2" />
                <div className="text-2xl font-bold">{daysRemaining}</div>
                <div className="text-xs text-slate-400">Remaining</div>
              </div>
            </div>

            {/* Daily Thought Section */}
            <motion.div
              initial={{ x: -50, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ delay: 0.1 }}
              className="bg-slate-800 rounded-2xl p-6 border border-slate-700"
            >
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="bg-purple-500/20 p-3 rounded-xl">
                    <Lightbulb className="w-6 h-6 text-purple-400" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold">Today's Thought</h3>
                    <p className="text-sm text-slate-400">Write one positive thought for today</p>
                  </div>
                </div>
                {thoughtSaved && (
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="flex items-center gap-2 text-green-400 text-sm"
                  >
                    <Check className="w-4 h-4" />
                    <span>Saved!</span>
                  </motion.div>
                )}
              </div>

              <div className="space-y-4">
                <textarea
                  value={dailyThought}
                  onChange={(e) => setDailyThought(e.target.value)}
                  placeholder="What's one positive thought or reflection from today? ✨"
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl p-4 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-purple-500 resize-none"
                  rows={3}
                />
                <button
                  onClick={saveThought}
                  disabled={!dailyThought.trim() || savingThought}
                  className={`flex items-center justify-center gap-2 px-6 py-3 rounded-xl font-semibold transition-all w-full sm:w-auto ${dailyThought.trim()
                      ? "bg-purple-500 hover:bg-purple-600 text-white"
                      : "bg-slate-700 text-slate-500 cursor-not-allowed"
                    }`}
                >
                  {savingThought ? (
                    <>
                      <RefreshCw className="w-5 h-5 animate-spin" />
                      <span>Saving...</span>
                    </>
                  ) : (
                    <>
                      <Save className="w-5 h-5" />
                      <span>Save Thought</span>
                    </>
                  )}
                </button>
              </div>
            </motion.div>

            {/* Sleep Tracker Section */}
            <motion.div
              initial={{ x: -50, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ delay: 0.2 }}
              className="bg-slate-800 rounded-2xl p-6 border border-slate-700"
            >
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="bg-indigo-500/20 p-3 rounded-xl">
                    <BedDouble className="w-6 h-6 text-indigo-400" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold">Sleep Tracker</h3>
                    <p className="text-sm text-slate-400">Track your sleep for better habits</p>
                  </div>
                </div>
                {sleepSaved && (
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="flex items-center gap-2 text-green-400 text-sm"
                  >
                    <Check className="w-4 h-4" />
                    <span>Saved!</span>
                  </motion.div>
                )}
              </div>

              <div className="grid sm:grid-cols-3 gap-4">
                {/* Sleep Time */}
                <div className="space-y-2">
                  <label className="flex items-center gap-2 text-sm text-slate-400">
                    <Moon className="w-4 h-4" />
                    <span>Bedtime (Last Night)</span>
                  </label>
                  <input
                    type="time"
                    value={sleepTime}
                    onChange={(e) => setSleepTime(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl p-3 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                {/* Wake Time */}
                <div className="space-y-2">
                  <label className="flex items-center gap-2 text-sm text-slate-400">
                    <Sun className="w-4 h-4" />
                    <span>Wake Up Time</span>
                  </label>
                  <input
                    type="time"
                    value={wakeTime}
                    onChange={(e) => setWakeTime(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl p-3 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                {/* Sleep Hours Display */}
                <div className="space-y-2">
                  <label className="flex items-center gap-2 text-sm text-slate-400">
                    <Clock className="w-4 h-4" />
                    <span>Total Sleep</span>
                  </label>
                  <div className={`${sleepQuality.bg} border border-slate-700 rounded-xl p-3 text-center`}>
                    <div className={`text-2xl font-bold ${sleepQuality.color}`}>
                      {sleepHours !== null ? `${sleepHours}h` : "--"}
                    </div>
                    <div className={`text-xs ${sleepQuality.color}`}>{sleepQuality.label}</div>
                  </div>
                </div>
              </div>

              <button
                onClick={saveSleepRecord}
                disabled={!sleepTime || !wakeTime || savingSleep}
                className={`mt-4 flex items-center justify-center gap-2 px-6 py-3 rounded-xl font-semibold transition-all w-full sm:w-auto ${sleepTime && wakeTime
                    ? "bg-indigo-500 hover:bg-indigo-600 text-white"
                    : "bg-slate-700 text-slate-500 cursor-not-allowed"
                  }`}
              >
                {savingSleep ? (
                  <>
                    <RefreshCw className="w-5 h-5 animate-spin" />
                    <span>Saving...</span>
                  </>
                ) : (
                  <>
                    <Save className="w-5 h-5" />
                    <span>Save Sleep Record</span>
                  </>
                )}
              </button>
            </motion.div>

            {/* Today's Habits */}
            <div>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-2xl font-bold">Today's Habits</h2>
                <div className="flex items-center gap-2 text-slate-400">
                  <Clock className="w-4 h-4" />
                  <span className="text-sm">Track your progress</span>
                </div>
              </div>

              <div className="space-y-3">
                {habits.map((habit, index) => {
                  const isCompleted = todayCheckins[habit.id] || false;
                  const habitTime = new Date(`2000-01-01T${habit.time}`);
                  const now = new Date();
                  const currentTime = new Date(`2000-01-01T${now.getHours()}:${now.getMinutes()}`);
                  const isPastDue = currentTime > habitTime && !isCompleted;

                  return (
                    <motion.div
                      key={habit.id}
                      initial={{ x: -50, opacity: 0 }}
                      animate={{ x: 0, opacity: 1 }}
                      transition={{ delay: index * 0.1 + 0.3 }}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      className={`bg-slate-800 rounded-2xl p-6 border-2 transition-all cursor-pointer ${isCompleted
                        ? "border-green-500 bg-green-900/20"
                        : isPastDue
                          ? "border-red-500/50"
                          : "border-slate-700 hover:border-orange-500"
                        } ${saving ? "opacity-75 cursor-wait" : ""}`}
                      onClick={() => toggleHabit(habit.id)}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4 flex-1">
                          <motion.div
                            animate={isCompleted ? { scale: [1, 1.2, 1] } : {}}
                            transition={{ duration: 0.3 }}
                          >
                            {isCompleted ? (
                              <CheckCircle className="w-10 h-10 text-green-500" />
                            ) : (
                              <Circle className="w-10 h-10 text-slate-500" />
                            )}
                          </motion.div>
                          <div className="flex-1">
                            <h3 className={`text-xl font-semibold mb-1 ${isCompleted ? "line-through text-slate-400" : ""
                              }`}>
                              {habit.name}
                            </h3>
                            <p className="text-sm text-slate-400 mb-2">{habit.why}</p>
                            <div className="flex items-center gap-4">
                              <div className="flex items-center gap-2 text-slate-400">
                                <Clock className="w-4 h-4" />
                                <span className="text-sm">{habit.time}</span>
                              </div>
                              {isPastDue && (
                                <div className="flex items-center gap-1 text-red-400 text-xs">
                                  <AlertCircle className="w-3 h-3" />
                                  <span>Overdue</span>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                        {isCompleted && (
                          <motion.div
                            initial={{ scale: 0, rotate: -180 }}
                            animate={{ scale: 1, rotate: 0 }}
                            className="bg-green-500 rounded-full p-2"
                          >
                            <Star className="w-6 h-6 text-white fill-white" />
                          </motion.div>
                        )}
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            </div>

            {/* Quick Actions */}
            <div className="grid md:grid-cols-2 gap-4">
              <button
                onClick={() => navigate("/analysis")}
                className="bg-slate-800 hover:bg-slate-700 border border-slate-700 p-6 rounded-2xl transition-all group"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="bg-purple-500/10 p-3 rounded-xl">
                      <BarChart3 className="w-6 h-6 text-purple-400" />
                    </div>
                    <div className="text-left">
                      <h3 className="font-semibold mb-1">View Analysis</h3>
                      <p className="text-sm text-slate-400">Thoughts, Sleep & Habits</p>
                    </div>
                  </div>
                  <ChevronRight className="w-5 h-5 text-slate-400 group-hover:text-white transition-colors" />
                </div>
              </button>
              <button
                onClick={() => navigate("/insights")}
                className="bg-slate-800 hover:bg-slate-700 border border-slate-700 p-6 rounded-2xl transition-all group"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="bg-blue-500/10 p-3 rounded-xl">
                      <TrendingUp className="w-6 h-6 text-blue-400" />
                    </div>
                    <div className="text-left">
                      <h3 className="font-semibold mb-1">View Insights</h3>
                      <p className="text-sm text-slate-400">Detailed analytics</p>
                    </div>
                  </div>
                  <ChevronRight className="w-5 h-5 text-slate-400 group-hover:text-white transition-colors" />
                </div>
              </button>
            </div>
          </div>

          {/* Right Column - Sidebar */}
          <div className="space-y-6">

            {/* Challenge Progress Card */}
            <div className="bg-slate-800 rounded-2xl p-6 border border-slate-700">
              <div className="flex items-center gap-3 mb-6">
                <Trophy className="w-6 h-6 text-yellow-500" />
                <h3 className="text-xl font-bold">100-Day Challenge</h3>
              </div>

              <div className="space-y-4">
                <div>
                  <div className="flex justify-between text-sm mb-2">
                    <span className="text-slate-400">Progress</span>
                    <span className="font-semibold">{stats.total_completed_days}/100 days</span>
                  </div>
                  <div className="bg-slate-700 rounded-full h-3 overflow-hidden">
                    <motion.div
                      className="h-full bg-gradient-to-r from-orange-500 to-yellow-500"
                      initial={{ width: 0 }}
                      animate={{ width: `${(stats.total_completed_days / 100) * 100}%` }}
                      transition={{ duration: 1 }}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-slate-900 rounded-xl p-4">
                    <div className="text-2xl font-bold text-green-400">
                      {stats.total_completed_days}
                    </div>
                    <div className="text-xs text-slate-400">Days Completed</div>
                  </div>
                  <div className="bg-slate-900 rounded-xl p-4">
                    <div className="text-2xl font-bold text-orange-400">
                      {daysRemaining}
                    </div>
                    <div className="text-xs text-slate-400">Days Remaining</div>
                  </div>
                </div>

                <div className="bg-orange-900/20 border border-orange-500/30 rounded-xl p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <DollarSign className="w-5 h-5 text-green-400" />
                    <span className="font-semibold">Money at Stake</span>
                  </div>
                  <div className="text-3xl font-bold text-green-400">₹500</div>
                  <p className="text-xs text-slate-400 mt-2">
                    Complete all 100 days to get your money back!
                  </p>
                </div>
              </div>
            </div>

            {/* Last 7 Days Mini Calendar */}
            <div className="bg-slate-800 rounded-2xl p-6 border border-slate-700">
              <div className="flex items-center gap-3 mb-4">
                <Calendar className="w-6 h-6 text-blue-400" />
                <h3 className="text-xl font-bold">Last 7 Days</h3>
              </div>

              <div className="grid grid-cols-7 gap-2">
                {lastSevenDays.map((day, index) => {
                  const date = new Date(day.date);
                  const dayName = date.toLocaleDateString("en-US", { weekday: "short" });
                  const dayNum = date.getDate();
                  const isToday = day.date === today;

                  return (
                    <div key={index} className="text-center">
                      <div className="text-xs text-slate-400 mb-2">{dayName}</div>
                      <div
                        className={`w-10 h-10 rounded-lg flex items-center justify-center text-sm font-semibold ${day.completed
                          ? "bg-green-500 text-white"
                          : isToday
                            ? "bg-orange-500 text-white"
                            : "bg-slate-700 text-slate-400"
                          }`}
                      >
                        {day.completed ? <Check className="w-5 h-5" /> : dayNum}
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="mt-4 pt-4 border-t border-slate-700">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-slate-400">Current Streak</span>
                  <div className="flex items-center gap-2">
                    <Flame className="w-5 h-5 text-orange-500" />
                    <span className="font-bold text-xl">{currentStreak}</span>
                    <span className="text-slate-400">days</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Today's Sleep Summary */}
            {sleepHours !== null && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className={`${sleepQuality.bg} rounded-2xl p-6 border border-slate-700`}
              >
                <div className="flex items-center gap-3 mb-4">
                  <Moon className={`w-6 h-6 ${sleepQuality.color}`} />
                  <h3 className="text-xl font-bold">Last Night's Sleep</h3>
                </div>
                <div className="text-center">
                  <div className={`text-4xl font-bold ${sleepQuality.color} mb-2`}>
                    {sleepHours}h
                  </div>
                  <div className={`text-sm ${sleepQuality.color}`}>{sleepQuality.label} Sleep</div>
                  <div className="text-xs text-slate-400 mt-2">
                    {sleepTime} → {wakeTime}
                  </div>
                </div>
              </motion.div>
            )}

            {/* Motivational Quote */}
            <div className="bg-gradient-to-br from-purple-900/50 to-blue-900/50 rounded-2xl p-6 border border-purple-500/30">
              <Sparkles className="w-8 h-8 text-purple-400 mb-4" />
              <blockquote className="text-lg font-medium mb-3 leading-relaxed">
                "Success is the sum of small efforts repeated day in and day out."
              </blockquote>
              <p className="text-sm text-purple-200">— Robert Collier</p>
            </div>
          </div>
        </div>
      </div>

      {/* Saving Indicator */}
      <AnimatePresence>
        {(saving || savingThought || savingSleep) && (
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 50 }}
            className="fixed bottom-4 right-4 bg-slate-800 px-4 py-3 rounded-xl flex items-center gap-3 shadow-2xl border border-slate-700"
          >
            <RefreshCw className="w-5 h-5 animate-spin text-orange-500" />
            <span className="font-medium">Saving...</span>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default DailyPage;