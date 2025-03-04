const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');
require('dotenv').config(); // Load environment variables

const router = express.Router();

// Middleware to check API key
function authenticate(req, res, next) {
    const apiKey = req.query.key;
    if (apiKey && apiKey === process.env.API_KEY) {
        next();
    } else {
        res.status(403).json({ error: "Forbidden: Invalid API Key" });
    }
}

// Function to query all tables in the database
function getAllData(db, callback) {
    let query = "SELECT name FROM sqlite_master WHERE type='table';";
    db.all(query, [], (err, tables) => {
        if (err) {
            return callback(err);
        }

        let results = {};
        let remainingTables = tables.length;

        tables.forEach((table) => {
            let tableName = table.name;
            db.all(`SELECT * FROM "${tableName}";`, [], (err, rows) => {
                if (err) {
                    return callback(err);
                }
                results[tableName] = rows;
                remainingTables -= 1;
                
                if (remainingTables === 0) {
                    callback(null, results);
                }
            });
        });

        if (tables.length === 0) {
            callback(null, results);
        }
    });
}

// API route to access all data in the SQLite database
router.get('/application', authenticate, (req, res) => {
    const dbPath = path.join(__dirname, '../storage', 'database.sqlite');

    // Connect to the SQLite database
    let db = new sqlite3.Database(dbPath, (err) => {
        if (err) {
            return res.status(500).json({ error: "Database connection failed" });
        }
    });

    // Query all data from all tables
    getAllData(db, (err, data) => {
        if (err) {
            return res.status(500).json({ error: "Query execution failed", details: err.message });
        }
        res.json(data);
    });

    // Close the database connection
    db.close((err) => {
        if (err) {
            log.error(err.message);
        }
    });
});

module.exports = router;
