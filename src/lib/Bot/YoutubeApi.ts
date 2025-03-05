import { getEnv } from "#config/index";
import axios from "axios";

class YoutubeAPI {
  private apiKey: string = getEnv("YT_API_KEY");
  private baseUrl: string = "https://www.googleapis.com/youtube/v3/videos";

  constructor() {}

  /**
   * Convertit une durée ISO 8601 en secondes
   * @param duration La durée en format ISO 8601 (ex: PT11M39S)
   * @returns La durée totale en secondes (ex: 699 secondes)
   */
  private convertISO8601ToSeconds(duration: string): number {
    const regex = /PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/;
    const matches = duration.match(regex);

    if (!matches) return 0;

    const hours = matches[1] ? parseInt(matches[1]) : 0;
    const minutes = matches[2] ? parseInt(matches[2]) : 0;
    const seconds = matches[3] ? parseInt(matches[3]) : 0;

    return hours * 3600 + minutes * 60 + seconds;
  }

  /**
   * Récupère la durée d'une vidéo en secondes
   * @param videoId L'ID de la vidéo YouTube
   * @returns La durée en secondes (ex: 699)
   */
  async getVideoDurationInSeconds(videoId: string): Promise<number | null> {
    try {
      console.log("getVideoDurationInSeconds");

      const response = await axios.get(this.baseUrl, {
        params: {
          part: "contentDetails",
          id: videoId,
          key: this.apiKey,
        },
      });

      if (response.data.items.length === 0) {
        console.error("Vidéo introuvable !");
        return null;
      }

      const durationISO: string =
        response.data.items[0].contentDetails.duration;
      console.log("Duration ISO:", durationISO);

      return this.convertISO8601ToSeconds(durationISO);
    } catch (error) {
      console.error(
        "Erreur lors de la récupération des données YouTube :",
        error
      );
      return null;
    }
  }
}

export default new YoutubeAPI();
