const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const bcrypt = require('bcryptjs');

const dbPath = path.join(__dirname, 'users.db');
const db = new sqlite3.Database(dbPath);

db.serialize(() => {
  db.run(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT,
      email TEXT UNIQUE,
      password TEXT,
      role TEXT,
      points INTEGER DEFAULT 0,
      isVerified INTEGER DEFAULT 0
    )
  `);
});

const registerUser = (name, email, password, role) => {
  return new Promise((resolve, reject) => {
    bcrypt.hash(password, 10, (err, hash) => {
      if (err) return reject(err);
      db.run('INSERT INTO users (name, email, password, role, isVerified, points) VALUES (?, ?, ?, ?, 0, 0)', [name, email, hash, role], function(err) {
        if (err) return reject(err);
        resolve(this.lastID);
      });
    });
  });
};

const verifyUser = (email) => {
  return new Promise((resolve, reject) => {
    db.run('UPDATE users SET isVerified = 1 WHERE email = ?', [email], function(err) {
      if (err) return reject(err);
      resolve(this.changes);
    });
  });
};

const getUserByEmail = (email) => {
  return new Promise((resolve, reject) => {
    db.get('SELECT * FROM users WHERE email = ?', [email], (err, row) => {
      if (err) return reject(err);
      resolve(row);
    });
  });
};

const checkPassword = (password, hash) => {
  return new Promise((resolve, reject) => {
    bcrypt.compare(password, hash, (err, res) => {
      if (err) return reject(err);
      resolve(res);
    });
  });
};

const getAllUsers = () => {
  return new Promise((resolve, reject) => {
    db.all('SELECT name, email, role, isVerified, points FROM users', (err, rows) => {
      if (err) return reject(err);
      resolve(rows);
    });
  });
};

const updatePassword = (email, newPassword) => {
  return new Promise((resolve, reject) => {
    bcrypt.hash(newPassword, 10, (err, hash) => {
      if (err) return reject(err);
      db.run('UPDATE users SET password = ? WHERE email = ?', [hash, email], function(err) {
        if (err) return reject(err);
        resolve(this.changes);
      });
    });
  });
};

const addPoints = (email, points) => {
  return new Promise((resolve, reject) => {
    db.run('UPDATE users SET points = points + ? WHERE email = ?', [points, email], function(err) {
      if (err) return reject(err);
      resolve(this.changes);
    });
  });
};

const updateName = (email, newName) => {
  return new Promise((resolve, reject) => {
    db.run('UPDATE users SET name = ? WHERE email = ?', [newName, email], function(err) {
      if (err) return reject(err);
      resolve(this.changes);
    });
  });
};

module.exports = {
  registerUser,
  verifyUser,
  getUserByEmail,
  checkPassword,
  getAllUsers,
  updatePassword,
  addPoints,
  updateName
};
