// src/pages/Dashboard.jsx
import { useEffect, useState } from "react";
import {
  Typography,
  Stack,
  Card,
  CardContent,
  Checkbox,
  FormControlLabel,
} from "@mui/material";
import { useTranslation } from "react-i18next";
import { useAuth } from "../auth/AuthContext";

export default function Dashboard() {
  const { t } = useTranslation();
  const { accessToken } = useAuth();
  const [plants, setPlants] = useState([]);
  const [error, setError] = useState(null);

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

  // Todos aller Pflanzen flach zusammenbauen
  const todos = (Array.isArray(plants) ? plants : []).flatMap((plant) =>
    (plant.todos || []).map((todo) => ({
      ...todo,
      plantName: plant.name,
      plantId: plant._id,
    }))
  );

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

      {todos.length === 0 && !error && (
        <Typography variant="body1">
          {t("dashboard.noTodos", "Keine To-Dos vorhanden.")}
        </Typography>
      )}

      {todos.map((todo, idx) => (
        <Card key={`${todo.plantId}-${idx}`}>
          <CardContent>
            <FormControlLabel
              control={<Checkbox checked={!!todo.done} disabled />}
              label={
                <Typography variant="body1">
                  {todo.task}{" "}
                  <Typography component="span" variant="body2">
                    ({todo.plantName})
                  </Typography>
                </Typography>
              }
            />
          </CardContent>
        </Card>
      ))}
    </Stack>
  );
}
