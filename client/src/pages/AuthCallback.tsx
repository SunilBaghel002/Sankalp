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

    // Send code to your backend
    fetch("http://127.0.0.1:8000/auth/google/callback", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ code }),
    })
      .then((res) => {
        if (res.ok) {
          navigate("/pay-deposit");
        } else {
          navigate("/");
        }
      })
      .catch(() => navigate("/"));
  }, [searchParams, navigate]);

  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center">
      <div className="text-white text-xl">Completing login...</div>
    </div>
  );
};

export default AuthCallback;
