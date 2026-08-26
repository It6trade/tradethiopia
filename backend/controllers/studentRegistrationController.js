const StudentRegistration = require('../models/StudentRegistration');

const parseDate = (value) => {
  if (!value) return undefined;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? undefined : date;
};

const normalizePaymentStatus = (value) => {
  const normalized = (value || '').toString().trim().toLowerCase();
  if (normalized === 'paid') return 'Paid';
  if (normalized === 'unpaid') return 'Unpaid';
  return 'Waiting';
};

const normalizePaymentOption = (value) => {
  const normalized = (value || '').toString().trim().toLowerCase();
  if (normalized.includes('half')) return 'Half Payment';
  return 'Full Payment';
};

const normalizeCocPaymentStatus = (value) => {
  const normalized = (value || '').toString().trim().toLowerCase();
  return normalized === 'paid' ? 'Paid' : 'Unpaid';
};

const normalizeBoolean = (value) => {
  if (typeof value === 'boolean') return value;
  const normalized = (value || '').toString().trim().toLowerCase();
  return ['true', 'yes', '1', 'completed', 'complete'].includes(normalized);
};

const normalizeClassCompletionStatus = (value, classCompleted) => {
  const normalized = (value || '').toString().trim().toLowerCase();
  if (normalized === 'stopped' || normalized === 'stop') return 'Stopped';
  if (normalized === 'completed' || normalized === 'complete') return 'Completed';
  if (normalized === 'not completed' || normalized === 'not complete' || normalized === 'incomplete') return 'Not Completed';
  return classCompleted ? 'Completed' : 'Not Completed';
};

const normalizeTimeSlot = (value) => {
  const normalized = (value || '').toString().trim().toLowerCase();
  if (normalized === 'afternoon') return 'Afternoon';
  if (normalized === 'night') return 'Night';
  if (normalized === 'weekend') return 'Weekend';
  if (normalized === 'vip') return 'VIP';
  return 'Morning';
};

const escapeRegExp = (value = '') => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

const generateStudentId = async () => {
  const prefix = 'CS-STU-';
  const latestStudent = await StudentRegistration.findOne({
    studentId: new RegExp(`^${escapeRegExp(prefix)}\\d+$`),
  })
    .sort({ studentId: -1 })
    .select('studentId')
    .lean();

  const latestNumber = Number.parseInt((latestStudent?.studentId || '').replace(prefix, ''), 10) || 0;
  let nextNumber = latestNumber + 1;
  let nextId = `${prefix}${String(nextNumber).padStart(4, '0')}`;

  while (await StudentRegistration.exists({ studentId: nextId })) {
    nextNumber += 1;
    nextId = `${prefix}${String(nextNumber).padStart(4, '0')}`;
  }

  return nextId;
};

const buildPayload = (body = {}) => {
  const classCompleted = normalizeBoolean(body.classCompleted);
  const classCompletionStatus = normalizeClassCompletionStatus(body.classCompletionStatus || body.classStatus, classCompleted);

  return {
    clientLocalId: body.clientLocalId || body.id || undefined,
    studentId: (body.studentId || body.studentID || body.registrationNo || '').toString().trim(),
    fullName: body.fullName || body.studentName || body.name || '',
    email: body.email || '',
    phone: body.phone || body.phoneNumber || '',
    gender: body.gender || '',
    learningDepartment: body.learningDepartment || body.department || body.learningDept || '',
    program: body.program || body.course || body.trainingProgram || '',
    enrollmentDate: parseDate(body.enrollmentDate || body.registrationDate),
    examDate: parseDate(body.examDate || body.testDate),
    preferredTimeSlot: normalizeTimeSlot(body.preferredTimeSlot || body.timeSlot || body.section),
    readinessStatus: body.readinessStatus || body.readiness || 'Not assessed',
    paymentOption: normalizePaymentOption(body.paymentOption || body.paymentPlan),
    paymentStatus: normalizePaymentStatus(body.paymentStatus || body.payment),
    paymentBank: body.paymentBank || body.bankName || '',
    fsNumber: body.fsNumber || body.receiptFsNumber || body.receiptNumber || '',
    classCompleted: classCompletionStatus === 'Completed',
    classCompletionStatus,
    cocPaymentStatus: normalizeCocPaymentStatus(body.cocPaymentStatus || body.cocPayment),
    status: body.status || 'Active',
    notes: body.notes || '',
    registeredBy: body.registeredBy || body.registeredByName || body.csMember || body.createdByName || body.createdBy || 'Unknown CS member',
    registeredByEmail: body.registeredByEmail || body.registrarEmail || body.createdByEmail || '',
    updatedBy: body.updatedBy || '',
    updatedByEmail: body.updatedByEmail || '',
  };
};

const normalizeStudent = (student) => ({
  id: student._id,
  _id: student._id,
  clientLocalId: student.clientLocalId,
  studentId: student.studentId,
  fullName: student.fullName,
  email: student.email,
  phone: student.phone,
  gender: student.gender,
  learningDepartment: student.learningDepartment,
  program: student.program,
  enrollmentDate: student.enrollmentDate,
  examDate: student.examDate,
  preferredTimeSlot: student.preferredTimeSlot || 'Morning',
  readinessStatus: student.readinessStatus,
  paymentOption: student.paymentOption || 'Full Payment',
  paymentStatus: student.paymentStatus || 'Waiting',
  paymentBank: student.paymentBank || '',
  fsNumber: student.fsNumber || '',
  classCompleted: Boolean(student.classCompleted),
  classCompletionStatus: student.classCompletionStatus || (student.classCompleted ? 'Completed' : 'Not Completed'),
  cocPaymentStatus: student.cocPaymentStatus || 'Unpaid',
  status: student.status,
  notes: student.notes,
  registeredBy: student.registeredBy,
  registeredByEmail: student.registeredByEmail,
  updatedBy: student.updatedBy,
  updatedByEmail: student.updatedByEmail,
  createdAt: student.createdAt,
  updatedAt: student.updatedAt,
});

const getStudentRegistrations = async (req, res) => {
  try {
    const { department, status, readiness, payment, paymentOption, timeSlot, classCompletionStatus, cocPaymentStatus, search } = req.query;
    const query = {};

    if (department && department !== 'All') query.learningDepartment = department;
    if (status && status !== 'All') query.status = status;
    if (readiness && readiness !== 'All') query.readinessStatus = readiness;
    if (payment && payment !== 'All') query.paymentStatus = payment;
    if (paymentOption && paymentOption !== 'All') query.paymentOption = paymentOption;
    if (timeSlot && timeSlot !== 'All') query.preferredTimeSlot = timeSlot;
    if (classCompletionStatus && classCompletionStatus !== 'All') query.classCompletionStatus = classCompletionStatus;
    if (cocPaymentStatus && cocPaymentStatus !== 'All') query.cocPaymentStatus = cocPaymentStatus;
    if (search) {
      query.$or = [
        { fullName: new RegExp(search, 'i') },
        { studentId: new RegExp(search, 'i') },
        { email: new RegExp(search, 'i') },
        { phone: new RegExp(search, 'i') },
        { learningDepartment: new RegExp(search, 'i') },
        { program: new RegExp(search, 'i') },
        { preferredTimeSlot: new RegExp(search, 'i') },
        { paymentOption: new RegExp(search, 'i') },
        { paymentStatus: new RegExp(search, 'i') },
        { paymentBank: new RegExp(search, 'i') },
        { fsNumber: new RegExp(search, 'i') },
        { classCompletionStatus: new RegExp(search, 'i') },
        { cocPaymentStatus: new RegExp(search, 'i') },
        { registeredBy: new RegExp(search, 'i') },
      ];
    }

    const students = await StudentRegistration.find(query).sort({ createdAt: -1 }).lean();
    res.json({ success: true, data: students.map(normalizeStudent) });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to fetch student registrations', error: error.message });
  }
};

const createStudentRegistration = async (req, res) => {
  try {
    const payload = buildPayload(req.body);
    if (!payload.fullName || !payload.learningDepartment) {
      return res.status(400).json({ success: false, message: 'Student name and learning department are required.' });
    }

    if (!payload.studentId) {
      payload.studentId = await generateStudentId();
    }

    if (payload.clientLocalId) {
      const existing = await StudentRegistration.findOne({ clientLocalId: payload.clientLocalId });
      if (existing) {
        return res.status(200).json({ success: true, data: normalizeStudent(existing), message: 'Student registration already exists.' });
      }
    }

    const duplicateStudentId = await StudentRegistration.findOne({ studentId: payload.studentId });
    if (duplicateStudentId) {
      return res.status(409).json({
        success: false,
        message: `Student ID ${payload.studentId} is already assigned. Please use a different Student ID.`,
      });
    }

    const student = await StudentRegistration.create(payload);
    res.status(201).json({ success: true, data: normalizeStudent(student) });
  } catch (error) {
    if (error.code === 11000 && error.keyPattern?.studentId) {
      return res.status(409).json({
        success: false,
        message: 'This Student ID is already assigned. Please use a different Student ID.',
      });
    }
    res.status(500).json({ success: false, message: 'Failed to create student registration', error: error.message });
  }
};

const updateStudentRegistration = async (req, res) => {
  try {
    const payload = buildPayload(req.body);
    delete payload.clientLocalId;

    if (!payload.studentId) {
      return res.status(400).json({ success: false, message: 'Student ID is required when updating a registration.' });
    }

    const duplicateStudentId = await StudentRegistration.findOne({
      studentId: payload.studentId,
      _id: { $ne: req.params.id },
    });
    if (duplicateStudentId) {
      return res.status(409).json({
        success: false,
        message: `Student ID ${payload.studentId} is already assigned. Please use a different Student ID.`,
      });
    }

    const student = await StudentRegistration.findByIdAndUpdate(req.params.id, payload, {
      new: true,
      runValidators: true,
    });

    if (!student) {
      return res.status(404).json({ success: false, message: 'Student registration not found.' });
    }

    res.json({ success: true, data: normalizeStudent(student) });
  } catch (error) {
    if (error.code === 11000 && error.keyPattern?.studentId) {
      return res.status(409).json({
        success: false,
        message: 'This Student ID is already assigned. Please use a different Student ID.',
      });
    }
    res.status(500).json({ success: false, message: 'Failed to update student registration', error: error.message });
  }
};

const deleteStudentRegistration = async (req, res) => {
  try {
    const student = await StudentRegistration.findByIdAndDelete(req.params.id);
    if (!student) {
      return res.status(404).json({ success: false, message: 'Student registration not found.' });
    }
    res.json({ success: true, data: normalizeStudent(student) });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to delete student registration', error: error.message });
  }
};

module.exports = {
  getStudentRegistrations,
  createStudentRegistration,
  updateStudentRegistration,
  deleteStudentRegistration,
};
