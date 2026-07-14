const PROMPT_VERSION = 'task-intelligence.v1';

const MODE_INSTRUCTIONS = {
  explain: `Explain what this task is asking for and why it matters in the context of the overall project. Be concrete — reference the actual project and board this task belongs to, not generic advice.`,
  code: `Generate starter code for this task. Use the project's tech stack if known. Include brief inline comments explaining key parts. This is a starting point for the developer, not a finished implementation — say so if anything is left incomplete on purpose.`,
  tests: `Generate a concrete set of test cases for this task (unit and/or integration, as appropriate). Cover the main success path and at least two realistic edge cases.`,
  estimate: `Give a realistic time estimate (in hours) to implement this task, with a short explanation of what drives that estimate (complexity, dependencies, unknowns).`,
  review: `Review this task from an implementation-risk perspective: likely bugs, edge cases worth handling, security considerations, and performance considerations. Be specific to this task, not a generic checklist.`,
  ask: `Answer the user's specific question about this task as directly and concretely as possible, using the context provided.`,
};

function formatTaskContext({ task, board, siblingTitles }) {
  const lines = [
    `Task: "${task.title}"`,
    `Description: ${task.description || '(no description provided)'}`,
    `Priority: ${task.priority}`,
    `Board: ${board ? board.name : '(unknown board)'}`,
  ];

  if (task.aiMetadata) {
    const meta = task.aiMetadata;
    if (meta.difficulty) lines.push(`Difficulty (1-5): ${meta.difficulty}`);
    if (meta.estimatedHours) lines.push(`Original estimated hours: ${meta.estimatedHours}`);
    if (meta.acceptanceCriteria?.length) {
      lines.push(`Acceptance criteria: ${meta.acceptanceCriteria.join('; ')}`);
    }
    if (meta.technical?.npmPackages?.length) {
      lines.push(`Known relevant packages: ${meta.technical.npmPackages.join(', ')}`);
    }
  }

  if (siblingTitles?.length) {
    lines.push(`Other tasks on the same board: ${siblingTitles.join(', ')}`);
  }

  return lines.join('\n');
}

/**
 * @param {object} params
 * @param {object} params.context - result of buildTaskContext() from taskContextAssembler.js
 * @param {string} params.mode - one of the MODE_INSTRUCTIONS keys
 * @param {string} [params.question] - required when mode === 'ask'
 * @returns {{ systemInstruction: string, userPrompt: string, promptVersion: string }}
 */
function buildTaskIntelligencePrompt({ context, mode, question }) {
  if (!MODE_INSTRUCTIONS[mode]) {
    throw new Error(`Unknown task intelligence mode: "${mode}"`);
  }
  if (mode === 'ask' && !question) {
    throw new Error('mode "ask" requires a question');
  }

  const systemInstruction = `You are an assistant embedded in a project management tool, helping a developer understand and work on a specific task. Be concrete and specific to the task given — never generic boilerplate advice. Keep responses focused; do not repeat the task description back verbatim before answering.`;

  const contextBlock = formatTaskContext(context);
  const instruction = MODE_INSTRUCTIONS[mode];
  const questionLine = mode === 'ask' ? `\n\nUser's question: "${question}"` : '';

  const userPrompt = `${contextBlock}\n\n${instruction}${questionLine}`;

  return { systemInstruction, userPrompt, promptVersion: PROMPT_VERSION };
}

module.exports = { buildTaskIntelligencePrompt, PROMPT_VERSION, MODE_INSTRUCTIONS };