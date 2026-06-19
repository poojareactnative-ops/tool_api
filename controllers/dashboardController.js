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

