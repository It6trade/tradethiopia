const { File } = require('node-fetch-native-with-agent');
const EmployeeWarning = require('../models/EmployeeWarning');
const Notification = require('../models/Notification');
const User = require('../models/user.model');
const { storage } = require('../config/appwriteClient');

const HR_ROLES = new Set(['hr', 'admin']);
const normalizeRole = (value = '') => String(value).trim().toLowerCase().replace(/[^a-z0-9]/g, '');
const isHr = (user) => HR_ROLES.has(normalizeRole(user?.role));
const CATEGORY_REASONS = {
  attendance: ['Repeated lateness', 'Unauthorized absence', 'Failure to report an absence', 'Leaving work early without permission', 'Excessive absence', 'Failure to follow attendance procedures', 'Other attendance issue'],
  respect_attitude: ['Disrespectful behavior', 'Insubordination', 'Unprofessional communication', 'Workplace conflict', 'Harassment or bullying', 'Failure to cooperate with colleagues', 'Failure to follow a supervisor instruction', 'Other behavior issue'],
  company_related: ['Company-policy violation', 'Negligence of assigned duties', 'Poor work performance', 'Misuse of company property', 'Damage or loss of company property', 'Confidentiality violation', 'Information-security violation', 'Unauthorized system access', 'Failure to meet assigned deadlines', 'Other company-related issue'],
};
const attachmentUrl = (id) => `https://cloud.appwrite.io/v1/storage/buckets/${process.env.APPWRITE_BUCKET_ID}/files/${id}/view?project=${process.env.APPWRITE_PROJECT_ID}`;
const present = (doc) => {
  const item = doc.toObject ? doc.toObject() : doc;
  const withUrl = (files = []) => files.map((file) => ({ ...file, url: attachmentUrl(file.fileId) }));
  return { ...item, attachments: withUrl(item.attachments), employeeResponse: { ...(item.employeeResponse || {}), attachments: withUrl(item.employeeResponse?.attachments) } };
};
const populate = (query) => query.populate('employee', 'fullName username email digitalId jobTitle role status').populate('issuedBy', 'fullName username role').populate('history.actor', 'fullName username role');
const referenceNumber = () => `WL-${new Date().getFullYear()}-${Date.now().toString().slice(-8).toUpperCase()}`;
const notify = (user, text, warningId, actionLabel, link = `/my-warnings?warning=${warningId}`) => Notification.create({ user, text, type: 'warning', link, metadata: { warningId, title: 'Confidential HR warning', actionLabel } });
const uploadFiles = async (files = []) => Promise.all(files.map(async (file) => {
  const uploaded = await storage.createFile({ bucketId: process.env.APPWRITE_BUCKET_ID, fileId: 'unique()', file: new File([file.buffer], `${Date.now()}-${file.originalname}`, { type: file.mimetype }) });
  return { fileId: uploaded.$id, originalName: file.originalname, mimeType: file.mimetype, size: file.size };
}));
const parsePayload = (body) => {
  if (typeof body.payload === 'string') return JSON.parse(body.payload);
  return body.payload || body;
};
const validate = (data) => {
  const required = ['employeeId', 'category', 'reason', 'level', 'incidentDate', 'incidentDescription', 'correctiveAction', 'consequences', 'responseDeadline'];
  const missing = required.filter((field) => !String(data[field] || '').trim());
  if (missing.length) return `Required fields missing: ${missing.join(', ')}`;
  if (!CATEGORY_REASONS[data.category]?.includes(data.reason)) return 'Select a valid warning category and reason.';
  if (!['first', 'second', 'final'].includes(data.level)) return 'Select a valid warning level.';
  if (new Date(data.responseDeadline) < new Date(data.incidentDate)) return 'Response deadline cannot be before the incident date.';
  return '';
};

exports.categories = (req, res) => res.json({ success: true, data: CATEGORY_REASONS });
exports.employees = async (req, res) => {
  if (!isHr(req.user)) return res.status(403).json({ message: 'HR access required.' });
  const users = await User.find({}).select('_id fullName username email digitalId jobTitle role status').sort({ fullName: 1, username: 1 });
  res.json({ success: true, data: users });
};
exports.create = async (req, res) => {
  try {
    if (!isHr(req.user)) return res.status(403).json({ message: 'HR access required.' });
    const data = parsePayload(req.body);
    const error = validate(data);
    if (error) return res.status(400).json({ message: error });
    const employee = await User.findById(data.employeeId);
    if (!employee) return res.status(404).json({ message: 'Employee not found.' });
    const attachments = await uploadFiles(req.files || []);
    const issueImmediately = data.issueNow === true || data.issueNow === 'true';
    const issuedAt = issueImmediately ? new Date() : null;
    const item = await EmployeeWarning.create({
      referenceNumber: referenceNumber(), employee: employee._id,
      employeeSnapshot: { fullName: employee.fullName, username: employee.username, email: employee.email, digitalId: employee.digitalId, jobTitle: employee.jobTitle, department: employee.jobTitle || employee.role },
      category: data.category, reason: data.reason, level: data.level, incidentDate: data.incidentDate, incidentTime: data.incidentTime,
      incidentDescription: data.incidentDescription, correctiveAction: data.correctiveAction, consequences: data.consequences,
      improvementDeadline: data.improvementDeadline || null, responseDeadline: data.responseDeadline, attachments,
      status: issueImmediately ? 'issued' : 'draft', issuedBy: issueImmediately ? req.user._id : null, issuedAt,
      history: [
        { action: 'draft_created', status: 'draft', actor: req.user._id, actorRole: req.user.role, note: 'Warning prepared by HR.' },
        ...(issueImmediately ? [{ action: 'issued', status: 'issued', actor: req.user._id, actorRole: req.user.role, note: 'Warning issued to the employee.' }] : []),
      ],
    });
    if (issueImmediately) {
      try {
        await notify(employee._id, 'A confidential HR warning requires your review and acknowledgement.', item._id, 'Review warning');
      } catch (notificationError) {
        console.error('Warning issued, but employee notification could not be created:', notificationError.message);
      }
    }
    res.status(201).json({ success: true, data: present(await populate(EmployeeWarning.findById(item._id))) });
  } catch (error) { res.status(500).json({ message: error.message }); }
};
exports.hrList = async (req, res) => {
  if (!isHr(req.user)) return res.status(403).json({ message: 'HR access required.' });
  const items = await populate(EmployeeWarning.find({}).sort({ createdAt: -1 }));
  res.json({ success: true, data: items.map(present) });
};
exports.mine = async (req, res) => {
  const items = await populate(EmployeeWarning.find({ employee: req.user._id, status: { $ne: 'draft' } }).sort({ createdAt: -1 }));
  res.json({ success: true, data: items.map(present) });
};
exports.details = async (req, res) => {
  const item = await populate(EmployeeWarning.findById(req.params.id));
  if (!item) return res.status(404).json({ message: 'Warning not found.' });
  if (!isHr(req.user) && String(item.employee._id) !== String(req.user._id)) return res.status(403).json({ message: 'You cannot view this warning.' });
  if (!isHr(req.user) && !item.viewedAt) { item.viewedAt = new Date(); item.history.push({ action: 'viewed', status: item.status, actor: req.user._id, actorRole: req.user.role }); await item.save(); }
  res.json({ success: true, data: present(item) });
};
exports.issue = async (req, res) => {
  if (!isHr(req.user)) return res.status(403).json({ message: 'HR access required.' });
  const item = await EmployeeWarning.findOne({ _id: req.params.id, status: 'draft' });
  if (!item) return res.status(409).json({ message: 'Only a draft warning can be issued.' });
  item.status = 'issued'; item.issuedBy = req.user._id; item.issuedAt = new Date();
  item.history.push({ action: 'issued', status: 'issued', actor: req.user._id, actorRole: req.user.role, note: String(req.body.note || '') });
  await item.save();
  try {
    await notify(item.employee, 'A confidential HR warning requires your review and acknowledgement.', item._id, 'Review warning');
  } catch (notificationError) {
    console.error('Warning issued, but employee notification could not be created:', notificationError.message);
  }
  res.json({ success: true, data: present(await populate(EmployeeWarning.findById(item._id))) });
};
exports.acknowledge = async (req, res) => {
  const item = await EmployeeWarning.findOne({ _id: req.params.id, employee: req.user._id, status: 'issued' });
  if (!item) return res.status(409).json({ message: 'This warning is not awaiting acknowledgement.' });
  item.status = 'acknowledged'; item.acknowledgedAt = new Date(); item.history.push({ action: 'acknowledged', status: item.status, actor: req.user._id, actorRole: req.user.role, note: 'Receipt acknowledged; acknowledgement does not indicate agreement.' }); await item.save();
  const hrs = await User.find({ role: { $in: ['HR', 'hr', 'admin'] }, status: 'active' }).select('_id');
  await Promise.all(hrs.map((hr) => notify(hr._id, `${req.user.fullName || req.user.username} acknowledged a warning.`, item._id, 'View warning', `/warnings?warning=${item._id}`)));
  res.json({ success: true, data: present(await populate(EmployeeWarning.findById(item._id))) });
};
exports.respond = async (req, res) => {
  const item = await EmployeeWarning.findOne({ _id: req.params.id, employee: req.user._id, status: { $in: ['issued', 'acknowledged'] } });
  if (!item) return res.status(409).json({ message: 'This warning cannot receive a response.' });
  const text = String(req.body.response || '').trim();
  if (!text) return res.status(400).json({ message: 'A written response is required.' });
  item.status = 'employee_responded'; item.employeeResponse = { text, attachments: await uploadFiles(req.files || []), submittedAt: new Date() };
  item.history.push({ action: 'employee_responded', status: item.status, actor: req.user._id, actorRole: req.user.role, note: 'Employee submitted a written response.' }); await item.save();
  const hrs = await User.find({ role: { $in: ['HR', 'hr', 'admin'] }, status: 'active' }).select('_id');
  await Promise.all(hrs.map((hr) => notify(hr._id, `${req.user.fullName || req.user.username} responded to a warning.`, item._id, 'Review response', `/warnings?warning=${item._id}`)));
  res.json({ success: true, data: present(await populate(EmployeeWarning.findById(item._id))) });
};
exports.close = async (req, res) => {
  if (!isHr(req.user)) return res.status(403).json({ message: 'HR access required.' });
  const status = String(req.body.status || ''); const note = String(req.body.note || '').trim();
  if (!['resolved', 'withdrawn'].includes(status) || !note) return res.status(400).json({ message: 'Resolution status and note are required.' });
  const item = await EmployeeWarning.findOne({ _id: req.params.id, status: { $in: ['issued', 'acknowledged', 'employee_responded'] } });
  if (!item) return res.status(409).json({ message: 'This warning is already closed or remains a draft.' });
  item.status = status; item.resolutionNote = note; item.resolvedAt = new Date(); item.history.push({ action: status, status, actor: req.user._id, actorRole: req.user.role, note }); await item.save();
  await notify(item.employee, `HR marked your warning as ${status}.`, item._id, 'View outcome');
  res.json({ success: true, data: present(await populate(EmployeeWarning.findById(item._id))) });
};
