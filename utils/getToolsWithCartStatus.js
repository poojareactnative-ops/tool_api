const Cart = require('../models/Cart');
const getToolsWithCartStatus = async (tools, userId) => {
  if (!userId) {
    return tools.map(tool => ({
      ...tool.toObject(),
      inCart: false,
      cartItemId: null
    }));
  }

  const cartItems = await Cart.find({ user: userId }).select('tool _id');
  const cartMap = new Map(cartItems.map(item => [item.tool.toString(), item._id.toString()]));

  return tools.map(tool => ({
    ...tool.toObject(),
    inCart: cartMap.has(tool._id.toString()),
    cartItemId: cartMap.get(tool._id.toString()) || null
  }));
};



module.exports = getToolsWithCartStatus;
