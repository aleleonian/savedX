import * as constants from "./util/constants.mjs";
import * as dbTools from "./util/db.mjs";
import * as common from "./util/common.mjs";
import { changeDownloadMediaConfig, updateLastLoggedinUsername, getLastLoggedinUsername } from "./util/account.mjs";
import { sendMessageToMainWindow, encode } from "./util/messaging.mjs";

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
  localBot.deleteOnlineBookmarks = configData.DELETE_ONLINE_BOOKMARKS;
  localBot.persistXLogin = configData.PERSIST_X_LOGIN;

  common.debugLog("localBot.botUsername->", localBot.botUsername);
  common.debugLog("localBot.botPassword->", localBot.botPassword);
  common.debugLog("localBot.botEmail->", localBot.botEmail);
  common.debugLog("localBot.downloadMedia->", localBot.downloadMedia);
  common.debugLog("localBot.persistXLogin->", localBot.persistXLogin);

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
        `error--${checkDependenciesResponse.errorMessage} 😫. Gonna change the 'download tweets media' configuration for you.\nPlease install the software and change it back.\nIf the software is installed, you can specify its location in savedX.env using YTDLP_INSTALLATION and FFMPEG_INSTALLATION  `,
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

  // here i gotta get the last user logged in
  // if it's the same as the current one, i shall pass 'false' as the second parameter to .init
  // if it's different, i shall pass 'true'

  const lastLoggedInUsername = await getLastLoggedinUsername();

  common.debugLog("lastLoggedInUsername->" + JSON.stringify(lastLoggedInUsername));

  // we asume the chrome_data folder does not have to be deleted 
  let needToDeleteChromeDataFolder = false;

  if (lastLoggedInUsername.data !== localBot.botUsername) {
    needToDeleteChromeDataFolder = true;
  }

  let result = await localBot.init(process.env.APP_FOLDER, localBot.persistXLogin, needToDeleteChromeDataFolder);

  if (result.success) {
    showProgress(
      encode(constants.progress.INIT_PROGRESS, constants.progress.LOGGING_IN),
    );
    result = await localBot.loginToX(
      localBot.botUsername,
      localBot.botPassword,
      localBot.botEmail,
    );
    if (result.success) {
      const updateLastLoggedinUsernameResult = await updateLastLoggedinUsername(localBot.botUsername);

      if (!updateLastLoggedinUsernameResult.success) {
        common.debugLog("updateLastLoggedinUsername() failed!");
      }

      showProgress(
        encode(constants.progress.INIT_PROGRESS, constants.progress.LOGGED_IN),
      );
      await localBot.wait(3000);
      const targetWebsite = process.env.TARGET_WEBSITE.replace(/\/$/, "");
      await localBot.goto(targetWebsite + "/i/bookmarks");
      showProgress(
        encode(
          constants.progress.INIT_PROGRESS,
          constants.progress.LOGGED_IN,
          constants.progress.SCRAPING,
        ),
      );
      // we gotta wait for the html to be 'settled'
      await localBot.wait(5000);
      try {
        const bookmarks = await localBot.scrapeBookmarks();
        common.debugLog(bookmarks.length + " bookmarks scraped.");
        common.debugLog("bookmarks: " + JSON.stringify(bookmarks));
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
        await localBot.wait(1000);
      }
      catch (error) {
        common.debugLog("error scraping bookmarks: ", error);
        sendMessageToMainWindow(
          "NOTIFICATION",
          `error--Error scraping bookmarks! 😫 : ${error}`,
        );
      }
      // await localBot.logOut();
      showProgress(
        encode(
          constants.progress.INIT_PROGRESS,
          constants.progress.LOGGED_IN,
          constants.progress.SCRAPED,
          constants.progress.LOGGED_OUT,
        ),
      );
      await localBot.wait(1000);
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
  common.debugLog("localBot.keepScraping = false.");
  localBot.keepScraping = false;
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
