// server/services/projectPlanWriter.js
//
// WHAT THIS IS FOR:
// Takes a plan already validated by responseValidator.js and turns it into
// real MongoDB documents: one Project, several Boards, several Tasks per
// board — all tagged as AI-generated drafts for the user to review/edit.
//
// ASSUMPTIONS FLAGGED BELOW — verify against your actual Project model
// before running this, since I'm working from the handbook description,
// not the literal schema file:
//   1. Project fields: assumed `name`, `description`, `owner`, `members`
//      (members as [{ user, role }]). If your real field is `title` instead
//      of `name`, or members is shaped differently, adjust the object below.
//   2. Board fields: assumed `projectId`, `name`, `order` — matches the
//      "order = current count" pattern described in the handbook.
//   3. Task fields: assumed `projectId`, `boardId`, `title`, `description`,
//      `priority`, `order`, plus the new `aiMetadata` subdocument from
//      Phase 1. Adjust field names if your real Task model differs.
//
// TWO-PASS WRITE, on purpose:
//   Pass 1 creates every Task first (dependencies temporarily empty), and
//   builds a map of { localId -> real Mongo _id }.
//   Pass 2 goes back and fills in aiMetadata.dependencies using that map,
//   because a task's dependency might be created AFTER it (order in the
//   AI's output isn't guaranteed to be dependency-sorted).

const mongoose = require('mongoose');
const Project = require('../models/Project');
const Board = require('../models/Board');
const Task = require('../models/Task');

/**
 * @param {object} params
 * @param {object} params.plan - validated plan from responseValidator.js
 * @param {string} params.userId
 * @param {string} params.generationId - the ProjectGeneration._id this plan came from
 * @returns {Promise<{ project: object, boards: object[], tasks: object[] }>}
 */
async function createProjectFromPlan({ plan, userId, generationId }) {
  // --- Create the Project ---
  // Your schema caps title at 100 chars and description at 500 — truncating
  // here rather than letting Mongoose reject a well-formed AI response over
  // a length limit the AI has no way of knowing about.
  //
  // Note: ownership itself is tracked via the `owner` field above, not via
  // members[].role — that enum is only ['admin', 'manager', 'member'], with
  // no 'owner' value. The creator gets 'admin' here, the highest role that
  // actually exists in the members list.
  const project = await Project.create({
    title: plan.projectSummary.title.slice(0, 100),
    description: plan.projectSummary.description.slice(0, 500),
    owner: userId,
    members: [{ user: userId, role: 'admin' }],
  });

  const createdBoards = [];
  const createdTasks = [];
  const localIdToTaskId = new Map(); // "t1" -> real Mongo ObjectId

  // --- Pass 1: create every Board, then every Task within it ---
  for (const boardData of plan.boards) {
    const board = await Board.create({
      projectId: project._id,
      name: boardData.name,
      order: boardData.order,
    });
    createdBoards.push(board);

    let taskOrder = 0;
    for (const taskData of boardData.tasks) {
      const task = await Task.create({
        projectId: project._id,
        boardId: board._id,
        title: taskData.title,
        description: taskData.description,
        priority: taskData.priority,
        order: taskOrder++,
        aiMetadata: {
          generationId,
          difficulty: taskData.difficulty,
          estimatedHours: taskData.estimatedHours,
          technical: taskData.technical || {},
          git: taskData.git || {},
          testingChecklist: taskData.testingChecklist || [],
          deploymentNotes: taskData.deploymentNotes || '',
          docReferences: taskData.docReferences || [],
          risks: taskData.risks || [],
          futureImprovements: taskData.futureImprovements || [],
          acceptanceCriteria: taskData.acceptanceCriteria || [],
          dependencies: [], // resolved in pass 2
          isAiGenerated: true,
          reviewStatus: 'draft',
        },
      });

      createdTasks.push(task);
      localIdToTaskId.set(taskData.localId, task._id);
    }
  }

  // --- Pass 2: resolve dependencies now that every localId has a real _id ---
  // Build a lookup from the original plan so we know each task's declared
  // dependencies (localId strings) without re-parsing what we just created.
  const localIdToDependencies = new Map();
  for (const boardData of plan.boards) {
    for (const taskData of boardData.tasks) {
      localIdToDependencies.set(taskData.localId, taskData.dependencies || []);
    }
  }

  const updates = [];
  for (const [localId, taskId] of localIdToTaskId.entries()) {
    const depLocalIds = localIdToDependencies.get(localId) || [];
    const resolvedDependencyIds = depLocalIds
      .map((depLocalId) => localIdToTaskId.get(depLocalId))
      .filter(Boolean); // drop any that somehow didn't resolve

    if (resolvedDependencyIds.length > 0) {
      updates.push({
        updateOne: {
          filter: { _id: taskId },
          update: { $set: { 'aiMetadata.dependencies': resolvedDependencyIds } },
        },
      });
    }
  }

  if (updates.length > 0) {
    await Task.bulkWrite(updates);
  }

  return { project, boards: createdBoards, tasks: createdTasks };
}

module.exports = { createProjectFromPlan };