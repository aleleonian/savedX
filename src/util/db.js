const fs = require('fs');
const sqlite3 = require('sqlite3').verbose();
const { promisify } = require('util');

var db;

export const openDb = (filePath) => {
    return new Promise((resolve, reject) => {
        try {
            fs.accessSync(filePath, fs.constants.F_OK);
            db = new sqlite3.Database(filePath, (err) => {
                if (err) {
                    console.error('Error opening database:', err);
                    resolve(false); // Database opening failed, resolve with false
                } else {
                    console.log('Database opened successfully');
                    db.allAsync = promisify(db.all).bind(db);
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

