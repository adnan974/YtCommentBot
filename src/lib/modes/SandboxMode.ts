import path from "path";
import YoutubeBot from "#lib/Bot/YoutubeBot";
import { YoutubeRoutine } from "#lib/Bot/YoutubeRoutine";
import { randomLongDelay } from "#utils/delay";

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

    const page = await this.browser.page;
    const warmer = new YoutubeRoutine(page);
    await page.goto("https://www.youtube.com/watch?v=XvrfJBBE9Pw");
    await randomLongDelay();
    await warmer.findCommentByUsername("ThomasLeRelou");

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
