// src/components/StreakDetails.tsx
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Flame,
    Trophy,
    Target,
    Calendar,
    TrendingUp,
    AlertTriangle,
    CheckCircle,
    XCircle,
    Star,
    Zap,
    Award,
    Crown,
    Loader2,
    ChevronRight,
} from 'lucide-react';

interface HabitStreak {
    id: number;
    name: string;
    current_streak: number;
    longest_streak: number;
    completion_rate: number;
}

interface Milestone {
    days: number;
    name: string;
    icon: string;
    xp: number;
    achieved: boolean;
    current: boolean;
    progress: number;
}

interface StreakDay {
    date: string;
    day_name: string;
    day_number: number;
    is_today: boolean;
    is_future: boolean;
    completed: boolean;
    partial: boolean;
    completed_count: number;
    total_habits: number;
}

interface StreakData {
    current_streak: number;
    longest_streak: number;
    streak_start_date: string | null;
    longest_streak_period: {
        start: string | null;
        end: string | null;
        days: number;
    };
    status: string;
    status_message: string;
    completion_rate: number;
    total_habits: number;
    streak_history: StreakDay[];
    habit_streaks: HabitStreak[];
    milestones: Milestone[];
    next_milestone: {
        days: number;
        days_remaining: number;
        progress: number;
    } | null;
}

interface StreakAtRisk {
    at_risk: boolean;
    current_streak: number;
    completed_today: number;
    incomplete_today: number;
    total_habits: number;
    hours_remaining: number;
    incomplete_habits: string[];
}

const StreakDetails: React.FC = () => {
    const [data, setData] = useState<StreakData | null>(null);
    const [atRisk, setAtRisk] = useState<StreakAtRisk | null>(null);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState<'overview' | 'history' | 'habits' | 'milestones'>('overview');

    useEffect(() => {
        fetchStreakData();
    }, []);

    const fetchStreakData = async () => {
        try {
            setLoading(true);

            const [streakResponse, riskResponse] = await Promise.all([
                fetch('http://localhost:8000/streak/details', { credentials: 'include' }),
                fetch('http://localhost:8000/streak/at-risk', { credentials: 'include' })
            ]);

            if (streakResponse.ok) {
                const streakData = await streakResponse.json();
                setData(streakData);
            }

            if (riskResponse.ok) {
                const riskData = await riskResponse.json();
                setAtRisk(riskData);
            }
        } catch (error) {
            console.error('Error fetching streak data:', error);
        } finally {
            setLoading(false);
        }
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'inactive': return 'text-slate-400';
            case 'building': return 'text-blue-400';
            case 'growing': return 'text-green-400';
            case 'strong': return 'text-yellow-400';
            case 'powerful': return 'text-orange-400';
            case 'unstoppable': return 'text-red-400';
            case 'champion': return 'text-purple-400';
            default: return 'text-slate-400';
        }
    };

    const getStatusBg = (status: string) => {
        switch (status) {
            case 'inactive': return 'from-slate-800 to-slate-900';
            case 'building': return 'from-blue-900/50 to-blue-800/30';
            case 'growing': return 'from-green-900/50 to-green-800/30';
            case 'strong': return 'from-yellow-900/50 to-yellow-800/30';
            case 'powerful': return 'from-orange-900/50 to-orange-800/30';
            case 'unstoppable': return 'from-red-900/50 to-red-800/30';
            case 'champion': return 'from-purple-900/50 to-purple-800/30';
            default: return 'from-slate-800 to-slate-900';
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <div className="text-center">
                    <Loader2 className="w-12 h-12 animate-spin text-orange-500 mx-auto mb-4" />
                    <p className="text-slate-400">Loading streak data...</p>
                </div>
            </div>
        );
    }

    if (!data) {
        return (
            <div className="text-center py-12">
                <Flame className="w-16 h-16 text-slate-600 mx-auto mb-4" />
                <p className="text-slate-400">Unable to load streak data</p>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Streak At Risk Alert */}
            <AnimatePresence>
                {atRisk?.at_risk && (
                    <motion.div
                        initial={{ opacity: 0, y: -20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        className="bg-red-900/30 border border-red-500/50 rounded-2xl p-4"
                    >
                        <div className="flex items-start gap-4">
                            <div className="bg-red-500/20 p-3 rounded-xl">
                                <AlertTriangle className="w-6 h-6 text-red-400" />
                            </div>
                            <div className="flex-1">
                                <h4 className="text-lg font-bold text-red-400">
                                    🔥 Streak at Risk!
                                </h4>
                                <p className="text-red-300 mt-1">
                                    You have {atRisk.incomplete_today} incomplete habit{atRisk.incomplete_today > 1 ? 's' : ''} today.
                                    {atRisk.hours_remaining > 0 && ` ${atRisk.hours_remaining} hours remaining!`}
                                </p>
                                {atRisk.incomplete_habits.length > 0 && (
                                    <div className="mt-2 flex flex-wrap gap-2">
                                        {atRisk.incomplete_habits.map((habit, index) => (
                                            <span
                                                key={index}
                                                className="px-2 py-1 bg-red-500/20 text-red-300 text-sm rounded-lg"
                                            >
                                                {habit}
                                            </span>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Main Streak Card */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className={`bg-gradient-to-br ${getStatusBg(data.status)} rounded-2xl p-6 border border-slate-700`}
            >
                <div className="flex flex-col md:flex-row items-center gap-6">
                    {/* Streak Circle */}
                    <div className="relative">
                        <motion.div
                            animate={{ rotate: [0, 5, -5, 0] }}
                            transition={{ duration: 2, repeat: Infinity }}
                            className="w-32 h-32 rounded-full bg-gradient-to-br from-orange-500 to-red-600 flex items-center justify-center shadow-lg shadow-orange-500/30"
                        >
                            <div className="text-center">
                                <Flame className="w-8 h-8 text-white mx-auto" />
                                <div className="text-4xl font-bold text-white">
                                    {data.current_streak}
                                </div>
                                <div className="text-xs text-orange-200">days</div>
                            </div>
                        </motion.div>

                        {data.current_streak > 0 && (
                            <motion.div
                                initial={{ scale: 0 }}
                                animate={{ scale: 1 }}
                                className="absolute -top-2 -right-2 bg-yellow-500 rounded-full p-2"
                            >
                                <Star className="w-4 h-4 text-yellow-900 fill-current" />
                            </motion.div>
                        )}
                    </div>

                    {/* Status Info */}
                    <div className="flex-1 text-center md:text-left">
                        <h3 className={`text-2xl font-bold ${getStatusColor(data.status)}`}>
                            {data.status.charAt(0).toUpperCase() + data.status.slice(1)}
                        </h3>
                        <p className="text-slate-300 mt-2">{data.status_message}</p>

                        {data.next_milestone && (
                            <div className="mt-4">
                                <div className="flex items-center gap-2 text-sm text-slate-400">
                                    <Target className="w-4 h-4" />
                                    <span>Next milestone in {data.next_milestone.days_remaining} days</span>
                                </div>
                                <div className="mt-2 bg-slate-700/50 rounded-full h-2 overflow-hidden">
                                    <motion.div
                                        initial={{ width: 0 }}
                                        animate={{ width: `${data.next_milestone.progress}%` }}
                                        className="h-full bg-gradient-to-r from-orange-500 to-yellow-500"
                                    />
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Quick Stats */}
                    <div className="grid grid-cols-2 gap-4">
                        <div className="bg-slate-800/50 rounded-xl p-4 text-center">
                            <Trophy className="w-6 h-6 text-yellow-400 mx-auto mb-1" />
                            <div className="text-2xl font-bold text-white">{data.longest_streak}</div>
                            <div className="text-xs text-slate-400">Best Streak</div>
                        </div>
                        <div className="bg-slate-800/50 rounded-xl p-4 text-center">
                            <TrendingUp className="w-6 h-6 text-green-400 mx-auto mb-1" />
                            <div className="text-2xl font-bold text-white">{data.completion_rate}%</div>
                            <div className="text-xs text-slate-400">Completion</div>
                        </div>
                    </div>
                </div>
            </motion.div>

            {/* Tabs */}
            <div className="flex gap-2 overflow-x-auto pb-2">
                {[
                    { id: 'overview', label: 'Overview', icon: Flame },
                    { id: 'history', label: 'History', icon: Calendar },
                    { id: 'habits', label: 'Per Habit', icon: Target },
                    { id: 'milestones', label: 'Milestones', icon: Trophy },
                ].map((tab) => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id as any)}
                        className={`flex items-center gap-2 px-4 py-2 rounded-xl font-medium whitespace-nowrap transition-all ${activeTab === tab.id
                                ? 'bg-orange-500 text-white'
                                : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
                            }`}
                    >
                        <tab.icon className="w-4 h-4" />
                        <span>{tab.label}</span>
                    </button>
                ))}
            </div>

            {/* Tab Content */}
            <AnimatePresence mode="wait">
                {activeTab === 'overview' && (
                    <motion.div
                        key="overview"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        className="grid md:grid-cols-2 gap-4"
                    >
                        {/* Current Streak Info */}
                        <div className="bg-slate-800 rounded-2xl p-6 border border-slate-700">
                            <h4 className="font-bold mb-4 flex items-center gap-2">
                                <Flame className="w-5 h-5 text-orange-400" />
                                Current Streak
                            </h4>
                            <div className="space-y-3">
                                <div className="flex justify-between">
                                    <span className="text-slate-400">Days</span>
                                    <span className="font-bold text-orange-400">{data.current_streak}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-slate-400">Started</span>
                                    <span className="font-medium">
                                        {data.streak_start_date || 'Not started'}
                                    </span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-slate-400">Habits/Day</span>
                                    <span className="font-medium">{data.total_habits}</span>
                                </div>
                            </div>
                        </div>

                        {/* Longest Streak Info */}
                        <div className="bg-slate-800 rounded-2xl p-6 border border-slate-700">
                            <h4 className="font-bold mb-4 flex items-center gap-2">
                                <Trophy className="w-5 h-5 text-yellow-400" />
                                Longest Streak
                            </h4>
                            <div className="space-y-3">
                                <div className="flex justify-between">
                                    <span className="text-slate-400">Days</span>
                                    <span className="font-bold text-yellow-400">{data.longest_streak}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-slate-400">Period</span>
                                    <span className="font-medium text-sm">
                                        {data.longest_streak_period.start && data.longest_streak_period.end
                                            ? `${data.longest_streak_period.start} - ${data.longest_streak_period.end}`
                                            : 'N/A'}
                                    </span>
                                </div>
                            </div>
                        </div>
                    </motion.div>
                )}

                {activeTab === 'history' && (
                    <motion.div
                        key="history"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        className="bg-slate-800 rounded-2xl p-6 border border-slate-700"
                    >
                        <h4 className="font-bold mb-4 flex items-center gap-2">
                            <Calendar className="w-5 h-5 text-blue-400" />
                            Last 30 Days
                        </h4>

                        <div className="grid grid-cols-7 gap-2">
                            {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((day, i) => (
                                <div key={i} className="text-center text-xs text-slate-500 font-medium">
                                    {day}
                                </div>
                            ))}

                            {/* Add empty cells for alignment */}
                            {data.streak_history.length > 0 && (
                                <>
                                    {Array.from({
                                        length: new Date(data.streak_history[0].date).getDay()
                                    }).map((_, i) => (
                                        <div key={`empty-${i}`} />
                                    ))}
                                </>
                            )}

                            {data.streak_history.map((day, index) => (
                                <motion.div
                                    key={day.date}
                                    initial={{ scale: 0 }}
                                    animate={{ scale: 1 }}
                                    transition={{ delay: index * 0.02 }}
                                    className={`aspect-square rounded-lg flex items-center justify-center text-xs font-medium cursor-pointer transition-all hover:scale-110 ${day.is_today
                                            ? 'ring-2 ring-orange-500'
                                            : ''
                                        } ${day.completed
                                            ? 'bg-green-500 text-white'
                                            : day.partial
                                                ? 'bg-yellow-500/50 text-yellow-200'
                                                : day.is_future
                                                    ? 'bg-slate-700/30 text-slate-600'
                                                    : 'bg-slate-700 text-slate-400'
                                        }`}
                                    title={`${day.date}: ${day.completed_count}/${day.total_habits} completed`}
                                >
                                    {day.completed ? (
                                        <CheckCircle className="w-4 h-4" />
                                    ) : day.partial ? (
                                        <span>{day.completed_count}</span>
                                    ) : (
                                        <span>{day.day_number}</span>
                                    )}
                                </motion.div>
                            ))}
                        </div>

                        {/* Legend */}
                        <div className="flex gap-4 mt-4 justify-center text-xs">
                            <div className="flex items-center gap-1">
                                <div className="w-3 h-3 bg-green-500 rounded" />
                                <span className="text-slate-400">Complete</span>
                            </div>
                            <div className="flex items-center gap-1">
                                <div className="w-3 h-3 bg-yellow-500/50 rounded" />
                                <span className="text-slate-400">Partial</span>
                            </div>
                            <div className="flex items-center gap-1">
                                <div className="w-3 h-3 bg-slate-700 rounded" />
                                <span className="text-slate-400">Missed</span>
                            </div>
                        </div>
                    </motion.div>
                )}

                {activeTab === 'habits' && (
                    <motion.div
                        key="habits"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        className="space-y-3"
                    >
                        {data.habit_streaks.map((habit, index) => (
                            <motion.div
                                key={habit.id}
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: index * 0.1 }}
                                className="bg-slate-800 rounded-xl p-4 border border-slate-700"
                            >
                                <div className="flex items-center justify-between">
                                    <div className="flex-1">
                                        <h4 className="font-semibold">{habit.name}</h4>
                                        <div className="flex items-center gap-4 mt-2 text-sm">
                                            <div className="flex items-center gap-1">
                                                <Flame className="w-4 h-4 text-orange-400" />
                                                <span className="text-orange-400 font-medium">
                                                    {habit.current_streak} days
                                                </span>
                                            </div>
                                            <div className="flex items-center gap-1">
                                                <Trophy className="w-4 h-4 text-yellow-400" />
                                                <span className="text-slate-400">
                                                    Best: {habit.longest_streak}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <div className={`text-2xl font-bold ${habit.completion_rate >= 80 ? 'text-green-400' :
                                                habit.completion_rate >= 50 ? 'text-yellow-400' :
                                                    'text-red-400'
                                            }`}>
                                            {habit.completion_rate}%
                                        </div>
                                        <div className="text-xs text-slate-400">completion</div>
                                    </div>
                                </div>

                                {/* Progress bar */}
                                <div className="mt-3 bg-slate-700 rounded-full h-2 overflow-hidden">
                                    <motion.div
                                        initial={{ width: 0 }}
                                        animate={{ width: `${habit.completion_rate}%` }}
                                        className={`h-full ${habit.completion_rate >= 80 ? 'bg-green-500' :
                                                habit.completion_rate >= 50 ? 'bg-yellow-500' :
                                                    'bg-red-500'
                                            }`}
                                    />
                                </div>
                            </motion.div>
                        ))}
                    </motion.div>
                )}

                {activeTab === 'milestones' && (
                    <motion.div
                        key="milestones"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        className="grid sm:grid-cols-2 gap-4"
                    >
                        {data.milestones.map((milestone, index) => (
                            <motion.div
                                key={milestone.days}
                                initial={{ opacity: 0, scale: 0.8 }}
                                animate={{ opacity: 1, scale: 1 }}
                                transition={{ delay: index * 0.05 }}
                                className={`relative p-4 rounded-xl border-2 transition-all ${milestone.achieved
                                        ? 'bg-green-900/20 border-green-500/50'
                                        : milestone.current
                                            ? 'bg-orange-900/20 border-orange-500/50'
                                            : 'bg-slate-800 border-slate-700 opacity-60'
                                    }`}
                            >
                                {milestone.achieved && (
                                    <div className="absolute top-2 right-2">
                                        <CheckCircle className="w-5 h-5 text-green-400" />
                                    </div>
                                )}

                                <div className="flex items-center gap-3">
                                    <div className={`text-3xl p-2 rounded-xl ${milestone.achieved ? 'bg-green-500/20' : 'bg-slate-700'
                                        }`}>
                                        {milestone.icon}
                                    </div>
                                    <div>
                                        <h4 className="font-bold">{milestone.name}</h4>
                                        <p className="text-sm text-slate-400">{milestone.days} days</p>
                                    </div>
                                </div>

                                <div className="mt-3 flex items-center justify-between">
                                    <div className="flex items-center gap-1 text-yellow-400">
                                        <Zap className="w-4 h-4" />
                                        <span className="text-sm font-medium">+{milestone.xp} XP</span>
                                    </div>

                                    {!milestone.achieved && (
                                        <div className="text-xs text-slate-400">
                                            {Math.round(milestone.progress)}% progress
                                        </div>
                                    )}
                                </div>

                                {!milestone.achieved && (
                                    <div className="mt-2 bg-slate-700 rounded-full h-1.5 overflow-hidden">
                                        <motion.div
                                            initial={{ width: 0 }}
                                            animate={{ width: `${milestone.progress}%` }}
                                            className="h-full bg-orange-500"
                                        />
                                    </div>
                                )}
                            </motion.div>
                        ))}
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default StreakDetails;