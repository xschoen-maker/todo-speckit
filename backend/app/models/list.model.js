import { DataTypes } from "sequelize";
import sequelize from "../config/sequelizeInstance.js";

// Feature 1's protected-list acceptance scenario requires real owned rows.
export default sequelize.define("list", {
  name: { type: DataTypes.STRING(100), allowNull: false },
  userId: { type: DataTypes.INTEGER, allowNull: false },
});
