import { DataTypes } from "sequelize";
import sequelize from "../config/sequelizeInstance.js";
import logger from "../config/logger.js";
try {
  const query = sequelize.getQueryInterface();
  const columns = await query.describeTable("todos");
  if (!columns.dueDate) await query.addColumn("todos", "dueDate", { type: DataTypes.DATEONLY, allowNull: true, defaultValue: null });
  logger.info("Todo due-date column is ready.");
} finally { await sequelize.close(); }
