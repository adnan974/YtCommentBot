import { InsideHeartz } from "#database/init";
import { DataTypes } from "@sequelize/core";
import { GoogleAccountDB } from "./GoogleAccount";
import { YoutubeConfigDB } from "./YoutubeConfig";
import { CommentDB } from "./Comment";

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