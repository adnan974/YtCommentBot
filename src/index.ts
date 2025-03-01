import "module-alias/register";
import { LaunchUndetectableBrowser } from "#lib/browser/pupeteer-undetectable-browser";
import LoginYoutube from "#lib/LoginYoutube";
import Logger from "#utils/Logger";
import { banner } from "#utils/banner";
import { randomDelay } from "#utils/randomDelay";
import { getEnv } from "./config";

import { initialize } from "models";
import YOMEN from "#lib/Bot/YoutubeBot";
import {
  afterMaxCommentReached,
  getExecutionMode,
  getSearchPreferences,
  getUserBotPreference,
} from "services/PromptTerminalService";
import { getBotById, getNumberMaxOfComments } from "repository/BotRepository";
import store from "store/store";
import { LaunchPupeteerReBrowser } from "#lib/browser/pupeteer-rebrowser";
import { LaunchPupeteerBrowser } from "#lib/browser/pupeteer-browser";
import { LaunchPupeteerRealBrowser } from "#lib/browser/pupeteer-real-browser";
import SandboxMode from "#lib/modes/SandboxMode";
import { getCommentsCountToday } from "repository/CommentRepository";
import { LaunchPupeteerWithDolphinBrowser } from "#lib/browser/pupeteer-with-dolphin-anty";

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

  const { mode, browserType } = await getExecutionMode();

  const browser = new LaunchPupeteerWithDolphinBrowser(getEnv("USERNAME"));

  if (mode === "sandbox") {
    const sandBoxMode = new SandboxMode(browser);
    await sandBoxMode.run();
    return;
  } else if (mode === "botDetection") {
    //TODO: Crée une factory
    if (browserType === "realBrowser") {
      const browser = new LaunchPupeteerRealBrowser(getEnv("USERNAME"));
      browser.runAntiDetectTools();
    } else if (browserType === "reBrowser") {
      const browser = new LaunchPupeteerReBrowser(getEnv("USERNAME"));
      await browser.runAntiDetectTools();
    } else if (browserType === "undetectableBrowser") {
      const browser = new LaunchUndetectableBrowser(getEnv("USERNAME"));
      await browser.runAntiDetectTools();
    } else if (browserType === "PeputeerBrowser") {
      const browser = new LaunchPupeteerBrowser(getEnv("USERNAME"));
      await browser.runAntiDetectTools();
    } else if (browserType === "dolphinAntyPeputeerBrowser") {
      const browser = new LaunchPupeteerWithDolphinBrowser(getEnv("USERNAME"));
      await browser.runAntiDetectTools();
    }
    return;
  }

  const botId = await getUserBotPreference();

  const botData = await getBotById(botId);

  // add bot data to store
  store.setBotData(botData);

  const preferences = await getSearchPreferences();

  disableUserInputFor5Seconds();

  const numberOfMaxComments = await getNumberMaxOfComments(botId);
  const numberOfTodayCOmment = await getCommentsCountToday(botId);

  Logger.warn(`Number of comments today: ${numberOfTodayCOmment}`);

  if (numberOfTodayCOmment >= numberOfMaxComments) {
    // Demander à l'utilisateur s'il souhaite continuer
    const canContinue = await afterMaxCommentReached();
    
    if (!canContinue) {
      Logger.info("❌ Operation canceled.");
      return; // Si l'utilisateur n'accepte pas, on arrête l'exécution.
    }
  }

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
  await main(); // Proceed to the main process after ensuring drivers are ready
}

init();
