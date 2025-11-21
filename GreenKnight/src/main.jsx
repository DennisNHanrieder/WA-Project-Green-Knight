// src/main.jsx
import React from 'react';
import ReactDOM from 'react-dom/client';
import {
  createBrowserRouter,
  RouterProvider,
} from 'react-router-dom';

import AppLayout from './components/Layout';
import Dashboard from './pages/Dashboard';
import MeinePflanzen from './pages/MeinePflanzen';
import Wiki from './pages/Wiki';
import Login from './pages/Login';
import Register from './pages/Register';
import ProtectedRoute from './auth/ProtectedRoute';
import { AuthProvider } from './auth/AuthContext';

import './i18n/i18n';
import { ThemeProvider, CssBaseline } from '@mui/material';
import theme from './theme'; // falls du eins hast; sonst weglassen

const router = createBrowserRouter([
  {
    path: '/',
    element: <AppLayout />,
    children: [
      // Public routes
      { path: 'login', element: <Login /> },
      { path: 'register', element: <Register /> },
      {
        path: 'unauthorized',
        element: <div>Keine Berechtigung</div>,
      },

      // Protected routes
      {
        element: <ProtectedRoute />, // alle Child-Routen sind geschützt
        children: [
          { index: true, element: <Dashboard /> },
          { path: 'meine-pflanzen', element: <MeinePflanzen /> },
          { path: 'wiki', element: <Wiki /> },
        ],
      },
    ],
  },
]);

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
