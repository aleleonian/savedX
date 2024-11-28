const sqlite3 = require("sqlite3").verbose();
const { promisify } = require("util");
import { returnError, returnSuccess } from "./common";
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
        console.log("New database created.");
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
    console.log("Database file not found. Creating a new one...");

    try {
      const createDatabaseResult = await createDatabase(filePath);
      if (!createDatabaseResult.success) {
        return createDatabaseResult;
      } else db = createDatabaseResult.db;
      // Initialize schema

      await runQuery(`
      CREATE TABLE "tweets" (
        "id"	INTEGER,
        "indexId"	TEXT NOT NULL,
        "htmlContent"	TEXT NOT NULL,
        "userName"	TEXT,
        "twitterHandle"	INTEGER,
        "tweetText"	TEXT,
        "tweetUrl"	TEXT,
        "tweetImageOrPoster"	TEXT,
        "tweetDate"	TEXT,
        "profilePicUrl"	TEXT NOT NULL,
        PRIMARY KEY("id" AUTOINCREMENT)
      )
      `);
      await runQuery(`
      CREATE TABLE "tags" (
        "id"	INTEGER NOT NULL,
        "name"	INTEGER NOT NULL UNIQUE,
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
      "TWITTER_BOT_EMAIL"	INTEGER NOT NULL
    )
     `);

      console.log("Database schema initialized.");

      await dbClose();

      return {
        success: true,
      };
    } catch (error) {
      console.log("Error creating DB file! ", error);
      return {
        success: false,
      };
    }
  }

  console.log("DB file exists.");

  return {
    success: true,
  };
};

export const openDb = (filePath) => {
  return new Promise(async (resolve, reject) => {
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
          // db.allAsync = promisify(db.all).bind(db);
          // db.dbRun = promisify(db.run).bind(db);
          // db.closeAsync = promisify(db.close.bind(db));
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
  await runQuery(`CREATE TABLE IF NOT EXISTS tweets (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        indexId TEXT,
        htmlContent TEXT
      )`);

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
          "poster"
        );
      } else {
        tweet.tweetImageOrPoster = $('[data-testid="tweetPhoto"] img').attr(
          "src"
        );
      }
      await db.run(
        `INSERT INTO tweets (indexId, htmlContent, userName, twitterHandle, tweetDate, tweetImageOrPoster, tweetText, tweetUrl, profilePicUrl ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          tweet.indexId,
          tweet.htmlContent,
          tweet.userName,
          tweet.twitterHandle,
          tweet.tweetDate,
          tweet.tweetImageOrPoster,
          tweet.tweetText,
          tweet.tweetUrl,
          tweet.profilePicUrl,
        ]
      );
    })
  );
};
export const deleteTweets = async (tweetArray) => {
  const query = `DELETE FROM TWEETS`;
  try {
    await runQuery(query);
    return {
      success: true,
    };
  } catch (error) {
    console.error("deleteTweets: Error executing query:", error);
    return {
      success: false,
      errorMessage: `Could not delete tweets: ${error}`,
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

// TODO deprecated
export const getXCredentials = async () => {
  console.log("getXCredentials()");
  const query = "SELECT * FROM users";
  try {
    const getQueryResponse = await getQuery(query);
    if (!getQueryResponse.data) return false;
    return returnSuccess(getQueryResponse.data);
  } catch (error) {
    console.error("Error executing query:", error);
    return false;
  }
};

export const updateTags = async (tweetId, newTags) => {
  try {
    // Remove all old tags for the tweet (start a transaction)
    await runQuery("DELETE FROM tweets_tags WHERE tweetId = ?", [tweetId]);

    // Process each tag in the newTags array
    for (let tag of newTags) {
      // Check if the tag exists in the tags table
      const getQueryResponse = await getQuery(
        "SELECT id FROM tags WHERE name = ?",
        [tag]
      );

      if (getQueryResponse.data) {
        // If the tag exists, insert the mapping into the tweets_tags table
        // TODO error check this runQuery call
        await runQuery(
          "INSERT INTO tweets_tags (tweetId, tagId) VALUES (?, ?)",
          [tweetId, getQueryResponse.data.id]
        );
        console.log(`Added tag "${tag}" for tweetId: ${tweetId}`);
      } else {
        // If the tag doesn't exist, insert it into the tags table
        const runQueryResponse = await runQuery(
          "INSERT INTO tags (name) VALUES (?)",
          [tag]
        );

        // Get the new tag id (from last inserted row)
        const newTagId = runQueryResponse.data.lastID;

        // Insert the relationship between tweet and tag into tweets_tags table
        // TODO error check this runQuery call
        await runQuery(
          "INSERT INTO tweets_tags (tweetId, tagId) VALUES (?, ?)",
          [tweetId, newTagId]
        );
        console.log(`Added new tag "${tag}" for tweetId: ${tweetId}`);
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
    console.log("readAllTags() error: ", error);
    return {
      success: false,
      errorMessage: error,
    };
  }
};

export const readAllTweets = async () => {
  const query = `
  SELECT 
      T.*, 
      IFNULL(GROUP_CONCAT(TAG.name), '[]') AS tags
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
    return {
      success: false,
      errorMessage: `Could not read tweets: ${error}`,
    };
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

    console.log(`Successfully removed tag '${tagName}' from the system.`);
    return {
      success: true,
      errorMessage: "👍🏼",
    };
  } catch (error) {
    console.error("Error removing tag from system:", error);
    return {
      success: false,
      errorMessage: error,
    };
  }
};
