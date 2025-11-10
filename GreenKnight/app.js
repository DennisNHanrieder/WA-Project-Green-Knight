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