// Feature 4 — Spec: features/feature-4-user-profile-management.md
import request from "supertest";
import bcrypt from "bcryptjs";
import app from "../server.js";
import db from "../app/models/index.js";
import { registerUser, defaultRegisterBody } from "./helpers.js";
let a, b, body;
beforeEach(async () => {
  await db.sequelize.sync({ force: true });
  a = (await registerUser(app)).res.body;
  b = (await registerUser(app, { username: "other", email: "other@example.com" })).res.body;
  body = defaultRegisterBody(); delete body.password;
});
afterAll(() => db.sequelize.close());
const call = (method, id = a.userId, data = body) => request(app)[method](`/todo/users/${id}`).auth(a.token, { type: "bearer" }).send(data);
describe("Feature 4 — User profile", () => {
  describe("US-4.2 — Edit profile", () => {
    it("User fetches their own profile", async () => {
      const res = await call("get"); expect(res.status).toBe(200); expect(res.body).toMatchObject({ id: a.userId, username: "jdoe" }); expect(res.body.password).toBeUndefined();
    });
    it("User saves profile changes", async () => {
      const before = (await db.user.unscoped().findByPk(a.userId)).password;
      const res = await call("put", a.userId, { ...body, fName: "Janet", role: "admin" });
      expect(res.status).toBe(200); expect(res.body).toMatchObject({ fName: "Janet", role: "worker" }); expect(res.body.password).toBeUndefined();
      expect((await db.user.unscoped().findByPk(a.userId)).password).toBe(before);
      const changed = await call("put", a.userId, { ...body, password: "newPassword123" }); expect(changed.status).toBe(200);
      expect(await bcrypt.compare("newPassword123", (await db.user.unscoped().findByPk(a.userId)).password)).toBe(true);
    });
    it("User attempts to fetch another user's profile", async () => {
      const res = await call("get", b.userId); expect(res.status).toBe(404); expect(res.body.message).toBe(`User with id=${b.userId} not found.`);
    });
    it("User attempts to update another user's profile", async () => {
      expect((await call("put", b.userId, { ...body, fName: "Hacked" })).status).toBe(404);
      expect((await db.user.findByPk(b.userId)).fName).toBe("Jane");
    });
    it("Unauthenticated profile API request", async () => { expect((await request(app).get(`/todo/users/${a.userId}`)).status).toBe(401); });
    it("Unauthenticated profile update API request", async () => { expect((await request(app).put(`/todo/users/${a.userId}`).send(body)).status).toBe(401); });
    it("Profile update rejects a password that is too short", async () => {
      const res = await call("put", a.userId, { ...body, password: "short" }); expect(res.status).toBe(400); expect(res.body.message).toBe("Password must be at least 8 characters.");
    });
    it("Profile update rejects missing required fields", async () => {
      for (const field of ["fName", "lName", "email", "username"]) expect((await call("put", a.userId, { ...body, [field]: " " })).status).toBe(400);
    });
    it("Profile update rejects a duplicate username", async () => {
      const res = await call("put", a.userId, { ...body, username: b.username }); expect(res.status).toBe(400); expect(res.body.message).toBe("Username is already taken.");
    });
    it("Profile update rejects a duplicate email", async () => {
      const res = await call("put", a.userId, { ...body, email: b.email }); expect(res.status).toBe(400); expect(res.body.message).toBe("Email is already registered.");
    });
    it("rejects an invalid email", async () => { expect((await call("put", a.userId, { ...body, email: "bad" })).status).toBe(400); });
  });
});
