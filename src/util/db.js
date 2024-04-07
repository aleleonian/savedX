const sqlite3 = require('sqlite3').verbose();
const { promisify } = require('util');
let db;

export const openDb = (filePath) => {
    return new Promise((resolve, reject) => {
        try {
            db = new sqlite3.Database(filePath, (err) => {
                if (err) {
                    console.error('Error opening database:', err);
                    resolve(false); // Database opening failed, resolve with false
                } else {
                    console.log('Database opened successfully');
                    db.allAsync = promisify(db.all).bind(db);
                    db.dbRun = promisify(db.run).bind(db);
                    resolve(true); // Database opened successfully, resolve with true
                }
            });
        } catch (err) {
            // File doesn't exist, handle the error
            console.error('File does not exist:', err);
            resolve(false); // File does not exist, resolve with false
        }
    });
}

export const storeTweets = async (tweetArray) => {
    await db.dbRun(`CREATE TABLE IF NOT EXISTS tweets (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        indexId TEXT,
        htmlContent TEXT
      )`);

    await Promise.all(tweetArray.map(async (tweet) => {
        await db.run(`INSERT INTO tweets (indexId, htmlContent) VALUES (?, ?)`, [tweet.indexId, tweet.htmlContent]);
    }));

    // tweetArray.forEach(tweet => {
    //     db.run(`INSERT INTO tweets (indexId, htmlContent) VALUES (?, ?)`, [tweet.indexId, tweet.htmlContent], function (err) {
    //         if (err) {
    //             return console.error(err.message);
    //         }
    //         console.log(`A row has been inserted with id ${this.lastID}`);
    //     });
    // });
}
export const setDb = (dbConnection) => {
    db = dbConnection;
}

export const closeDb = () => {
    return db.close();
}

export const getXCredentials = async () => {
    console.log("getXCredentials()");
    const query = 'SELECT * FROM users';
    try {
        const rows = await db.allAsync(query)
        console.log("rows->", rows)
        if (rows.length < 1) return false;
        return rows[0];
    }
    catch (error) {
        console.error('Error executing query:', error);
        return false;
    }
}

