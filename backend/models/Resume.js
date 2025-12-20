const mongoose = require('mongoose');

const ResumeSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  originalText: { type: String, required: true },
  aiImprovedText: String,
  aiScore: Number,
  atsScore: Number,
  suggestions: [String]
}, { timestamps: true });

module.exports = mongoose.model('Resume', ResumeSchema);
