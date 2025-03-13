import {
  delay,
  randomMediumDelay,
  randomNumber,
  randomSmallDelay,
} from "#utils/delay";
import Logger from "#utils/Logger";
import { humanLikeMouseHelper } from "./HumanLikeMouseHelper/HumanLikeMouseHelper";
import YoutubeApi from "./YoutubeApi";

class YoutubeVideoPageActions {
  page;

  constructor(page) {
    this.page = page;
  }

  async likeOrSubscribe(): Promise<void> {
    await this.like();
    await this.subscribe();
  }

  async like() {
    await randomSmallDelay();

    const shouldLike = Math.random() < 0.3; // 100% de chances d'aimer (ajuste si besoin)

    if (shouldLike) {
      const likeButtonSelector =
        'button[aria-label^="like this video along with"]';

      // Attendre que le bouton "like" soit visible
      await this.page.waitForSelector(likeButtonSelector, {
        visible: true,
      });

      // Vérifier l'état du bouton
      const isAlreadyLiked = await this.page.evaluate((selector) => {
        const button = document.querySelector(selector);
        return button?.getAttribute("aria-pressed") === "true";
      }, likeButtonSelector);

      if (isAlreadyLiked) {
        Logger.info("La vidéo est déjà likée.");
      } else {
        Logger.info("Liking the video...");
        await humanLikeMouseHelper.click(
          `${likeButtonSelector}[aria-pressed="false"]`
        );
        await randomSmallDelay();
      }

      // Ajouter un délai aléatoire après le clic pour simuler une action humaine
      await randomSmallDelay();
    }
  }

  async subscribe() {
    const shouldSubscribe = Math.random() < 0.1; // 100% de chances de s'abonner (ajuste si besoin)

    if (shouldSubscribe) {
      Logger.info("Subscribing to the channel...");

      try {
        // Attendre que le bouton S'abonner apparaisse
        await this.page.waitForSelector(
          "yt-button-shape#subscribe-button-shape button.yt-spec-button-shape-next",
          { visible: true, timeout: 3000 } // Timeout pour éviter d'attendre trop longtemps
        );

        // Cliquer sur le bouton S'abonner
        await humanLikeMouseHelper.click(
          "yt-button-shape#subscribe-button-shape button.yt-spec-button-shape-next"
        );
      } catch (error) {
        Logger.info("User is probably already subscribed.");
      }
    }
  }

  async goToCommentSection(): Promise<void> {
    try {
      Logger.info("Browsing the comments...");

      const sectionFound = await this.page.evaluate(() => {
        const commentsSection = document.querySelector("#comments");
        if (commentsSection) {
          commentsSection.scrollIntoView({ behavior: "smooth" });
          return true;
        }
        return false;
      });

      if (!sectionFound) {
        throw new Error("Comment section not found");
      }

      Logger.info("Comment section found!");
    } catch (error) {
      Logger.error(
        `Failed to locate the comment section: ${(error as Error).message}`
      );
      throw error;
    }
  }

  async browseComments(): Promise<void> {
    await this.goToCommentSection();

    // Pause aléatoire
    await randomMediumDelay();

    // Scroll lentement dans les commentaires avec des distances et des pauses aléatoires
    const scrollTimes = randomNumber(3, 5);
    for (let i = 0; i < scrollTimes; i++) {
      const randomScrollDistance = randomNumber(100, 1000); // Distance de scroll variable
      await this.page.evaluate((distance: number) => {
        window.scrollBy(0, distance);
      }, randomScrollDistance);

      // Pause aléatoire entre les scrolls
      await delay(randomNumber(2000, 5000));
    }
  }

  async getCommentCount(): Promise<number> {
    try {
      Logger.info("Fetching comment count...");

      const commentCount = await this.page.evaluate(() => {
        const countElement = document.querySelector(
          ".ytd-comments-header-renderer #count span"
        );
        if (!countElement) {
          throw new Error("Comment count element not found");
        }

        const countText = countElement.textContent?.replace(/\D/g, "");
        return countText ? parseInt(countText, 10) : 0;
      });

      Logger.success(`Total comments found: ${commentCount}`);
      return commentCount;
    } catch (error) {
      Logger.error(
        `Failed to fetch comment count: ${(error as Error).message}`
      );
      return 0;
    }
  }

  async collectAllComments(): Promise<string[]> {
    Logger.info("Starting to collect comments from the video...");
    return await this.page.evaluate(() => {
      const comments = new Set<string>();

      return new Promise<string[]>((resolve) => {
        let lastScrollHeight = document.body.scrollHeight;
        let attempts = 0;
        const maxAttempts = 10;
        const interval = 2400;

        const timer = setInterval(() => {
          window.scrollBy(0, window.innerHeight);

          document
            .querySelectorAll(
              "span.yt-core-attributed-string.yt-core-attributed-string--white-space-pre-wrap"
            )
            .forEach((comment) => {
              if (comment && comment.textContent) {
                comments.add(comment.textContent.trim());
              }
            });

          if (document.body.scrollHeight > lastScrollHeight) {
            lastScrollHeight = document.body.scrollHeight;
            attempts = 0;
          } else {
            attempts++;
          }

          if (attempts >= maxAttempts) {
            clearInterval(timer);
            resolve(Array.from(comments));
          }
        }, interval);
      });
    });
  }

  async clickOnRandomRecoVideo() {
    const selector = "#related #items #contents";
    
    await this.page.waitForSelector(selector);
    Logger.info(`Waiting for recommendation selector to load...`);

    // Sélectionner une vidéo au hasard parmi les 5 premières
    const randomIndex = Math.floor(Math.random() * 5) + 1;

    // Construire le sélecteur CSS pour cliquer sur la vidéo aléatoire
    const videoSelector = `${selector} ytd-compact-video-renderer:nth-child(${randomIndex}) a#thumbnail`;
    await randomMediumDelay();
    // Attendre que l'élément soit interactif et cliquer dessus
    await this.page.waitForSelector(videoSelector);
    Logger.info(`Clicked on video ${randomIndex}`);

    await humanLikeMouseHelper.click(videoSelector);
  }

  async scrollToRecommendations() {
    const recommendationsSelector = "ytd-compact-video-renderer";
  
    let retries = 10; // Limite pour éviter une boucle infinie
    let found = false;
  
    while (retries > 0) {
      found = await this.page.evaluate((selector) => {
        return document.querySelector(selector) !== null;
      }, recommendationsSelector);
  
      if (found) break; // Si trouvé, on arrête le scroll
  
      await this.page.evaluate(() => {
        window.scrollBy(0, randomNumber(250,450)); // Scroll vers le bas par petits incréments
      });
  
      await randomSmallDelay();
  
      retries--;
    }
  
    if (found) {
      await this.page.evaluate((selector) => {
        const element = document.querySelector(selector);
        if (element) {
          element.scrollIntoView({ behavior: "smooth", block: "center" });
        }
      }, recommendationsSelector);
  
      Logger.info("Scroll on recommendations done");
    } else {
      Logger.warn("Recommendations section not found after scrolling");
    }
  }

    /**
     * Extrait l'ID d'une vidéo YouTube à partir de son URL
     * @param url L'URL complète de la vidéo YouTube
     * @returns L'ID de la vidéo (ex: "LGXCaPw58v8") ou null si invalide
     */
    private extractVideoId(url: string): string | null {
      const regex = /[?&]v=([^&]+)/;
      const match = url.match(regex);
      return match ? match[1] : null;
    }
  
    async watchVideo(url: string): Promise<void> {
      // Attendre que la balise vidéo apparaisse
      await this.page.waitForSelector("video", { visible: true });

      const videoId = this.extractVideoId(url);
  
      let videoDuration = await YoutubeApi.getVideoDurationInSeconds(videoId);
  
      if (videoDuration > 0) {
        if (videoDuration > 600) {
          // 600 secondes = 10 minutes
          const randomWatchTime = Math.floor(
            Math.random() * (300 - 180 + 1) + 180
          ); // Durée entre 3 et 5 minutes
          Logger.info(
            `Video duration too high: ${videoDuration} seconds. Watching the video for ${randomWatchTime} seconds (3-5 mins)...`
          );
          await delay(randomWatchTime * 1000); // Regarder entre 3 et 5 minutes
        } else {
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
        }
      } else {
        Logger.warn(
          "Could not get video duration after multiple attempts. Watching for a default 30 seconds..."
        );
        await delay(30 * 1000); // Durée par défaut si la récupération échoue
      }
    }
}

export default YoutubeVideoPageActions;
