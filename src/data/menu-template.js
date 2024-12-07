const { app, BrowserWindow } = require("electron");
import { sendMessageToMainWindow } from "../util/messaging";
import { checkUserAndPass } from "../util/account";
import { goFetchTweets } from "../goFetchTweets";

export const menuTemplate = [
  {
    label: "SavedX",
    submenu: [
      {
        label: "Fetch Tweets",
        click: async () => {
          const checkUserAndPassResponse = await checkUserAndPass();
          if (checkUserAndPassResponse.success) {
            const data = checkUserAndPassResponse.data;
            await goFetchTweets(
              data.TWITTER_BOT_USERNAME,
              data.TWITTER_BOT_PASSWORD,
              data.TWITTER_BOT_EMAIL
            );
          } else {
            sendMessageToMainWindow("SHOW_CONFIG_DIALOG");
            sendMessageToMainWindow(
              "ALERT",
              { title: 'Bro...', message: `There's no user and pass 😫` }
            );
          }
        },
      },
      {
        label: "Exit",
        click: () => {
          app.quit();
        },
      },
    ],
  },
  {
    label: "Config",
    submenu: [
      {
        label: "X account login",
        click: async () => {
          // Show a dialog when the "Open Dialog" menu item is clicked
          const checkUserAndPassResponse = await checkUserAndPass();
          const focusedWindow = BrowserWindow.getFocusedWindow();
          if (focusedWindow) {
            sendMessageToMainWindow(
              "SHOW_CONFIG_DIALOG",
              checkUserAndPassResponse.data
            );
          }
        },
      },
      { type: "separator" },
      {
        label: "Delete all saved tweets",
        click: async () => {
          sendMessageToMainWindow(
            "SHOW_DELETE_ALL_SAVED_TWEETS_DIALOG"
          );
        },
      },
    ],
  },
];