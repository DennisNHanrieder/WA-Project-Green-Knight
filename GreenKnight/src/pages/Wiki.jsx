// src/pages/Wiki.jsx
import { useEffect, useState } from "react";
import {
  Typography,
  Stack,
  Card,
  CardContent,
  TextField,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Box,
} from "@mui/material";

import { useAuth } from "../auth/AuthContext";

export default function Wiki() {
  const { accessToken } = useAuth();
  const [entries, setEntries] = useState([]);
  const [newEntry, setNewEntry] = useState({ title: "", content: "" });
  const [editing, setEditing] = useState(null);
  const [editData, setEditData] = useState({ title: "", content: "" });
  const [error, setError] = useState(null);
  const [addOpen, setAddOpen] = useState(false);
  const [newEntryImage, setNewEntryImage] = useState(null);
  const [imagePreviewUrl, setImagePreviewUrl] = useState(null);
  const [thumbnail, setThumbnail] = useState(null);
  const [thumbnailPreview, setThumbnailPreview] = useState(null);


  const resetAddForm = () => {
    setNewEntry({ title: "", content: "" });

    if (imagePreviewUrl) URL.revokeObjectURL(imagePreviewUrl);
    setImagePreviewUrl(null);
    setNewEntryImage(null);
  };

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
      const formData = new FormData();
      formData.append("title", newEntry.title);
      formData.append("content", newEntry.content);
      if (thumbnail) formData.append("image", thumbnail);

      const res = await fetch("/api/wiki", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${accessToken}`, // Authorization
        },
        body: formData,
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || `Fehler ${res.status}`);
      }

      setNewEntry({ title: "", content: "" });
      setThumbnail(null);
      setThumbnailPreview(null);
      setOpenDialog(false);

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

      <Dialog open={addOpen} onClose={() => setAddOpen(false)} fullWidth maxWidth="sm">
        <DialogTitle>Neuen Wiki-Eintrag hinzufügen</DialogTitle>

        <DialogContent sx={{ pt: 1 }}>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <TextField
              label="Titel"
              value={newEntry.title}
              onChange={(e) =>
                setNewEntry((prev) => ({ ...prev, title: e.target.value }))
              }
              autoFocus
              fullWidth
            />

            <TextField
              label="Inhalt"
              multiline
              minRows={6}
              value={newEntry.content}
              onChange={(e) =>
                setNewEntry((prev) => ({ ...prev, content: e.target.value }))
              }
              fullWidth
            />

            <Button variant="outlined" component="label">
              Thumbnail
              <input
                type="file"
                hidden
                accept="image/*"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  setThumbnail(file || null);
                  setThumbnailPreview(file ? URL.createObjectURL(file) : null);
                }}
              />
            </Button>

            {thumbnailPreview && (
              <img
                src={thumbnailPreview}
                alt="Thumbnail Preview"
                style={{
                  marginTop: 12,
                  maxWidth: "100%",
                  borderRadius: 8,
                }}
              />
            )}

            {entry.thumbnailUrl && (
              <img
                src={entry.thumbnailUrl}
                alt={entry.title}
                style={{
                  width: 120,
                  height: "auto",
                  borderRadius: 8,
                  marginBottom: 8,
                }}
              />
            )}

            {newEntryImage && (
              <Typography variant="body2" color="text.secondary">
                Ausgewählt: {newEntryImage.name}
              </Typography>
            )}

            {imagePreviewUrl && (
              <Box sx={{ mt: 1 }}>
                <img
                  src={imagePreviewUrl}
                  alt="Thumbnail Vorschau"
                  style={{
                    width: "100%",
                    maxHeight: 200,
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
              resetAddForm();
              setAddOpen(false);
            }}
          >
            Abbrechen
          </Button>

          <Button
            variant="contained"
            disabled={!newEntry.title.trim() || !newEntry.content.trim()}
            onClick={async () => {
              const success = await handleCreate();
              if (success) setAddOpen(false);
            }}
          >
            Speichern
          </Button>
        </DialogActions>
      </Dialog>

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

                {(entry.thumbnailUrl || entry.imageUrl) && (
                  <Box sx={{ mt: 1, mb: 1 }}>
                    <img
                      src={entry.thumbnailUrl || entry.imageUrl}
                      alt={entry.title}
                      style={{
                        width: 180,
                        height: 120,
                        objectFit: "cover",
                        borderRadius: 8,
                      }}
                    />
                  </Box>
                )}

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
