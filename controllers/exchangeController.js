// // controllers/exchangeController.js
const ExchangeRequest = require('../models/ExchangeRequest');
const Notification = require('../models/Notification');
const Tools = require('../models/Tools');


exports.createExchangeRequest = async (req, res) => {
  try {
    const { toolsRequestedId, toolsOfferedId } = req.body;

    const toolsRequested = await Tools.findById(toolsRequestedId);
    const toolsOffered = await Tools.findById(toolsOfferedId);

    if (!toolsRequested || !toolsOffered) {
      return res.status(404).json({ error: 'One or both tools not found' });
    }

    if (toolsRequested.owner.equals(req.user._id)) {
      return res.status(400).json({ error: 'Cannot request exchange with your own tool' });
    }

    const exchange = await ExchangeRequest.create({
      requester: req.user._id,
      receiver: toolsRequested.owner,
      toolsRequested,
      toolsOffered,
    });

    const notification = new Notification({
      user: toolsRequested.owner,
      title: 'Exchange Request',
      message: `${req.user.name} wants to exchange tools with you`,
      type: 'EXCHANGE_REQUEST',
      relatedEntity: exchange._id,
      relatedEntityModel: 'Exchange'
    });

    await notification.save();

    // Change tool statuses
    await Tools.findByIdAndUpdate(toolsRequestedId, { status: 'pending_exchange' });
    await Tools.findByIdAndUpdate(toolsOfferedId, { status: 'pending_exchange' });

    // 🔔 Send notification
    // await sendNotification(
    //   toolsRequested.owner,
    //   'Exchange Request',
    //   `User ${req.user.name} wants to exchange a tool with you.`
    // );

    res.status(201).json({ message: 'Exchange request sent', exchange });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.getExchangeList = async (req, res) => {
  try {
    const userId = req.user._id;

    const exchanges = await ExchangeRequest.find({
      $or: [
        { requester: userId },
        { receiver: userId }
      ]
    })
      .populate('requester', 'name email')
      .populate('receiver', 'name email')
      .populate('toolsRequested', 'name photo description status') // Only include necessary fields
      .populate('toolsOffered', 'name photo description status')  // Only include necessary fields
      .sort({ createdAt: -1 });

    // Format the response to clearly show which exchanges are incoming vs outgoing
    const formattedExchanges = exchanges.map(exchange => {
      const isRequester = exchange.requester._id.equals(userId);
      return {
        ...exchange.toObject(),
        type: isRequester ? 'outgoing' : 'incoming',
        otherParty: isRequester ? exchange.receiver : exchange.requester
      };
    });

    res.json({
      success: true,
      count: exchanges.length,
      exchanges: formattedExchanges
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      error: 'Failed to fetch exchanges',
      message: err.message
    });
  }
};

exports.updateExchangeStatus = async (req, res) => {
  try {
    const id = req.params.id ; // Fallback to static ID if needed
    const { status } = req.body;

    // Verify exchange exists
    const existingExchange = await ExchangeRequest.findById(id).populate('requester receiver toolsRequested toolsOffered');
    if (!existingExchange) {
      return res.status(404).json({
        success: false,
        error: 'Exchange not found',
        details: `No exchange found with ID: ${id}`
      });
    }

    // Update exchange status
    const exchange = await ExchangeRequest.findByIdAndUpdate(
      id,
      { status, updatedAt: Date.now() },
      { new: true }
    );
    await exchange.populate('requester receiver toolsRequested toolsOffered');

    // Create and save notifications
    const notifications = new Notification({
      user: req.user._id,
      title: 'Update Exchange Tools Status',
      message: `${req.user.name} has placed an order for your tool status: ${status}`,
      type: 'OTHER',
      relatedEntity: id,
      relatedEntityModel: 'Order'
    });

    await notifications.save();
    // Handle completed exchange
    if (status === 'completed') {
      await Promise.all([
        Tools.findByIdAndUpdate(exchange.toolsRequested._id, {
          owner: exchange.receiver._id,
          status: 'available'
        }),
        Tools.findByIdAndUpdate(exchange.toolsOffered._id, {
          owner: exchange.requester._id,
          status: 'available'
        })
      ]);
    }

    res.json({
      success: true,
      exchange,
      notifications: 1
    });

  } catch (error) {
    console.error('Error in updateExchangeStatus:', error);
    res.status(500).json({
      success: false,
      error: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
};

// Updated notification service
async function createExchangeNotifications(exchange, status) {
  const notificationsToCreate = [];

  switch (status) {
    case 'pending':
      notificationsToCreate.push({
        user: exchange.receiver._id,
        title: 'New Exchange Request',
        message: `${exchange.requester.name} wants to exchange ${exchange.toolsOffered.name} for your ${exchange.toolsRequested.name}`,
        type: 'EXCHANGE_REQUEST',
        relatedEntity: exchange._id,
        relatedEntityModel: 'ExchangeRequest'
      });
      break;

    case 'accepted':
      notificationsToCreate.push({
        user: exchange.requester._id,
        title: 'Exchange Accepted',
        message: `${exchange.receiver.name} accepted your exchange request`,
        type: 'EXCHANGE_UPDATE',
        relatedEntity: exchange._id,
        relatedEntityModel: 'ExchangeRequest'
      });
      break;

    case 'completed':
      notificationsToCreate.push(
        {
          user: exchange.requester._id,
          title: 'Exchange Completed',
          message: `Your exchange of ${exchange.toolsOffered.name} for ${exchange.toolsRequested.name} is complete`,
          type: 'EXCHANGE_UPDATE',
          relatedEntity: exchange._id,
          relatedEntityModel: 'ExchangeRequest'
        },
        {
          user: exchange.receiver._id,
          title: 'Exchange Completed',
          message: `Your exchange of ${exchange.toolsRequested.name} for ${exchange.toolsOffered.name} is complete`,
          type: 'EXCHANGE_UPDATE',
          relatedEntity: exchange._id,
          relatedEntityModel: 'ExchangeRequest'
        }
      );
      break;
  }

  // Save all notifications to database
  if (notificationsToCreate.length > 0) {
    return await Notification.insertMany(notificationsToCreate);
  }

  return [];
}
