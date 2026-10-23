// Feature 2 — Spec: features/feature-2-todo-list-management.md
import request from "supertest";
import app from "../server.js";
import db from "../app/models/index.js";
import { registerUser } from "./helpers.js";
let a, b;
beforeEach(async () => {
  await db.sequelize.sync({ force: true });
  a = (await registerUser(app)).res.body;
  b = (await registerUser(app, { username: "other", email: "other@example.com" })).res.body;
});
afterAll(() => db.sequelize.close());
const call = (method, path = "", body) => request(app)[method](`/todo/lists${path}`).auth(a.token, { type: "bearer" }).send(body);
describe("Feature 2 — Todo list management", () => {
  describe("US-2.1 — Create todo lists", () => {
    it("User creates a new list", async () => {
      const res = await call("post", "", { name: " Groceries " });
      expect(res.status).toBe(201); expect(res.body).toMatchObject({ name: "Groceries", userId: a.userId });
    });
    it("User creates a list with an empty name", async () => {
      const res = await call("post", "", { name: " " }); expect(res.status).toBe(400);
      expect(res.body.message).toBe("List name is required."); expect(await db.list.count()).toBe(0);
    });
    it("User creates a list with a name that is too long", async () => {
      const res = await call("post", "", { name: "x".repeat(101) }); expect(res.status).toBe(400);
      expect(res.body.message).toBe("List name must be 100 characters or fewer.");
    });
  });
  describe("US-2.2 — View my lists", () => {
    it("Dashboard loads with existing lists", async () => {
      await db.list.bulkCreate([{ name: "Work", userId: a.userId }, { name: "Personal", userId: a.userId }]);
      expect((await call("get")).body.map(row => row.name)).toEqual(["Personal", "Work"]);
    });
    it("User cannot see another user's lists", async () => {
      await db.list.create({ name: "Secret Project", userId: b.userId }); expect((await call("get")).body).toEqual([]);
    });
  });
  describe("US-2.4 — Rename and delete lists", () => {
    it("User renames a list", async () => {
      const row = await db.list.create({ name: "Groceries", userId: a.userId });
      const res = await call("put", `/${row.id}`, { name: "Shopping", userId: b.userId });
      expect(res.status).toBe(200); expect(res.body).toMatchObject({ name: "Shopping", userId: a.userId });
    });
    it("User deletes a list", async () => {
      const row = await db.list.create({ name: "Groceries", userId: a.userId });
      expect((await call("delete", `/${row.id}`)).status).toBe(204); expect(await db.list.findByPk(row.id)).toBeNull();
    });
  });
  describe("US-2.5 — Private lists only", () => {
    for (const [method, verb] of [["put", "rename"], ["delete", "delete"]]) {
      it(`User attempts to ${verb} another user's list`, async () => {
        const row = await db.list.create({ name: "Secret", userId: b.userId });
        const res = await call(method, `/${row.id}`, { name: "Hijacked" });
        expect(res.status).toBe(404); expect(res.body.message).toBe(`List with id=${row.id} not found.`);
        expect((await db.list.findByPk(row.id)).name).toBe("Secret");
      });
    }
    it("Client cannot assign a list to another user on create", async () => {
      const res = await call("post", "", { name: "Groceries", userId: b.userId }); expect(res.body.userId).toBe(a.userId);
    });
    it("Unauthenticated API request to lists", async () => { expect((await request(app).get("/todo/lists")).status).toBe(401); });
    it("rejects malformed list IDs", async () => { expect((await call("put", "/1abc", { name: "No" })).status).toBe(400); });
  });
});
