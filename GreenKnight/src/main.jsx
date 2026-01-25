import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { createBrowserRouter, RouterProvider } from "react-router-dom";
import { ThemeProvider, CssBaseline, createTheme } from "@mui/material";

import AppLayout from "./components/Layout";
import Dashboard from "./pages/Dashboard";
import MeinePflanzen from "./pages/MeinePflanzen";
import Wiki from "./pages/Wiki";
import WikiDetail from "./pages/WikiDetail";
import Login from "./pages/Login";
import Register from "./pages/Register";
import ProtectedRoute from "./auth/ProtectedRoute";
import { AuthProvider } from "./auth/AuthContext";

import "./i18n/i18n";
import "./index.css";

/* ---------- Router ---------- */
const router = createBrowserRouter([
  {
    path: "/",
    element: <AppLayout />,
    children: [
      { path: "login", element: <Login /> },
      { path: "register", element: <Register /> },
      { path: "unauthorized", element: <div>Keine Berechtigung</div> },

      {
        element: <ProtectedRoute />,
        children: [
          { index: true, element: <Dashboard /> },
          { path: "meine-pflanzen", element: <MeinePflanzen /> },
          { path: "wiki", element: <Wiki /> },
          { path: "wiki/:id", element: <WikiDetail /> },
        ],
      },
    ],
  },
]);

/* ---------- Theme ---------- */
const theme = createTheme();

/* ---------- Render ---------- */
createRoot(document.getElementById("root")).render(
    <StrictMode>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <AuthProvider>
          <RouterProvider router={router} />
        </AuthProvider>
      </ThemeProvider>
    </StrictMode>
);
