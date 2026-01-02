const Resume = require('../models/Resume');
const axios = require('axios');
async function callGemini(resume, job) {
  const prompt = `Analyze this resume against the job description. 
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
    const res = await axios.post(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${process.env.GEMINI_API_KEY}`,
      { contents: [{ parts: [{ text: prompt }] }] }
    );

    let text = res.data.candidates[0].content.parts[0].text;
    
    // Markdown hatane ke liye
    const cleanJson = text.replace(/```json|```/g, "").trim();
    return JSON.parse(cleanJson);
  } catch (error) {
    console.error("Gemini Error:", error.response?.data || error.message);
    return {
      score: 0,
      atsScore: 0,
      suggestions: ["Error connecting to AI"],
      corrected: "AI could not process this request. Check API Key."
    };
  }
}
async function callGemini(resume, job) {
  const prompt = `
Compare Resume with Job Description.
Return JSON only:

{
  "score": number,
  "atsScore": number,
  "suggestions": [],
  "corrected": ""
}

Resume:
${resume}

Job Description:
${job}
  `;

  const res = await axios.post(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${process.env.GEMINI_KEY}`,
    { contents: [{ parts: [{ text: prompt }] }] }
  );

  let text = res.data.candidates[0].content.parts[0].text;

  try {
    return JSON.parse(text);
  } catch {
    return {
      score: 70,
      atsScore: 65,
      suggestions: ['Improve keywords', 'Match job skills'],
      corrected: resume
    };
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
    console.error(e);
    return { message: 'Server Error' };
  }
};

exports.getHistory = async (req, res) => {
  const data = await Resume.find({ userId: req.user.id });
  res.json(data);
};
