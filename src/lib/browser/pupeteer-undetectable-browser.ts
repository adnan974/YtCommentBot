import fs from "fs";
import path from "path";
import UndetectableBrowser from "undetected-browser";
import puppeteer, { Browser, Page } from "puppeteer";
import { getEnv, setEnv } from "#config/index";
import { UserAgent } from "constants/UserAgents";
import {
  IHumanLikeMouseHelper,
  humanLikeMouseHelper,
} from "../Bot/HumanLikeMouseHelper/HumanLikeMouseHelper";
import AntiBotDetectionTools from "#lib/Bot/BotDetection";
import { IBrowserAutomationFramework } from "./IBrowserAutomationFramework";


export class LaunchUndetectableBrowser  implements IBrowserAutomationFramework {
  public browser: Browser | null;
  public page: Page | null;
  public username: string;

  constructor(username: string) {
    this.username = username;
    this.browser = null;
    this.page = null;
  }

  /**
   * Initialize the browser with undetectable settings and a specific user session.
   */
  async init(): Promise<void> {
    const driverPath = path.resolve("/usr/bin/");
    const sessionDir = path.resolve(`session/${this.username}`);
    if (!fs.existsSync(sessionDir)) {
      fs.mkdirSync(sessionDir, { recursive: true });
    }
    // Check if driver folder exists and is not empty
    if (!fs.existsSync(driverPath) || fs.readdirSync(driverPath).length === 0) {
      throw new Error(
        "The 'driver' folder is empty or does not exist. Please ensure the necessary files are present."
      );
    }

    const UndetectableBMS = new UndetectableBrowser(
      await puppeteer.launch({
        headless: false,
        executablePath: path.join(driverPath, "google-chrome-stable"),
        userDataDir: `session/${this.username}`,
        args: [
          "--disable-dev-shm-usage",
          "--disable-accelerated-2d-canvas",
          "--disable-gpu",
          "--no-default-browser-check",
          "--no-first-run",
          "--mute-audio",
        ],
      })
    );

    this.browser = await UndetectableBMS.getBrowser();
    this.page = await this.browser.newPage();

    const ghostCursorHelper: IHumanLikeMouseHelper = humanLikeMouseHelper;
    ghostCursorHelper.initConfig(this.page);

    // blocage des médias pour ne pas charger les vidéos
    await this.page.setRequestInterception(true);

    this.page.on("request", (request) => {
      const url = request.url().toLowerCase();
      const resourceType = request.resourceType();

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

    //await this.page.setViewport({ width: 1375, height: 3812 });
    await this.page.setUserAgent(UserAgent.Chrome105);
    setEnv(`SESSION_DIR_${this.username}`, `session/${this.username}`);
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
