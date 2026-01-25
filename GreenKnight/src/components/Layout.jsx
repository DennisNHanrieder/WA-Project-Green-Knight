// src/components/Layout.jsx
import React from "react";
import { Outlet, useNavigate, useLocation } from "react-router-dom";
import {
    AppBar,
    Toolbar,
    Typography,
    Button,
    Tabs,
    Tab,
    Box,
} from "@mui/material";
import { useAuth } from "../auth/AuthContext";
import { useTranslation } from "react-i18next";

export default function Layout() {
    const { t, i18n } = useTranslation();
    const { isAuthenticated, user, logout } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();

    const handleLogout = () => {
        logout();
        navigate("/login");
    };

    const changeLanguage = (lng) => {
        i18n.changeLanguage(lng);
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
                    {/* App Title */}
                    <Box sx={{ display: "flex", alignItems: "center", minWidth: 220 }}>
                        <Typography variant="h6" sx={{ fontWeight: 800, letterSpacing: 0.2 }}>
                            {t("app.title")}
                        </Typography>
                    </Box>

                    {/* Navigation Tabs */}
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
                                <Tab label={t("app.dashboard")} value="/" />
                                <Tab
                                    label={t("app.myPlants")}
                                    value="/meine-pflanzen"
                                />
                                <Tab label={t("app.wiki")} value="/wiki" />
                            </Tabs>
                        )}
                    </Box>

                    {/* Right side: Language + Auth */}
                    <Box
                        sx={{
                            minWidth: 300,
                            display: "flex",
                            justifyContent: "flex-end",
                            alignItems: "center",
                            gap: 1.5,
                        }}
                    >
                        {/* Language Switcher */}
                        <Box sx={{ display: "flex", gap: 0.5 }}>
                            <Button
                                size="small"
                                variant={i18n.language === "de" ? "contained" : "outlined"}
                                onClick={() => changeLanguage("de")}
                                sx={{ minWidth: 44 }}
                            >
                                DE
                            </Button>
                            <Button
                                size="small"
                                variant={i18n.language === "en" ? "contained" : "outlined"}
                                onClick={() => changeLanguage("en")}
                                sx={{ minWidth: 44 }}
                            >
                                EN
                            </Button>
                        </Box>

                        {/* Auth */}
                        {isAuthenticated ? (
                            <>
                                <Typography variant="body2" sx={{ opacity: 0.95 }}>
                                    {t("layout.loggedInAs")}{" "}
                                    <b>{user?.username}</b>
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
                                    {t("layout.logout")}
                                </Button>
                            </>
                        ) : (
                            <>
                                <Button color="inherit" onClick={() => navigate("/login")}>
                                    {t("login.title")}
                                </Button>
                                <Button color="inherit" onClick={() => navigate("/register")}>
                                    {t("register.title")}
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
