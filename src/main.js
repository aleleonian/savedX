require("dotenv").config();
const { app, BrowserWindow, ipcMain } = require("electron");
const path = require("node:path");
import * as dbTools from "./util/db";
import { goFetchTweets, goFetchTweetsFake, stopScraping } from "./goFetchTweets";
import { sendMessageToMainWindow, setMainWindow } from "./util/messaging";

let mainWindow;
// Handle creating/removing shortcuts on Windows when installing/uninstalling.
if (require("electron-squirrel-startup")) {
  app.quit();
}

const createWindow = () => {
  // Create the browser window.
  mainWindow = new BrowserWindow({
    width: 800,
    height: 600,
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      nodeIntegration: false,   // Node.js features disabled
      contextIsolation: true,
      sandbox: false
    },
  });

  setMainWindow(mainWindow);

  mainWindow.on('closed', () => {
    mainWindow = null;
  });

  // and load the index.html of the app.
  if (MAIN_WINDOW_VITE_DEV_SERVER_URL) {
    mainWindow.loadURL(MAIN_WINDOW_VITE_DEV_SERVER_URL);
  } else {
    mainWindow.loadFile(
      path.join(__dirname, `../renderer/${MAIN_WINDOW_VITE_NAME}/index.html`)
    );
  }

  // Open the DevTools console
  mainWindow.webContents.openDevTools({ mode: 'detach' });
};

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.whenReady().then(async () => {
  createWindow();
  const initStatus = await init();
  if (!initStatus.success) {
    sendMessageToMainWindow("NOTIFICATION", `error--${initStatus.errorMessage}`);
  }
});

// On OS X it's common to re-create a window in the app when the
// dock icon is clicked and there are no other windows open.
app.on("activate", () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});

app.on("window-all-closed", () => {
  app.quit();
});

app.on("before-quit", () => {
  // Your code to run before the app process exits
  dbTools.closeDb();
  // Save data, perform cleanup, etc.
});
// In this file you can include the rest of your app's specific main process
// code. You can also put them in separate files and import them here.
ipcMain.on("go-fetch-tweets", async (event, data) => {
  // const credentials = await dbTools.getXCredentials();
  // await goFetchTweetsFake();
  await goFetchTweets();
});

ipcMain.on("stop-scraping", async (event, data) => {
  // const credentials = await dbTools.getXCredentials();
  // await goFetchTweetsFake();
  console.log("we gonna stop scraping then.")
  await stopScraping();
});

//TODO ESTO ESTÁ AL PEDO O QUÉ
ipcMain.on("read-tweets-from-db", async (event, data) => {
  // TODO ADD ERROR CHECKING
  const tweets = await dbTools.readAllTweets();

  const readAllTagsResult = await dbTools.readAllTags();

  let savedData = {};

  if (tweets.success) savedData.tweets = tweets.rows;
  if (readAllTagsResult.success) savedData.tags = readAllTagsResult.rows;

  sendMessageToMainWindow("SAVED_TWEETS", savedData);
});

ipcMain.on("update-tags-for-tweet", async (event, tweetId, newTags) => {
  const updateTagsResult = await dbTools.updateTags(tweetId, newTags);

  //TODO VOY POR ACÁ. TENGO QUE COMUNICAR A REACT SI FUE BIEN
  //O MAL EL UPDATE
  console.log("updateTagsResult->", updateTagsResult);
});

ipcMain.on("remove-tag-from-db", async (event, tag) => {
  const removeTagFromDBResult = await dbTools.removeTagFromDB(tag);
  //TODO TENGO QUE COMUNICAR A REACT SI FUE BIEN
  //O MAL EL UPDATE
  if (!removeTagFromDBResult.success) {
    sendMessageToMainWindow("NOTIFICATION", `error--${removeTagFromDBResult.errorMessage} 😫`);
  }
  console.log("removeTagFromDBResult->", removeTagFromDBResult);
});


const init = async () => {
  // Check if the file exists
  let dbPath;
  console.log("process.env.NODE_ENV->", process.env.NODE_ENV);
  dbPath =
    process.env.NODE_ENV === "development" || process.env.NODE_ENV === "debug"
      ? path.resolve(app.getAppPath(), "src", "data", "savedx.db")
      : "./savedx.db";

  console.log("dbPath>", dbPath);

  const openDbResult = await dbTools.openDb(dbPath);
  if (openDbResult) {

    const tweets = await dbTools.readAllTweets();
    const readAllTagsResult = await dbTools.readAllTags();

    if (!tweets.success) {
      const resultOBj = {};
      resultOBj.success = tweets.success;
      if (tweets.errorMessage) resultOBj.errorMessage = tweets.errorMessage
      return resultOBj;
    }
    if (!readAllTagsResult.success) {
      const resultOBj = {};
      resultOBj.success = readAllTagsResult.success;
      if (tweets.errorMessage) resultOBj.errorMessage = readAllTagsResult.errorMessage
      return resultOBj;
    }

    sendMessageToMainWindow("CONTENT", { tweets: tweets.rows, tags: readAllTagsResult.rows })
    return { success: true };

  }
  else {
    sendMessageToMainWindow("NOTIFICATION", `error--There were issues opening / creating the db file 😫`);
    sendMessageToMainWindow("DISABLE_GO_FETCH_BUTTON");
  }
}