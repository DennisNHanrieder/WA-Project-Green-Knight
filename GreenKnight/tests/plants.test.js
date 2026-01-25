import test from "node:test";
import assert from "node:assert/strict";
import request from "supertest";
import jwt from "jsonwebtoken";
import app from "../server/app.js";

/* ---------- Helper ---------- */

function makeMockDb(plants = []) {
  return {
    collection: (name) => {
      if (name !== "plants") {
        throw new Error(`Unexpected collection: ${name}`);
      }

      return {
        find: () => ({
          toArray: async () => plants,
        }),
      };
    },
  };
}

function makeAccessToken({
                           sub = "test-user-id",
                           username = "testuser",
                           roles = ["user"],
                         } = {}) {
  // sicherstellen, dass der Secret gesetzt ist
  process.env.JWT_ACCESS_SECRET =
      process.env.JWT_ACCESS_SECRET || "test-access-secret";

  return jwt.sign(
      {
        sub,          // 👈 wichtig: im Payload
        username,
        roles,
      },
      process.env.JWT_ACCESS_SECRET,
      { expiresIn: "15m" }
  );
}

/* ---------- Tests ---------- */

test("GET /api/plants -> 200 returns plants array (authorized)", async () => {
  const samplePlants = [
    { _id: "p1", name: "Monstera", description: "Pflanze" },
    { _id: "p2", name: "Aloe", description: "Pflanze" },
  ];

  // Mock-DB setzen
  app.set("db", makeMockDb(samplePlants));

  const token = makeAccessToken({
    username: "Tom Bombadil",
    roles: ["user"],
  });

  const res = await request(app)
      .get("/api/plants")
      .set("Authorization", `Bearer ${token}`)
      .expect(200);

  assert.deepEqual(res.body, samplePlants);
});

test("GET /api/plants -> 401 when missing token", async () => {
  // Mock-DB trotzdem setzen (Middleware kommt vorher)
  app.set("db", makeMockDb([]));

  const res = await request(app)
      .get("/api/plants")
      .expect(401);

  assert.ok(res.body?.error);
});
