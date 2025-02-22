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
import BotDetection from "#lib/Bot/BotDetection";

async function disableUserInputFor5Seconds() {
  // 🔴 Désactiver la saisie de l'utilisateur pour éviter une entrée accidentelle
  process.stdin.resume();
  process.stdin.setRawMode(true);

  // Attendre 5 secondes et désactiver temporairement la touche Entrée
  const timeout = 5000; // 5 secondes

  const blockEnterKey = (data: Buffer) => {
    if (data.toString() === "\r") {
      // Empêcher l'effet de la touche Entrée pendant les 5 secondes
      console.log("⏳ Touche Entrée bloquée pour 5 secondes...");
      // Ici, on ne fait rien pour bloquer l'entrée (on n'appelle pas process.stdin.pause())
    }
  };

  // Bloquer la touche Entrée
  process.stdin.on("data", blockEnterKey);

  // Après 5 secondes, autoriser à nouveau l'entrée
  setTimeout(() => {
    // Désactiver la gestion de l'événement de blocage de la touche Entrée
    process.stdin.removeListener("data", blockEnterKey);
  }, timeout);
}

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

  disableUserInputFor5Seconds();

  const browser = new LaunchBrowser(getEnv("USERNAME"));
  await browser.init();

  const pages = await browser.page;

  const botDetection = new BotDetection(pages);
  await botDetection.visitSannySoftAndStay();

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
