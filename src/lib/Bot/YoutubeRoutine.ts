import { Page } from "puppeteer";
import YoutubeBot from "./YoutubeBot";
import YoutubeVideoPageActions from "./YoutubeVideoPageActions";
import { randomLongDelay, randomMediumDelay } from "#utils/delay";
import { YoutubeShortVideoPageAction } from "./YoutubeShortVideoPageActions";
import { searchParam } from "#types/index";
import { DomAction } from "./domAction";
import { CommentStrategyFactory } from "./comments/CommentStrategyFactory";
import { ICommentStrategy } from "./comments/ICommentStrategy";
import Logger from "#utils/Logger";
import { scrollToBottom } from "#utils/scrollToBottom";
import { humanLikeMouseHelper } from "./HumanLikeMouseHelper/HumanLikeMouseHelper";
import { CommentDB } from "models";
import { CommentStatus } from "constants/CommentStatus";
import store from "store/store";

export class YoutubeRoutine {
  private page: Page;
  private botData;
  private youtubeBot: YoutubeBot;
  private youtubeVideoPageAction: YoutubeVideoPageActions;

  constructor(page: Page) {
    this.botData = store.getBotData();
    this.page = page;
    this.youtubeBot = new YoutubeBot(this.page);
    this.youtubeVideoPageAction = new YoutubeVideoPageActions(this.page);
  }

  async navigateThroughtRecommendationAndWatch() {
    let url = "https://www.youtube.com/watch?v=BSUmna1rFDc";
    await this.youtubeBot.goToVideoAndWaitPageToLoad(url);

    while (true) {
      await this.youtubeVideoPageAction.scrollToRecommendations();
      await this.youtubeVideoPageAction.clickOnRandomRecoVideo();
      url = await this.page.url();
      await this.youtubeVideoPageAction.watchVideo(url);
    }
  }

  async navigateThroughtShortAndWatch() {
    let url = "https://www.youtube.com";
    const ytVideoPageAction = new YoutubeShortVideoPageAction(this.page);
    await this.youtubeBot.goToVideoAndWaitPageToLoad(url);

    //TODO: TROP DE CLIC DE PARTOUT DANS CETTE METHODE

    await ytVideoPageAction.goToShortWithButton();

    await ytVideoPageAction.navigateShortVideosWithArrowDown();
  }

  async searchAndWatch(searchQuery: searchParam, commentStrategy: ICommentStrategy) {
    const domAction = new DomAction(this.page);

    await this.youtubeBot.searchOnSearchBar(searchQuery);
    await randomLongDelay();
    let links: string[] = await this.youtubeBot.scrollTOBottomAndCollectLinks();
    links = links
      .map((link) => {
        const videoId = new URL(link).searchParams.get("v");
        return videoId ? `/watch?v=${videoId}` : null;
      })
      .filter((link) => link !== null);

    for (let i = 0; i < links.length; i++) {
      const videoUrl = links[i];

      // Sélectionner l'élément de la vidéo en utilisant le lien
      const videoSelector = `a#thumbnail[href*='${videoUrl}']`;

      // Attendre que l'élément de la vidéo soit visible
      await this.page.waitForSelector(videoSelector),
        {
          visible: true,
        };

      // Cliquer sur la vidéo
      Logger.info(`Click on video: ${videoUrl}`);
      await humanLikeMouseHelper.click(videoSelector);

      this.watchLikeOrSubscribeAndComment(videoUrl, commentStrategy);
      // Revenir à la page précédente
      Logger.info(`Go back to search page`);
      await this.page.goBack();

      await domAction.disableClicks();

      await randomLongDelay(); // Attendre un peu avant d'interagir avec le prochain élément

      // Réactiver les clics après le délai
      await domAction.enableClicks();
    }
  }

  async findCommentByUsernameAndLike(usernames: string) {
    await this.youtubeVideoPageAction.goToCommentSection();
    await randomMediumDelay();
    const selector = "ytd-comment-thread-renderer";
    await this.page.waitForSelector(selector, { visible: true });

    //TODO A REVOIR SI Y'A BCP DE COMS
    await scrollToBottom(this.page);
    await randomMediumDelay();

    const commentElements = await this.page.$$(selector);

    for (const comment of commentElements) {
      const username = await this.youtubeVideoPageAction.getCommentUsername(
        comment
      );
      if (username === "@" + usernames) {
        await this.youtubeVideoPageAction.likeComment(comment);
      }
    }
  }

  async gotoVideoByUrlInteractAndComment(
    videoLink: string,
    commentStrategy: ICommentStrategy
  ): Promise<void> {
    //TODO : A REEMETTRE
    /*
    if (await this.youtubeBot.checkIfCommentExist(videoLink)) {
      return;
    }
    */

    await this.youtubeBot.goToVideoAndWaitPageToLoad(videoLink);



    await this.watchLikeOrSubscribeAndComment(videoLink, commentStrategy);

    // Ajouter un délai pour simuler un comportement humain
    await randomMediumDelay();
  }

  async watchLikeOrSubscribeAndComment(
    videoLink: string,
    commentStrategy: ICommentStrategy
  ) {
    try {
      //TODO/ Remettre comme avant
      //await this.youtubeVideoPageAction.watchVideo(videoLink);
      await randomLongDelay();
      await this.youtubeVideoPageAction.likeOrSubscribe(); // Like/Subscribe aléatoire

      const shouldComment = Math.random() < 0.7; // 60% de chances de commenter

      if (!shouldComment) {
        Logger.info("Skipping comment for this video...");
        return;
      }

      await this.youtubeVideoPageAction.browseComments();
      await this.youtubeVideoPageAction.goToCommentSection();

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
}
