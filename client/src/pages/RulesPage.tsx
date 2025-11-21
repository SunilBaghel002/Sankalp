// src/pages/RulesPage.tsx
import React, { useState } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import {
    AlertTriangle,
    Clock,
    Ban,
    CheckCircle2,
    Flame,
    ShieldAlert,
    Terminal,
    ArrowLeft,
    Coins,
    Calendar,
    AlertCircle,
    Lock,
    RefreshCcw,
    Users,
    MessageCircle,
    Target,
    Trophy,
} from "lucide-react";

const RulesPage: React.FC = () => {
    const navigate = useNavigate();
    const [expandedSection, setExpandedSection] = useState<string | null>(null);

    const container = {
        hidden: { opacity: 0 },
        show: {
            opacity: 1,
            transition: {
                staggerChildren: 0.1,
            },
        },
    };

    return (
        <div className="min-h-screen bg-slate-950 text-slate-200 font-sans">
            {/* Header */}
            <header className="sticky top-0 z-50 bg-slate-950/90 backdrop-blur-md border-b border-slate-800">
                <div className="max-w-7xl mx-auto px-4 py-4">
                    <nav className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <button
                                onClick={() => navigate("/")}
                                className="p-2 hover:bg-slate-800 rounded-full transition-colors"
                            >
                                <ArrowLeft className="w-6 h-6" />
                            </button>
                            <h1 className="text-2xl font-bold flex items-center gap-2">
                                <Terminal className="text-orange-500" /> System Protocols
                            </h1>
                        </div>
                        <button
                            onClick={() => navigate("/query")}
                            className="bg-orange-500/10 hover:bg-orange-500/20 text-orange-500 px-4 py-2 rounded-lg font-medium flex items-center gap-2 transition-colors"
                        >
                            <MessageCircle className="w-4 h-4" />
                            Have Questions?
                        </button>
                    </nav>
                </div>
            </header>

            {/* Hero Section */}
            <section className="bg-gradient-to-br from-slate-900 via-slate-950 to-slate-900 py-16 px-4 border-b border-slate-800">
                <div className="max-w-7xl mx-auto text-center">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                    >
                        <h2 className="text-5xl md:text-6xl font-extrabold text-white mb-6">
                            The Ironclad Rules
                        </h2>
                        <p className="text-xl text-slate-400 max-w-3xl mx-auto">
                            Sankalp operates on strict logic. There is no human intervention.
                            There is no mercy. <span className="text-orange-500 font-semibold">Read every word carefully.</span>
                        </p>
                        <div className="mt-8 flex flex-wrap justify-center gap-4">
                            <div className="bg-red-500/10 border border-red-500/20 px-4 py-2 rounded-lg">
                                <span className="text-red-400 font-semibold">⚠️ Zero Tolerance</span>
                            </div>
                            <div className="bg-orange-500/10 border border-orange-500/20 px-4 py-2 rounded-lg">
                                <span className="text-orange-400 font-semibold">🔒 100 Days Locked</span>
                            </div>
                            <div className="bg-green-500/10 border border-green-500/20 px-4 py-2 rounded-lg">
                                <span className="text-green-400 font-semibold">💰 ₹500 at Risk</span>
                            </div>
                        </div>
                    </motion.div>
                </div>
            </section>

            {/* Main Content - Full Width Grid */}
            <div className="max-w-7xl mx-auto px-4 py-12">
                <div className="grid lg:grid-cols-2 gap-8">
                    {/* Left Column - Setup & Daily Rules */}
                    <div className="space-y-8">
                        {/* SECTION 1: INITIALIZATION */}
                        <motion.section
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: 0.1 }}
                            className="bg-slate-900 rounded-2xl p-6 border border-slate-800"
                        >
                            <div className="flex items-center gap-3 mb-6">
                                <div className="bg-blue-500/10 p-3 rounded-xl">
                                    <Coins className="w-6 h-6 text-blue-500" />
                                </div>
                                <div>
                                    <h3 className="text-2xl font-bold text-white">01. The Setup Phase</h3>
                                    <p className="text-slate-400 text-sm">One-time configuration, no changes allowed</p>
                                </div>
                            </div>

                            <div className="space-y-4">
                                <DetailedRule
                                    icon={<Coins className="text-blue-400" />}
                                    title="₹500 Upfront Payment"
                                    condition="You deposit money via Razorpay"
                                    details={[
                                        "Money leaves your account immediately",
                                        "It enters the 'Burn Fund' - not held in escrow",
                                        "Cannot be cancelled or reversed",
                                        "Refunded ONLY after 100 successful days"
                                    ]}
                                    consequence="No payment = No entry to challenge"
                                    type="neutral"
                                />

                                <DetailedRule
                                    icon={<Target className="text-blue-400" />}
                                    title="Select EXACTLY 5 Habits"
                                    condition="You must choose 5 habits"
                                    details={[
                                        "Not 4, not 6 - exactly 5 habits",
                                        "Can be anything: Exercise, Reading, Meditation, etc.",
                                        "Must be specific and measurable",
                                        "Once selected, cannot be edited for 100 days"
                                    ]}
                                    consequence="Habits are locked forever once challenge starts"
                                    type="neutral"
                                />

                                <DetailedRule
                                    icon={<Calendar className="text-blue-400" />}
                                    title="Challenge Start Time"
                                    condition="Payment confirmed + Habits selected"
                                    details={[
                                        "Challenge starts at 00:00 IST the NEXT day",
                                        "Day 1 begins automatically",
                                        "100-day countdown begins",
                                        "No 'warm-up' or 'practice' days"
                                    ]}
                                    consequence="Clock starts ticking, no pause button exists"
                                    type="neutral"
                                />
                            </div>
                        </motion.section>

                        {/* SECTION 2: DAILY REQUIREMENTS */}
                        <motion.section
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: 0.2 }}
                            className="bg-slate-900 rounded-2xl p-6 border border-slate-800"
                        >
                            <div className="flex items-center gap-3 mb-6">
                                <div className="bg-orange-500/10 p-3 rounded-xl">
                                    <Flame className="w-6 h-6 text-orange-500" />
                                </div>
                                <div>
                                    <h3 className="text-2xl font-bold text-white">02. Daily Requirements</h3>
                                    <p className="text-slate-400 text-sm">Must be completed every single day</p>
                                </div>
                            </div>

                            <div className="space-y-4">
                                <DetailedRule
                                    icon={<Clock className="text-red-500" />}
                                    title="11:59 PM IST Deadline"
                                    condition="Every habit must be checked before midnight"
                                    details={[
                                        "Check-in window: 00:00 AM to 11:59 PM IST",
                                        "No timezone adjustments allowed",
                                        "Server time is final",
                                        "11:59:59 PM = still valid, 12:00:00 AM = FAILED"
                                    ]}
                                    consequence="Miss deadline = Lose ₹500 immediately"
                                    type="danger"
                                />

                                <DetailedRule
                                    icon={<AlertCircle className="text-red-500" />}
                                    title="No Excuses Accepted"
                                    condition="You claim special circumstances"
                                    details={[
                                        "❌ 'I was travelling' - NOT accepted",
                                        "❌ 'My phone died' - NOT accepted",
                                        "❌ 'I forgot' - NOT accepted",
                                        "❌ 'App was down' - NOT accepted",
                                        "❌ 'I was sick' - NOT accepted"
                                    ]}
                                    consequence="ALL excuses = AUTO-REJECTED. Money forfeited."
                                    type="danger"
                                />
                            </div>
                        </motion.section>
                    </div>

                    {/* Right Column - Consequences & Victory */}
                    <div className="space-y-8">
                        {/* SECTION 3: FAILURE CONDITIONS */}
                        <motion.section
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: 0.3 }}
                            className="bg-slate-900 rounded-2xl p-6 border border-slate-800"
                        >
                            <div className="flex items-center gap-3 mb-6">
                                <div className="bg-red-500/10 p-3 rounded-xl">
                                    <Ban className="w-6 h-6 text-red-500" />
                                </div>
                                <div>
                                    <h3 className="text-2xl font-bold text-white">03. Failure Conditions</h3>
                                    <p className="text-slate-400 text-sm">Any of these = Instant elimination</p>
                                </div>
                            </div>

                            <div className="space-y-4">
                                <DetailedRule
                                    icon={<ShieldAlert className="text-red-500" />}
                                    title="Single Day Miss = Game Over"
                                    condition="You miss even ONE day"
                                    details={[
                                        "Missing 1 habit = Day incomplete",
                                        "Missing 1 day = Challenge failed",
                                        "₹500 transferred to 'Winners Fund'",
                                        "Your name appears on 'Wall of Shame'"
                                    ]}
                                    consequence="₹500 GONE FOREVER. No appeals."
                                    type="danger"
                                />

                                <DetailedRule
                                    icon={<Users className="text-red-500" />}
                                    title="Cheating = Permanent Ban"
                                    condition="Multiple accounts or fake check-ins detected"
                                    details={[
                                        "We track device fingerprints",
                                        "We monitor behavior patterns",
                                        "Suspicious activity = Investigation",
                                        "Confirmed cheating = Lifetime ban"
                                    ]}
                                    consequence="Money forfeited + Public shaming + Banned forever"
                                    type="danger"
                                />
                            </div>
                        </motion.section>

                        {/* SECTION 4: VICTORY CONDITIONS */}
                        <motion.section
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: 0.4 }}
                            className="bg-slate-900 rounded-2xl p-6 border border-slate-800"
                        >
                            <div className="flex items-center gap-3 mb-6">
                                <div className="bg-green-500/10 p-3 rounded-xl">
                                    <Trophy className="w-6 h-6 text-green-500" />
                                </div>
                                <div>
                                    <h3 className="text-2xl font-bold text-white">04. Victory Conditions</h3>
                                    <p className="text-slate-400 text-sm">Complete all requirements = Win</p>
                                </div>
                            </div>

                            <div className="space-y-4">
                                <DetailedRule
                                    icon={<CheckCircle2 className="text-green-500" />}
                                    title="100 Days Perfect Completion"
                                    condition="All 5 habits × 100 days = 500 check-ins"
                                    details={[
                                        "Day 101: Automatic victory declared",
                                        "₹500 refunded to original payment method",
                                        "Processing time: 3-7 business days",
                                        "Victory certificate generated"
                                    ]}
                                    consequence="Full refund + Exclusive rewards + Lifetime bragging rights"
                                    type="success"
                                />

                                <DetailedRule
                                    icon={<Trophy className="text-yellow-500" />}
                                    title="Bonus Rewards"
                                    condition="Top performers in each cohort"
                                    details={[
                                        "1st Place: ₹1000 bonus cash",
                                        "Top 10: Exclusive Sankalp merchandise",
                                        "All Winners: 'Sankalp Legend' badge",
                                        "Hall of Fame permanent entry"
                                    ]}
                                    consequence="Quitters fund the winners' glory"
                                    type="success"
                                />
                            </div>
                        </motion.section>

                        {/* SECTION 5: SPECIAL PROVISIONS */}
                        <motion.section
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: 0.5 }}
                            className="bg-slate-900 rounded-2xl p-6 border border-slate-800"
                        >
                            <div className="flex items-center gap-3 mb-6">
                                <div className="bg-yellow-500/10 p-3 rounded-xl">
                                    <AlertTriangle className="w-6 h-6 text-yellow-500" />
                                </div>
                                <div>
                                    <h3 className="text-2xl font-bold text-white">05. Special Provisions</h3>
                                    <p className="text-slate-400 text-sm">Limited flexibility (if enabled)</p>
                                </div>
                            </div>

                            <div className="space-y-4">
                                <DetailedRule
                                    icon={<RefreshCcw className="text-yellow-500" />}
                                    title="ONE Emergency Skip (Optional)"
                                    condition="Serious medical/family emergency"
                                    details={[
                                        "Must submit proof within 48 hours",
                                        "Hospital records / Death certificate required",
                                        "Review takes 24-48 hours",
                                        "Rejection = Streak broken"
                                    ]}
                                    consequence="Use wisely - only ONE allowed per challenge"
                                    type="warning"
                                />

                                <DetailedRule
                                    icon={<Lock className="text-yellow-500" />}
                                    title="No Modifications Allowed"
                                    condition="Request to change habits/pause/extend"
                                    details={[
                                        "Habits cannot be edited",
                                        "Challenge cannot be paused",
                                        "Deadline cannot be extended",
                                        "Rules cannot be negotiated"
                                    ]}
                                    consequence="All modification requests = AUTO-DENIED"
                                    type="warning"
                                />
                            </div>
                        </motion.section>
                    </div>
                </div>

                {/* Bottom CTA */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.6 }}
                    className="mt-12 bg-gradient-to-r from-orange-500/10 to-red-500/10 rounded-2xl p-8 border border-orange-500/20 text-center"
                >
                    <h3 className="text-2xl font-bold mb-4">Do you accept these terms?</h3>
                    <p className="text-slate-400 mb-6">
                        By participating, you acknowledge that you understand and accept all rules without exception.
                    </p>
                    <div className="flex flex-col sm:flex-row gap-4 justify-center">
                        <button
                            onClick={() => navigate("/signup")}
                            className="bg-white text-slate-950 hover:bg-slate-200 px-8 py-4 rounded-xl text-lg font-bold transition-all transform hover:scale-105"
                        >
                            I Accept. Let's Begin 🚀
                        </button>
                        <button
                            onClick={() => navigate("/query")}
                            className="bg-slate-800 hover:bg-slate-700 text-white px-8 py-4 rounded-xl text-lg font-semibold transition-all"
                        >
                            I Have Questions
                        </button>
                    </div>
                </motion.div>
            </div>
        </div>
    );
};

// Detailed Rule Component
interface DetailedRuleProps {
    icon: React.ReactNode;
    title: string;
    condition: string;
    details: string[];
    consequence: string;
    type: "neutral" | "danger" | "success" | "warning";
}

const DetailedRule: React.FC<DetailedRuleProps> = ({
    icon,
    title,
    condition,
    details,
    consequence,
    type,
}) => {
    const [expanded, setExpanded] = useState(false);

    const colors = {
        neutral: "border-slate-700 bg-slate-900/50",
        danger: "border-red-900/50 bg-red-950/20",
        success: "border-green-900/50 bg-green-950/20",
        warning: "border-yellow-900/50 bg-yellow-950/20",
    };

    const textColors = {
        neutral: "text-slate-400",
        danger: "text-red-400",
        success: "text-green-400",
        warning: "text-yellow-400",
    };

    return (
        <div className={`border rounded-xl overflow-hidden transition-all ${colors[type]}`}>
            <button
                onClick={() => setExpanded(!expanded)}
                className="w-full p-4 text-left hover:bg-slate-800/20 transition-colors"
            >
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-slate-950/50 rounded-lg">
                        {icon}
                    </div>
                    <div className="flex-1">
                        <h4 className="font-semibold text-white">{title}</h4>
                        <p className="text-sm text-slate-400 mt-1">{condition}</p>
                    </div>
                    <motion.div
                        animate={{ rotate: expanded ? 180 : 0 }}
                        className="text-slate-400"
                    >
                        ▼
                    </motion.div>
                </div>
            </button>

            {expanded && (
                <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    className="px-4 pb-4"
                >
                    <div className="pl-14 space-y-3">
                        <div className="bg-slate-950/30 rounded-lg p-3">
                            <p className="text-xs font-mono text-slate-500 mb-2">DETAILS:</p>
                            <ul className="space-y-1">
                                {details.map((detail, i) => (
                                    <li key={i} className="text-sm text-slate-300 flex items-start gap-2">
                                        <span className="text-slate-500 mt-1">•</span>
                                        <span>{detail}</span>
                                    </li>
                                ))}
                            </ul>
                        </div>
                        <div className={`bg-slate-950/30 rounded-lg p-3 ${textColors[type]}`}>
                            <p className="text-xs font-mono mb-1">CONSEQUENCE:</p>
                            <p className="text-sm font-semibold">{consequence}</p>
                        </div>
                    </div>
                </motion.div>
            )}
        </div>
    );
};

export default RulesPage;