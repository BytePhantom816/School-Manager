const express = require('express');
const router = express.Router();
const db = require('../db');
const { authenticateToken } = require('../auth');

router.use(authenticateToken);

// Generate Unique Code (Helper)
function generateCode() {
    return Math.random().toString(36).substring(2, 8).toUpperCase();
}

// GET ALL PERMISSIONS (With limits/filters)
router.get('/', (req, res) => {
    // Admins, Head, and Teachers can view permissions
    if (!['ADMIN', 'HEAD', 'CLASS_TEACHER', 'ROAMING_TEACHER'].includes(req.user.role)) {
        return res.status(403).json({ error: 'Unauthorized access' });
    }

    // Default: Get last 100 permissions
    const sql = `
        SELECT p.*, s.name as student_name, s.roll_no, c.name as class_name
        FROM permissions p
        JOIN students s ON p.student_id = s.id
        JOIN classes c ON s.class_section_id = c.id
        ORDER BY p.created_at DESC
        LIMIT 100
    `;

    db.all(sql, [], (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(rows);
    });
});


// ISSUE PERMISSION (Staff Only)
router.post('/issue', (req, res) => {
    console.log('DEBUG: Received Issue Pass Request:', req.body);
    const { student_id, reason, destination, duration_minutes, type } = req.body;
    const issuer_id = req.user.id;
    console.log('DEBUG: Issuer ID:', issuer_id, 'Role:', req.user.role);

    // Head, Admin, and Teachers can issue passes
    if (!['ADMIN', 'HEAD', 'CLASS_TEACHER', 'ROAMING_TEACHER'].includes(req.user.role)) {
        console.log('DEBUG: Unauthorized issuance attempt by:', req.user.role);
        return res.status(403).json({ error: 'Unauthorized to issue permissions' });
    }

    db.get('SELECT id FROM students WHERE id = ?', [student_id], (err, row) => {
        if (err || !row) {
            console.log('DEBUG: Student not found or DB error:', err);
            return res.status(404).json({ error: 'Student not found' });
        }

        const code = generateCode();
        const valid_until = new Date(Date.now() + duration_minutes * 60000).toISOString();
        const permType = type || 'STANDARD';

        console.log('DEBUG: Inserting permission:', { code, student_id, issuer_id, valid_until });

        db.run(`INSERT INTO permissions (code, student_id, issuer_id, reason, destination, valid_until, type) VALUES (?, ?, ?, ?, ?, ?, ?)`,
            [code, student_id, issuer_id, reason, destination, valid_until, permType],
            function (err) {
                if (err) {
                    console.error('DEBUG: Insert Error:', err);
                    return res.status(500).json({ error: err.message });
                }
                console.log('DEBUG: Permission issued with ID:', this.lastID);
                res.json({ id: this.lastID, code, valid_until });
            }
        );
    });
});

// CHECK PERMISSION BY STUDENT ID
router.get('/student/:studentId', (req, res) => {
    // All staff roles can check permissions
    if (!['ADMIN', 'HEAD', 'CLASS_TEACHER', 'ROAMING_TEACHER'].includes(req.user.role)) {
        return res.status(403).json({ error: 'Unauthorized to check permissions' });
    }

    const { studentId } = req.params;
    const now = new Date().toISOString();
    const sql = `
        SELECT p.*, s.name as student_name, s.roll_no, s.photo_url, c.name as class_name, u.full_name as issuer_name
        FROM permissions p
        JOIN students s ON p.student_id = s.id
        JOIN classes c ON s.class_section_id = c.id
        JOIN users u ON p.issuer_id = u.id
        WHERE p.student_id = ? AND p.status = 'ACTIVE' AND p.valid_until > ?
        ORDER BY p.valid_until DESC
        LIMIT 1
    `;

    db.get(sql, [studentId, now], (err, row) => {
        if (err) return res.status(500).json({ error: err.message });

        if (row) {
            res.json({
                hasPermission: true,
                permission: row
            });
        } else {
            res.json({
                hasPermission: false,
                message: 'No active permission found for this student'
            });
        }
    });
});

// CHECK PERMISSION (Roaming Teacher)
router.get('/check/:code', (req, res) => {
    // All staff roles can check codes
    if (!['ADMIN', 'HEAD', 'CLASS_TEACHER', 'ROAMING_TEACHER'].includes(req.user.role)) {
        return res.status(403).json({ error: 'Unauthorized to check codes' });
    }

    const { code } = req.params;
    const sql = `
    SELECT p.*, s.name as student_name, s.roll_no, s.photo_url, c.name as class_name, u.full_name as issuer_name
    FROM permissions p
    JOIN students s ON p.student_id = s.id
    JOIN classes c ON s.class_section_id = c.id
    JOIN users u ON p.issuer_id = u.id
    WHERE p.code = ?
  `;

    db.get(sql, [code], (err, row) => {
        if (err) return res.status(500).json({ error: err.message });
        if (!row) return res.status(404).json({ error: 'Code not found' });

        // Check expiry
        const now = new Date();
        const expiry = new Date(row.valid_until);
        const isExpired = now > expiry;

        // Auto-expire in status if needed, but for now just return flag
        res.json({ ...row, isExpired });
    });
});

// GET MY STUDENTS (For Class Teacher)
router.get('/my-students', (req, res) => {
    if (req.user.role !== 'CLASS_TEACHER' || !req.user.assigned_class_id) {
        return res.status(403).json({ error: 'Not a class teacher or no class assigned' });
    }

    db.all('SELECT * FROM students WHERE class_section_id = ?', [req.user.assigned_class_id], (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(rows);
    });
});

// GET ACTIVE PERMISSIONS (Global Monitoring)
router.get('/active', (req, res) => {
    // Admins, Head, and Teachers can see active passes
    if (!['ADMIN', 'HEAD', 'CLASS_TEACHER', 'ROAMING_TEACHER'].includes(req.user.role)) {
        return res.status(403).json({ error: 'Unauthorized access' });
    }

    const now = new Date().toISOString();
    const sql = `
        SELECT p.*, s.name as student_name, s.roll_no, c.name as class_name, u.full_name as issuer_name
        FROM permissions p
        JOIN students s ON p.student_id = s.id
        JOIN classes c ON s.class_section_id = c.id
        JOIN users u ON p.issuer_id = u.id
        WHERE p.valid_until > ?
        ORDER BY p.valid_until ASC
    `;

    db.all(sql, [now], (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(rows);
    });
});

// GET MY HISTORY (For Teacher Dashboard)
router.get('/my-issued', (req, res) => {
    db.all('SELECT * FROM permissions WHERE issuer_id = ? ORDER BY valid_until DESC LIMIT 50', [req.user.id], (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(rows);
    });
});

// END PERMISSION (Clear Monitoring)
router.post('/:id/end', (req, res) => {
    // Admins, Head, and Teachers can end passes
    if (!['ADMIN', 'HEAD', 'CLASS_TEACHER', 'ROAMING_TEACHER'].includes(req.user.role)) {
        return res.status(403).json({ error: 'Unauthorized' });
    }

    const permissionId = req.params.id;
    // We end it by setting valid_until to current time
    const now = new Date().toISOString();

    db.run('UPDATE permissions SET valid_until = ? WHERE id = ?', [now, permissionId], function (err) {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ success: true, message: 'Permission ended' });
    });
});

module.exports = router;
