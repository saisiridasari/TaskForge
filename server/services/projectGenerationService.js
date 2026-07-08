// server/services/projectGenerationService.js
//
// WHAT THIS IS FOR:
// The actual orchestration logic for Phase 2: call Gemini with the versioned
// prompt + schema, validate the response, retry with specific error feedback
// if invalid, and record the result (success or failure) as a
// ProjectGeneration document either way.
//
// This does NOT create Board/Task documents — that's a separate concern
// (next file), kept separate so this service only has one job: "get a
// validated plan, or a clear failure reason." Turning a validated plan into
// real database documents is a different responsibility.

const { ai, DEFAULT_MODEL } = require('../config/gemini');
const { buildProjectGeneratorPrompt, PROMPT_VERSION } = require('./prompts/projectGenerator.v1');
const { projectPlanGeminiSchema } = require('./schemas/projectPlan.geminiSchema');
const { validateProjectPlan } = require('./responseValidator');
const { recordAIUsage } = require('../middleware/aiRateLimit');
const ProjectGeneration = require('../models/ProjectGeneration');

const MAX_ATTEMPTS = 3; // 1 initial try + 2 retries with error feedback

/**
 * @param {object} params
 * @param {string} params.userId
 * @param {string} params.idea
 * @param {string[]} [params.techStack]
 * @returns {Promise<{ success: boolean, plan?: object, generation: object, errors?: string[] }>}
 */
async function generateValidatedProjectPlan({ userId, idea, techStack = [] }) {
  const generation = await ProjectGeneration.create({
    user: userId,
    idea,
    promptVersion: PROMPT_VERSION,
    modelVersion: DEFAULT_MODEL,
    status: 'pending',
  });

  let previousErrors = [];
  let lastErrors = [];

  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
    const { systemInstruction, userPrompt } = buildProjectGeneratorPrompt({
      idea,
      techStack,
      previousErrors,
    });

    let response;
    try {
      response = await ai.models.generateContent({
        model: DEFAULT_MODEL,
        contents: userPrompt,
        config: {
          systemInstruction,
          responseMimeType: 'application/json',
          responseSchema: projectPlanGeminiSchema,
        },
      });
    } catch (err) {
      // A Gemini/network-level failure — not a validation failure — stop
      // retrying immediately, this won't fix itself by re-asking.
      generation.status = 'failed';
      generation.error = `Gemini call failed: ${err.message}`;
      generation.retryCount = attempt - 1;
      await generation.save();
      return { success: false, generation, errors: [generation.error] };
    }

    const usage = response.usageMetadata || {};
    await recordAIUsage(userId, {
      promptTokens: usage.promptTokenCount || 0,
      completionTokens: usage.candidatesTokenCount || 0,
    });

    let rawParsed;
    try {
      rawParsed = JSON.parse(response.text);
    } catch (err) {
      lastErrors = [`Response was not valid JSON: ${err.message}`];
      previousErrors = lastErrors;
      continue; // retry
    }

    const validation = validateProjectPlan(rawParsed);

    if (validation.success) {
      generation.status = 'completed';
      generation.rawOutput = validation.data;
      generation.retryCount = attempt - 1;
      await generation.save();
      return { success: true, plan: validation.data, generation };
    }

    lastErrors = validation.errors;
    previousErrors = validation.errors;
  }

  // Exhausted all attempts without valid output.
  generation.status = 'failed';
  generation.error = lastErrors.join('; ');
  generation.retryCount = MAX_ATTEMPTS - 1;
  await generation.save();
  return { success: false, generation, errors: lastErrors };
}

module.exports = { generateValidatedProjectPlan };