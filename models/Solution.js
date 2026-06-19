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
