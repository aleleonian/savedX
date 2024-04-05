const puppeteer = require('puppeteer-extra');
const pluginStealth = require('puppeteer-extra-plugin-stealth');
puppeteer.use(pluginStealth());
const path = require("path");
const crypto = require('crypto');

// const puppeteerClassic = require("puppeteer");
// const iPhone = KnownDevices["iPhone X"];
// const KnownDevices = puppeteerClassic.KnownDevices;

const BROWSER_OPEN_FAIL = 0;
const exitCodeStrings = [
    "Could not open browser :(!"
]


let pupConfig = {
    headless: process.env.XBOT_HEADLESS ? JSON.parse(process.env.XBOT_HEADLESS) : false,
    defaultViewport: null,
    ignoreDefaultArgs: ["--enable-automation"],
    args: [
        '--start-maximized',
        '--no-sandbox',
        '--disable-setuid-sandbox'
    ],
};

if (process.env.EXECUTABLE_PATH) {
    pupConfig.executablePath = process.env.EXECUTABLE_PATH;
}

export class XBot {

    constructor() {
        this.browser;
        this.page;
        this.tweets = {};
        this.isLoggedIn = false;
        this.isBusy = false;
        this.queue = [];
        this.queueTimer = false;
        this.monitorFlag = true;
        this.bookmarks = [];
    }

    createHash(inputString) {
        const hash = crypto.createHash('md5');
        hash.update(inputString);
        return hash.digest('hex');
    }
    setBusy(state) {
        this.isBusy = state;
        return true;
    }
    getTweet(userId) {
        return this.tweets[userId];
    }

    async init() {
        const browser = await puppeteer.launch(pupConfig);
        let responseObject = {};
        if (!browser) {
            responseObject = {
                success: false,
                exitCode: BROWSER_OPEN_FAIL,
                message: exitCodeStrings[BROWSER_OPEN_FAIL]
            }
            return responseObject;
        }
        else {
            this.browser = browser;
            responseObject = {
                success: true,
            }
            this.page = await browser.newPage();
            // this.page.setDefaultTimeout(10000);
            return responseObject;
        }
    }
    async goto(urlToVisit) {
        try {
            await this.page.goto(urlToVisit, {
                waitUntil: "load",
            });
            return true;
        }
        catch (error) {
            console.log("goto: Error! ", error);
            return false;
        }
    }
    async takePic(filePath) {
        if (!filePath) {
            filePath = path.resolve(__dirname, "../public/images/xBotSnap.jpg")
        }
        try {
            await this.page.screenshot({ path: filePath });
            return true;
        }
        catch (error) {
            console.log("takePic() error->", error);
            return false;
        }
    }
    async findAndType(targetElement, text) {
        try {
            let inputElement = await this.page.waitForSelector(targetElement);

            await inputElement.type(text);

            return true;

        }
        catch (error) {
            console.log("findAndType: Error! ", error);
            return false;
        }
    }
    async findAndClick(targetElement) {
        try {
            let inputElement = await this.page.waitForSelector(targetElement);

            await inputElement.click();

            return true;

        }
        catch (error) {
            console.log("findAndClick: Error! ", error);
            return false;
        }
    }
    async findAndGetText(targetElement) {
        try {
            let inputElement = await this.page.waitForSelector(targetElement);

            const text = await this.page.$eval(targetElement, el => el.innerText);

            let responseObject = {}
            responseObject.success = true;
            responseObject.text = text;

            return responseObject;

        }
        catch (error) {
            console.log("findAndGetText: Error! ", error);
            return false;
        }
    }
    getCurrentBotUrl() {
        return this.page.url();
    }
    async getLastTweetUrl() {
        let hasVisited = await this.goto("https://www.x.com" + "/" + process.env.TWITTER_BOT_USERNAME);
        if (!hasVisited) return false;

        let foundAndClicked = await this.findAndClick(process.env.TWITTER_LAST_POST_IN_PROFILE);
        if (!foundAndClicked) return false;

        return this.getCurrentBotUrl();
    }

    async tweet(userId, text) {

        // if the xBot is busy then the userId and tweetText will be kept in an object in 
        // the queue array
        // if the queue array's length == 1, then the queue monitor will be turned on
        // the queue monitor is a function that checks every 5 seconds whether the xBot is 
        // still busy or not
        // when it finds the xBot to not be busy, then it pops the next item from the queue
        // and tweets it
        // if the queue is empty, then the queue monitor turns itself off
        console.log("userId->", userId);
        console.log("text->", text);

        if (!this.isBusy) {
            console.log("this.isBusy->", this.isBusy);

            this.isBusy = true;
            let hasVisited = await this.goto("https://www.x.com");
            if (!hasVisited) return this.respond(false, "Could not visit x.com");
            console.log("tweet() visited x.com");
            // TODO: if the TWITTER_NEW_TWEET_INPUT is not found it's because Twitter
            // suspects i'm a bot and wants my email
            let foundAndClicked = await this.findAndClick(process.env.TWITTER_NEW_TWEET_INPUT);
            if (!foundAndClicked) return this.respond(false, "Could not find TWITTER_NEW_TWEET_INPUT");
            console.log("tweet() found and clicked TWITTER_NEW_TWEET_INPUT");

            let foundAndTyped = await this.findAndType(process.env.TWITTER_NEW_TWEET_INPUT, text);
            if (!foundAndTyped) return this.respond(false, "Could not find and type TWITTER_NEW_TWEET_INPUT");
            console.log("tweet() found and typed TWITTER_NEW_TWEET_INPUT");

            foundAndClicked = await this.findAndClick(process.env.TWITTER_POST_BUTTON);
            if (!foundAndClicked) return this.respond(false, "Could not find and click TWITTER_POST_BUTTON");
            console.log("tweet() found and clicked TWITTER_POST_BUTTON");

            //TODO: scan the page for "Whoops! you posted that already"

            this.isBusy = false;
            this.tweets[userId] = text;
            return this.respond(true, "xBot tweeted!");
        }
        else {
            console.log('xBot is busy, queuing task.');
            this.queue.push({ userId, text });
            if (this.queue.length == 1) {
                console.log('starting queue monitor');
                this.startQueueMonitor();
            }
            return this.respond(false, "xBot is busy");
        }
    }

    async twitterSuspects() {
        try {
            const TwitterSuspects = await this.page.waitForXPath(`//*[contains(text(), '${process.env.SUSPICION_TEXT}')]`, { timeout: 10000 })
            if (TwitterSuspects) {
                console.log("Found SUSPICION_TEXT!")
                return true;
            }
            else {
                console.log("Did NOT find SUSPICION_TEXT!")
                return false;
            }
        }
        catch (error) {
            console.log("twitterSuspects() exception! -> Did NOT find SUSPICION_TEXT!")
            return false;
        }
    }
    async twitterWantsVerification() {
        try {
            const TwitterWantsToVerify = await this.page.waitForXPath(`//*[contains(text(), '${process.env.VERIFICATION_TEXT}')]`, { timeout: 10000 })
            if (TwitterWantsToVerify) {
                console.log("Alert: found VERIFICATION_TEXT!!");
                const pageContent = await this.page.content();
                // console.log(pageContent);
                let response = {}
                response.success = true;
                response.pageContent = pageContent;
                return response;
            }
            else {
                console.log("Did NOT find VERIFICATION_TEXT!");
                let response = {}
                response.success = false;
                return response;
            }
        }
        catch (error) {
            console.log("twitterSuspects() exception! -> Did NOT find VERIFICATION_TEXT!")
            return false;
        }
    }
    // TODO: set less time for the timeout for finding elements
    // try catch each and every interaction attempt
    // detect wheter i'm being requested my email

    async logOut() {
        this.isLoggedIn = false;
        return true;
    }
    async loginToX() {
        this.isBusy = true;

        if (!this.isLoggedIn) {
            let hasVisited = await this.goto("https://www.x.com/login");
            if (!hasVisited) {
                console.log("Can't visit https://www.x.com");
                this.isBusy = false;
                return this.respond(false, "Could not visit x.com");
            }
            console.log("We're at https://www.x.com");

            let foundAndClicked = await this.findAndClick(process.env.TWITTER_USERNAME_INPUT);
            if (!foundAndClicked) {
                console.log("Can't find TWITTER_USERNAME_INPUT");
                this.isBusy = false;
                return this.respond(false, "Can't find TWITTER_USERNAME_INPUT");
            }
            console.log("Found and clicked TWITTER_USERNAME_INPUT");

            let foundAndTyped = await this.findAndType(process.env.TWITTER_USERNAME_INPUT, process.env.TWITTER_BOT_USERNAME);
            if (!foundAndTyped) {
                console.log("Can't find and type TWITTER_USERNAME_INPUT");
                this.isBusy = false;
                return this.respond(false, "Can't find and type TWITTER_USERNAME_INPUT");
            }
            console.log("Found and typed TWITTER_USERNAME_INPUT");

            foundAndClicked = await this.findAndClick(process.env.TWITTER_USERNAME_SUBMIT_BUTTON);
            if (!foundAndClicked) {
                console.log("Can't find and click TWITTER_USERNAME_SUBMIT_BUTTON");
                this.isBusy = false;
                return this.respond(false, "Can't find and click TWITTER_USERNAME_SUBMIT_BUTTON");
            }
            console.log("Found and clicked TWITTER_USERNAME_SUBMIT_BUTTON");

            foundAndClicked = await this.findAndClick(process.env.TWITTER_PASSWORD_INPUT);
            if (!foundAndClicked) {
                console.log("Can't find and click TWITTER_PASSWORD_INPUT");
                this.isBusy = false;
                return this.respond(false, "Can't find and click TWITTER_PASSWORD_INPUT");
            }
            console.log("Found and clicked TWITTER_USERNAME_INPUT");

            foundAndTyped = await this.findAndType(process.env.TWITTER_PASSWORD_INPUT, process.env.TWITTER_BOT_PASSWORD);
            if (!foundAndTyped) {
                console.log("Can't find and type TWITTER_PASSWORD_INPUT");
                this.isBusy = false;
                return this.respond(false, "Can't find and type TWITTER_PASSWORD_INPUT");
            }
            console.log("Found and typed TWITTER_PASSWORD_INPUT");

            await this.page.keyboard.press('Enter');

            console.log("Twitter Bot has logged in, we now will try to detect suspicion.");

            let confirmedSuspicion = await this.twitterSuspects();

            if (confirmedSuspicion) {
                console.log("Twitter suspects, will try to convince them.");
                let emailWasInput = await this.inputEmail();
                if (emailWasInput) {
                    console.log("We succeeded convincing twitter. We're in.");
                    this.isBusy = false;
                    return this.respond(true, "xBot is logged in, we convinced Elon!");
                }
                else {
                    console.log("We did not convince Elon :(");
                    this.isBusy = false;
                    return this.respond(false, "xBot is not logged in :(");
                }
            }
            else {
                console.log("We will now try to see if Twitter wants verification from us.")
                let confirmedVerification = await this.twitterWantsVerification();
                if (confirmedVerification.success) {
                    console.log("Twitter wants verification from us!")
                    // now we must check the code that was sent to us
                    // (or read the email automatically)
                    // and send it to the browser.
                    // The thing is i don't know how to locate that input field yet.
                    this.isBusy = false;
                    return this.respond(false, "Bot did NOT log in / Twitter wants verification code.")
                    // res.download(filePath);
                }
                else {
                    console.log("Apparently Twitter does not suspect, so we're logged in!");
                    this.isLoggedIn = true;
                    this.isBusy = false;
                    return this.respond(true, "xBot is logged in!")
                }
            }
        }
        else {
            console.log("xBot is already logged in!");
            this.isBusy = false;
            return this.respond(false, "xBot is already logged in!");
        }
    }

    async inputEmail() {
        let foundAndClicked = await this.findAndClick(process.env.TWITTER_EMAIL_INPUT);
        if (!foundAndClicked) {
            console.log("Cant't find TWITTER_EMAIL_INPUT");
            return false;
        }
        console.log("Found TWITTER_EMAIL_INPUT");

        let foundAndTyped = await this.findAndType(process.env.TWITTER_EMAIL_INPUT, process.env.TWITTER_BOT_EMAIL);
        if (!foundAndTyped) {
            console.log("Can't find and type TWITTER_EMAIL_INPUT");
            return false;
        }
        console.log("Found and typed TWITTER_EMAIL_INPUT");

        await this.page.keyboard.press('Enter');

        return true;
    }
    async inputVerificationCode(code) {
        let foundAndClicked = await this.findAndClick(process.env.TWITTER_VERIFICATION_CODE_INPUT);
        if (!foundAndClicked) {
            console.log("Cant't find TWITTER_VERIFICATION_CODE_INPUT");
            return false;
        }
        console.log("Found TWITTER_VERIFICATION_CODE_INPUT");

        let foundAndTyped = await this.findAndType(process.env.TWITTER_VERIFICATION_CODE_INPUT, code);
        if (!foundAndTyped) {
            console.log("Can't find and type TWITTER_VERIFICATION_CODE_INPUT");
            return false;
        }
        console.log("Found and typed TWITTER_VERIFICATION_CODE_INPUT");

        await this.page.keyboard.press('Enter');

        return true;
    }
    respond(success, message, data) {
        let responseObj = {};
        responseObj.success = success;
        responseObj.message = message;
        if (data) {
            responseObj.data = data;
        }
        return responseObj;
    }
    startQueueMonitor() {
        this.queueTimer = setInterval(() => this.processQueue(this), 5000);
    }
    stopQueueMonitor() {
        clearInterval(this.queueTimer);
    }
    async processQueue(xBotClassContext) {
        if (!xBotClassContext.isBusy) {
            console.log("xBotClassContext.isBusy->" + xBotClassContext.isBusy)
            console.log("xBot is not busy, so processQueue will start completing pending tasks");
            while (xBotClassContext.queue.length > 0) {
                const nextItem = xBotClassContext.queue.pop();
                console.log("nextItem->", JSON.stringify(nextItem));
                const tweetResult = await xBotClassContext.tweet(nextItem.userId, nextItem.text);
                //wait some time
            }
            xBotClassContext.stopQueueMonitor();
        }
        else return;
    }
    wait(ms) {
        return new Promise((resolve) => setTimeout(resolve, ms));
    }

    monitorForElements = async () => {
        let previousElementCount = 0;

        while (this.monitorFlag) {
            try {
                // Count the number of elements matching the selector
                const currentElementCount = await this.page.$$eval('div[data-testid="cellInnerDiv"]', elements => elements.length);

                // Check if new elements have appeared
                if (currentElementCount > previousElementCount) {
                    // Perform actions on the new elements
                    console.log(`${currentElementCount - previousElementCount} new div(s) with data-testid="cellInnerDiv" appeared in the DOM. Gonna store them.`);

                    this.storeBookmarks();

                    // Optionally, you can get references to the new elements and perform actions on them
                    // const newElements = await this.page.$$(`div[data-testid="cellInnerDiv"]:nth-child(n + ${previousElementCount + 1})`);
                    // console.log(newElements);

                    // Update the previousElementCount
                    previousElementCount = currentElementCount;
                }

                // Optionally, wait for a brief interval before checking again
                await this.wait(1000);
            } catch (error) {
                console.log('Error occurred:', error);
            }
        }
    };

    storeBookmarks = async () => {

        const bookmarkDivs = await page.$$('[data-testid="cellInnerDiv"]');

        console.log("bookmarkDivs->", bookmarkDivs);

        let processedBookmarks = bookmarkDivs.map(div => {
            const divItem = {};
            divItem.html = div.outerHTML;
            divItem.hash = this.createHash(div.outerHTML);
            return divItem;
        })
        console.log("processedBookmarks->", processedBookmarks);

        for (const newBookmark of processedBookmarks) {
            const hashExists = this.bookmarks.some(bookmark => bookmark.hash === newBookmark.hash);
            if (!hashExists) {
                this.bookmarks.push(newBookmark);
            }
        }
        return this.bookmarks;
    }
    scrapeBookmarks = async () => {

        const bookmarks = await this.storeBookmarks();

        console.log("bookmarks->", bookmarks);

        while (!(await this.isScrolledToBottom())) {
            await this.page.evaluate(() => {
                window.scrollBy(0, 100);
            });
            // Wait for a while after each scroll to give time for content loading
            await this.page.waitForTimeout(1000); // Adjust the wait time as needed

            await this.storeBookmarks();
        }

        return this.bookmarks;
    }

    isScrolledToBottom = async () => {
        const result = await this.page.evaluate(() => {
            const scrollTop = document.documentElement.scrollTop;
            const scrollHeight = document.documentElement.scrollHeight;
            const clientHeight = document.documentElement.clientHeight;
            return Math.ceil(scrollTop + clientHeight) >= scrollHeight;
        });
        console.log("isScrolledToBottom: result->", result)
        return result;
    };
    // monitorMutations = async () => {
    //     await this.page.exposeFunction('puppeteerLogMutation', () => {
    //         console.log('Mutation Detected: A child node has been added or removed.');
    //     });

    //     await this.page.evaluate(() => {
    //         const target = document.querySelector('body');
    //         const observer = new MutationObserver(mutations => {
    //             for (const mutation of mutations) {
    //                 console.log("mutation->", mutation)
    //                 if (mutation.type === 'childList') {
    //                     puppeteerLogMutation();
    //                 }
    //             }
    //         });
    //         observer.observe(target, { childList: true });
    //     });
    // }

    // monitorMutations2 = async () => {
    //     this.page.on('response', async response => {
    //         // Log the response URL and status
    //         if (response.url().endsWith("client_event.json")) {
    //             console.log(`Response received from ${response.url()} - Status: ${response.status()}`);

    //             // Optionally, log the response headers
    //             // console.log('Response Headers:', response.headers());

    //             // Get the response body as text
    //             const responseBody = await response.text();

    //             // Log the response body
    //             console.log('Response Body:', responseBody);

    //             // If you want to continue with the default behavior,
    //             // you can do so by calling response.continue()
    //             // response.continue();
    //             response.continue();
    //         }
    //     });
    // }

}
module.exports = XBot;