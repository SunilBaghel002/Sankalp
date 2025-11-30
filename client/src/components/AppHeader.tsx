// src/components/AppHeader.tsx
import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { useStore } from "../store/useStore";
import {
    Flame,
    User,
    ChevronDown,
    Home,
    BarChart3,
    TrendingUp,
    Sparkles,
    Settings,
    LogOut,
    Trophy,
    Moon,
    XCircle,
} from "lucide-react";

interface AppHeaderProps {
    pageTitle: string;
    pageIcon?: React.ElementType;
    showBackButton?: boolean;
    onBackClick?: () => void;
}

const AppHeader: React.FC<AppHeaderProps> = ({
    pageTitle,
    pageIcon: PageIcon,
    showBackButton = false,
    onBackClick,
}) => {
    const navigate = useNavigate();
    const { user } = useStore();
    const [showMenu, setShowMenu] = useState(false);

    const menuItems = [
        { label: "Home", icon: Home, path: "/daily", color: "text-orange-400" },
        { label: "Insights", icon: TrendingUp, path: "/insights", color: "text-blue-400" },
        { label: "Analysis", icon: BarChart3, path: "/analysis", color: "text-purple-400" },
        { label: "Improve", icon: Sparkles, path: "/improve", color: "text-yellow-400" },
        { label: "Streak", icon: Flame, path: "/streak", color: "text-orange-400" },
        { label: "Sleep", icon: Moon, path: "/sleep", color: "text-indigo-400" },
        { label: "Badges", icon: Trophy, path: "/badges", color: "text-yellow-400" },
        { label: "Settings", icon: Settings, path: "/settings", color: "text-slate-400" },
    ];

    const handleLogout = () => {
        document.cookie = "access_token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
        navigate("/");
    };

    const handleNavigation = (path: string) => {
        navigate(path);
        setShowMenu(false);
    };

    return (
        <header className="sticky top-0 bg-slate-950/90 backdrop-blur-md border-b border-slate-800 z-40">
            <div className="max-w-7xl mx-auto px-4 py-3">
                <div className="flex items-center justify-between">
                    {/* Left - Logo & App Name */}
                    <motion.div
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        className="flex items-center gap-2 cursor-pointer"
                        onClick={() => navigate("/daily")}
                    >
                        <div className="bg-gradient-to-br from-orange-500 to-red-600 p-2 rounded-xl">
                            <Flame className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                        </div>
                        <span className="text-lg sm:text-xl font-bold bg-gradient-to-r from-orange-400 to-red-500 bg-clip-text text-transparent hidden min-[350px]:block">
                            Sankalp
                        </span>
                    </motion.div>

                    {/* Center - Page Title */}
                    <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="flex items-center gap-2"
                    >
                        {PageIcon && (
                            <PageIcon className="w-5 h-5 sm:w-6 sm:h-6 text-orange-500" />
                        )}
                        <h1 className="text-base sm:text-lg md:text-xl font-bold text-white truncate max-w-[120px] sm:max-w-none">
                            {pageTitle}
                        </h1>
                    </motion.div>

                    {/* Right - User Menu (Hidden on mobile) */}
                    <div className="relative hidden sm:block">
                        <motion.button
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            onClick={() => setShowMenu(!showMenu)}
                            className="flex items-center gap-2 bg-slate-800 hover:bg-slate-700 px-3 py-2 rounded-xl border border-slate-700 transition-all"
                        >
                            <div className="bg-gradient-to-br from-orange-500 to-red-600 p-1.5 rounded-lg">
                                <User className="w-4 h-4 text-white" />
                            </div>
                            <span className="text-sm font-medium hidden md:block max-w-[100px] truncate">
                                {user?.name?.split(" ")[0] || "User"}
                            </span>
                            <motion.div
                                animate={{ rotate: showMenu ? 180 : 0 }}
                                transition={{ duration: 0.2 }}
                            >
                                <ChevronDown className="w-4 h-4 text-slate-400" />
                            </motion.div>
                        </motion.button>

                        {/* Dropdown Menu */}
                        <AnimatePresence>
                            {showMenu && (
                                <>
                                    {/* Backdrop */}
                                    <div
                                        className="fixed inset-0 z-40"
                                        onClick={() => setShowMenu(false)}
                                    />

                                    <motion.div
                                        initial={{ opacity: 0, y: -10, scale: 0.95 }}
                                        animate={{ opacity: 1, y: 0, scale: 1 }}
                                        exit={{ opacity: 0, y: -10, scale: 0.95 }}
                                        transition={{ duration: 0.15 }}
                                        className="absolute right-0 mt-2 w-56 bg-slate-800 rounded-xl border border-slate-700 shadow-2xl overflow-hidden z-50"
                                    >
                                        {/* User Info */}
                                        <div className="p-4 border-b border-slate-700 bg-slate-900/50">
                                            <p className="font-semibold text-white truncate">
                                                {user?.name || "User"}
                                            </p>
                                            <p className="text-xs text-slate-400 truncate">
                                                {user?.email || "user@example.com"}
                                            </p>
                                        </div>

                                        {/* Navigation Items */}
                                        <div className="py-2 max-h-[300px] overflow-y-auto">
                                            {menuItems.map((item) => (
                                                <button
                                                    key={item.path}
                                                    onClick={() => handleNavigation(item.path)}
                                                    className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-slate-700/50 transition-all"
                                                >
                                                    <item.icon className={`w-5 h-5 ${item.color}`} />
                                                    <span className="text-sm text-slate-200">
                                                        {item.label}
                                                    </span>
                                                </button>
                                            ))}
                                        </div>

                                        {/* Logout & Quit */}
                                        <div className="border-t border-slate-700 py-2">
                                            <button
                                                onClick={() => handleNavigation("/quit")}
                                                className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-red-900/20 transition-all text-orange-400"
                                            >
                                                <XCircle className="w-5 h-5" />
                                                <span className="text-sm">Quit Challenge</span>
                                            </button>
                                            <button
                                                onClick={handleLogout}
                                                className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-red-900/20 transition-all text-red-400"
                                            >
                                                <LogOut className="w-5 h-5" />
                                                <span className="text-sm">Logout</span>
                                            </button>
                                        </div>
                                    </motion.div>
                                </>
                            )}
                        </AnimatePresence>
                    </div>

                    {/* Mobile - Just show a small user icon */}
                    <div className="sm:hidden">
                        <div className="bg-gradient-to-br from-orange-500 to-red-600 p-2 rounded-lg">
                            <User className="w-4 h-4 text-white" />
                        </div>
                    </div>
                </div>
            </div>
        </header>
    );
};

export default AppHeader;