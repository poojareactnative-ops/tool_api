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
