const Resume = require('../models/Resume');
const axios = require('axios');

async function callGemini(resume, job) {
  const apiKey = process.env.GEMINI_API_KEY; 
  
  if (!apiKey) {
    console.error("ERROR: GEMINI_API_KEY missing!");
    return {
      score: 0,
      atsScore: 0,
      suggestions: ["Backend Config Error: Key Missing"],
      corrected: "API Key is not configured on the server."
    };
  }

  // Prompt ko thoda aur sakht kiya hai taaki sirf JSON mile
  const prompt = `Analyze this resume against the job description. 
  Return ONLY a valid JSON object. No intro text.
  {
    "score": 85,
    "atsScore": 80,
    "suggestions": ["skill 1", "skill 2"],
    "corrected": "detailed feedback"
  }
  Resume: ${resume}
  JD: ${job}`;

  try {
    // UPDATED URL: v1beta ki jagah v1 aur gemini-1.5-flash ka stable path
    const res = await axios.post(
      `https://generativelanguage.googleapis.com/v1/models/gemini-1.5-flash:generateContent?key=${apiKey}`,
      { contents: [{ parts: [{ text: prompt }] }] }
    );

    const candidates = res.data?.candidates;
    if (!candidates || candidates.length === 0) {
      throw new Error("No response from AI model.");
    }

    let aiText = candidates[0].content.parts[0].text;
    
    // Clean Markdown
    const cleanJsonText = aiText.replace(/```json|```/g, "").trim();
    
    try {
      return JSON.parse(cleanJsonText);
    } catch (parseError) {
      return {
        score: 60,
        atsScore: 60,
        suggestions: ["Structure analysis failed, but AI responded."],
        corrected: aiText.substring(0, 500)
      };
    }

  } catch (error) {
    // Agar v1 bhi fail ho (kuch regions mein), toh fallback to gemini-pro on v1beta
    console.error("Gemini v1 failed, trying fallback...");
    try {
        const fallbackRes = await axios.post(
            `https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${apiKey}`,
            { contents: [{ parts: [{ text: prompt }] }] }
        );
        let aiText = fallbackRes.data.candidates[0].content.parts[0].text;
        const cleanJsonText = aiText.replace(/```json|```/g, "").trim();
        return JSON.parse(cleanJsonText);
    } catch (fallbackError) {
        const errorMsg = fallbackError.response?.data?.error?.message || fallbackError.message;
        return {
            score: 0,
            atsScore: 0,
            suggestions: ["API Error: " + errorMsg],
            corrected: "Failed to connect to AI. Please verify model availability in your region."
        };
    }
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
    console.error("Controller Error:", e);
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