// server/middleware/aiRateLimit.js
//
// WHAT THIS IS FOR:
// Caps how much Gemini usage one user can rack up per month, using the
// AIUsage model. Two pieces:
//   1. `aiRateLimit` — mount on every /api/ai/* route (after `protect`).
//      Blocks the request BEFORE it reaches Gemini if the user is already
//      over their monthly cap. This is what actually protects your bill.
//   2. `recordAIUsage` — NOT a middleware, a plain function. Call it from
//      inside a controller after a successful Gemini call, passing the
//      token counts Gemini's response reports, so usage actually accumulates.
//
// Limits are read from env vars so you can tune them without touching code:
//   AI_MONTHLY_REQUEST_LIMIT (default 500)
//   AI_MONTHLY_TOKEN_LIMIT   (default 1,000,000)

const AIUsage = require('../models/AIUsage');

const MONTHLY_REQUEST_LIMIT = parseInt(process.env.AI_MONTHLY_REQUEST_LIMIT || '500', 10);
const MONTHLY_TOKEN_LIMIT = parseInt(process.env.AI_MONTHLY_TOKEN_LIMIT || '1000000', 10);

function currentPeriod() {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
}

// Mount AFTER `protect` on every /api/ai/* route.
const aiRateLimit = async (req, res, next) => {
  try {
    const period = currentPeriod();

    let usage = await AIUsage.findOne({ user: req.user._id, period });
    if (!usage) {
      usage = await AIUsage.create({ user: req.user._id, period });
    }

    if (usage.requestCount >= MONTHLY_REQUEST_LIMIT) {
      return res.status(429).json({
        message: `Monthly AI request limit reached (${MONTHLY_REQUEST_LIMIT} requests). Resets next month.`,
      });
    }

    if (usage.totalTokens >= MONTHLY_TOKEN_LIMIT) {
      return res.status(429).json({
        message: `Monthly AI token budget reached. Resets next month.`,
      });
    }

    next();
  } catch (err) {
    console.error('AI rate limit check failed:', err);
    return res.status(500).json({ message: 'Error checking AI usage limits' });
  }
};

// Call from a controller AFTER a successful Gemini call. Pass the token
// counts from the response so usage actually accumulates over time.
// (Log `response.usageMetadata` once from a real call to confirm the exact
// field names your SDK version returns — they're typically
// promptTokenCount / candidatesTokenCount / totalTokenCount.)
async function recordAIUsage(userId, { promptTokens = 0, completionTokens = 0 } = {}) {
  const period = currentPeriod();
  const totalTokens = promptTokens + completionTokens;

  await AIUsage.findOneAndUpdate(
    { user: userId, period },
    {
      $inc: { promptTokens, completionTokens, totalTokens, requestCount: 1 },
      $set: { lastUsedAt: new Date() },
    },
    { upsert: true, new: true }
  );
}

module.exports = { aiRateLimit, recordAIUsage };