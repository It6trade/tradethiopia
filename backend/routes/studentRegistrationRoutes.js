const express = require('express');
const {
  getStudentRegistrations,
  createStudentRegistration,
  updateStudentRegistration,
  deleteStudentRegistration,
} = require('../controllers/studentRegistrationController');

const router = express.Router();

router.get('/', getStudentRegistrations);
router.post('/', createStudentRegistration);
router.put('/:id', updateStudentRegistration);
router.delete('/:id', deleteStudentRegistration);

module.exports = router;
