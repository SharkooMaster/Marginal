import React, { createContext, useContext, useEffect, useState } from "react";
import { Platform } from "react-native";

import {
  api,
  auth as authApi,
  clearAuth,
  loadStoredAuth,
  saveAuth,
  setOnAuthFail,
} from "../api";
import { registerForPush } from "../live/notifications";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [booting, setBooting] = useState(true);

  useEffect(() => {
    setOnAuthFail(() => setUser(null));
    (async () => {
      try {
        const stored = await loadStoredAuth();
        if (stored.access && stored.user) setUser(stored.user);
      } finally {
        setBooting(false);
      }
    })();
  }, []);

  // Once signed in, register this device for push (native only; no-op on web).
  useEffect(() => {
    if (!user) return;
    let active = true;
    (async () => {
      const token = await registerForPush();
      if (active && token) {
        try {
          await api.registerDevice(token, Platform.OS);
        } catch (_) {}
      }
    })();
    return () => {
      active = false;
    };
  }, [user]);

  const signIn = async (email, password) => {
    const data = await authApi.login(email, password);
    await saveAuth(data);
    setUser(data.user);
  };

  const signUp = async (payload) => {
    const data = await authApi.register(payload);
    await saveAuth(data);
    setUser(data.user);
  };

  const signOut = async () => {
    await clearAuth();
    setUser(null);
  };

  const role = user?.role || null;

  return (
    <AuthContext.Provider
      value={{
        user,
        role,
        company: user?.company || "",
        isManager: role === "manager",
        isWorker: role === "worker",
        booting,
        isAuthenticated: !!user,
        signIn,
        signUp,
        signOut,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
