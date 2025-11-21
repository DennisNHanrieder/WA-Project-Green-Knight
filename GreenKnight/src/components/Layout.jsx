// src/components/Layout.jsx (Ausschnitt)
import React from 'react';
import { Outlet, useNavigate, useLocation, Link } from 'react-router-dom';
import { AppBar, Toolbar, Typography, Button, Tabs, Tab } from '@mui/material';
import { useAuth } from '../auth/AuthContext';

export default function Layout() {
  const { isAuthenticated, user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const currentTab =
    location.pathname === '/'
      ? '/'
      : location.pathname.startsWith('/meine-pflanzen')
      ? '/meine-pflanzen'
      : location.pathname.startsWith('/wiki')
      ? '/wiki'
      : false;

  return (
    <>
      <AppBar position="static">
        <Toolbar>
          <Typography variant="h6" sx={{ flexGrow: 1 }}>
            Green Knight
          </Typography>

          {isAuthenticated && (
            <>
              <Typography variant="body2" sx={{ mr: 2 }}>
                Eingeloggt als {user.username}
              </Typography>
              <Button color="inherit" onClick={handleLogout}>
                Logout
              </Button>
            </>
          )}

          {!isAuthenticated && (
            <>
              <Button color="inherit" onClick={() => navigate('/login')}>
                Login
              </Button>
              <Button color="inherit" onClick={() => navigate('/register')}>
                Registrieren
              </Button>
            </>
          )}
        </Toolbar>
      </AppBar>

      {isAuthenticated && (
        <Tabs
          value={currentTab}
          onChange={(_, value) => navigate(value)}
          indicatorColor="secondary"
          textColor="inherit"
        >
          <Tab label="Dashboard" value="/" />
          <Tab label="Meine Pflanzen" value="/meine-pflanzen" />
          <Tab label="Wiki" value="/wiki" />
        </Tabs>
      )}

      <Outlet />
    </>
  );
}
