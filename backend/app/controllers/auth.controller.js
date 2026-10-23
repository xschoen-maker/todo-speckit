import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { randomUUID } from "node:crypto";
import { Op } from "sequelize";
import db from "../models/index.js";
import authConfig from "../config/auth.config.js";
import logger from "../config/logger.js";

const payload = (user, token) => ({ userId: user.id, username: user.username,
  email: user.email, fName: user.fName, lName: user.lName, role: user.role, token });

async function sessionFor(user) {
  const current = await db.session.findOne({ where: {
    userId: user.id, expirationDate: { [Op.gt]: new Date() }, token: { [Op.ne]: "" },
  } });
  if (current) return current.token;
  const token = jwt.sign({ id: user.id }, authConfig.secret,
    { expiresIn: 86400, jwtid: randomUUID() });
  await db.session.create({ userId: user.id, email: user.email, token,
    expirationDate: new Date(Date.now() + 86400000) });
  return token;
}

const controller = {};
controller.register = async (req, res) => {
  const { password } = req.body;
  const fields = {};
  for (const [field, label] of Object.entries({ fName: "First name", lName: "Last name", email: "Email", username: "Username" })) {
    if (typeof req.body[field] !== "string" || !req.body[field].trim())
      return res.status(400).send({ message: `${label} is required.` });
    fields[field] = req.body[field].trim();
  }
  fields.username = fields.username.toLowerCase();
  fields.email = fields.email.toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(fields.email))
    return res.status(400).send({ message: "Enter a valid email address." });
  if (typeof password !== "string" || password.length < 8)
    return res.status(400).send({ message: "Password must be at least 8 characters." });
  if (fields.username.length > 100)
    return res.status(400).send({ message: "Username must be 100 characters or fewer." });
  try {
    if (await db.user.findOne({ where: { username: fields.username } }))
      return res.status(400).send({ message: "Username is already taken." });
    if (await db.user.findOne({ where: { email: fields.email } }))
      return res.status(400).send({ message: "Email is already registered." });
    const user = await db.user.create({ ...fields, password: await bcrypt.hash(password, 10), role: "worker" });
    return res.status(201).send(payload(user, await sessionFor(user)));
  } catch (error) {
    if (error.name === "SequelizeUniqueConstraintError")
      return res.status(400).send({ message: error.errors[0]?.path === "username" ? "Username is already taken." : "Email is already registered." });
    logger.error(error.message);
    return res.status(500).send({ message: "Unable to create account." });
  }
};
controller.login = async (req, res) => {
  const { username, password } = req.body;
  if (typeof username !== "string" || !username.trim())
    return res.status(400).send({ message: "Username is required." });
  if (typeof password !== "string" || !password)
    return res.status(400).send({ message: "Password is required." });
  try {
    const user = await db.user.unscoped().findOne({ where: { username: username.trim().toLowerCase() } });
    if (!user || !(await bcrypt.compare(password, user.password)))
      return res.status(401).send({ message: "Invalid username or password." });
    return res.send(payload(user, await sessionFor(user)));
  } catch (error) {
    logger.error(error.message);
    return res.status(500).send({ message: "Unable to sign in." });
  }
};
controller.logout = async (req, res) => {
  await db.session.destroy({ where: { userId: req.user.id, token: req.headers.authorization.slice(7) } });
  return res.send({ message: "Signed out." });
};
export default controller;
