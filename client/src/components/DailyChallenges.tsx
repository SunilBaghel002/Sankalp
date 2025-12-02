// src/components/DailyChallenges.tsx
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Trophy,
    Star,
    Zap,
    CheckCircle,
    Clock,
    ChevronRight,
    Loader2,
    Gift,
    Target,
    Flame,
    Award,
} from 'lucide-react';

interface Challenge {
    id: string;
    name: string;
    description: string;
    icon: string;
    xp_reward: number;
    type: string;
    completed: boolean;
    date: string;
}

interface ChallengesData {
    date: string;
    challenges: Challenge[];
    total_xp_available: number;
    completed_count: number;
}

interface DailyChallengesProps {
    compact?: boolean;
    onChallengeComplete?: (challenge: Challenge) => void;
}

const DailyChallenges: React.FC<DailyChallengesProps> = ({
    compact = false,
    onChallengeComplete
}) => {
    const [data, setData] = useState<ChallengesData | null>(null);
    const [loading, setLoading] = useState(true);
    const [claiming, setClaiming] = useState<string | null>(null);
    const [showConfetti, setShowConfetti] = useState(false);

    useEffect(() => {
        fetchChallenges();
    }, []);

    const fetchChallenges = async () => {
        try {
            const response = await fetch('http://localhost:8000/challenges/daily', {
                credentials: 'include'
            });

            if (response.ok) {
                const challengesData = await response.json();
                setData(challengesData);
            }
        } catch (error) {
            console.error('Error fetching challenges:', error);
        } finally {
            setLoading(false);
        }
    };

    const claimChallenge = async (challengeId: string) => {
        setClaiming(challengeId);

        try {
            const response = await fetch(
                `http://localhost:8000/challenges/${challengeId}/complete`,
                {
                    method: 'POST',
                    credentials: 'include'
                }
            );

            if (response.ok) {
                const result = await response.json();

                if (result.success) {
                    setShowConfetti(true);
                    setTimeout(() => setShowConfetti(false), 3000);

                    // Update local state
                    setData(prev => {
                        if (!prev) return prev;
                        return {
                            ...prev,
                            challenges: prev.challenges.map(c =>
                                c.id === challengeId ? { ...c, completed: true } : c
                            ),
                            completed_count: prev.completed_count + 1
                        };
                    });

                    onChallengeComplete?.(result.challenge);
                }
            }
        } catch (error) {
            console.error('Error claiming challenge:', error);
        } finally {
            setClaiming(null);
        }
    };

    if (loading) {
        return (
            <div className="bg-slate-800 rounded-2xl p-6 border border-slate-700">
                <div className="flex items-center justify-center gap-3">
                    <Loader2 className="w-6 h-6 animate-spin text-yellow-500" />
                    <span className="text-slate-400">Loading challenges...</span>
                </div>
            </div>
        );
    }

    if (!data) {
        return null;
    }

    const allCompleted = data.completed_count === data.challenges.length;

    if (compact) {
        return (
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-gradient-to-br from-yellow-900/30 to-orange-900/30 rounded-2xl p-4 border border-yellow-500/30"
            >
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="bg-yellow-500/20 p-2 rounded-xl">
                            <Trophy className="w-5 h-5 text-yellow-400" />
                        </div>
                        <div>
                            <h4 className="font-semibold">Daily Challenges</h4>
                            <p className="text-xs text-slate-400">
                                {data.completed_count}/{data.challenges.length} completed
                            </p>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        <Zap className="w-4 h-4 text-yellow-400" />
                        <span className="text-yellow-400 font-bold">
                            {data.total_xp_available} XP
                        </span>
                    </div>
                </div>

                <div className="mt-3 flex gap-2">
                    {data.challenges.map((challenge) => (
                        <div
                            key={challenge.id}
                            className={`flex-1 p-2 rounded-lg text-center ${challenge.completed
                                    ? 'bg-green-500/20'
                                    : 'bg-slate-800/50'
                                }`}
                        >
                            <span className="text-xl">{challenge.icon}</span>
                        </div>
                    ))}
                </div>
            </motion.div>
        );
    }

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-slate-800 rounded-2xl border border-slate-700 overflow-hidden"
        >
            {/* Header */}
            <div className="bg-gradient-to-r from-yellow-600 to-orange-600 p-6">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="bg-white/20 p-3 rounded-xl">
                            <Trophy className="w-8 h-8 text-white" />
                        </div>
                        <div>
                            <h3 className="text-2xl font-bold text-white">Daily Challenges</h3>
                            <p className="text-yellow-100">
                                Complete challenges to earn bonus XP!
                            </p>
                        </div>
                    </div>
                    <div className="text-right">
                        <div className="text-3xl font-bold text-white">
                            {data.total_xp_available}
                        </div>
                        <div className="text-yellow-100 text-sm">XP Available</div>
                    </div>
                </div>

                {/* Progress bar */}
                <div className="mt-4">
                    <div className="flex justify-between text-sm text-yellow-100 mb-1">
                        <span>Progress</span>
                        <span>{data.completed_count}/{data.challenges.length}</span>
                    </div>
                    <div className="bg-white/20 rounded-full h-2 overflow-hidden">
                        <motion.div
                            initial={{ width: 0 }}
                            animate={{
                                width: `${(data.completed_count / data.challenges.length) * 100}%`
                            }}
                            className="h-full bg-white rounded-full"
                        />
                    </div>
                </div>
            </div>

            {/* Challenges List */}
            <div className="p-4 space-y-3">
                {data.challenges.map((challenge, index) => (
                    <motion.div
                        key={challenge.id}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.1 }}
                        className={`p-4 rounded-xl border-2 transition-all ${challenge.completed
                                ? 'bg-green-900/20 border-green-500/50'
                                : 'bg-slate-900/50 border-slate-700 hover:border-yellow-500/50'
                            }`}
                    >
                        <div className="flex items-center gap-4">
                            <div className={`text-4xl p-2 rounded-xl ${challenge.completed
                                    ? 'bg-green-500/20'
                                    : 'bg-slate-800'
                                }`}>
                                {challenge.icon}
                            </div>

                            <div className="flex-1">
                                <div className="flex items-center gap-2">
                                    <h4 className={`font-bold ${challenge.completed ? 'text-green-400' : 'text-white'
                                        }`}>
                                        {challenge.name}
                                    </h4>
                                    {challenge.completed && (
                                        <CheckCircle className="w-5 h-5 text-green-400" />
                                    )}
                                </div>
                                <p className="text-sm text-slate-400 mt-1">
                                    {challenge.description}
                                </p>
                            </div>

                            <div className="text-right">
                                <div className={`flex items-center gap-1 ${challenge.completed
                                        ? 'text-green-400'
                                        : 'text-yellow-400'
                                    }`}>
                                    <Zap className="w-4 h-4" />
                                    <span className="font-bold">+{challenge.xp_reward} XP</span>
                                </div>

                                {!challenge.completed && (
                                    <button
                                        onClick={() => claimChallenge(challenge.id)}
                                        disabled={claiming === challenge.id}
                                        className="mt-2 px-4 py-1.5 bg-yellow-500 hover:bg-yellow-600 text-black text-sm font-semibold rounded-lg transition-colors disabled:opacity-50"
                                    >
                                        {claiming === challenge.id ? (
                                            <Loader2 className="w-4 h-4 animate-spin" />
                                        ) : (
                                            'Claim'
                                        )}
                                    </button>
                                )}
                            </div>
                        </div>
                    </motion.div>
                ))}
            </div>

            {/* All completed message */}
            <AnimatePresence>
                {allCompleted && (
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="p-4 bg-gradient-to-r from-green-900/50 to-emerald-900/50 border-t border-green-500/30"
                    >
                        <div className="flex items-center justify-center gap-3">
                            <Award className="w-6 h-6 text-green-400" />
                            <span className="text-green-400 font-semibold">
                                🎉 All challenges completed! Come back tomorrow for more!
                            </span>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </motion.div>
    );
};

export default DailyChallenges;