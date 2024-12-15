const sqlite3 = require("sqlite3").verbose();
import { returnError, returnSuccess } from "./common";
import * as common from "./common";
import cheerio from "cheerio";
const fs = require("fs");

let db;

function createDatabase(filePath) {
  return new Promise((resolve, reject) => {
    db = new sqlite3.Database(filePath, (err) => {
      if (err) {
        console.error("Error creating the database:", err.message);
        reject({
          success: false,
          errorMessage: err.message,
        });
      } else {
        common.debugLog(process.env.DEBUG, "New database created.");
        resolve({
          success: true,
          db, // Return the database object for further operations
        });
      }
    });
  });
}

export const runQuery = (query, params = []) => {
  return new Promise((resolve, reject) => {
    db.run(query, params, function (err) {
      if (err) {
        reject(returnError(err));
      } else {
        resolve(returnSuccess(this));
      }
    });
  });
};

const dbClose = () => {
  return new Promise((resolve, reject) => {
    db.close((err) => {
      if (err) {
        reject(err);
      } else {
        resolve("Database connection closed successfully.");
      }
    });
  });
};

export const getQuery = (query, params = []) => {
  return new Promise((resolve, reject) => {
    db.get(query, params, (err, row) => {
      if (err) {
        reject(returnError(err));
      } else {
        resolve(returnSuccess(row));
      }
    });
  });
};

export const getAllQuery = (query, params = []) => {
  return new Promise((resolve, reject) => {
    db.all(query, params, (err, rows) => {
      if (err) {
        reject(returnError(err));
      } else {
        resolve(returnSuccess(rows)); // rows is an array of all matched rows
      }
    });
  });
};

const createIfNotExist = async (filePath) => {
  if (!fs.existsSync(filePath)) {
    common.debugLog(
      process.env.DEBUG,
      "Database file not found. Creating a new one...",
    );

    try {
      const createDatabaseResult = await createDatabase(filePath);
      if (!createDatabaseResult.success) {
        return createDatabaseResult;
      } else db = createDatabaseResult.db;
      // Initialize schema

      await runQuery(`
        CREATE TABLE "tweets" (
          "id" INTEGER PRIMARY KEY AUTOINCREMENT,
          "indexId" TEXT NOT NULL,
          "htmlContent" TEXT NOT NULL,
          "userName" TEXT,
          "twitterHandle" TEXT,
          "tweetText" TEXT,
          "tweetUrl" TEXT UNIQUE,
          "tweetUrlHash" TEXT NOT NULL,
          "tweetImageOrPoster" TEXT,
          "tweetDate" TEXT,
          "profilePicUrl" TEXT NOT NULL,
          "hasLocalMedia" INTEGER NOT NULL
        )
      `);

      await runQuery(`
      CREATE TABLE "tags" (
        "id"	INTEGER NOT NULL,
        "name"	TEXT NOT NULL UNIQUE,
        PRIMARY KEY("id" AUTOINCREMENT)
      )
      `);
      await runQuery(`
    CREATE TABLE "tweets_tags" (
      "tweetId"	INTEGER,
      "tagId"	INTEGER,
      FOREIGN KEY("tweetId") REFERENCES "tweets"("id"),
      FOREIGN KEY("tagId") REFERENCES "tags"("id")
    )
      `);
      await runQuery(`
    CREATE TABLE "config" (
      "TWITTER_BOT_USERNAME"	TEXT NOT NULL,
      "TWITTER_BOT_PASSWORD"	TEXT NOT NULL,
      "TWITTER_BOT_EMAIL"	INTEGER NOT NULL,
      "DOWNLOAD_MEDIA"	NUMERIC NOT NULL DEFAULT 0 )
     `);

      common.debugLog(process.env.DEBUG, "Database schema initialized.");

      await dbClose();

      return {
        success: true,
      };
    } catch (error) {
      common.debugLog(process.env.DEBUG, "Error creating DB file! ", error);
      return {
        success: false,
      };
    }
  }

  common.debugLog(process.env.DEBUG, "DB file exists.");

  return {
    success: true,
  };
};

export const openDb = (filePath) => {
  // eslint-disable-next-line no-async-promise-executor
  return new Promise(async (resolve) => {
    try {
      const openOrCreateResult = await createIfNotExist(filePath);
      if (!openOrCreateResult.success) {
        resolve(false);
        return;
      }
      db = new sqlite3.Database(filePath, (err) => {
        if (err) {
          console.error("Error opening database:", err);
          resolve(false);
          return;
        } else {
          // db.on("trace", (sql) => console.log("Executing SQL:", sql));
          resolve(true);
        }
      });
    } catch (err) {
      console.error("Error opening or creating db file:", err);
      resolve(false);
    }
  });
};

export const storeTweets = async (tweetArray) => {
  await Promise.all(
    tweetArray.map(async (tweet) => {
      const $ = cheerio.load(tweet.htmlContent);
      const userNameData = $('[data-testid="User-Name"]').text().split("@");
      tweet.userName = userNameData[0];
      tweet.twitterHandle = "@" + userNameData[1].split("·")[0];
      tweet.tweetDate = userNameData[1].split("·")[1];
      tweet.tweetText = $('div[data-testid="tweetText"] > span').text();
      tweet.tweetUrl = $('[data-testid="User-Name"] a').eq(2).attr("href");
      tweet.profilePicUrl = $("img").first().attr("src");

      if ($('[data-testid="videoPlayer"]').length > 0) {
        tweet.tweetImageOrPoster = $('[data-testid="videoPlayer"] video').attr(
          "poster",
        );
      } else {
        tweet.tweetImageOrPoster = $('[data-testid="tweetPhoto"] img').attr(
          "src",
        );
      }
      //TODO voy por aquí
      // tengo que generar un hash para el tweet en base a su url y guardarlo
      // also si en la configureta hay que guardar media, tengo que setear esa
      // columna con true
      try {

        const result = await db.run(
          `INSERT OR IGNORE INTO tweets (indexId, htmlContent, userName, twitterHandle, tweetDate, tweetImageOrPoster, tweetText, tweetUrl, tweetUrlHash, profilePicUrl, hasLocalMedia) 
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            tweet.indexId,
            tweet.htmlContent,
            tweet.userName,
            tweet.twitterHandle,
            tweet.tweetDate,
            tweet.tweetImageOrPoster,
            tweet.tweetText,
            tweet.tweetUrl,
            tweet.tweetUrlHash,
            tweet.profilePicUrl,
            tweet.hasLocalMedia ? 1 : 0
          ],
        );
        console.log("Insertion result:", result);
      }
      catch (error) {
        common.debugLog('storeTweets error: ', error);
      }
    }),
  );
};
export const deleteAllTweets = async () => {
  try {
    //TODO: has to delete all media from media/
    await runQuery("DELETE FROM tweets_tags");
    await runQuery("DELETE FROM tweets");
    return {
      success: true,
    };
  } catch (error) {
    console.error("deleteAllTweets: Error executing query:", error);
    return {
      success: false,
      errorMessage: `Could not delete all tweets: ${error}`,
    };
  }
};
export const setDb = (dbConnection) => {
  db = dbConnection;
};

export const closeDb = () => {
  if (db) {
    return db.close();
  }
};

export async function deleteTweetById(tweetId) {
  try {
    await runQuery("DELETE FROM tweets_tags WHERE tweetId = ?", [tweetId]);
    await runQuery("DELETE FROM tweets WHERE id = ?", [tweetId]);
    return true;
  } catch (error) {
    console.error("Error deleting tweet:", error);
    return false;
  }
}

export const updateTags = async (tweetId, newTags) => {
  try {
    // Remove all old tags for the tweet (start a transaction)
    await runQuery("DELETE FROM tweets_tags WHERE tweetId = ?", [tweetId]);

    // Process each tag in the newTags array
    for (let tag of newTags) {
      // Check if the tag exists in the tags table
      const getQueryResponse = await getQuery(
        "SELECT id FROM tags WHERE name = ?",
        [tag],
      );

      if (getQueryResponse.data) {
        // If the tag exists, insert the mapping into the tweets_tags table
        // TODO error check this runQuery call
        await runQuery(
          "INSERT INTO tweets_tags (tweetId, tagId) VALUES (?, ?)",
          [tweetId, getQueryResponse.data.id],
        );
        common.debugLog(
          process.env.DEBUG,
          `Added tag "${tag}" for tweetId: ${tweetId}`,
        );
      } else {
        // If the tag doesn't exist, insert it into the tags table
        const runQueryResponse = await runQuery(
          "INSERT INTO tags (name) VALUES (?)",
          [tag],
        );

        // Get the new tag id (from last inserted row)
        const newTagId = runQueryResponse.data.lastID;

        // Insert the relationship between tweet and tag into tweets_tags table
        // TODO error check this runQuery call
        await runQuery(
          "INSERT INTO tweets_tags (tweetId, tagId) VALUES (?, ?)",
          [tweetId, newTagId],
        );
        common.debugLog(
          process.env.DEBUG,
          `Added new tag "${tag}" for tweetId: ${tweetId}`,
        );
      }
    }
    return true;
  } catch (err) {
    console.error("Error updating tags:", err);
    return false;
  }
};

export const readAllTags = async () => {
  try {
    const getQueryResponse = await getAllQuery("SELECT name FROM tags");
    let tagNames = [];
    if (getQueryResponse.data) {
      tagNames = getQueryResponse.data.map((row) => row.name);
      return {
        success: true,
        rows: tagNames,
      };
    } else {
      return {
        success: false,
        errorMessage:
          "No tags came back from the DB, for some reason. Maybe there are none?",
      };
    }
  } catch (error) {
    common.debugLog(process.env.DEBUG, "readAllTags() error: ", error);
    return returnError(error.errorMessage);
  }
};

export const readAllTweets = async () => {
  const query = `
  SELECT 
      T.*, 
      IFNULL(GROUP_CONCAT(TAG.name), '') AS tags
  FROM 
      tweets T
  LEFT JOIN 
      tweets_tags TT ON T.id = TT.tweetId
  LEFT JOIN 
      tags TAG ON TT.tagId = TAG.id
  GROUP BY 
      T.id
  ORDER BY 
      T.indexId;
  `;

  try {
    const getQueryResponse = await getAllQuery(query);

    if (getQueryResponse.data) {
      getQueryResponse.data = getQueryResponse.data.map(row => {
        if (row.hasLocalMedia == 1) row.hasLocalMedia = true;
        else if (row.hasLocalMedia == 0) row.hasLocalMedia = false;
        return row;
      })
      return {
        success: true,
        rows: getQueryResponse.data,
      };
    } else {
      return {
        success: false,
        errorMessage: "No data came back from the DB, maybe db is empty?",
      };
    }
  } catch (error) {
    console.error("Error executing query:", error);
    return returnError(error.errorMessage);
  }
};

export const removeTagFromDB = async (tagName) => {
  // Queries
  const deleteFromTweetsTagsQuery = `DELETE FROM tweets_tags WHERE tagId = (SELECT id FROM tags WHERE name = ?)`;
  const deleteTagQuery = `DELETE FROM tags WHERE name = ?`;

  try {
    // Start by deleting all references to the tag from the tweets_tags table
    await runQuery(deleteFromTweetsTagsQuery, [tagName]);

    // Now delete the tag itself from the tags table
    await runQuery(deleteTagQuery, [tagName]);

    common.debugLog(
      process.env.DEBUG,
      `Successfully removed tag '${tagName}' from the system.`,
    );
    return returnSuccess();
  } catch (error) {
    console.error("Error removing tag from system:", error);
    return returnError(error.errorMessage);
  }
};
