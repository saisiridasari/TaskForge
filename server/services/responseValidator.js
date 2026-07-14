const { projectPlanSchema } = require('./schemas/projectPlan.schema');

/**
 * @param {unknown} rawOutput - parsed JSON from Gemini (already JSON.parse'd)
 * @returns {{ success: boolean, data?: object, errors?: string[] }}
 */
function validateProjectPlan(rawOutput) {
  // --- Layer 1 + 2: schema + parse ---
  const parsed = projectPlanSchema.safeParse(rawOutput);

  if (!parsed.success) {
    const errors = parsed.error.issues.map(
      (issue) => `${issue.path.join('.')}: ${issue.message}`
    );
    return { success: false, errors };
  }

  const plan = parsed.data;
  const semanticErrors = [];

  const allLocalIds = new Set();
  const seenTitlesPerBoard = new Map(); // boardName -> Set(titles)

  for (const board of plan.boards) {
    const titleSet = new Set();
    for (const task of board.tasks) {
      if (allLocalIds.has(task.localId)) {
        semanticErrors.push(
          `Duplicate localId "${task.localId}" found across boards — each task needs a unique localId.`
        );
      }
      allLocalIds.add(task.localId);

      const titleKey = task.title.trim().toLowerCase();
      if (titleSet.has(titleKey)) {
        semanticErrors.push(
          `Duplicate task title "${task.title}" within board "${board.name}".`
        );
      }
      titleSet.add(titleKey);
    }
    seenTitlesPerBoard.set(board.name, titleSet);
  }

  // --- Layer 3 continued: dependencies must point at real localIds ---
  for (const board of plan.boards) {
    for (const task of board.tasks) {
      for (const depId of task.dependencies) {
        if (depId === task.localId) {
          semanticErrors.push(
            `Task "${task.title}" lists itself as a dependency.`
          );
        } else if (!allLocalIds.has(depId)) {
          semanticErrors.push(
            `Task "${task.title}" depends on localId "${depId}", which doesn't exist in this generation batch.`
          );
        }
      }
    }
  }

  if (semanticErrors.length > 0) {
    return { success: false, errors: semanticErrors };
  }

  return { success: true, data: plan };
}

module.exports = { validateProjectPlan };