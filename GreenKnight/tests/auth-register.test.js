import test from "node:test";
import assert from "node:assert/strict";
import request from "supertest";
import app from "../server/app.js";

/* ---------- Mock DB ---------- */

function makeMockDb(overrides = {}) {
  const usersCollection = {
    // Default: User existiert nicht
    findOne: async () => null,

    // Simulierter Insert
    insertOne: async () => ({
      insertedId: "507f1f77bcf86cd799439011",
    }),

    ...overrides.users,
  };

  return {
    collection: (name) => {
      if (name === "users") return usersCollection;
      throw new Error(`Unexpected collection: ${name}`);
    },
  };
}

/* ---------- Tests ---------- */

test("POST /auth/register -> 201 creates user", async () => {
  app.set("db", makeMockDb());

  const res = await request(app)
      .post("/auth/register")
      .send({
        username: "Tom Bombadil",
        email: "TomBombadil@LOTR.com",
        password: "Goldbeere",
      })
      .expect(201);

  assert.equal(res.body.username, "Tom Bombadil");
  assert.deepEqual(res.body.roles, ["user"]);
  assert.ok(res.body.id);
});

test("POST /auth/register -> 409 when username exists", async () => {
  app.set(
      "db",
      makeMockDb({
        users: {
          findOne: async () => ({
            _id: "existing-id",
            username: "Tom Bombadil",
          }),
        },
      })
  );

  const res = await request(app)
      .post("/auth/register")
      .send({
        username: "Tom Bombadil",
        password: "Goldbeere",
      })
      .expect(409);

  assert.equal(res.body.error, "username bereits vergeben");
});
