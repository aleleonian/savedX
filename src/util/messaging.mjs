import * as common from "./common.mjs";

let mainWindow;

// export const sendMessageToMainWindow = (type, data) => {
//   mainWindow.webContents.send(type, data);
// };

export function sendMessageToMainWindow(channel, message) {
  common.debugLog("calling sendMessageToMainWindow");
  if (mainWindow && mainWindow.webContents) {
    common.debugLog(`📤 Actually sending ${channel} event to renderer. Message: ${message}`);
    mainWindow.webContents.send(channel, message);
  } else {
    console.error(`❌ Failed to send ${channel}: mainWindow is not ready.`);
  }
}


export const setMainWindow = (window) => {
  mainWindow = window;
};

export const encode = (...stages) => {
  let stagesMessage = 0;
  stages.forEach((currentStage) => {
    stagesMessage |= currentStage;
  });
  return stagesMessage;
};
