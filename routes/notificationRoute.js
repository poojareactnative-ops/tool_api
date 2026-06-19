const express = require('express');
const router = express.Router();
const notificationCtrl = require('../controllers/notificationController');
const { authMiddleware } = require('../middleware/authMiddleware');

/**
 * @swagger
 * /api/notifications:
 *   get:
 *     summary: Get all notifications for current user
 *     tags: [Notifications]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of notifications
 */
router.get('/', authMiddleware, notificationCtrl.getNotifications);

/**
 * @swagger
 * /api/notifications/delete-multiple:
 *   post:
 *     summary: Delete multiple notifications
 *     tags: [Notifications]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               ids:
 *                 type: array
 *                 items:
 *                   type: integer
 *     responses:
 *       200:
 *         description: Notifications deleted
 */
router.post('/delete-multiple', authMiddleware, notificationCtrl.deleteMultipleNotifications);

/**
 * @swagger
 * /api/notifications/delete-all:
 *   delete:
 *     summary: Delete all notifications
 *     tags: [Notifications]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: All notifications deleted
 */
router.delete('/delete-all', authMiddleware, notificationCtrl.deleteAllNotifications);

/**
 * @swagger
 * /api/notifications/{id}:
 *   patch:
 *     summary: Mark notification as read
 *     tags: [Notifications]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Notification marked as read
 *   delete:
 *     summary: Delete a notification
 *     tags: [Notifications]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Notification deleted
 */
router.patch('/read/:id', authMiddleware, notificationCtrl.markRead);
router.delete('/:id', authMiddleware, notificationCtrl.deleteNotification);

module.exports = router;
