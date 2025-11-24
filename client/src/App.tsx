// src/App.tsx
import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import LandingPage from "./pages/LandingPage";
import SignupPage from "./pages/SignupPage";
import AuthCallback from "./pages/AuthCallback";
import PayDepositPage from "./pages/PayDepositPage";
import OnboardingPage from "./pages/OnboardingPage";
import DailyPage from "./pages/DailyPage";
import ProtectedRoute from "./components/ProtectedRoute";
import StreakPage from "./pages/StreakPage";
import InsightsPage from "./pages/InsightsPage";
import SuccessPage from "./pages/SuccessPage";
import QuitPage from "./pages/QuitPage";
import RouteTitle from "./components/RouteTitle";

// Page titles configuration
const pageTitles: Record<string, string> = {
  "/": "Sankalp - Habit Tracker That Charges ₹500 If You Quit",
  "/signup": "Sign Up | Sankalp",
  "/auth/callback": "Authenticating... | Sankalp",
  "/pay-deposit": "Commit ₹500 | Sankalp",
  "/onboarding": "Setup Your Habits | Sankalp",
  "/daily": "Daily Check-In | Sankalp",
  "/insights": "Analytics & Insights | Sankalp",
  "/streak": "Streak Tracker 🔥 | Sankalp",
  "/quit": "Are You Sure? | Sankalp",
  "/success": "🎉 100 Days Complete! | Sankalp",
};

function App() {
  return (
    <Router>
      {/* This component handles all route title changes */}
      <RouteTitle titles={pageTitles} defaultTitle="Sankalp - Commitment Shuru Karo" />

      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/signup" element={<SignupPage />} />
        <Route path="/auth/callback" element={<AuthCallback />} />

        {/* Protected Routes */}
        <Route
          path="/pay-deposit"
          element={
            <ProtectedRoute>
              <PayDepositPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/onboarding"
          element={
            <ProtectedRoute requiresDeposit={true}>
              <OnboardingPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/daily"
          element={
            <ProtectedRoute requiresDeposit={true}>
              <DailyPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/insights"
          element={
            <ProtectedRoute requiresDeposit={true}>
              <InsightsPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/streak"
          element={
            <ProtectedRoute requiresDeposit={true}>
              <StreakPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/quit"
          element={
            <ProtectedRoute requiresDeposit={true}>
              <QuitPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/success"
          element={
            <ProtectedRoute requiresDeposit={true}>
              <SuccessPage />
            </ProtectedRoute>
          }
        />
      </Routes>
    </Router>
  );
}

export default App;