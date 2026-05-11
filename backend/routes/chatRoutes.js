const express = require('express');
const multer = require('multer');
const { protect } = require('../middleware/auth');
const controller = require('../controllers/chatController');

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage() });

router.use(protect);

router.get('/users', controller.listUsers);
router.get('/conversations', controller.listConversations);
router.post('/conversations/direct', controller.createDirectConversation);
router.post('/conversations/group', controller.createGroupConversation);
router.get('/conversations/:id/messages', controller.listMessages);
router.post('/conversations/:id/attachments', upload.array('files', 5), controller.uploadConversationAttachments);
router.post('/conversations/:id/messages', controller.sendMessage);
router.patch('/conversations/:id/messages/:messageId', controller.updateMessage);
router.delete('/conversations/:id/messages/:messageId', controller.deleteMessage);
router.post('/conversations/:id/read', controller.markConversationRead);

module.exports = router;
