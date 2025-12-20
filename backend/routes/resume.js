const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const fs = require('fs');
const multer = require('multer');
const pdfParse = require('pdf-parse');
const mammoth = require('mammoth');
const { analyzeResumeText, getHistory } = require('../controllers/resumeController');

const upload = multer({ dest: 'uploads/' });

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

    if (file.mimetype === 'application/pdf') {
      const buffer = fs.readFileSync(file.path);
      const pdfData = await pdfParse(buffer);
      resumeText = pdfData.text;
    } else {
      const result = await mammoth.extractRawText({ path: file.path });
      resumeText = result.value;
    }

    fs.unlinkSync(file.path);

    const result = await analyzeResumeText(req, resumeText, jobDescription);
    res.json(result);

  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

router.get('/', auth, getHistory);

module.exports = router;
