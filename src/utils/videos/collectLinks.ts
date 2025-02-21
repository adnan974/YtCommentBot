import store from "store/store";

export async function collectLinks(page) {
  const botData = store.getBotData(); 

  const videoData = await page.$$eval(
    "ytd-video-renderer",
    (videos, botData) => {
      return (
        videos
          .map((video) => {
            const linkElement = video.querySelector("a#thumbnail");
            const viewsElement = video.querySelector(
              ".inline-metadata-item.style-scope.ytd-video-meta-block"
            );

            // Extraire le lien et le nombre de vues
            const link = linkElement ? linkElement.href : null;
            const viewsText = viewsElement ? viewsElement.innerText : "0 views";

            // Convertir le texte des vues en nombre
            const viewsMatch = viewsText.match(
              /([\d,.]+)\s?(K|M|B)?\s?views?/i
            );
            if (!viewsMatch) return null;

            let views = parseFloat(viewsMatch[1].replace(/,/g, "")); // Nombre brut sans virgules

            // Ajuster selon le suffixe K, M ou B
            if (viewsMatch[2]) {
              const suffix = viewsMatch[2].toUpperCase();
              if (suffix === "K") views *= 1000;
              if (suffix === "M") views *= 1000000;
              if (suffix === "B") views *= 1000000000;
            }

            return { link, views };
          })
          // Filtrer les vidéos avec plus de 3000 vues et moins de 30 000 vues
          .filter((video) => {
            return (
              video &&
              video.link &&
              video.views > botData.minViewsFilter &&
              video.views < botData.maxViewsFilter
            );
          })
      );
    },botData
  );

  // Limiter à 50 résultats max
  const limitedVideoLinks = videoData.slice(0, 50).map((video) => video.link);

  return limitedVideoLinks;
}
