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
  Container,
} from "@mui/material";
import { useAuth } from "../auth/useAuth";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";

function formatDateTime(value, locale = "de-DE") {
  if (!value) return "—";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleString(locale, {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function Wiki() {
  const { t, i18n } = useTranslation();
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

  const resetAddForm = () => {
    setNewEntry({ title: "", content: "" });
    if (thumbnailPreview) URL.revokeObjectURL(thumbnailPreview);
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
      if (thumbnail) formData.append("thumbnail", thumbnail);

      const res = await fetch("/api/wiki", {
        method: "POST",
        headers: { Authorization: `Bearer ${accessToken}` },
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
      <Container maxWidth="md">
        <Stack spacing={2} sx={{ py: 3 }}>
          <Typography variant="h4" gutterBottom>
            {t("wiki.title")}
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
              {t("wiki.add")}
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
            <DialogTitle>{t("wiki.addDialog.title")}</DialogTitle>

            <DialogContent sx={{ pt: 1 }}>
              <Stack spacing={2} sx={{ mt: 1 }}>
                <TextField
                    label={t("wiki.addDialog.titleLabel")}
                    value={newEntry.title}
                    onChange={(e) =>
                        setNewEntry((prev) => ({
                          ...prev,
                          title: e.target.value,
                        }))
                    }
                    autoFocus
                    fullWidth
                />

                <TextField
                    label={t("wiki.addDialog.contentLabel")}
                    multiline
                    minRows={6}
                    value={newEntry.content}
                    onChange={(e) =>
                        setNewEntry((prev) => ({
                          ...prev,
                          content: e.target.value,
                        }))
                    }
                    fullWidth
                />

                <Button variant="outlined" component="label">
                  {t("wiki.addDialog.chooseThumbnail")}
                  <input
                      type="file"
                      hidden
                      accept="image/*"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (!file) {
                          if (thumbnailPreview)
                            URL.revokeObjectURL(thumbnailPreview);
                          setThumbnail(null);
                          setThumbnailPreview(null);
                          return;
                        }

                        if (thumbnailPreview)
                          URL.revokeObjectURL(thumbnailPreview);

                        setThumbnail(file);
                        setThumbnailPreview(URL.createObjectURL(file));
                      }}
                  />
                </Button>

                {thumbnail && (
                    <Typography variant="body2" color="text.secondary">
                      {t("wiki.addDialog.selected")}: {thumbnail.name}
                    </Typography>
                )}

                {thumbnailPreview && (
                    <Box sx={{ mt: 1 }}>
                      <img
                          src={thumbnailPreview}
                          alt={t("wiki.addDialog.selected")}
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
                {t("wiki.cancel")}
              </Button>

              <Button
                  variant="contained"
                  disabled={!newEntry.title.trim() || !newEntry.content.trim()}
                  onClick={handleCreate}
              >
                {t("wiki.save")}
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
                            label={t("wiki.addDialog.titleLabel")}
                            value={editData.title}
                            onChange={(e) =>
                                setEditData((prev) => ({
                                  ...prev,
                                  title: e.target.value,
                                }))
                            }
                        />
                        <TextField
                            label={t("wiki.addDialog.contentLabel")}
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
                            {t("wiki.save")}
                          </Button>
                          <Button
                              variant="outlined"
                              onClick={(e) => {
                                e.stopPropagation();
                                setEditing(null);
                                setEditData({ title: "", content: "" });
                              }}
                          >
                            {t("wiki.cancel")}
                          </Button>
                        </Stack>
                      </Stack>
                  ) : (
                      <>
                        <Typography variant="h6">{entry.title}</Typography>

                        <Typography
                            variant="body2"
                            color="text.secondary"
                            sx={{ mb: 1 }}
                        >
                          {t("wiki.meta.createdBy")}{" "}
                          <b>
                            {entry.createdBy || t("wiki.meta.unknown")}
                          </b>{" "}
                          •{" "}
                          {formatDateTime(entry.createdAt, i18n.language)} •{" "}
                          {t("wiki.meta.updatedBy")}{" "}
                          <b>
                            {entry.updatedBy || "—"}
                          </b>{" "}
                          •{" "}
                          {formatDateTime(entry.updatedAt, i18n.language)}
                        </Typography>

                        <Typography
                            variant="body1"
                            sx={{ whiteSpace: "pre-wrap" }}
                        >
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
                            {t("wiki.edit")}
                          </Button>
                          <Button
                              variant="outlined"
                              color="error"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDelete(entry._id);
                              }}
                          >
                            ❌ {t("wiki.delete")}
                          </Button>
                        </Stack>
                      </>
                  )}
                </CardContent>
              </Card>
          ))}
        </Stack>
      </Container>
  );
}
