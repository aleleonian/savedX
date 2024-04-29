import { XBot } from "./classes/XBot";
import * as constants from "./util/constants";
import * as dbTools from "./util/db";
import * as common from "./util/common";
import { sendMessageToMainWindow, encode } from "./util/messaging";

export async function goFetchTweets() {

    showProgress(encode(constants.progress.INIT_PROGRESS));
    const xBot = new XBot();
    let result = await xBot.init();
    if (result.success) {
        showProgress(constants.progress.INIT_PROGRESS, constants.progress.LOGGING_IN);
        result = await xBot.loginToX();
        if (result.success) {
            showProgress(constants.progress.INIT_PROGRESS, constants.progress.LOGGED_IN);
            await xBot.wait(8000);
            await xBot.goto("https://twitter.com/i/bookmarks");
            showProgress(constants.progress.INIT_PROGRESS, constants.progress.LOGGED_IN, constants.progress.SCRAPING);
            await xBot.wait(8000);
            const bookmarks = await xBot.scrapeBookmarks();
            showProgress(constants.progress.INIT_PROGRESS, constants.progress.LOGGED_IN, constants.progress.SCRAPED);
            await dbTools.deleteTweets();
            await dbTools.storeTweets(bookmarks);
            await xBot.logOut();
            showProgress(constants.progress.INIT_PROGRESS, constants.progress.LOGGED_IN, constants.progress.SCRAPING, constants.progress.LOGGED_OUT);
            await xBot.wait(3000);
        }
        else {
            hideProgress();
            sendMessageToMainWindow("NOTIFICATION", `error--Could not log into X 😫`);
            await xBot.closeBrowser();
            return;
        }
        await xBot.closeBrowser();
        const tweets = await dbTools.readAllTweets();
        hideProgress();
        sendMessageToMainWindow("CONTENT", tweets.rows);
    }
    else {
        hideProgress();
        sendMessageToMainWindow("NOTIFICATION", `error--Trouble with XBot.init()`);
    }
}
export async function goFetchTweetsFake() {
    showProgress(encode(constants.progress.INIT_PROGRESS));
    showProgress(encode(constants.progress.INIT_PROGRESS, constants.progress.LOGGING_IN));
    await common.wait(3000);
    showProgress(encode(constants.progress.INIT_PROGRESS, constants.progress.LOGGED_IN));
    await common.wait(3000);
    showProgress(encode(constants.progress.INIT_PROGRESS, constants.progress.LOGGED_IN, constants.progress.SCRAPING), "45%");
    await common.wait(3000);
    showProgress(encode(constants.progress.INIT_PROGRESS, constants.progress.LOGGED_IN, constants.progress.SCRAPED));
    await common.wait(3000);
    showProgress(encode(constants.progress.INIT_PROGRESS, constants.progress.LOGGED_IN, constants.progress.SCRAPED, constants.progress.LOGGING_OUT));
    await common.wait(2000);
    showProgress(encode(constants.progress.INIT_PROGRESS, constants.progress.LOGGED_IN, constants.progress.SCRAPED, constants.progress.LOGGED_OUT));
    await common.wait(2000);
    hideProgress();
}

const showProgress = (encodedStages, data = null) => {
    const messageOBject = {};
    messageOBject.progressStages = encodedStages;
    if (data) messageOBject.data = data;
    sendMessageToMainWindow("SHOW_PROGRESS", messageOBject);
}

const hideProgress = () => {
    const messageOBject = {};
    messageOBject.progressStages = constants.progress.HIDE_PROGRESS;
    sendMessageToMainWindow("SHOW_PROGRESS", messageOBject);
}
