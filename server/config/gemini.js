// server/config/gemini.js
//
// One configured Gemini client, exported once and reused everywhere —
// same pattern as config/cloudinary.js (one configured SDK instance,
// imported by whoever needs it, no re-initialization per request).
//
// Requires: npm install @google/genai
// Requires: GEMINI_API_KEY in your .env

const { GoogleGenAI } = require('@google/genai');

if (!process.env.GEMINI_API_KEY) {
  throw new Error(
    'GEMINI_API_KEY is not set. Get a free key at https://aistudio.google.com/apikey and add it to server/.env'
  );
}

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

// Centralizing model names here means switching tiers later is a one-line
// change in this file, not a find-and-replace across every controller.
//
// NOTE: verified against the public Gemini Developer API (v1beta) — these
// are the actual callable model ids, not Vertex/Enterprise-only names.
// If you ever get another 404 "model not found," run:
//   curl "https://generativelanguage.googleapis.com/v1beta/models?key=YOUR_KEY"
// and match a name from that list exactly.
const MODELS = {
  FLASH: 'gemini-2.5-flash', // default — cheap, fast, has a free tier
  FLASH_LITE: 'gemini-2.5-flash-lite', // cheapest, highest free-tier rate limit
  PRO: 'gemini-2.5-pro', // stronger reasoning, higher cost — use sparingly, only where quality clearly needs it
};

const DEFAULT_MODEL = MODELS.FLASH;

module.exports = { ai, MODELS, DEFAULT_MODEL };