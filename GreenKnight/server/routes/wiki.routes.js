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

router.use(authenticateToken);

/* ---------- Alle Wiki-Einträge ---------- */
router.get("/", async (req, res) => {
    try {
        const db = req.app.get("db");
        const entries = await db.collection("wiki").find({}).toArray();
        res.json(entries);
    } catch (err) {
        console.error(err);
        res.status(500).send();
    }
});

/* ---------- Einzelner Eintrag ---------- */
router.get("/:id", async (req, res) => {
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

/* ---------- Eintrag erstellen ---------- */
router.post(
    "/",
    authorizeRoles("admin", "user"),
    upload.single("thumbnail"),
    async (req, res) => {
        try {
            const db = req.app.get("db");
            const { title, content } = req.body;

            if (!title || !content) {
                return res.status(400).json({ error: "title und content erforderlich" });
            }

            const doc = {
                title: title.trim(),
                content: content.trim(),
                thumbnailUrl: req.file ? `/uploads/${req.file.filename}` : null,
                createdAt: new Date(),
                createdBy: req.user.username,
            };

            const result = await db.collection("wiki").insertOne(doc);
            const inserted = await db
                .collection("wiki")
                .findOne({ _id: result.insertedId });

            res.status(201).json(inserted);
        } catch (err) {
            console.error(err);
            res.status(500).send();
        }
    }
);

/* ---------- Eintrag bearbeiten ---------- */
router.put(
    "/:id",
    authorizeRoles("admin", "user"),
    upload.single("thumbnail"),
    async (req, res) => {
        try {
            const db = req.app.get("db");
            const id = new ObjectId(req.params.id);
            const { title, content } = req.body;

            const update = {
                updatedAt: new Date(),
                updatedBy: req.user.username,
            };

            if (title !== undefined) update.title = title;
            if (content !== undefined) update.content = content;
            if (req.file) update.thumbnailUrl = `/uploads/${req.file.filename}`;

            const result = await db.collection("wiki").updateOne(
                { _id: id },
                { $set: update }
            );

            if (result.matchedCount === 0) {
                return res.status(404).send("Eintrag nicht gefunden");
            }

            const updated = await db.collection("wiki").findOne({ _id: id });
            res.json(updated);
        } catch (err) {
            console.error(err);
            res.status(500).send();
        }
    }
);

/* ---------- Eintrag löschen ---------- */
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
            res.status(500).send();
        }
    }
);

export default router;
