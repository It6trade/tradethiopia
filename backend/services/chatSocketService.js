let ioInstance = null;

const getConversationRoom = (conversationId) => `conversation:${conversationId}`;
const getUserRoom = (userId) => `user:${userId}`;

const setSocketServer = (io) => {
  ioInstance = io;
};

const emitToConversation = (conversationId, eventName, payload) => {
  if (!ioInstance) return;
  ioInstance.to(getConversationRoom(conversationId)).emit(eventName, payload);
};

const emitToUsers = (userIds = [], eventName, payload) => {
  if (!ioInstance) return;
  [...new Set((userIds || []).map((id) => String(id)).filter(Boolean))].forEach((userId) => {
    ioInstance.to(getUserRoom(userId)).emit(eventName, payload);
  });
};

module.exports = {
  emitToConversation,
  emitToUsers,
  getConversationRoom,
  getUserRoom,
  setSocketServer,
};
