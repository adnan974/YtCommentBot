import type { searchParam } from "#types/index";
import {
  delay,
  randomSmallDelay
} from "#utils/delay";
import Logger from "#utils/Logger";
import { scrollToBottom } from "#utils/scrollToBottom";
import { collectLinks } from "#utils/videos/collectLinks";
import { Op } from "@sequelize/core";
import { CommentStatus } from "constants/CommentStatus";
import { CommentDB } from "models";
import type { Page } from "puppeteer";
import store from "store/store";
import { humanLikeMouseHelper } from "./HumanLikeMouseHelper/HumanLikeMouseHelper";
import YoutubeVideoPageActions from "./YoutubeVideoPageActions";

Logger.banner("🚀 Starting Youtube BOT Application...");

export default class YoutubeBot {
  private page: Page;
  private botData;
  private youtubeVideoPageActions: YoutubeVideoPageActions;

  constructor(pages: Page) {
    this.youtubeVideoPageActions = new YoutubeVideoPageActions(pages);
    this.page = pages;
    this.botData = store.getBotData();
  }

  async scrollTOBottomAndCollectLinks() {
    Logger.info("Scrolling to the bottom of the search results page...");
    await scrollToBottom(this.page);

    Logger.info("Waiting for video results to load...");
    await this.page.waitForSelector("ytd-video-renderer");

    Logger.info(
      `Collecting video links between ${this.botData?.youtube_config?.minViewsFilter} and ${this.botData?.youtube_config?.maxViewsFilter} views...`
    );
    const videoLinks: string[] = await collectLinks(this.page);

    Logger.success(`Collected ${videoLinks.length} video links.`);

    return videoLinks;
  }

  async searchKeywordAndCollectLinks(
    param: searchParam
  ): Promise<string[] | any> {
    const keyword = param;

    if (typeof keyword !== "string") {
      Logger.error("Invalid keyword type. Expected a string.");
      return;
    }
    const sortOption = this.botData.youtube_config.sortValue;

    try {
      Logger.info(`Navigating to YouTube search results for: "${keyword}"`);
      await this.page.goto(
        "https://www.youtube.com/results?search_query=" +
          encodeURIComponent(keyword) +
          "&sp=" +
          sortOption
      );

      const videoLinks = await this.scrollTOBottomAndCollectLinks();

      const convertedUrls = videoLinks.map((url) =>
        url.replace(
          /^https:\/\/www\.youtube\.com\/shorts\/([\w-]+)/,
          "https://www.youtube.com/watch?v=$1"
        )
      );
      return convertedUrls;
    } catch (error) {
      Logger.error(`Failed to search keyword: ${(error as Error).message}`);
    }
  }

  async getTrendingVideos(): Promise<string[] | any> {
    await this.page.goto("https://www.youtube.com/feed/trending");
    Logger.info("Scrolling to the bottom of the search results page...");
    await scrollToBottom(this.page);

    Logger.info("Waiting for video results to load...");
    await this.page.waitForSelector("ytd-video-renderer");

    Logger.info("Collecting video links...");
    const videoLinks: string[] = await collectLinks(this.page);

    Logger.success(`Collected ${videoLinks.length} video links.`);

    const convertedUrls = videoLinks.map((url) =>
      url.replace(
        /^https:\/\/www\.youtube\.com\/shorts\/([\w-]+)/,
        "https://www.youtube.com/watch?v=$1"
      )
    );
    return convertedUrls;
  }

  async goToHomePageWithButton(): Promise<void> {
    try {
      Logger.info("Navigating to YouTube homepage...");

      // Attendre que le logo YouTube soit chargé et visible
      await this.page.waitForSelector("ytd-topbar-logo-renderer#logo a", {
        visible: true,
      });

      // Cliquer sur le logo YouTube pour aller à la page d'accueil
      await humanLikeMouseHelper.click("ytd-topbar-logo-renderer#logo a");

      Logger.success("Successfully navigated to YouTube homepage");

      // Attendre que la page d'accueil soit chargée
      await this.page.waitForSelector("ytd-rich-grid-renderer");

      // Ajouter un petit délai aléatoire pour simuler un comportement humain
      await randomSmallDelay();
    } catch (error) {
      Logger.error(
        `Failed to navigate to homepage: ${(error as Error).message}`
      );
    }
  }

  async checkIfCommentExist(videoLink: string): Promise<boolean> {
    // Vérifier si le commentaire existe déjà
    const exist = await CommentDB.findOne({
      where: {
        video_url: {
          [Op.like]: `%v=${new URL(
            videoLink,
            "https://www.youtube.com"
          ).searchParams.get("v")}%`,
        },
        comment_status: CommentStatus.SUCCESS,
      },
    });

    if (exist) {
      Logger.info(`Comment already exists for video: ${videoLink}`);
      return true;
    }

    return false;
  }

  async goToVideoAndWaitPageToLoad(videoLink: string) {
    Logger.info(`Navigating to video page: ${videoLink}`);
    await this.blockClicks(this.page);
    await this.page.goto(videoLink);

    await delay(10000);
    await this.unblockClicks(this.page);
  }

  // Search bar
  async searchOnSearchBar(query: searchParam) {
    Logger.info("Waiting for input search bar...");
    const selector = "yt-searchbox";
    await this.page.waitForSelector(selector);

    Logger.info("Search bar found, searching...");
    await this.page.click(selector);
    await this.page.type(selector, query.keyword);

    await this.page.keyboard.press("Enter");
  }

  async blockClicks(page) {
    await page.evaluate(() => {
      document.body.style.pointerEvents = 'none';
    });
  }

  async unblockClicks(page) {
    await page.evaluate(() => {
      document.body.style.pointerEvents = 'auto';
    });
  }
}
