const express = require('express');
const CategoryEnum = require('../config/categoryEnum');
const { authMiddleware } = require('../middleware/authMiddleware');
const router = express.Router();

// ✅ Define route correctly
router.get('/categories',authMiddleware, (req, res) => {
  res.json(Object.values(CategoryEnum));
});

// ✅ Export the router correctly
module.exports = router;
