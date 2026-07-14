const mongoose = require('mongoose');
const Project = require('../models/Project');
const Board = require('../models/Board');
const Task = require('../models/Task');

const HOURS_PER_DAY = 6; // assumption: a realistic focused-work day, not 8 — tunable

function addDays(date, days) {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
}

function computeSchedule(plan, { hoursPerDay = HOURS_PER_DAY, startDate = new Date() } = {}) {
  const taskMap = new Map(); // localId -> { estimatedHours, dependencies }
  for (const board of plan.boards) {
    for (const t of board.tasks) {
      taskMap.set(t.localId, { estimatedHours: t.estimatedHours, dependencies: t.dependencies || [] });
    }
  }

  const dueDates = new Map(); // localId -> Date
  const visiting = new Set(); // cycle guard

  function resolve(localId) {
    if (dueDates.has(localId)) return dueDates.get(localId);
    if (visiting.has(localId)) return startDate; // shouldn't happen post-validation, but stay safe
    visiting.add(localId);

    const t = taskMap.get(localId);
    let earliestStart = startDate;
    for (const depId of t.dependencies) {
      if (taskMap.has(depId)) {
        const depDue = resolve(depId);
        if (depDue > earliestStart) earliestStart = depDue;
      }
    }

    const workDays = Math.max(1, Math.ceil(t.estimatedHours / hoursPerDay));
    const due = addDays(earliestStart, workDays);
    dueDates.set(localId, due);
    visiting.delete(localId);
    return due;
  }

  for (const localId of taskMap.keys()) resolve(localId);
  return dueDates;
}

/**
 * @param {object} params
 * @param {object} params.plan - validated plan from responseValidator.js
 * @param {string} params.userId
 * @param {string} params.generationId - the ProjectGeneration._id this plan came from
 * @param {string} [params.deadline] - optional project-level deadline (ISO date string), from the "Generate with AI" form
 * @returns {Promise<{ project: object, boards: object[], tasks: object[] }>}
 */
async function createProjectFromPlan({ plan, userId, generationId, deadline }) {

  const project = await Project.create({
    title: plan.projectSummary.title.slice(0, 100),
    description: plan.projectSummary.description.slice(0, 500),
    owner: userId,
    members: [{ user: userId, role: 'admin' }],
    ...(deadline ? { deadline } : {}),
  });

  const createdBoards = [];
  const createdTasks = [];
  const localIdToTaskId = new Map(); // "t1" -> real Mongo ObjectId

  const schedule = computeSchedule(plan);

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
        dueDate: schedule.get(taskData.localId), // NEW — derived from estimatedHours + dependencies
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