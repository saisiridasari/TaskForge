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