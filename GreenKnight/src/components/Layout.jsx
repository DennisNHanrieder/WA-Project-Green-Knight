import { Outlet, Link, useLocation } from "react-router-dom";
import { AppBar, Toolbar, Typography, Tabs, Tab, Box } from "@mui/material";
import { useState, useEffect } from "react";

export default function Layout() {
  const location = useLocation();
  const [value, setValue] = useState(0);

  // Aktiven Tab je nach Route setzen
  useEffect(() => {
    if (location.pathname === "/") setValue(0);
    else if (location.pathname === "/meine-pflanzen") setValue(1);
    else if (location.pathname === "/wiki") setValue(2);
  }, [location.pathname]);

  return (
    <>
      <AppBar position="static">
        {/* Toolbar mit zwei Ebenen: Logo + zentrierte Tabs */}
        <Toolbar sx={{ position: "relative", justifyContent: "center" }}>
          {/* Logo bleibt links fixiert */}
          <Typography
            variant="h6"
            sx={{
              position: "absolute",
              left: 16,
              top: "50%",
              transform: "translateY(-50%)",
            }}
          >
            🌿 Green Knight
          </Typography>

          {/* Tabs wirklich zentriert */}
          <Tabs
            value={value}
            textColor="inherit"
            indicatorColor="secondary"
            centered
          >
            <Tab label="Dashboard" component={Link} to="/" />
            <Tab label="Meine Pflanzen" component={Link} to="/meine-pflanzen" />
            <Tab label="Wiki" component={Link} to="/wiki" />
          </Tabs>
        </Toolbar>
      </AppBar>

      <Box sx={{ p: 3 }}>
        <Outlet />
      </Box>
    </>
  );
}
