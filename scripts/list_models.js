const { GoogleGenAI } = require('@google/genai');

const geminiApiKey = "AIzaSyAAWT1D0RLwjxoVnB4aar7EMrubHUBzKaI";
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
