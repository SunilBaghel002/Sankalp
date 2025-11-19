import React, { useState } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { Flame, Target, Trophy, ChevronRight } from "lucide-react";

const LandingPage: React.FC = () => {
  const [step, setStep] = useState(0);
  const navigate = useNavigate();

  const slides = [
    {
      icon: <Flame className="w-20 h-20 text-orange-500" />,
      title: "₹500 की Deposit. Zero Excuses.",
      subtitle: "Normal apps let you quit. Sankalp makes you pay.",
    },
    {
      icon: <Target className="w-20 h-20 text-orange-500" />,
      title: "5 Habits. 100 Days. 1 Goal.",
      subtitle: "Check-in daily or watch your money burn 🔥",
    },
    {
      icon: <Trophy className="w-20 h-20 text-orange-500" />,
      title: "Complete? Full Refund + Reward!",
      subtitle: "Winners get ₹500 back + exclusive perks",
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-orange-900 to-slate-900 text-white">
      <div className="container mx-auto px-4 py-8 flex flex-col items-center justify-center min-h-screen">
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          className="mb-8"
        >
          {slides[step].icon}
        </motion.div>

        <motion.h1
          key={step}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-4xl md:text-5xl font-bold text-center mb-4"
        >
          {slides[step].title}
        </motion.h1>

        <motion.p
          key={`${step}-sub`}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-xl text-orange-200 text-center mb-12"
        >
          {slides[step].subtitle}
        </motion.p>

        <div className="flex gap-2 mb-8">
          {slides.map((_, i) => (
            <div
              key={i}
              className={`h-2 w-2 rounded-full transition-all ${
                i === step ? "bg-orange-500 w-8" : "bg-slate-600"
              }`}
            />
          ))}
        </div>

        {step < slides.length - 1 ? (
          <button
            onClick={() => setStep(step + 1)}
            className="bg-orange-500 hover:bg-orange-600 text-white px-8 py-4 rounded-lg text-lg font-semibold flex items-center gap-2"
          >
            Next <ChevronRight />
          </button>
        ) : (
          <button
            onClick={() => navigate("/signup")}
            className="bg-orange-500 hover:bg-orange-600 text-white px-12 py-4 rounded-lg text-xl font-bold animate-pulse"
          >
            Commitment Shuru Karo 🚀
          </button>
        )}
      </div>
    </div>
  );
};

export default LandingPage;
