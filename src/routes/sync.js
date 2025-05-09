const express = require('express');
const router = express.Router();
const { syncNotion, getReminders } = require('../controllers/syncController');

/**
 * @swagger
 * /sync:
 *   post:
 *     summary: Sync reminders from raw text to Notion
 *     requestBody:
 *       required: true
 *       content:
 *         text/plain:
 *           schema:
 *             type: string
 *             example: |
 *               BEGIN:VEVENT
 *               SUMMARY:Test Event
 *               DUEDATE:17/05/2025 at 10:00 AM
 *               COMPLETED:No
 *               END:VEVENT
 *     responses:
 *       200:
 *         description: Sync completed successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 actions:
 *                   type: array
 *                   items:
 *                     type: object
 *       500:
 *         description: Server Error
 */
router.post('/', syncNotion);

/**
 * @swagger
 * /sync/reminders:
 *   get:
 *     summary: Get the list of reminders from Notion
 *     responses:
 *       200:
 *         description: A list of reminders
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 reminders:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       name:
 *                         type: string
 *                       done:
 *                         type: boolean
 *                       dueDate:
 *                         type: string
 *                       reminderId:
 *                         type: string
 *       500:
 *         description: Server Error
 */
router.get('/reminders', getReminders);

module.exports = router;
