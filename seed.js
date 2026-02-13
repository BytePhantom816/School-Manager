const db = require('./db');
const bcrypt = require('bcryptjs');

async function runQuery(sql, params = []) {
    return new Promise((resolve, reject) => {
        db.run(sql, params, function (err) {
            if (err) reject(err);
            else resolve(this);
        });
    });
}

async function seed() {
    console.log('Starting Database Re-Seeding...');

    const headPassword = await bcrypt.hash('PHANTOMBYTE@123', 10);
    const defaultPassword = await bcrypt.hash('password123', 10);

    // 1. Clean Slate
    const tables = ['permissions', 'complaints', 'students', 'classes', 'users'];
    for (const table of tables) {
        await runQuery(`DROP TABLE IF EXISTS ${table}`);
    }

    // 2. Re-Create Tables
    await runQuery(`CREATE TABLE users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        username TEXT UNIQUE NOT NULL,
        password_hash TEXT NOT NULL,
        role TEXT NOT NULL CHECK(role IN ('HEAD', 'ADMIN', 'CLASS_TEACHER', 'ROAMING_TEACHER')),
        full_name TEXT NOT NULL,
        assigned_class_id INTEGER
    )`);

    await runQuery(`CREATE TABLE classes (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT UNIQUE NOT NULL,
        teacher_id INTEGER,
        FOREIGN KEY (teacher_id) REFERENCES users(id)
    )`);

    await runQuery(`CREATE TABLE students (
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

    await runQuery(`CREATE TABLE permissions (
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

    await runQuery(`CREATE TABLE complaints (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        student_id INTEGER,
        reporter_id INTEGER NOT NULL,
        description TEXT NOT NULL,
        status TEXT DEFAULT 'PENDING',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (student_id) REFERENCES students(id),
        FOREIGN KEY (reporter_id) REFERENCES users(id)
    )`);

    console.log('Table structure recreated.');

    // 3. Essential Users
    await runQuery(`INSERT INTO users (username, password_hash, role, full_name) VALUES (?, ?, ?, ?)`,
        ['Abbas', headPassword, 'HEAD', 'Abbas (Head)']);
    await runQuery(`INSERT INTO users (username, password_hash, role, full_name) VALUES (?, ?, ?, ?)`,
        ['admin', defaultPassword, 'ADMIN', 'System Admin']);

    console.log('Head and Admin accounts created.');

    // 4. Create Classes with Teachers and Students
    const sections = ['A', 'B'];
    const houses = ['RED', 'GREEN', 'BLUE', 'YELLOW'];
    let studentCount = 0;

    for (let grade = 1; grade <= 10; grade++) {
        for (const section of sections) {
            const className = `${grade}-${section}`;

            // a. Create a Teacher for this class
            const teacherUsername = `teacher${grade}${section.toLowerCase()}`;
            const teacherName = `Sir ${grade}-${section}`;
            const userResult = await runQuery(
                `INSERT INTO users (username, password_hash, role, full_name) VALUES (?, ?, ?, ?)`,
                [teacherUsername, defaultPassword, 'CLASS_TEACHER', teacherName]
            );
            const teacherId = userResult.lastID;

            // b. Create the Class and assign the teacher
            const classResult = await runQuery(
                `INSERT INTO classes (name, teacher_id) VALUES (?, ?)`,
                [className, teacherId]
            );
            const classId = classResult.lastID;

            // Update user with class assignment
            await runQuery(`UPDATE users SET assigned_class_id = ? WHERE id = ?`, [classId, teacherId]);

            // c. Create 10 Students for this class
            for (let s = 1; s <= 10; s++) {
                studentCount++;
                const studentName = `Student ${studentCount} (Class ${className})`;
                const rollNo = `${grade}${section}${s.toString().padStart(2, '0')}`;
                const house = houses[Math.floor(Math.random() * houses.length)];

                const studentIdNumber = `ST${grade}${section}${s.toString().padStart(3, '0')}`;

                await runQuery(
                    `INSERT INTO students (name, student_id_number, roll_no, gr_no, dob, house, class_section_id) VALUES (?, ?, ?, ?, ?, ?, ?)`,
                    [studentName, studentIdNumber, rollNo, `GR-${1000 + studentCount}`, '2010-01-01', house, classId]
                );
            }
            console.log(`Class ${className} initialized with teacher and 10 students.`);
        }
    }

    console.log('--- SEEDING COMPLETE ---');
    console.log(`Total Classes: ${10 * 2}`);
    console.log(`Total Teachers: ${10 * 2}`);
    console.log(`Total Students: ${studentCount}`);
    process.exit(0);
}

seed().catch(err => {
    console.error('Seeding Failed:', err);
    process.exit(1);
});
