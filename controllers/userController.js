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
