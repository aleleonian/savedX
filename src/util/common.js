import * as crypto from "crypto";
const path = require("node:path");
const fs = require("fs");
const { exec } = require("child_process");

// Function to check if a command exists
const checkCommandExists = (command) => {
  return new Promise((resolve) => {
    exec(`${command}`, (error) => {
      if (error) {
        resolve(false); // Command not found
      } else {
        resolve(true); // Command found
      }
    });
  });
};

export const wait = (ms) => {
  return new Promise((resolve) => setTimeout(resolve, ms));
};

export const createErrorResponse = (errorMessage) => {
  let responseObj = {};
  responseObj.success = false;
  responseObj.errorMessage = errorMessage;
  return responseObj;
};

export const createSuccessResponse = (data) => {
  let responseObj = {};
  responseObj.success = true;
  if (data) responseObj.data = data;
  return responseObj;
};

export const debugLog = (debugValue, ...strings) => {
  const string = strings.join(" "); // Join with space for readability
  if (debugValue) {
    console.log(string);
  }
};

export function createHash(inputString) {
  const hash = crypto.createHash("md5");
  hash.update(inputString);
  return hash.digest("hex");
}

export async function checkDependencies() {
  const ytdlpInstalled = await checkCommandExists("yt-dlp --version");
  const ffmpegInstalled = await checkCommandExists("ffmpeg -version");
  let errorMessage = "";

  debugLog(process.env.DEBUG, "ytdlpInstalled->", ytdlpInstalled);

  debugLog(process.env.DEBUG, "ffmpegInstalled->", ffmpegInstalled);

  if (!ytdlpInstalled) {
    errorMessage += "yt-dlp is not installed!";
  }

  if (!ffmpegInstalled) {
    errorMessage +=
      errorMessage == ""
        ? "ffmpeg is not installed!"
        : "Also you need to install ffmpeg.";
  }

  if (errorMessage != "") {
    return createErrorResponse(errorMessage);
  } else {
    return createSuccessResponse();
  }
}

export const deleteFile = async (filePath) => {
  try {
    const absolutePath = path.resolve(filePath); // Ensures the path is absolute
    await fs.promises.unlink(absolutePath); // Deletes the file
    debugLog(process.env.DEBUG, `File deleted: ${absolutePath}`);
    return true;
  } catch (error) {
    console.error(`Error deleting file: ${error.message}`);
    return false;
  }
};

export const deleteAllFilesInDirectory = async (dirPath) => {
  try {
    const absoluteDirPath = path.resolve(dirPath); // Ensures the path is absolute
    const files = await fs.promises.readdir(absoluteDirPath); // Reads the directory contents

    // Loop through each file and delete it
    await Promise.all(
      files.map(async (file) => {
        const filePath = path.join(absoluteDirPath, file);
        const stats = await fs.promises.stat(filePath);
        if (stats.isFile()) {
          await fs.promises.unlink(filePath); // Deletes the file
          console.log(`Deleted file: ${filePath}`);
        }
      }),
    );

    console.log(
      `All files in directory "${absoluteDirPath}" have been deleted.`,
    );
    return true;
  } catch (error) {
    console.error(`Error deleting files in directory: ${error.message}`);
  }
  return false;
};
