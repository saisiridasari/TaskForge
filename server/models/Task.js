const mongoose = require('mongoose');

const aiMetadataSchema = new mongoose.Schema(
  {
    generationId: { type: mongoose.Schema.Types.ObjectId, ref: 'ProjectGeneration' },
    difficulty: { type: Number, min: 1, max: 5 },
    estimatedHours: { type: Number, min: 0.5, max: 80 },
    technical: {
      requiredApis: [{ type: String }],
      dbCollections: [{ type: String }],
      envVars: [{ type: String }],
      npmPackages: [{ type: String }],
      filesToCreate: [{ type: String }],
    },
    git: {
      suggestedBranch: { type: String },
      suggestedCommitMessages: [{ type: String }],
    },
    testingChecklist: [{ type: String }],
    deploymentNotes: { type: String },
    docReferences: [{ type: String }],
    risks: [{ type: String }],
    futureImprovements: [{ type: String }],
    acceptanceCriteria: [{ type: String }],
    
    dependencies: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Task' }],
    isAiGenerated: { type: Boolean, default: false },
    reviewStatus: {
      type: String,
      enum: ['draft', 'reviewed', 'edited'],
      default: 'draft',
    },
  },
  { _id: false }
);

const taskSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Task title is required'],
    trim: true,
    maxlength: [200, 'Title cannot exceed 200 characters'],
  },
  description: {
    type: String,
    trim: true,
    maxlength: [2000, 'Description cannot exceed 2000 characters'],
  },
  boardId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Board',
    required: true,
  },
  projectId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Project',
    required: true,
  },
  priority: {
    type: String,
    enum: ['low', 'medium', 'high'],
    default: 'medium',
  },
  assignedTo: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  dueDate: { type: Date },
  order: { type: Number, default: 0 },
  completed: { type: Boolean, default: false },
  labels: [{ type: String }],
  attachments: [
    {
      fileName: { type: String, required: true },
      fileUrl: { type: String, required: true },
      fileType: { type: String },
      publicId: { type: String },
      uploadedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
      uploadedAt: { type: Date, default: Date.now },
    },
  ],
  comments: [
    {
      user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
      text: { type: String, required: true, maxlength: 1000 },
      createdAt: { type: Date, default: Date.now },
    },
  ],
 
  aiMetadata: { type: aiMetadataSchema, default: undefined },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  createdAt: { type: Date, default: Date.now },
});

taskSchema.index({ projectId: 1, boardId: 1 });
taskSchema.index({ title: 'text', description: 'text' });

module.exports = mongoose.model('Task', taskSchema);