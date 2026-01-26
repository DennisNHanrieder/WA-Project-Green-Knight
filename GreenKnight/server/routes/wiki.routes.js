import express from "express";
import { ObjectId } from "mongodb";
import multer from "multer";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";
import { authenticateToken } from "../middleware/auth.js";

const router = express.Router();

/* ---------- Multer Setup ---------- */
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const uploadDir = path.join(__dirname, "../uploads");

if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
    destination: (_, __, cb) => cb(null, uploadDir),
    filename: (_, file, cb) => {
        const safeName = file.originalname.replace(/\s+/g, "_");
        cb(null, Date.now() + "-" + safeName);
    },
});

const upload = multer({ storage });

/* ---------- AUTH ---------- */
router.use(authenticateToken);

/* ========================================================= */
/* ======================== GET ALL ======================== */
/* ========================================================= */
router.get("/", async (req, res) => {
    try {
        const db = req.app.get("db");

        const entries = await db
            .collection("wiki")
            .find({})
            .sort({ createdAt: -1 })
            .toArray();

        const mapped = entries.map((e) => ({
            ...e,
            _id: e._id.toString(),
            userId: e.userId?.toString() || null,
            thumbnailUrl: e.thumbnail
                ? `/uploads/${e.thumbnail}`
                : null,
        }));

        res.json(mapped);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Failed to load wiki entries" });
    }
});

/* ========================================================= */
/* ====================== GET ONE ========================== */
/* ========================================================= */
router.get("/:id", async (req, res) => {
    try {
        const db = req.app.get("db");

        const entry = await db.collection("wiki").findOne({
            _id: new ObjectId(req.params.id),
        });

        if (!entry) {
            return res.status(404).json({ error: "Not found" });
        }

        res.json({
            ...entry,
            _id: entry._id.toString(),
            userId: entry.userId?.toString() || null,
            thumbnailUrl: entry.thumbnail
                ? `/uploads/${entry.thumbnail}`
                : null,
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Failed to load entry" });
    }
});

/* ========================================================= */
/* ======================== CREATE ========================= */
/* ========================================================= */
router.post("/", upload.single("thumbnail"), async (req, res) => {
    try {
        const db = req.app.get("db");
        const user = req.user;

        const entry = {
            title: req.body.title,
            content: req.body.content,
            thumbnail: req.file?.filename || null,
            userId: new ObjectId(user.id),
            createdBy: user.username,
            createdAt: new Date(),
            updatedAt: new Date(),
        };

        const result = await db.collection("wiki").insertOne(entry);

        res.status(201).json({
            ...entry,
            _id: result.insertedId.toString(),
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Failed to create entry" });
    }
});

/* ========================================================= */
/* ========================= UPDATE ======================== */
/* ========================================================= */
router.put("/:id", upload.single("thumbnail"), async (req, res) => {
    try {
        const db = req.app.get("db");
        const user = req.user;

        const entry = await db.collection("wiki").findOne({
            _id: new ObjectId(req.params.id),
        });

        if (!entry) {
            return res.status(404).json({ error: "Not found" });
        }

        if (entry.userId.toString() !== user.id) {
            return res.status(403).json({ error: "Not allowed" });
        }

        const update = {
            title: req.body.title,
            content: req.body.content,
            updatedAt: new Date(),
            updatedBy: user.username,
        };

        if (req.file) {
            update.thumbnail = req.file.filename;
        }

        await db.collection("wiki").updateOne(
            { _id: entry._id },
            { $set: update }
        );

        res.json({ ok: true });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Failed to update entry" });
    }
});

/* ========================================================= */
/* ========================= DELETE ======================== */
/* ========================================================= */
router.delete("/:id", async (req, res) => {
    try {
        const db = req.app.get("db");
        const user = req.user;

        const entry = await db.collection("wiki").findOne({
            _id: new ObjectId(req.params.id),
        });

        if (!entry) {
            return res.status(404).json({ error: "Not found" });
        }

        if (entry.userId.toString() !== user.id) {
            return res.status(403).json({ error: "Not allowed" });
        }

        await db.collection("wiki").deleteOne({ _id: entry._id });

        res.status(204).end();
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Failed to delete entry" });
    }
});

export default router;
