import { useEffect, useState } from "react";
import {
  Typography,
  Stack,
  Card,
  CardContent,
  TextField,
  Button,
} from "@mui/material";

export default function Wiki() {
  const [entries, setEntries] = useState([]);
  const [newEntry, setNewEntry] = useState({ title: "", content: "" });
  const [editing, setEditing] = useState(null); // ID des Eintrags, der bearbeitet wird
  const [editData, setEditData] = useState({ title: "", content: "" });

  // Einträge laden
  const loadEntries = () => {
    fetch("/api/wiki")
      .then((res) => res.json())
      .then((data) => setEntries(data))
      .catch((err) => console.error("Fehler beim Laden:", err));
  };

  useEffect(() => {
    loadEntries();
  }, []);

  // Neuen Eintrag speichern
  const handleAdd = () => {
    if (!newEntry.title.trim() || !newEntry.content.trim()) return;

    fetch("/api/wiki", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(newEntry),
    })
      .then((res) => res.json())
      .then((entry) => {
        setEntries((prev) => [...prev, entry]);
        setNewEntry({ title: "", content: "" });
      })
      .catch((err) => console.error("Fehler beim Hinzufügen:", err));
  };

  // Bearbeiten starten
  const handleEditStart = (entry) => {
    setEditing(entry._id);
    setEditData({ title: entry.title, content: entry.content });
  };

  // Änderungen speichern
  const handleEditSave = (id) => {
    fetch(`/api/wiki/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(editData),
    })
      .then((res) => res.json())
      .then((updated) => {
        setEntries((prev) =>
          prev.map((e) => (e._id === id ? updated : e))
        );
        setEditing(null);
      })
      .catch((err) => console.error("Fehler beim Bearbeiten:", err));
  };

  // Löschen
  const handleDelete = (id) => {
    if (!window.confirm("Diesen Eintrag wirklich löschen?")) return;
    fetch(`/api/wiki/${id}`, { method: "DELETE" })
      .then(() => setEntries((prev) => prev.filter((e) => e._id !== id)))
      .catch((err) => console.error("Fehler beim Löschen:", err));
  };

  return (
    <Stack spacing={3}>
      <Typography variant="h5">📖 Pflanzen-Wiki</Typography>

      {/* Formular für neuen Eintrag */}
      <Card variant="outlined">
        <CardContent>
          <Typography variant="h6">Neuen Eintrag erstellen</Typography>
          <TextField
            label="Titel"
            variant="outlined"
            value={newEntry.title}
            onChange={(e) =>
              setNewEntry({ ...newEntry, title: e.target.value })
            }
            fullWidth
            sx={{ mt: 1 }}
          />
          <TextField
            label="Inhalt"
            variant="outlined"
            multiline
            minRows={3}
            value={newEntry.content}
            onChange={(e) =>
              setNewEntry({ ...newEntry, content: e.target.value })
            }
            fullWidth
            sx={{ mt: 1 }}
          />
          <Button variant="contained" sx={{ mt: 1 }} onClick={handleAdd}>
            Hinzufügen
          </Button>
        </CardContent>
      </Card>

      {/* Liste vorhandener Einträge */}
      {entries.map((entry) => (
        <Card key={entry._id} variant="outlined">
          <CardContent>
            {editing === entry._id ? (
              <>
                <TextField
                  label="Titel"
                  fullWidth
                  value={editData.title}
                  onChange={(e) =>
                    setEditData({ ...editData, title: e.target.value })
                  }
                />
                <TextField
                  label="Inhalt"
                  fullWidth
                  multiline
                  minRows={3}
                  sx={{ mt: 1 }}
                  value={editData.content}
                  onChange={(e) =>
                    setEditData({ ...editData, content: e.target.value })
                  }
                />
                <Stack direction="row" spacing={1} sx={{ mt: 1 }}>
                  <Button
                    variant="contained"
                    color="primary"
                    onClick={() => handleEditSave(entry._id)}
                  >
                    💾 Speichern
                  </Button>
                  <Button
                    variant="outlined"
                    color="secondary"
                    onClick={() => setEditing(null)}
                  >
                    Abbrechen
                  </Button>
                </Stack>
              </>
            ) : (
              <>
                <Typography variant="h6">{entry.title}</Typography>
                <Typography variant="body1" sx={{ mt: 1 }}>
                  {entry.content}
                </Typography>
                <Stack direction="row" spacing={1} sx={{ mt: 1 }}>
                  <Button
                    variant="outlined"
                    onClick={() => handleEditStart(entry)}
                  >
                    ✏️ Bearbeiten
                  </Button>
                  <Button
                    variant="outlined"
                    color="error"
                    onClick={() => handleDelete(entry._id)}
                  >
                    ❌ Löschen
                  </Button>
                </Stack>
              </>
            )}
          </CardContent>
        </Card>
      ))}
    </Stack>
  );
}
