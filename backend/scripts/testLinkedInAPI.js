const assert = require('assert');
const Module = require('module');

// Simple mock for axios
const mockAxios = {
  history: {
    get: [],
    post: [],
    put: []
  },
  reset() {
    this.history.get = [];
    this.history.post = [];
    this.history.put = [];
  },
  async get(url, config) {
    this.history.get.push({ url, config });
    if (url.includes('/v2/me')) {
      return { data: { id: 'test_member_id', localizedFirstName: 'John', localizedLastName: 'Doe' } };
    }
    if (url.includes('/v2/organizations/')) {
      return { data: { id: 'test_org_id', localizedName: 'Test Org' } };
    }
    if (url.includes('http://example.com/image.png')) {
      return { data: Buffer.from('fake_image_binary_data'), headers: { 'content-type': 'image/png' } };
    }
    throw new Error(`Mock get handler not found for URL: ${url}`);
  },
  async post(url, data, config) {
    this.history.post.push({ url, data, config });
    if (url.includes('/v2/assets?action=registerUpload')) {
      return {
        data: {
          value: {
            asset: 'urn:li:digitalmediaAsset:C5604AQG2fake',
            uploadMechanism: {
              'com.linkedin.digitalmedia.uploading.MediaUploadHttpRequest': {
                uploadUrl: 'https://upload.linkedin.com/media-upload/12345'
              }
            }
          }
        }
      };
    }
    if (url.includes('/v2/ugcPosts')) {
      return {
        data: {
          id: 'urn:li:ugcPost:123456789'
        }
      };
    }
    throw new Error(`Mock post handler not found for URL: ${url}`);
  },
  async put(url, data, config) {
    this.history.put.push({ url, data, config });
    if (url.includes('https://upload.linkedin.com/media-upload/')) {
      return { status: 201 };
    }
    throw new Error(`Mock put handler not found for URL: ${url}`);
  }
};

// Override require('axios') dynamically for our service
const originalRequire = Module.prototype.require;
Module.prototype.require = function (id) {
  if (id === 'axios') {
    return mockAxios;
  }
  return originalRequire.apply(this, arguments);
};

// Load service after overriding require
const linkedinService = require('../services/linkedinService');

async function runTests() {
  console.log('--- STARTING LINKEDIN SERVICE VERIFICATION ---');

  // Test 1: Verify member credentials
  console.log('Testing Member URN Verification...');
  mockAxios.reset();
  const verifyMemberResult = await linkedinService.verifyLinkedInCredentials('urn:li:person:test_member_id', 'fake_token');
  assert.strictEqual(verifyMemberResult, true);
  assert.strictEqual(mockAxios.history.get.length, 1);
  assert.strictEqual(mockAxios.history.get[0].url, 'https://api.linkedin.com/v2/me');
  assert.strictEqual(mockAxios.history.get[0].config.headers.Authorization, 'Bearer fake_token');
  console.log('✅ Member URN Verification Passed');

  // Test 2: Verify organization credentials
  console.log('Testing Organization URN Verification...');
  mockAxios.reset();
  const verifyOrgResult = await linkedinService.verifyLinkedInCredentials('urn:li:organization:12345', 'fake_token');
  assert.strictEqual(verifyOrgResult, true);
  assert.strictEqual(mockAxios.history.get.length, 1);
  assert.strictEqual(mockAxios.history.get[0].url, 'https://api.linkedin.com/v2/organizations/12345');
  console.log('✅ Organization URN Verification Passed');

  // Test 3: Publish text-only post
  console.log('Testing Text-Only UGC Publishing...');
  mockAxios.reset();
  const textPostLink = await linkedinService.publishToLinkedIn('fake_token', 'urn:li:person:test_member_id', 'Hello LinkedIn!');
  assert.strictEqual(textPostLink, 'https://www.linkedin.com/feed/update/urn:li:activity:123456789');
  assert.strictEqual(mockAxios.history.post.length, 1);
  const postData = mockAxios.history.post[0].data;
  assert.strictEqual(postData.author, 'urn:li:person:test_member_id');
  assert.strictEqual(postData.specificContent['com.linkedin.ugc.ShareContent'].shareMediaCategory, 'NONE');
  assert.strictEqual(postData.specificContent['com.linkedin.ugc.ShareContent'].shareCommentary.text, 'Hello LinkedIn!');
  console.log('✅ Text-Only UGC Publishing Passed');

  // Test 4: Publish image post (requires registration, download, PUT upload, and UGC post)
  console.log('Testing Image UGC Publishing...');
  mockAxios.reset();
  const imagePostLink = await linkedinService.publishToLinkedIn(
    'fake_token',
    'urn:li:person:test_member_id',
    'Check out this image!',
    'http://example.com/image.png'
  );
  assert.strictEqual(imagePostLink, 'https://www.linkedin.com/feed/update/urn:li:activity:123456789');
  
  // Verify image download call
  assert.strictEqual(mockAxios.history.get.length, 1);
  assert.strictEqual(mockAxios.history.get[0].url, 'http://example.com/image.png');
  assert.strictEqual(mockAxios.history.get[0].config.responseType, 'arraybuffer');

  // Verify registration call
  assert.strictEqual(mockAxios.history.post.length, 2);
  const regCall = mockAxios.history.post[0];
  assert.strictEqual(regCall.url, 'https://api.linkedin.com/v2/assets?action=registerUpload');
  assert.strictEqual(regCall.data.registerUploadRequest.owner, 'urn:li:person:test_member_id');

  // Verify PUT binary upload call
  assert.strictEqual(mockAxios.history.put.length, 1);
  const putCall = mockAxios.history.put[0];
  assert.strictEqual(putCall.url, 'https://upload.linkedin.com/media-upload/12345');
  assert.strictEqual(putCall.config.headers['Content-Type'], 'image/png');

  // Verify final post content structure
  const finalPostCall = mockAxios.history.post[1];
  assert.strictEqual(finalPostCall.url, 'https://api.linkedin.com/v2/ugcPosts');
  const finalData = finalPostCall.data;
  assert.strictEqual(finalData.specificContent['com.linkedin.ugc.ShareContent'].shareMediaCategory, 'IMAGE');
  assert.strictEqual(finalData.specificContent['com.linkedin.ugc.ShareContent'].media[0].media, 'urn:li:digitalmediaAsset:C5604AQG2fake');
  
  console.log('✅ Image UGC Publishing Passed');

  console.log('--- ALL LINKEDIN SERVICE VERIFICATIONS COMPLETED SUCCESSFULLY ---');
}

runTests().catch(err => {
  console.error('❌ LinkedIn Service Verification Failed:', err);
  process.exit(1);
});
