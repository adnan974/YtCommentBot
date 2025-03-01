import * as fs from "fs";
import { CSVCommentStrategy } from "./CSVCommentStrategy";
import { DirectCommentStrategy } from "./DirectCommentStrategy";
import { ICommentStrategy } from "./ICommentStrategy";
import { RandomCommentStrategy } from "./RandomCommentStrategy";
import Logger from "#utils/Logger";

export class CommentStrategyFactory {
  static create(
    type: string,
    options?: { comment?: string; filePath?: string }
  ): ICommentStrategy {
    switch (type) {
      case "random":
        return new RandomCommentStrategy();
      case "csv":
        if (!options?.filePath) {
          throw new Error("File path is required for CSV comment strategy.");
        }
        // Vérification que le fichier existe
        if (!fs.existsSync(options.filePath)) {
          throw new Error(`CSV file not found at path: ${options.filePath}`);
        }
        Logger.info(`CSV file found at path: ${options.filePath}`);
        return new CSVCommentStrategy(options.filePath);
      case "direct":
        if (!options?.comment) {
          throw new Error("Comment is required for direct comment strategy.");
        }
        return new DirectCommentStrategy(options.comment);
      default:
        throw new Error(`Unknown comment strategy type: ${type}`);
    }
  }
}
