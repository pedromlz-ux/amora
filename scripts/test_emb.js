const { GoogleGenAI } = require('@google/genai');

require('dotenv').config({ path: '.env.local' });
const geminiApiKey = process.env.GEMINI_API_KEY;
const ai = new GoogleGenAI({ apiKey: geminiApiKey });

async function testEmbedding() {
  try {
    const response = await ai.models.embedContent({
      model: 'gemini-embedding-2',
      contents: "Olá, o que é néfron?",
      config: { outputDimensionality: 768 }
    });
    console.log("Embedding generated successfully!");
    console.log("Values length:", response.embeddings[0].values.length);
  } catch (e) {
    console.error("Error:", e);
  }
}

testEmbedding();
