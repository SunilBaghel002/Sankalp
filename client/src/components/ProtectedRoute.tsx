// src/components/ProtectedRoute.tsx
import React from "react";
import { Navigate, Outlet } from "react-router-dom";
import { useStore } from "../store/useStore";
import { useAuth } from "../context/AuthContext";

const ProtectedRoute: React.FC = () => {
  const { user, depositPaid } = useStore();
  const { isLoading, isAuthenticated } = useAuth();

  // Show loading spinner while checking auth
  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-orange-500 mx-auto mb-4"></div>
          <p className="text-white">Loading...</p>
        </div>
      </div>
    );
  }

  // If not authenticated, redirect to signup
  if (!isAuthenticated || !user) {
    console.log("❌ ProtectedRoute: Not authenticated, redirecting to signup");
    return <Navigate to="/signup" replace />;
  }

  // If user exists but hasn't paid, redirect to pay-deposit
  if (!depositPaid) {
    console.log(
      "❌ ProtectedRoute: Deposit not paid, redirecting to pay-deposit"
    );
    return <Navigate to="/pay-deposit" replace />;
  }

  // User is authenticated and paid - render child routes
  console.log("✅ ProtectedRoute: Access granted");
  return <Outlet />;
};

export default ProtectedRoute;
