import Logger from "#utils/Logger";
import { Page } from "puppeteer";
import { humanLikeMouseHelper } from "./HumanLikeMouseHelper/HumanLikeMouseHelper";
import { delay, randomSmallDelay } from "#utils/delay";

export class YoutubeShortVideoPageAction {
  private page: Page;

  constructor(page) {
    this.page = page;
  }

  async goToShortWithButton(): Promise<void> {
    try {
      Logger.info("Navigating to YouTube Shorts...");

      // Définir les différents sélecteurs possibles pour le bouton Shorts
      const selectors = [
        "ytd-guide-entry-renderer a[title='Shorts']",
        "ytd-mini-guide-entry-renderer[aria-label='Shorts']",
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
