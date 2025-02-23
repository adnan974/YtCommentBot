import { getEnv } from "#config/index";
import { delay } from "#utils/delay";
import Logger from "#utils/Logger";
import { randomNumber } from "#utils/randomDelay";
import scrollToBottom from "#utils/scrollToBottom";
import { CommentDB } from "models";
import type { Page } from "puppeteer";
import type { searchParam } from "#types/index";
import { collectLinks } from "#utils/videos/collectLinks";
import { ICommentStrategy } from "./comments/ICommentStrategy";
import { CommentStrategyFactory } from "./comments/CommentStrategyFactory";
import store from "store/store";
import { humanLikeMouseHelper } from "./HumanLikeMouseHelper/HumanLikeMouseHelper";

Logger.banner("🚀 Starting YOMEN Application...");

export default 
class YOMEN {
  private page: Page;
  private botData;

  constructor(pages: Page) {
    this.page = pages;
    this.botData = store.getBotData();
  }

  async searchKeyword(
    param: searchParam,
    sortBy: string = "relevance"
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

      Logger.info("Scrolling to the bottom of the search results page...");
      await scrollToBottom(this.page);

      Logger.info("Waiting for video results to load...");
      await this.page.waitForSelector("ytd-video-renderer");

      Logger.info(`Collecting video links between ${this.botData.youtube_config.minViewsFilter} and ${this.botData.youtube_config.maxViewsFilter} views...`);
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

  //TODO: A revoir, il semble que la vidéo prennent plutot la durée de l'annonce et non la vidéo
  async watchVideo(): Promise<void> {
    // Attendre que la balise vidéo apparaisse
    await this.page.waitForSelector("video", { visible: true });
  
    // Récupérer la durée de la vidéo via la balise <video>
    const videoDuration = await this.page.evaluate(() => {
      const videoElement = document.querySelector("video");
      return videoElement ? Math.floor(videoElement.duration) : 0;
    });
  
    // Vérifier si la durée a bien été récupérée
    if (videoDuration > 0) {
      // Calculer une durée aléatoire entre 10% et 30% de la durée totale
      const minPercentage = 0.1; // 10%
      const maxPercentage = 0.3; // 30%
      const randomFactor = Math.random() * (maxPercentage - minPercentage) + minPercentage;
      const watchDuration = Math.floor(100 * randomFactor);
  
      Logger.info(`Video duration: ${videoDuration} seconds`);
      Logger.info(`Watching the video for ${watchDuration} seconds (~${Math.floor(randomFactor * 100)}% of the total duration)...`);
  
      // Attendre la durée aléatoire
      await delay(watchDuration * 1000);
    } else {
      Logger.warn(
        "Could not get video duration. Watching for a default 30 seconds..."
      );
      await delay(30 * 1000); // Durée par défaut si la récupération échoue
    }
  }
  

  async stayOnPageAndMoveMouse(): Promise<void> {
    // Générer une durée aléatoire entre 40 et 60 secondes
    const stayDuration = Math.floor(Math.random() * (60 - 40 + 1)) + 40;
    Logger.info(`Staying on the page for ${stayDuration} seconds...`);

    const endTime = Date.now() + stayDuration * 1000;

    // Bouger la souris aléatoirement tant que la durée n'est pas écoulée
    while (Date.now() < endTime) {
      // Obtenir des coordonnées aléatoires sur la page
      const x = Math.floor(Math.random() * 800) + 100; // Coordonnées X entre 100 et 900
      const y = Math.floor(Math.random() * 500) + 100; // Coordonnées Y entre 100 et 600

      // Déplacer la souris
      await this.page.mouse.move(x, y);
      Logger.info(`Mouse moved to (${x}, ${y})`);

      // Attendre entre 2 et 5 secondes avant le prochain mouvement
      await delay(Math.floor(Math.random() * (5000 - 2000 + 1)) + 2000);
    }

    Logger.info("Finished staying on the page.");
  }

  async randomVideoInteraction(): Promise<void> {
    await delay(randomNumber(1000, 2000));

    const shouldLike = Math.random() < 0.3; // 100% de chances d'aimer (ajuste si besoin)
    const shouldSubscribe = Math.random() < 0.1; // 100% de chances de s'abonner (ajuste si besoin)

    if (shouldLike) {
      Logger.info("Liking the video...");
      // Attendre que le bouton J'aime apparaisse
      await this.page.waitForSelector(
        'button.yt-spec-button-shape-next[aria-pressed="false"]',
        { visible: true }
      );
      // Cliquer sur le bouton J'aime
      await humanLikeMouseHelper.click(
        'button.yt-spec-button-shape-next[aria-pressed="false"]'
      );
      await delay(randomNumber(1000, 2000));
    }

    if (shouldSubscribe) {
      Logger.info("Subscribing to the channel...");
      // Attendre que le bouton S'abonner apparaisse
      await this.page.waitForSelector(
        "yt-button-shape#subscribe-button-shape button.yt-spec-button-shape-next",
        { visible: true }
      );

      // Cliquer sur le bouton S'abonner
      await humanLikeMouseHelper.click(
        "yt-button-shape#subscribe-button-shape button.yt-spec-button-shape-next"
      );
    }
  }

  async browseComments(): Promise<void> {
    Logger.info("Browsing the comments...");
  
    // Scroll vers la section des commentaires
    await this.page.evaluate(() => {
      const commentsSection = document.querySelector("#comments");
      if (commentsSection) {
        commentsSection.scrollIntoView({ behavior: "smooth" });
      }
    });

    Logger.info("Comment section found !");
  
    // Pause aléatoire
    await delay(randomNumber(3000, 6000));
  
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
  

  async moveMouseRandomly(): Promise<void> {
    Logger.info("Moving the mouse randomly...");

    const x = randomNumber(100, 500);
    const y = randomNumber(100, 500);

    await this.page.mouse.move(x, y);
    await delay(randomNumber(1000, 2000));

    await this.page.mouse.move(x + 50, y + 50);
    await delay(randomNumber(1000, 2000));
  }

  randomSmallDelay = () => delay(randomNumber(500, 1500));
  randomMediumDelay = () => delay(randomNumber(3000, 7000));
  randomLongDelay = () => delay(randomNumber(10000, 20000));

  async hoverRandomElements(): Promise<void> {
    const elements = await this.page.$$("a, button, div, img");
    if (elements.length > 0) {
      const element = elements[Math.floor(Math.random() * elements.length)];
      if (element) {
        const box = await element.boundingBox();
        if (box) {
          await this.page.mouse.move(
            box.x + box.width / 2,
            box.y + box.height / 2
          );
          Logger.info("Hovering over a random element...");
          await this.randomSmallDelay();
        }
      }
    }
  }

  async navigateThroughRecommendations(): Promise<void> {
    Logger.info("Navigating through recommended videos...");
  
    try {
      // Scroll to the recommended videos section
      await this.page.evaluate(() => {
        const recommendationsSection = document.querySelector(
          "#related, #secondary, ytd-watch-next-secondary-results-renderer"
        );
        if (recommendationsSection) {
          recommendationsSection.scrollIntoView({ behavior: "smooth" });
        }
      });
  
      // Wait for recommendations to load
      await this.page.waitForSelector(
        "ytd-compact-video-renderer, ytd-compact-radio-renderer"
      );
      await delay(randomNumber(2000, 4000));
  
      // Collect recommendation links
      const recommendedLinks = await this.page.evaluate(() => {
        return Array.from(
          document.querySelectorAll(
            "ytd-compact-video-renderer a#thumbnail, ytd-compact-radio-renderer a#thumbnail"
          )
        )
          .map((el) => (el as HTMLAnchorElement).href)
          .filter((href) => href.includes("watch"));
      });
  
      Logger.info(
        `Found ${recommendedLinks.length} recommended video links...`
      );
  
      if (recommendedLinks.length === 0) {
        Logger.warn("No recommended videos found!");
        return;
      }
  
      // Pick a random recommended video
      const randomVideoLink =
        recommendedLinks[Math.floor(Math.random() * recommendedLinks.length)];
  
      Logger.info(`Navigating to recommended video: ${randomVideoLink}`);
      await this.page.goto(randomVideoLink);
  
      // Simulate watching the recommended video
      await this.stayOnPageAndMoveMouse();
      await this.randomVideoInteraction();
  
      // Optional: Recursive browsing through recommendations
      if (Math.random() < 0.5) {
        Logger.info("Deciding to continue browsing recommendations...");
        await this.navigateThroughRecommendations();
      } else {
        Logger.info("Deciding to stop browsing recommendations.");
      }
    } catch (error) {
      Logger.error(
        `Failed to navigate through recommended videos: ${(error as Error).message}`
      );
    }
  }
  

  async goToVideo(
    videoLink: string,
    commentType = "random",
    manual: string | undefined = undefined
  ): Promise<void> {

    try {
      console.log(videoLink, commentType, manual);

      // Vérifier si le commentaire existe déjà
      const exist = await CommentDB.findOne({
        where: {
          username: this.botData.username,
          video_url: videoLink,
        },
      });

      if (exist) {
        Logger.info(`Comment already exists for video: ${videoLink}`);
        return;
      }

      Logger.info(`Navigating to video page: ${videoLink}`);
      await this.page.goto(videoLink);

      await delay(10000); // Attendre que la vidéo charge 
      // Attendre que la vidéo charge et simuler le visionnage
      await this.watchVideo();
      await this.randomVideoInteraction(); // Like/Subscribe aléatoire 
      await this.browseComments(); // Parcours des commentaires
      //await this.stayOnPageAndMoveMouse(); // Regarde la vidéo entre 15 et 60 secondes
      //await this.navigateThroughRecommendations
      //TODO: Revoir le code
      await this.moveMouseRandomly(); // Déplace la souris

      // Instancier la bonne stratégie de commentaire
      let commentStrategy: ICommentStrategy;

      try {
        commentStrategy = CommentStrategyFactory.create(commentType, {
          comment: manual,
          filePath: "./comments.csv",
        });
      } catch (e) {
        Logger.error(
          `Failed to create comment strategy: ${(e as Error).message}`
        );
        return;
      }

      // Utiliser la stratégie pour poster le commentaire
      await commentStrategy.postComment(videoLink, this.page);

      // Ajouter un délai pour simuler un comportement humain
      await delay(5000);
    } catch (e) {
      Logger.error(
        `Failed to interact with the video: ${(e as Error).message}`
      );

      await CommentDB.create({
        username: this.botData.username,
        video_url: videoLink,
        comment_status: "failed",
        comment: (e as Error).message,
      });
    }
  }
}
