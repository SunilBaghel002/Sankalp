// src/pages/ImprovePage.tsx
import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import PageLayout from "../components/PageLayout";
import {
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
    Calendar,
    ChevronRight,
    Loader2,
    BookOpen,
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

    const tabItems = [
        { id: "motivation", label: "Motivation", icon: Lightbulb, activeColor: "bg-orange-500" },
        { id: "videos", label: "Videos", icon: Youtube, activeColor: "bg-red-500" },
        { id: "gamification", label: "Badges & XP", icon: Trophy, activeColor: "bg-yellow-500" },
        { id: "calendar", label: "Calendar", icon: Calendar, activeColor: "bg-blue-500" },
    ];

    return (
        <PageLayout pageTitle="Improve & Learn" pageIcon={Sparkles}>
            {/* AI Coach Button - Fixed */}
            <div className="fixed bottom-28 right-4 z-30">
                <motion.button
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={() => setShowAICoach(true)}
                    className="bg-gradient-to-r from-purple-500 to-blue-500 p-4 rounded-full shadow-lg hover:shadow-purple-500/25"
                >
                    <Brain className="w-6 h-6 text-white" />
                </motion.button>
            </div>

            <div className="max-w-7xl mx-auto px-4 py-4">
                {/* Tab Navigation */}
                <div className="flex gap-2 overflow-x-auto pb-4 mb-4">
                    {tabItems.map((tab) => {
                        const Icon = tab.icon;
                        return (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id as any)}
                                className={`flex items-center gap-2 px-4 py-2 rounded-xl font-medium whitespace-nowrap transition-all ${activeTab === tab.id
                                        ? `${tab.activeColor} text-white`
                                        : "bg-slate-800 text-slate-400 hover:bg-slate-700"
                                    }`}
                            >
                                <Icon className="w-4 h-4" />
                                <span className="hidden min-[400px]:inline">{tab.label}</span>
                            </button>
                        );
                    })}
                </div>

                {/* Content */}
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
                                            <div className="text-sm text-slate-400">Badges</div>
                                        </div>
                                        <div className="bg-slate-800 rounded-xl p-4 border border-slate-700 text-center">
                                            <div className="text-3xl font-bold text-purple-400">
                                                {gamificationProfile.level.level}
                                            </div>
                                            <div className="text-sm text-slate-400">Level</div>
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
                                            Creates recurring events for each of your habits
                                        </p>
                                    </div>
                                    <div className="bg-slate-900/50 rounded-xl p-4">
                                        <div className="bg-yellow-500/20 p-3 rounded-xl w-fit mb-3">
                                            <Zap className="w-6 h-6 text-yellow-400" />
                                        </div>
                                        <h4 className="font-semibold mb-2">Smart Notifications</h4>
                                        <p className="text-sm text-slate-400">
                                            Get popup reminders before each habit
                                        </p>
                                    </div>
                                    <div className="bg-slate-900/50 rounded-xl p-4">
                                        <div className="bg-green-500/20 p-3 rounded-xl w-fit mb-3">
                                            <Target className="w-6 h-6 text-green-400" />
                                        </div>
                                        <h4 className="font-semibold mb-2">100-Day Challenge</h4>
                                        <p className="text-sm text-slate-400">
                                            Reminders for the full 100 days
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
        </PageLayout>
    );
};

export default ImprovePage;