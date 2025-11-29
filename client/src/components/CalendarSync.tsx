// src/components/CalendarSync.tsx
import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
    Calendar,
    Check,
    Link2,
    Link2Off,
    Loader2,
    Bell,
    ExternalLink,
    RefreshCw,
} from "lucide-react";

interface CalendarSyncProps {
    onSyncComplete?: () => void;
}

const CalendarSync: React.FC<CalendarSyncProps> = ({ onSyncComplete }) => {
    const [isConnected, setIsConnected] = useState(false);
    const [loading, setLoading] = useState(true);
    const [syncing, setSyncing] = useState(false);
    const [upcomingEvents, setUpcomingEvents] = useState<any[]>([]);
    const [syncResults, setSyncResults] = useState<any[] | null>(null);

    useEffect(() => {
        checkCalendarStatus();
    }, []);

    const checkCalendarStatus = async () => {
        try {
            const response = await fetch("http://localhost:8000/calendar/status", {
                method: "GET",
                credentials: "include",
            });

            if (response.ok) {
                const data = await response.json();
                setIsConnected(data.connected);

                if (data.connected) {
                    fetchUpcomingEvents();
                }
            }
        } catch (error) {
            console.error("Error checking calendar status:", error);
        } finally {
            setLoading(false);
        }
    };

    const fetchUpcomingEvents = async () => {
        try {
            const response = await fetch("http://localhost:8000/calendar/upcoming", {
                method: "GET",
                credentials: "include",
            });

            if (response.ok) {
                const data = await response.json();
                setUpcomingEvents(data.events || []);
            }
        } catch (error) {
            console.error("Error fetching events:", error);
        }
    };

    const connectCalendar = async () => {
        try {
            setLoading(true);
            const response = await fetch("http://localhost:8000/calendar/auth-url", {
                method: "GET",
                credentials: "include",
            });

            if (response.ok) {
                const data = await response.json();
                // Open Google OAuth in a popup
                const popup = window.open(
                    data.auth_url,
                    "Google Calendar Authorization",
                    "width=600,height=700,left=100,top=100"
                );

                // Listen for the popup to close or redirect
                const checkPopup = setInterval(() => {
                    if (popup?.closed) {
                        clearInterval(checkPopup);
                        checkCalendarStatus();
                    }
                }, 1000);
            }
        } catch (error) {
            console.error("Error connecting calendar:", error);
        } finally {
            setLoading(false);
        }
    };

    const disconnectCalendar = async () => {
        try {
            setLoading(true);
            const response = await fetch("http://localhost:8000/calendar/disconnect", {
                method: "DELETE",
                credentials: "include",
            });

            if (response.ok) {
                setIsConnected(false);
                setUpcomingEvents([]);
                setSyncResults(null);
            }
        } catch (error) {
            console.error("Error disconnecting calendar:", error);
        } finally {
            setLoading(false);
        }
    };

    const syncHabits = async () => {
        try {
            setSyncing(true);
            const response = await fetch("http://localhost:8000/calendar/sync-habits", {
                method: "POST",
                credentials: "include",
            });

            if (response.ok) {
                const data = await response.json();
                setSyncResults(data.results);
                fetchUpcomingEvents();
                onSyncComplete?.();
            }
        } catch (error) {
            console.error("Error syncing habits:", error);
        } finally {
            setSyncing(false);
        }
    };

    if (loading) {
        return (
            <div className="bg-slate-800 rounded-2xl p-6 border border-slate-700">
                <div className="flex items-center justify-center gap-3">
                    <Loader2 className="w-6 h-6 animate-spin text-blue-500" />
                    <span className="text-slate-400">Checking calendar status...</span>
                </div>
            </div>
        );
    }

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-slate-800 rounded-2xl p-6 border border-slate-700"
        >
            <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                    <div className={`p-3 rounded-xl ${isConnected ? "bg-green-500/20" : "bg-blue-500/20"}`}>
                        <Calendar className={`w-6 h-6 ${isConnected ? "text-green-400" : "text-blue-400"}`} />
                    </div>
                    <div>
                        <h3 className="text-xl font-bold">Google Calendar</h3>
                        <p className="text-sm text-slate-400">
                            {isConnected ? "Connected & syncing reminders" : "Get daily habit reminders"}
                        </p>
                    </div>
                </div>

                {isConnected && (
                    <div className="flex items-center gap-2">
                        <span className="flex items-center gap-2 text-green-400 text-sm">
                            <Check className="w-4 h-4" />
                            Connected
                        </span>
                    </div>
                )}
            </div>

            {!isConnected ? (
                <div className="space-y-4">
                    <div className="bg-slate-900/50 rounded-xl p-4">
                        <h4 className="font-medium mb-3 flex items-center gap-2">
                            <Bell className="w-5 h-5 text-yellow-400" />
                            Why connect your calendar?
                        </h4>
                        <ul className="space-y-2 text-sm text-slate-400">
                            <li className="flex items-start gap-2">
                                <Check className="w-4 h-4 text-green-400 mt-0.5" />
                                <span>Get automatic reminders at your scheduled habit times</span>
                            </li>
                            <li className="flex items-start gap-2">
                                <Check className="w-4 h-4 text-green-400 mt-0.5" />
                                <span>Never miss a habit with popup notifications</span>
                            </li>
                            <li className="flex items-start gap-2">
                                <Check className="w-4 h-4 text-green-400 mt-0.5" />
                                <span>Daily recurring events for 100 days</span>
                            </li>
                        </ul>
                    </div>

                    <button
                        onClick={connectCalendar}
                        className="w-full flex items-center justify-center gap-3 bg-blue-500 hover:bg-blue-600 text-white px-6 py-3 rounded-xl font-semibold transition-all"
                    >
                        <Link2 className="w-5 h-5" />
                        Connect Google Calendar
                    </button>
                </div>
            ) : (
                <div className="space-y-4">
                    {/* Sync Habits Button */}
                    <button
                        onClick={syncHabits}
                        disabled={syncing}
                        className="w-full flex items-center justify-center gap-3 bg-green-500 hover:bg-green-600 disabled:bg-green-500/50 text-white px-6 py-3 rounded-xl font-semibold transition-all"
                    >
                        {syncing ? (
                            <>
                                <Loader2 className="w-5 h-5 animate-spin" />
                                Syncing habits to calendar...
                            </>
                        ) : (
                            <>
                                <RefreshCw className="w-5 h-5" />
                                Sync All Habits to Calendar
                            </>
                        )}
                    </button>

                    {/* Sync Results */}
                    <AnimatePresence>
                        {syncResults && (
                            <motion.div
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: "auto" }}
                                exit={{ opacity: 0, height: 0 }}
                                className="bg-slate-900/50 rounded-xl p-4"
                            >
                                <h4 className="font-medium mb-3">Sync Results:</h4>
                                <div className="space-y-2">
                                    {syncResults.map((result, index) => (
                                        <div
                                            key={index}
                                            className={`flex items-center justify-between p-2 rounded-lg ${result.success ? "bg-green-900/30" : "bg-red-900/30"
                                                }`}
                                        >
                                            <span className="text-sm">{result.habit}</span>
                                            {result.success ? (
                                                <Check className="w-4 h-4 text-green-400" />
                                            ) : (
                                                <span className="text-xs text-red-400">Failed</span>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>

                    {/* Upcoming Events */}
                    {upcomingEvents.length > 0 && (
                        <div className="bg-slate-900/50 rounded-xl p-4">
                            <h4 className="font-medium mb-3 flex items-center gap-2">
                                <Bell className="w-5 h-5 text-blue-400" />
                                Upcoming Reminders
                            </h4>
                            <div className="space-y-2 max-h-48 overflow-y-auto">
                                {upcomingEvents.slice(0, 5).map((event, index) => (
                                    <div
                                        key={index}
                                        className="flex items-center justify-between p-2 bg-slate-800 rounded-lg"
                                    >
                                        <div>
                                            <p className="text-sm font-medium">{event.summary}</p>
                                            <p className="text-xs text-slate-400">
                                                {new Date(event.start).toLocaleString()}
                                            </p>
                                        </div>
                                        <a
                                            href={event.link}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="text-blue-400 hover:text-blue-300"
                                        >
                                            <ExternalLink className="w-4 h-4" />
                                        </a>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Disconnect Button */}
                    <button
                        onClick={disconnectCalendar}
                        className="w-full flex items-center justify-center gap-3 bg-slate-700 hover:bg-slate-600 text-slate-300 px-6 py-3 rounded-xl font-medium transition-all"
                    >
                        <Link2Off className="w-5 h-5" />
                        Disconnect Calendar
                    </button>
                </div>
            )}
        </motion.div>
    );
};

export default CalendarSync;