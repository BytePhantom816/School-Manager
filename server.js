const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const db = require('./db');

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());
app.use('/uploads', express.static('uploads'));

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/admin', require('./routes/admin'));
app.use('/api/permissions', require('./routes/permissions'));
app.use('/api/complaints', require('./routes/complaints'));
app.use('/api/students', require('./routes/students'));

// Basic Route
app.get('/', (req, res) => {
    res.send('School Permission API is running.');
});

// Start Server
app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});
