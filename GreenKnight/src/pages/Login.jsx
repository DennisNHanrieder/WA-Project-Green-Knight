import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../auth/useAuth";
import { Box, TextField, Button, Typography, Paper } from "@mui/material";
import { useTranslation } from "react-i18next";

export default function Login() {
  const { t } = useTranslation();
  const { login, error } = useAuth();
  const navigate = useNavigate();

  const [form, setForm] = useState({ username: "", password: "" });
  const [submitting, setSubmitting] = useState(false);
  const [localError, setLocalError] = useState(null);

  const handleChange = (e) => {
    setForm((f) => ({ ...f, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setLocalError(null);

    try {
      await login(form.username, form.password);
      navigate("/");
    } catch (err) {
      // err.message ist ein i18n-KEY (z. B. "errors.invalidCredentials")
      setLocalError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const errorKey = localError || error;

  return (
      <Box sx={{ display: "flex", justifyContent: "center", mt: 8 }}>
        <Paper sx={{ p: 4, maxWidth: 400, width: "100%" }}>
          <Typography variant="h5" gutterBottom>
            {t("login.title")}
          </Typography>

          <form onSubmit={handleSubmit}>
            <TextField
                margin="normal"
                fullWidth
                label={t("login.username")}
                name="username"
                value={form.username}
                onChange={handleChange}
                autoComplete="username"
            />

            <TextField
                margin="normal"
                fullWidth
                label={t("login.password")}
                type="password"
                name="password"
                value={form.password}
                onChange={handleChange}
                autoComplete="current-password"
            />

            {errorKey && (
                <Typography color="error" variant="body2" sx={{ mt: 1 }}>
                  {t(errorKey)}
                </Typography>
            )}

            <Button
                type="submit"
                variant="contained"
                fullWidth
                sx={{ mt: 2 }}
                disabled={submitting}
            >
              {t("login.submit")}
            </Button>
          </form>

          <Typography variant="body2" sx={{ mt: 2 }}>
            {t("login.noAccount")}{" "}
            <Link to="/register">{t("login.register")}</Link>
          </Typography>
        </Paper>
      </Box>
  );
}
