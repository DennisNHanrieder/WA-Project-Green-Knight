// src/pages/MeinePflanzen.jsx
import { useEffect, useMemo, useState } from "react";
import {
  Typography,
  Stack,
  Card,
  CardContent,
  Checkbox,
  FormControlLabel,
  TextField,
  Button,
  Box,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from "@mui/material";
import { useAuth } from "../auth/AuthContext";

function formatTodoLabel(todo) {
  const task = todo?.task ?? "";
  if (todo?.repeatEvery && todo?.repeatUnit) {
    const unitLabel = todo.repeatUnit === "day" ? "Tag" : "Monat";
    return `${task} ${todo.repeatEvery}x ${unitLabel}`;
  }
  return task;
}

export default function MeinePflanzen() {
  const { accessToken } = useAuth();

  const [plants, setPlants] = useState([]);
  const [error, setError] = useState(null);

  // Plant add
  const [newPlantName, setNewPlantName] = useState("");
  const [newPlantImage, setNewPlantImage] = useState(null);
  const [description, setDescription] = useState("");
  const [addOpen, setAddOpen] = useState(false);
  const [imagePreviewUrl, setImagePreviewUrl] = useState(null);

  const [newTodos, setNewTodos] = useState({});

  const authHeadersJson = useMemo(
    () => ({
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    }),
    [accessToken]
  );

  const resetAddForm = () => {
    setNewPlantName("");
    setDescription("");
    setNewPlantImage(null);
    setImagePreviewUrl(null);
  };

  const loadPlants = async () => {
    if (!accessToken) return;
    try {
      const res = await fetch("/api/plants", {
        headers: { Authorization: `Bearer ${accessToken}` },
      });

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

  const handleAddPlant = async () => {
    if (!newPlantName.trim()) return false;

    try {
      const formData = new FormData();
      formData.append("name", newPlantName);
      formData.append("description", description);

      if (newPlantImage) formData.append("image", newPlantImage);

      const res = await fetch("/api/plants", {
        method: "POST",
        headers: { Authorization: `Bearer ${accessToken}` },
        body: formData,
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || `Fehler ${res.status}`);
      }

      if (imagePreviewUrl) URL.revokeObjectURL(imagePreviewUrl);
      resetAddForm();

      await loadPlants();
      setError(null);
      return true;
    } catch (err) {
      console.error(err);
      setError(err.message);
      return false;
    }
  };

  const handleDeletePlant = async (id) => {
    try {
      const res = await fetch(`/api/plants/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${accessToken}` },
      });

      if (!res.ok && res.status !== 204) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || `Fehler ${res.status}`);
      }

      await loadPlants();
    } catch (err) {
      console.error(err);
      setError(err.message);
    }
  };

  const ensureTodoState = (plantId) => {
    setNewTodos((prev) => {
      if (prev[plantId]) return prev;
      return {
        ...prev,
        [plantId]: { task: "", repeatEvery: 1, repeatUnit: "day" },
      };
    });
  };

  const handleAddTodo = async (plantId) => {
    const todoState = newTodos[plantId] || { task: "", repeatEvery: 1, repeatUnit: "day" };
    const task = (todoState.task || "").trim();
    if (!task) return;

    try {
      const res = await fetch(`/api/plants/${plantId}/todos`, {
        method: "POST",
        headers: authHeadersJson,
        body: JSON.stringify({
          task,
          repeatEvery: Number(todoState.repeatEvery),
          repeatUnit: todoState.repeatUnit,
        }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || `Fehler ${res.status}`);
      }

      // Reset input nur für diese Pflanze
      setNewTodos((prev) => ({
        ...prev,
        [plantId]: { task: "", repeatEvery: 1, repeatUnit: "day" },
      }));

      await loadPlants();
    } catch (err) {
      console.error(err);
      setError(err.message);
    }
  };

  const handleToggleTodo = async (plantId, index, done) => {
    try {
      const res = await fetch(`/api/plants/${plantId}/todos/${index}`, {
        method: "PUT",
        headers: authHeadersJson,
        body: JSON.stringify({ done }),
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

  const handleDeleteTodo = async (plantId, index) => {
    try {
      const res = await fetch(`/api/plants/${plantId}/todos/${index}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${accessToken}` },
      });

      if (!res.ok && res.status !== 204) {
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
        Meine Pflanzen
      </Typography>

      {error && (
        <Typography color="error" variant="body2">
          {error}
        </Typography>
      )}

      <Stack direction="row" spacing={1} sx={{ mb: 2 }}>
        <Button
          variant="contained"
          onClick={() => {
            resetAddForm();
            setAddOpen(true);
          }}
        >
          Hinzufügen
        </Button>
      </Stack>

      {/* Add Plant Dialog */}
      <Dialog
        open={addOpen}
        onClose={() => {
          resetAddForm();
          setAddOpen(false);
        }}
        fullWidth
        maxWidth="sm"
      >
        <DialogTitle>Neue Pflanze hinzufügen</DialogTitle>

        <DialogContent sx={{ pt: 1 }}>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <TextField
              label="Name"
              value={newPlantName}
              onChange={(e) => setNewPlantName(e.target.value)}
              autoFocus
              fullWidth
            />

            <TextField
              label="Beschreibung"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              multiline
              rows={3}
              fullWidth
            />

            <Button variant="outlined" component="label">
              Bild wählen
              <input
                type="file"
                hidden
                accept="image/*"
                onChange={(e) => {
                  const file = e.target.files?.[0] ?? null;
                  setNewPlantImage(file);

                  if (imagePreviewUrl) URL.revokeObjectURL(imagePreviewUrl);
                  setImagePreviewUrl(file ? URL.createObjectURL(file) : null);
                }}
              />
            </Button>

            {newPlantImage && (
              <Typography variant="body2" color="text.secondary">
                Ausgewählt: {newPlantImage.name}
              </Typography>
            )}

            {imagePreviewUrl && (
              <Box sx={{ mt: 1 }}>
                <img
                  src={imagePreviewUrl}
                  alt="Vorschau"
                  style={{
                    width: "100%",
                    maxHeight: 220,
                    objectFit: "cover",
                    borderRadius: 8,
                  }}
                />
              </Box>
            )}
          </Stack>
        </DialogContent>

        <DialogActions>
          <Button
            onClick={() => {
              if (imagePreviewUrl) URL.revokeObjectURL(imagePreviewUrl);
              setImagePreviewUrl(null);
              setAddOpen(false);
            }}
          >
            Abbrechen
          </Button>

          <Button
            variant="contained"
            onClick={async () => {
              const success = await handleAddPlant();
              if (success) setAddOpen(false);
            }}
            disabled={!newPlantName.trim()}
          >
            Speichern
          </Button>
        </DialogActions>
      </Dialog>

      {/* Plants */}
      {plants.map((plant) => {
        if (!newTodos[plant._id]) {
        }

        const todoState = newTodos[plant._id] || { task: "", repeatEvery: 1, repeatUnit: "day" };

        return (
          <Card key={plant._id}>
            <CardContent>
              <Stack direction="row" justifyContent="space-between" alignItems="center">
                <Typography variant="h6">{plant.name}</Typography>

                <Button
                  variant="outlined"
                  color="error"
                  onClick={() => handleDeletePlant(plant._id)}
                >
                  Löschen
                </Button>
              </Stack>

              {plant.description && (
                <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                  {plant.description}
                </Typography>
              )}

              {plant.imageUrl && (
                <Box sx={{ mt: 2 }}>
                  <img
                    src={plant.imageUrl}
                    alt={plant.name}
                    style={{ maxWidth: "100%", borderRadius: 8 }}
                  />
                </Box>
              )}

              <Stack spacing={1} sx={{ mt: 2 }}>
                {(plant.todos || []).map((todo, index) => (
                  <Stack
                    key={index}
                    direction="row"
                    alignItems="center"
                    justifyContent="space-between"
                    gap={1}
                  >
                    <FormControlLabel
                      control={
                        <Checkbox
                          checked={!!todo.done}
                          onChange={(e) =>
                            handleToggleTodo(plant._id, index, e.target.checked)
                          }
                        />
                      }
                      label={formatTodoLabel(todo)}
                    />

                    <Button
                      size="small"
                      color="error"
                      onClick={() => handleDeleteTodo(plant._id, index)}
                    >
                      X
                    </Button>
                  </Stack>
                ))}

                {/* Todo row */}
                <Stack direction={{ xs: "column", md: "row" }} spacing={1} alignItems="center">
                  <TextField
                    size="small"
                    label="Neues To-Do"
                    value={todoState.task}
                    onFocus={() => ensureTodoState(plant._id)}
                    onChange={(e) =>
                      setNewTodos((prev) => ({
                        ...prev,
                        [plant._id]: { ...todoState, task: e.target.value },
                      }))
                    }
                    sx={{ flex: 1, minWidth: 220 }}
                  />

                  <TextField
                    size="small"
                    label="Wie oft?"
                    type="number"
                    value={todoState.repeatEvery}
                    onFocus={() => ensureTodoState(plant._id)}
                    onChange={(e) =>
                      setNewTodos((prev) => ({
                        ...prev,
                        [plant._id]: { ...todoState, repeatEvery: e.target.value },
                      }))
                    }
                    inputProps={{ min: 1 }}
                    sx={{ width: { xs: "100%", md: 140 } }}
                  />

                  <TextField
                    size="small"
                    select
                    label="Zeitraum"
                    value={todoState.repeatUnit}
                    onFocus={() => ensureTodoState(plant._id)}
                    onChange={(e) =>
                      setNewTodos((prev) => ({
                        ...prev,
                        [plant._id]: { ...todoState, repeatUnit: e.target.value },
                      }))
                    }
                    SelectProps={{ native: true }}
                    sx={{ width: { xs: "100%", md: 160 } }}
                  >
                    <option value="day">Tag</option>
                    <option value="month">Monat</option>
                  </TextField>

                  <Button variant="contained" onClick={() => handleAddTodo(plant._id)}>
                    ➕
                  </Button>
                </Stack>
              </Stack>
            </CardContent>
          </Card>
        );
      })}
    </Stack>
  );
}
