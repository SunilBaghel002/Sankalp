import React, { useState } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabase";
import { Flame, Mail, Phone } from "lucide-react";

const SignupPage: React.FC = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

  const handleGoogleSignup = async () => {
    setLoading(true);
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: "http://localhost:5173/" }, // Change this
    });
    if (error) alert(error.message);
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-slate-900 text-white flex items-center justify-center p-4">
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="max-w-md w-full bg-slate-800 p-8 rounded-2xl border border-orange-500/20"
      >
        <div className="text-center mb-8">
          <Flame className="w-16 h-16 text-orange-500 mx-auto mb-4" />
          <h1 className="text-3xl font-bold mb-2">Sankalp</h1>
          <p className="text-slate-400">
            Your commitment. Your rules. Your ₹500.
          </p>
        </div>

        <button
          onClick={handleGoogleSignup}
          disabled={loading}
          className="w-full bg-white text-slate-900 py-4 rounded-lg font-semibold flex items-center justify-center gap-3 hover:bg-slate-100 mb-4"
        >
          <Mail className="w-5 h-5" />
          {loading ? "Connecting..." : "Continue with Google"}
        </button>

        <button className="w-full bg-orange-500 text-white py-4 rounded-lg font-semibold flex items-center justify-center gap-3 hover:bg-orange-600">
          <Phone className="w-5 h-5" />
          Continue with Phone (Coming Soon)
        </button>

        <p className="text-xs text-slate-500 text-center mt-6">
          By signing up, you agree to lose ₹500 if you quit 😈
        </p>
      </motion.div>
    </div>
  );
};

export default SignupPage;
