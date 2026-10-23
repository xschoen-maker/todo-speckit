import { DataTypes } from "sequelize";
import sequelize from "../config/sequelizeInstance.js";

export default sequelize.define("user", {
  fName: { type: DataTypes.STRING, allowNull: false },
  lName: { type: DataTypes.STRING, allowNull: false },
  email: { type: DataTypes.STRING, allowNull: false, unique: true },
  username: { type: DataTypes.STRING(100), allowNull: false, unique: true },
  password: { type: DataTypes.STRING(255), allowNull: false },
  role: { type: DataTypes.STRING(20), allowNull: false, defaultValue: "worker" },
}, { defaultScope: { attributes: { exclude: ["password"] } } });
