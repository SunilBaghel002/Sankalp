// src/components/VideoCard.tsx
import React, { useState } from "react";
import { motion } from "framer-motion";
import { Play, ExternalLink, Clock, Eye } from "lucide-react";

interface Video {
    id: string;
    title: string;
    description: string;
    thumbnail: string;
    channel: string;
    url: string;
    published_at?: string;
}

interface VideoCardProps {
    video: Video;
    onPlay?: (videoId: string) => void;
    size?: "small" | "medium" | "large";
}

const VideoCard: React.FC<VideoCardProps> = ({ video, onPlay, size = "medium" }) => {
    const [isHovered, setIsHovered] = useState(false);

    const sizeClasses = {
        small: "h-32",
        medium: "h-40",
        large: "h-52",
    };

    const handleClick = () => {
        if (onPlay) {
            onPlay(video.id);
        } else {
            window.open(video.url, "_blank");
        }
    };

    return (
        <motion.div
            whileHover={{ scale: 1.02 }}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
            className="bg-slate-800 rounded-xl overflow-hidden border border-slate-700 cursor-pointer group"
            onClick={handleClick}
        >
            {/* Thumbnail */}
            <div className={`relative ${sizeClasses[size]} overflow-hidden`}>
                <img
                    src={video.thumbnail}
                    alt={video.title}
                    className="w-full h-full object-cover transition-transform group-hover:scale-110"
                />
                <div
                    className={`absolute inset-0 bg-black/50 flex items-center justify-center transition-opacity ${isHovered ? "opacity-100" : "opacity-0"
                        }`}
                >
                    <div className="bg-red-600 p-4 rounded-full">
                        <Play className="w-8 h-8 text-white fill-white" />
                    </div>
                </div>
            </div>

            {/* Content */}
            <div className="p-4">
                <h4 className="font-semibold text-white line-clamp-2 mb-2 group-hover:text-orange-400 transition-colors">
                    {video.title}
                </h4>
                <p className="text-sm text-slate-400 line-clamp-2 mb-3">
                    {video.description}
                </p>
                <div className="flex items-center justify-between">
                    <span className="text-xs text-slate-500">{video.channel}</span>
                    <ExternalLink className="w-4 h-4 text-slate-500" />
                </div>
            </div>
        </motion.div>
    );
};

export default VideoCard;