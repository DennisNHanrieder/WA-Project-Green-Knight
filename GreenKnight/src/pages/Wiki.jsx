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
import { useNavigate } from "react-router-dom";

export default function Wiki() {
  const { accessToken } = useAuth();
  const navigate = useNavigate();

  const [entries, setEntries] = useState([]);
  const [newEntry, setNewEntry] = useState({ title: "", content: "" });

  const [editing, setEditing] = useState(null);
  const [editData, setEditData] = useState({ title: "", content: "" });

  const [error, setError] = useState(null);

  // Add-Dialog
  const [addOpen, setAddOpen] = useState(false);

  // Thumbnail Upload (Add-Dialog)
  const [thumbnail, setThumbnail] = useState(null);
  const [thumbnailPreview, setThumbnailPreview] = useState(null);

  const authHeadersJson = {
    Authorization: `Bearer ${accessToken}`,
    "Content-Type": "application/json",
  };

  const formatDate = (iso) => {
    if (!iso) return "—";
    return new Date(iso).toLocaleString("de-DE", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const formatCreatedBy = (createdBy) => {
    if (!createdBy) return "Unbekannt";
    if (typeof createdBy === "string") return createdBy; // falls nur ID kommt
    return createdBy.username || createdBy.name || createdBy.email || "Unbekannt";
  };

  const resetAddForm = () => {
    setNewEntry({ title: "", content: "" });

    if (thumbnailPreview) {
      URL.revokeObjectURL(thumbnailPreview);
    }
    setThumbnail(null);
    setThumbnailPreview(null);
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
      formData.append("title", newEntry.title.trim());
      formData.append("content", newEntry.content.trim());

      // Backend-Feldname:
      // Wenn dein Backend upload.single("thumbnail") nutzt -> "thumbnail"
      // Wenn dein Backend upload.single("image") nutzt -> "image"
      if (thumbnail) formData.append("thumbnail", thumbnail);

      const res = await fetch("/api/wiki", {
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

      resetAddForm();
      setAddOpen(false);

      await loadEntries();
    } catch (err) {
      console.error(err);
      setError(err.message);
    }
  };

  const startEdit = (entry) => {
    setEditing(entry._id);
    setEditData({ title: entry.title || "", content: entry.content || "" });
  };

  const handleSaveEdit = async (id) => {
    try {
      const res = await fetch(`/api/wiki/${id}`, {
        method: "PUT",
        headers: authHeadersJson,
        body: JSON.stringify({
          title: editData.title,
          content: editData.content,
        }),
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

      {/* Button zum Öffnen des Add-Dialogs */}
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

      {/* Add Dialog */}
      <Dialog
        open={addOpen}
        onClose={() => {
          resetAddForm();
          setAddOpen(false);
        }}
        fullWidth
        maxWidth="sm"
      >
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
              Thumbnail wählen
              <input
                type="file"
                hidden
                accept="image/*"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (!file) {
                    if (thumbnailPreview) URL.revokeObjectURL(thumbnailPreview);
                    setThumbnail(null);
                    setThumbnailPreview(null);
                    return;
                  }

                  // alte Preview freigeben, sonst Memory Leak
                  if (thumbnailPreview) URL.revokeObjectURL(thumbnailPreview);

                  setThumbnail(file);
                  setThumbnailPreview(URL.createObjectURL(file));
                }}
              />
            </Button>

            {thumbnail && (
              <Typography variant="body2" color="text.secondary">
                Ausgewählt: {thumbnail.name}
              </Typography>
            )}

            {thumbnailPreview && (
              <Box sx={{ mt: 1 }}>
                <img
                  src={thumbnailPreview}
                  alt="Thumbnail Preview"
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
              resetAddForm();
              setAddOpen(false);
            }}
          >
            Abbrechen
          </Button>

          <Button
            variant="contained"
            disabled={!newEntry.title.trim() || !newEntry.content.trim()}
            onClick={handleCreate}
          >
            Speichern
          </Button>
        </DialogActions>
      </Dialog>

      {/* Entries */}
      {entries.map((entry) => (
        <Card
          key={entry._id}
          sx={{ cursor: "pointer" }}
          onClick={() => navigate(`/wiki/${entry._id}`)}
        >
          <CardContent>
            {editing === entry._id ? (
              <Stack spacing={1} onClick={(e) => e.stopPropagation()}>
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
                    onClick={(e) => {
                      e.stopPropagation();
                      handleSaveEdit(entry._id);
                    }}
                  >
                    Speichern
                  </Button>
                  <Button
                    variant="outlined"
                    onClick={(e) => {
                      e.stopPropagation();
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

                {/* Meta-Infos */}
                <Typography
                  variant="body2"
                  color="text.secondary"
                  sx={{ mb: 1 }}
                >
                  Erstellt von <b>{formatCreatedBy(entry.createdBy)}</b> •{" "}
                  {formatDate(entry.createdAt)} • zuletzt geändert{" "}
                  {formatDate(entry.updatedAt)}
                </Typography>

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
                      onClick={(e) => e.stopPropagation()}
                    />
                  </Box>
                )}

                <Stack direction="row" spacing={1} sx={{ mt: 1 }}>
                  <Button
                    variant="outlined"
                    onClick={(e) => {
                      e.stopPropagation();
                      startEdit(entry);
                    }}
                  >
                    Bearbeiten
                  </Button>
                  <Button
                    variant="outlined"
                    color="error"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDelete(entry._id);
                    }}
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
