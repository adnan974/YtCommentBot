// factories/CommentStrategyFactory.ts

import { CSVCommentStrategy } from "./CSVCommentStrategy";
import { DirectCommentStrategy } from "./DirectCommentStrategy";
import { ICommentStrategy } from "./ICommentStrategy";
import { RandomCommentStrategy } from "./RandomCommentStrategy";


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
