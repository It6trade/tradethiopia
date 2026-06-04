const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/tradexFollowupController');

router.get('/', ctrl.list);
router.post('/', ctrl.create);
router.patch('/:id', ctrl.update);
router.patch('/:id/services', ctrl.updateServices);
router.delete('/:id', ctrl.remove);

module.exports = router;

