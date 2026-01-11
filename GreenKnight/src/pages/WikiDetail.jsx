import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  Typography,
  Stack,
  Card,
  CardContent,
  Button,
  Box,
  Dialog,
  DialogContent,
} from "@mui/material";
import { useAuth } from "../auth/AuthContext";

export default function WikiDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { accessToken } = useAuth();

  const [entry, setEntry] = useState(null);
  const [error, setError] = useState(null);
  const [imgOpen, setImgOpen] = useState(false);

  useEffect(() => {
    if (!accessToken) return;

    const loadEntry = async () => {
      try {
        const res = await fetch(`/api/wiki/${id}`, {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        });

        if (!res.ok) {
          const data = await res.json().catch(() => ({}));
          throw new Error(data.error || `Fehler ${res.status}`);
        }

        const data = await res.json();
        setEntry(data);
        setError(null);
      } catch (err) {
        console.error(err);
        setError(err.message);
      }
    };

    loadEntry();
  }, [id, accessToken]);

  return (
    <Stack spacing={2} sx={{ p: 2 }}>
      <Button variant="outlined" onClick={() => navigate(-1)}>
        ← Zurück
      </Button>

      {error && (
        <Typography color="error" variant="body2">
          Fehler: {error}
        </Typography>
      )}

      {!entry && !error && <Typography>Lade…</Typography>}

      {entry && (
        <Card>
          <CardContent>
            <Typography variant="h4" gutterBottom>
              {entry.title}
            </Typography>

            {(entry.thumbnailUrl || entry.imageUrl) && (
              <Box
                sx={{
                  mt: 2,
                  mb: 2,
                  width: "100%",
                  maxHeight: "70vh",
                  bgcolor: "#f3f3f3",
                  borderRadius: 2,
                  overflow: "hidden",
                }}
              >
                <img
                  src={entry.thumbnailUrl || entry.imageUrl}
                  alt={entry.title}
                  onClick={() => setImgOpen(true)}
                  style={{
                    width: "100%",
                    height: "100%",
                    maxHeight: "70vh",
                    objectFit: "contain",
                    display: "block",
                    cursor: "zoom-in",
                  }}
                />
              </Box>
            )}

            <Typography sx={{ whiteSpace: "pre-wrap", lineHeight: 1.6 }}>
              {entry.content}
            </Typography>
          </CardContent>
        </Card>
      )}

      {/* Lightbox */}
      <Dialog
        open={imgOpen}
        onClose={() => setImgOpen(false)}
        maxWidth="lg"
        fullWidth
      >
        <DialogContent sx={{ p: 0, bgcolor: "#000" }}>
          <Box
            sx={{
              width: "100%",
              height: "80vh",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <img
              src={entry?.thumbnailUrl || entry?.imageUrl}
              alt={entry?.title}
              onClick={() => setImgOpen(false)}
              style={{
                maxWidth: "100%",
                maxHeight: "100%",
                objectFit: "contain",
                cursor: "zoom-out",
              }}
            />
          </Box>
        </DialogContent>
      </Dialog>
    </Stack>
  );
}
