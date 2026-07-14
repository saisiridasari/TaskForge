const mongoose = require('mongoose');

const projectGenerationSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    project: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Project',
      default: null,
    },
   
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
   
    rawOutput: {
      type: mongoose.Schema.Types.Mixed,
      default: null,
    },
    // Populated only if status === 'failed'.
    error: {
      type: String,
      default: null,
    },
    
    retryCount: {
      type: Number,
      default: 0,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('ProjectGeneration', projectGenerationSchema);