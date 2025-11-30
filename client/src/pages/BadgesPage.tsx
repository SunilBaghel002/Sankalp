// src/pages/BadgesPage.tsx
import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import PageLayout from "../components/PageLayout";
import {
    Trophy,
    Star,
    Lock,
    Crown,
    Flame,
    Target,
    Zap,
    Medal,
    Award,
    Sparkles,
    TrendingUp,
    Users,
    ChevronRight,
    Loader2,
    CheckCircle,
    Gift,
    Calendar,
    Moon,
    Sunrise,
    Brain,
    Heart,
    Shield,
    Rocket,
} from "lucide-react";

interface Badge {
    id: string;
    name: string;
    description: string;
    icon: string;
    xp: number;
    earned: boolean;
    earned_at?: string;
    category?: string;
}

interface LevelInfo {
    level: number;
    name: string;
    min_xp: number;
    max_xp: number;
    current_xp: number;
    progress: number;
    xp_to_next: number;
}

interface LeaderboardEntry {
    rank: number;
    name: string;
    xp: number;
    level: number;
    level_name: string;
    badges_count: number;
    is_current_user: boolean;
}

interface GamificationProfile {
    level: LevelInfo;
    total_xp: number;
    earned_badges: Badge[];
    locked_badges: Badge[];
    total_badges: number;
    available_badges: number;
}

const BadgesPage: React.FC = () => {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [profile, setProfile] = useState<GamificationProfile | null>(null);
    const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
    const [userRank, setUserRank] = useState<number | null>(null);
    const [activeTab, setActiveTab] = useState<"badges" | "leaderboard">("badges");
    const [selectedBadge, setSelectedBadge] = useState<Badge | null>(null);
    const [filter, setFilter] = useState<"all" | "earned" | "locked">("all");

    // Badge icon mapping
    const getBadgeIcon = (iconName: string) => {
        const icons: { [key: string]: React.ReactNode } = {
            "🌱": <Sparkles className="w-8 h-8" />,
            "⭐": <Star className="w-8 h-8" />,
            "🔥": <Flame className="w-8 h-8" />,
            "🏆": <Trophy className="w-8 h-8" />,
            "💎": <Crown className="w-8 h-8" />,
            "🚀": <Rocket className="w-8 h-8" />,
            "👑": <Crown className="w-8 h-8" />,
            "🌅": <Sunrise className="w-8 h-8" />,
            "🦉": <Moon className="w-8 h-8" />,
            "😴": <Moon className="w-8 h-8" />,
            "💡": <Brain className="w-8 h-8" />,
            "💪": <Shield className="w-8 h-8" />,
            "🎯": <Target className="w-8 h-8" />,
            "❤️": <Heart className="w-8 h-8" />,
        };
        return icons[iconName] || <Medal className="w-8 h-8" />;
    };

    // Level colors and styles
    const getLevelStyle = (level: number) => {
        if (level <= 2) return { color: "text-slate-400", bg: "bg-slate-500/20", border: "border-slate-500/30" };
        if (level <= 4) return { color: "text-green-400", bg: "bg-green-500/20", border: "border-green-500/30" };
        if (level <= 6) return { color: "text-blue-400", bg: "bg-blue-500/20", border: "border-blue-500/30" };
        if (level <= 8) return { color: "text-purple-400", bg: "bg-purple-500/20", border: "border-purple-500/30" };
        return { color: "text-yellow-400", bg: "bg-yellow-500/20", border: "border-yellow-500/30" };
    };

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            setLoading(true);

            // Fetch profile
            const profileResponse = await fetch("http://localhost:8000/gamification/profile", {
                method: "GET",
                credentials: "include",
            });
            if (profileResponse.ok) {
                const data = await profileResponse.json();
                setProfile(data);
            }

            // Check for new badges
            await fetch("http://localhost:8000/gamification/check-badges", {
                method: "POST",
                credentials: "include",
            });

            // Fetch leaderboard
            const leaderboardResponse = await fetch("http://localhost:8000/gamification/leaderboard", {
                method: "GET",
                credentials: "include",
            });
            if (leaderboardResponse.ok) {
                const data = await leaderboardResponse.json();
                setLeaderboard(data.leaderboard || []);
                setUserRank(data.current_user_rank);
            }
        } catch (error) {
            console.error("Error fetching data:", error);
        } finally {
            setLoading(false);
        }
    };

    const filteredBadges = () => {
        if (!profile) return [];
        const allBadges = [...profile.earned_badges, ...profile.locked_badges];

        switch (filter) {
            case "earned":
                return profile.earned_badges;
            case "locked":
                return profile.locked_badges;
            default:
                return allBadges;
        }
    };

    if (loading) {
        return (
            <PageLayout pageTitle="Badges & Achievements" pageIcon={Trophy}>
                <div className="flex items-center justify-center min-h-[60vh]">
                    <div className="text-center">
                        <motion.div
                            animate={{ rotate: 360 }}
                            transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                            className="w-16 h-16 border-4 border-yellow-500 border-t-transparent rounded-full mx-auto mb-4"
                        />
                        <p className="text-white text-lg">Loading achievements...</p>
                    </div>
                </div>
            </PageLayout>
        );
    }

    return (
        <PageLayout pageTitle="Badges & Achievements" pageIcon={Trophy}>
            <div className="max-w-7xl mx-auto px-4 py-6">
                {/* Level Card */}
                {profile && (
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="bg-gradient-to-br from-yellow-900/30 to-orange-900/30 rounded-2xl p-6 border border-yellow-500/30 mb-6"
                    >
                        <div className="flex flex-col md:flex-row items-center gap-6">
                            {/* Level Badge */}
                            <div className="relative">
                                <motion.div
                                    animate={{ rotate: [0, 5, -5, 0] }}
                                    transition={{ duration: 2, repeat: Infinity }}
                                    className={`w-28 h-28 rounded-full ${getLevelStyle(profile.level.level).bg} ${getLevelStyle(profile.level.level).border} border-4 flex items-center justify-center`}
                                >
                                    <div className="text-center">
                                        <Crown className={`w-10 h-10 mx-auto ${getLevelStyle(profile.level.level).color}`} />
                                        <div className={`text-2xl font-bold ${getLevelStyle(profile.level.level).color}`}>
                                            {profile.level.level}
                                        </div>
                                    </div>
                                </motion.div>
                                <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 bg-slate-900 px-3 py-1 rounded-full border border-slate-700">
                                    <span className={`text-sm font-bold ${getLevelStyle(profile.level.level).color}`}>
                                        {profile.level.name}
                                    </span>
                                </div>
                            </div>

                            {/* Progress & Stats */}
                            <div className="flex-1 text-center md:text-left">
                                <h2 className="text-2xl font-bold mb-2">Level {profile.level.level} - {profile.level.name}</h2>

                                {/* XP Progress Bar */}
                                <div className="mb-4">
                                    <div className="flex justify-between text-sm mb-2">
                                        <span className="text-slate-400">Experience Points</span>
                                        <span className="text-yellow-400 font-bold">
                                            {profile.total_xp} / {profile.level.max_xp} XP
                                        </span>
                                    </div>
                                    <div className="bg-slate-700 rounded-full h-4 overflow-hidden">
                                        <motion.div
                                            initial={{ width: 0 }}
                                            animate={{ width: `${profile.level.progress}%` }}
                                            transition={{ duration: 1, ease: "easeOut" }}
                                            className="h-full bg-gradient-to-r from-yellow-500 to-orange-500 rounded-full relative"
                                        >
                                            <div className="absolute inset-0 bg-white/20 animate-pulse" />
                                        </motion.div>
                                    </div>
                                    <p className="text-sm text-slate-400 mt-2">
                                        {profile.level.xp_to_next} XP to next level
                                    </p>
                                </div>

                                {/* Quick Stats */}
                                <div className="grid grid-cols-3 gap-4">
                                    <div className="bg-slate-800/50 rounded-xl p-3 text-center">
                                        <div className="text-2xl font-bold text-orange-400">{profile.total_xp}</div>
                                        <div className="text-xs text-slate-400">Total XP</div>
                                    </div>
                                    <div className="bg-slate-800/50 rounded-xl p-3 text-center">
                                        <div className="text-2xl font-bold text-yellow-400">{profile.total_badges}</div>
                                        <div className="text-xs text-slate-400">Badges</div>
                                    </div>
                                    <div className="bg-slate-800/50 rounded-xl p-3 text-center">
                                        <div className="text-2xl font-bold text-green-400">
                                            {Math.round((profile.total_badges / profile.available_badges) * 100)}%
                                        </div>
                                        <div className="text-xs text-slate-400">Complete</div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </motion.div>
                )}

                {/* Tabs */}
                <div className="flex gap-2 mb-6">
                    <button
                        onClick={() => setActiveTab("badges")}
                        className={`flex items-center gap-2 px-6 py-3 rounded-xl font-semibold transition-all ${activeTab === "badges"
                                ? "bg-yellow-500 text-white"
                                : "bg-slate-800 text-slate-400 hover:bg-slate-700"
                            }`}
                    >
                        <Medal className="w-5 h-5" />
                        <span>Badges</span>
                    </button>
                    <button
                        onClick={() => setActiveTab("leaderboard")}
                        className={`flex items-center gap-2 px-6 py-3 rounded-xl font-semibold transition-all ${activeTab === "leaderboard"
                                ? "bg-purple-500 text-white"
                                : "bg-slate-800 text-slate-400 hover:bg-slate-700"
                            }`}
                    >
                        <Users className="w-5 h-5" />
                        <span>Leaderboard</span>
                    </button>
                </div>

                <AnimatePresence mode="wait">
                    {/* Badges Tab */}
                    {activeTab === "badges" && (
                        <motion.div
                            key="badges"
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -20 }}
                        >
                            {/* Filter */}
                            <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
                                {[
                                    { id: "all", label: "All Badges", count: profile ? profile.earned_badges.length + profile.locked_badges.length : 0 },
                                    { id: "earned", label: "Earned", count: profile?.earned_badges.length || 0 },
                                    { id: "locked", label: "Locked", count: profile?.locked_badges.length || 0 },
                                ].map((f) => (
                                    <button
                                        key={f.id}
                                        onClick={() => setFilter(f.id as any)}
                                        className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium whitespace-nowrap transition-all ${filter === f.id
                                                ? "bg-orange-500 text-white"
                                                : "bg-slate-800 text-slate-400 hover:bg-slate-700"
                                            }`}
                                    >
                                        <span>{f.label}</span>
                                        <span className={`text-xs px-2 py-0.5 rounded-full ${filter === f.id ? "bg-white/20" : "bg-slate-700"
                                            }`}>
                                            {f.count}
                                        </span>
                                    </button>
                                ))}
                            </div>

                            {/* Badges Grid */}
                            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                                {filteredBadges().map((badge, index) => (
                                    <motion.div
                                        key={badge.id}
                                        initial={{ opacity: 0, scale: 0.8 }}
                                        animate={{ opacity: 1, scale: 1 }}
                                        transition={{ delay: index * 0.05 }}
                                        whileHover={{ scale: 1.05 }}
                                        whileTap={{ scale: 0.95 }}
                                        onClick={() => setSelectedBadge(badge)}
                                        className={`relative bg-slate-800 rounded-2xl p-6 border cursor-pointer transition-all ${badge.earned
                                                ? "border-yellow-500/50 hover:border-yellow-500"
                                                : "border-slate-700 hover:border-slate-600 opacity-60"
                                            }`}
                                    >
                                        {/* Earned indicator */}
                                        {badge.earned && (
                                            <div className="absolute top-2 right-2">
                                                <CheckCircle className="w-5 h-5 text-green-400" />
                                            </div>
                                        )}

                                        {/* Badge Icon */}
                                        <div className={`w-16 h-16 mx-auto mb-4 rounded-full flex items-center justify-center ${badge.earned
                                                ? "bg-gradient-to-br from-yellow-500/30 to-orange-500/30"
                                                : "bg-slate-700/50"
                                            }`}>
                                            {badge.earned ? (
                                                <span className="text-4xl">{badge.icon}</span>
                                            ) : (
                                                <Lock className="w-8 h-8 text-slate-500" />
                                            )}
                                        </div>

                                        {/* Badge Info */}
                                        <h3 className={`font-bold text-center mb-1 ${badge.earned ? "text-white" : "text-slate-500"
                                            }`}>
                                            {badge.name}
                                        </h3>
                                        <p className="text-xs text-slate-400 text-center line-clamp-2">
                                            {badge.description}
                                        </p>

                                        {/* XP */}
                                        <div className={`mt-3 text-center ${badge.earned ? "text-yellow-400" : "text-slate-500"
                                            }`}>
                                            <span className="text-sm font-bold">+{badge.xp} XP</span>
                                        </div>
                                    </motion.div>
                                ))}
                            </div>
                        </motion.div>
                    )}

                    {/* Leaderboard Tab */}
                    {activeTab === "leaderboard" && (
                        <motion.div
                            key="leaderboard"
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -20 }}
                            className="space-y-4"
                        >
                            {/* Top 3 Podium */}
                            <div className="grid grid-cols-3 gap-4 mb-8">
                                {leaderboard.slice(0, 3).map((entry, index) => {
                                    const positions = [
                                        { place: 2, height: "h-24", color: "from-slate-400 to-slate-500" },
                                        { place: 1, height: "h-32", color: "from-yellow-400 to-yellow-600" },
                                        { place: 3, height: "h-20", color: "from-amber-600 to-amber-800" },
                                    ];
                                    const pos = positions[index];
                                    const order = [1, 0, 2][index];

                                    return (
                                        <motion.div
                                            key={entry.rank}
                                            initial={{ opacity: 0, y: 50 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            transition={{ delay: order * 0.2 }}
                                            className={`order-${order} flex flex-col items-center`}
                                            style={{ order }}
                                        >
                                            <div className={`w-12 h-12 sm:w-16 sm:h-16 rounded-full bg-gradient-to-br ${pos.color} flex items-center justify-center mb-2 shadow-lg ${entry.is_current_user ? "ring-4 ring-orange-500" : ""
                                                }`}>
                                                {pos.place === 1 ? (
                                                    <Crown className="w-6 h-6 sm:w-8 sm:h-8 text-white" />
                                                ) : (
                                                    <span className="text-xl sm:text-2xl font-bold text-white">{pos.place}</span>
                                                )}
                                            </div>
                                            <div className={`bg-gradient-to-t ${pos.color} ${pos.height} w-full rounded-t-xl flex flex-col items-center justify-end pb-4`}>
                                                <p className="text-white font-bold text-sm sm:text-base truncate max-w-full px-2">
                                                    {entry.name.split(" ")[0]}
                                                </p>
                                                <p className="text-white/80 text-xs sm:text-sm">{entry.xp} XP</p>
                                            </div>
                                        </motion.div>
                                    );
                                })}
                            </div>

                            {/* Full Leaderboard */}
                            <div className="bg-slate-800 rounded-2xl border border-slate-700 overflow-hidden">
                                <div className="bg-slate-900 p-4 border-b border-slate-700">
                                    <h3 className="font-bold flex items-center gap-2">
                                        <Users className="w-5 h-5 text-purple-400" />
                                        Global Rankings
                                    </h3>
                                </div>

                                <div className="max-h-[400px] overflow-y-auto custom-scrollbar">
                                    {leaderboard.map((entry, index) => (
                                        <motion.div
                                            key={entry.rank}
                                            initial={{ opacity: 0, x: -20 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            transition={{ delay: index * 0.05 }}
                                            className={`flex items-center gap-4 p-4 border-b border-slate-700/50 ${entry.is_current_user ? "bg-orange-500/10" : "hover:bg-slate-700/30"
                                                }`}
                                        >
                                            {/* Rank */}
                                            <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold ${entry.rank === 1 ? "bg-yellow-500 text-white" :
                                                    entry.rank === 2 ? "bg-slate-400 text-white" :
                                                        entry.rank === 3 ? "bg-amber-600 text-white" :
                                                            "bg-slate-700 text-slate-300"
                                                }`}>
                                                {entry.rank}
                                            </div>

                                            {/* User Info */}
                                            <div className="flex-1">
                                                <div className="flex items-center gap-2">
                                                    <p className={`font-semibold ${entry.is_current_user ? "text-orange-400" : "text-white"}`}>
                                                        {entry.name}
                                                    </p>
                                                    {entry.is_current_user && (
                                                        <span className="text-xs bg-orange-500/20 text-orange-400 px-2 py-0.5 rounded-full">
                                                            You
                                                        </span>
                                                    )}
                                                </div>
                                                <p className="text-sm text-slate-400">
                                                    Level {entry.level} • {entry.level_name}
                                                </p>
                                            </div>

                                            {/* Stats */}
                                            <div className="text-right">
                                                <div className="text-lg font-bold text-yellow-400">{entry.xp} XP</div>
                                                <div className="text-xs text-slate-400">{entry.badges_count} badges</div>
                                            </div>
                                        </motion.div>
                                    ))}
                                </div>

                                {/* User's rank if not in top 10 */}
                                {userRank && userRank > 10 && (
                                    <div className="p-4 bg-slate-900 border-t border-slate-700">
                                        <p className="text-center text-slate-400">
                                            Your rank: <span className="text-orange-400 font-bold">#{userRank}</span>
                                        </p>
                                    </div>
                                )}
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Badge Detail Modal */}
                <AnimatePresence>
                    {selectedBadge && (
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4"
                            onClick={() => setSelectedBadge(null)}
                        >
                            <motion.div
                                initial={{ scale: 0.8, opacity: 0 }}
                                animate={{ scale: 1, opacity: 1 }}
                                exit={{ scale: 0.8, opacity: 0 }}
                                className="bg-slate-800 rounded-2xl p-6 max-w-sm w-full border border-slate-700"
                                onClick={(e) => e.stopPropagation()}
                            >
                                {/* Badge Icon */}
                                <div className={`w-24 h-24 mx-auto mb-6 rounded-full flex items-center justify-center ${selectedBadge.earned
                                        ? "bg-gradient-to-br from-yellow-500/30 to-orange-500/30"
                                        : "bg-slate-700/50"
                                    }`}>
                                    {selectedBadge.earned ? (
                                        <span className="text-6xl">{selectedBadge.icon}</span>
                                    ) : (
                                        <Lock className="w-12 h-12 text-slate-500" />
                                    )}
                                </div>

                                {/* Badge Info */}
                                <h3 className="text-2xl font-bold text-center mb-2">{selectedBadge.name}</h3>
                                <p className="text-slate-400 text-center mb-4">{selectedBadge.description}</p>

                                {/* XP Reward */}
                                <div className={`text-center p-4 rounded-xl mb-4 ${selectedBadge.earned ? "bg-yellow-500/20" : "bg-slate-700/50"
                                    }`}>
                                    <div className="flex items-center justify-center gap-2">
                                        <Zap className={`w-5 h-5 ${selectedBadge.earned ? "text-yellow-400" : "text-slate-500"}`} />
                                        <span className={`text-xl font-bold ${selectedBadge.earned ? "text-yellow-400" : "text-slate-500"}`}>
                                            +{selectedBadge.xp} XP
                                        </span>
                                    </div>
                                </div>

                                {/* Status */}
                                <div className={`text-center py-3 rounded-xl ${selectedBadge.earned ? "bg-green-500/20 text-green-400" : "bg-slate-700 text-slate-400"
                                    }`}>
                                    {selectedBadge.earned ? (
                                        <div className="flex items-center justify-center gap-2">
                                            <CheckCircle className="w-5 h-5" />
                                            <span className="font-semibold">Earned!</span>
                                        </div>
                                    ) : (
                                        <div className="flex items-center justify-center gap-2">
                                            <Lock className="w-5 h-5" />
                                            <span>Keep going to unlock this badge</span>
                                        </div>
                                    )}
                                </div>

                                {/* Close Button */}
                                <button
                                    onClick={() => setSelectedBadge(null)}
                                    className="w-full mt-4 bg-slate-700 hover:bg-slate-600 text-white py-3 rounded-xl font-semibold transition-colors"
                                >
                                    Close
                                </button>
                            </motion.div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </PageLayout>
    );
};

export default BadgesPage;