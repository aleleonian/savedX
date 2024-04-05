const puppeteer = require('puppeteer');

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

export const goFetch = async (username, password) => {

    console.log("username, password:", username, password);
    
    let browser = await puppeteer.launch(pupConfig);
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
        responseObject = {
            success: true,
        }
        let page = await browser.newPage();
        // this.page.setDefaultTimeout(10000);

        await page.goto("https://www.google.com", {
            waitUntil: "load",
        });

        browser.close();
        return responseObject;
    }
}