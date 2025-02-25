import { InsideHeartz } from "#database/init";
import { DataTypes } from "@sequelize/core";
import { BotDB } from "./Bot";

export const CommentDB = InsideHeartz.define(
  "comment",
  {
    username: DataTypes.STRING,
    video_url: DataTypes.STRING,
    comment_status: DataTypes.STRING,
    comment: DataTypes.STRING,
    botId: {
      type: DataTypes.INTEGER,
      allowNull: false, 
      references: {
        model: BotDB,
        key: "id",
      },
    },
  },
  {
    tableName: "comment",
    freezeTableName: true,
  }
);
