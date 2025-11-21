// src/pages/LandingPage.tsx
import React, { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import {
  Flame,
  Target,
  Trophy,
  Shield,
  Zap,
  ArrowRight,
  Brain,
  Wallet,
  CheckCircle2,
} from "lucide-react";
import { checkAuth } from "../lib/auth";

const LandingPage: React.FC = () => {
  const [isChecking, setIsChecking] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    let mounted = true;

    const tryCheck = async () => {
      try {
        const loggedIn = await checkAuth();
        if (loggedIn && mounted) {
          navigate("/pay-deposit", { replace: true });
        } else if (mounted) {
          setIsChecking(false);
        }
      } catch (error) {
        console.error("Auth check error:", error);
        if (mounted) setIsChecking(false);
      }
    };

    tryCheck();
    return () => {
      mounted = false;
    };
  }, [navigate]);

  if (isChecking) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-orange-500"></div>
      </div>
    );
  }

  const fadeInUp = {
    hidden: { opacity: 0, y: 30 },
    visible: { opacity: 1, y: 0 },
  };

  const container = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.2,
      },
    },
  };

  return (
    <div className="min-h-screen bg-slate-950 text-white overflow-hidden font-sans">
      {/* Navbar */}
      <nav className="flex justify-between items-center p-6 max-w-7xl mx-auto">
        <div className="flex items-center gap-2 font-bold text-2xl tracking-tighter">
          <Flame className="text-orange-500 fill-orange-500" />
          <span>Sankalp</span>
        </div>
        <button onClick={() => navigate("/rules")} className="text-slate-400 underline hover:text-orange-500">
          Read the full Rules of Engagement
        </button>
        <button
          onClick={() => navigate("/signup")}
          className="text-sm font-semibold hover:text-orange-500 transition-colors"
        >
          Log In
        </button>
      </nav>

      {/* Hero Section */}
      <motion.section
        initial="hidden"
        animate="visible"
        variants={container}
        className="max-w-5xl mx-auto px-4 pt-12 pb-24 text-center"
      >
        <motion.div variants={fadeInUp} className="inline-block mb-6">
          <span className="bg-orange-500/10 text-orange-500 px-4 py-2 rounded-full text-sm font-bold border border-orange-500/20">
            🔥 The 100-Day Hard Challenge
          </span>
        </motion.div>

        <motion.h1
          variants={fadeInUp}
          className="text-5xl md:text-7xl font-extrabold mb-6 leading-tight"
        >
          Stop Lying to Yourself. <br />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-400 to-red-600">
            Put Your Money Where Your Mouth Is.
          </span>
        </motion.h1>

        <motion.p
          variants={fadeInUp}
          className="text-xl md:text-2xl text-slate-400 mb-10 max-w-3xl mx-auto leading-relaxed"
        >
          Most habit apps forgive you. <span className="text-white font-semibold">Sankalp doesn't.</span>
          <br />
          Deposit ₹500. Complete your habits for 100 days. Get it back.
          <br />
          <span className="text-red-400">Miss a day? Lose it all.</span>
        </motion.p>

        <motion.button
          variants={fadeInUp}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => navigate("/signup")}
          className="bg-gradient-to-r from-orange-500 to-red-600 text-white px-10 py-5 rounded-full text-xl font-bold shadow-lg shadow-orange-500/25 flex items-center gap-3 mx-auto"
        >
          Start My Challenge <ArrowRight className="w-6 h-6" />
        </motion.button>

        <motion.p variants={fadeInUp} className="mt-6 text-sm text-slate-500">
          🔒 100% Refundable upon success • Secured by Razorpay
        </motion.p>
      </motion.section>

      {/* The Problem Section */}
      <section className="bg-slate-900 py-20 px-4 border-y border-slate-800">
        <div className="max-w-6xl mx-auto">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-3xl md:text-4xl font-bold mb-6">
                Why "Free" Apps Don't Work
              </h2>
              <p className="text-slate-400 text-lg mb-6">
                When there is no cost to quitting, you will quit. It's human
                nature. You prioritize comfort over discipline because there are
                no consequences.
              </p>
              <ul className="space-y-4">
                <li className="flex items-center gap-3 text-slate-300">
                  <XCircleIcon className="text-red-500" /> No accountability
                </li>
                <li className="flex items-center gap-3 text-slate-300">
                  <XCircleIcon className="text-red-500" /> Zero consequences for missing days
                </li>
                <li className="flex items-center gap-3 text-slate-300">
                  <XCircleIcon className="text-red-500" /> Reliance on fleeting "motivation"
                </li>
              </ul>
            </div>
            <div className="bg-slate-800 p-8 rounded-2xl border border-slate-700 shadow-2xl">
              <h3 className="text-2xl font-bold mb-4 flex items-center gap-3">
                <Brain className="text-orange-500" /> The Sankalp Method
              </h3>
              <p className="text-slate-300 mb-6">
                We use <strong>Loss Aversion Psychology</strong>. The pain of losing ₹500 is psychologically
                2x more powerful than the joy of gaining it. We turn your fear of loss into fuel.
              </p>
              <div className="flex items-center gap-4 p-4 bg-orange-500/10 rounded-lg border border-orange-500/20">
                <Wallet className="text-orange-500 w-8 h-8" />
                <div>
                  <p className="font-bold text-orange-400">Skin in the Game</p>
                  <p className="text-xs text-orange-200">Financial commitment forces discipline.</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-20 px-4 max-w-6xl mx-auto">
        <h2 className="text-4xl font-bold text-center mb-16">The Protocol</h2>
        <div className="grid md:grid-cols-4 gap-8">
          {[
            {
              icon: <Shield className="w-10 h-10 text-blue-500" />,
              title: "1. Commit",
              desc: "Sign up and deposit ₹500. This is your contract with yourself.",
            },
            {
              icon: <Target className="w-10 h-10 text-orange-500" />,
              title: "2. Define",
              desc: "Choose 5 habits you must complete every single day.",
            },
            {
              icon: <Zap className="w-10 h-10 text-yellow-500" />,
              title: "3. Execute",
              desc: "Check in daily before midnight. No cheat days allowed.",
            },
            {
              icon: <Trophy className="w-10 h-10 text-green-500" />,
              title: "4. Conquer",
              desc: "Hit 100 days? You get your ₹500 back + Exclusive Rewards.",
            },
          ].map((item, i) => (
            <motion.div
              key={i}
              whileHover={{ y: -10 }}
              className="bg-slate-900 p-6 rounded-2xl border border-slate-800 text-center"
            >
              <div className="bg-slate-800 w-20 h-20 mx-auto rounded-full flex items-center justify-center mb-6">
                {item.icon}
              </div>
              <h3 className="text-xl font-bold mb-3">{item.title}</h3>
              <p className="text-slate-400 text-sm">{item.desc}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* The Iron Rules */}
      <section className="py-20 px-4 bg-gradient-to-br from-slate-900 to-slate-950 border-t border-slate-800">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-12">
            The Unbreakable Rules
          </h2>
          <div className="bg-slate-800/50 backdrop-blur-lg p-8 rounded-3xl border border-slate-700">
            <ul className="space-y-6">
              <li className="flex items-start gap-4">
                <div className="mt-1 bg-orange-500 rounded-full p-1">
                  <CheckCircle2 className="w-4 h-4 text-white" />
                </div>
                <div>
                  <h4 className="text-lg font-bold">Daily Check-in Required</h4>
                  <p className="text-slate-400">You must mark habits as complete before 11:59 PM local time.</p>
                </div>
              </li>
              <li className="flex items-start gap-4">
                <div className="mt-1 bg-orange-500 rounded-full p-1">
                  <CheckCircle2 className="w-4 h-4 text-white" />
                </div>
                <div>
                  <h4 className="text-lg font-bold">Zero Tolerance Policy</h4>
                  <p className="text-slate-400">If you miss 3 days in a row, your challenge is void and money forfeited.</p>
                </div>
              </li>
              <li className="flex items-start gap-4">
                <div className="mt-1 bg-orange-500 rounded-full p-1">
                  <CheckCircle2 className="w-4 h-4 text-white" />
                </div>
                <div>
                  <h4 className="text-lg font-bold">Honesty System</h4>
                  <p className="text-slate-400">You are the judge. If you lie, you only cheat yourself (and keep your money, but lose your dignity).</p>
                </div>
              </li>
            </ul>
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-24 text-center px-4">
        <h2 className="text-4xl font-bold mb-6">Are you ready to change?</h2>
        <p className="text-xl text-slate-400 mb-10">
          Talk is cheap. ₹500 isn't.
        </p>
        <button
          onClick={() => navigate("/signup")}
          className="bg-white text-slate-950 hover:bg-slate-200 px-12 py-5 rounded-full text-xl font-bold transition-all transform hover:scale-105 shadow-2xl"
        >
          Commitment Shuru Karo 🚀
        </button>
      </section>

      {/* Footer */}
      <footer className="py-8 text-center text-slate-600 text-sm border-t border-slate-900">
        <p>© {new Date().getFullYear()} Sankalp. Built for the disciplined.</p>
      </footer>
    </div>
  );
};

// Simple helper component for the red X icon
const XCircleIcon = ({ className }: { className?: string }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={`w-5 h-5 ${className}`}
  >
    <circle cx="12" cy="12" r="10" />
    <path d="m15 9-6 6" />
    <path d="m9 9 6 6" />
  </svg>
);

export default LandingPage;