const { BaseModel } = require('./BaseModel');

class Cart extends BaseModel {
  static get table() {
    return 'cart_items';
  }

  static get columns() {
    return {
      user: 'user_id',
      tool: 'tool_id',
      quantity: 'quantity',
      addedAt: 'added_at'
    };
  }

  static get refFields() {
    return {
      user: 'User',
      tool: 'Tools'
    };
  }

  static get dateFields() {
    return ['addedAt'];
  }

  static get defaults() {
    return {
      quantity: 1,
      addedAt: () => new Date()
    };
  }

  static async beforeSave(cartItem) {
    if (!cartItem.quantity) cartItem.quantity = 1;
    if (cartItem.quantity < 1) throw new Error('Quantity must be at least 1');
  }
}

module.exports = Cart;
