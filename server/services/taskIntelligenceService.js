// server/services/taskIntelligenceService.js
//
// WHAT THIS IS FOR:
// The orchestration for Phase 3: build context, build the prompt, call
// Gemini (plain text this time — no schema validation needed, since these
// are explanations/code/prose, not structured data to write back to Mongo),
// and persist the exchange to TaskConversation so follow-up questions have
// history to draw on.
//
// NOTE ON OUTPUT: unlike Phase 2, there's no responseSchema/validator here.
// Explanations, generated code, and reviews are free-form text — validating
// "is this good code" the way we validate "is this a well-formed task list"
// isn't the same kind of problem, so it's out of scope for this file.

const { ai, DEFAULT_MODEL } = require('../config/gemini');
const { buildTaskContext } = require('./taskContextAssembler');
const { buildTaskIntelligencePrompt } = require('./prompts/taskIntelligence.v1');
const { recordAIUsage } = require('../middleware/aiRateLimit');
const TaskConversation = require('../models/TaskConversation');

const MAX_RAW_MESSAGES = 10; // trim + summarize once history exceeds this

/**
 * @param {object} params
 * @param {string} params.taskId
 * @param {string} params.userId
 * @param {string} params.mode - see taskIntelligence.v1.js MODE_INSTRUCTIONS
 * @param {string} [params.question] - required when mode === 'ask'
 * @returns {Promise<{ success: boolean, answer?: string, error?: string }>}
 */
async function askAboutTask({ taskId, userId, mode, question }) {
  const context = await buildTaskContext(taskId);
  if (!context) {
    return { success: false, error: 'Task not found' };
  }

  let conversation = await TaskConversation.findOne({ taskId, userId });
  if (!conversation) {
    conversation = await TaskConversation.create({ taskId, userId, messages: [] });
  }

  const { systemInstruction, userPrompt } = buildTaskIntelligencePrompt({
    context,
    mode,
    question,
  });

  // Fold in prior conversation, if any, so follow-up questions have memory.
  // Kept simple: a short recap block ahead of the current turn's prompt,
  // rather than a full multi-turn chat session — sufficient for a task-
  // scoped Q&A panel where history rarely runs deep.
  let conversationPrefix = '';
  if (conversation.summarizedContext) {
    conversationPrefix += `Earlier conversation summary: ${conversation.summarizedContext}\n\n`;
  }
  if (conversation.messages.length > 0) {
    const recap = conversation.messages
      .slice(-6) // last 6 turns is plenty of immediate context
      .map((m) => `${m.role === 'user' ? 'User' : 'Assistant'}: ${m.content}`)
      .join('\n');
    conversationPrefix += `Recent conversation:\n${recap}\n\n`;
  }

  const finalPrompt = conversationPrefix
    ? `${conversationPrefix}Current request:\n${userPrompt}`
    : userPrompt;

  let response;
  try {
    response = await ai.models.generateContent({
      model: DEFAULT_MODEL,
      contents: finalPrompt,
      config: { systemInstruction },
    });
  } catch (err) {
    return { success: false, error: `Gemini call failed: ${err.message}` };
  }

  const answer = response.text;

  const usage = response.usageMetadata || {};
  await recordAIUsage(userId, {
    promptTokens: usage.promptTokenCount || 0,
    completionTokens: usage.candidatesTokenCount || 0,
  });

  conversation.messages.push({ role: 'user', content: question || mode });
  conversation.messages.push({ role: 'assistant', content: answer });

  await maybeSummarize(conversation);
  await conversation.save();

  return { success: true, answer };
}

// If history is getting long, compress the oldest messages into a rolling
// summary and trim the raw list — keeps prompt size bounded as a task
// accumulates a longer Q&A history over time (see Phase 3 cost notes).
async function maybeSummarize(conversation) {
  if (conversation.messages.length <= MAX_RAW_MESSAGES) return;

  const toSummarize = conversation.messages.slice(0, conversation.messages.length - 6);
  const toKeep = conversation.messages.slice(-6);

  const summaryPrompt = `Summarize this conversation history in 2-3 sentences, preserving anything a future question might need to know:\n\n${toSummarize
    .map((m) => `${m.role}: ${m.content}`)
    .join('\n')}`;

  try {
    const summaryResponse = await ai.models.generateContent({
      model: DEFAULT_MODEL, // cheap Flash call is fine for summarization
      contents: summaryPrompt,
    });

    conversation.summarizedContext = conversation.summarizedContext
      ? `${conversation.summarizedContext} ${summaryResponse.text}`
      : summaryResponse.text;
    conversation.messages = toKeep;
  } catch (err) {
    // Summarization failing shouldn't break the actual Q&A response —
    // just skip trimming this time and try again once history grows more.
    console.error('Conversation summarization failed:', err.message);
  }
}

module.exports = { askAboutTask };