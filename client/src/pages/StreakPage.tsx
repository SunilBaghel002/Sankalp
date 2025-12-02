// src/pages/StreakPage.tsx
import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import {
  Flame,
  Calendar,
  CheckCircle,
  XCircle,
  AlertCircle,
  ArrowLeft,
  Target,
  Zap,
  Star,
  ChevronRight,
  ChevronLeft,
  CalendarDays,
  DollarSign,
  Trophy,
  Loader2,
  Share2,
  Download,
  RefreshCw,
} from "lucide-react";
import { useStore } from "../store/useStore";
import PageLayout from "../components/PageLayout";
import StreakDetails from "../components/StreakDetails";

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
  const [totalCompletedDays, setTotalCompletedDays] = useState(0);
  const [challengeStartDate, setChallengeStartDate] = useState<Date>(new Date());
  const [selectedWeek, setSelectedWeek] = useState(0);
  const [actualDaysPassed, setActualDaysPassed] = useState(0);
  const [activeView, setActiveView] = useState<"details" | "calendar">("details");
  const [refreshing, setRefreshing] = useState(false);

  const getDateString = (date: Date): string => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  };

  useEffect(() => {
    fetchCalendarData();
  }, []);

  const fetchCalendarData = async () => {
    try {
      setLoading(true);

      const habitsResponse = await fetch("http://localhost:8000/habits", {
        method: "GET",
        credentials: "include",
      });

      if (!habitsResponse.ok) {
        setLoading(false);
        return;
      }

      const habitsData = await habitsResponse.json();
      const totalHabits = habitsData.length || 0;

      if (totalHabits === 0) {
        setLoading(false);
        return;
      }

      const today = new Date();
      today.setHours(0, 0, 0, 0);

      let startDate: Date | null = null;

      if (habitsData && habitsData.length > 0) {
        for (const habit of habitsData) {
          if (habit.created_at) {
            const habitDate = new Date(habit.created_at);
            habitDate.setHours(0, 0, 0, 0);
            if (!isNaN(habitDate.getTime())) {
              if (!startDate || habitDate < startDate) {
                startDate = habitDate;
              }
            }
          }
        }
      }

      if (!startDate || isNaN(startDate.getTime())) {
        startDate = new Date(today);
      }

      if (startDate > today) {
        startDate = new Date(today);
      }

      setChallengeStartDate(startDate);

      const daysPassed = Math.floor(
        (today.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)
      ) + 1;
      const actualDays = Math.min(Math.max(daysPassed, 1), 100);
      setActualDaysPassed(actualDays);

      const allDays: DayStatus[] = [];
      let tempTotalCompleted = 0;
      const todayStr = getDateString(today);

      for (let i = 0; i < 100; i++) {
        const checkDate = new Date(startDate);
        checkDate.setDate(startDate.getDate() + i);
        checkDate.setHours(0, 0, 0, 0);

        const dateStr = getDateString(checkDate);
        const isToday = dateStr === todayStr;
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
          try {
            const checkinsResponse = await fetch(
              `http://localhost:8000/checkins/${dateStr}`,
              { method: "GET", credentials: "include" }
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
              dayStatus.completed = completionPercent === 100;

              if (dayStatus.completed) {
                tempTotalCompleted++;
              }
            }
          } catch (error) {
            console.error(`Error fetching checkins for ${dateStr}:`, error);
          }
        }

        allDays.push(dayStatus);
      }

      setDayStatuses(allDays);
      setTotalCompletedDays(tempTotalCompleted);

      const currentWeekIndex = Math.floor((actualDays - 1) / 7);
      setSelectedWeek(Math.max(0, currentWeekIndex));

      setLoading(false);
    } catch (error) {
      console.error("Error fetching calendar data:", error);
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchCalendarData();
    setRefreshing(false);
  };

  const getDayColor = (status: DayStatus) => {
    if (status.isFuture) return "bg-slate-800/50 border-slate-700/50 text-slate-600";

    if (status.isToday) {
      if (status.completed)
        return "bg-green-500 border-green-400 text-white shadow-lg shadow-green-500/30 ring-2 ring-green-400 ring-offset-2 ring-offset-slate-900";
      if (status.habitsCompleted > 0) {
        if (status.completionPercentage >= 80)
          return "bg-yellow-500 border-yellow-400 text-white shadow-lg shadow-yellow-500/30 ring-2 ring-yellow-400 ring-offset-2 ring-offset-slate-900";
        return "bg-orange-500 border-orange-400 text-white ring-2 ring-orange-400 ring-offset-2 ring-offset-slate-900";
      }
      return "bg-slate-700 border-orange-500 text-orange-300 ring-2 ring-orange-500 ring-offset-2 ring-offset-slate-900 animate-pulse";
    }

    if (status.completed) return "bg-green-500/80 border-green-500 text-white";

    if (status.habitsCompleted > 0) {
      if (status.completionPercentage >= 80)
        return "bg-yellow-500/60 border-yellow-500/80 text-yellow-100";
      if (status.completionPercentage >= 50)
        return "bg-orange-500/50 border-orange-500/70 text-orange-100";
      return "bg-red-500/30 border-red-500/50 text-red-200";
    }

    return "bg-red-900/30 border-red-800/30 text-red-400/60";
  };

  const getDayIcon = (status: DayStatus) => {
    if (status.isFuture) return null;
    if (status.completed) return <CheckCircle className="w-3 h-3 sm:w-4 sm:h-4" />;
    if (status.habitsCompleted > 0) {
      return (
        <span className="text-[8px] sm:text-[10px] font-bold">
          {status.habitsCompleted}/{status.totalHabits}
        </span>
      );
    }
    if (status.isPast) return <XCircle className="w-3 h-3 sm:w-4 sm:h-4 opacity-50" />;
    return null;
  };

  const getTooltipText = (status: DayStatus) => {
    const dateObj = new Date(status.date + "T00:00:00");
    const dateFormatted = dateObj.toLocaleDateString("en-IN", {
      weekday: "short",
      day: "numeric",
      month: "short",
    });

    if (status.isFuture) return `Day ${status.dayNumber} - ${dateFormatted}: Upcoming`;
    if (status.completed)
      return `Day ${status.dayNumber} - ${dateFormatted}: ✅ Perfect! (${status.totalHabits}/${status.totalHabits})`;
    if (status.habitsCompleted > 0)
      return `Day ${status.dayNumber} - ${dateFormatted}: ${status.habitsCompleted}/${status.totalHabits} (${status.completionPercentage}%)`;
    if (status.isToday)
      return `Day ${status.dayNumber} - ${dateFormatted}: 📍 Today - Complete your habits!`;
    return `Day ${status.dayNumber} - ${dateFormatted}: ❌ Missed`;
  };

  const getCurrentWeekDays = () => {
    const weekSize = 7;
    const totalWeeks = Math.ceil(dayStatuses.length / weekSize);
    const start = selectedWeek * weekSize;
    const end = Math.min(start + weekSize, dayStatuses.length);
    return {
      days: dayStatuses.slice(start, end),
      totalWeeks,
      currentWeek: selectedWeek + 1,
    };
  };

  const getProgressColor = () => {
    const percentage = (totalCompletedDays / 100) * 100;
    if (percentage >= 75) return "from-green-500 to-emerald-500";
    if (percentage >= 50) return "from-yellow-500 to-orange-500";
    if (percentage >= 25) return "from-orange-500 to-red-500";
    return "from-red-500 to-pink-500";
  };

  const getChallengeStatus = () => {
    if (totalCompletedDays >= 100) {
      return {
        status: "completed",
        title: "🎉 Challenge Complete!",
        message: "Congratulations! You've completed the 100-day challenge. Claim your ₹500 refund!",
        color: "from-green-600 to-emerald-600",
        borderColor: "border-green-500",
      };
    }
    if (totalCompletedDays >= 75) {
      return {
        status: "final",
        title: "🔥 Final Stretch!",
        message: `Only ${100 - totalCompletedDays} perfect days to go. You're so close!`,
        color: "from-orange-600 to-red-600",
        borderColor: "border-orange-500",
      };
    }
    if (totalCompletedDays >= 50) {
      return {
        status: "halfway",
        title: "💪 Halfway There!",
        message: `${totalCompletedDays} perfect days completed. Keep the momentum going!`,
        color: "from-yellow-600 to-orange-600",
        borderColor: "border-yellow-500",
      };
    }
    return {
      status: "ongoing",
      title: "🚀 Challenge in Progress",
      message: `${totalCompletedDays} perfect days so far. Every day counts!`,
      color: "from-blue-600 to-purple-600",
      borderColor: "border-blue-500",
    };
  };

  if (loading) {
    return (
      <PageLayout pageTitle="Streak Details" pageIcon={Flame}>
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center">
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
              className="w-16 h-16 border-4 border-orange-500 border-t-transparent rounded-full mx-auto mb-4"
            />
            <p className="text-white text-lg">Loading streak data...</p>
          </div>
        </div>
      </PageLayout>
    );
  }

  if (!habits || habits.length === 0) {
    return (
      <PageLayout pageTitle="Streak Details" pageIcon={Flame}>
        <div className="flex items-center justify-center min-h-[60vh] p-4">
          <div className="text-center">
            <AlertCircle className="w-20 h-20 text-orange-500 mx-auto mb-4" />
            <h2 className="text-2xl font-bold mb-4">No Habits Set</h2>
            <p className="text-slate-400 mb-6">
              Set up your habits to start tracking your streak!
            </p>
            <button
              onClick={() => navigate("/onboarding")}
              className="bg-orange-500 hover:bg-orange-600 px-6 py-3 rounded-xl font-semibold transition-all"
            >
              Set Up Habits
            </button>
          </div>
        </div>
      </PageLayout>
    );
  }

  const weekData = getCurrentWeekDays();
  const daysRemaining = 100 - totalCompletedDays;
  const challengeStatus = getChallengeStatus();

  return (
    <PageLayout pageTitle="Streak Details" pageIcon={Flame}>
      <div className="max-w-7xl mx-auto px-4 py-6 space-y-6">
        {/* View Toggle & Refresh */}
        <div className="flex items-center justify-between">
          <div className="flex bg-slate-800 rounded-xl p-1 border border-slate-700">
            <button
              onClick={() => setActiveView("details")}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all ${activeView === "details"
                  ? "bg-orange-500 text-white"
                  : "text-slate-400 hover:text-white"
                }`}
            >
              <Flame className="w-4 h-4" />
              <span className="hidden sm:inline">Streak Stats</span>
            </button>
            <button
              onClick={() => setActiveView("calendar")}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all ${activeView === "calendar"
                  ? "bg-orange-500 text-white"
                  : "text-slate-400 hover:text-white"
                }`}
            >
              <CalendarDays className="w-4 h-4" />
              <span className="hidden sm:inline">100-Day Calendar</span>
            </button>
          </div>

          <button
            onClick={handleRefresh}
            disabled={refreshing}
            className="flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 rounded-xl border border-slate-700 transition-all disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${refreshing ? "animate-spin" : ""}`} />
            <span className="hidden sm:inline">Refresh</span>
          </button>
        </div>

        <AnimatePresence mode="wait">
          {/* Streak Details View */}
          {activeView === "details" && (
            <motion.div
              key="details"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              className="space-y-6"
            >
              {/* StreakDetails Component - Main Content */}
              <StreakDetails />

              {/* Challenge Progress Card - Unique to this page */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className={`bg-gradient-to-r ${challengeStatus.color} rounded-2xl p-6 border ${challengeStatus.borderColor}`}
              >
                <div className="flex flex-col md:flex-row items-center gap-6">
                  <div className="bg-white/20 p-4 rounded-2xl">
                    <DollarSign className="w-12 h-12 text-white" />
                  </div>

                  <div className="flex-1 text-center md:text-left">
                    <h3 className="text-2xl font-bold text-white mb-1">
                      {challengeStatus.title}
                    </h3>
                    <p className="text-white/80 mb-4">
                      {challengeStatus.message}
                    </p>

                    {/* Progress Bar */}
                    <div className="bg-black/20 rounded-full h-4 overflow-hidden mb-2">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{
                          width: `${Math.min((totalCompletedDays / 100) * 100, 100)}%`,
                        }}
                        transition={{ duration: 1, delay: 0.3 }}
                        className="h-full bg-white/90 rounded-full"
                      />
                    </div>

                    <div className="flex justify-between text-sm text-white/80">
                      <span>{totalCompletedDays} perfect days</span>
                      <span>{daysRemaining} to go</span>
                    </div>
                  </div>

                  <div className="text-center">
                    <div className="text-4xl font-bold text-white">₹500</div>
                    <div className="text-white/80 text-sm">at stake</div>
                  </div>
                </div>
              </motion.div>
            </motion.div>
          )}

          {/* Calendar View */}
          {activeView === "calendar" && (
            <motion.div
              key="calendar"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-6"
            >
              {/* Quick Stats Bar */}
              <div className="grid grid-cols-3 gap-4">
                <div className="bg-slate-800 rounded-xl p-4 border border-slate-700 text-center">
                  <div className="text-3xl font-bold text-green-400">
                    {totalCompletedDays}
                  </div>
                  <div className="text-xs text-slate-400">Perfect Days</div>
                </div>
                <div className="bg-slate-800 rounded-xl p-4 border border-slate-700 text-center">
                  <div className="text-3xl font-bold text-orange-400">
                    {actualDaysPassed}
                  </div>
                  <div className="text-xs text-slate-400">Days Passed</div>
                </div>
                <div className="bg-slate-800 rounded-xl p-4 border border-slate-700 text-center">
                  <div className="text-3xl font-bold text-blue-400">
                    {100 - actualDaysPassed}
                  </div>
                  <div className="text-xs text-slate-400">Days Left</div>
                </div>
              </div>

              {/* Weekly Navigator */}
              <div className="bg-slate-800 rounded-2xl p-6 border border-slate-700">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-bold flex items-center gap-2">
                    <Calendar className="w-5 h-5 text-blue-400" />
                    Week {weekData.currentWeek} of {weekData.totalWeeks}
                  </h3>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setSelectedWeek(Math.max(0, selectedWeek - 1))}
                      disabled={selectedWeek === 0}
                      className="p-2 bg-slate-700 hover:bg-slate-600 disabled:opacity-30 disabled:cursor-not-allowed rounded-lg transition-all"
                    >
                      <ChevronLeft className="w-5 h-5" />
                    </button>
                    <span className="text-sm text-slate-400 min-w-[80px] text-center">
                      Days {selectedWeek * 7 + 1}-{Math.min((selectedWeek + 1) * 7, 100)}
                    </span>
                    <button
                      onClick={() =>
                        setSelectedWeek(
                          Math.min(weekData.totalWeeks - 1, selectedWeek + 1)
                        )
                      }
                      disabled={selectedWeek === weekData.totalWeeks - 1}
                      className="p-2 bg-slate-700 hover:bg-slate-600 disabled:opacity-30 disabled:cursor-not-allowed rounded-lg transition-all"
                    >
                      <ChevronRight className="w-5 h-5" />
                    </button>
                  </div>
                </div>

                {/* Week Days */}
                <div className="grid grid-cols-7 gap-3 mb-4">
                  {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
                    <div
                      key={day}
                      className="text-center text-xs text-slate-500 font-medium"
                    >
                      {day}
                    </div>
                  ))}
                </div>

                <div className="grid grid-cols-7 gap-3">
                  {weekData.days.map((status, index) => (
                    <motion.div
                      key={status.dayNumber}
                      initial={{ scale: 0, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      transition={{ delay: index * 0.05 }}
                      className={`aspect-square rounded-xl flex flex-col items-center justify-center border-2 relative cursor-pointer hover:scale-105 transition-all ${getDayColor(
                        status
                      )}`}
                      title={getTooltipText(status)}
                    >
                      <span className="text-sm font-bold mb-0.5">
                        {status.dayNumber}
                      </span>
                      {getDayIcon(status)}
                    </motion.div>
                  ))}
                </div>

                {/* Week Summary */}
                <div className="mt-4 pt-4 border-t border-slate-700">
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-400">Week Completion</span>
                    <span className="font-bold text-green-400">
                      {weekData.days.filter((d) => d.completed).length}/
                      {weekData.days.filter((d) => !d.isFuture).length} days
                    </span>
                  </div>
                </div>
              </div>

              {/* Full 100-Day Grid */}
              <div className="bg-slate-800 rounded-2xl p-6 border border-slate-700">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-xl font-bold flex items-center gap-2">
                    <Target className="w-6 h-6 text-orange-400" />
                    100-Day Challenge Map
                  </h3>
                  <div className="flex items-center gap-2 text-sm text-slate-400">
                    <CalendarDays className="w-4 h-4" />
                    <span>
                      Started:{" "}
                      {challengeStartDate.toLocaleDateString("en-IN", {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                      })}
                    </span>
                  </div>
                </div>

                {/* 10x10 Grid */}
                <div className="grid grid-cols-10 gap-1.5 sm:gap-2 mb-6">
                  {dayStatuses.map((status) => (
                    <motion.div
                      key={status.dayNumber}
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{
                        delay: Math.min(status.dayNumber * 0.005, 0.5),
                      }}
                      className={`aspect-square rounded-md sm:rounded-lg flex flex-col items-center justify-center text-[8px] sm:text-xs font-bold border cursor-pointer hover:scale-110 transition-transform relative ${getDayColor(
                        status
                      )}`}
                      title={getTooltipText(status)}
                    >
                      <span>{status.dayNumber}</span>
                      <span className="hidden sm:block">{getDayIcon(status)}</span>
                    </motion.div>
                  ))}
                </div>

                {/* Legend */}
                <div className="flex flex-wrap items-center justify-center gap-3 sm:gap-6 text-xs">
                  <div className="flex items-center gap-1.5">
                    <div className="w-4 h-4 bg-green-500 rounded border-2 border-green-400"></div>
                    <span className="text-slate-400">Perfect</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <div className="w-4 h-4 bg-yellow-500/60 rounded border-2 border-yellow-500"></div>
                    <span className="text-slate-400">Partial (80%+)</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <div className="w-4 h-4 bg-orange-500/50 rounded border-2 border-orange-500"></div>
                    <span className="text-slate-400">Some (50%+)</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <div className="w-4 h-4 bg-red-900/30 rounded border-2 border-red-800/30"></div>
                    <span className="text-slate-400">Missed</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <div className="w-4 h-4 bg-slate-700 rounded border-2 border-orange-500 animate-pulse"></div>
                    <span className="text-slate-400">Today</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <div className="w-4 h-4 bg-slate-800/50 rounded border-2 border-slate-700/50"></div>
                    <span className="text-slate-400">Future</span>
                  </div>
                </div>
              </div>

              {/* Overall Progress */}
              <div className="bg-slate-800 rounded-2xl p-6 border border-slate-700">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="font-bold">Overall Challenge Progress</h3>
                  <span className="text-2xl font-bold text-orange-400">
                    {Math.round((totalCompletedDays / 100) * 100)}%
                  </span>
                </div>

                <div className="bg-slate-700 rounded-full h-6 overflow-hidden mb-4">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{
                      width: `${Math.min((totalCompletedDays / 100) * 100, 100)}%`,
                    }}
                    transition={{ duration: 1.5, ease: "easeOut" }}
                    className={`h-full bg-gradient-to-r ${getProgressColor()} relative overflow-hidden`}
                  >
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-shimmer"></div>
                  </motion.div>
                </div>

                <div className="grid grid-cols-4 gap-4 text-center">
                  <div>
                    <div className="text-2xl font-bold text-green-400">
                      {totalCompletedDays}
                    </div>
                    <div className="text-xs text-slate-400">Perfect</div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-yellow-400">
                      {
                        dayStatuses.filter(
                          (d) =>
                            !d.isFuture &&
                            !d.completed &&
                            d.habitsCompleted > 0
                        ).length
                      }
                    </div>
                    <div className="text-xs text-slate-400">Partial</div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-red-400">
                      {
                        dayStatuses.filter(
                          (d) =>
                            !d.isFuture &&
                            !d.completed &&
                            d.habitsCompleted === 0 &&
                            d.isPast
                        ).length
                      }
                    </div>
                    <div className="text-xs text-slate-400">Missed</div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-blue-400">
                      {dayStatuses.filter((d) => d.isFuture).length}
                    </div>
                    <div className="text-xs text-slate-400">Remaining</div>
                  </div>
                </div>
              </div>

              {/* Motivational Message */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
                className="bg-gradient-to-r from-purple-900/50 to-pink-900/50 rounded-2xl p-6 border border-purple-500/30 text-center"
              >
                <Zap className="w-10 h-10 text-yellow-400 mx-auto mb-3" />
                <p className="text-xl font-bold text-white mb-2">
                  {totalCompletedDays >= 75
                    ? "🏆 You're in the final stretch! Don't give up now!"
                    : totalCompletedDays >= 50
                      ? "💪 Halfway champion! Your dedication is inspiring!"
                      : totalCompletedDays >= 25
                        ? "🔥 Quarter done! You're building unstoppable habits!"
                        : "🚀 Every perfect day brings you closer to victory!"}
                </p>
                <p className="text-purple-200">
                  {daysRemaining} perfect days away from claiming your ₹500 back!
                </p>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </PageLayout>
  );
};

export default StreakPage;