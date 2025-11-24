// src/pages/SuccessPage.tsx
import React, { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { useStore } from "../store/useStore";
import {
  Trophy,
  Sparkles,
  Gift,
  Heart,
  Award,
  Flame,
  Target,
  Calendar,
  TrendingUp,
  Star,
  Crown,
  Download,
  Share2,
  CheckCircle,
  Zap,
  DollarSign,
  Instagram,
  Twitter,
  Facebook,
  Copy,
  PartyPopper,
} from "lucide-react";
import Confetti from "react-confetti";
import { useWindowSize } from "react-use";

const SuccessPage: React.FC = () => {
  const navigate = useNavigate();
  const { user, habits } = useStore();
  const { width, height } = useWindowSize();

  const [showConfetti, setShowConfetti] = useState(true);
  const [stats, setStats] = useState({
    total_completed_days: 0,
    total_habits: 0,
    longest_streak: 0,
    current_streak: 0,
  });
  const [currentStep, setCurrentStep] = useState(0);
  const [showShareMenu, setShowShareMenu] = useState(false);

  useEffect(() => {
    // Fetch final stats
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

    // Stop confetti after 10 seconds
    const confettiTimer = setTimeout(() => setShowConfetti(false), 10000);

    // Auto-progress through celebration steps
    const stepTimer = setInterval(() => {
      setCurrentStep((prev) => (prev < 3 ? prev + 1 : prev));
    }, 3000);

    return () => {
      clearTimeout(confettiTimer);
      clearInterval(stepTimer);
    };
  }, []);

  const achievements = [
    {
      icon: <Trophy className="w-12 h-12" />,
      title: "100-Day Warrior",
      desc: "Completed the full challenge",
      color: "text-yellow-400",
      bg: "bg-yellow-500/10",
      border: "border-yellow-500/30",
    },
    {
      icon: <Flame className="w-12 h-12" />,
      title: `${stats.longest_streak}-Day Streak`,
      desc: "Longest consecutive days",
      color: "text-orange-400",
      bg: "bg-orange-500/10",
      border: "border-orange-500/30",
    },
    {
      icon: <Target className="w-12 h-12" />,
      title: `${stats.total_habits * 100} Habits`,
      desc: "Total habits completed",
      color: "text-green-400",
      bg: "bg-green-500/10",
      border: "border-green-500/30",
    },
    {
      icon: <Star className="w-12 h-12" />,
      title: "Discipline Master",
      desc: "Top 1% of users",
      color: "text-purple-400",
      bg: "bg-purple-500/10",
      border: "border-purple-500/30",
    },
  ];

  const rewards = [
    {
      icon: <DollarSign className="w-8 h-8" />,
      title: "₹500 Full Refund",
      desc: "Your deposit returned",
      color: "text-green-400",
      claimed: true,
    },
    {
      icon: <Award className="w-8 h-8" />,
      title: "Champion Badge",
      desc: "Digital certificate",
      color: "text-yellow-400",
      claimed: true,
    },
    {
      icon: <Gift className="w-8 h-8" />,
      title: "30% Merch Discount",
      desc: "Exclusive store access",
      color: "text-orange-400",
      claimed: true,
    },
    {
      icon: <Crown className="w-8 h-8" />,
      title: "Hall of Fame",
      desc: "Featured on leaderboard",
      color: "text-purple-400",
      claimed: true,
    },
    {
      icon: <Sparkles className="w-8 h-8" />,
      title: "1-Month Premium",
      desc: "Free advanced features",
      color: "text-blue-400",
      claimed: true,
    },
    {
      icon: <Heart className="w-8 h-8" />,
      title: "Lifetime Access",
      desc: "VIP community member",
      color: "text-red-400",
      claimed: true,
    },
  ];

  const downloadCertificate = () => {
    // Create a simple certificate (you can make this more elaborate)
    const canvas = document.createElement("canvas");
    canvas.width = 1200;
    canvas.height = 800;
    const ctx = canvas.getContext("2d");

    if (ctx) {
      // Background
      ctx.fillStyle = "#0f172a";
      ctx.fillRect(0, 0, 1200, 800);

      // Border
      ctx.strokeStyle = "#f97316";
      ctx.lineWidth = 10;
      ctx.strokeRect(20, 20, 1160, 760);

      // Title
      ctx.fillStyle = "#f97316";
      ctx.font = "bold 60px Arial";
      ctx.textAlign = "center";
      ctx.fillText("CERTIFICATE OF ACHIEVEMENT", 600, 120);

      // Subtitle
      ctx.fillStyle = "#94a3b8";
      ctx.font = "30px Arial";
      ctx.fillText("100-Day Habit Challenge", 600, 180);

      // Name
      ctx.fillStyle = "#ffffff";
      ctx.font = "bold 50px Arial";
      ctx.fillText(user?.name || "Champion", 600, 300);

      // Description
      ctx.fillStyle = "#cbd5e1";
      ctx.font = "25px Arial";
      ctx.fillText("has successfully completed the Sankalp 100-Day Challenge", 600, 380);
      ctx.fillText(`with ${stats.total_completed_days} perfect days and a ${stats.longest_streak}-day streak`, 600, 420);

      // Stats
      ctx.fillStyle = "#f97316";
      ctx.font = "bold 30px Arial";
      ctx.fillText(`🏆 ${stats.total_habits * 100} Total Habits Completed`, 600, 520);

      // Footer
      ctx.fillStyle = "#64748b";
      ctx.font = "20px Arial";
      ctx.fillText("Sankalp - Commitment Shuru Karo", 600, 680);
      ctx.fillText(new Date().toLocaleDateString(), 600, 720);

      // Download
      const link = document.createElement("a");
      link.download = `Sankalp_Certificate_${user?.name?.replace(/\s/g, "_")}.png`;
      link.href = canvas.toDataURL();
      link.click();
    }
  };

  const shareToSocial = (platform: string) => {
    const text = `🎉 I just completed the Sankalp 100-Day Challenge! ${stats.total_completed_days} perfect days, ${stats.longest_streak}-day streak! 💪 #Sankalp #100DayChallenge #HabitTracker`;
    const url = window.location.origin;

    const shareUrls = {
      twitter: `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}`,
      facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}&quote=${encodeURIComponent(text)}`,
      instagram: `https://www.instagram.com/`, // Instagram doesn't support URL sharing
      copy: text,
    };

    if (platform === "copy") {
      navigator.clipboard.writeText(text);
      alert("Copied to clipboard! Share it anywhere 🎉");
    } else {
      window.open(shareUrls[platform as keyof typeof shareUrls], "_blank");
    }

    setShowShareMenu(false);
  };

  const celebrationSteps = [
    {
      title: "🎊 Analyzing Your Journey...",
      desc: "Processing 100 days of data",
    },
    {
      title: "✅ Verifying Achievements...",
      desc: "Confirming perfect completion",
    },
    {
      title: "💰 Processing Refund...",
      desc: "₹500 will be credited within 24 hours",
    },
    {
      title: "🏆 Unlocking Rewards...",
      desc: "Your exclusive benefits are ready!",
    },
  ];

  return (
    <div className="min-h-screen bg-slate-950 text-white relative overflow-hidden">
      {/* Confetti */}
      {showConfetti && (
        <Confetti
          width={width}
          height={height}
          recycle={true}
          numberOfPieces={500}
          colors={["#f97316", "#fbbf24", "#10b981", "#3b82f6", "#8b5cf6", "#ec4899"]}
        />
      )}

      {/* Animated Background */}
      <div className="absolute inset-0 overflow-hidden">
        <motion.div
          animate={{
            background: [
              "radial-gradient(circle at 20% 50%, rgba(249, 115, 22, 0.15) 0%, transparent 50%)",
              "radial-gradient(circle at 80% 50%, rgba(16, 185, 129, 0.15) 0%, transparent 50%)",
              "radial-gradient(circle at 50% 80%, rgba(59, 130, 246, 0.15) 0%, transparent 50%)",
              "radial-gradient(circle at 20% 50%, rgba(249, 115, 22, 0.15) 0%, transparent 50%)",
            ],
          }}
          transition={{ duration: 10, repeat: Infinity }}
          className="absolute inset-0"
        />
      </div>

      {/* Main Content */}
      <div className="relative z-10 min-h-screen flex items-center justify-center p-4">
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.5 }}
          className="max-w-6xl w-full"
        >

          {/* Hero Section */}
          <div className="text-center mb-12">
            <motion.div
              initial={{ scale: 0, rotate: -180 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ type: "spring", duration: 1 }}
              className="inline-block mb-8"
            >
              <div className="relative">
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
                  className="absolute inset-0 bg-gradient-to-r from-yellow-400 via-orange-500 to-red-500 rounded-full blur-2xl opacity-50"
                />
                <div className="relative bg-gradient-to-br from-yellow-400 to-orange-500 p-8 rounded-full">
                  <Trophy className="w-32 h-32 text-white" />
                </div>
              </div>
            </motion.div>

            <motion.h1
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.3 }}
              className="text-6xl md:text-7xl font-bold mb-4 bg-gradient-to-r from-yellow-400 via-orange-500 to-red-500 bg-clip-text text-transparent"
            >
              YOU DID IT! 🎉
            </motion.h1>

            <motion.p
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.5 }}
              className="text-3xl md:text-4xl font-bold text-green-400 mb-4"
            >
              100 Days Complete!
            </motion.p>

            <motion.p
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.7 }}
              className="text-xl text-slate-300 max-w-2xl mx-auto leading-relaxed"
            >
              {user?.name?.split(" ")[0]}, you've achieved what 99% of people only dream about.
              You turned commitment into action. You're a true champion! 🏆
            </motion.p>
          </div>

          {/* Processing Steps */}
          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.9 }}
            className="bg-slate-800 rounded-2xl p-6 mb-8 border border-slate-700"
          >
            <div className="space-y-3">
              {celebrationSteps.map((step, index) => (
                <motion.div
                  key={index}
                  initial={{ x: -20, opacity: 0 }}
                  animate={{
                    x: 0,
                    opacity: currentStep >= index ? 1 : 0.3,
                  }}
                  transition={{ delay: index * 0.5 }}
                  className="flex items-center gap-4"
                >
                  {currentStep > index ? (
                    <CheckCircle className="w-6 h-6 text-green-400" />
                  ) : currentStep === index ? (
                    <div className="w-6 h-6 border-2 border-orange-400 border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <div className="w-6 h-6 rounded-full border-2 border-slate-600" />
                  )}
                  <div>
                    <p className="font-semibold">{step.title}</p>
                    <p className="text-sm text-slate-400">{step.desc}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>

          {/* Stats Grid */}
          <div className="grid md:grid-cols-4 gap-4 mb-8">
            {achievements.map((achievement, index) => (
              <motion.div
                key={index}
                initial={{ scale: 0, rotate: -180 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{ delay: 1 + index * 0.1, type: "spring" }}
                className={`${achievement.bg} ${achievement.border} border-2 rounded-2xl p-6 text-center hover:scale-105 transition-transform`}
              >
                <div className={`${achievement.color} mb-3 flex justify-center`}>
                  {achievement.icon}
                </div>
                <h3 className="font-bold text-lg mb-1">{achievement.title}</h3>
                <p className="text-sm text-slate-400">{achievement.desc}</p>
              </motion.div>
            ))}
          </div>

          {/* Refund Card */}
          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 1.5 }}
            className="bg-gradient-to-br from-green-900/50 to-green-800/30 rounded-3xl p-8 mb-8 border-2 border-green-500/50 shadow-2xl shadow-green-500/20"
          >
            <div className="text-center mb-6">
              <motion.div
                animate={{ scale: [1, 1.1, 1] }}
                transition={{ duration: 2, repeat: Infinity }}
              >
                <DollarSign className="w-20 h-20 text-green-400 mx-auto mb-4" />
              </motion.div>
              <p className="text-slate-300 text-xl mb-3">Your Full Refund</p>
              <p className="text-7xl font-bold text-green-400 mb-3">₹500</p>
              <p className="text-slate-400">Will be credited within 24 hours</p>
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              <div className="bg-slate-800/50 rounded-xl p-4 border border-green-500/30">
                <p className="text-sm text-slate-400 mb-1">Account</p>
                <p className="font-semibold">{user?.email}</p>
              </div>
              <div className="bg-slate-800/50 rounded-xl p-4 border border-green-500/30">
                <p className="text-sm text-slate-400 mb-1">Transaction ID</p>
                <p className="font-semibold">SNK-{Date.now().toString().slice(-8)}</p>
              </div>
            </div>
          </motion.div>

          {/* Rewards Grid */}
          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 1.7 }}
            className="bg-slate-800 rounded-3xl p-8 mb-8 border border-slate-700"
          >
            <div className="text-center mb-8">
              <Sparkles className="w-12 h-12 text-yellow-400 mx-auto mb-4" />
              <h2 className="text-3xl font-bold mb-2">Exclusive Rewards Unlocked</h2>
              <p className="text-slate-400">Your hard work deserves recognition</p>
            </div>

            <div className="grid md:grid-cols-3 gap-4">
              {rewards.map((reward, index) => (
                <motion.div
                  key={index}
                  initial={{ x: -20, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  transition={{ delay: 1.9 + index * 0.1 }}
                  className="bg-slate-700 rounded-xl p-6 border border-slate-600 hover:border-orange-500/50 transition-all"
                >
                  <div className="flex items-start gap-4">
                    <div className={`${reward.color} flex-shrink-0`}>
                      {reward.icon}
                    </div>
                    <div className="flex-1">
                      <h3 className="font-bold mb-1">{reward.title}</h3>
                      <p className="text-sm text-slate-400 mb-2">{reward.desc}</p>
                      {reward.claimed && (
                        <div className="flex items-center gap-2 text-green-400 text-sm">
                          <CheckCircle className="w-4 h-4" />
                          <span>Claimed</span>
                        </div>
                      )}
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>

          {/* Action Buttons */}
          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 2 }}
            className="grid md:grid-cols-3 gap-4 mb-8"
          >
            <button
              onClick={downloadCertificate}
              className="bg-slate-800 hover:bg-slate-700 border border-slate-600 text-white py-4 px-6 rounded-xl font-bold flex items-center justify-center gap-3 transition-all"
            >
              <Download className="w-5 h-5" />
              Download Certificate
            </button>

            <button
              onClick={() => setShowShareMenu(!showShareMenu)}
              className="bg-blue-600 hover:bg-blue-700 text-white py-4 px-6 rounded-xl font-bold flex items-center justify-center gap-3 transition-all relative"
            >
              <Share2 className="w-5 h-5" />
              Share Achievement

              {/* Share Menu */}
              <AnimatePresence>
                {showShareMenu && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="absolute bottom-full mb-2 left-0 right-0 bg-slate-800 rounded-xl border border-slate-600 p-2 shadow-2xl"
                  >
                    <button
                      onClick={() => shareToSocial("twitter")}
                      className="w-full flex items-center gap-3 px-4 py-2 hover:bg-slate-700 rounded-lg transition-all"
                    >
                      <Twitter className="w-4 h-4 text-blue-400" />
                      <span className="text-sm">Twitter</span>
                    </button>
                    <button
                      onClick={() => shareToSocial("facebook")}
                      className="w-full flex items-center gap-3 px-4 py-2 hover:bg-slate-700 rounded-lg transition-all"
                    >
                      <Facebook className="w-4 h-4 text-blue-600" />
                      <span className="text-sm">Facebook</span>
                    </button>
                    <button
                      onClick={() => shareToSocial("copy")}
                      className="w-full flex items-center gap-3 px-4 py-2 hover:bg-slate-700 rounded-lg transition-all"
                    >
                      <Copy className="w-4 h-4 text-slate-400" />
                      <span className="text-sm">Copy Link</span>
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
            </button>

            <button
              onClick={() => navigate("/daily")}
              className="bg-gradient-to-r from-orange-500 to-red-600 hover:from-orange-600 hover:to-red-700 text-white py-4 px-6 rounded-xl font-bold flex items-center justify-center gap-3 transition-all shadow-lg shadow-orange-500/25"
            >
              <Zap className="w-5 h-5" />
              Start Next Challenge
            </button>
          </motion.div>

          {/* Motivational Quote */}
          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 2.2 }}
            className="bg-gradient-to-r from-purple-900/30 to-pink-900/30 rounded-2xl p-8 border border-purple-500/30 text-center"
          >
            <PartyPopper className="w-12 h-12 text-yellow-400 mx-auto mb-4" />
            <blockquote className="text-2xl font-bold mb-4 leading-relaxed">
              "Success is the sum of small efforts repeated day in and day out."
            </blockquote>
            <p className="text-slate-300 text-lg mb-6">— Robert Collier</p>
            <p className="text-slate-400">
              You proved this every single day for 100 days straight. That's legendary. 🏆
            </p>
          </motion.div>
        </motion.div>
      </div>
    </div>
  );
};

export default SuccessPage;