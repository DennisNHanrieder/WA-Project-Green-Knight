import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { createBrowserRouter, RouterProvider } from "react-router-dom";
import { CssBaseline, ThemeProvider, createTheme } from "@mui/material";
import Layout from "./components/Layout.jsx";
import Dashboard from "./pages/Dashboard.jsx";
import MeinePflanzen from "./pages/MeinePflanzen.jsx";
import Wiki from "./pages/Wiki.jsx";

const theme = createTheme({
  palette: {
    primary: { main: "#388E3C" }, // sattes Grün 🌿
    secondary: { main: "#81C784" },
  },
  typography: {
    fontFamily: "Roboto, sans-serif",
  },
});

const router = createBrowserRouter([
  {
    path: "/",
    element: <Layout />,
    errorElement: <h2>404 – Seite nicht gefunden</h2>,
    children: [
      { index: true, element: <Dashboard /> },
      { path: "meine-pflanzen", element: <MeinePflanzen /> },
      { path: "wiki", element: <Wiki /> },
    ],
  },
]);

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <RouterProvider router={router} />
    </ThemeProvider>
  </StrictMode>
);
