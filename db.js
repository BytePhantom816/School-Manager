const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.resolve(__dirname, 'school.db');

const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('Error opening database ' + dbPath + ': ' + err.message);
  } else {
    console.log('Connected to the SQLite database.');
  }
});

function initDb() {
  db.serialize(() => {
    // Users Table
    db.run(`CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      role TEXT NOT NULL CHECK(role IN ('HEAD', 'ADMIN', 'CLASS_TEACHER', 'ROAMING_TEACHER')),
      full_name TEXT NOT NULL,
      assigned_class_id INTEGER
    )`);

    // Classes Table
    db.run(`CREATE TABLE IF NOT EXISTS classes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL UNIQUE,
      teacher_id INTEGER,
      FOREIGN KEY (teacher_id) REFERENCES users(id)
    )`);

    // Students Table (Updated)
    db.run(`CREATE TABLE IF NOT EXISTS students (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      student_id_number TEXT UNIQUE NOT NULL,
      roll_no TEXT NOT NULL,
      gr_no TEXT,
      dob DATE,
      house TEXT CHECK(house IN ('RED', 'GREEN', 'BLUE', 'YELLOW', 'NONE')),
      contact_number TEXT,
      address TEXT,
      class_section_id INTEGER NOT NULL,
      photo_url TEXT,
      status TEXT DEFAULT 'ACTIVE',
      FOREIGN KEY (class_section_id) REFERENCES classes(id)
    )`);

    // Permissions Table
    db.run(`CREATE TABLE IF NOT EXISTS permissions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      code TEXT UNIQUE NOT NULL,
      student_id INTEGER NOT NULL,
      issuer_id INTEGER NOT NULL,
      reason TEXT,
      destination TEXT,
      valid_from DATETIME DEFAULT CURRENT_TIMESTAMP,
      valid_until DATETIME NOT NULL,
      status TEXT DEFAULT 'ACTIVE',
      type TEXT DEFAULT 'STANDARD',
      FOREIGN KEY (student_id) REFERENCES students(id),
      FOREIGN KEY (issuer_id) REFERENCES users(id)
    )`);

    // Complaints Table
    db.run(`CREATE TABLE IF NOT EXISTS complaints (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      student_id INTEGER,
      reporter_id INTEGER NOT NULL,
      description TEXT NOT NULL,
      status TEXT DEFAULT 'PENDING',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (student_id) REFERENCES students(id),
      FOREIGN KEY (reporter_id) REFERENCES users(id)
    )`);

    console.log('Database tables initialized.');
  });
}

// Initialize tables
initDb();

module.exports = db;
