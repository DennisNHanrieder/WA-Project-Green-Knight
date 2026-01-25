// src/pages/Register.jsx
import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../auth/useAuth";
import { Box, TextField, Button, Typography, Paper } from "@mui/material";
import { useTranslation } from "react-i18next";

export default function Register() {
  const { t } = useTranslation();
  const { register, error } = useAuth();
  const navigate = useNavigate();

  const [form, setForm] = useState({
    username: "",
    email: "",
    password: "",
  });
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
      await register(form);
      navigate("/login");
    } catch (err) {
      setLocalError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
      <Box sx={{ display: "flex", justifyContent: "center", mt: 8 }}>
        <Paper sx={{ p: 4, maxWidth: 400, width: "100%" }}>
          <Typography variant="h5" gutterBottom>
            {t("register.title")}
          </Typography>

          <form onSubmit={handleSubmit}>
            <TextField
                margin="normal"
                fullWidth
                label={t("register.username")}
                name="username"
                value={form.username}
                onChange={handleChange}
            />

            <TextField
                margin="normal"
                fullWidth
                label={t("register.email")}
                name="email"
                value={form.email}
                onChange={handleChange}
            />

            <TextField
                margin="normal"
                fullWidth
                label={t("register.password")}
                type="password"
                name="password"
                value={form.password}
                onChange={handleChange}
            />

            {(localError || error) && (
                <Typography color="error" variant="body2" sx={{ mt: 1 }}>
                  {localError || error}
                </Typography>
            )}

            <Button
                type="submit"
                variant="contained"
                fullWidth
                sx={{ mt: 2 }}
                disabled={submitting}
            >
              {t("register.submit")}
            </Button>
          </form>

          <Typography variant="body2" sx={{ mt: 2 }}>
            {t("register.hasAccount")}{" "}
            <Link to="/login">{t("register.login")}</Link>
          </Typography>
        </Paper>
      </Box>
  );
}
