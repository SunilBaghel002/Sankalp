// src/pages/StreakPage.tsx
import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import {
  Flame,
  TrendingUp,
  Calendar,
  CheckCircle,
  XCircle,
  Award,
  AlertCircle,
  ArrowLeft,
  Target,
  Zap,
  Star,
  ChevronRight,
  Home,
  BarChart3,
  CalendarDays,
} from "lucide-react";
import { useStore } from "../store/useStore";

interface DayStatus {
  date: string;
  dayNumber: number;
  completed: boolean;
  isToday: boolean;
  isFuture: boolean;
  isPast: boolean;
  habitsCompleted: number;
  totalHabits: number;
  completionPercentage: number;
}

const StreakPage: React.FC = () => {
  const navigate = useNavigate();
  const { user, habits } = useStore();
  const [loading, setLoading] = useState(true);
  const [dayStatuses, setDayStatuses] = useState<DayStatus[]>([]);
  const [currentStreak, setCurrentStreak] = useState(0);
  const [longestStreak, setLongestStreak] = useState(0);
  const [totalCompletedDays, setTotalCompletedDays] = useState(0);
  const [challengeStartDate, setChallengeStartDate] = useState<Date>(new Date());
  const [selectedWeek, setSelectedWeek] = useState(0);
  const [actualDaysPassed, setActualDaysPassed] = useState(0);

  useEffect(() => {
    fetchStreakData();
  }, []);

  const fetchStreakData = async () => {
    try {
      setLoading(true);

      // Get habits first
      const habitsResponse = await fetch("http://localhost:8000/habits", {
        method: "GET",
        credentials: "include",
      });

      if (!habitsResponse.ok) {
        console.error("Failed to fetch habits");
        setLoading(false);
        return;
      }

      const habitsData = await habitsResponse.json();
      const totalHabits = habitsData.length || 0;

      if (totalHabits === 0) {
        setLoading(false);
        return;
      }

      // Determine start date (when challenge actually began)
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      let startDate = new Date(today);

      // Check user creation date
      if (user?.created_at) {
        const userDate = new Date(user.created_at);
        userDate.setHours(0, 0, 0, 0);
        if (!isNaN(userDate.getTime())) {
          startDate = userDate;
        }
      }

      // Check habits creation date (use earliest)
      if (habitsData && habitsData.length > 0) {
        for (const habit of habitsData) {
          if (habit.created_at) {
            const habitDate = new Date(habit.created_at);
            habitDate.setHours(0, 0, 0, 0);
            if (!isNaN(habitDate.getTime()) && habitDate < startDate) {
              startDate = habitDate;
            }
          }
        }
      }

      // Ensure start date is not in the future
      if (startDate > today) {
        startDate = new Date(today);
      }

      setChallengeStartDate(startDate);

      // Calculate how many days have actually passed
      const daysPassed = Math.floor((today.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)) + 1;
      setActualDaysPassed(Math.min(daysPassed, 100));

      // Build 100-day calendar
      const allDays: DayStatus[] = [];

      // First, fetch ALL data for the 100 days
      for (let i = 0; i < 100; i++) {
        const checkDate = new Date(startDate);
        checkDate.setDate(startDate.getDate() + i);
        checkDate.setHours(0, 0, 0, 0);

        const dateStr = checkDate.toISOString().split("T")[0];
        const isToday = checkDate.toDateString() === today.toDateString();
        const isFuture = checkDate > today;
        const isPast = checkDate < today;

        let dayStatus: DayStatus = {
          date: dateStr,
          dayNumber: i + 1,
          completed: false,
          isToday,
          isFuture,
          isPast,
          habitsCompleted: 0,
          totalHabits,
          completionPercentage: 0,
        };

        // Only fetch data for past and today
        if (!isFuture) {
          try {
            const checkinsResponse = await fetch(
              `http://localhost:8000/checkins/${dateStr}`,
              {
                method: "GET",
                credentials: "include",
              }
            );

            if (checkinsResponse.ok) {
              const checkinsData = await checkinsResponse.json();
              const completedCount = checkinsData.filter((c: any) => c.completed).length;
              const completionPercent = totalHabits > 0 ? (completedCount / totalHabits) * 100 : 0;

              dayStatus.habitsCompleted = completedCount;
              dayStatus.completionPercentage = Math.round(completionPercent);
              dayStatus.completed = completionPercent === 100;
            }
          } catch (error) {
            console.error(`Error fetching checkins for ${dateStr}:`, error);
          }
        }

        allDays.push(dayStatus);
      }

      // Now calculate streaks AFTER we have all the data
      let tempLongestStreak = 0;
      let tempCurrentStreak = 0;
      let tempTotalCompleted = 0;
      let streakCounter = 0;

      // Calculate longest streak (scan through all past days)
      for (let i = 0; i < allDays.length; i++) {
        if (allDays[i].isFuture) break; // Stop at future days

        if (allDays[i].completed) {
          streakCounter++;
          tempLongestStreak = Math.max(tempLongestStreak, streakCounter);
          tempTotalCompleted++;
        } else {
          streakCounter = 0;
        }
      }

      // Calculate current streak (backwards from most recent day)
      // Find the most recent non-future day
      let mostRecentIndex = -1;
      for (let i = allDays.length - 1; i >= 0; i--) {
        if (!allDays[i].isFuture) {
          mostRecentIndex = i;
          break;
        }
      }

      // Count backwards from most recent day
      if (mostRecentIndex >= 0) {
        for (let i = mostRecentIndex; i >= 0; i--) {
          if (allDays[i].completed) {
            tempCurrentStreak++;
          } else {
            break; // Streak is broken
          }
        }
      }

      setDayStatuses(allDays);
      setCurrentStreak(tempCurrentStreak);
      setLongestStreak(tempLongestStreak);
      setTotalCompletedDays(tempTotalCompleted);

      // Auto-select the current week
      const currentWeekIndex = Math.floor(mostRecentIndex / 7);
      setSelectedWeek(currentWeekIndex >= 0 ? currentWeekIndex : 0);

      setLoading(false);
    } catch (error) {
      console.error("Error fetching streak data:", error);
      setLoading(false);
    }
  };

  const getStreakMessage = () => {
    if (currentStreak === 0) return "Start your streak today! 💪";
    if (currentStreak < 7) return "Keep going! You're building momentum! 🚀";
    if (currentStreak < 30) return "Amazing progress! Keep the fire burning! 🔥";
    if (currentStreak < 50) return "Incredible! You're unstoppable! ⚡";
    if (currentStreak < 75) return "Champion mode activated! 🏆";
    if (currentStreak < 100) return "Almost there! Don't stop now! 🎯";
    return "You did it! 100 days complete! 🎉";
  };

  const getDayColor = (status: DayStatus) => {
    if (status.isFuture) return "bg-slate-800 border-slate-700 text-slate-500";

    if (status.isToday) {
      if (status.completed) return "bg-green-500 border-green-400 text-white shadow-lg shadow-green-500/50";
      if (status.habitsCompleted > 0) {
        if (status.completionPercentage >= 80) return "bg-yellow-500 border-yellow-400 text-white shadow-lg shadow-yellow-500/50";
        if (status.completionPercentage >= 60) return "bg-yellow-600 border-yellow-500 text-white";
        if (status.completionPercentage >= 40) return "bg-orange-500 border-orange-400 text-white";
        return "bg-orange-600 border-orange-500 text-white";
      }
      return "bg-slate-700 border-orange-400 text-orange-300 shadow-lg shadow-orange-500/30";
    }

    if (status.completed) return "bg-green-500 border-green-400 text-white";

    if (status.habitsCompleted > 0) {
      if (status.completionPercentage >= 80) return "bg-yellow-500/70 border-yellow-500 text-yellow-100";
      if (status.completionPercentage >= 60) return "bg-yellow-600/50 border-yellow-600 text-yellow-200";
      if (status.completionPercentage >= 40) return "bg-orange-600/40 border-orange-600 text-orange-200";
      return "bg-red-600/30 border-red-600 text-red-200";
    }

    return "bg-red-900/20 border-red-800/50 text-red-400";
  };

  const getDayIcon = (status: DayStatus) => {
    if (status.isFuture) return <span className="text-[10px]">-</span>;
    if (status.completed) return <CheckCircle className="w-3 h-3" />;
    if (status.habitsCompleted > 0) {
      return <span className="text-[9px] font-bold">{status.habitsCompleted}/{status.totalHabits}</span>;
    }
    if (status.isToday) return <span className="text-[9px]">0/{status.totalHabits}</span>;
    return <XCircle className="w-3 h-3 opacity-60" />;
  };

  const getTooltipText = (status: DayStatus) => {
    const dateFormatted = new Date(status.date).toLocaleDateString("en-IN", {
      weekday: "short",
      day: "numeric",
      month: "short",
      year: "numeric",
    });

    if (status.isFuture) return `Day ${status.dayNumber} (${dateFormatted}): Future`;
    if (status.completed) return `Day ${status.dayNumber} (${dateFormatted}): ✅ Perfect! All ${status.totalHabits} habits (100%)`;
    if (status.habitsCompleted > 0) return `Day ${status.dayNumber} (${dateFormatted}): ⚠️ ${status.habitsCompleted}/${status.totalHabits} habits (${status.completionPercentage}%)`;
    if (status.isToday) return `Day ${status.dayNumber} (${dateFormatted}): 📍 Today - Complete your habits!`;
    return `Day ${status.dayNumber} (${dateFormatted}): ❌ Missed - 0/${status.totalHabits} habits`;
  };

  const getAchievementBadges = () => {
    const badges = [];
    if (longestStreak >= 7) badges.push({ icon: "🔥", title: "Week Warrior", desc: `${longestStreak}-day best streak!` });
    if (longestStreak >= 30) badges.push({ icon: "⚡", title: "Month Master", desc: "30+ day streak!" });
    if (longestStreak >= 50) badges.push({ icon: "💪", title: "Halfway Hero", desc: "50+ day streak!" });
    if (longestStreak >= 75) badges.push({ icon: "🏆", title: "Almost There", desc: "75+ day streak!" });
    if (totalCompletedDays >= 100) badges.push({ icon: "🎉", title: "Champion", desc: "100 days complete!" });
    if (totalCompletedDays >= 50) badges.push({ icon: "🌟", title: "50 Perfect Days", desc: "Halfway to freedom!" });
    if (currentStreak >= 14) badges.push({ icon: "💎", title: "Two Weeks", desc: "14+ days current!" });
    return badges;
  };

  const getCurrentWeekDays = () => {
    const weekSize = 7;
    const totalWeeks = Math.ceil(dayStatuses.length / weekSize);
    const start = selectedWeek * weekSize;
    const end = Math.min(start + weekSize, dayStatuses.length);
    return { days: dayStatuses.slice(start, end), totalWeeks, currentWeek: selectedWeek + 1 };
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="text-center">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
            className="w-16 h-16 border-4 border-orange-500 border-t-transparent rounded-full mx-auto mb-4"
          />
          <p className="text-white text-lg">Loading streak data...</p>
        </div>
      </div>
    );
  }

  if (!habits || habits.length === 0) {
    return (
      <div className="min-h-screen bg-slate-950 text-white flex items-center justify-center p-4">
        <div className="text-center">
          <AlertCircle className="w-20 h-20 text-orange-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold mb-4">No Habits Set</h2>
          <p className="text-slate-400 mb-6">Set up your 5 habits to start tracking your streak!</p>
          <button
            onClick={() => navigate("/onboarding")}
            className="bg-orange-500 hover:bg-orange-600 px-6 py-3 rounded-xl font-semibold transition-all"
          >
            Set Up Habits
          </button>
        </div>
      </div>
    );
  }

  const weekData = getCurrentWeekDays();
  const badges = getAchievementBadges();

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      {/* Header */}
      <div className="sticky top-0 bg-slate-950/90 backdrop-blur-md border-b border-slate-800 z-40 p-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <button
            onClick={() => navigate("/daily")}
            className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
            <span>Back</span>
          </button>
          <h1 className="text-xl font-bold">Streak Tracker</h1>
          <div className="w-16"></div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto p-4 pb-20">
        {/* Hero Stats */}
        <motion.div
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="text-center mb-8"
        >
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: "spring", duration: 0.8 }}
            className="inline-flex items-center justify-center p-8 bg-gradient-to-br from-orange-500 to-red-600 rounded-full mb-6 shadow-2xl shadow-orange-500/50"
          >
            <Flame className="w-20 h-20 text-white" />
          </motion.div>

          <motion.h1
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="text-6xl font-bold mb-3"
          >
            {currentStreak} <span className="text-orange-400">Day{currentStreak !== 1 ? "s" : ""}</span>
          </motion.h1>
          <p className="text-2xl text-orange-400 mb-2">Current Streak 🔥</p>
          <p className="text-slate-400 text-lg">{getStreakMessage()}</p>
        </motion.div>

        {/* Stats Grid */}
        <div className="grid md:grid-cols-3 gap-4 mb-8">
          <motion.div
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.1 }}
            className="bg-slate-800 p-6 rounded-2xl border border-slate-700 hover:border-blue-500/50 transition-all"
          >
            <div className="flex items-center gap-4 mb-3">
              <div className="bg-blue-500/10 p-3 rounded-xl">
                <TrendingUp className="w-8 h-8 text-blue-400" />
              </div>
              <div>
                <p className="text-3xl font-bold">{longestStreak}</p>
                <p className="text-sm text-slate-400">Longest Streak</p>
              </div>
            </div>
            <p className="text-xs text-slate-500">Your best performance so far</p>
          </motion.div>

          <motion.div
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="bg-slate-800 p-6 rounded-2xl border border-slate-700 hover:border-yellow-500/50 transition-all"
          >
            <div className="flex items-center gap-4 mb-3">
              <div className="bg-yellow-500/10 p-3 rounded-xl">
                <Award className="w-8 h-8 text-yellow-400" />
              </div>
              <div>
                <p className="text-3xl font-bold">{totalCompletedDays}</p>
                <p className="text-sm text-slate-400">Perfect Days</p>
              </div>
            </div>
            <p className="text-xs text-slate-500">Days with 100% completion</p>
          </motion.div>

          <motion.div
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="bg-slate-800 p-6 rounded-2xl border border-slate-700 hover:border-green-500/50 transition-all"
          >
            <div className="flex items-center gap-4 mb-3">
              <div className="bg-green-500/10 p-3 rounded-xl">
                <Target className="w-8 h-8 text-green-400" />
              </div>
              <div>
                <p className="text-3xl font-bold">{100 - totalCompletedDays}</p>
                <p className="text-sm text-slate-400">Days Remaining</p>
              </div>
            </div>
            <p className="text-xs text-slate-500">Until challenge completion</p>
          </motion.div>
        </div>

        {/* Achievement Badges */}
        {badges.length > 0 && (
          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.4 }}
            className="bg-gradient-to-br from-purple-900/50 to-pink-900/50 rounded-2xl p-6 border border-purple-500/30 mb-8"
          >
            <div className="flex items-center gap-3 mb-4">
              <Star className="w-6 h-6 text-yellow-400" />
              <h3 className="text-xl font-bold">Achievements Unlocked</h3>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {badges.map((badge, index) => (
                <motion.div
                  key={index}
                  initial={{ scale: 0, rotate: -180 }}
                  animate={{ scale: 1, rotate: 0 }}
                  transition={{ delay: 0.5 + index * 0.1, type: "spring" }}
                  className="bg-slate-800/50 p-4 rounded-xl text-center border border-purple-500/20"
                >
                  <div className="text-4xl mb-2">{badge.icon}</div>
                  <p className="font-semibold text-sm mb-1">{badge.title}</p>
                  <p className="text-xs text-slate-400">{badge.desc}</p>
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}

        {/* Weekly View Switcher */}
        <div className="bg-slate-800 rounded-2xl p-6 border border-slate-700 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-bold">Week {weekData.currentWeek} of {weekData.totalWeeks}</h3>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setSelectedWeek(Math.max(0, selectedWeek - 1))}
                disabled={selectedWeek === 0}
                className="p-2 bg-slate-700 hover:bg-slate-600 disabled:opacity-30 disabled:cursor-not-allowed rounded-lg transition-all"
              >
                <ArrowLeft className="w-4 h-4" />
              </button>
              <button
                onClick={() => setSelectedWeek(Math.min(weekData.totalWeeks - 1, selectedWeek + 1))}
                disabled={selectedWeek === weekData.totalWeeks - 1}
                className="p-2 bg-slate-700 hover:bg-slate-600 disabled:opacity-30 disabled:cursor-not-allowed rounded-lg transition-all"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>

          <div className="grid grid-cols-7 gap-3">
            {weekData.days.map((status, index) => (
              <motion.div
                key={status.dayNumber}
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: index * 0.05 }}
                className={`aspect-square rounded-xl flex flex-col items-center justify-center border-2 relative cursor-pointer hover:scale-110 transition-all ${getDayColor(status)}`}
                title={getTooltipText(status)}
              >
                <span className="text-xs font-bold mb-1">{status.dayNumber}</span>
                {getDayIcon(status)}
                {status.isToday && (
                  <div className="absolute -top-1 -right-1 w-3 h-3 bg-yellow-400 rounded-full animate-ping"></div>
                )}
              </motion.div>
            ))}
          </div>
        </div>

        {/* Full Calendar Grid */}
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="bg-slate-800 rounded-2xl p-6 border border-slate-700 mb-6"
        >
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold">100-Day Challenge Calendar</h2>
            <div className="flex items-center gap-2 text-sm">
              <CalendarDays className="w-5 h-5 text-slate-400" />
              <span className="text-slate-400">
                Day {actualDaysPassed} of 100
              </span>
            </div>
          </div>

          <div className="grid grid-cols-10 gap-2 mb-6">
            {dayStatuses.map((status) => (
              <motion.div
                key={status.dayNumber}
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: Math.min(status.dayNumber * 0.003, 0.3) }}
                className={`aspect-square rounded-lg flex flex-col items-center justify-center text-xs font-bold border-2 relative cursor-pointer hover:scale-110 transition-transform ${getDayColor(status)}`}
                title={getTooltipText(status)}
              >
                <span className="text-[10px]">{status.dayNumber}</span>
                {getDayIcon(status)}
                {status.isToday && (
                  <div className="absolute -top-1 -right-1 w-2 h-2 bg-yellow-400 rounded-full animate-ping"></div>
                )}
              </motion.div>
            ))}
          </div>

          {/* Legend */}
          <div className="flex flex-wrap items-center justify-center gap-4 text-xs">
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-green-500 rounded border-2 border-green-400"></div>
              <span className="text-slate-400">Perfect (100%)</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-yellow-500/70 rounded border-2 border-yellow-500"></div>
              <span className="text-slate-400">Good (80%+)</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-orange-600/40 rounded border-2 border-orange-600"></div>
              <span className="text-slate-400">Partial (40%+)</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-red-900/20 rounded border-2 border-red-800/50"></div>
              <span className="text-slate-400">Missed</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-slate-700 rounded border-2 border-orange-400 shadow-lg shadow-orange-500/30"></div>
              <span className="text-slate-400">Today</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-slate-800 rounded border-2 border-slate-700"></div>
              <span className="text-slate-400">Future</span>
            </div>
          </div>
        </motion.div>

        {/* Progress Bar */}
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.6 }}
          className="bg-slate-800 rounded-2xl p-6 border border-slate-700 mb-6"
        >
          <div className="flex justify-between text-sm mb-3">
            <span className="text-slate-400">Challenge Progress</span>
            <span className="text-orange-400 font-bold text-lg">
              {totalCompletedDays} / 100 days
            </span>
          </div>
          <div className="bg-slate-700 rounded-full h-4 overflow-hidden mb-3">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${Math.min((totalCompletedDays / 100) * 100, 100)}%` }}
              transition={{ duration: 1, delay: 0.7 }}
              className="h-full bg-gradient-to-r from-orange-500 via-red-500 to-pink-500"
            />
          </div>
          <p className="text-sm text-center text-slate-400">
            {totalCompletedDays >= 100
              ? "🎉 Challenge Complete! Claim your refund!"
              : totalCompletedDays >= 75
                ? "🔥 Final stretch! Don't give up now!"
                : totalCompletedDays >= 50
                  ? "💪 Halfway there! You're doing amazing!"
                  : totalCompletedDays >= 25
                    ? "⚡ Great progress! Keep pushing!"
                    : "🚀 Every journey starts with a single step!"}
          </p>
        </motion.div>

        {/* Motivational Card */}
        {currentStreak > 0 && (
          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.7 }}
            className="bg-gradient-to-r from-orange-500/20 to-red-500/20 rounded-2xl p-6 border border-orange-500/50 text-center"
          >
            <Zap className="w-12 h-12 text-orange-400 mx-auto mb-3" />
            <p className="text-xl font-bold text-orange-300 mb-2">
              {currentStreak >= 50
                ? "🏆 You're in the top 1% of achievers!"
                : currentStreak >= 30
                  ? "⚡ You're building an unbreakable habit!"
                  : currentStreak >= 7
                    ? "🔥 One week strong! Keep it up!"
                    : "🚀 Every day counts. You've got this!"}
            </p>
            <p className="text-slate-400">
              Your dedication is paying off. Keep going!
            </p>
          </motion.div>
        )}
      </div>

      {/* Bottom Navigation */}
      <div className="fixed bottom-0 left-0 right-0 bg-slate-900/95 backdrop-blur-md border-t border-slate-800 p-4 z-50">
        <div className="max-w-7xl mx-auto flex items-center justify-around">
          <button
            onClick={() => navigate("/daily")}
            className="flex flex-col items-center gap-1 text-slate-400 hover:text-white transition-colors"
          >
            <Home className="w-6 h-6" />
            <span className="text-xs">Home</span>
          </button>
          <button
            onClick={() => navigate("/streak")}
            className="flex flex-col items-center gap-1 text-orange-400"
          >
            <Flame className="w-6 h-6" />
            <span className="text-xs font-semibold">Streak</span>
          </button>
          <button
            onClick={() => navigate("/insights")}
            className="flex flex-col items-center gap-1 text-slate-400 hover:text-white transition-colors"
          >
            <BarChart3 className="w-6 h-6" />
            <span className="text-xs">Insights</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default StreakPage;