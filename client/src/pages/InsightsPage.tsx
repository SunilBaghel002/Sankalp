// src/pages/InsightsPage.tsx
import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import {
  TrendingUp,
  Flame,
  Trophy,
  Calendar,
  Target,
  Clock,
  BarChart3,
  Activity,
  ArrowLeft,
  TrendingDown,
  Award,
  Zap,
  Star,
  CheckCircle,
  XCircle,
  AlertCircle,
  Home,
  ChevronRight,
  CalendarDays,
  Percent,
  Timer,
  Brain,
  Moon,
  Sun,
  MessageSquare,
  Lightbulb,
  Bed,
  Sunrise,
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
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  Area,
  AreaChart,
  ComposedChart,
  Legend,
} from "recharts";
import { useStore } from "../store/useStore";

interface WeekData {
  day: string;
  completion: number;
  habits: number;
  date: string;
}

interface HabitPerformance {
  name: string;
  completionRate: number;
  totalCompletions: number;
  missedDays: number;
  color: string;
}

interface SleepData {
  day: string;
  date: string;
  hours: number;
  sleep_time?: string;
  wake_time?: string;
}

interface ThoughtData {
  date: string;
  thought: string;
}

const InsightsPage: React.FC = () => {
  const navigate = useNavigate();
  const { user, habits } = useStore();
  const [loading, setLoading] = useState(true);
  const [currentStreak, setCurrentStreak] = useState(0);
  const [longestStreak, setLongestStreak] = useState(0);
  const [totalDays, setTotalDays] = useState(0);
  const [weekData, setWeekData] = useState<WeekData[]>([]);
  const [monthData, setMonthData] = useState<WeekData[]>([]);
  const [habitPerformance, setHabitPerformance] = useState<HabitPerformance[]>([]);
  const [completionRate, setCompletionRate] = useState(0);
  const [bestDay, setBestDay] = useState("");
  const [worstDay, setWorstDay] = useState("");
  const [viewPeriod, setViewPeriod] = useState<"week" | "month">("week");
  const [totalPossibleDays, setTotalPossibleDays] = useState(0);
  const [perfectDays, setPerfectDays] = useState(0);
  const [partialDays, setPartialDays] = useState(0);
  const [missedDays, setMissedDays] = useState(0);
  const [averageCompletion, setAverageCompletion] = useState(0);
  const [consistencyScore, setConsistencyScore] = useState(0);

  // New states for sleep and thoughts
  const [sleepData, setSleepData] = useState<SleepData[]>([]);
  const [averageSleep, setAverageSleep] = useState(0);
  const [bestSleepDay, setBestSleepDay] = useState<SleepData | null>(null);
  const [worstSleepDay, setWorstSleepDay] = useState<SleepData | null>(null);
  const [totalThoughts, setTotalThoughts] = useState(0);
  const [recentThoughts, setRecentThoughts] = useState<ThoughtData[]>([]);
  const [sleepGoal] = useState(8); // 8 hours sleep goal
  const [daysWithGoodSleep, setDaysWithGoodSleep] = useState(0);
  const [activeTab, setActiveTab] = useState<"overview" | "sleep" | "thoughts">("overview");

  useEffect(() => {
    fetchInsightsData();
  }, [viewPeriod]);

  const fetchInsightsData = async () => {
    try {
      setLoading(true);

      // Fetch enhanced insights from backend
      const insightsResponse = await fetch("http://localhost:8000/insights", {
        method: "GET",
        credentials: "include",
      });

      if (insightsResponse.ok) {
        const insightsData = await insightsResponse.json();
        setCurrentStreak(insightsData.current_streak || 0);
        setTotalDays(insightsData.total_completed_days || 0);
        setAverageSleep(insightsData.average_sleep || 0);
        setTotalThoughts(insightsData.total_thoughts || 0);
      }

      // Fetch stats
      const statsResponse = await fetch("http://localhost:8000/stats", {
        method: "GET",
        credentials: "include",
      });

      if (statsResponse.ok) {
        const stats = await statsResponse.json();
        setCurrentStreak(stats.current_streak);
        setLongestStreak(stats.longest_streak || 0);
        setTotalDays(stats.total_completed_days || 0);
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

      // Fetch sleep records
      const sleepResponse = await fetch("http://localhost:8000/sleep-records", {
        method: "GET",
        credentials: "include",
      });

      if (sleepResponse.ok) {
        const sleepRecords = await sleepResponse.json();
        processSleepData(sleepRecords);
      }

      // Fetch daily thoughts
      const thoughtsResponse = await fetch("http://localhost:8000/daily-thoughts", {
        method: "GET",
        credentials: "include",
      });

      if (thoughtsResponse.ok) {
        const thoughts = await thoughtsResponse.json();
        setTotalThoughts(thoughts.length);
        setRecentThoughts(thoughts.slice(0, 5));
      }

      // Calculate data based on period
      const daysToAnalyze = viewPeriod === "week" ? 7 : 30;
      const periodData: WeekData[] = [];
      const today = new Date();
      const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
      const dayCompletions: { [key: string]: number[] } = {};
      const habitCompletions: { [habitId: number]: { completed: number; total: number } } = {};

      let tempLongestStreak = 0;
      let currentStreakCount = 0;
      let tempPerfectDays = 0;
      let tempPartialDays = 0;
      let tempMissedDays = 0;
      let totalCompletionSum = 0;
      let daysWithData = 0;

      // Initialize habit completions
      habitsData.forEach((habit: any) => {
        habitCompletions[habit.id] = { completed: 0, total: 0 };
      });

      // Fetch data for the period
      for (let i = daysToAnalyze - 1; i >= 0; i--) {
        const checkDate = new Date(today);
        checkDate.setDate(today.getDate() - i);
        const dateStr = checkDate.toISOString().split("T")[0];
        const dayName = dayNames[checkDate.getDay()];
        const displayDate = checkDate.toLocaleDateString("en-US", { month: "short", day: "numeric" });

        const checkinsResponse = await fetch(
          `http://localhost:8000/checkins/${dateStr}`,
          {
            method: "GET",
            credentials: "include",
          }
        );

        let completionPercent = 0;
        let completedCount = 0;

        if (checkinsResponse.ok) {
          const checkinsData = await checkinsResponse.json();
          completedCount = checkinsData.filter((c: any) => c.completed).length;
          completionPercent = totalHabits > 0 ? (completedCount / totalHabits) * 100 : 0;

          // Track habit-specific completions
          checkinsData.forEach((checkin: any) => {
            habitCompletions[checkin.habit_id].total++;
            if (checkin.completed) {
              habitCompletions[checkin.habit_id].completed++;
            }
          });

          // Track day-wise completions
          if (!dayCompletions[dayName]) {
            dayCompletions[dayName] = [];
          }
          dayCompletions[dayName].push(completionPercent);

          // Track day types
          if (completionPercent === 100) {
            tempPerfectDays++;
            currentStreakCount++;
            tempLongestStreak = Math.max(tempLongestStreak, currentStreakCount);
          } else if (completionPercent > 0) {
            tempPartialDays++;
            currentStreakCount = 0;
          } else {
            tempMissedDays++;
            currentStreakCount = 0;
          }

          totalCompletionSum += completionPercent;
          daysWithData++;
        }

        periodData.push({
          day: viewPeriod === "week" ? dayName : displayDate,
          completion: Math.round(completionPercent),
          habits: completedCount,
          date: dateStr,
        });
      }

      setWeekData(periodData);
      setMonthData(periodData);
      setLongestStreak(Math.max(tempLongestStreak, longestStreak));
      setPerfectDays(tempPerfectDays);
      setPartialDays(tempPartialDays);
      setMissedDays(tempMissedDays);
      setTotalPossibleDays(daysToAnalyze);
      setAverageCompletion(daysWithData > 0 ? Math.round(totalCompletionSum / daysWithData) : 0);

      // Calculate consistency score (0-100)
      const consistency = tempPerfectDays / daysToAnalyze * 100;
      setConsistencyScore(Math.round(consistency));

      // Calculate habit performance
      const HABIT_COLORS = ["#10b981", "#f59e0b", "#ef4444", "#3b82f6", "#8b5cf6"];
      const habitPerf: HabitPerformance[] = habitsData.map((habit: any, index: number) => {
        const stats = habitCompletions[habit.id];
        const rate = stats.total > 0 ? Math.round((stats.completed / stats.total) * 100) : 0;
        return {
          name: habit.name,
          completionRate: rate,
          totalCompletions: stats.completed,
          missedDays: stats.total - stats.completed,
          color: HABIT_COLORS[index % HABIT_COLORS.length],
        };
      });
      setHabitPerformance(habitPerf);

      // Calculate overall completion rate
      const totalPossible = daysToAnalyze * totalHabits;
      const totalCompleted = Object.values(habitCompletions).reduce(
        (sum, val) => sum + val.completed,
        0
      );
      setCompletionRate(totalPossible > 0 ? Math.round((totalCompleted / totalPossible) * 100) : 0);

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

  const processSleepData = (sleepRecords: any[]) => {
    const daysToAnalyze = viewPeriod === "week" ? 7 : 30;
    const today = new Date();
    const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
    const processedData: SleepData[] = [];

    // Create a map of sleep records by date
    const sleepByDate: { [key: string]: any } = {};
    sleepRecords.forEach((record: any) => {
      sleepByDate[record.date] = record;
    });

    let totalSleepHours = 0;
    let daysWithSleep = 0;
    let goodSleepDays = 0;
    let bestSleep: SleepData | null = null;
    let worstSleep: SleepData | null = null;

    for (let i = daysToAnalyze - 1; i >= 0; i--) {
      const checkDate = new Date(today);
      checkDate.setDate(today.getDate() - i);
      const dateStr = checkDate.toISOString().split("T")[0];
      const dayName = dayNames[checkDate.getDay()];
      const displayDate = viewPeriod === "week"
        ? dayName
        : checkDate.toLocaleDateString("en-US", { month: "short", day: "numeric" });

      const record = sleepByDate[dateStr];
      const hours = record?.sleep_hours || 0;

      const sleepDataPoint: SleepData = {
        day: displayDate,
        date: dateStr,
        hours: hours,
        sleep_time: record?.sleep_time,
        wake_time: record?.wake_time,
      };

      processedData.push(sleepDataPoint);

      if (hours > 0) {
        totalSleepHours += hours;
        daysWithSleep++;

        if (hours >= 7) {
          goodSleepDays++;
        }

        if (!bestSleep || hours > bestSleep.hours) {
          bestSleep = sleepDataPoint;
        }
        if (!worstSleep || (hours < worstSleep.hours && hours > 0)) {
          worstSleep = sleepDataPoint;
        }
      }
    }

    setSleepData(processedData);
    setAverageSleep(daysWithSleep > 0 ? Math.round((totalSleepHours / daysWithSleep) * 10) / 10 : 0);
    setDaysWithGoodSleep(goodSleepDays);
    setBestSleepDay(bestSleep);
    setWorstSleepDay(worstSleep);
  };

  const getPerformanceLevel = (rate: number) => {
    if (rate >= 90) return { label: "Excellent", color: "text-green-400", bg: "bg-green-500/10", border: "border-green-500/30" };
    if (rate >= 75) return { label: "Good", color: "text-blue-400", bg: "bg-blue-500/10", border: "border-blue-500/30" };
    if (rate >= 60) return { label: "Fair", color: "text-yellow-400", bg: "bg-yellow-500/10", border: "border-yellow-500/30" };
    if (rate >= 40) return { label: "Needs Work", color: "text-orange-400", bg: "bg-orange-500/10", border: "border-orange-500/30" };
    return { label: "Critical", color: "text-red-400", bg: "bg-red-500/10", border: "border-red-500/30" };
  };

  const getSleepQuality = (hours: number) => {
    if (hours >= 8) return { label: "Excellent", color: "text-green-400", icon: "😴" };
    if (hours >= 7) return { label: "Good", color: "text-blue-400", icon: "🙂" };
    if (hours >= 6) return { label: "Fair", color: "text-yellow-400", icon: "😐" };
    if (hours >= 5) return { label: "Poor", color: "text-orange-400", icon: "😟" };
    return { label: "Very Poor", color: "text-red-400", icon: "😴" };
  };

  const performanceLevel = getPerformanceLevel(completionRate);
  const sleepQuality = getSleepQuality(averageSleep);

  const pieData = [
    { name: "Perfect Days", value: perfectDays, color: "#10b981" },
    { name: "Partial Days", value: partialDays, color: "#f59e0b" },
    { name: "Missed Days", value: missedDays, color: "#ef4444" },
  ];

  const sleepPieData = [
    { name: "Good Sleep (7+ hrs)", value: daysWithGoodSleep, color: "#10b981" },
    { name: "Poor Sleep (<7 hrs)", value: sleepData.filter(d => d.hours > 0 && d.hours < 7).length, color: "#f59e0b" },
    { name: "No Data", value: sleepData.filter(d => d.hours === 0).length, color: "#64748b" },
  ];

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="text-center">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
            className="w-16 h-16 border-4 border-orange-500 border-t-transparent rounded-full mx-auto mb-4"
          />
          <p className="text-white text-lg">Analyzing your performance...</p>
        </div>
      </div>
    );
  }

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
          <h1 className="text-xl font-bold flex items-center gap-2">
            <BarChart3 className="w-6 h-6 text-orange-500" />
            Analytics & Insights
          </h1>
          <div className="w-16"></div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto p-4 pb-20">

        {/* Tab Navigation */}
        <div className="flex justify-center gap-2 mb-6">
          <button
            onClick={() => setActiveTab("overview")}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl font-medium transition-all ${activeTab === "overview"
                ? "bg-orange-500 text-white"
                : "bg-slate-800 text-slate-400 hover:bg-slate-700"
              }`}
          >
            <BarChart3 className="w-4 h-4" />
            <span>Overview</span>
          </button>
          <button
            onClick={() => setActiveTab("sleep")}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl font-medium transition-all ${activeTab === "sleep"
                ? "bg-indigo-500 text-white"
                : "bg-slate-800 text-slate-400 hover:bg-slate-700"
              }`}
          >
            <Moon className="w-4 h-4" />
            <span>Sleep</span>
          </button>
          <button
            onClick={() => setActiveTab("thoughts")}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl font-medium transition-all ${activeTab === "thoughts"
                ? "bg-purple-500 text-white"
                : "bg-slate-800 text-slate-400 hover:bg-slate-700"
              }`}
          >
            <Lightbulb className="w-4 h-4" />
            <span>Thoughts</span>
          </button>
        </div>

        {/* Period Selector */}
        <div className="flex justify-center gap-2 mb-6">
          <button
            onClick={() => setViewPeriod("week")}
            className={`px-6 py-3 rounded-xl font-medium transition-all ${viewPeriod === "week"
              ? "bg-orange-500 text-white"
              : "bg-slate-800 text-slate-400 hover:bg-slate-700"
              }`}
          >
            Last 7 Days
          </button>
          <button
            onClick={() => setViewPeriod("month")}
            className={`px-6 py-3 rounded-xl font-medium transition-all ${viewPeriod === "month"
              ? "bg-orange-500 text-white"
              : "bg-slate-800 text-slate-400 hover:bg-slate-700"
              }`}
          >
            Last 30 Days
          </button>
        </div>

        <AnimatePresence mode="wait">
          {activeTab === "overview" && (
            <motion.div
              key="overview"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
            >
              {/* Performance Overview Card */}
              <motion.div
                initial={{ y: -20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                className={`${performanceLevel.bg} border ${performanceLevel.border} rounded-2xl p-6 mb-6`}
              >
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h2 className="text-2xl font-bold mb-1">Overall Performance</h2>
                    <p className="text-slate-400">Your {viewPeriod === "week" ? "weekly" : "monthly"} summary</p>
                  </div>
                  <div className={`text-right`}>
                    <div className={`text-5xl font-bold ${performanceLevel.color}`}>{completionRate}%</div>
                    <div className={`text-sm ${performanceLevel.color} font-semibold`}>{performanceLevel.label}</div>
                  </div>
                </div>
                <div className="bg-slate-800/50 rounded-full h-3 overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${completionRate}%` }}
                    transition={{ duration: 1, ease: "easeOut" }}
                    className="h-full bg-gradient-to-r from-orange-500 to-red-500"
                  />
                </div>
              </motion.div>

              {/* Key Metrics Grid */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                <motion.div
                  initial={{ scale: 0, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ delay: 0.1 }}
                  className="bg-slate-800 p-6 rounded-2xl border border-slate-700 hover:border-orange-500/50 transition-all"
                >
                  <div className="flex items-center gap-3 mb-3">
                    <div className="bg-orange-500/10 p-3 rounded-xl">
                      <Flame className="w-6 h-6 text-orange-500" />
                    </div>
                    <div>
                      <p className="text-3xl font-bold">{currentStreak}</p>
                      <p className="text-xs text-slate-400">Current Streak</p>
                    </div>
                  </div>
                  <p className="text-xs text-slate-500">Days in a row</p>
                </motion.div>

                <motion.div
                  initial={{ scale: 0, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ delay: 0.2 }}
                  className="bg-slate-800 p-6 rounded-2xl border border-slate-700 hover:border-yellow-500/50 transition-all"
                >
                  <div className="flex items-center gap-3 mb-3">
                    <div className="bg-yellow-500/10 p-3 rounded-xl">
                      <Trophy className="w-6 h-6 text-yellow-500" />
                    </div>
                    <div>
                      <p className="text-3xl font-bold">{longestStreak}</p>
                      <p className="text-xs text-slate-400">Best Streak</p>
                    </div>
                  </div>
                  <p className="text-xs text-slate-500">Personal record</p>
                </motion.div>

                <motion.div
                  initial={{ scale: 0, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ delay: 0.3 }}
                  className="bg-slate-800 p-6 rounded-2xl border border-slate-700 hover:border-indigo-500/50 transition-all"
                >
                  <div className="flex items-center gap-3 mb-3">
                    <div className="bg-indigo-500/10 p-3 rounded-xl">
                      <Moon className="w-6 h-6 text-indigo-500" />
                    </div>
                    <div>
                      <p className="text-3xl font-bold">{averageSleep}h</p>
                      <p className="text-xs text-slate-400">Avg. Sleep</p>
                    </div>
                  </div>
                  <p className={`text-xs ${sleepQuality.color}`}>{sleepQuality.label} {sleepQuality.icon}</p>
                </motion.div>

                <motion.div
                  initial={{ scale: 0, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ delay: 0.4 }}
                  className="bg-slate-800 p-6 rounded-2xl border border-slate-700 hover:border-purple-500/50 transition-all"
                >
                  <div className="flex items-center gap-3 mb-3">
                    <div className="bg-purple-500/10 p-3 rounded-xl">
                      <Lightbulb className="w-6 h-6 text-purple-500" />
                    </div>
                    <div>
                      <p className="text-3xl font-bold">{totalThoughts}</p>
                      <p className="text-xs text-slate-400">Thoughts</p>
                    </div>
                  </div>
                  <p className="text-xs text-slate-500">Total recorded</p>
                </motion.div>
              </div>

              {/* Charts Row */}
              <div className="grid lg:grid-cols-2 gap-6 mb-6">
                {/* Combined Trend Chart */}
                <motion.div
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.5 }}
                  className="bg-slate-800 p-6 rounded-2xl border border-slate-700"
                >
                  <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                    <TrendingUp className="w-5 h-5 text-orange-500" />
                    Habits & Sleep Trend
                  </h2>
                  <ResponsiveContainer width="100%" height={250}>
                    <ComposedChart data={viewPeriod === "week" ? weekData.map((d, i) => ({
                      ...d,
                      sleep: sleepData[i]?.hours || 0
                    })) : monthData.map((d, i) => ({
                      ...d,
                      sleep: sleepData[i]?.hours || 0
                    }))}>
                      <defs>
                        <linearGradient id="colorCompletion" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#f97316" stopOpacity={0.8} />
                          <stop offset="95%" stopColor="#f97316" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                      <XAxis
                        dataKey="day"
                        stroke="#94a3b8"
                        style={{ fontSize: "12px" }}
                      />
                      <YAxis yAxisId="left" stroke="#94a3b8" domain={[0, 100]} />
                      <YAxis yAxisId="right" orientation="right" stroke="#818cf8" domain={[0, 12]} />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: "#1e293b",
                          border: "1px solid #334155",
                          borderRadius: "8px",
                        }}
                      />
                      <Legend />
                      <Area
                        yAxisId="left"
                        type="monotone"
                        dataKey="completion"
                        name="Habits %"
                        stroke="#f97316"
                        fillOpacity={1}
                        fill="url(#colorCompletion)"
                      />
                      <Line
                        yAxisId="right"
                        type="monotone"
                        dataKey="sleep"
                        name="Sleep (hrs)"
                        stroke="#818cf8"
                        strokeWidth={2}
                        dot={{ fill: "#818cf8" }}
                      />
                    </ComposedChart>
                  </ResponsiveContainer>
                </motion.div>

                {/* Day Distribution Pie Chart */}
                <motion.div
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.6 }}
                  className="bg-slate-800 p-6 rounded-2xl border border-slate-700"
                >
                  <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                    <Activity className="w-5 h-5 text-green-500" />
                    Day Distribution
                  </h2>
                  <ResponsiveContainer width="100%" height={250}>
                    <PieChart>
                      <Pie
                        data={pieData}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="value"
                      >
                        {pieData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </motion.div>
              </div>

              {/* Habit Performance */}
              <motion.div
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.7 }}
                className="bg-slate-800 p-6 rounded-2xl border border-slate-700 mb-6"
              >
                <h2 className="text-lg font-semibold mb-6 flex items-center gap-2">
                  <Target className="w-5 h-5 text-blue-500" />
                  Individual Habit Performance
                </h2>
                <div className="space-y-6">
                  {habitPerformance.map((habit, index) => {
                    const level = getPerformanceLevel(habit.completionRate);
                    return (
                      <motion.div
                        key={index}
                        initial={{ x: -50, opacity: 0 }}
                        animate={{ x: 0, opacity: 1 }}
                        transition={{ delay: 0.8 + index * 0.1 }}
                        className="space-y-2"
                      >
                        <div className="flex justify-between items-center">
                          <div>
                            <h3 className="font-semibold">{habit.name}</h3>
                            <p className="text-xs text-slate-400">
                              {habit.totalCompletions} completed • {habit.missedDays} missed
                            </p>
                          </div>
                          <div className="text-right">
                            <span className={`text-2xl font-bold ${level.color}`}>
                              {habit.completionRate}%
                            </span>
                            <p className={`text-xs ${level.color}`}>{level.label}</p>
                          </div>
                        </div>
                        <div className="bg-slate-700 rounded-full h-3 overflow-hidden">
                          <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${habit.completionRate}%` }}
                            transition={{ duration: 1, delay: 0.9 + index * 0.1 }}
                            style={{ backgroundColor: habit.color }}
                            className="h-full"
                          />
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              </motion.div>

              {/* Insights Cards Grid */}
              <div className="grid md:grid-cols-3 gap-4 mb-6">
                <motion.div
                  initial={{ x: -20, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  transition={{ delay: 0.8 }}
                  className="bg-gradient-to-br from-green-900/50 to-green-800/30 border border-green-500/30 p-6 rounded-2xl"
                >
                  <div className="flex items-center gap-3 mb-3">
                    <div className="bg-green-500/20 p-3 rounded-xl">
                      <Star className="w-6 h-6 text-green-400" />
                    </div>
                    <div>
                      <p className="text-sm text-green-400">Best Day</p>
                      <p className="text-2xl font-bold">{bestDay || "N/A"}</p>
                    </div>
                  </div>
                  <p className="text-xs text-green-200">Your most productive day</p>
                </motion.div>

                <motion.div
                  initial={{ x: 20, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  transition={{ delay: 0.9 }}
                  className="bg-gradient-to-br from-orange-900/50 to-red-800/30 border border-orange-500/30 p-6 rounded-2xl"
                >
                  <div className="flex items-center gap-3 mb-3">
                    <div className="bg-orange-500/20 p-3 rounded-xl">
                      <AlertCircle className="w-6 h-6 text-orange-400" />
                    </div>
                    <div>
                      <p className="text-sm text-orange-400">Needs Work</p>
                      <p className="text-2xl font-bold">{worstDay || "N/A"}</p>
                    </div>
                  </div>
                  <p className="text-xs text-orange-200">Focus here for improvement</p>
                </motion.div>

                <motion.div
                  initial={{ scale: 0, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ delay: 1 }}
                  className="bg-gradient-to-br from-purple-900/50 to-blue-800/30 border border-purple-500/30 p-6 rounded-2xl"
                >
                  <div className="flex items-center gap-3 mb-3">
                    <div className="bg-purple-500/20 p-3 rounded-xl">
                      <Zap className="w-6 h-6 text-purple-400" />
                    </div>
                    <div>
                      <p className="text-sm text-purple-400">Consistency</p>
                      <p className="text-2xl font-bold">{consistencyScore}%</p>
                    </div>
                  </div>
                  <p className="text-xs text-purple-200">Perfect day ratio</p>
                </motion.div>
              </div>

              {/* Motivational Card */}
              <motion.div
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 1.1 }}
                className="bg-gradient-to-br from-orange-500 to-red-600 rounded-2xl p-8 text-center mb-6"
              >
                <Brain className="w-16 h-16 mx-auto mb-4 text-white" />
                <h3 className="text-2xl font-bold mb-3">
                  {completionRate >= 80 ? "Outstanding! 🏆" : completionRate >= 60 ? "Great Progress! 💪" : "Keep Pushing! 🚀"}
                </h3>
                <p className="text-orange-100 text-lg mb-6">
                  {completionRate >= 80
                    ? "You're crushing your goals! Your dedication is truly inspiring."
                    : completionRate >= 60
                      ? `You're on the right track. Just ${100 - totalDays} more days to complete the challenge!`
                      : "Every day is a new opportunity. Small improvements lead to big results!"}
                </p>

                <div className="bg-white/10 rounded-xl p-4">
                  <div className="flex justify-between text-sm mb-2">
                    <span className="font-semibold">Challenge Progress</span>
                    <span className="font-bold">{totalDays} / 100 days</span>
                  </div>
                  <div className="bg-white/20 rounded-full h-4 overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${Math.min(totalDays, 100)}%` }}
                      transition={{ duration: 1.5, delay: 1.2 }}
                      className="h-full bg-white"
                    />
                  </div>
                  <p className="text-xs text-orange-100 mt-2">
                    {100 - totalDays} days until you claim your ₹500 back!
                  </p>
                </div>
              </motion.div>
            </motion.div>
          )}

          {activeTab === "sleep" && (
            <motion.div
              key="sleep"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
            >
              {/* Sleep Overview Card */}
              <motion.div
                initial={{ y: -20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                className="bg-gradient-to-br from-indigo-900/50 to-purple-900/50 border border-indigo-500/30 rounded-2xl p-6 mb-6"
              >
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h2 className="text-2xl font-bold mb-1 flex items-center gap-2">
                      <Moon className="w-6 h-6 text-indigo-400" />
                      Sleep Analysis
                    </h2>
                    <p className="text-slate-400">Your {viewPeriod === "week" ? "weekly" : "monthly"} sleep patterns</p>
                  </div>
                  <div className="text-right">
                    <div className={`text-5xl font-bold ${sleepQuality.color}`}>
                      {averageSleep}h
                    </div>
                    <div className={`text-sm ${sleepQuality.color} font-semibold`}>
                      {sleepQuality.label} {sleepQuality.icon}
                    </div>
                  </div>
                </div>
                <div className="bg-slate-800/50 rounded-full h-3 overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${Math.min((averageSleep / sleepGoal) * 100, 100)}%` }}
                    transition={{ duration: 1, ease: "easeOut" }}
                    className="h-full bg-gradient-to-r from-indigo-500 to-purple-500"
                  />
                </div>
                <p className="text-xs text-slate-400 mt-2">
                  Goal: {sleepGoal} hours per night
                </p>
              </motion.div>

              {/* Sleep Metrics Grid */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                <motion.div
                  initial={{ scale: 0, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ delay: 0.1 }}
                  className="bg-slate-800 p-6 rounded-2xl border border-slate-700"
                >
                  <div className="flex items-center gap-3 mb-3">
                    <div className="bg-indigo-500/10 p-3 rounded-xl">
                      <Bed className="w-6 h-6 text-indigo-500" />
                    </div>
                    <div>
                      <p className="text-3xl font-bold">{averageSleep}h</p>
                      <p className="text-xs text-slate-400">Avg. Sleep</p>
                    </div>
                  </div>
                </motion.div>

                <motion.div
                  initial={{ scale: 0, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ delay: 0.2 }}
                  className="bg-slate-800 p-6 rounded-2xl border border-slate-700"
                >
                  <div className="flex items-center gap-3 mb-3">
                    <div className="bg-green-500/10 p-3 rounded-xl">
                      <CheckCircle className="w-6 h-6 text-green-500" />
                    </div>
                    <div>
                      <p className="text-3xl font-bold">{daysWithGoodSleep}</p>
                      <p className="text-xs text-slate-400">Good Nights</p>
                    </div>
                  </div>
                  <p className="text-xs text-slate-500">7+ hours</p>
                </motion.div>

                <motion.div
                  initial={{ scale: 0, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ delay: 0.3 }}
                  className="bg-slate-800 p-6 rounded-2xl border border-slate-700"
                >
                  <div className="flex items-center gap-3 mb-3">
                    <div className="bg-purple-500/10 p-3 rounded-xl">
                      <TrendingUp className="w-6 h-6 text-purple-500" />
                    </div>
                    <div>
                      <p className="text-3xl font-bold">{bestSleepDay?.hours || 0}h</p>
                      <p className="text-xs text-slate-400">Best Night</p>
                    </div>
                  </div>
                  <p className="text-xs text-slate-500">{bestSleepDay?.day || "N/A"}</p>
                </motion.div>

                <motion.div
                  initial={{ scale: 0, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ delay: 0.4 }}
                  className="bg-slate-800 p-6 rounded-2xl border border-slate-700"
                >
                  <div className="flex items-center gap-3 mb-3">
                    <div className="bg-orange-500/10 p-3 rounded-xl">
                      <TrendingDown className="w-6 h-6 text-orange-500" />
                    </div>
                    <div>
                      <p className="text-3xl font-bold">{worstSleepDay?.hours || 0}h</p>
                      <p className="text-xs text-slate-400">Worst Night</p>
                    </div>
                  </div>
                  <p className="text-xs text-slate-500">{worstSleepDay?.day || "N/A"}</p>
                </motion.div>
              </div>

              {/* Sleep Charts */}
              <div className="grid lg:grid-cols-2 gap-6 mb-6">
                {/* Sleep Hours Bar Chart */}
                <motion.div
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.5 }}
                  className="bg-slate-800 p-6 rounded-2xl border border-slate-700"
                >
                  <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                    <BarChart3 className="w-5 h-5 text-indigo-500" />
                    Sleep Hours
                  </h2>
                  <ResponsiveContainer width="100%" height={250}>
                    <BarChart data={sleepData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                      <XAxis dataKey="day" stroke="#94a3b8" style={{ fontSize: "12px" }} />
                      <YAxis stroke="#94a3b8" domain={[0, 12]} />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: "#1e293b",
                          border: "1px solid #334155",
                          borderRadius: "8px",
                        }}
                        formatter={(value: number) => [`${value} hours`, "Sleep"]}
                      />
                      <Bar
                        dataKey="hours"
                        fill="#818cf8"
                        radius={[4, 4, 0, 0]}
                      />
                      {/* Reference line for goal */}
                      <Line
                        type="monotone"
                        dataKey={() => sleepGoal}
                        stroke="#10b981"
                        strokeDasharray="5 5"
                        strokeWidth={2}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                  <div className="flex items-center gap-4 mt-4 text-sm">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 bg-indigo-500 rounded"></div>
                      <span className="text-slate-400">Sleep hours</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-0.5 bg-green-500 border-dashed"></div>
                      <span className="text-slate-400">Goal ({sleepGoal}h)</span>
                    </div>
                  </div>
                </motion.div>

                {/* Sleep Quality Distribution */}
                <motion.div
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.6 }}
                  className="bg-slate-800 p-6 rounded-2xl border border-slate-700"
                >
                  <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                    <Activity className="w-5 h-5 text-purple-500" />
                    Sleep Quality Distribution
                  </h2>
                  <ResponsiveContainer width="100%" height={250}>
                    <PieChart>
                      <Pie
                        data={sleepPieData}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ name, percent }) => percent > 0 ? `${(percent * 100).toFixed(0)}%` : ''}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="value"
                      >
                        {sleepPieData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                </motion.div>
              </div>

              {/* Sleep Tips Card */}
              <motion.div
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.7 }}
                className="bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl p-8 text-center"
              >
                <Moon className="w-16 h-16 mx-auto mb-4 text-white" />
                <h3 className="text-2xl font-bold mb-3">
                  {averageSleep >= 7 ? "Great Sleep Habits! 🌙" : averageSleep >= 6 ? "Almost There! 😴" : "Let's Improve! 💤"}
                </h3>
                <p className="text-indigo-100 text-lg mb-4">
                  {averageSleep >= 7
                    ? "You're getting quality rest. Keep maintaining this healthy sleep schedule!"
                    : averageSleep >= 6
                      ? "You're close to the recommended 7-8 hours. Try going to bed 30 minutes earlier."
                      : "Quality sleep is crucial for habit success. Consider setting a bedtime reminder."}
                </p>
                <div className="grid grid-cols-3 gap-4 mt-6">
                  <div className="bg-white/10 rounded-xl p-4">
                    <Bed className="w-8 h-8 mx-auto mb-2 text-indigo-200" />
                    <p className="text-sm text-indigo-100">Consistent bedtime</p>
                  </div>
                  <div className="bg-white/10 rounded-xl p-4">
                    <Sunrise className="w-8 h-8 mx-auto mb-2 text-indigo-200" />
                    <p className="text-sm text-indigo-100">Regular wake time</p>
                  </div>
                  <div className="bg-white/10 rounded-xl p-4">
                    <Clock className="w-8 h-8 mx-auto mb-2 text-indigo-200" />
                    <p className="text-sm text-indigo-100">7-9 hours goal</p>
                  </div>
                </div>
              </motion.div>
            </motion.div>
          )}

          {activeTab === "thoughts" && (
            <motion.div
              key="thoughts"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
            >
              {/* Thoughts Overview Card */}
              <motion.div
                initial={{ y: -20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                className="bg-gradient-to-br from-purple-900/50 to-pink-900/50 border border-purple-500/30 rounded-2xl p-6 mb-6"
              >
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h2 className="text-2xl font-bold mb-1 flex items-center gap-2">
                      <Lightbulb className="w-6 h-6 text-purple-400" />
                      Daily Thoughts
                    </h2>
                    <p className="text-slate-400">Your journey of positive reflections</p>
                  </div>
                  <div className="text-right">
                    <div className="text-5xl font-bold text-purple-400">
                      {totalThoughts}
                    </div>
                    <div className="text-sm text-purple-300 font-semibold">
                      Thoughts Recorded
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-4 mt-4">
                  <div className="bg-white/10 rounded-xl p-4 flex-1 text-center">
                    <MessageSquare className="w-8 h-8 mx-auto mb-2 text-purple-300" />
                    <p className="text-sm text-purple-100">Keep journaling daily!</p>
                  </div>
                  <div className="bg-white/10 rounded-xl p-4 flex-1 text-center">
                    <Brain className="w-8 h-8 mx-auto mb-2 text-purple-300" />
                    <p className="text-sm text-purple-100">Reflect & grow</p>
                  </div>
                </div>
              </motion.div>

              {/* Thought Stats Grid */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                <motion.div
                  initial={{ scale: 0, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ delay: 0.1 }}
                  className="bg-slate-800 p-6 rounded-2xl border border-slate-700"
                >
                  <div className="flex items-center gap-3 mb-3">
                    <div className="bg-purple-500/10 p-3 rounded-xl">
                      <Lightbulb className="w-6 h-6 text-purple-500" />
                    </div>
                    <div>
                      <p className="text-3xl font-bold">{totalThoughts}</p>
                      <p className="text-xs text-slate-400">Total Thoughts</p>
                    </div>
                  </div>
                </motion.div>

                <motion.div
                  initial={{ scale: 0, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ delay: 0.2 }}
                  className="bg-slate-800 p-6 rounded-2xl border border-slate-700"
                >
                  <div className="flex items-center gap-3 mb-3">
                    <div className="bg-green-500/10 p-3 rounded-xl">
                      <Flame className="w-6 h-6 text-green-500" />
                    </div>
                    <div>
                      <p className="text-3xl font-bold">{currentStreak}</p>
                      <p className="text-xs text-slate-400">Day Streak</p>
                    </div>
                  </div>
                </motion.div>

                <motion.div
                  initial={{ scale: 0, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ delay: 0.3 }}
                  className="bg-slate-800 p-6 rounded-2xl border border-slate-700"
                >
                  <div className="flex items-center gap-3 mb-3">
                    <div className="bg-blue-500/10 p-3 rounded-xl">
                      <Calendar className="w-6 h-6 text-blue-500" />
                    </div>
                    <div>
                      <p className="text-3xl font-bold">{totalDays}</p>
                      <p className="text-xs text-slate-400">Days Tracked</p>
                    </div>
                  </div>
                </motion.div>

                <motion.div
                  initial={{ scale: 0, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ delay: 0.4 }}
                  className="bg-slate-800 p-6 rounded-2xl border border-slate-700"
                >
                  <div className="flex items-center gap-3 mb-3">
                    <div className="bg-orange-500/10 p-3 rounded-xl">
                      <Percent className="w-6 h-6 text-orange-500" />
                    </div>
                    <div>
                      <p className="text-3xl font-bold">
                        {totalDays > 0 ? Math.round((totalThoughts / totalDays) * 100) : 0}%
                      </p>
                      <p className="text-xs text-slate-400">Journaling Rate</p>
                    </div>
                  </div>
                </motion.div>
              </div>

              {/* Recent Thoughts */}
              <motion.div
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.5 }}
                className="bg-slate-800 p-6 rounded-2xl border border-slate-700 mb-6"
              >
                <h2 className="text-lg font-semibold mb-6 flex items-center gap-2">
                  <MessageSquare className="w-5 h-5 text-purple-500" />
                  Recent Thoughts
                </h2>
                {recentThoughts.length > 0 ? (
                  <div className="space-y-4">
                    {recentThoughts.map((thought, index) => (
                      <motion.div
                        key={index}
                        initial={{ x: -50, opacity: 0 }}
                        animate={{ x: 0, opacity: 1 }}
                        transition={{ delay: 0.6 + index * 0.1 }}
                        className="bg-slate-900/50 p-4 rounded-xl border border-slate-700"
                      >
                        <div className="flex items-start gap-4">
                          <div className="bg-purple-500/20 p-2 rounded-lg">
                            <Lightbulb className="w-5 h-5 text-purple-400" />
                          </div>
                          <div className="flex-1">
                            <p className="text-sm text-slate-300 leading-relaxed">
                              "{thought.thought}"
                            </p>
                            <p className="text-xs text-slate-500 mt-2">
                              {new Date(thought.date).toLocaleDateString("en-US", {
                                weekday: "long",
                                month: "short",
                                day: "numeric",
                              })}
                            </p>
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <Lightbulb className="w-16 h-16 mx-auto mb-4 text-slate-600" />
                    <h3 className="text-xl font-semibold text-slate-400 mb-2">No thoughts yet</h3>
                    <p className="text-slate-500">Start recording your daily positive thoughts!</p>
                    <button
                      onClick={() => navigate("/daily")}
                      className="mt-4 bg-purple-500 hover:bg-purple-600 px-6 py-2 rounded-lg font-medium transition-all"
                    >
                      Go to Daily Page
                    </button>
                  </div>
                )}
              </motion.div>

              {/* Journaling Tips Card */}
              <motion.div
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.7 }}
                className="bg-gradient-to-br from-purple-500 to-pink-600 rounded-2xl p-8 text-center"
              >
                <Brain className="w-16 h-16 mx-auto mb-4 text-white" />
                <h3 className="text-2xl font-bold mb-3">
                  The Power of Positive Thinking 🌟
                </h3>
                <p className="text-purple-100 text-lg mb-4">
                  Recording one positive thought daily helps rewire your brain for happiness and success.
                </p>
                <div className="grid grid-cols-3 gap-4 mt-6">
                  <div className="bg-white/10 rounded-xl p-4">
                    <Star className="w-8 h-8 mx-auto mb-2 text-purple-200" />
                    <p className="text-sm text-purple-100">Gratitude moments</p>
                  </div>
                  <div className="bg-white/10 rounded-xl p-4">
                    <Award className="w-8 h-8 mx-auto mb-2 text-purple-200" />
                    <p className="text-sm text-purple-100">Daily wins</p>
                  </div>
                  <div className="bg-white/10 rounded-xl p-4">
                    <Zap className="w-8 h-8 mx-auto mb-2 text-purple-200" />
                    <p className="text-sm text-purple-100">Lessons learned</p>
                  </div>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
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
            onClick={() => navigate("/analysis")}
            className="flex flex-col items-center gap-1 text-slate-400 hover:text-white transition-colors"
          >
            <Calendar className="w-6 h-6" />
            <span className="text-xs">Analysis</span>
          </button>
          <button
            onClick={() => navigate("/streak")}
            className="flex flex-col items-center gap-1 text-slate-400 hover:text-white transition-colors"
          >
            <Flame className="w-6 h-6" />
            <span className="text-xs">Streak</span>
          </button>
          <button
            onClick={() => navigate("/insights")}
            className="flex flex-col items-center gap-1 text-orange-400"
          >
            <BarChart3 className="w-6 h-6" />
            <span className="text-xs font-semibold">Insights</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default InsightsPage;