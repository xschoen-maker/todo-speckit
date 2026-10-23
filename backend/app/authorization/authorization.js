import db from "../models/index.js";
import jwt from "jsonwebtoken";
import authConfig from "../config/auth.config.js";

const Session = db.session;
const User = db.user;
export const getAccessibleListOrNull = (req, listId) =>
  db.list.findOne({ where: { id: listId, userId: req.user.id } });
export const getAccessibleTodoOrNull = (req, id) =>
  db.todo.findOne({ where: { id, userId: req.user.id },
    include: [{ model: db.list, required: true, where: { userId: req.user.id } }] });
export const getAccessibleUserOrNull = (req, id) =>
  db.user.findOne({ where: { id, [db.Sequelize.Op.and]: { id: req.user.id } } });

export async function authenticate(req, res, next) {
  try {
    const header = req.headers.authorization || "";
    const [scheme, token] = header.split(" ");

    if (scheme !== "Bearer" || !token) {
      return res.status(401).send({ message: "Unauthorized! No token provided." });
    }
    const claims = jwt.verify(token, authConfig.secret);

    const session = await Session.findOne({
      where: { token },
      include: [{ model: User }],
    });

    if (!session || !session.token) {
      return res.status(401).send({ message: "Unauthorized! Invalid token." });
    }

    if (new Date(session.expirationDate) < new Date()) {
      return res.status(401).send({ message: "Unauthorized! Token expired." });
    }

    const user = session.user;
    if (!user || claims.id !== user.id) {
      return res.status(401).send({ message: "Unauthorized! Invalid token." });
    }

    req.user = { id: user.id, role: user.role };
    return next();
  } catch (err) {
    return res.status(401).send({ message: "Unauthorized! Invalid token." });
  }
}
