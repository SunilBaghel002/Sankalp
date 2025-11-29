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
        setCurrentDate(new Date(year, month, 1));
    };

    const formatDate = (dateStr: string) => {
        const date = new Date(dateStr);
        return date.toLocaleDateString("en-US", { weekday: "short", day: "numeric" });
    };

    const handleLogout = () => {
        document.cookie = "access_token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
        navigate("/");
    };

    // Get max sleep hours for scaling the chart
    const maxSleepHours = Math.max(...sleepRecords.map(r => r.sleep_hours), 10);

    const tabs = [
        { id: "thoughts", label: "Thoughts", icon: Lightbulb, color: "text-purple-400" },
        { id: "sleep", label: "Sleep", icon: Moon, color: "text-indigo-400" },
        { id: "habits", label: "Habits", icon: CheckSquare, color: "text-green-400" },
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
        <div className="min-h-screen bg-slate-950 text-white">
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
                                <span className="text-xl font-bold">Analysis</span>
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
                                        className="absolute right-0 mt-2 w-56 bg-slate-800 rounded-xl border border-slate-700 shadow-2xl overflow-hidden"
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
                {/* Month Navigation */}
                <div className="flex items-center justify-between mb-8">
                    <button
                        onClick={goToPreviousMonth}
                        className="flex items-center gap-2 bg-slate-800 hover:bg-slate-700 px-4 py-2 rounded-xl border border-slate-700 transition-all"
                    >
                        <ChevronLeft className="w-5 h-5" />
                        <span className="hidden sm:block">Previous</span>
                    </button>

                    <div className="flex items-center gap-3">
                        <Calendar className="w-6 h-6 text-orange-500" />
                        <h1 className="text-2xl font-bold">{monthName}</h1>
                    </div>

                    <button
                        onClick={goToNextMonth}
                        className="flex items-center gap-2 bg-slate-800 hover:bg-slate-700 px-4 py-2 rounded-xl border border-slate-700 transition-all"
                    >
                        <span className="hidden sm:block">Next</span>
                        <ChevronRight className="w-5 h-5" />
                    </button>
                </div>

                {/* Tabs */}
                <div className="flex gap-2 mb-8 overflow-x-auto pb-2">
                    {tabs.map((tab) => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id as any)}
                            className={`flex items-center gap-2 px-6 py-3 rounded-xl font-semibold transition-all whitespace-nowrap ${activeTab === tab.id
                                    ? "bg-slate-800 border-2 border-orange-500"
                                    : "bg-slate-800/50 border border-slate-700 hover:border-slate-600"
                                }`}
                        >
                            <tab.icon className={`w-5 h-5 ${tab.color}`} />
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
                            <div className="bg-slate-800 rounded-2xl border border-slate-700 overflow-hidden">
                                <div className="grid grid-cols-[120px_1fr] sm:grid-cols-[150px_1fr] divide-x divide-slate-700">
                                    {/* Header */}
                                    <div className="bg-slate-900 p-4 font-semibold text-slate-400">
                                        Date
                                    </div>
                                    <div className="bg-slate-900 p-4 font-semibold text-slate-400">
                                        Thought
                                    </div>

                                    {/* Data Rows */}
                                    {habitCompletions.map((day) => {
                                        const thought = thoughts.find(t => t.date === day.date);
                                        return (
                                            <React.Fragment key={day.date}>
                                                <div className="p-4 border-t border-slate-700 flex items-center gap-2">
                                                    <span className="font-medium">{formatDate(day.date)}</span>
                                                </div>
                                                <div className="p-4 border-t border-slate-700">
                                                    {thought ? (
                                                        <div className="flex items-start gap-3">
                                                            <Lightbulb className="w-5 h-5 text-purple-400 flex-shrink-0 mt-0.5" />
                                                            <p className="text-slate-300">{thought.thought}</p>
                                                        </div>
                                                    ) : (
                                                        <span className="text-slate-500 italic">No thought recorded</span>
                                                    )}
                                                </div>
                                            </React.Fragment>
                                        );
                                    })}
                                </div>
                            </div>

                            {thoughts.length === 0 && (
                                <div className="text-center py-12">
                                    <Brain className="w-16 h-16 text-slate-600 mx-auto mb-4" />
                                    <p className="text-slate-400">No thoughts recorded this month</p>
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

                                <div className="relative h-64 md:h-80">
                                    {/* Y-axis labels */}
                                    <div className="absolute left-0 top-0 bottom-8 w-12 flex flex-col justify-between text-xs text-slate-500">
                                        <span>{maxSleepHours}h</span>
                                        <span>{Math.round(maxSleepHours * 0.75)}h</span>
                                        <span>{Math.round(maxSleepHours * 0.5)}h</span>
                                        <span>{Math.round(maxSleepHours * 0.25)}h</span>
                                        <span>0h</span>
                                    </div>

                                    {/* Chart area */}
                                    <div className="absolute left-14 right-0 top-0 bottom-8 flex items-end gap-1 overflow-x-auto pb-2">
                                        {habitCompletions.map((day) => {
                                            const sleep = sleepRecords.find(s => s.date === day.date);
                                            const hours = sleep?.sleep_hours || 0;
                                            const heightPercent = (hours / maxSleepHours) * 100;
                                            const date = new Date(day.date);

                                            // Color based on sleep quality
                                            let barColor = "bg-slate-600";
                                            if (hours >= 7 && hours <= 9) barColor = "bg-green-500";
                                            else if (hours >= 5) barColor = "bg-yellow-500";
                                            else if (hours > 0) barColor = "bg-red-500";

                                            return (
                                                <div key={day.date} className="flex-1 min-w-[20px] flex flex-col items-center">
                                                    <motion.div
                                                        initial={{ height: 0 }}
                                                        animate={{ height: `${heightPercent}%` }}
                                                        transition={{ duration: 0.5, delay: 0.02 * date.getDate() }}
                                                        className={`w-full ${barColor} rounded-t-md relative group cursor-pointer`}
                                                        style={{ minHeight: hours > 0 ? "4px" : "0" }}
                                                    >
                                                        {/* Tooltip */}
                                                        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover:block z-10">
                                                            <div className="bg-slate-900 px-3 py-2 rounded-lg text-xs whitespace-nowrap border border-slate-700">
                                                                <div className="font-semibold">{hours}h</div>
                                                                {sleep && (
                                                                    <div className="text-slate-400">
                                                                        {sleep.sleep_time} → {sleep.wake_time}
                                                                    </div>
                                                                )}
                                                            </div>
                                                        </div>
                                                    </motion.div>
                                                    <span className="text-xs text-slate-500 mt-2 rotate-45 origin-left">
                                                        {date.getDate()}
                                                    </span>
                                                </div>
                                            );
                                        })}
                                    </div>

                                    {/* Reference lines */}
                                    <div className="absolute left-14 right-0 top-0 bottom-8 pointer-events-none">
                                        <div className="absolute w-full border-t border-dashed border-green-500/30" style={{ bottom: `${(7 / maxSleepHours) * 100}%` }}>
                                            <span className="absolute right-0 -top-3 text-xs text-green-500">7h</span>
                                        </div>
                                        <div className="absolute w-full border-t border-dashed border-green-500/30" style={{ bottom: `${(9 / maxSleepHours) * 100}%` }}>
                                            <span className="absolute right-0 -top-3 text-xs text-green-500">9h</span>
                                        </div>
                                    </div>
                                </div>

                                {/* Legend */}
                                <div className="flex flex-wrap gap-4 mt-6 justify-center">
                                    <div className="flex items-center gap-2">
                                        <div className="w-4 h-4 bg-green-500 rounded"></div>
                                        <span className="text-sm text-slate-400">Optimal (7-9h)</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <div className="w-4 h-4 bg-yellow-500 rounded"></div>
                                        <span className="text-sm text-slate-400">Fair (5-7h)</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <div className="w-4 h-4 bg-red-500 rounded"></div>
                                        <span className="text-sm text-slate-400">Poor (&lt;5h)</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <div className="w-4 h-4 bg-slate-600 rounded"></div>
                                        <span className="text-sm text-slate-400">Not tracked</span>
                                    </div>
                                </div>
                            </div>

                            {/* Sleep Data Grid */}
                            <div className="bg-slate-800 rounded-2xl border border-slate-700 overflow-hidden">
                                <div className="grid grid-cols-[120px_1fr_1fr_100px] sm:grid-cols-[150px_1fr_1fr_120px] divide-x divide-slate-700">
                                    {/* Header */}
                                    <div className="bg-slate-900 p-4 font-semibold text-slate-400">Date</div>
                                    <div className="bg-slate-900 p-4 font-semibold text-slate-400">Bedtime</div>
                                    <div className="bg-slate-900 p-4 font-semibold text-slate-400">Wake Up</div>
                                    <div className="bg-slate-900 p-4 font-semibold text-slate-400">Hours</div>

                                    {/* Data Rows */}
                                    {habitCompletions.map((day) => {
                                        const sleep = sleepRecords.find(s => s.date === day.date);
                                        return (
                                            <React.Fragment key={day.date}>
                                                <div className="p-4 border-t border-slate-700 font-medium">
                                                    {formatDate(day.date)}
                                                </div>
                                                <div className="p-4 border-t border-slate-700">
                                                    {sleep?.sleep_time || <span className="text-slate-500">--</span>}
                                                </div>
                                                <div className="p-4 border-t border-slate-700">
                                                    {sleep?.wake_time || <span className="text-slate-500">--</span>}
                                                </div>
                                                <div className="p-4 border-t border-slate-700">
                                                    {sleep ? (
                                                        <span className={`font-semibold ${sleep.sleep_hours >= 7 ? "text-green-400" :
                                                                sleep.sleep_hours >= 5 ? "text-yellow-400" : "text-red-400"
                                                            }`}>
                                                            {sleep.sleep_hours}h
                                                        </span>
                                                    ) : (
                                                        <span className="text-slate-500">--</span>
                                                    )}
                                                </div>
                                            </React.Fragment>
                                        );
                                    })}
                                </div>
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
                            className="space-y-4"
                        >
                            <div className="bg-slate-800 rounded-2xl border border-slate-700 overflow-x-auto">
                                <table className="w-full">
                                    <thead>
                                        <tr className="bg-slate-900">
                                            <th className="p-4 text-left font-semibold text-slate-400 sticky left-0 bg-slate-900 z-10">
                                                Date
                                            </th>
                                            {habits.map((habit) => (
                                                <th key={habit.id} className="p-4 text-center font-semibold text-slate-400 min-w-[100px]">
                                                    <div className="truncate max-w-[120px]" title={habit.name}>
                                                        {habit.name}
                                                    </div>
                                                </th>
                                            ))}
                                            <th className="p-4 text-center font-semibold text-slate-400">
                                                Status
                                            </th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {habitCompletions.map((day) => (
                                            <tr key={day.date} className="border-t border-slate-700">
                                                <td className="p-4 font-medium sticky left-0 bg-slate-800 z-10">
                                                    {formatDate(day.date)}
                                                </td>
                                                {habits.map((habit) => {
                                                    const completed = day.habits[habit.id];
                                                    return (
                                                        <td key={habit.id} className="p-4 text-center">
                                                            {completed ? (
                                                                <motion.div
                                                                    initial={{ scale: 0 }}
                                                                    animate={{ scale: 1 }}
                                                                    className="inline-flex items-center justify-center w-8 h-8 bg-green-500/20 rounded-lg"
                                                                >
                                                                    <Check className="w-5 h-5 text-green-500" />
                                                                </motion.div>
                                                            ) : (
                                                                <div className="inline-flex items-center justify-center w-8 h-8 bg-red-500/20 rounded-lg">
                                                                    <X className="w-5 h-5 text-red-500" />
                                                                </div>
                                                            )}
                                                        </td>
                                                    );
                                                })}
                                                <td className="p-4 text-center">
                                                    {day.all_completed ? (
                                                        <span className="inline-flex items-center gap-1 bg-green-500/20 text-green-400 px-3 py-1 rounded-full text-sm">
                                                            <Check className="w-4 h-4" />
                                                            Complete
                                                        </span>
                                                    ) : (
                                                        <span className="inline-flex items-center gap-1 bg-orange-500/20 text-orange-400 px-3 py-1 rounded-full text-sm">
                                                            {day.completed_count}/{day.total_habits}
                                                        </span>
                                                    )}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>

                            {/* Summary Stats */}
                            <div className="grid sm:grid-cols-3 gap-4">
                                <div className="bg-slate-800 rounded-xl p-6 border border-slate-700">
                                    <div className="flex items-center gap-3 mb-2">
                                        <Check className="w-6 h-6 text-green-500" />
                                        <span className="text-slate-400">Perfect Days</span>
                                    </div>
                                    <div className="text-3xl font-bold text-green-400">
                                        {habitCompletions.filter(d => d.all_completed).length}
                                    </div>
                                </div>
                                <div className="bg-slate-800 rounded-xl p-6 border border-slate-700">
                                    <div className="flex items-center gap-3 mb-2">
                                        <TrendingUp className="w-6 h-6 text-blue-500" />
                                        <span className="text-slate-400">Completion Rate</span>
                                    </div>
                                    <div className="text-3xl font-bold text-blue-400">
                                        {habitCompletions.length > 0 ? (
                                            Math.round(
                                                (habitCompletions.reduce((acc, d) => acc + d.completed_count, 0) /
                                                    (habitCompletions.length * (habits.length || 1))) * 100
                                            )
                                        ) : 0}%
                                    </div>
                                </div>
                                <div className="bg-slate-800 rounded-xl p-6 border border-slate-700">
                                    <div className="flex items-center gap-3 mb-2">
                                        <Flame className="w-6 h-6 text-orange-500" />
                                        <span className="text-slate-400">Total Check-ins</span>
                                    </div>
                                    <div className="text-3xl font-bold text-orange-400">
                                        {habitCompletions.reduce((acc, d) => acc + d.completed_count, 0)}
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </div>
    );
};

export default AnalysisPage;