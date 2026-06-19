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
