// src/components/VideoRecommendations.tsx
import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
    Play,
    ChevronRight,
    Loader2,
    Youtube,
    Search,
    Filter,
} from "lucide-react";
import VideoCard from "./VideoCard";

interface Video {
    id: string;
    title: string;
    description: string;
    thumbnail: string;
    channel: string;
    url: string;
}

interface Category {
    id: string;
    name: string;
    icon: string;
}

const VideoRecommendations: React.FC = () => {
    const [videos, setVideos] = useState<Video[]>([]);
    const [dailyVideo, setDailyVideo] = useState<Video | null>(null);
    const [categories, setCategories] = useState<Category[]>([]);
    const [selectedCategory, setSelectedCategory] = useState<string>("habits");
    const [searchQuery, setSearchQuery] = useState("");
    const [loading, setLoading] = useState(true);
    const [searching, setSearching] = useState(false);
    const [playingVideoId, setPlayingVideoId] = useState<string | null>(null);

    useEffect(() => {
        fetchInitialData();
    }, []);

    useEffect(() => {
        if (selectedCategory) {
            searchVideos(selectedCategory);
        }
    }, [selectedCategory]);

    const fetchInitialData = async () => {
        try {
            // Fetch categories
            const catResponse = await fetch("http://localhost:8000/videos/categories", {
                method: "GET",
                credentials: "include",
            });
            if (catResponse.ok) {
                const catData = await catResponse.json();
                setCategories(catData.categories);
            }

            // Fetch daily video
            const dailyResponse = await fetch("http://localhost:8000/videos/daily-recommendation", {
                method: "GET",
                credentials: "include",
            });
            if (dailyResponse.ok) {
                const dailyData = await dailyResponse.json();
                setDailyVideo(dailyData.video);
            }

            // Fetch initial videos
            await searchVideos("habits");
        } catch (error) {
            console.error("Error fetching video data:", error);
        } finally {
            setLoading(false);
        }
    };

    const searchVideos = async (query: string) => {
        try {
            setSearching(true);
            const response = await fetch(
                `http://localhost:8000/videos/search?query=${encodeURIComponent(query)}&category=${selectedCategory}&max_results=6`,
                {
                    method: "GET",
                    credentials: "include",
                }
            );

            if (response.ok) {
                const data = await response.json();
                setVideos(data.videos || []);
            }
        } catch (error) {
            console.error("Error searching videos:", error);
        } finally {
            setSearching(false);
        }
    };

    const handleSearch = () => {
        if (searchQuery.trim()) {
            searchVideos(searchQuery);
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center py-12">
                <Loader2 className="w-8 h-8 animate-spin text-orange-500" />
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Daily Recommendation */}
            {dailyVideo && (
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-gradient-to-r from-red-600 to-orange-600 rounded-2xl p-6 relative overflow-hidden"
                >
                    <div className="flex flex-col md:flex-row gap-6">
                        <div className="flex-1">
                            <div className="flex items-center gap-2 mb-3">
                                <Youtube className="w-5 h-5 text-white" />
                                <span className="text-white/80 text-sm font-medium">
                                    Today's Recommendation
                                </span>
                            </div>
                            <h3 className="text-2xl font-bold text-white mb-2">
                                {dailyVideo.title}
                            </h3>
                            <p className="text-white/80 text-sm mb-4 line-clamp-2">
                                {dailyVideo.description}
                            </p>
                            <a
                                href={dailyVideo.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-2 bg-white text-red-600 px-6 py-3 rounded-xl font-semibold hover:bg-white/90 transition-colors"
                            >
                                <Play className="w-5 h-5 fill-current" />
                                Watch Now
                            </a>
                        </div>
                        <div className="w-full md:w-72 shrink-0">
                            <img
                                src={dailyVideo.thumbnail}
                                alt={dailyVideo.title}
                                className="w-full h-40 object-cover rounded-xl"
                            />
                        </div>
                    </div>
                </motion.div>
            )}

            {/* Search and Categories */}
            <div className="space-y-4">
                {/* Search */}
                <div className="flex gap-3">
                    <div className="flex-1 relative">
                        <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-500" />
                        <input
                            type="text"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            onKeyPress={(e) => e.key === "Enter" && handleSearch()}
                            placeholder="Search for habit videos..."
                            className="w-full bg-slate-800 border border-slate-700 rounded-xl pl-12 pr-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-orange-500"
                        />
                    </div>
                    <button
                        onClick={handleSearch}
                        className="bg-orange-500 hover:bg-orange-600 px-6 py-3 rounded-xl font-medium transition-colors"
                    >
                        Search
                    </button>
                </div>

                {/* Categories */}
                <div className="flex gap-2 overflow-x-auto pb-2">
                    {categories.map((category) => (
                        <button
                            key={category.id}
                            onClick={() => setSelectedCategory(category.id)}
                            className={`flex items-center gap-2 px-4 py-2 rounded-xl font-medium whitespace-nowrap transition-all ${selectedCategory === category.id
                                    ? "bg-orange-500 text-white"
                                    : "bg-slate-800 text-slate-400 hover:bg-slate-700"
                                }`}
                        >
                            <span>{category.icon}</span>
                            <span>{category.name}</span>
                        </button>
                    ))}
                </div>
            </div>

            {/* Videos Grid */}
            <div className="relative">
                {searching && (
                    <div className="absolute inset-0 bg-slate-950/50 flex items-center justify-center z-10 rounded-2xl">
                        <Loader2 className="w-8 h-8 animate-spin text-orange-500" />
                    </div>
                )}

                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {videos.map((video, index) => (
                        <motion.div
                            key={video.id}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: index * 0.1 }}
                        >
                            <VideoCard video={video} />
                        </motion.div>
                    ))}
                </div>

                {videos.length === 0 && !searching && (
                    <div className="text-center py-12">
                        <Youtube className="w-12 h-12 text-slate-600 mx-auto mb-4" />
                        <p className="text-slate-400">No videos found. Try a different search.</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default VideoRecommendations;