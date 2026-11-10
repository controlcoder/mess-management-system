import { createContext, useContext, useEffect, useState } from "react";
import { loginRequest, registerRequest, apiRequest } from "../lib/api.js";

const AuthContext = createContext(null);
const TOKEN_KEY = "mess-management-token";
const USER_KEY = "mess-management-user";

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    const raw = window.localStorage.getItem(USER_KEY);
    return raw ? JSON.parse(raw) : null;
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = window.localStorage.getItem(TOKEN_KEY);
    if (!token) {
      setLoading(false);
      return;
    }

    apiRequest("/auth/me")
      .then((data) => {
        setUser(data.user);
        window.localStorage.setItem(USER_KEY, JSON.stringify(data.user));
      })
      .catch(() => {
        window.localStorage.removeItem(TOKEN_KEY);
        window.localStorage.removeItem(USER_KEY);
        setUser(null);
      })
      .finally(() => setLoading(false));
  }, []);

  function persistSession(data) {
    window.localStorage.setItem(TOKEN_KEY, data.token);
    window.localStorage.setItem(USER_KEY, JSON.stringify(data.user));
    setUser(data.user);
    return data.user;
  }

  async function login(identifier, password) {
    const data = await loginRequest(identifier, password);
    return persistSession(data);
  }

  async function register(payload) {
    const data = await registerRequest(payload);
    return persistSession(data);
  }

  function logout() {
    window.localStorage.removeItem(TOKEN_KEY);
    window.localStorage.removeItem(USER_KEY);
    setUser(null);
  }

  function updateUser(nextUser) {
    setUser(nextUser);
    window.localStorage.setItem(USER_KEY, JSON.stringify(nextUser));
  }

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout, updateUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used inside AuthProvider.");
  }
  return context;
}
