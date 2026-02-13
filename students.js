const express = require('express');
const router = express.Router();
const db = require('../db');
const { authenticateToken } = require('../auth');
const multer = require('multer');
const path = require('path');

const storage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, 'uploads/'),
    filename: (req, file, cb) => cb(null, Date.now() + path.extname(file.originalname))
});
const upload = multer({ storage });

router.use(authenticateToken);

// Get students by class
router.get('/class/:classId', (req, res) => {
    const classId = req.params.classId;

    // Authorization: Only teacher of this class, admin, or head
    if (req.user.role === 'CLASS_TEACHER' && req.user.assigned_class_id != classId) {
        return res.status(403).json({ error: 'Access denied' });
    }

    const sql = `
        SELECT s.*, c.name as class_name 
        FROM students s
        JOIN classes c ON s.class_section_id = c.id
        WHERE s.class_section_id = ? AND s.status = 'ACTIVE'
        ORDER BY s.name
    `;

    db.all(sql, [classId], (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(rows);
    });
});

// Global Student Search
router.get('/search', (req, res) => {
    const query = req.query.q;
    if (!query) return res.json([]);

    const sql = `
        SELECT s.*, c.name as class_name 
        FROM students s
        JOIN classes c ON s.class_section_id = c.id
        WHERE (s.name LIKE ? OR s.roll_no LIKE ? OR s.gr_no LIKE ? OR s.student_id_number LIKE ?)
        AND s.status = 'ACTIVE'
        LIMIT 10
    `;
    const searchTerm = `%${query}%`;
    db.all(sql, [searchTerm, searchTerm, searchTerm, searchTerm], (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(rows);
    });
});

router.post('/upload', upload.single('photo'), (req, res) => {
    if (!req.file) return res.status(400).json({ error: 'No file uploaded' });
    res.json({ photo_url: `/uploads/${req.file.filename}` });
});

// Get Single Student
router.get('/:id', (req, res) => {
    db.get('SELECT * FROM students WHERE id = ?', [req.params.id], (err, row) => {
        if (err) return res.status(500).json({ error: err.message });
        if (!row) return res.status(404).json({ error: 'Student not found' });
        res.json(row);
    });
});

// Update Student Details
router.put('/:id', (req, res) => {
    const studentId = req.params.id;
    const { name, student_id_number, roll_no, gr_no, dob, house, contact_number, address, photo_url } = req.body;

    const performUpdate = () => {
        const sql = `UPDATE students SET name = ?, student_id_number = ?, roll_no = ?, gr_no = ?, dob = ?, house = ?, contact_number = ?, address = ?, photo_url = ? WHERE id = ?`;
        db.run(sql, [name, student_id_number, roll_no, gr_no, dob || null, house, contact_number, address, photo_url, studentId], function (err) {
            if (err) return res.status(500).json({ error: err.message });
            res.json({ success: true, message: 'Student updated' });
        });
    };

    if (['ADMIN', 'HEAD'].includes(req.user.role)) {
        performUpdate();
    } else if (req.user.role === 'CLASS_TEACHER') {
        db.get('SELECT class_section_id FROM students WHERE id = ?', [studentId], (err, row) => {
            if (err || !row) return res.status(404).json({ error: 'Student not found' });
            if (row.class_section_id !== req.user.assigned_class_id) {
                return res.status(403).json({ error: 'Unauthorized to edit this student' });
            }
            performUpdate();
        });
    } else {
        res.status(403).json({ error: 'Unauthorized' });
    }
});

// Create New Student
router.post('/', (req, res) => {
    const { name, student_id_number, roll_no, gr_no, dob, house, contact_number, address, class_section_id, photo_url } = req.body;

    const performCreate = () => {
        const sql = `INSERT INTO students (name, student_id_number, roll_no, gr_no, dob, house, contact_number, address, class_section_id, photo_url) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;
        db.run(sql, [name, student_id_number, roll_no, gr_no, dob || null, house, contact_number, address, class_section_id, photo_url], function (err) {
            if (err) return res.status(500).json({ error: err.message });
            res.json({ success: true, id: this.lastID, message: 'Student created' });
        });
    };

    if (['ADMIN', 'HEAD'].includes(req.user.role)) {
        performCreate();
    } else if (req.user.role === 'CLASS_TEACHER') {
        if (req.user.assigned_class_id !== parseInt(class_section_id)) {
            return res.status(403).json({ error: 'Cannot add student to another class' });
        }
        performCreate();
    } else {
        res.status(403).json({ error: 'Unauthorized' });
    }
});

// Delete Student
router.delete('/:id', (req, res) => {
    const studentId = req.params.id;

    const performDelete = () => {
        // 1. Delete Dependencies (Permissions & Complaints)
        db.run('DELETE FROM permissions WHERE student_id = ?', [studentId], (err) => {
            if (err) console.error('Error clearing permissions:', err);

            db.run('DELETE FROM complaints WHERE student_id = ?', [studentId], (err) => {
                if (err) console.error('Error clearing complaints:', err);

                // 2. Delete Student
                db.run('DELETE FROM students WHERE id = ?', [studentId], function (err) {
                    if (err) return res.status(500).json({ error: err.message });
                    res.json({ success: true, message: 'Student deleted' });
                });
            });
        });
    };

    if (['ADMIN', 'HEAD'].includes(req.user.role)) {
        performDelete();
    } else if (req.user.role === 'CLASS_TEACHER') {
        db.get('SELECT class_section_id FROM students WHERE id = ?', [studentId], (err, row) => {
            if (err || !row) return res.status(404).json({ error: 'Student not found' });
            if (row.class_section_id !== req.user.assigned_class_id) {
                return res.status(403).json({ error: 'Unauthorized to delete this student' });
            }
            performDelete();
        });
    } else {
        res.status(403).json({ error: 'Unauthorized' });
    }
});

// Lookup Student by ID Number (with Permission Status)
router.get('/lookup/:idNumber', (req, res) => {
    const idNumber = req.params.idNumber;

    // First get student details
    const studentSql = `
        SELECT s.*, c.name as class_name 
        FROM students s
        JOIN classes c ON s.class_section_id = c.id
        WHERE s.student_id_number = ? AND s.status = 'ACTIVE'
    `;

    db.get(studentSql, [idNumber], (err, student) => {
        if (err) return res.status(500).json({ error: err.message });
        if (!student) return res.status(404).json({ error: 'Student not found' });

        const now = new Date().toISOString();
        // Then get latest active permission
        const permSql = `
            SELECT p.*, u.full_name as issuer_name
            FROM permissions p
            JOIN users u ON p.issuer_id = u.id
            WHERE p.student_id = ? AND p.status = 'ACTIVE' AND p.valid_until > ?
            ORDER BY p.valid_until DESC
            LIMIT 1
        `;

        db.get(permSql, [student.id, now], (err, permission) => {
            if (err) return res.status(500).json({ error: err.message });

            res.json({
                student,
                hasPermission: !!permission,
                permission: permission || null
            });
        });
    });
});

module.exports = router;
