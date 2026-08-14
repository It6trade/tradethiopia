const axios = require('axios');

/**
 * Verifies if a given Facebook Page ID and Access Token are valid.
 * Calls Meta Graph API: GET https://graph.facebook.com/v18.0/{pageId}?fields=name&access_token={token}
 * @param {string} pageId - Facebook Page ID
 * @param {string} token - Page Access Token
 * @returns {Promise<string>} - The Facebook Page Name
 */
const verifyFacebookToken = async (pageId, token) => {
  if (!pageId || !token) {
    throw new Error('Facebook Page ID and Access Token are required for verification.');
  }

  try {
    const response = await axios.get(`https://graph.facebook.com/v18.0/${pageId}`, {
      params: {
        fields: 'name',
        access_token: token,
      },
    });

    if (response.data && response.data.name) {
      return response.data.name;
    } else {
      throw new Error('Invalid response received from Meta APIs.');
    }
  } catch (error) {
    const errorMsg = error.response?.data?.error?.message || error.message;
    console.error('Facebook verification failed:', errorMsg);
    throw new Error(`Meta Graph API Verification Error: ${errorMsg}`);
  }
};

/**
 * Publishes a text/link post to a Facebook Page feed.
 * Calls Meta Graph API: POST https://graph.facebook.com/v18.0/{pageId}/feed
 * @param {string} pageId - Facebook Page ID
 * @param {string} token - Page Access Token
 * @param {string} message - Content/message text
 * @param {string} [link] - Optional external link to append
 * @returns {Promise<string>} - The created Facebook post ID
 */
const postToFacebookPage = async (pageId, token, message, link) => {
  if (!pageId || !token) {
    throw new Error('Facebook Page ID and Access Token are required to publish.');
  }
  if (!message) {
    throw new Error('Post message content is required.');
  }

  try {
    const postData = {
      message: message,
      access_token: token,
    };

    if (link && link.trim()) {
      postData.link = link.trim();
    }

    const response = await axios.post(`https://graph.facebook.com/v18.0/${pageId}/feed`, null, {
      params: postData,
    });

    if (response.data && response.data.id) {
      return response.data.id;
    } else {
      throw new Error('Invalid response received from Meta APIs after publishing.');
    }
  } catch (error) {
    const errorMsg = error.response?.data?.error?.message || error.message;
    console.error('Facebook publishing failed:', errorMsg);
    throw new Error(`Meta Graph API Publishing Error: ${errorMsg}`);
  }
};

module.exports = {
  verifyFacebookToken,
  postToFacebookPage,
};
