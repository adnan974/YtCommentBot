import "module-alias/register";
import { LaunchBrowser } from "#lib/Browser";
import LoginYoutube from "#lib/LoginYoutube";
import Logger from "#utils/Logger";
import { banner } from "#utils/banner";
import { randomDelay } from "#utils/randomDelay";
import { getEnv } from "./config";

import { BotDB, GoogleAccountDB, initialize } from "models";
import Downloader from "#utils/net";
import fs from "fs";
import YOMEN from "#lib/Bot/YoutubeBot";
import {
  getSearchPreferences,
  getUserBotPreference,
} from "services/PromptTerminalService";
import { getBotById } from "repository/BotRepository";
import store from "store/store";

// Update your main function
async function main() {
  Logger.divider();
  Logger.banner(banner);
  Logger.divider();

  const botId = await getUserBotPreference();

  const botData = await getBotById(botId);

  // add bot data to store
  store.setBotData(botData);

  const preferences = await getSearchPreferences();
  const browser = new LaunchBrowser(getEnv("USERNAME"));
  await browser.init();

  const pages = await browser.page;
  const login = new LoginYoutube(pages);
  await login.login();

  const yomen = new YOMEN(pages);

  let urls: string[];
  if (preferences.searchType === "trending") {
    urls = await yomen.getTrendingVideos(); // You'll need to implement this method
  } else {
    Logger.info(`Searching for keyword: ${preferences.keyword}`);
    urls = await yomen.searchKeyword(
      preferences.keyword,
      botData.youtube_config.sortValue
    );
  }

  for (const url of urls) {
    Logger.info(`Navigating to video: ${url}`);
    console.log(preferences);
    if (preferences.commentType === "ai") {
      await yomen.goToVideo(url, "ai");
    } else if (preferences.commentType === "copy") {
      await yomen.goToVideo(url, "copy");
    } else if (
      preferences.commentType === "manual" &&
      preferences.manualCommentType === "csv"
    ) {
      await yomen.goToVideo(url, "csv");
    } else if (
      preferences.commentType === "manual" &&
      preferences.manualCommentType === "direct"
    ) {
      await yomen.goToVideo(url, "direct", preferences.comment);
    }

    await randomDelay(5000, 10000);
  }

  Logger.info("Process completed");
}

async function init() {
  await initialize();
  const zipFilePath = "./bin.zip";
  const driverFolderPath = "./driver";

  // Check if the driver folder exists and is not empty
  if (
    fs.existsSync(driverFolderPath) &&
    fs.readdirSync(driverFolderPath).length > 0
  ) {
    Logger.info("Driver files already exist. Skipping download.");
    await main(); // Proceed to the main process
  } else {
    // Check if the zip file exists
    if (fs.existsSync(zipFilePath)) {
      Logger.info("Zip file already exists. Skipping download.");
      const downloader = new Downloader(zipFilePath);
      await downloader.unzipFile(); // Only unzip if the zip exists
    } else {
      Logger.info("Downloading driver files...");
      const downloader = new Downloader(zipFilePath);
      await downloader.downloadFromUrl(); // Download and unzip
    }
    await main(); // Proceed to the main process after ensuring drivers are ready
  }
}

init();
