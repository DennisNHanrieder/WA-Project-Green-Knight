// ---------- Grundsetup ----------
import express from "express";
import path from "path";
import { fileURLToPath } from "url";

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


// ---------- Mock-Daten ----------
const plants = [
  {
    id: 1,
    name: "Aloe Vera",
    todos: [
      { id: 1, task: "Gießen", done: false },
      { id: 2, task: "Düngen", done: true },
    ],
  },
  {
    id: 2,
    name: "Monstera",
    todos: [{ id: 1, task: "Umtopfen", done: false }],
  },
];

const wikiEntries = [
  {
    id: 1,
    title: "Aloe Vera Pflege",
    content: "Aloe Vera bevorzugt sonnige Standorte und mäßiges Gießen.",
  },
  {
    id: 2,
    title: "Monstera Pflege",
    content:
      "Monstera liebt helles, indirektes Licht und regelmäßiges Besprühen der Blätter.",
  },
];


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