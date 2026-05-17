const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const dbPath = path.join(__dirname, 'users.db');
const db = new sqlite3.Database(dbPath);

db.serialize(() => {
  db.run("ALTER TABLE users ADD COLUMN name TEXT", (err) => {
    if (err) console.log("Column name might already exist:", err.message);
    else console.log("Added column name");
  });
  db.run("ALTER TABLE users ADD COLUMN points INTEGER DEFAULT 0", (err) => {
    if (err) console.log("Column points might already exist:", err.message);
    else console.log("Added column points");
  });
});

db.close(() => console.log("Migration complete."));
