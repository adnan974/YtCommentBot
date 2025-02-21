import Logger from "#utils/Logger";
import { BotDB, GoogleAccountDB, YoutubeConfigDB } from "models";

export async function saveBot(botUsername: string, googleAccountId: number) {
  try {
    const bot = await BotDB.create({
      username: botUsername,
      googleAccountId: googleAccountId,
    });

    Logger.info(
      `✅ Bot "${bot.get("username")}" has been saved to the database.`
    );
    return bot;
  } catch (error) {
    Logger.error(`❌ Failed to save bot to database: ${error}`);
  }
}

export async function getAllBots() {
  return BotDB.findAll({
    include: [{ model: GoogleAccountDB, as: "google_account" }],
    raw: true,
  });
}

export async function getBotById(botId: number) {
  return BotDB.findOne({
    where: { id: botId },
    include: [
      { model: GoogleAccountDB, as: "google_account" },
      { model: YoutubeConfigDB, as: "youtube_config" },
    ],
    raw: true,
    nest: true,
  });
}
