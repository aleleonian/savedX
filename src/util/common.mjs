import * as crypto from "crypto";
import path from "node:path";
import fs from "node:fs";
import log from "electron-log";

const predefinedPaths = [
  "/opt/homebrew/bin",
  "/usr/local/bin",
  "/usr/bin",
  "/bin",
];

// Check for command existence in predefined paths
const findCommandInPredefinedPaths = (command) => {
  return new Promise((resolve) => {
    for (const dir of predefinedPaths) {
      const commandPath = path.join(dir, command);
      if (fs.existsSync(commandPath)) {
        resolve(commandPath); // Found the command in one of the directories
        return;
      }
    }
    resolve(false);
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

export const warnLog = (...strings) => {
  const string = strings.join(" "); // Join with space for readability
  log.warn(string);
};

export const infoLog = (...strings) => {
  const string = strings.join(" "); // Join with space for readability
  log.info(string);
};

export const debugLog = (...strings) => {
  const debugValue = process.env.DEBUG;
  const string = strings.join(" "); // Join with space for readability
  if (debugValue) {
    log.debug(string);
  }
};
export const errorLog = (...strings) => {
  const string = strings.join(" "); // Join with space for readability
  log.error(string);
};

export function createHash(inputString) {
  const hash = crypto.createHash("md5");
  hash.update(inputString);
  return hash.digest("hex");
}

//TODO: this is macOs dependant. Should include Windows.
export async function checkDependencies() {
  let ytdlpInstallation, ffmpegInstallation;
  if (process.env.YTDLP_INSTALLATION) {
    ytdlpInstallation = process.env.YTDLP_INSTALLATION;
  } else {
    ytdlpInstallation = await findCommandInPredefinedPaths("yt-dlp");
  }

  if (process.env.FFMPEG_INSTALLATION) {
    ffmpegInstallation = process.env.FFMPEG_INSTALLATION;
  } else {
    ffmpegInstallation = await findCommandInPredefinedPaths("ffmpeg");
  }
  let errorMessage = "";

  debugLog("ytdlpInstallation->", ytdlpInstallation);

  debugLog("ffmpegInstallation->", ffmpegInstallation);

  if (!ytdlpInstallation) {
    errorMessage += "yt-dlp could not be found! ";
  } else {
    process.env.YTDLP_INSTALLATION = ytdlpInstallation;
  }

  if (!ffmpegInstallation) {
    errorMessage +=
      errorMessage == ""
        ? "ffmpeg is not installed!"
        : "Also ffmpeg could not be found.";
  } else {
    process.env.FFMPEG_INSTALLATION = ffmpegInstallation;
  }

  if (errorMessage != "") {
    return createErrorResponse(errorMessage);
  } else {
    // process.env.PATH += `:${ytdlpInstallation}`;
    debugLog("Updated PATH:", process.env.PATH);
    process.env.PATH += `:${ffmpegInstallation}`;
    debugLog("Updated PATH:", process.env.PATH);
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
    errorLog(`Error deleting file: ${error.message}`);
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
      })
    );

    console.log(
      `All files in directory "${absoluteDirPath}" have been deleted.`
    );
    return createSuccessResponse();
  } catch (error) {
    const errorMessage = `Error deleting files in directory: ${error.message}`;
    errorLog(errorMessage);
    return createErrorResponse(errorMessage);
  }
};