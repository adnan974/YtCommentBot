import fs from "fs";
import path from "path";
import csvParser from "csv-parser";
import Logger from "#utils/Logger";
import { CommentDB } from "models";
import { ICommentStrategy } from "./ICommentStrategy";
import { Page } from "puppeteer";
import { getEnv } from "#config/index";

export class CSVCommentStrategy implements ICommentStrategy {
  private filePath: string;

  constructor(filePath: string) {
    this.filePath = filePath;
  }

  private async readCommentsFromCSV(): Promise<string[]> {
    return new Promise((resolve, reject) => {
      const comments: string[] = [];
      const absolutePath = path.resolve(this.filePath);

      if (!fs.existsSync(absolutePath)) {
        return reject(new Error(`File not found: ${absolutePath}`));
      }

      fs.createReadStream(absolutePath)
        .pipe(csvParser({ separator: ";", headers: false }))
        .on("data", (row) => {
          const comment = row[0];
          if (comment) {
            comments.push(comment);
          }
        })
        .on("end", () => resolve(comments))
        .on("error", reject);
    });
  }
  
  async postComment(videoLink: string, page: Page) {
    try {
      Logger.info(`Reading comments from CSV: ${this.filePath}`);
      const comments = await this.readCommentsFromCSV();

      if (comments.length === 0) {
        Logger.warn("No comments found in the CSV file.");
        return;
      }

      // Sélection aléatoire d'un commentaire
      const randomComment =
        comments[Math.floor(Math.random() * comments.length)];
      Logger.info(`Random comment selected from CSV: "${randomComment}"`);

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
        timeout: 60000,
      });

      await page.evaluate(() => {
        const commentBox = document.querySelector("#simple-box");
        if (commentBox) {
          commentBox.scrollIntoView({ behavior: "smooth", block: "center" });
        }
      });

      await page.waitForSelector("#placeholder-area", {
        visible: true,
        timeout: 10_000,
      });

      // Cliquer sur la zone de saisie du commentaire
      await page.click("#placeholder-area");

      // Saisir le commentaire
      await page.type("#placeholder-area", randomComment);

      Logger.info("Submitting the comment...");
      await page.keyboard.press("Enter");

      await page.click(
        "#submit-button > yt-button-shape > button > yt-touch-feedback-shape > div"
      );
      Logger.success("Comment posted successfully!");

      await CommentDB.create({
        username: getEnv("USERNAME"),
        video_url: videoLink,
        comment_status: "success",
        comment: randomComment,
      });
    } catch (error) {
      Logger.error(`Failed to post a CSV comment: ${(error as Error).message}`);
    }
  }
}
