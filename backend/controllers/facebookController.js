const axios = require('axios');
const facebookService = require('../services/facebookService');
const SocialAccountCredential = require('../models/SocialAccountCredential');
const ContentTrackerEntry = require('../models/ContentTrackerEntry');

/**
 * Validates a Facebook Page ID and Token without saving.
 * POST /api/facebook/verify-connection
 */
const verifyConnection = async (req, res) => {
  const { pageId, accessToken } = req.body;

  if (!pageId || !accessToken) {
    return res.status(400).json({
      success: false,
      message: 'Both Facebook Page ID and Access Token are required.',
    });
  }

  try {
    const pageName = await facebookService.verifyFacebookToken(pageId, accessToken);
    res.json({
      success: true,
      message: 'Connection verified successfully.',
      pageName,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message || 'Failed to verify Facebook connection.',
    });
  }
};

/**
 * Publishes a post from the content tracker to Facebook.
 * POST /api/facebook/publish
 */
const publishPost = async (req, res) => {
  const { entryId, credentialId } = req.body;

  if (!entryId) {
    return res.status(400).json({
      success: false,
      message: 'Content entry ID is required to publish.',
    });
  }

  try {
    // 1. Fetch content entry
    const entry = await ContentTrackerEntry.findById(entryId);
    if (!entry) {
      return res.status(404).json({
        success: false,
        message: 'Content tracker entry not found.',
      });
    }

    // 2. Fetch Facebook credentials
    let credential;
    if (credentialId) {
      credential = await SocialAccountCredential.findById(credentialId);
    } else {
      // Find the first active connected Facebook account
      credential = await SocialAccountCredential.findOne({
        platform: 'Facebook',
        active: true,
        isConnected: true,
      });
    }

    if (!credential || !credential.pageId || !credential.accessToken) {
      return res.status(400).json({
        success: false,
        message: 'No active connected Facebook account found. Please connect Facebook in your accounts tab.',
      });
    }

    // 3. Construct message
    let message = entry.title;
    if (entry.description) {
      message += `\n\n${entry.description}`;
    }

    // 4. Post to Meta Graph API
    const postId = await facebookService.postToFacebookPage(
      credential.pageId,
      credential.accessToken,
      message,
      entry.link
    );

    // 5. Generate Facebook Post URL
    // Meta formats: pageId_postId or just postId. We use the postId itself, which works on: https://facebook.com/{postId}
    // Or https://facebook.com/{pageId}/posts/{id_part_2}
    const idParts = postId.split('_');
    const displayPostId = idParts.length > 1 ? idParts[1] : postId;
    const postUrl = `https://www.facebook.com/${credential.pageId}/posts/${displayPostId}`;

    // 6. Update ContentTrackerEntry status
    entry.link = postUrl;
    entry.approved = true; // Automatically approve once live on FB
    await entry.save();

    res.json({
      success: true,
      message: 'Post published successfully to Facebook Page.',
      postId,
      postUrl,
      entry,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to publish post to Facebook.',
    });
  }
};

/**
 * Handles the Facebook OAuth redirection, exchanges code for long-lived page tokens,
 * and redirects the user back to the frontend integrations tab.
 */
const oauthCallback = async (req, res) => {
  const { code, error } = req.query;
  const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';

  if (error) {
    return res.send(`
      <!DOCTYPE html>
      <html>
      <head><title>Authentication Mismatch</title></head>
      <body>
        <script>
          if (window.opener) {
            window.opener.postMessage({ source: "facebook-oauth", success: false, error: "${error}" }, "*");
            window.close();
          } else {
            window.location.href = "${frontendUrl}/social-media?fb_error=${encodeURIComponent(error)}";
          }
        </script>
      </body>
      </html>
    `);
  }
  if (!code) {
    return res.send(`
      <!DOCTYPE html>
      <html>
      <head><title>Authentication Failed</title></head>
      <body>
        <script>
          if (window.opener) {
            window.opener.postMessage({ source: "facebook-oauth", success: false, error: "No code provided" }, "*");
            window.close();
          } else {
            window.location.href = "${frontendUrl}/social-media?fb_error=No+code+provided";
          }
        </script>
      </body>
      </html>
    `);
  }

  try {
    const appId = process.env.FACEBOOK_APP_ID;
    const appSecret = process.env.FACEBOOK_APP_SECRET;
    const redirectUri = process.env.FACEBOOK_REDIRECT_URI || 'http://localhost:5000/api/facebook/callback';

    if (!appId || !appSecret) {
      throw new Error("Facebook App credentials not configured on server.");
    }

    // 1. Exchange authorization code for user access token
    const tokenRes = await axios.get('https://graph.facebook.com/v18.0/oauth/access_token', {
      params: {
        client_id: appId,
        client_secret: appSecret,
        redirect_uri: redirectUri,
        code,
      },
    });

    const userToken = tokenRes.data.access_token;

    // 2. Exchange user access token for a long-lived user token
    const longLivedRes = await axios.get('https://graph.facebook.com/v18.0/oauth/access_token', {
      params: {
        grant_type: 'fb_exchange_token',
        client_id: appId,
        client_secret: appSecret,
        fb_exchange_token: userToken,
      },
    });

    const longLivedToken = longLivedRes.data.access_token;

    // 3. Get the user's managed Facebook Pages and their respective Page Access Tokens
    const pagesRes = await axios.get('https://graph.facebook.com/v18.0/me/accounts', {
      params: {
        fields: 'name,id,access_token,category,instagram_business_account',
        access_token: longLivedToken,
      },
    });

    const pages = (pagesRes.data.data || []).map((page) => ({
      name: page.name,
      id: page.id,
      access_token: page.access_token,
      category: page.category,
      instagramBusinessAccountId: page.instagram_business_account?.id || '',
    }));

    const pagesJson = JSON.stringify(pages);

    res.send(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>Connecting Facebook Page...</title>
        <style>
          body {
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
            text-align: center;
            padding: 50px;
            background: #f3f4f6;
            color: #1f2937;
          }
          .card {
            background: white;
            padding: 30px;
            border-radius: 12px;
            box-shadow: 0 4px 15px rgba(0,0,0,0.05);
            display: inline-block;
            max-width: 400px;
          }
          h2 { color: #1877F2; margin-top: 0; }
          .spinner {
            border: 4px solid #f3f3f3;
            border-top: 4px solid #1877F2;
            border-radius: 50%;
            width: 30px;
            height: 30px;
            animation: spin 1s linear infinite;
            margin: 20px auto;
          }
          @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
        </style>
      </head>
      <body>
        <div class="card">
          <h2>Connecting Page...</h2>
          <div class="spinner"></div>
          <p>Saving configuration details. This window will close automatically.</p>
        </div>
        <script>
          try {
            if (window.opener) {
              window.opener.postMessage({
                source: "facebook-oauth",
                success: true,
                pages: ${pagesJson}
              }, "*");
              window.close();
            } else {
              window.location.href = "${frontendUrl}/social-media?fb_success=true&pages=${encodeURIComponent(pagesJson)}";
            }
          } catch (e) {
            console.error(e);
            window.location.href = "${frontendUrl}/social-media?fb_error=" + encodeURIComponent(e.message);
          }
        </script>
      </body>
      </html>
    `);
  } catch (err) {
    const errDetails = err.response?.data?.error?.message || err.message;
    console.error('Facebook OAuth Callback Error:', errDetails);
    
    res.send(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>Connection Failed</title>
        <style>
          body {
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
            text-align: center;
            padding: 50px;
            background: #f3f4f6;
            color: #1f2937;
          }
          .card {
            background: white;
            padding: 30px;
            border-radius: 12px;
            box-shadow: 0 4px 15px rgba(0,0,0,0.05);
            display: inline-block;
            max-width: 400px;
          }
          h2 { color: #dc2626; margin-top: 0; }
          button {
            background: #4b5563;
            color: white;
            border: none;
            padding: 8px 16px;
            border-radius: 6px;
            cursor: pointer;
            font-weight: 600;
          }
        </style>
      </head>
      <body>
        <div class="card">
          <h2>Connection Failed</h2>
          <p>${errDetails}</p>
          <button onclick="window.close()">Close Window</button>
        </div>
        <script>
          if (window.opener) {
            window.opener.postMessage({
              source: "facebook-oauth",
              success: false,
              error: "${errDetails}"
            }, "*");
            window.close();
          }
        </script>
      </body>
      </html>
    `);
  }
};

/**
 * Redirects the user to the Facebook OAuth dialog.
 */
const login = (req, res) => {
  const appId = process.env.FACEBOOK_APP_ID;
  const redirectUri = process.env.FACEBOOK_REDIRECT_URI || 'http://localhost:5000/api/facebook/callback';
  const scope = 'pages_show_list,pages_read_engagement,pages_manage_posts,public_profile';

  if (!appId) {
    return res.status(500).send('Facebook App ID not configured on the server.');
  }

  const configId = process.env.FACEBOOK_CONFIG_ID;
  let authUrl;
  
  if (configId) {
    // For Facebook Login for Business configurations, the scopes are defined inside the dashboard template.
    // Specifying scope parameter here can cause "Invalid Scopes" mismatch errors.
    authUrl = `https://www.facebook.com/v18.0/dialog/oauth?client_id=${appId}&redirect_uri=${encodeURIComponent(redirectUri)}&config_id=${configId}&response_type=code`;
  } else {
    authUrl = `https://www.facebook.com/v18.0/dialog/oauth?client_id=${appId}&redirect_uri=${encodeURIComponent(redirectUri)}&scope=${encodeURIComponent(scope)}&response_type=code`;
  }

  res.redirect(authUrl);
};

module.exports = {
  verifyConnection,
  publishPost,
  oauthCallback,
  login,
};

