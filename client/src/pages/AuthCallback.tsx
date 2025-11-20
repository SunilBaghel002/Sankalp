// src/pages/AuthCallback.tsx
import { useEffect, useRef } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";

const AuthCallback = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const hasRun = useRef(false);

  useEffect(() => {
    if (hasRun.current) return;
    hasRun.current = true;

    const code = searchParams.get("code");

    if (!code) {
      navigate("/");
      return;
    }

    const sendCodeToBackend = async () => {
      try {
        console.log("Sending code to backend:", code.substring(0, 20) + "...");

        // ✅ Changed to localhost (not 127.0.0.1)
        const response = await fetch(
          "http://localhost:8000/auth/google/callback",
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            credentials: "include", // ✅ Important
            body: JSON.stringify({ code }),
          }
        );

        console.log("Response status:", response.status);

        if (!response.ok) {
          const errorText = await response.text();
          console.error("Backend error:", errorText);
          throw new Error("Authentication failed");
        }

        const data = await response.json();
        console.log("Auth success:", data);

        // ✅ Small delay to ensure cookie is set
        await new Promise((resolve) => setTimeout(resolve, 100));

        // Navigate to next step
        navigate("/pay-deposit", { replace: true });
      } catch (error) {
        console.error("Auth callback error:", error);
        alert("Login failed. Please try again.");
        navigate("/", { replace: true });
      }
    };

    sendCodeToBackend();
  }, []);

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
