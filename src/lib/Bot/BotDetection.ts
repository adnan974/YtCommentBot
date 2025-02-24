import Logger from "#utils/Logger";
import { Page } from "puppeteer"; // Assurez-vous que la page Puppeteer est importée

class AntiBotDetectionTools {
  constructor(private page) {}

  async visitSannySoft() {
    try {
      const url = "https://bot.sannysoft.com/";
      Logger.info(`Navigating to ${url} for bot detection...`);
      await this.page.goto(url, { waitUntil: "networkidle2" }); // Assurer que la page se charge complètement
    } catch (error) {
      Logger.error(`Error while visiting bot detection site: ${error.message}`);
    }
  }

  async visitCreepJs() {
    try {
      const url = "https://abrahamjuliot.github.io/creepjs/";
      Logger.info(`Navigating to ${url} for bot detection...`);
      await this.page.goto(url, { waitUntil: "networkidle2" }); // Assurer que la page se charge complètement
    } catch (error) {
      Logger.error(`Error while visiting bot detection site: ${error.message}`);
    }
  }


  async visitBotDetectorRebrowser() {
    try {
      const url = "https://bot-detector.rebrowser.net/";
      Logger.info(`Navigating to ${url} for bot detection...`);
      await this.page.goto(url, { waitUntil: "networkidle2" }); // Assurer que la page se charge complètement
    } catch (error) {
      Logger.error(`Error while visiting bot detection site: ${error.message}`);
    }
  }
}

export default AntiBotDetectionTools;
