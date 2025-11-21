// src/App.tsx
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
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
import RulesPage from "./pages/RulesPage";
import QueryPage from "./pages/QueryPage";

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          {/* Public Routes */}
          <Route path="/" element={<LandingPage />} />
          <Route path="/signup" element={<SignupPage />} />
          <Route path="/auth/callback" element={<AuthCallback />} />
          <Route path="/pay-deposit" element={<PayDepositPage />} />
          <Route path="/rules" element={<RulesPage />} />
          <Route path="/query" element={<QueryPage />} />

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
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
