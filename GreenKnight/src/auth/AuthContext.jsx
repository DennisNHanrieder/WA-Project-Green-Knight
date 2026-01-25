import { useState, useEffect, useCallback } from "react";
import { AuthContext } from "./AuthContext.context";
import { parseJwt } from "./jwt.utils";

/* ---------- ROBUST ERROR DETECTION ---------- */
function resolveAuthError(res, data) {
  // OAuth2 Standard
  if (data?.error === "invalid_grant") {
    return "errors.invalidCredentials";
  }

  // Häufige Backend-Patterns
  if (
      data?.message?.toLowerCase()?.includes("credential") ||
      data?.message?.toLowerCase()?.includes("password")
  ) {
    return "errors.invalidCredentials";
  }

  // HTTP Status Fallback
  if (res.status === 401 || res.status === 400) {
    return "errors.invalidCredentials";
  }

  if (res.status === 403) {
    return "errors.unauthorized";
  }

  if (res.status === 409) {
    return "errors.userExists";
  }

  if (res.status >= 500) {
    return "errors.network";
  }

  return "errors.unknown";
}

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

      let data = null;
      try {
        data = await res.json();
      } catch {
        data = null; // Backend hat evtl. Text/HTML geschickt
      }

      if (!res.ok || data?.error) {
        const errorKey = resolveAuthError(res, data);
        throw new Error(errorKey);
      }

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
      console.error("Login error resolved as:", err.message);
      setError(err.message || "errors.loginFailed");
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

      let data = null;
      try {
        data = await res.json();
      } catch {
        data = null;
      }

      if (!res.ok || data?.error) {
        throw new Error(resolveAuthError(res, data));
      }

      return data;
    } catch (err) {
      console.error("Register error:", err.message);
      setError(err.message || "errors.registrationFailed");
      throw err;
    } finally {
      setLoading(false);
    }
  }

  /* ---------- REFRESH TOKEN ---------- */
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

      const data = await res.json().catch(() => null);

      if (!res.ok || data?.error) {
        logout();
        return;
      }

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
      console.error("Refresh error:", err);
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

  return (
      <AuthContext.Provider
          value={{
            user,
            accessToken,
            isAuthenticated,
            loading,
            error, // i18n KEY
            login,
            logout,
            register,
            refreshAccessToken,
          }}
      >
        {children}
      </AuthContext.Provider>
  );
}
