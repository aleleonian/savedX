const sqlite3 = require("sqlite3").verbose();
const { promisify } = require("util");
import cheerio from "cheerio";

let db;

const runQuery = (query, params = []) => {
  return new Promise((resolve, reject) => {
    db.run(query, params, function (err) {
      if (err) {
        reject(err);
      } else {
        resolve(this);
      }
    });
  });
};

const getQuery = (query, params = []) => {
  return new Promise((resolve, reject) => {
    db.get(query, params, (err, row) => {
      if (err) {
        reject(err);
      } else {
        resolve(row);
      }
    });
  });
};

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


  await Promise.all(
    tweetArray.map(async (tweet) => {
      const $ = cheerio.load(tweet.htmlContent);
      const userNameData = $('[data-testid="User-Name"]').text().split("@");
      tweet.userName = userNameData[0];
      tweet.twitterHandle = "@" + userNameData[1].split("·")[0];
      tweet.tweetDate = userNameData[1].split("·")[1];
      tweet.tweetText = $('div[data-testid="tweetText"] > span').text();
      tweet.tweetUrl = $('[data-testid="User-Name"] a').eq(2).attr('href');
      tweet.profilePicUrl = $('img').first().attr('src');

      if ($('[data-testid="videoPlayer"]').length > 0) {
        tweet.tweetImageOrPoster = $('[data-testid="videoPlayer"] video').attr('poster')
      }
      else {
        tweet.tweetImageOrPoster = $('[data-testid="tweetPhoto"] img').attr('src');
      }
      await db.run(`INSERT INTO tweets (indexId, htmlContent, userName, twitterHandle, tweetDate, tweetImageOrPoster, tweetText, tweetUrl, profilePicUrl ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`, [
        tweet.indexId,
        tweet.htmlContent,
        tweet.userName,
        tweet.twitterHandle,
        tweet.tweetDate,
        tweet.tweetImageOrPoster,
        tweet.tweetText,
        tweet.tweetUrl,
        tweet.profilePicUrl
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

export const updateTags = async (tweetId, newTags) => {
  try {
    // Remove all old tags for the tweet (start a transaction)
    await runQuery('DELETE FROM tweets_tags WHERE tweetId = ?', [tweetId]);

    // Process each tag in the newTags array
    for (let tag of newTags) {
      // Check if the tag exists in the tags table
      const row = await getQuery('SELECT id FROM tags WHERE name = ?', [tag]);

      if (row) {
        // If the tag exists, insert the mapping into the tweets_tags table
        await runQuery('INSERT INTO tweets_tags (tweetId, tagId) VALUES (?, ?)', [tweetId, row.id]);
        console.log(`Added tag "${tag}" for tweetId: ${tweetId}`);
      } else {
        // If the tag doesn't exist, insert it into the tags table
        const result = await runQuery('INSERT INTO tags (name) VALUES (?)', [tag]);

        // Get the new tag id (from last inserted row)
        const newTagId = result.lastID;

        // Insert the relationship between tweet and tag into tweets_tags table
        await runQuery('INSERT INTO tweets_tags (tweetId, tagId) VALUES (?, ?)', [tweetId, newTagId]);
        console.log(`Added new tag "${tag}" for tweetId: ${tweetId}`);
      }
    }
    return true;

  } catch (err) {
    console.error('Error updating tags:', err);
    return false;
  }
}

export const readAllTags = async () => {
  try {
    const rows = await db.allAsync('SELECT name FROM tags');
    console.log("tags->", rows);
    const tagNames = rows.map(row => row.name);
    return {
      success: true,
      rows: tagNames,
    }
  }
  catch (error) {
    console.log("readAllTags() error: ", error);
    return {
      success: false,
      errorMessage: error
    }
  }
}

export const readAllTweets = async () => {
  const query = `
  SELECT 
    T.*, 
    GROUP_CONCAT(TAG.name) AS tags
FROM 
    TWEETS T
LEFT JOIN 
    tweets_tags TT ON T.id = TT.tweetId
LEFT JOIN 
    tags TAG ON TT.tagId = TAG.id
GROUP BY 
    T.id
ORDER BY 
    T.indexId;

  `

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

export const removeTagFromDB = async (tagName) => {
  // Queries
  const deleteFromTweetsTagsQuery = `DELETE FROM tweets_tags WHERE tagId = (SELECT id FROM tags WHERE name = ?)`;
  const deleteTagQuery = `DELETE FROM tags WHERE name = ?`;

  try {
    // Start by deleting all references to the tag from the tweets_tags table
    await db.runAsync(deleteFromTweetsTagsQuery, [tagName]);

    // Now delete the tag itself from the tags table
    await db.runAsync(deleteTagQuery, [tagName]);

    console.log(`Successfully removed tag '${tagName}' from the system.`);
    return {
      success: true,
      errorMessage: '👍🏼'
    };;
  } catch (error) {
    console.error('Error removing tag from system:', error);
    return {
      success: false,
      errorMessage: error
    };
  }
};
