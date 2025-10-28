import { Outlet, Link, useLocation } from "react-router-dom";
import { AppBar, Toolbar, Typography, Tabs, Tab, Box, Button } from "@mui/material";
import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";

export default function Layout() {
  const location = useLocation();
  const { t, i18n } = useTranslation();
  const [value, setValue] = useState(0);

  useEffect(() => {
    if (location.pathname === "/") setValue(0);
    else if (location.pathname === "/meine-pflanzen") setValue(1);
    else if (location.pathname === "/wiki") setValue(2);
  }, [location.pathname]);

  const toggleLanguage = () => {
    i18n.changeLanguage(i18n.language === "de" ? "en" : "de");
  };

  return (
    <>
      <AppBar position="static">
        <Toolbar sx={{ position: "relative", justifyContent: "center" }}>
          <Typography
            variant="h6"
            sx={{
              position: "absolute",
              left: 16,
              top: "50%",
              transform: "translateY(-50%)",
            }}
          >
            {t("app.title")}
          </Typography>

          <Tabs value={value} textColor="inherit" indicatorColor="secondary" centered>
            <Tab label={t("app.dashboard")} component={Link} to="/" />
            <Tab label={t("app.myPlants")} component={Link} to="/meine-pflanzen" />
            <Tab label={t("app.wiki")} component={Link} to="/wiki" />
          </Tabs>

          <Button
            color="inherit"
            sx={{
              position: "absolute",
              right: 16,
              top: "50%",
              transform: "translateY(-50%)",
            }}
            onClick={toggleLanguage}
          >
            {i18n.language === "de" ? "EN" : "DE"}
          </Button>
        </Toolbar>
      </AppBar>

      <Box sx={{ p: 3 }}>
        <Outlet />
      </Box>
    </>
  );
}
