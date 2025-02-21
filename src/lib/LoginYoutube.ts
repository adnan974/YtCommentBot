import { delay } from "#utils/delay";
import Logger from "#utils/Logger";
import { randomDelay,randomNumber } from "#utils/randomDelay";
import store from "store/store";

export default class LoginYoutube {
    page: any;
    constructor(pages) {
        this.page = pages;
    }

    async login() {
        try {
            Logger.info('Setting up browser headers and user agent...');
            await this.page.setExtraHTTPHeaders({
                'Accept-Language': 'en-US,en;q=0.8',
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36',
                'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.9',
            });
            await this.page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.6261.129 Safari/537.36');
    
            Logger.info('Navigating to Google Account Info Page...');
            await this.page.goto('https://myaccount.google.com/personal-info?pli=1', {
                waitUntil: 'networkidle0',
            });
    
            // ✅ Check if already logged in
            try {
                Logger.info('Checking if already logged in...');
                await this.page.waitForFunction(() => {
                    const textToFind = ['Basic info', 'Info dasar'];
                    return Array.from(document.querySelectorAll('*'))
                        .some(element => textToFind.some(text => element?.textContent?.includes(text)));
                }, { timeout: 5000 });
    
                Logger.success('Already logged in.');
    
                return true;
            } catch (error) {
                Logger.warn('User not logged in. Proceeding to login...');
            }
    
            // ✅ Navigate to Login Page
            Logger.info('Navigating to Google Login Page...');
            await this.page.goto("https://accounts.google.com/v3/signin/identifier?continue=https%3A%2F%2Fmyaccount.google.com%2Fintro%2Fpersonal-info%3Fpli%3D1&ec=GAZAwAE&followup=https%3A%2F%2Fmyaccount.google.com%2Fintro%2Fpersonal-info%3Fpli%3D1&ifkv=ASSHykrC6ErrKuH9CXbLDHX-WG8T9b89EPZ-kzi5Z6YXpuyjFseEKzGc3maSFu4LeGdNShuKSVim2A&osid=1&passive=1209600&service=accountsettings&flowName=GlifWebSignIn&flowEntry=ServiceLogin&dsh=S-801714618%3A1739727816564016&ddm=1");

            // ✅ Get bot data
            const botData = store.getBotData();
    
            // ✅ Enter Username
            Logger.info('Typing username...');
            const usernameSelector = '#identifierId';
            await this.page.waitForSelector(usernameSelector, { visible: true, timeout: 10000 });
            await this.page.type(usernameSelector, botData.google_account.email, { delay: randomNumber(100, 300) });
            await this.page.keyboard.press('Enter');
            await randomDelay(1000, 2000);
    
            // ✅ Enter Password
            Logger.info('Typing password...');
            const passwordSelector = 'input[type="password"]';
            await this.page.waitForSelector(passwordSelector, { visible: true, timeout: 10000 });
            await this.page.type(passwordSelector, botData.google_account.password, { delay: randomNumber(100, 300) });
            await this.page.keyboard.press('Enter');
            await this.page.waitForNavigation({ waitUntil: 'networkidle0' });
    
            // ✅ Check for Login Errors
            const errorSelector = 'span[jsname="B34EJ"]';
            const errorExists = await this.page.waitForSelector(errorSelector, { visible: true, timeout: 5000 }).catch(() => null);
    
            if (errorExists) {
                const errorMessage = await this.page.$eval(errorSelector, (el) => el.textContent?.trim() || 'Unknown error');
                Logger.error(`Login failed: ${errorMessage}`);
                await delay(5000);
                await this.page.browser().close();
                return;
            }
    
            // ✅ Verify Successful Login
            Logger.info('Verifying successful login...');
            await this.page.goto('https://myaccount.google.com/personal-info?pli=1', { waitUntil: 'networkidle0' });
    
            await this.page.waitForFunction(() => {
                const textToFind = ['Basic info', 'Info dasar'];
                return Array.from(document.querySelectorAll('*'))
                    .some(element => textToFind.some(text => element?.textContent?.includes(text)));
            }, { timeout: 5000 });
    
            Logger.success('Login successful! Redirecting to dashboard...');
    
        } catch (error) {
            Logger.error(`Unexpected error during login: ${error.message}`);
            await delay(5000);
            await this.page.browser().close();
        }
    }
}