// src/pages/CalendarCallbackPage.tsx
import React, { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { motion } from "framer-motion";
import { Check, Loader2, AlertTriangle } from "lucide-react";

const CalendarCallbackPage: React.FC = () => {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const [status, setStatus] = useState<"loading" | "success" | "error">("loading");
    const [message, setMessage] = useState("");
    const [details, setDetails] = useState("");

    useEffect(() => {
        const handleCallback = async () => {
            const code = searchParams.get("code");
            const error = searchParams.get("error");
            const errorDescription = searchParams.get("error_description");

            // Check for OAuth errors
            if (error) {
                setStatus("error");
                if (error === "access_denied") {
                    setMessage("Access Denied");
                    setDetails("You need to be added as a test user. Please contact the developer or publish the app.");
                } else {
                    setMessage("Authorization Failed");
                    setDetails(errorDescription || error);
                }
                return;
            }

            if (!code) {
                setStatus("error");
                setMessage("No Authorization Code");
                setDetails("Please try connecting your calendar again.");
                return;
            }

            try {
                console.log("Exchanging code for tokens...");

                const response = await fetch("http://localhost:8000/calendar/callback", {
                    method: "POST",
                    credentials: "include",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ code }),
                });

                const data = await response.json();

                if (response.ok && data.success) {
                    setStatus("success");
                    setMessage("Calendar Connected!");
                    setDetails("Your habit reminders will now appear in your Google Calendar.");

                    // Mark that calendar was just connected
                    localStorage.setItem("calendar_just_connected", "true");

                    // Get return URL or default to daily
                    const returnUrl = localStorage.getItem("calendar_return_url") || "/daily";
                    localStorage.removeItem("calendar_return_url");

                    // Redirect after showing success
                    setTimeout(() => navigate(returnUrl), 2000);
                } else {
                    setStatus("error");
                    setMessage("Failed to Connect Calendar");
                    setDetails(data.detail || data.message || "An error occurred during authorization.");
                }
            } catch (error: any) {
                console.error("Callback error:", error);
                setStatus("error");
                setMessage("Connection Failed");
                setDetails(error.message || "An error occurred while connecting your calendar.");
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
                        <h2 className="text-2xl font-bold text-white mb-2">{message}</h2>
                        <p className="text-slate-400 mb-4">{details}</p>
                        <div className="flex items-center justify-center gap-2 text-sm text-slate-500">
                            <Loader2 className="w-4 h-4 animate-spin" />
                            <span>Redirecting...</span>
                        </div>
                    </>
                )}

                {status === "error" && (
                    <>
                        <motion.div
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            className="bg-red-500/20 p-6 rounded-full w-24 h-24 mx-auto mb-6 flex items-center justify-center"
                        >
                            <AlertTriangle className="w-12 h-12 text-red-400" />
                        </motion.div>
                        <h2 className="text-2xl font-bold text-white mb-2">{message}</h2>
                        <p className="text-slate-400 mb-6">{details}</p>
                        
                        {/* Help text for common errors */}
                        {message.includes("Access") && (
                            <div className="bg-yellow-900/30 border border-yellow-500/50 rounded-xl p-4 mb-6 text-left">
                                <p className="text-yellow-300 text-sm font-medium mb-2">🔒 App in Testing Mode</p>
                                <p className="text-yellow-200/70 text-xs">
                                    The app hasn't completed Google verification. Ask the developer to add your email as a test user in Google Cloud Console.
                                </p>
                            </div>
                        )}
                        
                        <div className="space-y-3">
                            <button
                                onClick={() => navigate("/daily")}
                                className="w-full bg-orange-500 hover:bg-orange-600 text-white px-6 py-3 rounded-xl font-semibold transition-colors"
                            >
                                Go to Dashboard
                            </button>
                            <button
                                onClick={() => {
                                    localStorage.setItem("calendar_return_url", "/settings");
                                    window.location.href = "/settings";
                                }}
                                className="w-full bg-slate-700 hover:bg-slate-600 text-white px-6 py-3 rounded-xl font-semibold transition-colors"
                            >
                                Try Again
                            </button>
                        </div>
                    </>
                )}
            </motion.div>
        </div>
    );
};

export default CalendarCallbackPage;