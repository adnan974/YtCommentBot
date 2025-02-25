import { InsideHeartz } from "#database/init";
import { CommentDB } from "./Comment";
import { BotDB } from "./Bot";
import { GoogleAccountDB } from "./GoogleAccount";
import { YoutubeConfigDB } from "./YoutubeConfig";
import { setupRelations } from "./setuptRelation";


async function initialize() {
  await InsideHeartz.sync()
    .then(() => {
      console.log("Database & tables synced!");
    })
    .catch((err) => {
      console.error("Error syncing database:", err);
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
