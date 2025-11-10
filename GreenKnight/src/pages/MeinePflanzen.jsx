import { useEffect, useState } from "react";
import { Typography, Stack } from "@mui/material";

export default function MeinePflanzen() {
  const [plants, setPlants] = useState([]);

  useEffect(() => {
    fetch("/api/plants")
      .then((res) => res.json())
      .then((data) => setPlants(data));
  }, []);

  return (
    <Stack spacing={2}>
      <Typography variant="h5">Meine Pflanzen 🌱</Typography>
      {plants.map((p) => (
        <div key={p.id}>
          <Typography variant="h6">{p.name}</Typography>
          <ul>
            {p.todos.map((t) => (
              <li key={t.id}>
                {t.task} {t.done ? "✅" : "🕓"}
              </li>
            ))}
          </ul>
        </div>
      ))}
    </Stack>
  );
}
