const puppeteer = require('puppeteer');

const BROWSER_OPEN_FAIL = 0;
const exitCodeStrings = [
    "Could not open browser :(!"
]

let isBusy = false;
let isLoggedIn = false;

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

const goto = async (page, urlToVisit) => {
    try {
        await page.goto(urlToVisit, {
            waitUntil: "load",
        });
        return true;
    }
    catch (error) {
        console.log("Error! ", error);
        return false;
    }
}

export const init = async () => {

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
            browser
        }
        // let page = await browser.newPage();
        // this.page.setDefaultTimeout(10000);

        // browser.close();
        return responseObject;
    }
}

export const loginToX = async (username, password) => {
    isBusy = true;

    if (!isLoggedIn) {
        let hasVisited = await goto(page, "https://www.x.com/login");
        if (!hasVisited) {
            console.log("Can't visit https://www.x.com");
            isBusy = false;
            return respond(false, "Could not visit x.com");
        }
        console.log("We're at https://www.x.com");

        let foundAndClicked = await findAndClick(page, process.env.TWEETER_USERNAME_INPUT);
        if (!foundAndClicked) {
            console.log("Can't find TWEETER_USERNAME_INPUT");
            isBusy = false;
            return respond(false, "Can't find TWEETER_USERNAME_INPUT");
        }
        console.log("Found and clicked TWEETER_USERNAME_INPUT");

        let foundAndTyped = await findAndType(page, process.env.TWEETER_USERNAME_INPUT, process.env.TWEETER_BOT_USERNAME);
        if (!foundAndTyped) {
            console.log("Can't find and type TWEETER_USERNAME_INPUT");
            isBusy = false;
            return respond(false, "Can't find and type TWEETER_USERNAME_INPUT");
        }
        console.log("Found and typed TWEETER_USERNAME_INPUT");

        foundAndClicked = await findAndClick(page, process.env.TWEETER_USERNAME_SUBMIT_BUTTON);
        if (!foundAndClicked) {
            console.log("Can't find and click TWEETER_USERNAME_SUBMIT_BUTTON");
            isBusy = false;
            return respond(false, "Can't find and click TWEETER_USERNAME_SUBMIT_BUTTON");
        }
        console.log("Found and clicked TWEETER_USERNAME_SUBMIT_BUTTON");

        foundAndClicked = await findAndClick(page, process.env.TWEETER_PASSWORD_INPUT);
        if (!foundAndClicked) {
            console.log("Can't find and click TWEETER_PASSWORD_INPUT");
            isBusy = false;
            return respond(false, "Can't find and click TWEETER_PASSWORD_INPUT");
        }
        console.log("Found and clicked TWEETER_USERNAME_INPUT");

        foundAndTyped = await findAndType(page, process.env.TWEETER_PASSWORD_INPUT, process.env.TWEETER_BOT_PASSWORD);
        if (!foundAndTyped) {
            console.log("Can't find and type TWEETER_PASSWORD_INPUT");
            isBusy = false;
            return respond(false, "Can't find and type TWEETER_PASSWORD_INPUT");
        }
        console.log("Found and typed TWEETER_PASSWORD_INPUT");

        await page.keyboard.press('Enter');

        console.log("Twitter Bot has logged in, we now will try to detect suspicion.");

        let confirmedSuspicion = await twitterSuspects();

        if (confirmedSuspicion) {
            console.log("Twitter suspects, will try to convince them.");
            let emailWasInput = await inputEmail();
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

const respond = (success, message, data) => {
    let responseObj = {};
    responseObj.success = success;
    responseObj.message = message;
    if (data) {
        responseObj.data = data;
    }
    return responseObj;
}

const takePic = async (page, filePath) => {
    if (!filePath) {
        filePath = path.resolve(__dirname, "../public/images/xBotSnap.jpg")
    }
    try {
        await page.screenshot({ path: filePath });
        return true;
    }
    catch (error) {
        console.log("takePic() error->", error);
        return false;
    }
}

const findAndType = async (page, targetElement, text) => {
    try {
        let inputElement = await page.waitForSelector(targetElement);

        await inputElement.type(text);

        return true;

    }
    catch (error) {
        console.log("Error! ", error);
        return false;
    }
}
const findAndClick = async (page, targetElement) => {
    try {
        let inputElement = await page.waitForSelector(targetElement);

        await inputElement.click();

        return true;

    }
    catch (error) {
        console.log("Error! ", error);
        return false;
    }
}
const findAndGetText = async (page, targetElement) => {
    try {
        let inputElement = await page.waitForSelector(targetElement);

        const text = await page.$eval(targetElement, el => el.innerText);

        let responseObject = {}
        responseObject.success = true;
        responseObject.text = text;

        return responseObject;

    }
    catch (error) {
        console.log("Error! ", error);
        return false;
    }
}
const twitterSuspects = async (page) => {
    try {
        const TwitterSuspects = await page.waitForXPath(`//*[contains(text(), '${process.env.SUSPICION_TEXT}')]`, { timeout: 10000 })
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
const twitterWantsVerification = async (page) => {
    try {
        const TwitterWantsToVerify = await page.waitForXPath(`//*[contains(text(), '${process.env.VERIFICATION_TEXT}')]`, { timeout: 10000 })
        if (TwitterWantsToVerify) {
            console.log("Alert: found VERIFICATION_TEXT!!");
            const pageContent = await page.content();
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