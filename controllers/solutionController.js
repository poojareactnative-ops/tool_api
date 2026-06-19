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
