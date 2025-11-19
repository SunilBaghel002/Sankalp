import React, { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { useStore } from "../store/useStore";
import { checkAuth } from "../lib/auth";
import { DollarSign, Check, X, AlertTriangle, Zap } from "lucide-react";

const PayDepositPage: React.FC = () => {
  const navigate = useNavigate();
  const { depositPaid, setDepositPaid } = useStore();
  const [loading, setLoading] = useState(true);
  const [paying, setPaying] = useState(false);

  // Check if user is logged in + already paid
  useEffect(() => {
    const verify = async () => {
      const isAuth = await checkAuth();
      if (!isAuth) {
        navigate("/", { replace: true });
        return;
      }

      // Optional: Fetch user from /me to check deposit_paid from backend
      // For now using Zustand (you can sync later)
      if (depositPaid) {
        navigate("/onboarding", { replace: true });
      } else {
        setLoading(false);
      }
    };

    verify();
  }, [navigate, depositPaid]);

  const handlePayment = async () => {
    setPaying(true);

    try {
      const res = await fetch("http://127.0.0.1:8000/deposit-paid", {
        method: "POST",
        credentials: "include",
      });

      if (res.ok) {
        setDepositPaid(true);
        setTimeout(() => {
          navigate("/onboarding");
        }, 800);
      } else {
        alert("Payment failed. Try again.");
        setPaying(false);
      }
    } catch (err) {
      alert("Network error. Check backend.");
      setPaying(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-orange-500"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-900 text-white flex items-center justify-center p-4">
      <motion.div
        initial={{ y: 50, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.6 }}
        className="max-w-lg w-full"
      >
        <div className="bg-gradient-to-br from-orange-500 to-red-600 p-10 rounded-3xl mb-8 text-center shadow-2xl">
          <DollarSign className="w-24 h-24 mx-auto mb-4" />
          <h1 className="text-6xl font-bold mb-2">₹500</h1>
          <p className="text-xl opacity-90">Your Ironclad Commitment</p>
        </div>

        <div className="bg-slate-800 p-8 rounded-2xl border border-slate-700 mb-8 shadow-xl">
          <h2 className="text-2xl font-bold mb-6 flex items-center gap-3 justify-center">
            <Zap className="text-yellow-400" /> The Unbreakable Rules
          </h2>
          <ul className="space-y-5 text-slate-300 text-lg">
            <li className="flex items-start gap-3">
              <Check className="w-6 h-6 text-green-400 mt-1 flex-shrink-0" />
              <span>
                Complete <strong>all 5 habits</strong> for 100 days
              </span>
            </li>
            <li className="flex items-start gap-3">
              <Check className="w-6 h-6 text-green-400 mt-1 flex-shrink-0" />
              <span>
                Get your <strong>₹500 back + rewards</strong>
              </span>
            </li>
            <li className="flex items-start gap-3">
              <X className="w-6 h-6 text-red-400 mt-1 flex-shrink-0" />
              <span>Quit early? Money donated to charity</span>
            </li>
            <li className="flex items-start gap-3">
              <AlertTriangle className="w-6 h-6 text-orange-400 mt-1 flex-shrink-0" />
              <span>Miss 3 days in a row = Auto-quit</span>
            </li>
          </ul>
        </div>

        <button
          onClick={handlePayment}
          disabled={paying}
          className="w-full bg-orange-500 hover:bg-orange-600 disabled:bg-orange-700 text-white py-6 rounded-2xl text-2xl font-bold flex items-center justify-center gap-3 shadow-2xl transition-all transform hover:scale-105 disabled:scale-100"
        >
          {paying ? (
            <>Processing Payment...</>
          ) : (
            <>
              Pay ₹500 & Burn the Boats
              <span className="text-3xl">🔥</span>
            </>
          )}
        </button>

        <p className="text-center text-slate-500 text-sm mt-6">
          Secured by Razorpay • 100% refundable on success
        </p>
      </motion.div>
    </div>
  );
};

export default PayDepositPage;
