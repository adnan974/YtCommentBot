import { getEnv } from "#config/index";
import { IBrowserAutomationFramework } from "./IBrowserAutomationFramework";
import { LaunchPupeteerBrowser } from "./pupeteer-browser";
import { LaunchPupeteerRealBrowser } from "./pupeteer-real-browser";
import { LaunchPupeteerReBrowser } from "./pupeteer-rebrowser";
import { LaunchUndetectableBrowser } from "./pupeteer-undetectable-browser";
import { LaunchPupeteerWithDolphinBrowser } from "./pupeteer-with-dolphin-anty";

export class BrowserFactory {
  static create(browserType: string): IBrowserAutomationFramework {
    let browser: IBrowserAutomationFramework;

    switch (browserType) {
      case "realBrowser":
        browser = new LaunchPupeteerRealBrowser(getEnv("USERNAME"));
        break;
      case "reBrowser":
        browser = new LaunchPupeteerReBrowser(getEnv("USERNAME"));
        break;
      case "undetectableBrowser":
        browser = new LaunchUndetectableBrowser(getEnv("USERNAME"));
        break;
      case "PeputeerBrowser":
        browser = new LaunchPupeteerBrowser(getEnv("USERNAME"));
        break;
      case "dolphinAntyPeputeerBrowser":
        browser = new LaunchPupeteerWithDolphinBrowser();
        break;
      default:
        throw new Error(`Unknown browser type: ${browserType}`);
    }

    return browser;
  }
}