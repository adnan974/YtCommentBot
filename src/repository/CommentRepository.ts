import { Op } from "@sequelize/core";
import { CommentStatus } from "constants/CommentStatus";
import { CommentDB } from "models";

export async function getCommentsCountToday(botId: number) {
  // Récupérer la date actuelle
  const startOfDay = new Date();
  startOfDay.setHours(0, 0, 0, 0); // Fixe l'heure à minuit (début de la journée)

  // Récupérer la date de fin de journée (avant minuit)
  const endOfDay = new Date();
  endOfDay.setHours(23, 59, 59, 999); // Fixe l'heure à 23h59 (fin de la journée)

  // Compter les commentaires avec 'success' aujourd'hui
  const count = await CommentDB.count({
    where: {
      botId,              // Condition sur la colonne 'bot
      comment_status: CommentStatus.SUCCESS, // Condition sur la colonne 'comment'
      createdAt: {         // Condition sur la date de création
        [Op.between]: [startOfDay, endOfDay], // Entre le début et la fin de la journée
      },
    },
  });

  return count;
}
