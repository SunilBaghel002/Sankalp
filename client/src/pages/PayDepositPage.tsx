import React, { useState } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { useStore } from "../store/useStore";
import { DollarSign, Check, X, AlertTriangle, Zap } from "lucide-react";

const PayDepositPage: React.FC = () => {
  const navigate = useNavigate();
  const { setDepositPaid } = useStore();
  const [loading, setLoading] = useState(false);

  const handlePayment = async () => {
    setLoading(true);
    // Simulate successful payment
    setTimeout(() => {
      setDepositPaid(true);
      navigate("/onboarding");
    }, 1500);
  };

  return (
    <div className="min-h-screen bg-slate-900 text-white flex items-center justify-center p-4">
      <motion.div
        initial={{ y: 50, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="max-w-lg w-full"
      >
        <div className="bg-gradient-to-br from-orange-500 to-red-600 p-8 rounded-2xl mb-6 text-center">
          <DollarSign className="w-20 h-20 mx-auto mb-4" />
          <h1 className="text-5xl font-bold mb-2">₹500</h1>
          <p className="text-lg opacity-90">Commitment Deposit</p>
        </div>

        <div className="bg-slate-800 p-6 rounded-xl border border-slate-700 mb-6">
          <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
            <Zap className="text-yellow-400" /> The Rules
          </h2>
          <ul className="space-y-3 text-slate-300">
            <li className="flex items-start gap-2">
              <Check className="w-5 h-5 text-green-400 mt-0.5" /> Complete 100
              days of all 5 habits
            </li>
            <li className="flex items-start gap-2">
              <Check className="w-5 h-5 text-green-400 mt-0.5" /> Get full ₹500
              refund + bonus rewards
            </li>
            <li className="flex items-start gap-2">
              <X className="w-5 h-5 text-red-400 mt-0.5" /> Quit before 100
              days? Money goes to charity
            </li>
            <li className="flex items-start gap-2">
              <AlertTriangle className="w-5 h-5 text-orange-400 mt-0.5" /> Miss
              3 days in a row? Auto-quit
            </li>
          </ul>
        </div>

        <button
          onClick={handlePayment}
          disabled={loading}
          className="w-full bg-orange-500 hover:bg-orange-600 text-white py-4 rounded-lg text-lg font-bold flex items-center justify-center gap-2 disabled:opacity-70"
        >
          {loading ? "Processing..." : "Pay ₹500 & Start Challenge 🔥"}
        </button>
        <p className="text-center text-slate-500 text-sm mt-4">
          Secure via Razorpay • 100% refundable on success
        </p>
      </motion.div>
    </div>
  );
};

export default PayDepositPage;
