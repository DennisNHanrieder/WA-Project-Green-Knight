import { useState, useEffect, useCallback } from "react";
import { AuthContext } from "./AuthContext.context";
import { parseJwt } from "./jwt.utils";

export function AuthProvider({ children }) {
  const [accessToken, setAccessToken] = useState(() =>
      localStorage.getItem("access_token")
  );
  const [refreshToken, setRefreshToken] = useState(() =>
      localStorage.getItem("refresh_token")
  );
  const [user, setUser] = useState(() => {
    const token = localStorage.getItem("access_token");
    if (!token) return null;
    const payload = parseJwt(token);
    if (!payload) return null;

    return {
      id: payload.sub,
      username: payload.username,
      roles: payload.roles || [],
      exp: payload.exp,
    };
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const isAuthenticated = !!accessToken && !!user;

  /* ---------- LOGIN ---------- */
  async function login(username, password) {
    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/oauth/token", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          grant_type: "password",
          username,
          password,
        }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Login failed");
      }

      const data = await res.json();

      localStorage.setItem("access_token", data.access_token);
      localStorage.setItem("refresh_token", data.refresh_token);

      setAccessToken(data.access_token);
      setRefreshToken(data.refresh_token);

      const payload = parseJwt(data.access_token);
      setUser({
        id: payload.sub,
        username: payload.username,
        roles: payload.roles || [],
        exp: payload.exp,
      });
    } catch (err) {
      console.error(err);
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }

  /* ---------- LOGOUT ---------- */
  function logout() {
    localStorage.removeItem("access_token");
    localStorage.removeItem("refresh_token");
    setAccessToken(null);
    setRefreshToken(null);
    setUser(null);
  }

  /* ---------- REGISTER ---------- */
  async function register({ username, email, password }) {
    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, email, password }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Registration failed");
      }

      return await res.json();
    } catch (err) {
      console.error(err);
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }

  /* ---------- REFRESH ---------- */
  const refreshAccessToken = useCallback(async () => {
    if (!refreshToken) return;

    try {
      const res = await fetch("/oauth/token", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          grant_type: "refresh_token",
          refresh_token: refreshToken,
        }),
      });

      if (!res.ok) {
        logout();
        return;
      }

      const data = await res.json();

      localStorage.setItem("access_token", data.access_token);
      localStorage.setItem("refresh_token", data.refresh_token);

      setAccessToken(data.access_token);
      setRefreshToken(data.refresh_token);

      const payload = parseJwt(data.access_token);
      setUser({
        id: payload.sub,
        username: payload.username,
        roles: payload.roles || [],
        exp: payload.exp,
      });
    } catch (err) {
      console.error("refresh error", err);
      logout();
    }
  }, [refreshToken]);

  /* ---------- AUTO REFRESH ---------- */
  useEffect(() => {
    if (!user?.exp) return;

    const now = Date.now() / 1000;
    const secondsLeft = user.exp - now;

    if (secondsLeft <= 0) {
      refreshAccessToken();
      return;
    }

    const timeout = setTimeout(
        refreshAccessToken,
        Math.max(1000, (secondsLeft - 30) * 1000)
    );

    return () => clearTimeout(timeout);
  }, [user?.exp, refreshAccessToken]);

  const value = {
    user,
    accessToken,
    isAuthenticated,
    loading,
    error,
    login,
    logout,
    register,
    refreshAccessToken,
  };

  return (
      <AuthContext.Provider value={value}>
        {children}
      </AuthContext.Provider>
  );
}
