const mongoose = require('mongoose');

const JobSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  company: String,
  position: String,
  jobDescription: String,
  appliedDate: Date,
  status: { type: String, enum: ['Applied','Interviewing','Rejected','Offered'], default: 'Applied' },
  notes: String
}, { timestamps: true });

module.exports = mongoose.model('Job', JobSchema);
