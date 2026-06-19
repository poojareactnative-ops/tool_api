const Tools = require('../models/Tools');
const Cart = require('../models/Cart');
const getToolsWithCartStatus = require('../utils/getToolsWithCartStatus');
const Razorpay = require('razorpay');
const instance = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET
});
const Notification = require('../models/Notification');

// 1. Create tool
// exports.createTools = async (req, res) => {
//   try {
//     const { name, description, price, quantity } = req.body;

    
//  const photoPath = req.file ? req.file.filename : null;
//     let tools = await Tools.create({
//       name,
//       description,
//       price,
//       photo: photoPath, // store the image path or URL
//       quantity: quantity || 1,
//       owner: req.user._id,
//     });

//     const notification = new Notification({
//       user: req.user._id,
//       title: 'New Tool Available',
//       message: `${req.user.name} has added a new tool: ${tools.name}`,
//       type: 'TOOL_ADDED',
//       relatedEntity: tools._id,
//       relatedEntityModel: 'Tool'
//     });

//     await notification.save();

//     // Populate owner details (like name and email)
//     tools = await tools.populate('owner', 'name email');

//     res.status(201).json(tools);
//   } catch (err) {
//     res.status(500).json({ error: err.message });
//   }
// };
exports.createTools = async (req, res) => {
  try {
    const { name, description, price, photo, quantity } = req.body;
    // Create the tool with the current user's ID and provided quantity (or default to 1)
    let tools = await Tools.create({
      name,
      description,
      price,
      photo,
      quantity: quantity || 1,
      owner: req.user._id,
    });

    const notification = new Notification({
      user: req.user._id, // or the relevant user ID
      title: 'New Tool Available',
      message: `${req.user.name} has added a new tool: ${tools.name}`,
      type: 'TOOL_ADDED',
      relatedEntity: tools._id,
      relatedEntityModel: 'Tool'
    });

    await notification.save();
    // Populate owner details (name, email, etc.)
    tools = await tools.populate('owner', 'name email');
    res.status(201).json(tools);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// 2. Update tool (unchanged)
exports.updateTool = async (req, res) => {
  try {
    const { id } = req.params;
    const tool = await Tools.findById(id);
    if (!tool) {
      return res.status(404).json({ error: 'Tool not found' });
    }
    if (!tool.owner.equals(req.user._id)) {
      return res.status(403).json({ error: 'Unauthorized: Not your tool' });
    }
    const updates = req.body;
    const updatedTool = await Tools.findByIdAndUpdate(id, updates, {
      new: true,
      runValidators: true,
    });
    res.json({ message: 'Tool updated successfully', updatedTool });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// 3. Get tools listed by current user
exports.getMyTools = async (req, res) => {
  try {
    const tools = await Tools.find({ owner: req.user._id }).populate('owner', 'name email');
    res.json(tools);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// 4. Get all tools (admin or for listing)
exports.getAllTools = async (req, res) => {
  try {
    const tools = await Tools.find().populate('owner', 'name email');
    const result = await getToolsWithCartStatus(tools, req.user?._id);
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};


// 5. Get available tools (excluding current user’s tools)
exports.getAvailableTools = async (req, res) => {
  try {
    const tools = await Tools.find({
      owner: { $ne: req.user._id },
      status: 'available'
    }).populate('owner', 'name');
    res.json(tools);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// 6. Delete tool by ID
exports.deleteTool = async (req, res) => {
  try {
    const tool = await Tools.findOneAndDelete({
      _id: req.params.id,
      owner: req.user._id
    });
    if (!tool) return res.status(404).json({ error: 'Tool not found or unauthorized' });
    res.json({ message: 'Tool deleted successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};


exports.addToCart = async (req, res) => {
  try {
    const { toolId, quantity } = req.body;

    if (!toolId) {
      return res.status(400).json({ error: 'toolId is required' });
    }

    // Check if already in cart first
    const existingCartItem = await Cart.findOne({
      user: req.user._id,
      tool: toolId
    });

    if (existingCartItem) {
      return res.status(409).json({
        error: 'Tool already in cart',
        cartItemId: existingCartItem._id,
      });
    }

    // Rest of your addToCart logic...
    const requestedQuantity = quantity && quantity > 0 ? Number(quantity) : 1;
    const tool = await Tools.findById(toolId);

    if (!tool) {
      return res.status(404).json({ error: 'Tool not found' });
    }

    if (tool.quantity < requestedQuantity) {
      return res.status(400).json({ error: 'Insufficient quantity available' });
    }

    const cartItem = await Cart.create({
      user: req.user._id,
      tool: toolId,
      quantity: requestedQuantity
    });

    // Get updated status
    const tools = await Tools.find().populate('owner', 'name email');
    const result = await getToolsWithCartStatus(tools, req.user._id);

    return res.status(201).json({
      message: 'Added to cart successfully',
      cartItem,
      updatedTools: result
    });

  } catch (err) {
    console.error('Cart error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
};
// 12. get tool by id
exports.getToolById = async (req, res) => {
  try {
    const tool = await Tools.findById(req.params.id)
      .populate('owner', 'name email')
      .lean();                               // Convert to plain JS object

    if (!tool) {
      return res.status(404).json({
        success: false,
        error: 'Tool not found'
      });
    }

    // For authenticated users, check if tool is in their cart
    if (req.user) {
      const cartItem = await Cart.findOne({
        user: req.user._id,
        tool: tool._id
      });
      tool.inCart = !!cartItem;
      tool.cartItemId = cartItem?._id || null;
    }

    res.status(200).json({
      success: true,
      data: tool
    });

  } catch (err) {
    console.error(`Error getting tool ${req.params.id}:`, err);
    res.status(500).json({
      success: false,
      error: 'Server Error'
    });
  }
};
// 13. create order 
exports.createOrder = async (req, res) => {
  try {
    const { toolId, quantity, amount } = req.body;

    // 1. Validate tool
    const tool = await Tools.findById(toolId);
    if (!tool || tool.status !== 'available' || tool.quantity < quantity) {
      return res.status(400).json({ error: 'Tool not available or insufficient quantity' });
    }

    // 2. Create Razorpay order
    const order = await instance.orders.create({
      amount: amount * 100, // Razorpay expects amount in paise
      currency: 'INR',
      receipt: `order_${toolId}_${Date.now()}`,
    });

    // 3. Send notification (optional)
    const notification = new Notification({
      user: req.user._id,
      title: 'Tool Purchase Initiated',
      message: `You initiated purchase for ${tool.name} (Qty: ${quantity})`,
      type: 'ORDER_CREATED',
      relatedEntity: tool._id,
      relatedEntityModel: 'Tool',
    });
    await notification.save();

    // 4. Respond with order info
    res.json({
      success: true,
      orderId: order.id,
      amount: order.amount,
      currency: order.currency,
    });

  } catch (err) {
    console.error('Order creation failed:', err);
    res.status(500).json({ error: 'Failed to create order', details: err.message });
  }
};

exports.getToolsExcludingCurrentUser = async (req, res) => {
  try {
    // 1. Authentication check
    if (!req.user || !req.user._id) {
      console.error('Authentication error - no user in request');
      return res.status(401).json({
        success: false,
        error: 'Authentication required'
      });
    }

    const currentUserId = req.user._id;
    
    // 2. Pagination
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    // 3. Build query
    const query = { owner: { $ne: currentUserId } };
    
    // Optional filters
    if (req.query.search) {
      query.name = { $regex: req.query.search, $options: 'i' };
    }
    
    if (req.query.minPrice) {
      query.price = { ...query.price, $gte: parseFloat(req.query.minPrice) };
    }
    
    if (req.query.maxPrice) {
      query.price = { ...query.price, $lte: parseFloat(req.query.maxPrice) };
    }

    // 4. Execute query
    const [total, tools] = await Promise.all([
      Tools.countDocuments(query),
      Tools.find(query)
        .populate('owner', 'name email profilePhoto')
        .sort(req.query.sortBy || '-createdAt')
        .skip(skip)
        .limit(limit)
    ]);

    res.json({
      success: true,
      count: tools.length,
      total,
      page,
      pages: Math.ceil(total / limit),
      data: tools
    });

  } catch (err) {
    console.error('Error in getToolsExcludingCurrentUser:', err);
    res.status(500).json({ 
      success: false,
      error: 'Server error',
      message: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
  }
};
