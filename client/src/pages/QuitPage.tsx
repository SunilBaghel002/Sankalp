import React, { useState } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { Skull, AlertTriangle } from "lucide-react";

const QuitPage: React.FC = () => {
  const navigate = useNavigate();
  const [confirmed, setConfirmed] = useState(false);

  const handleQuit = () => {
    if (confirmed) {
      alert("Your ₹500 has been donated to charity. Thanks for trying! 💔");
      navigate("/");
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 text-white p-4 flex items-center justify-center">
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="max-w-md w-full text-center"
      >
        <Skull className="w-24 h-24 text-red-500 mx-auto mb-6 animate-pulse" />
        <h1 className="text-3xl font-bold mb-4 text-red-500">
          Burn the Boats? 🔥
        </h1>

        <div className="bg-slate-800 p-6 rounded-xl mb-6 border-2 border-red-500">
          <AlertTriangle className="w-12 h-12 text-yellow-500 mx-auto mb-4" />
          <p className="text-lg mb-4">
            Quitting means your{" "}
            <span className="text-red-500 font-bold">₹500 goes to charity</span>
          </p>
          <p className="text-slate-400 text-sm mb-4">
            No refund. No second chances.
          </p>
        </div>

        <div className="bg-slate-800 p-4 rounded-lg mb-6">
          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={confirmed}
              onChange={(e) => setConfirmed(e.target.checked)}
              className="w-5 h-5 accent-red-500"
            />
            <span className="text-sm text-left">
              I understand my ₹500 will be donated and I cannot undo this
            </span>
          </label>
        </div>

        <button
          onClick={handleQuit}
          disabled={!confirmed}
          className="w-full bg-red-600 hover:bg-red-700 disabled:bg-slate-700 disabled:cursor-not-allowed text-white py-4 rounded-lg font-bold mb-4"
        >
          {confirmed
            ? "💔 Confirm Quit & Donate ₹500"
            : "🔒 Confirm to Continue"}
        </button>

        <button
          onClick={() => navigate("/daily")}
          className="w-full bg-green-600 hover:bg-green-700 text-white py-4 rounded-lg font-bold"
        >
          ❤️ No Wait, Keep Going!
        </button>
      </motion.div>
    </div>
  );
};

export default QuitPage;
