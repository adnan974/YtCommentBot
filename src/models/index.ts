import { InsideHeartz } from "#database/init";
import { CommentDB } from "./Comment";
import { BotDB } from "./Bot";
import { GoogleAccountDB } from "./GoogleAccount";
import { YoutubeConfigDB } from "./YoutubeConfig";


async function initialize() {
  await InsideHeartz.sync({ alter: true })
    .then(() => {
      console.log("Database & tables synced!");
    })
    .catch((err) => {
      console.error("Error syncing database:", err);
    });
}

export {
  initialize,
  InsideHeartz,
  CommentDB,
  BotDB,
  GoogleAccountDB,
  YoutubeConfigDB
};
