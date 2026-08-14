import axiosInstance from './axiosInstance';

/**
 * Publishes a tracker entry directly to the connected Instagram Business account.
 * @param {object} payload - { entryId }
 */
export const publishToInstagram = async (payload) => {
  const response = await axiosInstance.post('/instagram/publish', payload);
  return response.data;
};
