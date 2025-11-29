// src/components/MotivationalQuote.tsx
import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Sparkles, RefreshCw, Quote } from "lucide-react";

interface QuoteData {
    quote: string;
    author: string;
    personalized_message: string;
}

const MotivationalQuote: React.FC = () => {
    const [quoteData, setQuoteData] = useState<QuoteData | null>(null);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    const fetchQuote = async () => {
        try {
            setRefreshing(true);
            const response = await fetch("http://localhost:8000/ai/motivational-quote", {
                method: "GET",
                credentials: "include",
            });

            if (response.ok) {
                const data = await response.json();
                setQuoteData(data);
            }
        } catch (error) {
            console.error("Error fetching quote:", error);
            setQuoteData({
                quote: "Every day is a new opportunity to build the life you want.",
                author: "Sankalp AI Coach",
                personalized_message: "Keep pushing forward! 💪",
            });
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    useEffect(() => {
        fetchQuote();
    }, []);

    if (loading) {
        return (
            <div className="bg-gradient-to-br from-purple-900/50 to-blue-900/50 rounded-2xl p-6 border border-purple-500/30 animate-pulse">
                <div className="h-20 bg-slate-700/50 rounded-lg"></div>
            </div>
        );
    }

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-gradient-to-br from-purple-900/50 to-blue-900/50 rounded-2xl p-6 border border-purple-500/30 relative overflow-hidden"
        >
            <div className="absolute top-4 right-4">
                <button
                    onClick={fetchQuote}
                    disabled={refreshing}
                    className="p-2 hover:bg-white/10 rounded-lg transition-colors"
                >
                    <RefreshCw
                        className={`w-5 h-5 text-purple-400 ${refreshing ? "animate-spin" : ""}`}
                    />
                </button>
            </div>

            <div className="flex items-start gap-4">
                <div className="bg-purple-500/20 p-3 rounded-xl shrink-0">
                    <Sparkles className="w-6 h-6 text-purple-400" />
                </div>
                <div className="flex-1">
                    <Quote className="w-8 h-8 text-purple-400/30 mb-2" />
                    <blockquote className="text-lg font-medium text-white mb-3 leading-relaxed">
                        {quoteData?.quote}
                    </blockquote>
                    <p className="text-sm text-purple-300">— {quoteData?.author}</p>
                    {quoteData?.personalized_message && (
                        <motion.p
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: 0.3 }}
                            className="mt-4 text-orange-300 font-medium"
                        >
                            {quoteData.personalized_message}
                        </motion.p>
                    )}
                </div>
            </div>
        </motion.div>
    );
};

export default MotivationalQuote;