require('dotenv').config();
const express = require('express');
const cors = require('cors');
const connectDB = require('./config/db');
const authRoutes = require('./routes/auth');
const resumeRoutes = require('./routes/resume');
const jobsRoutes = require('./routes/jobs');

const app = express();
app.use(cors());
app.use(express.json({ limit: '10mb' }));

connectDB();

app.use('/api/auth', authRoutes);
app.use('/api/resume', resumeRoutes);
app.use('/api/jobs', jobsRoutes);

app.get('/', (req, res) => res.json({ ok: true }));

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => console.log(`Server running on ${PORT}`));
