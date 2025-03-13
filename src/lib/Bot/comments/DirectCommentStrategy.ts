// strategies/DirectCommentStrategy.ts
import { CommentDB } from "models";
import Logger from "#utils/Logger";
import { ICommentStrategy } from "./ICommentStrategy";
import { Page } from "puppeteer";
import { getEnv } from "#config/index";
import { humanLikeMouseHelper } from "../HumanLikeMouseHelper/HumanLikeMouseHelper";
import { CommentStatus } from "constants/CommentStatus";

export class DirectCommentStrategy implements ICommentStrategy {
  private comment: string;

  constructor(comment: string) {
    this.comment = comment;
  }

  //TODO: A REFACTO POUR QUE CA FONCTIONN
  async postComment(videoLink: string, page: Page) {

    Logger.info("Placing the view on the comments section...");

    // Attendre que la page soit complètement chargée
    await page.waitForSelector("#comments", {
      visible: true,
      timeout: 60000,
    });

    await page.evaluate(() => {
      const commentsSection = document.querySelector("#comments");
      if (commentsSection) {
        const rect = commentsSection.getBoundingClientRect();
        window.scrollTo({
          top: window.scrollY + rect.top - 100,
          left: 0,
          behavior: "instant",
        });
      }
    });

    await page.waitForSelector("#simple-box", {
      visible: true,
      timeout: 60_000,
    });

    await page.evaluate(() => {
      const commentBox = document.querySelector("#simple-box");
      if (commentBox) {
        commentBox.scrollIntoView({ behavior: "smooth", block: "center" });
      }
    });

    await page.waitForSelector("#placeholder-area", {
      visible: true,
      timeout: 10_000
    });
    await humanLikeMouseHelper.click("#placeholder-area");
    await page.type("#placeholder-area", this.comment);

    Logger.info("Submitting the comment...");
    await page.keyboard.press("Enter");

    Logger.success("Comment posted successfully!");
    await humanLikeMouseHelper.click(
      "#submit-button > yt-button-shape > button > yt-touch-feedback-shape > div"
    );
    await CommentDB.create({
      username: getEnv("USERNAME"),
      video_url: videoLink,
      comment_status: CommentStatus.SUCCESS,
      comment: this.comment,
    });
    
  }
}
