const text = (value) => String(value || '').trim();
const phoneDigits = (value) => text(value).replace(/[\s()-]/g, '');
const isEthiopianPhone = (value) => /^(?:\+251|0)[1-9]\d{8}$/.test(phoneDigits(value));
const isEmail = (value) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(text(value));
const isName = (value) => /^[\p{L}][\p{L}\p{M}'’.-]*(?:\s+[\p{L}][\p{L}\p{M}'’.-]*)+$/u.test(text(value));

const validateEmployeePersonalInfo = ({ profile = {}, record = {} }, { submit = false, section = null } = {}) => {
  const errors = [];
  const add = (field, message) => errors.push({ field, message });
  const sectionRequired = (targetSection) => submit || section === targetSection;
  const required = (field, value, label, targetSection) => {
    if (sectionRequired(targetSection) && !text(value)) add(field, `${label} is required.`);
  };

  required('profile.fullName', profile.fullName, 'Full name', 'A');
  required('dateOfBirth', record.dateOfBirth, 'Date of birth', 'A');
  required('nationality', record.nationality, 'Nationality', 'A');
  required('nationalIdOrPassport', record.nationalIdOrPassport, 'National ID or passport number', 'A');
  required('maritalStatus', record.maritalStatus, 'Marital status', 'A');
  required('profile.phone', profile.phone, 'Phone number', 'A');
  required('presentAddress.region', record.presentAddress?.region, 'Present address region', 'A');
  required('presentAddress.cityOrTown', record.presentAddress?.cityOrTown, 'City or town', 'A');
  required('emergencyContact.fullName', record.emergencyContact?.fullName, 'Emergency contact name', 'D');
  required('emergencyContact.relationship', record.emergencyContact?.relationship, 'Emergency contact relationship', 'D');
  required('emergencyContact.phone', record.emergencyContact?.phone, 'Emergency contact phone', 'D');

  if (text(profile.fullName) && !isName(profile.fullName)) add('profile.fullName', 'Enter at least two names using letters.');
  if (record.dateOfBirth) {
    const birthDate = new Date(`${record.dateOfBirth}T00:00:00`);
    const today = new Date();
    const oldest = new Date(today.getFullYear() - 100, today.getMonth(), today.getDate());
    if (Number.isNaN(birthDate.getTime()) || birthDate > today || birthDate < oldest) add('dateOfBirth', 'Enter a valid date of birth.');
  }
  if (text(profile.phone) && !isEthiopianPhone(profile.phone)) add('profile.phone', 'Enter a valid Ethiopian phone number.');
  if (text(profile.altEmail) && !isEmail(profile.altEmail)) add('profile.altEmail', 'Enter a valid personal email address.');
  if (text(record.nationalIdOrPassport) && !/^[\p{L}\d][\p{L}\d\s/-]{3,29}$/u.test(text(record.nationalIdOrPassport))) add('nationalIdOrPassport', 'Enter a valid ID or passport number.');
  if (text(record.tinNumber) && !/^\d{10}$/.test(text(record.tinNumber))) add('tinNumber', 'TIN must contain exactly 10 digits.');
  if (text(record.salaryBankAccountNumber) && !/^\d{6,24}$/.test(text(record.salaryBankAccountNumber).replace(/\s/g, ''))) add('salaryBankAccountNumber', 'Bank account number must contain 6–24 digits.');
  ['phone', 'alternativePhone'].forEach((key) => {
    const value = record.emergencyContact?.[key];
    if (text(value) && !isEthiopianPhone(value)) add(`emergencyContact.${key}`, 'Enter a valid Ethiopian phone number.');
  });
  if (text(record.emergencyContact?.fullName) && !isName(record.emergencyContact.fullName)) add('emergencyContact.fullName', 'Enter at least two contact names using letters.');
  (record.educationRecords || []).forEach((item, index) => {
    const values = [item.level, item.institution, item.fieldOfStudy, item.graduationYear];
    if (!values.some((value) => text(value))) return;
    ['level', 'institution', 'fieldOfStudy', 'graduationYear'].forEach((key) => {
      if (!text(item[key])) add(`educationRecords.${index}.${key}`, 'Complete this education record.');
    });
    const year = Number(item.graduationYear);
    const currentYear = new Date().getFullYear();
    if (text(item.graduationYear) && (!/^\d{4}$/.test(text(item.graduationYear)) || year < 1900 || year > currentYear + 10)) add(`educationRecords.${index}.graduationYear`, 'Enter a valid Gregorian graduation year.');
  });
  if ((submit || section === 'declaration') && !record.declarationAccepted) add('declarationAccepted', 'Accept the declaration before saving this section.');

  if (section === 'upload') return [];
  if (!section || submit) return errors;
  const prefixes = {
    A: ['profile.fullName', 'profile.phone', 'profile.altEmail', 'dateOfBirth', 'nationality', 'maritalStatus', 'nationalIdOrPassport', 'placeOfBirth.', 'presentAddress.'],
    B: ['tinNumber', 'salaryBankAccountNumber'],
    C: ['profile.education', 'educationRecords.'],
    D: ['emergencyContact.'],
    E: ['documentChecklist.'],
    declaration: ['declarationAccepted'],
  }[section] || [];
  return errors.filter(({ field }) => prefixes.some((prefix) => field === prefix || field.startsWith(prefix)));
};

module.exports = { validateEmployeePersonalInfo };
