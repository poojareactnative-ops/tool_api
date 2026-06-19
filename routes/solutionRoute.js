
// routes/solutionRoutes.js
const express = require('express');
const {
  getMySolutions,
  getMySolutionById,
  createSolution,
  updateMySolution,
  deleteMySolution
} = require('../controllers/solutionController');
const auth = require('../middleware/authMiddleware');


const router = express.Router();

/**
 * @swagger
 * /api/solution:
 *   get:
 *     summary: Get current user's solutions
 *     tags: [Solutions]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of user's solutions
 */
router.get('/', auth.authMiddleware, getMySolutions);

/**
 * @swagger
 * /api/solution/{problemId}:
 *   post:
 *     summary: Create a solution for a problem
 *     tags: [Solutions]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: problemId
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               description:
 *                 type: string
 *               attachments:
 *                 type: array
 *     responses:
 *       201:
 *         description: Solution created
 */
router.post('/:problemId', auth.authMiddleware, createSolution);

/**
 * @swagger
 * /api/solution/{id}:
 *   get:
 *     summary: Get solution by ID
 *     tags: [Solutions]
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
 *         description: Solution details
 *       404:
 *         description: Solution not found
 *   put:
 *     summary: Update a solution
 *     tags: [Solutions]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               description:
 *                 type: string
 *               attachments:
 *                 type: array
 *     responses:
 *       200:
 *         description: Solution updated
 *   delete:
 *     summary: Delete a solution
 *     tags: [Solutions]
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
 *         description: Solution deleted
 */
router.get('/:id', auth.authMiddleware, getMySolutionById);
router.put('/:id', auth.authMiddleware, updateMySolution);
router.delete('/:id', auth.authMiddleware, deleteMySolution);

module.exports = router;
