const axios = require('axios');

exports.callGemini = async (prompt) => {
  const key = process.env.GEMINI_API_KEY;
  if (!key) {
    // No API key: return empty to trigger fallback
    return '{}';
  }

  const model = 'gemini-2.5-pro';
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${key}`;
  const body = { contents: [{ parts: [{ text: prompt }] }] };

  try {
    const resp = await axios.post(url, body, { timeout: 60000 });
    const candidate = resp.data?.candidates?.[0];
    const text = candidate?.content?.[0]?.text || JSON.stringify(resp.data);
    return text;
  } catch (err) {
    console.error('Gemini call error', err.message);
    return '{}';
  }
};
