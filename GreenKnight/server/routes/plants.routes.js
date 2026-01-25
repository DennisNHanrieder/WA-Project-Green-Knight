import express from "express";
import { ObjectId } from "mongodb";
import { authenticateToken } from "../middleware/auth.js";
import { addInterval } from "../services/interval.service.js";
import multer from "multer";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";

const router = express.Router();

/* ---------- Multer Setup (lokal für Plants) ---------- */
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const uploadDir = path.join(__dirname, "../uploads");

if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, uploadDir),
    filename: (req, file, cb) => {
        const safeName = file.originalname.replace(/\s+/g, "_");
        cb(null, Date.now() + "-" + safeName);
    },
});

const upload = multer({ storage });

/* ---------- Auth erforderlich ---------- */
router.use(authenticateToken);

/* ---------- Alle Pflanzen ---------- */
router.get("/", async (req, res) => {
    try {
        const db = req.app.get("db");
        const plants = await db.collection("plants").find({}).toArray();
        res.json(plants);
    } catch (err) {
        console.error(err);
        res.status(500).send("Fehler beim Laden der Pflanzen");
    }
});

/* ---------- Einzelne Pflanze ---------- */
router.get("/:id", async (req, res) => {
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

/* ---------- Pflanze anlegen (mit Bild) ---------- */
router.post("/", upload.single("image"), async (req, res) => {
    try {
        const db = req.app.get("db");
        const { name, description } = req.body;

        if (!name || !name.trim()) {
            return res.status(400).json({ error: "Name darf nicht leer sein" });
        }

        let imageUrl = null;
        if (req.file) imageUrl = `/uploads/${req.file.filename}`;

        const plant = {
            name: name.trim(),
            description: description || "",
            todos: [],
            imageUrl,
            createdAt: new Date(),
        };

        const result = await db.collection("plants").insertOne(plant);
        const inserted = await db
            .collection("plants")
            .findOne({ _id: result.insertedId });

        res.status(201).json(inserted);
    } catch (err) {
        console.error(err);
        res.status(500).send("Fehler beim Anlegen der Pflanze");
    }
});

/* ---------- Pflanze löschen ---------- */
router.delete("/:id", async (req, res) => {
    try {
        const db = req.app.get("db");
        const result = await db
            .collection("plants")
            .deleteOne({ _id: new ObjectId(req.params.id) });

        if (result.deletedCount === 0) {
            return res.status(404).send("Pflanze nicht gefunden");
        }

        res.status(204).send();
    } catch (err) {
        console.error(err);
        res.status(500).send();
    }
});

/* ---------- Todo hinzufügen ---------- */
router.post("/:id/todos", async (req, res) => {
    try {
        const db = req.app.get("db");
        const plantId = new ObjectId(req.params.id);
        const { task, repeatEvery, repeatUnit } = req.body;

        if (!task || !String(task).trim()) {
            return res.status(400).json({ error: "task ist erforderlich" });
        }

        const now = new Date();
        const every = repeatEvery ? Number(repeatEvery) : null;
        const unit = repeatUnit || null;

        if (every && !["day", "month"].includes(unit)) {
            return res.status(400).json({ error: "Ungültiges Intervall" });
        }

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
            { _id: plantId },
            { $push: { todos: todo } }
        );

        if (result.modifiedCount === 0) {
            return res.status(404).send("Pflanze nicht gefunden");
        }

        const updated = await db
            .collection("plants")
            .findOne({ _id: plantId });

        res.status(201).json(updated);
    } catch (err) {
        console.error(err);
        res.status(500).send();
    }
});

/* ---------- Todo Status ändern ---------- */
router.put("/:plantId/todos/:todoIndex", async (req, res) => {
    try {
        const db = req.app.get("db");
        const plantId = new ObjectId(req.params.plantId);
        const todoIndex = parseInt(req.params.todoIndex, 10);
        const { done } = req.body;

        const plant = await db.collection("plants").findOne({ _id: plantId });
        if (!plant) return res.status(404).send("Pflanze nicht gefunden");

        if (!plant.todos[todoIndex]) {
            return res.status(400).send("Ungültiger To-Do-Index");
        }

        plant.todos[todoIndex].done = done;

        if (done === true) {
            const now = new Date();
            plant.todos[todoIndex].lastDoneAt = now;

            const { repeatEvery, repeatUnit } = plant.todos[todoIndex];
            plant.todos[todoIndex].nextDueAt =
                repeatEvery && repeatUnit
                    ? addInterval(now, repeatEvery, repeatUnit)
                    : null;
        }

        await db.collection("plants").updateOne(
            { _id: plantId },
            { $set: { todos: plant.todos } }
        );

        res.json(plant.todos[todoIndex]);
    } catch (err) {
        console.error(err);
        res.status(500).send();
    }
});

/* ---------- Todo löschen ---------- */
router.delete("/:plantId/todos/:todoIndex", async (req, res) => {
    try {
        const db = req.app.get("db");
        const plantId = new ObjectId(req.params.plantId);
        const todoIndex = parseInt(req.params.todoIndex, 10);

        const plant = await db.collection("plants").findOne({ _id: plantId });
        if (!plant) return res.status(404).send("Pflanze nicht gefunden");

        plant.todos.splice(todoIndex, 1);

        await db.collection("plants").updateOne(
            { _id: plantId },
            { $set: { todos: plant.todos } }
        );

        res.status(204).send();
    } catch (err) {
        console.error(err);
        res.status(500).send();
    }
});

export default router;
