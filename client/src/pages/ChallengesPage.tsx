// src/pages/ChallengesPage.tsx
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import {
    Trophy,
    Star,
    Zap,
    CheckCircle,
    Clock,
    Loader2,
    Gift,
    Target,
    Flame,
    Award,
    Sparkles,
    TrendingUp,
    Calendar,
    ArrowLeft,
    Info,
    Lock,
} from 'lucide-react';
import Confetti from 'react-confetti';
import { useWindowSize } from 'react-use';
import PageLayout from '../components/PageLayout';

interface Challenge {
    id: string;
    name: string;
    description: string;
    icon: string;
    xp_reward: number;
    type: 'streak' | 'completion' | 'early_bird' | 'consistency' | 'bonus';
    completed: boolean;
    claimable: boolean;
    date: string;
    habit_id?: number;
    habit_name?: string;
    requirement?: string;
    progress?: number;
    target?: number;
}

interface ChallengesData {
    date: string;
    challenges: Challenge[];
    total_xp_available: number;
    completed_count: number;
    total_xp_earned: number;
}

interface UserStats {
    total_xp: number;
    level: number;
    xp_for_current_level: number;
    xp_for_next_level: number;
}

const ChallengesPage: React.FC = () => {
    const navigate = useNavigate();
    const { width, height } = useWindowSize();

    const [data, setData] = useState<ChallengesData | null>(null);
    const [userStats, setUserStats] = useState<UserStats | null>(null);
    const [loading, setLoading] = useState(true);
    const [claiming, setClaiming] = useState<string | null>(null);
    const [showConfetti, setShowConfetti] = useState(false);
    const [claimedXP, setClaimedXP] = useState<number | null>(null);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        try {
            setLoading(true);

            // Fetch challenges
            const challengesRes = await fetch('http://localhost:8000/challenges/daily', {
                credentials: 'include'
            });

            if (challengesRes.ok) {
                const challengesData = await challengesRes.json();
                setData(challengesData);
            }

            // Fetch user stats/XP
            const statsRes = await fetch('http://localhost:8000/user/xp', {
                credentials: 'include'
            });

            if (statsRes.ok) {
                const statsData = await statsRes.json();
                setUserStats(statsData);
            }
        } catch (err) {
            console.error('Error loading challenges:', err);
            setError('Failed to load challenges');
        } finally {
            setLoading(false);
        }
    };

    const claimChallenge = async (challengeId: string) => {
        if (claiming) return;

        setClaiming(challengeId);

        try {
            const response = await fetch(
                `http://localhost:8000/challenges/${challengeId}/complete`,
                {
                    method: 'POST',
                    credentials: 'include',
                    headers: { 'Content-Type': 'application/json' }
                }
            );

            if (response.ok) {
                const result = await response.json();

                if (result.success) {
                    // Show celebration
                    setShowConfetti(true);
                    setClaimedXP(result.xp_earned);

                    setTimeout(() => {
                        setShowConfetti(false);
                        setClaimedXP(null);
                    }, 3000);

                    // Update local state
                    setData(prev => {
                        if (!prev) return prev;
                        return {
                            ...prev,
                            challenges: prev.challenges.map(c =>
                                c.id === challengeId
                                    ? { ...c, completed: true, claimable: false }
                                    : c
                            ),
                            completed_count: prev.completed_count + 1,
                            total_xp_earned: prev.total_xp_earned + result.xp_earned
                        };
                    });

                    // Update user XP
                    if (userStats) {
                        setUserStats({
                            ...userStats,
                            total_xp: userStats.total_xp + result.xp_earned
                        });
                    }
                }
            } else {
                const errorData = await response.json();
                console.error('Failed to claim:', errorData);
            }
        } catch (err) {
            console.error('Error claiming challenge:', err);
        } finally {
            setClaiming(null);
        }
    };

    const getChallengeTypeConfig = (type: string) => {
        const configs = {
            streak: {
                icon: <Flame className="w-4 h-4" />,
                color: 'text-orange-400',
                bg: 'bg-orange-500/20',
                border: 'border-orange-500/30',
                label: 'Streak Challenge'
            },
            completion: {
                icon: <CheckCircle className="w-4 h-4" />,
                color: 'text-green-400',
                bg: 'bg-green-500/20',
                border: 'border-green-500/30',
                label: 'Completion Challenge'
            },
            early_bird: {
                icon: <Clock className="w-4 h-4" />,
                color: 'text-blue-400',
                bg: 'bg-blue-500/20',
                border: 'border-blue-500/30',
                label: 'Early Bird Challenge'
            },
            consistency: {
                icon: <TrendingUp className="w-4 h-4" />,
                color: 'text-purple-400',
                bg: 'bg-purple-500/20',
                border: 'border-purple-500/30',
                label: 'Consistency Challenge'
            },
            bonus: {
                icon: <Star className="w-4 h-4" />,
                color: 'text-yellow-400',
                bg: 'bg-yellow-500/20',
                border: 'border-yellow-500/30',
                label: 'Bonus Challenge'
            }
        };
        return configs[type as keyof typeof configs] || configs.bonus;
    };

    const calculateLevel = (xp: number) => {
        return Math.floor(xp / 1000) + 1;
    };

    const calculateLevelProgress = (xp: number) => {
        return (xp % 1000) / 1000 * 100;
    };

    if (loading) {
        return (
            <PageLayout pageTitle="Challenges" pageIcon={Trophy}>
                <div className="min-h-screen bg-slate-950 flex items-center justify-center">
                    <div className="text-center">
                        <motion.div
                            animate={{ rotate: 360 }}
                            transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                            className="w-16 h-16 border-4 border-yellow-500 border-t-transparent rounded-full mx-auto mb-4"
                        />
                        <p className="text-white text-lg">Loading challenges...</p>
                    </div>
                </div>
            </PageLayout>
        );
    }

    if (error || !data) {
        return (
            <PageLayout pageTitle="Challenges" pageIcon={Trophy}>
                <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
                    <div className="text-center">
                        <Trophy className="w-20 h-20 text-slate-600 mx-auto mb-4" />
                        <h2 className="text-2xl font-bold text-white mb-2">Unable to Load Challenges</h2>
                        <p className="text-slate-400 mb-6">{error || 'Please try again later'}</p>
                        <button
                            onClick={() => navigate('/daily')}
                            className="bg-orange-500 hover:bg-orange-600 text-white px-6 py-3 rounded-lg font-semibold"
                        >
                            Go Back
                        </button>
                    </div>
                </div>
            </PageLayout>
        );
    }

    const allCompleted = data.completed_count === data.challenges.length;
    const progress = (data.completed_count / data.challenges.length) * 100;

    return (
        <PageLayout pageTitle="Challenges" pageIcon={Trophy}>
            <div className="min-h-screen bg-slate-950 text-white pb-8">
                {/* Confetti */}
                {showConfetti && (
                    <Confetti
                        width={width - 50}
                        height={height}
                        recycle={false}
                        numberOfPieces={500}
                        colors={['#fbbf24', '#f97316', '#22c55e', '#3b82f6', '#a855f7']}
                    />
                )}

                {/* XP Claimed Popup */}
                <AnimatePresence>
                    {claimedXP && (
                        <motion.div
                            initial={{ opacity: 0, scale: 0.5, y: 50 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.5, y: -50 }}
                            className="fixed inset-0 flex items-center justify-center z-50 pointer-events-none"
                        >
                            <div className="bg-gradient-to-br from-yellow-500 to-orange-600 rounded-3xl p-10 text-center shadow-2xl">
                                <motion.div
                                    initial={{ rotate: 0 }}
                                    animate={{ rotate: 360 }}
                                    transition={{ duration: 0.5 }}
                                >
                                    <Sparkles className="w-20 h-20 text-white mx-auto mb-4" />
                                </motion.div>
                                <h2 className="text-4xl font-bold text-white mb-2">+{claimedXP} XP</h2>
                                <p className="text-yellow-100 text-lg">Challenge Complete!</p>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>

                <div className="max-w-4xl mx-auto px-4 py-6">
                    {/* Header Card */}
                    <motion.div
                        initial={{ opacity: 0, y: -20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="bg-gradient-to-r from-yellow-600 via-orange-600 to-red-600 rounded-3xl p-8 mb-6 relative overflow-hidden"
                    >
                        {/* Background decoration */}
                        <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -translate-y-32 translate-x-32" />
                        <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/5 rounded-full translate-y-24 -translate-x-24" />

                        <div className="relative z-10">
                            <div className="flex items-center justify-between mb-6">
                                <div>
                                    <div className="flex items-center gap-2 text-yellow-100 mb-2">
                                        <Calendar className="w-5 h-5" />
                                        <span className="text-sm">
                                            {new Date(data.date).toLocaleDateString('en-IN', {
                                                weekday: 'long',
                                                month: 'long',
                                                day: 'numeric'
                                            })}
                                        </span>
                                    </div>
                                    <h1 className="text-3xl md:text-4xl font-bold text-white">Daily Challenges</h1>
                                    <p className="text-yellow-100 mt-2">
                                        Complete challenges based on your habits to earn XP rewards!
                                    </p>
                                </div>
                                <div className="hidden md:block">
                                    <div className="bg-white/20 backdrop-blur-sm rounded-2xl px-6 py-4 text-center">
                                        <div className="flex items-center gap-2 justify-center mb-1">
                                            <Zap className="w-7 h-7 text-white" />
                                            <span className="text-4xl font-bold text-white">
                                                {data.total_xp_available}
                                            </span>
                                        </div>
                                        <div className="text-yellow-100 text-sm">XP Available Today</div>
                                    </div>
                                </div>
                            </div>

                            {/* Mobile XP Display */}
                            <div className="md:hidden bg-white/20 backdrop-blur-sm rounded-xl px-4 py-3 mb-4 flex items-center justify-between">
                                <span className="text-yellow-100">XP Available</span>
                                <div className="flex items-center gap-2">
                                    <Zap className="w-5 h-5 text-white" />
                                    <span className="text-2xl font-bold text-white">{data.total_xp_available}</span>
                                </div>
                            </div>

                            {/* Progress */}
                            <div>
                                <div className="flex justify-between text-sm text-yellow-100 mb-2">
                                    <span>Today's Progress</span>
                                    <span className="font-semibold text-white">
                                        {data.completed_count}/{data.challenges.length} completed
                                    </span>
                                </div>
                                <div className="bg-white/20 rounded-full h-4 overflow-hidden">
                                    <motion.div
                                        initial={{ width: 0 }}
                                        animate={{ width: `${progress}%` }}
                                        transition={{ duration: 1, ease: "easeOut" }}
                                        className="h-full bg-white rounded-full relative"
                                    >
                                        {progress > 0 && (
                                            <motion.div
                                                className="absolute right-0 top-1/2 -translate-y-1/2 w-6 h-6 bg-white rounded-full shadow-lg flex items-center justify-center"
                                                initial={{ scale: 0 }}
                                                animate={{ scale: 1 }}
                                                transition={{ delay: 1 }}
                                            >
                                                <Star className="w-4 h-4 text-yellow-500" />
                                            </motion.div>
                                        )}
                                    </motion.div>
                                </div>
                            </div>
                        </div>
                    </motion.div>

                    {/* User Level Card */}
                    {userStats && (
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.1 }}
                            className="bg-slate-800 rounded-2xl p-6 mb-6 border border-slate-700"
                        >
                            <div className="flex items-center justify-between mb-4">
                                <div className="flex items-center gap-4">
                                    <div className="relative">
                                        <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-pink-500 rounded-2xl flex items-center justify-center">
                                            <span className="text-2xl font-bold text-white">
                                                {calculateLevel(userStats.total_xp)}
                                            </span>
                                        </div>
                                        <div className="absolute -bottom-1 -right-1 bg-yellow-500 rounded-full p-1">
                                            <Star className="w-4 h-4 text-white fill-white" />
                                        </div>
                                    </div>
                                    <div>
                                        <div className="text-slate-400 text-sm">Your Level</div>
                                        <div className="text-2xl font-bold">Level {calculateLevel(userStats.total_xp)}</div>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <div className="text-slate-400 text-sm">Total XP Earned</div>
                                    <div className="text-2xl font-bold text-yellow-400 flex items-center gap-2 justify-end">
                                        <Zap className="w-5 h-5" />
                                        {userStats.total_xp}
                                    </div>
                                </div>
                            </div>

                            {/* Level Progress */}
                            <div>
                                <div className="flex justify-between text-xs text-slate-400 mb-1">
                                    <span>Progress to Level {calculateLevel(userStats.total_xp) + 1}</span>
                                    <span>{1000 - (userStats.total_xp % 1000)} XP to go</span>
                                </div>
                                <div className="bg-slate-700 rounded-full h-3 overflow-hidden">
                                    <motion.div
                                        initial={{ width: 0 }}
                                        animate={{ width: `${calculateLevelProgress(userStats.total_xp)}%` }}
                                        transition={{ duration: 0.8 }}
                                        className="h-full bg-gradient-to-r from-purple-500 to-pink-500 rounded-full"
                                    />
                                </div>
                            </div>
                        </motion.div>
                    )}

                    {/* Challenges Section */}
                    <div className="mb-6">
                        <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                            <Target className="w-6 h-6 text-yellow-400" />
                            Today's Challenges
                            <span className="text-sm font-normal text-slate-400">
                                ({data.challenges.length} total)
                            </span>
                        </h2>

                        <div className="space-y-4">
                            {data.challenges.map((challenge, index) => {
                                const typeConfig = getChallengeTypeConfig(challenge.type);

                                return (
                                    <motion.div
                                        key={challenge.id}
                                        initial={{ opacity: 0, x: -20 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        transition={{ delay: index * 0.1 + 0.2 }}
                                        className={`bg-slate-800 rounded-2xl p-6 border-2 transition-all ${challenge.completed
                                                ? 'border-green-500/50 bg-gradient-to-r from-green-900/20 to-emerald-900/20'
                                                : challenge.claimable
                                                    ? 'border-yellow-500/50 hover:border-yellow-400'
                                                    : 'border-slate-700 opacity-75'
                                            }`}
                                    >
                                        <div className="flex flex-col md:flex-row md:items-center gap-4">
                                            {/* Challenge Icon */}
                                            <div className={`text-5xl p-4 rounded-2xl self-start ${challenge.completed
                                                    ? 'bg-green-500/20'
                                                    : challenge.claimable
                                                        ? 'bg-yellow-500/20'
                                                        : 'bg-slate-900'
                                                }`}>
                                                {challenge.icon}
                                            </div>

                                            {/* Challenge Details */}
                                            <div className="flex-1">
                                                {/* Type Badge */}
                                                <div className="flex flex-wrap items-center gap-2 mb-2">
                                                    <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium ${typeConfig.bg} ${typeConfig.color} border ${typeConfig.border}`}>
                                                        {typeConfig.icon}
                                                        {typeConfig.label}
                                                    </span>
                                                    {challenge.completed && (
                                                        <span className="inline-flex items-center gap-1 text-green-400 text-sm font-medium">
                                                            <CheckCircle className="w-4 h-4" />
                                                            Completed
                                                        </span>
                                                    )}
                                                    {!challenge.claimable && !challenge.completed && (
                                                        <span className="inline-flex items-center gap-1 text-slate-500 text-sm">
                                                            <Lock className="w-4 h-4" />
                                                            Not yet available
                                                        </span>
                                                    )}
                                                </div>

                                                {/* Challenge Name */}
                                                <h3 className={`text-xl font-bold mb-2 ${challenge.completed
                                                        ? 'text-green-400'
                                                        : challenge.claimable
                                                            ? 'text-white'
                                                            : 'text-slate-400'
                                                    }`}>
                                                    {challenge.name}
                                                </h3>

                                                {/* Description */}
                                                <p className="text-slate-400 mb-3">
                                                    {challenge.description}
                                                </p>

                                                {/* Related Habit */}
                                                {challenge.habit_name && (
                                                    <div className="text-sm text-slate-500 mb-3 flex items-center gap-2">
                                                        <Target className="w-4 h-4" />
                                                        Related to: <span className="text-slate-300 font-medium">{challenge.habit_name}</span>
                                                    </div>
                                                )}

                                                {/* Requirement/Progress */}
                                                {challenge.requirement && !challenge.completed && (
                                                    <div className="text-sm text-slate-400 mb-3 flex items-center gap-2">
                                                        <Info className="w-4 h-4" />
                                                        {challenge.requirement}
                                                    </div>
                                                )}

                                                {/* Progress Bar (if applicable) */}
                                                {challenge.progress !== undefined && challenge.target && !challenge.completed && (
                                                    <div className="mb-3">
                                                        <div className="flex justify-between text-xs text-slate-400 mb-1">
                                                            <span>Progress</span>
                                                            <span>{challenge.progress}/{challenge.target}</span>
                                                        </div>
                                                        <div className="bg-slate-700 rounded-full h-2 overflow-hidden">
                                                            <div
                                                                className="h-full bg-yellow-500 rounded-full transition-all"
                                                                style={{ width: `${(challenge.progress / challenge.target) * 100}%` }}
                                                            />
                                                        </div>
                                                    </div>
                                                )}
                                            </div>

                                            {/* Reward & Action */}
                                            <div className="flex flex-row md:flex-col items-center md:items-end justify-between md:justify-start gap-4">
                                                {/* XP Reward */}
                                                <div className={`flex items-center gap-2 text-lg font-bold ${challenge.completed
                                                        ? 'text-green-400'
                                                        : 'text-yellow-400'
                                                    }`}>
                                                    <Zap className="w-5 h-5" />
                                                    <span>+{challenge.xp_reward} XP</span>
                                                </div>

                                                {/* Claim Button */}
                                                {!challenge.completed && challenge.claimable && (
                                                    <motion.button
                                                        whileHover={{ scale: 1.05 }}
                                                        whileTap={{ scale: 0.95 }}
                                                        onClick={() => claimChallenge(challenge.id)}
                                                        disabled={claiming === challenge.id}
                                                        className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-400 hover:to-orange-400 text-black font-bold rounded-xl transition-all disabled:opacity-50 shadow-lg shadow-yellow-500/25"
                                                    >
                                                        {claiming === challenge.id ? (
                                                            <>
                                                                <Loader2 className="w-5 h-5 animate-spin" />
                                                                <span>Claiming...</span>
                                                            </>
                                                        ) : (
                                                            <>
                                                                <Gift className="w-5 h-5" />
                                                                <span>Claim Reward</span>
                                                            </>
                                                        )}
                                                    </motion.button>
                                                )}

                                                {/* Completed Badge */}
                                                {challenge.completed && (
                                                    <div className="flex items-center gap-2 text-green-400 bg-green-500/20 px-4 py-2 rounded-xl">
                                                        <Award className="w-5 h-5" />
                                                        <span className="font-semibold">Claimed!</span>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </motion.div>
                                );
                            })}
                        </div>
                    </div>

                    {/* All Completed Celebration */}
                    <AnimatePresence>
                        {allCompleted && (
                            <motion.div
                                initial={{ opacity: 0, scale: 0.9 }}
                                animate={{ opacity: 1, scale: 1 }}
                                className="bg-gradient-to-br from-green-900/50 to-emerald-900/50 rounded-3xl p-8 border border-green-500/30 text-center mb-6"
                            >
                                <motion.div
                                    initial={{ scale: 0 }}
                                    animate={{ scale: 1 }}
                                    transition={{ type: "spring", delay: 0.2 }}
                                    className="inline-flex items-center justify-center bg-green-500/20 p-6 rounded-full mb-4"
                                >
                                    <Trophy className="w-16 h-16 text-green-400" />
                                </motion.div>
                                <h3 className="text-3xl font-bold text-green-400 mb-3">
                                    🎉 All Challenges Completed!
                                </h3>
                                <p className="text-green-200 text-lg mb-4">
                                    Amazing work! You've conquered all of today's challenges.
                                </p>
                                <div className="inline-flex items-center gap-3 text-yellow-400 bg-yellow-500/20 px-6 py-3 rounded-xl">
                                    <Zap className="w-7 h-7" />
                                    <span className="text-3xl font-bold">
                                        +{data.total_xp_earned} XP
                                    </span>
                                    <span className="text-yellow-200">Earned Today</span>
                                </div>
                                <p className="text-slate-400 mt-6">
                                    Come back tomorrow for new challenges! 🚀
                                </p>
                            </motion.div>
                        )}
                    </AnimatePresence>

                    {/* How Challenges Work */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.5 }}
                        className="bg-slate-800 rounded-2xl p-6 border border-slate-700"
                    >
                        <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                            <Sparkles className="w-5 h-5 text-purple-400" />
                            How Challenges Work
                        </h3>
                        <div className="grid md:grid-cols-2 gap-4">
                            <div className="flex items-start gap-3 p-4 bg-slate-900/50 rounded-xl">
                                <div className="bg-yellow-500/20 p-2 rounded-lg">
                                    <Target className="w-5 h-5 text-yellow-400" />
                                </div>
                                <div>
                                    <h4 className="font-semibold text-white mb-1">Personalized Challenges</h4>
                                    <p className="text-sm text-slate-400">
                                        Challenges are generated based on your habits and daily progress
                                    </p>
                                </div>
                            </div>
                            <div className="flex items-start gap-3 p-4 bg-slate-900/50 rounded-xl">
                                <div className="bg-green-500/20 p-2 rounded-lg">
                                    <CheckCircle className="w-5 h-5 text-green-400" />
                                </div>
                                <div>
                                    <h4 className="font-semibold text-white mb-1">Complete to Unlock</h4>
                                    <p className="text-sm text-slate-400">
                                        Complete your habits to make challenges claimable
                                    </p>
                                </div>
                            </div>
                            <div className="flex items-start gap-3 p-4 bg-slate-900/50 rounded-xl">
                                <div className="bg-purple-500/20 p-2 rounded-lg">
                                    <Zap className="w-5 h-5 text-purple-400" />
                                </div>
                                <div>
                                    <h4 className="font-semibold text-white mb-1">Earn XP & Level Up</h4>
                                    <p className="text-sm text-slate-400">
                                        Collect XP to increase your level and unlock achievements
                                    </p>
                                </div>
                            </div>
                            <div className="flex items-start gap-3 p-4 bg-slate-900/50 rounded-xl">
                                <div className="bg-orange-500/20 p-2 rounded-lg">
                                    <Flame className="w-5 h-5 text-orange-400" />
                                </div>
                                <div>
                                    <h4 className="font-semibold text-white mb-1">Streak Bonuses</h4>
                                    <p className="text-sm text-slate-400">
                                        Maintain streaks to unlock special streak challenges
                                    </p>
                                </div>
                            </div>
                        </div>
                    </motion.div>
                </div>
            </div>
        </PageLayout>
    );
};

export default ChallengesPage;