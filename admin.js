const express = require('express');
const router = express.Router();
const db = require('../db');
const { authenticateToken, SECRET_KEY } = require('../auth');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

router.use(authenticateToken);

// Middleware: Require ADMIN or HEAD
const requireAdminOrHead = (req, res, next) => {
    if (['ADMIN', 'HEAD'].includes(req.user.role)) next();
    else res.status(403).json({ error: 'Insufficient permissions' });
};

router.use(requireAdminOrHead);

// Get Users (Scoped by Role)
router.get('/users', (req, res) => {
    let sql = "SELECT id, username, role, full_name, assigned_class_id FROM users";
    let params = [];

    // HEAD sees everyone. ADMIN sees only Teachers.
    if (req.user.role === 'ADMIN') {
        sql += " WHERE role IN ('CLASS_TEACHER', 'ROAMING_TEACHER')"; // Only teachers
    } else {
        // HEAD request
        sql += " ORDER BY role";
    }

    db.all(sql, params, (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(rows);
    });
});

// Create User (Scoped)
router.post('/users', async (req, res) => {
    const { username, password, role, full_name } = req.body;
    if (!password) return res.status(400).json({ error: 'Password required' });

    // Hierarchy Check
    if (req.user.role === 'ADMIN') {
        if (role === 'HEAD' || role === 'ADMIN') {
            return res.status(403).json({ error: 'Admins can only create Teachers' });
        }
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    db.run('INSERT INTO users (username, password_hash, role, full_name) VALUES (?, ?, ?, ?)',
        [username, hashedPassword, role, full_name],
        function (err) {
            if (err) return res.status(500).json({ error: err.message });
            res.json({ id: this.lastID, username, role, full_name });
        }
    );
});

// Get/Create Classes (Shared)
router.get('/classes', (req, res) => {
    db.all('SELECT c.id, c.name, u.full_name as teacher_name FROM classes c LEFT JOIN users u ON c.teacher_id = u.id', [], (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(rows);
    });
});

router.post('/classes', (req, res) => {
    const { name, teacher_id } = req.body;
    db.run('INSERT INTO classes (name, teacher_id) VALUES (?, ?)', [name, teacher_id], function (err) {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ id: this.lastID, name, teacher_id });
    });
});

// Assign Teacher to Class
router.put('/classes/:id/assign', (req, res) => {
    const classId = req.params.id;
    const { teacher_id } = req.body;

    if (!teacher_id) return res.status(400).json({ error: 'Teacher ID required' });

    // We do this in series to keep indices clean, though a single transaction would be better
    // 1. Nullify this teacher's current class elsewhere
    db.run('UPDATE classes SET teacher_id = NULL WHERE teacher_id = ?', [teacher_id], (err) => {
        if (err) return res.status(500).json({ error: err.message });

        // 2. Nullify this class's current teacher elsewhere
        db.run('UPDATE users SET assigned_class_id = NULL WHERE assigned_class_id = ?', [classId], (err) => {
            if (err) return res.status(500).json({ error: err.message });

            // 3. Assign teacher to class
            db.run('UPDATE classes SET teacher_id = ? WHERE id = ?', [teacher_id, classId], (err) => {
                if (err) return res.status(500).json({ error: err.message });

                // 4. Update teacher profile
                db.run('UPDATE users SET assigned_class_id = ? WHERE id = ?', [classId, teacher_id], (err) => {
                    if (err) return res.status(500).json({ error: err.message });
                    res.json({ success: true });
                });
            });
        });
    });
});

// Delete Class (Safety Check: must be empty)
router.delete('/classes/:id', (req, res) => {
    const classId = req.params.id;

    // 1. Check if students exist in this class
    db.get('SELECT COUNT(*) as count FROM students WHERE class_section_id = ?', [classId], (err, row) => {
        if (err) return res.status(500).json({ error: err.message });
        if (row.count > 0) {
            return res.status(400).json({ error: 'Cannot delete class with existing students. Move or remove students first.' });
        }

        // 2. Nullify assigned_class_id for any teacher
        db.run('UPDATE users SET assigned_class_id = NULL WHERE assigned_class_id = ?', [classId], (err) => {
            if (err) return res.status(500).json({ error: err.message });

            // 3. Delete the class record
            db.run('DELETE FROM classes WHERE id = ?', [classId], (err) => {
                if (err) return res.status(500).json({ error: err.message });
                res.json({ success: true, message: 'Class deleted successfully' });
            });
        });
    });
});

// Update User (Hierarchy Protected)
router.put('/users/:id', async (req, res) => {
    const targetId = req.params.id;
    const { full_name, username, role } = req.body;

    // 1. Get Target User Role
    db.get('SELECT role FROM users WHERE id = ?', [targetId], async (err, targetUser) => {
        if (err) return res.status(500).json({ error: err.message });
        if (!targetUser) return res.status(404).json({ error: 'User not found' });

        // 2. Hierarchy Check
        if (req.user.role === 'ADMIN') {
            if (targetUser.role === 'HEAD' || targetUser.role === 'ADMIN') {
                return res.status(403).json({ error: 'Admins cannot edit other Admins or the Head' });
            }
            if (role === 'HEAD' || role === 'ADMIN') {
                return res.status(403).json({ error: 'Admins cannot promote to HEAD or ADMIN' });
            }
        }

        // 3. Update
        let sql = 'UPDATE users SET full_name = ?, username = ?, role = ?';
        let params = [full_name, username, role];

        if (req.body.password) {
            const hashedPassword = await bcrypt.hash(req.body.password, 10);
            sql += ', password_hash = ?';
            params.push(hashedPassword);
        }

        sql += ' WHERE id = ?';
        params.push(targetId);

        db.run(sql, params, (err) => {
            if (err) return res.status(500).json({ error: err.message });
            res.json({ success: true, message: 'User updated' });
        });
    });
});

// Delete User (Hierarchy Protected)
router.delete('/users/:id', async (req, res) => {
    const targetId = req.params.id;

    // 1. Get Target User Role
    db.get('SELECT role FROM users WHERE id = ?', [targetId], (err, targetUser) => {
        if (err) return res.status(500).json({ error: err.message });
        if (!targetUser) return res.status(404).json({ error: 'User not found' });

        // 2. Hierarchy Check
        if (req.user.role === 'ADMIN') {
            if (targetUser.role === 'HEAD' || targetUser.role === 'ADMIN') {
                return res.status(403).json({ error: 'Admins cannot delete other Admins or the Head' });
            }
        }

        // Head can delete anyone (except maybe themselves, but valid for now)

        // 3. Delete
        db.run('DELETE FROM users WHERE id = ?', [targetId], (err) => {
            if (err) return res.status(500).json({ error: err.message });
            res.json({ success: true, message: 'User deleted' });
        });
    });
});

// Get Students by Class ID
router.get('/classes/:id/students', (req, res) => {
    const classId = req.params.id;
    // Get Class Info
    db.get('SELECT c.name, u.full_name as teacher_name FROM classes c LEFT JOIN users u ON c.teacher_id = u.id WHERE c.id = ?', [classId], (err, classInfo) => {
        if (err) return res.status(500).json({ error: err.message });
        if (!classInfo) return res.status(404).json({ error: 'Class not found' });

        // Get Students
        db.all('SELECT * FROM students WHERE class_section_id = ?', [classId], (err, students) => {
            if (err) return res.status(500).json({ error: err.message });
            res.json({ classInfo, students });
        });
    });
});

// Impersonate User (Preview Mode)
router.post('/impersonate/:id', (req, res) => {
    const targetId = req.params.id;

    db.get('SELECT * FROM users WHERE id = ?', [targetId], (err, targetUser) => {
        if (err) return res.status(500).json({ error: err.message });
        if (!targetUser) return res.status(404).json({ error: 'User not found' });

        // Hierarchy Check
        if (req.user.role === 'ADMIN') {
            if (targetUser.role === 'HEAD' || targetUser.role === 'ADMIN') {
                return res.status(403).json({ error: 'Admins can only preview Teachers' });
            }
        }

        const token = jwt.sign(
            { id: targetUser.id, username: targetUser.username, role: targetUser.role, full_name: targetUser.full_name, assigned_class_id: targetUser.assigned_class_id },
            SECRET_KEY,
            { expiresIn: '1h' } // Short lived for preview
        );

        res.json({
            token,
            user: {
                id: targetUser.id,
                username: targetUser.username,
                role: targetUser.role,
                full_name: targetUser.full_name,
                assigned_class_id: targetUser.assigned_class_id
            }
        });
    });
});

module.exports = router;
