// strategies/RandomCommentStrategy.ts
import { CommentDB } from "models";
import Logger from "#utils/Logger";
import { randomNumber } from "#utils/randomDelay";
import { Page } from "puppeteer";
import { ICommentStrategy } from "./ICommentStrategy";

export class RandomCommentStrategy implements ICommentStrategy {
  async postComment(videoLink: string, page: Page): Promise<void> {
    /*
    Logger.info("Collecting all comments from the video...");
    const comments = await page.evaluate(() => {
      return Array.from(
        document.querySelectorAll(
          "span.yt-core-attributed-string.yt-core-attributed-string--white-space-pre-wrap"
        )
      ).map((comment) => comment.textContent?.trim()).filter(Boolean);
    });

    if (!comments.length) {
      Logger.warn("No comments found on this video.");
      return;
    }

    const randomComment = comments[Math.floor(Math.random() * comments.length)];
    Logger.info(`Random comment selected: "${randomComment}"`);

    await page.waitForSelector("#placeholder-area", {
      visible: true,
      timeout: randomNumber(5000, 10000),
    });

    await page.click("#placeholder-area");
    await page.type("#placeholder-area", randomComment);

    Logger.info("Submitting the comment...");
    await page.keyboard.press("Enter");

    Logger.success("Comment posted successfully!");
    await CommentDB.create({
      video_url: videoLink,
      comment_status: "success",
      comment: randomComment,
    });
    */
  }

  // TODO: A  refacto: utiliser ce code dans le postCOmment
  /*
  async randomComment(videoLink) {
    Logger.info("Collecting all comments from the video...");
    const comments = await this.collectAllComments();

    if (comments.length === 0) {
      Logger.warn("No comments found on this video.");
      return;
    }

    Logger.success(`Collected ${comments.length} comments.`);

    const randomComment = comments[Math.floor(Math.random() * comments.length)];
    Logger.info(`Random comment selected: "${randomComment}"`);

    Logger.info("Scrolling to the comment input box...");
    await this.page.waitForSelector("#simple-box", {
      visible: true,
      timeout: await randomNumber(5000, 10000),
    });
    await this.page.evaluate(() => {
      const commentBox = document.querySelector("#simple-box");
      if (commentBox) {
        commentBox.scrollIntoView({ behavior: "smooth", block: "center" });
      }
    });

    Logger.info("Clicking on the comment box...");
    await this.page.waitForSelector("#placeholder-area", {
      visible: true,
      timeout: await randomNumber(5000, 10000),
    });
    await this.page.click("#placeholder-area");

    Logger.info("Waiting for the text input box to be ready...");
    await this.page.waitForSelector("#contenteditable-root", {
      visible: true,
      timeout: await randomNumber(5000, 10000),
    });

    Logger.info("Typing the selected random comment...");
    await this.page.type("#contenteditable-root", randomComment);

    Logger.info("Submitting the comment...");
    await this.page.keyboard.press("Enter");

    Logger.success("Comment posted successfully!");
    await this.page.click(
      "#submit-button > yt-button-shape > button > yt-touch-feedback-shape > div"
    );

    await CommentDB.create({
      username: getEnv("USERNAME"),
      video_url: videoLink,
      comment_status: "success",
      comment: randomComment,
    });
  }*/
}
