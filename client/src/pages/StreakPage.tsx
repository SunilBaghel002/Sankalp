// src/pages/StreakPage.tsx
import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  Flame,
  TrendingUp,
  Calendar,
  CheckCircle,
  XCircle,
  Info,
  Award,
  AlertCircle,
} from "lucide-react";
import { useStore } from "../store/useStore";
import { BottomNav } from "../components/BottomNav";

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
  const { user, habits } = useStore();
  const [loading, setLoading] = useState(true);
  const [dayStatuses, setDayStatuses] = useState<DayStatus[]>([]);
  const [currentStreak, setCurrentStreak] = useState(0);
  const [longestStreak, setLongestStreak] = useState(0);
  const [totalCompletedDays, setTotalCompletedDays] = useState(0);
  const [challengeStartDate, setChallengeStartDate] = useState<Date>(
    new Date()
  );

  useEffect(() => {
    fetchStreakData();
  }, []);

  const fetchStreakData = async () => {
    try {
      setLoading(true);

      // First, get stats from backend (like InsightsPage does)
      try {
        const statsResponse = await fetch("http://localhost:8000/stats", {
          method: "GET",
          credentials: "include",
        });

        if (statsResponse.ok) {
          const stats = await statsResponse.json();
          setCurrentStreak(stats.current_streak || 0);
        }
      } catch (error) {
        console.log("Stats endpoint not available, calculating locally");
      }

      // Get habits
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

      // Determine start date
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      let startDate = today;

      // Use user creation date or first habit date
      if (user?.created_at) {
        const userDate = new Date(user.created_at);
        if (!isNaN(userDate.getTime())) {
          startDate = userDate;
        }
      }

      // Check habits creation date
      if (habitsData && habitsData.length > 0) {
        for (const habit of habitsData) {
          if (habit.created_at) {
            const habitDate = new Date(habit.created_at);
            if (!isNaN(habitDate.getTime()) && habitDate < startDate) {
              startDate = habitDate;
            }
          }
        }
      }

      startDate.setHours(0, 0, 0, 0);

      // Make sure start date is not in the future
      if (startDate > today) {
        startDate = today;
      }

      setChallengeStartDate(startDate);

      // Build 100-day calendar
      const allDays: DayStatus[] = [];
      let tempLongestStreak = 0;
      let currentStreakCount = 0;
      let tempTotalCompleted = 0;
      let calculatedCurrentStreak = 0;
      let streakBrokenFromToday = false;

      // Process all 100 days
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

        if (!isFuture) {
          // Fetch checkins for this date (like InsightsPage does)
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
              const completedCount = checkinsData.filter(
                (c: any) => c.completed
              ).length;
              const completionPercent =
                totalHabits > 0 ? (completedCount / totalHabits) * 100 : 0;

              dayStatus.habitsCompleted = completedCount;
              dayStatus.completionPercentage = Math.round(completionPercent);

              // Day is complete only if ALL habits are done (100%)
              dayStatus.completed = completionPercent === 100;

              if (dayStatus.completed) {
                tempTotalCompleted++;
                currentStreakCount++;
                tempLongestStreak = Math.max(
                  tempLongestStreak,
                  currentStreakCount
                );
              } else {
                currentStreakCount = 0;
              }
            }
          } catch (error) {
            console.error(`Error fetching checkins for ${dateStr}:`, error);
          }
        }

        allDays.push(dayStatus);
      }

      // Calculate current streak from today backwards (like InsightsPage logic)
      calculatedCurrentStreak = 0;

      // Start from the most recent non-future day and work backwards
      for (let i = allDays.length - 1; i >= 0; i--) {
        if (allDays[i].isFuture) continue;

        // If we hit today and it's not complete, check if yesterday starts a streak
        if (allDays[i].isToday && !allDays[i].completed) {
          continue; // Skip today if incomplete and check previous days
        }

        if (allDays[i].completed) {
          calculatedCurrentStreak++;
        } else {
          // Hit an incomplete day, streak is broken
          break;
        }
      }

      // If we didn't get stats from backend, use our calculation
      if (currentStreak === 0) {
        setCurrentStreak(calculatedCurrentStreak);
      }

      setDayStatuses(allDays);
      setLongestStreak(tempLongestStreak);
      setTotalCompletedDays(tempTotalCompleted);
      setLoading(false);
    } catch (error) {
      console.error("Error fetching streak data:", error);
      setLoading(false);
    }
  };

  const getStreakMessage = () => {
    if (currentStreak === 0) return "Start your streak today! 💪";
    if (currentStreak < 7) return "Keep going! You're building momentum! 🚀";
    if (currentStreak < 30)
      return "Amazing progress! Keep the fire burning! 🔥";
    if (currentStreak < 50) return "Incredible! You're unstoppable! ⚡";
    if (currentStreak < 75) return "Champion mode activated! 🏆";
    if (currentStreak < 100) return "Almost there! Don't stop now! 🎯";
    return "You did it! 100 days complete! 🎉";
  };

  const getDayColor = (status: DayStatus) => {
    if (status.isFuture) return "bg-slate-800 border-slate-700 text-slate-600";

    if (status.isToday) {
      if (status.completed)
        return "bg-green-500 border-green-400 text-white animate-pulse";
      if (status.habitsCompleted > 0) {
        // Show progress for today
        if (status.completionPercentage >= 80)
          return "bg-yellow-500 border-yellow-400 text-white animate-pulse";
        if (status.completionPercentage >= 60)
          return "bg-yellow-600 border-yellow-500 text-white animate-pulse";
        if (status.completionPercentage >= 40)
          return "bg-orange-500 border-orange-400 text-white animate-pulse";
        return "bg-orange-600 border-orange-500 text-white animate-pulse";
      }
      return "bg-slate-700 border-orange-400 text-orange-200 animate-pulse";
    }

    // Past days
    if (status.completed) return "bg-green-500 border-green-400 text-white";

    if (status.habitsCompleted > 0) {
      // Partial completion colors based on percentage
      if (status.completionPercentage >= 80)
        return "bg-yellow-500/70 border-yellow-500 text-yellow-100";
      if (status.completionPercentage >= 60)
        return "bg-yellow-600/50 border-yellow-600 text-yellow-200";
      if (status.completionPercentage >= 40)
        return "bg-orange-600/40 border-orange-600 text-orange-200";
      if (status.completionPercentage >= 20)
        return "bg-red-600/30 border-red-600 text-red-200";
      return "bg-red-700/20 border-red-700 text-red-300";
    }

    // No habits completed
    return "bg-red-900/20 border-red-800/50 text-red-400";
  };

  const getDayIcon = (status: DayStatus) => {
    if (status.isFuture) return null;

    if (status.completed) {
      return <CheckCircle className="w-3 h-3 text-white" />;
    }

    if (status.habitsCompleted > 0) {
      return (
        <span className="text-[9px] font-bold">
          {status.habitsCompleted}/{status.totalHabits}
        </span>
      );
    }

    if (status.isToday) {
      return <span className="text-[9px]">0/{status.totalHabits}</span>;
    }

    return <XCircle className="w-3 h-3 opacity-60" />;
  };

  const getTooltipText = (status: DayStatus) => {
    const dateFormatted = new Date(status.date).toLocaleDateString("en-IN", {
      weekday: "short",
      day: "numeric",
      month: "short",
    });

    if (status.isFuture) {
      return `Day ${status.dayNumber} (${dateFormatted}): Future`;
    }

    if (status.completed) {
      return `Day ${status.dayNumber} (${dateFormatted}): ✅ Perfect! All ${status.totalHabits} habits completed (100%)`;
    }

    if (status.habitsCompleted > 0) {
      return `Day ${status.dayNumber} (${dateFormatted}): ⚠️ Partial - ${status.habitsCompleted}/${status.totalHabits} habits (${status.completionPercentage}%)`;
    }

    if (status.isToday) {
      return `Day ${status.dayNumber} (${dateFormatted}): 📍 Today - Complete your habits!`;
    }

    return `Day ${status.dayNumber} (${dateFormatted}): ❌ Missed - 0/${status.totalHabits} habits (0%)`;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-orange-500 mx-auto mb-4"></div>
          <p className="text-white text-lg">Loading streak data...</p>
        </div>
      </div>
    );
  }

  if (!habits || habits.length === 0) {
    return (
      <div className="min-h-screen bg-slate-900 text-white p-4 pb-24">
        <div className="max-w-4xl mx-auto text-center py-20">
          <AlertCircle className="w-20 h-20 text-orange-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold mb-4">No Habits Set</h2>
          <p className="text-slate-400 mb-6">
            Set up your 5 habits to start tracking your streak!
          </p>
        </div>
        <BottomNav />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-900 text-white p-4 pb-24">
      <div className="max-w-4xl mx-auto">
        {/* Header Stats */}
        <motion.div
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="text-center mb-8"
        >
          <div className="inline-flex items-center justify-center p-6 bg-gradient-to-br from-orange-500 to-red-600 rounded-full mb-6">
            <Flame className="w-16 h-16 text-white" />
          </div>

          <h1 className="text-5xl font-bold mb-2">
            {currentStreak} Day{currentStreak !== 1 ? "s" : ""}
          </h1>
          <p className="text-xl text-orange-400 mb-2">Current Streak 🔥</p>
          <p className="text-slate-400">{getStreakMessage()}</p>
        </motion.div>

        {/* Stats Cards */}
        <div className="grid grid-cols-3 gap-4 mb-8">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.1 }}
            className="bg-slate-800 p-4 rounded-xl text-center border border-slate-700"
          >
            <TrendingUp className="w-8 h-8 text-blue-500 mx-auto mb-2" />
            <p className="text-2xl font-bold">{longestStreak}</p>
            <p className="text-xs text-slate-400">Longest Streak</p>
          </motion.div>

          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2 }}
            className="bg-slate-800 p-4 rounded-xl text-center border border-slate-700"
          >
            <Award className="w-8 h-8 text-yellow-500 mx-auto mb-2" />
            <p className="text-2xl font-bold">{totalCompletedDays}</p>
            <p className="text-xs text-slate-400">Perfect Days</p>
          </motion.div>

          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.3 }}
            className="bg-slate-800 p-4 rounded-xl text-center border border-slate-700"
          >
            <Calendar className="w-8 h-8 text-green-500 mx-auto mb-2" />
            <p className="text-2xl font-bold">{100 - totalCompletedDays}</p>
            <p className="text-xs text-slate-400">Days Left</p>
          </motion.div>
        </div>

        {/* Calendar Grid */}
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="bg-slate-800 p-6 rounded-xl border border-slate-700"
        >
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold">
              100-Day Challenge Calendar
            </h2>
            <div className="flex items-center gap-2 text-xs">
              <Info className="w-4 h-4 text-slate-400" />
              <span className="text-slate-400">
                Day{" "}
                {Math.min(
                  Math.floor(
                    (new Date().getTime() - challengeStartDate.getTime()) /
                      (1000 * 60 * 60 * 24)
                  ) + 1,
                  100
                )}{" "}
                of 100
              </span>
            </div>
          </div>

          <div className="grid grid-cols-10 gap-2">
            {dayStatuses.map((status) => (
              <motion.div
                key={status.dayNumber}
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: Math.min(status.dayNumber * 0.003, 0.3) }}
                className={`aspect-square rounded-lg flex flex-col items-center justify-center text-xs font-bold border-2 relative cursor-pointer hover:scale-110 transition-transform ${getDayColor(
                  status
                )}`}
                title={getTooltipText(status)}
              >
                <span className="text-[10px] font-bold">
                  {status.dayNumber}
                </span>
                {getDayIcon(status)}
                {status.isToday && (
                  <div className="absolute -top-1 -right-1 w-2 h-2 bg-yellow-400 rounded-full animate-ping"></div>
                )}
              </motion.div>
            ))}
          </div>

          {/* Legend */}
          <div className="mt-6 flex flex-wrap items-center justify-center gap-3 text-xs">
            <div className="flex items-center gap-1.5">
              <div className="w-3 h-3 bg-green-500 rounded border border-green-400"></div>
              <span className="text-slate-400">Perfect (100%)</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-3 h-3 bg-yellow-500/70 rounded border border-yellow-500"></div>
              <span className="text-slate-400">Good (80%+)</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-3 h-3 bg-orange-600/40 rounded border border-orange-600"></div>
              <span className="text-slate-400">Partial (40%+)</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-3 h-3 bg-red-900/20 rounded border border-red-800/50"></div>
              <span className="text-slate-400">Missed</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-3 h-3 bg-slate-700 rounded border border-orange-400 animate-pulse"></div>
              <span className="text-slate-400">Today</span>
            </div>
          </div>
        </motion.div>

        {/* Progress Bar */}
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="mt-6 bg-slate-800 p-4 rounded-xl border border-slate-700"
        >
          <div className="flex justify-between text-sm mb-2">
            <span className="text-slate-400">Challenge Progress</span>
            <span className="text-orange-400 font-semibold">
              {totalCompletedDays} / 100 days
            </span>
          </div>
          <div className="bg-slate-700 rounded-full h-3 overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${Math.min(totalCompletedDays, 100)}%` }}
              transition={{ duration: 1, delay: 0.6 }}
              className="h-full bg-gradient-to-r from-orange-500 to-red-500"
            />
          </div>
          <p className="text-xs text-slate-500 mt-2 text-center">
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

        {/* Motivational Message */}
        {currentStreak > 0 && (
          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.7 }}
            className="mt-6 p-4 bg-gradient-to-r from-orange-500/20 to-red-500/20 rounded-xl border border-orange-500/50 text-center"
          >
            <p className="text-orange-300">
              {currentStreak >= 50
                ? "🏆 You're in the top 1% of achievers!"
                : currentStreak >= 30
                ? "⚡ You're building an unbreakable habit!"
                : currentStreak >= 7
                ? "🔥 One week strong! Keep it up!"
                : "🚀 Every day counts. You've got this!"}
            </p>
          </motion.div>
        )}
      </div>
      <BottomNav />
    </div>
  );
};

export default StreakPage;
