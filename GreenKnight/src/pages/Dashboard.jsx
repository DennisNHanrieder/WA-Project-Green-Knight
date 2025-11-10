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

export default function Dashboard() {
  const { t } = useTranslation();
  const [plants, setPlants] = useState([]);

  // Daten abrufen
  const loadData = () => {
    fetch("/api/plants")
      .then((res) => res.json())
      .then((data) => setPlants(data))
      .catch((err) => console.error("Fehler beim Laden:", err));
  };

  useEffect(() => {
    loadData();
  }, []);

  // Checkbox ändern
  const handleToggle = (plantId, todoIndex, newValue) => {
    fetch(`/api/plants/${plantId}/todos/${todoIndex}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ done: newValue }),
    })
      .then((res) => {
        if (!res.ok) throw new Error("Update fehlgeschlagen");
        loadData(); // neu laden, um UI zu aktualisieren
      })
      .catch((err) => console.error(err));
  };

  // Alle Todos zusammensetzen
  const allTodos = plants.flatMap((plant) =>
    plant.todos.map((todo, index) => ({
      ...todo,
      plantName: plant.name,
      plantId: plant._id,
      index,
    }))
  );

  return (
    <Stack spacing={2}>
      <Typography variant="h5">{t("dashboard.title")}</Typography>
      <Typography variant="body1">{t("dashboard.subtitle")}</Typography>

      <Typography variant="h6" sx={{ mt: 2 }}>
        🌱 {t("dashboard.todosTitle", { defaultValue: "To-Dos" })}
      </Typography>

      {allTodos.map((todo) => (
        <Card key={`${todo.plantId}-${todo.index}`} variant="outlined">
          <CardContent>
            <FormControlLabel
              control={
                <Checkbox
                  checked={todo.done}
                  onChange={(e) =>
                    handleToggle(todo.plantId, todo.index, e.target.checked)
                  }
                />
              }
              label={
                <Typography variant="body1">
                  {todo.task} <Typography variant="body2">{todo.plantName}</Typography>
                </Typography>
              }
            />
          </CardContent>
        </Card>
      ))}
    </Stack>
  );
}
