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
} from "lucide-react";
import { useStore } from "../store/useStore";
import { BottomNav } from "../components/BottomNav";

interface DayStatus {
  date: string;
  dayNumber: number;
  completed: boolean;
  isToday: boolean;
  isFuture: boolean;
  habitsCompleted: number;
  totalHabits: number;
}

const StreakPage: React.FC = () => {
  const { user, habits } = useStore();
  const [loading, setLoading] = useState(true);
  const [dayStatuses, setDayStatuses] = useState<DayStatus[]>([]);
  const [currentStreak, setCurrentStreak] = useState(0);
  const [longestStreak, setLongestStreak] = useState(0);
  const [totalCompletedDays, setTotalCompletedDays] = useState(0);
  const [startDate, setStartDate] = useState<Date | null>(null);

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
      const totalHabits = habitsData.length;

      // ✅ Use today as start date if user doesn't have created_at
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      // ✅ For now, use deposit paid date or today as start
      // You can also track when the user first created habits
      const userStartDate = user?.created_at
        ? new Date(user.created_at)
        : today;

      // If created_at is invalid, use today minus days that have passed
      if (isNaN(userStartDate.getTime())) {
        // Find the earliest checkin date as start date
        let earliestDate = today;

        // Try to find the earliest checkin
        for (let i = 99; i >= 0; i--) {
          const checkDate = new Date();
          checkDate.setDate(today.getDate() - i);
          const dateStr = checkDate.toISOString().split("T")[0];

          const checkinsResponse = await fetch(
            `http://localhost:8000/checkins/${dateStr}`,
            {
              method: "GET",
              credentials: "include",
            }
          );

          if (checkinsResponse.ok) {
            const checkinsData = await checkinsResponse.json();
            if (checkinsData && checkinsData.length > 0) {
              earliestDate = checkDate;
              break;
            }
          }
        }

        setStartDate(earliestDate);
      } else {
        setStartDate(userStartDate);
      }

      // Calculate all 100 days
      const allDays: DayStatus[] = [];
      let tempCurrentStreak = 0;
      let tempLongestStreak = 0;
      let currentStreakCount = 0;
      let tempTotalCompleted = 0;
      let streakBroken = false;

      // Generate 100 days starting from today (or you can adjust the logic)
      const challengeStartDate = startDate || today;

      for (let i = 0; i < 100; i++) {
        const checkDate = new Date(challengeStartDate);
        checkDate.setDate(challengeStartDate.getDate() + i);
        checkDate.setHours(0, 0, 0, 0);

        const dateStr = checkDate.toISOString().split("T")[0];
        const isToday = checkDate.toDateString() === today.toDateString();
        const isFuture = checkDate > today;

        if (!isFuture) {
          // Fetch checkins for this date
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
              const completedHabits = checkinsData.filter(
                (c: any) => c.completed
              ).length;
              const isCompleted =
                completedHabits === totalHabits && totalHabits > 0;

              allDays.push({
                date: dateStr,
                dayNumber: i + 1,
                completed: isCompleted,
                isToday,
                isFuture: false,
                habitsCompleted: completedHabits,
                totalHabits,
              });

              if (isCompleted) {
                tempTotalCompleted++;
                currentStreakCount++;
                tempLongestStreak = Math.max(
                  tempLongestStreak,
                  currentStreakCount
                );
              } else if (!isToday) {
                currentStreakCount = 0;
              }
            } else {
              allDays.push({
                date: dateStr,
                dayNumber: i + 1,
                completed: false,
                isToday,
                isFuture: false,
                habitsCompleted: 0,
                totalHabits,
              });

              if (!isToday) {
                currentStreakCount = 0;
              }
            }
          } catch (error) {
            console.error(`Error fetching checkins for ${dateStr}:`, error);
            allDays.push({
              date: dateStr,
              dayNumber: i + 1,
              completed: false,
              isToday,
              isFuture: false,
              habitsCompleted: 0,
              totalHabits,
            });
          }
        } else {
          allDays.push({
            date: dateStr,
            dayNumber: i + 1,
            completed: false,
            isToday: false,
            isFuture: true,
            habitsCompleted: 0,
            totalHabits,
          });
        }
      }

      // Get current streak from backend
      try {
        const statsResponse = await fetch("http://localhost:8000/stats", {
          method: "GET",
          credentials: "include",
        });

        if (statsResponse.ok) {
          const stats = await statsResponse.json();
          setCurrentStreak(stats.current_streak || 0);
        } else {
          // Calculate current streak from the days we have
          let streak = 0;
          for (let i = allDays.length - 1; i >= 0; i--) {
            if (allDays[i].isFuture) continue;
            if (allDays[i].completed) {
              streak++;
            } else if (!allDays[i].isToday) {
              break;
            }
          }
          setCurrentStreak(streak);
        }
      } catch (error) {
        console.error("Error fetching stats:", error);
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
    if (status.isFuture) return "bg-slate-800 border-slate-700";
    if (status.isToday) {
      if (status.completed)
        return "bg-green-500 border-green-400 animate-pulse";
      return "bg-orange-500 border-orange-400 animate-pulse";
    }
    if (status.completed) return "bg-green-500 border-green-400";
    return "bg-red-500/20 border-red-500/50";
  };

  const getDayIcon = (status: DayStatus) => {
    if (status.isFuture) return null;
    if (status.completed) return <CheckCircle className="w-3 h-3" />;
    return <XCircle className="w-3 h-3" />;
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
          <p className="text-xl text-orange-400 mb-2">Current Streak</p>
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
            <p className="text-xs text-slate-400">Days Completed</p>
          </motion.div>

          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.3 }}
            className="bg-slate-800 p-4 rounded-xl text-center border border-slate-700"
          >
            <Calendar className="w-8 h-8 text-green-500 mx-auto mb-2" />
            <p className="text-2xl font-bold">{100 - totalCompletedDays}</p>
            <p className="text-xs text-slate-400">Days Remaining</p>
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
            {startDate && (
              <div className="flex items-center gap-2 text-xs">
                <Info className="w-4 h-4 text-slate-400" />
                <span className="text-slate-400">
                  Started: {new Date().toLocaleDateString("en-IN")}
                </span>
              </div>
            )}
          </div>

          <div className="grid grid-cols-10 gap-2">
            {dayStatuses.map((status) => (
              <motion.div
                key={status.dayNumber}
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: status.dayNumber * 0.005 }}
                className={`aspect-square rounded-lg flex flex-col items-center justify-center text-xs font-bold border-2 relative ${getDayColor(
                  status
                )}`}
                title={`Day ${status.dayNumber}: ${
                  status.isFuture
                    ? "Future"
                    : status.completed
                    ? `Completed (${status.habitsCompleted}/${status.totalHabits})`
                    : `Incomplete (${status.habitsCompleted}/${status.totalHabits})`
                }`}
              >
                <span className="text-[10px]">{status.dayNumber}</span>
                {getDayIcon(status)}
                {status.isToday && (
                  <div className="absolute -top-1 -right-1 w-2 h-2 bg-yellow-400 rounded-full"></div>
                )}
              </motion.div>
            ))}
          </div>

          {/* Legend */}
          <div className="mt-6 flex items-center justify-center gap-6 text-xs">
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-green-500 rounded"></div>
              <span className="text-slate-400">Completed</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-red-500/20 border border-red-500/50 rounded"></div>
              <span className="text-slate-400">Missed</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-orange-500 rounded animate-pulse"></div>
              <span className="text-slate-400">Today</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-slate-800 rounded"></div>
              <span className="text-slate-400">Future</span>
            </div>
          </div>
        </motion.div>

        {/* Motivational Message */}
        {currentStreak > 0 && (
          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.5 }}
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
