const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.resolve(__dirname, 'school.db');
const db = new sqlite3.Database(dbPath);

console.log("Opening DB at:", dbPath);

db.serialize(() => {
    console.log("Checking Permissions Table (Last 5)...");
    db.all("SELECT * FROM permissions ORDER BY id DESC LIMIT 5", (err, rows) => {
        if (err) {
            console.error("Error reading permissions:", err);
        } else {
            console.log("Permissions Data:", JSON.stringify(rows, null, 2));
        }
    });

    console.log("Current Server Time (UTC):", new Date().toISOString());
    console.log("Current Server Time (Local):", new Date().toString());
});

db.close();
