// src/pages/AuthCallback.tsx — FINAL WORKING
import React, { useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";

const AuthCallback: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  useEffect(() => {
    const code = searchParams.get("code");
    if (!code) {
      navigate("/");
      return;
    }

    fetch("http://127.0.0.1:8000/auth/google/callback", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ code }),
    }).then((res) => {
      if (res.ok) {
        setTimeout(() => navigate("/pay-deposit", { replace: true }), 1000); // This fixes the 401
      } else {
        navigate("/");
      }
    });
  }, [searchParams, navigate]);

  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center text-white text-2xl font-bold">
      Finalizing your commitment...
    </div>
  );
};

export default AuthCallback;
