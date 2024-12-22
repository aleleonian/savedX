import * as constants from "./util/constants";
import * as dbTools from "./util/db";
import * as common from "./util/common";
import { changeDownloadMediaConfig } from "./util/account";
import { sendMessageToMainWindow, encode } from "./util/messaging";

let localBot;

function setLocalBot(bot) {
  localBot = bot;
}

export async function goFetchTweets(xBot, configData) {
  showProgress(encode(constants.progress.INIT_PROGRESS));
  setLocalBot(xBot);

  localBot.botUsername = configData.TWITTER_BOT_USERNAME;
  localBot.botPassword = configData.TWITTER_BOT_PASSWORD;
  localBot.botEmail = configData.TWITTER_BOT_EMAIL;
  localBot.downloadMedia = configData.DOWNLOAD_MEDIA;

  common.debugLog(
    process.env.DEBUG,
    "localBot.botUsername->",
    localBot.botUsername,
  );
  common.debugLog(
    process.env.DEBUG,
    "localBot.botPassword->",
    localBot.botPassword,
  );
  common.debugLog("localBot.botEmail->", localBot.botEmail);
  common.debugLog(
    process.env.DEBUG,
    "localBot.downloadMedia->",
    localBot.downloadMedia,
  );

  //TODO here we have to check dependencies
  //if fail then modify configuration to change downloadMedia
  //and let the user know
  if (localBot.downloadMedia) {
    const checkDependenciesResponse = await common.checkDependencies();

    common.debugLog(
      process.env.DEBUG,
      "checkDependenciesResponse->",
      JSON.stringify(checkDependenciesResponse),
    );

    if (!checkDependenciesResponse.success) {
      sendMessageToMainWindow(
        "NOTIFICATION",
        `error--${checkDependenciesResponse.errorMessage} 😫. Gonna change the 'download tweets media' configuration for you. Please install the software and change it back. `,
      );

      changeDownloadMediaConfig().then((response) => {
        if (!response.success) {
          common.debugLog(
            process.env.DEBUG,
            "response->",
            JSON.stringify(response),
          );
          sendMessageToMainWindow(
            "NOTIFICATION",
            `error-- ${checkDependenciesResponse.errorMessage} 😫. Failed trying to changeDownloadMediaConfig(): ${response.errorMessage}`,
          );
        }
      });
    }
  }

  let result = await localBot.init();
  if (result.success) {
    showProgress(
      encode(constants.progress.INIT_PROGRESS, constants.progress.LOGGING_IN),
    );
    //TODO something's wrong with the passwords
    result = await localBot.loginToX(
      localBot.botUsername,
      localBot.botPassword,
      localBot.botEmail,
    );
    if (result.success) {
      showProgress(
        encode(constants.progress.INIT_PROGRESS, constants.progress.LOGGED_IN),
      );
      await localBot.wait(3000);
      await localBot.goto("https://twitter.com/i/bookmarks");
      showProgress(
        encode(
          constants.progress.INIT_PROGRESS,
          constants.progress.LOGGED_IN,
          constants.progress.SCRAPING,
        ),
      );
      await localBot.wait(5000);
      const bookmarks = await localBot.scrapeBookmarks(showProgress);
      showProgress(
        encode(
          constants.progress.INIT_PROGRESS,
          constants.progress.LOGGED_IN,
          constants.progress.SCRAPED,
        ),
      );
      const storeTweetsResult = await dbTools.storeTweets(bookmarks);
      if (!storeTweetsResult.success) {
        sendMessageToMainWindow(
          "NOTIFICATION",
          `error--Could not store tweets 😫 : ${storeTweetsResult.errorMessage}`,
        );
      }
      await localBot.wait(3000);
      await localBot.logOut();
      showProgress(
        encode(
          constants.progress.INIT_PROGRESS,
          constants.progress.LOGGED_IN,
          constants.progress.SCRAPED,
          constants.progress.LOGGED_OUT,
        ),
      );
      await localBot.wait(3000);
      hideProgress();
    } else {
      hideProgress();
      sendMessageToMainWindow(
        "NOTIFICATION",
        `error--Could not log into X 😫 : ${result.message}`,
      );
      await localBot.closeBrowser();
      return;
    }
    await localBot.closeBrowser();
    const tweets = await dbTools.readAllTweets();
    hideProgress();
    sendMessageToMainWindow("CONTENT", { tweets: tweets.rows });
  } else {
    hideProgress();
    sendMessageToMainWindow("NOTIFICATION", `error--Trouble with XBot.init()`);
  }
}
export async function goFetchTweetsFake() {
  showProgress(encode(constants.progress.INIT_PROGRESS));
  showProgress(
    encode(constants.progress.INIT_PROGRESS, constants.progress.LOGGING_IN),
  );
  await common.wait(3000);
  showProgress(
    encode(constants.progress.INIT_PROGRESS, constants.progress.LOGGED_IN),
  );
  await common.wait(3000);
  showProgress(
    encode(
      constants.progress.INIT_PROGRESS,
      constants.progress.LOGGED_IN,
      constants.progress.SCRAPING,
    ),
  );
  await common.wait(3000);
  showProgress(
    encode(
      constants.progress.INIT_PROGRESS,
      constants.progress.LOGGED_IN,
      constants.progress.SCRAPED,
    ),
  );
  await common.wait(3000);
  showProgress(
    encode(
      constants.progress.INIT_PROGRESS,
      constants.progress.LOGGED_IN,
      constants.progress.SCRAPED,
      constants.progress.LOGGING_OUT,
    ),
  );
  await common.wait(2000);
  showProgress(
    encode(
      constants.progress.INIT_PROGRESS,
      constants.progress.LOGGED_IN,
      constants.progress.SCRAPED,
      constants.progress.LOGGED_OUT,
    ),
  );
  await common.wait(2000);
  hideProgress();
}
export function stopScraping() {
  common.debugLog("localBot.goAheadScrape = false.");
  localBot.goAheadScrape = false;
}

const showProgress = (encodedStages) => {
  const messageOBject = {};
  messageOBject.progressStages = encodedStages;
  sendMessageToMainWindow("SHOW_PROGRESS", messageOBject);
};

const hideProgress = () => {
  const messageOBject = {};
  messageOBject.progressStages = constants.progress.HIDE_PROGRESS;
  sendMessageToMainWindow("SHOW_PROGRESS", messageOBject);
};
