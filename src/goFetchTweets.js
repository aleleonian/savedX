import * as constants from "./util/constants";
import * as dbTools from "./util/db";
import * as common from "./util/common";
import { sendMessageToMainWindow, encode } from "./util/messaging";

let localBot;

function setLocalBot(bot) {
  localBot = bot;
}

function getLocalBot(bot) {
  return localBot;
}

export async function goFetchTweets(xBot, botUsername, botPassword, botEmail) {
  showProgress(encode(constants.progress.INIT_PROGRESS));
  setLocalBot(xBot);

  localBot.botUsername = botUsername;
  localBot.botPassword = botPassword;
  localBot.botEmail = botEmail;

  console.log("localBot.botUsername->", localBot.botUsername);
  console.log("localBot.botPassword->", localBot.botPassword);
  console.log("localBot.botEmail->", localBot.botEmail);

  let result = await localBot.init();
  if (result.success) {
    showProgress(
      encode(constants.progress.INIT_PROGRESS, constants.progress.LOGGING_IN)
    );
    //TODO something's wrong with the passwords
    result = await localBot.loginToX(
      localBot.botUsername,
      localBot.botPassword,
      localBot.botEmail
    );
    if (result.success) {
      showProgress(
        encode(constants.progress.INIT_PROGRESS, constants.progress.LOGGED_IN)
      );
      await localBot.wait(3000);
      await localBot.goto("https://twitter.com/i/bookmarks");
      showProgress(
        encode(
          constants.progress.INIT_PROGRESS,
          constants.progress.LOGGED_IN,
          constants.progress.SCRAPING
        )
      );
      await localBot.wait(5000);
      const bookmarks = await localBot.scrapeBookmarks(showProgress);
      showProgress(
        encode(
          constants.progress.INIT_PROGRESS,
          constants.progress.LOGGED_IN,
          constants.progress.SCRAPED
        )
      );
      await dbTools.storeTweets(bookmarks);
      await localBot.wait(3000);
      await localBot.logOut();
      showProgress(
        encode(
          constants.progress.INIT_PROGRESS,
          constants.progress.LOGGED_IN,
          constants.progress.SCRAPED,
          constants.progress.LOGGED_OUT
        )
      );
      await localBot.wait(3000);
      hideProgress();
    } else {
      hideProgress();
      sendMessageToMainWindow(
        "NOTIFICATION",
        `error--Could not log into X 😫 : ${result.message}`
      );
      await localBot.closeBrowser();
      return;
    }
    await localBot.closeBrowser();
    const tweets = await dbTools.readAllTweets();
    console.log("tweets->", tweets);
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
    encode(constants.progress.INIT_PROGRESS, constants.progress.LOGGING_IN)
  );
  await common.wait(3000);
  showProgress(
    encode(constants.progress.INIT_PROGRESS, constants.progress.LOGGED_IN)
  );
  await common.wait(3000);
  showProgress(
    encode(
      constants.progress.INIT_PROGRESS,
      constants.progress.LOGGED_IN,
      constants.progress.SCRAPING
    )
  );
  await common.wait(3000);
  showProgress(
    encode(
      constants.progress.INIT_PROGRESS,
      constants.progress.LOGGED_IN,
      constants.progress.SCRAPED
    )
  );
  await common.wait(3000);
  showProgress(
    encode(
      constants.progress.INIT_PROGRESS,
      constants.progress.LOGGED_IN,
      constants.progress.SCRAPED,
      constants.progress.LOGGING_OUT
    )
  );
  await common.wait(2000);
  showProgress(
    encode(
      constants.progress.INIT_PROGRESS,
      constants.progress.LOGGED_IN,
      constants.progress.SCRAPED,
      constants.progress.LOGGED_OUT
    )
  );
  await common.wait(2000);
  hideProgress();
}
export function stopScraping() {
  console.log("localBot.goAheadScrape = false.");
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
