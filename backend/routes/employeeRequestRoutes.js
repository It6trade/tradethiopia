const express = require('express');
const multer = require('multer');
const controller = require('../controllers/employeeRequestController');
const { protect } = require('../middleware/auth');

const router = express.Router();
const allowedTypes = new Set([
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'image/jpeg',
  'image/png',
]);
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024, files: 5 },
  fileFilter: (req, file, callback) =>
    allowedTypes.has(file.mimetype)
      ? callback(null, true)
      : callback(new Error('Only PDF, Word, JPG, and PNG attachments are allowed.')),
});
const attachments = (req, res, next) => upload.array('attachments', 5)(req, res, (error) => {
  if (!error) return next();
  return res.status(400).json({ message: error.code === 'LIMIT_FILE_SIZE' ? 'Each attachment must be 10 MB or smaller.' : error.message });
});

router.use(protect);
router.post('/', attachments, controller.create);
router.get('/mine', controller.mine);
router.get('/access-context', controller.accessContext);
router.get('/manager-inbox', controller.managerInbox);
router.get('/hr-inbox', controller.hrInbox);
router.get('/manager-options', controller.managerOptions);
router.patch('/assign-manager/:userId', controller.assignManager);
router.patch('/:id/reassign-manager', controller.reassignRequest);
router.get('/:id', controller.details);
router.patch('/:id/manager-decision', controller.managerDecision);
router.patch('/:id/hr-decision', controller.hrDecision);
router.patch('/:id/cancel', controller.cancel);

module.exports = router;
