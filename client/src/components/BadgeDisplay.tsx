// src/components/BadgeDisplay.tsx
import React from "react";
import { motion } from "framer-motion";
import { Lock } from "lucide-react";

interface Badge {
    id: string;
    name: string;
    description: string;
    icon: string;
    xp: number;
    earned: boolean;
}

interface BadgeDisplayProps {
    badges: Badge[];
    showLocked?: boolean;
}

const BadgeDisplay: React.FC<BadgeDisplayProps> = ({ badges, showLocked = true }) => {
    const earnedBadges = badges.filter((b) => b.earned);
    const lockedBadges = badges.filter((b) => !b.earned);

    return (
        <div className="space-y-6">
            {/* Earned Badges */}
            {earnedBadges.length > 0 && (
                <div>
                    <h4 className="text-lg font-semibold mb-4 flex items-center gap-2">
                        <span>🏆</span> Earned Badges ({earnedBadges.length})
                    </h4>
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                        {earnedBadges.map((badge, index) => (
                            <motion.div
                                key={badge.id}
                                initial={{ scale: 0, rotate: -180 }}
                                animate={{ scale: 1, rotate: 0 }}
                                transition={{ delay: index * 0.1, type: "spring" }}
                                className="bg-gradient-to-br from-yellow-600/30 to-orange-600/30 border border-yellow-500/50 rounded-xl p-4 text-center hover:scale-105 transition-transform"
                            >
                                <div className="text-4xl mb-2">{badge.icon}</div>
                                <h5 className="font-semibold text-sm mb-1">{badge.name}</h5>
                                <p className="text-xs text-slate-400">{badge.description}</p>
                                <div className="mt-2 text-xs text-yellow-400 font-medium">
                                    +{badge.xp} XP
                                </div>
                            </motion.div>
                        ))}
                    </div>
                </div>
            )}

            {/* Locked Badges */}
            {showLocked && lockedBadges.length > 0 && (
                <div>
                    <h4 className="text-lg font-semibold mb-4 flex items-center gap-2 text-slate-400">
                        <Lock className="w-5 h-5" /> Locked Badges ({lockedBadges.length})
                    </h4>
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                        {lockedBadges.map((badge) => (
                            <div
                                key={badge.id}
                                className="bg-slate-800/50 border border-slate-700 rounded-xl p-4 text-center opacity-60"
                            >
                                <div className="text-4xl mb-2 grayscale">{badge.icon}</div>
                                <h5 className="font-semibold text-sm mb-1 text-slate-400">
                                    {badge.name}
                                </h5>
                                <p className="text-xs text-slate-500">{badge.description}</p>
                                <div className="mt-2 flex items-center justify-center gap-1 text-xs text-slate-500">
                                    <Lock className="w-3 h-3" />
                                    <span>+{badge.xp} XP</span>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
};

export default BadgeDisplay;