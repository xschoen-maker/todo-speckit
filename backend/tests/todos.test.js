// Feature 3 — Spec: features/feature-3-todo-list-item-management.md
import request from "supertest";
import app from "../server.js";
import db from "../app/models/index.js";
import { registerUser } from "./helpers.js";
let a, b, list, otherList, todo;
beforeEach(async () => {
  await db.sequelize.sync({ force: true });
  a = (await registerUser(app)).res.body;
  b = (await registerUser(app, { username: "other", email: "other@example.com" })).res.body;
  list = await db.list.create({ name: "Work", userId: a.userId });
  otherList = await db.list.create({ name: "Secret", userId: b.userId });
  todo = await db.todo.create({ title: "My task", listId: list.id, userId: a.userId });
});
afterAll(() => db.sequelize.close());
const call = (method, path, body) => request(app)[method](`/todo${path}`).auth(a.token, { type: "bearer" }).send(body);
describe("Feature 3 — Todo list items", () => {
  describe("US-3.1 — Add tasks to a list", () => {
    it("User adds a todo to a list via dialog", async () => {
      const res = await call("post", `/lists/${list.id}/todos`, { title: " Buy milk ", completed: true });
      expect(res.status).toBe(201); expect(res.body).toMatchObject({ title: "Buy milk", completed: false, listId: list.id, userId: a.userId });
    });
    it("User adds a todo with an empty title", async () => {
      const res = await call("post", `/lists/${list.id}/todos`, { title: " " });
      expect(res.status).toBe(400); expect(res.body.message).toBe("Todo title is required."); expect(await db.todo.count()).toBe(1);
    });
    it("rejects titles longer than 255 characters", async () => {
      expect((await call("post", `/lists/${list.id}/todos`, { title: "x".repeat(256) })).status).toBe(400);
    });
  });
  describe("US-3.2 — View tasks in a list", () => {
    it("User opens items for different lists", async () => {
      const second = await db.list.create({ name: "Personal", userId: a.userId });
      await db.todo.create({ title: "Call mom", listId: second.id, userId: a.userId });
      expect((await call("get", `/lists/${second.id}/todos`)).body.map(t => t.title)).toEqual(["Call mom"]);
      expect((await call("get", `/lists/${list.id}/todos`)).body.map(t => t.title)).toEqual(["My task"]);
    });
    it("User only sees their own todos when opening items", async () => {
      await db.todo.create({ title: "Their task", listId: otherList.id, userId: b.userId });
      expect((await call("get", `/lists/${list.id}/todos`)).body.map(t => t.title)).toEqual(["My task"]);
    });
    it("orders incomplete tasks first and preserves creation order", async () => {
      await todo.update({ completed: true });
      await db.todo.create({ title: "New", listId: list.id, userId: a.userId });
      expect((await call("get", `/lists/${list.id}/todos`)).body.map(t => t.title)).toEqual(["New", "My task"]);
    });
  });
  describe("US-3.3 — Complete tasks", () => {
    it("User marks a todo as complete", async () => {
      const res = await call("put", `/todos/${todo.id}`, { completed: true }); expect(res.status).toBe(200); expect(res.body.completed).toBe(true);
    });
    it("User marks a completed todo as incomplete", async () => {
      await todo.update({ completed: true }); const res = await call("put", `/todos/${todo.id}`, { completed: false }); expect(res.body.completed).toBe(false);
    });
  });
  describe("US-3.4 — Edit and remove tasks", () => {
    it("User edits a todo title", async () => {
      const res = await call("put", `/todos/${todo.id}`, { title: "Buy oat milk", userId: b.userId, listId: otherList.id });
      expect(res.body).toMatchObject({ title: "Buy oat milk", listId: list.id, userId: a.userId });
    });
    it("User deletes a todo", async () => {
      expect((await call("delete", `/todos/${todo.id}`)).status).toBe(204); expect(await db.todo.findByPk(todo.id)).toBeNull();
    });
  });
  describe("US-3.5 — Private items only", () => {
    it("User cannot read todos in another user's list", async () => {
      const res = await call("get", `/lists/${otherList.id}/todos`); expect(res.status).toBe(404);
      expect(res.body.message).toBe(`List with id=${otherList.id} not found.`);
    });
    it("User attempts to add a todo to another user's list", async () => {
      expect((await call("post", `/lists/${otherList.id}/todos`, { title: "Intruder" })).status).toBe(404);
      expect(await db.todo.count({ where: { listId: otherList.id } })).toBe(0);
    });
    for (const [method, verb] of [["put", "rename"], ["delete", "delete"]]) {
      it(`User attempts to ${verb} another user's todo`, async () => {
        const other = await db.todo.create({ title: "Hidden", listId: otherList.id, userId: b.userId });
        const res = await call(method, `/todos/${other.id}`, { title: "Hijacked" });
        expect(res.status).toBe(404); expect(res.body.message).toBe(`Todo with id=${other.id} not found.`);
        expect((await db.todo.findByPk(other.id)).title).toBe("Hidden");
      });
    }
    it("Client cannot assign a todo to another user on create", async () => {
      const res = await call("post", `/lists/${list.id}/todos`, { title: "Mine", userId: b.userId, listId: otherList.id });
      expect(res.body).toMatchObject({ userId: a.userId, listId: list.id });
    });
    it("Unauthenticated API request for todos", async () => {
      expect((await request(app).get(`/todo/lists/${list.id}/todos`)).status).toBe(401);
    });
  });
  describe("US-3.6 — Lists carry their items", () => {
    it("Deleting a list removes its todos", async () => {
      expect((await call("delete", `/lists/${list.id}`)).status).toBe(204);
      expect(await db.todo.findByPk(todo.id)).toBeNull();
    });
  });
});
