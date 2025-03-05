import { delay, randomMediumDelay, randomSmallDelay } from "#utils/delay";
import Logger from "#utils/Logger";
import scrollToBottom from "#utils/scrollToBottom";
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

  async searchKeyword(param: searchParam): Promise<string[] | any> {
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

      Logger.info("Scrolling to the bottom of the search results page...");
      await scrollToBottom(this.page);

      Logger.info("Waiting for video results to load...");
      await this.page.waitForSelector("ytd-video-renderer");

      Logger.info(
        `Collecting video links between ${this.botData.youtube_config.minViewsFilter} and ${this.botData.youtube_config.maxViewsFilter} views...`
      );
      const videoLinks: string[] = await collectLinks(this.page);

      Logger.success(`Collected ${videoLinks.length} video links.`);

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

    /**
   * Extrait l'ID d'une vidéo YouTube à partir de son URL
   * @param url L'URL complète de la vidéo YouTube
   * @returns L'ID de la vidéo (ex: "LGXCaPw58v8") ou null si invalide
   */
    extractVideoId(url: string): string | null {
      const regex = /[?&]v=([^&]+)/;
      const match = url.match(regex);
      return match ? match[1] : null;
    }

  async watchVideo(url:string): Promise<void> {
    // Attendre que la balise vidéo apparaisse
    await this.page.waitForSelector("video", { visible: true });

    let videoDuration = await YoutubeApi.getVideoDurationInSeconds(url);

    if (videoDuration > 0) {
      // Calculer une durée aléatoire entre 10% et 30% de la durée totale
      const minPercentage = 0.1; // 10%
      const maxPercentage = 0.3; // 30%
      const randomFactor =
        Math.random() * (maxPercentage - minPercentage) + minPercentage;
      const watchDuration = Math.floor(videoDuration * randomFactor);

      Logger.info(`Video duration: ${videoDuration} seconds`);
      Logger.info(
        `Watching the video for ${watchDuration} seconds (~${Math.floor(
          randomFactor * 100
        )}% of the total duration)...`
      );

      // Attendre la durée aléatoire
      await delay(watchDuration * 1000);
    } else {
      Logger.warn(
        "Could not get video duration after multiple attempts. Watching for a default 30 seconds..."
      );
      await delay(30 * 1000); // Durée par défaut si la récupération échoue
    }
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

  async goToVideo(
    videoLink: string,
    commentType = "random",
    manual: string | undefined = undefined
  ): Promise<void> {
    try {
      if (await this.checkIfCommentExist(videoLink)) {
        return;
      }

      Logger.info(`Navigating to video page: ${videoLink}`);
      await this.page.goto(videoLink);

      await delay(10000);

      const videoId = this.extractVideoId(videoLink);
      await this.watchVideo(videoId);
      await this.youtubeVideoPageActions.likeOrSubscribe(); // Like/Subscribe aléatoire

      const shouldComment = Math.random() < 0.6; // 60% de chances de commenter

      if (!shouldComment) {
        Logger.info("Skipping comment for this video...");
        return;
      }

      await this.youtubeVideoPageActions.browseComments();
      await this.youtubeVideoPageActions.goToCommentSection();

      // Instancier la bonne stratégie de commentaire
      let commentStrategy: ICommentStrategy;

      commentStrategy = CommentStrategyFactory.create(commentType, {
        comment: manual,
        filePath: this.botData.csvCommentPath,
      });

      // Utiliser la stratégie pour poster le commentaire
      await commentStrategy.postComment(videoLink, this.page);

      // Ajouter un délai pour simuler un comportement humain
      await randomMediumDelay();
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

  // SHORT SECTION
  async goToShortWithButton(): Promise<void> {
    try {
      Logger.info("Navigating to YouTube Shorts...");

      // Définir les différents sélecteurs possibles pour le bouton Shorts
      const selectors = [
        "ytd-guide-entry-renderer a[title='Shorts']",
        "ytd-mini-guide-entry-renderer a[title='Shorts']",
      ];

      // Attendre qu'au moins un des sélecteurs soit disponible
      let foundSelector = null;
      for (const selector of selectors) {
        try {
          // Vérifier si le sélecteur existe avec un court timeout
          await this.page.waitForSelector(selector, {
            visible: true,
            timeout: 10000, // Court timeout pour ne pas trop ralentir le processus
          });
          foundSelector = selector;
          Logger.info(`Found Shorts button using selector: ${selector}`);
          break; // Sortir de la boucle si un sélecteur fonctionne
        } catch (e) {
          // Continuer à essayer les autres sélecteurs
          continue;
        }
      }

      if (!foundSelector) {
        throw new Error("Could not find any Shorts button selector");
      }

      // Cliquer sur le bouton Shorts en utilisant le sélecteur trouvé
      await humanLikeMouseHelper.click(foundSelector);

      Logger.success("Successfully navigated to YouTube Shorts");

      // Attendre que la page Shorts soit chargée
      await this.page.waitForSelector("ytd-reel-shelf-renderer");

      // Ajouter un petit délai aléatoire pour simuler un comportement humain
      await randomSmallDelay();
    } catch (error) {
      Logger.error(`Failed to navigate to Shorts: ${(error as Error).message}`);
    }
  }

  async navigateShortVideosWithArrowDown(
    numberOfVideos: number = 5
  ): Promise<void> {
    try {
      Logger.info(
        `Starting navigation through ${numberOfVideos} Shorts videos using arrow down key...`
      );

      // Attendre que les vidéos Shorts soient chargées
      await this.page.waitForSelector("ytd-reel-video-renderer", {
        visible: true,
      });

      // S'assurer que le focus est sur la vidéo Shorts
      await this.page.click("ytd-reel-video-renderer");
      await randomSmallDelay();

      // Naviguer à travers le nombre spécifié de vidéos
      for (let i = 0; i < numberOfVideos; i++) {
        Logger.info(`Navigating to Short video #${i + 1}`);

        // Appuyer sur la touche flèche bas pour passer à la vidéo suivante
        await this.page.keyboard.press("ArrowDown");

        // Attendre un délai aléatoire entre 2 et 6 secondes pour simuler le visionnage
        const viewingTime = Math.floor(Math.random() * 4000) + 2000;
        Logger.info(
          `Watching video #${i + 1} for ${viewingTime / 1000} seconds...`
        );
        await delay(viewingTime);

        // Parfois interagir avec la vidéo pour un comportement plus humain
        if (Math.random() > 0.7) {
          try {
            // Tenter de cliquer sur la vidéo pour mettre en pause/reprendre
            await humanLikeMouseHelper.click(
              "ytd-reel-video-renderer:nth-child(" + (i + 1) + ")"
            );
            await randomSmallDelay();
            // Cliquer à nouveau pour reprendre
            await humanLikeMouseHelper.click(
              "ytd-reel-video-renderer:nth-child(" + (i + 1) + ")"
            );
          } catch (e) {
            // Ignorer l'erreur si l'élément n'est pas cliquable
            Logger.info("Could not interact with the video, continuing...");
          }
        }

        // Petit délai avant de passer à la vidéo suivante
        await randomSmallDelay();
      }

      Logger.success(
        `Successfully navigated through ${numberOfVideos} Shorts videos`
      );
    } catch (error) {
      Logger.error(
        `Failed to navigate through Shorts videos: ${(error as Error).message}`
      );
    }
  }
}
