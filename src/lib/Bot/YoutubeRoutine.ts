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

export class YoutubeRoutine {
  private page: Page;

  constructor(page: Page) {
    this.page = page;
  }

  async navigateThroughtRecommendationAndWatch() {
    let url = "https://www.youtube.com/watch?v=BSUmna1rFDc";
    const ytBot = new YoutubeBot(this.page);
    const ytVideoPageAction = new YoutubeVideoPageActions(this.page);
    await ytBot.goToVideoAndWaitPageToLoad(url);

    while (true) {
      await ytVideoPageAction.scrollToRecommendations();
      await ytVideoPageAction.clickOnRandomRecoVideo();
      url = await this.page.url();
      await ytVideoPageAction.watchVideo(url);
    }
  }

  async navigateThroughtShortAndWatch() {
    let url = "https://www.youtube.com";
    const ytBot = new YoutubeBot(this.page);
    const ytVideoPageAction = new YoutubeShortVideoPageAction(this.page);
    await ytBot.goToVideoAndWaitPageToLoad(url);

    //TODO: TROP DE CLIC DE PARTOUT DANS CETTE METHODE

    await ytVideoPageAction.goToShortWithButton();

    await ytVideoPageAction.navigateShortVideosWithArrowDown();
  }

  async searchAndWatch(searchQuery: searchParam) {
    const ytBOt = new YoutubeBot(this.page);
    const ytVideoPageAction = new YoutubeVideoPageActions(this.page);
    const domAction = new DomAction(this.page);

    await ytBOt.searchOnSearchBar(searchQuery);
    await randomLongDelay();
    let links: string[] = await ytBOt.scrollTOBottomAndCollectLinks();
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
      Logger.info(`Clic on video: ${videoUrl}`);
      await humanLikeMouseHelper.click(videoSelector);

      await randomMediumDelay(); // Attendre un peu avant de continuer
      // Revenir à la page précédente
      Logger.info(`Go back to search page`);
      await this.page.goBack();

      await domAction.disableClicks();

      await randomLongDelay(); // Attendre un peu avant d'interagir avec le prochain élément

      // Réactiver les clics après le délai
      await domAction.enableClicks();
    }
  }

  async findCommentByUsername(usernames: string) {
    const ytVideoPageAction = new YoutubeVideoPageActions(this.page);

    await ytVideoPageAction.goToCommentSection();
    await randomMediumDelay();
    const selector = "ytd-comment-thread-renderer";
    await this.page.waitForSelector(selector, { visible: true });
    await scrollToBottom(this.page);
    await randomMediumDelay();

    //TODO/ REVOIR ICI PAS POSSIBLE DE RECUP LES DOPNN2ES
    // Récupérer les commentaires et cliquer sur les boutons "like"
    const comments = await this.page.$$eval(selector, (commentElements) => {
      return commentElements.map((comment) => {
        // Extraire le nom d'utilisateur
        const usernameElement = comment.querySelector("#author-text");
        const username = usernameElement
          ? usernameElement.textContent.trim()
          : "";

        // Extraire le texte du commentaire
        const commentTextElement = comment.querySelector("#content-text");
        const commentText = commentTextElement
          ? commentTextElement.textContent.trim()
          : "";

        return { username, commentText, comment }; // Retourner l'élément du commentaire pour le traitement dans Puppeteer
      });
    });

    console.log(comments)
    // Pour chaque commentaire, cliquer sur le bouton "like"
    for (const { username, comment, commentText } of comments) {
      console.log(`Processing comment by ${username}: ${commentText}`);

      // Récupérer le bouton "like" du commentaire avec Puppeteer (via ElementHandle)
      /*
      const likeButton = await this.page.evaluateHandle((comment) => {
        return comment.querySelector("#like-button button");
      }, comment);
      
      
      if (likeButton) {
        await likeButton.click(); // Cliquer sur le bouton "like"
        console.log(`Button clicked for user: ${username}`);
      } else {
        console.log(`Like button not found for user: ${username}`);
      }
        */
    }

    // Optionnel : Attendre une période de temps après chaque clic avant de passer au suivant
    await randomMediumDelay();
  }
}
