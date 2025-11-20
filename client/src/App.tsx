// src/App.tsx
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { useEffect } from "react";
import { useStore } from "./store/useStore";
import ProtectedRoute from "./components/ProtectedRoute";

// Pages
import LandingPage from "./pages/LandingPage";
import SignupPage from "./pages/SignupPage";
import PayDepositPage from "./pages/PayDepositPage";
import OnboardingPage from "./pages/OnboardingPage";
import DailyPage from "./pages/DailyPage";
import InsightsPage from "./pages/InsightsPage";
import StreakPage from "./pages/StreakPage";
import QuitPage from "./pages/QuitPage";
import SuccessPage from "./pages/SuccessPage";
import AuthCallback from "./pages/AuthCallback";

function App() {
  const { setUser } = useStore();

  // Check if user is authenticated on app load
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const response = await fetch("http://localhost:8000/me", {
          method: "GET",
          credentials: "include",
          headers: {
            "Content-Type": "application/json",
          },
        });

        if (response.ok) {
          const userData = await response.json();
          setUser(userData);
          console.log("✅ User authenticated:", userData);
        } else {
          console.log("❌ No active session");
        }
      } catch (error) {
        console.error("Auth check failed:", error);
      }
    };

    checkAuth();
  }, [setUser]);

  return (
    <BrowserRouter>
      <Routes>
        {/* Public Routes */}
        <Route path="/" element={<LandingPage />} />
        <Route path="/signup" element={<SignupPage />} />
        <Route path="/auth/callback" element={<AuthCallback />} />
        <Route path="/pay-deposit" element={<PayDepositPage />} />

        {/* Protected Routes */}
        <Route element={<ProtectedRoute />}>
          <Route path="/onboarding" element={<OnboardingPage />} />
          <Route path="/daily" element={<DailyPage />} />
          <Route path="/insights" element={<InsightsPage />} />
          <Route path="/streak" element={<StreakPage />} />
          <Route path="/quit" element={<QuitPage />} />
          <Route path="/success" element={<SuccessPage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
