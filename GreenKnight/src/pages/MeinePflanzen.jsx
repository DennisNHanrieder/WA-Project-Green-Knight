import { useEffect, useState } from "react";
import {
  Typography,
  Stack,
  Card,
  CardContent,
  Checkbox,
  FormControlLabel,
  TextField,
  Button,
} from "@mui/material";

export default function MeinePflanzen() {
  const [plants, setPlants] = useState([]);
  const [newPlantName, setNewPlantName] = useState("");
  const [newTodos, setNewTodos] = useState({});

  const loadPlants = () => {
    fetch("/api/plants")
      .then((res) => res.json())
      .then((data) => setPlants(data))
      .catch((err) => console.error("Fehler beim Laden:", err));
  };

  useEffect(() => {
    loadPlants();
  }, []);

  const handleToggle = (plantId, todoIndex, newValue) => {
    fetch(`/api/plants/${plantId}/todos/${todoIndex}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ done: newValue }),
    })
      .then((res) => {
        if (!res.ok) throw new Error("Update fehlgeschlagen");
        setPlants((prev) =>
          prev.map((p) =>
            p._id === plantId
              ? {
                  ...p,
                  todos: p.todos.map((todo, i) =>
                    i === todoIndex ? { ...todo, done: newValue } : todo
                  ),
                }
              : p
          )
        );
      })
      .catch((err) => console.error(err));
  };

  const handleAddPlant = () => {
    if (newPlantName.trim() === "") return;

    fetch("/api/plants", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: newPlantName }),
    })
      .then((res) => res.json())
      .then((newPlant) => {
        setPlants((prev) => [...prev, newPlant]);
        setNewPlantName("");
      })
      .catch((err) => console.error("Fehler beim Hinzufügen:", err));
  };

  const handleAddTodo = (plantId) => {
    const text = newTodos[plantId]?.trim();
    if (!text) return;

    fetch(`/api/plants/${plantId}/todos`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ task: text, done: false }),
    })
      .then((res) => res.json())
      .then((updatedPlant) => {
        setPlants((prev) =>
          prev.map((p) => (p._id === plantId ? updatedPlant : p))
        );
        setNewTodos((prev) => ({ ...prev, [plantId]: "" }));
      })
      .catch((err) => console.error("Fehler beim Hinzufügen des To-Dos:", err));
  };

  // ❌ Pflanze löschen
  const handleDeletePlant = (plantId) => {
    if (!window.confirm("Diese Pflanze wirklich löschen?")) return;

    fetch(`/api/plants/${plantId}`, { method: "DELETE" })
      .then((res) => {
        if (res.status === 204) {
          setPlants((prev) => prev.filter((p) => p._id !== plantId));
        } else {
          console.error("Fehler beim Löschen");
        }
      })
      .catch((err) => console.error("Fehler beim Löschen:", err));
  };

  //ToDo löschen
  const handleDeleteTodo = (plantId, todoIndex) => {
  if (!window.confirm("Dieses To-Do wirklich löschen?")) return;

  fetch(`/api/plants/${plantId}/todos/${todoIndex}`, { method: "DELETE" })
    .then((res) => {
      if (res.status === 204) {
        setPlants((prev) =>
          prev.map((p) =>
            p._id === plantId
              ? {
                  ...p,
                  todos: p.todos.filter((_, i) => i !== todoIndex),
                }
              : p
          )
        );
      } else {
        console.error("Fehler beim Löschen");
      }
    })
    .catch((err) => console.error("Fehler beim Löschen:", err));
};


  return (
    <Stack spacing={2}>
      <Typography variant="h5">🌿 Meine Pflanzen</Typography>

      {/* Neue Pflanze hinzufügen */}
      <Stack direction="row" spacing={1}>
        <TextField
          label="Neue Pflanze"
          variant="outlined"
          value={newPlantName}
          onChange={(e) => setNewPlantName(e.target.value)}
          fullWidth
        />
        <Button variant="contained" onClick={handleAddPlant}>
          Hinzufügen
        </Button>
      </Stack>

      {/* Pflanzenliste */}
      {plants.map((plant) => (
        <Card key={plant._id} variant="outlined">
          <CardContent>
            <Stack direction="row" justifyContent="space-between">
              <Typography variant="h6">{plant.name}</Typography>
              <Button
                variant="outlined"
                color="error"
                onClick={() => handleDeletePlant(plant._id)}
              >
                ❌ Löschen
              </Button>
            </Stack>

            {/* To-Do-Liste */}
            {plant.todos && plant.todos.length > 0 ? (
              <Stack spacing={1} sx={{ mt: 1 }}>
                {plant.todos.map((todo, index) => (
                <Stack
                  key={index}
                  direction="row"
                  alignItems="center"
                  justifyContent="space-between"
                >
                  <FormControlLabel
                    control={
                      <Checkbox
                        checked={todo.done}
                        onChange={(e) =>
                          handleToggle(plant._id, index, e.target.checked)
                        }
                      />
                    }
                    label={todo.task}
                  />
                  <Button
                    variant="outlined"
                    color="error"
                    size="small"
                    onClick={() => handleDeleteTodo(plant._id, index)}
                  >
                    🗑️
                  </Button>
                </Stack>
              ))}

              </Stack>
            ) : (
              <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                Keine Aufgaben vorhanden.
              </Typography>
            )}

            {/* Neues To-Do hinzufügen */}
            <Stack direction="row" spacing={1} sx={{ mt: 2 }}>
              <TextField
                label="Neues To-Do"
                variant="outlined"
                size="small"
                value={newTodos[plant._id] || ""}
                onChange={(e) =>
                  setNewTodos({ ...newTodos, [plant._id]: e.target.value })
                }
                fullWidth
              />
              <Button
                variant="contained"
                onClick={() => handleAddTodo(plant._id)}
              >
                ➕
              </Button>
            </Stack>
          </CardContent>
        </Card>
      ))}
    </Stack>
  );
}
