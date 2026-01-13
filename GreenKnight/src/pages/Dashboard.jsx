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

  // Todos flatten
  const todos = (Array.isArray(plants) ? plants : []).flatMap((plant) =>
    (plant.todos || []).map((todo, idx) => ({
      ...todo,
      plantName: plant.name,
      plantId: plant._id,
      todoIndex: idx,
    }))
  );

  const toggleTodo = async (todo) => {
    try {
      const res = await fetch(
        `/api/plants/${todo.plantId}/todos/${todo.todoIndex}`,
        {
          method: "PUT",
          headers: {
            ...authHeader,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ done: !todo.done }),
        }
      );

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

  return (
    <Stack spacing={2} sx={{ p: 2 }}>
      <Typography variant="h4" gutterBottom>
        {t("dashboard.title", "Dashboard")}
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

      {todos.length === 0 && !error && (
        <Typography variant="body1">
          {t("dashboard.noTodos", "Keine To-Dos vorhanden.")}
        </Typography>
      )}

      {todos.map((todo) => {
        const label = formatTodoLabel(todo);

        const computedNextDueAt = (() => {
          // 1) Wenn Backend nextDueAt liefert -> verwenden
          if (todo?.nextDueAt) return new Date(todo.nextDueAt);

          // 2) Sonst aus Intervall berechnen
          const every = Number(todo?.repeatEvery);
          const unit = todo?.repeatUnit;
          if (!every || !(unit === "day" || unit === "month")) return null;

          // Basis: lastDoneAt -> sonst createdAt -> sonst "jetzt"
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
        const remainingMs = hasTimer ? computedNextDueAt.getTime() - now : null;

        return (
          <Card key={`${todo.plantId}-${todo.todoIndex}`}>
            <CardContent>
              <FormControlLabel
                control={
                  <Checkbox
                    checked={!!todo.done}
                    onChange={() => toggleTodo(todo)}
                  />
                }
                label={
                  <Box>
                    <Typography variant="body1">
                      {label}{" "}
                      <Typography component="span" variant="body2">
                        ({todo.plantName})
                      </Typography>
                    </Typography>

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
            </CardContent>
          </Card>
        );
      })}
    </Stack>
  );
}
