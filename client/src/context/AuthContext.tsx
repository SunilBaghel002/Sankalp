// src/context/AuthContext.tsx
import React, { createContext, useContext, useState, useEffect } from "react";
import { checkAuth } from "../lib/auth";

interface AuthContextType {
  isAuthenticated: boolean;
  loading: boolean;
  checkAuthStatus: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return context;
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);

  const checkAuthStatus = async () => {
    try {
      const authenticated = await checkAuth();
      setIsAuthenticated(authenticated);
    } catch (error) {
      setIsAuthenticated(false);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    checkAuthStatus();
  }, []);

  return (
    <AuthContext.Provider value={{ isAuthenticated, loading, checkAuthStatus }}>
      {children}
    </AuthContext.Provider>
  );
}