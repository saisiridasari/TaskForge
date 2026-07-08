// server/services/schemas/projectPlan.schema.js
//
// WHAT THIS IS FOR:
// The exact shape we require Gemini's output to match, using Zod. This gets
// used two ways: (1) passed to Gemini as the responseSchema so the model is
// constrained at generation time, and (2) used again on our side with
// .safeParse() to verify the returned JSON actually matches before we trust
// it enough to write to MongoDB. Never skip step 2 even though step 1 makes
// violations rare — "rare" is not "never."
//
// Note: `priority` here is `low|medium|high` on purpose — that's your real
// Task.priority enum. AI-generated tasks and manually-created tasks share
// the same Task model, so this schema can't invent a 4th value ("critical")
// the rest of your app doesn't know about.

const { z } = require('zod');

const taskSchema = z.object({
  localId: z.string(), // batch-scoped id, used only to resolve `dependencies` below, remapped to a real Mongo _id after the Task documents are created
  title: z.string().min(1).max(200),
  description: z.string().min(1),
  acceptanceCriteria: z.array(z.string()).default([]),
  priority: z.enum(['low', 'medium', 'high']),
  estimatedHours: z.number().min(0.5).max(80),
  difficulty: z.number().int().min(1).max(5),
  dependencies: z.array(z.string()).default([]), // array of other tasks' localId
  technical: z
    .object({
      requiredApis: z.array(z.string()).default([]),
      dbCollections: z.array(z.string()).default([]),
      envVars: z.array(z.string()).default([]),
      npmPackages: z.array(z.string()).default([]),
      filesToCreate: z.array(z.string()).default([]),
    })
    .default({}),
  git: z
    .object({
      suggestedBranch: z.string().default(''),
      suggestedCommitMessages: z.array(z.string()).default([]),
    })
    .default({}),
  testingChecklist: z.array(z.string()).default([]),
  deploymentNotes: z.string().default(''),
  docReferences: z.array(z.string()).default([]),
  risks: z.array(z.string()).default([]),
  futureImprovements: z.array(z.string()).default([]),
});

const boardSchema = z.object({
  name: z.string().min(1).max(100),
  order: z.number().int().min(0),
  tasks: z.array(taskSchema).min(1), // a board with zero tasks isn't useful output
});

const projectPlanSchema = z.object({
  projectSummary: z.object({
    title: z.string().min(1).max(150),
    description: z.string().min(1),
    techStack: z.array(z.string()).min(1),
  }),
  boards: z.array(boardSchema).min(1),
});

module.exports = { projectPlanSchema, taskSchema, boardSchema };