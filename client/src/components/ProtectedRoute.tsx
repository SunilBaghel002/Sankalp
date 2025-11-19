import React from "react";
import { Navigate } from "react-router-dom";
import { useStore } from "../store/useStore";
import { useAuth } from "../context/AuthContext";

const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const { user, depositPaid } = useStore();
  const { loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-orange-500" />
      </div>
    );
  }

  if (!user) return <Navigate to="/signup" replace />;
  if (user && !depositPaid) return <Navigate to="/pay-deposit" replace />;

  return <>{children}</>;
};

export default ProtectedRoute;
