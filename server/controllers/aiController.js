const { ai, DEFAULT_MODEL } = require('../config/gemini');
const { recordAIUsage } = require('../middleware/aiRateLimit');
const { generateValidatedProjectPlan } = require('../services/projectGenerationService');
const { createProjectFromPlan } = require('../services/projectPlanWriter');
const { askAboutTask } = require('../services/taskIntelligenceService');
const { logActivity } = require('../config/activityHelper');

const pingSchema = {
  type: 'object',
  properties: {
    message: { type: 'string' },
    receivedPrompt: { type: 'string' },
  },
  required: ['message', 'receivedPrompt'],
};

// POST /api/ai/ping   body (optional): { "prompt": "..." }
const pingAI = async (req, res) => {
  try {
    const prompt =
      req.body.prompt || 'Say hello, and repeat back the prompt you received.';

    const response = await ai.models.generateContent({
      model: DEFAULT_MODEL,
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
        responseSchema: pingSchema,
      },
    });

    const parsed = JSON.parse(response.text);

    const usage = response.usageMetadata || {};
    await recordAIUsage(req.user._id, {
      promptTokens: usage.promptTokenCount || 0,
      completionTokens: usage.candidatesTokenCount || 0,
    });

    return res.json({
      ok: true,
      model: DEFAULT_MODEL,
      result: parsed,
    });
  } catch (err) {
    console.error('AI ping failed:', err);
    return res.status(500).json({
      ok: false,
      message: 'AI ping failed — check GEMINI_API_KEY and server logs',
      error: err.message,
    });
  }
};

const generateProject = async (req, res) => {
  try {
    const { idea, techStack, deadline } = req.body;

    if (!idea || typeof idea !== 'string' || idea.trim().length < 5) {
      return res.status(400).json({ message: 'Please provide a project idea (at least a few words).' });
    }

    const result = await generateValidatedProjectPlan({
      userId: req.user._id,
      idea: idea.trim(),
      techStack: Array.isArray(techStack) ? techStack : [],
    });

    if (!result.success) {
    
      return res.status(422).json({
        message: 'AI could not generate a valid project plan. Try rephrasing your idea.',
        errors: result.errors,
        generationId: result.generation._id,
      });
    }

    const { project, boards, tasks } = await createProjectFromPlan({
      plan: result.plan,
      userId: req.user._id,
      generationId: result.generation._id,
      deadline: deadline || undefined, // NEW — optional, from the "Generate with AI" form
    });

    result.generation.project = project._id;
    await result.generation.save();

    await logActivity({
      userId: req.user._id,
      action: `generated project "${project.title}" with AI (${boards.length} boards, ${tasks.length} tasks)`,
      actionType: 'ai_project_generated',
      projectId: project._id,
      meta: { generationId: result.generation._id, boardCount: boards.length, taskCount: tasks.length },
    });

    return res.status(201).json({
      ok: true,
      generationId: result.generation._id,
      project,
      boards,
      taskCount: tasks.length,
    });
  } catch (err) {
    console.error('AI project generation failed:', err);
    return res.status(500).json({
      message: 'AI project generation failed — check server logs',
      error: err.message,
    });
  }
};

module.exports = { pingAI, generateProject, askTask, markTaskReviewed };

// PUT /api/ai/tasks/:id/review
// Clears the "AI Draft" status once a human has actually looked at the task.
// No body needed — this is a simple state transition, not an edit.
async function markTaskReviewed(req, res) {
  try {
    const Task = require('../models/Task');
    const task = await Task.findById(req.params.id);

    if (!task) {
      return res.status(404).json({ message: 'Task not found' });
    }

    if (!task.aiMetadata) {
      // Not an AI-generated task at all — nothing to mark reviewed.
      return res.status(400).json({ message: 'This task has no AI metadata to review' });
    }

    task.aiMetadata.reviewStatus = 'reviewed';
    await task.save();

    return res.json({ ok: true, task });
  } catch (err) {
    console.error('Mark task reviewed failed:', err);
    return res.status(500).json({
      message: 'Failed to mark task as reviewed',
      error: err.message,
    });
  }
}

// POST /api/ai/tasks/:id/ask
// body: { "mode": "explain"|"code"|"tests"|"estimate"|"review"|"ask", "question": "..." }
// (question required only when mode === "ask")
async function askTask(req, res) {
  try {
    const { mode, question } = req.body;
    const validModes = ['explain', 'code', 'tests', 'estimate', 'review', 'ask'];

    if (!mode || !validModes.includes(mode)) {
      return res.status(400).json({ message: `mode must be one of: ${validModes.join(', ')}` });
    }

    if (mode === 'ask' && (!question || typeof question !== 'string' || question.trim().length < 3)) {
      return res.status(400).json({ message: 'A question is required when mode is "ask"' });
    }

    const result = await askAboutTask({
      taskId: req.params.id,
      userId: req.user._id,
      mode,
      question: question ? question.trim() : undefined,
    });

    if (!result.success) {
      // Task not found, or the Gemini call itself failed — either way this
      // is a clean, expected failure mode, not a crash.
      return res.status(422).json({ message: result.error });
    }

    return res.json({ ok: true, mode, answer: result.answer });
  } catch (err) {
    console.error('AI task Q&A failed:', err);
    return res.status(500).json({
      message: 'AI task Q&A failed — check server logs',
      error: err.message,
    });
  }
}