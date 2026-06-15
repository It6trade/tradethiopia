const express = require('express');
const router = express.Router();
const socialAccountCredentialController = require('../controllers/socialAccountCredentialController');

router.get('/', socialAccountCredentialController.listSocialAccountCredentials);
router.post('/', socialAccountCredentialController.createSocialAccountCredential);
router.post('/sync-email-social-account', socialAccountCredentialController.syncEmailSocialAccount);
router.put('/:id', socialAccountCredentialController.updateSocialAccountCredential);
router.delete('/:id', socialAccountCredentialController.deleteSocialAccountCredential);

module.exports = router;
