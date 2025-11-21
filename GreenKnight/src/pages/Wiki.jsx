// src/pages/Wiki.jsx
import { useEffect, useState } from "react";
import {
  Typography,
  Stack,
  Card,
  CardContent,
  TextField,
  Button,
} from "@mui/material";
import { useAuth } from "../auth/AuthContext";

export default function Wiki() {
  const { accessToken } = useAuth();
  const [entries, setEntries] = useState([]);
  const [newEntry, setNewEntry] = useState({ title: "", content: "" });
  const [editing, setEditing] = useState(null);
  const [editData, setEditData] = useState({ title: "", content: "" });
  const [error, setError] = useState(null);

  const authHeaders = {
    Authorization: `Bearer ${accessToken}`,
    "Content-Type": "application/json",
  };

  const loadEntries = async () => {
    if (!accessToken) return;
    try {
      const res = await fetch("/api/wiki", {
        headers: { Authorization: `Bearer ${accessToken}` },
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || `Fehler ${res.status}`);
      }

      const data = await res.json();
      setEntries(Array.isArray(data) ? data : []);
      setError(null);
    } catch (err) {
      console.error(err);
      setError(err.message);
    }
  };

  useEffect(() => {
    loadEntries();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [accessToken]);

  const handleCreate = async () => {
    if (!newEntry.title.trim() || !newEntry.content.trim()) return;
    try {
      const res = await fetch("/api/wiki", {
        method: "POST",
        headers: authHeaders,
        body: JSON.stringify(newEntry),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || `Fehler ${res.status}`);
      }

      setNewEntry({ title: "", content: "" });
      await loadEntries();
    } catch (err) {
      console.error(err);
      setError(err.message);
    }
  };

  const startEdit = (entry) => {
    setEditing(entry._id);
    setEditData({ title: entry.title, content: entry.content });
  };

  const handleSaveEdit = async (id) => {
    try {
      const res = await fetch(`/api/wiki/${id}`, {
        method: "PUT",
        headers: authHeaders,
        body: JSON.stringify(editData),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || `Fehler ${res.status}`);
      }

      setEditing(null);
      setEditData({ title: "", content: "" });
      await loadEntries();
    } catch (err) {
      console.error(err);
      setError(err.message);
    }
  };

  const handleDelete = async (id) => {
    try {
      const res = await fetch(`/api/wiki/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${accessToken}` },
      });

      if (!res.ok && res.status !== 204) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || `Fehler ${res.status}`);
      }

      await loadEntries();
    } catch (err) {
      console.error(err);
      setError(err.message);
    }
  };

  return (
    <Stack spacing={2} sx={{ p: 2 }}>
      <Typography variant="h4" gutterBottom>
        Wiki
      </Typography>

      {error && (
        <Typography color="error" variant="body2">
          {error}
        </Typography>
      )}

      <Card>
        <CardContent>
          <Typography variant="h6">Neuer Eintrag</Typography>
          <Stack spacing={1} sx={{ mt: 1 }}>
            <TextField
              label="Titel"
              value={newEntry.title}
              onChange={(e) =>
                setNewEntry((prev) => ({ ...prev, title: e.target.value }))
              }
            />
            <TextField
              label="Inhalt"
              multiline
              minRows={3}
              value={newEntry.content}
              onChange={(e) =>
                setNewEntry((prev) => ({ ...prev, content: e.target.value }))
              }
            />
            <Button variant="contained" onClick={handleCreate}>
              Speichern
            </Button>
          </Stack>
        </CardContent>
      </Card>

      {entries.map((entry) => (
        <Card key={entry._id}>
          <CardContent>
            {editing === entry._id ? (
              <Stack spacing={1}>
                <TextField
                  label="Titel"
                  value={editData.title}
                  onChange={(e) =>
                    setEditData((prev) => ({ ...prev, title: e.target.value }))
                  }
                />
                <TextField
                  label="Inhalt"
                  multiline
                  minRows={3}
                  value={editData.content}
                  onChange={(e) =>
                    setEditData((prev) => ({
                      ...prev,
                      content: e.target.value,
                    }))
                  }
                />
                <Stack direction="row" spacing={1}>
                  <Button
                    variant="contained"
                    onClick={() => handleSaveEdit(entry._id)}
                  >
                    Speichern
                  </Button>
                  <Button
                    variant="outlined"
                    onClick={() => {
                      setEditing(null);
                      setEditData({ title: "", content: "" });
                    }}
                  >
                    Abbrechen
                  </Button>
                </Stack>
              </Stack>
            ) : (
              <>
                <Typography variant="h6">{entry.title}</Typography>
                <Typography variant="body1" sx={{ whiteSpace: "pre-wrap" }}>
                  {entry.content}
                </Typography>
                <Stack direction="row" spacing={1} sx={{ mt: 1 }}>
                  <Button variant="outlined" onClick={() => startEdit(entry)}>
                    Bearbeiten
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
