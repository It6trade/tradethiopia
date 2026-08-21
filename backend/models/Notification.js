const mongoose = require("mongoose");

const NotificationSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  text: { type: String, required: true },
  read: { type: Boolean, default: false },
  type: { type: String, default: 'general' },
  category: { type: String, default: 'general' },
  documentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Document' },
  taskId: { type: mongoose.Schema.Types.ObjectId, ref: 'Task' },
  itTaskId: { type: mongoose.Schema.Types.ObjectId, ref: 'ITTask' },
  commentId: { type: mongoose.Schema.Types.ObjectId },
  link: { type: String, default: '' },
  metadata: { type: mongoose.Schema.Types.Mixed },
  targetId: { type: mongoose.Schema.Types.ObjectId },
  createdAt: { type: Date, default: Date.now },
});

const Notification = mongoose.model("Notification", NotificationSchema);

module.exports = Notification;
