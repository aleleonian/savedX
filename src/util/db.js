const sqlite3 = require("sqlite3").verbose();
const { promisify } = require("util");
let db;

export const openDb = (filePath) => {
  return new Promise((resolve, reject) => {
    try {
      db = new sqlite3.Database(filePath, (err) => {
        if (err) {
          console.error("Error opening database:", err);
          resolve(false); // Database opening failed, resolve with false
        } else {
          console.log("Database opened successfully");
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

  await Promise.all(
    tweetArray.map(async (tweet) => {
      await db.run(`INSERT INTO tweets (indexId, htmlContent) VALUES (?, ?)`, [
        tweet.indexId,
        tweet.htmlContent,
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
  const query = `SELECT * FROM TWEETS`;
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
