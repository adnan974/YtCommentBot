import LoginYoutube from "#lib/LoginYoutube";
import { banner } from "#utils/banner";
import Logger from "#utils/Logger";
import "module-alias/register";
import YoutubeBot from "#lib/Bot/YoutubeBot";
import { BrowserFactory } from "#lib/browser/browserFactory";
import { IBrowserAutomationFramework } from "#lib/browser/IBrowserAutomationFramework";
import SandboxMode from "#lib/modes/SandboxMode";
import { initialize } from "models";
import { getBotById, getNumberMaxOfComments } from "repository/BotRepository";
import { getCommentsCountToday } from "repository/CommentRepository";
import {
  afterMaxCommentReached,
  getExecutionMode,
  getSearchPreferences,
  getUserBotPreference,
} from "services/PromptTerminalService";
import store from "store/store";
import { randomMediumDelay } from "#utils/delay";
import { CommentStrategyFactory } from "#lib/Bot/comments/CommentStrategyFactory";
import { ICommentStrategy } from "#lib/Bot/comments/ICommentStrategy";
import { YoutubeRoutine } from "#lib/Bot/YoutubeRoutine";

async function disableUserInputFor5Seconds() {
  // 🔴 Désactiver la saisie de l'utilisateur pour éviter une entrée accidentelle
  process.stdin.resume();
  process.stdin.setRawMode(true);

  // Attendre 5 secondes et désactiver temporairement la touche Entrée
  const timeout = 5000; // 5 secondes

  const blockEnterKey = (data: Buffer) => {
    if (data.toString() === "\r") {
      // Empêcher l'effet de la touche Entrée pendant les 5 secondes
      Logger.info("⏳ Enter touch blocked for 5secs...");
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

  if (mode === "sandbox") {
    const sandBoxMode = new SandboxMode(BrowserFactory.create("realBrowser"));
    await sandBoxMode.run();
    return;
  }

  let browser: IBrowserAutomationFramework = BrowserFactory.create(browserType);

  if (mode === "botDetection") {
    browser.runAntiDetectTools();
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

  const youtubeBot = new YoutubeBot(pages);

  let urls: string[];
  if (preferences.searchType === "trending") {
    urls = await youtubeBot.getTrendingVideos(); // You'll need to implement this method
  } else {
    Logger.info(`Searching for keyword: ${preferences.keyword}`);
    urls = await youtubeBot.searchKeywordAndCollectLinks(preferences.keyword);
  }

  let commentStrategy: ICommentStrategy;

  commentStrategy = CommentStrategyFactory.create(
    preferences.manualCommentType,
    {
      comment: preferences.comment,
      filePath: botData.csvCommentPath,
    }
  );

  const youtubeRoutine = new YoutubeRoutine(pages);

  for (const url of urls) {
    Logger.info(`Navigating to video: ${url}`);
    await youtubeRoutine.gotoVideoByUrlInteractAndComment(url, commentStrategy);
    await randomMediumDelay();
  }

  Logger.info("Process completed");
}

async function init() {
  await initialize();
  await main(); // Proceed to the main process after ensuring drivers are ready
}

init();
