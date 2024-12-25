import * as constants from "../util/constants";
import { encode } from "../util/messaging";
import { waitForNewReport } from "../util/event-emitter";
import { sendMessageToMainWindow } from "../util/messaging";
import * as common from "../util/common";

const { exec } = require("child_process");
const puppeteer = require("puppeteer-extra");
const pluginStealth = require("puppeteer-extra-plugin-stealth");
puppeteer.use(pluginStealth());
const path = require("path");
const cheerio = require("cheerio");

const fs = require("fs");
const https = require("https");

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

  async fetchAndSaveImage(imageUrl, saveDir, saveFileName) {
    return new Promise((resolve) => {
      try {
        // Ensure the save directory exists
        if (!fs.existsSync(saveDir)) {
          fs.mkdirSync(saveDir, { recursive: true });
        }

        // Path to save the image
        const savePath = path.join(saveDir, saveFileName);

        // Download and save the image
        const file = fs.createWriteStream(savePath);
        https
          .get(imageUrl, (response) => {
            if (response.statusCode === 200) {
              response.pipe(file);
              file.on("finish", () => {
                file.close();
                common.debugLog(
                  process.env.DEBUG,
                  `Image saved to ${savePath}`
                );
                resolve(common.createSuccessResponse());
              });
            } else {
              const errorMessage = `Failed to fetch image. Status code: ${response.statusCode}`;
              common.debugLog(errorMessage);
              resolve(common.createErrorResponse(errorMessage));
            }
          })
          .on("error", (err) => {
            const errorMessage = `Error fetching the image: ${err.message}`;
            common.errorLog(errorMessage);
            resolve(common.createErrorResponse(errorMessage));
          });
      } catch (error) {
        const errorMessage = `Error fetching the image: ${error.message}`;
        common.errorLog(errorMessage);
        resolve(common.createErrorResponse(errorMessage));
      }
    });
  }

  async fetchAndSaveVideo(videoPageurl, saveDir, saveFileName) {
    return new Promise((resolve) => {
      try {
        // Ensure the save directory exists
        if (!fs.existsSync(saveDir)) {
          fs.mkdirSync(saveDir, { recursive: true });
        }

        const command = `${process.env.YTDLP_INSTALLATION} -o "${saveDir}/${saveFileName}" ${videoPageurl}`;

        exec(command, (error, stdout, stderr) => {
          if (error) {
            common.errorLog(`Error executing yt-dlp: ${error.message}`);
            resolve(common.createErrorResponse(error.message));
            return;
          }
          if (stderr) {
            common.errorLog(`stderr: ${stderr}`);
            resolve(common.createErrorResponse(stderr));
            return;
          }
          common.debugLog(`stdout: ${stdout}`);
          resolve(common.createSuccessResponse(stdout));
        });
      } catch (error) {
        common.errorLog(`fetchAndSaveVideo: Error occurred: ${error.message}`);
        resolve(common.createErrorResponse(error.message));
      }
    });
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
    return translateYValue
      ? translateYValue
      : common.createHash(divHtmlContent);
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
      common.debugLog("goto: Error! ", error);
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
      common.debugLog("takePic() error->", error);
      return false;
    }
  }
  async findAndType(targetElement, text) {
    try {
      let inputElement = await this.page.waitForSelector(targetElement);

      await inputElement.type(text);

      return true;
    } catch (error) {
      common.debugLog("findAndType: Error! ", error);
      return false;
    }
  }
  async findAndClick(targetElement) {
    try {
      let inputElement = await this.page.waitForSelector(targetElement);

      await inputElement.click();

      return true;
    } catch (error) {
      common.debugLog("findAndClick: Error! ", error);
      return false;
    }
  }
  async findElement(targetElement, timeoutMs = 30000) {
    try {
      await this.page.waitForSelector(targetElement, { timeout: timeoutMs });

      return true;
    } catch (error) {
      common.debugLog("findElement: Error! ", error);
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
      common.debugLog("findAndGetText: Error! ", error);
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
    common.debugLog(targetText + " was found: " + found);
    return found;
  }
  async findTextInFrame(iFrame, targetText) {
    const found = await iFrame.evaluate(() => {
      return document.body.innerText.includes("your desired text");
    }, targetText);

    common.debugLog(targetText + " was found: " + found);

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
    common.debugLog("userId->", userId);
    common.debugLog("text->", text);

    if (!this.isBusy) {
      common.debugLog("this.isBusy->", this.isBusy);

      this.isBusy = true;
      let hasVisited = await this.goto("https://www.x.com");
      if (!hasVisited) return this.respond(false, "Could not visit x.com");
      common.debugLog("tweet() visited x.com");
      // TODO: if the TWITTER_NEW_TWEET_INPUT is not found it's because Twitter
      // suspects i'm a bot and wants my email
      let foundAndClicked = await this.findAndClick(
        process.env.TWITTER_NEW_TWEET_INPUT
      );
      if (!foundAndClicked)
        return this.respond(false, "Could not find TWITTER_NEW_TWEET_INPUT");
      common.debugLog(
        process.env.DEBUG,
        "tweet() found and clicked TWITTER_NEW_TWEET_INPUT"
      );

      let foundAndTyped = await this.findAndType(
        process.env.TWITTER_NEW_TWEET_INPUT,
        text
      );
      if (!foundAndTyped)
        return this.respond(
          false,
          "Could not find and type TWITTER_NEW_TWEET_INPUT"
        );
      common.debugLog(
        process.env.DEBUG,
        "tweet() found and typed TWITTER_NEW_TWEET_INPUT"
      );

      foundAndClicked = await this.findAndClick(
        process.env.TWITTER_POST_BUTTON
      );
      if (!foundAndClicked)
        return this.respond(
          false,
          "Could not find and click TWITTER_POST_BUTTON"
        );
      common.debugLog(
        process.env.DEBUG,
        "tweet() found and clicked TWITTER_POST_BUTTON"
      );

      //TODO: scan the page for "Whoops! you posted that already"

      this.isBusy = false;
      this.tweets[userId] = text;
      return this.respond(true, "xBot tweeted!");
    } else {
      common.debugLog("xBot is busy, queuing task.");
      this.queue.push({ userId, text });
      if (this.queue.length == 1) {
        common.debugLog("starting queue monitor");
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
        common.debugLog("Found SUSPICION_TEXT!");
        return true;
      } else {
        common.debugLog("Did NOT find SUSPICION_TEXT!");
        return false;
      }
    } catch (error) {
      common.debugLog(
        process.env.DEBUG,
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
        common.debugLog("Found TWITTER_AUTHENTICATE_TEXT!");
        return true;
      } else {
        common.debugLog(
          process.env.DEBUG,
          "Did NOT find TWITTER_AUTHENTICATE_TEXT!"
        );
        return false;
      }
    } catch (error) {
      common.debugLog(
        process.env.DEBUG,
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
      common.debugLog(
        process.env.DEBUG,
        "unusualLoginDetected() exception! -> Did NOT find TWITTER_UNUSUAL_LOGIN_TEXT!"
      );
      common.debugLog(error);
      return false;
    }
  }
  async arkoseChallengeDetected() {
    const arkoseFrame = await this.page.$("#arkoseFrame");

    if (arkoseFrame) {
      common.debugLog(
        process.env.DEBUG,
        "arkoseFrame exists! we need you to do stuff"
      );
      return true;
      // return await this.findTextInFrame(arkoseFrame, process.env.TWITTER_AUTHENTICATE_TEXT);
    } else {
      common.debugLog(
        process.env.DEBUG,
        "Bro the arkoseFrame div DOES NOT exists bro!"
      );
    }
  }
  async twitterWantsVerification() {
    try {
      const TwitterWantsToVerify = await this.page.waitForSelector(
        `//*[contains(text(), '${process.env.VERIFICATION_TEXT}')]`,
        { timeout: 3000 }
      );
      if (TwitterWantsToVerify) {
        common.debugLog("Alert: found VERIFICATION_TEXT!!");
        const pageContent = await this.page.content();
        let response = {};
        response.success = true;
        response.pageContent = pageContent;
        return response;
      } else {
        common.debugLog("Did NOT find VERIFICATION_TEXT!");
        let response = {};
        response.success = false;
        return response;
      }
    } catch (error) {
      common.debugLog(
        process.env.DEBUG,
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
        common.debugLog("Error dialog detected.");
        return true;
      } else {
        common.debugLog(
          process.env.DEBUG,
          "Error dialog did not appear within the timeout."
        );
        return false;
      }
    } catch (error) {
      common.errorLog("An error occurred:", error);
      return false;
    }
  }
  async logOut() {
    await this.goto("https://x.com/logout");
    let foundAndClicked = await this.findAndClick(
      process.env.TWITTER_LOGOUT_BUTTON
    );
    if (!foundAndClicked) {
      common.debugLog("Cant't find TWITTER_LOGOUT_BUTTON");
      return false;
    }
    common.debugLog("Found TWITTER_LOGOUT_BUTTON");
    this.isLoggedIn = false;
    return true;
  }
  async loginToX(botUsername, botPassword, botEmail) {
    this.isBusy = true;

    if (!this.isLoggedIn) {
      let hasVisited = await this.goto("https://www.x.com/login");
      if (!hasVisited) {
        common.debugLog("Can't visit https://www.x.com");
        this.isBusy = false;
        return this.respond(false, "Could not visit x.com");
      }
      common.debugLog("We're at https://www.x.com");

      let foundAndClicked = await this.findAndClick(
        process.env.TWITTER_USERNAME_INPUT
      );
      if (!foundAndClicked) {
        common.debugLog("Can't find TWITTER_USERNAME_INPUT");
        this.isBusy = false;
        return this.respond(false, "Can't find TWITTER_USERNAME_INPUT");
      }
      common.debugLog(
        process.env.DEBUG,
        "Found and clicked TWITTER_USERNAME_INPUT"
      );

      let foundAndTyped = await this.findAndType(
        process.env.TWITTER_USERNAME_INPUT,
        botUsername
      );
      if (!foundAndTyped) {
        common.debugLog(
          process.env.DEBUG,
          "Can't find and type TWITTER_USERNAME_INPUT"
        );
        this.isBusy = false;
        return this.respond(
          false,
          "Can't find and type TWITTER_USERNAME_INPUT"
        );
      }
      common.debugLog(
        process.env.DEBUG,
        "Found and typed TWITTER_USERNAME_INPUT"
      );

      foundAndClicked = await this.findAndClick(
        process.env.TWITTER_USERNAME_SUBMIT_BUTTON
      );
      if (!foundAndClicked) {
        common.debugLog(
          process.env.DEBUG,
          "Can't find and click TWITTER_USERNAME_SUBMIT_BUTTON"
        );
        this.isBusy = false;
        return this.respond(
          false,
          "Can't find and click TWITTER_USERNAME_SUBMIT_BUTTON"
        );
      }
      common.debugLog(
        process.env.DEBUG,
        "Found and clicked TWITTER_USERNAME_SUBMIT_BUTTON"
      );

      if (
        await this.lookForWrongLoginInfoDialog("we could not find your account")
      ) {
        return this.respond(false, "Bro, your username is fucked up.");
      }

      foundAndClicked = await this.findAndClick(
        process.env.TWITTER_PASSWORD_INPUT
      );

      if (!foundAndClicked) {
        common.debugLog(
          process.env.DEBUG,
          "Can't find and click TWITTER_PASSWORD_INPUT"
        );
        // let's look for this text We need to make sure that you’re a real person.
        // await this.wait(300000)
        if (await this.twitterRequiresCaptcha()) {
          common.debugLog(
            process.env.DEBUG,
            "Bro, you need to solve the puzzle!"
          );
        } else if (await this.unusualLoginDetected()) {
          common.debugLog(
            process.env.DEBUG,
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
            common.debugLog(error);
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

          common.debugLog(
            process.env.DEBUG,
            "Bro we need you to do something about this situation, will give you 20 seconds."
          );
          await this.wait(20000);
        } else {
          common.debugLog(
            process.env.DEBUG,
            "Bro, we're defeated by Twitter. Dang it."
          );
          this.isBusy = false;
          return this.respond(
            false,
            "Can't find and click TWITTER_PASSWORD_INPUT"
          );
        }
      } else
        common.debugLog(
          process.env.DEBUG,
          "Found and clicked TWITTER_PASSWORD_INPUT"
        );

      foundAndTyped = await this.findAndType(
        process.env.TWITTER_PASSWORD_INPUT,
        botPassword
      );
      if (!foundAndTyped) {
        common.debugLog(
          process.env.DEBUG,
          "Can't find and type TWITTER_PASSWORD_INPUT"
        );
        this.isBusy = false;
        return this.respond(
          false,
          "Can't find and type TWITTER_PASSWORD_INPUT"
        );
      }
      common.debugLog(
        process.env.DEBUG,
        "Found and typed TWITTER_PASSWORD_INPUT"
      );
      await this.page.keyboard.press("Enter");
      await this.wait(3000);

      if (await this.lookForWrongLoginInfoDialog("wrong password")) {
        return this.respond(false, "Bro, your password is messed up.");
      }

      // const wrongPassword = await this.findTextInPage("wrong password");
      // common.debugLog(process.env.DEBUG,"wrongPassword->", wrongPassword);
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
      //     common.debugLog(process.env.DEBUG,"Found TWITTER_PASSWORD_INPUT when i should not, wrong login data assumed.");
      //     this.isBusy = false;
      //     return this.respond(false, "Wrong login information.");
      // }

      //HERE I GOTTA MAKE SURE Twitter is not suspicious and temporarily blocked me

      // common.debugLog(process.env.DEBUG,"Twitter Bot has logged in, we now will try to detect suspicion.");

      // let confirmedSuspicion = await this.twitterSuspects();

      // if (confirmedSuspicion) {
      //     common.debugLog(process.env.DEBUG,"Twitter suspects, will try to convince them.");
      //     let emailWasInput = await this.inputEmail();
      //     if (emailWasInput) {
      //         common.debugLog(process.env.DEBUG,"We succeeded convincing twitter. We're in.");
      //         this.isBusy = false;
      //         return this.respond(true, "xBot is logged in, we convinced Elon!");
      //     }
      //     else {
      //         common.debugLog(process.env.DEBUG,"We did not convince Elon :(");
      //         this.isBusy = false;
      //         return this.respond(false, "xBot is not logged in :(");
      //     }
      // }
      // else {
      //     common.debugLog(process.env.DEBUG,"We will now try to see if Twitter wants verification from us.")
      //     let confirmedVerification = await this.twitterWantsVerification();
      //     if (confirmedVerification.success) {
      //         common.debugLog(process.env.DEBUG,"Twitter wants verification from us!")
      //         // now we must check the code that was sent to us
      //         // (or read the email automatically)
      //         // and send it to the browser.
      //         // The thing is i don't know how to locate that input field yet.
      //         this.isBusy = false;
      //         return this.respond(false, "Bot did NOT log in / Twitter wants verification code.")
      //         // res.download(filePath);
      //     }
      //     else {
      //         common.debugLog(process.env.DEBUG,"Apparently Twitter does not suspect, so we're logged in!");
      //         this.isLoggedIn = true;
      //         this.isBusy = false;
      //         return this.respond(true, "xBot is logged in!")
      //     }
      // }
    } else {
      common.debugLog("xBot is already logged in!");
      this.isBusy = false;
      return this.respond(false, "xBot is already logged in!");
    }
  }
  async inputEmail() {
    let foundAndClicked = await this.findAndClick(
      process.env.TWITTER_EMAIL_INPUT
    );
    if (!foundAndClicked) {
      common.debugLog("Cant't find TWITTER_EMAIL_INPUT");
      return false;
    }
    common.debugLog("Found TWITTER_EMAIL_INPUT");

    let foundAndTyped = await this.findAndType(
      process.env.TWITTER_EMAIL_INPUT,
      this.botEmail
    );
    if (!foundAndTyped) {
      common.debugLog(
        process.env.DEBUG,
        "Can't find and type TWITTER_EMAIL_INPUT"
      );
      return false;
    }
    common.debugLog("Found and typed TWITTER_EMAIL_INPUT");

    await this.page.keyboard.press("Enter");

    return true;
  }
  async inputVerificationCode(code) {
    let foundAndClicked = await this.findAndClick(
      process.env.TWITTER_VERIFICATION_CODE_INPUT
    );
    if (!foundAndClicked) {
      common.debugLog(
        process.env.DEBUG,
        "Cant't find TWITTER_VERIFICATION_CODE_INPUT"
      );
      return false;
    }
    common.debugLog("Found TWITTER_VERIFICATION_CODE_INPUT");

    let foundAndTyped = await this.findAndType(
      process.env.TWITTER_VERIFICATION_CODE_INPUT,
      code
    );
    if (!foundAndTyped) {
      common.debugLog(
        process.env.DEBUG,
        "Can't find and type TWITTER_VERIFICATION_CODE_INPUT"
      );
      return false;
    }
    common.debugLog(
      process.env.DEBUG,
      "Found and typed TWITTER_VERIFICATION_CODE_INPUT"
    );

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
      common.debugLog(
        process.env.DEBUG,
        "xBotClassContext.isBusy->" + xBotClassContext.isBusy
      );
      common.debugLog(
        process.env.DEBUG,
        "xBot is not busy, so processQueue will start completing pending tasks"
      );
      while (xBotClassContext.queue.length > 0) {
        const nextItem = xBotClassContext.queue.pop();
        common.debugLog(
          process.env.DEBUG,
          "nextItem->",
          JSON.stringify(nextItem)
        );
        await xBotClassContext.tweet(nextItem.userId, nextItem.text);
        //wait some time
      }
      xBotClassContext.stopQueueMonitor();
    } else return;
  }
  wait(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  async deleteTwitterBookmarks() {
    // await this.page.evaluateHandle((theIndexId) => {
    //   const theDivs = Array.from(
    //     document.querySelectorAll('div[data-testid="cellInnerDiv"]')
    //   );
    //   theDivs
    //     .find((div) =>
    //       div.style.transform.includes(`translateY(${theIndexId}px)`)
    //     )
    //     .querySelectorAll(
    //       ".css-175oi2r.r-1777fci.r-bt1l66.r-bztko3.r-lrvibr.r-1loqt21.r-1ny4l3l"
    //     )[5];
    //   if (bookmarkButton) bookmarkButton.click();
    // }, indexId);

    //TODO: this works but not perfect. It does not remove all bookmarks, but some.
    // common.debugLog("indexId->", indexId);

    // const parentDiv = await this.page.evaluateHandle((theIndexId) => {
    //   // Find all divs with data-testid="cellInnerDiv"
    //   const divs = Array.from(
    //     document.querySelectorAll('div[data-testid="cellInnerDiv"]')
    //   );
    //   // Find the one with the desired style
    //   return divs.find((div) =>
    //     div.style.transform.includes(`translateY(${theIndexId}px)`)
    //   );
    // }, indexId);
    // common.debugLog("parentDiv->", parentDiv);
    // if (parentDiv) {
    //   // const bookMarkButton = await parentDiv.$$(
    //   //   '.css-175oi2r.r-1777fci.r-bt1l66.r-bztko3.r-lrvibr.r-1loqt21.r-1ny4l3l[aria-label="Bookmarked"]'
    //   // );
    //   const bookMarkButtons = await parentDiv.$$(
    //     '.css-175oi2r.r-1777fci.r-bt1l66.r-bztko3.r-lrvibr.r-1loqt21.r-1ny4l3l[aria-label="Bookmarked"]'
    //   );

    //   if (bookMarkButtons.length > 0) {
    //     common.debugLog("bookMarkButtons[0]->", bookMarkButtons[0]);
    //     await bookMarkButtons[0].click(); // Click the first button
    //     console.log("First bookmark button clicked!");
    //   } else {
    //     console.log("No bookmark buttons found.");
    //   }
    // } else {
    //   common.debugLog(
    //     process.env.DEBUG,
    //     "Parent div with the specified style not found."
    //   );
    //   return false;
    // }

    // '.css-175oi2r.r-1777fci.r-bt1l66.r-bztko3.r-lrvibr.r-1loqt21.r-1ny4l3l[aria-label="Bookmarked"]'

    await this.page.waitForSelector('[aria-label="Bookmarked"]');

    // Get all buttons with the `aria-label="Bookmarked"`
    let bookmarkButtons = await this.page.$$('[aria-label="Bookmarked"]');

    const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

    while (bookmarkButtons.length > 0) {
      console.log(`Found ${bookmarkButtons.length} bookmark buttons.`);

      // Function to delay execution for a specified time

      // Loop through the buttons and click them with a 2-second delay
      for (let i = 0; i < bookmarkButtons.length; i++) {
        try {
          await bookmarkButtons[i].click();
          console.log(`Clicked button ${i + 1}`);
        } catch (error) {
          common.errorLog(`Error clicking button ${i + 1}:`, error);
        }

        // Delay for 2 seconds
        await delay(1500);
      }

      bookmarkButtons = await this.page.$$('[aria-label="Bookmarked"]');
    }

    console.log("Finished clicking all bookmark buttons.");
  }

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
          return null;
        }

        const divItem = {};
        divItem.htmlContent = div;
        divItem.indexId = this.getId(div);
        return divItem;
      })
      .filter((item) => item !== null);

    for (const newBookmark of processedBookmarks) {
      const $ = cheerio.load(newBookmark.htmlContent);

      const newBookmarkTweetUrl = $('[data-testid="User-Name"] a')
        .eq(2)
        .attr("href");

      sendMessageToMainWindow("CHECK_SAVED_TWEET_EXISTS", newBookmarkTweetUrl);

      common.debugLog("gonna wait for waitForNewReport()");

      const waitForNewReportResponse = await waitForNewReport();

      common.debugLog(
        process.env.DEBUG,
        "waitForNewReportResponse->",
        JSON.stringify(waitForNewReportResponse)
      );

      if (waitForNewReportResponse.success) {
        common.debugLog(
          process.env.DEBUG,
          waitForNewReportResponse.tweetUrl + " already exists, skipping!"
        );
        continue;
      }

      // now enter a while loop that breaks only when the front end responds

      const idExists = this.bookmarks.some(
        (bookmark) => bookmark.indexId === newBookmark.indexId
      );
      if (!idExists) {
        common.debugLog("We do have to store this bookmark");
        newBookmark.tweetUrlHash = common.createHash(newBookmarkTweetUrl);
        this.bookmarks.push(newBookmark);
        if (this.downloadMedia) {
          common.debugLog("We do have to download images!");
          const videoPlayerDiv = $('div[data-testid="videoPlayer"]');
          const imageDiv = $('div[data-testid="tweetPhoto"]');
          if (videoPlayerDiv.length > 0) {
            newBookmark.hasLocalMedia = "video";
            const videoPageUrl =
              "https://x.com" +
              $('[data-testid="User-Name"] a').eq(2).attr("href");
            common.debugLog(
              process.env.DEBUG,
              "Gotta download the video at: ",
              videoPageUrl
            );
            //TODO: where the fuck are videos stored in production??
            //ALSO: why the fuck can't we see them in the app?
            const fetchVideoResult = await this.fetchAndSaveVideo(
              videoPageUrl,
              process.env.MEDIA_FOLDER,
              newBookmark.tweetUrlHash + ".mp4"
            );

            if (!fetchVideoResult.success) {
              newBookmark.hasLocalMedia = "no";
              sendMessageToMainWindow(
                "NOTIFICATION",
                `error--Trouble with fetchAndSaveVideo(): ${fetchVideoResult.errorMessage}`
              );
            }
          } else if (imageDiv.length > 0) {
            newBookmark.hasLocalMedia = "image";
            const tweetPhothUrl = $('[data-testid="tweetPhoto"] img').attr(
              "src"
            );
            common.debugLog(
              process.env.DEBUG,
              "Gotta download this pic: ",
              tweetPhothUrl
            );
            const fecthImageResult = await this.fetchAndSaveImage(
              tweetPhothUrl,
              "media",
              newBookmark.tweetUrlHash + ".jpg"
            );
            // TODO: we got to report this error somehow
            if (!fecthImageResult.success) {
              sendMessageToMainWindow(
                "NOTIFICATION",
                `error--Trouble with fetchAndSaveImage(): ${fecthImageResult.errorMessage}`
              );
              newBookmark.hasLocalMedia = "no";
            }
          }
        } else {
          common.debugLog(
            process.env.DEBUG,
            "We do NOT have to download images!"
          );
        }
        common.debugLog(
          process.env.DEBUG,
          "newBookmark.indexId->",
          newBookmark.indexId
        );
      } else
        common.debugLog(
          process.env.DEBUG,
          "we do not need to store bookmark with id:",
          newBookmark.indexId
        );
    }
    return this.bookmarks;
  };
  scrapeBookmarks = async (showProgressFunction) => {
    await this.storeBookmarks();

    let scrollPosition = 0;

    while (this.goAheadScrape) {
      common.debugLog("Gonna scroll...");
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

      common.debugLog("bookmarks stored.");

      // Get the scroll position
      const newScrollPosition = await this.page.evaluate(() => {
        return window.scrollY;
      });

      if (newScrollPosition > scrollPosition) {
        common.debugLog("looping again.");
        scrollPosition = newScrollPosition;
      } else if (newScrollPosition <= scrollPosition) {
        common.debugLog("End of page reached. Stopping.");
        break;
      }
    }
    //TODO: if DELETE_BOOKMARK == true then
    await this.deleteTwitterBookmarks();
    const bookmarksCopy = [...this.bookmarks];
    this.bookmarks = [];
    return bookmarksCopy;
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
