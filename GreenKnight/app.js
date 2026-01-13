// ---------- Grundsetup ----------
import express from "express";
import { MongoClient, ObjectId } from "mongodb";
import path from "path";
import { fileURLToPath } from "url";
import "dotenv/config";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import multer from "multer";
import fs from "fs";

const app = express();
const port = 3000;

// ---------- __dirname ----------
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ---------- Upload-Verzeichnis ----------
const uploadDir = path.join(__dirname, "uploads");
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Multer-Storage
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    const safeName = file.originalname.replace(/\s+/g, "_");
    cb(null, uniqueSuffix + "-" + safeName);
  },
});

const upload = multer({ storage }); // <-- JETZT ist upload definiert

// ---------- Middleware ----------

// Logging
app.use((req, res, next) => {
  console.log(`${req.method} ${req.url}`);
  next();
});

// JSON Parser
app.use(express.json());

// Static Verzeichnisse
app.use("/uploads", express.static(uploadDir));  // Bild-Dateien erreichbar machen
app.use(express.static(path.join(__dirname, "dist"))); // React Build

// ---------- Auth Helper & Middleware ----------

function generateAccessToken(user) {
  return jwt.sign(
    {
      sub: user._id.toString(),
      username: user.username,
      roles: user.roles || ["user"],
    },
    process.env.JWT_ACCESS_SECRET,
    { expiresIn: process.env.JWT_ACCESS_EXPIRES_IN || "15m" }
  );
}

function generateRefreshToken(user) {
  return jwt.sign(
    { sub: user._id.toString() },
    process.env.JWT_REFRESH_SECRET,
    { expiresIn: process.env.JWT_REFRESH_EXPIRES_IN || "7d" }
  );
}

function authenticateToken(req, res, next) {
  const authHeader = req.headers["authorization"];
  if (!authHeader)
    return res.status(401).json({ error: "Keine Authorization vorhanden" });

  const [type, token] = authHeader.split(" ");
  if (type !== "Bearer" || !token)
    return res.status(401).json({ error: "Ungültiger Authorization-Header" });

  jwt.verify(token, process.env.JWT_ACCESS_SECRET, (err, payload) => {
    if (err) return res.status(401).json({ error: "Token ungültig oder abgelaufen" });

    req.user = {
      id: payload.sub,
      username: payload.username,
      roles: payload.roles || [],
    };

    next();
  });
}

function authorizeRoles(...allowedRoles) {
  return (req, res, next) => {
    const userRoles = req.user?.roles || [];
    const ok = userRoles.some((r) => allowedRoles.includes(r));
    if (!ok) return res.status(403).json({ error: "Keine Berechtigung" });
    next();
  };
}

// ---------- Auth-Routen ----------

// Registrierung
app.post("/auth/register", async (req, res) => {
  try {
    const db = req.app.get("db");
    const users = db.collection("users");
    const { username, email, password, roles } = req.body;

    if (!username || !password)
      return res.status(400).json({ error: "username und password sind erforderlich" });

    const existing = await users.findOne({ username });
    if (existing)
      return res.status(409).json({ error: "username bereits vergeben" });

    const passwordHash = await bcrypt.hash(password, 10);
    const user = {
      username,
      email: email || null,
      passwordHash,
      roles: roles && roles.length ? roles : ["user"],
      createdAt: new Date(),
    };

    const result = await users.insertOne(user);
    res.status(201).json({
      id: result.insertedId,
      username: user.username,
      roles: user.roles,
    });
  } catch (err) {
    console.error("Register Fehler:", err);
    res.status(500).json({ error: "Interner Serverfehler" });
  }
});

// Login / Token
app.post("/oauth/token", async (req, res) => {
  const { grant_type } = req.body;

  try {
    const db = req.app.get("db");
    const users = db.collection("users");

    if (grant_type === "password") {
      const { username, password } = req.body;

      if (!username || !password)
        return res.status(400).json({ error: "username und password sind erforderlich" });

      const user = await users.findOne({ username });
      if (!user) return res.status(400).json({ error: "invalid_credentials" });

      const valid = await bcrypt.compare(password, user.passwordHash);
      if (!valid) return res.status(400).json({ error: "invalid_credentials" });

      return res.json({
        token_type: "Bearer",
        access_token: generateAccessToken(user),
        refresh_token: generateRefreshToken(user),
        expires_in: 15 * 60,
      });
    }

    if (grant_type === "refresh_token") {
      const { refresh_token } = req.body;
      if (!refresh_token)
        return res.status(400).json({ error: "refresh_token erforderlich" });

      let payload;
      try {
        payload = jwt.verify(refresh_token, process.env.JWT_REFRESH_SECRET);
      } catch (err) {
        return res.status(401).json({ error: "invalid_refresh_token" });
      }

      const user = await users.findOne({ _id: new ObjectId(payload.sub) });
      if (!user) return res.status(401).json({ error: "user_not_found" });

      return res.json({
        token_type: "Bearer",
        access_token: generateAccessToken(user),
        refresh_token: generateRefreshToken(user),
        expires_in: 15 * 60,
      });
    }

    res.status(400).json({ error: "unsupported_grant_type" });
  } catch (err) {
    console.error("Token Fehler:", err);
    res.status(500).json({ error: "Interner Serverfehler" });
  }
});

// Logout
app.post("/auth/logout", (req, res) => res.status(204).send());

// ---------- Geschützte API-Routen ----------
app.use("/api", authenticateToken);

// Test
app.get("/api/hello", (req, res) => {
  res.json({ message: `Hello from PlantCare API, ${req.user.username}!` });
});

// ---------- Todo-Intervall Helper ----------
function addInterval(date, every, unit) {
  const d = new Date(date);
  const n = Number(every);
  if (!Number.isFinite(n) || n <= 0) return null;

  if (unit === "day") {
    d.setDate(d.getDate() + n);
    return d;
  }

  if (unit === "month") {
    d.setMonth(d.getMonth() + n);
    return d;
  }

  return null;
}


// ---------- Plants CRUD ----------

// Alle Pflanzen
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

// Einzelne Pflanze
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

// Pflanze neu anlegen + BILDUPLOAD
app.post("/api/plants", upload.single("image"), async (req, res) => {
  try {
    const db = req.app.get("db");
    const { name, description } = req.body;

    if (!name || name.trim() === "")
      return res.status(400).json({ error: "Name darf nicht leer sein" });

    if (description && description.length > 1000) {
      return res.status(400).json({ error: "description zu lang" });
    }

    let imageUrl = null;
    if (req.file) imageUrl = `/uploads/${req.file.filename}`;

    const newPlant = { name: name.trim(), description: description || "", todos: [], imageUrl };

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
    const result = await db
      .collection("plants")
      .deleteOne({ _id: new ObjectId(req.params.id) });

    if (result.deletedCount === 0)
      return res.status(404).send("Pflanze nicht gefunden");

    res.status(204).send();
  } catch (err) {
    console.error(err);
    res.status(500).send("Fehler beim Löschen der Pflanze");
  }
});

// ToDo hinzufügen
app.post("/api/plants/:id/todos", async (req, res) => {
  try {
    const db = req.app.get("db");
    const id = new ObjectId(req.params.id);

    const { task, repeatEvery, repeatUnit } = req.body;

    if (!task || !String(task).trim()) {
      return res.status(400).json({ error: "task ist erforderlich" });
    }

    // interval optional
    const hasEvery = repeatEvery !== undefined && repeatEvery !== null && repeatEvery !== "";
    const hasUnit = repeatUnit !== undefined && repeatUnit !== null && repeatUnit !== "";

    let every = null;
    let unit = null;

    if (hasEvery || hasUnit) {
      every = Number(repeatEvery);
      unit = repeatUnit;

      if (!Number.isFinite(every) || every <= 0) {
        return res.status(400).json({ error: "repeatEvery muss > 0 sein" });
      }
      if (unit !== "day" && unit !== "month") {
        return res.status(400).json({ error: "repeatUnit muss 'day' oder 'month' sein" });
      }
    }

    const now = new Date();

    const todo = {
      task: String(task).trim(),
      done: false,

      repeatEvery: every,        
      repeatUnit: unit,          
      lastDoneAt: null,
      nextDueAt: every && unit ? addInterval(now, every, unit) : null,

      createdAt: now,
    };

    const result = await db.collection("plants").updateOne(
      { _id: id },
      { $push: { todos: todo } }
    );

    if (result.modifiedCount === 1) {
      const updated = await db.collection("plants").findOne({ _id: id });
      return res.status(201).json(updated);
    }

    res.status(404).send("Pflanze nicht gefunden");
  } catch (err) {
    console.error(err);
    res.status(500).send("Fehler beim Hinzufügen des To-Dos");
  }
});


// ToDo done status ändern
app.put("/api/plants/:plantId/todos/:todoIndex", async (req, res) => {
  try {
    const db = req.app.get("db");
    const id = new ObjectId(req.params.plantId);
    const todoIndex = parseInt(req.params.todoIndex, 10);
    const { done } = req.body;

    const plant = await db.collection("plants").findOne({ _id: id });
    if (!plant) return res.status(404).send("Pflanze nicht gefunden");

    if (!Array.isArray(plant.todos) || todoIndex >= plant.todos.length)
      return res.status(400).send("Ungültiger To-Do-Index");

    plant.todos[todoIndex].done = done;

    // When checked: lastDoneAt + nextDueAt neu setzen
    if (done === true) {
      const now = new Date();
      plant.todos[todoIndex].lastDoneAt = now;

      const every = plant.todos[todoIndex].repeatEvery;
      const unit = plant.todos[todoIndex].repeatUnit;

      plant.todos[todoIndex].nextDueAt =
        every && unit ? addInterval(now, every, unit) : null;
    }

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


// ToDo löschen
app.delete("/api/plants/:plantId/todos/:todoIndex", async (req, res) => {
  try {
    const db = req.app.get("db");
    const id = new ObjectId(req.params.plantId);
    const todoIndex = parseInt(req.params.todoIndex, 10);

    const plant = await db.collection("plants").findOne({ _id: id });
    if (!plant) return res.status(404).send("Pflanze nicht gefunden");

    if (!Array.isArray(plant.todos) || todoIndex >= plant.todos.length)
      return res.status(400).send("Ungültiger To-Do-Index");

    plant.todos.splice(todoIndex, 1);

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

// ---------- Wiki-Routen ----------
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

app.post(
  "/api/wiki",
  authorizeRoles("admin", "user"),
  upload.single("thumbnail"),
  async (req, res) => {
    try {
      const db = req.app.get("db");
      const { title, content } = req.body;

      if (!title || !title.trim() || !content || !content.trim()) {
        return res
          .status(400)
          .json({ error: "title und content sind erforderlich" });
      }

      let thumbnailUrl = null;
      if (req.file) thumbnailUrl = `/uploads/${req.file.filename}`;

      const newDoc = {
        title: title.trim(),
        content: content.trim(),
        thumbnailUrl,
        createdAt: new Date(),
        createdBy: req.user?.username || null,
      };

      const result = await db.collection("wiki").insertOne(newDoc);
      const newEntry = await db
        .collection("wiki")
        .findOne({ _id: result.insertedId });

      res.status(201).json(newEntry);
    } catch (err) {
      console.error(err);
      res.status(500).send("Fehler beim Erstellen des Eintrags");
    }
  }
);


app.put(
  "/api/wiki/:id",
  authorizeRoles("admin", "user"),
  upload.single("thumbnail"),
  async (req, res) => {
    try {
      const db = req.app.get("db");
      const id = new ObjectId(req.params.id);

      const { title, content } = req.body;

      const update = {};
      if (title !== undefined) update.title = title;
      if (content !== undefined) update.content = content;

      if (req.file) {
        update.thumbnailUrl = `/uploads/${req.file.filename}`;
      }

      update.updatedAt = new Date();
      update.updatedBy = req.user?.username || null;

      const result = await db.collection("wiki").updateOne(
        { _id: id },
        { $set: update }
      );

      if (result.matchedCount === 0)
        return res.status(404).send("Eintrag nicht gefunden");

      const updated = await db.collection("wiki").findOne({ _id: id });
      res.json(updated);
    } catch (err) {
      console.error(err);
      res.status(500).send("Fehler beim Bearbeiten des Eintrags");
    }
  }
);


app.delete("/api/wiki/:id", authorizeRoles("admin", "user"), async (req, res) => {
  try {
    const db = req.app.get("db");
    const id = new ObjectId(req.params.id);

    const result = await db.collection("wiki").deleteOne({ _id: id });
    if (result.deletedCount === 0)
      return res.status(404).send("Eintrag nicht gefunden");

    res.status(204).send();
  } catch (err) {
    console.error(err);
    res.status(500).send("Fehler beim Löschen des Eintrags");
  }
});

// ---------- React-Frontend Routing ----------
app.use((req, res) => {
  res.sendFile(path.join(__dirname, "dist", "index.html"));
});

// ---------- MongoDB ----------
export default app;

export async function startServer() {
  try {
    const client = new MongoClient(process.env.MONGODB_CONNECTION_STRING);
    await client.connect();

    const db = client.db("plantcare");
    app.set("db", db);

    await db.collection("users").createIndex({ username: 1 }, { unique: true });

    app.listen(port, () =>
      console.log(` Server mit DB läuft auf http://localhost:${port}`)
    );
  } catch (err) {
    console.error("Fehler bei der DB-Verbindung:", err);
  }
}

// Nur starten, wenn app.js direkt ausgeführt wird (nicht beim Import in Tests)
const isMain = process.argv[1] && path.resolve(process.argv[1]) === __filename;
if (process.env.NODE_ENV !== "test" && isMain) {
  startServer();
}

