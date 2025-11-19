// src/pages/SignupPage.tsx
import React, { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { Flame, Mail } from "lucide-react";
import { checkAuth } from "../lib/auth";

const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID;

const api = {
  googleLogin: async (idToken: string) => {
    const res = await fetch("http://127.0.0.1:8000/auth/google", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ token: idToken }),
    });
    if (!res.ok) throw new Error("Login failed");
    return res.json();
  },
};

const SignupPage: React.FC = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true); // Start with loading

  // Check if already logged in
  useEffect(() => {
    let mounted = true;

    const tryCheck = async (attempt = 1) => {
      if (!mounted) return;

      const loggedIn = await checkAuth();
      if (loggedIn) {
        navigate("/pay-deposit", { replace: true });
      } else if (attempt < 5) {
        // Retry up to 5 times with delay (Google cookie sometimes takes 1-2 seconds)
        setTimeout(() => tryCheck(attempt + 1), 800);
      } else {
        setChecking(false);
        setLoading(false);
      }
    };

    tryCheck();

    return () => {
      mounted = false;
    };
  }, [navigate]);

  // Handle Google callback
  useEffect(() => {
    const hash = window.location.hash;
    if (hash.startsWith("#access_token")) {
      const token = hash.split("access_token=")[1].split("&")[0];

      api
        .googleLogin(token)
        .then(() => {
          // Clean URL + redirect
          window.history.replaceState({}, "", "/");
          navigate("/pay-deposit", { replace: true });
        })
        .catch((err) => {
          alert("Login failed: " + err.message);
          window.history.replaceState({}, "", "/signup");
        });
    }
  }, [navigate]);

  const handleGoogleSignup = () => {
    const redirectUri = encodeURIComponent("http://localhost:5173/");
    const scope = encodeURIComponent("email profile openid");
    const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${GOOGLE_CLIENT_ID}&redirect_uri=${redirectUri}&response_type=token&scope=${scope}`;
    window.location.href = authUrl;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-orange-500"></div>
      </div>
    );
  }

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
          className="w-full bg-white text-slate-900 py-4 rounded-lg font-semibold flex items-center justify-center gap-3 hover:bg-slate-100"
        >
          <Mail className="w-5 h-5" />
          Continue with Google
        </button>

        <p className="text-xs text-slate-500 text-center mt-6">
          By signing up, you agree to lose ₹500 if you quit 😈
        </p>
      </motion.div>
    </div>
  );
};

export default SignupPage;
