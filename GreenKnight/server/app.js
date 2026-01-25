import express from "express";
import path from "path";
import { fileURLToPath } from "url";

import logger from "./middleware/logger.js";
import authRoutes from "./routes/auth.routes.js";
import plantRoutes from "./routes/plants.routes.js";
import wikiRoutes from "./routes/wiki.routes.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

app.use(logger);
app.use(express.json());

// Static
app.use("/uploads", express.static(path.join(__dirname, "uploads")));
app.use(express.static(path.join(__dirname, "../dist")));

// Routes
app.use("/auth", authRoutes);
app.use("/oauth", authRoutes);
app.use("/api/plants", plantRoutes);
app.use("/api/wiki", wikiRoutes);

// React fallback
app.use((req, res) => {
    res.sendFile(path.join(__dirname, "dist", "index.html"));
});

export default app;
