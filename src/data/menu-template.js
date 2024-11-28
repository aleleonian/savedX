const { app, BrowserWindow } = require("electron");
import { sendMessageToMainWindow } from "../util/messaging";
import { checkUserAndPass } from "../util/account";

export const menuTemplate = [
  {
    label: "SavedX",
    submenu: [
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
    ],
  },
];
