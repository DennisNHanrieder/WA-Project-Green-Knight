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
  DialogActions,
  Container,
  MenuItem,
} from "@mui/material";
import { useTranslation } from "react-i18next";
import { useAuth } from "../auth/AuthContext";

export default function MeinePflanzen() {
  const { t } = useTranslation();
  const { accessToken } = useAuth();

  const [plants, setPlants] = useState([]);
  const [newPlantName, setNewPlantName] = useState("");
  const [newTodos, setNewTodos] = useState({});
  const [error, setError] = useState(null);

  const [newPlantImage, setNewPlantImage] = useState(null);
  const [description, setDescription] = useState("");

  const [addOpen, setAddOpen] = useState(false);
  const [imagePreviewUrl, setImagePreviewUrl] = useState(null);

  // Interval Inputs pro Pflanze
  const [todoEvery, setTodoEvery] = useState({});
  const [todoUnit, setTodoUnit] = useState({});

  const resetAddForm = () => {
    setNewPlantName("");
    setDescription("");
    setNewPlantImage(null);
    setImagePreviewUrl(null);
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
    if (!newPlantName.trim()) return false;

    try {
      const formData = new FormData();
      formData.append("name", newPlantName);
      formData.append("description", description);

      if (newPlantImage) {
        formData.append("image", newPlantImage);
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

  const handleAddTodo = async (plantId) => {
    const text = (newTodos[plantId] || "").trim();
    if (!text) return;

    const repeatEvery = Number(todoEvery[plantId] ?? 1);
    const repeatUnit = todoUnit[plantId] ?? "day";

    try {
      const res = await fetch(`/api/plants/${plantId}/todos`, {
        method: "POST",
        headers: authHeaders,
        body: JSON.stringify({
          task: text,
          done: false,
          repeatEvery,
          repeatUnit,
          createdAt: new Date().toISOString(),
        }),
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
      <Container maxWidth="md">
        <Stack spacing={2} sx={{ py: 3 }}>
          <Typography variant="h4" gutterBottom>
            {t("plants.title")}
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
              {t("plants.add")}
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
            <DialogTitle>{t("plants.addDialog.title")}</DialogTitle>

            <DialogContent sx={{ pt: 1 }}>
              <Stack spacing={2} sx={{ mt: 1 }}>
                <TextField
                    label={t("plants.addDialog.name")}
                    value={newPlantName}
                    onChange={(e) => setNewPlantName(e.target.value)}
                    autoFocus
                    fullWidth
                />

                <TextField
                    label={t("plants.addDialog.description")}
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    multiline
                    rows={3}
                    fullWidth
                />

                <Button variant="outlined" component="label">
                  {t("plants.addDialog.chooseImage")}
                  <input
                      type="file"
                      hidden
                      accept="image/*"
                      onChange={(e) => {
                        const file = e.target.files?.[0] ?? null;
                        setNewPlantImage(file);

                        if (imagePreviewUrl)
                          URL.revokeObjectURL(imagePreviewUrl);
                        setImagePreviewUrl(
                            file ? URL.createObjectURL(file) : null
                        );
                      }}
                  />
                </Button>

                {newPlantImage && (
                    <Typography variant="body2" color="text.secondary">
                      {t("plants.addDialog.selectedImage")}:{" "}
                      {newPlantImage.name}
                    </Typography>
                )}

                {imagePreviewUrl && (
                    <Box sx={{ mt: 1 }}>
                      <img
                          src={imagePreviewUrl}
                          alt={t("plants.addDialog.selectedImage")}
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
                    if (imagePreviewUrl)
                      URL.revokeObjectURL(imagePreviewUrl);
                    setImagePreviewUrl(null);
                    setAddOpen(false);
                  }}
              >
                {t("plants.cancel")}
              </Button>

              <Button
                  variant="contained"
                  onClick={async () => {
                    const success = await handleAddPlant();
                    if (success) setAddOpen(false);
                  }}
                  disabled={!newPlantName.trim()}
              >
                {t("plants.save")}
              </Button>
            </DialogActions>
          </Dialog>

          {plants.map((plant) => (
              <Card key={plant._id}>
                <CardContent>
                  <Stack
                      direction="row"
                      justifyContent="space-between"
                      alignItems="center"
                  >
                    <Typography variant="h6">{plant.name}</Typography>

                    <Button
                        variant="outlined"
                        color="error"
                        onClick={() => handleDeletePlant(plant._id)}
                    >
                      {t("plants.delete")}
                    </Button>
                  </Stack>

                  {plant.description && (
                      <Typography
                          variant="body2"
                          color="text.secondary"
                          sx={{ mt: 1 }}
                      >
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
                        >
                          <FormControlLabel
                              control={
                                <Checkbox
                                    checked={!!todo.done}
                                    onChange={(e) =>
                                        handleToggleTodo(
                                            plant._id,
                                            index,
                                            e.target.checked
                                        )
                                    }
                                />
                              }
                              label={todo.task}
                          />
                          <Button
                              size="small"
                              color="error"
                              onClick={() =>
                                  handleDeleteTodo(plant._id, index)
                              }
                          >
                            X
                          </Button>
                        </Stack>
                    ))}

                    <Stack direction="row" spacing={1} sx={{ alignItems: "center" }}>
                      <TextField
                          size="small"
                          label={t("plants.todos.new")}
                          value={newTodos[plant._id] || ""}
                          onChange={(e) =>
                              setNewTodos((prev) => ({
                                ...prev,
                                [plant._id]: e.target.value,
                              }))
                          }
                          fullWidth
                      />

                      <TextField
                          size="small"
                          label={t("plants.todos.every")}
                          value={todoEvery[plant._id] ?? 1}
                          onChange={(e) =>
                              setTodoEvery((prev) => ({
                                ...prev,
                                [plant._id]: e.target.value,
                              }))
                          }
                          sx={{ width: 120 }}
                      />

                      <TextField
                          size="small"
                          select
                          label={t("plants.todos.unit")}
                          value={todoUnit[plant._id] ?? "day"}
                          onChange={(e) =>
                              setTodoUnit((prev) => ({
                                ...prev,
                                [plant._id]: e.target.value,
                              }))
                          }
                          sx={{ width: 140 }}
                      >
                        <MenuItem value="day">
                          {t("plants.todos.day")}
                        </MenuItem>
                        <MenuItem value="month">
                          {t("plants.todos.month")}
                        </MenuItem>
                      </TextField>

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
      </Container>
  );
}
