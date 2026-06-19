const express = require('express');
const { authMiddleware } = require('../middleware/authMiddleware');
const { getDashboardStats } = require('../controllers/dashboardController');
const router = express.Router();

/**
 * @swagger
 * /api/dashboard:
 *   get:
 *     summary: Get dashboard statistics
 *     tags: [Dashboard]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Dashboard statistics including user stats, tools, problems, solutions
 *       401:
 *         description: Unauthorized
 */
router.get('/', authMiddleware, getDashboardStats);

module.exports = router;
