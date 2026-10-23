import request from "supertest";
import bcrypt from "bcryptjs";
import db from "../app/models/index.js";

export const syncTestDatabase = async () => {
  await db.sequelize.sync({ force: true });
};

export const defaultRegisterBody = (overrides = {}) => ({
  fName: "Jane",
  lName: "Doe",
  email: "jdoe@example.com",
  username: "jdoe",
  password: "password1",
  ...overrides,
});

export const registerUser = async (app, overrides = {}) => {
  const body = defaultRegisterBody(overrides);
  const res = await request(app).post("/todo/register").send(body);
  return { res, body };
};

export const findUserWithPassword = async (username) => {
  return db.user.unscoped().findOne({ where: { username: username.toLowerCase() } });
};

export const passwordMatchesHash = async (plain, hash) => {
  return bcrypt.compare(plain, hash);
};
