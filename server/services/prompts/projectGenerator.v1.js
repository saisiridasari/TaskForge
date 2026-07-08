// server/services/prompts/projectGenerator.v1.js
//
// WHAT THIS IS FOR:
// The actual instructions sent to Gemini for Phase 2. Split into two parts:
//   - SYSTEM_INSTRUCTION: stable rules that don't change per-request (Gemini
//     can cache this internally across calls, and it's what you'd edit to
//     tune output quality).
//   - userPrompt: the per-request part (the user's idea + tech stack).
//
// VERSIONING: this file is "v1" on purpose. When you want to tune the
// prompt later, create projectGenerator.v2.js rather than editing this one
// in place — so old ProjectGeneration records still show which exact
// prompt version produced them (see promptVersion field in that model).
//
// Also handles the RETRY case: if responseValidator.js rejects Gemini's
// first attempt, the controller calls this again with `previousErrors`,
// which appends a correction block telling Gemini exactly what was wrong.

const PROMPT_VERSION = 'project-generator.v1';

const SYSTEM_INSTRUCTION = `You are a senior software project planner. Given a short description of a software project, generate a complete, realistic project plan broken into boards and tasks.

Rules you MUST follow:
- Boards should represent logical phases (e.g. Planning, Backend, Frontend, Database, Authentication, Testing, Deployment) — choose boards that fit the actual project, not a fixed generic list.
- Each task must have a unique "localId" (short string like "t1", "t2") used ONLY to express dependencies within this same output. Never invent IDs that reference tasks outside this output.
- "priority" must be exactly one of: low, medium, high. No other values, ever — not "critical", not "urgent".
- "estimatedHours" must be a realistic number between 0.5 and 80.
- "difficulty" is an integer from 1 (trivial) to 5 (very hard).
- "dependencies" must only reference localId values that exist elsewhere in this same output. A task must never list itself as a dependency.
- Only include npm packages, APIs, and environment variables that are realistic and genuinely necessary for the given tech stack — do not invent packages that don't exist.
- Keep descriptions concrete and specific to this project, not generic boilerplate text.
- Respond ONLY with JSON matching the provided schema. No prose, no markdown fences, no commentary before or after the JSON.`;

/**
 * @param {object} params
 * @param {string} params.idea - the user's project description
 * @param {string[]} [params.techStack] - optional preferred tech stack
 * @param {string[]} [params.previousErrors] - validation errors from a prior failed attempt, if this is a retry
 * @returns {{ systemInstruction: string, userPrompt: string, promptVersion: string }}
 */
function buildProjectGeneratorPrompt({ idea, techStack = [], previousErrors = [] }) {
  const techStackLine = techStack.length
    ? `Preferred tech stack: ${techStack.join(', ')}.`
    : 'No specific tech stack was given — infer a sensible modern stack from the idea.';

  let userPrompt = `Project idea: "${idea}"\n${techStackLine}\n\nGenerate the full project plan now.`;

  if (previousErrors.length > 0) {
    userPrompt += `\n\nYour previous attempt was invalid for these reasons — fix ALL of them in this attempt:\n${previousErrors
      .map((e) => `- ${e}`)
      .join('\n')}`;
  }

  return { systemInstruction: SYSTEM_INSTRUCTION, userPrompt, promptVersion: PROMPT_VERSION };
}

module.exports = { buildProjectGeneratorPrompt, PROMPT_VERSION };