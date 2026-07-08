// server/services/schemas/projectPlan.geminiSchema.js
//
// WHAT THIS IS FOR:
// Gemini's `responseSchema` config needs a plain JSON-Schema-shaped object
// (type: 'object', properties: {...}, etc.) — it can't accept a Zod schema
// directly. This file is that plain-object version, kept in sync BY HAND
// with server/services/schemas/projectPlan.schema.js (the Zod one).
//
// KNOWN TECH DEBT: two schemas describing the same shape is duplication.
// A library like `zod-to-json-schema` could generate this automatically
// from the Zod file instead. Deliberately not doing that yet — get the
// simple, obviously-correct version working first, automate later if the
// duplication becomes a real maintenance problem (i.e. you keep forgetting
// to update one when you change the other).
//
// Field-for-field, this must match projectPlan.schema.js. If you add a
// field to one, add it to the other in the same commit.

const taskGeminiSchema = {
  type: 'object',
  properties: {
    localId: { type: 'string' },
    title: { type: 'string' },
    description: { type: 'string' },
    acceptanceCriteria: { type: 'array', items: { type: 'string' } },
    priority: { type: 'string', enum: ['low', 'medium', 'high'] },
    estimatedHours: { type: 'number' },
    difficulty: { type: 'integer' },
    dependencies: { type: 'array', items: { type: 'string' } },
    technical: {
      type: 'object',
      properties: {
        requiredApis: { type: 'array', items: { type: 'string' } },
        dbCollections: { type: 'array', items: { type: 'string' } },
        envVars: { type: 'array', items: { type: 'string' } },
        npmPackages: { type: 'array', items: { type: 'string' } },
        filesToCreate: { type: 'array', items: { type: 'string' } },
      },
    },
    git: {
      type: 'object',
      properties: {
        suggestedBranch: { type: 'string' },
        suggestedCommitMessages: { type: 'array', items: { type: 'string' } },
      },
    },
    testingChecklist: { type: 'array', items: { type: 'string' } },
    deploymentNotes: { type: 'string' },
    docReferences: { type: 'array', items: { type: 'string' } },
    risks: { type: 'array', items: { type: 'string' } },
    futureImprovements: { type: 'array', items: { type: 'string' } },
  },
  required: ['localId', 'title', 'description', 'priority', 'estimatedHours', 'difficulty'],
};

const boardGeminiSchema = {
  type: 'object',
  properties: {
    name: { type: 'string' },
    order: { type: 'integer' },
    tasks: { type: 'array', items: taskGeminiSchema },
  },
  required: ['name', 'order', 'tasks'],
};

const projectPlanGeminiSchema = {
  type: 'object',
  properties: {
    projectSummary: {
      type: 'object',
      properties: {
        title: { type: 'string' },
        description: { type: 'string' },
        techStack: { type: 'array', items: { type: 'string' } },
      },
      required: ['title', 'description', 'techStack'],
    },
    boards: { type: 'array', items: boardGeminiSchema },
  },
  required: ['projectSummary', 'boards'],
};

module.exports = { projectPlanGeminiSchema };