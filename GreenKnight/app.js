// ---------- Grundsetup ----------
import express from "express";
import { MongoClient } from "mongodb";
import path from "path";
import { fileURLToPath } from "url";
import "dotenv/config";

const app = express();
const port = 3000;

// ---------- Middleware ----------

// Logging Middleware
app.use((req, res, next) => {
  console.log(`${req.method} ${req.url}`);
  next();
});

// JSON Parser Middleware
app.use(express.json());

// Mocked Authorization Middleware
app.use("/api/secure", (req, res, next) => {
  const token = req.headers.authorization;
  if (!token) {
    return res.status(401).json({ error: "Nicht eingeloggt" });
  }
  next();
});




// ---------- API-Routen ----------

// Test
app.get("/api/hello", (req, res) => {
  res.json({ message: "Hello from PlantCare API!" });
});

// Pflanzen
app.get("/api/plants", (req, res) => res.json(plants));
app.get("/api/plants/:id", (req, res) => {
  const plant = plants.find((p) => p.id === Number(req.params.id));
  if (!plant) return res.status(404).send("Pflanze nicht gefunden");
  res.json(plant);
});
app.post("/api/plants/:id/todos", (req, res) => {
  const plant = plants.find((p) => p.id === Number(req.params.id));
  if (!plant) return res.status(404).send("Pflanze nicht gefunden");
  const newTodo = {
    id: plant.todos.length + 1,
    task: req.body.task,
    done: false,
  };
  plant.todos.push(newTodo);
  res.status(201).json(newTodo);
});

// Wiki
app.get("/api/wiki", (req, res) => res.json(wikiEntries));
app.get("/api/wiki/:id", (req, res) => {
  const entry = wikiEntries.find((e) => e.id === Number(req.params.id));
  if (!entry) return res.status(404).send("Eintrag nicht gefunden");
  res.json(entry);
});
app.post("/api/wiki", (req, res) => {
  const newEntry = {
    id: wikiEntries.length + 1,
    title: req.body.title,
    content: req.body.content,
  };
  wikiEntries.push(newEntry);
  res.status(201).json(newEntry);
});

// ---------- React-Frontend ----------
const __dirname = path.dirname(fileURLToPath(import.meta.url));
app.use(express.static("dist"));
app.use((req, res) => {
  res.sendFile(path.join(__dirname, "dist", "index.html"));
});

// ---------- MongoDB ----------

// Verbindung zu MongoDB herstellen
try {
  const client = new MongoClient(process.env.MONGODB_CONNECTION_STRING);
  await client.connect();

  const db = client.db("plantcare"); // dein Datenbankname
  app.set("db", db);

  app.listen(port, () => {
    console.log(`🌿 Server mit DB läuft auf http://localhost:${port}`);
  });
} catch (err) {
  console.error("Fehler bei der DB-Verbindung:", err);
}
