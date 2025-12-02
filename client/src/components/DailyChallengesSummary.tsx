// src/components/DailyChallengesSummary.tsx
import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import {
    Trophy,
    CheckCircle,
    ChevronRight,
    Loader2,
    Zap,
    Target,
    Sparkles,
} from 'lucide-react';

interface Challenge {
    id: string;
    name: string;
    icon: string;
    xp_reward: number;
    completed: boolean;
}

interface ChallengesData {
    challenges: Challenge[];
    total_xp_available: number;
    completed_count: number;
}

const DailyChallengesSummary: React.FC = () => {
    const navigate = useNavigate();
    const [data, setData] = useState<ChallengesData | null>(null);
    const [loading, setLoading] = useState(true);

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

    if (loading) {
        return (
            <div className="bg-slate-800 rounded-2xl p-6 border border-slate-700">
                <div className="flex items-center justify-center gap-3 py-4">
                    <Loader2 className="w-5 h-5 animate-spin text-yellow-500" />
                    <span className="text-slate-400 text-sm">Loading challenges...</span>
                </div>
            </div>
        );
    }

    if (!data || data.challenges.length === 0) {
        return null;
    }

    const allCompleted = data.completed_count === data.challenges.length;
    const progress = (data.completed_count / data.challenges.length) * 100;
    const remainingChallenges = data.challenges.length - data.completed_count;

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className={`rounded-2xl p-5 border-2 cursor-pointer transition-all ${allCompleted
                    ? 'bg-gradient-to-br from-green-900/40 to-emerald-900/40 border-green-500/50 hover:border-green-400'
                    : 'bg-gradient-to-br from-yellow-900/30 to-orange-900/30 border-yellow-500/30 hover:border-yellow-500'
                }`}
            onClick={() => navigate('/challenges')}
        >
            {/* Header */}
            <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                    <div className={`p-3 rounded-xl ${allCompleted ? 'bg-green-500/20' : 'bg-yellow-500/20'
                        }`}>
                        {allCompleted ? (
                            <CheckCircle className="w-7 h-7 text-green-400" />
                        ) : (
                            <Trophy className="w-7 h-7 text-yellow-400" />
                        )}
                    </div>
                    <div>
                        <h4 className={`font-bold text-lg ${allCompleted ? 'text-green-400' : 'text-white'
                            }`}>
                            {allCompleted ? 'Daily Challenges Completed!' : 'Complete Your Daily Challenges'}
                        </h4>
                        <p className="text-sm text-slate-400">
                            {allCompleted
                                ? '🎉 Great job! Come back tomorrow for more'
                                : `${remainingChallenges} challenge${remainingChallenges !== 1 ? 's' : ''} waiting for you`
                            }
                        </p>
                    </div>
                </div>
                <ChevronRight className={`w-6 h-6 ${allCompleted ? 'text-green-400' : 'text-yellow-400'
                    }`} />
            </div>

            {/* Progress Bar */}
            <div className="mb-4">
                <div className="flex justify-between text-xs mb-1.5">
                    <span className="text-slate-400">Progress</span>
                    <span className={`font-semibold ${allCompleted ? 'text-green-400' : 'text-yellow-400'}`}>
                        {data.completed_count}/{data.challenges.length} completed
                    </span>
                </div>
                <div className="bg-slate-700/50 rounded-full h-2.5 overflow-hidden">
                    <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${progress}%` }}
                        transition={{ duration: 0.8, ease: "easeOut" }}
                        className={`h-full rounded-full ${allCompleted
                                ? 'bg-gradient-to-r from-green-500 to-emerald-500'
                                : 'bg-gradient-to-r from-yellow-500 to-orange-500'
                            }`}
                    />
                </div>
            </div>

            {/* Challenge Icons Preview */}
            <div className="flex gap-2 mb-4">
                {data.challenges.map((challenge) => (
                    <motion.div
                        key={challenge.id}
                        initial={{ scale: 0.8, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        className={`flex-1 p-3 rounded-xl text-center transition-all ${challenge.completed
                                ? 'bg-green-500/20 border border-green-500/40'
                                : 'bg-slate-800/70 border border-slate-700'
                            }`}
                    >
                        <span className="text-2xl">
                            {challenge.completed ? '✅' : challenge.icon}
                        </span>
                    </motion.div>
                ))}
            </div>

            {/* XP Info */}
            <div className="flex items-center justify-between">
                {!allCompleted ? (
                    <div className="flex items-center gap-2">
                        <Zap className="w-5 h-5 text-yellow-400" />
                        <span className="text-yellow-400 font-bold text-lg">
                            {data.total_xp_available} XP
                        </span>
                        <span className="text-slate-400 text-sm">available to earn</span>
                    </div>
                ) : (
                    <div className="flex items-center gap-2">
                        <Sparkles className="w-5 h-5 text-green-400" />
                        <span className="text-green-400 font-semibold">
                            All rewards claimed!
                        </span>
                    </div>
                )}
                <span className="text-xs text-slate-500 flex items-center gap-1">
                    View details <ChevronRight className="w-3 h-3" />
                </span>
            </div>
        </motion.div>
    );
};

export default DailyChallengesSummary;