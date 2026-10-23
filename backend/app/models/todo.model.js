import { DataTypes } from "sequelize";
import sequelize from "../config/sequelizeInstance.js";
export default sequelize.define("todo", {
  title: { type: DataTypes.STRING(255), allowNull: false },
  completed: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
  dueDate: { type: DataTypes.DATEONLY, allowNull: true, defaultValue: null },
  listId: { type: DataTypes.INTEGER, allowNull: false },
  userId: { type: DataTypes.INTEGER, allowNull: false },
});
