const axios = require('axios');

/**
 * Sends a WhatsApp message (text or template) using the WhatsApp Cloud API.
 * @param {string} phoneNumberId - The WhatsApp Phone Number ID.
 * @param {string} accessToken - The Meta Access Token.
 * @param {string} toPhone - The recipient's phone number with country code (e.g. '251911123456').
 * @param {object} messagePayload - The custom payload (text or template configuration).
 * @returns {Promise<object>} The WhatsApp API response.
 */
const sendWhatsAppMessage = async (phoneNumberId, accessToken, toPhone, messagePayload) => {
  try {
    const res = await axios.post(
      `https://graph.facebook.com/v18.0/${phoneNumberId}/messages`,
      {
        messaging_product: 'whatsapp',
        to: toPhone.trim().replace('+', ''), // Strip + sign if present
        ...messagePayload,
      },
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
      }
    );
    return res.data;
  } catch (error) {
    const details = error.response?.data?.error?.message || error.message;
    throw new Error(`WhatsApp API delivery failed: ${details}`);
  }
};

/**
 * Verifies if WhatsApp credentials are correct.
 * @param {string} phoneNumberId - The WhatsApp Phone Number ID.
 * @param {string} accessToken - The Meta Access Token.
 * @returns {Promise<boolean>} True on success, or throws an error.
 */
const verifyWhatsAppCredentials = async (phoneNumberId, accessToken) => {
  try {
    // Make a lightweight query to verify the ID is valid
    const res = await axios.get(`https://graph.facebook.com/v18.0/${phoneNumberId}`, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });
    return !!res.data.id;
  } catch (error) {
    const details = error.response?.data?.error?.message || error.message;
    throw new Error(`WhatsApp verification failed: ${details}`);
  }
};

module.exports = {
  sendWhatsAppMessage,
  verifyWhatsAppCredentials,
};
