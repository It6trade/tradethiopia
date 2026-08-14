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
      return { data: { id: 'test_member_id' } };
    }
    if (url.includes('/v2/organizations/')) {
      return { data: { id: 'test_org_id' } };
    }
    if (url.includes('http://example.com/image.png')) {
      return { data: Buffer.from('fake_image_binary_data'), headers: { 'content-type': 'image/png' } };
    }
    if (url.includes('graph.facebook.com/v18.0/test_ig_media_id')) {
      return { data: { permalink: 'https://instagram.com/p/test_permalink/' } };
    }
    if (url.includes('graph.facebook.com/v18.0/test_whatsapp_phone_id')) {
      return { data: { id: 'test_whatsapp_phone_id' } };
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
    if (url.includes('graph.facebook.com/v18.0/test_ig_id/media_publish')) {
      return { data: { id: 'test_ig_media_id' } };
    }
    if (url.includes('graph.facebook.com/v18.0/test_ig_id/media')) {
      return { data: { id: 'test_container_id' } };
    }
    if (url.includes('graph.facebook.com/v18.0/test_whatsapp_phone_id/messages')) {
      return { data: { message_status: 'accepted', message_id: 'wamid.HBgLMjUxOTExMTIzNDU2FQIAERgSQjRDNjM4MjFFODg0QzQ1RjU2AA==' } };
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

// Override require('axios') dynamically for our services
const originalRequire = Module.prototype.require;
Module.prototype.require = function (id) {
  if (id === 'axios') {
    return mockAxios;
  }
  return originalRequire.apply(this, arguments);
};

// Load services after overriding require
const linkedinService = require('../services/linkedinService');
const instagramService = require('../services/instagramService');
const whatsappService = require('../services/whatsappService');

async function runTests() {
  console.log('--- STARTING ALL INTEGRATIONS SERVICE VERIFICATION ---');

  // --- WhatsApp Tests ---
  console.log('\n--- WhatsApp Integration Tests ---');
  
  console.log('Testing WhatsApp Credentials Verification...');
  mockAxios.reset();
  const verifyWA = await whatsappService.verifyWhatsAppCredentials('test_whatsapp_phone_id', 'wa_token');
  assert.strictEqual(verifyWA, true);
  assert.strictEqual(mockAxios.history.get.length, 1);
  assert.strictEqual(mockAxios.history.get[0].url, 'https://graph.facebook.com/v18.0/test_whatsapp_phone_id');
  assert.strictEqual(mockAxios.history.get[0].config.headers.Authorization, 'Bearer wa_token');
  console.log('✅ WhatsApp Credentials Verification Passed');

  console.log('Testing WhatsApp Message Sending...');
  mockAxios.reset();
  const waPayload = { type: 'text', text: { body: 'Hello WhatsApp!' } };
  const waRes = await whatsappService.sendWhatsAppMessage('test_whatsapp_phone_id', 'wa_token', '+251911123456', waPayload);
  assert.strictEqual(waRes.message_status, 'accepted');
  assert.strictEqual(mockAxios.history.post.length, 1);
  const waCall = mockAxios.history.post[0];
  assert.strictEqual(waCall.url, 'https://graph.facebook.com/v18.0/test_whatsapp_phone_id/messages');
  assert.strictEqual(waCall.data.to, '251911123456');
  assert.strictEqual(waCall.data.text.body, 'Hello WhatsApp!');
  assert.strictEqual(waCall.config.headers.Authorization, 'Bearer wa_token');
  console.log('✅ WhatsApp Message Sending Passed');

  // --- Instagram Tests ---
  console.log('\n--- Instagram Integration Tests ---');

  console.log('Testing Instagram Media Container Creation...');
  mockAxios.reset();
  const containerId = await instagramService.createMediaContainer('test_ig_id', 'ig_token', 'http://example.com/image.png', 'My Instagram post!');
  assert.strictEqual(containerId, 'test_container_id');
  assert.strictEqual(mockAxios.history.post.length, 1);
  const igCall1 = mockAxios.history.post[0];
  assert.strictEqual(igCall1.url, 'https://graph.facebook.com/v18.0/test_ig_id/media');
  assert.strictEqual(igCall1.data.image_url, 'http://example.com/image.png');
  assert.strictEqual(igCall1.data.caption, 'My Instagram post!');
  assert.strictEqual(igCall1.data.access_token, 'ig_token');
  console.log('✅ Instagram Container Creation Passed');

  console.log('Testing Instagram Media Publishing...');
  mockAxios.reset();
  const mediaId = await instagramService.publishMediaContainer('test_ig_id', 'ig_token', 'test_container_id');
  assert.strictEqual(mediaId, 'test_ig_media_id');
  assert.strictEqual(mockAxios.history.post.length, 1);
  const igCall2 = mockAxios.history.post[0];
  assert.strictEqual(igCall2.url, 'https://graph.facebook.com/v18.0/test_ig_id/media_publish');
  assert.strictEqual(igCall2.data.creation_id, 'test_container_id');
  assert.strictEqual(igCall2.data.access_token, 'ig_token');
  console.log('✅ Instagram Publishing Passed');

  console.log('Testing Instagram Post Permalink Fetching...');
  mockAxios.reset();
  const permalink = await instagramService.getInstagramPostLink('test_ig_media_id', 'ig_token');
  assert.strictEqual(permalink, 'https://instagram.com/p/test_permalink/');
  assert.strictEqual(mockAxios.history.get.length, 1);
  const igCall3 = mockAxios.history.get[0];
  assert.strictEqual(igCall3.url, 'https://graph.facebook.com/v18.0/test_ig_media_id');
  assert.strictEqual(igCall3.config.params.access_token, 'ig_token');
  console.log('✅ Instagram Permalink Retrieval Passed');

  // --- LinkedIn Tests ---
  console.log('\n--- LinkedIn Integration Tests ---');
  
  console.log('Testing Member URN Verification...');
  mockAxios.reset();
  const verifyMemberResult = await linkedinService.verifyLinkedInCredentials('urn:li:person:test_member_id', 'fake_token');
  assert.strictEqual(verifyMemberResult, true);
  assert.strictEqual(mockAxios.history.get.length, 1);
  assert.strictEqual(mockAxios.history.get[0].url, 'https://api.linkedin.com/v2/me');
  console.log('✅ Member URN Verification Passed');

  console.log('Testing Image UGC Publishing...');
  mockAxios.reset();
  const imagePostLink = await linkedinService.publishToLinkedIn(
    'fake_token',
    'urn:li:person:test_member_id',
    'Check out this image!',
    'http://example.com/image.png'
  );
  assert.strictEqual(imagePostLink, 'https://www.linkedin.com/feed/update/urn:li:activity:123456789');
  assert.strictEqual(mockAxios.history.get.length, 1);
  assert.strictEqual(mockAxios.history.post.length, 2);
  assert.strictEqual(mockAxios.history.put.length, 1);
  console.log('✅ Image UGC Publishing Passed');

  console.log('\n--- ALL INTEGRATIONS SERVICE VERIFICATIONS COMPLETED SUCCESSFULLY ---');
}

runTests().catch(err => {
  console.error('❌ Service Verification Failed:', err);
  process.exit(1);
});
