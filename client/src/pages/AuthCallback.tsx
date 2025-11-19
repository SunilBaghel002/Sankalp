// src/pages/AuthCallback.tsx
import { useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";

const AuthCallback = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  useEffect(() => {
    const code = searchParams.get("code");
    const state = searchParams.get("state");

    if (!code) {
      console.error("No code in callback");
      navigate("/");
      return;
    }

    const sendCodeToBackend = async () => {
      try {
        const response = await fetch(
          "http://127.0.0.1:8000/auth/google/callback",
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            credentials: "include", // ✅ Important for cookies
            body: JSON.stringify({ code }), // ✅ Sending code in body
          }
        );

        if (!response.ok) {
          const errorText = await response.text();
          console.error("Backend error:", errorText);
          throw new Error("Authentication failed");
        }

        const data = await response.json();
        console.log("Auth success:", data);

        // Store token in localStorage as backup
        localStorage.setItem("authenticated", "true");

        // Navigate to next step
        navigate("/pay-deposit");
      } catch (error) {
        console.error("Auth callback error:", error);
        alert("Login failed. Please try again.");
        navigate("/");
      }
    };

    sendCodeToBackend();
  }, [searchParams, navigate]);

  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-orange-500 mx-auto mb-4"></div>
        <p className="text-white">Completing authentication...</p>
      </div>
    </div>
  );
};

export default AuthCallback;
