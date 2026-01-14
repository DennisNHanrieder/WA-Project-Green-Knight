// src/App.jsx
import { Outlet, useLocation, useNavigate } from "react-router-dom";
import {
  AppBar,
  Toolbar,
  Typography,
  Tabs,
  Tab,
  Box,
  Button,
} from "@mui/material";
import { useTranslation } from "react-i18next";
import { useAuth } from "./auth/AuthContext";

export default function App() {
  const { t } = useTranslation();
  const location = useLocation();
  const navigate = useNavigate();

  const { isAuthenticated, user, logout } = useAuth();

  // Tabs nur anzeigen, wenn eingeloggt
  const showTabs = !!isAuthenticated;

  // aktiven Tab anhand der Route bestimmen
  const tabValue = (() => {
    const p = location.pathname || "/";
    if (p === "/" || p.startsWith("/dashboard")) return "/";
    if (p.startsWith("/meine-pflanzen")) return "/meine-pflanzen";
    if (p.startsWith("/wiki")) return "/wiki";
    return false;
  })();

  const handleTabChange = (_e, value) => {
    if (!value) return;
    navigate(value);
  };

  return (
    <>
      <AppBar position="sticky" sx={{ bgcolor: "#2e7d32" }}>
        <Toolbar
          sx={{
            minHeight: 72,
            display: "flex",
            alignItems: "center",
            gap: 2,
          }}
        >
          <Box sx={{ display: "flex", alignItems: "center", minWidth: 220 }}>
            <Typography
              variant="h6"
              sx={{ fontWeight: 800, letterSpacing: 0.2 }}
            >
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
            {showTabs && (
              <Tabs
                value={tabValue}
                onChange={handleTabChange}
                textColor="inherit"
                indicatorColor="secondary"
                centered
                sx={{
                  "& .MuiTabs-flexContainer": {
                    gap: 1.5,
                  },
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
            {isAuthenticated && (
              <>
                <Typography variant="body2" sx={{ opacity: 0.95 }}>
                  Eingeloggt als <b>{user?.username || "User"}</b>
                </Typography>

                <Button
                  variant="text"
                  onClick={logout}
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
            )}
          </Box>
        </Toolbar>
      </AppBar>

      <Outlet />
    </>
  );
}
