const Resume = require('../models/Resume');
const axios = require('axios');

// Sirf EK hi callGemini function rakhein jo latest model use kare
async function callGemini(resume, job) {
  const prompt = `Analyze this resume against the job description and give score according ot resume . 
  Return ONLY a valid JSON object with these exact keys:
  {
    "score": 85,
    "atsScore": 80,
    "suggestions": ["skill 1", "skill 2"],
    "corrected": "detailed feedback here"
  }
  Resume: ${resume}
  JD: ${job}`;

  try {
    // Variable name exact wahi rakhein jo Vercel settings mein hai (GEMINI_API_KEY)
    const apiKey = process.env.GEMINI_API_KEY; 
    
    const res = await axios.post(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`,
      { contents: [{ parts: [{ text: prompt }] }] }
    );

    let text = res.data.candidates[0].content.parts[0].text;
    
    // AI kabhi kabhi markdown (```json) bhejta hai, usay saaf karein
    const cleanJson = text.replace(/```json|```/g, "").trim();
    return JSON.parse(cleanJson);

  } catch (error) {
    console.error("Gemini API Error:", error.response?.data || error.message);
    // Error case mein default values bhejien taaki frontend crash na ho
    return {
      score: 0,
      atsScore: 0,
      suggestions: ["Check API Key or Connection"],
      corrected: "Error: AI analysis could not be completed at this moment."
    };
  }
}

exports.analyzeResumeText = async (req, resumeText, jobDescription) => {
  try {
    const resume = resumeText || req.body.text;
    const job = jobDescription || req.body.jobDescription;

    if (!resume || !job) {
       return { message: 'Missing resume text or job description' };
    }

    // AI Function Call
    const ai = await callGemini(resume, job);

    // Database mein save karein
    const saved = await Resume.create({
      userId: req.user.id,
      originalText: resume,
      aiImprovedText: ai.corrected,
      aiScore: ai.score,
      atsScore: ai.atsScore,
      suggestions: ai.suggestions
    });

    // Frontend ko data bhejien
    return { ai, resume: saved };

  } catch (e) {
    console.error("Controller Error:", e);
    return { message: 'Server Error' };
  }
};

exports.getHistory = async (req, res) => {
  try {
    const data = await Resume.find({ userId: req.user.id }).sort({ createdAt: -1 });
    res.json(data);
  } catch (err) {
    res.status(500).json({ message: "Error fetching history" });
  }
};