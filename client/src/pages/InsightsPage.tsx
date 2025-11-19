import React from "react";
import { TrendingUp, Flame, Trophy, Calendar, Gift } from "lucide-react";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from "recharts";
import { useStore } from "../store/useStore";
import { BottomNav } from "../components/BottomNav";

const InsightsPage: React.FC = () => {
  const { currentStreak, longestStreak, totalDays } = useStore();

  const chartData = [
    { day: "Mon", completion: 80 },
    { day: "Tue", completion: 100 },
    { day: "Wed", completion: 60 },
    { day: "Thu", completion: 100 },
    { day: "Fri", completion: 100 },
    { day: "Sat", completion: 80 },
    { day: "Sun", completion: 100 },
  ];

  return (
    <div className="min-h-screen bg-slate-900 text-white p-4 pb-24">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold mb-6 flex items-center gap-3">
          <TrendingUp className="text-orange-500" />
          Your Progress
        </h1>

        <div className="grid grid-cols-3 gap-4 mb-8">
          <div className="bg-slate-800 p-4 rounded-xl text-center">
            <Flame className="w-8 h-8 text-orange-500 mx-auto mb-2" />
            <p className="text-2xl font-bold">{currentStreak}</p>
            <p className="text-xs text-slate-400">Current Streak</p>
          </div>
          <div className="bg-slate-800 p-4 rounded-xl text-center">
            <Trophy className="w-8 h-8 text-yellow-500 mx-auto mb-2" />
            <p className="text-2xl font-bold">{longestStreak}</p>
            <p className="text-xs text-slate-400">Best Streak</p>
          </div>
          <div className="bg-slate-800 p-4 rounded-xl text-center">
            <Calendar className="w-8 h-8 text-blue-500 mx-auto mb-2" />
            <p className="text-2xl font-bold">{totalDays}</p>
            <p className="text-xs text-slate-400">Total Days</p>
          </div>
        </div>

        <div className="bg-slate-800 p-6 rounded-xl mb-6">
          <h2 className="text-lg font-semibold mb-4">Weekly Completion Rate</h2>
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
              <XAxis dataKey="day" stroke="#94a3b8" />
              <YAxis stroke="#94a3b8" />
              <Tooltip
                contentStyle={{
                  backgroundColor: "#1e293b",
                  border: "none",
                  borderRadius: "8px",
                }}
              />
              <Line
                type="monotone"
                dataKey="completion"
                stroke="#FF4D00"
                strokeWidth={3}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-gradient-to-br from-orange-500 to-red-500 p-6 rounded-xl text-center">
          <Gift className="w-12 h-12 mx-auto mb-3" />
          <h3 className="text-xl font-bold mb-2">Keep Going! 💪</h3>
          <p className="text-orange-100">
            {100 - totalDays} days until full refund
          </p>
        </div>
      </div>
      <BottomNav />
    </div>
  );
};

export default InsightsPage;
