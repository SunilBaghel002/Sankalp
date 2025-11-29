// src/components/DailyAffirmation.tsx
import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Sun, RefreshCw, Heart } from "lucide-react";

interface AffirmationData {
    affirmation: string;
    day: number;
}

const DailyAffirmation: React.FC = () => {
    const [data, setData] = useState<AffirmationData | null>(null);
    const [loading, setLoading] = useState(true);

    const fetchAffirmation = async () => {
        try {
            setLoading(true);
            const response = await fetch("http://localhost:8000/ai/daily-affirmation", {
                method: "GET",
                credentials: "include",
            });

            if (response.ok) {
                const affirmationData = await response.json();
                setData(affirmationData);
            }
        } catch (error) {
            console.error("Error fetching affirmation:", error);
            setData({
                affirmation: "I am building the life I want, one habit at a time! 💪",
                day: 1,
            });
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchAffirmation();
    }, []);

    if (loading) {
        return (
            <div className="bg-gradient-to-br from-orange-500/20 to-yellow-500/20 rounded-2xl p-6 border border-orange-500/30 animate-pulse">
                <div className="h-20 bg-slate-700/50 rounded-lg"></div>
            </div>
        );
    }

    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-gradient-to-br from-orange-500/20 to-yellow-500/20 rounded-2xl p-6 border border-orange-500/30"
        >
            <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                    <div className="bg-orange-500/30 p-3 rounded-xl">
                        <Sun className="w-6 h-6 text-orange-400" />
                    </div>
                    <div>
                        <h4 className="font-semibold text-orange-300">Today's Affirmation</h4>
                        <p className="text-xs text-orange-400/70">Day {data?.day}</p>
                    </div>
                </div>
                <button
                    onClick={fetchAffirmation}
                    className="p-2 hover:bg-orange-500/20 rounded-lg transition-colors"
                >
                    <RefreshCw className={`w-5 h-5 text-orange-400 ${loading ? "animate-spin" : ""}`} />
                </button>
            </div>

            <motion.p
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-lg font-medium text-white leading-relaxed"
            >
                "{data?.affirmation}"
            </motion.p>

            <div className="mt-4 flex items-center gap-2 text-orange-400/70 text-sm">
                <Heart className="w-4 h-4" />
                <span>Say this to yourself with conviction!</span>
            </div>
        </motion.div>
    );
};

export default DailyAffirmation;