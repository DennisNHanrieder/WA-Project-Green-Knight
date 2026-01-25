// src/pages/WikiDetail.jsx
import { useEffect, useState } from "react";
import {
  Typography,
  Stack,
  Card,
  CardContent,
  Button,
  Box,
  TextField,
  Container,
} from "@mui/material";
import { useNavigate, useParams } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";
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

export default function WikiDetail() {
  const { t, i18n } = useTranslation();
  const { id } = useParams();
  const navigate = useNavigate();
  const { accessToken } = useAuth();

  const [entry, setEntry] = useState(null);
  const [error, setError] = useState(null);

  const [editing, setEditing] = useState(false);
  const [editData, setEditData] = useState({ title: "", content: "" });

  const loadEntry = async () => {
    if (!accessToken) return;

    try {
      const res = await fetch(`/api/wiki/${id}`, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || `Fehler ${res.status}`);
      }

      const data = await res.json();
      setEntry(data);
      setEditData({
        title: data.title || "",
        content: data.content || "",
      });
      setError(null);
    } catch (err) {
      console.error(err);
      setError(err.message);
    }
  };

  useEffect(() => {
    loadEntry();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [accessToken, id]);

  const authHeadersJson = {
    Authorization: `Bearer ${accessToken}`,
    "Content-Type": "application/json",
  };

  const handleSave = async () => {
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

      setEditing(false);
      await loadEntry();
    } catch (err) {
      console.error(err);
      setError(err.message);
    }
  };

  const handleDelete = async () => {
    try {
      const res = await fetch(`/api/wiki/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${accessToken}` },
      });

      if (!res.ok && res.status !== 204) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || `Fehler ${res.status}`);
      }

      navigate("/wiki");
    } catch (err) {
      console.error(err);
      setError(err.message);
    }
  };

  const imageSrc = entry?.thumbnailUrl || entry?.imageUrl || null;

  return (
      <Container maxWidth="md">
        <Stack spacing={2} sx={{ py: 3 }}>
          <Button variant="outlined" onClick={() => navigate("/wiki")}>
            ← {t("wiki.back")}
          </Button>

          {error && (
              <Typography color="error" variant="body2">
                {error}
              </Typography>
          )}

          {!entry && !error && (
              <Typography>{t("wiki.loading")}</Typography>
          )}

          {entry && (
              <Card>
                <CardContent>
                  {editing ? (
                      <Stack spacing={2}>
                        <TextField
                            label={t("wiki.addDialog.titleLabel")}
                            value={editData.title}
                            onChange={(e) =>
                                setEditData((prev) => ({
                                  ...prev,
                                  title: e.target.value,
                                }))
                            }
                            fullWidth
                        />

                        <TextField
                            label={t("wiki.addDialog.contentLabel")}
                            value={editData.content}
                            onChange={(e) =>
                                setEditData((prev) => ({
                                  ...prev,
                                  content: e.target.value,
                                }))
                            }
                            multiline
                            minRows={6}
                            fullWidth
                        />

                        <Stack direction="row" spacing={1}>
                          <Button variant="contained" onClick={handleSave}>
                            {t("wiki.save")}
                          </Button>
                          <Button
                              variant="outlined"
                              onClick={() => {
                                setEditing(false);
                                setEditData({
                                  title: entry.title || "",
                                  content: entry.content || "",
                                });
                              }}
                          >
                            {t("wiki.cancel")}
                          </Button>
                        </Stack>
                      </Stack>
                  ) : (
                      <>
                        <Typography variant="h4" sx={{ mb: 0.5 }}>
                          {entry.title}
                        </Typography>

                        <Typography
                            variant="body2"
                            color="text.secondary"
                            sx={{ mb: 2 }}
                        >
                          {t("wiki.meta.createdBy")}{" "}
                          <b>{entry.createdBy || t("wiki.meta.unknown")}</b> •{" "}
                          {formatDateTime(entry.createdAt, i18n.language)} •{" "}
                          {t("wiki.meta.updatedBy")}{" "}
                          <b>{entry.updatedBy || "—"}</b> •{" "}
                          {formatDateTime(entry.updatedAt, i18n.language)}
                        </Typography>

                        {imageSrc && (
                            <Box
                                sx={{
                                  width: "100%",
                                  borderRadius: 2,
                                  overflow: "hidden",
                                  mb: 2,
                                  border: "1px solid rgba(0,0,0,0.08)",
                                }}
                            >
                              <img
                                  src={imageSrc}
                                  alt={entry.title}
                                  style={{
                                    display: "block",
                                    width: "100%",
                                    maxHeight: 520,
                                    objectFit: "contain",
                                    background: "#f6f6f6",
                                  }}
                              />
                            </Box>
                        )}

                        <Typography
                            variant="body1"
                            sx={{ whiteSpace: "pre-wrap" }}
                        >
                          {entry.content}
                        </Typography>

                        <Stack direction="row" spacing={1} sx={{ mt: 2 }}>
                          <Button
                              variant="outlined"
                              onClick={() => setEditing(true)}
                          >
                            {t("wiki.edit")}
                          </Button>
                          <Button
                              variant="outlined"
                              color="error"
                              onClick={handleDelete}
                          >
                            ❌ {t("wiki.delete")}
                          </Button>
                        </Stack>
                      </>
                  )}
                </CardContent>
              </Card>
          )}
        </Stack>
      </Container>
  );
}
