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
import { useAuth } from "../auth/useAuth";
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
                        <Typography variant="h6" sx={{ fontWeight: 800 }}>
                            {t("app.title")}
                        </Typography>
                    </Box>

                    <Box sx={{ flexGrow: 1, display: "flex", justifyContent: "center" }}>
                        {isAuthenticated && (
                            <Tabs
                                value={currentTab}
                                onChange={(_, value) => navigate(value)}
                                textColor="inherit"
                                indicatorColor="secondary"
                                centered
                            >
                                <Tab label={t("app.dashboard")} value="/" />
                                <Tab label={t("app.myPlants")} value="/meine-pflanzen" />
                                <Tab label={t("app.wiki")} value="/wiki" />
                            </Tabs>
                        )}
                    </Box>

                    <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
                        <Button
                            size="small"
                            variant={i18n.language === "de" ? "contained" : "outlined"}
                            onClick={() => changeLanguage("de")}
                        >
                            DE
                        </Button>
                        <Button
                            size="small"
                            variant={i18n.language === "en" ? "contained" : "outlined"}
                            onClick={() => changeLanguage("en")}
                        >
                            EN
                        </Button>

                        {isAuthenticated ? (
                            <>
                                <Typography variant="body2">
                                    {t("layout.loggedInAs")} <b>{user?.username}</b>
                                </Typography>
                                <Button onClick={handleLogout}>
                                    {t("layout.logout")}
                                </Button>
                            </>
                        ) : (
                            <>
                                <Button onClick={() => navigate("/login")}>
                                    {t("login.title")}
                                </Button>
                                <Button onClick={() => navigate("/register")}>
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
