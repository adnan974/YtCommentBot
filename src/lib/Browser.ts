import fs from "fs";
import path from "path";
import UndetectableBrowser from "undetected-browser";
import puppeteer, { Browser, Page } from "puppeteer";
import { setEnv } from "#config/index";

export class LaunchBrowser {
    public browser: Browser | null;
    public page: Page | null;
    public username: string;

    constructor(username: string) {
        this.username = username;
        this.browser = null;
        this.page = null;
    }

    /**
     * Initialize the browser with undetectable settings and a specific user session.
     */
    async init(): Promise<void> {
        const driverPath = path.resolve("/usr/bin/");
        const sessionDir = path.resolve(`session/${this.username}`);
        if (!fs.existsSync(sessionDir)) {
            fs.mkdirSync(sessionDir, { recursive: true });
        }
        // Check if driver folder exists and is not empty
        if (!fs.existsSync(driverPath) || fs.readdirSync(driverPath).length === 0) {
            throw new Error("The 'driver' folder is empty or does not exist. Please ensure the necessary files are present.");
        }

        const UndetectableBMS = new UndetectableBrowser(
            await puppeteer.launch({ 
                headless: false,
                executablePath: path.join(driverPath, "google-chrome-stable"),
                userDataDir: `session/${this.username}`,
                args: [
                    '--no-sandbox',
                    '--disable-setuid-sandbox',
                    '--disable-dev-shm-usage',
                    '--disable-accelerated-2d-canvas',
                    '--disable-gpu',
                    '--disable-features=IsolateOrigins,site-per-process',
                    '--disable-blink-features=AutomationControlled',
                    '--disable-features=SiteIsolation',
                    '--disable-site-isolation-trials',
                    '--no-default-browser-check',
                    '--no-first-run',
                    '--no-zygote',
                    '--mute-audio',
                    '--no-zygote-forced',
                    '--no-zygote-forced-for-chrome',
                    '--disable-web-security',
                    '--incognito',
                ],
            })
        );

        this.browser = await UndetectableBMS.getBrowser();
        this.page = await this.browser.newPage();

        // blocage des médias pour ne pas charger les vidéos
        await this.page.setRequestInterception(true);

        this.page.on('request', (request) => {
            const url = request.url().toLowerCase();
            const resourceType = request.resourceType();

            if (
                url.endsWith('.mp4') ||
                url.endsWith('.avi') ||
                url.endsWith('.flv') ||
                url.endsWith('.mov') ||
                url.endsWith('.wmv') ||
                url.includes('googlevideo') || // Bloque les vidéos YouTube
                url.includes('ytimg') // Bloque les miniatures et images YouTube
            ) {
                request.abort();
            } else {
                request.continue();
            }
        });

        
        //await this.page.setViewport({ width: 1375, height: 3812 });
        await this.page.setUserAgent("Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/132.0.0.0 Safari/537.36")
        setEnv(`SESSION_DIR_${this.username}`, `session/${this.username}`);
    }

    /**
     * Close the browser instance.
     */
    async close(): Promise<void> {
        if (this.browser) {
            await this.browser.close();
        }
    }
}
