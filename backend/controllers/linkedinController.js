const SocialAccountCredential = require('../models/SocialAccountCredential');
const ContentTrackerEntry = require('../models/ContentTrackerEntry');
const linkedinService = require('../services/linkedinService');
const axios = require('axios');
const qs = require('qs');

/**
 * Redirects the user to the LinkedIn OAuth login flow.
 */
const login = (req, res) => {
  const clientId = process.env.LINKEDIN_CLIENT_ID || 'dummy_client_id';
  const redirectUri = encodeURIComponent(process.env.LINKEDIN_REDIRECT_URI || 'http://localhost:5000/api/linkedin/callback');
  const scope = encodeURIComponent('openid profile email w_member_social');
  const state = Math.random().toString(36).substring(2);

  const authUrl = `https://www.linkedin.com/oauth/v2/authorization?response_type=code&client_id=${clientId}&redirect_uri=${redirectUri}&state=${state}&scope=${scope}`;
  res.redirect(authUrl);
};

/**
 * Handles the OAuth code exchange callback from LinkedIn.
 */
const oauthCallback = async (req, res) => {
  const { code, error, error_description } = req.query;

  if (error) {
    console.error('LinkedIn OAuth Callback Error:', error_description || error);
    return res.send(`
      <html>
        <body>
          <script>
            window.opener.postMessage({
              source: 'linkedin-oauth',
              success: false,
              error: "${error_description || error}"
            }, "*");
            window.close();
          </script>
        </body>
      </html>
    `);
  }

  try {
    // 1. Exchange auth code for access token
    const tokenRes = await axios.post(
      'https://www.linkedin.com/oauth/v2/accessToken',
      qs.stringify({
        grant_type: 'authorization_code',
        code,
        client_id: process.env.LINKEDIN_CLIENT_ID,
        client_secret: process.env.LINKEDIN_CLIENT_SECRET,
        redirect_uri: process.env.LINKEDIN_REDIRECT_URI || 'http://localhost:5000/api/linkedin/callback',
      }),
      {
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      }
    );

    const accessToken = tokenRes.data.access_token;

    // 2. Fetch User Profile Info (using OpenID UserInfo API)
    const userRes = await axios.get('https://api.linkedin.com/v2/userinfo', {
      headers: { Authorization: `Bearer ${accessToken}` },
    });

    const sub = userRes.data.sub; // Member ID
    const name = userRes.data.name || `${userRes.data.given_name} ${userRes.data.family_name}`;
    const linkedinUrn = `urn:li:person:${sub}`;

    // 3. Close the popup and pass results back to the parent browser window
    res.send(`
      <html>
        <body>
          <script>
            window.opener.postMessage({
              source: 'linkedin-oauth',
              success: true,
              urn: "${linkedinUrn}",
              name: "${name}",
              token: "${accessToken}"
            }, "*");
            window.close();
          </script>
        </body>
      </html>
    `);
  } catch (err) {
    console.error('LinkedIn OAuth callback failure:', err);
    const details = err.response?.data?.error_description || err.message;
    res.send(`
      <html>
        <body>
          <script>
            window.opener.postMessage({
              source: 'linkedin-oauth',
              success: false,
              error: "${details}"
            }, "*");
            window.close();
          </script>
        </body>
      </html>
    `);
  }
};

/**
 * Manually validates and links a LinkedIn account/urn.
 */
const verifyConnection = async (req, res) => {
  const { linkedinUrn, accessToken, employeeFullName } = req.body;

  if (!linkedinUrn || !accessToken || !employeeFullName) {
    return res.status(400).json({
      success: false,
      message: 'LinkedIn URN, Access Token, and Manager Name are required.',
    });
  }

  try {
    // 1. Verify credentials via service API request
    await linkedinService.verifyLinkedInCredentials(linkedinUrn.trim(), accessToken.trim());

    // 2. Save/Upsert credential doc
    const cleanUrn = linkedinUrn.trim();
    const payload = {
      platform: 'LinkedIn',
      employeeFullName: employeeFullName.trim(),
      accountName: cleanUrn.includes('organization') ? `LinkedIn Org (${cleanUrn.slice(-6)})` : `LinkedIn Member (${cleanUrn.slice(-6)})`,
      linkedinUrn: cleanUrn,
      accessToken: accessToken.trim(),
      isConnected: true,
      active: true,
    };

    const doc = await SocialAccountCredential.findOneAndUpdate(
      { platform: 'LinkedIn', linkedinUrn: cleanUrn },
      { $set: payload },
      { new: true, upsert: true, runValidators: true }
    );

    res.json({
      success: true,
      message: 'LinkedIn verified and connected successfully!',
      credential: doc,
    });
  } catch (error) {
    console.error('LinkedIn Connection verification failed:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to verify LinkedIn credentials.',
    });
  }
};

/**
 * Publishes a Content Tracker post directly to the connected LinkedIn feed.
 */
const publishPost = async (req, res) => {
  const { entryId } = req.body;

  if (!entryId) {
    return res.status(400).json({ success: false, message: 'Content tracker entry ID is required.' });
  }

  try {
    // 1. Lookup Content Entry
    const entry = await ContentTrackerEntry.findById(entryId);
    if (!entry) {
      return res.status(404).json({ success: false, message: 'Content tracker entry not found.' });
    }

    // 2. Lookup connected LinkedIn credentials
    const credential = await SocialAccountCredential.findOne({
      platform: 'LinkedIn',
      isConnected: true,
      active: true,
    });

    if (!credential || !credential.linkedinUrn || !credential.accessToken) {
      return res.status(400).json({
        success: false,
        message: 'No active LinkedIn integration found. Connect LinkedIn in the Integrations tab first.',
      });
    }

    const text = `${entry.title}\n\n${entry.description || ''}`.trim();
    const imageUrl = entry.imageUrl || ''; // Optional featured image

    // 3. Post to LinkedIn
    const postLink = await linkedinService.publishToLinkedIn(
      credential.accessToken,
      credential.linkedinUrn,
      text,
      imageUrl
    );

    // 4. Update local post status
    entry.link = postLink;
    entry.approved = true;
    await entry.save();

    res.json({
      success: true,
      message: 'Published to LinkedIn successfully!',
      postUrl: postLink,
      entry,
    });
  } catch (error) {
    console.error('LinkedIn Publish Controller Error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to publish post to LinkedIn.',
    });
  }
};

module.exports = {
  login,
  oauthCallback,
  verifyConnection,
  publishPost,
};
