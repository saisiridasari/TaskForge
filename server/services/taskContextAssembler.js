// server/services/taskContextAssembler.js
//
// WHAT THIS IS FOR:
// One shared piece of logic that builds "everything Gemini needs to know"
// about a task, reused across every Phase 3 question type (explain, generate
// code, generate tests, estimate, etc.) rather than duplicating context-
// building logic per feature.
//
// DELIBERATE SCOPE LIMIT (see Phase 3 notes): context is capped, not
// unbounded. As projects grow, sending every sibling task's full description
// would blow past reasonable token budgets fast. Priority order below:
//   1. The task's own full data (always included)
//   2. Its own aiMetadata, if it has any (AI-generated tasks only)
//   3. Sibling task TITLES ONLY within the same board (not full descriptions)
//   4. Project-level summary (title, description, tech stack) — not injected
//      here directly; the Project document doesn't store tech stack outside
//      an AI-generated project's ProjectGeneration record, so callers that
//      need it should pass it in separately if relevant.
//
// Not every question needs every layer — see server/services/prompts/
// taskIntelligence.v1.js for how each question type uses this.

const Task = require('../models/Task');
const Board = require('../models/Board');

const MAX_SIBLING_TITLES = 15; // hard cap — don't let one huge board balloon the prompt

/**
 * @param {string} taskId
 * @returns {Promise<{ task: object, board: object, siblingTitles: string[] } | null>}
 */
async function buildTaskContext(taskId) {
  const task = await Task.findById(taskId).lean();
  if (!task) return null;

  const board = await Board.findById(task.boardId).lean();

  const siblings = await Task.find({
    boardId: task.boardId,
    _id: { $ne: task._id },
  })
    .select('title')
    .limit(MAX_SIBLING_TITLES)
    .lean();

  return {
    task,
    board,
    siblingTitles: siblings.map((s) => s.title),
  };
}

module.exports = { buildTaskContext, MAX_SIBLING_TITLES };