// src/pages/AuthCallback.tsx
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
      body: JSON.stringify({ code }), // ← This now matches GoogleCode model
    })
      .then((res) => {
        if (res.ok) {
          navigate("/pay-deposit", { replace: true });
        } else {
          navigate("/");
        }
      })
      .catch(() => navigate("/"));
  }, [searchParams, navigate]);

  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center text-white text-2xl font-bold">
      Completing login...
    </div>
  );
};

export default AuthCallback;
