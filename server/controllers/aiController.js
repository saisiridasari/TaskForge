// server/controllers/aiController.js
//
// WHAT THIS IS FOR:
// `pingAI` is a throwaway proof-of-life endpoint — NOT a real feature. Its
// only job is to confirm, before we build anything real: (1) the Gemini
// client connects, (2) responseSchema-constrained structured output actually
// comes back as valid JSON, (3) your API key/model access works.
//
// Note the schema here is a tiny hand-written one, deliberately NOT the real
// projectPlan schema — if something breaks, you want to know whether it's
// "Gemini/SDK connectivity" or "our complex schema," not both at once.
//
// Once this is confirmed working, `generateProject` gets added to this same
// file as the real Phase 2 feature (next session) — it reuses this same
// `ai`/`DEFAULT_MODEL` import, just with the real schema + the validator +
// a retry loop instead of this inline one-shot call.

const { ai, DEFAULT_MODEL } = require('../config/gemini');
const { recordAIUsage } = require('../middleware/aiRateLimit');
const { generateValidatedProjectPlan } = require('../services/projectGenerationService');
const { createProjectFromPlan } = require('../services/projectPlanWriter');

const pingSchema = {
  type: 'object',
  properties: {
    message: { type: 'string' },
    receivedPrompt: { type: 'string' },
  },
  required: ['message', 'receivedPrompt'],
};

// POST /api/ai/ping   body (optional): { "prompt": "..." }
const pingAI = async (req, res) => {
  try {
    const prompt =
      req.body.prompt || 'Say hello, and repeat back the prompt you received.';

    const response = await ai.models.generateContent({
      model: DEFAULT_MODEL,
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
        responseSchema: pingSchema,
      },
    });

    const parsed = JSON.parse(response.text);

    const usage = response.usageMetadata || {};
    await recordAIUsage(req.user._id, {
      promptTokens: usage.promptTokenCount || 0,
      completionTokens: usage.candidatesTokenCount || 0,
    });

    return res.json({
      ok: true,
      model: DEFAULT_MODEL,
      result: parsed,
    });
  } catch (err) {
    console.error('AI ping failed:', err);
    return res.status(500).json({
      ok: false,
      message: 'AI ping failed — check GEMINI_API_KEY and server logs',
      error: err.message,
    });
  }
};

// POST /api/ai/projects/generate   body: { "idea": "...", "techStack": ["React", "Express"] }
//
// Synchronous for now (see Phase 2 notes — async/queued generation is a
// later upgrade once you know generation is slow enough to need it).
const generateProject = async (req, res) => {
  try {
    const { idea, techStack } = req.body;

    if (!idea || typeof idea !== 'string' || idea.trim().length < 5) {
      return res.status(400).json({ message: 'Please provide a project idea (at least a few words).' });
    }

    const result = await generateValidatedProjectPlan({
      userId: req.user._id,
      idea: idea.trim(),
      techStack: Array.isArray(techStack) ? techStack : [],
    });

    if (!result.success) {
      // Valid, handled failure — Gemini/validation couldn't produce usable
      // output after retries. Not a 500: this is an expected failure mode,
      // not a bug, so respond with something the frontend can show the user.
      return res.status(422).json({
        message: 'AI could not generate a valid project plan. Try rephrasing your idea.',
        errors: result.errors,
        generationId: result.generation._id,
      });
    }

    const { project, boards, tasks } = await createProjectFromPlan({
      plan: result.plan,
      userId: req.user._id,
      generationId: result.generation._id,
    });

    result.generation.project = project._id;
    await result.generation.save();

    // TODO: reuse your existing logActivity helper here for an
    // 'ai_project_generated' entry (extend the Activity model's actionType
    // enum first) — matching how boardController/taskController already
    // log activity after their own writes.

    return res.status(201).json({
      ok: true,
      generationId: result.generation._id,
      project,
      boards,
      taskCount: tasks.length,
    });
  } catch (err) {
    console.error('AI project generation failed:', err);
    return res.status(500).json({
      message: 'AI project generation failed — check server logs',
      error: err.message,
    });
  }
};

module.exports = { pingAI, generateProject };