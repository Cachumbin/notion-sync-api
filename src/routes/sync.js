const express = require('express');
const router = express.Router();
const { syncNotion, getReminders } = require('../controllers/syncController');

router.post('/', syncNotion);
router.get('/reminders', getReminders);

module.exports = router;
