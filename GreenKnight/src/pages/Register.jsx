// src/pages/Register.jsx
import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';
import { Box, TextField, Button, Typography, Paper } from '@mui/material';

export default function Register() {
  const { register, error } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ username: '', email: '', password: '' });
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
      navigate('/login');
    } catch (err) {
      setLocalError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Box sx={{ display: 'flex', justifyContent: 'center', mt: 8 }}>
      <Paper sx={{ p: 4, maxWidth: 400, width: '100%' }}>
        <Typography variant="h5" gutterBottom>
          Registrieren
        </Typography>
        <form onSubmit={handleSubmit}>
          <TextField
            margin="normal"
            fullWidth
            label="Username"
            name="username"
            value={form.username}
            onChange={handleChange}
          />
          <TextField
            margin="normal"
            fullWidth
            label="E-Mail (optional)"
            name="email"
            value={form.email}
            onChange={handleChange}
          />
          <TextField
            margin="normal"
            fullWidth
            label="Passwort"
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
            Registrieren
          </Button>
        </form>
        <Typography variant="body2" sx={{ mt: 2 }}>
          Schon einen Account? <Link to="/login">Zum Login</Link>
        </Typography>
      </Paper>
    </Box>
  );
}
