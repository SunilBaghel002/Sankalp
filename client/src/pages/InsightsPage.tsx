// src/pages/InsightsPage.tsx
import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  TrendingUp,
  Flame,
  Trophy,
  Calendar,
  Gift,
  Target,
  Clock,
  BarChart3,
  Activity,
} from "lucide-react";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import { useStore } from "../store/useStore";
import { BottomNav } from "../components/BottomNav";

interface WeekData {
  day: string;
  completion: number;
  habits: number;
}

interface HabitPerformance {
  name: string;
  completionRate: number;
}

const InsightsPage: React.FC = () => {
  const { user, habits } = useStore();
  const [loading, setLoading] = useState(true);
  const [currentStreak, setCurrentStreak] = useState(0);
  const [longestStreak, setLongestStreak] = useState(0);
  const [totalDays, setTotalDays] = useState(0);
  const [weekData, setWeekData] = useState<WeekData[]>([]);
  const [habitPerformance, setHabitPerformance] = useState<HabitPerformance[]>(
    []
  );
  const [completionRate, setCompletionRate] = useState(0);
  const [bestDay, setBestDay] = useState("");
  const [worstDay, setWorstDay] = useState("");

  useEffect(() => {
    fetchInsightsData();
  }, []);

  const fetchInsightsData = async () => {
    try {
      setLoading(true);

      // Fetch stats
      const statsResponse = await fetch("http://localhost:8000/stats", {
        method: "GET",
        credentials: "include",
      });

      if (statsResponse.ok) {
        const stats = await statsResponse.json();
        setCurrentStreak(stats.current_streak);
        setTotalDays(stats.total_checkins / (stats.total_habits || 1));
      }

      // Fetch habits
      const habitsResponse = await fetch("http://localhost:8000/habits", {
        method: "GET",
        credentials: "include",
      });

      if (!habitsResponse.ok) {
        setLoading(false);
        return;
      }

      const habitsData = await habitsResponse.json();
      const totalHabits = habitsData.length;

      // Calculate last 7 days data
      const last7Days: WeekData[] = [];
      const today = new Date();
      const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
      const dayCompletions: { [key: string]: number[] } = {};
      const habitCompletions: { [habitId: number]: number } = {};
      let tempLongestStreak = 0;
      let currentStreakCount = 0;
      let totalCompletedDays = 0;

      // Initialize habit completions
      habitsData.forEach((habit: any) => {
        habitCompletions[habit.id] = 0;
      });

      // Fetch data for last 30 days to calculate streaks
      for (let i = 29; i >= 0; i--) {
        const checkDate = new Date(today);
        checkDate.setDate(today.getDate() - i);
        const dateStr = checkDate.toISOString().split("T")[0];
        const dayName = dayNames[checkDate.getDay()];

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

          // Track habit-specific completions
          checkinsData.forEach((checkin: any) => {
            if (checkin.completed) {
              habitCompletions[checkin.habit_id]++;
            }
          });

          // Track day-wise completions
          if (!dayCompletions[dayName]) {
            dayCompletions[dayName] = [];
          }
          dayCompletions[dayName].push(completionPercent);

          // Add to last 7 days data
          if (i < 7) {
            last7Days.unshift({
              day: dayName,
              completion: Math.round(completionPercent),
              habits: completedCount,
            });
          }

          // Calculate streaks
          if (completionPercent === 100) {
            currentStreakCount++;
            tempLongestStreak = Math.max(tempLongestStreak, currentStreakCount);
            if (i === 0) totalCompletedDays++;
          } else {
            currentStreakCount = 0;
          }
        }
      }

      setWeekData(last7Days);
      setLongestStreak(tempLongestStreak);

      // Calculate habit performance
      const habitPerf: HabitPerformance[] = habitsData.map((habit: any) => ({
        name: habit.name,
        completionRate: Math.round((habitCompletions[habit.id] / 30) * 100),
      }));
      setHabitPerformance(habitPerf);

      // Calculate overall completion rate
      const totalPossible = 30 * totalHabits;
      const totalCompleted = Object.values(habitCompletions).reduce(
        (sum: number, val: any) => sum + val,
        0
      );
      setCompletionRate(Math.round((totalCompleted / totalPossible) * 100));

      // Find best and worst days
      let bestDayName = "";
      let worstDayName = "";
      let bestAvg = 0;
      let worstAvg = 100;

      Object.entries(dayCompletions).forEach(([day, completions]) => {
        const avg = completions.reduce((a, b) => a + b, 0) / completions.length;
        if (avg > bestAvg) {
          bestAvg = avg;
          bestDayName = day;
        }
        if (avg < worstAvg) {
          worstAvg = avg;
          worstDayName = day;
        }
      });

      setBestDay(bestDayName);
      setWorstDay(worstDayName);
      setLoading(false);
    } catch (error) {
      console.error("Error fetching insights:", error);
      setLoading(false);
    }
  };

  const COLORS = ["#10b981", "#f59e0b", "#ef4444", "#3b82f6", "#8b5cf6"];

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-orange-500 mx-auto mb-4"></div>
          <p className="text-white text-lg">Analyzing your data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-900 text-white p-4 pb-24">
      <div className="max-w-4xl mx-auto">
        <motion.h1
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="text-3xl font-bold mb-6 flex items-center gap-3"
        >
          <TrendingUp className="text-orange-500" />
          Your Insights
        </motion.h1>

        {/* Key Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.1 }}
            className="bg-slate-800 p-4 rounded-xl text-center border border-slate-700"
          >
            <Flame className="w-8 h-8 text-orange-500 mx-auto mb-2" />
            <p className="text-2xl font-bold">{currentStreak}</p>
            <p className="text-xs text-slate-400">Current Streak</p>
          </motion.div>

          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2 }}
            className="bg-slate-800 p-4 rounded-xl text-center border border-slate-700"
          >
            <Trophy className="w-8 h-8 text-yellow-500 mx-auto mb-2" />
            <p className="text-2xl font-bold">{longestStreak}</p>
            <p className="text-xs text-slate-400">Best Streak</p>
          </motion.div>

          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.3 }}
            className="bg-slate-800 p-4 rounded-xl text-center border border-slate-700"
          >
            <Activity className="w-8 h-8 text-green-500 mx-auto mb-2" />
            <p className="text-2xl font-bold">{completionRate}%</p>
            <p className="text-xs text-slate-400">Completion Rate</p>
          </motion.div>

          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.4 }}
            className="bg-slate-800 p-4 rounded-xl text-center border border-slate-700"
          >
            <Calendar className="w-8 h-8 text-blue-500 mx-auto mb-2" />
            <p className="text-2xl font-bold">{Math.round(totalDays)}</p>
            <p className="text-xs text-slate-400">Total Days</p>
          </motion.div>
        </div>

        {/* Weekly Completion Chart */}
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="bg-slate-800 p-6 rounded-xl mb-6 border border-slate-700"
        >
          <h2 className="text-lg font-semibold mb-4">
            Last 7 Days Performance
          </h2>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={weekData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
              <XAxis dataKey="day" stroke="#94a3b8" />
              <YAxis stroke="#94a3b8" />
              <Tooltip
                contentStyle={{
                  backgroundColor: "#1e293b",
                  border: "none",
                  borderRadius: "8px",
                }}
              />
              <Bar dataKey="completion" fill="#f97316" radius={[8, 8, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </motion.div>

        {/* Habit Performance */}
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.6 }}
          className="bg-slate-800 p-6 rounded-xl mb-6 border border-slate-700"
        >
          <h2 className="text-lg font-semibold mb-4">
            Habit Performance (Last 30 Days)
          </h2>
          <div className="space-y-3">
            {habitPerformance.map((habit, index) => (
              <div key={index}>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-slate-300">{habit.name}</span>
                  <span className="text-orange-400">
                    {habit.completionRate}%
                  </span>
                </div>
                <div className="bg-slate-700 rounded-full h-2 overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${habit.completionRate}%` }}
                    transition={{ duration: 1, delay: 0.7 + index * 0.1 }}
                    className="h-full bg-gradient-to-r from-orange-500 to-yellow-500"
                  />
                </div>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Best & Worst Days */}
        <div className="grid grid-cols-2 gap-4 mb-6">
          <motion.div
            initial={{ x: -20, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ delay: 0.8 }}
            className="bg-green-500/10 border border-green-500/50 p-4 rounded-xl text-center"
          >
            <Target className="w-8 h-8 text-green-500 mx-auto mb-2" />
            <p className="text-sm text-green-400">Best Day</p>
            <p className="text-xl font-bold">{bestDay || "N/A"}</p>
          </motion.div>

          <motion.div
            initial={{ x: 20, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ delay: 0.9 }}
            className="bg-red-500/10 border border-red-500/50 p-4 rounded-xl text-center"
          >
            <Clock className="w-8 h-8 text-red-500 mx-auto mb-2" />
            <p className="text-sm text-red-400">Needs Work</p>
            <p className="text-xl font-bold">{worstDay || "N/A"}</p>
          </motion.div>
        </div>

        {/* Motivational Card */}
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 1 }}
          className="bg-gradient-to-br from-orange-500 to-red-500 p-6 rounded-xl text-center"
        >
          <Gift className="w-12 h-12 mx-auto mb-3" />
          <h3 className="text-xl font-bold mb-2">
            {currentStreak >= 50 ? "Champion! 🏆" : "Keep Going! 💪"}
          </h3>
          <p className="text-orange-100">
            {completionRate >= 80
              ? "You're crushing it! Top performer status!"
              : completionRate >= 60
              ? `${
                  100 - Math.round(totalDays)
                } days until full refund. Stay strong!`
              : "Every day is a new opportunity. You've got this!"}
          </p>

          {/* Progress to 100 days */}
          <div className="mt-4">
            <div className="flex justify-between text-sm mb-1">
              <span>Progress to 100 Days</span>
              <span>{Math.round(totalDays)}%</span>
            </div>
            <div className="bg-white/20 rounded-full h-2 overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${Math.min(totalDays, 100)}%` }}
                transition={{ duration: 1, delay: 1.2 }}
                className="h-full bg-white"
              />
            </div>
          </div>
        </motion.div>
      </div>
      <BottomNav />
    </div>
  );
};

export default InsightsPage;
