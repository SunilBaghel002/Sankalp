import React, { useState } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { useStore } from "../store/useStore";
import { Target, Clock } from "lucide-react";

interface LocalHabit {
  id: number;
  name: string;
  why: string;
  time: string;
}

const OnboardingPage: React.FC = () => {
  const navigate = useNavigate();
  const { setHabits } = useStore();
  const [habits, setLocalHabits] = useState<LocalHabit[]>([
    { id: 1, name: "", why: "", time: "08:00" },
  ]);

  const addHabit = () => {
    if (habits.length < 5) {
      setLocalHabits([
        ...habits,
        { id: habits.length + 1, name: "", why: "", time: "08:00" },
      ]);
    }
  };

  const updateHabit = (id: number, field: keyof LocalHabit, value: string) => {
    setLocalHabits(
      habits.map((h) => (h.id === id ? { ...h, [field]: value } : h))
    );
  };

  const handleSubmit = () => {
    const valid = habits.filter((h) => h.name.trim() && h.why.trim());
    if (valid.length < 5) {
      alert("Please complete all 5 habits!");
      return;
    }
    setHabits(valid as any);
    navigate("/daily");
  };

  return (
    <div className="min-h-screen bg-slate-900 text-white p-4 py-8">
      <div className="max-w-2xl mx-auto">
        <motion.div
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="text-center mb-8"
        >
          <Target className="w-16 h-16 text-orange-500 mx-auto mb-4" />
          <h1 className="text-3xl font-bold mb-2">Apne 5 Habits Choose Karo</h1>
          <p className="text-slate-400">
            These will be your daily commitments for 100 days
          </p>
        </motion.div>

        <div className="space-y-4 mb-6">
          {habits.map((habit, index) => (
            <motion.div
              key={habit.id}
              initial={{ x: -50, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ delay: index * 0.1 }}
              className="bg-slate-800 p-6 rounded-xl border border-slate-700"
            >
              <div className="flex items-center gap-3 mb-4">
                <div className="w-8 h-8 bg-orange-500 rounded-full flex items-center justify-center font-bold">
                  {index + 1}
                </div>
                <input
                  type="text"
                  placeholder="e.g., 30 min exercise"
                  value={habit.name}
                  onChange={(e) =>
                    updateHabit(habit.id, "name", e.target.value)
                  }
                  className="flex-1 bg-slate-700 px-4 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                />
              </div>
              <input
                type="text"
                placeholder="Why is this important?"
                value={habit.why}
                onChange={(e) => updateHabit(habit.id, "why", e.target.value)}
                className="w-full bg-slate-700 px-4 py-2 rounded-lg mb-3 focus:outline-none focus:ring-2 focus:ring-orange-500"
              />
              <div className="flex items-center gap-2">
                <Clock className="w-5 h-5 text-slate-400" />
                <input
                  type="time"
                  value={habit.time}
                  onChange={(e) =>
                    updateHabit(habit.id, "time", e.target.value)
                  }
                  className="bg-slate-700 px-4 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                />
              </div>
            </motion.div>
          ))}
        </div>

        {habits.length < 5 && (
          <button
            onClick={addHabit}
            className="w-full bg-slate-800 border-2 border-dashed border-slate-600 py-4 rounded-lg hover:border-orange-500 text-slate-400 hover:text-orange-500 mb-6"
          >
            + Add Habit ({5 - habits.length} more needed)
          </button>
        )}

        <button
          onClick={handleSubmit}
          disabled={habits.filter((h) => h.name && h.why).length < 5}
          className="w-full bg-orange-500 hover:bg-orange-600 disabled:bg-slate-700 disabled:cursor-not-allowed text-white py-4 rounded-lg text-lg font-bold"
        >
          Start My 100-Day Journey 🚀
        </button>
      </div>
    </div>
  );
};

export default OnboardingPage;
