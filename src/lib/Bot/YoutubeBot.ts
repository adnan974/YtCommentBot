import {
  delay,
  randomLongDelay,
  randomMediumDelay,
  randomSmallDelay,
} from "#utils/delay";
import Logger from "#utils/Logger";
import { scrollToBottom } from "#utils/scrollToBottom";
import { CommentDB } from "models";
import type { Page } from "puppeteer";
import type { searchParam } from "#types/index";
import { collectLinks } from "#utils/videos/collectLinks";
import { ICommentStrategy } from "./comments/ICommentStrategy";
import { CommentStrategyFactory } from "./comments/CommentStrategyFactory";
import store from "store/store";
import { humanLikeMouseHelper } from "./HumanLikeMouseHelper/HumanLikeMouseHelper";
import { Op } from "@sequelize/core";
import { CommentStatus } from "constants/CommentStatus";
import YoutubeVideoPageActions from "./YoutubeVideoPageActions";
import YoutubeApi from "./YoutubeApi";

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

  async goToVideoWatchInteractAndComment(
    videoLink: string,
    commentType = "random",
    manual: string | undefined = undefined
  ): Promise<void> {
    if (await this.checkIfCommentExist(videoLink)) {
      return;
    }

    await this.goToVideoAndWaitPageToLoad(videoLink);

    let commentStrategy: ICommentStrategy;

    commentStrategy = CommentStrategyFactory.create(commentType, {
      comment: manual,
      filePath: this.botData.csvCommentPath,
    });

    await this.watchLikeOrSubscribeAndComment(videoLink, commentStrategy);

    // Ajouter un délai pour simuler un comportement humain
    await randomMediumDelay();
  }

  async watchLikeOrSubscribeAndComment(
    videoLink: string,
    commentStrategy: ICommentStrategy
  ) {
    try {
      await this.youtubeVideoPageActions.watchVideo(videoLink);
      await this.youtubeVideoPageActions.likeOrSubscribe(); // Like/Subscribe aléatoire

      const shouldComment = Math.random() < 0.7; // 60% de chances de commenter

      if (!shouldComment) {
        Logger.info("Skipping comment for this video...");
        return;
      }

      await this.youtubeVideoPageActions.browseComments();
      await this.youtubeVideoPageActions.goToCommentSection();

      await commentStrategy.postComment(videoLink, this.page);
    } catch (e) {
      Logger.error(
        `Failed to interact with the video: ${(e as Error).message}`
      );

      await CommentDB.create({
        username: this.botData.username,
        video_url: videoLink,
        comment_status: CommentStatus.FAILED,
        comment: (e as Error).message,
        botId: this.botData.id,
      });
    }
  }

  async goToVideoAndWaitPageToLoad(videoLink: string) {
    Logger.info(`Navigating to video page: ${videoLink}`);
    await this.page.goto(videoLink);

    await delay(10000);
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
}
