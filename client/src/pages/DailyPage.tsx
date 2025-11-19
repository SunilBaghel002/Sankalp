import React, { useState } from "react";
import { format } from "date-fns";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { LogOut, Check, Target, Clock, Sparkles, Flame } from "lucide-react";
import { useStore } from "../store/useStore";
import { supabase } from "../lib/supabase";
import { Confetti } from "../components/Confetti";
import { BottomNav } from "../components/BottomNav";

const DailyPage: React.FC = () => {
  const navigate = useNavigate();
  const { habits, todayCheckins, checkInHabit, currentStreak, logout } =
    useStore();
  const [showConfetti, setShowConfetti] = useState(false);

  const today = format(new Date(), "EEEE, MMMM d");
  const checkedCount = Object.keys(todayCheckins).length;
  const allChecked = checkedCount === habits.length;

  const handleCheckIn = (habitId: number) => {
    checkInHabit(habitId);
    if (checkedCount + 1 === habits.length) {
      setShowConfetti(true);
      setTimeout(() => setShowConfetti(false), 4000);
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    logout();
    navigate("/");
  };

  return (
    <div className="min-h-screen bg-slate-900 text-white pb-20">
      {showConfetti && <Confetti />}

      <div className="bg-gradient-to-r from-orange-600 to-orange-500 p-6">
        <div className="flex justify-between items-start mb-4">
          <div>
            <p className="text-orange-100 text-sm">{today}</p>
            <h1 className="text-2xl font-bold">Aaj ka Check-in</h1>
          </div>
          <button
            onClick={handleLogout}
            className="p-2 hover:bg-orange-600 rounded-lg"
          >
            <LogOut className="w-5 h-5" />
          </button>
        </div>

        <div className="flex gap-4">
          <div className="flex-1 bg-orange-700/50 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-1">
              <Flame className="w-5 h-5" />
              <span className="text-sm text-orange-100">Current Streak</span>
            </div>
            <p className="text-3xl font-bold">{currentStreak} days</p>
          </div>
          <div className="bg-orange-700/50 rounded-lg p-4">
            <p className="text-sm text-orange-100 mb-1">Progress</p>
            <p className="text-2xl font-bold">
              {checkedCount}/{habits.length}
            </p>
          </div>
        </div>
      </div>

      <div className="p-4 space-y-3">
        {allChecked && (
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="bg-green-500/20 border border-green-500 p-4 rounded-lg text-center mb-4"
          >
            <Sparkles className="w-8 h-8 text-green-400 mx-auto mb-2" />
            <p className="font-bold text-green-400">All habits completed! 🎉</p>
          </motion.div>
        )}

        {habits.map((habit: any, index: number) => {
          const isChecked = todayCheckins[habit.id];
          return (
            <motion.div
              key={habit.id}
              initial={{ x: -50, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ delay: index * 0.1 }}
              className={`bg-slate-800 border-2 rounded-xl p-5 ${
                isChecked ? "border-green-500" : "border-slate-700"
              }`}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <h3 className="text-lg font-semibold mb-1">{habit.name}</h3>
                  <p className="text-sm text-slate-400">{habit.why}</p>
                  <div className="flex items-center gap-2 mt-2 text-xs text-slate-500">
                    <Clock className="w-4 h-4" />
                    {habit.time}
                  </div>
                </div>
                <button
                  onClick={() => !isChecked && handleCheckIn(habit.id)}
                  disabled={isChecked}
                  className={`w-14 h-14 rounded-full flex items-center justify-center ${
                    isChecked
                      ? "bg-green-500"
                      : "bg-orange-500 hover:bg-orange-600"
                  }`}
                >
                  {isChecked ? (
                    <Check className="w-7 h-7" />
                  ) : (
                    <Target className="w-7 h-7" />
                  )}
                </button>
              </div>
            </motion.div>
          );
        })}
      </div>

      <BottomNav />
    </div>
  );
};

export default DailyPage;
