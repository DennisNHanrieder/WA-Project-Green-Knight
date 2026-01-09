// src/pages/MeinePflanzen.jsx
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
  Box,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions
} from "@mui/material";

import { useAuth } from "../auth/AuthContext";


export default function MeinePflanzen() {
  const { accessToken } = useAuth();
  const [plants, setPlants] = useState([]);
  const [newPlantName, setNewPlantName] = useState("");
  const [newTodos, setNewTodos] = useState({});
  const [error, setError] = useState(null);
  const [newPlantImage, setNewPlantImage] = useState(null);
  const [description, setDescription] = useState("");
  const [addOpen, setAddOpen] = useState(false);

  const resetAddForm = () => {
    setNewPlantName("");
    setDescription("");
    setNewPlantImage(null);
  };

  const authHeaders = {
    Authorization: `Bearer ${accessToken}`,
    "Content-Type": "application/json",
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
    if (!newPlantName.trim()) return;

    try {
      const formData = new FormData();
      formData.append("name", newPlantName);
      formData.append("description", description);

      if (newPlantImage) {
        formData.append("image", newPlantImage); // "image" = Feldname fürs Backend
      }

      const res = await fetch("/api/plants", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
        body: formData,
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || `Fehler ${res.status}`);
      }

      // Reset Formular
      setNewPlantName("");
      setDescription("");
      setNewPlantImage(null);

      await loadPlants();
      setError(null);

      return true; // worked
    } catch (err) {
      console.error(err);
      setError(err.message);
      return false; // error
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

  const handleAddTodo = async (plantId) => {
    const text = (newTodos[plantId] || "").trim();
    if (!text) return;

    try {
      const res = await fetch(`/api/plants/${plantId}/todos`, {
        method: "POST",
        headers: authHeaders,
        body: JSON.stringify({ task: text, done: false }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || `Fehler ${res.status}`);
      }

      setNewTodos((prev) => ({ ...prev, [plantId]: "" }));
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
        headers: authHeaders,
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

      <Dialog  open={addOpen} onClose={() => { resetAddForm(); setAddOpen(false);}} fullWidth maxWidth="sm">
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
                onChange={(e) => setNewPlantImage(e.target.files?.[0] ?? null)}
              />
            </Button>

            {newPlantImage && (
              <Typography variant="body2" color="text.secondary">
                Ausgewählt: {newPlantImage.name}
              </Typography>
            )}
          </Stack>
        </DialogContent>

        <DialogActions>
          <Button onClick={() => setAddOpen(false)}>Abbrechen</Button>
          <Button
            variant="contained"
            onClick={async () => {
              const success = await handleAddPlant();
              if (success) {
                setAddOpen(false);
              }
            }}
            disabled={!newPlantName.trim()}
          >
            Speichern
          </Button>
        </DialogActions>
      </Dialog>

        {plants.map((plant) => (
          <Card key={plant._id}>
            <CardContent>
              <Stack direction="row" justifyContent="space-between" alignItems="center">
                <Typography variant="h6">{plant.name}</Typography>
                {plant.description && (
                  <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                    {plant.description}
                  </Typography>
                )}
                <Button
                  variant="outlined"
                  color="error"
                  onClick={() => handleDeletePlant(plant._id)}
                >
                  Löschen
                </Button>
              </Stack>

              {/*Bild, falls vorhanden */}
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
                      label={todo.task}
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

                <Stack direction="row" spacing={1}>
                  <TextField
                    size="small"
                    label="Neues To-Do"
                    value={newTodos[plant._id] || ""}
                    onChange={(e) =>
                      setNewTodos((prev) => ({
                        ...prev,
                        [plant._id]: e.target.value,
                      }))
                    }
                  />
                  <Button
                    variant="contained"
                    onClick={() => handleAddTodo(plant._id)}
                  >
                    ➕
                  </Button>
                </Stack>
              </Stack>
            </CardContent>
          </Card>
        ))}
    </Stack>
  );
}
