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