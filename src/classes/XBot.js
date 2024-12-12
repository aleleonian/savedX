import * as constants from "../util/constants";
import { encode } from "../util/messaging";

const puppeteer = require("puppeteer-extra");
const pluginStealth = require("puppeteer-extra-plugin-stealth");
puppeteer.use(pluginStealth());
const path = require("path");
const crypto = require("crypto");
const cheerio = require("cheerio");

// const puppeteerClassic = require("puppeteer");
// const iPhone = KnownDevices["iPhone X"];
// const KnownDevices = puppeteerClassic.KnownDevices;

const BROWSER_OPEN_FAIL = 0;
const exitCodeStrings = ["Could not open browser :(!"];

let pupConfig = {
  headless: process.env.XBOT_HEADLESS
    ? JSON.parse(process.env.XBOT_HEADLESS)
    : false,
  defaultViewport: null,
  ignoreDefaultArgs: ["--enable-automation"],
  args: ["--start-maximized", "--no-sandbox", "--disable-setuid-sandbox"],
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
    this.goAheadScrape = true;
    this.botUsername;
    this.botPassword;
    this.botEmail;
    this.downloadMedia;
  }
  getId(divHtmlContent) {
    const $ = cheerio.load(divHtmlContent);

    // Get the style attribute value of #mainDiv
    const mainDivStyle = $('[data-testid="cellInnerDiv"]').attr("style");

    const translateYRegex = /translateY\(([-\d.]+)px\)/;

    // Match the translateY value using the regex
    const match = mainDivStyle.match(translateYRegex);

    // Extract the translateY value if a match is found
    let translateYValue = null;
    if (match && match.length > 1) {
      translateYValue = match[1];
    }
    return translateYValue ? translateYValue : this.createHash(divHtmlContent);
  }
  createHash(inputString) {
    const hash = crypto.createHash("md5");
    hash.update(inputString);
    return hash.digest("hex");
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
        message: exitCodeStrings[BROWSER_OPEN_FAIL],
      };
      return responseObject;
    } else {
      this.browser = browser;
      responseObject = {
        success: true,
      };
      this.page = await browser.newPage();
      this.page.setDefaultTimeout(10000);
      return responseObject;
    }
  }
  async goto(urlToVisit) {
    try {
      await this.page.goto(urlToVisit, {
        waitUntil: "load",
      });
      return true;
    } catch (error) {
      console.log("goto: Error! ", error);
      return false;
    }
  }
  async takePic(filePath) {
    if (!filePath) {
      filePath = path.resolve(__dirname, "../public/images/xBotSnap.jpg");
    }
    try {
      await this.page.screenshot({ path: filePath });
      return true;
    } catch (error) {
      console.log("takePic() error->", error);
      return false;
    }
  }
  async findAndType(targetElement, text) {
    try {
      let inputElement = await this.page.waitForSelector(targetElement);

      await inputElement.type(text);

      return true;
    } catch (error) {
      console.log("findAndType: Error! ", error);
      return false;
    }
  }
  async findAndClick(targetElement) {
    try {
      let inputElement = await this.page.waitForSelector(targetElement);

      await inputElement.click();

      return true;
    } catch (error) {
      console.log("findAndClick: Error! ", error);
      return false;
    }
  }
  async findElement(targetElement, timeoutMs = 30000) {
    try {
      await this.page.waitForSelector(targetElement, { timeout: timeoutMs });

      return true;
    } catch (error) {
      console.log("findElement: Error! ", error);
      return false;
    }
  }
  async findAndGetText(targetElement) {
    try {
      await this.page.waitForSelector(targetElement);

      const text = await this.page.$eval(targetElement, (el) => el.innerText);

      let responseObject = {};
      responseObject.success = true;
      responseObject.text = text;

      return responseObject;
    } catch (error) {
      console.log("findAndGetText: Error! ", error);
      return false;
    }
  }
  getCurrentBotUrl() {
    return this.page.url();
  }

  async findTextInPage(targetText) {
    const found = await this.page.evaluate((targetText) => {
      return document.body.innerText
        .toLowerCase()
        .includes(targetText.toLowerCase());
    }, targetText);
    console.log(targetText + " was found: " + found);
    return found;
  }
  async findTextInFrame(iFrame, targetText) {
    const found = await iFrame.evaluate(() => {
      return document.body.innerText.includes("your desired text");
    }, targetText);

    console.log(targetText + " was found: " + found);

    return found;
  }
  async getLastTweetUrl() {
    let hasVisited = await this.goto(
      "https://www.x.com" + "/" + this.botUsername
    );
    if (!hasVisited) return false;

    let foundAndClicked = await this.findAndClick(
      process.env.TWITTER_LAST_POST_IN_PROFILE
    );
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
      let foundAndClicked = await this.findAndClick(
        process.env.TWITTER_NEW_TWEET_INPUT
      );
      if (!foundAndClicked)
        return this.respond(false, "Could not find TWITTER_NEW_TWEET_INPUT");
      console.log("tweet() found and clicked TWITTER_NEW_TWEET_INPUT");

      let foundAndTyped = await this.findAndType(
        process.env.TWITTER_NEW_TWEET_INPUT,
        text
      );
      if (!foundAndTyped)
        return this.respond(
          false,
          "Could not find and type TWITTER_NEW_TWEET_INPUT"
        );
      console.log("tweet() found and typed TWITTER_NEW_TWEET_INPUT");

      foundAndClicked = await this.findAndClick(
        process.env.TWITTER_POST_BUTTON
      );
      if (!foundAndClicked)
        return this.respond(
          false,
          "Could not find and click TWITTER_POST_BUTTON"
        );
      console.log("tweet() found and clicked TWITTER_POST_BUTTON");

      //TODO: scan the page for "Whoops! you posted that already"

      this.isBusy = false;
      this.tweets[userId] = text;
      return this.respond(true, "xBot tweeted!");
    } else {
      console.log("xBot is busy, queuing task.");
      this.queue.push({ userId, text });
      if (this.queue.length == 1) {
        console.log("starting queue monitor");
        this.startQueueMonitor();
      }
      return this.respond(false, "xBot is busy");
    }
  }
  async twitterSuspects() {
    try {
      const TwitterSuspects = await this.page.waitForSelector(
        `//*[contains(text(), '${process.env.SUSPICION_TEXT}')]`,
        { timeout: 10000 }
      );
      if (TwitterSuspects) {
        console.log("Found SUSPICION_TEXT!");
        return true;
      } else {
        console.log("Did NOT find SUSPICION_TEXT!");
        return false;
      }
    } catch (error) {
      console.log(
        "twitterSuspects() exception! -> Did NOT find SUSPICION_TEXT! : ",
        error
      );
      return false;
    }
  }
  async twitterRequiresCaptcha() {
    try {
      const TwitterSuspects = await this.page.waitForSelector(
        `//*[contains(text(), '${process.env.TWITTER_AUTHENTICATE_TEXT}')]`,
        { timeout: 5000 }
      );

      if (TwitterSuspects) {
        console.log("Found TWITTER_AUTHENTICATE_TEXT!");
        return true;
      } else {
        console.log("Did NOT find TWITTER_AUTHENTICATE_TEXT!");
        return false;
      }
    } catch (error) {
      console.log(
        "twitterRequiresCaptcha() exception! -> Did NOT find TWITTER_AUTHENTICATE_TEXT! ",
        error
      );
      return false;
    }
  }
  async unusualLoginDetected() {
    try {
      return await this.findTextInPage(process.env.TWITTER_UNUSUAL_LOGIN_TEXT);
    } catch (error) {
      console.log(
        "unusualLoginDetected() exception! -> Did NOT find TWITTER_UNUSUAL_LOGIN_TEXT!"
      );
      console.log(error);
      return false;
    }
  }
  async arkoseChallengeDetected() {
    const arkoseFrame = await this.page.$("#arkoseFrame");

    if (arkoseFrame) {
      console.log("arkoseFrame exists! we need you to do stuff");
      return true;
      // return await this.findTextInFrame(arkoseFrame, process.env.TWITTER_AUTHENTICATE_TEXT);
    } else {
      console.log("Bro the arkoseFrame div DOES NOT exists bro!");
    }
  }
  async twitterWantsVerification() {
    try {
      const TwitterWantsToVerify = await this.page.waitForSelector(
        `//*[contains(text(), '${process.env.VERIFICATION_TEXT}')]`,
        { timeout: 3000 }
      );
      if (TwitterWantsToVerify) {
        console.log("Alert: found VERIFICATION_TEXT!!");
        const pageContent = await this.page.content();
        let response = {};
        response.success = true;
        response.pageContent = pageContent;
        return response;
      } else {
        console.log("Did NOT find VERIFICATION_TEXT!");
        let response = {};
        response.success = false;
        return response;
      }
    } catch (error) {
      console.log(
        "twitterSuspects() exception! -> Did NOT find VERIFICATION_TEXT!",
        error
      );
      return false;
    }
  }
  async closeBrowser() {
    return await this.browser.close();
  }
  async lookForWrongLoginInfoDialog(textToLookFor) {
    try {
      const timeout = 5000;
      const pollInterval = 200;

      const dialogAppeared = await new Promise((resolve) => {
        const startTime = Date.now();
        const interval = setInterval(async () => {
          const findTextInPageResult = await this.findTextInPage(textToLookFor);

          if (findTextInPageResult) {
            clearInterval(interval);
            resolve(true);
          }

          if (Date.now() - startTime > timeout) {
            clearInterval(interval);
            resolve(false);
          }
        }, pollInterval);
      });

      if (dialogAppeared) {
        console.log("Error dialog detected.");
        return true;
      } else {
        console.log("Error dialog did not appear within the timeout.");
        return false;
      }
    } catch (error) {
      console.error("An error occurred:", error);
      return false;
    }
  }
  async logOut() {
    await this.goto("https://x.com/logout");
    let foundAndClicked = await this.findAndClick(
      process.env.TWITTER_LOGOUT_BUTTON
    );
    if (!foundAndClicked) {
      console.log("Cant't find TWITTER_LOGOUT_BUTTON");
      return false;
    }
    console.log("Found TWITTER_LOGOUT_BUTTON");
    this.isLoggedIn = false;
    return true;
  }
  async loginToX(botUsername, botPassword, botEmail) {
    this.isBusy = true;

    if (!this.isLoggedIn) {
      let hasVisited = await this.goto("https://www.x.com/login");
      if (!hasVisited) {
        console.log("Can't visit https://www.x.com");
        this.isBusy = false;
        return this.respond(false, "Could not visit x.com");
      }
      console.log("We're at https://www.x.com");

      let foundAndClicked = await this.findAndClick(
        process.env.TWITTER_USERNAME_INPUT
      );
      if (!foundAndClicked) {
        console.log("Can't find TWITTER_USERNAME_INPUT");
        this.isBusy = false;
        return this.respond(false, "Can't find TWITTER_USERNAME_INPUT");
      }
      console.log("Found and clicked TWITTER_USERNAME_INPUT");

      let foundAndTyped = await this.findAndType(
        process.env.TWITTER_USERNAME_INPUT,
        botUsername
      );
      if (!foundAndTyped) {
        console.log("Can't find and type TWITTER_USERNAME_INPUT");
        this.isBusy = false;
        return this.respond(
          false,
          "Can't find and type TWITTER_USERNAME_INPUT"
        );
      }
      console.log("Found and typed TWITTER_USERNAME_INPUT");

      foundAndClicked = await this.findAndClick(
        process.env.TWITTER_USERNAME_SUBMIT_BUTTON
      );
      if (!foundAndClicked) {
        console.log("Can't find and click TWITTER_USERNAME_SUBMIT_BUTTON");
        this.isBusy = false;
        return this.respond(
          false,
          "Can't find and click TWITTER_USERNAME_SUBMIT_BUTTON"
        );
      }
      console.log("Found and clicked TWITTER_USERNAME_SUBMIT_BUTTON");

      if (
        await this.lookForWrongLoginInfoDialog("we could not find your account")
      ) {
        return this.respond(false, "Bro, your username is fucked up.");
      }

      foundAndClicked = await this.findAndClick(
        process.env.TWITTER_PASSWORD_INPUT
      );

      if (!foundAndClicked) {
        console.log("Can't find and click TWITTER_PASSWORD_INPUT");
        // let's look for this text We need to make sure that you’re a real person.
        // await this.wait(300000)
        if (await this.twitterRequiresCaptcha()) {
          console.log("Bro, you need to solve the puzzle!");
        } else if (await this.unusualLoginDetected()) {
          console.log(
            "Bro, X detected an unusual login attempt! Will try to calm the bitch down."
          );
          // await this.wait(15000);
          try {
            await this.findAndType(
              process.env.TWITTER_UNUSUAL_LOGIN_EMAIL_INPUT,
              botEmail
            );
            //TODO what if findAndTypeResult is false?
            await this.findAndClick(
              process.env.TWITTER_UNUSUAL_LOGIN_SUBMIT_BUTTON
            );
            //TODO this is not being found despite apparently having to be the case
            //when my login data is bullshit
            //TODO implement a web server to live debug wtf is going on the
            //remote chrome
            if (await this.lookForWrongLoginInfoDialog("please try again")) {
              return this.respond(false, "Bro, your password is messed up.");
            }
          } catch (error) {
            console.log(error);
            this.isBusy = false;
            return this.respond(
              false,
              "Could not go past unusual login attempt!"
            );
          }

          // click TWITTER_UNUSUAL_LOGIN_SUBMIT_BUTTON
        } else if (await this.arkoseChallengeDetected()) {
          //TODO: instead of waiting 20 seconds, i should make a button appear on the main
          //screen that reads 'continue' and you solve the captcha and then click it and then
          //scraping resumes.

          // a button should show up in the main screen

          // this function should enter an indefinite loop that only breaks
          // when some external condition changes
          // that external condition would be changed by the clicking of that button

          console.log(
            "Bro we need you to do something about this situation, will give you 20 seconds."
          );
          await this.wait(20000);
        } else {
          console.log("Bro, we're defeated by Twitter. Dang it.");
          this.isBusy = false;
          return this.respond(
            false,
            "Can't find and click TWITTER_PASSWORD_INPUT"
          );
        }
      } else console.log("Found and clicked TWITTER_PASSWORD_INPUT");

      foundAndTyped = await this.findAndType(
        process.env.TWITTER_PASSWORD_INPUT,
        botPassword
      );
      if (!foundAndTyped) {
        console.log("Can't find and type TWITTER_PASSWORD_INPUT");
        this.isBusy = false;
        return this.respond(
          false,
          "Can't find and type TWITTER_PASSWORD_INPUT"
        );
      }
      console.log("Found and typed TWITTER_PASSWORD_INPUT");
      await this.page.keyboard.press("Enter");
      await this.wait(3000);

      if (await this.lookForWrongLoginInfoDialog("wrong password")) {
        return this.respond(false, "Bro, your password is messed up.");
      }

      // const wrongPassword = await this.findTextInPage("wrong password");
      // console.log("wrongPassword->", wrongPassword);
      // if (wrongPassword) {
      //     return this.respond(false, "Your password is bad.");
      // }

      const blockedAttempt = await this.findTextInPage(
        "We blocked an attempt to access your account because"
      );
      if (blockedAttempt) {
        return this.respond(
          false,
          "We're temporarily blocked for some reason."
        );
      }

      //TODO gotta check for In order to protect your account from suspicious activity

      this.isLoggedIn = true;
      this.isBusy = false;
      return this.respond(true, "xBot is logged in!");

      // TODO: i think this is outdated

      //HERE I GOTTA MAKE SURE I PROPERLY LOGGED IN
      // check for Suspicious login prevented
      // const found = await this.findElement(process.env.TWITTER_PASSWORD_INPUT, 5000);
      // if (found) {
      //     console.log("Found TWITTER_PASSWORD_INPUT when i should not, wrong login data assumed.");
      //     this.isBusy = false;
      //     return this.respond(false, "Wrong login information.");
      // }

      //HERE I GOTTA MAKE SURE Twitter is not suspicious and temporarily blocked me

      // console.log("Twitter Bot has logged in, we now will try to detect suspicion.");

      // let confirmedSuspicion = await this.twitterSuspects();

      // if (confirmedSuspicion) {
      //     console.log("Twitter suspects, will try to convince them.");
      //     let emailWasInput = await this.inputEmail();
      //     if (emailWasInput) {
      //         console.log("We succeeded convincing twitter. We're in.");
      //         this.isBusy = false;
      //         return this.respond(true, "xBot is logged in, we convinced Elon!");
      //     }
      //     else {
      //         console.log("We did not convince Elon :(");
      //         this.isBusy = false;
      //         return this.respond(false, "xBot is not logged in :(");
      //     }
      // }
      // else {
      //     console.log("We will now try to see if Twitter wants verification from us.")
      //     let confirmedVerification = await this.twitterWantsVerification();
      //     if (confirmedVerification.success) {
      //         console.log("Twitter wants verification from us!")
      //         // now we must check the code that was sent to us
      //         // (or read the email automatically)
      //         // and send it to the browser.
      //         // The thing is i don't know how to locate that input field yet.
      //         this.isBusy = false;
      //         return this.respond(false, "Bot did NOT log in / Twitter wants verification code.")
      //         // res.download(filePath);
      //     }
      //     else {
      //         console.log("Apparently Twitter does not suspect, so we're logged in!");
      //         this.isLoggedIn = true;
      //         this.isBusy = false;
      //         return this.respond(true, "xBot is logged in!")
      //     }
      // }
    } else {
      console.log("xBot is already logged in!");
      this.isBusy = false;
      return this.respond(false, "xBot is already logged in!");
    }
  }
  async inputEmail() {
    let foundAndClicked = await this.findAndClick(
      process.env.TWITTER_EMAIL_INPUT
    );
    if (!foundAndClicked) {
      console.log("Cant't find TWITTER_EMAIL_INPUT");
      return false;
    }
    console.log("Found TWITTER_EMAIL_INPUT");

    let foundAndTyped = await this.findAndType(
      process.env.TWITTER_EMAIL_INPUT,
      this.botEmail
    );
    if (!foundAndTyped) {
      console.log("Can't find and type TWITTER_EMAIL_INPUT");
      return false;
    }
    console.log("Found and typed TWITTER_EMAIL_INPUT");

    await this.page.keyboard.press("Enter");

    return true;
  }
  async inputVerificationCode(code) {
    let foundAndClicked = await this.findAndClick(
      process.env.TWITTER_VERIFICATION_CODE_INPUT
    );
    if (!foundAndClicked) {
      console.log("Cant't find TWITTER_VERIFICATION_CODE_INPUT");
      return false;
    }
    console.log("Found TWITTER_VERIFICATION_CODE_INPUT");

    let foundAndTyped = await this.findAndType(
      process.env.TWITTER_VERIFICATION_CODE_INPUT,
      code
    );
    if (!foundAndTyped) {
      console.log("Can't find and type TWITTER_VERIFICATION_CODE_INPUT");
      return false;
    }
    console.log("Found and typed TWITTER_VERIFICATION_CODE_INPUT");

    await this.page.keyboard.press("Enter");

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
      console.log("xBotClassContext.isBusy->" + xBotClassContext.isBusy);
      console.log(
        "xBot is not busy, so processQueue will start completing pending tasks"
      );
      while (xBotClassContext.queue.length > 0) {
        const nextItem = xBotClassContext.queue.pop();
        console.log("nextItem->", JSON.stringify(nextItem));
        await xBotClassContext.tweet(nextItem.userId, nextItem.text);
        //wait some time
      }
      xBotClassContext.stopQueueMonitor();
    } else return;
  }
  wait(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
  //VOY POR ACA: la idea es no guardar los bookmarks cuyo url ya existe en el array de tweets guardados en el contexto de la app
  // para eso habría que  sendMessageToMainWindow("CHECK_SAVED_TWEET_EXISTS", tweetUrl
  // tweetArray.map(async (tweet) => {
  //   const $ = cheerio.load(tweet.htmlContent);
  //   const userNameData = $('[data-testid="User-Name"]').text().split("@");
  //   tweet.userName = userNameData[0];
  //   tweet.twitterHandle = "@" + userNameData[1].split("·")[0];
  //   tweet.tweetDate = userNameData[1].split("·")[1];
  //   tweet.tweetText = $('div[data-testid="tweetText"] > span').text();
  //   tweet.tweetUrl = $('[data-testid="User-Name"] a').eq(2).attr("href");
  //   tweet.profilePicUrl = $("img").first().attr("src");
  // }),

  storeBookmarks = async () => {
    const bookmarkDivs = await this.page.$$('[data-testid="cellInnerDiv"]');

    const htmlContentDivs = [];

    for (const divHandle of bookmarkDivs) {
      // Get the HTML content of the div
      const htmlContent = await divHandle.evaluate((div) => div.outerHTML);
      htmlContentDivs.push(htmlContent);
    }

    let processedBookmarks = htmlContentDivs
      .map((div) => {
        // if div is the last bookmark, do not include it
        const $ = cheerio.load(div);
        const divWithTestId = $('div[data-testid="cellInnerDiv"]');
        const isLastBookmark =
          divWithTestId.children(".css-175oi2r.r-4d76ec").length > 0;
        if (isLastBookmark) {
          // console.log("tweet index: ", index);
          return null;
        }

        const divItem = {};
        divItem.htmlContent = div;
        divItem.indexId = this.getId(div);
        return divItem;
      })
      .filter((item) => item !== null);

    for (const newBookmark of processedBookmarks) {
      const idExists = this.bookmarks.some(
        (bookmark) => bookmark.indexId === newBookmark.indexId
      );
      if (!idExists) {
        this.bookmarks.push(newBookmark);
      }
    }
    return this.bookmarks;
  };
  scrapeBookmarks = async (showProgressFunction) => {
    await this.storeBookmarks();

    let scrollPosition = 0;

    while (this.goAheadScrape) {
      console.log("Gonna scroll...");
      await this.page.evaluate(() => {
        window.scrollBy(0, window.innerHeight);
      });
      showProgressFunction(
        encode(
          constants.progress.INIT_PROGRESS,
          constants.progress.LOGGED_IN,
          constants.progress.SCRAPING
        )
      );

      // Wait for a while after each scroll to give time for content loading
      await this.wait(3000);

      await this.storeBookmarks();

      console.log("bookmarks stored.");

      // Get the scroll position
      const newScrollPosition = await this.page.evaluate(() => {
        return window.scrollY;
      });

      if (newScrollPosition > scrollPosition) {
        console.log("looping again.");
        scrollPosition = newScrollPosition;
      } else if (newScrollPosition <= scrollPosition) {
        console.log("End of page reached. Aborting.");
        break;
      }
    }

    return this.bookmarks;
  };

  isScrolledToBottom = async () => {
    const result = await this.page.evaluate(() => {
      const scrollTop = document.documentElement.scrollTop;
      const scrollHeight = document.documentElement.scrollHeight;
      const clientHeight = document.documentElement.clientHeight;
      return Math.ceil(scrollTop + clientHeight) >= scrollHeight;
    });
    return result;
  };
}
module.exports = XBot;
