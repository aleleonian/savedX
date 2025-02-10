let mainWindow;

// export const sendMessageToMainWindow = (type, data) => {
//   mainWindow.webContents.send(type, data);
// };

export function sendMessageToMainWindow(channel, message) {
  console.log("calling sendMessageToMainWindow");
  if (mainWindow && mainWindow.webContents) {
    console.log(`📤 Actually sending ${channel} event to renderer.`);
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
