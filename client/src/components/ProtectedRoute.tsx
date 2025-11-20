// src/components/ProtectedRoute.tsx
import React from "react";
import { Navigate, Outlet } from "react-router-dom";
import { useStore } from "../store/useStore";

const ProtectedRoute: React.FC = () => {
  const { user, depositPaid } = useStore();

  // If no user, redirect to signup
  if (!user) {
    console.log("❌ ProtectedRoute: No user, redirecting to signup");
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
