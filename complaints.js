const express = require('express');
const router = express.Router();
const db = require('../db');
const { authenticateToken } = require('../auth');

router.use(authenticateToken);

// File a Complaint (Any Staff)
router.post('/', (req, res) => {
    const { student_id, description } = req.body;
    const reporter_id = req.user.id;

    // All staff can report
    if (!['ADMIN', 'HEAD', 'CLASS_TEACHER', 'ROAMING_TEACHER'].includes(req.user.role)) {
        return res.status(403).json({ error: 'Unauthorized' });
    }

    db.run(`INSERT INTO complaints (student_id, reporter_id, description) VALUES (?, ?, ?)`,
        [student_id || null, reporter_id, description],
        function (err) {
            if (err) return res.status(500).json({ error: err.message });
            res.json({ id: this.lastID, status: 'PENDING' });
        }
    );
});

// Get Complaints (Role-Based Filtering)
router.get('/', (req, res) => {
    let sql = `
        SELECT c.*, s.name as student_name, s.roll_no, u.full_name as reporter_name, cl.name as class_name
        FROM complaints c
        LEFT JOIN students s ON c.student_id = s.id
        LEFT JOIN classes cl ON s.class_section_id = cl.id
        JOIN users u ON c.reporter_id = u.id
    `;
    let params = [];

    // Filter for CLASS_TEACHER
    if (req.user.role === 'CLASS_TEACHER') {
        sql += ` WHERE s.class_section_id = ? `;
        params.push(req.user.assigned_class_id);
    }

    sql += ` ORDER BY c.created_at DESC `;

    db.all(sql, params, (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(rows);
    });
});

module.exports = router;
