const express = require('express');
const router = express.Router();
const problemController = require('../controllers/problemController');
const auth = require('../middleware/authMiddleware');

/**
 * @swagger
 * /api/problem:
 *   get:
 *     summary: Get all problems with optional filters
 *     tags: [Problems]
 *     responses:
 *       200:
 *         description: List of problems
 *   post:
 *     summary: Create a new problem
 *     tags: [Problems]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               title:
 *                 type: string
 *               description:
 *                 type: string
 *               reward_type:
 *                 type: string
 *                 enum: [money, coins]
 *               reward_amount:
 *                 type: number
 *               deadline:
 *                 type: string
 *                 format: date-time
 *               tags:
 *                 type: array
 *     responses:
 *       201:
 *         description: Problem created successfully
 *   put:
 *     summary: Update a problem
 *     tags: [Problems]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *     responses:
 *       200:
 *         description: Problem updated successfully
 */
router.get('/', problemController.getProblems);

/**
 * @swagger
 * /api/problem/{id}/public:
 *   get:
 *     summary: Get problem details (public)
 *     tags: [Problems]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Problem details
 *       404:
 *         description: Problem not found
 */
router.get('/:id/public', problemController.getProblemByIdPublic);

router.use(auth.authMiddleware);

/**
 * @swagger
 * /api/problem/my-problems:
 *   get:
 *     summary: Get current user's problems
 *     tags: [Problems]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Current user's problems
 */
router.get('/my-problems', problemController.getCurrentUserProblems);

/**
 * @swagger
 * /api/problem/others-problems:
 *   get:
 *     summary: Get other users' problems
 *     tags: [Problems]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Other users' problems
 */
router.get('/others-problems', problemController.getOthersProblems);

router.post('/', problemController.createProblem);
router.put('/', problemController.updateProblem);

/**
 * @swagger
 * /api/problem/{id}:
 *   get:
 *     summary: Get problem by ID
 *     tags: [Problems]
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
 *         description: Problem details
 *       404:
 *         description: Problem not found
 *   delete:
 *     summary: Delete a problem
 *     tags: [Problems]
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
 *         description: Problem deleted
 */
router.delete('/:id', problemController.deleteProblem);
router.get('/:id', problemController.getProblemById);

/**
 * @swagger
 * /api/problem/{id}/solutions:
 *   get:
 *     summary: Get solutions for a problem
 *     tags: [Problems]
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
 *         description: List of solutions
 *   post:
 *     summary: Submit a solution to a problem
 *     tags: [Problems]
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
 *       201:
 *         description: Solution submitted
 */
router.post('/:id/solutions', problemController.submitSolution);
router.get('/:id/solutions', problemController.getProblemSolutions);

/**
 * @swagger
 * /api/problem/{id}/select-solution:
 *   put:
 *     summary: Select a solution for a problem
 *     tags: [Problems]
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
 *               solution_id:
 *                 type: integer
 *     responses:
 *       200:
 *         description: Solution selected
 */
router.put('/:id/select-solution', problemController.selectSolution);

/**
 * @swagger
 * /api/problem/{id}/distribute-reward:
 *   post:
 *     summary: Distribute reward for a problem
 *     tags: [Problems]
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
 *         description: Reward distributed
 */
router.post('/:id/distribute-reward', problemController.distributeReward);

module.exports = router;