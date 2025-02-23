import path from "path";

const { connect } = require("puppeteer-real-browser");

/*
async function testPepeteerRealBrowsertest() {
  const { browser, page } = await connect({
    headless: false,
    args: [
      "--disable-dev-shm-usage",
      "--disable-accelerated-2d-canvas",
      "--disable-gpu",
      "--no-default-browser-check",
      "--no-first-run",
      "--mute-audio",
    ],

    customConfig: {},

    turnstile: true,

    connectOption: {},

    disableXvfb: true,
    ignoreAllFlags: false,
    // proxy:{
    //     host:'<proxy-host>',
    //     port:'<proxy-port>',
    //     username:'<proxy-username>',
    //     password:'<proxy-password>'
    // }
  });
  return { browser, page };
}

export default testPepeteerRealBrowsertest;
*/

import fs from "fs";
import { setEnv } from "#config/index";
import { UserAgent } from "constants/UserAgents";
import {
  IHumanLikeMouseHelper,
  humanLikeMouseHelper,
} from "../Bot/HumanLikeMouseHelper/HumanLikeMouseHelper";
import { Browser, Page } from "puppeteer";

export class LaunchPupeteerRealBrowser {
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

    const { browser, page } = await connect({
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
      customConfig: {},

      turnstile: true,

      connectOption: {},

      disableXvfb: true,
      ignoreAllFlags: false,
    });

    this.browser = browser;
    this.page = page;

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
}
