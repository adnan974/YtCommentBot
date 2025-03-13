import { InsideHeartz } from "#database/init";
import { CommentDB } from "./Comment";
import { BotDB } from "./Bot";
import { GoogleAccountDB } from "./GoogleAccount";
import { YoutubeConfigDB } from "./YoutubeConfig";
import { setupRelations } from "./setuptRelation";
import Logger from "#utils/Logger";


async function initialize() {
  await InsideHeartz.sync()
    .then(() => {
      Logger.info("Database & tables synced!");
    })
    .catch((err) => {
      Logger.error("Error syncing database: " +err);
    });
}

setupRelations();

export {
  initialize,
  InsideHeartz,
  BotDB,
  CommentDB,
  GoogleAccountDB,
  YoutubeConfigDB
};
