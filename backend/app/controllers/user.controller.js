import bcrypt from "bcryptjs";
import db from "../models/index.js";
import { getAccessibleUserOrNull } from "../authorization/authorization.js";
async function owned(req, res) {
  const id = Number(req.params.id);
  if (!Number.isSafeInteger(id) || id <= 0) { res.status(400).send({ message: "Invalid user ID." }); return null; }
  const user = await getAccessibleUserOrNull(req, id);
  if (!user) res.status(404).send({ message: `User with id=${id} not found.` });
  return user;
}
const controller = {};
controller.findOne = async (req, res, next) => {
  try { const user = await owned(req, res); if (user) res.send(user); } catch (error) { next(error); }
};
controller.update = async (req, res, next) => {
  try {
    const user = await owned(req, res); if (!user) return;
    const data = {};
    for (const [field, label] of Object.entries({ fName: "First name", lName: "Last name", email: "Email", username: "Username" })) {
      if (typeof req.body[field] !== "string" || !req.body[field].trim()) return res.status(400).send({ message: `${label} is required.` });
      data[field] = req.body[field].trim();
    }
    data.email = data.email.toLowerCase(); data.username = data.username.toLowerCase();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) return res.status(400).send({ message: "Enter a valid email address." });
    if (data.username.length > 100) return res.status(400).send({ message: "Username must be 100 characters or fewer." });
    if (Object.hasOwn(req.body, "password")) {
      if (typeof req.body.password !== "string" || req.body.password.length < 8) return res.status(400).send({ message: "Password must be at least 8 characters." });
      data.password = await bcrypt.hash(req.body.password, 10);
    }
    for (const field of ["username", "email"]) {
      const existing = await db.user.findOne({ where: { [field]: data[field], id: { [db.Sequelize.Op.ne]: req.user.id } } });
      if (existing) return res.status(400).send({ message: field === "username" ? "Username is already taken." : "Email is already registered." });
    }
    await db.user.update(data, { where: { id: req.user.id } });
    await db.session.update({ email: data.email }, { where: { userId: req.user.id } });
    res.send(await getAccessibleUserOrNull(req, req.user.id));
  } catch (error) {
    if (error.name === "SequelizeUniqueConstraintError") return res.status(400).send({ message: "Username or email is already in use." });
    next(error);
  }
};
export default controller;
