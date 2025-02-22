import { delay } from "#utils/delay";
import Logger from "#utils/Logger";
import { Page } from "puppeteer"; // Assurez-vous que la page Puppeteer est importée

class BotDetection {
  constructor(private page: Page) {}

  async visitSannySoftAndStay(stayTime: number = 10000) {
    try {
      const url = "https://bot.sannysoft.com/";
      Logger.info(`Navigating to ${url} for bot detection...`);
      await this.page.goto(url, { waitUntil: "networkidle2" }); // Assurer que la page se charge complètement
      Logger.info(`Staying on ${url} for ${stayTime / 1000} seconds...`);
      await delay(stayTime);
    } catch (error) {
      Logger.error(`Error while visiting bot detection site: ${error.message}`);
    }
  }
}

export default BotDetection;
