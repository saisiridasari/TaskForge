// server/models/ProjectGeneration.js
//
// WHAT THIS IS FOR:
// One document per "user typed an idea, AI generated a project plan" request.
// This is NOT the generated boards/tasks themselves — those get created as
// real Board/Task documents (with aiMetadata) once validation passes. This
// model is the audit trail: what was asked, what model/prompt version
// answered, whether it succeeded, and the raw output for debugging.
//
// Why this matters: if a generation looks wrong six weeks from now, this is
// what lets you answer "which prompt version produced this, and what did
// Gemini actually return before we parsed it?"

const mongoose = require('mongoose');

const projectGenerationSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    // Null until generation succeeds and a real Project is created from it.
    project: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Project',
      default: null,
    },
    // What the user actually typed, e.g. "Build a food delivery platform
    // using React, Express, MongoDB and Stripe."
    idea: {
      type: String,
      required: true,
      trim: true,
    },
    promptVersion: {
      type: String,
      required: true, // e.g. "project-generator.v1"
    },
    modelVersion: {
      type: String,
      required: true, // e.g. "gemini-3-flash"
    },
    status: {
      type: String,
      enum: ['pending', 'completed', 'failed'],
      default: 'pending',
    },
    // The raw, schema-validated JSON Gemini returned, kept for debugging
    // and for re-processing if you change how boards/tasks get created
    // from it later without re-calling the AI.
    rawOutput: {
      type: mongoose.Schema.Types.Mixed,
      default: null,
    },
    // Populated only if status === 'failed'.
    error: {
      type: String,
      default: null,
    },
    // How many retries it took to get valid structured output (see the
    // response validator we'll build next) — useful signal that a prompt
    // needs tuning if this creeps up over time.
    retryCount: {
      type: Number,
      default: 0,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('ProjectGeneration', projectGenerationSchema);