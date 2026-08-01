export const ETHIOPIAN_REGIONS = [
  'Addis Ababa City Administration',
  'Afar',
  'Amhara',
  'Benishangul-Gumuz',
  'Central Ethiopia',
  'Dire Dawa City Administration',
  'Gambela',
  'Harari',
  'Oromia',
  'Sidama',
  'Somali',
  'South Ethiopia',
  'South West Ethiopia Peoples’ Region',
  'Tigray',
  'Outside Ethiopia',
];

const text = (value) => String(value || '').trim();
const phoneDigits = (value) => text(value).replace(/[\s()-]/g, '');
const isEthiopianPhone = (value) => /^(?:\+251|0)[1-9]\d{8}$/.test(phoneDigits(value));
const isEmail = (value) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(text(value));
const isName = (value) => /^[\p{L}][\p{L}\p{M}'’.-]*(?:\s+[\p{L}][\p{L}\p{M}'’.-]*)+$/u.test(text(value));

export const validateEmployeePersonalInfo = ({ profile = {}, record = {} }, { submit = false, section = null } = {}) => {
  const errors = {};
  const sectionRequired = (targetSection) => submit || section === targetSection;
  const required = (path, value, label, targetSection) => {
    if (sectionRequired(targetSection) && !text(value)) errors[path] = `${label} is required.`;
  };

  required('profile.fullName', profile.fullName, 'Full name', 'A');
  required('record.dateOfBirth', record.dateOfBirth, 'Date of birth', 'A');
  required('record.nationality', record.nationality, 'Nationality', 'A');
  required('record.nationalIdOrPassport', record.nationalIdOrPassport, 'National ID or passport number', 'A');
  required('record.maritalStatus', record.maritalStatus, 'Marital status', 'A');
  required('profile.phone', profile.phone, 'Phone number', 'A');
  required('record.presentAddress.region', record.presentAddress?.region, 'Present address region', 'A');
  required('record.presentAddress.cityOrTown', record.presentAddress?.cityOrTown, 'City or town', 'A');
  required('record.emergencyContact.fullName', record.emergencyContact?.fullName, 'Emergency contact name', 'D');
  required('record.emergencyContact.relationship', record.emergencyContact?.relationship, 'Emergency contact relationship', 'D');
  required('record.emergencyContact.phone', record.emergencyContact?.phone, 'Emergency contact phone', 'D');

  if (text(profile.fullName) && !isName(profile.fullName)) {
    errors['profile.fullName'] = 'Enter at least two names using letters.';
  }
  if (record.dateOfBirth) {
    const birthDate = new Date(`${record.dateOfBirth}T00:00:00`);
    const today = new Date();
    const oldest = new Date(today.getFullYear() - 100, today.getMonth(), today.getDate());
    if (Number.isNaN(birthDate.getTime()) || birthDate > today || birthDate < oldest) {
      errors['record.dateOfBirth'] = 'Enter a valid date of birth (not in the future).';
    }
  }
  if (text(profile.phone) && !isEthiopianPhone(profile.phone)) {
    errors['profile.phone'] = 'Use an Ethiopian number such as 0911234567 or +251911234567.';
  }
  if (text(profile.altEmail) && !isEmail(profile.altEmail)) {
    errors['profile.altEmail'] = 'Enter a valid email address.';
  }
  if (text(record.nationalIdOrPassport) && !/^[\p{L}\d][\p{L}\d\s/-]{3,29}$/u.test(text(record.nationalIdOrPassport))) {
    errors['record.nationalIdOrPassport'] = 'Use 4–30 letters or numbers as printed on the ID or passport.';
  }
  if (text(record.tinNumber) && !/^\d{10}$/.test(text(record.tinNumber))) {
    errors['record.tinNumber'] = 'Ethiopian TIN must contain exactly 10 digits.';
  }
  if (text(record.salaryBankAccountNumber) && !/^\d{6,24}$/.test(text(record.salaryBankAccountNumber).replace(/\s/g, ''))) {
    errors['record.salaryBankAccountNumber'] = 'Enter 6–24 digits without letters or punctuation.';
  }
  ['phone', 'alternativePhone'].forEach((key) => {
    const value = record.emergencyContact?.[key];
    if (text(value) && !isEthiopianPhone(value)) {
      errors[`record.emergencyContact.${key}`] = 'Use an Ethiopian number such as 0911234567 or +251911234567.';
    }
  });
  if (text(record.emergencyContact?.fullName) && !isName(record.emergencyContact.fullName)) {
    errors['record.emergencyContact.fullName'] = 'Enter at least two names using letters.';
  }
  (record.educationRecords || []).forEach((item, index) => {
    const values = [item.level, item.institution, item.fieldOfStudy, item.graduationYear];
    const started = values.some((value) => text(value));
    if (!started) return;
    ['level', 'institution', 'fieldOfStudy', 'graduationYear'].forEach((key) => {
      if (!text(item[key])) errors[`record.educationRecords.${index}.${key}`] = 'Complete this education record.';
    });
    const year = Number(item.graduationYear);
    const currentYear = new Date().getFullYear();
    if (text(item.graduationYear) && (!/^\d{4}$/.test(text(item.graduationYear)) || year < 1900 || year > currentYear + 10)) {
      errors[`record.educationRecords.${index}.graduationYear`] = `Use a Gregorian year from 1900 to ${currentYear + 10}.`;
    }
  });
  if ((submit || section === 'declaration') && !record.declarationAccepted) errors['record.declarationAccepted'] = 'Accept the declaration before saving this section.';

  if (section === 'upload') return {};
  if (!section || submit) return errors;
  const prefixes = {
    A: ['profile.fullName', 'profile.phone', 'profile.altEmail', 'record.dateOfBirth', 'record.nationality', 'record.maritalStatus', 'record.nationalIdOrPassport', 'record.placeOfBirth.', 'record.presentAddress.'],
    B: ['record.tinNumber', 'record.salaryBankAccountNumber'],
    C: ['profile.education', 'record.educationRecords.'],
    D: ['record.emergencyContact.'],
    E: ['record.documentChecklist.'],
    declaration: ['record.declarationAccepted'],
  }[section] || [];
  return Object.fromEntries(Object.entries(errors).filter(([path]) => prefixes.some((prefix) => path === prefix || path.startsWith(prefix))));
};
