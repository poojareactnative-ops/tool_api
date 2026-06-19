const Notification = require('../models/Notification');

exports.getNotifications = async (req, res) => {
  // req.user = { _id: '6843e5e4180cac61ccdf77ec' };
  try {
    const notifications = await Notification.find({ user: req.user._id }).sort({ createdAt: -1 });
    res.json({ notifications });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
exports.markRead = async (req, res) => {
  try {
    const { id } = req.params;
    const notification = await Notification.findOneAndUpdate(
      { _id: id, user: req.user._id },
      { read: true },
      { new: true }
    );

    if (!notification) return res.status(404).json({ error: 'Notification not found' });

    res.json({ message: 'Marked as read', notification });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.deleteMultipleNotifications = async (req, res) => {
  try {
    const { ids } = req.body;

    if (!Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({ error: 'No notification IDs provided' });
    }

    await Notification.deleteMany({
      _id: { $in: ids },
      user: req.user._id,
    });

    res.json({ message: 'Selected notifications deleted successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
exports.deleteAllNotifications = async (req, res) => {
  try {
    await Notification.deleteMany({ user: req.user._id });
    console.log("noti res : ", res)
    res.json({ message: 'All notifications deleted successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
exports.deleteNotification = async (req, res) => {
  try {
    const { id } = req.params;

    const notification = await Notification.findOneAndDelete({
      _id: id,
      user: req.user._id,
    });

    if (!notification) {
      return res.status(404).json({ error: 'Notification not found' });
    }

    res.json({ message: 'Notification deleted successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};


