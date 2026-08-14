const test = require('node:test');
const assert = require('node:assert/strict');
const { validateEmployeePersonalInfo } = require('../utils/employeePersonalInfoValidation');

const validData = () => ({
  profile: { fullName: 'Amanuel Andemo', phone: '+251911234567', altEmail: 'amanuel@example.com' },
  record: {
    dateOfBirth: '1995-04-20', nationality: 'Ethiopian', maritalStatus: 'single',
    nationalIdOrPassport: 'ID-12345678', presentAddress: { region: 'Oromia', cityOrTown: 'Adama' },
    tinNumber: '0123456789', salaryBankAccountNumber: '1000123456789',
    educationRecords: [{ level: 'Bachelor’s Degree', institution: 'Addis Ababa University', fieldOfStudy: 'IT', graduationYear: '2018' }],
    emergencyContact: { fullName: 'Kebede Andemo', relationship: 'Parent', phone: '0911223344', alternativePhone: '' },
    declarationAccepted: true,
  },
});

test('accepts a complete Ethiopian employee record', () => {
  assert.deepEqual(validateEmployeePersonalInfo(validData(), { submit: true }), []);
});

test('rejects malformed Ethiopian identifiers and contact data', () => {
  const data = validData();
  data.profile.phone = '123';
  data.record.tinNumber = '12A';
  data.record.emergencyContact.phone = '+12025550123';
  const fields = validateEmployeePersonalInfo(data).map(({ field }) => field);
  assert.ok(fields.includes('profile.phone'));
  assert.ok(fields.includes('tinNumber'));
  assert.ok(fields.includes('emergencyContact.phone'));
});

test('requires address, relationship, and declaration on submission only', () => {
  const data = validData();
  data.record.presentAddress.region = '';
  data.record.emergencyContact.relationship = '';
  data.record.declarationAccepted = false;
  assert.equal(validateEmployeePersonalInfo(data).length, 0);
  const fields = validateEmployeePersonalInfo(data, { submit: true }).map(({ field }) => field);
  assert.ok(fields.includes('presentAddress.region'));
  assert.ok(fields.includes('emergencyContact.relationship'));
  assert.ok(fields.includes('declarationAccepted'));
});

test('section validation reports only fields belonging to the selected section', () => {
  const data = validData();
  data.profile.phone = 'invalid';
  data.record.educationRecords[0].institution = '';
  const sectionAFields = validateEmployeePersonalInfo(data, { section: 'A' }).map(({ field }) => field);
  assert.ok(sectionAFields.includes('profile.phone'));
  assert.ok(!sectionAFields.some((field) => field.startsWith('educationRecords.')));
  const sectionCFields = validateEmployeePersonalInfo(data, { section: 'C' }).map(({ field }) => field);
  assert.ok(sectionCFields.includes('educationRecords.0.institution'));
  assert.ok(!sectionCFields.includes('profile.phone'));
});

test('upload draft preservation is not blocked by unfinished later sections', () => {
  const data = validData();
  data.record.educationRecords[0].institution = '';
  assert.deepEqual(validateEmployeePersonalInfo(data, { section: 'upload' }), []);
});
