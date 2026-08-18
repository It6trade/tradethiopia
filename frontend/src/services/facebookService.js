import axiosInstance from './axiosInstance';

const unwrap = (response) => response?.data ?? response;

/**
 * Sends Page ID and Access Token to backend for verification.
 * @param {Object} payload - { pageId, accessToken }
 * @returns {Promise<Object>} - Response containing { success, pageName }
 */
export const verifyFacebookConnection = (payload) =>
  axiosInstance
    .post('/facebook/verify-connection', payload)
    .then((response) => unwrap(response));

/**
 * Triggers backend to publish a ContentTrackerEntry to Facebook Page.
 * @param {Object} payload - { entryId, credentialId }
 * @returns {Promise<Object>} - Response containing { success, postId, postUrl }
 */
export const publishToFacebook = (payload) =>
  axiosInstance
    .post('/facebook/publish', payload)
    .then((response) => unwrap(response));
