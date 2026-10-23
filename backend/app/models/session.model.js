import { DataTypes } from "sequelize";
import sequelize from "../config/sequelizeInstance.js";

export default sequelize.define("session", {
  token: { type: DataTypes.STRING, allowNull: false },
  email: { type: DataTypes.STRING, allowNull: false },
  expirationDate: { type: DataTypes.DATE, allowNull: false },
  userId: { type: DataTypes.INTEGER, allowNull: false },
});
