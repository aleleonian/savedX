const sqlite3 = require("sqlite3").verbose();
const { promisify } = require("util");
import cheerio from "cheerio";

let db;

export const openDb = (filePath) => {
  return new Promise((resolve, reject) => {
    try {
      db = new sqlite3.Database(filePath, (err) => {
        if (err) {
          console.error("Error opening database:", err);
          resolve(false); // Database opening failed, resolve with false
        } else {
          db.allAsync = promisify(db.all).bind(db);
          db.dbRun = promisify(db.run).bind(db);
          resolve(true); // Database opened successfully, resolve with true
        }
      });
    } catch (err) {
      // File doesn't exist, handle the error
      console.error("File does not exist:", err);
      resolve(false); // File does not exist, resolve with false
    }
  });
};

export const storeTweets = async (tweetArray) => {
  await db.dbRun(`CREATE TABLE IF NOT EXISTS tweets (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        indexId TEXT,
        htmlContent TEXT
      )`);

  //VOY POR ACÁ: TENGO QUE GUARDAR LOS TWEETS DE ESTA MANERA
  // $('[data-testid="User-Name"]').text(); <- this will return name, username and date all in one ine



  await Promise.all(
    tweetArray.map(async (tweet) => {
      const $ = cheerio.load(tweet.htmlContent);
      const userNameData = $('[data-testid="User-Name"]').text().split("@");
      tweet.userName = userNameData[0];
      tweet.twitterHandle = "@" + userNameData[1].split("·")[0];
      tweet.tweetDate = userNameData[1].split("·")[1];
      tweet.tweetText = $('div[data-testid="tweetText"] > span').text();
      tweet.tweetUrl = $('[data-testid="User-Name"] a').eq(2).attr('href');

      if ($('[data-testid="videoPlayer"]').length > 0) {
        tweet.tweetImageOrPoster = $('[data-testid="videoPlayer"] video').attr('poster')
      }
      else {
        tweet.tweetImageOrPoster = $('[data-testid="tweetPhoto"] img').attr('src');
      }
      await db.run(`INSERT INTO tweets (indexId, htmlContent, userName, twitterHandle, tweetDate, tweetImageOrPoster, tweetText, tweetUrl ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`, [
        tweet.indexId,
        tweet.htmlContent,
        tweet.userName,
        tweet.twitterHandle,
        tweet.tweetDate,
        tweet.tweetImageOrPoster,
        tweet.tweetText,
        tweet.tweetUrl
      ]);
    })
  );
};
export const deleteTweets = async (tweetArray) => {
  const query = `DELETE FROM TWEETS`;
  try {
    await db.allAsync(query);
    return {
      success: true,
    }
  } catch (error) {
    console.error("deleteTweets: Error executing query:", error);
    return {
      success: false,
      errorMessage: `Could not delete tweets: ${error}`
    };
  }
};
export const setDb = (dbConnection) => {
  db = dbConnection;
};

export const closeDb = () => {
  return db.close();
};

export const getXCredentials = async () => {
  console.log("getXCredentials()");
  const query = "SELECT * FROM users";
  try {
    const rows = await db.allAsync(query);
    if (rows.length < 1) return false;
    return rows[0];
  } catch (error) {
    console.error("Error executing query:", error);
    return false;
  }
};

export const readAllTweets = async () => {
  const query = `SELECT * FROM TWEETS ORDER BY indexId`;
  try {
    const rows = await db.allAsync(query);
    return {
      success: true,
      rows,
    }
  } catch (error) {
    console.error("Error executing query:", error);
    return {
      success: false,
      errorMessage: `Could not read tweets: ${error}`
    };
  }
};
