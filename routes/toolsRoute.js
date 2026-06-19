const express = require('express');
const router = express.Router();
const toolsCtrl = require('../controllers/toolsController');
const { authMiddleware } = require('../middleware/authMiddleware');

/**
 * @swagger
 * /api/tools:
 *   get:
 *     summary: Get all tools
 *     tags: [Tools]
 *     responses:
 *       200:
 *         description: List of all tools
 *   post:
 *     summary: Create a new tool
 *     tags: [Tools]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               description:
 *                 type: string
 *               price:
 *                 type: number
 *               photo:
 *                 type: string
 *               quantity:
 *                 type: integer
 *     responses:
 *       201:
 *         description: Tool created successfully
 */
router.get('/', toolsCtrl.getAllTools);
router.post('/', authMiddleware, toolsCtrl.createTools);

/**
 * @swagger
 * /api/tools/others-tool:
 *   get:
 *     summary: Get tools from other users (excluding current user)
 *     tags: [Tools]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of other users' tools
 */
router.get('/others-tool', authMiddleware, toolsCtrl.getToolsExcludingCurrentUser);

/**
 * @swagger
 * /api/tools/mine:
 *   get:
 *     summary: Get current user's tools
 *     tags: [Tools]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of current user's tools
 */
router.get('/mine', authMiddleware, toolsCtrl.getMyTools);

/**
 * @swagger
 * /api/tools/available:
 *   get:
 *     summary: Get available tools
 *     tags: [Tools]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of available tools
 */
router.get('/available', authMiddleware, toolsCtrl.getAvailableTools);

/**
 * @swagger
 * /api/tools/{id}:
 *   get:
 *     summary: Get tool by ID
 *     tags: [Tools]
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
 *         description: Tool details
 *       404:
 *         description: Tool not found
 *   put:
 *     summary: Update a tool
 *     tags: [Tools]
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
 *     responses:
 *       200:
 *         description: Tool updated successfully
 *   delete:
 *     summary: Delete a tool
 *     tags: [Tools]
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
 *         description: Tool deleted successfully
 */
router.put('/:id', authMiddleware, toolsCtrl.updateTool);
router.delete('/:id', authMiddleware, toolsCtrl.deleteTool);
router.get('/:id', authMiddleware, toolsCtrl.getToolById);

/**
 * @swagger
 * /api/tools/add-to-cart:
 *   post:
 *     summary: Add tool to cart
 *     tags: [Tools]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               tool_id:
 *                 type: integer
 *               quantity:
 *                 type: integer
 *     responses:
 *       201:
 *         description: Tool added to cart
 */
router.post('/add-to-cart', authMiddleware, toolsCtrl.addToCart);

/**
 * @swagger
 * /api/tools/order:
 *   post:
 *     summary: Create an order
 *     tags: [Tools]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *     responses:
 *       201:
 *         description: Order created successfully
 */
router.post('/order', authMiddleware, toolsCtrl.createOrder);

module.exports = router;
