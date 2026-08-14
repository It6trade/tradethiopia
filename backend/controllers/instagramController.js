const SocialAccountCredential = require('../models/SocialAccountCredential');
const ContentTrackerEntry = require('../models/ContentTrackerEntry');
const instagramService = require('../services/instagramService');

/**
 * Publishes a Content Tracker post to the connected Instagram Business account.
 */
const publishPost = async (req, res) => {
  const { entryId } = req.body;

  if (!entryId) {
    return res.status(400).json({ success: false, message: 'Content entry ID is required.' });
  }

  try {
    // 1. Fetch content entry
    const entry = await ContentTrackerEntry.findById(entryId);
    if (!entry) {
      return res.status(404).json({ success: false, message: 'Content tracker entry not found.' });
    }

    // 2. Lookup connected Facebook integration (which holds Page Token + linked Instagram ID)
    const credential = await SocialAccountCredential.findOne({
      platform: 'Facebook',
      isConnected: true,
      active: true,
    });

    if (!credential || !credential.accessToken) {
      return res.status(400).json({
        success: false,
        message: 'No active integrations found. Connect your Facebook/Instagram account in the Integrations tab first.',
      });
    }

    if (!credential.instagramBusinessAccountId) {
      return res.status(400).json({
        success: false,
        message: 'The connected Facebook Page does not have a linked Instagram Business Account.',
      });
    }

    // 3. Verify post has an image URL
    // Meta Instagram API requires an image URL
    const imageUrl = entry.imageUrl || entry.link; // Fallback to link if stored there
    if (!imageUrl || !imageUrl.startsWith('http')) {
      return res.status(400).json({
        success: false,
        message: 'Instagram publishing requires a valid, public image URL. Add an image to your post first.',
      });
    }

    const caption = `${entry.title}\n\n${entry.description || ''}`.trim();

    // 4. Create Instagram Media Container
    const creationId = await instagramService.createMediaContainer(
      credential.instagramBusinessAccountId,
      credential.accessToken,
      imageUrl.trim(),
      caption
    );

    // 5. Publish Media Container
    const mediaId = await instagramService.publishMediaContainer(
      credential.instagramBusinessAccountId,
      credential.accessToken,
      creationId
    );

    // 6. Fetch direct post URL
    const postUrl = await instagramService.getInstagramPostLink(
      mediaId,
      credential.accessToken
    );

    // 7. Update ContentTrackerEntry status
    entry.link = postUrl;
    entry.approved = true;
    await entry.save();

    res.json({
      success: true,
      message: 'Published to Instagram successfully!',
      postUrl,
      entry,
    });
  } catch (error) {
    console.error('Instagram Publish Controller Error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to publish post to Instagram.',
    });
  }
};

module.exports = {
  publishPost,
};
