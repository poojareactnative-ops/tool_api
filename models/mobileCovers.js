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
