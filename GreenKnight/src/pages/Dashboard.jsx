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
  Box,
  Divider,
} from "@mui/material";
import { useTranslation } from "react-i18next";
import { useAuth } from "../auth/AuthContext";

function formatTodoLabel(todo) {
  const task = todo?.task ?? "";
  if (todo?.repeatEvery && todo?.repeatUnit) {
    const unitLabel = todo.repeatUnit === "day" ? "Tag" : "Monat";
    return `${task} ${todo.repeatEvery}x ${unitLabel}`;
  }
  return task;
}

function formatRemaining(ms) {
  if (ms <= 0) return "fällig";

  const totalSec = Math.floor(ms / 1000);
  const sec = totalSec % 60;
  const totalMin = Math.floor(totalSec / 60);
  const min = totalMin % 60;
  const totalH = Math.floor(totalMin / 60);
  const h = totalH % 24;
  const d = Math.floor(totalH / 24);

  if (d > 0) return `${d}d ${h}h`;
  if (h > 0) return `${h}h ${min}m`;
  return `${min}m ${sec}s`;
}

export default function Dashboard() {
  const { t } = useTranslation();
  const { accessToken } = useAuth();

  const [plants, setPlants] = useState([]);
  const [error, setError] = useState(null);

  // Switch / Timer
  const [showTimers, setShowTimers] = useState(false);
  const [now, setNow] = useState(Date.now());

  const authHeader = useMemo(
    () => ({ Authorization: `Bearer ${accessToken}` }),
    [accessToken]
  );

  const loadPlants = async () => {
    if (!accessToken) return;

    try {
      const res = await fetch("/api/plants", { headers: authHeader });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || `Fehler ${res.status}`);
      }

      const data = await res.json();
      setPlants(Array.isArray(data) ? data : []);
      setError(null);
    } catch (err) {
      console.error(err);
      setError(err.message);
    }
  };

  useEffect(() => {
    loadPlants();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [accessToken]);

  // Live tick nur wenn Switch an
  useEffect(() => {
    if (!showTimers) return;
    const tmr = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(tmr);
  }, [showTimers]);

  // Toggle Todo done
  const toggleTodo = async (plantId, todoIndex, currentDone) => {
    try {
      const res = await fetch(`/api/plants/${plantId}/todos/${todoIndex}`, {
        method: "PUT",
        headers: {
          ...authHeader,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ done: !currentDone }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || `Fehler ${res.status}`);
      }

      await loadPlants();
    } catch (err) {
      console.error(err);
      setError(err.message);
    }
  };

  // Haben wir überhaupt Todos?
  const totalTodos = (plants || []).reduce(
    (sum, p) => sum + ((p.todos || []).length || 0),
    0
  );

  return (
    <Stack spacing={2} sx={{ p: 2 }}>
      <Typography variant="h4" gutterBottom>
        {/* du hattest "Deine heutigen To-Dos" im UI */}
        {t("dashboard.title", "Deine heutigen To-Dos")}
      </Typography>

      {error && (
        <Typography color="error" variant="body2">
          {error}
        </Typography>
      )}

      <FormControlLabel
        control={
          <Switch
            checked={showTimers}
            onChange={(e) => setShowTimers(e.target.checked)}
          />
        }
        label="Wasser-Timer anzeigen"
      />

      {totalTodos === 0 && !error && (
        <Typography variant="body1">
          {t("dashboard.noTodos", "Keine To-Dos vorhanden.")}
        </Typography>
      )}

      {/* ✅ Gruppiert: eine Card pro Pflanze */}
      {(plants || [])
        .filter((p) => (p.todos || []).length > 0)
        .map((plant) => (
          <Card key={plant._id}>
            <CardContent>
              <Typography variant="h6" sx={{ mb: 1 }}>
                {plant.name}
              </Typography>

              <Stack spacing={1}>
                {(plant.todos || []).map((todo, idx) => {
                  const label = formatTodoLabel(todo);

                  // ✅ Timer-Fallback: nextDueAt ODER berechnet aus lastDoneAt/createdAt + Intervall
                  const computedNextDueAt = (() => {
                    if (todo?.nextDueAt) return new Date(todo.nextDueAt);

                    const every = Number(todo?.repeatEvery);
                    const unit = todo?.repeatUnit;
                    if (!every || !(unit === "day" || unit === "month"))
                      return null;

                    const base =
                      (todo?.lastDoneAt && new Date(todo.lastDoneAt)) ||
                      (todo?.createdAt && new Date(todo.createdAt)) ||
                      new Date();

                    const d = new Date(base);
                    if (unit === "day") d.setDate(d.getDate() + every);
                    if (unit === "month") d.setMonth(d.getMonth() + every);
                    return d;
                  })();

                  const hasTimer = !!computedNextDueAt;
                  const remainingMs = hasTimer
                    ? computedNextDueAt.getTime() - now
                    : null;

                  return (
                    <Box key={idx}>
                      <FormControlLabel
                        control={
                          <Checkbox
                            checked={!!todo.done}
                            onChange={() =>
                              toggleTodo(plant._id, idx, !!todo.done)
                            }
                          />
                        }
                        label={
                          <Box>
                            <Typography variant="body1">{label}</Typography>

                            {showTimers && (
                              <Typography variant="body2" color="green">
                                {hasTimer
                                  ? `⏳ ${formatRemaining(remainingMs)}`
                                  : "⏳ -"}
                              </Typography>
                            )}
                          </Box>
                        }
                      />
                      {/* Trennlinie zwischen Todos, aber nicht nach dem letzten */}
                      {idx < (plant.todos || []).length - 1 && (
                        <Divider sx={{ my: 0.5 }} />
                      )}
                    </Box>
                  );
                })}
              </Stack>
            </CardContent>
          </Card>
        ))}
    </Stack>
  );
}
