import { InsideHeartz } from "#database/init";
import { DataTypes } from "@sequelize/core";
import { GoogleAccountDB } from "./GoogleAccount";
import { YoutubeConfigDB } from "./YoutubeConfig";

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
  },
  {
    tableName: "bot",
    freezeTableName: true,
  }
);

// Définir la relation 1:1 ici
GoogleAccountDB.hasOne(BotDB, {
  foreignKey: "googleAccountId",
});

BotDB.belongsTo(GoogleAccountDB, {
  foreignKey: "googleAccountId",
});

YoutubeConfigDB.hasOne(BotDB, {
  foreignKey: "youtubeConfigId",
});

BotDB.belongsTo(YoutubeConfigDB, {
  foreignKey: "youtubeConfigId",
});
