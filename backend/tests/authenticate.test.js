// Feature 1 — Spec: features/feature-1-user-auth.md
import request from "supertest";
import app from "../server.js";
import db from "../app/models/index.js";
beforeEach(async () => { await db.sequelize.sync({ force: true }); });
afterAll(async () => { await db.sequelize.close(); });
async function register(username) {
  return (await request(app).post("/todo/register").send({ fName: "Test", lName: "User", username, email: `${username}@example.com`, password: "password123" })).body;
}
describe("Feature 1 — Session authentication", () => {
  describe("US-1.3 — Stay signed in across page loads", () => {
    it("API request includes session token", async () => {
      const user = await register("alice");
      expect((await request(app).get("/todo/lists").set("Authorization", `Bearer ${user.token}`)).status).toBe(200);
      expect((await request(app).get("/todo/lists")).status).toBe(401);
    });
    it("Protected API request succeeds with a valid session", async () => {
      const a = await register("alice"), b = await register("bob");
      await db.list.create({ name: "My list", userId: a.userId });
      await db.list.create({ name: "Private", userId: b.userId });
      const res = await request(app).get("/todo/lists").auth(a.token, { type: "bearer" });
      expect(res.status).toBe(200); expect(res.body).toHaveLength(1);
      expect(res.body[0]).toMatchObject({ name: "My list", userId: a.userId });
    });
    it("Expired or invalid session token", async () => {
      const a = await register("alice");
      await db.session.update({ expirationDate: new Date(0) }, { where: { userId: a.userId } });
      for (const token of [a.token, "invalid"]) {
        const res = await request(app).get("/todo/lists").auth(token, { type: "bearer" });
        expect(res.status).toBe(401); expect(res.body.message).toMatch(/Unauthorized/);
      }
    });
  });
  describe("US-1.5 — Block unauthenticated access", () => {
    it("Unauthenticated user accesses a protected route", async () => {
      expect((await request(app).get("/todo/lists")).status).toBe(401);
      expect((await request(app).post("/todo/logout")).status).toBe(401);
    });
  });
});
