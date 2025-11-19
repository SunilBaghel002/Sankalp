import React, { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { Trophy, Sparkles, Gift, Heart } from "lucide-react";

const SuccessPage: React.FC = () => {
  const navigate = useNavigate();
  const [showFireworks, setShowFireworks] = useState(true);

  useEffect(() => {
    setTimeout(() => setShowFireworks(false), 5000);
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-900 via-slate-900 to-orange-900 text-white flex items-center justify-center p-4">
      {showFireworks && (
        <div className="fixed inset-0 pointer-events-none z-50">
          {[...Array(100)].map((_, i) => (
            <motion.div
              key={i}
              initial={{
                y: window.innerHeight / 2,
                x: window.innerWidth / 2,
                opacity: 1,
                scale: 0,
              }}
              animate={{
                y: Math.random() * window.innerHeight,
                x: Math.random() * window.innerWidth,
                opacity: 0,
                scale: 2,
              }}
              transition={{ duration: 1 + Math.random() }}
              className="absolute w-2 h-2 bg-yellow-400 rounded-full"
            />
          ))}
        </div>
      )}

      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        className="max-w-lg w-full text-center"
      >
        <Trophy className="w-32 h-32 text-yellow-400 mx-auto mb-6" />
        <h1 className="text-5xl font-bold mb-4">You Did It! 🎉</h1>
        <p className="text-2xl text-green-400 font-bold mb-8">
          100 Days Complete!
        </p>

        <div className="bg-slate-800 p-8 rounded-2xl mb-8 border-2 border-green-500">
          <div className="mb-6">
            <p className="text-slate-400 mb-2">Your Refund</p>
            <p className="text-6xl font-bold text-green-400">₹500</p>
          </div>
          <div className="border-t border-slate-700 pt-6">
            <p className="text-slate-400 mb-4">Bonus Rewards Unlocked:</p>
            <div className="space-y-3">
              <div className="bg-slate-700 p-3 rounded-lg flex items-center gap-3">
                <Sparkles className="w-6 h-6 text-yellow-400" /> Sankalp
                Champion Badge
              </div>
              <div className="bg-slate-700 p-3 rounded-lg flex items-center gap-3">
                <Gift className="w-6 h-6 text-orange-400" /> Exclusive Merch
                Discount
              </div>
              <div className="bg-slate-700 p-3 rounded-lg flex items-center gap-3">
                <Heart className="w-6 h-6 text-red-400" /> Free 1-Month Premium
              </div>
            </div>
          </div>
        </div>

        <button
          onClick={() => navigate("/daily")}
          className="w-full bg-orange-500 hover:bg-orange-600 text-white py-4 rounded-lg text-lg font-bold"
        >
          Start Next Challenge 🚀
        </button>
      </motion.div>
    </div>
  );
};

export default SuccessPage;
