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

function App() {
  return (
    <Router>
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
      </Routes>
    </Router>
  );
}

export default App;