import { getEnv } from "#config/index";
import path from "path";
import { LaunchPupeteerRealBrowser } from "#lib/browser/pupeteer-real-browser";
import { humanLikeMouseHelper } from "#lib/Bot/HumanLikeMouseHelper/HumanLikeMouseHelper";
import { BotDB, CommentDB } from "models";
import { Op } from "@sequelize/core";
import store from "store/store";
import { getCommentsCountToday } from "repository/CommentRepository";
import { getNumberMaxOfComments } from "repository/BotRepository";
import { connectToBrowser } from "#lib/browser/dolphin-anty_authent";
import YoutubeBot from "#lib/Bot/YoutubeBot";
import { delay } from "#utils/delay";
import YoutubeVideoPageActions from "#lib/Bot/YoutubeVideoPageActions";
import YoutubeApi from "#lib/Bot/YoutubeApi";

class SandboxMode {
  private browser;
  private page;

  constructor(browser) {
    this.browser = browser;
  }

  async run() {
    await this.browser.init();

    //await this.openSandboxHTMLFile();

    //TODO: ECRIRE LES TEST A FAIRE ICI
    // Vérifier si le commentaire existe déjà
    //await connectToBrowser()

    //console.log(await getNumberMaxOfComments(1))

    await this.openYoutubePage();
    const ytAction = new YoutubeVideoPageActions(this.page);
    await ytAction.scrollToRecommendations();
    await ytAction.clickOnRandomRecoVideo();

  }

  async openYoutubePage() {
    this.page = await this.browser.page; // Premier onglet
    const ytBot = new YoutubeBot(this.page);


    await ytBot.goToVideoAndWaitPageToLoad("https://www.youtube.com/watch?v=LGXCaPw58v8");
  }

  async openSandboxHTMLFile() {
    this.page = await this.browser.page;

    const filePath = path.resolve("./src/views/sandbox.html");
    await this.page.goto(`file://${filePath}`);
  }
}

export default SandboxMode;
