const { BaseModel } = require('./BaseModel');

class Tools extends BaseModel {
  static get table() {
    return 'tools';
  }

  static get columns() {
    return {
      name: 'name',
      description: 'description',
      price: 'price',
      photo: 'photo',
      quantity: 'quantity',
      status: 'status',
      owner: 'owner_id',
      buyer: 'buyer_id',
      createdAt: 'created_at',
      updatedAt: 'updated_at'
    };
  }

  static get refFields() {
    return {
      owner: 'User',
      buyer: 'User'
    };
  }

  static get dateFields() {
    return ['createdAt', 'updatedAt'];
  }

  static get defaults() {
    return {
      quantity: 1,
      status: 'available',
      buyer: null,
      createdAt: () => new Date(),
      updatedAt: () => new Date()
    };
  }

  static async beforeSave(tool) {
    if (tool.quantity === undefined || tool.quantity === null) tool.quantity = 1;
    if (tool.quantity < 0) throw new Error('Quantity cannot be negative');
    tool.updatedAt = new Date();
  }
}

module.exports = Tools;
