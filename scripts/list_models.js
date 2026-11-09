const { GoogleGenAI } = require('@google/genai');

require('dotenv').config({ path: '.env.local' });

const geminiApiKey = process.env.GEMINI_API_KEY;
if (!geminiApiKey) throw new Error('GEMINI_API_KEY não configurada.');
const ai = new GoogleGenAI({ apiKey: geminiApiKey });

async function listModels() {
  try {
    const response = await ai.models.list();
    console.log(JSON.stringify(response, null, 2));
  } catch (e) {
    console.error("Error:", e);
  }
}

listModels();
