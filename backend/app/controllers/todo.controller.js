import db from "../models/index.js";
import { getAccessibleListOrNull, getAccessibleTodoOrNull } from "../authorization/authorization.js";
const titleError = title => typeof title !== "string" || !title.trim()
  ? "Todo title is required." : title.trim().length > 255 ? "Todo title must be 255 characters or fewer." : null;
const controller = {};
async function resolve(req, res, type) {
  const id = Number(req.params[type === "List" ? "listId" : "id"]);
  if (!Number.isSafeInteger(id) || id <= 0) { res.status(400).send({ message: `Invalid ${type.toLowerCase()} ID.` }); return null; }
  const row = await (type === "List" ? getAccessibleListOrNull(req, id) : getAccessibleTodoOrNull(req, id));
  if (!row) res.status(404).send({ message: `${type} with id=${id} not found.` });
  return row;
}
controller.findAll = async (req, res, next) => {
  try {
    const list = await resolve(req, res, "List"); if (!list) return;
    res.send(await db.todo.findAll({ where: { listId: list.id, userId: req.user.id }, order: [["completed", "ASC"], ["createdAt", "ASC"], ["id", "ASC"]] }));
  } catch (error) { next(error); }
};
controller.create = async (req, res, next) => {
  try {
    const list = await resolve(req, res, "List"); if (!list) return;
    const message = titleError(req.body.title); if (message) return res.status(400).send({ message });
    res.status(201).send(await db.todo.create({ title: req.body.title.trim(), completed: false, listId: list.id, userId: req.user.id }));
  } catch (error) { next(error); }
};
controller.update = async (req, res, next) => {
  try {
    const row = await resolve(req, res, "Todo"); if (!row) return;
    const data = {};
    if (Object.hasOwn(req.body, "title")) {
      const message = titleError(req.body.title); if (message) return res.status(400).send({ message });
      data.title = req.body.title.trim();
    }
    if (Object.hasOwn(req.body, "completed")) {
      if (typeof req.body.completed !== "boolean") return res.status(400).send({ message: "Completed must be a boolean." });
      data.completed = req.body.completed;
    }
    await db.todo.update(data, { where: { id: row.id, userId: req.user.id } });
    res.send(await db.todo.findOne({ where: { id: row.id, userId: req.user.id } }));
  } catch (error) { next(error); }
};
controller.remove = async (req, res, next) => {
  try {
    const row = await resolve(req, res, "Todo"); if (!row) return;
    await db.todo.destroy({ where: { id: row.id, userId: req.user.id } }); res.sendStatus(204);
  } catch (error) { next(error); }
};
export default controller;
