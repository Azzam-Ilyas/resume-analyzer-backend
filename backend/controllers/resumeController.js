const Resume = require('../models/Resume');
const axios = require('axios');

async function callGemini(resume, job) {
  const apiKey = process.env.GEMINI_API_KEY; 
  
  if (!apiKey) {
    return {
      score: 0,
      suggestions: ["API Key Missing"],
      corrected: "Please add GEMINI_API_KEY to Vercel."
    };
  }

  const prompt = `Analyze this resume against the job description. 
  Return ONLY a valid JSON object.
  {
    "score": 85,
    "atsScore": 80,
    "suggestions": ["skill 1", "skill 2"],
    "corrected": "detailed feedback"
  }
  Resume: ${resume}
  JD: ${job}`;

  try {
    // 2026 Latest Stable Endpoint
    const res = await axios.post(
      `https://generativelanguage.googleapis.com/v1/models/gemini-1.5-flash:generateContent?key=${apiKey}`,
      { contents: [{ parts: [{ text: prompt }] }] }
    );

    if (res.data?.candidates?.[0]?.content?.parts?.[0]?.text) {
      let aiText = res.data.candidates[0].content.parts[0].text;
      const cleanJson = aiText.replace(/```json|```/g, "").trim();
      return JSON.parse(cleanJson);
    }
    
    throw new Error("Empty response from AI");

  } catch (error) {
    console.error("Gemini Error:", error.response?.data || error.message);
    
    // Agar flash fail ho, toh 1.5-pro try karein (Backup Plan)
    try {
      const backupRes = await axios.post(
        `https://generativelanguage.googleapis.com/v1/models/gemini-1.5-pro:generateContent?key=${apiKey}`,
        { contents: [{ parts: [{ text: prompt }] }] }
      );
      let aiText = backupRes.data.candidates[0].content.parts[0].text;
      return JSON.parse(aiText.replace(/```json|```/g, "").trim());
    } catch (err2) {
      return {
        score: 0,
        atsScore: 0,
        suggestions: ["Model Error: " + (err2.response?.data?.error?.message || "Version mismatch")],
        corrected: "Google has updated the model names. Please check your Google AI Studio for the latest available model."
      };
    }
  }
}

exports.analyzeResumeText = async (req, resumeText, jobDescription) => {
  try {
    const resume = resumeText || req.body.text;
    const job = jobDescription || req.body.jobDescription;

    const ai = await callGemini(resume, job);

    const saved = await Resume.create({
      userId: req.user.id,
      originalText: resume,
      aiImprovedText: ai.corrected,
      aiScore: ai.score,
      atsScore: ai.atsScore,
      suggestions: ai.suggestions
    });

    return { ai, resume: saved };
  } catch (e) {
    return { message: 'Server Error' };
  }
};

exports.getHistory = async (req, res) => {
  const data = await Resume.find({ userId: req.user.id }).sort({ createdAt: -1 });
  res.json(data);
};