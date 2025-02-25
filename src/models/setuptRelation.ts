import { BotDB } from "./Bot";
import { CommentDB } from "./Comment";
import { GoogleAccountDB } from "./GoogleAccount";
import { YoutubeConfigDB } from "./YoutubeConfig";

export function setupRelations() {
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

  BotDB.hasMany(CommentDB, {
    foreignKey: "botId",
  });

  CommentDB.belongsTo(BotDB, {
    foreignKey: "botId",
  });
}
