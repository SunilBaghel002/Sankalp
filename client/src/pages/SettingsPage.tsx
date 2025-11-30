// src/pages/SettingsPage.tsx
import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { useStore } from "../store/useStore";
import {
    ArrowLeft,
    Settings,
    User,
    Calendar,
    Bell,
    Shield,
    Trash2,
    LogOut,
    ChevronRight,
    Check,
    X,
    Loader2,
    Moon,
    Sun,
    Palette,
    Download,
    AlertTriangle,
    Flame,
    Target,
    Clock,
    Edit3,
    Save,
    Home,
    BarChart3,
    Sparkles,
    TrendingUp,
    Link2,
    Link2Off,
} from "lucide-react";
import CalendarSync from "../components/CalendarSync";
import PageLayout from "../components/PageLayout";
import PushNotificationSettings from '../components/PushNotificationSettings';

interface Habit {
    id: number;
    name: string;
    why: string;
    time: string;
}

const SettingsPage: React.FC = () => {
    const navigate = useNavigate();
    const { user, setUser } = useStore();

    const [loading, setLoading] = useState(true);
    const [habits, setHabits] = useState<Habit[]>([]);
    const [editingHabit, setEditingHabit] = useState<number | null>(null);
    const [editedHabit, setEditedHabit] = useState<Habit | null>(null);
    const [savingHabit, setSavingHabit] = useState(false);
    const [calendarConnected, setCalendarConnected] = useState(false);
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const [activeSection, setActiveSection] = useState<string>("profile");

    const [stats, setStats] = useState({
        total_completed_days: 0,
        total_checkins: 0,
        current_streak: 0,
        deposit_paid: false,
    });
    <PushNotificationSettings />

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        try {
            // Load habits
            const habitsResponse = await fetch("http://localhost:8000/habits", {
                method: "GET",
                credentials: "include",
            });
            if (habitsResponse.ok) {
                const habitsData = await habitsResponse.json();
                setHabits(habitsData);
            }

            // Load stats
            const statsResponse = await fetch("http://localhost:8000/stats", {
                method: "GET",
                credentials: "include",
            });
            if (statsResponse.ok) {
                const statsData = await statsResponse.json();
                setStats(statsData);
            }

            // Check calendar status
            const calendarResponse = await fetch("http://localhost:8000/calendar/status", {
                method: "GET",
                credentials: "include",
            });
            if (calendarResponse.ok) {
                const calendarData = await calendarResponse.json();
                setCalendarConnected(calendarData.connected);
            }
        } catch (error) {
            console.error("Error loading data:", error);
        } finally {
            setLoading(false);
        }
    };

    const handleEditHabit = (habit: Habit) => {
        setEditingHabit(habit.id);
        setEditedHabit({ ...habit });
    };

    const handleSaveHabit = async () => {
        if (!editedHabit) return;

        setSavingHabit(true);
        try {
            // Note: This would need a backend endpoint to update a single habit
            // For now, we'll update all habits
            const updatedHabits = habits.map((h) =>
                h.id === editedHabit.id ? editedHabit : h
            );

            const response = await fetch("http://localhost:8000/habits", {
                method: "POST",
                credentials: "include",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(updatedHabits.map(h => ({
                    name: h.name,
                    why: h.why,
                    time: h.time,
                }))),
            });

            if (response.ok) {
                setHabits(updatedHabits);
                setEditingHabit(null);
                setEditedHabit(null);
            }
        } catch (error) {
            console.error("Error saving habit:", error);
        } finally {
            setSavingHabit(false);
        }
    };

    const handleExportData = async () => {
        try {
            // Fetch all data
            const [insightsRes, thoughtsRes, sleepRes] = await Promise.all([
                fetch("http://localhost:8000/insights", { method: "GET", credentials: "include" }),
                fetch("http://localhost:8000/daily-thoughts", { method: "GET", credentials: "include" }),
                fetch("http://localhost:8000/sleep-records", { method: "GET", credentials: "include" }),
            ]);

            const insights = await insightsRes.json();
            const thoughts = await thoughtsRes.json();
            const sleep = await sleepRes.json();

            const exportData = {
                user: {
                    name: user?.name,
                    email: user?.email,
                },
                habits,
                stats,
                insights,
                thoughts,
                sleepRecords: sleep,
                exportedAt: new Date().toISOString(),
            };

            // Download as JSON
            const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: "application/json" });
            const url = URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.href = url;
            a.download = `sankalp-data-${new Date().toISOString().split("T")[0]}.json`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
        } catch (error) {
            console.error("Error exporting data:", error);
        }
    };

    const handleLogout = () => {
        document.cookie = "access_token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
        setUser(null);
        navigate("/");
    };

    const sections = [
        { id: "profile", label: "Profile", icon: User },
        { id: "habits", label: "My Habits", icon: Target },
        { id: "calendar", label: "Calendar", icon: Calendar },
        { id: "data", label: "Data & Privacy", icon: Shield },
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
                    <p className="text-white text-lg">Loading settings...</p>
                </div>
            </div>
        );
    }

    return (
        <PageLayout pageTitle="Settings" pageIcon={Settings}>
            <div className="min-h-screen bg-slate-950 text-white pb-20">

                {/* Main Content */}
                <div className="max-w-4xl mx-auto px-4 py-6">
                    {/* Section Tabs */}
                    <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
                        {sections.map((section) => (
                            <button
                                key={section.id}
                                onClick={() => setActiveSection(section.id)}
                                className={`flex items-center gap-2 px-4 py-2 rounded-xl font-medium whitespace-nowrap transition-all ${activeSection === section.id
                                    ? "bg-orange-500 text-white"
                                    : "bg-slate-800 text-slate-400 hover:bg-slate-700"
                                    }`}
                            >
                                <section.icon className="w-4 h-4" />
                                <span>{section.label}</span>
                            </button>
                        ))}
                    </div>

                    <AnimatePresence mode="wait">
                        {/* Profile Section */}
                        {activeSection === "profile" && (
                            <motion.div
                                key="profile"
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -20 }}
                                className="space-y-6"
                            >
                                {/* User Info */}
                                <div className="bg-slate-800 rounded-2xl p-6 border border-slate-700">
                                    <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                                        <User className="w-5 h-5 text-blue-400" />
                                        Account Information
                                    </h3>

                                    <div className="space-y-4">
                                        <div className="flex items-center justify-between p-4 bg-slate-900/50 rounded-xl">
                                            <div>
                                                <p className="text-sm text-slate-400">Name</p>
                                                <p className="font-medium">{user?.name}</p>
                                            </div>
                                        </div>

                                        <div className="flex items-center justify-between p-4 bg-slate-900/50 rounded-xl">
                                            <div>
                                                <p className="text-sm text-slate-400">Email</p>
                                                <p className="font-medium">{user?.email}</p>
                                            </div>
                                        </div>

                                        <div className="flex items-center justify-between p-4 bg-slate-900/50 rounded-xl">
                                            <div>
                                                <p className="text-sm text-slate-400">Challenge Status</p>
                                                <p className="font-medium text-green-400">
                                                    {stats.deposit_paid ? "Active - ₹500 Committed" : "Not Started"}
                                                </p>
                                            </div>
                                            <div className="text-right">
                                                <p className="text-2xl font-bold text-orange-400">{stats.total_completed_days}</p>
                                                <p className="text-xs text-slate-400">Days Completed</p>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Stats Summary */}
                                <div className="bg-slate-800 rounded-2xl p-6 border border-slate-700">
                                    <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                                        <TrendingUp className="w-5 h-5 text-green-400" />
                                        Your Stats
                                    </h3>

                                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                                        <div className="bg-slate-900/50 rounded-xl p-4 text-center">
                                            <Flame className="w-6 h-6 text-orange-500 mx-auto mb-2" />
                                            <p className="text-2xl font-bold">{stats.current_streak}</p>
                                            <p className="text-xs text-slate-400">Current Streak</p>
                                        </div>
                                        <div className="bg-slate-900/50 rounded-xl p-4 text-center">
                                            <Check className="w-6 h-6 text-green-500 mx-auto mb-2" />
                                            <p className="text-2xl font-bold">{stats.total_completed_days}</p>
                                            <p className="text-xs text-slate-400">Perfect Days</p>
                                        </div>
                                        <div className="bg-slate-900/50 rounded-xl p-4 text-center">
                                            <Target className="w-6 h-6 text-blue-500 mx-auto mb-2" />
                                            <p className="text-2xl font-bold">{habits.length}</p>
                                            <p className="text-xs text-slate-400">Habits</p>
                                        </div>
                                        <div className="bg-slate-900/50 rounded-xl p-4 text-center">
                                            <BarChart3 className="w-6 h-6 text-purple-500 mx-auto mb-2" />
                                            <p className="text-2xl font-bold">{stats.total_checkins}</p>
                                            <p className="text-xs text-slate-400">Check-ins</p>
                                        </div>
                                    </div>
                                </div>

                                {/* Logout */}
                                <button
                                    onClick={handleLogout}
                                    className="w-full flex items-center justify-center gap-3 bg-red-500/10 hover:bg-red-500/20 border border-red-500/30 text-red-400 px-6 py-4 rounded-xl font-semibold transition-all"
                                >
                                    <LogOut className="w-5 h-5" />
                                    Logout
                                </button>
                            </motion.div>
                        )}

                        {/* Habits Section */}
                        {activeSection === "habits" && (
                            <motion.div
                                key="habits"
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -20 }}
                                className="space-y-4"
                            >
                                <div className="bg-slate-800 rounded-2xl p-6 border border-slate-700">
                                    <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                                        <Target className="w-5 h-5 text-orange-400" />
                                        Your 5 Daily Habits
                                    </h3>

                                    <div className="space-y-4">
                                        {habits.map((habit, index) => (
                                            <motion.div
                                                key={habit.id}
                                                initial={{ opacity: 0, x: -20 }}
                                                animate={{ opacity: 1, x: 0 }}
                                                transition={{ delay: index * 0.1 }}
                                                className="bg-slate-900/50 rounded-xl p-4 border border-slate-700"
                                            >
                                                {editingHabit === habit.id && editedHabit ? (
                                                    <div className="space-y-4">
                                                        <div>
                                                            <label className="text-sm text-slate-400 mb-1 block">Habit Name</label>
                                                            <input
                                                                type="text"
                                                                value={editedHabit.name}
                                                                onChange={(e) => setEditedHabit({ ...editedHabit, name: e.target.value })}
                                                                className="w-full bg-slate-800 border border-slate-600 rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-orange-500"
                                                            />
                                                        </div>
                                                        <div>
                                                            <label className="text-sm text-slate-400 mb-1 block">Why</label>
                                                            <input
                                                                type="text"
                                                                value={editedHabit.why}
                                                                onChange={(e) => setEditedHabit({ ...editedHabit, why: e.target.value })}
                                                                className="w-full bg-slate-800 border border-slate-600 rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-orange-500"
                                                            />
                                                        </div>
                                                        <div>
                                                            <label className="text-sm text-slate-400 mb-1 block">Time</label>
                                                            <input
                                                                type="time"
                                                                value={editedHabit.time}
                                                                onChange={(e) => setEditedHabit({ ...editedHabit, time: e.target.value })}
                                                                className="w-full bg-slate-800 border border-slate-600 rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-orange-500"
                                                            />
                                                        </div>
                                                        <div className="flex gap-2">
                                                            <button
                                                                onClick={handleSaveHabit}
                                                                disabled={savingHabit}
                                                                className="flex-1 flex items-center justify-center gap-2 bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-lg font-medium transition-all"
                                                            >
                                                                {savingHabit ? (
                                                                    <Loader2 className="w-4 h-4 animate-spin" />
                                                                ) : (
                                                                    <Save className="w-4 h-4" />
                                                                )}
                                                                Save
                                                            </button>
                                                            <button
                                                                onClick={() => {
                                                                    setEditingHabit(null);
                                                                    setEditedHabit(null);
                                                                }}
                                                                className="flex items-center justify-center gap-2 bg-slate-700 hover:bg-slate-600 text-white px-4 py-2 rounded-lg font-medium transition-all"
                                                            >
                                                                <X className="w-4 h-4" />
                                                                Cancel
                                                            </button>
                                                        </div>
                                                    </div>
                                                ) : (
                                                    <div className="flex items-center justify-between">
                                                        <div className="flex-1">
                                                            <div className="flex items-center gap-3 mb-1">
                                                                <span className="bg-orange-500/20 text-orange-400 px-2 py-1 rounded text-xs font-medium">
                                                                    #{index + 1}
                                                                </span>
                                                                <h4 className="font-semibold">{habit.name}</h4>
                                                            </div>
                                                            <p className="text-sm text-slate-400 mb-2">{habit.why}</p>
                                                            <div className="flex items-center gap-2 text-sm text-slate-500">
                                                                <Clock className="w-4 h-4" />
                                                                <span>{habit.time}</span>
                                                            </div>
                                                        </div>
                                                        <button
                                                            onClick={() => handleEditHabit(habit)}
                                                            className="p-2 hover:bg-slate-700 rounded-lg transition-colors"
                                                        >
                                                            <Edit3 className="w-5 h-5 text-slate-400" />
                                                        </button>
                                                    </div>
                                                )}
                                            </motion.div>
                                        ))}
                                    </div>

                                    <p className="mt-4 text-sm text-slate-500 text-center">
                                        Note: Editing habits won't affect your past check-ins
                                    </p>
                                </div>
                            </motion.div>
                        )}

                        {/* Calendar Section */}
                        {activeSection === "calendar" && (
                            <motion.div
                                key="calendar"
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -20 }}
                                className="space-y-6"
                            >
                                <CalendarSync onSyncComplete={loadData} />

                                {/* Instructions */}
                                <div className="bg-slate-800 rounded-2xl p-6 border border-slate-700">
                                    <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                                        <Bell className="w-5 h-5 text-yellow-400" />
                                        How Calendar Reminders Work
                                    </h3>

                                    <div className="space-y-4">
                                        <div className="flex items-start gap-3">
                                            <div className="bg-blue-500/20 p-2 rounded-lg mt-1">
                                                <span className="text-lg">1️⃣</span>
                                            </div>
                                            <div>
                                                <h4 className="font-medium">Connect Your Calendar</h4>
                                                <p className="text-sm text-slate-400">
                                                    Authorize Sankalp to create events in your Google Calendar
                                                </p>
                                            </div>
                                        </div>

                                        <div className="flex items-start gap-3">
                                            <div className="bg-green-500/20 p-2 rounded-lg mt-1">
                                                <span className="text-lg">2️⃣</span>
                                            </div>
                                            <div>
                                                <h4 className="font-medium">Sync Your Habits</h4>
                                                <p className="text-sm text-slate-400">
                                                    Click "Sync All Habits" to create recurring daily events
                                                </p>
                                            </div>
                                        </div>

                                        <div className="flex items-start gap-3">
                                            <div className="bg-purple-500/20 p-2 rounded-lg mt-1">
                                                <span className="text-lg">3️⃣</span>
                                            </div>
                                            <div>
                                                <h4 className="font-medium">Get Reminded</h4>
                                                <p className="text-sm text-slate-400">
                                                    Receive popup notifications at your scheduled habit times
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </motion.div>
                        )}

                        {/* Data & Privacy Section */}
                        {activeSection === "data" && (
                            <motion.div
                                key="data"
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -20 }}
                                className="space-y-6"
                            >
                                {/* Export Data */}
                                <div className="bg-slate-800 rounded-2xl p-6 border border-slate-700">
                                    <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                                        <Download className="w-5 h-5 text-blue-400" />
                                        Export Your Data
                                    </h3>
                                    <p className="text-slate-400 text-sm mb-4">
                                        Download all your data including habits, check-ins, thoughts, and sleep records.
                                    </p>
                                    <button
                                        onClick={handleExportData}
                                        className="flex items-center gap-2 bg-blue-500 hover:bg-blue-600 text-white px-6 py-3 rounded-xl font-semibold transition-all"
                                    >
                                        <Download className="w-5 h-5" />
                                        Export as JSON
                                    </button>
                                </div>

                                {/* Challenge Info */}
                                <div className="bg-slate-800 rounded-2xl p-6 border border-slate-700">
                                    <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                                        <Shield className="w-5 h-5 text-green-400" />
                                        100-Day Challenge
                                    </h3>
                                    <div className="space-y-4">
                                        <div className="flex items-center justify-between p-4 bg-slate-900/50 rounded-xl">
                                            <div>
                                                <p className="font-medium">Challenge Status</p>
                                                <p className="text-sm text-slate-400">
                                                    {stats.total_completed_days >= 100
                                                        ? "🎉 Completed!"
                                                        : `${100 - stats.total_completed_days} days remaining`}
                                                </p>
                                            </div>
                                            <div className="text-right">
                                                <p className="text-2xl font-bold text-green-400">
                                                    {stats.total_completed_days}/100
                                                </p>
                                            </div>
                                        </div>

                                        <div className="flex items-center justify-between p-4 bg-slate-900/50 rounded-xl">
                                            <div>
                                                <p className="font-medium">Deposit Amount</p>
                                                <p className="text-sm text-slate-400">Your commitment stake</p>
                                            </div>
                                            <p className="text-2xl font-bold text-orange-400">₹500</p>
                                        </div>
                                    </div>
                                </div>

                                {/* Danger Zone */}
                                <div className="bg-red-900/20 rounded-2xl p-6 border border-red-500/30">
                                    <h3 className="text-lg font-semibold mb-4 flex items-center gap-2 text-red-400">
                                        <AlertTriangle className="w-5 h-5" />
                                        Danger Zone
                                    </h3>
                                    <p className="text-slate-400 text-sm mb-4">
                                        Quitting the challenge will result in losing your ₹500 deposit. This action cannot be undone.
                                    </p>
                                    <button
                                        onClick={() => setShowDeleteConfirm(true)}
                                        className="flex items-center gap-2 bg-red-500/20 hover:bg-red-500/30 border border-red-500/50 text-red-400 px-6 py-3 rounded-xl font-semibold transition-all"
                                    >
                                        <Trash2 className="w-5 h-5" />
                                        Quit Challenge
                                    </button>
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>

                {/* Delete Confirmation Modal */}
                <AnimatePresence>
                    {showDeleteConfirm && (
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4"
                            onClick={() => setShowDeleteConfirm(false)}
                        >
                            <motion.div
                                initial={{ scale: 0.9, opacity: 0 }}
                                animate={{ scale: 1, opacity: 1 }}
                                exit={{ scale: 0.9, opacity: 0 }}
                                className="bg-slate-800 rounded-2xl p-6 max-w-md w-full border border-slate-700"
                                onClick={(e) => e.stopPropagation()}
                            >
                                <div className="text-center">
                                    <div className="bg-red-500/20 p-4 rounded-full w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                                        <AlertTriangle className="w-8 h-8 text-red-500" />
                                    </div>
                                    <h3 className="text-xl font-bold mb-2">Quit Challenge?</h3>
                                    <p className="text-slate-400 mb-6">
                                        You will lose your ₹500 deposit. This action cannot be undone. Are you absolutely sure?
                                    </p>
                                    <div className="flex gap-3">
                                        <button
                                            onClick={() => setShowDeleteConfirm(false)}
                                            className="flex-1 bg-slate-700 hover:bg-slate-600 text-white px-6 py-3 rounded-xl font-semibold transition-all"
                                        >
                                            Cancel
                                        </button>
                                        <button
                                            onClick={() => navigate("/quit")}
                                            className="flex-1 bg-red-500 hover:bg-red-600 text-white px-6 py-3 rounded-xl font-semibold transition-all"
                                        >
                                            Yes, Quit
                                        </button>
                                    </div>
                                </div>
                            </motion.div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </PageLayout>
    );
};

export default SettingsPage;