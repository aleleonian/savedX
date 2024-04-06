require('dotenv').config();
const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('node:path');
import fs from 'fs';
import * as dbTools from "./util/db";
import { XBot } from "./classes/XBot";


let mainWindow;
// Handle creating/removing shortcuts on Windows when installing/uninstalling.
if (require('electron-squirrel-startup')) {
  app.quit();
}

const createWindow = () => {
  // Create the browser window.
  mainWindow = new BrowserWindow({
    width: 800,
    height: 600,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
    },
  });

  // and load the index.html of the app.
  if (MAIN_WINDOW_VITE_DEV_SERVER_URL) {
    mainWindow.loadURL(MAIN_WINDOW_VITE_DEV_SERVER_URL);
  } else {
    mainWindow.loadFile(path.join(__dirname, `../renderer/${MAIN_WINDOW_VITE_NAME}/index.html`));
  }

  // Open the DevTools.
  mainWindow.webContents.openDevTools();
};

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.whenReady().then(async () => {
  createWindow();
  const success = await init();
  if (!success) {
    mainWindow.webContents.send('NOTIFICATION', 'error--db file does not exist');
  }
  else {
    mainWindow.webContents.send('NOTIFICATION', 'success--db file DOES exist!');
  }
  // On OS X it's common to re-create a window in the app when the
  // dock icon is clicked and there are no other windows open.
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

// In this file you can include the rest of your app's specific main process
// code. You can also put them in separate files and import them here.
ipcMain.on('log-into-x', async (event, data) => {
  console.log("TWITTER_PROFILE_URL:", process.env.TWITTER_PROFILE_URL);
  const credentials = await dbTools.getXCredentials();
  const xBot = new XBot();
  let result = await xBot.init();
  if (result.success) {
    result = await xBot.loginToX();
    console.log("log into x result = ", JSON.stringify(result));
    await xBot.wait(8000);
    await xBot.goto('https://twitter.com/i/bookmarks');
    await xBot.wait(8000);
    const bookmarks = await xBot.scrapeBookmarks();
    const filePath = 'bookmarks.json';
    // Convert the array to a string
    const arrayJson = JSON.stringify(bookmarks, null, 2);

    // Write the array contents to a file
    fs.writeFile(filePath, arrayJson, (err) => {
      if (err) {
        console.error('Error writing file:', err);
      } else {
        console.log('Array contents have been successfully dumped into the file:', filePath);
      }
    });
    await xBot.closeBrowser();
  }
})

const init = async () => {
  // Check if the file exists
  const dbPath = path.resolve(path.resolve(app.getAppPath(), 'src', 'data', 'savedx.db'));
  return await dbTools.openDb(dbPath);
}