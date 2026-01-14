// src/components/Layout.jsx
import React from "react";
import { Outlet, useNavigate, useLocation } from "react-router-dom";
import { AppBar, Toolbar, Typography, Button, Tabs, Tab, Box } from "@mui/material";
import { useAuth } from "../auth/AuthContext";

export default function Layout() {
  const { isAuthenticated, user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  // Aktiven Tab anhand der Route bestimmen
  const currentTab =
    location.pathname === "/"
      ? "/"
      : location.pathname.startsWith("/meine-pflanzen")
      ? "/meine-pflanzen"
      : location.pathname.startsWith("/wiki")
      ? "/wiki"
      : false;

  return (
    <>
      <AppBar position="static" sx={{ bgcolor: "#2e7d32" }}>
        <Toolbar
          sx={{
            minHeight: 72,
            display: "flex",
            alignItems: "center",
            gap: 2,
          }}
        >
          <Box sx={{ display: "flex", alignItems: "center", minWidth: 220 }}>
            <Typography variant="h6" sx={{ fontWeight: 800, letterSpacing: 0.2 }}>
              Green Knight
            </Typography>
          </Box>

          <Box
            sx={{
              flexGrow: 1,
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
            }}
          >
            {isAuthenticated && (
              <Tabs
                value={currentTab}
                onChange={(_, value) => navigate(value)}
                textColor="inherit"
                indicatorColor="secondary"
                centered
                sx={{
                  "& .MuiTabs-flexContainer": { gap: 1.5 },
                  "& .MuiTab-root": {
                    minHeight: 72,
                    minWidth: 160,
                    px: 3,
                    fontSize: 15,
                    fontWeight: 700,
                    textTransform: "none",
                    borderRadius: 1.5,
                  },
                  "& .MuiTab-root.Mui-selected": {
                    bgcolor: "rgba(255,255,255,0.12)",
                  },
                }}
              >
                <Tab label="Dashboard" value="/" />
                <Tab label="Meine Pflanzen" value="/meine-pflanzen" />
                <Tab label="Wiki" value="/wiki" />
              </Tabs>
            )}
          </Box>

          <Box
            sx={{
              minWidth: 260,
              display: "flex",
              justifyContent: "flex-end",
              alignItems: "center",
              gap: 2,
            }}
          >
            {isAuthenticated ? (
              <>
                <Typography variant="body2" sx={{ opacity: 0.95 }}>
                  Eingeloggt als <b>{user?.username}</b>
                </Typography>
                <Button
                  onClick={handleLogout}
                  sx={{
                    color: "#fff",
                    fontWeight: 800,
                    border: "1px solid rgba(255,255,255,0.35)",
                    borderRadius: 2,
                    px: 2,
                    "&:hover": {
                      bgcolor: "rgba(255,255,255,0.12)",
                      borderColor: "rgba(255,255,255,0.6)",
                    },
                  }}
                >
                  LOGOUT
                </Button>
              </>
            ) : (
              <>
                <Button color="inherit" onClick={() => navigate("/login")}>
                  Login
                </Button>
                <Button color="inherit" onClick={() => navigate("/register")}>
                  Registrieren
                </Button>
              </>
            )}
          </Box>
        </Toolbar>
      </AppBar>

      <Outlet />
    </>
  );
}
