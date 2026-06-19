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
