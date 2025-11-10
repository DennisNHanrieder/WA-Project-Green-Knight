import { useEffect, useState } from "react";
import { Typography, Stack, Card, CardContent } from "@mui/material";

export default function Wiki() {
  const [entries, setEntries] = useState([]);

  useEffect(() => {
    fetch("/api/wiki")
      .then((res) => res.json())
      .then((data) => setEntries(data));
  }, []);

  return (
    <Stack spacing={2}>
      <Typography variant="h5">🌿 Pflanzen-Wiki</Typography>
      {entries.map((e) => (
        <Card key={e.id}>
          <CardContent>
            <Typography variant="h6">{e.title}</Typography>
            <Typography variant="body2">{e.content}</Typography>
          </CardContent>
        </Card>
      ))}
    </Stack>
  );
}
