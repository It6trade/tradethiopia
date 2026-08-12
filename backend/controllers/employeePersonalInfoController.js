const mongoose = require('mongoose');
const User = require('../models/user.model');
const Document = require('../models/Document');
const Notification = require('../models/Notification');
const { validateEmployeePersonalInfo } = require('../utils/employeePersonalInfoValidation');

const HR_ROLES = new Set(['hr', 'admin']);
const normalizeRole = (value) => String(value || '').trim().toLowerCase();
const isHr = (user) => HR_ROLES.has(normalizeRole(user?.role));
const hasText = (value) => String(value || '').trim().length > 0;

const createNotification = async (req, userId, { text, link, title, actionLabel, targetId }) => {
  if (!userId) return;
  const notification = await Notification.create({
    user: userId,
    text,
    type: 'request',
    link,
    targetId,
    metadata: { title, actionLabel, workflow: 'employee-personal-information' },
  });
  const socketId = req.app.get('connectedUsers')?.get?.(String(userId));
  const io = req.app.get('io');
  if (io && socketId) io.to(socketId).emit('newNotification', notification.toObject());
};

const notifySafely = async (notifications, context) => {
  const results = await Promise.allSettled(notifications);
  results.forEach((result) => {
    if (result.status === 'rejected') console.error(`${context} notification failed:`, result.reason);
  });
};

const editableFields = [
  'dateOfBirth', 'nationality', 'maritalStatus', 'nationalIdOrPassport',
  'placeOfBirth', 'presentAddress', 'tinNumber', 'salaryBankAccountNumber',
  'educationRecords', 'emergencyContact', 'documentChecklist', 'declarationAccepted',
];

const cleanRecord = (input = {}) => {
  const clean = {};
  editableFields.forEach((key) => {
    if (Object.prototype.hasOwnProperty.call(input, key)) clean[key] = input[key];
  });
  if (Array.isArray(clean.educationRecords)) {
    clean.educationRecords = clean.educationRecords
      .slice(0, 10)
      .map((item) => ({
        level: String(item?.level || '').trim(),
        institution: String(item?.institution || '').trim(),
        fieldOfStudy: String(item?.fieldOfStudy || '').trim(),
        graduationYear: String(item?.graduationYear || '').trim(),
      }))
      .filter((item) => Object.values(item).some(hasText));
  }
  return clean;
};

const cleanEmployeeProfile = (input = {}) => {
  const profile = input.profile || {};
  const clean = {};
  ['fullName', 'phone', 'altEmail', 'location', 'education'].forEach((key) => {
    if (Object.prototype.hasOwnProperty.call(profile, key)) {
      clean[key] = String(profile[key] || '').trim();
    }
  });
  if (Object.prototype.hasOwnProperty.call(profile, 'gender')) {
    const gender = String(profile.gender || '').trim().toLowerCase();
    if (['male', 'female'].includes(gender)) clean.gender = gender;
  }
  return clean;
};

const documentKey = (document) => {
  const text = `${document.title || ''} ${document.category?.name || ''}`.toLowerCase();
  if (/national|passport|identification|\bid\b/.test(text)) return 'nationalId';
  if (/curriculum|resume|\bcv\b/.test(text)) return 'cv';
  if (/medical|fitness/.test(text)) return 'medicalCertificate';
  if (/contract|offer letter/.test(text)) return 'employmentContract';
  if (/education|certificate|credential|degree|diploma/.test(text)) return 'educationalCredentials';
  if (/photo|photograph/.test(text)) return 'passportPhoto';
  if (/police|conduct|clearance/.test(text)) return 'policeClearance';
  if (/bank|account detail/.test(text)) return 'bankAccountDetails';
  return null;
};

const relatedDocuments = async (user) => {
  const names = [user.fullName, user.username].filter(Boolean);
  const filters = [{ userId: user._id }, ...names.map((name) => ({
    employeeName: { $regex: `^${String(name).replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, $options: 'i' },
  }))];
  return Document.find({ $or: filters }).populate('category', 'name').sort({ createdAt: -1 }).lean();
};

// The previous employee form stored the emergency phone in User.altPhone.
// Keep that legacy value visible until the employee saves the richer contact
// record, without writing inferred data back to the database.
const personalInformationForDisplay = (user) => {
  const stored = user.personalInformation?.toObject
    ? user.personalInformation.toObject()
    : (user.personalInformation || {});
  const emergencyContact = { ...(stored.emergencyContact || {}) };

  if (!hasText(emergencyContact.phone) && hasText(user.altPhone)) {
    emergencyContact.phone = user.altPhone;
  }

  return { ...stored, emergencyContact };
};

const present = async (user) => {
  const documents = await relatedDocuments(user);
  const linkedChecklist = {};
  documents.forEach((document) => {
    const key = documentKey(document);
    if (key) linkedChecklist[key] = true;
  });
  const record = personalInformationForDisplay(user);
  return {
    user: {
      _id: user._id,
      fullName: user.fullName,
      username: user.username,
      email: user.email,
      gender: user.gender,
      phone: user.phone,
      altEmail: user.altEmail,
      jobTitle: user.jobTitle,
      role: user.role,
      status: user.status,
      infoStatus: user.infoStatus,
      employmentType: user.employmentType,
      hireDate: user.hireDate,
      salary: user.salary,
      education: user.education,
      location: user.location,
      digitalId: user.digitalId,
    },
    record,
    linkedChecklist,
    documents: documents.map((document) => ({
      _id: document._id,
      title: document.title,
      category: document.category?.name || '',
      createdAt: document.createdAt,
      checklistKey: documentKey(document),
    })),
  };
};

const findAccessibleUser = async (req, res, id) => {
  if (!mongoose.Types.ObjectId.isValid(id)) {
    res.status(400).json({ success: false, message: 'Invalid employee ID.' });
    return null;
  }
  if (String(req.user._id) !== String(id) && !isHr(req.user)) {
    res.status(403).json({ success: false, message: 'You cannot access another employee’s confidential form.' });
    return null;
  }
  const user = await User.findById(id)
    .select('-password')
    .populate('personalInformation.hrDecision.decidedBy', 'fullName username email role')
    .populate('personalInformation.history.actor', 'fullName username role');
  if (!user) res.status(404).json({ success: false, message: 'Employee not found.' });
  return user;
};

exports.getMine = async (req, res) => {
  try {
    const user = await findAccessibleUser(req, res, req.user._id);
    if (user) res.json({ success: true, data: await present(user) });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message || 'Unable to load the form.' });
  }
};

exports.getForHr = async (req, res) => {
  try {
    if (!isHr(req.user)) return res.status(403).json({ success: false, message: 'HR access required.' });
    const user = await findAccessibleUser(req, res, req.params.id);
    if (user) res.json({ success: true, data: await present(user) });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message || 'Unable to load the form.' });
  }
};

exports.saveMine = async (req, res) => {
  try {
    const clean = cleanRecord(req.body);
    const profile = cleanEmployeeProfile(req.body);
    const validationSection = ['A', 'B', 'C', 'D', 'E', 'declaration', 'upload'].includes(req.body.validationSection)
      ? req.body.validationSection
      : null;
    const validationErrors = validateEmployeePersonalInfo({ profile, record: clean }, { section: validationSection });
    if (validationErrors.length) {
      return res.status(400).json({
        success: false,
        message: validationErrors[0].message,
        errors: validationErrors,
      });
    }
    const set = {};
    Object.entries(clean).forEach(([key, value]) => { set[`personalInformation.${key}`] = value; });
    Object.entries(profile).forEach(([key, value]) => { set[key] = value; });
    set['personalInformation.status'] = 'draft';
    const user = await User.findOneAndUpdate(
      { _id: req.user._id, 'personalInformation.status': { $ne: 'approved' } },
      {
        $set: set,
        $push: {
          'personalInformation.history': {
            action: 'draft_saved', actor: req.user._id, actorRole: req.user.role,
            note: 'Employee saved the personal information form.',
          },
        },
      },
      { new: true, runValidators: true }
    ).select('-password');
    if (!user) {
      return res.status(409).json({ success: false, message: 'This employee record has been approved by HR and is locked.' });
    }
    res.json({ success: true, message: 'Draft saved.', data: await present(user) });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message || 'Unable to save the draft.' });
  }
};

exports.submitMine = async (req, res) => {
  try {
    const clean = cleanRecord(req.body);
    const profile = cleanEmployeeProfile(req.body);
    const validationErrors = validateEmployeePersonalInfo({ profile, record: clean }, { submit: true });
    if (validationErrors.length) {
      return res.status(400).json({
        success: false,
        message: `Please correct ${validationErrors.length} form field${validationErrors.length === 1 ? '' : 's'} before submitting.`,
        errors: validationErrors,
      });
    }
    const set = {};
    Object.entries(clean).forEach(([key, value]) => { set[`personalInformation.${key}`] = value; });
    Object.entries(profile).forEach(([key, value]) => { set[key] = value; });
    set['personalInformation.status'] = 'submitted';
    set['personalInformation.submittedAt'] = new Date();
    set['personalInformation.hrDecision'] = {
      decidedBy: null, reviewerName: '', reviewerEmail: '', decision: '', note: '', decidedAt: null,
    };
    // Submission enters HR review. Only hrDecision may change this to active.
    set.infoStatus = 'pending';
    const user = await User.findOneAndUpdate(
      { _id: req.user._id, 'personalInformation.status': { $ne: 'approved' } },
      {
        $set: set,
        $push: {
          'personalInformation.history': {
            action: 'submitted', actor: req.user._id, actorRole: req.user.role,
            note: 'Employee submitted the form for HR verification.',
          },
        },
      },
      { new: true, runValidators: true }
    ).select('-password');
    if (!user) {
      return res.status(409).json({ success: false, message: 'This employee record has already been approved by HR.' });
    }
    const hrUsers = await User.find({ role: { $in: ['HR', 'hr', 'admin'] }, status: 'active' }).select('_id');
    const employeeName = user.fullName || user.username || 'An employee';
    await notifySafely(
      hrUsers.map((hrUser) => createNotification(req, hrUser._id, {
        text: `${employeeName} submitted a personal information form for HR verification.`,
        link: `/employee-info?employeeId=${user._id}`,
        title: 'Employee form awaiting verification',
        actionLabel: 'Review employee form',
        targetId: user._id,
      })),
      'Personal information submission'
    );
    res.json({ success: true, message: 'Form submitted to HR.', data: await present(user) });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message || 'Unable to submit the form.' });
  }
};

exports.hrDecision = async (req, res) => {
  try {
    if (!isHr(req.user)) return res.status(403).json({ success: false, message: 'HR access required.' });
    const decision = String(req.body.decision || '').toLowerCase();
    const note = String(req.body.note || '').trim();
    if (!['approved', 'returned'].includes(decision)) {
      return res.status(400).json({ success: false, message: 'Decision must be approved or returned.' });
    }
    if (decision === 'returned' && !note) {
      return res.status(400).json({ success: false, message: 'Explain what the employee needs to correct.' });
    }
    const eligibleStatuses = decision === 'returned' ? ['submitted', 'returned'] : ['submitted'];
    const now = new Date();
    const user = await User.findOneAndUpdate(
      { _id: req.params.id, 'personalInformation.status': { $in: eligibleStatuses } },
      {
        $set: {
          'personalInformation.status': decision,
          'personalInformation.hrDecision': {
            decidedBy: req.user._id,
            // HR navigation consistently identifies accounts by username. Keep
            // a decision-time snapshot so later profile edits cannot rewrite
            // the audit signature shown on an approved employee record.
            reviewerName: req.user.username || req.user.fullName || req.user.email,
            reviewerEmail: String(req.user.email || '').trim().toLowerCase(),
            decision,
            note,
            decidedAt: now,
          },
          // Keep the established login/onboarding gate synchronized with the
          // personal-information workflow. Approved employees advance to the
          // next onboarding stage; returned forms remain pending.
          infoStatus: decision === 'approved' ? 'active' : 'pending',
        },
        $push: {
          'personalInformation.history': {
            action: `hr_${decision}`, actor: req.user._id, actorRole: req.user.role, note, occurredAt: now,
          },
        },
      },
      { new: true, runValidators: true }
    ).select('-password');
    if (!user) {
      const existing = await User.findById(req.params.id).select('personalInformation.status');
      if (!existing) return res.status(404).json({ success: false, message: 'Employee not found.' });
      const status = existing.personalInformation?.status || 'draft';
      return res.status(409).json({
        success: false,
        message: decision === 'approved' && status === 'returned'
          ? 'The employee must resubmit the corrected form before HR can approve it.'
          : `This form cannot receive that decision while its status is ${status}.`,
      });
    }
    await user.populate('personalInformation.hrDecision.decidedBy', 'fullName username email role');
    await notifySafely([
      createNotification(req, user._id, {
        text: decision === 'approved'
          ? 'HR approved your personal information form.'
          : `HR returned your personal information form for correction: ${note}`,
        link: '/employee-info',
        title: decision === 'approved' ? 'Employee form approved' : 'Corrections required',
        actionLabel: decision === 'approved' ? 'View approved form' : 'Review corrections',
        targetId: user._id,
      }),
    ], 'Personal information HR decision');
    res.json({ success: true, message: decision === 'approved' ? 'Employee form approved.' : 'Form returned for correction.', data: await present(user) });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message || 'Unable to record the HR decision.' });
  }
};
