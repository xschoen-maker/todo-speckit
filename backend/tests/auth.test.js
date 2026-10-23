// Feature 1 — Spec: features/feature-1-user-auth.md
import request from "supertest";
import bcrypt from "bcryptjs";
import app from "../server.js";
import db from "../app/models/index.js";

export const account = { fName: "Jane", lName: "Doe", email: "jane@example.com", username: "jdoe", password: "password123" };
beforeEach(async () => { await db.sequelize.sync({ force: true }); });
afterAll(async () => { await db.sequelize.close(); });
const register = (data = account) => request(app).post("/todo/register").send(data);

describe("Feature 1 — User authentication", () => {
  describe("US-1.1 — Registration", () => {
    it("User registers with valid information", async () => {
      const res = await register();
      expect(res.status).toBe(201);
      expect(res.body).toMatchObject({ username: "jdoe", role: "worker", fName: "Jane" });
      expect(res.body.token).toBeTruthy(); expect(res.body.password).toBeUndefined();
      const user = await db.user.unscoped().findByPk(res.body.userId);
      expect(await bcrypt.compare(account.password, user.password)).toBe(true);
      expect(bcrypt.getRounds(user.password)).toBe(10);
      expect((await db.user.findByPk(user.id)).password).toBeUndefined();
      const session = await db.session.findOne();
      expect(session.expirationDate.getTime() - Date.now()).toBeGreaterThan(86300000);
    });
    it("User submits registration with missing email", async () => {
      const res = await register({ ...account, email: " " });
      expect(res.status).toBe(400); expect(res.body.message).toBe("Email is required.");
      expect(await db.user.count()).toBe(0);
    });
    it("User submits registration with password too short", async () => {
      expect((await register({ ...account, password: "short" })).status).toBe(400);
    });
    it("User registers with a duplicate username", async () => {
      await register(); const res = await register({ ...account, email: "other@example.com" });
      expect(res.status).toBe(400); expect(res.body.message).toBe("Username is already taken.");
    });
    it("User registers with a duplicate email", async () => {
      await register(); const res = await register({ ...account, username: "other" });
      expect(res.status).toBe(400); expect(res.body.message).toBe("Email is already registered.");
    });
    it("normalizes usernames and ignores a client supplied role", async () => {
      const res = await register({ ...account, username: " JDOE ", role: "admin" });
      expect(res.body).toMatchObject({ username: "jdoe", role: "worker" });
    });
  });
  describe("US-1.2 — Sign in", () => {
    it("User signs in with valid credentials", async () => {
      const first = await register();
      const res = await request(app).post("/todo/login").send({ username: " JDOE ", password: account.password });
      expect(res.status).toBe(200); expect(res.body.token).toBe(first.body.token);
      expect(await db.session.count()).toBe(1); expect(res.body.password).toBeUndefined();
    });
    it("User signs in with invalid password", async () => {
      await register();
      const res = await request(app).post("/todo/login").send({ username: "jdoe", password: "wrong" });
      const missing = await request(app).post("/todo/login").send({ username: "unknown", password: "wrong" });
      expect(res.status).toBe(401); expect(res.body.message).toBe("Invalid username or password.");
      expect(missing.body).toEqual(res.body);
    });
    for (const [field, message] of [["username", "Username is required."], ["password", "Password is required."]]) {
      it(`User signs in with missing ${field}`, async () => {
        const res = await request(app).post("/todo/login").send({ username: "jdoe", password: "password123", [field]: "" });
        expect(res.status).toBe(400); expect(res.body.message).toBe(message);
      });
    }
  });
  describe("US-1.4 — Sign out", () => {
    it("User signs out", async () => {
      const { body } = await register();
      expect((await request(app).post("/todo/logout").auth(body.token, { type: "bearer" })).status).toBe(200);
      expect((await request(app).get("/todo/lists").auth(body.token, { type: "bearer" })).status).toBe(401);
    });
  });
});
