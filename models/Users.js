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
