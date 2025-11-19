// src/pages/SignupPage.tsx
import React, { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { Flame, Mail } from "lucide-react";

// Your Google Client ID from Google Cloud Console
const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID // ← CHANGE THIS!

// API call to your FastAPI backend
const api = {
  googleLogin: async (idToken: string) => {
    const res = await fetch("http://127.0.0.1:8000/auth/google", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include", // This sends & receives cookies
      body: JSON.stringify({ token: idToken }),
    });
    if (!res.ok) throw new Error("Login failed");
    return res.json();
  },
};

const SignupPage: React.FC = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

  // Step 1: Trigger Google OAuth
  const handleGoogleSignup = () => {
    setLoading(true);
    const redirectUri = encodeURIComponent("http://localhost:5173/");
    const scope = encodeURIComponent("email profile openid");

    const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${GOOGLE_CLIENT_ID}&redirect_uri=${redirectUri}&response_type=token&scope=${scope}`;

    window.location.href = authUrl;
  };

  // Step 2: Catch the token from URL after Google redirects back
  useEffect(() => {
    const hash = window.location.hash;
    if (hash.startsWith("#access_token")) {
      const token = hash.split("access_token=")[1].split("&")[0];
      setLoading(true);

      api
        .googleLogin(token)
        .then(() => {
          navigate("/pay-deposit"); // Or directly to /onboarding if you want
        })
        .catch((err) => {
          alert("Login failed: " + err.message);
          setLoading(false);
        });
    }
  }, [navigate]);

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
          className="w-full bg-white text-slate-900 py-4 rounded-lg font-semibold flex items-center justify-center gap-3 hover:bg-slate-100 mb-4 disabled:opacity-70"
        >
          <Mail className="w-5 h-5" />
          {loading ? "Connecting..." : "Continue with Google"}
        </button>

        <button className="w-full bg-orange-500 text-white py-4 rounded-lg font-semibold flex items-center justify-center gap-3 hover:bg-orange-600 opacity-60 cursor-not-allowed">
          <Mail className="w-5 h-5" />
          Continue with Email (Coming Soon)
        </button>

        <p className="text-xs text-slate-500 text-center mt-6">
          By signing up, you agree to lose ₹500 if you quit 😈
        </p>
      </motion.div>
    </div>
  );
};

export default SignupPage;
