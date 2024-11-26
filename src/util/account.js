import { returnError, returnSuccess } from "./common";
import * as dbTools from "./db";

export const checkUserAndPass = () => {
  return new Promise(async function checkUserAndPassPromise(resolve, reject) {
    try {
      const getQueryResponse = await dbTools.getQuery(
        "SELECT TWITTER_BOT_USERNAME, TWITTER_BOT_PASSWORD, TWITTER_BOT_EMAIL from config"
      );
      const data = getQueryResponse.data;
      if (
        data.TWITTER_BOT_USERNAME &&
        data.TWITTER_BOT_PASSWORD &&
        data.TWITTER_BOT_EMAIL
      ) {
        resolve(returnSuccess(data));
      } else {
        resolve(returnError("Missing config data 🙈"));
      }
    } catch (error) {
      resolve(returnError(error));
    }
  });
};

export const updateConfigData = (formData) => {
  return new Promise(async function checkUserAndPassPromise(resolve, reject) {
    try {
      let getQueryResponse = await dbTools.runQuery(`DELETE FROM config`);

      getQueryResponse = await dbTools.runQuery(
        `INSERT INTO config (TWITTER_BOT_USERNAME, TWITTER_BOT_PASSWORD, TWITTER_BOT_EMAIL) VALUES (?, ?, ?);`,
        [formData.username, formData.password, formData.email]
      );

      if (getQueryResponse.success) {
        resolve(returnSuccess());
      } else {
        resolve(returnError("Failed to update config data 🙈 -"));
      }
    } catch (error) {
      resolve(returnError(error));
    }
  });
};
