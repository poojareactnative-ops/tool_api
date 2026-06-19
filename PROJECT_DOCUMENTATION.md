# Project Documentation: toolsApi-master

Generated on: 2026-06-19T12:46:47.247Z

## File Index

- .env
- config/categoryEnum.js
- config/db.js
- config/swagger.js
- controllers/cartController.js
- controllers/dashboardController.js
- controllers/exchangeController.js
- controllers/mobileCoverController.js
- controllers/notificationController.js
- controllers/problemController.js
- controllers/solutionController.js
- controllers/toolsController.js
- controllers/userController.js
- middleware/authMiddleware.js
- middleware/upload.js
- models/BaseModel.js
- models/Cart.js
- models/ExchangeRequest.js
- models/Notification.js
- models/Problem.js
- models/Solution.js
- models/Tools.js
- models/Users.js
- models/mobileCovers.js
- package-lock.json
- package.json
- routes/cartRoute.js
- routes/categoryRoute.js
- routes/dashboardRoute.js
- routes/exchangeRoute.js
- routes/notificationRoute.js
- routes/problemRoute.js
- routes/solutionRoute.js
- routes/toolsRoute.js
- routes/userRoutes.js
- schema.sql
- scripts/generate_documentation.js
- server.js
- utils/getToolsWithCartStatus.js
- utils/validators.js

---

## File: .env

```
PORT=4000
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=12345678
DB_NAME=tools_api
JWT_SECRET = 5UTC6LUWJ9IZZ2ty
RAZORPAY_KEY_ID=rzp_test_KHcmbZvd5pUOZt
RAZORPAY_KEY_SECRET=your_razorpay_secret

```

## File: config/categoryEnum.js

```javascript
const CategoryEnum = Object.freeze({
  ELECTRONICS: 'Electronics',
  FASHION: 'Fashion',
  BOOKS: 'Books',
  GROCERY: 'Grocery',
  TOYS: 'Toys',
});

module.exports = CategoryEnum;

```

## File: config/db.js

```javascript
const mysql = require('mysql2/promise');
const { AsyncLocalStorage } = require('async_hooks');

const transactionStorage = new AsyncLocalStorage();

const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  port: Number(process.env.DB_PORT || 3306),
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'tools_api',
  waitForConnections: true,
  connectionLimit: Number(process.env.DB_CONNECTION_LIMIT || 10),
  queueLimit: 0,
  namedPlaceholders: false,
  timezone: 'Z'
});

const query = async (sql, params = []) => {
  const connection = transactionStorage.getStore();
  const executor = connection || pool;
  const [rows] = await executor.execute(sql, params);
  return rows;
};

const withTransaction = async (callback) => {
  const connection = await pool.getConnection();

  try {
    await connection.beginTransaction();
    const result = await transactionStorage.run(connection, callback);
    await connection.commit();
    return result;
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
};

const connectDB = async () => {
  const connection = await pool.getConnection();

  try {
    await connection.ping();
    console.log(`MySQL connected: ${process.env.DB_HOST || 'localhost'}`);
  } finally {
    connection.release();
  }
};

const isValidId = (id) => {
  if (id && typeof id === 'object' && id._id !== undefined) return isValidId(id._id);
  if (id && typeof id === 'object' && typeof id.valueOf === 'function') return isValidId(id.valueOf());
  return Number.isInteger(Number(id)) && Number(id) > 0;
};

module.exports = {
  pool,
  query,
  withTransaction,
  connectDB,
  isValidId
};

```

## File: config/swagger.js

```javascript
const swaggerJsdoc = require('swagger-jsdoc');

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Tools API',
      version: '1.0.0',
      description: 'A comprehensive API for managing tools, users, problems, and solutions',
      contact: {
        name: 'API Support',
        email: 'support@toolsapi.com'
      }
    },
    servers: [
      {
        url: 'http://localhost:4000',
        description: 'Development Server'
      },
      {
        url: 'http://localhost:5000',
        description: 'Production Server'
      }
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          description: 'JWT Authorization header using the Bearer scheme'
        }
      },
      schemas: {
        User: {
          type: 'object',
          properties: {
            id: { type: 'integer', example: 1 },
            name: { type: 'string', example: 'John Doe' },
            email: { type: 'string', example: 'john@example.com' },
            password: { type: 'string', example: 'password123' },
            bio: { type: 'string' },
            skills: { type: 'array', items: { type: 'string' } },
            experience: { type: 'integer', example: 5 },
            wallet_coins: { type: 'number', example: 100 },
            wallet_money: { type: 'number', example: 500 },
            rating: { type: 'number', example: 4.5 },
            profile_pic: { type: 'string' }
          }
        },
        Tool: {
          type: 'object',
          properties: {
            id: { type: 'integer', example: 1 },
            name: { type: 'string', example: 'Hammer' },
            description: { type: 'string', example: 'A sturdy hammer for nails' },
            price: { type: 'number', example: 29.99 },
            photo: { type: 'string', example: 'photo_url' },
            quantity: { type: 'integer', example: 5 },
            status: { type: 'string', enum: ['available', 'pending_exchange', 'sold'] },
            owner_id: { type: 'integer', example: 1 },
            buyer_id: { type: 'integer' },
            created_at: { type: 'string', format: 'date-time' },
            updated_at: { type: 'string', format: 'date-time' }
          }
        },
        Cart: {
          type: 'object',
          properties: {
            id: { type: 'integer' },
            user_id: { type: 'integer' },
            tool_id: { type: 'integer' },
            quantity: { type: 'integer', example: 1 },
            added_at: { type: 'string', format: 'date-time' }
          }
        },
        Problem: {
          type: 'object',
          properties: {
            id: { type: 'integer' },
            title: { type: 'string', example: 'Database optimization' },
            description: { type: 'string' },
            created_by: { type: 'integer' },
            reward_type: { type: 'string', enum: ['money', 'coins'] },
            reward_amount: { type: 'number', example: 500 },
            status: { type: 'string', enum: ['open', 'in-progress', 'completed', 'paid', 'closed'] },
            created_at: { type: 'string', format: 'date-time' }
          }
        },
        Solution: {
          type: 'object',
          properties: {
            id: { type: 'integer' },
            problem_id: { type: 'integer' },
            solver_id: { type: 'integer' },
            description: { type: 'string' },
            status: { type: 'string', enum: ['submitted', 'selected', 'rejected', 'paid'] },
            submitted_at: { type: 'string', format: 'date-time' }
          }
        },
        ExchangeRequest: {
          type: 'object',
          properties: {
            id: { type: 'integer' },
            tool_offered_id: { type: 'integer' },
            tool_requested_id: { type: 'integer' },
            requester_id: { type: 'integer' },
            status: { type: 'string', enum: ['pending', 'accepted', 'rejected'] },
            created_at: { type: 'string', format: 'date-time' }
          }
        },
        Notification: {
          type: 'object',
          properties: {
            id: { type: 'integer' },
            user_id: { type: 'integer' },
            message: { type: 'string' },
            type: { type: 'string' },
            is_read: { type: 'boolean' },
            created_at: { type: 'string', format: 'date-time' }
          }
        },
        Error: {
          type: 'object',
          properties: {
            message: { type: 'string' },
            error: { type: 'string' }
          }
        }
      }
    },
    security: [{ bearerAuth: [] }]
  },
  apis: ['./routes/*.js']
};

const swaggerSpec = swaggerJsdoc(options);

module.exports = swaggerSpec;

```

## File: controllers/cartController.js

```javascript
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

```

## File: controllers/dashboardController.js

```javascript
const Tools = require('../models/Tools');
const ExchangeRequest = require('../models/ExchangeRequest');
const Cart = require('../models/Cart')
const Problem = require('../models/Problem');
const Solution = require('../models/Solution');
const User = require('../models/Users');

exports.getDashboardStats = async (req, res) => {
  try {
    const userId = req.user._id;
    const [
      userToolsCount, 
      exchangeToolsCount, 
      totalToolsCount, 
      cartToolsCount, 
      problemCount, 
      solutionCount,
      userCount
    ] = await Promise.all([
      Tools.countDocuments({ owner: userId }),
      
      ExchangeRequest.countDocuments({
        $or: [
          { requester: userId },
          { receiver: userId }
        ]
      }),
      
      Tools.countDocuments({ owner: { $ne: userId } }),
      
      Cart.countDocuments({ user: userId }),
      
      // Count problems where createdBy matches userId
      Problem.countDocuments({ createdBy: userId }),
      
      // Count solutions where the solver is the current user
      // This assumes Solution schema has a solver field referencing User
      Solution.countDocuments({ solver: userId }),
      
      User.countDocuments()
    ]);

 

    res.json({
      success: true,
      stats: {
        totalTools: totalToolsCount,
        exchangeTools: exchangeToolsCount,
        userTools: userToolsCount,
        cartTools: cartToolsCount,
        problemCount: problemCount,
        solutionCount: solutionCount,
        userCount: userCount
      }
    });
    
  } catch (error) {
    console.error('Dashboard stats error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch dashboard stats',
      message: error.message,
      // Include stack trace in development only
      ...(process.env.NODE_ENV === 'development' && { stack: error.stack })
    });
  }
};


```

## File: controllers/exchangeController.js

```javascript
// // controllers/exchangeController.js
const ExchangeRequest = require('../models/ExchangeRequest');
const Notification = require('../models/Notification');
const Tools = require('../models/Tools');


exports.createExchangeRequest = async (req, res) => {
  try {
    const { toolsRequestedId, toolsOfferedId } = req.body;

    const toolsRequested = await Tools.findById(toolsRequestedId);
    const toolsOffered = await Tools.findById(toolsOfferedId);

    if (!toolsRequested || !toolsOffered) {
      return res.status(404).json({ error: 'One or both tools not found' });
    }

    if (toolsRequested.owner.equals(req.user._id)) {
      return res.status(400).json({ error: 'Cannot request exchange with your own tool' });
    }

    const exchange = await ExchangeRequest.create({
      requester: req.user._id,
      receiver: toolsRequested.owner,
      toolsRequested,
      toolsOffered,
    });

    const notification = new Notification({
      user: toolsRequested.owner,
      title: 'Exchange Request',
      message: `${req.user.name} wants to exchange tools with you`,
      type: 'EXCHANGE_REQUEST',
      relatedEntity: exchange._id,
      relatedEntityModel: 'Exchange'
    });

    await notification.save();

    // Change tool statuses
    await Tools.findByIdAndUpdate(toolsRequestedId, { status: 'pending_exchange' });
    await Tools.findByIdAndUpdate(toolsOfferedId, { status: 'pending_exchange' });

    // 🔔 Send notification
    // await sendNotification(
    //   toolsRequested.owner,
    //   'Exchange Request',
    //   `User ${req.user.name} wants to exchange a tool with you.`
    // );

    res.status(201).json({ message: 'Exchange request sent', exchange });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.getExchangeList = async (req, res) => {
  try {
    const userId = req.user._id;

    const exchanges = await ExchangeRequest.find({
      $or: [
        { requester: userId },
        { receiver: userId }
      ]
    })
      .populate('requester', 'name email')
      .populate('receiver', 'name email')
      .populate('toolsRequested', 'name photo description status') // Only include necessary fields
      .populate('toolsOffered', 'name photo description status')  // Only include necessary fields
      .sort({ createdAt: -1 });

    // Format the response to clearly show which exchanges are incoming vs outgoing
    const formattedExchanges = exchanges.map(exchange => {
      const isRequester = exchange.requester._id.equals(userId);
      return {
        ...exchange.toObject(),
        type: isRequester ? 'outgoing' : 'incoming',
        otherParty: isRequester ? exchange.receiver : exchange.requester
      };
    });

    res.json({
      success: true,
      count: exchanges.length,
      exchanges: formattedExchanges
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      error: 'Failed to fetch exchanges',
      message: err.message
    });
  }
};

exports.updateExchangeStatus = async (req, res) => {
  try {
    const id = req.params.id ; // Fallback to static ID if needed
    const { status } = req.body;

    // Verify exchange exists
    const existingExchange = await ExchangeRequest.findById(id).populate('requester receiver toolsRequested toolsOffered');
    if (!existingExchange) {
      return res.status(404).json({
        success: false,
        error: 'Exchange not found',
        details: `No exchange found with ID: ${id}`
      });
    }

    // Update exchange status
    const exchange = await ExchangeRequest.findByIdAndUpdate(
      id,
      { status, updatedAt: Date.now() },
      { new: true }
    );
    await exchange.populate('requester receiver toolsRequested toolsOffered');

    // Create and save notifications
    const notifications = new Notification({
      user: req.user._id,
      title: 'Update Exchange Tools Status',
      message: `${req.user.name} has placed an order for your tool status: ${status}`,
      type: 'OTHER',
      relatedEntity: id,
      relatedEntityModel: 'Order'
    });

    await notifications.save();
    // Handle completed exchange
    if (status === 'completed') {
      await Promise.all([
        Tools.findByIdAndUpdate(exchange.toolsRequested._id, {
          owner: exchange.receiver._id,
          status: 'available'
        }),
        Tools.findByIdAndUpdate(exchange.toolsOffered._id, {
          owner: exchange.requester._id,
          status: 'available'
        })
      ]);
    }

    res.json({
      success: true,
      exchange,
      notifications: 1
    });

  } catch (error) {
    console.error('Error in updateExchangeStatus:', error);
    res.status(500).json({
      success: false,
      error: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
};

// Updated notification service
async function createExchangeNotifications(exchange, status) {
  const notificationsToCreate = [];

  switch (status) {
    case 'pending':
      notificationsToCreate.push({
        user: exchange.receiver._id,
        title: 'New Exchange Request',
        message: `${exchange.requester.name} wants to exchange ${exchange.toolsOffered.name} for your ${exchange.toolsRequested.name}`,
        type: 'EXCHANGE_REQUEST',
        relatedEntity: exchange._id,
        relatedEntityModel: 'ExchangeRequest'
      });
      break;

    case 'accepted':
      notificationsToCreate.push({
        user: exchange.requester._id,
        title: 'Exchange Accepted',
        message: `${exchange.receiver.name} accepted your exchange request`,
        type: 'EXCHANGE_UPDATE',
        relatedEntity: exchange._id,
        relatedEntityModel: 'ExchangeRequest'
      });
      break;

    case 'completed':
      notificationsToCreate.push(
        {
          user: exchange.requester._id,
          title: 'Exchange Completed',
          message: `Your exchange of ${exchange.toolsOffered.name} for ${exchange.toolsRequested.name} is complete`,
          type: 'EXCHANGE_UPDATE',
          relatedEntity: exchange._id,
          relatedEntityModel: 'ExchangeRequest'
        },
        {
          user: exchange.receiver._id,
          title: 'Exchange Completed',
          message: `Your exchange of ${exchange.toolsRequested.name} for ${exchange.toolsOffered.name} is complete`,
          type: 'EXCHANGE_UPDATE',
          relatedEntity: exchange._id,
          relatedEntityModel: 'ExchangeRequest'
        }
      );
      break;
  }

  // Save all notifications to database
  if (notificationsToCreate.length > 0) {
    return await Notification.insertMany(notificationsToCreate);
  }

  return [];
}

```

## File: controllers/mobileCoverController.js

```javascript
const MobileCover = require('../models/mobileCovers');

// Convert flat DB data to nested format
const formatNested = (covers) => {
  const result = {};

  covers.forEach(({ company, model, category, imageUrl }) => {
    if (!result[company]) result[company] = {};
    if (!result[company][model]) result[company][model] = { category: {} };
    if (!result[company][model].category[category]) {
      result[company][model].category[category] = [];
    }
    result[company][model].category[category].push(imageUrl);
  });

  return [{ company: result }];
};

// GET all data nested
const getAllMobileCovers = async (req, res) => {
  try {
    const covers = await MobileCover.find({});
    res.status(200).json(formatNested(covers));
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// POST add new cover
const addMobileCover = async (req, res) => {
  try {
    const { company, model, categories } = req.body;

    // Basic validation
    if (!company || !model || typeof categories !== 'object') {
      return res.status(400).json({ error: 'Invalid request format' });
    }

    const entries = [];

    // Flatten the categories and image URLs
    for (const category in categories) {
      const imageUrls = categories[category];

      if (!Array.isArray(imageUrls)) continue;

      imageUrls.forEach((imageUrl) => {
        entries.push({
          company,
          model,
          category,
          imageUrl,
        });
      });
    }

    // Insert all entries into MongoDB
    const saved = await MobileCover.insertMany(entries);

    res.status(201).json({
      message: 'Mobile cover data added successfully',
      count: saved.length,
      data: saved,
    });
  } catch (error) {
    console.error('Error in addMobileCover:', error);
    res.status(500).json({ error: error.message });
  }
};

// UPDATE: Replace imageUrl
const updateMobileCoverImage = async (req, res) => {
  const { company, model, category, oldImageUrl, newImageUrl } = req.body;
  try {
    const cover = await MobileCover.findOneAndUpdate(
      { company, model, category, imageUrl: oldImageUrl },
      { imageUrl: newImageUrl },
      { new: true }
    );
    if (!cover) return res.status(404).json({ error: 'Cover not found' });

    res.status(200).json({ message: 'Image URL updated', data: cover });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// DELETE: specific image
const deleteCoverImage = async (req, res) => {
  const { company, model, category, imageUrl } = req.body;
  try {
    const deleted = await MobileCover.findOneAndDelete({ company, model, category, imageUrl });
    if (!deleted) return res.status(404).json({ error: 'Image not found' });

    res.status(200).json({ message: 'Image deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// DELETE: entire category or model
const deleteCovers = async (req, res) => {
  const { company, model, category } = req.body;
  try {
    const query = { company };
    if (model) query.model = model;
    if (category) query.category = category;

    const result = await MobileCover.deleteMany(query);

    if (result.deletedCount === 0) {
      return res.status(404).json({ message: 'No records found to delete' });
    }

    res.status(200).json({ message: 'Deleted successfully', count: result.deletedCount });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Optional filtered GET by query
const getMobileCoversByFilter = async (req, res) => {
  try {
    const { company, model, category } = req.query;
    const query = {};
    if (company) query.company = company;
    if (model) query.model = model;
    if (category) query.category = category;

    const covers = await MobileCover.find(query);
    res.status(200).json(formatNested(covers));
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

module.exports = {
  getAllMobileCovers,
  addMobileCover,
  getMobileCoversByFilter,
  updateMobileCoverImage,
  deleteCoverImage,
  deleteCovers
};

```

## File: controllers/notificationController.js

```javascript
const Notification = require('../models/Notification');

exports.getNotifications = async (req, res) => {
  // req.user = { _id: '6843e5e4180cac61ccdf77ec' };
  try {
    const notifications = await Notification.find({ user: req.user._id }).sort({ createdAt: -1 });
    res.json({ notifications });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
exports.markRead = async (req, res) => {
  try {
    const { id } = req.params;
    const notification = await Notification.findOneAndUpdate(
      { _id: id, user: req.user._id },
      { read: true },
      { new: true }
    );

    if (!notification) return res.status(404).json({ error: 'Notification not found' });

    res.json({ message: 'Marked as read', notification });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.deleteMultipleNotifications = async (req, res) => {
  try {
    const { ids } = req.body;

    if (!Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({ error: 'No notification IDs provided' });
    }

    await Notification.deleteMany({
      _id: { $in: ids },
      user: req.user._id,
    });

    res.json({ message: 'Selected notifications deleted successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
exports.deleteAllNotifications = async (req, res) => {
  try {
    await Notification.deleteMany({ user: req.user._id });
    console.log("noti res : ", res)
    res.json({ message: 'All notifications deleted successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
exports.deleteNotification = async (req, res) => {
  try {
    const { id } = req.params;

    const notification = await Notification.findOneAndDelete({
      _id: id,
      user: req.user._id,
    });

    if (!notification) {
      return res.status(404).json({ error: 'Notification not found' });
    }

    res.json({ message: 'Notification deleted successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};



```

## File: controllers/problemController.js

```javascript
const Problem = require('../models/Problem');
const Solution = require('../models/Solution');
const User = require('../models/Users');
const asyncHandler = require('express-async-handler');
const { isValidId, withTransaction } = require('../config/db');

// @desc    Create a new problem
// @route   POST /api/problems
// @access  Private
exports.createProblem = asyncHandler(async (req, res) => {
  const { title, description, rewardType, rewardAmount, deadline, tags } = req.body;

  // Validate reward amount
  // if (rewardAmount <= 0) {
  //   res.status(400);
  //   throw new Error('Reward amount must be greater than zero');
  // }

  const user = await User.findById(req.user._id);
  if (rewardType === 'money' && user.wallet.money < rewardAmount) {
    res.status(400);
    throw new Error('Insufficient money balance');
  }
  // if (rewardType === 'coins' && user.wallet.coins < rewardAmount) {
  //   res.status(400);
  //   throw new Error('Insufficient coins balance');
  // }

  // Reserve the reward amount
  // user.wallet[rewardType] -= rewardAmount;
  await user.save();

  const problem = await Problem.create({
    title,
    description,
    createdBy: req.user._id,
    rewardType,
    rewardAmount,
    deadline,
    tags,
    status: 'open'
  });

  await User.findByIdAndUpdate(req.user._id, {
    $push: { createdProblems: problem._id }
  });

  res.status(201).json(problem);
});

// @desc    Submit a solution to a problem
// @route   POST /api/problems/:id/solutions
// @access  Private
exports.submitSolution = asyncHandler(async (req, res) => {
  const { description, attachments } = req.body;
  const problemId = req.params.id;

  console.log("problem id 00000 : ", problemId)
  
  const problem = await Problem.findById(problemId);
  console.log("problem : ", problem)
  if (!problem) {
    res.status(404);
    throw new Error('Problem not found');
  }

  // Prevent users from submitting solutions to their own problems
  if (problem.createdBy.toString() === req.user._id.toString()) {
    res.status(400);
    throw new Error('You cannot submit solutions to your own problems');
  }

  if (problem.status !== 'open' && problem.status !== 'in-progress') {
    res.status(400);
    throw new Error('Problem is not accepting solutions');
  }

  // Check if user already submitted a solution
  const existingSolution = await Solution.findOne({
    problem: problemId,
    solver: req.user._id
  });

  if (existingSolution) {
    res.status(400);
    throw new Error('You have already submitted a solution to this problem');
  }

  const solution = await Solution.create({
    problem: problemId,
    solver: req.user._id,
    description,
    attachments,
    status: 'submitted'
  });

  // Safely update without triggering revalidation
  await Problem.findByIdAndUpdate(problemId, {
    $set: { status: 'in-progress' },
    $push: { solutions: solution._id }
  });

  // Add solution reference to user
  await User.findByIdAndUpdate(req.user._id, {
    $push: { submittedSolutions: solution._id }
  });

  res.status(201).json(solution);
});


// @desc    Select a solution for a problem
// @route   PUT /api/problems/:id/select-solution
// @access  Private (problem creator only)
exports.selectSolution = asyncHandler(async (req, res) => {
   console.log('Request received:', {
    method: req.method,
    url: req.originalUrl,
    params: req.params,
    body: req.body
  });
  const { solutionId } = req.body;
  const { id: problemId } = req.params;

  // Validate solutionId exists in body
  if (!solutionId) {
    res.status(400);
    throw new Error('solutionId is required in request body');
  }

  // Find the problem and solution in parallel
  const [problem, solution] = await Promise.all([
    Problem.findById(problemId),
    Solution.findById(solutionId)
  ]);

  console.log("first problem", problemId);
  // Validate problem exists
  if (!problem) {
    res.status(404);
    throw new Error('Problem not found');
  }

  // Validate solution exists
  if (!solution) {
    res.status(404);
    throw new Error('Solution not found');
  }

  // Check if user is the problem creator
  if (problem.createdBy.toString() !== req.user._id.toString()) {
    res.status(403);
    throw new Error('Only the problem creator can select solutions');
  }

  // Check problem status
  if (problem.status !== 'in-progress') {
    res.status(400);
    throw new Error('Problem is not in a state to accept solution selection');
  }

  // Check solution belongs to problem
  if (solution.problem.toString() !== problemId) {
    res.status(400);
    throw new Error('Solution does not belong to this problem');
  }

  // Check if solution is already selected
  if (solution.status === 'selected') {
    res.status(400);
    throw new Error('Solution is already selected');
  }

  // Update solution and problem
  solution.status = 'selected';
  problem.selectedSolution = solutionId;
  problem.status = 'completed';

  await withTransaction(async () => {
    await solution.save();
    await problem.save();
  });

  res.status(200).json({ 
    success: true,
    message: 'Solution selected successfully', 
    data: {
      problem: {
        id: problem._id,
        title: problem.title,
        status: problem.status,
        selectedSolution: problem.selectedSolution
      },
      solution: {
        id: solution._id,
        status: solution.status,
        solver: solution.solver
      }
    }
  });
});

// @desc    Distribute reward for a completed problem
// @route   POST /api/problems/:id/distribute-reward
// @access  Private (problem creator only)
exports.distributeReward = asyncHandler(async (req, res) => {
  const problemId = req.params.id;

  const problem = await Problem.findById(problemId)
    .populate('selectedSolution')
    .populate('createdBy', 'wallet');
  
  if (!problem) {
    res.status(404);
    throw new Error('Problem not found');
  }

  if (problem.status !== 'completed' || !problem.selectedSolution) {
    res.status(400);
    throw new Error('Problem is not ready for reward distribution');
  }

  if (problem.createdBy._id.toString() !== req.user._id.toString()) {
    res.status(403);
    throw new Error('Only the problem creator can distribute rewards');
  }

  // The reward was already reserved when creating the problem
  // Now we just need to transfer it to the solver

  const solver = await User.findById(problem.selectedSolution.solver);
  if (!solver) {
    res.status(404);
    throw new Error('Solver not found');
  }

  solver.wallet[problem.rewardType] += problem.rewardAmount;
  problem.status = 'paid';
  problem.selectedSolution.status = 'paid';
  solver.solvedProblems.push(problem._id);

  await Promise.all([
    solver.save(),
    problem.save(),
    problem.selectedSolution.save()
  ]);

  res.json({
    message: 'Reward distributed successfully',
    solver: {
      id: solver._id,
      newBalance: solver.wallet[problem.rewardType]
    },
    creator: {
      id: problem.createdBy._id,
      newBalance: problem.createdBy.wallet[problem.rewardType]
    }
  });
});

// @desc    Get all problems (with filtering options)
// @route   GET /api/problems
// @access  Public
exports.getProblems = asyncHandler(async (req, res) => {
  const { status, rewardType, createdBy, tags } = req.query;
  const query = {};

  if (status) query.status = status;
  if (rewardType) query.rewardType = rewardType;
  if (createdBy) query.createdBy = createdBy;
  if (tags) query.tags = { $in: Array.isArray(tags) ? tags : [tags] };

  const problems = await Problem.find(query)
    .populate('createdBy', 'name email profilePicture')
    .populate({
      path: 'solutions',
      select: 'description status submittedAt',
      populate: {
        path: 'solver',
        select: 'name email profilePicture rating'
      }
    })
    .populate({
      path: 'selectedSolution',
      populate: {
        path: 'solver',
        select: 'name email profilePicture'
      }
    })
    .sort({ createdAt: -1 });

  res.json({
    success: true,
    count: problems.length,
    data: problems
  });
});

// @desc    Get single problem by ID
// @route   GET /api/problems/:id
// @access  Public
exports.getProblemById = asyncHandler(async (req, res) => {
  const problem = await Problem.findById(req.params.id)
    .populate('createdBy', 'name email profilePicture rating')
    .populate({
      path: 'solutions',
      populate: {
        path: 'solver',
        select: 'name email profilePicture rating'
      }
    })
    .populate({
      path: 'selectedSolution',
      populate: {
        path: 'solver',
        select: 'name email profilePicture'
      }
    });

  if (!problem) {
    res.status(404);
    throw new Error('Problem not found');
  }

  res.json({
    success: true,
    data: problem
  });
});

// @desc    Get solutions for a specific problem
// @route   GET /api/problems/:id/solutions
// @access  Public
exports.getProblemSolutions = asyncHandler(async (req, res) => {
  const problem = await Problem.findById(req.params.id);
  if (!problem) {
    res.status(404);
    throw new Error('Problem not found');
  }

  const solutions = await Solution.find({ problem: req.params.id })
    .populate('solver', 'name email profilePicture rating')
    .sort({ submittedAt: -1 });

  res.json({
    success: true,
    count: solutions.length,
    data: solutions
  });
});


// @desc    Delete a problem
// @route   DELETE /api/problems/:id
// @access  Private (problem creator only)
exports.deleteProblem = asyncHandler(async (req, res) => {
  const problemId = req.params.id;

  console.log(`Delete request for problem ${problemId} from user ${req.user._id}`); // Debug log

  const problem = await Problem.findById(problemId);
  if (!problem) {
    console.log('Problem not found'); // Debug log
    return res.status(404).json({ 
      success: false,
      message: 'Problem not found'
    });
  }

  console.log(`Problem creator: ${problem.createdBy}, Request user: ${req.user._id}`); // Debug log

  // Convert both IDs to string for reliable comparison
  if (problem.createdBy.toString() !== req.user._id.toString()) {
    console.log('Authorization failed'); // Debug log
    return res.status(403).json({ 
      success: false,
      message: 'You are not authorized to delete this problem',
      details: {
        problemCreator: problem.createdBy.toString(),
        currentUser: req.user._id.toString()
      }
    });
  }

  try {
    // Refund the reward if the problem wasn't paid yet
    if (problem.status !== 'paid' && problem.status !== 'completed') {
      const creator = await User.findById(req.user._id);
      if (!creator) {
        console.log('Creator user not found'); // Debug log
        return res.status(404).json({ 
          success: false,
          message: 'User account not found'
        });
      }

      console.log(`Refunding ${problem.rewardAmount} ${problem.rewardType} to user ${creator._id}`); // Debug log
      creator.wallet[problem.rewardType] += problem.rewardAmount;
      await creator.save();
    }

    // Delete all associated solutions
    console.log('Deleting associated solutions'); // Debug log
    await Solution.deleteMany({ problem: problemId });

    // Delete the problem
    console.log('Deleting problem document'); // Debug log
    await Problem.findByIdAndDelete(problemId);

    // Remove references from users
    console.log('Cleaning up user references'); // Debug log
    await User.updateMany(
      {
        $or: [
          { createdProblems: problemId },
          { submittedSolutions: { $in: problem.solutions } }
        ]
      },
      {
        $pull: {
          createdProblems: problemId,
          submittedSolutions: { $in: problem.solutions }
        }
      }
    );

    console.log('Deletion completed successfully'); // Debug log
    res.status(200).json({ 
      success: true,
      message: 'Problem and all associated solutions deleted successfully'
    });

  } catch (error) {
    console.error('Error during problem deletion:', error); // Debug log
    res.status(500).json({
      success: false,
      message: 'An error occurred while deleting the problem',
      error: error.message
    });
  }
});

// @desc    Update a problem
// @route   PUT /api/problems/:id
// @access  Private (problem creator only)
exports.updateProblem = asyncHandler(async (req, res) => {
  const { title, description, tags } = req.body;
  const problemId = req.params.id;

  const problem = await Problem.findById(problemId);
  if (!problem) {
    res.status(404);
    throw new Error('Problem not found');
  }

  if (problem.createdBy.toString() !== req.user._id.toString()) {
    res.status(403);
    throw new Error('Only the problem creator can update the problem');
  }

  if (problem.status !== 'open') {
    res.status(400);
    throw new Error('Only open problems can be updated');
  }

  problem.title = title || problem.title;
  problem.description = description || problem.description;
  problem.tags = tags || problem.tags;
  problem.status = 'in-progress'; // Reset status to in-progress on update

  const updatedProblem = await problem.save();

  res.json({
    success: true,
    data: updatedProblem
  });
});


// @desc    Get all problems created by the current user
// @route   GET /api/problems/my-problems
// @access  Private
exports.getCurrentUserProblems = asyncHandler(async (req, res) => {
  try {
    // Find all problems where createdBy matches the logged-in user's ID
    const problems = await Problem.find({ createdBy: req.user._id })
      .populate('createdBy', 'name email') // Basic creator info
      .populate({
        path: 'solutions',
        select: 'description status submittedAt',
        populate: {
          path: 'solver',
          select: 'name email profilePicture' // Solver info
        }
      })
      .populate({
        path: 'selectedSolution',
        populate: {
          path: 'solver',
          select: 'name email' // Selected solver info
        }
      })
      .sort({ createdAt: -1 }); // Newest first

    res.status(200).json({
      success: true,
      count: problems.length,
      data: problems
    });
    
  } catch (error) {
    console.error('Error fetching user problems:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching your problems',
      error: error.message
    });
  }
});

// @desc    Get all problems excluding current user's own problems
// @route   GET /api/problems/others-problems
// @access  Private
exports.getOthersProblems = asyncHandler(async (req, res) => {
  const { status, rewardType, tags } = req.query;
  const query = {
    createdBy: { $ne: req.user._id } // Exclude problems created by current user
  };

  // Add optional filters
  if (status) query.status = status;
  if (rewardType) query.rewardType = rewardType;
  if (tags) query.tags = { $in: Array.isArray(tags) ? tags : [tags] };

  const problems = await Problem.find(query)
    .populate('createdBy', 'name email profilePicture')
    .populate({
      path: 'solutions',
      select: 'description status submittedAt',
      populate: {
        path: 'solver',
        select: 'name email profilePicture rating'
      }
    })
    .populate({
      path: 'selectedSolution',
      populate: {
        path: 'solver',
        select: 'name email profilePicture'
      }
    })
    .sort({ createdAt: -1 });

  res.json({
    success: true,
    count: problems.length,
    data: problems
  });
});

// @desc    Get problem by ID (excluding current user's problems)
// @route   GET /api/problems/:id
// @access  Public (but excludes owner's view of their own problem)
exports.getProblemByIdPublic = asyncHandler(async (req, res) => {
  const { id } = req.params;

  // Validate ID format
  if (!isValidId(id)) {
    res.status(400);
    throw new Error('Invalid problem ID format');
  }

  // Base query - always find by ID
  const query = { _id: id };

  // If user is authenticated, exclude their own problems
  if (req.user) {
    query.createdBy = { $ne: req.user._id };
  }

  const problem = await Problem.findOne(query)
    .populate('createdBy', 'name email profilePicture rating')
    .populate({
      path: 'solutions',
      match: { status: 'submitted' }, // Only show submitted solutions
      populate: {
        path: 'solver',
        select: 'name email profilePicture rating',
        match: req.user ? { _id: { $ne: req.user._id } } : {} // Exclude current user's solutions if authenticated
      }
    })
    .populate({
      path: 'selectedSolution',
      populate: {
        path: 'solver',
        select: 'name email profilePicture'
      }
    });

  if (!problem) {
    res.status(404);
    throw new Error('Problem not found or you are the owner of this problem');
  }

  // For public API, hide sensitive information
  const problemToReturn = req.user ? problem : {
    _id: problem._id,
    title: problem.title,
    description: problem.description,
    rewardType: problem.rewardType,
    rewardAmount: problem.rewardAmount,
    deadline: problem.deadline,
    tags: problem.tags,
    status: problem.status,
    createdAt: problem.createdAt,
    createdBy: problem.createdBy,
    solutionCount: problem.solutions.length
  };

  res.json({
    success: true,
    data: problemToReturn
  });
});

```

## File: controllers/solutionController.js

```javascript
// controllers/solutionController.js

const Solution = require('../models/Solution');
const Problem = require('../models/Problem');
const asyncHandler = require('express-async-handler');

// ✅ Get all solutions submitted by current user
exports.getMySolutions = asyncHandler(async (req, res) => {
  const solutions = await Solution.find({ solver: req.user._id }).populate('problem', 'title');
  res.json(solutions);
});

// ✅ Get one solution by ID (owned by user)
exports.getMySolutionById = asyncHandler(async (req, res) => {
  const solution = await Solution.findOne({ _id: req.params.id, solver: req.user._id }).populate('problem');
  if (!solution) {
    res.status(404);
    throw new Error('Solution not found');
  }
  res.json(solution);
});

// ✅ Create a new solution (only if not already submitted for problem)
exports.createSolution = asyncHandler(async (req, res) => {
  const { description, attachments } = req.body;
  const problemId = req.params.problemId;

  console.log('problem id. :', problemId)
  const problem = await Problem.findById(problemId);
  if (!problem) {
    res.status(404);
    throw new Error('Problem not found');
  }

  if (problem.createdBy.toString() === req.user._id.toString()) {
    res.status(400);
    throw new Error('You cannot submit solutions to your own problems');
  }

  const existing = await Solution.findOne({ problem: problemId, solver: req.user._id });
  if (existing) {
    res.status(400);
    throw new Error('Solution already submitted for this problem');
  }

  const solution = await Solution.create({
    problem: problemId,
    solver: req.user._id,
    description,
    attachments
  });

  await Problem.findByIdAndUpdate(problemId, {
    $set: { status: 'in-progress' },
    $push: { solutions: solution._id }
  });

  await req.user.updateOne({ $push: { submittedSolutions: solution._id } });

  res.status(201).json(solution);
});

// ✅ Update your own solution
exports.updateMySolution = asyncHandler(async (req, res) => {
  const { description, attachments } = req.body;
  const solution = await Solution.findOne({ _id: req.params.id, solver: req.user._id });

  if (!solution) {
    res.status(404);
    throw new Error('Solution not found');
  }

  solution.description = description || solution.description;
  solution.attachments = attachments || solution.attachments;
  await solution.save();

  res.json(solution);
});

// ✅ Delete your own solution
exports.deleteMySolution = asyncHandler(async (req, res) => {
  const solution = await Solution.findOneAndDelete({ _id: req.params.id, solver: req.user._id });

  if (!solution) {
    res.status(404);
    throw new Error('Solution not found or already deleted');
  }

  await Problem.findByIdAndUpdate(solution.problem, {
    $pull: { solutions: solution._id }
  });

  await req.user.updateOne({
    $pull: { submittedSolutions: solution._id }
  });

  res.json({ message: 'Solution deleted successfully' });
});

```

## File: controllers/toolsController.js

```javascript
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

```

## File: controllers/userController.js

```javascript
require('dotenv').config();
const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const User = require('../models/Users');
const jwt = require('jsonwebtoken');
const Tools = require('../models/Tools')
const ExchangeRequest = require('../models/ExchangeRequest');
const Cart = require('../models/Cart')
const Problem = require('../models/Problem');
const Solution = require('../models/Solution');
const { isValidId } = require('../config/db');

// Generate token
const generateToken = (user) => {
  const id = user?._id || user;
  return jwt.sign(
    { id, email: user?.email },
    process.env.JWT_SECRET,
    { expiresIn: '1d' }
  );
};

// Create User
exports.registerUser = async (req, res) => {
  const { name, email, password } = req.body;

  try {
    // Check if user already exists
    const userExists = await User.findOne({ email });
    if (userExists) {
      return res.status(400).json({
        success: false,
        message: 'User already exists'
      });
    }

    // Create new user
    const user = await User.create({
      name,
      email,
      password,
      bio: req.body.bio || '',
      skills: req.body.skills || [],
      experience: req.body.experience || 0,
      organization: req.body.organization || '',
      industry: req.body.industry || ''
    });

    const token = generateToken(user);

    res.status(201).json({
      success: true,
      _id: user._id,
      name: user.name,
      email: user.email,
      bio: user.bio,
      token,
      profilePic: user.profilePic
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error during registration',
      error: error.message
    });
  }
};

// User login
exports.loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Validate input
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide both email and password'
      });
    }

    // Find user by email with password
    const user = await User.findOne({ email }).select('+password');

    // Verify user exists and password matches
    if (!user || !(await user.matchPassword(password))) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }

    // Generate token
    const token = generateToken(user._id);

    // Get user stats similar to dashboard
    const [
      userToolsCount,
      exchangeToolsCount,
      totalToolsCount,
      cartToolsCount,
      problemCount,
      solutionCount,
      userCount
    ] = await Promise.all([
      Tools.countDocuments({ owner: user._id }),
      ExchangeRequest.countDocuments({
        $or: [
          { requester: user._id },
          { receiver: user._id }
        ]
      }),
      Tools.countDocuments({ owner: { $ne: user._id } }),
      Cart.countDocuments({ user: user._id }),
      Problem.countDocuments({ createdBy: user._id }),
      Solution.countDocuments({ solver: user._id }),
      User.countDocuments()
    ]);

    // Return user data with consistent stats structure
    res.status(200).json({
      success: true,
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        bio: user.bio,
        skills: user.skills,
        experience: user.experience,
        organization: user.organization,
        industry: user.industry,
        profilePic: user.profilePic,
        stats: {
          totalTools: totalToolsCount,
          exchangeTools: exchangeToolsCount,
          userTools: userToolsCount,
          cartTools: cartToolsCount,
          problemCount: problemCount,
          solutionCount: solutionCount,
          userCount: userCount
        }
      },
      token
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error during authentication',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Forgot password 
exports.forgotPassword = async (req, res) => {
  const { email } = req.body;

  try {
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'No user with this email'
      });
    }

    // Generate token
    const resetToken = crypto.randomBytes(32).toString('hex');
    const resetTokenExpiry = Date.now() + 3600000; // 1 hour

    user.resetToken = resetToken;
    user.resetTokenExpiry = resetTokenExpiry;
    await user.save();

    // In production, send this resetToken via email
    const resetLink = `${process.env.CLIENT_URL}/reset-password/${resetToken}`;
    console.log('Reset Password Link:', resetLink); // For development

    res.json({
      success: true,
      message: 'Password reset link sent to email',
      resetLink // For development only
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: err.message
    });
  }
};

// Reset password
exports.resetPassword = async (req, res) => {
  const { token } = req.params;
  const { newPassword } = req.body;

  try {
    const user = await User.findOne({
      resetToken: token,
      resetTokenExpiry: { $gt: Date.now() },
    });

    if (!user) {
      return res.status(400).json({
        success: false,
        message: 'Invalid or expired token'
      });
    }

    user.password = newPassword;
    user.resetToken = null;
    user.resetTokenExpiry = null;

    await user.save();
    res.json({
      success: true,
      message: 'Password has been reset successfully'
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: err.message
    });
  }
};

// Update user profile
exports.updateUser = async (req, res) => {
  try {
    const {
      name,
      bio,
      skills,
      experience,
      organization,
      industry,
      profilePic,
      wallet
    } = req.body;

    // Find user by authenticated ID
    const user = await User.findById(req.user._id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Update all fields (required and optional)
    user.name = name;
    user.bio = bio || user.bio; // Keep existing if not provided
    user.skills = skills || user.skills;
    user.experience = experience || user.experience;
    user.organization = organization || user.organization;
    user.industry = industry || user.industry;
    if (profilePic) {
      user.profilePic = profilePic;
    }

    if (wallet) {
      // Add authorization check for wallet updates in production
      if (wallet.coins !== undefined) user.wallet.coins = wallet.coins;
      if (wallet.money !== undefined) user.wallet.money = wallet.money;
    }

    // Save updates
    const updatedUser = await user.save();
    await updatedUser.save();

    res.status(200).json({
      success: true,
      user: updatedUser
    });

  } catch (error) {
    console.error('Update error:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating user profile',
      error: error.message
    });
  }
};

// Delete user
exports.deleteUser = async (req, res) => {
  try {
    const user = await User.findByIdAndDelete(req.user._id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }
    res.json({
      success: true,
      message: 'User deleted successfully'
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: err.message
    });
  }
};

// Get user by ID
exports.getUserById = async (req, res) => {
  try {
    const user = await User.findById(req.user._id)
      .select('-password -resetToken -resetTokenExpiry');

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    res.status(200).json({
      success: true,
      user
    });
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// Get user profile (public)
exports.getUserProfile = async (req, res) => {
  try {
    // Validate the user ID parameter
    const { id } = req.params;
    
    if (!id || !isValidId(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid user ID',
        error: 'ID is either missing or not a valid numeric ID'
      });
    }

    // Get user profile with selected fields
    const user = await User.findById(id)
      .select('name email bio skills experience organization industry profilePic stats rating reviews createdAt')
      .lean();

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
        error: `No user found with ID: ${id}`
      });
    }

    // Get all stats in parallel for better performance
    const [
      userToolsCount,
      exchangeActivitiesCount,
      availableToolsCount,
      cartItemsCount,
      problemsPostedCount,
      solutionsProvidedCount,
      totalUsersCount
    ] = await Promise.all([
      // Tools owned by this user (only active ones)
      Tools.countDocuments({ owner: user._id, status: 'active' }),
      
      // Exchange activities involving this user (only pending/completed)
      ExchangeRequest.countDocuments({
        $or: [
          { requester: user._id },
          { receiver: user._id }
        ],
        status: { $in: ['pending', 'completed'] }
      }),
      
      // Tools available from other users
      Tools.countDocuments({ 
        owner: { $ne: user._id },
        status: 'available'
      }),
      
      // Items in user's cart (only active)
      Cart.countDocuments({ 
        user: user._id,
        status: 'active'
      }),
      
      // Problems posted by user (not resolved)
      Problem.countDocuments({ 
        createdBy: user._id,
        status: { $ne: 'resolved' }
      }),
      
      // Solutions provided by user (only accepted)
      Solution.countDocuments({ 
        solver: user._id,
        isAccepted: true
      }),
      
      // Total active users in platform
      User.countDocuments({ isActive: true })
    ]);

    // Construct the response object
    const response = {
      success: true,
      message: 'User profile retrieved successfully',
      data: {
        user: {
          ...user,
          stats: {
            ownedTools: userToolsCount,
            exchangeActivities: exchangeActivitiesCount,
            availableTools: availableToolsCount,
            cartItems: cartItemsCount,
            problemsPosted: problemsPostedCount,
            solutionsProvided: solutionsProvidedCount,
            communityMembers: totalUsersCount
          }
        }
      }
    };

    return res.status(200).json(response);

  } catch (error) {
    console.error('Error in getUserProfile:', error);
    
    const errorResponse = {
      success: false,
      message: 'Failed to fetch user profile',
      error: error.message
    };

    if (process.env.NODE_ENV === 'development') {
      errorResponse.stack = error.stack;
    }

    return res.status(500).json(errorResponse);
  }
};

// Add review to user
exports.addReview = async (req, res) => {
  try {
    const { rating, comment } = req.body;
    const reviewerId = req.user._id;
    const userId = req.params.id;

    if (rating < 1 || rating > 5) {
      return res.status(400).json({
        success: false,
        message: 'Rating must be between 1 and 5'
      });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Check if reviewer has already reviewed this user
    const existingReview = user.reviews.find(review =>
      review.reviewer.toString() === reviewerId.toString()
    );

    if (existingReview) {
      return res.status(400).json({
        success: false,
        message: 'You have already reviewed this user'
      });
    }

    user.reviews.push({
      rating,
      comment,
      reviewer: reviewerId
    });

    // Recalculate average rating
    const totalRatings = user.reviews.reduce((sum, review) => sum + review.rating, 0);
    user.rating = totalRatings / user.reviews.length;

    await user.save();

    res.status(201).json({
      success: true,
      message: 'Review added successfully',
      user: {
        _id: user._id,
        rating: user.rating,
        reviews: user.reviews
      }
    });
  } catch (error) {
    console.error('Add review error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

```

## File: middleware/authMiddleware.js

```javascript
require('dotenv').config();

const jwt = require('jsonwebtoken');
const User = require('../models/Users');

exports.authMiddleware = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(' ')[1]; // Bearer <token>

    if (!token) {
      return res.status(401).json({ error: 'No token provided' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET); // Your JWT secret
    const user = await User.findById(decoded.id).select('-password');

    if (!user) {
      return res.status(401).json({ error: 'User not found' });
    }

    req.user = user; // ✅ Now req.user is available in controllers
    next();
  } catch (err) {
    res.status(401).json({ error: 'Unauthorized' });
  }
};

```

## File: middleware/upload.js

```javascript
const multer = require('multer');
const path = require('path');

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/');
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    cb(null, file.fieldname + '-' + uniqueSuffix + ext);
  }
});

const fileFilter = (req, file, cb) => {
  if (file.mimetype.startsWith('image/')) {
    cb(null, true);
  } else {
    cb(new Error('Only image files are allowed!'), false);
  }
};

const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB
    files: 1,
    parts: 20 // Limit number of parts
  }
});

module.exports = upload;
```

## File: models/BaseModel.js

```javascript
const { query } = require('../config/db');

class IdValue {
  constructor(value) {
    this.value = value === null || value === undefined ? null : Number(value);
  }

  equals(other) {
    return this.toString() === normalizeValue(other)?.toString();
  }

  toString() {
    return this.value === null ? '' : String(this.value);
  }

  valueOf() {
    return this.value;
  }

  toJSON() {
    return this.value;
  }
}

const normalizeValue = (value) => {
  if (value instanceof IdValue) return value.valueOf();
  if (value && typeof value === 'object' && value._id !== undefined) return normalizeValue(value._id);
  if (value instanceof Date) return value;
  return value;
};

const toSqlDate = (value) => {
  if (!value) return null;
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return date.toISOString().slice(0, 19).replace('T', ' ');
};

const parseJson = (value, fallback) => {
  if (value === null || value === undefined) return fallback;
  if (typeof value !== 'string') return value;
  try {
    return JSON.parse(value);
  } catch (_error) {
    return fallback;
  }
};

const clonePlain = (value) => JSON.parse(JSON.stringify(value));

const hydrateIdFields = (value) => {
  if (value === null || value === undefined) return value;
  if (value instanceof IdValue) return value;
  if (Array.isArray(value)) return value.map(hydrateIdFields);
  if (value instanceof Date) return value;
  if (typeof value !== 'object') return value;

  const result = {};
  Object.entries(value).forEach(([key, item]) => {
    if ((key === '_id' || key === 'id') && item !== null && item !== undefined && !Number.isNaN(Number(item))) {
      result[key] = new IdValue(item);
    } else {
      result[key] = hydrateIdFields(item);
    }
  });
  return result;
};

const serializeValue = (value) => {
  if (value instanceof IdValue) return value.toJSON();
  if (value instanceof Date) return value.toISOString();
  if (Array.isArray(value)) return value.map(serializeValue);
  if (value && typeof value === 'object') {
    const result = {};
    Object.entries(value).forEach(([key, item]) => {
      result[key] = serializeValue(item);
    });
    return result;
  }
  return value;
};

const applyUpdatePayload = (doc, update) => {
  const payload = update || {};

  if (payload.$set) {
    Object.assign(doc, payload.$set);
  }

  if (payload.$push) {
    Object.entries(payload.$push).forEach(([field, value]) => {
      if (!Array.isArray(doc[field])) doc[field] = [];
      doc[field].push(normalizeValue(value));
    });
  }

  if (payload.$pull) {
    Object.entries(payload.$pull).forEach(([field, value]) => {
      if (!Array.isArray(doc[field])) return;
      const values = value && value.$in ? value.$in.map((item) => normalizeValue(item)?.toString()) : [normalizeValue(value)?.toString()];
      doc[field] = doc[field].filter((item) => !values.includes(normalizeValue(item)?.toString()));
    });
  }

  Object.entries(payload).forEach(([field, value]) => {
    if (!field.startsWith('$')) doc[field] = value;
  });
};

class QueryBuilder {
  constructor(model, options = {}) {
    this.model = model;
    this.conditions = options.conditions || {};
    this.single = Boolean(options.single);
    this.deleteOne = Boolean(options.deleteOne);
    this.selection = null;
    this.populates = [];
    this.sortSpec = null;
    this.skipCount = 0;
    this.limitCount = null;
    this.asLean = false;
  }

  select(selection) {
    this.selection = selection;
    return this;
  }

  populate(path, select) {
    if (typeof path === 'string' && path.includes(' ') && select === undefined) {
      path.split(/\s+/).filter(Boolean).forEach((item) => this.populates.push({ path: item }));
      return this;
    }

    if (typeof path === 'object') {
      this.populates.push(path);
      return this;
    }

    this.populates.push({ path, select });
    return this;
  }

  sort(spec) {
    this.sortSpec = spec;
    return this;
  }

  skip(count) {
    this.skipCount = Number(count) || 0;
    return this;
  }

  limit(count) {
    this.limitCount = Number(count);
    return this;
  }

  lean() {
    this.asLean = true;
    return this;
  }

  async exec() {
    const records = this.deleteOne
      ? await this.model.findInternal(this.conditions, { sort: this.sortSpec, limit: 1, offset: this.skipCount })
      : await this.model.findInternal(this.conditions, {
          sort: this.sortSpec,
          limit: this.single ? 1 : this.limitCount,
          offset: this.skipCount
        });

    if (this.deleteOne) {
      const doc = records[0] || null;
      if (doc) await this.model.deleteMany({ _id: doc._id });
      return this.finalize(doc);
    }

    const value = this.single ? records[0] || null : records;
    return this.finalize(value);
  }

  async finalize(value) {
    if (Array.isArray(value)) {
      for (const doc of value) {
        await this.applyPopulates(doc);
      }
      const selected = value.map((doc) => this.model.applySelection(doc, this.selection));
      return this.asLean ? selected.map((doc) => doc.toObject()) : selected;
    }

    if (value) {
      await this.applyPopulates(value);
      value = this.model.applySelection(value, this.selection);
    }

    return this.asLean && value ? value.toObject() : value;
  }

  async applyPopulates(doc) {
    for (const populate of this.populates) {
      await this.model.populateDocument(doc, populate);
    }
  }

  then(resolve, reject) {
    return this.exec().then(resolve, reject);
  }

  catch(reject) {
    return this.exec().catch(reject);
  }
}

class BaseModel {
  constructor(data = {}, options = {}) {
    Object.assign(this, hydrateIdFields(this.constructor.applyDefaults(data)));
    this._isNew = options.isNew !== false;
    this._original = clonePlain(this.toObject());
  }

  static get table() {
    throw new Error('Model table is not defined');
  }

  static get columns() {
    return {};
  }

  static get jsonFields() {
    return [];
  }

  static get dateFields() {
    return [];
  }

  static get booleanFields() {
    return [];
  }

  static get refFields() {
    return {};
  }

  static get defaults() {
    return {};
  }

  static get virtualPopulates() {
    return {};
  }

  static modelFor(name) {
    const models = {
      User: () => require('./Users'),
      Users: () => require('./Users'),
      Tools: () => require('./Tools'),
      Tool: () => require('./Tools'),
      Cart: () => require('./Cart'),
      ExchangeRequest: () => require('./ExchangeRequest'),
      Exchange: () => require('./ExchangeRequest'),
      Notification: () => require('./Notification'),
      Problem: () => require('./Problem'),
      Solution: () => require('./Solution')
    };

    return models[name]?.();
  }

  static rowToData(row) {
    const data = { _id: new IdValue(row.id) };

    Object.entries(this.columns).forEach(([prop, column]) => {
      let value = row[column];
      if (this.jsonFields.includes(prop)) value = parseJson(value, []);
      if (this.booleanFields.includes(prop)) value = Boolean(value);
      if (this.refFields[prop] && value !== null && value !== undefined) value = new IdValue(value);
      data[prop] = value;
    });

    return data;
  }

  static dataToColumns(data) {
    const columns = {};

    Object.entries(this.columns).forEach(([prop, column]) => {
      if (data[prop] === undefined) return;
      let value = normalizeValue(data[prop]);
      if (this.jsonFields.includes(prop)) value = JSON.stringify(value || []);
      if (this.booleanFields.includes(prop)) value = value ? 1 : 0;
      if (this.dateFields.includes(prop)) value = toSqlDate(value);
      columns[column] = value;
    });

    return columns;
  }

  static hydrate(row) {
    return new this(this.rowToData(row), { isNew: false });
  }

  static applyDefaults(data = {}) {
    const result = { ...data };

    Object.entries(this.defaults).forEach(([field, value]) => {
      if (result[field] === undefined) {
        result[field] = typeof value === 'function' ? value() : clonePlain(value);
      }
    });

    return result;
  }

  static find(conditions = {}) {
    return new QueryBuilder(this, { conditions });
  }

  static findOne(conditions = {}) {
    return new QueryBuilder(this, { conditions, single: true });
  }

  static findById(id) {
    return this.findOne({ _id: id });
  }

  static async create(data) {
    const doc = new this(this.applyDefaults(data));
    await doc.save();
    return doc;
  }

  static async insertMany(records) {
    const saved = [];
    for (const record of records) {
      saved.push(await this.create(record));
    }
    return saved;
  }

  static async countDocuments(conditions = {}) {
    const { where, params } = this.buildWhere(conditions);
    const rows = await query(`SELECT COUNT(*) AS count FROM ${this.table}${where}`, params);
    return Number(rows[0]?.count || 0);
  }

  static async findInternal(conditions = {}, options = {}) {
    const { where, params } = this.buildWhere(conditions);
    const order = this.buildOrder(options.sort);
    const limit = options.limit ? ` LIMIT ${Number(options.limit)}` : '';
    const offset = options.offset ? ` OFFSET ${Number(options.offset)}` : '';
    const rows = await query(`SELECT * FROM ${this.table}${where}${order}${limit}${offset}`, params);
    return rows.map((row) => this.hydrate(row));
  }

  static findOneAndDelete(conditions = {}) {
    return new QueryBuilder(this, { conditions, deleteOne: true });
  }

  static async findByIdAndDelete(id) {
    return this.findOneAndDelete({ _id: id });
  }

  static async deleteMany(conditions = {}) {
    const { where, params } = this.buildWhere(conditions);
    const result = await query(`DELETE FROM ${this.table}${where}`, params);
    return { deletedCount: result.affectedRows || 0 };
  }

  static async findOneAndUpdate(conditions = {}, update = {}, options = {}) {
    const doc = await this.findOne(conditions);
    if (!doc) return null;
    applyUpdatePayload(doc, update);
    await doc.save();
    return options.new === false ? null : doc;
  }

  static async findByIdAndUpdate(id, update = {}, options = {}) {
    return this.findOneAndUpdate({ _id: id }, update, options);
  }

  static async updateMany(conditions = {}, update = {}) {
    const docs = await this.find(conditions);
    for (const doc of docs) {
      applyUpdatePayload(doc, update);
      await doc.save();
    }
    return { modifiedCount: docs.length };
  }

  static buildWhere(conditions = {}) {
    const parts = [];
    const params = [];

    const appendCondition = (field, value) => {
      const column = this.columnFor(field);
      if (!column) {
        parts.push(this.unknownCondition(value));
        return;
      }

      if (value && typeof value === 'object' && !(value instanceof IdValue) && !(value instanceof Date) && !Array.isArray(value) && value._id === undefined) {
        Object.entries(value).forEach(([operator, operand]) => {
          switch (operator) {
            case '$ne':
              parts.push(`(${column} IS NULL OR ${column} <> ?)`);
              params.push(normalizeValue(operand));
              break;
            case '$in':
              if (this.jsonFields.includes(field)) {
                parts.push(`JSON_OVERLAPS(${column}, CAST(? AS JSON))`);
                params.push(JSON.stringify(operand.map(normalizeValue)));
              } else if (operand.length === 0) {
                parts.push('1 = 0');
              } else {
                parts.push(`${column} IN (${operand.map(() => '?').join(', ')})`);
                params.push(...operand.map(normalizeValue));
              }
              break;
            case '$gt':
              parts.push(`${column} > ?`);
              params.push(this.dateFields.includes(field) ? toSqlDate(operand) : normalizeValue(operand));
              break;
            case '$gte':
              parts.push(`${column} >= ?`);
              params.push(normalizeValue(operand));
              break;
            case '$lte':
              parts.push(`${column} <= ?`);
              params.push(normalizeValue(operand));
              break;
            case '$regex':
              parts.push(`${column} LIKE ?`);
              params.push(`%${operand}%`);
              break;
            case '$options':
              break;
            default:
              parts.push(`${column} = ?`);
              params.push(normalizeValue(operand));
          }
        });
        return;
      }

      if (value === null) {
        parts.push(`${column} IS NULL`);
      } else {
        parts.push(`${column} = ?`);
        params.push(normalizeValue(value));
      }
    };

    Object.entries(conditions || {}).forEach(([field, value]) => {
      if (field === '$or' && Array.isArray(value)) {
        const orParts = value.map((item) => this.buildWhere(item)).filter((item) => item.where);
        if (orParts.length) {
          parts.push(`(${orParts.map((item) => item.where.replace(/^ WHERE /, '')).join(' OR ')})`);
          orParts.forEach((item) => params.push(...item.params));
        }
        return;
      }

      appendCondition(field, value);
    });

    return {
      where: parts.length ? ` WHERE ${parts.join(' AND ')}` : '',
      params
    };
  }

  static unknownCondition(value) {
    if (value && typeof value === 'object' && value.$ne !== undefined) return '1 = 1';
    return '1 = 0';
  }

  static columnFor(field) {
    if (field === '_id' || field === 'id') return 'id';
    return this.columns[field];
  }

  static buildOrder(sortSpec) {
    if (!sortSpec) return '';

    if (typeof sortSpec === 'string') {
      const direction = sortSpec.startsWith('-') ? 'DESC' : 'ASC';
      const field = sortSpec.replace(/^-/, '');
      const column = this.columnFor(field);
      return column ? ` ORDER BY ${column} ${direction}` : '';
    }

    const parts = Object.entries(sortSpec)
      .map(([field, direction]) => {
        const column = this.columnFor(field);
        return column ? `${column} ${Number(direction) < 0 ? 'DESC' : 'ASC'}` : null;
      })
      .filter(Boolean);

    return parts.length ? ` ORDER BY ${parts.join(', ')}` : '';
  }

  static applySelection(doc, selection) {
    if (!doc || !selection) return doc;
    const tokens = String(selection).split(/\s+/).filter(Boolean);
    if (!tokens.length) return doc;

    const plain = doc.toObject({ keepIds: true });
    const includeMode = tokens.some((token) => !token.startsWith('-') && !token.startsWith('+'));

    if (includeMode) {
      const selected = { _id: plain._id };
      tokens.forEach((token) => {
        if (token.startsWith('-') || token.startsWith('+')) return;
        if (plain[token] !== undefined) selected[token] = plain[token];
      });
      return new this(selected, { isNew: false });
    }

    tokens.forEach((token) => {
      if (token.startsWith('-')) delete plain[token.slice(1)];
    });

    return new this(plain, { isNew: false });
  }

  static async populateDocument(doc, populate) {
    if (!doc) return doc;
    const config = typeof populate === 'string' ? { path: populate } : populate;
    const path = config.path;
    const virtual = this.virtualPopulates[path];

    if (virtual) {
      const RelatedModel = this.modelFor(virtual.model);
      let related = await RelatedModel.find({ [virtual.foreignField]: doc[virtual.localField] });
      if (config.match) related = related.filter((item) => matchesPlain(item, config.match));
      for (const item of related) {
        if (config.populate) await RelatedModel.populateDocument(item, config.populate);
      }
      doc[path] = related.map((item) => RelatedModel.applySelection(item, config.select));
      return doc;
    }

    const refName = this.refFields[path];
    if (!refName) return doc;

    const RelatedModel = this.modelFor(refName);
    const id = doc[path];
    if (!id) {
      doc[path] = null;
      return doc;
    }

    let related = await RelatedModel.findById(id);
    if (related && config.match && !matchesPlain(related, config.match)) related = null;
    if (related && config.populate) await RelatedModel.populateDocument(related, config.populate);
    doc[path] = related ? RelatedModel.applySelection(related, config.select) : null;
    return doc;
  }

  async save(_options = {}) {
    if (this.constructor.beforeSave) await this.constructor.beforeSave(this);
    const columns = this.constructor.dataToColumns(this);

    if (this._isNew || !this._id) {
      const entries = Object.entries(columns);
      const names = entries.map(([column]) => column);
      const params = entries.map(([, value]) => value);
      const placeholders = names.map(() => '?').join(', ');
      const result = await query(`INSERT INTO ${this.constructor.table} (${names.join(', ')}) VALUES (${placeholders})`, params);
      this._id = new IdValue(result.insertId);
      this._isNew = false;
    } else {
      const entries = Object.entries(columns);
      const assignments = entries.map(([column]) => `${column} = ?`).join(', ');
      const params = [...entries.map(([, value]) => value), normalizeValue(this._id)];
      await query(`UPDATE ${this.constructor.table} SET ${assignments} WHERE id = ?`, params);
    }

    this._original = clonePlain(this.toObject());
    return this;
  }

  async updateOne(update = {}) {
    applyUpdatePayload(this, update);
    await this.save();
    return { modifiedCount: 1 };
  }

  async populate(path, select) {
    if (typeof path === 'string' && path.includes(' ') && select === undefined) {
      for (const item of path.split(/\s+/).filter(Boolean)) {
        await this.constructor.populateDocument(this, { path: item });
      }
      return this;
    }

    await this.constructor.populateDocument(this, typeof path === 'object' ? path : { path, select });
    return this;
  }

  isModified(field) {
    return serializeValue(this[field]) !== serializeValue(this._original[field]);
  }

  toObject(options = {}) {
    const plain = {};
    Object.keys(this).forEach((key) => {
      if (key.startsWith('_') && key !== '_id') return;
      plain[key] = options.keepIds ? this[key] : serializeValue(this[key]);
    });
    return plain;
  }

  toJSON() {
    return this.toObject();
  }
}

const matchesPlain = (doc, conditions = {}) => {
  const plain = doc.toObject ? doc.toObject({ keepIds: true }) : doc;

  return Object.entries(conditions).every(([field, expected]) => {
    const actual = plain[field];
    if (expected && typeof expected === 'object' && expected.$ne !== undefined) {
      return normalizeValue(actual)?.toString() !== normalizeValue(expected.$ne)?.toString();
    }
    return normalizeValue(actual)?.toString() === normalizeValue(expected)?.toString();
  });
};

module.exports = {
  BaseModel,
  IdValue,
  normalizeValue,
  toSqlDate,
  parseJson,
  applyUpdatePayload
};

```

## File: models/Cart.js

```javascript
const { BaseModel } = require('./BaseModel');

class Cart extends BaseModel {
  static get table() {
    return 'cart_items';
  }

  static get columns() {
    return {
      user: 'user_id',
      tool: 'tool_id',
      quantity: 'quantity',
      addedAt: 'added_at'
    };
  }

  static get refFields() {
    return {
      user: 'User',
      tool: 'Tools'
    };
  }

  static get dateFields() {
    return ['addedAt'];
  }

  static get defaults() {
    return {
      quantity: 1,
      addedAt: () => new Date()
    };
  }

  static async beforeSave(cartItem) {
    if (!cartItem.quantity) cartItem.quantity = 1;
    if (cartItem.quantity < 1) throw new Error('Quantity must be at least 1');
  }
}

module.exports = Cart;

```

## File: models/ExchangeRequest.js

```javascript
const { BaseModel } = require('./BaseModel');

class ExchangeRequest extends BaseModel {
  static get table() {
    return 'exchange_requests';
  }

  static get columns() {
    return {
      requester: 'requester_id',
      receiver: 'receiver_id',
      toolsRequested: 'tools_requested_id',
      toolsOffered: 'tools_offered_id',
      status: 'status',
      createdAt: 'created_at',
      updatedAt: 'updated_at'
    };
  }

  static get refFields() {
    return {
      requester: 'User',
      receiver: 'User',
      toolsRequested: 'Tools',
      toolsOffered: 'Tools'
    };
  }

  static get dateFields() {
    return ['createdAt', 'updatedAt'];
  }

  static get defaults() {
    return {
      status: 'pending',
      createdAt: () => new Date(),
      updatedAt: () => new Date()
    };
  }

  static async beforeSave(exchangeRequest) {
    exchangeRequest.updatedAt = new Date();
  }
}

module.exports = ExchangeRequest;

```

## File: models/Notification.js

```javascript
const { BaseModel } = require('./BaseModel');

class Notification extends BaseModel {
  static get table() {
    return 'notifications';
  }

  static get columns() {
    return {
      user: 'user_id',
      title: 'title',
      message: 'message',
      type: 'type',
      relatedEntity: 'related_entity_id',
      relatedEntityModel: 'related_entity_model',
      read: 'is_read',
      createdAt: 'created_at'
    };
  }

  static get refFields() {
    return {
      user: 'User'
    };
  }

  static get booleanFields() {
    return ['read'];
  }

  static get dateFields() {
    return ['createdAt'];
  }

  static get defaults() {
    return {
      read: false,
      createdAt: () => new Date()
    };
  }
}

module.exports = Notification;

```

## File: models/Problem.js

```javascript
const { BaseModel } = require('./BaseModel');

class Problem extends BaseModel {
  static get table() {
    return 'problems';
  }

  static get columns() {
    return {
      title: 'title',
      description: 'description',
      createdBy: 'created_by',
      rewardType: 'reward_type',
      rewardAmount: 'reward_amount',
      deadline: 'deadline',
      tags: 'tags',
      selectedSolution: 'selected_solution_id',
      status: 'status',
      createdAt: 'created_at'
    };
  }

  static get refFields() {
    return {
      createdBy: 'User',
      selectedSolution: 'Solution'
    };
  }

  static get virtualPopulates() {
    return {
      solutions: {
        model: 'Solution',
        localField: '_id',
        foreignField: 'problem'
      }
    };
  }

  static get jsonFields() {
    return ['tags'];
  }

  static get dateFields() {
    return ['deadline', 'createdAt'];
  }

  static get defaults() {
    return {
      tags: [],
      selectedSolution: null,
      status: 'open',
      createdAt: () => new Date()
    };
  }

  static async beforeSave(problem) {
    if (!problem.title) throw new Error('Please add a title');
    if (problem.title.length > 100) throw new Error('Title cannot be more than 100 characters');
    if (!problem.description) throw new Error('Please add a description');
    if (problem.description.length > 5000) throw new Error('Description cannot be more than 5000 characters');
    if (problem.rewardAmount < 1) throw new Error('Reward amount must be at least 1');
    if (problem.deadline && new Date(problem.deadline).getTime() <= Date.now()) {
      throw new Error('Deadline must be in the future');
    }
    if (problem.tags && problem.tags.length > 5) throw new Error('Cannot have more than 5 tags');
  }
}

module.exports = Problem;

```

## File: models/Solution.js

```javascript
const { BaseModel } = require('./BaseModel');

class Solution extends BaseModel {
  static get table() {
    return 'solutions';
  }

  static get columns() {
    return {
      problem: 'problem_id',
      solver: 'solver_id',
      description: 'description',
      status: 'status',
      submittedAt: 'submitted_at',
      attachments: 'attachments'
    };
  }

  static get refFields() {
    return {
      problem: 'Problem',
      solver: 'User'
    };
  }

  static get jsonFields() {
    return ['attachments'];
  }

  static get dateFields() {
    return ['submittedAt'];
  }

  static get defaults() {
    return {
      status: 'submitted',
      submittedAt: () => new Date(),
      attachments: []
    };
  }

  static async beforeSave(solution) {
    if (!solution.description) throw new Error('Description is required');
  }
}

module.exports = Solution;

```

## File: models/Tools.js

```javascript
const { BaseModel } = require('./BaseModel');

class Tools extends BaseModel {
  static get table() {
    return 'tools';
  }

  static get columns() {
    return {
      name: 'name',
      description: 'description',
      price: 'price',
      photo: 'photo',
      quantity: 'quantity',
      status: 'status',
      owner: 'owner_id',
      buyer: 'buyer_id',
      createdAt: 'created_at',
      updatedAt: 'updated_at'
    };
  }

  static get refFields() {
    return {
      owner: 'User',
      buyer: 'User'
    };
  }

  static get dateFields() {
    return ['createdAt', 'updatedAt'];
  }

  static get defaults() {
    return {
      quantity: 1,
      status: 'available',
      buyer: null,
      createdAt: () => new Date(),
      updatedAt: () => new Date()
    };
  }

  static async beforeSave(tool) {
    if (tool.quantity === undefined || tool.quantity === null) tool.quantity = 1;
    if (tool.quantity < 0) throw new Error('Quantity cannot be negative');
    tool.updatedAt = new Date();
  }
}

module.exports = Tools;

```

## File: models/Users.js

```javascript
const bcrypt = require('bcryptjs');
const { BaseModel, parseJson, toSqlDate } = require('./BaseModel');

class User extends BaseModel {
  static get table() {
    return 'users';
  }

  static get columns() {
    return {
      name: 'name',
      email: 'email',
      password: 'password',
      bio: 'bio',
      skills: 'skills',
      experience: 'experience',
      organization: 'organization',
      industry: 'industry',
      solvedProblems: 'solved_problems',
      createdProblems: 'created_problems',
      submittedSolutions: 'submitted_solutions',
      rating: 'rating',
      reviews: 'reviews',
      profilePic: 'profile_pic',
      resetToken: 'reset_token',
      resetTokenExpiry: 'reset_token_expiry',
      createdAt: 'created_at',
      lastActive: 'last_active'
    };
  }

  static get jsonFields() {
    return ['skills', 'solvedProblems', 'createdProblems', 'submittedSolutions', 'reviews'];
  }

  static get dateFields() {
    return ['resetTokenExpiry', 'createdAt', 'lastActive'];
  }

  static get defaults() {
    return {
      bio: '',
      skills: [],
      experience: 0,
      organization: '',
      industry: '',
      wallet: { coins: 0, money: 0 },
      solvedProblems: [],
      createdProblems: [],
      submittedSolutions: [],
      stats: { problemsCreated: 0, problemsSolved: 0, successRate: 0 },
      rating: 0,
      reviews: [],
      profilePic: 'default-profile.jpg',
      createdAt: () => new Date(),
      lastActive: () => new Date()
    };
  }

  static rowToData(row) {
    const data = super.rowToData(row);
    data.wallet = {
      coins: Number(row.wallet_coins || 0),
      money: Number(row.wallet_money || 0)
    };
    data.stats = {
      problemsCreated: Number(row.stats_problems_created || 0),
      problemsSolved: Number(row.stats_problems_solved || 0),
      successRate: Number(row.stats_success_rate || 0)
    };
    data.skills = parseJson(row.skills, []);
    data.solvedProblems = parseJson(row.solved_problems, []);
    data.createdProblems = parseJson(row.created_problems, []);
    data.submittedSolutions = parseJson(row.submitted_solutions, []);
    data.reviews = parseJson(row.reviews, []);
    return data;
  }

  static dataToColumns(data) {
    const columns = super.dataToColumns(data);
    columns.wallet_coins = data.wallet?.coins ?? 0;
    columns.wallet_money = data.wallet?.money ?? 0;
    columns.stats_problems_created = data.stats?.problemsCreated ?? 0;
    columns.stats_problems_solved = data.stats?.problemsSolved ?? 0;
    columns.stats_success_rate = data.stats?.successRate ?? 0;
    if (data.resetTokenExpiry !== undefined) columns.reset_token_expiry = toSqlDate(data.resetTokenExpiry);
    return columns;
  }

  static async beforeSave(user) {
    if (user.email) user.email = user.email.trim().toLowerCase();
    if (!user.password || user.password.startsWith('$2')) return;

    if (user.password.length < 6) {
      throw new Error('Password must be at least 6 characters');
    }

    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(user.password, salt);
  }

  async matchPassword(enteredPassword) {
    return bcrypt.compare(enteredPassword, this.password);
  }

  updateStats() {
    this.stats.problemsCreated = this.createdProblems.length;
    this.stats.problemsSolved = this.solvedProblems.length;
    this.stats.successRate = this.createdProblems.length > 0
      ? (this.solvedProblems.length / this.createdProblems.length) * 100
      : 0;
  }
}

module.exports = User;

```

## File: models/mobileCovers.js

```javascript
const { BaseModel } = require('./BaseModel');

class MobileCover extends BaseModel {
  static get table() {
    return 'mobile_covers';
  }

  static get columns() {
    return {
      company: 'company',
      model: 'model',
      category: 'category',
      imageUrl: 'image_url',
      createdAt: 'created_at',
      updatedAt: 'updated_at'
    };
  }

  static get dateFields() {
    return ['createdAt', 'updatedAt'];
  }

  static get defaults() {
    return {
      createdAt: () => new Date(),
      updatedAt: () => new Date()
    };
  }

  static async beforeSave(cover) {
    cover.updatedAt = new Date();
  }
}

module.exports = MobileCover;

```

## File: package-lock.json

```json
{
  "name": "server",
  "version": "1.0.0",
  "lockfileVersion": 3,
  "requires": true,
  "packages": {
    "": {
      "name": "server",
      "version": "1.0.0",
      "license": "ISC",
      "dependencies": {
        "bcryptjs": "^3.0.3",
        "cors": "^2.8.5",
        "dotenv": "^16.5.0",
        "express": "^5.1.0",
        "express-async-handler": "^1.2.0",
        "jsonwebtoken": "^9.0.2",
        "multer": "^2.0.1",
        "mysql2": "^3.14.1",
        "nodemailer": "^7.0.3",
        "razorpay": "^2.9.6",
        "swagger-jsdoc": "^6.3.0",
        "swagger-ui-express": "^5.0.1",
        "url": "^0.11.4"
      },
      "devDependencies": {
        "nodemon": "^3.1.10"
      }
    },
    "node_modules/@apidevtools/json-schema-ref-parser": {
      "version": "14.0.1",
      "resolved": "https://registry.npmjs.org/@apidevtools/json-schema-ref-parser/-/json-schema-ref-parser-14.0.1.tgz",
      "integrity": "sha512-Oc96zvmxx1fqoSEdUmfmvvb59/KDOnUoJ7s2t7bISyAn0XEz57LCCw8k2Y4Pf3mwKaZLMciESALORLgfe2frCw==",
      "license": "MIT",
      "dependencies": {
        "@types/json-schema": "^7.0.15",
        "js-yaml": "^4.1.0"
      },
      "engines": {
        "node": ">= 16"
      },
      "funding": {
        "url": "https://github.com/sponsors/philsturgeon"
      }
    },
    "node_modules/@apidevtools/openapi-schemas": {
      "version": "2.1.0",
      "resolved": "https://registry.npmjs.org/@apidevtools/openapi-schemas/-/openapi-schemas-2.1.0.tgz",
      "integrity": "sha512-Zc1AlqrJlX3SlpupFGpiLi2EbteyP7fXmUOGup6/DnkRgjP9bgMM/ag+n91rsv0U1Gpz0H3VILA/o3bW7Ua6BQ==",
      "license": "MIT",
      "engines": {
        "node": ">=10"
      }
    },
    "node_modules/@apidevtools/swagger-methods": {
      "version": "3.0.2",
      "resolved": "https://registry.npmjs.org/@apidevtools/swagger-methods/-/swagger-methods-3.0.2.tgz",
      "integrity": "sha512-QAkD5kK2b1WfjDS/UQn/qQkbwF31uqRjPTrsCs5ZG9BQGAkjwvqGFjjPqAuzac/IYzpPtRzjCP1WrTuAIjMrXg==",
      "license": "MIT"
    },
    "node_modules/@apidevtools/swagger-parser": {
      "version": "12.1.0",
      "resolved": "https://registry.npmjs.org/@apidevtools/swagger-parser/-/swagger-parser-12.1.0.tgz",
      "integrity": "sha512-e5mJoswsnAX0jG+J09xHFYQXb/bUc5S3pLpMxUuRUA2H8T2kni3yEoyz2R3Dltw5f4A6j6rPNMpWTK+iVDFlng==",
      "license": "MIT",
      "dependencies": {
        "@apidevtools/json-schema-ref-parser": "14.0.1",
        "@apidevtools/openapi-schemas": "^2.1.0",
        "@apidevtools/swagger-methods": "^3.0.2",
        "ajv": "^8.17.1",
        "ajv-draft-04": "^1.0.0",
        "call-me-maybe": "^1.0.2"
      },
      "peerDependencies": {
        "openapi-types": ">=7"
      }
    },
    "node_modules/@isaacs/cliui": {
      "version": "9.0.0",
      "resolved": "https://registry.npmjs.org/@isaacs/cliui/-/cliui-9.0.0.tgz",
      "integrity": "sha512-AokJm4tuBHillT+FpMtxQ60n8ObyXBatq7jD2/JA9dxbDDokKQm8KMht5ibGzLVU9IJDIKK4TPKgMHEYMn3lMg==",
      "license": "BlueOak-1.0.0",
      "engines": {
        "node": ">=18"
      }
    },
    "node_modules/@scarf/scarf": {
      "version": "1.4.0",
      "resolved": "https://registry.npmjs.org/@scarf/scarf/-/scarf-1.4.0.tgz",
      "integrity": "sha512-xxeapPiUXdZAE3che6f3xogoJPeZgig6omHEy1rIY5WVsB3H2BHNnZH+gHG6x91SCWyQCzWGsuL2Hh3ClO5/qQ==",
      "hasInstallScript": true,
      "license": "Apache-2.0"
    },
    "node_modules/@types/json-schema": {
      "version": "7.0.15",
      "resolved": "https://registry.npmjs.org/@types/json-schema/-/json-schema-7.0.15.tgz",
      "integrity": "sha512-5+fP8P8MFNC+AyZCDxrB2pkZFPGzqQWUzpSeuuVLvm8VMcorNYavBqoFcxK8bQz4Qsbn4oUEEem4wDLfcysGHA==",
      "license": "MIT"
    },
    "node_modules/@types/node": {
      "version": "25.9.3",
      "resolved": "https://registry.npmjs.org/@types/node/-/node-25.9.3.tgz",
      "integrity": "sha512-603BddQMv3pUcr4U2dhujk83N2tTDVr/34wII2B6bJy6g+8WD6yUb11jszNs0gdi4PesVWl7ABt8nYMVpnLUcg==",
      "license": "MIT",
      "peer": true,
      "dependencies": {
        "undici-types": ">=7.24.0 <7.24.7"
      }
    },
    "node_modules/accepts": {
      "version": "2.0.0",
      "resolved": "https://registry.npmjs.org/accepts/-/accepts-2.0.0.tgz",
      "integrity": "sha512-5cvg6CtKwfgdmVqY1WIiXKc3Q1bkRqGLi+2W/6ao+6Y7gu/RCwRuAhGEzh5B4KlszSuTLgZYuqFqo5bImjNKng==",
      "license": "MIT",
      "dependencies": {
        "mime-types": "^3.0.0",
        "negotiator": "^1.0.0"
      },
      "engines": {
        "node": ">= 0.6"
      }
    },
    "node_modules/ajv": {
      "version": "8.20.0",
      "resolved": "https://registry.npmjs.org/ajv/-/ajv-8.20.0.tgz",
      "integrity": "sha512-Thbli+OlOj+iMPYFBVBfJ3OmCAnaSyNn4M1vz9T6Gka5Jt9ba/HIR56joy65tY6kx/FCF5VXNB819Y7/GUrBGA==",
      "license": "MIT",
      "dependencies": {
        "fast-deep-equal": "^3.1.3",
        "fast-uri": "^3.0.1",
        "json-schema-traverse": "^1.0.0",
        "require-from-string": "^2.0.2"
      },
      "funding": {
        "type": "github",
        "url": "https://github.com/sponsors/epoberezkin"
      }
    },
    "node_modules/ajv-draft-04": {
      "version": "1.0.0",
      "resolved": "https://registry.npmjs.org/ajv-draft-04/-/ajv-draft-04-1.0.0.tgz",
      "integrity": "sha512-mv00Te6nmYbRp5DCwclxtt7yV/joXJPGS7nM+97GdxvuttCOfgI3K4U25zboyeX0O+myI8ERluxQe5wljMmVIw==",
      "license": "MIT",
      "peerDependencies": {
        "ajv": "^8.5.0"
      },
      "peerDependenciesMeta": {
        "ajv": {
          "optional": true
        }
      }
    },
    "node_modules/anymatch": {
      "version": "3.1.3",
      "resolved": "https://registry.npmjs.org/anymatch/-/anymatch-3.1.3.tgz",
      "integrity": "sha512-KMReFUr0B4t+D+OBkjR3KYqvocp2XaSzO55UcB6mgQMd3KbcE+mWTyvVV7D/zsdEbNnV6acZUutkiHQXvTr1Rw==",
      "dev": true,
      "license": "ISC",
      "dependencies": {
        "normalize-path": "^3.0.0",
        "picomatch": "^2.0.4"
      },
      "engines": {
        "node": ">= 8"
      }
    },
    "node_modules/append-field": {
      "version": "1.0.0",
      "resolved": "https://registry.npmjs.org/append-field/-/append-field-1.0.0.tgz",
      "integrity": "sha512-klpgFSWLW1ZEs8svjfb7g4qWY0YS5imI82dTg+QahUvJ8YqAY0P10Uk8tTyh9ZGuYEZEMaeJYCF5BFuX552hsw==",
      "license": "MIT"
    },
    "node_modules/argparse": {
      "version": "2.0.1",
      "resolved": "https://registry.npmjs.org/argparse/-/argparse-2.0.1.tgz",
      "integrity": "sha512-8+9WqebbFzpX9OR+Wa6O29asIogeRMzcGtAINdpMHHyAg10f05aSFVBbcEqGf/PXw1EjAZ+q2/bEBg3DvurK3Q==",
      "license": "Python-2.0"
    },
    "node_modules/asynckit": {
      "version": "0.4.0",
      "resolved": "https://registry.npmjs.org/asynckit/-/asynckit-0.4.0.tgz",
      "integrity": "sha512-Oei9OH4tRh0YqU3GxhX79dM/mwVgvbZJaSNaRk+bshkj0S5cfHcgYakreBjrHwatXKbz+IoIdYLxrKim2MjW0Q==",
      "license": "MIT"
    },
    "node_modules/aws-ssl-profiles": {
      "version": "1.1.2",
      "resolved": "https://registry.npmjs.org/aws-ssl-profiles/-/aws-ssl-profiles-1.1.2.tgz",
      "integrity": "sha512-NZKeq9AfyQvEeNlN0zSYAaWrmBffJh3IELMZfRpJVWgrpEbtEpnjvzqBPf+mxoI287JohRDoa+/nsfqqiZmF6g==",
      "license": "MIT",
      "engines": {
        "node": ">= 6.0.0"
      }
    },
    "node_modules/axios": {
      "version": "1.10.0",
      "resolved": "https://registry.npmjs.org/axios/-/axios-1.10.0.tgz",
      "integrity": "sha512-/1xYAC4MP/HEG+3duIhFr4ZQXR4sQXOIe+o6sdqzeykGLx6Upp/1p8MHqhINOvGeP7xyNHe7tsiJByc4SSVUxw==",
      "license": "MIT",
      "dependencies": {
        "follow-redirects": "^1.15.6",
        "form-data": "^4.0.0",
        "proxy-from-env": "^1.1.0"
      }
    },
    "node_modules/balanced-match": {
      "version": "1.0.2",
      "resolved": "https://registry.npmjs.org/balanced-match/-/balanced-match-1.0.2.tgz",
      "integrity": "sha512-3oSeUO0TMV67hN1AmbXsK4yaqU7tjiHlbxRDZOpH0KW9+CeX4bRAaX0Anxt0tx2MrpRpWwQaPwIlISEJhYU5Pw==",
      "dev": true,
      "license": "MIT"
    },
    "node_modules/bcryptjs": {
      "version": "3.0.3",
      "resolved": "https://registry.npmjs.org/bcryptjs/-/bcryptjs-3.0.3.tgz",
      "integrity": "sha512-GlF5wPWnSa/X5LKM1o0wz0suXIINz1iHRLvTS+sLyi7XPbe5ycmYI3DlZqVGZZtDgl4DmasFg7gOB3JYbphV5g==",
      "license": "BSD-3-Clause",
      "bin": {
        "bcrypt": "bin/bcrypt"
      }
    },
    "node_modules/binary-extensions": {
      "version": "2.3.0",
      "resolved": "https://registry.npmjs.org/binary-extensions/-/binary-extensions-2.3.0.tgz",
      "integrity": "sha512-Ceh+7ox5qe7LJuLHoY0feh3pHuUDHAcRUeyL2VYghZwfpkNIy/+8Ocg0a3UuSoYzavmylwuLWQOf3hl0jjMMIw==",
      "dev": true,
      "license": "MIT",
      "engines": {
        "node": ">=8"
      },
      "funding": {
        "url": "https://github.com/sponsors/sindresorhus"
      }
    },
    "node_modules/body-parser": {
      "version": "2.2.0",
      "resolved": "https://registry.npmjs.org/body-parser/-/body-parser-2.2.0.tgz",
      "integrity": "sha512-02qvAaxv8tp7fBa/mw1ga98OGm+eCbqzJOKoRt70sLmfEEi+jyBYVTDGfCL/k06/4EMk/z01gCe7HoCH/f2LTg==",
      "license": "MIT",
      "dependencies": {
        "bytes": "^3.1.2",
        "content-type": "^1.0.5",
        "debug": "^4.4.0",
        "http-errors": "^2.0.0",
        "iconv-lite": "^0.6.3",
        "on-finished": "^2.4.1",
        "qs": "^6.14.0",
        "raw-body": "^3.0.0",
        "type-is": "^2.0.0"
      },
      "engines": {
        "node": ">=18"
      }
    },
    "node_modules/brace-expansion": {
      "version": "1.1.11",
      "resolved": "https://registry.npmjs.org/brace-expansion/-/brace-expansion-1.1.11.tgz",
      "integrity": "sha512-iCuPHDFgrHX7H2vEI/5xpz07zSHB00TpugqhmYtVmMO6518mCuRMoOYFldEBl0g187ufozdaHgWKcYFb61qGiA==",
      "dev": true,
      "license": "MIT",
      "dependencies": {
        "balanced-match": "^1.0.0",
        "concat-map": "0.0.1"
      }
    },
    "node_modules/braces": {
      "version": "3.0.3",
      "resolved": "https://registry.npmjs.org/braces/-/braces-3.0.3.tgz",
      "integrity": "sha512-yQbXgO/OSZVD2IsiLlro+7Hf6Q18EJrKSEsdoMzKePKXct3gvD8oLcOQdIzGupr5Fj+EDe8gO/lxc1BzfMpxvA==",
      "dev": true,
      "license": "MIT",
      "dependencies": {
        "fill-range": "^7.1.1"
      },
      "engines": {
        "node": ">=8"
      }
    },
    "node_modules/buffer-equal-constant-time": {
      "version": "1.0.1",
      "resolved": "https://registry.npmjs.org/buffer-equal-constant-time/-/buffer-equal-constant-time-1.0.1.tgz",
      "integrity": "sha512-zRpUiDwd/xk6ADqPMATG8vc9VPrkck7T07OIx0gnjmJAnHnTVXNQG3vfvWNuiZIkwu9KrKdA1iJKfsfTVxE6NA==",
      "license": "BSD-3-Clause"
    },
    "node_modules/buffer-from": {
      "version": "1.1.2",
      "resolved": "https://registry.npmjs.org/buffer-from/-/buffer-from-1.1.2.tgz",
      "integrity": "sha512-E+XQCRwSbaaiChtv6k6Dwgc+bx+Bs6vuKJHHl5kox/BaKbhiXzqQOwK4cO22yElGp2OCmjwVhT3HmxgyPGnJfQ==",
      "license": "MIT"
    },
    "node_modules/busboy": {
      "version": "1.6.0",
      "resolved": "https://registry.npmjs.org/busboy/-/busboy-1.6.0.tgz",
      "integrity": "sha512-8SFQbg/0hQ9xy3UNTB0YEnsNBbWfhf7RtnzpL7TkBiTBRfrQ9Fxcnz7VJsleJpyp6rVLvXiuORqjlHi5q+PYuA==",
      "dependencies": {
        "streamsearch": "^1.1.0"
      },
      "engines": {
        "node": ">=10.16.0"
      }
    },
    "node_modules/bytes": {
      "version": "3.1.2",
      "resolved": "https://registry.npmjs.org/bytes/-/bytes-3.1.2.tgz",
      "integrity": "sha512-/Nf7TyzTx6S3yRJObOAV7956r8cr2+Oj8AC5dt8wSP3BQAoeX58NoHyCU8P8zGkNXStjTSi6fzO6F0pBdcYbEg==",
      "license": "MIT",
      "engines": {
        "node": ">= 0.8"
      }
    },
    "node_modules/call-bind-apply-helpers": {
      "version": "1.0.2",
      "resolved": "https://registry.npmjs.org/call-bind-apply-helpers/-/call-bind-apply-helpers-1.0.2.tgz",
      "integrity": "sha512-Sp1ablJ0ivDkSzjcaJdxEunN5/XvksFJ2sMBFfq6x0ryhQV/2b/KwFe21cMpmHtPOSij8K99/wSfoEuTObmuMQ==",
      "license": "MIT",
      "dependencies": {
        "es-errors": "^1.3.0",
        "function-bind": "^1.1.2"
      },
      "engines": {
        "node": ">= 0.4"
      }
    },
    "node_modules/call-bound": {
      "version": "1.0.4",
      "resolved": "https://registry.npmjs.org/call-bound/-/call-bound-1.0.4.tgz",
      "integrity": "sha512-+ys997U96po4Kx/ABpBCqhA9EuxJaQWDQg7295H4hBphv3IZg0boBKuwYpt4YXp6MZ5AmZQnU/tyMTlRpaSejg==",
      "license": "MIT",
      "dependencies": {
        "call-bind-apply-helpers": "^1.0.2",
        "get-intrinsic": "^1.3.0"
      },
      "engines": {
        "node": ">= 0.4"
      },
      "funding": {
        "url": "https://github.com/sponsors/ljharb"
      }
    },
    "node_modules/call-me-maybe": {
      "version": "1.0.2",
      "resolved": "https://registry.npmjs.org/call-me-maybe/-/call-me-maybe-1.0.2.tgz",
      "integrity": "sha512-HpX65o1Hnr9HH25ojC1YGs7HCQLq0GCOibSaWER0eNpgJ/Z1MZv2mTc7+xh6WOPxbRVcmgbv4hGU+uSQ/2xFZQ==",
      "license": "MIT"
    },
    "node_modules/chokidar": {
      "version": "3.6.0",
      "resolved": "https://registry.npmjs.org/chokidar/-/chokidar-3.6.0.tgz",
      "integrity": "sha512-7VT13fmjotKpGipCW9JEQAusEPE+Ei8nl6/g4FBAmIm0GOOLMua9NDDo/DWp0ZAxCr3cPq5ZpBqmPAQgDda2Pw==",
      "dev": true,
      "license": "MIT",
      "dependencies": {
        "anymatch": "~3.1.2",
        "braces": "~3.0.2",
        "glob-parent": "~5.1.2",
        "is-binary-path": "~2.1.0",
        "is-glob": "~4.0.1",
        "normalize-path": "~3.0.0",
        "readdirp": "~3.6.0"
      },
      "engines": {
        "node": ">= 8.10.0"
      },
      "funding": {
        "url": "https://paulmillr.com/funding/"
      },
      "optionalDependencies": {
        "fsevents": "~2.3.2"
      }
    },
    "node_modules/combined-stream": {
      "version": "1.0.8",
      "resolved": "https://registry.npmjs.org/combined-stream/-/combined-stream-1.0.8.tgz",
      "integrity": "sha512-FQN4MRfuJeHf7cBbBMJFXhKSDq+2kAArBlmRBvcvFE5BB1HZKXtSFASDhdlz9zOYwxh8lDdnvmMOe/+5cdoEdg==",
      "license": "MIT",
      "dependencies": {
        "delayed-stream": "~1.0.0"
      },
      "engines": {
        "node": ">= 0.8"
      }
    },
    "node_modules/commander": {
      "version": "6.2.0",
      "resolved": "https://registry.npmjs.org/commander/-/commander-6.2.0.tgz",
      "integrity": "sha512-zP4jEKbe8SHzKJYQmq8Y9gYjtO/POJLgIdKgV7B9qNmABVFVc+ctqSX6iXh4mCpJfRBOabiZ2YKPg8ciDw6C+Q==",
      "license": "MIT",
      "engines": {
        "node": ">= 6"
      }
    },
    "node_modules/concat-map": {
      "version": "0.0.1",
      "resolved": "https://registry.npmjs.org/concat-map/-/concat-map-0.0.1.tgz",
      "integrity": "sha512-/Srv4dswyQNBfohGpz9o6Yb3Gz3SrUDqBH5rTuhGR7ahtlbYKnVxw2bCFMRljaA7EXHaXZ8wsHdodFvbkhKmqg==",
      "dev": true,
      "license": "MIT"
    },
    "node_modules/concat-stream": {
      "version": "2.0.0",
      "resolved": "https://registry.npmjs.org/concat-stream/-/concat-stream-2.0.0.tgz",
      "integrity": "sha512-MWufYdFw53ccGjCA+Ol7XJYpAlW6/prSMzuPOTRnJGcGzuhLn4Scrz7qf6o8bROZ514ltazcIFJZevcfbo0x7A==",
      "engines": [
        "node >= 6.0"
      ],
      "license": "MIT",
      "dependencies": {
        "buffer-from": "^1.0.0",
        "inherits": "^2.0.3",
        "readable-stream": "^3.0.2",
        "typedarray": "^0.0.6"
      }
    },
    "node_modules/content-disposition": {
      "version": "1.0.0",
      "resolved": "https://registry.npmjs.org/content-disposition/-/content-disposition-1.0.0.tgz",
      "integrity": "sha512-Au9nRL8VNUut/XSzbQA38+M78dzP4D+eqg3gfJHMIHHYa3bg067xj1KxMUWj+VULbiZMowKngFFbKczUrNJ1mg==",
      "license": "MIT",
      "dependencies": {
        "safe-buffer": "5.2.1"
      },
      "engines": {
        "node": ">= 0.6"
      }
    },
    "node_modules/content-type": {
      "version": "1.0.5",
      "resolved": "https://registry.npmjs.org/content-type/-/content-type-1.0.5.tgz",
      "integrity": "sha512-nTjqfcBFEipKdXCv4YDQWCfmcLZKm81ldF0pAopTvyrFGVbcR6P/VAAd5G7N+0tTr8QqiU0tFadD6FK4NtJwOA==",
      "license": "MIT",
      "engines": {
        "node": ">= 0.6"
      }
    },
    "node_modules/cookie": {
      "version": "0.7.2",
      "resolved": "https://registry.npmjs.org/cookie/-/cookie-0.7.2.tgz",
      "integrity": "sha512-yki5XnKuf750l50uGTllt6kKILY4nQ1eNIQatoXEByZ5dWgnKqbnqmTrBE5B4N7lrMJKQ2ytWMiTO2o0v6Ew/w==",
      "license": "MIT",
      "engines": {
        "node": ">= 0.6"
      }
    },
    "node_modules/cookie-signature": {
      "version": "1.2.2",
      "resolved": "https://registry.npmjs.org/cookie-signature/-/cookie-signature-1.2.2.tgz",
      "integrity": "sha512-D76uU73ulSXrD1UXF4KE2TMxVVwhsnCgfAyTg9k8P6KGZjlXKrOLe4dJQKI3Bxi5wjesZoFXJWElNWBjPZMbhg==",
      "license": "MIT",
      "engines": {
        "node": ">=6.6.0"
      }
    },
    "node_modules/cors": {
      "version": "2.8.5",
      "resolved": "https://registry.npmjs.org/cors/-/cors-2.8.5.tgz",
      "integrity": "sha512-KIHbLJqu73RGr/hnbrO9uBeixNGuvSQjul/jdFvS/KFSIH1hWVd1ng7zOHx+YrEfInLG7q4n6GHQ9cDtxv/P6g==",
      "license": "MIT",
      "dependencies": {
        "object-assign": "^4",
        "vary": "^1"
      },
      "engines": {
        "node": ">= 0.10"
      }
    },
    "node_modules/cross-spawn": {
      "version": "7.0.6",
      "resolved": "https://registry.npmjs.org/cross-spawn/-/cross-spawn-7.0.6.tgz",
      "integrity": "sha512-uV2QOWP2nWzsy2aMp8aRibhi9dlzF5Hgh5SHaB9OiTGEyDTiJJyx0uy51QXdyWbtAHNua4XJzUKca3OzKUd3vA==",
      "license": "MIT",
      "dependencies": {
        "path-key": "^3.1.0",
        "shebang-command": "^2.0.0",
        "which": "^2.0.1"
      },
      "engines": {
        "node": ">= 8"
      }
    },
    "node_modules/debug": {
      "version": "4.4.1",
      "resolved": "https://registry.npmjs.org/debug/-/debug-4.4.1.tgz",
      "integrity": "sha512-KcKCqiftBJcZr++7ykoDIEwSa3XWowTfNPo92BYxjXiyYEVrUQh2aLyhxBCwww+heortUFxEJYcRzosstTEBYQ==",
      "license": "MIT",
      "dependencies": {
        "ms": "^2.1.3"
      },
      "engines": {
        "node": ">=6.0"
      },
      "peerDependenciesMeta": {
        "supports-color": {
          "optional": true
        }
      }
    },
    "node_modules/delayed-stream": {
      "version": "1.0.0",
      "resolved": "https://registry.npmjs.org/delayed-stream/-/delayed-stream-1.0.0.tgz",
      "integrity": "sha512-ZySD7Nf91aLB0RxL4KGrKHBXl7Eds1DAmEdcoVawXnLD7SDhpNgtuII2aAkg7a7QS41jxPSZ17p4VdGnMHk3MQ==",
      "license": "MIT",
      "engines": {
        "node": ">=0.4.0"
      }
    },
    "node_modules/denque": {
      "version": "2.1.0",
      "resolved": "https://registry.npmjs.org/denque/-/denque-2.1.0.tgz",
      "integrity": "sha512-HVQE3AAb/pxF8fQAoiqpvg9i3evqug3hoiwakOyZAwJm+6vZehbkYXZ0l4JxS+I3QxM97v5aaRNhj8v5oBhekw==",
      "license": "Apache-2.0",
      "engines": {
        "node": ">=0.10"
      }
    },
    "node_modules/depd": {
      "version": "2.0.0",
      "resolved": "https://registry.npmjs.org/depd/-/depd-2.0.0.tgz",
      "integrity": "sha512-g7nH6P6dyDioJogAAGprGpCtVImJhpPk/roCzdb3fIh61/s/nPsfR6onyMwkCAR/OlC3yBC0lESvUoQEAssIrw==",
      "license": "MIT",
      "engines": {
        "node": ">= 0.8"
      }
    },
    "node_modules/doctrine": {
      "version": "3.0.0",
      "resolved": "https://registry.npmjs.org/doctrine/-/doctrine-3.0.0.tgz",
      "integrity": "sha512-yS+Q5i3hBf7GBkd4KG8a7eBNNWNGLTaEwwYWUijIYM7zrlYDM0BFXHjjPWlWZ1Rg7UaddZeIDmi9jF3HmqiQ2w==",
      "license": "Apache-2.0",
      "dependencies": {
        "esutils": "^2.0.2"
      },
      "engines": {
        "node": ">=6.0.0"
      }
    },
    "node_modules/dotenv": {
      "version": "16.5.0",
      "resolved": "https://registry.npmjs.org/dotenv/-/dotenv-16.5.0.tgz",
      "integrity": "sha512-m/C+AwOAr9/W1UOIZUo232ejMNnJAJtYQjUbHoNTBNTJSvqzzDh7vnrei3o3r3m9blf6ZoDkvcw0VmozNRFJxg==",
      "license": "BSD-2-Clause",
      "engines": {
        "node": ">=12"
      },
      "funding": {
        "url": "https://dotenvx.com"
      }
    },
    "node_modules/dunder-proto": {
      "version": "1.0.1",
      "resolved": "https://registry.npmjs.org/dunder-proto/-/dunder-proto-1.0.1.tgz",
      "integrity": "sha512-KIN/nDJBQRcXw0MLVhZE9iQHmG68qAVIBg9CqmUYjmQIhgij9U5MFvrqkUL5FbtyyzZuOeOt0zdeRe4UY7ct+A==",
      "license": "MIT",
      "dependencies": {
        "call-bind-apply-helpers": "^1.0.1",
        "es-errors": "^1.3.0",
        "gopd": "^1.2.0"
      },
      "engines": {
        "node": ">= 0.4"
      }
    },
    "node_modules/ecdsa-sig-formatter": {
      "version": "1.0.11",
      "resolved": "https://registry.npmjs.org/ecdsa-sig-formatter/-/ecdsa-sig-formatter-1.0.11.tgz",
      "integrity": "sha512-nagl3RYrbNv6kQkeJIpt6NJZy8twLB/2vtz6yN9Z4vRKHN4/QZJIEbqohALSgwKdnksuY3k5Addp5lg8sVoVcQ==",
      "license": "Apache-2.0",
      "dependencies": {
        "safe-buffer": "^5.0.1"
      }
    },
    "node_modules/ee-first": {
      "version": "1.1.1",
      "resolved": "https://registry.npmjs.org/ee-first/-/ee-first-1.1.1.tgz",
      "integrity": "sha512-WMwm9LhRUo+WUaRN+vRuETqG89IgZphVSNkdFgeb6sS/E4OrDIN7t48CAewSHXc6C8lefD8KKfr5vY61brQlow==",
      "license": "MIT"
    },
    "node_modules/encodeurl": {
      "version": "2.0.0",
      "resolved": "https://registry.npmjs.org/encodeurl/-/encodeurl-2.0.0.tgz",
      "integrity": "sha512-Q0n9HRi4m6JuGIV1eFlmvJB7ZEVxu93IrMyiMsGC0lrMJMWzRgx6WGquyfQgZVb31vhGgXnfmPNNXmxnOkRBrg==",
      "license": "MIT",
      "engines": {
        "node": ">= 0.8"
      }
    },
    "node_modules/es-define-property": {
      "version": "1.0.1",
      "resolved": "https://registry.npmjs.org/es-define-property/-/es-define-property-1.0.1.tgz",
      "integrity": "sha512-e3nRfgfUZ4rNGL232gUgX06QNyyez04KdjFrF+LTRoOXmrOgFKDg4BCdsjW8EnT69eqdYGmRpJwiPVYNrCaW3g==",
      "license": "MIT",
      "engines": {
        "node": ">= 0.4"
      }
    },
    "node_modules/es-errors": {
      "version": "1.3.0",
      "resolved": "https://registry.npmjs.org/es-errors/-/es-errors-1.3.0.tgz",
      "integrity": "sha512-Zf5H2Kxt2xjTvbJvP2ZWLEICxA6j+hAmMzIlypy4xcBg1vKVnx89Wy0GbS+kf5cwCVFFzdCFh2XSCFNULS6csw==",
      "license": "MIT",
      "engines": {
        "node": ">= 0.4"
      }
    },
    "node_modules/es-object-atoms": {
      "version": "1.1.1",
      "resolved": "https://registry.npmjs.org/es-object-atoms/-/es-object-atoms-1.1.1.tgz",
      "integrity": "sha512-FGgH2h8zKNim9ljj7dankFPcICIK9Cp5bm+c2gQSYePhpaG5+esrLODihIorn+Pe6FGJzWhXQotPv73jTaldXA==",
      "license": "MIT",
      "dependencies": {
        "es-errors": "^1.3.0"
      },
      "engines": {
        "node": ">= 0.4"
      }
    },
    "node_modules/es-set-tostringtag": {
      "version": "2.1.0",
      "resolved": "https://registry.npmjs.org/es-set-tostringtag/-/es-set-tostringtag-2.1.0.tgz",
      "integrity": "sha512-j6vWzfrGVfyXxge+O0x5sh6cvxAog0a/4Rdd2K36zCMV5eJ+/+tOAngRO8cODMNWbVRdVlmGZQL2YS3yR8bIUA==",
      "license": "MIT",
      "dependencies": {
        "es-errors": "^1.3.0",
        "get-intrinsic": "^1.2.6",
        "has-tostringtag": "^1.0.2",
        "hasown": "^2.0.2"
      },
      "engines": {
        "node": ">= 0.4"
      }
    },
    "node_modules/escape-html": {
      "version": "1.0.3",
      "resolved": "https://registry.npmjs.org/escape-html/-/escape-html-1.0.3.tgz",
      "integrity": "sha512-NiSupZ4OeuGwr68lGIeym/ksIZMJodUGOSCZ/FSnTxcrekbvqrgdUxlJOMpijaKZVjAJrWrGs/6Jy8OMuyj9ow==",
      "license": "MIT"
    },
    "node_modules/esutils": {
      "version": "2.0.3",
      "resolved": "https://registry.npmjs.org/esutils/-/esutils-2.0.3.tgz",
      "integrity": "sha512-kVscqXk4OCp68SZ0dkgEKVi6/8ij300KBWTJq32P/dYeWTSwK41WyTxalN1eRmA5Z9UU/LX9D7FWSmV9SAYx6g==",
      "license": "BSD-2-Clause",
      "engines": {
        "node": ">=0.10.0"
      }
    },
    "node_modules/etag": {
      "version": "1.8.1",
      "resolved": "https://registry.npmjs.org/etag/-/etag-1.8.1.tgz",
      "integrity": "sha512-aIL5Fx7mawVa300al2BnEE4iNvo1qETxLrPI/o05L7z6go7fCw1J6EQmbK4FmJ2AS7kgVF/KEZWufBfdClMcPg==",
      "license": "MIT",
      "engines": {
        "node": ">= 0.6"
      }
    },
    "node_modules/express": {
      "version": "5.1.0",
      "resolved": "https://registry.npmjs.org/express/-/express-5.1.0.tgz",
      "integrity": "sha512-DT9ck5YIRU+8GYzzU5kT3eHGA5iL+1Zd0EutOmTE9Dtk+Tvuzd23VBU+ec7HPNSTxXYO55gPV/hq4pSBJDjFpA==",
      "license": "MIT",
      "dependencies": {
        "accepts": "^2.0.0",
        "body-parser": "^2.2.0",
        "content-disposition": "^1.0.0",
        "content-type": "^1.0.5",
        "cookie": "^0.7.1",
        "cookie-signature": "^1.2.1",
        "debug": "^4.4.0",
        "encodeurl": "^2.0.0",
        "escape-html": "^1.0.3",
        "etag": "^1.8.1",
        "finalhandler": "^2.1.0",
        "fresh": "^2.0.0",
        "http-errors": "^2.0.0",
        "merge-descriptors": "^2.0.0",
        "mime-types": "^3.0.0",
        "on-finished": "^2.4.1",
        "once": "^1.4.0",
        "parseurl": "^1.3.3",
        "proxy-addr": "^2.0.7",
        "qs": "^6.14.0",
        "range-parser": "^1.2.1",
        "router": "^2.2.0",
        "send": "^1.1.0",
        "serve-static": "^2.2.0",
        "statuses": "^2.0.1",
        "type-is": "^2.0.1",
        "vary": "^1.1.2"
      },
      "engines": {
        "node": ">= 18"
      },
      "funding": {
        "type": "opencollective",
        "url": "https://opencollective.com/express"
      }
    },
    "node_modules/express-async-handler": {
      "version": "1.2.0",
      "resolved": "https://registry.npmjs.org/express-async-handler/-/express-async-handler-1.2.0.tgz",
      "integrity": "sha512-rCSVtPXRmQSW8rmik/AIb2P0op6l7r1fMW538yyvTMltCO4xQEWMmobfrIxN2V1/mVrgxB8Az3reYF6yUZw37w==",
      "license": "MIT"
    },
    "node_modules/fast-deep-equal": {
      "version": "3.1.3",
      "resolved": "https://registry.npmjs.org/fast-deep-equal/-/fast-deep-equal-3.1.3.tgz",
      "integrity": "sha512-f3qQ9oQy9j2AhBe/H9VC91wLmKBCCU/gDOnKNAYG5hswO7BLKj09Hc5HYNz9cGI++xlpDCIgDaitVs03ATR84Q==",
      "license": "MIT"
    },
    "node_modules/fast-uri": {
      "version": "3.1.2",
      "resolved": "https://registry.npmjs.org/fast-uri/-/fast-uri-3.1.2.tgz",
      "integrity": "sha512-rVjf7ArG3LTk+FS6Yw81V1DLuZl1bRbNrev6Tmd/9RaroeeRRJhAt7jg/6YFxbvAQXUCavSoZhPPj6oOx+5KjQ==",
      "funding": [
        {
          "type": "github",
          "url": "https://github.com/sponsors/fastify"
        },
        {
          "type": "opencollective",
          "url": "https://opencollective.com/fastify"
        }
      ],
      "license": "BSD-3-Clause"
    },
    "node_modules/fill-range": {
      "version": "7.1.1",
      "resolved": "https://registry.npmjs.org/fill-range/-/fill-range-7.1.1.tgz",
      "integrity": "sha512-YsGpe3WHLK8ZYi4tWDg2Jy3ebRz2rXowDxnld4bkQB00cc/1Zw9AWnC0i9ztDJitivtQvaI9KaLyKrc+hBW0yg==",
      "dev": true,
      "license": "MIT",
      "dependencies": {
        "to-regex-range": "^5.0.1"
      },
      "engines": {
        "node": ">=8"
      }
    },
    "node_modules/finalhandler": {
      "version": "2.1.0",
      "resolved": "https://registry.npmjs.org/finalhandler/-/finalhandler-2.1.0.tgz",
      "integrity": "sha512-/t88Ty3d5JWQbWYgaOGCCYfXRwV1+be02WqYYlL6h0lEiUAMPM8o8qKGO01YIkOHzka2up08wvgYD0mDiI+q3Q==",
      "license": "MIT",
      "dependencies": {
        "debug": "^4.4.0",
        "encodeurl": "^2.0.0",
        "escape-html": "^1.0.3",
        "on-finished": "^2.4.1",
        "parseurl": "^1.3.3",
        "statuses": "^2.0.1"
      },
      "engines": {
        "node": ">= 0.8"
      }
    },
    "node_modules/follow-redirects": {
      "version": "1.15.9",
      "resolved": "https://registry.npmjs.org/follow-redirects/-/follow-redirects-1.15.9.tgz",
      "integrity": "sha512-gew4GsXizNgdoRyqmyfMHyAmXsZDk6mHkSxZFCzW9gwlbtOW44CDtYavM+y+72qD/Vq2l550kMF52DT8fOLJqQ==",
      "funding": [
        {
          "type": "individual",
          "url": "https://github.com/sponsors/RubenVerborgh"
        }
      ],
      "license": "MIT",
      "engines": {
        "node": ">=4.0"
      },
      "peerDependenciesMeta": {
        "debug": {
          "optional": true
        }
      }
    },
    "node_modules/foreground-child": {
      "version": "3.3.1",
      "resolved": "https://registry.npmjs.org/foreground-child/-/foreground-child-3.3.1.tgz",
      "integrity": "sha512-gIXjKqtFuWEgzFRJA9WCQeSJLZDjgJUOMCMzxtvFq/37KojM1BFGufqsCy0r4qSQmYLsZYMeyRqzIWOMup03sw==",
      "license": "ISC",
      "dependencies": {
        "cross-spawn": "^7.0.6",
        "signal-exit": "^4.0.1"
      },
      "engines": {
        "node": ">=14"
      },
      "funding": {
        "url": "https://github.com/sponsors/isaacs"
      }
    },
    "node_modules/form-data": {
      "version": "4.0.4",
      "resolved": "https://registry.npmjs.org/form-data/-/form-data-4.0.4.tgz",
      "integrity": "sha512-KrGhL9Q4zjj0kiUt5OO4Mr/A/jlI2jDYs5eHBpYHPcBEVSiipAvn2Ko2HnPe20rmcuuvMHNdZFp+4IlGTMF0Ow==",
      "license": "MIT",
      "dependencies": {
        "asynckit": "^0.4.0",
        "combined-stream": "^1.0.8",
        "es-set-tostringtag": "^2.1.0",
        "hasown": "^2.0.2",
        "mime-types": "^2.1.12"
      },
      "engines": {
        "node": ">= 6"
      }
    },
    "node_modules/form-data/node_modules/mime-db": {
      "version": "1.52.0",
      "resolved": "https://registry.npmjs.org/mime-db/-/mime-db-1.52.0.tgz",
      "integrity": "sha512-sPU4uV7dYlvtWJxwwxHD0PuihVNiE7TyAbQ5SWxDCB9mUYvOgroQOwYQQOKPJ8CIbE+1ETVlOoK1UC2nU3gYvg==",
      "license": "MIT",
      "engines": {
        "node": ">= 0.6"
      }
    },
    "node_modules/form-data/node_modules/mime-types": {
      "version": "2.1.35",
      "resolved": "https://registry.npmjs.org/mime-types/-/mime-types-2.1.35.tgz",
      "integrity": "sha512-ZDY+bPm5zTTF+YpCrAU9nK0UgICYPT0QtT1NZWFv4s++TNkcgVaT0g6+4R2uI4MjQjzysHB1zxuWL50hzaeXiw==",
      "license": "MIT",
      "dependencies": {
        "mime-db": "1.52.0"
      },
      "engines": {
        "node": ">= 0.6"
      }
    },
    "node_modules/forwarded": {
      "version": "0.2.0",
      "resolved": "https://registry.npmjs.org/forwarded/-/forwarded-0.2.0.tgz",
      "integrity": "sha512-buRG0fpBtRHSTCOASe6hD258tEubFoRLb4ZNA6NxMVHNw2gOcwHo9wyablzMzOA5z9xA9L1KNjk/Nt6MT9aYow==",
      "license": "MIT",
      "engines": {
        "node": ">= 0.6"
      }
    },
    "node_modules/fresh": {
      "version": "2.0.0",
      "resolved": "https://registry.npmjs.org/fresh/-/fresh-2.0.0.tgz",
      "integrity": "sha512-Rx/WycZ60HOaqLKAi6cHRKKI7zxWbJ31MhntmtwMoaTeF7XFH9hhBp8vITaMidfljRQ6eYWCKkaTK+ykVJHP2A==",
      "license": "MIT",
      "engines": {
        "node": ">= 0.8"
      }
    },
    "node_modules/fsevents": {
      "version": "2.3.3",
      "resolved": "https://registry.npmjs.org/fsevents/-/fsevents-2.3.3.tgz",
      "integrity": "sha512-5xoDfX+fL7faATnagmWPpbFtwh/R77WmMMqqHGS65C3vvB0YHrgF+B1YmZ3441tMj5n63k0212XNoJwzlhffQw==",
      "dev": true,
      "hasInstallScript": true,
      "license": "MIT",
      "optional": true,
      "os": [
        "darwin"
      ],
      "engines": {
        "node": "^8.16.0 || ^10.6.0 || >=11.0.0"
      }
    },
    "node_modules/function-bind": {
      "version": "1.1.2",
      "resolved": "https://registry.npmjs.org/function-bind/-/function-bind-1.1.2.tgz",
      "integrity": "sha512-7XHNxH7qX9xG5mIwxkhumTox/MIRNcOgDrxWsMt2pAr23WHp6MrRlN7FBSFpCpr+oVO0F744iUgR82nJMfG2SA==",
      "license": "MIT",
      "funding": {
        "url": "https://github.com/sponsors/ljharb"
      }
    },
    "node_modules/generate-function": {
      "version": "2.3.1",
      "resolved": "https://registry.npmjs.org/generate-function/-/generate-function-2.3.1.tgz",
      "integrity": "sha512-eeB5GfMNeevm/GRYq20ShmsaGcmI81kIX2K9XQx5miC8KdHaC6Jm0qQ8ZNeGOi7wYB8OsdxKs+Y2oVuTFuVwKQ==",
      "license": "MIT",
      "dependencies": {
        "is-property": "^1.0.2"
      }
    },
    "node_modules/get-intrinsic": {
      "version": "1.3.0",
      "resolved": "https://registry.npmjs.org/get-intrinsic/-/get-intrinsic-1.3.0.tgz",
      "integrity": "sha512-9fSjSaos/fRIVIp+xSJlE6lfwhES7LNtKaCBIamHsjr2na1BiABJPo0mOjjz8GJDURarmCPGqaiVg5mfjb98CQ==",
      "license": "MIT",
      "dependencies": {
        "call-bind-apply-helpers": "^1.0.2",
        "es-define-property": "^1.0.1",
        "es-errors": "^1.3.0",
        "es-object-atoms": "^1.1.1",
        "function-bind": "^1.1.2",
        "get-proto": "^1.0.1",
        "gopd": "^1.2.0",
        "has-symbols": "^1.1.0",
        "hasown": "^2.0.2",
        "math-intrinsics": "^1.1.0"
      },
      "engines": {
        "node": ">= 0.4"
      },
      "funding": {
        "url": "https://github.com/sponsors/ljharb"
      }
    },
    "node_modules/get-proto": {
      "version": "1.0.1",
      "resolved": "https://registry.npmjs.org/get-proto/-/get-proto-1.0.1.tgz",
      "integrity": "sha512-sTSfBjoXBp89JvIKIefqw7U2CCebsc74kiY6awiGogKtoSGbgjYE/G/+l9sF3MWFPNc9IcoOC4ODfKHfxFmp0g==",
      "license": "MIT",
      "dependencies": {
        "dunder-proto": "^1.0.1",
        "es-object-atoms": "^1.0.0"
      },
      "engines": {
        "node": ">= 0.4"
      }
    },
    "node_modules/glob": {
      "version": "11.1.0",
      "resolved": "https://registry.npmjs.org/glob/-/glob-11.1.0.tgz",
      "integrity": "sha512-vuNwKSaKiqm7g0THUBu2x7ckSs3XJLXE+2ssL7/MfTGPLLcrJQ/4Uq1CjPTtO5cCIiRxqvN6Twy1qOwhL0Xjcw==",
      "deprecated": "Old versions of glob are not supported, and contain widely publicized security vulnerabilities, which have been fixed in the current version. Please update. Support for old versions may be purchased (at exorbitant rates) by contacting i@izs.me",
      "license": "BlueOak-1.0.0",
      "dependencies": {
        "foreground-child": "^3.3.1",
        "jackspeak": "^4.1.1",
        "minimatch": "^10.1.1",
        "minipass": "^7.1.2",
        "package-json-from-dist": "^1.0.0",
        "path-scurry": "^2.0.0"
      },
      "bin": {
        "glob": "dist/esm/bin.mjs"
      },
      "engines": {
        "node": "20 || >=22"
      },
      "funding": {
        "url": "https://github.com/sponsors/isaacs"
      }
    },
    "node_modules/glob-parent": {
      "version": "5.1.2",
      "resolved": "https://registry.npmjs.org/glob-parent/-/glob-parent-5.1.2.tgz",
      "integrity": "sha512-AOIgSQCepiJYwP3ARnGx+5VnTu2HBYdzbGP45eLw1vr3zB3vZLeyed1sC9hnbcOc9/SrMyM5RPQrkGz4aS9Zow==",
      "dev": true,
      "license": "ISC",
      "dependencies": {
        "is-glob": "^4.0.1"
      },
      "engines": {
        "node": ">= 6"
      }
    },
    "node_modules/glob/node_modules/balanced-match": {
      "version": "4.0.4",
      "resolved": "https://registry.npmjs.org/balanced-match/-/balanced-match-4.0.4.tgz",
      "integrity": "sha512-BLrgEcRTwX2o6gGxGOCNyMvGSp35YofuYzw9h1IMTRmKqttAZZVU67bdb9Pr2vUHA8+j3i2tJfjO6C6+4myGTA==",
      "license": "MIT",
      "engines": {
        "node": "18 || 20 || >=22"
      }
    },
    "node_modules/glob/node_modules/brace-expansion": {
      "version": "5.0.6",
      "resolved": "https://registry.npmjs.org/brace-expansion/-/brace-expansion-5.0.6.tgz",
      "integrity": "sha512-kLpxurY4Z4r9sgMsyG0Z9uzsBlgiU/EFKhj/h91/8yHu0edo7XuixOIH3VcJ8kkxs6/jPzoI6U9Vj3WqbMQ94g==",
      "license": "MIT",
      "dependencies": {
        "balanced-match": "^4.0.2"
      },
      "engines": {
        "node": "18 || 20 || >=22"
      }
    },
    "node_modules/glob/node_modules/minimatch": {
      "version": "10.2.5",
      "resolved": "https://registry.npmjs.org/minimatch/-/minimatch-10.2.5.tgz",
      "integrity": "sha512-MULkVLfKGYDFYejP07QOurDLLQpcjk7Fw+7jXS2R2czRQzR56yHRveU5NDJEOviH+hETZKSkIk5c+T23GjFUMg==",
      "license": "BlueOak-1.0.0",
      "dependencies": {
        "brace-expansion": "^5.0.5"
      },
      "engines": {
        "node": "18 || 20 || >=22"
      },
      "funding": {
        "url": "https://github.com/sponsors/isaacs"
      }
    },
    "node_modules/gopd": {
      "version": "1.2.0",
      "resolved": "https://registry.npmjs.org/gopd/-/gopd-1.2.0.tgz",
      "integrity": "sha512-ZUKRh6/kUFoAiTAtTYPZJ3hw9wNxx+BIBOijnlG9PnrJsCcSjs1wyyD6vJpaYtgnzDrKYRSqf3OO6Rfa93xsRg==",
      "license": "MIT",
      "engines": {
        "node": ">= 0.4"
      },
      "funding": {
        "url": "https://github.com/sponsors/ljharb"
      }
    },
    "node_modules/has-flag": {
      "version": "3.0.0",
      "resolved": "https://registry.npmjs.org/has-flag/-/has-flag-3.0.0.tgz",
      "integrity": "sha512-sKJf1+ceQBr4SMkvQnBDNDtf4TXpVhVGateu0t918bl30FnbE2m4vNLX+VWe/dpjlb+HugGYzW7uQXH98HPEYw==",
      "dev": true,
      "license": "MIT",
      "engines": {
        "node": ">=4"
      }
    },
    "node_modules/has-symbols": {
      "version": "1.1.0",
      "resolved": "https://registry.npmjs.org/has-symbols/-/has-symbols-1.1.0.tgz",
      "integrity": "sha512-1cDNdwJ2Jaohmb3sg4OmKaMBwuC48sYni5HUw2DvsC8LjGTLK9h+eb1X6RyuOHe4hT0ULCW68iomhjUoKUqlPQ==",
      "license": "MIT",
      "engines": {
        "node": ">= 0.4"
      },
      "funding": {
        "url": "https://github.com/sponsors/ljharb"
      }
    },
    "node_modules/has-tostringtag": {
      "version": "1.0.2",
      "resolved": "https://registry.npmjs.org/has-tostringtag/-/has-tostringtag-1.0.2.tgz",
      "integrity": "sha512-NqADB8VjPFLM2V0VvHUewwwsw0ZWBaIdgo+ieHtK3hasLz4qeCRjYcqfB6AQrBggRKppKF8L52/VqdVsO47Dlw==",
      "license": "MIT",
      "dependencies": {
        "has-symbols": "^1.0.3"
      },
      "engines": {
        "node": ">= 0.4"
      },
      "funding": {
        "url": "https://github.com/sponsors/ljharb"
      }
    },
    "node_modules/hasown": {
      "version": "2.0.2",
      "resolved": "https://registry.npmjs.org/hasown/-/hasown-2.0.2.tgz",
      "integrity": "sha512-0hJU9SCPvmMzIBdZFqNPXWa6dqh7WdH0cII9y+CyS8rG3nL48Bclra9HmKhVVUHyPWNH5Y7xDwAB7bfgSjkUMQ==",
      "license": "MIT",
      "dependencies": {
        "function-bind": "^1.1.2"
      },
      "engines": {
        "node": ">= 0.4"
      }
    },
    "node_modules/http-errors": {
      "version": "2.0.0",
      "resolved": "https://registry.npmjs.org/http-errors/-/http-errors-2.0.0.tgz",
      "integrity": "sha512-FtwrG/euBzaEjYeRqOgly7G0qviiXoJWnvEH2Z1plBdXgbyjv34pHTSb9zoeHMyDy33+DWy5Wt9Wo+TURtOYSQ==",
      "license": "MIT",
      "dependencies": {
        "depd": "2.0.0",
        "inherits": "2.0.4",
        "setprototypeof": "1.2.0",
        "statuses": "2.0.1",
        "toidentifier": "1.0.1"
      },
      "engines": {
        "node": ">= 0.8"
      }
    },
    "node_modules/iconv-lite": {
      "version": "0.6.3",
      "resolved": "https://registry.npmjs.org/iconv-lite/-/iconv-lite-0.6.3.tgz",
      "integrity": "sha512-4fCk79wshMdzMp2rH06qWrJE4iolqLhCUH+OiuIgU++RB0+94NlDL81atO7GX55uUKueo0txHNtvEyI6D7WdMw==",
      "license": "MIT",
      "dependencies": {
        "safer-buffer": ">= 2.1.2 < 3.0.0"
      },
      "engines": {
        "node": ">=0.10.0"
      }
    },
    "node_modules/ignore-by-default": {
      "version": "1.0.1",
      "resolved": "https://registry.npmjs.org/ignore-by-default/-/ignore-by-default-1.0.1.tgz",
      "integrity": "sha512-Ius2VYcGNk7T90CppJqcIkS5ooHUZyIQK+ClZfMfMNFEF9VSE73Fq+906u/CWu92x4gzZMWOwfFYckPObzdEbA==",
      "dev": true,
      "license": "ISC"
    },
    "node_modules/inherits": {
      "version": "2.0.4",
      "resolved": "https://registry.npmjs.org/inherits/-/inherits-2.0.4.tgz",
      "integrity": "sha512-k/vGaX4/Yla3WzyMCvTQOXYeIHvqOKtnqBduzTHpzpQZzAskKMhZ2K+EnBiSM9zGSoIFeMpXKxa4dYeZIQqewQ==",
      "license": "ISC"
    },
    "node_modules/ipaddr.js": {
      "version": "1.9.1",
      "resolved": "https://registry.npmjs.org/ipaddr.js/-/ipaddr.js-1.9.1.tgz",
      "integrity": "sha512-0KI/607xoxSToH7GjN1FfSbLoU0+btTicjsQSWQlh/hZykN8KpmMf7uYwPW3R+akZ6R/w18ZlXSHBYXiYUPO3g==",
      "license": "MIT",
      "engines": {
        "node": ">= 0.10"
      }
    },
    "node_modules/is-binary-path": {
      "version": "2.1.0",
      "resolved": "https://registry.npmjs.org/is-binary-path/-/is-binary-path-2.1.0.tgz",
      "integrity": "sha512-ZMERYes6pDydyuGidse7OsHxtbI7WVeUEozgR/g7rd0xUimYNlvZRE/K2MgZTjWy725IfelLeVcEM97mmtRGXw==",
      "dev": true,
      "license": "MIT",
      "dependencies": {
        "binary-extensions": "^2.0.0"
      },
      "engines": {
        "node": ">=8"
      }
    },
    "node_modules/is-extglob": {
      "version": "2.1.1",
      "resolved": "https://registry.npmjs.org/is-extglob/-/is-extglob-2.1.1.tgz",
      "integrity": "sha512-SbKbANkN603Vi4jEZv49LeVJMn4yGwsbzZworEoyEiutsN3nJYdbO36zfhGJ6QEDpOZIFkDtnq5JRxmvl3jsoQ==",
      "dev": true,
      "license": "MIT",
      "engines": {
        "node": ">=0.10.0"
      }
    },
    "node_modules/is-glob": {
      "version": "4.0.3",
      "resolved": "https://registry.npmjs.org/is-glob/-/is-glob-4.0.3.tgz",
      "integrity": "sha512-xelSayHH36ZgE7ZWhli7pW34hNbNl8Ojv5KVmkJD4hBdD3th8Tfk9vYasLM+mXWOZhFkgZfxhLSnrwRr4elSSg==",
      "dev": true,
      "license": "MIT",
      "dependencies": {
        "is-extglob": "^2.1.1"
      },
      "engines": {
        "node": ">=0.10.0"
      }
    },
    "node_modules/is-number": {
      "version": "7.0.0",
      "resolved": "https://registry.npmjs.org/is-number/-/is-number-7.0.0.tgz",
      "integrity": "sha512-41Cifkg6e8TylSpdtTpeLVMqvSBEVzTttHvERD741+pnZ8ANv0004MRL43QKPDlK9cGvNp6NZWZUBlbGXYxxng==",
      "dev": true,
      "license": "MIT",
      "engines": {
        "node": ">=0.12.0"
      }
    },
    "node_modules/is-promise": {
      "version": "4.0.0",
      "resolved": "https://registry.npmjs.org/is-promise/-/is-promise-4.0.0.tgz",
      "integrity": "sha512-hvpoI6korhJMnej285dSg6nu1+e6uxs7zG3BYAm5byqDsgJNWwxzM6z6iZiAgQR4TJ30JmBTOwqZUw3WlyH3AQ==",
      "license": "MIT"
    },
    "node_modules/is-property": {
      "version": "1.0.2",
      "resolved": "https://registry.npmjs.org/is-property/-/is-property-1.0.2.tgz",
      "integrity": "sha512-Ks/IoX00TtClbGQr4TWXemAnktAQvYB7HzcCxDGqEZU6oCmb2INHuOoKxbtR+HFkmYWBKv/dOZtGRiAjDhj92g==",
      "license": "MIT"
    },
    "node_modules/isexe": {
      "version": "2.0.0",
      "resolved": "https://registry.npmjs.org/isexe/-/isexe-2.0.0.tgz",
      "integrity": "sha512-RHxMLp9lnKHGHRng9QFhRCMbYAcVpn69smSGcq3f36xjgVVWThj4qqLbTLlq7Ssj8B+fIQ1EuCEGI2lKsyQeIw==",
      "license": "ISC"
    },
    "node_modules/jackspeak": {
      "version": "4.2.3",
      "resolved": "https://registry.npmjs.org/jackspeak/-/jackspeak-4.2.3.tgz",
      "integrity": "sha512-ykkVRwrYvFm1nb2AJfKKYPr0emF6IiXDYUaFx4Zn9ZuIH7MrzEZ3sD5RlqGXNRpHtvUHJyOnCEFxOlNDtGo7wg==",
      "license": "BlueOak-1.0.0",
      "dependencies": {
        "@isaacs/cliui": "^9.0.0"
      },
      "engines": {
        "node": "20 || >=22"
      },
      "funding": {
        "url": "https://github.com/sponsors/isaacs"
      }
    },
    "node_modules/js-yaml": {
      "version": "4.2.0",
      "resolved": "https://registry.npmjs.org/js-yaml/-/js-yaml-4.2.0.tgz",
      "integrity": "sha512-ePWsvanv0DWuDRsW8dnt+R4jQ31SCRCQ7hhNcPXZPsoBZiemuZNYGf7adZdqX2D86j6rvKp3RpCxVTSb8WQlOw==",
      "funding": [
        {
          "type": "github",
          "url": "https://github.com/sponsors/puzrin"
        },
        {
          "type": "github",
          "url": "https://github.com/sponsors/nodeca"
        }
      ],
      "license": "MIT",
      "dependencies": {
        "argparse": "^2.0.1"
      },
      "bin": {
        "js-yaml": "bin/js-yaml.js"
      }
    },
    "node_modules/json-schema-traverse": {
      "version": "1.0.0",
      "resolved": "https://registry.npmjs.org/json-schema-traverse/-/json-schema-traverse-1.0.0.tgz",
      "integrity": "sha512-NM8/P9n3XjXhIZn1lLhkFaACTOURQXjWhV4BA/RnOv8xvgqtqpAX9IO4mRQxSx1Rlo4tqzeqb0sOlruaOy3dug==",
      "license": "MIT"
    },
    "node_modules/jsonwebtoken": {
      "version": "9.0.2",
      "resolved": "https://registry.npmjs.org/jsonwebtoken/-/jsonwebtoken-9.0.2.tgz",
      "integrity": "sha512-PRp66vJ865SSqOlgqS8hujT5U4AOgMfhrwYIuIhfKaoSCZcirrmASQr8CX7cUg+RMih+hgznrjp99o+W4pJLHQ==",
      "license": "MIT",
      "dependencies": {
        "jws": "^3.2.2",
        "lodash.includes": "^4.3.0",
        "lodash.isboolean": "^3.0.3",
        "lodash.isinteger": "^4.0.4",
        "lodash.isnumber": "^3.0.3",
        "lodash.isplainobject": "^4.0.6",
        "lodash.isstring": "^4.0.1",
        "lodash.once": "^4.0.0",
        "ms": "^2.1.1",
        "semver": "^7.5.4"
      },
      "engines": {
        "node": ">=12",
        "npm": ">=6"
      }
    },
    "node_modules/jwa": {
      "version": "1.4.2",
      "resolved": "https://registry.npmjs.org/jwa/-/jwa-1.4.2.tgz",
      "integrity": "sha512-eeH5JO+21J78qMvTIDdBXidBd6nG2kZjg5Ohz/1fpa28Z4CcsWUzJ1ZZyFq/3z3N17aZy+ZuBoHljASbL1WfOw==",
      "license": "MIT",
      "dependencies": {
        "buffer-equal-constant-time": "^1.0.1",
        "ecdsa-sig-formatter": "1.0.11",
        "safe-buffer": "^5.0.1"
      }
    },
    "node_modules/jws": {
      "version": "3.2.2",
      "resolved": "https://registry.npmjs.org/jws/-/jws-3.2.2.tgz",
      "integrity": "sha512-YHlZCB6lMTllWDtSPHz/ZXTsi8S00usEV6v1tjq8tOUZzw7DpSDWVXjXDre6ed1w/pd495ODpHZYSdkRTsa0HA==",
      "license": "MIT",
      "dependencies": {
        "jwa": "^1.4.1",
        "safe-buffer": "^5.0.1"
      }
    },
    "node_modules/lodash.includes": {
      "version": "4.3.0",
      "resolved": "https://registry.npmjs.org/lodash.includes/-/lodash.includes-4.3.0.tgz",
      "integrity": "sha512-W3Bx6mdkRTGtlJISOvVD/lbqjTlPPUDTMnlXZFnVwi9NKJ6tiAk6LVdlhZMm17VZisqhKcgzpO5Wz91PCt5b0w==",
      "license": "MIT"
    },
    "node_modules/lodash.isboolean": {
      "version": "3.0.3",
      "resolved": "https://registry.npmjs.org/lodash.isboolean/-/lodash.isboolean-3.0.3.tgz",
      "integrity": "sha512-Bz5mupy2SVbPHURB98VAcw+aHh4vRV5IPNhILUCsOzRmsTmSQ17jIuqopAentWoehktxGd9e/hbIXq980/1QJg==",
      "license": "MIT"
    },
    "node_modules/lodash.isinteger": {
      "version": "4.0.4",
      "resolved": "https://registry.npmjs.org/lodash.isinteger/-/lodash.isinteger-4.0.4.tgz",
      "integrity": "sha512-DBwtEWN2caHQ9/imiNeEA5ys1JoRtRfY3d7V9wkqtbycnAmTvRRmbHKDV4a0EYc678/dia0jrte4tjYwVBaZUA==",
      "license": "MIT"
    },
    "node_modules/lodash.isnumber": {
      "version": "3.0.3",
      "resolved": "https://registry.npmjs.org/lodash.isnumber/-/lodash.isnumber-3.0.3.tgz",
      "integrity": "sha512-QYqzpfwO3/CWf3XP+Z+tkQsfaLL/EnUlXWVkIk5FUPc4sBdTehEqZONuyRt2P67PXAk+NXmTBcc97zw9t1FQrw==",
      "license": "MIT"
    },
    "node_modules/lodash.isplainobject": {
      "version": "4.0.6",
      "resolved": "https://registry.npmjs.org/lodash.isplainobject/-/lodash.isplainobject-4.0.6.tgz",
      "integrity": "sha512-oSXzaWypCMHkPC3NvBEaPHf0KsA5mvPrOPgQWDsbg8n7orZ290M0BmC/jgRZ4vcJ6DTAhjrsSYgdsW/F+MFOBA==",
      "license": "MIT"
    },
    "node_modules/lodash.isstring": {
      "version": "4.0.1",
      "resolved": "https://registry.npmjs.org/lodash.isstring/-/lodash.isstring-4.0.1.tgz",
      "integrity": "sha512-0wJxfxH1wgO3GrbuP+dTTk7op+6L41QCXbGINEmD+ny/G/eCqGzxyCsh7159S+mgDDcoarnBw6PC1PS5+wUGgw==",
      "license": "MIT"
    },
    "node_modules/lodash.mergewith": {
      "version": "4.6.2",
      "resolved": "https://registry.npmjs.org/lodash.mergewith/-/lodash.mergewith-4.6.2.tgz",
      "integrity": "sha512-GK3g5RPZWTRSeLSpgP8Xhra+pnjBC56q9FZYe1d5RN3TJ35dbkGy3YqBSMbyCrlbi+CM9Z3Jk5yTL7RCsqboyQ==",
      "license": "MIT"
    },
    "node_modules/lodash.once": {
      "version": "4.1.1",
      "resolved": "https://registry.npmjs.org/lodash.once/-/lodash.once-4.1.1.tgz",
      "integrity": "sha512-Sb487aTOCr9drQVL8pIxOzVhafOjZN9UU54hiN8PU3uAiSV7lx1yYNpbNmex2PK6dSJoNTSJUUswT651yww3Mg==",
      "license": "MIT"
    },
    "node_modules/long": {
      "version": "5.3.2",
      "resolved": "https://registry.npmjs.org/long/-/long-5.3.2.tgz",
      "integrity": "sha512-mNAgZ1GmyNhD7AuqnTG3/VQ26o760+ZYBPKjPvugO8+nLbYfX6TVpJPseBvopbdY+qpZ/lKUnmEc1LeZYS3QAA==",
      "license": "Apache-2.0"
    },
    "node_modules/lru-cache": {
      "version": "11.5.1",
      "resolved": "https://registry.npmjs.org/lru-cache/-/lru-cache-11.5.1.tgz",
      "integrity": "sha512-RPimw/7aMdv2oqRrxKwvZXcPfwBrn/JZ2xYcY9Hus/6LaS3VOAKVWKWgNLCFSiOm1ESXinjsDlidVU7JlnCN2A==",
      "license": "BlueOak-1.0.0",
      "engines": {
        "node": "20 || >=22"
      }
    },
    "node_modules/lru.min": {
      "version": "1.1.4",
      "resolved": "https://registry.npmjs.org/lru.min/-/lru.min-1.1.4.tgz",
      "integrity": "sha512-DqC6n3QQ77zdFpCMASA1a3Jlb64Hv2N2DciFGkO/4L9+q/IpIAuRlKOvCXabtRW6cQf8usbmM6BE/TOPysCdIA==",
      "license": "MIT",
      "engines": {
        "bun": ">=1.0.0",
        "deno": ">=1.30.0",
        "node": ">=8.0.0"
      },
      "funding": {
        "type": "github",
        "url": "https://github.com/sponsors/wellwelwel"
      }
    },
    "node_modules/math-intrinsics": {
      "version": "1.1.0",
      "resolved": "https://registry.npmjs.org/math-intrinsics/-/math-intrinsics-1.1.0.tgz",
      "integrity": "sha512-/IXtbwEk5HTPyEwyKX6hGkYXxM9nbj64B+ilVJnC/R6B0pH5G4V3b0pVbL7DBj4tkhBAppbQUlf6F6Xl9LHu1g==",
      "license": "MIT",
      "engines": {
        "node": ">= 0.4"
      }
    },
    "node_modules/media-typer": {
      "version": "1.1.0",
      "resolved": "https://registry.npmjs.org/media-typer/-/media-typer-1.1.0.tgz",
      "integrity": "sha512-aisnrDP4GNe06UcKFnV5bfMNPBUw4jsLGaWwWfnH3v02GnBuXX2MCVn5RbrWo0j3pczUilYblq7fQ7Nw2t5XKw==",
      "license": "MIT",
      "engines": {
        "node": ">= 0.8"
      }
    },
    "node_modules/merge-descriptors": {
      "version": "2.0.0",
      "resolved": "https://registry.npmjs.org/merge-descriptors/-/merge-descriptors-2.0.0.tgz",
      "integrity": "sha512-Snk314V5ayFLhp3fkUREub6WtjBfPdCPY1Ln8/8munuLuiYhsABgBVWsozAG+MWMbVEvcdcpbi9R7ww22l9Q3g==",
      "license": "MIT",
      "engines": {
        "node": ">=18"
      },
      "funding": {
        "url": "https://github.com/sponsors/sindresorhus"
      }
    },
    "node_modules/mime-db": {
      "version": "1.54.0",
      "resolved": "https://registry.npmjs.org/mime-db/-/mime-db-1.54.0.tgz",
      "integrity": "sha512-aU5EJuIN2WDemCcAp2vFBfp/m4EAhWJnUNSSw0ixs7/kXbd6Pg64EmwJkNdFhB8aWt1sH2CTXrLxo/iAGV3oPQ==",
      "license": "MIT",
      "engines": {
        "node": ">= 0.6"
      }
    },
    "node_modules/mime-types": {
      "version": "3.0.1",
      "resolved": "https://registry.npmjs.org/mime-types/-/mime-types-3.0.1.tgz",
      "integrity": "sha512-xRc4oEhT6eaBpU1XF7AjpOFD+xQmXNB5OVKwp4tqCuBpHLS/ZbBDrc07mYTDqVMg6PfxUjjNp85O6Cd2Z/5HWA==",
      "license": "MIT",
      "dependencies": {
        "mime-db": "^1.54.0"
      },
      "engines": {
        "node": ">= 0.6"
      }
    },
    "node_modules/minimatch": {
      "version": "3.1.2",
      "resolved": "https://registry.npmjs.org/minimatch/-/minimatch-3.1.2.tgz",
      "integrity": "sha512-J7p63hRiAjw1NDEww1W7i37+ByIrOWO5XQQAzZ3VOcL0PNybwpfmV/N05zFAzwQ9USyEcX6t3UO+K5aqBQOIHw==",
      "dev": true,
      "license": "ISC",
      "dependencies": {
        "brace-expansion": "^1.1.7"
      },
      "engines": {
        "node": "*"
      }
    },
    "node_modules/minimist": {
      "version": "1.2.8",
      "resolved": "https://registry.npmjs.org/minimist/-/minimist-1.2.8.tgz",
      "integrity": "sha512-2yyAR8qBkN3YuheJanUpWC5U3bb5osDywNB8RzDVlDwDHbocAJveqqj1u8+SVD7jkWT4yvsHCpWqqWqAxb0zCA==",
      "license": "MIT",
      "funding": {
        "url": "https://github.com/sponsors/ljharb"
      }
    },
    "node_modules/minipass": {
      "version": "7.1.3",
      "resolved": "https://registry.npmjs.org/minipass/-/minipass-7.1.3.tgz",
      "integrity": "sha512-tEBHqDnIoM/1rXME1zgka9g6Q2lcoCkxHLuc7ODJ5BxbP5d4c2Z5cGgtXAku59200Cx7diuHTOYfSBD8n6mm8A==",
      "license": "BlueOak-1.0.0",
      "engines": {
        "node": ">=16 || 14 >=14.17"
      }
    },
    "node_modules/mkdirp": {
      "version": "0.5.6",
      "resolved": "https://registry.npmjs.org/mkdirp/-/mkdirp-0.5.6.tgz",
      "integrity": "sha512-FP+p8RB8OWpF3YZBCrP5gtADmtXApB5AMLn+vdyA+PyxCjrCs00mjyUozssO33cwDeT3wNGdLxJ5M//YqtHAJw==",
      "license": "MIT",
      "dependencies": {
        "minimist": "^1.2.6"
      },
      "bin": {
        "mkdirp": "bin/cmd.js"
      }
    },
    "node_modules/ms": {
      "version": "2.1.3",
      "resolved": "https://registry.npmjs.org/ms/-/ms-2.1.3.tgz",
      "integrity": "sha512-6FlzubTLZG3J2a/NVCAleEhjzq5oxgHyaCU9yYXvcLsvoVaHJq/s5xXI6/XXP6tz7R9xAOtHnSO/tXtF3WRTlA==",
      "license": "MIT"
    },
    "node_modules/multer": {
      "version": "2.0.1",
      "resolved": "https://registry.npmjs.org/multer/-/multer-2.0.1.tgz",
      "integrity": "sha512-Ug8bXeTIUlxurg8xLTEskKShvcKDZALo1THEX5E41pYCD2sCVub5/kIRIGqWNoqV6szyLyQKV6mD4QUrWE5GCQ==",
      "license": "MIT",
      "dependencies": {
        "append-field": "^1.0.0",
        "busboy": "^1.6.0",
        "concat-stream": "^2.0.0",
        "mkdirp": "^0.5.6",
        "object-assign": "^4.1.1",
        "type-is": "^1.6.18",
        "xtend": "^4.0.2"
      },
      "engines": {
        "node": ">= 10.16.0"
      }
    },
    "node_modules/multer/node_modules/media-typer": {
      "version": "0.3.0",
      "resolved": "https://registry.npmjs.org/media-typer/-/media-typer-0.3.0.tgz",
      "integrity": "sha512-dq+qelQ9akHpcOl/gUVRTxVIOkAJ1wR3QAvb4RsVjS8oVoFjDGTc679wJYmUmknUF5HwMLOgb5O+a3KxfWapPQ==",
      "license": "MIT",
      "engines": {
        "node": ">= 0.6"
      }
    },
    "node_modules/multer/node_modules/mime-db": {
      "version": "1.52.0",
      "resolved": "https://registry.npmjs.org/mime-db/-/mime-db-1.52.0.tgz",
      "integrity": "sha512-sPU4uV7dYlvtWJxwwxHD0PuihVNiE7TyAbQ5SWxDCB9mUYvOgroQOwYQQOKPJ8CIbE+1ETVlOoK1UC2nU3gYvg==",
      "license": "MIT",
      "engines": {
        "node": ">= 0.6"
      }
    },
    "node_modules/multer/node_modules/mime-types": {
      "version": "2.1.35",
      "resolved": "https://registry.npmjs.org/mime-types/-/mime-types-2.1.35.tgz",
      "integrity": "sha512-ZDY+bPm5zTTF+YpCrAU9nK0UgICYPT0QtT1NZWFv4s++TNkcgVaT0g6+4R2uI4MjQjzysHB1zxuWL50hzaeXiw==",
      "license": "MIT",
      "dependencies": {
        "mime-db": "1.52.0"
      },
      "engines": {
        "node": ">= 0.6"
      }
    },
    "node_modules/multer/node_modules/type-is": {
      "version": "1.6.18",
      "resolved": "https://registry.npmjs.org/type-is/-/type-is-1.6.18.tgz",
      "integrity": "sha512-TkRKr9sUTxEH8MdfuCSP7VizJyzRNMjj2J2do2Jr3Kym598JVdEksuzPQCnlFPW4ky9Q+iA+ma9BGm06XQBy8g==",
      "license": "MIT",
      "dependencies": {
        "media-typer": "0.3.0",
        "mime-types": "~2.1.24"
      },
      "engines": {
        "node": ">= 0.6"
      }
    },
    "node_modules/mysql2": {
      "version": "3.22.5",
      "resolved": "https://registry.npmjs.org/mysql2/-/mysql2-3.22.5.tgz",
      "integrity": "sha512-95uZ2TrPWAZdwpB3vvvDbmEMcNG8yIeNCyu6GUcr/QnWEE/wXm7+mhOCsdQfWQDTV7qYT/PDUZ4U4UPP4AsXqQ==",
      "license": "MIT",
      "dependencies": {
        "aws-ssl-profiles": "^1.1.2",
        "denque": "^2.1.0",
        "generate-function": "^2.3.1",
        "iconv-lite": "^0.7.2",
        "long": "^5.3.2",
        "lru.min": "^1.1.4",
        "named-placeholders": "^1.1.6",
        "sql-escaper": "^1.3.3"
      },
      "engines": {
        "node": ">= 8.0"
      },
      "peerDependencies": {
        "@types/node": ">= 8"
      }
    },
    "node_modules/mysql2/node_modules/iconv-lite": {
      "version": "0.7.2",
      "resolved": "https://registry.npmjs.org/iconv-lite/-/iconv-lite-0.7.2.tgz",
      "integrity": "sha512-im9DjEDQ55s9fL4EYzOAv0yMqmMBSZp6G0VvFyTMPKWxiSBHUj9NW/qqLmXUwXrrM7AvqSlTCfvqRb0cM8yYqw==",
      "license": "MIT",
      "dependencies": {
        "safer-buffer": ">= 2.1.2 < 3.0.0"
      },
      "engines": {
        "node": ">=0.10.0"
      },
      "funding": {
        "type": "opencollective",
        "url": "https://opencollective.com/express"
      }
    },
    "node_modules/named-placeholders": {
      "version": "1.1.6",
      "resolved": "https://registry.npmjs.org/named-placeholders/-/named-placeholders-1.1.6.tgz",
      "integrity": "sha512-Tz09sEL2EEuv5fFowm419c1+a/jSMiBjI9gHxVLrVdbUkkNUUfjsVYs9pVZu5oCon/kmRh9TfLEObFtkVxmY0w==",
      "license": "MIT",
      "dependencies": {
        "lru.min": "^1.1.0"
      },
      "engines": {
        "node": ">=8.0.0"
      }
    },
    "node_modules/negotiator": {
      "version": "1.0.0",
      "resolved": "https://registry.npmjs.org/negotiator/-/negotiator-1.0.0.tgz",
      "integrity": "sha512-8Ofs/AUQh8MaEcrlq5xOX0CQ9ypTF5dl78mjlMNfOK08fzpgTHQRQPBxcPlEtIw0yRpws+Zo/3r+5WRby7u3Gg==",
      "license": "MIT",
      "engines": {
        "node": ">= 0.6"
      }
    },
    "node_modules/nodemailer": {
      "version": "7.0.3",
      "resolved": "https://registry.npmjs.org/nodemailer/-/nodemailer-7.0.3.tgz",
      "integrity": "sha512-Ajq6Sz1x7cIK3pN6KesGTah+1gnwMnx5gKl3piQlQQE/PwyJ4Mbc8is2psWYxK3RJTVeqsDaCv8ZzXLCDHMTZw==",
      "license": "MIT-0",
      "engines": {
        "node": ">=6.0.0"
      }
    },
    "node_modules/nodemon": {
      "version": "3.1.10",
      "resolved": "https://registry.npmjs.org/nodemon/-/nodemon-3.1.10.tgz",
      "integrity": "sha512-WDjw3pJ0/0jMFmyNDp3gvY2YizjLmmOUQo6DEBY+JgdvW/yQ9mEeSw6H5ythl5Ny2ytb7f9C2nIbjSxMNzbJXw==",
      "dev": true,
      "license": "MIT",
      "dependencies": {
        "chokidar": "^3.5.2",
        "debug": "^4",
        "ignore-by-default": "^1.0.1",
        "minimatch": "^3.1.2",
        "pstree.remy": "^1.1.8",
        "semver": "^7.5.3",
        "simple-update-notifier": "^2.0.0",
        "supports-color": "^5.5.0",
        "touch": "^3.1.0",
        "undefsafe": "^2.0.5"
      },
      "bin": {
        "nodemon": "bin/nodemon.js"
      },
      "engines": {
        "node": ">=10"
      },
      "funding": {
        "type": "opencollective",
        "url": "https://opencollective.com/nodemon"
      }
    },
    "node_modules/normalize-path": {
      "version": "3.0.0",
      "resolved": "https://registry.npmjs.org/normalize-path/-/normalize-path-3.0.0.tgz",
      "integrity": "sha512-6eZs5Ls3WtCisHWp9S2GUy8dqkpGi4BVSz3GaqiE6ezub0512ESztXUwUB6C6IKbQkY2Pnb/mD4WYojCRwcwLA==",
      "dev": true,
      "license": "MIT",
      "engines": {
        "node": ">=0.10.0"
      }
    },
    "node_modules/object-assign": {
      "version": "4.1.1",
      "resolved": "https://registry.npmjs.org/object-assign/-/object-assign-4.1.1.tgz",
      "integrity": "sha512-rJgTQnkUnH1sFw8yT6VSU3zD3sWmu6sZhIseY8VX+GRu3P6F7Fu+JNDoXfklElbLJSnc3FUQHVe4cU5hj+BcUg==",
      "license": "MIT",
      "engines": {
        "node": ">=0.10.0"
      }
    },
    "node_modules/object-inspect": {
      "version": "1.13.4",
      "resolved": "https://registry.npmjs.org/object-inspect/-/object-inspect-1.13.4.tgz",
      "integrity": "sha512-W67iLl4J2EXEGTbfeHCffrjDfitvLANg0UlX3wFUUSTx92KXRFegMHUVgSqE+wvhAbi4WqjGg9czysTV2Epbew==",
      "license": "MIT",
      "engines": {
        "node": ">= 0.4"
      },
      "funding": {
        "url": "https://github.com/sponsors/ljharb"
      }
    },
    "node_modules/on-finished": {
      "version": "2.4.1",
      "resolved": "https://registry.npmjs.org/on-finished/-/on-finished-2.4.1.tgz",
      "integrity": "sha512-oVlzkg3ENAhCk2zdv7IJwd/QUD4z2RxRwpkcGY8psCVcCYZNq4wYnVWALHM+brtuJjePWiYF/ClmuDr8Ch5+kg==",
      "license": "MIT",
      "dependencies": {
        "ee-first": "1.1.1"
      },
      "engines": {
        "node": ">= 0.8"
      }
    },
    "node_modules/once": {
      "version": "1.4.0",
      "resolved": "https://registry.npmjs.org/once/-/once-1.4.0.tgz",
      "integrity": "sha512-lNaJgI+2Q5URQBkccEKHTQOPaXdUxnZZElQTZY0MFUAuaEqe1E+Nyvgdz/aIyNi6Z9MzO5dv1H8n58/GELp3+w==",
      "license": "ISC",
      "dependencies": {
        "wrappy": "1"
      }
    },
    "node_modules/openapi-types": {
      "version": "12.1.3",
      "resolved": "https://registry.npmjs.org/openapi-types/-/openapi-types-12.1.3.tgz",
      "integrity": "sha512-N4YtSYJqghVu4iek2ZUvcN/0aqH1kRDuNqzcycDxhOUpg7GdvLa2F3DgS6yBNhInhv2r/6I0Flkn7CqL8+nIcw==",
      "license": "MIT",
      "peer": true
    },
    "node_modules/package-json-from-dist": {
      "version": "1.0.1",
      "resolved": "https://registry.npmjs.org/package-json-from-dist/-/package-json-from-dist-1.0.1.tgz",
      "integrity": "sha512-UEZIS3/by4OC8vL3P2dTXRETpebLI2NiI5vIrjaD/5UtrkFX/tNbwjTSRAGC/+7CAo2pIcBaRgWmcBBHcsaCIw==",
      "license": "BlueOak-1.0.0"
    },
    "node_modules/parseurl": {
      "version": "1.3.3",
      "resolved": "https://registry.npmjs.org/parseurl/-/parseurl-1.3.3.tgz",
      "integrity": "sha512-CiyeOxFT/JZyN5m0z9PfXw4SCBJ6Sygz1Dpl0wqjlhDEGGBP1GnsUVEL0p63hoG1fcj3fHynXi9NYO4nWOL+qQ==",
      "license": "MIT",
      "engines": {
        "node": ">= 0.8"
      }
    },
    "node_modules/path-key": {
      "version": "3.1.1",
      "resolved": "https://registry.npmjs.org/path-key/-/path-key-3.1.1.tgz",
      "integrity": "sha512-ojmeN0qd+y0jszEtoY48r0Peq5dwMEkIlCOu6Q5f41lfkswXuKtYrhgoTpLnyIcHm24Uhqx+5Tqm2InSwLhE6Q==",
      "license": "MIT",
      "engines": {
        "node": ">=8"
      }
    },
    "node_modules/path-scurry": {
      "version": "2.0.2",
      "resolved": "https://registry.npmjs.org/path-scurry/-/path-scurry-2.0.2.tgz",
      "integrity": "sha512-3O/iVVsJAPsOnpwWIeD+d6z/7PmqApyQePUtCndjatj/9I5LylHvt5qluFaBT3I5h3r1ejfR056c+FCv+NnNXg==",
      "license": "BlueOak-1.0.0",
      "dependencies": {
        "lru-cache": "^11.0.0",
        "minipass": "^7.1.2"
      },
      "engines": {
        "node": "18 || 20 || >=22"
      },
      "funding": {
        "url": "https://github.com/sponsors/isaacs"
      }
    },
    "node_modules/path-to-regexp": {
      "version": "8.2.0",
      "resolved": "https://registry.npmjs.org/path-to-regexp/-/path-to-regexp-8.2.0.tgz",
      "integrity": "sha512-TdrF7fW9Rphjq4RjrW0Kp2AW0Ahwu9sRGTkS6bvDi0SCwZlEZYmcfDbEsTz8RVk0EHIS/Vd1bv3JhG+1xZuAyQ==",
      "license": "MIT",
      "engines": {
        "node": ">=16"
      }
    },
    "node_modules/picomatch": {
      "version": "2.3.1",
      "resolved": "https://registry.npmjs.org/picomatch/-/picomatch-2.3.1.tgz",
      "integrity": "sha512-JU3teHTNjmE2VCGFzuY8EXzCDVwEqB2a8fsIvwaStHhAWJEeVd1o1QD80CU6+ZdEXXSLbSsuLwJjkCBWqRQUVA==",
      "dev": true,
      "license": "MIT",
      "engines": {
        "node": ">=8.6"
      },
      "funding": {
        "url": "https://github.com/sponsors/jonschlinkert"
      }
    },
    "node_modules/proxy-addr": {
      "version": "2.0.7",
      "resolved": "https://registry.npmjs.org/proxy-addr/-/proxy-addr-2.0.7.tgz",
      "integrity": "sha512-llQsMLSUDUPT44jdrU/O37qlnifitDP+ZwrmmZcoSKyLKvtZxpyV0n2/bD/N4tBAAZ/gJEdZU7KMraoK1+XYAg==",
      "license": "MIT",
      "dependencies": {
        "forwarded": "0.2.0",
        "ipaddr.js": "1.9.1"
      },
      "engines": {
        "node": ">= 0.10"
      }
    },
    "node_modules/proxy-from-env": {
      "version": "1.1.0",
      "resolved": "https://registry.npmjs.org/proxy-from-env/-/proxy-from-env-1.1.0.tgz",
      "integrity": "sha512-D+zkORCbA9f1tdWRK0RaCR3GPv50cMxcrz4X8k5LTSUD1Dkw47mKJEZQNunItRTkWwgtaUSo1RVFRIG9ZXiFYg==",
      "license": "MIT"
    },
    "node_modules/pstree.remy": {
      "version": "1.1.8",
      "resolved": "https://registry.npmjs.org/pstree.remy/-/pstree.remy-1.1.8.tgz",
      "integrity": "sha512-77DZwxQmxKnu3aR542U+X8FypNzbfJ+C5XQDk3uWjWxn6151aIMGthWYRXTqT1E5oJvg+ljaa2OJi+VfvCOQ8w==",
      "dev": true,
      "license": "MIT"
    },
    "node_modules/qs": {
      "version": "6.14.0",
      "resolved": "https://registry.npmjs.org/qs/-/qs-6.14.0.tgz",
      "integrity": "sha512-YWWTjgABSKcvs/nWBi9PycY/JiPJqOD4JA6o9Sej2AtvSGarXxKC3OQSk4pAarbdQlKAh5D4FCQkJNkW+GAn3w==",
      "license": "BSD-3-Clause",
      "dependencies": {
        "side-channel": "^1.1.0"
      },
      "engines": {
        "node": ">=0.6"
      },
      "funding": {
        "url": "https://github.com/sponsors/ljharb"
      }
    },
    "node_modules/range-parser": {
      "version": "1.2.1",
      "resolved": "https://registry.npmjs.org/range-parser/-/range-parser-1.2.1.tgz",
      "integrity": "sha512-Hrgsx+orqoygnmhFbKaHE6c296J+HTAQXoxEF6gNupROmmGJRoyzfG3ccAveqCBrwr/2yxQ5BVd/GTl5agOwSg==",
      "license": "MIT",
      "engines": {
        "node": ">= 0.6"
      }
    },
    "node_modules/raw-body": {
      "version": "3.0.0",
      "resolved": "https://registry.npmjs.org/raw-body/-/raw-body-3.0.0.tgz",
      "integrity": "sha512-RmkhL8CAyCRPXCE28MMH0z2PNWQBNk2Q09ZdxM9IOOXwxwZbN+qbWaatPkdkWIKL2ZVDImrN/pK5HTRz2PcS4g==",
      "license": "MIT",
      "dependencies": {
        "bytes": "3.1.2",
        "http-errors": "2.0.0",
        "iconv-lite": "0.6.3",
        "unpipe": "1.0.0"
      },
      "engines": {
        "node": ">= 0.8"
      }
    },
    "node_modules/razorpay": {
      "version": "2.9.6",
      "resolved": "https://registry.npmjs.org/razorpay/-/razorpay-2.9.6.tgz",
      "integrity": "sha512-zsHAQzd6e1Cc6BNoCNZQaf65ElL6O6yw0wulxmoG5VQDr363fZC90Mp1V5EktVzG45yPyNomNXWlf4cQ3622gQ==",
      "license": "MIT",
      "dependencies": {
        "axios": "^1.6.8"
      }
    },
    "node_modules/readable-stream": {
      "version": "3.6.2",
      "resolved": "https://registry.npmjs.org/readable-stream/-/readable-stream-3.6.2.tgz",
      "integrity": "sha512-9u/sniCrY3D5WdsERHzHE4G2YCXqoG5FTHUiCC4SIbr6XcLZBY05ya9EKjYek9O5xOAwjGq+1JdGBAS7Q9ScoA==",
      "license": "MIT",
      "dependencies": {
        "inherits": "^2.0.3",
        "string_decoder": "^1.1.1",
        "util-deprecate": "^1.0.1"
      },
      "engines": {
        "node": ">= 6"
      }
    },
    "node_modules/readdirp": {
      "version": "3.6.0",
      "resolved": "https://registry.npmjs.org/readdirp/-/readdirp-3.6.0.tgz",
      "integrity": "sha512-hOS089on8RduqdbhvQ5Z37A0ESjsqz6qnRcffsMU3495FuTdqSm+7bhJ29JvIOsBDEEnan5DPu9t3To9VRlMzA==",
      "dev": true,
      "license": "MIT",
      "dependencies": {
        "picomatch": "^2.2.1"
      },
      "engines": {
        "node": ">=8.10.0"
      }
    },
    "node_modules/require-from-string": {
      "version": "2.0.2",
      "resolved": "https://registry.npmjs.org/require-from-string/-/require-from-string-2.0.2.tgz",
      "integrity": "sha512-Xf0nWe6RseziFMu+Ap9biiUbmplq6S9/p+7w7YXP/JBHhrUDDUhwa+vANyubuqfZWTveU//DYVGsDG7RKL/vEw==",
      "license": "MIT",
      "engines": {
        "node": ">=0.10.0"
      }
    },
    "node_modules/router": {
      "version": "2.2.0",
      "resolved": "https://registry.npmjs.org/router/-/router-2.2.0.tgz",
      "integrity": "sha512-nLTrUKm2UyiL7rlhapu/Zl45FwNgkZGaCpZbIHajDYgwlJCOzLSk+cIPAnsEqV955GjILJnKbdQC1nVPz+gAYQ==",
      "license": "MIT",
      "dependencies": {
        "debug": "^4.4.0",
        "depd": "^2.0.0",
        "is-promise": "^4.0.0",
        "parseurl": "^1.3.3",
        "path-to-regexp": "^8.0.0"
      },
      "engines": {
        "node": ">= 18"
      }
    },
    "node_modules/safe-buffer": {
      "version": "5.2.1",
      "resolved": "https://registry.npmjs.org/safe-buffer/-/safe-buffer-5.2.1.tgz",
      "integrity": "sha512-rp3So07KcdmmKbGvgaNxQSJr7bGVSVk5S9Eq1F+ppbRo70+YeaDxkw5Dd8NPN+GD6bjnYm2VuPuCXmpuYvmCXQ==",
      "funding": [
        {
          "type": "github",
          "url": "https://github.com/sponsors/feross"
        },
        {
          "type": "patreon",
          "url": "https://www.patreon.com/feross"
        },
        {
          "type": "consulting",
          "url": "https://feross.org/support"
        }
      ],
      "license": "MIT"
    },
    "node_modules/safer-buffer": {
      "version": "2.1.2",
      "resolved": "https://registry.npmjs.org/safer-buffer/-/safer-buffer-2.1.2.tgz",
      "integrity": "sha512-YZo3K82SD7Riyi0E1EQPojLz7kpepnSQI9IyPbHHg1XXXevb5dJI7tpyN2ADxGcQbHG7vcyRHk0cbwqcQriUtg==",
      "license": "MIT"
    },
    "node_modules/semver": {
      "version": "7.7.2",
      "resolved": "https://registry.npmjs.org/semver/-/semver-7.7.2.tgz",
      "integrity": "sha512-RF0Fw+rO5AMf9MAyaRXI4AV0Ulj5lMHqVxxdSgiVbixSCXoEmmX/jk0CuJw4+3SqroYO9VoUh+HcuJivvtJemA==",
      "license": "ISC",
      "bin": {
        "semver": "bin/semver.js"
      },
      "engines": {
        "node": ">=10"
      }
    },
    "node_modules/send": {
      "version": "1.2.0",
      "resolved": "https://registry.npmjs.org/send/-/send-1.2.0.tgz",
      "integrity": "sha512-uaW0WwXKpL9blXE2o0bRhoL2EGXIrZxQ2ZQ4mgcfoBxdFmQold+qWsD2jLrfZ0trjKL6vOw0j//eAwcALFjKSw==",
      "license": "MIT",
      "dependencies": {
        "debug": "^4.3.5",
        "encodeurl": "^2.0.0",
        "escape-html": "^1.0.3",
        "etag": "^1.8.1",
        "fresh": "^2.0.0",
        "http-errors": "^2.0.0",
        "mime-types": "^3.0.1",
        "ms": "^2.1.3",
        "on-finished": "^2.4.1",
        "range-parser": "^1.2.1",
        "statuses": "^2.0.1"
      },
      "engines": {
        "node": ">= 18"
      }
    },
    "node_modules/serve-static": {
      "version": "2.2.0",
      "resolved": "https://registry.npmjs.org/serve-static/-/serve-static-2.2.0.tgz",
      "integrity": "sha512-61g9pCh0Vnh7IutZjtLGGpTA355+OPn2TyDv/6ivP2h/AdAVX9azsoxmg2/M6nZeQZNYBEwIcsne1mJd9oQItQ==",
      "license": "MIT",
      "dependencies": {
        "encodeurl": "^2.0.0",
        "escape-html": "^1.0.3",
        "parseurl": "^1.3.3",
        "send": "^1.2.0"
      },
      "engines": {
        "node": ">= 18"
      }
    },
    "node_modules/setprototypeof": {
      "version": "1.2.0",
      "resolved": "https://registry.npmjs.org/setprototypeof/-/setprototypeof-1.2.0.tgz",
      "integrity": "sha512-E5LDX7Wrp85Kil5bhZv46j8jOeboKq5JMmYM3gVGdGH8xFpPWXUMsNrlODCrkoxMEeNi/XZIwuRvY4XNwYMJpw==",
      "license": "ISC"
    },
    "node_modules/shebang-command": {
      "version": "2.0.0",
      "resolved": "https://registry.npmjs.org/shebang-command/-/shebang-command-2.0.0.tgz",
      "integrity": "sha512-kHxr2zZpYtdmrN1qDjrrX/Z1rR1kG8Dx+gkpK1G4eXmvXswmcE1hTWBWYUzlraYw1/yZp6YuDY77YtvbN0dmDA==",
      "license": "MIT",
      "dependencies": {
        "shebang-regex": "^3.0.0"
      },
      "engines": {
        "node": ">=8"
      }
    },
    "node_modules/shebang-regex": {
      "version": "3.0.0",
      "resolved": "https://registry.npmjs.org/shebang-regex/-/shebang-regex-3.0.0.tgz",
      "integrity": "sha512-7++dFhtcx3353uBaq8DDR4NuxBetBzC7ZQOhmTQInHEd6bSrXdiEyzCvG07Z44UYdLShWUyXt5M/yhz8ekcb1A==",
      "license": "MIT",
      "engines": {
        "node": ">=8"
      }
    },
    "node_modules/side-channel": {
      "version": "1.1.0",
      "resolved": "https://registry.npmjs.org/side-channel/-/side-channel-1.1.0.tgz",
      "integrity": "sha512-ZX99e6tRweoUXqR+VBrslhda51Nh5MTQwou5tnUDgbtyM0dBgmhEDtWGP/xbKn6hqfPRHujUNwz5fy/wbbhnpw==",
      "license": "MIT",
      "dependencies": {
        "es-errors": "^1.3.0",
        "object-inspect": "^1.13.3",
        "side-channel-list": "^1.0.0",
        "side-channel-map": "^1.0.1",
        "side-channel-weakmap": "^1.0.2"
      },
      "engines": {
        "node": ">= 0.4"
      },
      "funding": {
        "url": "https://github.com/sponsors/ljharb"
      }
    },
    "node_modules/side-channel-list": {
      "version": "1.0.0",
      "resolved": "https://registry.npmjs.org/side-channel-list/-/side-channel-list-1.0.0.tgz",
      "integrity": "sha512-FCLHtRD/gnpCiCHEiJLOwdmFP+wzCmDEkc9y7NsYxeF4u7Btsn1ZuwgwJGxImImHicJArLP4R0yX4c2KCrMrTA==",
      "license": "MIT",
      "dependencies": {
        "es-errors": "^1.3.0",
        "object-inspect": "^1.13.3"
      },
      "engines": {
        "node": ">= 0.4"
      },
      "funding": {
        "url": "https://github.com/sponsors/ljharb"
      }
    },
    "node_modules/side-channel-map": {
      "version": "1.0.1",
      "resolved": "https://registry.npmjs.org/side-channel-map/-/side-channel-map-1.0.1.tgz",
      "integrity": "sha512-VCjCNfgMsby3tTdo02nbjtM/ewra6jPHmpThenkTYh8pG9ucZ/1P8So4u4FGBek/BjpOVsDCMoLA/iuBKIFXRA==",
      "license": "MIT",
      "dependencies": {
        "call-bound": "^1.0.2",
        "es-errors": "^1.3.0",
        "get-intrinsic": "^1.2.5",
        "object-inspect": "^1.13.3"
      },
      "engines": {
        "node": ">= 0.4"
      },
      "funding": {
        "url": "https://github.com/sponsors/ljharb"
      }
    },
    "node_modules/side-channel-weakmap": {
      "version": "1.0.2",
      "resolved": "https://registry.npmjs.org/side-channel-weakmap/-/side-channel-weakmap-1.0.2.tgz",
      "integrity": "sha512-WPS/HvHQTYnHisLo9McqBHOJk2FkHO/tlpvldyrnem4aeQp4hai3gythswg6p01oSoTl58rcpiFAjF2br2Ak2A==",
      "license": "MIT",
      "dependencies": {
        "call-bound": "^1.0.2",
        "es-errors": "^1.3.0",
        "get-intrinsic": "^1.2.5",
        "object-inspect": "^1.13.3",
        "side-channel-map": "^1.0.1"
      },
      "engines": {
        "node": ">= 0.4"
      },
      "funding": {
        "url": "https://github.com/sponsors/ljharb"
      }
    },
    "node_modules/signal-exit": {
      "version": "4.1.0",
      "resolved": "https://registry.npmjs.org/signal-exit/-/signal-exit-4.1.0.tgz",
      "integrity": "sha512-bzyZ1e88w9O1iNJbKnOlvYTrWPDl46O1bG0D3XInv+9tkPrxrN8jUUTiFlDkkmKWgn1M6CfIA13SuGqOa9Korw==",
      "license": "ISC",
      "engines": {
        "node": ">=14"
      },
      "funding": {
        "url": "https://github.com/sponsors/isaacs"
      }
    },
    "node_modules/simple-update-notifier": {
      "version": "2.0.0",
      "resolved": "https://registry.npmjs.org/simple-update-notifier/-/simple-update-notifier-2.0.0.tgz",
      "integrity": "sha512-a2B9Y0KlNXl9u/vsW6sTIu9vGEpfKu2wRV6l1H3XEas/0gUIzGzBoP/IouTcUQbm9JWZLH3COxyn03TYlFax6w==",
      "dev": true,
      "license": "MIT",
      "dependencies": {
        "semver": "^7.5.3"
      },
      "engines": {
        "node": ">=10"
      }
    },
    "node_modules/sql-escaper": {
      "version": "1.3.3",
      "resolved": "https://registry.npmjs.org/sql-escaper/-/sql-escaper-1.3.3.tgz",
      "integrity": "sha512-BsTCV265VpTp8tm1wyIm1xqQCS+Q9NHx2Sr+WcnUrgLrQ6yiDIvHYJV5gHxsj1lMBy2zm5twLaZao8Jd+S8JJw==",
      "license": "MIT",
      "engines": {
        "bun": ">=1.0.0",
        "deno": ">=2.0.0",
        "node": ">=12.0.0"
      },
      "funding": {
        "type": "github",
        "url": "https://github.com/mysqljs/sql-escaper?sponsor=1"
      }
    },
    "node_modules/statuses": {
      "version": "2.0.1",
      "resolved": "https://registry.npmjs.org/statuses/-/statuses-2.0.1.tgz",
      "integrity": "sha512-RwNA9Z/7PrK06rYLIzFMlaF+l73iwpzsqRIFgbMLbTcLD6cOao82TaWefPXQvB2fOC4AjuYSEndS7N/mTCbkdQ==",
      "license": "MIT",
      "engines": {
        "node": ">= 0.8"
      }
    },
    "node_modules/streamsearch": {
      "version": "1.1.0",
      "resolved": "https://registry.npmjs.org/streamsearch/-/streamsearch-1.1.0.tgz",
      "integrity": "sha512-Mcc5wHehp9aXz1ax6bZUyY5afg9u2rv5cqQI3mRrYkGC8rW2hM02jWuwjtL++LS5qinSyhj2QfLyNsuc+VsExg==",
      "engines": {
        "node": ">=10.0.0"
      }
    },
    "node_modules/string_decoder": {
      "version": "1.3.0",
      "resolved": "https://registry.npmjs.org/string_decoder/-/string_decoder-1.3.0.tgz",
      "integrity": "sha512-hkRX8U1WjJFd8LsDJ2yQ/wWWxaopEsABU1XfkM8A+j0+85JAGppt16cr1Whg6KIbb4okU6Mql6BOj+uup/wKeA==",
      "license": "MIT",
      "dependencies": {
        "safe-buffer": "~5.2.0"
      }
    },
    "node_modules/supports-color": {
      "version": "5.5.0",
      "resolved": "https://registry.npmjs.org/supports-color/-/supports-color-5.5.0.tgz",
      "integrity": "sha512-QjVjwdXIt408MIiAqCX4oUKsgU2EqAGzs2Ppkm4aQYbjm+ZEWEcW4SfFNTr4uMNZma0ey4f5lgLrkB0aX0QMow==",
      "dev": true,
      "license": "MIT",
      "dependencies": {
        "has-flag": "^3.0.0"
      },
      "engines": {
        "node": ">=4"
      }
    },
    "node_modules/swagger-jsdoc": {
      "version": "6.3.0",
      "resolved": "https://registry.npmjs.org/swagger-jsdoc/-/swagger-jsdoc-6.3.0.tgz",
      "integrity": "sha512-I+iQjVGV3t28pOkQUJv2MncthvOtkEactOn8R76SvSYhxgtIn7FoqfDHwQaN+GBnQdXQLrhgDXseKitmJcHMsA==",
      "license": "MIT",
      "dependencies": {
        "@apidevtools/swagger-parser": "^12.1.0",
        "commander": "6.2.0",
        "doctrine": "3.0.0",
        "glob": "11.1.0",
        "lodash.mergewith": "^4.6.2",
        "yaml": "2.0.0-1"
      },
      "bin": {
        "swagger-jsdoc": "bin/swagger-jsdoc.js"
      },
      "engines": {
        "node": ">=20.0.0"
      }
    },
    "node_modules/swagger-ui-dist": {
      "version": "5.32.6",
      "resolved": "https://registry.npmjs.org/swagger-ui-dist/-/swagger-ui-dist-5.32.6.tgz",
      "integrity": "sha512-75ttZNaYCLoFPnozPZcTUU6mS3wKT8l7WLjU5zJSHFeJa23i5vtnze6IiCl4jDMPeQTXVXIgovq4M11NNfQvSA==",
      "license": "Apache-2.0",
      "dependencies": {
        "@scarf/scarf": "=1.4.0"
      }
    },
    "node_modules/swagger-ui-express": {
      "version": "5.0.1",
      "resolved": "https://registry.npmjs.org/swagger-ui-express/-/swagger-ui-express-5.0.1.tgz",
      "integrity": "sha512-SrNU3RiBGTLLmFU8GIJdOdanJTl4TOmT27tt3bWWHppqYmAZ6IDuEuBvMU6nZq0zLEe6b/1rACXCgLZqO6ZfrA==",
      "license": "MIT",
      "dependencies": {
        "swagger-ui-dist": ">=5.0.0"
      },
      "engines": {
        "node": ">= v0.10.32"
      },
      "peerDependencies": {
        "express": ">=4.0.0 || >=5.0.0-beta"
      }
    },
    "node_modules/to-regex-range": {
      "version": "5.0.1",
      "resolved": "https://registry.npmjs.org/to-regex-range/-/to-regex-range-5.0.1.tgz",
      "integrity": "sha512-65P7iz6X5yEr1cwcgvQxbbIw7Uk3gOy5dIdtZ4rDveLqhrdJP+Li/Hx6tyK0NEb+2GCyneCMJiGqrADCSNk8sQ==",
      "dev": true,
      "license": "MIT",
      "dependencies": {
        "is-number": "^7.0.0"
      },
      "engines": {
        "node": ">=8.0"
      }
    },
    "node_modules/toidentifier": {
      "version": "1.0.1",
      "resolved": "https://registry.npmjs.org/toidentifier/-/toidentifier-1.0.1.tgz",
      "integrity": "sha512-o5sSPKEkg/DIQNmH43V0/uerLrpzVedkUh8tGNvaeXpfpuwjKenlSox/2O/BTlZUtEe+JG7s5YhEz608PlAHRA==",
      "license": "MIT",
      "engines": {
        "node": ">=0.6"
      }
    },
    "node_modules/touch": {
      "version": "3.1.1",
      "resolved": "https://registry.npmjs.org/touch/-/touch-3.1.1.tgz",
      "integrity": "sha512-r0eojU4bI8MnHr8c5bNo7lJDdI2qXlWWJk6a9EAFG7vbhTjElYhBVS3/miuE0uOuoLdb8Mc/rVfsmm6eo5o9GA==",
      "dev": true,
      "license": "ISC",
      "bin": {
        "nodetouch": "bin/nodetouch.js"
      }
    },
    "node_modules/type-is": {
      "version": "2.0.1",
      "resolved": "https://registry.npmjs.org/type-is/-/type-is-2.0.1.tgz",
      "integrity": "sha512-OZs6gsjF4vMp32qrCbiVSkrFmXtG/AZhY3t0iAMrMBiAZyV9oALtXO8hsrHbMXF9x6L3grlFuwW2oAz7cav+Gw==",
      "license": "MIT",
      "dependencies": {
        "content-type": "^1.0.5",
        "media-typer": "^1.1.0",
        "mime-types": "^3.0.0"
      },
      "engines": {
        "node": ">= 0.6"
      }
    },
    "node_modules/typedarray": {
      "version": "0.0.6",
      "resolved": "https://registry.npmjs.org/typedarray/-/typedarray-0.0.6.tgz",
      "integrity": "sha512-/aCDEGatGvZ2BIk+HmLf4ifCJFwvKFNb9/JeZPMulfgFracn9QFcAf5GO8B/mweUjSoblS5In0cWhqpfs/5PQA==",
      "license": "MIT"
    },
    "node_modules/undefsafe": {
      "version": "2.0.5",
      "resolved": "https://registry.npmjs.org/undefsafe/-/undefsafe-2.0.5.tgz",
      "integrity": "sha512-WxONCrssBM8TSPRqN5EmsjVrsv4A8X12J4ArBiiayv3DyyG3ZlIg6yysuuSYdZsVz3TKcTg2fd//Ujd4CHV1iA==",
      "dev": true,
      "license": "MIT"
    },
    "node_modules/undici-types": {
      "version": "7.24.6",
      "resolved": "https://registry.npmjs.org/undici-types/-/undici-types-7.24.6.tgz",
      "integrity": "sha512-WRNW+sJgj5OBN4/0JpHFqtqzhpbnV0GuB+OozA9gCL7a993SmU+1JBZCzLNxYsbMfIeDL+lTsphD5jN5N+n0zg==",
      "license": "MIT",
      "peer": true
    },
    "node_modules/unpipe": {
      "version": "1.0.0",
      "resolved": "https://registry.npmjs.org/unpipe/-/unpipe-1.0.0.tgz",
      "integrity": "sha512-pjy2bYhSsufwWlKwPc+l3cN7+wuJlK6uz0YdJEOlQDbl6jo/YlPi4mb8agUkVC8BF7V8NuzeyPNqRksA3hztKQ==",
      "license": "MIT",
      "engines": {
        "node": ">= 0.8"
      }
    },
    "node_modules/url": {
      "version": "0.11.4",
      "resolved": "https://registry.npmjs.org/url/-/url-0.11.4.tgz",
      "integrity": "sha512-oCwdVC7mTuWiPyjLUz/COz5TLk6wgp0RCsN+wHZ2Ekneac9w8uuV0njcbbie2ME+Vs+d6duwmYuR3HgQXs1fOg==",
      "license": "MIT",
      "dependencies": {
        "punycode": "^1.4.1",
        "qs": "^6.12.3"
      },
      "engines": {
        "node": ">= 0.4"
      }
    },
    "node_modules/url/node_modules/punycode": {
      "version": "1.4.1",
      "resolved": "https://registry.npmjs.org/punycode/-/punycode-1.4.1.tgz",
      "integrity": "sha512-jmYNElW7yvO7TV33CjSmvSiE2yco3bV2czu/OzDKdMNVZQWfxCblURLhf+47syQRBntjfLdd/H0egrzIG+oaFQ==",
      "license": "MIT"
    },
    "node_modules/util-deprecate": {
      "version": "1.0.2",
      "resolved": "https://registry.npmjs.org/util-deprecate/-/util-deprecate-1.0.2.tgz",
      "integrity": "sha512-EPD5q1uXyFxJpCrLnCc1nHnq3gOa6DZBocAIiI2TaSCA7VCJ1UJDMagCzIkXNsUYfD1daK//LTEQ8xiIbrHtcw==",
      "license": "MIT"
    },
    "node_modules/vary": {
      "version": "1.1.2",
      "resolved": "https://registry.npmjs.org/vary/-/vary-1.1.2.tgz",
      "integrity": "sha512-BNGbWLfd0eUPabhkXUVm0j8uuvREyTh5ovRa/dyow/BqAbZJyC+5fU+IzQOzmAKzYqYRAISoRhdQr3eIZ/PXqg==",
      "license": "MIT",
      "engines": {
        "node": ">= 0.8"
      }
    },
    "node_modules/which": {
      "version": "2.0.2",
      "resolved": "https://registry.npmjs.org/which/-/which-2.0.2.tgz",
      "integrity": "sha512-BLI3Tl1TW3Pvl70l3yq3Y64i+awpwXqsGBYWkkqMtnbXgrMD+yj7rhW0kuEDxzJaYXGjEW5ogapKNMEKNMjibA==",
      "license": "ISC",
      "dependencies": {
        "isexe": "^2.0.0"
      },
      "bin": {
        "node-which": "bin/node-which"
      },
      "engines": {
        "node": ">= 8"
      }
    },
    "node_modules/wrappy": {
      "version": "1.0.2",
      "resolved": "https://registry.npmjs.org/wrappy/-/wrappy-1.0.2.tgz",
      "integrity": "sha512-l4Sp/DRseor9wL6EvV2+TuQn63dMkPjZ/sp9XkghTEbV9KlPS1xUsZ3u7/IQO4wxtcFB4bgpQPRcR3QCvezPcQ==",
      "license": "ISC"
    },
    "node_modules/xtend": {
      "version": "4.0.2",
      "resolved": "https://registry.npmjs.org/xtend/-/xtend-4.0.2.tgz",
      "integrity": "sha512-LKYU1iAXJXUgAXn9URjiu+MWhyUXHsvfp7mcuYm9dSUKK0/CjtrUwFAxD82/mCWbtLsGjFIad0wIsod4zrTAEQ==",
      "license": "MIT",
      "engines": {
        "node": ">=0.4"
      }
    },
    "node_modules/yaml": {
      "version": "2.0.0-1",
      "resolved": "https://registry.npmjs.org/yaml/-/yaml-2.0.0-1.tgz",
      "integrity": "sha512-W7h5dEhywMKenDJh2iX/LABkbFnBxasD27oyXWDS/feDsxiw0dD5ncXdYXgkvAsXIY2MpW/ZKkr9IU30DBdMNQ==",
      "license": "ISC",
      "engines": {
        "node": ">= 6"
      }
    }
  }
}

```

## File: package.json

```json
{
  "name": "server",
  "version": "1.0.0",
  "main": "index.js",
  "scripts": {
    "test": "echo \"Error: no test specified\" && exit 1",
    "start": "node server.js",
    "dev": "nodemon server.js"
  },
  "author": "",
  "license": "ISC",
  "description": "",
  "dependencies": {
    "bcryptjs": "^3.0.3",
    "cors": "^2.8.5",
    "dotenv": "^16.5.0",
    "express": "^5.1.0",
    "express-async-handler": "^1.2.0",
    "jsonwebtoken": "^9.0.2",
    "multer": "^2.0.1",
    "mysql2": "^3.14.1",
    "nodemailer": "^7.0.3",
    "razorpay": "^2.9.6",
    "swagger-jsdoc": "^6.3.0",
    "swagger-ui-express": "^5.0.1",
    "url": "^0.11.4"
  },
  "devDependencies": {
    "nodemon": "^3.1.10"
  }
}

```

## File: routes/cartRoute.js

```javascript
const express = require('express');
const {
  addToCart,
  getCart,
  updateCartItem,
  removeFromCart
} = require('../controllers/cartController');
const { authMiddleware } = require('../middleware/authMiddleware');

const router = express.Router();

/**
 * @swagger
 * /api/cart:
 *   post:
 *     summary: Add item to cart
 *     tags: [Cart]
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
 *         description: Item added to cart
 *   get:
 *     summary: Get cart items
 *     tags: [Cart]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of cart items
 */
router.post('/', authMiddleware, addToCart);
router.get('/', authMiddleware, getCart);

/**
 * @swagger
 * /api/cart/{id}:
 *   put:
 *     summary: Update cart item quantity
 *     tags: [Cart]
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
 *               quantity:
 *                 type: integer
 *     responses:
 *       200:
 *         description: Item updated
 *   delete:
 *     summary: Remove item from cart
 *     tags: [Cart]
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
 *         description: Item removed from cart
 */
router.put('/:id', authMiddleware, updateCartItem);
router.delete('/:id', authMiddleware, removeFromCart);

module.exports = router;
```

## File: routes/categoryRoute.js

```javascript
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

```

## File: routes/dashboardRoute.js

```javascript
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

```

## File: routes/exchangeRoute.js

```javascript
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

```

## File: routes/notificationRoute.js

```javascript
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

```

## File: routes/problemRoute.js

```javascript
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
```

## File: routes/solutionRoute.js

```javascript

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

```

## File: routes/toolsRoute.js

```javascript
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

```

## File: routes/userRoutes.js

```javascript
const express = require('express');
const {
  registerUser,
  loginUser,
  deleteUser,
  forgotPassword,
  resetPassword,
  updateUser,
  getUserById,
  getUserProfile,
  addReview
} = require('../controllers/userController');
const { authMiddleware } = require('../middleware/authMiddleware');

const router = express.Router();

/**
 * @swagger
 * /api/users:
 *   post:
 *     summary: Register a new user
 *     tags: [Users]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               email:
 *                 type: string
 *               password:
 *                 type: string
 *     responses:
 *       201:
 *         description: User registered successfully
 *       400:
 *         description: Validation error
 */
router.post('/', registerUser);

/**
 * @swagger
 * /api/users/login:
 *   post:
 *     summary: Login user
 *     tags: [Users]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               email:
 *                 type: string
 *               password:
 *                 type: string
 *     responses:
 *       200:
 *         description: Login successful
 *       401:
 *         description: Invalid credentials
 */
router.post('/login', loginUser);

/**
 * @swagger
 * /api/users/forgot-password:
 *   post:
 *     summary: Request password reset
 *     tags: [Users]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               email:
 *                 type: string
 *     responses:
 *       200:
 *         description: Reset email sent
 *       404:
 *         description: User not found
 */
router.post('/forgot-password', forgotPassword);

/**
 * @swagger
 * /api/users/reset-password/{token}:
 *   post:
 *     summary: Reset password with token
 *     tags: [Users]
 *     parameters:
 *       - in: path
 *         name: token
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               password:
 *                 type: string
 *     responses:
 *       200:
 *         description: Password reset successfully
 *       400:
 *         description: Invalid or expired token
 */
router.post('/reset-password/:token', resetPassword);

// Authenticated routes
router.use(authMiddleware);

/**
 * @swagger
 * /api/users/me:
 *   get:
 *     summary: Get current user's profile
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Current user profile
 *       401:
 *         description: Unauthorized
 */
router.get('/me', getUserById);

/**
 * @swagger
 * /api/users/{id}:
 *   get:
 *     summary: Get user profile by ID
 *     tags: [Users]
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
 *         description: User profile
 *       404:
 *         description: User not found
 *   put:
 *     summary: Update user profile
 *     tags: [Users]
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
 *               name:
 *                 type: string
 *               bio:
 *                 type: string
 *               skills:
 *                 type: array
 *     responses:
 *       200:
 *         description: Profile updated successfully
 *       404:
 *         description: User not found
 */
router.get('/:id', getUserProfile);
router.put('/:id', updateUser);

/**
 * @swagger
 * /api/users:
 *   delete:
 *     summary: Delete user account
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: User deleted successfully
 *       401:
 *         description: Unauthorized
 */
router.delete('/', deleteUser);

/**
 * @swagger
 * /api/users/{id}/reviews:
 *   post:
 *     summary: Add review to a user
 *     tags: [Users]
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
 *               rating:
 *                 type: number
 *               comment:
 *                 type: string
 *     responses:
 *       201:
 *         description: Review added successfully
 *       404:
 *         description: User not found
 */
router.post('/:id/reviews', addReview);

module.exports = router;
```

## File: schema.sql

```sql
CREATE DATABASE IF NOT EXISTS tools_api CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE tools_api;

CREATE TABLE IF NOT EXISTS users (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) NOT NULL,
  password VARCHAR(255) NOT NULL,
  bio VARCHAR(500) DEFAULT '',
  skills JSON DEFAULT (JSON_ARRAY()),
  experience INT UNSIGNED NOT NULL DEFAULT 0,
  organization VARCHAR(255) DEFAULT '',
  industry VARCHAR(255) DEFAULT '',
  wallet_coins DECIMAL(12,2) NOT NULL DEFAULT 0,
  wallet_money DECIMAL(12,2) NOT NULL DEFAULT 0,
  solved_problems JSON DEFAULT (JSON_ARRAY()),
  created_problems JSON DEFAULT (JSON_ARRAY()),
  submitted_solutions JSON DEFAULT (JSON_ARRAY()),
  stats_problems_created INT UNSIGNED NOT NULL DEFAULT 0,
  stats_problems_solved INT UNSIGNED NOT NULL DEFAULT 0,
  stats_success_rate DECIMAL(5,2) NOT NULL DEFAULT 0,
  rating DECIMAL(3,2) NOT NULL DEFAULT 0,
  reviews JSON DEFAULT (JSON_ARRAY()),
  profile_pic VARCHAR(500) NOT NULL DEFAULT 'default-profile.jpg',
  reset_token VARCHAR(255) NULL,
  reset_token_expiry DATETIME NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  last_active DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY users_email_unique (email),
  KEY users_reset_token_idx (reset_token)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS tools (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  name VARCHAR(255) NULL,
  description TEXT NULL,
  price DECIMAL(12,2) NULL,
  photo VARCHAR(1000) NULL,
  quantity INT UNSIGNED NOT NULL DEFAULT 1,
  status ENUM('available', 'pending_exchange', 'sold') NOT NULL DEFAULT 'available',
  owner_id BIGINT UNSIGNED NULL,
  buyer_id BIGINT UNSIGNED NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY tools_owner_idx (owner_id),
  KEY tools_buyer_idx (buyer_id),
  KEY tools_status_idx (status),
  CONSTRAINT tools_owner_fk FOREIGN KEY (owner_id) REFERENCES users(id) ON DELETE SET NULL,
  CONSTRAINT tools_buyer_fk FOREIGN KEY (buyer_id) REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS problems (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  title VARCHAR(100) NOT NULL,
  description TEXT NOT NULL,
  created_by BIGINT UNSIGNED NOT NULL,
  reward_type ENUM('money', 'coins') NOT NULL,
  reward_amount DECIMAL(12,2) NOT NULL,
  deadline DATETIME NULL,
  tags JSON DEFAULT (JSON_ARRAY()),
  selected_solution_id BIGINT UNSIGNED NULL,
  status ENUM('open', 'in-progress', 'completed', 'paid', 'closed') NOT NULL DEFAULT 'open',
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY problems_created_by_idx (created_by),
  KEY problems_status_idx (status),
  KEY problems_reward_type_idx (reward_type),
  KEY problems_selected_solution_idx (selected_solution_id),
  CONSTRAINT problems_created_by_fk FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS solutions (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  problem_id BIGINT UNSIGNED NOT NULL,
  solver_id BIGINT UNSIGNED NOT NULL,
  description TEXT NOT NULL,
  status ENUM('submitted', 'selected', 'rejected', 'paid') NOT NULL DEFAULT 'submitted',
  submitted_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  attachments JSON DEFAULT (JSON_ARRAY()),
  PRIMARY KEY (id),
  UNIQUE KEY solutions_problem_solver_unique (problem_id, solver_id),
  KEY solutions_problem_idx (problem_id),
  KEY solutions_solver_idx (solver_id),
  KEY solutions_status_idx (status),
  CONSTRAINT solutions_problem_fk FOREIGN KEY (problem_id) REFERENCES problems(id) ON DELETE CASCADE,
  CONSTRAINT solutions_solver_fk FOREIGN KEY (solver_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB;

SET @problems_selected_solution_fk_exists = (
  SELECT COUNT(*)
  FROM information_schema.TABLE_CONSTRAINTS
  WHERE CONSTRAINT_SCHEMA = DATABASE()
    AND TABLE_NAME = 'problems'
    AND CONSTRAINT_NAME = 'problems_selected_solution_fk'
);
SET @problems_selected_solution_fk_sql = IF(
  @problems_selected_solution_fk_exists = 0,
  'ALTER TABLE problems ADD CONSTRAINT problems_selected_solution_fk FOREIGN KEY (selected_solution_id) REFERENCES solutions(id) ON DELETE SET NULL',
  'SELECT 1'
);
PREPARE problems_selected_solution_fk_stmt FROM @problems_selected_solution_fk_sql;
EXECUTE problems_selected_solution_fk_stmt;
DEALLOCATE PREPARE problems_selected_solution_fk_stmt;

CREATE TABLE IF NOT EXISTS cart_items (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  user_id BIGINT UNSIGNED NOT NULL,
  tool_id BIGINT UNSIGNED NOT NULL,
  quantity INT UNSIGNED NOT NULL DEFAULT 1,
  added_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY cart_items_user_tool_unique (user_id, tool_id),
  KEY cart_items_user_idx (user_id),
  KEY cart_items_tool_idx (tool_id),
  CONSTRAINT cart_items_user_fk FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  CONSTRAINT cart_items_tool_fk FOREIGN KEY (tool_id) REFERENCES tools(id) ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS exchange_requests (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  requester_id BIGINT UNSIGNED NOT NULL,
  receiver_id BIGINT UNSIGNED NOT NULL,
  tools_requested_id BIGINT UNSIGNED NOT NULL,
  tools_offered_id BIGINT UNSIGNED NOT NULL,
  status ENUM('pending', 'accepted', 'rejected', 'completed') NOT NULL DEFAULT 'pending',
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY exchange_requester_idx (requester_id),
  KEY exchange_receiver_idx (receiver_id),
  KEY exchange_requested_tool_idx (tools_requested_id),
  KEY exchange_offered_tool_idx (tools_offered_id),
  KEY exchange_status_idx (status),
  CONSTRAINT exchange_requester_fk FOREIGN KEY (requester_id) REFERENCES users(id) ON DELETE CASCADE,
  CONSTRAINT exchange_receiver_fk FOREIGN KEY (receiver_id) REFERENCES users(id) ON DELETE CASCADE,
  CONSTRAINT exchange_requested_tool_fk FOREIGN KEY (tools_requested_id) REFERENCES tools(id) ON DELETE CASCADE,
  CONSTRAINT exchange_offered_tool_fk FOREIGN KEY (tools_offered_id) REFERENCES tools(id) ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS notifications (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  user_id BIGINT UNSIGNED NOT NULL,
  title VARCHAR(255) NOT NULL,
  message TEXT NOT NULL,
  type ENUM('TOOL_ADDED', 'EXCHANGE_REQUEST', 'EXCHANGE_UPDATE', 'ORDER_RECEIVED', 'ORDER_CREATED', 'OTHER') NOT NULL,
  related_entity_id BIGINT UNSIGNED NULL,
  related_entity_model ENUM('Tool', 'Exchange', 'ExchangeRequest', 'Order') NULL,
  is_read TINYINT(1) NOT NULL DEFAULT 0,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY notifications_user_idx (user_id),
  KEY notifications_read_idx (is_read),
  KEY notifications_created_at_idx (created_at),
  CONSTRAINT notifications_user_fk FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS mobile_covers (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  company VARCHAR(255) NOT NULL,
  model VARCHAR(255) NOT NULL,
  category VARCHAR(255) NOT NULL,
  image_url VARCHAR(1000) NOT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY mobile_covers_filter_idx (company, model, category)
) ENGINE=InnoDB;

```

## File: scripts/generate_documentation.js

```javascript
const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');
const outFile = path.join(root, 'PROJECT_DOCUMENTATION.md');
const ignoreNames = new Set(['node_modules', '.git', 'uploads', 'dist']);

function isBinaryFileSync(filePath) {
  const textChars = "\n\r\t\0";
  try {
    const buffer = fs.readFileSync(filePath);
    for (let i = 0; i < buffer.length; i++) {
      const char = buffer[i];
      if (char === 0) return true;
    }
    return false;
  } catch (e) {
    return true;
  }
}

function walk(dir) {
  let results = [];
  const list = fs.readdirSync(dir);
  list.forEach(function(file) {
    if (ignoreNames.has(file)) return;
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    if (stat && stat.isDirectory()) {
      results = results.concat(walk(filePath));
    } else {
      results.push(filePath);
    }
  });
  return results;
}

function languageFromExt(name) {
  const ext = path.extname(name).toLowerCase();
  if (!ext) return '';
  const map = {
    '.js': 'javascript',
    '.json': 'json',
    '.md': 'markdown',
    '.sql': 'sql',
    '.css': 'css',
    '.html': 'html',
    '.yml': 'yaml',
    '.yaml': 'yaml'
  };
  return map[ext] || '';
}

function generate() {
  const files = walk(root).filter(p => !p.includes('PROJECT_DOCUMENTATION.md'));
  const relFiles = files.map(p => path.relative(root, p)).sort();

  let md = `# Project Documentation: ${path.basename(root)}\n\n`;
  md += `Generated on: ${new Date().toISOString()}\n\n`;

  md += '## File Index\n\n';
  relFiles.forEach(f => {
    md += `- ${f}\n`;
  });
  md += '\n---\n\n';

  for (const rel of relFiles) {
    const abs = path.join(root, rel);
    md += `## File: ${rel}\n\n`;
    try {
      if (isBinaryFileSync(abs)) {
        md += '_Binary or unreadable file not included._\n\n';
        continue;
      }
      const content = fs.readFileSync(abs, 'utf8');
      const lang = languageFromExt(rel);
      md += '```' + lang + '\n';
      md += content.replace(/```/g, '\`\`\`');
      md += '\n```\n\n';
    } catch (err) {
      md += `_Error reading file: ${err.message}_\n\n`;
    }
  }

  fs.writeFileSync(outFile, md, 'utf8');
  console.log('Wrote', outFile);
}

generate();

```

## File: server.js

```javascript
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const swaggerUi = require('swagger-ui-express');
const swaggerSpec = require('./config/swagger');

// Routes
const userRoutes = require('./routes/userRoutes');
const toolsRoute = require('./routes/toolsRoute');
const notificationRoute = require('./routes/notificationRoute');
const dashboardRoute = require('./routes/dashboardRoute');
const exchangeRoute = require('./routes/exchangeRoute');
const cartRoute = require('./routes/cartRoute');
const problemRoute = require('./routes/problemRoute');
const solutionRoute = require('./routes/solutionRoute');


// Middleware
const upload = require('./middleware/upload');
const { connectDB } = require('./config/db');
connectDB();
const app = express();

// === Middleware ===
app.use(express.json()); // Parses application/json
app.use(express.urlencoded({ extended: true })); // Parses x-www-form-urlencoded
app.use(cors());

// === Swagger Documentation ===
app.get('/swagger.json', (req, res) => {
  res.setHeader('Content-Type', 'application/json');
  res.send(swaggerSpec);
});

app.use('/api-docs', swaggerUi.serve);
app.get('/api-docs', swaggerUi.setup(swaggerSpec, {
  swaggerOptions: {
    persistAuthorization: true
  }
}));

// === Ensure Uploads Directory Exists ===
const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir);
}

// === File Upload Route ===
app.post('/api/upload', upload.single('file'), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ message: 'No file uploaded' });
  }

  const fileUrl = `${req.protocol}://${req.get('host')}/api/get-image/${req.file.filename}`;
  res.status(200).json({ message: 'File uploaded successfully', fileUrl });
});

// === Static File Serving ===
app.use('/api/get-image', express.static(uploadsDir));

// === API Routes ===
app.use('/api/users', userRoutes);
app.use('/api/tools', toolsRoute);
app.use('/api/exchange', exchangeRoute);
app.use('/api/notifications', notificationRoute);
app.use('/api/dashboard', dashboardRoute);
app.use('/api/cart', cartRoute);
app.use('/api/problem', problemRoute);
app.use('/api/solution', solutionRoute);

// === Root Route ===
app.get("/",(req,res)=>{
  res.send(`<html>
    <h1 style="text-align:center;color:green">Server is Running at port 4000</h1>
    <p style="text-align:center"><a href="/api-docs">View API Documentation</a></p>
    </html>`)
})
// === Global Error Handler ===
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Something went wrong!' });
});

// === Start Server ===
const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

```

## File: utils/getToolsWithCartStatus.js

```javascript
const Cart = require('../models/Cart');
const getToolsWithCartStatus = async (tools, userId) => {
  if (!userId) {
    return tools.map(tool => ({
      ...tool.toObject(),
      inCart: false,
      cartItemId: null
    }));
  }

  const cartItems = await Cart.find({ user: userId }).select('tool _id');
  const cartMap = new Map(cartItems.map(item => [item.tool.toString(), item._id.toString()]));

  return tools.map(tool => ({
    ...tool.toObject(),
    inCart: cartMap.has(tool._id.toString()),
    cartItemId: cartMap.get(tool._id.toString()) || null
  }));
};



module.exports = getToolsWithCartStatus;

```

## File: utils/validators.js

```javascript
exports.validateMobileCoverData = (data) => {
  const errors = [];

  if (!data.company) errors.push('Company is required');
  if (!data.model) errors.push('Model is required');
  if (!data.category) errors.push('Category is required');
  if (!Array.isArray(data.imageUrls) || data.imageUrls.length === 0) {
    errors.push('At least one image URL is required');
  }

  return {
    valid: errors.length === 0,
    errors
  };
};

```

