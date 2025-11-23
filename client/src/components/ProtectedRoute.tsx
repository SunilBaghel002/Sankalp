// src/components/ProtectedRoute.tsx
import React, { useEffect, useState } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { checkAuth } from "../lib/auth";
import { useStore } from "../store/useStore";

interface ProtectedRouteProps {
  children: React.ReactElement;
  requiresDeposit?: boolean;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  children,
  requiresDeposit = false,
}) => {
  const [isChecking, setIsChecking] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const location = useLocation();
  const { setUser, depositPaid, setDepositPaid } = useStore();

  useEffect(() => {
    let mounted = true;

    const verify = async () => {
      try {
        // ✅ Add a small delay to ensure cookie is set
        if (location.pathname === "/onboarding" && location.state?.fromPayment) {
          await new Promise(resolve => setTimeout(resolve, 100));
        }

        const authenticated = await checkAuth();
        
        if (!authenticated) {
          console.log("❌ ProtectedRoute: Not authenticated, redirecting to signup");
          if (mounted) {
            setIsChecking(false);
            setIsAuthenticated(false);
          }
          return;
        }

        // Fetch user data
        const response = await fetch("http://localhost:8000/me", {
          method: "GET",
          credentials: "include",
          headers: {
            "Content-Type": "application/json",
          },
        });

        if (!response.ok) {
          console.error("Failed to fetch user data in ProtectedRoute");
          if (mounted) {
            setIsChecking(false);
            setIsAuthenticated(false);
          }
          return;
        }

        const userData = await response.json();
        console.log("✅ ProtectedRoute: User authenticated", userData);

        if (mounted) {
          setUser(userData);
          setDepositPaid(userData.deposit_paid);
          setIsAuthenticated(true);
          setIsChecking(false);
        }
      } catch (error) {
        console.error("ProtectedRoute verification error:", error);
        if (mounted) {
          setIsChecking(false);
          setIsAuthenticated(false);
        }
      }
    };

    verify();

    return () => {
      mounted = false;
    };
  }, [location, setUser, setDepositPaid]);

  if (isChecking) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-orange-500"></div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/signup" replace />;
  }

  if (requiresDeposit && !depositPaid) {
    return <Navigate to="/pay-deposit" replace />;
  }

  return children;
};

export default ProtectedRoute;