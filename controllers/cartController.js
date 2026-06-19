const Cart = require('../models/Cart');
const Tools = require('../models/Tools');

// CREATE - Add to cart
exports.addToCart = async (req, res) => {
  try {
    const { toolId, quantity = 1 } = req.body;
    const userId = req.user._id;

    // Validate tool existence
    const tool = await Tools.findById(toolId);
    if (!tool) {
      return res.status(404).json({ success: false, error: 'Tool not found' });
    }

    // Check if already in cart
    const existingItem = await Cart.findOne({ user: userId, tool: toolId });
    if (existingItem) {
      return res.status(409).json({ success: false, error: 'Item already in cart' });
    }

    // Check quantity validity
    if (quantity < 1) {
      return res.status(400).json({ success: false, error: 'Quantity must be at least 1' });
    }

    // Add to cart
    const cartItem = await Cart.create({ user: userId, tool: toolId, quantity });

    return res.status(201).json({ success: true, data: cartItem });
  } catch (error) {
    console.error(error);
     console.error("Error in addToCart:", error);
    return res.status(500).json({ success: false, error: 'Server error' });
  }
};

// READ - Get all cart items for the user
exports.getCart = async (req, res) => {
  try {
    const cartItems = await Cart.find({ user: req.user._id })
      .populate('tool', 'name price photo');

    return res.status(200).json({
      success: true,
      count: cartItems.length,
      data: cartItems
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ success: false, error: 'Server error' });
  }
};

// UPDATE - Change cart item quantity
exports.updateCartItem = async (req, res) => {
  try {
    const { quantity } = req.body;

    if (quantity < 1) {
      return res.status(400).json({ success: false, error: 'Quantity must be at least 1' });
    }

    const updatedItem = await Cart.findOneAndUpdate(
      { _id: req.params.id, user: req.user._id },
      { quantity },
      { new: true }
    );

    if (!updatedItem) {
      return res.status(404).json({ success: false, error: 'Cart item not found' });
    }

    return res.status(200).json({ success: true, data: updatedItem });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ success: false, error: 'Server error' });
  }
};

// DELETE - Remove item from cart
exports.removeFromCart = async (req, res) => {
  try {
    const deletedItem = await Cart.findOneAndDelete({
      _id: req.params.id,
      user: req.user._id
    });

    if (!deletedItem) {
      return res.status(404).json({ success: false, error: 'Cart item not found' });
    }

    return res.status(200).json({ success: true, message: 'Item removed from cart' });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ success: false, error: 'Server error' });
  }
};
