// src/pages/SignupPage.tsx
import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import {
  Flame,
  Mail,
  Lock,
  User,
  ArrowRight,
  ArrowLeft,
  Shield,
  Zap,
  Target,
} from "lucide-react";

const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID;

type AuthMode = "initial" | "email-signup" | "email-login" | "otp-verify";

const SignupPage: React.FC = () => {
  const navigate = useNavigate();
  const [authMode, setAuthMode] = useState<AuthMode>("initial");
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    otp: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [otpSent, setOtpSent] = useState(false);

  // Motivational quotes that rotate
  const quotes = [
    {
      text: "You don't rise to the level of your goals. You fall to the level of your systems.",
      author: "James Clear",
      icon: <Target className="w-12 h-12 text-orange-500" />,
    },
    {
      text: "The secret of getting ahead is getting started.",
      author: "Mark Twain",
      icon: <Zap className="w-12 h-12 text-orange-500" />,
    },
    {
      text: "Discipline is choosing between what you want now and what you want most.",
      author: "Abraham Lincoln",
      icon: <Shield className="w-12 h-12 text-orange-500" />,
    },
  ];

  const [currentQuote] = useState(
    quotes[Math.floor(Math.random() * quotes.length)]
  );

  const handleGoogleLogin = () => {
    const redirectUri = encodeURIComponent(
      "http://localhost:5173/auth/callback"
    );
    const scope = encodeURIComponent("email profile openid");
    const state = Math.random().toString(36).substring(7);

    const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${GOOGLE_CLIENT_ID}&redirect_uri=${redirectUri}&response_type=code&scope=${scope}&state=${state}&access_type=offline&prompt=consent`;

    window.location.href = authUrl;
  };

  const handleEmailSignup = async () => {
    setLoading(true);
    setError("");

    try {
      const response = await fetch("http://localhost:8000/auth/email/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          name: formData.name,
          email: formData.email,
          password: formData.password,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || "Signup failed");
      }

      const data = await response.json();
      console.log("Signup response:", data);

      setOtpSent(true);
      setAuthMode("otp-verify");
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleEmailLogin = async () => {
    setLoading(true);
    setError("");

    try {
      const response = await fetch("http://localhost:8000/auth/email/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          email: formData.email,
          password: formData.password,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || "Login failed");
      }

      const data = await response.json();
      console.log("Login successful:", data);

      // Store user and navigate
      navigate("/pay-deposit");
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleOTPVerify = async () => {
    setLoading(true);
    setError("");

    try {
      const response = await fetch("http://localhost:8000/auth/email/verify-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          email: formData.email,
          otp: formData.otp,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || "OTP verification failed");
      }

      const data = await response.json();
      console.log("OTP verified:", data);

      navigate("/pay-deposit");
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleResendOTP = async () => {
    setLoading(true);
    setError("");

    try {
      const response = await fetch("http://localhost:8000/auth/email/resend-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: formData.email }),
      });

      if (!response.ok) {
        throw new Error("Failed to resend OTP");
      }

      alert("OTP resent successfully!");
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-white flex">
      {/* Left Side - Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8">
        <div className="max-w-md w-full">
          <AnimatePresence mode="wait">
            {/* Initial Screen */}
            {authMode === "initial" && (
              <motion.div
                key="initial"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
              >
                <div className="text-center mb-10">
                  <button onClick={() => navigate("/")} className="mb-6">
                    <Flame className="w-16 h-16 text-orange-500 mx-auto" />
                  </button>
                  <h1 className="text-4xl font-bold mb-3">Welcome to Sankalp</h1>
                  <p className="text-slate-400 text-lg">
                    Your commitment. Your rules. Your ₹500.
                  </p>
                </div>

                <div className="space-y-4">
                  <button
                    onClick={handleGoogleLogin}
                    className="w-full bg-white text-slate-900 py-4 rounded-xl font-semibold text-lg flex items-center justify-center gap-3 hover:bg-gray-100 transition-all shadow-lg"
                  >
                    <svg className="w-6 h-6" viewBox="0 0 24 24">
                      <path
                        fill="#4285F4"
                        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                      />
                      <path
                        fill="#34A853"
                        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                      />
                      <path
                        fill="#FBBC05"
                        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                      />
                      <path
                        fill="#EA4335"
                        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                      />
                    </svg>
                    Continue with Google
                  </button>

                  <div className="relative">
                    <div className="absolute inset-0 flex items-center">
                      <div className="w-full border-t border-slate-700"></div>
                    </div>
                    <div className="relative flex justify-center text-sm">
                      <span className="px-4 bg-slate-950 text-slate-500">OR</span>
                    </div>
                  </div>

                  <button
                    onClick={() => setAuthMode("email-signup")}
                    className="w-full bg-orange-500 hover:bg-orange-600 text-white py-4 rounded-xl font-semibold text-lg flex items-center justify-center gap-3 transition-all"
                  >
                    <Mail className="w-5 h-5" />
                    Continue with Email
                  </button>

                  <button
                    onClick={() => setAuthMode("email-login")}
                    className="w-full text-slate-400 hover:text-white text-sm transition-colors"
                  >
                    Already have an account? <span className="text-orange-500">Log In</span>
                  </button>
                </div>

                <p className="text-xs text-slate-500 text-center mt-8">
                  By signing up, you agree to lose ₹500 if you quit 😈
                </p>
              </motion.div>
            )}

            {/* Email Signup Form */}
            {authMode === "email-signup" && (
              <motion.div
                key="email-signup"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
              >
                <button
                  onClick={() => setAuthMode("initial")}
                  className="mb-6 flex items-center gap-2 text-slate-400 hover:text-white transition-colors"
                >
                  <ArrowLeft className="w-4 h-4" />
                  Back
                </button>

                <h2 className="text-3xl font-bold mb-2">Create Account</h2>
                <p className="text-slate-400 mb-8">
                  Join the 100-day challenge with email
                </p>

                {error && (
                  <div className="bg-red-500/10 border border-red-500 rounded-lg p-3 mb-6">
                    <p className="text-red-400 text-sm">{error}</p>
                  </div>
                )}

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">Full Name</label>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                      <input
                        type="text"
                        value={formData.name}
                        onChange={(e) =>
                          setFormData({ ...formData, name: e.target.value })
                        }
                        placeholder="Sunil Baghel"
                        className="w-full bg-slate-900 border border-slate-700 rounded-lg pl-10 pr-4 py-3 focus:outline-none focus:ring-2 focus:ring-orange-500"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2">Email</label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                      <input
                        type="email"
                        value={formData.email}
                        onChange={(e) =>
                          setFormData({ ...formData, email: e.target.value })
                        }
                        placeholder="you@example.com"
                        className="w-full bg-slate-900 border border-slate-700 rounded-lg pl-10 pr-4 py-3 focus:outline-none focus:ring-2 focus:ring-orange-500"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2">Password</label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                      <input
                        type="password"
                        value={formData.password}
                        onChange={(e) =>
                          setFormData({ ...formData, password: e.target.value })
                        }
                        placeholder="Minimum 8 characters"
                        className="w-full bg-slate-900 border border-slate-700 rounded-lg pl-10 pr-4 py-3 focus:outline-none focus:ring-2 focus:ring-orange-500"
                      />
                    </div>
                  </div>

                  <button
                    onClick={handleEmailSignup}
                    disabled={loading}
                    className="w-full bg-orange-500 hover:bg-orange-600 disabled:bg-orange-700 text-white py-4 rounded-xl font-semibold text-lg flex items-center justify-center gap-3 transition-all"
                  >
                    {loading ? (
                      "Creating Account..."
                    ) : (
                      <>
                        Create Account <ArrowRight className="w-5 h-5" />
                      </>
                    )}
                  </button>
                </div>
              </motion.div>
            )}

            {/* Email Login Form */}
            {authMode === "email-login" && (
              <motion.div
                key="email-login"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
              >
                <button
                  onClick={() => setAuthMode("initial")}
                  className="mb-6 flex items-center gap-2 text-slate-400 hover:text-white transition-colors"
                >
                  <ArrowLeft className="w-4 h-4" />
                  Back
                </button>

                <h2 className="text-3xl font-bold mb-2">Welcome Back</h2>
                <p className="text-slate-400 mb-8">Log in to continue your journey</p>

                {error && (
                  <div className="bg-red-500/10 border border-red-500 rounded-lg p-3 mb-6">
                    <p className="text-red-400 text-sm">{error}</p>
                  </div>
                )}

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">Email</label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                      <input
                        type="email"
                        value={formData.email}
                        onChange={(e) =>
                          setFormData({ ...formData, email: e.target.value })
                        }
                        placeholder="you@example.com"
                        className="w-full bg-slate-900 border border-slate-700 rounded-lg pl-10 pr-4 py-3 focus:outline-none focus:ring-2 focus:ring-orange-500"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2">Password</label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                      <input
                        type="password"
                        value={formData.password}
                        onChange={(e) =>
                          setFormData({ ...formData, password: e.target.value })
                        }
                        placeholder="Enter your password"
                        className="w-full bg-slate-900 border border-slate-700 rounded-lg pl-10 pr-4 py-3 focus:outline-none focus:ring-2 focus:ring-orange-500"
                      />
                    </div>
                  </div>

                  <button
                    onClick={handleEmailLogin}
                    disabled={loading}
                    className="w-full bg-orange-500 hover:bg-orange-600 disabled:bg-orange-700 text-white py-4 rounded-xl font-semibold text-lg flex items-center justify-center gap-3 transition-all"
                  >
                    {loading ? (
                      "Logging In..."
                    ) : (
                      <>
                        Log In <ArrowRight className="w-5 h-5" />
                      </>
                    )}
                  </button>

                  <button
                    onClick={() => setAuthMode("email-signup")}
                    className="w-full text-slate-400 hover:text-white text-sm transition-colors"
                  >
                    Don't have an account? <span className="text-orange-500">Sign Up</span>
                  </button>
                </div>
              </motion.div>
            )}

            {/* OTP Verification */}
            {authMode === "otp-verify" && (
              <motion.div
                key="otp-verify"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
              >
                <div className="text-center mb-8">
                  <div className="bg-orange-500/10 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6">
                    <Mail className="w-10 h-10 text-orange-500" />
                  </div>
                  <h2 className="text-3xl font-bold mb-2">Check Your Email</h2>
                  <p className="text-slate-400">
                    We sent a 6-digit code to <br />
                    <span className="text-white font-semibold">{formData.email}</span>
                  </p>
                </div>

                {error && (
                  <div className="bg-red-500/10 border border-red-500 rounded-lg p-3 mb-6">
                    <p className="text-red-400 text-sm">{error}</p>
                  </div>
                )}

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">Enter OTP</label>
                    <input
                      type="text"
                      maxLength={6}
                      value={formData.otp}
                      onChange={(e) =>
                        setFormData({ ...formData, otp: e.target.value.replace(/\D/g, "") })
                      }
                      placeholder="000000"
                      className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-4 text-center text-2xl tracking-widest focus:outline-none focus:ring-2 focus:ring-orange-500"
                    />
                  </div>

                  <button
                    onClick={handleOTPVerify}
                    disabled={loading || formData.otp.length !== 6}
                    className="w-full bg-orange-500 hover:bg-orange-600 disabled:bg-orange-700 text-white py-4 rounded-xl font-semibold text-lg transition-all"
                  >
                    {loading ? "Verifying..." : "Verify & Continue"}
                  </button>

                  <button
                    onClick={handleResendOTP}
                    className="w-full text-slate-400 hover:text-white text-sm transition-colors"
                  >
                    Didn't receive code? <span className="text-orange-500">Resend</span>
                  </button>

                  <button
                    onClick={() => {
                      setAuthMode("email-signup");
                      setFormData({ ...formData, otp: "" });
                    }}
                    className="w-full text-slate-500 text-sm"
                  >
                    Change email address
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Right Side - Motivational Quote (Hidden on mobile) */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-orange-600 to-red-700 p-12 items-center justify-center relative overflow-hidden">
        <div className="absolute inset-0 bg-black/20"></div>
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="relative z-10 text-center"
        >
          <div className="mb-8">{currentQuote.icon}</div>
          <blockquote className="text-4xl font-bold mb-6 leading-tight">
            "{currentQuote.text}"
          </blockquote>
          <p className="text-xl text-orange-100">— {currentQuote.author}</p>

          <div className="mt-16 space-y-4">
            <div className="flex items-center justify-center gap-4 text-orange-100">
              <div className="text-center">
                <p className="text-3xl font-bold">₹500</p>
                <p className="text-sm">At Stake</p>
              </div>
              <div className="w-px h-12 bg-orange-300"></div>
              <div className="text-center">
                <p className="text-3xl font-bold">100</p>
                <p className="text-sm">Days</p>
              </div>
              <div className="w-px h-12 bg-orange-300"></div>
              <div className="text-center">
                <p className="text-3xl font-bold">5</p>
                <p className="text-sm">Habits</p>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default SignupPage;