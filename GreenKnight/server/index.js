import "dotenv/config";
import app from "./app.js";
import { connectDB } from "./config/db.js";

const port = 3000;

async function start() {
    await connectDB(app);
    app.listen(port, () =>
        console.log(`🚀 Server läuft auf http://localhost:${port}`)
    );
}

start();
