import AntiBotDetectionTools from "#lib/Bot/BotDetection";
import { Browser, Page } from "puppeteer";
import {
  IHumanLikeMouseHelper,
  humanLikeMouseHelper,
} from "../Bot/HumanLikeMouseHelper/HumanLikeMouseHelper";
import { connectToBrowser } from "./dolphin-anty_authent";
import { IBrowserAutomationFramework } from "./IBrowserAutomationFramework";

export class LaunchPupeteerWithDolphinBrowser implements IBrowserAutomationFramework {
  public browser: Browser | null;
  public page: Page | null;

  constructor() {
    this.browser = null;
    this.page = null;
  }

  /**
   * Initialize the browser with undetectable settings and a specific user session.
   */
  async init(): Promise<void> {
    this.browser = await connectToBrowser();

    this.page = await this.browser.newPage();

    const ghostCursorHelper: IHumanLikeMouseHelper = humanLikeMouseHelper;
    ghostCursorHelper.initConfig(this.page);

    // blocage des médias pour ne pas charger les vidéos
    await this.page.setRequestInterception(true);

    this.page.on("request", (request) => {
      const url = request.url().toLowerCase();

      if (
        url.endsWith(".mp4") ||
        url.endsWith(".avi") ||
        url.endsWith(".flv") ||
        url.endsWith(".mov") ||
        url.endsWith(".wmv") ||
        url.includes("googlevideo") || // Bloque les vidéos YouTube
        url.includes("ytimg") // Bloque les miniatures et images YouTube
      ) {
        request.abort();
      } else {
        request.continue();
      }
    });
  }

  /**
   * Close the browser instance.
   */
  async close(): Promise<void> {
    if (this.browser) {
      await this.browser.close();
    }
  }

  async runAntiDetectTools() {
    await this.init();
  
    const page1 = await this.browser.newPage(); // Premier onglet
    const page2 = await this.browser.newPage(); // Deuxième onglet
    const page3 = await this.browser.newPage();
  
    const botDetection1 = new AntiBotDetectionTools(page1);
    await botDetection1.visitSannySoft(); // Lancer SannySoft sur le premier onglet
  
    const botDetection2 = new AntiBotDetectionTools(page2);
    await botDetection2.visitCreepJs(); // Lancer CreepJs sur le deuxième onglet
  
    const botDetection3 = new AntiBotDetectionTools(page3);
    await botDetection3.visitBotDetectorRebrowser();
  }
}
