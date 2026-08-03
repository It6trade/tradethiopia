const express = require('express');
const multer = require('multer');
const controller = require('../controllers/employeeWarningController');
const { protect } = require('../middleware/auth');

const router = express.Router();
const allowed = new Set(['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'image/jpeg', 'image/png']);
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 10 * 1024 * 1024, files: 5 }, fileFilter: (req, file, cb) => allowed.has(file.mimetype) ? cb(null, true) : cb(new Error('Only PDF, Word, JPG, and PNG attachments are allowed.')) });
const files = (field) => (req, res, next) => upload.array(field, 5)(req, res, (error) => error ? res.status(400).json({ message: error.code === 'LIMIT_FILE_SIZE' ? 'Each attachment must be 10 MB or smaller.' : error.message }) : next());

router.use(protect);
router.get('/categories', controller.categories);
router.get('/employees', controller.employees);
router.get('/hr', controller.hrList);
router.get('/mine', controller.mine);
router.post('/', files('attachments'), controller.create);
router.get('/:id', controller.details);
router.post('/:id/issue', controller.issue);
router.post('/:id/acknowledge', controller.acknowledge);
router.post('/:id/respond', files('attachments'), controller.respond);
router.post('/:id/close', controller.close);

module.exports = router;
