import React from "react";
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
} from "lucide-react";

const RulesPage: React.FC = () => {
    const navigate = useNavigate();

    const container = {
        hidden: { opacity: 0 },
        show: {
            opacity: 1,
            transition: {
                staggerChildren: 0.1,
            },
        },
    };

    const item = {
        hidden: { opacity: 0, y: 20 },
        show: { opacity: 1, y: 0 },
    };

    return (
        <div className="min-h-screen bg-slate-950 text-slate-200 p-4 pb-24 font-sans selection:bg-orange-500/30">
            <div className="max-w-3xl mx-auto">
                {/* Header */}
                <nav className="flex items-center gap-4 mb-12">
                    <button
                        onClick={() => navigate("/")}
                        className="p-2 hover:bg-slate-800 rounded-full transition-colors"
                    >
                        <ArrowLeft className="w-6 h-6" />
                    </button>
                    <h1 className="text-2xl font-bold flex items-center gap-2">
                        <Terminal className="text-orange-500" /> System Protocols
                    </h1>
                </nav>

                <div className="text-center mb-16">
                    <h2 className="text-4xl md:text-5xl font-extrabold text-white mb-6">
                        The Ironclad Rules
                    </h2>
                    <p className="text-slate-400 text-lg max-w-xl mx-auto">
                        Sankalp operates on strict logic. There is no human intervention.
                        There is no mercy. <span className="text-orange-500">Read this twice.</span>
                    </p>
                </div>

                <motion.div
                    variants={container}
                    initial="hidden"
                    animate="show"
                    className="space-y-12"
                >
                    {/* SECTION 1: THE SETUP */}
                    <section>
                        <h3 className="text-xl font-bold text-white mb-6 flex items-center gap-2 border-b border-slate-800 pb-2">
                            <div className="bg-blue-500/10 p-2 rounded-lg">
                                <Coins className="w-5 h-5 text-blue-500" />
                            </div>
                            01. Initialization
                        </h3>
                        <div className="space-y-4">
                            <LogicCard
                                icon={<Coins className="text-slate-400" />}
                                condition="You pay ₹500 deposit"
                                result="Money enters the 'Burn Fund' immediately. It is NOT in escrow. It is effectively gone until you earn it back."
                                type="neutral"
                            />
                            <LogicCard
                                icon={<CheckCircle2 className="text-slate-400" />}
                                condition="You select habits"
                                result="Exactly 5 habits. No more, no less. Once the clock starts, these are locked forever. No edits."
                                type="neutral"
                            />
                            <LogicCard
                                icon={<Clock className="text-slate-400" />}
                                condition="Payment Successful"
                                result="Challenge starts automatically at 00:00 IST the NEXT day."
                                type="neutral"
                            />
                        </div>
                    </section>

                    {/* SECTION 2: THE DAILY LOOP */}
                    <section>
                        <h3 className="text-xl font-bold text-white mb-6 flex items-center gap-2 border-b border-slate-800 pb-2">
                            <div className="bg-orange-500/10 p-2 rounded-lg">
                                <Flame className="w-5 h-5 text-orange-500" />
                            </div>
                            02. The Daily Loop (Critical)
                        </h3>
                        <div className="space-y-4">
                            <LogicCard
                                icon={<Clock className="text-red-500" />}
                                condition="Time reaches 11:59 PM IST AND Check-in = False"
                                result="FATAL ERROR. Challenge Failed. ₹500 Forfeited permanently."
                                type="danger"
                            />
                            <LogicCard
                                icon={<AlertTriangle className="text-red-500" />}
                                condition="Argument: 'I forgot' OR 'No Internet' OR 'App Glitch'"
                                result="Argument Rejected. It is your responsibility to find internet. No excuses accepted."
                                type="danger"
                            />
                            <LogicCard
                                icon={<Ban className="text-red-500" />}
                                condition="User attempts to pause/skip/freeze"
                                result="Access Denied. The 100-day clock never stops."
                                type="danger"
                            />
                        </div>
                    </section>

                    {/* SECTION 3: ANTI-CHEAT */}
                    <section>
                        <h3 className="text-xl font-bold text-white mb-6 flex items-center gap-2 border-b border-slate-800 pb-2">
                            <div className="bg-red-500/10 p-2 rounded-lg">
                                <ShieldAlert className="w-5 h-5 text-red-500" />
                            </div>
                            03. Integrity Systems
                        </h3>
                        <div className="space-y-4">
                            <LogicCard
                                icon={<ShieldAlert className="text-red-400" />}
                                condition="Device fingerprint mismatch OR Fake Check-in detected"
                                result="Immediate Ban. ₹500 Burned. Public shaming on Wall of Shame."
                                type="danger"
                            />
                            <LogicCard
                                icon={<AlertTriangle className="text-yellow-500" />}
                                condition="Emergency Skip Used (1 Max)"
                                result="Requires medical proof within 48hrs. If rejected -> Streak Broken."
                                type="warning"
                            />
                        </div>
                    </section>

                    {/* SECTION 4: THE ENDGAME */}
                    <section>
                        <h3 className="text-xl font-bold text-white mb-6 flex items-center gap-2 border-b border-slate-800 pb-2">
                            <div className="bg-green-500/10 p-2 rounded-lg">
                                <CheckCircle2 className="w-5 h-5 text-green-500" />
                            </div>
                            04. The Endgame
                        </h3>
                        <div className="space-y-4">
                            <LogicCard
                                icon={<CheckCircle2 className="text-green-400" />}
                                condition="Day 100 Reached AND Missed Days == 0"
                                result="VICTORY. ₹500 Refunded automatically (3-7 days). Exclusive Rewards unlocked."
                                type="success"
                            />
                            <LogicCard
                                icon={<Flame className="text-orange-400" />}
                                condition="User Quits Early"
                                result="Your ₹500 funds the rewards for the winners. Quitters pay the Winners."
                                type="warning"
                            />
                        </div>
                    </section>
                </motion.div>

                {/* CTA */}
                <div className="mt-16 text-center">
                    <p className="text-slate-500 text-sm mb-6">
                        By clicking below, you acknowledge that you understand the risks.
                    </p>
                    <button
                        onClick={() => navigate("/signup")}
                        className="bg-white text-slate-950 hover:bg-slate-200 px-10 py-4 rounded-xl text-xl font-bold transition-all transform hover:scale-105 w-full md:w-auto"
                    >
                        I Accept the Risk. Let's Begin.
                    </button>
                </div>
            </div>
        </div>
    );
};

// ----------------------------------------------------------------------
// Helper Component: Logic Card
// ----------------------------------------------------------------------

interface LogicCardProps {
    condition: string;
    result: string;
    type: "neutral" | "danger" | "success" | "warning";
    icon: React.ReactNode;
}

const LogicCard: React.FC<LogicCardProps> = ({
    condition,
    result,
    type,
    icon,
}) => {
    const colors = {
        neutral: "border-slate-700 bg-slate-900",
        danger: "border-red-900/50 bg-red-950/20",
        success: "border-green-900/50 bg-green-950/20",
        warning: "border-orange-900/50 bg-orange-950/20",
    };

    const textColors = {
        neutral: "text-slate-400",
        danger: "text-red-400",
        success: "text-green-400",
        warning: "text-orange-400",
    };

    return (
        <motion.div
            variants={{
                hidden: { opacity: 0, x: -20 },
                show: { opacity: 1, x: 0 },
            }}
            className={`border rounded-xl p-5 relative overflow-hidden ${colors[type]}`}
        >
            <div className="flex flex-col md:flex-row md:items-center gap-4 relative z-10">
                <div className="flex items-center gap-3 md:w-1/3">
                    <div className="p-2 bg-slate-950/50 rounded-lg">{icon}</div>
                    <div>
                        <span className="text-xs font-mono text-slate-500 uppercase tracking-wider">
                            IF (Condition)
                        </span>
                        <p className="font-semibold text-slate-200 leading-tight">
                            {condition}
                        </p>
                    </div>
                </div>

                <div className="hidden md:block text-slate-600">
                    <code className="text-lg">➜</code>
                </div>

                <div className="md:w-2/3 pl-4 md:pl-0 border-l-2 md:border-l-0 border-slate-800 md:border-none">
                    <span className={`text-xs font-mono uppercase tracking-wider ${textColors[type]}`}>
                        THEN (Result)
                    </span>
                    <p className={`text-sm leading-relaxed ${textColors[type]}`}>
                        {result}
                    </p>
                </div>
            </div>
        </motion.div>
    );
};

export default RulesPage;