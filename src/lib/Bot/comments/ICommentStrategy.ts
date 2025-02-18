import { Page } from "puppeteer";

// interfaces/ICommentStrategy.ts
export interface ICommentStrategy {
    postComment(videoLink: string, page: Page): Promise<void>;
  }