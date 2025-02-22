import fs from "fs";
import path from "path";
import UndetectableBrowser from "undetected-browser";
import { Browser, Page } from "puppeteer";
import { setEnv } from "#config/index";
import { UserAgent } from "constants/UserAgents";
const puppeteer = require('puppeteer-extra')
const StealthPlugin = require("puppeteer-extra-plugin-stealth");

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

        puppeteer.use(StealthPlugin());

        const UndetectableBMS = new UndetectableBrowser(
            await puppeteer.launch({ 
                headless: false,
                executablePath: path.join(driverPath, "google-chrome-stable"),
                userDataDir: `session/${this.username}`,
                args: [
                    '--disable-dev-shm-usage',
                    '--disable-accelerated-2d-canvas',
                    '--disable-gpu',
                    '--no-default-browser-check',
                    '--no-first-run',
                    '--mute-audio',
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
        await this.page.setUserAgent(UserAgent.Chrome105);
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
