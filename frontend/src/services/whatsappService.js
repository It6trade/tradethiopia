import axiosInstance from './axiosInstance';

/**
 * Verifies and saves WhatsApp credentials on the backend.
 * @param {object} payload - { phoneNumberId, whatsappBusinessAccountId, accessToken, employeeFullName }
 */
export const verifyWhatsAppConnection = async (payload) => {
  const response = await axiosInstance.post('/whatsapp/verify-connection', payload);
  return response.data;
};

/**
 * Sends a WhatsApp broadcast message or template.
 * @param {object} payload - { recipientPhone, messageText, templateName, templateLanguage }
 */
export const sendWhatsAppBroadcast = async (payload) => {
  const response = await axiosInstance.post('/whatsapp/send', payload);
  return response.data;
};
