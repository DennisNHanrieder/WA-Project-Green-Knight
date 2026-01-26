import express from "express";
import { ObjectId } from "mongodb";
import multer from "multer";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";
import { authenticateToken } from "../middleware/auth.js";
import { authorizeRoles } from "../middleware/roles.js";

const router = express.Router();

/* ---------- Multer Setup ---------- */
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

/* =========================================================
   GET /api/wiki → Alle Wiki-Einträge (Übersicht)
   ========================================================= */
router.get("/", async (req, res) => {
    try {
        const db = req.app.get("db");

        const entries = await db
            .collection("wiki")
            .find({ userId: req.user.sub })
            .sort({ createdAt: -1 })
            .toArray();

        res.json(entries);
    } catch (err) {
        console.error(err);
        res.status(500).send("Fehler beim Laden der Wiki-Einträge");
    }
});

/* =========================================================
   GET /api/wiki/:id → Einzelner Eintrag (Detail)
   ========================================================= */
router.get("/:id", async (req, res) => {
    try {
        const db = req.app.get("db");
        const id = new ObjectId(req.params.id);

        const entry = await db.collection("wiki").findOne({ _id: id });

        if (!entry) {
            return res.status(404).send("Eintrag nicht gefunden");
        }

        res.json(entry);
    } catch (err) {
        console.error(err);
        res.status(500).send("Fehler beim Laden des Eintrags");
    }
});

/* =========================================================
   POST /api/wiki → Eintrag erstellen (mit Thumbnail)
   ========================================================= */
router.post(
    "/",
    upload.single("thumbnail"),
    async (req, res) => {
        try {
            const db = req.app.get("db");

            const thumbnailUrl = req.file
                ? `/uploads/${req.file.filename}`
                : null;

            const entry = {
                title: req.body.title,
                content: req.body.content,
                thumbnailUrl,
                userId: req.user.sub,
                createdBy: req.user.username,
                createdAt: new Date(),
                updatedAt: new Date(),
            };

            const result = await db.collection("wiki").insertOne(entry);

            res.status(201).json({ ...entry, _id: result.insertedId });
        } catch (err) {
            console.error(err);
            res.status(500).send("Fehler beim Erstellen des Eintrags");
        }
    }
);

/* =========================================================
   PUT /api/wiki/:id → Eintrag bearbeiten (optional Thumbnail)
   ========================================================= */
router.put(
    "/:id",
    authorizeRoles("admin", "user"),
    upload.single("thumbnail"),
    async (req, res) => {
        try {
            const db = req.app.get("db");
            const id = new ObjectId(req.params.id);

            const update = {
                updatedAt: new Date(),
                updatedBy: req.user.username,
            };

            if (req.body.title !== undefined) update.title = req.body.title;
            if (req.body.content !== undefined) update.content = req.body.content;
            if (req.file) {
                update.thumbnailUrl = `/uploads/${req.file.filename}`;
            }

            const result = await db.collection("wiki").updateOne(
                { _id: id },
                { $set: update }
            );

            if (result.matchedCount === 0) {
                return res.status(404).send("Eintrag nicht gefunden");
            }

            const updatedEntry = await db
                .collection("wiki")
                .findOne({ _id: id });

            res.json(updatedEntry);
        } catch (err) {
            console.error(err);
            res.status(500).send("Fehler beim Aktualisieren des Eintrags");
        }
    }
);

/* =========================================================
   DELETE /api/wiki/:id → Eintrag löschen
   ========================================================= */
router.delete(
    "/:id",
    authorizeRoles("admin", "user"),
    async (req, res) => {
        try {
            const db = req.app.get("db");
            const id = new ObjectId(req.params.id);

            const result = await db.collection("wiki").deleteOne({ _id: id });

            if (result.deletedCount === 0) {
                return res.status(404).send("Eintrag nicht gefunden");
            }

            res.status(204).send();
        } catch (err) {
            console.error(err);
            res.status(500).send("Fehler beim Löschen des Eintrags");
        }
    }
);

export default router;
