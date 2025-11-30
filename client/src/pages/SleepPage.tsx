// src/pages/SleepPage.tsx
import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import PageLayout from "../components/PageLayout";
import {
    Moon,
    Sun,
    Clock,
    TrendingUp,
    TrendingDown,
    Calendar,
    ChevronLeft,
    ChevronRight,
    Save,
    RefreshCw,
    Check,
    Loader2,
    Sunrise,
    Zap,
    Star,
    AlertCircle,
    Target,
    BarChart3,
    Brain,
} from "lucide-react";

interface SleepRecord {
    id: number;
    user_id: number;
    date: string;
    sleep_time: string;
    wake_time: string;
    sleep_hours: number;
    created_at?: string;
}

interface SleepInsights {
    insight: string;
    recommendation: string;
    correlation: string;
}

const SleepPage: React.FC = () => {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [sleepRecords, setSleepRecords] = useState<SleepRecord[]>([]);
    const [insights, setInsights] = useState<SleepInsights | null>(null);
    const [activeTab, setActiveTab] = useState<"track" | "history" | "stats">("track");

    // Today's sleep form
    const today = new Date().toISOString().split("T")[0];
    const [sleepTime, setSleepTime] = useState("");
    const [wakeTime, setWakeTime] = useState("");
    const [sleepHours, setSleepHours] = useState<number | null>(null);
    const [saved, setSaved] = useState(false);

    // History navigation
    const [currentMonth, setCurrentMonth] = useState(new Date());

    // Calculate sleep hours
    const calculateSleepHours = (sleep: string, wake: string): number => {
        if (!sleep || !wake) return 0;
        const [sleepH, sleepM] = sleep.split(":").map(Number);
        const [wakeH, wakeM] = wake.split(":").map(Number);

        let sleepMinutes = sleepH * 60 + sleepM;
        let wakeMinutes = wakeH * 60 + wakeM;

        if (wakeMinutes < sleepMinutes) {
            wakeMinutes += 24 * 60;
        }

        const totalMinutes = wakeMinutes - sleepMinutes;
        return Math.round((totalMinutes / 60) * 100) / 100;
    };

    useEffect(() => {
        if (sleepTime && wakeTime) {
            const hours = calculateSleepHours(sleepTime, wakeTime);
            setSleepHours(hours);
        }
    }, [sleepTime, wakeTime]);

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            setLoading(true);

            // Fetch all sleep records
            const recordsResponse = await fetch("http://localhost:8000/sleep-records", {
                method: "GET",
                credentials: "include",
            });
            if (recordsResponse.ok) {
                const data = await recordsResponse.json();
                setSleepRecords(data);
            }

            // Fetch today's record
            const todayResponse = await fetch(`http://localhost:8000/sleep-record/${today}`, {
                method: "GET",
                credentials: "include",
            });
            if (todayResponse.ok) {
                const data = await todayResponse.json();
                if (data) {
                    setSleepTime(data.sleep_time || "");
                    setWakeTime(data.wake_time || "");
                    setSleepHours(data.sleep_hours || null);
                    setSaved(true);
                }
            }

            // Fetch AI insights
            const insightsResponse = await fetch("http://localhost:8000/ai/sleep-insights", {
                method: "GET",
                credentials: "include",
            });
            if (insightsResponse.ok) {
                const data = await insightsResponse.json();
                setInsights(data);
            }
        } catch (error) {
            console.error("Error fetching data:", error);
        } finally {
            setLoading(false);
        }
    };

    const saveSleepRecord = async () => {
        if (!sleepTime || !wakeTime || saving) return;

        setSaving(true);
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
                setSaved(true);
                fetchData(); // Refresh data
            }
        } catch (error) {
            console.error("Error saving sleep record:", error);
        } finally {
            setSaving(false);
        }
    };

    // Get sleep quality
    const getSleepQuality = (hours: number | null) => {
        if (!hours) return { label: "Not tracked", color: "text-slate-400", bg: "bg-slate-700", icon: Moon };
        if (hours < 5) return { label: "Poor", color: "text-red-400", bg: "bg-red-900/30", icon: AlertCircle };
        if (hours < 7) return { label: "Fair", color: "text-yellow-400", bg: "bg-yellow-900/30", icon: TrendingDown };
        if (hours < 9) return { label: "Good", color: "text-green-400", bg: "bg-green-900/30", icon: TrendingUp };
        return { label: "Excellent", color: "text-blue-400", bg: "bg-blue-900/30", icon: Star };
    };

    // Calculate stats
    const calculateStats = () => {
        if (sleepRecords.length === 0) {
            return {
                average: 0,
                best: 0,
                worst: 0,
                totalRecords: 0,
                optimalDays: 0,
                streak: 0,
            };
        }

        const hours = sleepRecords.map(r => r.sleep_hours);
        const average = hours.reduce((a, b) => a + b, 0) / hours.length;
        const optimalDays = hours.filter(h => h >= 7 && h <= 9).length;

        // Calculate streak of good sleep
        let streak = 0;
        const sortedRecords = [...sleepRecords].sort((a, b) =>
            new Date(b.date).getTime() - new Date(a.date).getTime()
        );
        for (const record of sortedRecords) {
            if (record.sleep_hours >= 7 && record.sleep_hours <= 9) {
                streak++;
            } else {
                break;
            }
        }

        return {
            average: Math.round(average * 10) / 10,
            best: Math.max(...hours),
            worst: Math.min(...hours),
            totalRecords: sleepRecords.length,
            optimalDays,
            streak,
        };
    };

    const stats = calculateStats();
    const sleepQuality = getSleepQuality(sleepHours);

    // Get records for current month
    const monthRecords = sleepRecords.filter(record => {
        const recordDate = new Date(record.date);
        return recordDate.getMonth() === currentMonth.getMonth() &&
            recordDate.getFullYear() === currentMonth.getFullYear();
    });

    // Generate calendar days
    const generateCalendarDays = () => {
        const year = currentMonth.getFullYear();
        const month = currentMonth.getMonth();
        const firstDay = new Date(year, month, 1);
        const lastDay = new Date(year, month + 1, 0);
        const daysInMonth = lastDay.getDate();
        const startDayOfWeek = firstDay.getDay();

        const days = [];

        // Empty cells for days before month starts
        for (let i = 0; i < startDayOfWeek; i++) {
            days.push(null);
        }

        // Days of the month
        for (let day = 1; day <= daysInMonth; day++) {
            const dateStr = `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
            const record = sleepRecords.find(r => r.date === dateStr);
            days.push({ day, date: dateStr, record });
        }

        return days;
    };

    if (loading) {
        return (
            <PageLayout pageTitle="Sleep Tracker" pageIcon={Moon}>
                <div className="flex items-center justify-center min-h-[60vh]">
                    <div className="text-center">
                        <motion.div
                            animate={{ rotate: 360 }}
                            transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                            className="w-16 h-16 border-4 border-indigo-500 border-t-transparent rounded-full mx-auto mb-4"
                        />
                        <p className="text-white text-lg">Loading sleep data...</p>
                    </div>
                </div>
            </PageLayout>
        );
    }

    return (
        <PageLayout pageTitle="Sleep Tracker" pageIcon={Moon}>
            <div className="max-w-7xl mx-auto px-4 py-6">
                {/* Tabs */}
                <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
                    <button
                        onClick={() => setActiveTab("track")}
                        className={`flex items-center gap-2 px-5 py-3 rounded-xl font-semibold transition-all whitespace-nowrap ${activeTab === "track"
                                ? "bg-indigo-500 text-white"
                                : "bg-slate-800 text-slate-400 hover:bg-slate-700"
                            }`}
                    >
                        <Moon className="w-5 h-5" />
                        <span>Track Sleep</span>
                    </button>
                    <button
                        onClick={() => setActiveTab("history")}
                        className={`flex items-center gap-2 px-5 py-3 rounded-xl font-semibold transition-all whitespace-nowrap ${activeTab === "history"
                                ? "bg-purple-500 text-white"
                                : "bg-slate-800 text-slate-400 hover:bg-slate-700"
                            }`}
                    >
                        <Calendar className="w-5 h-5" />
                        <span>History</span>
                    </button>
                    <button
                        onClick={() => setActiveTab("stats")}
                        className={`flex items-center gap-2 px-5 py-3 rounded-xl font-semibold transition-all whitespace-nowrap ${activeTab === "stats"
                                ? "bg-green-500 text-white"
                                : "bg-slate-800 text-slate-400 hover:bg-slate-700"
                            }`}
                    >
                        <BarChart3 className="w-5 h-5" />
                        <span>Stats</span>
                    </button>
                </div>

                <AnimatePresence mode="wait">
                    {/* Track Tab */}
                    {activeTab === "track" && (
                        <motion.div
                            key="track"
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -20 }}
                            className="space-y-6"
                        >
                            {/* Today's Sleep Card */}
                            <div className="bg-gradient-to-br from-indigo-900/50 to-purple-900/50 rounded-2xl p-6 border border-indigo-500/30">
                                <div className="flex items-center justify-between mb-6">
                                    <div className="flex items-center gap-3">
                                        <div className="bg-indigo-500/20 p-3 rounded-xl">
                                            <Moon className="w-8 h-8 text-indigo-400" />
                                        </div>
                                        <div>
                                            <h2 className="text-2xl font-bold">Today's Sleep</h2>
                                            <p className="text-slate-400">
                                                {new Date().toLocaleDateString("en-US", {
                                                    weekday: "long",
                                                    month: "long",
                                                    day: "numeric",
                                                })}
                                            </p>
                                        </div>
                                    </div>
                                    {saved && (
                                        <motion.div
                                            initial={{ scale: 0 }}
                                            animate={{ scale: 1 }}
                                            className="flex items-center gap-2 bg-green-500/20 text-green-400 px-4 py-2 rounded-full"
                                        >
                                            <Check className="w-5 h-5" />
                                            <span className="font-medium">Saved</span>
                                        </motion.div>
                                    )}
                                </div>

                                <div className="grid md:grid-cols-3 gap-6">
                                    {/* Bedtime */}
                                    <div className="space-y-3">
                                        <label className="flex items-center gap-2 text-slate-300">
                                            <Moon className="w-5 h-5 text-indigo-400" />
                                            <span className="font-medium">Bedtime (Last Night)</span>
                                        </label>
                                        <input
                                            type="time"
                                            value={sleepTime}
                                            onChange={(e) => setSleepTime(e.target.value)}
                                            className="w-full bg-slate-800 border border-slate-700 rounded-xl p-4 text-white text-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                                        />
                                    </div>

                                    {/* Wake Time */}
                                    <div className="space-y-3">
                                        <label className="flex items-center gap-2 text-slate-300">
                                            <Sunrise className="w-5 h-5 text-yellow-400" />
                                            <span className="font-medium">Wake Up Time</span>
                                        </label>
                                        <input
                                            type="time"
                                            value={wakeTime}
                                            onChange={(e) => setWakeTime(e.target.value)}
                                            className="w-full bg-slate-800 border border-slate-700 rounded-xl p-4 text-white text-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                                        />
                                    </div>

                                    {/* Sleep Duration */}
                                    <div className="space-y-3">
                                        <label className="flex items-center gap-2 text-slate-300">
                                            <Clock className="w-5 h-5 text-slate-400" />
                                            <span className="font-medium">Total Sleep</span>
                                        </label>
                                        <div className={`${sleepQuality.bg} border border-slate-700 rounded-xl p-4 text-center`}>
                                            <div className={`text-4xl font-bold ${sleepQuality.color}`}>
                                                {sleepHours !== null ? `${sleepHours}h` : "--"}
                                            </div>
                                            <div className={`text-sm ${sleepQuality.color} flex items-center justify-center gap-1`}>
                                                <sleepQuality.icon className="w-4 h-4" />
                                                {sleepQuality.label}
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Save Button */}
                                <button
                                    onClick={saveSleepRecord}
                                    disabled={!sleepTime || !wakeTime || saving}
                                    className={`mt-6 w-full flex items-center justify-center gap-3 py-4 rounded-xl font-semibold text-lg transition-all ${sleepTime && wakeTime
                                            ? "bg-indigo-500 hover:bg-indigo-600 text-white"
                                            : "bg-slate-700 text-slate-500 cursor-not-allowed"
                                        }`}
                                >
                                    {saving ? (
                                        <>
                                            <RefreshCw className="w-6 h-6 animate-spin" />
                                            <span>Saving...</span>
                                        </>
                                    ) : (
                                        <>
                                            <Save className="w-6 h-6" />
                                            <span>Save Sleep Record</span>
                                        </>
                                    )}
                                </button>
                            </div>

                            {/* AI Insights */}
                            {insights && (
                                <motion.div
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: 0.2 }}
                                    className="bg-slate-800 rounded-2xl p-6 border border-slate-700"
                                >
                                    <div className="flex items-center gap-3 mb-6">
                                        <div className="bg-purple-500/20 p-3 rounded-xl">
                                            <Brain className="w-6 h-6 text-purple-400" />
                                        </div>
                                        <div>
                                            <h3 className="text-xl font-bold">AI Sleep Insights</h3>
                                            <p className="text-sm text-slate-400">Personalized analysis</p>
                                        </div>
                                    </div>

                                    <div className="grid md:grid-cols-3 gap-4">
                                        <div className="bg-slate-900/50 rounded-xl p-4">
                                            <div className="flex items-center gap-2 mb-2">
                                                <TrendingUp className="w-5 h-5 text-blue-400" />
                                                <h4 className="font-semibold text-blue-400">Insight</h4>
                                            </div>
                                            <p className="text-slate-300 text-sm">{insights.insight}</p>
                                        </div>

                                        <div className="bg-slate-900/50 rounded-xl p-4">
                                            <div className="flex items-center gap-2 mb-2">
                                                <Target className="w-5 h-5 text-green-400" />
                                                <h4 className="font-semibold text-green-400">Recommendation</h4>
                                            </div>
                                            <p className="text-slate-300 text-sm">{insights.recommendation}</p>
                                        </div>

                                        <div className="bg-slate-900/50 rounded-xl p-4">
                                            <div className="flex items-center gap-2 mb-2">
                                                <Zap className="w-5 h-5 text-yellow-400" />
                                                <h4 className="font-semibold text-yellow-400">Habit Correlation</h4>
                                            </div>
                                            <p className="text-slate-300 text-sm">{insights.correlation}</p>
                                        </div>
                                    </div>
                                </motion.div>
                            )}

                            {/* Sleep Tips */}
                            <div className="bg-slate-800 rounded-2xl p-6 border border-slate-700">
                                <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
                                    <Star className="w-6 h-6 text-yellow-400" />
                                    Tips for Better Sleep
                                </h3>
                                <div className="grid md:grid-cols-2 gap-4">
                                    {[
                                        { tip: "Maintain a consistent sleep schedule", icon: "🕐" },
                                        { tip: "Avoid screens 1 hour before bed", icon: "📱" },
                                        { tip: "Keep your room cool and dark", icon: "🌙" },
                                        { tip: "Limit caffeine after 2 PM", icon: "☕" },
                                        { tip: "Exercise regularly, but not before bed", icon: "🏃" },
                                        { tip: "Create a relaxing bedtime routine", icon: "🧘" },
                                    ].map((item, index) => (
                                        <div
                                            key={index}
                                            className="flex items-center gap-3 bg-slate-900/50 rounded-xl p-4"
                                        >
                                            <span className="text-2xl">{item.icon}</span>
                                            <span className="text-slate-300">{item.tip}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </motion.div>
                    )}

                    {/* History Tab */}
                    {activeTab === "history" && (
                        <motion.div
                            key="history"
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -20 }}
                            className="space-y-6"
                        >
                            {/* Month Navigation */}
                            <div className="flex items-center justify-between">
                                <button
                                    onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1))}
                                    className="flex items-center gap-2 bg-slate-800 hover:bg-slate-700 px-4 py-2 rounded-xl border border-slate-700 transition-all"
                                >
                                    <ChevronLeft className="w-5 h-5" />
                                    <span className="hidden sm:block">Previous</span>
                                </button>

                                <h3 className="text-xl font-bold">
                                    {currentMonth.toLocaleDateString("en-US", { month: "long", year: "numeric" })}
                                </h3>

                                <button
                                    onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1))}
                                    disabled={currentMonth >= new Date()}
                                    className="flex items-center gap-2 bg-slate-800 hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed px-4 py-2 rounded-xl border border-slate-700 transition-all"
                                >
                                    <span className="hidden sm:block">Next</span>
                                    <ChevronRight className="w-5 h-5" />
                                </button>
                            </div>

                            {/* Calendar Grid */}
                            <div className="bg-slate-800 rounded-2xl p-6 border border-slate-700">
                                {/* Weekday Headers */}
                                <div className="grid grid-cols-7 gap-2 mb-4">
                                    {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
                                        <div key={day} className="text-center text-sm font-medium text-slate-400 py-2">
                                            {day}
                                        </div>
                                    ))}
                                </div>

                                {/* Calendar Days */}
                                <div className="grid grid-cols-7 gap-2">
                                    {generateCalendarDays().map((day, index) => {
                                        if (!day) {
                                            return <div key={`empty-${index}`} className="aspect-square" />;
                                        }

                                        const quality = getSleepQuality(day.record?.sleep_hours || null);
                                        const isToday = day.date === today;

                                        return (
                                            <motion.div
                                                key={day.date}
                                                initial={{ opacity: 0, scale: 0.8 }}
                                                animate={{ opacity: 1, scale: 1 }}
                                                transition={{ delay: index * 0.01 }}
                                                className={`aspect-square rounded-xl p-1 sm:p-2 flex flex-col items-center justify-center cursor-pointer transition-all ${day.record ? quality.bg : "bg-slate-700/30"
                                                    } ${isToday ? "ring-2 ring-indigo-500" : ""} hover:scale-105`}
                                            >
                                                <div className={`text-sm sm:text-base font-medium ${day.record ? quality.color : "text-slate-500"
                                                    }`}>
                                                    {day.day}
                                                </div>
                                                {day.record && (
                                                    <div className={`text-xs ${quality.color} hidden sm:block`}>
                                                        {day.record.sleep_hours}h
                                                    </div>
                                                )}
                                            </motion.div>
                                        );
                                    })}
                                </div>

                                {/* Legend */}
                                <div className="flex flex-wrap gap-4 mt-6 justify-center text-sm">
                                    <div className="flex items-center gap-2">
                                        <div className="w-4 h-4 bg-green-900/30 rounded"></div>
                                        <span className="text-slate-400">Good (7-9h)</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <div className="w-4 h-4 bg-yellow-900/30 rounded"></div>
                                        <span className="text-slate-400">Fair (5-7h)</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <div className="w-4 h-4 bg-red-900/30 rounded"></div>
                                        <span className="text-slate-400">Poor (&lt;5h)</span>
                                    </div>
                                </div>
                            </div>

                            {/* Recent Records List */}
                            <div className="bg-slate-800 rounded-2xl border border-slate-700 overflow-hidden">
                                <div className="bg-slate-900 p-4 border-b border-slate-700">
                                    <h3 className="font-bold">Recent Sleep Records</h3>
                                </div>
                                <div className="max-h-[400px] overflow-y-auto custom-scrollbar">
                                    {sleepRecords.slice(0, 14).map((record, index) => {
                                        const quality = getSleepQuality(record.sleep_hours);
                                        return (
                                            <motion.div
                                                key={record.id}
                                                initial={{ opacity: 0, x: -20 }}
                                                animate={{ opacity: 1, x: 0 }}
                                                transition={{ delay: index * 0.05 }}
                                                className="flex items-center gap-4 p-4 border-b border-slate-700/50 hover:bg-slate-700/30"
                                            >
                                                <div className={`w-12 h-12 rounded-xl ${quality.bg} flex items-center justify-center`}>
                                                    <quality.icon className={`w-6 h-6 ${quality.color}`} />
                                                </div>
                                                <div className="flex-1">
                                                    <div className="font-medium">
                                                        {new Date(record.date).toLocaleDateString("en-US", {
                                                            weekday: "long",
                                                            month: "short",
                                                            day: "numeric",
                                                        })}
                                                    </div>
                                                    <div className="text-sm text-slate-400 flex items-center gap-4">
                                                        <span className="flex items-center gap-1">
                                                            <Moon className="w-3 h-3" /> {record.sleep_time}
                                                        </span>
                                                        <span>→</span>
                                                        <span className="flex items-center gap-1">
                                                            <Sunrise className="w-3 h-3" /> {record.wake_time}
                                                        </span>
                                                    </div>
                                                </div>
                                                <div className="text-right">
                                                    <div className={`text-2xl font-bold ${quality.color}`}>
                                                        {record.sleep_hours}h
                                                    </div>
                                                    <div className={`text-xs ${quality.color}`}>{quality.label}</div>
                                                </div>
                                            </motion.div>
                                        );
                                    })}
                                </div>
                            </div>
                        </motion.div>
                    )}

                    {/* Stats Tab */}
                    {activeTab === "stats" && (
                        <motion.div
                            key="stats"
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -20 }}
                            className="space-y-6"
                        >
                            {/* Stats Cards */}
                            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                                <motion.div
                                    initial={{ opacity: 0, scale: 0.8 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    className="bg-gradient-to-br from-indigo-900/50 to-purple-900/50 rounded-xl p-6 border border-indigo-500/30"
                                >
                                    <div className="flex items-center gap-2 mb-2">
                                        <Clock className="w-5 h-5 text-indigo-400" />
                                        <span className="text-sm text-slate-400">Average</span>
                                    </div>
                                    <div className="text-4xl font-bold text-indigo-400">{stats.average}h</div>
                                    <div className="text-sm text-slate-400">per night</div>
                                </motion.div>

                                <motion.div
                                    initial={{ opacity: 0, scale: 0.8 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    transition={{ delay: 0.1 }}
                                    className="bg-gradient-to-br from-green-900/50 to-emerald-900/50 rounded-xl p-6 border border-green-500/30"
                                >
                                    <div className="flex items-center gap-2 mb-2">
                                        <TrendingUp className="w-5 h-5 text-green-400" />
                                        <span className="text-sm text-slate-400">Best</span>
                                    </div>
                                    <div className="text-4xl font-bold text-green-400">{stats.best}h</div>
                                    <div className="text-sm text-slate-400">longest sleep</div>
                                </motion.div>

                                <motion.div
                                    initial={{ opacity: 0, scale: 0.8 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    transition={{ delay: 0.2 }}
                                    className="bg-gradient-to-br from-yellow-900/50 to-orange-900/50 rounded-xl p-6 border border-yellow-500/30"
                                >
                                    <div className="flex items-center gap-2 mb-2">
                                        <Target className="w-5 h-5 text-yellow-400" />
                                        <span className="text-sm text-slate-400">Optimal Days</span>
                                    </div>
                                    <div className="text-4xl font-bold text-yellow-400">{stats.optimalDays}</div>
                                    <div className="text-sm text-slate-400">7-9 hours</div>
                                </motion.div>

                                <motion.div
                                    initial={{ opacity: 0, scale: 0.8 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    transition={{ delay: 0.3 }}
                                    className="bg-gradient-to-br from-purple-900/50 to-pink-900/50 rounded-xl p-6 border border-purple-500/30"
                                >
                                    <div className="flex items-center gap-2 mb-2">
                                        <Zap className="w-5 h-5 text-purple-400" />
                                        <span className="text-sm text-slate-400">Good Sleep Streak</span>
                                    </div>
                                    <div className="text-4xl font-bold text-purple-400">{stats.streak}</div>
                                    <div className="text-sm text-slate-400">days</div>
                                </motion.div>
                            </div>

                            {/* Sleep Quality Distribution */}
                            <div className="bg-slate-800 rounded-2xl p-6 border border-slate-700">
                                <h3 className="text-xl font-bold mb-6 flex items-center gap-2">
                                    <BarChart3 className="w-6 h-6 text-blue-400" />
                                    Sleep Quality Distribution
                                </h3>

                                {stats.totalRecords > 0 ? (
                                    <div className="space-y-4">
                                        {[
                                            { label: "Excellent (9+ hours)", color: "bg-blue-500", count: sleepRecords.filter(r => r.sleep_hours >= 9).length },
                                            { label: "Good (7-9 hours)", color: "bg-green-500", count: sleepRecords.filter(r => r.sleep_hours >= 7 && r.sleep_hours < 9).length },
                                            { label: "Fair (5-7 hours)", color: "bg-yellow-500", count: sleepRecords.filter(r => r.sleep_hours >= 5 && r.sleep_hours < 7).length },
                                            { label: "Poor (<5 hours)", color: "bg-red-500", count: sleepRecords.filter(r => r.sleep_hours < 5).length },
                                        ].map((item) => {
                                            const percentage = (item.count / stats.totalRecords) * 100;
                                            return (
                                                <div key={item.label}>
                                                    <div className="flex justify-between text-sm mb-1">
                                                        <span className="text-slate-300">{item.label}</span>
                                                        <span className="text-slate-400">{item.count} days ({Math.round(percentage)}%)</span>
                                                    </div>
                                                    <div className="bg-slate-700 rounded-full h-3 overflow-hidden">
                                                        <motion.div
                                                            initial={{ width: 0 }}
                                                            animate={{ width: `${percentage}%` }}
                                                            transition={{ duration: 1, ease: "easeOut" }}
                                                            className={`h-full ${item.color} rounded-full`}
                                                        />
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                ) : (
                                    <div className="text-center py-12 text-slate-400">
                                        <Moon className="w-12 h-12 mx-auto mb-4 opacity-50" />
                                        <p>No sleep records yet</p>
                                        <p className="text-sm">Start tracking your sleep to see stats</p>
                                    </div>
                                )}
                            </div>

                            {/* Weekly Pattern */}
                            <div className="bg-slate-800 rounded-2xl p-6 border border-slate-700">
                                <h3 className="text-xl font-bold mb-6">Last 7 Days</h3>
                                <div className="flex items-end justify-between gap-2 h-40">
                                    {sleepRecords.slice(0, 7).reverse().map((record, index) => {
                                        const quality = getSleepQuality(record.sleep_hours);
                                        const heightPercent = (record.sleep_hours / 12) * 100;
                                        return (
                                            <motion.div
                                                key={record.id}
                                                initial={{ height: 0 }}
                                                animate={{ height: `${Math.min(heightPercent, 100)}%` }}
                                                transition={{ duration: 0.5, delay: index * 0.1 }}
                                                className="flex-1 flex flex-col items-center"
                                            >
                                                <div
                                                    className={`w-full ${quality.bg} rounded-t-lg relative group cursor-pointer`}
                                                    style={{ height: "100%" }}
                                                >
                                                    {/* Tooltip */}
                                                    <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover:block z-10">
                                                        <div className="bg-slate-900 px-3 py-2 rounded-lg text-xs whitespace-nowrap border border-slate-700">
                                                            <div className="font-bold">{record.sleep_hours}h</div>
                                                            <div className="text-slate-400">{quality.label}</div>
                                                        </div>
                                                    </div>
                                                </div>
                                                <div className="text-xs text-slate-400 mt-2">
                                                    {new Date(record.date).toLocaleDateString("en-US", { weekday: "short" })}
                                                </div>
                                            </motion.div>
                                        );
                                    })}
                                </div>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </PageLayout>
    );
};

export default SleepPage;