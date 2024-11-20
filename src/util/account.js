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
        resolve(returnSuccess(getQueryResponse));
      } else {
        resolve(returnError("Missing config data 🙈"));
      }
    } catch (error) {
      resolve(returnError(error));
    }
  });
};
