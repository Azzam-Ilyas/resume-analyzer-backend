const Job = require('../models/Job');

exports.createJob = async (req, res) => {
  try {
    const data = { ...req.body, userId: req.userId };
    const job = await Job.create(data);
    res.json(job);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
};

exports.listJobs = async (req, res) => {
  try {
    const jobs = await Job.find({ userId: req.userId }).sort({ createdAt: -1 });
    res.json(jobs);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
};

exports.updateJob = async (req, res) => {
  try {
    const job = await Job.findOneAndUpdate({ _id: req.params.id, userId: req.userId }, req.body, { new: true });
    if (!job) return res.status(404).json({ msg: 'Not found' });
    res.json(job);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
};

exports.deleteJob = async (req, res) => {
  try {
    await Job.deleteOne({ _id: req.params.id, userId: req.userId });
    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
};
