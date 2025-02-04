import { app, BrowserWindow } from "electron";

import { sendMessageToMainWindow } from "../util/messaging.mjs";
import { checkUserAndPass, getAllConfigData } from "../util/account.mjs";
import { goFetchTweets } from "../goFetchTweets.mjs";
import { debugLog } from "../util/common.mjs";

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
              data.TWITTER_BOT_EMAIL,
            );
          } else {
            sendMessageToMainWindow("SHOW_CONFIG_DIALOG");
            sendMessageToMainWindow("ALERT", {
              title: "Bro...",
              message: `There's no user and pass 😫`,
            });
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
        label: "Settings",
        click: async () => {
          // Show a dialog when the "Open Dialog" menu item is clicked
          let getAllConfigDataResponse;
          try {
            getAllConfigDataResponse = await getAllConfigData();
            debugLog("getAllConfigDataResponse->", JSON.stringify(getAllConfigDataResponse));
            const focusedWindow = BrowserWindow.getFocusedWindow();
            if (focusedWindow && getAllConfigDataResponse.success) {
              sendMessageToMainWindow(
                "SHOW_CONFIG_DIALOG",
                getAllConfigDataResponse.data,
              );
            }
            if (!getAllConfigDataResponse.success) {
              sendMessageToMainWindow("ALERT", {
                title: "Bro...",
                message: `Errors retrieving config info 😫: ${getAllConfigDataResponse.errorMessage}`,
              });
            }
          } catch (error) {
            debugLog("error trying to getAllConfigData(): ", error);
            sendMessageToMainWindow("ALERT", {
              title: "Bro...",
              message: `Errors retrieving config info 😫: ${getAllConfigDataResponse.errorMessage}`,
            });
          }
        },
      },
      { type: "separator" },
      {
        label: "Delete all saved tweets",
        click: async () => {
          sendMessageToMainWindow("SHOW_DELETE_ALL_SAVED_TWEETS_DIALOG");
        },
      },
    ],
  },
];
