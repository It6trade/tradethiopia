const axios = require('axios');

/**
 * Creates an Instagram media container.
 * @param {string} igAccountId - The Instagram Business Account ID.
 * @param {string} accessToken - The Page Access Token.
 * @param {string} imageUrl - Publicly accessible URL of the image to publish.
 * @param {string} caption - Post caption/text.
 * @returns {Promise<string>} The creation container ID.
 */
const createMediaContainer = async (igAccountId, accessToken, imageUrl, caption) => {
  try {
    const res = await axios.post(`https://graph.facebook.com/v18.0/${igAccountId}/media`, {
      image_url: imageUrl,
      caption: caption,
      access_token: accessToken,
    });
    return res.data.id;
  } catch (error) {
    const details = error.response?.data?.error?.message || error.message;
    throw new Error(`Instagram Media Container creation failed: ${details}`);
  }
};

/**
 * Publishes a created media container.
 * @param {string} igAccountId - The Instagram Business Account ID.
 * @param {string} accessToken - The Page Access Token.
 * @param {string} creationId - The Media Container creation ID.
 * @returns {Promise<string>} The published media post ID.
 */
const publishMediaContainer = async (igAccountId, accessToken, creationId) => {
  try {
    const res = await axios.post(`https://graph.facebook.com/v18.0/${igAccountId}/media_publish`, {
      creation_id: creationId,
      access_token: accessToken,
    });
    return res.data.id;
  } catch (error) {
    const details = error.response?.data?.error?.message || error.message;
    throw new Error(`Instagram Media publishing failed: ${details}`);
  }
};

/**
 * Retrieves the permalink of a published Instagram post.
 * @param {string} mediaId - The published Instagram post ID.
 * @param {string} accessToken - The Page Access Token.
 * @returns {Promise<string>} The direct URL of the Instagram post.
 */
const getInstagramPostLink = async (mediaId, accessToken) => {
  try {
    const res = await axios.get(`https://graph.facebook.com/v18.0/${mediaId}`, {
      params: {
        fields: 'permalink',
        access_token: accessToken,
      },
    });
    return res.data.permalink;
  } catch (error) {
    const details = error.response?.data?.error?.message || error.message;
    throw new Error(`Failed to fetch Instagram post permalink: ${details}`);
  }
};

module.exports = {
  createMediaContainer,
  publishMediaContainer,
  getInstagramPostLink,
};
