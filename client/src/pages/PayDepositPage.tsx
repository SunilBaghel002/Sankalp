// src/pages/PayDepositPage.tsx
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
  const [user, setUser] = useState<any>(null);

  // ✅ Check authentication and fetch user data
  useEffect(() => {
    const verify = async () => {
      try {
        console.log("🔍 Verifying authentication...");

        const isAuth = await checkAuth();

        if (!isAuth) {
          console.log("❌ Not authenticated, redirecting to home");
          navigate("/", { replace: true });
          return;
        }

        console.log("✅ User authenticated, fetching user data...");

        // Fetch user data from backend
        const response = await fetch("http://localhost:8000/me", {
          method: "GET",
          credentials: "include",
          headers: {
            "Content-Type": "application/json",
          },
        });

        if (!response.ok) {
          console.error("Failed to fetch user data");
          navigate("/", { replace: true });
          return;
        }

        const userData = await response.json();
        console.log("👤 User data:", userData);
        setUser(userData);

        // Check if user already paid deposit
        if (userData.deposit_paid) {
          console.log("💰 Deposit already paid, redirecting to onboarding");
          setDepositPaid(true);
          navigate("/onboarding", { replace: true });
        } else {
          console.log("💳 Deposit not paid, showing payment page");
          setLoading(false);
        }
      } catch (error) {
        console.error("Verification error:", error);
        navigate("/", { replace: true });
      }
    };

    verify();
  }, [navigate, setDepositPaid]);

  // ✅ Handle payment - just mark as paid and move forward
  const handlePayment = async () => {
    setPaying(true);

    try {
      console.log("💳 Marking deposit as paid...");

      const res = await fetch("http://localhost:8000/deposit-paid", {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (!res.ok) {
        const errorText = await res.text();
        console.error("Payment API error:", errorText);
        alert("Failed to mark payment. Please try again.");
        setPaying(false);
        return;
      }

      const data = await res.json();
      console.log("✅ Payment marked successful:", data);

      // Update store
      setDepositPaid(true);

      // Show success animation briefly
      await new Promise((resolve) => setTimeout(resolve, 1000));

      // Navigate to onboarding
      navigate("/onboarding", { replace: true });
    } catch (err) {
      console.error("Network error:", err);
      alert("Network error. Please check your backend is running.");
      setPaying(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-orange-500 mx-auto mb-4"></div>
          <p className="text-white text-lg">Loading your profile...</p>
        </div>
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
        {/* User Welcome */}
        {user && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center mb-6"
          >
            <h2 className="text-2xl font-semibold text-slate-300">
              Welcome, <span className="text-orange-400">{user.name}</span>!
            </h2>
            <p className="text-slate-400 text-sm">{user.email}</p>
          </motion.div>
        )}

        {/* Deposit Amount Card */}
        <div className="bg-gradient-to-br from-orange-500 to-red-600 p-10 rounded-3xl mb-8 text-center shadow-2xl">
          <DollarSign className="w-24 h-24 mx-auto mb-4" />
          <h1 className="text-6xl font-bold mb-2">₹500</h1>
          <p className="text-xl opacity-90">Your Ironclad Commitment</p>
        </div>

        {/* Rules Card */}
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

        {/* Payment Button */}
        <button
          onClick={handlePayment}
          disabled={paying}
          className="w-full bg-orange-500 hover:bg-orange-600 disabled:bg-orange-700 text-white py-6 rounded-2xl text-2xl font-bold flex items-center justify-center gap-3 shadow-2xl transition-all transform hover:scale-105 disabled:scale-100 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {paying ? (
            <>
              <div className="animate-spin rounded-full h-6 w-6 border-t-2 border-white"></div>
              Processing...
            </>
          ) : (
            <>
              Commit ₹500 & Start Challenge
              <span className="text-3xl">🔥</span>
            </>
          )}
        </button>

        {/* Footer Note */}
        <p className="text-center text-slate-400 text-sm mt-6">
          Click to confirm your commitment to the 100-day challenge
        </p>

        {/* Debug Info (Development only) */}
        {import.meta.env.DEV && (
          <div className="mt-8 p-4 bg-slate-800 rounded-lg text-xs text-slate-400 border border-slate-700">
            <p className="font-semibold mb-2 text-orange-400">🔧 Debug Info:</p>
            <p>User ID: {user?.id}</p>
            <p>Name: {user?.name}</p>
            <p>Email: {user?.email}</p>
            <p>Deposit Paid: {user?.deposit_paid ? "✅ Yes" : "❌ No"}</p>
          </div>
        )}
      </motion.div>
    </div>
  );
};

export default PayDepositPage;
