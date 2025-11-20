// src/context/AuthContext.tsx
import React, { createContext, useContext, useState, useEffect } from "react";
import { useStore } from "../store/useStore";

interface AuthContextType {
  isLoading: boolean;
  isAuthenticated: boolean;
  checkAuth: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  isLoading: true,
  isAuthenticated: false,
  checkAuth: async () => {},
});

export const useAuth = () => useContext(AuthContext);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const { setUser, setHabits } = useStore();

  const checkAuth = async () => {
    try {
      setIsLoading(true);

      // Check if user is authenticated
      const response = await fetch("http://localhost:8000/me", {
        method: "GET",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (response.ok) {
        const userData = await response.json();
        console.log("✅ User authenticated:", userData);

        // Store user in Zustand
        setUser(userData);
        setIsAuthenticated(true);

        // Also fetch habits if user has them
        try {
          const habitsResponse = await fetch("http://localhost:8000/habits", {
            method: "GET",
            credentials: "include",
          });

          if (habitsResponse.ok) {
            const habitsData = await habitsResponse.json();
            if (habitsData && habitsData.length > 0) {
              setHabits(habitsData);
            }
          }
        } catch (error) {
          console.error("Error fetching habits:", error);
        }
      } else {
        console.log("❌ Not authenticated");
        setIsAuthenticated(false);
        setUser(null);
      }
    } catch (error) {
      console.error("Auth check failed:", error);
      setIsAuthenticated(false);
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    checkAuth();
  }, []);

  return (
    <AuthContext.Provider value={{ isLoading, isAuthenticated, checkAuth }}>
      {children}
    </AuthContext.Provider>
  );
};
