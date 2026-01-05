// providers/AuthProvider.tsx
import React, { createContext, useContext, useEffect, useState } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";

/* ================= TYPES ================= */

type AuthContextType = {
  isAuthenticated: boolean;
  token: string | null;
  login: (token: string) => Promise<void>;
  logout: () => Promise<void>;
  loading: boolean;
};

/* ================= CONTEXT ================= */

const AuthContext = createContext<AuthContextType | null>(null);

/* ================= PROVIDER ================= */

export const AuthProvider = ({ children }: any) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  /* ================= LOAD SESSION ================= */
  useEffect(() => {
    async function loadAuth() {
      try {
        const storedToken = await AsyncStorage.getItem("authToken");

        if (storedToken) {
          setToken(storedToken);
          setIsAuthenticated(true);
        } else {
          setIsAuthenticated(false);
        }
      } catch (err) {
        console.error("Auth load error", err);
        setIsAuthenticated(false);
      } finally {
        setLoading(false);
      }
    }

    loadAuth();
  }, []);

  /* ================= LOGIN ================= */
  const login = async (jwtToken: string) => {
    await AsyncStorage.setItem("authToken", jwtToken);
    setToken(jwtToken);
    setIsAuthenticated(true);
  };

  /* ================= LOGOUT ================= */
  const logout = async () => {
    await AsyncStorage.removeItem("authToken");
    setToken(null);
    setIsAuthenticated(false);
  };

  /* ================= PROVIDER ================= */
  return (
    <AuthContext.Provider
      value={{
        isAuthenticated,
        token,
        login,
        logout,
        loading,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

/* ================= HOOK ================= */

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuth must be used inside AuthProvider");
  }
  return ctx;
};
