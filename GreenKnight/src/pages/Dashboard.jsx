// src/pages/Dashboard.jsx
import { useEffect, useMemo, useState } from "react";
import {
  Typography,
  Stack,
  Card,
  CardContent,
  Checkbox,
  FormControlLabel,
  Switch,
  Container,
  Divider,
  Box,
} from "@mui/material";
import { useTranslation } from "react-i18next";
import { useAuth } from "../auth/AuthContext";

export default function Dashboard() {
  const { t } = useTranslation();
  const { accessToken } = useAuth();

  const [plants, setPlants] = useState([]);
  const [error, setError] = useState(null);

  // Live-Timer Toggle
  const [showTimers, setShowTimers] = useState(false);

  // “Tick” für Live Timer (1x pro Sekunde)
  const [now, setNow] = useState(Date.now());
  useEffect(() => {
    if (!showTimers) return;
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, [showTimers]);

  // Daten abrufen
  useEffect(() => {
    if (!accessToken) return;

    const loadData = async () => {
      try {
        const res = await fetch("/api/plants", {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        });

        if (!res.ok) {
          const data = await res.json().catch(() => ({}));
          throw new Error(data.error || `Fehler ${res.status}`);
        }

        const data = await res.json();
        if (!Array.isArray(data)) {
          throw new Error("Unerwartetes Antwortformat");
        }

        setPlants(data);
        setError(null);
      } catch (err) {
        console.error(err);
        setError(err.message);
      }
    };

    loadData();
  }, [accessToken]);

  // Format Remaining helper
  const formatRemaining = (ms) => {
    if (ms == null || ms <= 0) return "-";
    const totalMinutes = Math.floor(ms / 60000);
    const days = Math.floor(totalMinutes / (60 * 24));
    const hours = Math.floor((totalMinutes % (60 * 24)) / 60);
    const minutes = totalMinutes % 60;

    if (days > 0) return `${days}d ${hours}h`;
    if (hours > 0) return `${hours}h ${minutes}m`;
    return `${minutes}m`;
  };

  // (Optional) nextDueAt / fallback: computed
  const getNextDueAt = (todo) => {
    if (!todo) return null;

    // 1) wenn Backend nextDueAt liefert:
    if (todo.nextDueAt) return new Date(todo.nextDueAt);

    // 2) fallback: lastDoneAt / createdAt + interval
    const every = Number(todo.repeatEvery);
    const unit = todo.repeatUnit;
    if (!every || !(unit === "day" || unit === "month")) return null;

    const base = todo.lastDoneAt
        ? new Date(todo.lastDoneAt)
        : todo.createdAt
            ? new Date(todo.createdAt)
            : null;

    if (!base || isNaN(base.getTime())) return null;

    const d = new Date(base);
    if (unit === "day") d.setDate(d.getDate() + every);
    if (unit === "month") d.setMonth(d.getMonth() + every);
    return d;
  };

  // Gruppiert: alle Todos je Pflanze zusammen
  const plantsWithTodos = useMemo(() => {
    return (Array.isArray(plants) ? plants : [])
        .filter((p) => (p.todos || []).length > 0)
        .map((p) => ({
          _id: p._id,
          name: p.name,
          todos: p.todos || [],
        }));
  }, [plants]);

  const totalTodos = plantsWithTodos.reduce(
      (acc, p) => acc + p.todos.length,
      0
  );

  return (
      <Container maxWidth="md">
        <Stack spacing={2} sx={{ py: 3 }}>
          <Typography variant="h4" gutterBottom>
            {t("dashboard.title")}
          </Typography>

          {/* Toggle */}
          <Box sx={{ display: "inline-flex", alignItems: "center" }}>
            <FormControlLabel
                sx={{ m: 0 }}
                control={
                  <Switch
                      checked={showTimers}
                      onChange={(e) => setShowTimers(e.target.checked)}
                  />
                }
                label={t("dashboard.showTimer")}
            />
          </Box>

          {error && (
              <Typography color="error" variant="body2">
                {error}
              </Typography>
          )}

          {totalTodos === 0 && !error && (
              <Typography variant="body1">
                {t("dashboard.noTodos")}
              </Typography>
          )}

          {/* Pflanzenweise anzeigen */}
          {plantsWithTodos.map((plant) => (
              <Card key={plant._id}>
                <CardContent>
                  <Typography variant="h6" sx={{ mb: 1 }}>
                    {plant.name}
                  </Typography>

                  <Stack spacing={1}>
                    {plant.todos.map((todo, idx) => {
                      const nextDueAt = getNextDueAt(todo);
                      const hasTimer = !!nextDueAt;
                      const remainingMs = hasTimer
                          ? nextDueAt.getTime() - now
                          : null;

                      return (
                          <Box key={`${plant._id}-${idx}`}>
                            <FormControlLabel
                                control={<Checkbox checked={!!todo.done} />}
                                label={
                                  <Typography variant="body1">
                                    {todo.task}
                                  </Typography>
                                }
                            />

                            {showTimers && (
                                <Typography
                                    variant="body2"
                                    sx={{ ml: 4 }}
                                    color="green"
                                >
                                  {hasTimer
                                      ? `⏳ ${formatRemaining(remainingMs)}`
                                      : "⏳ -"}
                                </Typography>
                            )}

                            {idx < plant.todos.length - 1 && (
                                <Divider sx={{ mt: 1 }} />
                            )}
                          </Box>
                      );
                    })}
                  </Stack>
                </CardContent>
              </Card>
          ))}
        </Stack>
      </Container>
  );
}
