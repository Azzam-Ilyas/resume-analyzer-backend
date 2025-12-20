const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const { createJob, listJobs, updateJob, deleteJob } = require('../controllers/jobController');

router.post('/', auth, createJob);
router.get('/', auth, listJobs);
router.put('/:id', auth, updateJob);
router.delete('/:id', auth, deleteJob);

module.exports = router;
