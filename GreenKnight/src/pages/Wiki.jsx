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
  const { accessToken, user } = useAuth();
  const navigate = useNavigate();

  const [entries, setEntries] = useState([]);
  const [error, setError] = useState(null);

  // Add
  const [addOpen, setAddOpen] = useState(false);
  const [newEntry, setNewEntry] = useState({ title: "", content: "" });
  const [thumbnail, setThumbnail] = useState(null);
  const [thumbnailPreview, setThumbnailPreview] = useState(null);

  // Edit
  const [editing, setEditing] = useState(null);
  const [editData, setEditData] = useState({ title: "", content: "" });
  const [editThumbnail, setEditThumbnail] = useState(null);

  /* -------------------------------------------------- */
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

      if (!res.ok) throw new Error(`Fehler ${res.status}`);

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

  /* ------------------- CREATE ------------------- */
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

      if (!res.ok) throw new Error(`Fehler ${res.status}`);

      resetAddForm();
      setAddOpen(false);
      await loadEntries();
    } catch (err) {
      console.error(err);
      setError(err.message);
    }
  };

  /* ------------------- EDIT ------------------- */
  const startEdit = (entry) => {
    setEditing(entry._id);
    setEditData({
      title: entry.title || "",
      content: entry.content || "",
    });
    setEditThumbnail(null);
  };

  const handleSaveEdit = async (id) => {
    try {
      const formData = new FormData();
      formData.append("title", editData.title);
      formData.append("content", editData.content);
      if (editThumbnail) {
        formData.append("thumbnail", editThumbnail);
      }

      const res = await fetch(`/api/wiki/${id}`, {
        method: "PUT",
        headers: { Authorization: `Bearer ${accessToken}` },
        body: formData,
      });

      if (!res.ok) throw new Error(`Fehler ${res.status}`);

      setEditing(null);
      setEditThumbnail(null);
      await loadEntries();
    } catch (err) {
      console.error(err);
      setError(err.message);
    }
  };

  /* ------------------- DELETE ------------------- */
  const handleDelete = async (id) => {
    try {
      const res = await fetch(`/api/wiki/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${accessToken}` },
      });

      if (!res.ok && res.status !== 204) {
        throw new Error(`Fehler ${res.status}`);
      }

      await loadEntries();
    } catch (err) {
      console.error(err);
      setError(err.message);
    }
  };

  /* ========================================================= */

  return (
      <Container maxWidth="md">
        <Stack spacing={2} sx={{ py: 3 }}>
          <Typography variant="h4">{t("wiki.title")}</Typography>

          {error && (
              <Typography color="error" variant="body2">
                {error}
              </Typography>
          )}

          <Button
              variant="contained"
              onClick={() => {
                resetAddForm();
                setAddOpen(true);
              }}
          >
            {t("wiki.add")}
          </Button>

          {/* ================= ADD DIALOG ================= */}
          <Dialog open={addOpen} onClose={() => setAddOpen(false)} fullWidth>
            <DialogTitle>{t("wiki.addDialog.title")}</DialogTitle>
            <DialogContent>
              <Stack spacing={2} sx={{ mt: 1 }}>
                <TextField
                    label={t("wiki.addDialog.titleLabel")}
                    value={newEntry.title}
                    onChange={(e) =>
                        setNewEntry((p) => ({ ...p, title: e.target.value }))
                    }
                    fullWidth
                />

                <TextField
                    label={t("wiki.addDialog.contentLabel")}
                    multiline
                    minRows={6}
                    value={newEntry.content}
                    onChange={(e) =>
                        setNewEntry((p) => ({ ...p, content: e.target.value }))
                    }
                    fullWidth
                />

                <Button component="label" variant="outlined">
                  {t("wiki.addDialog.chooseThumbnail")}
                  <input
                      type="file"
                      hidden
                      accept="image/*"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (!file) return;
                        if (thumbnailPreview) URL.revokeObjectURL(thumbnailPreview);
                        setThumbnail(file);
                        setThumbnailPreview(URL.createObjectURL(file));
                      }}
                  />
                </Button>

                {thumbnailPreview && (
                    <img
                        src={thumbnailPreview}
                        alt="preview"
                        style={{
                          width: "100%",
                          maxHeight: 220,
                          objectFit: "cover",
                          borderRadius: 8,
                        }}
                    />
                )}
              </Stack>
            </DialogContent>
            <DialogActions>
              <Button onClick={() => setAddOpen(false)}>
                {t("wiki.cancel")}
              </Button>
              <Button variant="contained" onClick={handleCreate}>
                {t("wiki.save")}
              </Button>
            </DialogActions>
          </Dialog>

          {/* ================= ENTRIES ================= */}
          {entries.map((entry) => (
              <Card
                  key={entry._id}
                  sx={{ cursor: "pointer" }}
                  onClick={() => navigate(`/wiki/${entry._id}`)}
              >
                <CardContent>
                  {entry.thumbnailUrl && (
                      <Box sx={{ mb: 1 }}>
                        <img
                            src={entry.thumbnailUrl}
                            alt={entry.title}
                            style={{
                              width: "100%",
                              maxHeight: 220,
                              objectFit: "cover",
                              borderRadius: 8,
                            }}
                            onClick={(e) => e.stopPropagation()}
                        />
                      </Box>
                  )}

                  {editing === entry._id ? (
                      <Stack spacing={2} onClick={(e) => e.stopPropagation()}>
                        <TextField
                            label={t("wiki.addDialog.titleLabel")}
                            value={editData.title}
                            onChange={(e) =>
                                setEditData((p) => ({ ...p, title: e.target.value }))
                            }
                        />
                        <TextField
                            label={t("wiki.addDialog.contentLabel")}
                            multiline
                            minRows={4}
                            value={editData.content}
                            onChange={(e) =>
                                setEditData((p) => ({ ...p, content: e.target.value }))
                            }
                        />

                        <Button component="label" variant="outlined">
                          Bild ändern
                          <input
                              type="file"
                              hidden
                              accept="image/*"
                              onChange={(e) =>
                                  setEditThumbnail(e.target.files?.[0] || null)
                              }
                          />
                        </Button>

                        <Stack direction="row" spacing={1}>
                          <Button
                              variant="contained"
                              onClick={() => handleSaveEdit(entry._id)}
                          >
                            {t("wiki.save")}
                          </Button>
                          <Button
                              variant="outlined"
                              onClick={() => setEditing(null)}
                          >
                            {t("wiki.cancel")}
                          </Button>
                        </Stack>
                      </Stack>
                  ) : (
                      <>
                        <Typography variant="h6">{entry.title}</Typography>

                        <Typography variant="body2" color="text.secondary">
                          {t("wiki.meta.createdBy")}{" "}
                          <b>{entry.createdBy || "—"}</b> •{" "}
                          {formatDateTime(entry.createdAt, i18n.language)}
                        </Typography>

                        <Typography sx={{ mt: 1, whiteSpace: "pre-wrap" }}>
                          {entry.content}
                        </Typography>

                        {entry.userId === user?.id && (
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
                        )}
                      </>
                  )}
                </CardContent>
              </Card>
          ))}
        </Stack>
      </Container>
  );
}
