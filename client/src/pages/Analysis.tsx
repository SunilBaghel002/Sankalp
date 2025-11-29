// src/pages/Analysis.tsx
import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { useStore } from "../store/useStore";
import {
    Flame,
    ChevronLeft,
    ChevronRight,
    Lightbulb,
    Moon,
    CheckSquare,
    Calendar,
    Check,
    X,
    TrendingUp,
    BarChart3,
    Clock,
    Brain,
    User,
    LogOut,
    Settings,
    Home,
    Sparkles,
    Sun,
    Sunrise,
} from "lucide-react";

interface ThoughtData {
    id: number;
    user_id: number;
    date: string;
    thought: string;
    created_at?: string;
}

interface SleepData {
    id: number;
    user_id: number;
    date: string;
    sleep_time: string;
    wake_time: string;
    sleep_hours: number;
    created_at?: string;
}

interface HabitCompletion {
    date: string;
    habits: { [key: number]: boolean };
    all_completed: boolean;
    completed_count: number;
    total_habits: number;
}

interface Habit {
    id: number;
    name: string;
    why: string;
    time: string;
}

const AnalysisPage: React.FC = () => {
    const navigate = useNavigate();
    const { user } = useStore();

    const [activeTab, setActiveTab] = useState<"thoughts" | "sleep" | "habits">("thoughts");
    const [loading, setLoading] = useState(true);
    const [currentDate, setCurrentDate] = useState(new Date());

    const [thoughts, setThoughts] = useState<ThoughtData[]>([]);
    const [sleepRecords, setSleepRecords] = useState<SleepData[]>([]);
    const [habitCompletions, setHabitCompletions] = useState<HabitCompletion[]>([]);
    const [habits, setHabits] = useState<Habit[]>([]);
    const [showMenu, setShowMenu] = useState(false);

    const year = currentDate.getFullYear();
    const month = currentDate.getMonth() + 1;
    const monthName = currentDate.toLocaleDateString("en-US", { month: "long", year: "numeric" });

    // Calculate stats
    const totalThoughts = thoughts.length;
    const avgSleepHours = sleepRecords.length > 0
        ? (sleepRecords.reduce((acc, s) => acc + s.sleep_hours, 0) / sleepRecords.length).toFixed(1)
        : 0;
    const perfectDays = habitCompletions.filter(d => d.all_completed).length;
    const completionRate = habitCompletions.length > 0
        ? Math.round((habitCompletions.reduce((acc, d) => acc + d.completed_count, 0) /
            (habitCompletions.length * (habits.length || 1))) * 100)
        : 0;

    // Load monthly analysis data
    useEffect(() => {
        const loadAnalysis = async () => {
            setLoading(true);
            try {
                const response = await fetch(
                    `http://localhost:8000/analysis/monthly?year=${year}&month=${month}`,
                    {
                        method: "GET",
                        credentials: "include",
                        headers: { "Content-Type": "application/json" },
                    }
                );

                if (response.ok) {
                    const data = await response.json();
                    setThoughts(data.thoughts || []);
                    setSleepRecords(data.sleep_records || []);
                    setHabitCompletions(data.habit_completions || []);
                    setHabits(data.habits || []);
                }
            } catch (error) {
                console.error("Error loading analysis:", error);
            } finally {
                setLoading(false);
            }
        };

        loadAnalysis();
    }, [year, month]);

    const goToPreviousMonth = () => {
        setCurrentDate(new Date(year, month - 2, 1));
    };

    const goToNextMonth = () => {
        const today = new Date();
        const nextMonth = new Date(year, month, 1);
        if (nextMonth <= today) {
            setCurrentDate(nextMonth);
        }
    };

    const formatDate = (dateStr: string) => {
        const date = new Date(dateStr);
        return date.toLocaleDateString("en-US", { weekday: "short", day: "numeric" });
    };

    const getDayNumber = (dateStr: string) => {
        return new Date(dateStr).getDate();
    };

    const handleLogout = () => {
        document.cookie = "access_token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
        navigate("/");
    };

    // Get max sleep hours for scaling the chart
    const maxSleepHours = Math.max(...sleepRecords.map(r => r.sleep_hours), 10);

    // Get sleep quality color
    const getSleepQualityColor = (hours: number) => {
        if (hours >= 7 && hours <= 9) return "bg-green-500";
        if (hours >= 6) return "bg-yellow-500";
        if (hours > 0) return "bg-red-500";
        return "bg-slate-600";
    };

    const getSleepQualityText = (hours: number) => {
        if (hours >= 7 && hours <= 9) return { label: "Optimal", color: "text-green-400" };
        if (hours >= 6) return { label: "Fair", color: "text-yellow-400" };
        if (hours > 0) return { label: "Poor", color: "text-red-400" };
        return { label: "Not tracked", color: "text-slate-500" };
    };

    const tabs = [
        { id: "thoughts", label: "Thoughts", icon: Lightbulb, color: "text-purple-400", bg: "bg-purple-500" },
        { id: "sleep", label: "Sleep", icon: Moon, color: "text-indigo-400", bg: "bg-indigo-500" },
        { id: "habits", label: "Habits", icon: CheckSquare, color: "text-green-400", bg: "bg-green-500" },
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
                    <p className="text-white text-lg">Loading analysis...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-slate-950 text-white pb-20">
            {/* Header */}
            <div className="sticky top-0 bg-slate-950/90 backdrop-blur-md border-b border-slate-800 z-40">
                <div className="max-w-7xl mx-auto px-4 py-4">
                    <div className="flex items-center justify-between">
                        {/* Back Button & Logo */}
                        <div className="flex items-center gap-4">
                            <button
                                onClick={() => navigate("/daily")}
                                className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors"
                            >
                                <ChevronLeft className="w-5 h-5" />
                                <span className="hidden sm:block">Back</span>
                            </button>
                            <div className="flex items-center gap-3">
                                <BarChart3 className="w-8 h-8 text-purple-500" />
                                <span className="text-xl font-bold hidden sm:block">Monthly Analysis</span>
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
                            </button>

                            <AnimatePresence>
                                {showMenu && (
                                    <motion.div
                                        initial={{ opacity: 0, y: -10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        exit={{ opacity: 0, y: -10 }}
                                        className="absolute right-0 mt-2 w-56 bg-slate-800 rounded-xl border border-slate-700 shadow-2xl overflow-hidden z-50"
                                    >
                                        <button
                                            onClick={() => navigate("/daily")}
                                            className="w-full flex items-center gap-3 px-4 py-3 hover:bg-slate-700 transition-all"
                                        >
                                            <Home className="w-5 h-5 text-orange-400" />
                                            <span>Daily</span>
                                        </button>
                                        <button
                                            onClick={() => navigate("/insights")}
                                            className="w-full flex items-center gap-3 px-4 py-3 hover:bg-slate-700 transition-all"
                                        >
                                            <TrendingUp className="w-5 h-5 text-blue-400" />
                                            <span>Insights</span>
                                        </button>
                                        <button
                                            onClick={() => navigate("/improve")}
                                            className="w-full flex items-center gap-3 px-4 py-3 hover:bg-slate-700 transition-all"
                                        >
                                            <Sparkles className="w-5 h-5 text-yellow-400" />
                                            <span>Improve</span>
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
            <div className="max-w-7xl mx-auto px-4 py-6">
                {/* Month Navigation */}
                <div className="flex items-center justify-between mb-6">
                    <button
                        onClick={goToPreviousMonth}
                        className="flex items-center gap-2 bg-slate-800 hover:bg-slate-700 px-4 py-2 rounded-xl border border-slate-700 transition-all"
                    >
                        <ChevronLeft className="w-5 h-5" />
                        <span className="hidden sm:block">Previous</span>
                    </button>

                    <div className="flex items-center gap-3">
                        <Calendar className="w-6 h-6 text-orange-500" />
                        <h1 className="text-xl sm:text-2xl font-bold">{monthName}</h1>
                    </div>

                    <button
                        onClick={goToNextMonth}
                        disabled={new Date(year, month, 1) > new Date()}
                        className="flex items-center gap-2 bg-slate-800 hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed px-4 py-2 rounded-xl border border-slate-700 transition-all"
                    >
                        <span className="hidden sm:block">Next</span>
                        <ChevronRight className="w-5 h-5" />
                    </button>
                </div>

                {/* Stats Overview */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="bg-slate-800 rounded-xl p-4 border border-slate-700"
                    >
                        <div className="flex items-center gap-2 mb-2">
                            <Lightbulb className="w-5 h-5 text-purple-400" />
                            <span className="text-sm text-slate-400">Thoughts</span>
                        </div>
                        <div className="text-2xl font-bold text-purple-400">{totalThoughts}</div>
                    </motion.div>

                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.1 }}
                        className="bg-slate-800 rounded-xl p-4 border border-slate-700"
                    >
                        <div className="flex items-center gap-2 mb-2">
                            <Moon className="w-5 h-5 text-indigo-400" />
                            <span className="text-sm text-slate-400">Avg Sleep</span>
                        </div>
                        <div className="text-2xl font-bold text-indigo-400">{avgSleepHours}h</div>
                    </motion.div>

                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.2 }}
                        className="bg-slate-800 rounded-xl p-4 border border-slate-700"
                    >
                        <div className="flex items-center gap-2 mb-2">
                            <Check className="w-5 h-5 text-green-400" />
                            <span className="text-sm text-slate-400">Perfect Days</span>
                        </div>
                        <div className="text-2xl font-bold text-green-400">{perfectDays}</div>
                    </motion.div>

                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.3 }}
                        className="bg-slate-800 rounded-xl p-4 border border-slate-700"
                    >
                        <div className="flex items-center gap-2 mb-2">
                            <TrendingUp className="w-5 h-5 text-orange-400" />
                            <span className="text-sm text-slate-400">Completion</span>
                        </div>
                        <div className="text-2xl font-bold text-orange-400">{completionRate}%</div>
                    </motion.div>
                </div>

                {/* Tabs */}
                <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
                    {tabs.map((tab) => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id as any)}
                            className={`flex items-center gap-2 px-5 py-3 rounded-xl font-semibold transition-all whitespace-nowrap ${activeTab === tab.id
                                    ? `${tab.bg} text-white`
                                    : "bg-slate-800 text-slate-400 hover:bg-slate-700 border border-slate-700"
                                }`}
                        >
                            <tab.icon className="w-5 h-5" />
                            <span>{tab.label}</span>
                        </button>
                    ))}
                </div>

                {/* Tab Content */}
                <AnimatePresence mode="wait">
                    {/* Thoughts Tab */}
                    {activeTab === "thoughts" && (
                        <motion.div
                            key="thoughts"
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -20 }}
                            className="space-y-4"
                        >
                            {habitCompletions.length > 0 ? (
                                <div className="space-y-3">
                                    {habitCompletions.map((day, index) => {
                                        const thought = thoughts.find(t => t.date === day.date);
                                        const isToday = day.date === new Date().toISOString().split("T")[0];

                                        return (
                                            <motion.div
                                                key={day.date}
                                                initial={{ opacity: 0, x: -20 }}
                                                animate={{ opacity: 1, x: 0 }}
                                                transition={{ delay: index * 0.02 }}
                                                className={`bg-slate-800 rounded-xl p-4 border ${isToday ? "border-purple-500" : "border-slate-700"
                                                    }`}
                                            >
                                                <div className="flex items-start gap-4">
                                                    <div className={`p-3 rounded-lg min-w-[70px] text-center ${thought ? "bg-purple-500/20" : "bg-slate-700/50"
                                                        }`}>
                                                        <div className="text-2xl font-bold">{getDayNumber(day.date)}</div>
                                                        <div className="text-xs text-slate-400">
                                                            {new Date(day.date).toLocaleDateString("en-US", { weekday: "short" })}
                                                        </div>
                                                    </div>
                                                    <div className="flex-1">
                                                        {thought ? (
                                                            <>
                                                                <div className="flex items-center gap-2 mb-2">
                                                                    <Lightbulb className="w-4 h-4 text-purple-400" />
                                                                    <span className="text-xs text-purple-400 font-medium">Daily Thought</span>
                                                                </div>
                                                                <p className="text-slate-300 leading-relaxed">"{thought.thought}"</p>
                                                            </>
                                                        ) : (
                                                            <div className="flex items-center gap-2 text-slate-500 italic">
                                                                <Brain className="w-4 h-4" />
                                                                <span>No thought recorded</span>
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            </motion.div>
                                        );
                                    })}
                                </div>
                            ) : (
                                <div className="text-center py-12 bg-slate-800 rounded-2xl border border-slate-700">
                                    <Brain className="w-16 h-16 text-slate-600 mx-auto mb-4" />
                                    <p className="text-slate-400 text-lg">No data for this month</p>
                                    <p className="text-sm text-slate-500 mt-2">
                                        Start writing your daily thoughts to see them here!
                                    </p>
                                </div>
                            )}
                        </motion.div>
                    )}

                    {/* Sleep Tab */}
                    {activeTab === "sleep" && (
                        <motion.div
                            key="sleep"
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -20 }}
                            className="space-y-6"
                        >
                            {/* Sleep Chart */}
                            <div className="bg-slate-800 rounded-2xl border border-slate-700 p-6">
                                <h3 className="text-xl font-bold mb-6 flex items-center gap-2">
                                    <Moon className="w-6 h-6 text-indigo-400" />
                                    Sleep Hours Chart
                                </h3>

                                <div className="relative h-64 md:h-72">
                                    {/* Y-axis labels */}
                                    <div className="absolute left-0 top-0 bottom-8 w-10 flex flex-col justify-between text-xs text-slate-500">
                                        <span>12h</span>
                                        <span>9h</span>
                                        <span>6h</span>
                                        <span>3h</span>
                                        <span>0h</span>
                                    </div>

                                    {/* Chart area */}
                                    <div className="absolute left-12 right-0 top-0 bottom-8 flex items-end gap-1 overflow-x-auto">
                                        {habitCompletions.map((day, idx) => {
                                            const sleep = sleepRecords.find(s => s.date === day.date);
                                            const hours = sleep?.sleep_hours || 0;
                                            const heightPercent = (hours / 12) * 100;
                                            const barColor = getSleepQualityColor(hours);

                                            return (
                                                <motion.div
                                                    key={day.date}
                                                    initial={{ height: 0 }}
                                                    animate={{ height: `${Math.min(heightPercent, 100)}%` }}
                                                    transition={{ duration: 0.5, delay: idx * 0.02 }}
                                                    className={`flex-1 min-w-[16px] ${barColor} rounded-t relative group cursor-pointer`}
                                                    style={{ minHeight: hours > 0 ? "8px" : "2px" }}
                                                >
                                                    {/* Tooltip */}
                                                    <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover:block z-20">
                                                        <div className="bg-slate-900 px-3 py-2 rounded-lg text-xs whitespace-nowrap border border-slate-700 shadow-xl">
                                                            <div className="font-bold text-center mb-1">{getDayNumber(day.date)}</div>
                                                            <div className="font-semibold">{hours > 0 ? `${hours}h` : "No data"}</div>
                                                            {sleep && (
                                                                <div className="text-slate-400 flex items-center gap-1">
                                                                    <Moon className="w-3 h-3" /> {sleep.sleep_time}
                                                                    <span className="mx-1">→</span>
                                                                    <Sun className="w-3 h-3" /> {sleep.wake_time}
                                                                </div>
                                                            )}
                                                        </div>
                                                    </div>
                                                </motion.div>
                                            );
                                        })}
                                    </div>

                                    {/* Reference lines */}
                                    <div className="absolute left-12 right-0 top-0 bottom-8 pointer-events-none">
                                        <div className="absolute w-full border-t border-dashed border-green-500/30" style={{ bottom: `${(7 / 12) * 100}%` }}>
                                            <span className="absolute right-0 -top-3 text-xs text-green-500 bg-slate-800 px-1">7h</span>
                                        </div>
                                        <div className="absolute w-full border-t border-dashed border-green-500/30" style={{ bottom: `${(9 / 12) * 100}%` }}>
                                            <span className="absolute right-0 -top-3 text-xs text-green-500 bg-slate-800 px-1">9h</span>
                                        </div>
                                    </div>
                                </div>

                                {/* Legend */}
                                <div className="flex flex-wrap gap-4 mt-6 justify-center text-sm">
                                    <div className="flex items-center gap-2">
                                        <div className="w-4 h-4 bg-green-500 rounded"></div>
                                        <span className="text-slate-400">Optimal (7-9h)</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <div className="w-4 h-4 bg-yellow-500 rounded"></div>
                                        <span className="text-slate-400">Fair (6-7h)</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <div className="w-4 h-4 bg-red-500 rounded"></div>
                                        <span className="text-slate-400">Poor (&lt;6h)</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <div className="w-4 h-4 bg-slate-600 rounded"></div>
                                        <span className="text-slate-400">No data</span>
                                    </div>
                                </div>
                            </div>

                            {/* Sleep Data Grid */}
                            <div className="space-y-3">
                                {habitCompletions.map((day, index) => {
                                    const sleep = sleepRecords.find(s => s.date === day.date);
                                    const quality = getSleepQualityText(sleep?.sleep_hours || 0);
                                    const isToday = day.date === new Date().toISOString().split("T")[0];

                                    return (
                                        <motion.div
                                            key={day.date}
                                            initial={{ opacity: 0, x: -20 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            transition={{ delay: index * 0.02 }}
                                            className={`bg-slate-800 rounded-xl p-4 border ${isToday ? "border-indigo-500" : "border-slate-700"
                                                }`}
                                        >
                                            <div className="flex items-center gap-4">
                                                <div className={`p-3 rounded-lg min-w-[70px] text-center ${sleep ? "bg-indigo-500/20" : "bg-slate-700/50"
                                                    }`}>
                                                    <div className="text-2xl font-bold">{getDayNumber(day.date)}</div>
                                                    <div className="text-xs text-slate-400">
                                                        {new Date(day.date).toLocaleDateString("en-US", { weekday: "short" })}
                                                    </div>
                                                </div>

                                                {sleep ? (
                                                    <div className="flex-1 grid grid-cols-3 gap-4">
                                                        <div className="flex items-center gap-2">
                                                            <Moon className="w-4 h-4 text-indigo-400" />
                                                            <span className="text-slate-300">{sleep.sleep_time}</span>
                                                        </div>
                                                        <div className="flex items-center gap-2">
                                                            <Sunrise className="w-4 h-4 text-yellow-400" />
                                                            <span className="text-slate-300">{sleep.wake_time}</span>
                                                        </div>
                                                        <div className="flex items-center gap-2">
                                                            <Clock className="w-4 h-4 text-slate-400" />
                                                            <span className={`font-bold ${quality.color}`}>{sleep.sleep_hours}h</span>
                                                            <span className={`text-xs ${quality.color}`}>({quality.label})</span>
                                                        </div>
                                                    </div>
                                                ) : (
                                                    <div className="text-slate-500 italic">No sleep data recorded</div>
                                                )}
                                            </div>
                                        </motion.div>
                                    );
                                })}
                            </div>
                        </motion.div>
                    )}

                    {/* Habits Tab */}
                    {activeTab === "habits" && (
                        <motion.div
                            key="habits"
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -20 }}
                            className="space-y-6"
                        >
                            {/* Habit Grid */}
                            <div className="bg-slate-800 rounded-2xl border border-slate-700 overflow-hidden">
                                {/* Header */}
                                <div className="bg-slate-900 p-4 border-b border-slate-700">
                                    <div className="grid grid-cols-[80px_1fr_100px] gap-4 font-semibold text-slate-400">
                                        <div>Date</div>
                                        <div>Habits</div>
                                        <div className="text-center">Status</div>
                                    </div>
                                </div>

                                {/* Data Rows */}
                                <div className="max-h-[500px] overflow-y-auto">
                                    {habitCompletions.map((day, index) => {
                                        const isToday = day.date === new Date().toISOString().split("T")[0];

                                        return (
                                            <motion.div
                                                key={day.date}
                                                initial={{ opacity: 0 }}
                                                animate={{ opacity: 1 }}
                                                transition={{ delay: index * 0.02 }}
                                                className={`grid grid-cols-[80px_1fr_100px] gap-4 p-4 border-b border-slate-700/50 ${isToday ? "bg-green-900/10" : ""
                                                    }`}
                                            >
                                                <div className="font-medium">
                                                    <div className="text-lg">{getDayNumber(day.date)}</div>
                                                    <div className="text-xs text-slate-500">
                                                        {new Date(day.date).toLocaleDateString("en-US", { weekday: "short" })}
                                                    </div>
                                                </div>

                                                <div className="flex flex-wrap gap-2">
                                                    {habits.map((habit) => {
                                                        const completed = day.habits[habit.id];
                                                        return (
                                                            <div
                                                                key={habit.id}
                                                                className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm ${completed
                                                                        ? "bg-green-500/20 text-green-400"
                                                                        : "bg-slate-700/50 text-slate-500"
                                                                    }`}
                                                            >
                                                                {completed ? (
                                                                    <Check className="w-4 h-4" />
                                                                ) : (
                                                                    <X className="w-4 h-4" />
                                                                )}
                                                                <span className="truncate max-w-[100px]">{habit.name}</span>
                                                            </div>
                                                        );
                                                    })}
                                                </div>

                                                <div className="flex items-center justify-center">
                                                    {day.all_completed ? (
                                                        <span className="flex items-center gap-1 bg-green-500/20 text-green-400 px-3 py-1.5 rounded-full text-sm font-medium">
                                                            <Check className="w-4 h-4" />
                                                            100%
                                                        </span>
                                                    ) : (
                                                        <span className="flex items-center gap-1 bg-orange-500/20 text-orange-400 px-3 py-1.5 rounded-full text-sm font-medium">
                                                            {Math.round((day.completed_count / day.total_habits) * 100)}%
                                                        </span>
                                                    )}
                                                </div>
                                            </motion.div>
                                        );
                                    })}
                                </div>
                            </div>

                            {/* Summary Stats */}
                            <div className="grid sm:grid-cols-3 gap-4">
                                <motion.div
                                    initial={{ opacity: 0, scale: 0.9 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    className="bg-gradient-to-br from-green-900/50 to-green-800/30 rounded-xl p-6 border border-green-500/30"
                                >
                                    <div className="flex items-center gap-3 mb-2">
                                        <Check className="w-6 h-6 text-green-500" />
                                        <span className="text-slate-300">Perfect Days</span>
                                    </div>
                                    <div className="text-4xl font-bold text-green-400">{perfectDays}</div>
                                    <div className="text-sm text-slate-400 mt-1">out of {habitCompletions.length} days</div>
                                </motion.div>

                                <motion.div
                                    initial={{ opacity: 0, scale: 0.9 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    transition={{ delay: 0.1 }}
                                    className="bg-gradient-to-br from-blue-900/50 to-blue-800/30 rounded-xl p-6 border border-blue-500/30"
                                >
                                    <div className="flex items-center gap-3 mb-2">
                                        <TrendingUp className="w-6 h-6 text-blue-500" />
                                        <span className="text-slate-300">Completion Rate</span>
                                    </div>
                                    <div className="text-4xl font-bold text-blue-400">{completionRate}%</div>
                                    <div className="text-sm text-slate-400 mt-1">average daily</div>
                                </motion.div>

                                <motion.div
                                    initial={{ opacity: 0, scale: 0.9 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    transition={{ delay: 0.2 }}
                                    className="bg-gradient-to-br from-orange-900/50 to-orange-800/30 rounded-xl p-6 border border-orange-500/30"
                                >
                                    <div className="flex items-center gap-3 mb-2">
                                        <Flame className="w-6 h-6 text-orange-500" />
                                        <span className="text-slate-300">Total Check-ins</span>
                                    </div>
                                    <div className="text-4xl font-bold text-orange-400">
                                        {habitCompletions.reduce((acc, d) => acc + d.completed_count, 0)}
                                    </div>
                                    <div className="text-sm text-slate-400 mt-1">this month</div>
                                </motion.div>
                            </div>
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
                        className="flex flex-col items-center gap-1 text-orange-400"
                    >
                        <BarChart3 className="w-6 h-6" />
                        <span className="text-xs font-semibold">Analysis</span>
                    </button>
                    <button
                        onClick={() => navigate("/improve")}
                        className="flex flex-col items-center gap-1 text-slate-400 hover:text-white transition-colors"
                    >
                        <Sparkles className="w-6 h-6" />
                        <span className="text-xs">Improve</span>
                    </button>
                    <button
                        onClick={() => navigate("/insights")}
                        className="flex flex-col items-center gap-1 text-slate-400 hover:text-white transition-colors"
                    >
                        <TrendingUp className="w-6 h-6" />
                        <span className="text-xs">Insights</span>
                    </button>
                </div>
            </div>
        </div>
    );
};

export default AnalysisPage;