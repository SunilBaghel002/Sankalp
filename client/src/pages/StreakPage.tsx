import React from "react";
import { Flame } from "lucide-react";
import { useStore } from "../store/useStore";
import { BottomNav } from "../components/BottomNav";

const StreakPage: React.FC = () => {
  const { currentStreak } = useStore();

  return (
    <div className="min-h-screen bg-slate-900 text-white p-4 pb-24">
      <div className="max-w-2xl mx-auto">
        <div className="text-center mb-8">
          <Flame className="w-20 h-20 text-orange-500 mx-auto mb-4" />
          <h1 className="text-4xl font-bold mb-2">{currentStreak} Days</h1>
          <p className="text-slate-400">Fire chain going strong! 🔥</p>
        </div>

        <div className="bg-slate-800 p-6 rounded-xl">
          <h2 className="text-lg font-semibold mb-4">Your Streak Calendar</h2>
          <div className="grid grid-cols-7 gap-2">
            {[...Array(100)].map((_, i) => (
              <div
                key={i}
                className={`aspect-square rounded-lg flex items-center justify-center text-xs font-bold ${
                  i < currentStreak
                    ? "bg-orange-500 text-white"
                    : "bg-slate-700 text-slate-500"
                }`}
              >
                {i + 1}
              </div>
            ))}
          </div>
        </div>
      </div>
      <BottomNav />
    </div>
  );
};

export default StreakPage;
