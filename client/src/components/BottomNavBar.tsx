// src/components/BottomNavBar.tsx
import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate, useLocation } from "react-router-dom";
import {
    Home,
    BarChart3,
    Sparkles,
    Settings,
    TrendingUp,
    Flame,
    LogOut,
    XCircle,
    ChevronUp,
    ChevronDown,
    Trophy,
    Moon,
} from "lucide-react";

interface NavItem {
    id: string;
    label: string;
    icon: React.ElementType;
    path: string;
    color: string;
    activeColor: string;
}

const BottomNavBar: React.FC = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const [isExpanded, setIsExpanded] = useState(false);

    // Main navigation items (always visible)
    const mainNavItems: NavItem[] = [
        {
            id: "home",
            label: "Home",
            icon: Home,
            path: "/daily",
            color: "text-slate-400",
            activeColor: "text-orange-400",
        },
        {
            id: "analysis",
            label: "Analysis",
            icon: BarChart3,
            path: "/analysis",
            color: "text-slate-400",
            activeColor: "text-purple-400",
        },
        {
            id: "improve",
            label: "Improve",
            icon: Sparkles,
            path: "/improve",
            color: "text-slate-400",
            activeColor: "text-yellow-400",
        },
        {
            id: "settings",
            label: "Settings",
            icon: Settings,
            path: "/settings",
            color: "text-slate-400",
            activeColor: "text-blue-400",
        },
    ];

    // Secondary navigation items (shown when expanded)
    const secondaryNavItems: NavItem[] = [
        {
            id: "insights",
            label: "Insights",
            icon: TrendingUp,
            path: "/insights",
            color: "text-slate-400",
            activeColor: "text-green-400",
        },
        {
            id: "streak",
            label: "Streak",
            icon: Flame,
            path: "/streak",
            color: "text-slate-400",
            activeColor: "text-orange-400",
        },
        {
            id: "sleep",
            label: "Sleep",
            icon: Moon,
            path: "/sleep",
            color: "text-slate-400",
            activeColor: "text-indigo-400",
        },
        {
            id: "badges",
            label: "Badges",
            icon: Trophy,
            path: "/badges",
            color: "text-slate-400",
            activeColor: "text-yellow-400",
        },
    ];

    // Action items
    const actionItems = [
        {
            id: "quit",
            label: "Quit Challenge",
            icon: XCircle,
            action: () => navigate("/quit"),
            color: "text-red-400",
        },
        {
            id: "logout",
            label: "Logout",
            icon: LogOut,
            action: () => {
                document.cookie = "access_token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
                navigate("/");
            },
            color: "text-red-400",
        },
    ];

    const isActive = (path: string) => location.pathname === path;

    const handleNavClick = (path: string) => {
        navigate(path);
        setIsExpanded(false);
    };

    return (
        <>
            {/* Backdrop when expanded */}
            <AnimatePresence>
                {isExpanded && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40"
                        onClick={() => setIsExpanded(false)}
                    />
                )}
            </AnimatePresence>

            {/* Bottom Navigation */}
            <motion.div
                className="fixed bottom-0 left-0 right-0 z-50"
                animate={{ height: isExpanded ? "auto" : "auto" }}
            >
                {/* Expanded Section */}
                <AnimatePresence>
                    {isExpanded && (
                        <motion.div
                            initial={{ y: "100%", opacity: 0 }}
                            animate={{ y: 0, opacity: 1 }}
                            exit={{ y: "100%", opacity: 0 }}
                            transition={{ type: "spring", damping: 25, stiffness: 300 }}
                            className="bg-slate-900 border-t border-slate-700 px-4 pt-4 pb-2"
                        >
                            {/* Secondary Navigation */}
                            <div className="grid grid-cols-4 gap-2 mb-4">
                                {secondaryNavItems.map((item) => {
                                    const Icon = item.icon;
                                    const active = isActive(item.path);
                                    return (
                                        <motion.button
                                            key={item.id}
                                            whileHover={{ scale: 1.05 }}
                                            whileTap={{ scale: 0.95 }}
                                            onClick={() => handleNavClick(item.path)}
                                            className={`flex flex-col items-center gap-1 p-3 rounded-xl transition-all ${
                                                active
                                                    ? "bg-slate-800 " + item.activeColor
                                                    : "hover:bg-slate-800 " + item.color
                                            }`}
                                        >
                                            <Icon className="w-5 h-5" />
                                            <span className="text-xs hidden min-[400px]:block">
                                                {item.label}
                                            </span>
                                        </motion.button>
                                    );
                                })}
                            </div>

                            {/* Action Items */}
                            <div className="flex justify-center gap-4 pt-2 border-t border-slate-700">
                                {actionItems.map((item) => {
                                    const Icon = item.icon;
                                    return (
                                        <motion.button
                                            key={item.id}
                                            whileHover={{ scale: 1.05 }}
                                            whileTap={{ scale: 0.95 }}
                                            onClick={item.action}
                                            className={`flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-800 hover:bg-red-900/30 transition-all ${item.color}`}
                                        >
                                            <Icon className="w-4 h-4" />
                                            <span className="text-sm hidden min-[400px]:block">
                                                {item.label}
                                            </span>
                                        </motion.button>
                                    );
                                })}
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Main Navigation Bar */}
                <div className="bg-slate-900/95 backdrop-blur-md border-t border-slate-800">
                    {/* Expand/Collapse Button */}
                    <div className="flex justify-center -mt-3">
                        <motion.button
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.9 }}
                            onClick={() => setIsExpanded(!isExpanded)}
                            className="bg-slate-800 hover:bg-slate-700 border border-slate-600 rounded-full p-1.5 shadow-lg transition-colors"
                        >
                            <motion.div
                                animate={{ rotate: isExpanded ? 180 : 0 }}
                                transition={{ duration: 0.3 }}
                            >
                                <ChevronUp className="w-5 h-5 text-slate-300" />
                            </motion.div>
                        </motion.button>
                    </div>

                    {/* Main Nav Items */}
                    <div className="flex items-center justify-around px-2 py-3">
                        {mainNavItems.map((item) => {
                            const Icon = item.icon;
                            const active = isActive(item.path);
                            return (
                                <motion.button
                                    key={item.id}
                                    whileHover={{ scale: 1.1 }}
                                    whileTap={{ scale: 0.9 }}
                                    onClick={() => handleNavClick(item.path)}
                                    className={`flex flex-col items-center gap-1 px-4 py-2 rounded-xl transition-all ${
                                        active
                                            ? item.activeColor + " bg-slate-800/50"
                                            : item.color + " hover:text-white"
                                    }`}
                                >
                                    <Icon className={`w-6 h-6 ${active ? "scale-110" : ""}`} />
                                    <span
                                        className={`text-xs hidden min-[400px]:block ${
                                            active ? "font-semibold" : ""
                                        }`}
                                    >
                                        {item.label}
                                    </span>
                                    {active && (
                                        <motion.div
                                            layoutId="activeIndicator"
                                            className="absolute -bottom-1 w-1 h-1 rounded-full bg-current"
                                        />
                                    )}
                                </motion.button>
                            );
                        })}
                    </div>
                </div>
            </motion.div>
        </>
    );
};

export default BottomNavBar;