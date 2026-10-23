import { Sequelize } from "sequelize";
import sequelize from "../config/sequelizeInstance.js";
import user from "./user.model.js";
import session from "./session.model.js";
import list from "./list.model.js";
import todo from "./todo.model.js";

const db = {};
db.Sequelize = Sequelize;
db.sequelize = sequelize;
db.user = user;
db.session = session;
db.list = list;
db.todo = todo;
list.hasMany(todo, { foreignKey: "listId", onDelete: "CASCADE" });
todo.belongsTo(list, { foreignKey: "listId" });
user.hasMany(todo, { foreignKey: "userId", onDelete: "CASCADE" });
todo.belongsTo(user, { foreignKey: "userId" });
user.hasMany(session, { foreignKey: "userId", onDelete: "CASCADE" });
session.belongsTo(user, { foreignKey: "userId" });
user.hasMany(list, { foreignKey: "userId", onDelete: "CASCADE" });
list.belongsTo(user, { foreignKey: "userId" });


export default db;
