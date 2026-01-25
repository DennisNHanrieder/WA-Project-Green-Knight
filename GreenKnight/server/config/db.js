import { MongoClient } from "mongodb";

export async function connectDB(app) {
    const client = new MongoClient(process.env.MONGODB_CONNECTION_STRING);
    await client.connect();

    const db = client.db("plantcare");
    app.set("db", db);

    await db.collection("users").createIndex({ username: 1 }, { unique: true });

    console.log("✅ MongoDB verbunden");
}
