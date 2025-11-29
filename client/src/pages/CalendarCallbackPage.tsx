// src/pages/CalendarCallbackPage.tsx
import React, { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { motion } from "framer-motion";
import { Calendar, Check, X, Loader2 } from "lucide-react";

const CalendarCallbackPage: React.FC = () => {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const [status, setStatus] = useState<"loading" | "success" | "error">("loading");
    const [message, setMessage] = useState("");

    useEffect(() => {
        const handleCallback = async () => {
            const code = searchParams.get("code");
            const error = searchParams.get("error");

            if (error) {
                setStatus("error");
                setMessage("Authorization was denied or cancelled.");
                return;
            }

            if (!code) {
                setStatus("error");
                setMessage("No authorization code received.");
                return;
            }

            try {
                const response = await fetch("http://localhost:8000/calendar/callback", {
                    method: "POST",
                    credentials: "include",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ code }),
                });

                if (response.ok) {
                    setStatus("success");
                    setMessage("Calendar connected successfully!");

                    // Close popup if opened as popup
                    if (window.opener) {
                        window.opener.postMessage({ type: "CALENDAR_CONNECTED" }, "*");
                        setTimeout(() => window.close(), 2000);
                    } else {
                        // Redirect to improve page after 2 seconds
                        setTimeout(() => navigate("/improve"), 2000);
                    }
                } else {
                    const data = await response.json();
                    setStatus("error");
                    setMessage(data.detail || "Failed to connect calendar.");
                }
            } catch (error) {
                setStatus("error");
                setMessage("An error occurred while connecting your calendar.");
            }
        };

        handleCallback();
    }, [searchParams, navigate]);

    return (
        <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
            <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="bg-slate-800 rounded-2xl p-8 max-w-md w-full text-center border border-slate-700"
            >
                {status === "loading" && (
                    <>
                        <div className="bg-blue-500/20 p-6 rounded-full w-24 h-24 mx-auto mb-6 flex items-center justify-center">
                            <Loader2 className="w-12 h-12 text-blue-400 animate-spin" />
                        </div>
                        <h2 className="text-2xl font-bold text-white mb-2">Connecting Calendar...</h2>
                        <p className="text-slate-400">Please wait while we set up your reminders.</p>
                    </>
                )}

                {status === "success" && (
                    <>
                        <motion.div
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            transition={{ type: "spring", damping: 10 }}
                            className="bg-green-500/20 p-6 rounded-full w-24 h-24 mx-auto mb-6 flex items-center justify-center"
                        >
                            <Check className="w-12 h-12 text-green-400" />
                        </motion.div>
                        <h2 className="text-2xl font-bold text-white mb-2">Connected!</h2>
                        <p className="text-slate-400 mb-4">{message}</p>
                        <p className="text-sm text-slate-500">
                            {window.opener ? "This window will close automatically..." : "Redirecting..."}
                        </p>
                    </>
                )}

                {status === "error" && (
                    <>
                        <motion.div
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            className="bg-red-500/20 p-6 rounded-full w-24 h-24 mx-auto mb-6 flex items-center justify-center"
                        >
                            <X className="w-12 h-12 text-red-400" />
                        </motion.div>
                        <h2 className="text-2xl font-bold text-white mb-2">Connection Failed</h2>
                        <p className="text-slate-400 mb-6">{message}</p>
                        <button
                            onClick={() => navigate("/improve")}
                            className="bg-orange-500 hover:bg-orange-600 text-white px-6 py-3 rounded-xl font-semibold transition-colors"
                        >
                            Go Back
                        </button>
                    </>
                )}
            </motion.div>
        </div>
    );
};

export default CalendarCallbackPage;