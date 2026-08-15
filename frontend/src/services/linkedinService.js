import axiosInstance from './axiosInstance';

/**
 * Verifies and saves LinkedIn credentials on the backend.
 * @param {object} payload - { linkedinUrn, accessToken, employeeFullName }
 */
export const verifyLinkedInConnection = async (payload) => {
  const response = await axiosInstance.post('/linkedin/verify-connection', payload);
  return response.data;
};

/**
 * Publishes a tracker entry directly to the connected LinkedIn account.
 * @param {object} payload - { entryId }
 */
export const publishToLinkedIn = async (payload) => {
  const response = await axiosInstance.post('/linkedin/publish', payload);
  return response.data;
};
