import { getEnv } from "#config/index";
import axios from "axios";

class YoutubeAPI {
  private apiKey: string = getEnv("YT_API_KEY");
  private baseUrl: string = "https://www.googleapis.com/youtube/v3/videos";

  constructor() {}

  /**
   * Récupère la durée d'une vidéo YouTube en fonction de son ID
   * @param videoId L'ID de la vidéo YouTube
   * @returns La durée de la vidéo en format humain (hh:mm:ss)
   */
  async getVideoDuration(videoId: string): Promise<string | null> {
    try {
    console.log("getVideoDuration");
    console.log(this.apiKey)
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
      return this.convertISO8601ToTime(durationISO);
    } catch (error) {
      console.error(
        "Erreur lors de la récupération des données YouTube :",
        error
      );
      return null;
    }
  }

  /**
   * Convertit une durée ISO 8601 en format hh:mm:ss
   * @param duration La durée en format ISO 8601 (ex: PT11M39S)
   * @returns La durée formatée (ex: 00:11:39)
   */
  private convertISO8601ToTime(duration: string): string {
    const regex = /PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/;
    const matches = duration.match(regex);

    if (!matches) return "00:00:00";

    const hours = matches[1] ? parseInt(matches[1]) : 0;
    const minutes = matches[2] ? parseInt(matches[2]) : 0;
    const seconds = matches[3] ? parseInt(matches[3]) : 0;

    return [hours, minutes, seconds]
      .map((unit) => String(unit).padStart(2, "0"))
      .join(":");
  }
}

export default new YoutubeAPI();
