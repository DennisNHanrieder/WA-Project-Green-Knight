// ---------- Grundsetup ----------
import express from "express";
import { MongoClient, ObjectId } from "mongodb";
import path from "path";
import { fileURLToPath } from "url";
import "dotenv/config";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

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
    {
      sub: user._id.toString(),
    },
    process.env.JWT_REFRESH_SECRET,
    { expiresIn: process.env.JWT_REFRESH_EXPIRES_IN || "7d" }
  );
}

// prüft Access-Token in Authorization-Header
function authenticateToken(req, res, next) {
  const authHeader = req.headers["authorization"];
  if (!authHeader) {
    return res.status(401).json({ error: "Keine Authorization vorhanden" });
  }

  const [type, token] = authHeader.split(" ");
  if (type !== "Bearer" || !token) {
    return res.status(401).json({ error: "Ungültiger Authorization-Header" });
  }

  jwt.verify(token, process.env.JWT_ACCESS_SECRET, (err, payload) => {
    if (err) {
      console.error("JWT Fehler:", err.message);
      return res.status(401).json({ error: "Token ungültig oder abgelaufen" });
    }

    req.user = {
      id: payload.sub,
      username: payload.username,
      roles: payload.roles || [],
    };
    next();
  });
}

// prüft Rollen (z.B. "admin")
function authorizeRoles(...allowedRoles) {
  return (req, res, next) => {
    const userRoles = req.user?.roles || [];
    const ok = userRoles.some((r) => allowedRoles.includes(r));
    if (!ok) {
      return res.status(403).json({ error: "Keine Berechtigung" });
    }
    next();
  };
}

// ---------- Auth-Routen ----------

// Registrierung (vereinfacht, ohne Mail-Activation)
app.post("/auth/register", async (req, res) => {
  try {
    const db = req.app.get("db");
    const users = db.collection("users");
    const { username, email, password, roles } = req.body;

    if (!username || !password) {
      return res
        .status(400)
        .json({ error: "username und password sind erforderlich" });
    }

    const existing = await users.findOne({ username });
    if (existing) {
      return res.status(409).json({ error: "username bereits vergeben" });
    }

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

/**
 * OAuth2-ähnlicher Token-Endpunkt
 *
 * POST /oauth/token
 * Body:
 *  - grant_type: "password" | "refresh_token"
 *  - bei password: username, password
 *  - bei refresh_token: refresh_token
 */
app.post("/oauth/token", async (req, res) => {
  const { grant_type } = req.body;

  try {
    const db = req.app.get("db");
    const users = db.collection("users");

    if (grant_type === "password") {
      const { username, password } = req.body;

      if (!username || !password) {
        return res
          .status(400)
          .json({ error: "username und password sind erforderlich" });
      }

      const user = await users.findOne({ username });
      if (!user) {
        return res.status(400).json({ error: "invalid_credentials" });
      }

      const valid = await bcrypt.compare(password, user.passwordHash);
      if (!valid) {
        return res.status(400).json({ error: "invalid_credentials" });
      }

      const accessToken = generateAccessToken(user);
      const refreshToken = generateRefreshToken(user);

      return res.json({
        token_type: "Bearer",
        access_token: accessToken,
        refresh_token: refreshToken,
        expires_in: 15 * 60, // 15 Minuten
      });
    }

    if (grant_type === "refresh_token") {
      const { refresh_token } = req.body;

      if (!refresh_token) {
        return res.status(400).json({ error: "refresh_token erforderlich" });
      }

      let payload;
      try {
        payload = jwt.verify(refresh_token, process.env.JWT_REFRESH_SECRET);
      } catch (err) {
        return res.status(401).json({ error: "invalid_refresh_token" });
      }

      const user = await users.findOne({ _id: new ObjectId(payload.sub) });
      if (!user) {
        return res.status(401).json({ error: "user_not_found" });
      }

      const accessToken = generateAccessToken(user);
      const newRefreshToken = generateRefreshToken(user);

      return res.json({
        token_type: "Bearer",
        access_token: accessToken,
        refresh_token: newRefreshToken,
        expires_in: 15 * 60,
      });
    }

    return res.status(400).json({ error: "unsupported_grant_type" });
  } catch (err) {
    console.error("Token Fehler:", err);
    res.status(500).json({ error: "Interner Serverfehler" });
  }
});

// optionaler Logout (Frontend löscht Tokens sowieso selbst)
app.post("/auth/logout", (req, res) => {
  res.status(204).send();
});

// ---------- AB HIER: /api nur für eingeloggte User ----------

// alle /api/*-Routen schützen
app.use("/api", authenticateToken);

// ---------- API-Routen ----------

// Test
app.get("/api/hello", (req, res) => {
  res.json({ message: `Hello from PlantCare API, ${req.user.username}!` });
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

    res.status(204).send();
  } catch (err) {
    console.error(err);
    res.status(500).send("Fehler beim Löschen der Pflanze");
  }
});

// ToDos hinzufügen
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

    const plant = await db.collection("plants").findOne({ _id: id });
    if (!plant) return res.status(404).send("Pflanze nicht gefunden");

    if (!Array.isArray(plant.todos) || todoIndex >= plant.todos.length) {
      return res.status(400).send("Ungültiger To-Do-Index");
    }

    plant.todos[todoIndex].done = done;

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

// Wiki-Eintrag erstellen (nur Admin)
app.post("/api/wiki", authorizeRoles("admin"), async (req, res) => {
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

// Wiki-Eintrag bearbeiten (nur Admin)
app.put("/api/wiki/:id", authorizeRoles("admin"), async (req, res) => {
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

// Wiki-Eintrag löschen (nur Admin)
app.delete("/api/wiki/:id", authorizeRoles("admin"), async (req, res) => {
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

// ---------- React-Frontend ----------
const __dirname = path.dirname(fileURLToPath(import.meta.url));
app.use(express.static("dist"));
app.use((req, res) => {
  res.sendFile(path.join(__dirname, "dist", "index.html"));
});

// ---------- MongoDB ----------

try {
  const client = new MongoClient(process.env.MONGODB_CONNECTION_STRING);
  await client.connect();

  const db = client.db("plantcare"); // dein Datenbankname
  app.set("db", db);

  // sicherstellen, dass username unique ist
  await db.collection("users").createIndex({ username: 1 }, { unique: true });

  app.listen(port, () => {
    console.log(`🌿 Server mit DB läuft auf http://localhost:${port}`);
  });
} catch (err) {
  console.error("Fehler bei der DB-Verbindung:", err);
}
