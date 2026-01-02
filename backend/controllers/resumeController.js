const Resume = require('../models/Resume');
const axios = require('axios');

async function callGemini(resume, job) {
  // 1. Variable check with fallback
  const apiKey = process.env.GEMINI_API_KEY; 
  
  if (!apiKey) {
    console.error("ERROR: GEMINI_API_KEY missing in environment variables!");
    return {
      score: 0,
      atsScore: 0,
      suggestions: ["Backend Config Error: Key Missing"],
      corrected: "API Key is not configured on the server. Please add GEMINI_API_KEY to Vercel settings."
    };
  }

  const prompt = `Analyze this resume against the job description. 
  Return ONLY a valid JSON object. Do not include any text before or after the JSON.
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
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`,
      { contents: [{ parts: [{ text: prompt }] }] }
    );

    // 2. Safely get the text response
    const candidates = res.data?.candidates;
    if (!candidates || candidates.length === 0) {
      throw new Error("No response from AI model.");
    }

    let aiText = candidates[0].content.parts[0].text;
    
    // 3. Clean JSON Markdown (```json ... ```)
    const cleanJsonText = aiText.replace(/```json|```/g, "").trim();
    
    // 4. Try to parse JSON
    try {
      return JSON.parse(cleanJsonText);
    } catch (parseError) {
      console.error("JSON Parse Error. Raw AI Text:", aiText);
      // Fallback if AI sends plain text instead of JSON
      return {
        score: 50,
        atsScore: 50,
        suggestions: ["Improve keywords"],
        corrected: aiText.substring(0, 500) // First 500 chars as feedback
      };
    }

  } catch (error) {
    const errorMsg = error.response?.data?.error?.message || error.message;
    console.error("Gemini API Error Detail:", errorMsg);
    
    return {
      score: 0,
      atsScore: 0,
      suggestions: ["API Error: " + errorMsg],
      corrected: "Failed to connect to AI. Please ensure your API key is active and has credits."
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

    const ai = await callGemini(resume, job);

    // AI result ko database ke liye validate karein
    const saved = await Resume.create({
      userId: req.user.id,
      originalText: resume,
      aiImprovedText: ai.corrected || "No feedback provided",
      aiScore: ai.score || 0,
      atsScore: ai.atsScore || 0,
      suggestions: Array.isArray(ai.suggestions) ? ai.suggestions : []
    });

    return { ai, resume: saved };

  } catch (e) {
    console.error("analyzeResumeText Controller Error:", e);
    return { message: 'Server Error during analysis' };
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