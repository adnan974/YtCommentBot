import { InsideHeartz } from "#database/init";
import { DataTypes } from "@sequelize/core";

export const BotDB = InsideHeartz.define(
  "bot",
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    username: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    csvCommentPath: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    numberMaxOfComments: {
      type: DataTypes.INTEGER,
      allowNull: false, 
    }
  },
  {
    tableName: "bot",
    freezeTableName: true,
  }
);