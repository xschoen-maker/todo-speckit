import { getAccessibleListOrNull } from "../authorization/authorization.js";
import db from "../models/index.js";
const nameError = name => typeof name !== "string" || !name.trim()
  ? "List name is required." : name.trim().length > 100 ? "List name must be 100 characters or fewer." : null;
const controller = {};
controller.findAll = async (req, res, next) => {
  try { res.send(await db.list.findAll({ where: { userId: req.user.id }, order: [["name", "ASC"]] })); }
  catch (error) { next(error); }
};
controller.create = async (req, res, next) => {
  const message = nameError(req.body.name);
  if (message) return res.status(400).send({ message });
  try { res.status(201).send(await db.list.create({ name: req.body.name.trim(), userId: req.user.id })); }
  catch (error) { next(error); }
};
async function owned(req, res) {
  const id = Number(req.params.listId);
  if (!Number.isSafeInteger(id) || id <= 0) { res.status(400).send({ message: "Invalid list ID." }); return null; }
  const row = await getAccessibleListOrNull(req, id);
  if (!row) res.status(404).send({ message: `List with id=${id} not found.` });
  return row;
}
controller.update = async (req, res, next) => {
  try {
    const row = await owned(req, res); if (!row) return;
    const message = nameError(req.body.name); if (message) return res.status(400).send({ message });
    await db.list.update({ name: req.body.name.trim() }, { where: { id: row.id, userId: req.user.id } });
    res.send(await getAccessibleListOrNull(req, row.id));
  } catch (error) { next(error); }
};
controller.remove = async (req, res, next) => {
  try {
    const row = await owned(req, res); if (!row) return;
    await db.list.destroy({ where: { id: row.id, userId: req.user.id } }); res.sendStatus(204);
  } catch (error) { next(error); }
};
export default controller;
