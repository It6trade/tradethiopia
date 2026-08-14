const SocialAccountCredential = require('../models/SocialAccountCredential');
const whatsappService = require('../services/whatsappService');

/**
 * Verifies a WhatsApp Business Cloud API setup and links it.
 */
const verifyConnection = async (req, res) => {
  const { phoneNumberId, whatsappBusinessAccountId, accessToken, employeeFullName } = req.body;

  if (!phoneNumberId || !whatsappBusinessAccountId || !accessToken || !employeeFullName) {
    return res.status(400).json({
      success: false,
      message: 'Phone Number ID, WhatsApp Business Account ID, Access Token, and Manager Name are required.',
    });
  }

  try {
    // 1. Verify credentials with Meta API
    await whatsappService.verifyWhatsAppCredentials(phoneNumberId.trim(), accessToken.trim());

    // 2. Save or update the WhatsApp credential in database
    const payload = {
      platform: 'WhatsApp',
      employeeFullName: employeeFullName.trim(),
      accountName: `WhatsApp (${phoneNumberId.trim().slice(-4)})`,
      whatsappPhoneNumberId: phoneNumberId.trim(),
      whatsappBusinessAccountId: whatsappBusinessAccountId.trim(),
      accessToken: accessToken.trim(),
      isConnected: true,
      active: true,
    };

    // Upsert so there is only one active WhatsApp API connection saved
    const doc = await SocialAccountCredential.findOneAndUpdate(
      { platform: 'WhatsApp' },
      { $set: payload },
      { new: true, upsert: true, runValidators: true }
    );

    res.json({
      success: true,
      message: 'WhatsApp Business API verified and linked successfully!',
      credential: doc,
    });
  } catch (error) {
    console.error('WhatsApp Verification Controller Error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'WhatsApp credentials verification failed.',
    });
  }
};

/**
 * Sends a WhatsApp notification / broadcast.
 */
const sendMessage = async (req, res) => {
  const { recipientPhone, messageText, templateName, templateLanguage } = req.body;

  if (!recipientPhone) {
    return res.status(400).json({ success: false, message: 'Recipient phone number is required.' });
  }

  try {
    // 1. Lookup connected WhatsApp credential
    const credential = await SocialAccountCredential.findOne({
      platform: 'WhatsApp',
      isConnected: true,
      active: true,
    });

    if (!credential || !credential.whatsappPhoneNumberId || !credential.accessToken) {
      return res.status(400).json({
        success: false,
        message: 'No active WhatsApp integration found. Connect your WhatsApp Business API in the Integrations tab first.',
      });
    }

    // 2. Formulate payload
    let messagePayload;
    if (templateName) {
      // Template message (highly recommended for starting business conversations)
      messagePayload = {
        type: 'template',
        template: {
          name: templateName.trim(),
          language: {
            code: templateLanguage || 'en_US',
          },
        },
      };
    } else {
      // Standard custom text message
      if (!messageText) {
        return res.status(400).json({ success: false, message: 'Message body or template name is required.' });
      }
      messagePayload = {
        type: 'text',
        text: {
          body: messageText.trim(),
        },
      };
    }

    // 3. Send message via service
    const response = await whatsappService.sendWhatsAppMessage(
      credential.whatsappPhoneNumberId,
      credential.accessToken,
      recipientPhone,
      messagePayload
    );

    res.json({
      success: true,
      message: 'WhatsApp message sent successfully!',
      response,
    });
  } catch (error) {
    console.error('WhatsApp Send Controller Error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to send WhatsApp message.',
    });
  }
};

module.exports = {
  verifyConnection,
  sendMessage,
};
