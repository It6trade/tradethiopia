import axios from './axiosInstance';

export const listChatUsers = async (search = '') => {
  const response = await axios.get('/chat/users', {
    params: search ? { search } : undefined,
  });
  return response.data;
};

export const listConversations = async () => {
  const response = await axios.get('/chat/conversations');
  return response.data;
};

export const createDirectConversation = async (participantId) => {
  const response = await axios.post('/chat/conversations/direct', { participantId });
  return response.data;
};

export const createGroupConversation = async (payload) => {
  const response = await axios.post('/chat/conversations/group', payload);
  return response.data;
};

export const listConversationMessages = async (conversationId, before, limit) => {
  const response = await axios.get(`/chat/conversations/${conversationId}/messages`, {
    params: {
      ...(before ? { before } : {}),
      ...(limit ? { limit } : {}),
    },
  });
  return response.data;
};

export const sendConversationMessage = async (conversationId, payload) => {
  const response = await axios.post(`/chat/conversations/${conversationId}/messages`, payload);
  return response.data;
};

export const updateConversationMessage = async (conversationId, messageId, payload) => {
  const response = await axios.patch(`/chat/conversations/${conversationId}/messages/${messageId}`, payload);
  return response.data;
};

export const deleteConversationMessage = async (conversationId, messageId) => {
  const response = await axios.delete(`/chat/conversations/${conversationId}/messages/${messageId}`);
  return response.data;
};

export const uploadConversationAttachments = async (conversationId, files) => {
  const formData = new FormData();
  files.forEach((file) => formData.append('files', file));

  const response = await axios.post(`/chat/conversations/${conversationId}/attachments`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return response.data;
};

export const markConversationRead = async (conversationId, messageId) => {
  const response = await axios.post(`/chat/conversations/${conversationId}/read`, { messageId });
  return response.data;
};
