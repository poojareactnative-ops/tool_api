const express = require('express');
const router = express.Router();
const exchangeCtrl = require('../controllers/exchangeController');
const auth = require('../middleware/authMiddleware');

/**
 * @swagger
 * /api/exchange:
 *   post:
 *     summary: Create exchange request
 *     tags: [Exchange]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               tool_offered_id:
 *                 type: integer
 *               tool_requested_id:
 *                 type: integer
 *     responses:
 *       201:
 *         description: Exchange request created
 *   get:
 *     summary: Get exchange requests list
 *     tags: [Exchange]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of exchange requests
 */
router.post('/', auth.authMiddleware, exchangeCtrl.createExchangeRequest);
router.get('/', auth.authMiddleware, exchangeCtrl.getExchangeList);

/**
 * @swagger
 * /api/exchange/status/{id}:
 *   put:
 *     summary: Update exchange request status
 *     tags: [Exchange]
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
 *               status:
 *                 type: string
 *                 enum: [pending, accepted, rejected]
 *     responses:
 *       200:
 *         description: Status updated successfully
 */
router.put('/status/:id', auth.authMiddleware, exchangeCtrl.updateExchangeStatus);

module.exports = router;
