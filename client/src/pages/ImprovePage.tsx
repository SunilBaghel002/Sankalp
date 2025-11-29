// src/pages/ImprovePage.tsx
import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import {
    ArrowLeft,
    Sparkles,
    Youtube,
    Brain,
    Trophy,
    MessageCircle,
    Lightbulb,
    Target,
    TrendingUp,
    Zap,
    Star,
    Award,
    Flame,
    BookOpen,
    Home,
    BarChart3,
    Moon,
    Calendar,
    ChevronRight,
    Loader2,
} from "lucide-react";
import MotivationalQuote from "../components/MotivationalQuote";
import DailyAffirmation from "../components/DailyAffirmation";
import VideoRecommendations from "../components/VideoRecommendations";
import CalendarSync from "../components/CalendarSync";
import AICoach from "../components/AICoach";
import BadgeDisplay from "../components/BadgeDisplay";
import LevelProgress from "../components/LevelProgress";

interface GamificationProfile {
    level: any;
    total_xp: number;
    earned_badges: any[];
    locked_badges: any[];
    total_badges: number;
    available_badges: number;
}

interface WeeklyReport {
    summary: string;
    highlights: string[];
    areas_to_improve: string[];
    next_week_focus: string;
    motivational_message: string;
}

interface HabitTips {
    tips: string[];
    focus_area: string;
    weekly_challenge: string;
}

const ImprovePage: React.FC = () => {
    const navigate = useNavigate();
    const [activeTab, setActiveTab] = useState<"motivation" | "videos" | "gamification" | "calendar">("motivation");
    const [showAICoach, setShowAICoach] = useState(false);
    const [gamificationProfile, setGamificationProfile] = useState<GamificationProfile | null>(null);
    const [weeklyReport, setWeeklyReport] = useState<WeeklyReport | null>(null);
    const [habitTips, setHabitTips] = useState<HabitTips | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            setLoading(true);

            // Fetch gamification profile
            const profileResponse = await fetch("http://localhost:8000/gamification/profile", {
                method: "GET",
                credentials: "include",
            });
            if (profileResponse.ok) {
                const profileData = await profileResponse.json();
                setGamificationProfile(profileData);
            }

            // Check for new badges
            await fetch("http://localhost:8000/gamification/check-badges", {
                method: "POST",
                credentials: "include",
            });

            // Fetch weekly report
            const reportResponse = await fetch("http://localhost:8000/ai/weekly-report", {
                method: "GET",
                credentials: "include",
            });
            if (reportResponse.ok) {
                const reportData = await reportResponse.json();
                setWeeklyReport(reportData);
            }

            // Fetch habit tips
            const tipsResponse = await fetch("http://localhost:8000/ai/habit-tips", {
                method: "GET",
                credentials: "include",
            });
            if (tipsResponse.ok) {
                const tipsData = await tipsResponse.json();
                setHabitTips(tipsData);
            }
        } catch (error) {
            console.error("Error fetching data:", error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-slate-950 text-white pb-24">
            {/* Header */}
            <div className="sticky top-0 bg-slate-950/90 backdrop-blur-md border-b border-slate-800 z-40 p-4">
                <div className="max-w-7xl mx-auto">
                    <div className="flex items-center justify-between">
                        <button
                            onClick={() => navigate("/daily")}
                            className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors"
                        >
                            <ArrowLeft className="w-5 h-5" />
                            <span>Back</span>
                        </button>
                        <h1 className="text-xl font-bold flex items-center gap-2">
                            <Sparkles className="w-6 h-6 text-orange-500" />
                            Improve & Learn
                        </h1>
                        <button
                            onClick={() => setShowAICoach(true)}
                            className="flex items-center gap-2 bg-purple-500 hover:bg-purple-600 px-4 py-2 rounded-xl font-medium transition-colors"
                        >
                            <Brain className="w-5 h-5" />
                            <span className="hidden sm:inline">AI Coach</span>
                        </button>
                    </div>
                </div>
            </div>

            {/* Tab Navigation */}
            <div className="max-w-7xl mx-auto px-4 py-4">
                <div className="flex gap-2 overflow-x-auto pb-2">
                    <button
                        onClick={() => setActiveTab("motivation")}
                        className={`flex items-center gap-2 px-4 py-2 rounded-xl font-medium whitespace-nowrap transition-all ${activeTab === "motivation"
                                ? "bg-orange-500 text-white"
                                : "bg-slate-800 text-slate-400 hover:bg-slate-700"
                            }`}
                    >
                        <Lightbulb className="w-4 h-4" />
                        <span>Motivation</span>
                    </button>
                    <button
                        onClick={() => setActiveTab("videos")}
                        className={`flex items-center gap-2 px-4 py-2 rounded-xl font-medium whitespace-nowrap transition-all ${activeTab === "videos"
                                ? "bg-red-500 text-white"
                                : "bg-slate-800 text-slate-400 hover:bg-slate-700"
                            }`}
                    >
                        <Youtube className="w-4 h-4" />
                        <span>Videos</span>
                    </button>
                    <button
                        onClick={() => setActiveTab("gamification")}
                        className={`flex items-center gap-2 px-4 py-2 rounded-xl font-medium whitespace-nowrap transition-all ${activeTab === "gamification"
                                ? "bg-yellow-500 text-white"
                                : "bg-slate-800 text-slate-400 hover:bg-slate-700"
                            }`}
                    >
                        <Trophy className="w-4 h-4" />
                        <span>Badges & XP</span>
                    </button>
                    <button
                        onClick={() => setActiveTab("calendar")}
                        className={`flex items-center gap-2 px-4 py-2 rounded-xl font-medium whitespace-nowrap transition-all ${activeTab === "calendar"
                                ? "bg-blue-500 text-white"
                                : "bg-slate-800 text-slate-400 hover:bg-slate-700"
                            }`}
                    >
                        <Calendar className="w-4 h-4" />
                        <span>Calendar</span>
                    </button>
                </div>
            </div>

            {/* Content */}
            <div className="max-w-7xl mx-auto px-4">
                <AnimatePresence mode="wait">
                    {activeTab === "motivation" && (
                        <motion.div
                            key="motivation"
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -20 }}
                            className="space-y-6"
                        >
                            {/* Daily Affirmation */}
                            <DailyAffirmation />

                            {/* Motivational Quote */}
                            <MotivationalQuote />

                            {/* Weekly Report */}
                            {weeklyReport && (
                                <motion.div
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    className="bg-slate-800 rounded-2xl p-6 border border-slate-700"
                                >
                                    <div className="flex items-center gap-3 mb-6">
                                        <div className="bg-blue-500/20 p-3 rounded-xl">
                                            <TrendingUp className="w-6 h-6 text-blue-400" />
                                        </div>
                                        <div>
                                            <h3 className="text-xl font-bold">Weekly Report</h3>
                                            <p className="text-sm text-slate-400">AI-generated insights</p>
                                        </div>
                                    </div>

                                    <p className="text-slate-300 mb-6">{weeklyReport.summary}</p>

                                    <div className="grid md:grid-cols-2 gap-4 mb-6">
                                        <div className="bg-green-900/20 border border-green-500/30 rounded-xl p-4">
                                            <h4 className="font-semibold text-green-400 mb-3 flex items-center gap-2">
                                                <Star className="w-5 h-5" />
                                                Highlights
                                            </h4>
                                            <ul className="space-y-2">
                                                {weeklyReport.highlights.map((highlight, index) => (
                                                    <li key={index} className="text-sm text-slate-300 flex items-start gap-2">
                                                        <span className="text-green-400">✓</span>
                                                        {highlight}
                                                    </li>
                                                ))}
                                            </ul>
                                        </div>

                                        <div className="bg-orange-900/20 border border-orange-500/30 rounded-xl p-4">
                                            <h4 className="font-semibold text-orange-400 mb-3 flex items-center gap-2">
                                                <Target className="w-5 h-5" />
                                                Areas to Improve
                                            </h4>
                                            <ul className="space-y-2">
                                                {weeklyReport.areas_to_improve.map((area, index) => (
                                                    <li key={index} className="text-sm text-slate-300 flex items-start gap-2">
                                                        <span className="text-orange-400">→</span>
                                                        {area}
                                                    </li>
                                                ))}
                                            </ul>
                                        </div>
                                    </div>

                                    <div className="bg-purple-900/20 border border-purple-500/30 rounded-xl p-4">
                                        <h4 className="font-semibold text-purple-400 mb-2 flex items-center gap-2">
                                            <Zap className="w-5 h-5" />
                                            Next Week Focus
                                        </h4>
                                        <p className="text-slate-300">{weeklyReport.next_week_focus}</p>
                                    </div>

                                    <div className="mt-6 p-4 bg-gradient-to-r from-orange-500/20 to-red-500/20 rounded-xl">
                                        <p className="text-center text-lg font-medium">
                                            {weeklyReport.motivational_message}
                                        </p>
                                    </div>
                                </motion.div>
                            )}

                            {/* Habit Tips */}
                            {habitTips && (
                                <motion.div
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    className="bg-slate-800 rounded-2xl p-6 border border-slate-700"
                                >
                                    <div className="flex items-center gap-3 mb-6">
                                        <div className="bg-green-500/20 p-3 rounded-xl">
                                            <BookOpen className="w-6 h-6 text-green-400" />
                                        </div>
                                        <div>
                                            <h3 className="text-xl font-bold">Personalized Tips</h3>
                                            <p className="text-sm text-slate-400">Focus: {habitTips.focus_area}</p>
                                        </div>
                                    </div>

                                    <div className="space-y-4 mb-6">
                                        {habitTips.tips.map((tip, index) => (
                                            <div
                                                key={index}
                                                className="flex items-start gap-4 bg-slate-900/50 rounded-xl p-4"
                                            >
                                                <div className="bg-green-500 text-white w-8 h-8 rounded-full flex items-center justify-center font-bold shrink-0">
                                                    {index + 1}
                                                </div>
                                                <p className="text-slate-300">{tip}</p>
                                            </div>
                                        ))}
                                    </div>

                                    <div className="bg-gradient-to-r from-yellow-500/20 to-orange-500/20 rounded-xl p-4">
                                        <div className="flex items-center gap-2 mb-2">
                                            <Trophy className="w-5 h-5 text-yellow-400" />
                                            <h4 className="font-semibold text-yellow-300">Weekly Challenge</h4>
                                        </div>
                                        <p className="text-white">{habitTips.weekly_challenge}</p>
                                    </div>
                                </motion.div>
                            )}

                            {/* AI Coach CTA */}
                            <motion.button
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                onClick={() => setShowAICoach(true)}
                                className="w-full bg-gradient-to-r from-purple-600 to-blue-600 rounded-2xl p-6 text-left hover:from-purple-500 hover:to-blue-500 transition-all group"
                            >
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-4">
                                        <div className="bg-white/20 p-4 rounded-xl">
                                            <MessageCircle className="w-8 h-8 text-white" />
                                        </div>
                                        <div>
                                            <h3 className="text-xl font-bold mb-1">Chat with AI Coach</h3>
                                            <p className="text-white/80">
                                                Get personalized advice, motivation, and habit tips
                                            </p>
                                        </div>
                                    </div>
                                    <ChevronRight className="w-6 h-6 group-hover:translate-x-1 transition-transform" />
                                </div>
                            </motion.button>
                        </motion.div>
                    )}

                    {activeTab === "videos" && (
                        <motion.div
                            key="videos"
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -20 }}
                        >
                            <VideoRecommendations />
                        </motion.div>
                    )}

                    {activeTab === "gamification" && (
                        <motion.div
                            key="gamification"
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -20 }}
                            className="space-y-6"
                        >
                            {loading ? (
                                <div className="flex items-center justify-center py-12">
                                    <Loader2 className="w-8 h-8 animate-spin text-orange-500" />
                                </div>
                            ) : gamificationProfile ? (
                                <>
                                    {/* Level Progress */}
                                    <LevelProgress
                                        levelInfo={gamificationProfile.level}
                                        totalXp={gamificationProfile.total_xp}
                                    />

                                    {/* Stats */}
                                    <div className="grid grid-cols-3 gap-4">
                                        <div className="bg-slate-800 rounded-xl p-4 border border-slate-700 text-center">
                                            <div className="text-3xl font-bold text-orange-400">
                                                {gamificationProfile.total_xp}
                                            </div>
                                            <div className="text-sm text-slate-400">Total XP</div>
                                        </div>
                                        <div className="bg-slate-800 rounded-xl p-4 border border-slate-700 text-center">
                                            <div className="text-3xl font-bold text-yellow-400">
                                                {gamificationProfile.total_badges}
                                            </div>
                                            <div className="text-sm text-slate-400">Badges Earned</div>
                                        </div>
                                        <div className="bg-slate-800 rounded-xl p-4 border border-slate-700 text-center">
                                            <div className="text-3xl font-bold text-purple-400">
                                                {gamificationProfile.level.level}
                                            </div>
                                            <div className="text-sm text-slate-400">Current Level</div>
                                        </div>
                                    </div>

                                    {/* Badges */}
                                    <div className="bg-slate-800 rounded-2xl p-6 border border-slate-700">
                                        <BadgeDisplay
                                            badges={[
                                                ...gamificationProfile.earned_badges,
                                                ...gamificationProfile.locked_badges,
                                            ]}
                                        />
                                    </div>
                                </>
                            ) : (
                                <div className="text-center py-12 text-slate-400">
                                    <Trophy className="w-12 h-12 mx-auto mb-4 opacity-50" />
                                    <p>Unable to load gamification data</p>
                                </div>
                            )}
                        </motion.div>
                    )}

                    {activeTab === "calendar" && (
                        <motion.div
                            key="calendar"
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -20 }}
                            className="space-y-6"
                        >
                            <CalendarSync />

                            {/* Benefits */}
                            <div className="bg-slate-800 rounded-2xl p-6 border border-slate-700">
                                <h3 className="text-xl font-bold mb-4">How Calendar Reminders Work</h3>
                                <div className="grid md:grid-cols-3 gap-4">
                                    <div className="bg-slate-900/50 rounded-xl p-4">
                                        <div className="bg-blue-500/20 p-3 rounded-xl w-fit mb-3">
                                            <Calendar className="w-6 h-6 text-blue-400" />
                                        </div>
                                        <h4 className="font-semibold mb-2">Daily Events</h4>
                                        <p className="text-sm text-slate-400">
                                            Creates recurring events for each of your habits at their scheduled times
                                        </p>
                                    </div>
                                    <div className="bg-slate-900/50 rounded-xl p-4">
                                        <div className="bg-yellow-500/20 p-3 rounded-xl w-fit mb-3">
                                            <Zap className="w-6 h-6 text-yellow-400" />
                                        </div>
                                        <h4 className="font-semibold mb-2">Smart Notifications</h4>
                                        <p className="text-sm text-slate-400">
                                            Get popup reminders 10 and 30 minutes before each habit
                                        </p>
                                    </div>
                                    <div className="bg-slate-900/50 rounded-xl p-4">
                                        <div className="bg-green-500/20 p-3 rounded-xl w-fit mb-3">
                                            <Target className="w-6 h-6 text-green-400" />
                                        </div>
                                        <h4 className="font-semibold mb-2">100-Day Challenge</h4>
                                        <p className="text-sm text-slate-400">
                                            Reminders are set for the full 100 days of your challenge
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>

            {/* AI Coach Modal */}
            <AICoach isOpen={showAICoach} onClose={() => setShowAICoach(false)} />

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
                        className="flex flex-col items-center gap-1 text-slate-400 hover:text-white transition-colors"
                    >
                        <BarChart3 className="w-6 h-6" />
                        <span className="text-xs">Analysis</span>
                    </button>
                    <button
                        onClick={() => navigate("/improve")}
                        className="flex flex-col items-center gap-1 text-orange-400"
                    >
                        <Sparkles className="w-6 h-6" />
                        <span className="text-xs font-semibold">Improve</span>
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

export default ImprovePage;