const { GoogleGenAI } = require('@google/genai');

if (!process.env.GEMINI_API_KEY) {
  throw new Error(
    'GEMINI_API_KEY is not set. Get a free key at https://aistudio.google.com/apikey and add it to server/.env'
  );
}

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

const MODELS = {
  FLASH: 'gemini-2.5-flash', 
  FLASH_LITE: 'gemini-2.5-flash-lite', 
  PRO: 'gemini-2.5-pro', 
};

const DEFAULT_MODEL = MODELS.FLASH;

module.exports = { ai, MODELS, DEFAULT_MODEL };