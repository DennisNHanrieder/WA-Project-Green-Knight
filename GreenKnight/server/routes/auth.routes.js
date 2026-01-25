import express from "express";
import bcrypt from "bcryptjs";
import { ObjectId } from "mongodb";
import {
    generateAccessToken,
    generateRefreshToken,
} from "../services/token.service.js";

const router = express.Router();

// Register
router.post("/register", async (req, res) => {
    const db = req.app.get("db");
    const { username, email, password, roles } = req.body;

    if (!username || !password) {
        return res.status(400).json({ error: "username und password erforderlich" });
    }

    const users = db.collection("users");
    const existing = await users.findOne({ username });
    if (existing) {
        return res.status(409).json({ error: "username bereits vergeben" });
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const user = {
        username,
        email: email || null,
        passwordHash,
        roles: roles?.length ? roles : ["user"],
        createdAt: new Date(),
    };

    const result = await users.insertOne(user);
    res.status(201).json({
        id: result.insertedId,
        username: user.username,
        roles: user.roles,
    });
});

// OAuth Token
router.post("/token", async (req, res) => {
    const { grant_type } = req.body;
    const db = req.app.get("db");
    const users = db.collection("users");

    if (grant_type === "password") {
        const { username, password } = req.body;

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

    res.status(400).json({ error: "unsupported_grant_type" });
});

export default router;
