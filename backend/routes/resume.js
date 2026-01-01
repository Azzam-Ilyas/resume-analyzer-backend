const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const multer = require('multer');
const pdfParse = require('pdf-parse');
const mammoth = require('mammoth');
const { analyzeResumeText, getHistory } = require('../controllers/resumeController');

// 1. Memory storage use karein (Vercel ke liye zaroori hai)
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

// TEXT ANALYZE
router.post('/analyze', auth, async (req, res) => {
  const data = await analyzeResumeText(req);
  res.json(data);
});

// FILE + JOB DESCRIPTION
router.post('/analyze-file', auth, upload.single('file'), async (req, res) => {
  try {
    const file = req.file;
    const jobDescription = req.body.jobDescription;

    if (!file || !jobDescription)
      return res.status(400).json({ message: 'Resume & Job Description required' });

    let resumeText = '';

    // 2. fs.readFileSync ki jagah seedha file.buffer use karein
    if (file.mimetype === 'application/pdf') {
      const pdfData = await pdfParse(file.buffer); 
      resumeText = pdfData.text;
    } else {
      // Mammoth ke liye bhi 'path' ki jagah 'buffer' provide karein
      const result = await mammoth.extractRawText({ buffer: file.buffer });
      resumeText = result.value;
    }

    // 3. fs.unlinkSync ki ab zaroorat nahi kyunki file disk par save hi nahi hui
    const result = await analyzeResumeText(req, resumeText, jobDescription);
    res.json(result);

  } catch (err) {
    console.error("Error details:", err);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

router.get('/', auth, getHistory);

module.exports = router;