import { XBot } from "./classes/XBot";
import * as constants from "./util/constants";
import * as dbTools from "./util/db";
import * as common from "./util/common";
import { sendMessageToMainWindow, encode } from "./util/messaging";

export async function goFetchTweets(xBot, botUsername, botPassword, botEmail) {
  showProgress(encode(constants.progress.INIT_PROGRESS));
  xBot.botUsername = botUsername;
  xBot.botPassword = botPassword;
  xBot.botEmail = botEmail;

  console.log("xBot.botUsername->", xBot.botUsername);
  console.log("xBot.botPassword->", xBot.botPassword);
  console.log("xBot.botEmail->", xBot.botEmail);

  let result = await xBot.init();
  if (result.success) {
    showProgress(
      encode(constants.progress.INIT_PROGRESS, constants.progress.LOGGING_IN)
    );
    //TODO something's wrong with the passwords
    result = await xBot.loginToX(
      xBot.botUsername,
      xBot.botPassword,
      xBot.botEmail
    );
    if (result.success) {
      showProgress(
        encode(constants.progress.INIT_PROGRESS, constants.progress.LOGGED_IN)
      );
      await xBot.wait(3000);
      await xBot.goto("https://twitter.com/i/bookmarks");
      showProgress(
        encode(
          constants.progress.INIT_PROGRESS,
          constants.progress.LOGGED_IN,
          constants.progress.SCRAPING
        )
      );
      await xBot.wait(5000);
      const bookmarks = await xBot.scrapeBookmarks(showProgress);
      showProgress(
        encode(
          constants.progress.INIT_PROGRESS,
          constants.progress.LOGGED_IN,
          constants.progress.SCRAPED
        )
      );
      await dbTools.storeTweets(bookmarks);
      await xBot.wait(3000);
      await xBot.logOut();
      showProgress(
        encode(
          constants.progress.INIT_PROGRESS,
          constants.progress.LOGGED_IN,
          constants.progress.SCRAPED,
          constants.progress.LOGGED_OUT
        )
      );
      await xBot.wait(3000);
      hideProgress();
    } else {
      hideProgress();
      sendMessageToMainWindow(
        "NOTIFICATION",
        `error--Could not log into X 😫 : ${result.message}`
      );
      await xBot.closeBrowser();
      return;
    }
    await xBot.closeBrowser();
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
  console.log("xBot.goAheadScrape = false.");
  xBot.goAheadScrape = false;
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
