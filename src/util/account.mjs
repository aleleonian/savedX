import { createErrorResponse, createSuccessResponse } from "./common.mjs";
import * as dbTools from "./db.mjs";
import * as common from "./common.mjs";

export const checkUserAndPass = () => {
  return new Promise(function checkUserAndPassPromise(resolve) {
    (async () => {
      try {
        const getQueryResponse = await dbTools.getQuery(
          "SELECT TWITTER_BOT_USERNAME, TWITTER_BOT_PASSWORD, TWITTER_BOT_EMAIL from config",
        );
        const data = getQueryResponse.data;
        if (
          data.TWITTER_BOT_USERNAME &&
          data.TWITTER_BOT_PASSWORD &&
          data.TWITTER_BOT_EMAIL
        ) {
          resolve(createSuccessResponse(data));
        } else {
          resolve(createErrorResponse("Missing config data 🙈"));
        }
      } catch (error) {
        common.debugLog(
          process.env.DEBUG,
          "checkUserAndPassPromise error->",
          error,
        );
        resolve(
          error.errorMessage ? error.errorMessage : JSON.stringify(error),
        );
      }
    })();
  });
};

export const getAllConfigData = () => {
  return new Promise(function getAllConfigDataPromise(resolve) {
    (async function () {
      try {
        const getQueryResponse = await dbTools.getQuery(
          "SELECT TWITTER_BOT_USERNAME, TWITTER_BOT_PASSWORD, TWITTER_BOT_EMAIL, DOWNLOAD_MEDIA, DELETE_ONLINE_BOOKMARKS from config",
        );
        let data = {};
        if (getQueryResponse.data) data = getQueryResponse.data;
        if (data.DOWNLOAD_MEDIA && data.DOWNLOAD_MEDIA == 1)
          data.DOWNLOAD_MEDIA = true;
        else data.DOWNLOAD_MEDIA = false;
        if (data.DELETE_ONLINE_BOOKMARKS && data.DELETE_ONLINE_BOOKMARKS == 1)
          data.DELETE_ONLINE_BOOKMARKS = true;
        else data.DELETE_ONLINE_BOOKMARKS = false;
        resolve(createSuccessResponse(data));
      } catch (error) {
        common.debugLog(
          process.env.DEBUG,
          "getAllConfigDataPromise error->",
          error,
        );
        resolve(
          createErrorResponse(
            error.errorMessage ? error.errorMessage : JSON.stringify(error),
          ),
        );
      }
    })();
  });
};

export const updateConfigData = (formData) => {
  return new Promise((resolve, reject) => {
    (async () => {
      try {
        let getQueryResponse = await dbTools.runQuery(`DELETE FROM config`);

        if (formData.downloadMedia === true) formData.downloadMedia = 1;
        else formData.downloadMedia = 0;

        getQueryResponse = await dbTools.runQuery(
          `INSERT INTO config (TWITTER_BOT_USERNAME, TWITTER_BOT_PASSWORD, TWITTER_BOT_EMAIL, DOWNLOAD_MEDIA, DELETE_ONLINE_BOOKMARKS) VALUES (?, ?, ?, ?, ?);`,
          [
            formData.username,
            formData.password,
            formData.email,
            formData.downloadMedia,
            formData.deleteOnlineBookmarks,
          ],
        );

        if (getQueryResponse.success) {
          resolve(getQueryResponse);
        } else {
          getQueryResponse.errorMessage =
            "Failed to update config data 🙈 : " +
            getQueryResponse.errorMessage;
          resolve(getQueryResponse);
        }
      } catch (error) {
        common.errorLog("updateConfigData-> error", error);
        reject(error.errorMessage ? error.errorMessage : JSON.stringify(error));
      }
    })();
  });
};

export function changeDownloadMediaConfig() {
  return new Promise((resolve) => {
    (async function cdmcIIFE() {
      try {
        const getQueryResponse = await dbTools.runQuery(
          "UPDATE config SET DOWNLOAD_MEDIA = 0;",
        );
        common.debugLog(
          process.env.DEBUG,
          "getQueryResponse->",
          JSON.stringify(getQueryResponse),
        );
        if (getQueryResponse.success) {
          resolve(common.createSuccessResponse());
        } else {
          resolve(common.createErrorResponse(getQueryResponse.errorMessage));
        }
      } catch (error) {
        common.debugLog(
          process.env.DEBUG,
          "changeDownloadMediaConfig() error: ",
          JSON.stringify(error),
        );
        resolve(common.createErrorResponse(error.errorMessage));
      }
    })();
  });
}
export function changeDeleteOnlineBookmarksConfig() {
  return new Promise((resolve) => {
    (async function cdmcIIFE() {
      try {
        const getQueryResponse = await dbTools.runQuery(
          "UPDATE config SET DELETE_ONLINE_BOOKMARKS = 0;",
        );
        common.debugLog(
          process.env.DEBUG,
          "getQueryResponse->",
          JSON.stringify(getQueryResponse),
        );
        if (getQueryResponse.success) {
          resolve(common.createSuccessResponse());
        } else {
          resolve(common.createErrorResponse(getQueryResponse.errorMessage));
        }
      } catch (error) {
        common.debugLog(
          process.env.DEBUG,
          "changeDeleteOnlineBookmarksConfig() error: ",
          JSON.stringify(error),
        );
        resolve(common.createErrorResponse(error.errorMessage));
      }
    })();
  });
}
