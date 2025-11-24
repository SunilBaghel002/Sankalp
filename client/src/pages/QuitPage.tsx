// src/pages/QuitPage.tsx
import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { useStore } from "../store/useStore";
import {
  Skull,
  AlertTriangle,
  Heart,
  TrendingUp,
  Flame,
  DollarSign,
  ArrowLeft,
  Volume2,
  VolumeX,
  XCircle,
  Trophy,
  Target,
  Clock,
  Calendar,
  Zap,
  CheckCircle,
} from "lucide-react";

const QuitPage: React.FC = () => {
  const navigate = useNavigate();
  const { user, habits, currentStreak } = useStore();

  const [step, setStep] = useState<"warning" | "confirmation" | "final">("warning");
  const [confirmed, setConfirmed] = useState(false);
  const [typedText, setTypedText] = useState("");
  const [stats, setStats] = useState({
    total_completed_days: 0,
    current_streak: 0,
    total_habits: 0,
  });
  const [isMusicPlaying, setIsMusicPlaying] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Powerful motivational quotes
  const motivationalQuotes = [
    {
      text: "You've already come this far. Don't let today be the day you gave up.",
      author: "Your Future Self",
      color: "text-orange-400",
    },
    {
      text: "The pain of discipline is temporary. The pain of regret lasts forever.",
      author: "Jim Rohn",
      color: "text-blue-400",
    },
    {
      text: "It's not about perfect. It's about effort. And when you implement that effort, every single day, that's where transformation happens.",
      author: "Jillian Michaels",
      color: "text-green-400",
    },
    {
      text: "You didn't come this far to only come this far.",
      author: "Unknown",
      color: "text-purple-400",
    },
    {
      text: "Remember why you started. That person is still watching.",
      author: "You",
      color: "text-red-400",
    },
  ];

  const [currentQuote, setCurrentQuote] = useState(motivationalQuotes[0]);

  useEffect(() => {
    // Fetch user stats
    const fetchStats = async () => {
      try {
        const response = await fetch("http://localhost:8000/stats", {
          method: "GET",
          credentials: "include",
        });
        if (response.ok) {
          const data = await response.json();
          setStats(data);
        }
      } catch (error) {
        console.error("Error fetching stats:", error);
      }
    };

    fetchStats();

    // Rotate quotes every 5 seconds
    const quoteInterval = setInterval(() => {
      setCurrentQuote(
        motivationalQuotes[Math.floor(Math.random() * motivationalQuotes.length)]
      );
    }, 5000);

    return () => clearInterval(quoteInterval);
  }, []);


  useEffect(() => {
    // Create a simple sad tone using Web Audio API
    const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();

    const playSadTone = () => {
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();

      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);

      oscillator.frequency.value = 220; // A note - sad frequency
      oscillator.type = 'sine';

      gainNode.gain.setValueAtTime(0.1, audioContext.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 2);

      oscillator.start(audioContext.currentTime);
      oscillator.stop(audioContext.currentTime + 2);
    };

    if (isMusicPlaying) {
      const interval = setInterval(playSadTone, 3000);
      return () => clearInterval(interval);
    }
  }, [isMusicPlaying]);

  const toggleMusic = () => {
    if (audioRef.current) {
      if (isMusicPlaying) {
        audioRef.current.pause();
      } else {
        audioRef.current.play().catch((e) => console.log("Audio play failed:", e));
      }
      setIsMusicPlaying(!isMusicPlaying);
    }
  };

  const handleQuit = async () => {
    if (typedText.toUpperCase() !== "I QUIT") {
      alert('Please type "I QUIT" to confirm');
      return;
    }

    // Play sad music if not already playing
    if (!isMusicPlaying && audioRef.current) {
      audioRef.current.play().catch((e) => console.log("Audio play failed:", e));
      setIsMusicPlaying(true);
    }

    // Show final emotional message
    setStep("final");

    // After 3 seconds, redirect
    setTimeout(() => {
      navigate("/");
    }, 3000);
  };

  const daysInvested = stats.total_completed_days;
  const moneyLost = 500;
  const streakLost = stats.current_streak;
  const progressPercent = (daysInvested / 100) * 100;

  // Warning Step
  if (step === "warning") {
    return (
      <div className="min-h-screen bg-slate-950 text-white relative overflow-hidden">
        {/* Animated Background */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-red-900 via-slate-900 to-black animate-pulse"></div>
        </div>

        {/* Music Toggle */}
        <button
          onClick={toggleMusic}
          className="fixed top-4 right-4 z-50 p-3 bg-slate-800 hover:bg-slate-700 rounded-full border border-slate-600 transition-all"
        >
          {isMusicPlaying ? <Volume2 className="w-5 h-5" /> : <VolumeX className="w-5 h-5" />}
        </button>

        <div className="relative z-10 min-h-screen flex items-center justify-center p-4">
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="max-w-3xl w-full"
          >
            {/* Header */}
            <div className="text-center mb-8">
              <motion.div
                animate={{ scale: [1, 1.2, 1] }}
                transition={{ duration: 2, repeat: Infinity }}
                className="inline-block mb-6"
              >
                <Skull className="w-24 h-24 text-red-500 mx-auto" />
              </motion.div>

              <h1 className="text-5xl font-bold mb-4 text-red-400">
                Wait... Are You Sure?
              </h1>
              <p className="text-2xl text-slate-300 mb-2">
                You're about to throw away everything you've built
              </p>
            </div>

            {/* Motivational Quote */}
            <AnimatePresence mode="wait">
              <motion.div
                key={currentQuote.text}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="bg-gradient-to-br from-purple-900/50 to-blue-900/50 rounded-2xl p-8 mb-8 border border-purple-500/30"
              >
                <Zap className="w-10 h-10 text-yellow-400 mx-auto mb-4" />
                <blockquote className={`text-2xl font-bold mb-4 leading-relaxed ${currentQuote.color}`}>
                  "{currentQuote.text}"
                </blockquote>
                <p className="text-slate-300 text-lg">— {currentQuote.author}</p>
              </motion.div>
            </AnimatePresence>

            {/* What You'll Lose */}
            <div className="bg-slate-800 rounded-2xl p-8 mb-8 border-2 border-red-500/50">
              <h2 className="text-2xl font-bold mb-6 text-red-400 flex items-center gap-3">
                <XCircle className="w-8 h-8" />
                What You're Throwing Away:
              </h2>

              <div className="grid md:grid-cols-2 gap-6">
                <div className="bg-red-900/20 p-6 rounded-xl border border-red-500/30">
                  <DollarSign className="w-12 h-12 text-red-400 mb-3" />
                  <p className="text-4xl font-bold text-red-400 mb-2">₹{moneyLost}</p>
                  <p className="text-slate-300">Gone forever</p>
                </div>

                <div className="bg-orange-900/20 p-6 rounded-xl border border-orange-500/30">
                  <Flame className="w-12 h-12 text-orange-400 mb-3" />
                  <p className="text-4xl font-bold text-orange-400 mb-2">{streakLost}</p>
                  <p className="text-slate-300">Day streak lost</p>
                </div>

                <div className="bg-yellow-900/20 p-6 rounded-xl border border-yellow-500/30">
                  <Trophy className="w-12 h-12 text-yellow-400 mb-3" />
                  <p className="text-4xl font-bold text-yellow-400 mb-2">{daysInvested}</p>
                  <p className="text-slate-300">Perfect days wasted</p>
                </div>

                <div className="bg-purple-900/20 p-6 rounded-xl border border-purple-500/30">
                  <Target className="w-12 h-12 text-purple-400 mb-3" />
                  <p className="text-4xl font-bold text-purple-400 mb-2">{progressPercent.toFixed(0)}%</p>
                  <p className="text-slate-300">Progress erased</p>
                </div>
              </div>
            </div>

            {/* Progress Bar */}
            <div className="bg-slate-800 rounded-2xl p-6 mb-8 border border-slate-700">
              <div className="flex justify-between text-sm mb-2">
                <span className="text-slate-400">Your Journey</span>
                <span className="text-orange-400 font-bold">{daysInvested} / 100 days</span>
              </div>
              <div className="bg-slate-700 rounded-full h-4 overflow-hidden mb-3">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${progressPercent}%` }}
                  transition={{ duration: 1.5 }}
                  className="h-full bg-gradient-to-r from-orange-500 to-red-500"
                />
              </div>
              <p className="text-sm text-slate-400 text-center">
                You've already completed {daysInvested} days. Only {100 - daysInvested} more to freedom!
              </p>
            </div>

            {/* Buttons */}
            <div className="grid md:grid-cols-2 gap-4">
              <button
                onClick={() => navigate("/daily")}
                className="bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white py-6 rounded-2xl font-bold text-xl flex items-center justify-center gap-3 shadow-lg shadow-green-500/25 transition-all transform hover:scale-105"
              >
                <Heart className="w-6 h-6" />
                Keep Fighting!
              </button>

              <button
                onClick={() => setStep("confirmation")}
                className="bg-slate-700 hover:bg-slate-600 text-slate-300 py-6 rounded-2xl font-bold text-xl flex items-center justify-center gap-3 transition-all"
              >
                <Skull className="w-6 h-6" />
                I Still Want to Quit
              </button>
            </div>

            {/* Back Link */}
            <button
              onClick={() => navigate("/daily")}
              className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors mx-auto mt-6"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Take me back to safety</span>
            </button>
          </motion.div>
        </div>
      </div>
    );
  }

  // Confirmation Step
  if (step === "confirmation") {
    return (
      <div className="min-h-screen bg-slate-950 text-white relative overflow-hidden">
        {/* Dark Overlay */}
        <div className="absolute inset-0 bg-gradient-to-br from-red-950 via-black to-slate-950 opacity-90"></div>

        {/* Music Toggle */}
        <button
          onClick={toggleMusic}
          className="fixed top-4 right-4 z-50 p-3 bg-slate-800 hover:bg-slate-700 rounded-full border border-slate-600 transition-all"
        >
          {isMusicPlaying ? <Volume2 className="w-5 h-5" /> : <VolumeX className="w-5 h-5" />}
        </button>

        <div className="relative z-10 min-h-screen flex items-center justify-center p-4">
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="max-w-md w-full text-center"
          >
            <motion.div
              animate={{ rotate: [0, 10, -10, 0] }}
              transition={{ duration: 0.5, repeat: Infinity, repeatDelay: 1 }}
            >
              <AlertTriangle className="w-32 h-32 text-red-500 mx-auto mb-8" />
            </motion.div>

            <h1 className="text-4xl font-bold mb-6 text-red-400">
              Final Warning ⚠️
            </h1>

            <div className="bg-slate-800 p-8 rounded-2xl mb-6 border-2 border-red-500">
              <p className="text-xl mb-4 leading-relaxed">
                By quitting, your{" "}
                <span className="text-red-400 font-bold text-3xl">₹500</span>{" "}
                will be donated to charity.
              </p>
              <p className="text-slate-400 mb-4">No refunds. No second chances. No takebacks.</p>
              <p className="text-slate-300 font-bold">This is permanent.</p>
            </div>

            {/* List of Habits Being Abandoned */}
            {habits && habits.length > 0 && (
              <div className="bg-slate-800 p-6 rounded-xl mb-6 border border-slate-700">
                <h3 className="text-lg font-bold mb-4 text-slate-300">
                  Habits you're abandoning:
                </h3>
                <ul className="space-y-2">
                  {habits.map((habit: any, index: number) => (
                    <li key={index} className="flex items-center gap-2 text-slate-400">
                      <XCircle className="w-4 h-4 text-red-500" />
                      <span>{habit.name}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Type to Confirm */}
            <div className="bg-slate-800 p-6 rounded-xl mb-6 border border-red-500">
              <label className="block text-left mb-3">
                <span className="text-slate-300 font-semibold">
                  Type <span className="text-red-400 font-bold">"I QUIT"</span> to confirm:
                </span>
                <input
                  type="text"
                  value={typedText}
                  onChange={(e) => setTypedText(e.target.value)}
                  placeholder="Type here..."
                  className="w-full mt-2 bg-slate-700 px-4 py-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 text-white text-lg"
                />
              </label>
            </div>

            <div className="flex items-center gap-3 mb-6">
              <input
                type="checkbox"
                id="confirm"
                checked={confirmed}
                onChange={(e) => setConfirmed(e.target.checked)}
                className="w-5 h-5 accent-red-500"
              />
              <label htmlFor="confirm" className="text-sm text-left text-slate-300">
                I understand my ₹500 will be donated and my {daysInvested} days of progress will be lost forever
              </label>
            </div>

            <button
              onClick={handleQuit}
              disabled={!confirmed || typedText.toUpperCase() !== "I QUIT"}
              className="w-full bg-red-600 hover:bg-red-700 disabled:bg-slate-700 disabled:cursor-not-allowed disabled:opacity-50 text-white py-5 rounded-2xl font-bold text-xl mb-4 transition-all"
            >
              💔 Confirm Quit & Donate ₹500
            </button>

            <button
              onClick={() => setStep("warning")}
              className="w-full bg-slate-700 hover:bg-slate-600 text-white py-4 rounded-xl font-bold mb-4 transition-all"
            >
              <ArrowLeft className="w-5 h-5 inline mr-2" />
              Go Back
            </button>

            <button
              onClick={() => navigate("/daily")}
              className="w-full bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white py-5 rounded-2xl font-bold text-xl flex items-center justify-center gap-3 shadow-lg shadow-green-500/25 transition-all"
            >
              <Heart className="w-6 h-6" />
              No! Take Me Back to My Journey
            </button>
          </motion.div>
        </div>
      </div>
    );
  }

  // Final Step (After Quit)
  return (
    <div className="min-h-screen bg-black text-white flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="text-center max-w-2xl"
      >
        <motion.div
          animate={{ scale: [1, 1.1, 1] }}
          transition={{ duration: 2, repeat: Infinity }}
        >
          <Skull className="w-40 h-40 text-red-500 mx-auto mb-8" />
        </motion.div>

        <h1 className="text-6xl font-bold mb-6 text-red-500">
          You Quit.
        </h1>

        <p className="text-3xl mb-4 text-slate-300">₹500 donated to charity.</p>
        <p className="text-xl mb-8 text-slate-400">
          {daysInvested} days of progress lost forever.
        </p>

        <div className="bg-slate-900 p-8 rounded-2xl mb-8 border border-slate-700">
          <p className="text-lg text-slate-300 leading-relaxed">
            "The only person you are destined to become is the person you decide to be."
          </p>
          <p className="text-slate-500 mt-4">— Ralph Waldo Emerson</p>
        </div>

        <p className="text-slate-400 text-lg">Redirecting you...</p>

        <div className="mt-6">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-red-500 mx-auto"></div>
        </div>
      </motion.div>
    </div>
  );
};

export default QuitPage;