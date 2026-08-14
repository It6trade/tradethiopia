const axios = require('axios');

/**
 * Verifies if LinkedIn credentials are correct.
 * @param {string} urn - The LinkedIn member or organization URN (e.g. urn:li:person:12345).
 * @param {string} accessToken - The LinkedIn Access Token.
 * @returns {Promise<boolean>} True if valid.
 */
const verifyLinkedInCredentials = async (urn, accessToken) => {
  try {
    const isOrg = urn.includes('organization');
    if (isOrg) {
      const orgId = urn.split(':').pop();
      const res = await axios.get(`https://api.linkedin.com/v2/organizations/${orgId}`, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });
      return !!res.data.id;
    } else {
      const res = await axios.get('https://api.linkedin.com/v2/me', {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });
      return !!res.data.id;
    }
  } catch (error) {
    const details = error.response?.data?.message || error.message;
    throw new Error(`LinkedIn verification failed: ${details}`);
  }
};

/**
 * Downloads a public image from a URL, registers it on LinkedIn, and uploads the binary data.
 * @param {string} accessToken - The LinkedIn Access Token.
 * @param {string} authorUrn - The author's URN.
 * @param {string} imageUrl - The public image URL.
 * @returns {Promise<string>} The uploaded image URN.
 */
const registerAndUploadImage = async (accessToken, authorUrn, imageUrl) => {
  try {
    // 1. Register the image asset on LinkedIn
    const registerRes = await axios.post(
      'https://api.linkedin.com/v2/assets?action=registerUpload',
      {
        registerUploadRequest: {
          recipes: ['urn:li:digitalmediaRecipe:feedshare-image'],
          owner: authorUrn,
          supportedUploadMechanisms: ['SYNCHRONOUS_UPLOAD'],
        },
      },
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
      }
    );

    const uploadUrl = registerRes.data.value.uploadMechanism['com.linkedin.digitalmedia.uploading.MediaUploadHttpRequest'].uploadUrl;
    const assetUrn = registerRes.data.value.asset;

    // 2. Fetch the image file as a buffer
    const imgDownloadRes = await axios.get(imageUrl, { responseType: 'arraybuffer' });
    const imgBuffer = Buffer.from(imgDownloadRes.data, 'binary');

    // Determine content type from URL/extension or default to image/jpeg
    let contentType = 'image/jpeg';
    if (imageUrl.endsWith('.png')) contentType = 'image/png';
    else if (imageUrl.endsWith('.gif')) contentType = 'image/gif';

    // 3. Upload image buffer directly via binary PUT to LinkedIn's media upload url
    await axios.put(uploadUrl, imgBuffer, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': contentType,
      },
    });

    return assetUrn;
  } catch (error) {
    const details = error.response?.data?.message || error.message;
    throw new Error(`LinkedIn image upload failed: ${details}`);
  }
};

/**
 * Publishes a share post (text + optional image) to LinkedIn.
 * @param {string} accessToken - The LinkedIn Access Token.
 * @param {string} authorUrn - The author's URN.
 * @param {string} text - The post caption/commentary text.
 * @param {string} imageUrl - Optional image URL.
 * @returns {Promise<string>} The published share ID or direct link.
 */
const publishToLinkedIn = async (accessToken, authorUrn, text, imageUrl) => {
  try {
    let specificContent;

    if (imageUrl && imageUrl.startsWith('http')) {
      // Register and upload the image asset first
      const assetUrn = await registerAndUploadImage(accessToken, authorUrn, imageUrl);
      
      specificContent = {
        'com.linkedin.ugc.ShareContent': {
          shareCommentary: {
            text: text,
          },
          shareMediaCategory: 'IMAGE',
          media: [
            {
              status: 'READY',
              description: {
                text: 'Post attachment image',
              },
              media: assetUrn,
              title: {
                text: 'Featured Image',
              },
            },
          ],
        },
      };
    } else {
      // Text-only post
      specificContent = {
        'com.linkedin.ugc.ShareContent': {
          shareCommentary: {
            text: text,
          },
          shareMediaCategory: 'NONE',
        },
      };
    }

    const res = await axios.post(
      'https://api.linkedin.com/v2/ugcPosts',
      {
        author: authorUrn,
        lifecycleState: 'PUBLISHED',
        specificContent,
        visibility: {
          'com.linkedin.ugc.MemberNetworkVisibility': 'PUBLIC',
        },
      },
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
          'X-Restli-Protocol-Version': '2.0.0',
        },
      }
    );

    const ugcPostId = res.data.id;
    // Format a direct, clickable LinkedIn post link from the returned URN
    const cleanId = ugcPostId.replace('urn:li:share:', '').replace('urn:li:ugcPost:', '');
    return `https://www.linkedin.com/feed/update/urn:li:activity:${cleanId}`;
  } catch (error) {
    const details = error.response?.data?.message || error.message;
    throw new Error(`LinkedIn publishing failed: ${details}`);
  }
};

module.exports = {
  verifyLinkedInCredentials,
  publishToLinkedIn,
};
