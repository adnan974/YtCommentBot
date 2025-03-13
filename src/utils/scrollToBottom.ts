import { Page, Puppeteer } from "puppeteer";

export async function scrollToBottom(pages, attempts = 10, maxAttempts = 30, interval = 500) {
    await pages.evaluate(async (attempts, maxAttempts, interval) => {
        // Désactive les événements de clic pour éviter les clics indésirables pendant le défilement
        const disableClicks = () => {
            document.body.style.pointerEvents = 'none';
        };
        
        // Réactive les événements de clic après
        const enableClicks = () => {
            document.body.style.pointerEvents = 'auto';
        };

        await new Promise<void>((resolve) => {
            let lastScrollHeight = document.body.scrollHeight;
            let currentAttempts = 0;

            const timer = setInterval(() => {
                window.scrollBy(0, window.innerHeight); 

                // Si la hauteur du document a changé, réinitialise le compteur d'essais
                if (document.body.scrollHeight > lastScrollHeight) {
                    lastScrollHeight = document.body.scrollHeight; 
                    currentAttempts = 0; 
                } else {
                    currentAttempts++;
                }

                // Si le nombre d'essais atteint la limite, arrête le défilement
                if (currentAttempts >= maxAttempts) {
                    clearInterval(timer);
                    enableClicks(); // Réactive les clics après le défilement
                    resolve();
                }
            }, interval);
            
            // Désactive les clics au début du défilement
            disableClicks();
        });
    }, attempts, maxAttempts, interval);
}
