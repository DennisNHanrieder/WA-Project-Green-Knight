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

import { ObjectId } from "mongodb";

// Test
app.get("/api/hello", (req, res) => {
  res.json({ message: "Hello from PlantCare API!" });
});

// Pflanzen
app.get("/api/plants", async (req, res) => {
  try {
    const db = req.app.get("db");
    const plants = await db.collection("plants").find({}).toArray();
    res.json(plants);
  } catch (err) {
    console.error(err);
    res.status(500).send("Fehler beim Laden der Pflanzen");
  }
});

app.get("/api/plants/:id", async (req, res) => {
  try {
    const db = req.app.get("db");
    const plant = await db
      .collection("plants")
      .findOne({ _id: new ObjectId(req.params.id) });

    if (!plant) return res.status(404).send("Pflanze nicht gefunden");
    res.json(plant);
  } catch (err) {
    console.error(err);
    res.status(500).send();
  }
});

// Neue Pflanze anlegen
app.post("/api/plants", async (req, res) => {
  try {
    const db = req.app.get("db");
    const { name } = req.body;

    if (!name || name.trim() === "") {
      return res.status(400).json({ error: "Name darf nicht leer sein" });
    }

    const newPlant = {
      name: name.trim(),
      todos: [],
    };

    const result = await db.collection("plants").insertOne(newPlant);
    const inserted = await db
      .collection("plants")
      .findOne({ _id: result.insertedId });

    res.status(201).json(inserted);
  } catch (err) {
    console.error(err);
    res.status(500).send("Fehler beim Anlegen der Pflanze");
  }
});

// Pflanze löschen
app.delete("/api/plants/:id", async (req, res) => {
  try {
    const db = req.app.get("db");
    const id = new ObjectId(req.params.id);

    const result = await db.collection("plants").deleteOne({ _id: id });

    if (result.deletedCount === 0) {
      return res.status(404).send("Pflanze nicht gefunden");
    }

    res.status(204).send(); // 204 = erfolgreich gelöscht, kein Inhalt
  } catch (err) {
    console.error(err);
    res.status(500).send("Fehler beim Löschen der Pflanze");
  }
});

//ToDos

app.post("/api/plants/:id/todos", async (req, res) => {
  try {
    const db = req.app.get("db");
    const id = new ObjectId(req.params.id);

    const result = await db.collection("plants").updateOne(
      { _id: id },
      { $push: { todos: req.body } }
    );

    if (result.modifiedCount === 1) {
      const updated = await db.collection("plants").findOne({ _id: id });
      res.status(201).json(updated);
    } else {
      res.status(404).send("Pflanze nicht gefunden");
    }
  } catch (err) {
    console.error(err);
    res.status(500).send("Fehler beim Hinzufügen des To-Dos");
  }
});

// To-Do als erledigt / unerledigt markieren
app.put("/api/plants/:plantId/todos/:todoIndex", async (req, res) => {
  try {
    const db = req.app.get("db");
    const id = new ObjectId(req.params.plantId);
    const todoIndex = parseInt(req.params.todoIndex, 10);
    const { done } = req.body;

    // Hole Pflanze
    const plant = await db.collection("plants").findOne({ _id: id });
    if (!plant) return res.status(404).send("Pflanze nicht gefunden");

    // Sicherheitsprüfung
    if (!Array.isArray(plant.todos) || todoIndex >= plant.todos.length) {
      return res.status(400).send("Ungültiger To-Do-Index");
    }

    // Ändere das Flag im richtigen To-Do
    plant.todos[todoIndex].done = done;

    // Speichere Änderung
    await db.collection("plants").updateOne(
      { _id: id },
      { $set: { todos: plant.todos } }
    );

    res.status(200).json(plant.todos[todoIndex]);
  } catch (err) {
    console.error(err);
    res.status(500).send("Fehler beim Aktualisieren des To-Dos");
  }
});

// To-Do löschen
app.delete("/api/plants/:plantId/todos/:todoIndex", async (req, res) => {
  try {
    const db = req.app.get("db");
    const id = new ObjectId(req.params.plantId);
    const todoIndex = parseInt(req.params.todoIndex, 10);

    const plant = await db.collection("plants").findOne({ _id: id });
    if (!plant) return res.status(404).send("Pflanze nicht gefunden");

    if (!Array.isArray(plant.todos) || todoIndex >= plant.todos.length) {
      return res.status(400).send("Ungültiger To-Do-Index");
    }

    // Entferne das To-Do aus der Liste
    plant.todos.splice(todoIndex, 1);

    // Aktualisiere in MongoDB
    await db.collection("plants").updateOne(
      { _id: id },
      { $set: { todos: plant.todos } }
    );

    res.status(204).send();
  } catch (err) {
    console.error(err);
    res.status(500).send("Fehler beim Löschen des To-Dos");
  }
});


// Wiki
app.get("/api/wiki", async (req, res) => {
  try {
    const db = req.app.get("db");
    const entries = await db.collection("wiki").find({}).toArray();
    res.json(entries);
  } catch (err) {
    console.error(err);
    res.status(500).send("Fehler beim Laden der Wiki-Einträge");
  }
});

app.get("/api/wiki/:id", async (req, res) => {
  try {
    const db = req.app.get("db");
    const entry = await db
      .collection("wiki")
      .findOne({ _id: new ObjectId(req.params.id) });
    if (!entry) return res.status(404).send("Eintrag nicht gefunden");
    res.json(entry);
  } catch (err) {
    console.error(err);
    res.status(500).send();
  }
});

//Wiki-Eintrag erstellen

app.post("/api/wiki", async (req, res) => {
  try {
    const db = req.app.get("db");
    const result = await db.collection("wiki").insertOne(req.body);
    const newEntry = await db
      .collection("wiki")
      .findOne({ _id: result.insertedId });
    res.status(201).json(newEntry);
  } catch (err) {
    console.error(err);
    res.status(500).send("Fehler beim Erstellen des Eintrags");
  }
});

// Wiki-Eintrag bearbeiten
app.put("/api/wiki/:id", async (req, res) => {
  try {
    const db = req.app.get("db");
    const id = new ObjectId(req.params.id);
    const { title, content } = req.body;

    const result = await db.collection("wiki").updateOne(
      { _id: id },
      { $set: { title, content } }
    );

    if (result.matchedCount === 0)
      return res.status(404).send("Eintrag nicht gefunden");

    const updated = await db.collection("wiki").findOne({ _id: id });
    res.json(updated);
  } catch (err) {
    console.error(err);
    res.status(500).send("Fehler beim Bearbeiten des Eintrags");
  }
});

// Wiki-Eintrag löschen
app.delete("/api/wiki/:id", async (req, res) => {
  try {
    const db = req.app.get("db");
    const id = new ObjectId(req.params.id);

    const result = await db.collection("wiki").deleteOne({ _id: id });

    if (result.deletedCount === 0)
      return res.status(404).send("Eintrag nicht gefunden");

    res.status(204).send(); // Kein Inhalt zurück
  } catch (err) {
    console.error(err);
    res.status(500).send("Fehler beim Löschen des Eintrags");
  }
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
