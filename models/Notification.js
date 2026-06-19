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
