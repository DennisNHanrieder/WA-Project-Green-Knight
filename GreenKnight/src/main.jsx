// src/main.jsx
import React from 'react';
import ReactDOM from 'react-dom/client';
import { createBrowserRouter, RouterProvider } from 'react-router-dom';
import { ThemeProvider, CssBaseline, createTheme } from '@mui/material';

import AppLayout from './components/Layout';
import Dashboard from './pages/Dashboard';
import MeinePflanzen from './pages/MeinePflanzen';
import Wiki from './pages/Wiki';
import Login from './pages/Login';
import Register from './pages/Register';
import ProtectedRoute from './auth/ProtectedRoute';
import { AuthProvider } from './auth/AuthContext';
import WikiDetail from "./pages/WikiDetail";

import './i18n/i18n';
import './index.css';

// ---------- Router-Konfiguration ----------
const router = createBrowserRouter([
  {
    path: '/',
    element: <AppLayout />,
    children: [
      // öffentliche Routen
      { path: 'login', element: <Login /> },
      { path: 'register', element: <Register /> },
      {
        path: 'unauthorized',
        element: <div>Keine Berechtigung</div>,
      },

      // geschützte Routen
      {
        element: <ProtectedRoute />,
        children: [
          { index: true, element: <Dashboard /> },
          { path: 'meine-pflanzen', element: <MeinePflanzen /> },
          { path: 'wiki', element: <Wiki /> },
          { path: "/wiki/:id", element: <WikiDetail />},
        ],
      },
    ],
  },
]);

// sehr simples MUI-Theme
const theme = createTheme();

// ---------- Render ----------
ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <AuthProvider>
        <RouterProvider router={router} />
      </AuthProvider>
    </ThemeProvider>
  </React.StrictMode>
);
