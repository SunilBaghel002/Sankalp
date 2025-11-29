// src/components/LevelProgress.tsx
import React from "react";
import { motion } from "framer-motion";
import { Star, Zap, TrendingUp } from "lucide-react";

interface LevelInfo {
    level: number;
    name: string;
    min_xp: number;
    max_xp: number;
    current_xp: number;
    progress: number;
    xp_to_next: number;
}

interface LevelProgressProps {
    levelInfo: LevelInfo;
    totalXp: number;
}

const LevelProgress: React.FC<LevelProgressProps> = ({ levelInfo, totalXp }) => {
    const levelColors: { [key: number]: string } = {
        1: "from-gray-500 to-gray-600",
        2: "from-green-500 to-emerald-600",
        3: "from-blue-500 to-cyan-600",
        4: "from-purple-500 to-violet-600",
        5: "from-orange-500 to-red-600",
        6: "from-yellow-500 to-amber-600",
        7: "from-pink-500 to-rose-600",
        8: "from-indigo-500 to-blue-600",
        9: "from-teal-500 to-emerald-600",
        10: "from-yellow-400 to-orange-500",
    };

    const gradientClass = levelColors[levelInfo.level] || levelColors[1];

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className={`bg-gradient-to-r ${gradientClass} rounded-2xl p-6 relative overflow-hidden`}
        >
            {/* Background decoration */}
            <div className="absolute top-0 right-0 opacity-10">
                <Star className="w-32 h-32 -mt-8 -mr-8" />
            </div>

            <div className="relative z-10">
                <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                        <div className="bg-white/20 p-3 rounded-xl">
                            <Zap className="w-8 h-8 text-white" />
                        </div>
                        <div>
                            <div className="text-sm text-white/80">Level {levelInfo.level}</div>
                            <h3 className="text-2xl font-bold text-white">{levelInfo.name}</h3>
                        </div>
                    </div>
                    <div className="text-right">
                        <div className="text-3xl font-bold text-white">{totalXp}</div>
                        <div className="text-sm text-white/80">Total XP</div>
                    </div>
                </div>

                {/* Progress bar */}
                <div className="bg-white/20 rounded-full h-4 overflow-hidden mb-2">
                    <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${levelInfo.progress}%` }}
                        transition={{ duration: 1, ease: "easeOut" }}
                        className="h-full bg-white rounded-full"
                    />
                </div>

                <div className="flex justify-between text-sm text-white/80">
                    <span>{levelInfo.min_xp} XP</span>
                    <span className="flex items-center gap-1">
                        <TrendingUp className="w-4 h-4" />
                        {levelInfo.xp_to_next} XP to next level
                    </span>
                    <span>{levelInfo.max_xp === Infinity ? "∞" : levelInfo.max_xp} XP</span>
                </div>
            </div>
        </motion.div>
    );
};

export default LevelProgress;