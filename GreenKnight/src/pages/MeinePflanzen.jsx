import { useState, useEffect } from "react";
import {
  Typography,
  Grid,
  Card,
  CardContent,
  CardActions,
  Button,
  TextField,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Checkbox,
  IconButton,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
} from "@mui/material";
import DeleteIcon from "@mui/icons-material/Delete";

export default function MeinePflanzen() {
  const [plants, setPlants] = useState([]);
  const [openPlantDialog, setOpenPlantDialog] = useState(false);
  const [newPlant, setNewPlant] = useState({ name: "", location: "", watering: "" });

  // Für neue To-Dos
  const [openTodoDialog, setOpenTodoDialog] = useState(false);
  const [selectedPlantId, setSelectedPlantId] = useState(null);
  const [newTodo, setNewTodo] = useState("");

  // 🌱 Pflanzen beim Start laden
  useEffect(() => {
    const savedPlants = localStorage.getItem("plants");
    if (savedPlants) {
      setPlants(JSON.parse(savedPlants));
    } else {
      setPlants([
        {
          id: 1,
          name: "Monstera deliciosa",
          location: "Wohnzimmer",
          watering: "1x pro Woche",
          todos: [
            { text: "Gießen", done: false },
            { text: "Blätter abwischen", done: true },
          ],
        },
      ]);
    }
  }, []);

  // 💾 Immer speichern, wenn sich Pflanzen ändern
  useEffect(() => {
    localStorage.setItem("plants", JSON.stringify(plants));
  }, [plants]);

  // ➕ Neue Pflanze hinzufügen
  const handleAddPlant = () => {
    setPlants([...plants, { ...newPlant, id: Date.now(), todos: [] }]);
    setOpenPlantDialog(false);
    setNewPlant({ name: "", location: "", watering: "" });
  };

  // ➕ Neues To-Do speichern
  const handleAddTodo = () => {
    if (!newTodo.trim()) return;
    setPlants((prev) =>
      prev.map((p) =>
        p.id === selectedPlantId
          ? { ...p, todos: [...p.todos, { text: newTodo.trim(), done: false }] }
          : p
      )
    );
    setNewTodo("");
    setOpenTodoDialog(false);
  };

  // ✅ To-Do abhaken
  const toggleTodo = (plantId, index) => {
    setPlants((prev) =>
      prev.map((p) =>
        p.id === plantId
          ? {
              ...p,
              todos: p.todos.map((t, i) =>
                i === index ? { ...t, done: !t.done } : t
              ),
            }
          : p
      )
    );
  };

  // 🗑️ To-Do löschen
  const deleteTodo = (plantId, index) => {
    setPlants((prev) =>
      prev.map((p) =>
        p.id === plantId
          ? { ...p, todos: p.todos.filter((_, i) => i !== index) }
          : p
      )
    );
  };

  return (
    <>
      <Typography variant="h5" gutterBottom>
        🌱 Meine Pflanzen
      </Typography>

      <Button variant="contained" onClick={() => setOpenPlantDialog(true)}>
        Neue Pflanze hinzufügen
      </Button>

      <Grid container spacing={2} sx={{ mt: 2 }}>
        {plants.map((plant) => (
          <Grid item xs={12} sm={6} md={4} key={plant.id}>
            <Card>
              <CardContent>
                <Typography variant="h6">{plant.name}</Typography>
                <Typography variant="body2">📍 {plant.location}</Typography>
                <Typography variant="body2">💧 {plant.watering}</Typography>
                <Typography variant="subtitle2" sx={{ mt: 1 }}>
                  To-Dos:
                </Typography>

                {plant.todos.length > 0 ? (
                  <List dense>
                    {plant.todos.map((todo, i) => (
                      <ListItem key={i} disablePadding>
                        <Checkbox
                          checked={todo.done}
                          onChange={() => toggleTodo(plant.id, i)}
                        />
                        <ListItemText
                          primary={todo.text}
                          sx={{
                            textDecoration: todo.done ? "line-through" : "none",
                            color: todo.done ? "gray" : "inherit",
                          }}
                        />
                        <ListItemSecondaryAction>
                          <IconButton
                            edge="end"
                            onClick={() => deleteTodo(plant.id, i)}
                          >
                            <DeleteIcon />
                          </IconButton>
                        </ListItemSecondaryAction>
                      </ListItem>
                    ))}
                  </List>
                ) : (
                  <Typography variant="body2" color="text.secondary">
                    Keine To-Dos vorhanden
                  </Typography>
                )}
              </CardContent>
              <CardActions>
                <Button
                  size="small"
                  onClick={() => {
                    setSelectedPlantId(plant.id);
                    setOpenTodoDialog(true);
                  }}
                >
                  To-Do hinzufügen
                </Button>
              </CardActions>
            </Card>
          </Grid>
        ))}
      </Grid>

      {/* Dialog für neue Pflanze */}
      <Dialog open={openPlantDialog} onClose={() => setOpenPlantDialog(false)}>
        <DialogTitle>Neue Pflanze hinzufügen</DialogTitle>
        <DialogContent>
          <TextField
            label="Name"
            fullWidth
            margin="normal"
            value={newPlant.name}
            onChange={(e) => setNewPlant({ ...newPlant, name: e.target.value })}
          />
          <TextField
            label="Standort"
            fullWidth
            margin="normal"
            value={newPlant.location}
            onChange={(e) => setNewPlant({ ...newPlant, location: e.target.value })}
          />
          <TextField
            label="Gießintervall"
            fullWidth
            margin="normal"
            value={newPlant.watering}
            onChange={(e) => setNewPlant({ ...newPlant, watering: e.target.value })}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenPlantDialog(false)}>Abbrechen</Button>
          <Button variant="contained" onClick={handleAddPlant}>
            Speichern
          </Button>
        </DialogActions>
      </Dialog>

      {/* Dialog für neues To-Do */}
      <Dialog open={openTodoDialog} onClose={() => setOpenTodoDialog(false)}>
        <DialogTitle>Neues To-Do hinzufügen</DialogTitle>
        <DialogContent>
          <TextField
            label="To-Do"
            fullWidth
            margin="normal"
            value={newTodo}
            onChange={(e) => setNewTodo(e.target.value)}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenTodoDialog(false)}>Abbrechen</Button>
          <Button variant="contained" onClick={handleAddTodo}>
            Hinzufügen
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}
