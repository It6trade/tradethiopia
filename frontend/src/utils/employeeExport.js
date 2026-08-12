const clean = (value) => {
  if (value === null || value === undefined) return '';
  const result = String(value).trim();
  return result && result !== '0' ? result : '';
};

const dateText = (value) => {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  return new globalThis.Intl.DateTimeFormat('en-GB', {
    day: '2-digit', month: 'long', year: 'numeric',
  }).format(date);
};

const moneyText = (value) => {
  if (value === '' || value === null || value === undefined || Number.isNaN(Number(value))) return '';
  return new globalThis.Intl.NumberFormat('en-ET', {
    style: 'currency', currency: 'ETB', maximumFractionDigits: 2,
  }).format(Number(value));
};

const addressText = (address = {}) => [
  address.houseNumber && `House ${address.houseNumber}`,
  address.kebele && `Kebele ${address.kebele}`,
  address.subCityOrWoreda,
  address.cityOrTown,
  address.region,
].filter(Boolean).join(', ');

const fields = (items) => items
  .map(([label, value]) => [label, clean(value)])
  .filter(([, value]) => Boolean(value));

export const buildEmployeeExportData = (employee = {}, personalData = {}) => {
  const personalUser = personalData.user || {};
  const record = personalData.record || {};
  const source = { ...employee, ...personalUser };
  const employeeName = source.fullName || source.username || 'Employee';
  const employeeId = source.digitalId || `TE-${String(source._id || '').slice(-6).toUpperCase()}`;
  const reviewer = record.hrDecision?.reviewerName
    || record.hrDecision?.decidedBy?.username
    || record.hrDecision?.decidedBy?.fullName;
  const educationRows = (record.educationRecords || []).map((item, index) => [
    `Qualification ${index + 1}`,
    [item.level, item.fieldOfStudy, item.institution, item.graduationYear].filter(Boolean).join(' — '),
  ]);

  return {
    employeeName,
    fileName: `${employeeName}-${employeeId}`.replace(/[^\p{L}\p{N}._-]+/gu, '-').replace(/^-|-$/g, ''),
    generatedAt: new Date(),
    form: { employee: source, record, employeeId, reviewer },
    sections: [
      {
        title: 'Identity and contact',
        rows: fields([
          ['Full name', employeeName],
          ['Employee ID', employeeId],
          ['Date of birth', dateText(record.dateOfBirth)],
          ['Gender', source.gender],
          ['Nationality', record.nationality],
          ['Marital status', record.maritalStatus],
          ['National ID / Passport', record.nationalIdOrPassport],
          ['Work email', source.email],
          ['Personal email', source.altEmail],
          ['Phone number', source.phone],
          ['Present address', addressText(record.presentAddress) || source.location],
        ]),
      },
      {
        title: 'Employment and payroll',
        rows: fields([
          ['Job title', source.jobTitle],
          ['Department', source.role],
          ['Employment type', source.employmentType],
          ['Hire date', dateText(source.hireDate)],
          ['Employment status', source.status],
          ['Basic salary', moneyText(source.salary)],
          ['TIN number', record.tinNumber],
          ['Salary bank account', record.salaryBankAccountNumber],
        ]),
      },
      {
        title: 'Education',
        rows: fields([
          ['Education summary', source.education],
          ...educationRows,
        ]),
      },
      {
        title: 'Emergency contact',
        rows: fields([
          ['Full name', record.emergencyContact?.fullName],
          ['Relationship', record.emergencyContact?.relationship],
          ['Phone number', record.emergencyContact?.phone],
          ['Alternative phone', record.emergencyContact?.alternativePhone],
          ['Address', record.emergencyContact?.address],
        ]),
      },
      {
        title: 'HR review',
        rows: fields([
          ['Form status', record.status],
          ['Submitted on', dateText(record.submittedAt)],
          ['Reviewed by', reviewer],
          ['Reviewer email', record.hrDecision?.reviewerEmail || record.hrDecision?.decidedBy?.email],
          ['Decision date', dateText(record.hrDecision?.decidedAt)],
          ['HR note', record.hrDecision?.note],
        ]),
      },
    ].filter((section) => section.rows.length > 0),
  };
};

const downloadBlob = (blob, fileName) => {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
};

const escapeHtml = (value) => String(value).replace(/[&<>"']/g, (character) => ({
  '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;',
}[character]));

const display = (value, fallback = 'Not provided') => escapeHtml(clean(value) || fallback);
const field = (label, value, options = {}) => `<div class="form-field">
  <div class="field-label">${escapeHtml(label)}${options.required ? ' <b>*</b>' : ''}</div>
  <div class="field-value">${display(value, '')}</div>
  ${options.helper ? `<div class="helper">${escapeHtml(options.helper)}</div>` : ''}
</div>`;
const row = (...cells) => `<table class="field-table"><tr>${cells.map((cell) => `<td>${cell}</td>`).join('')}</tr></table>`;
const sectionBar = (code, title) => `<div class="section-bar">${code ? `SECTION ${code} — ` : ''}${escapeHtml(title)}</div>`;
const subheading = (title) => `<div class="subheading">${escapeHtml(title)}</div>`;

const blobToDataUrl = (blob) => new Promise((resolve, reject) => {
  const reader = new FileReader();
  reader.onload = () => resolve(reader.result);
  reader.onerror = reject;
  reader.readAsDataURL(blob);
});

const embeddedLogo = async () => {
  const response = await fetch('/brand/tradethiopia-logo.png');
  if (!response.ok) return '';
  return blobToDataUrl(await response.blob());
};

const formCss = `
  *{box-sizing:border-box} body{margin:0;background:#eef3f6;color:#263746;font-family:Arial,Helvetica,sans-serif}
  .export-page{width:794px;min-height:1123px;margin:0 auto 18px;padding:34px 38px 42px;background:#fff;position:relative;page-break-after:always}
  .export-page:last-child{page-break-after:auto}.paper-header{text-align:center;padding-bottom:16px}.logo{width:430px;height:145px;object-fit:cover;object-position:center 38%}
  h1{font-family:Georgia,'Times New Roman',serif;color:#294f73;font-size:17px;letter-spacing:.04em;margin:5px 0 3px}.subtitle{font-size:8px;color:#718096}
  .section-bar{margin:20px 0 14px;padding:8px 12px;background:#315f86;color:#fff;font-family:Georgia,'Times New Roman',serif;font-size:10px;font-weight:800;letter-spacing:.07em}
  .subheading{margin:16px 0 8px;color:#365f7e;font-size:9px;font-weight:800;letter-spacing:.12em}.field-table{width:100%;table-layout:fixed;border-collapse:collapse;margin:0 0 10px}.field-table td{vertical-align:top;padding:0 10px 0 0}.field-table td:last-child{padding-right:0}
  .form-field{min-width:0}.field-label{font-size:8px;font-weight:700;color:#263746;margin-bottom:2px;min-height:12px}.field-label>b{color:#b83232}
  .field-value{min-height:25px;border:0;border-bottom:1px solid #cdd9e2;border-radius:0;background:transparent;padding:5px 4px;font-size:9px;color:#263746;overflow-wrap:anywhere}.helper{font-size:6.5px;color:#718096;margin-top:3px;line-height:1.35}
  .education-table{width:100%;table-layout:fixed;border-collapse:collapse;margin-top:4px}.education-table th{background:#315f86;color:#fff;font-family:Georgia,'Times New Roman',serif;font-size:7px;text-align:left;padding:7px 8px;font-weight:500}.education-table td{border-bottom:1px solid #dce5eb;padding:9px 8px;font-size:9px;height:31px;vertical-align:top}
  .check-grid{display:grid;grid-template-columns:1fr 1fr;gap:8px 12px}.check-item{border:1px solid #dce5eb;border-radius:7px;padding:8px;font-size:8px}.check{display:inline-block;width:11px;height:11px;border:1px solid #7890a3;margin-right:6px;vertical-align:-2px;text-align:center;font-size:8px;line-height:10px}.checked{background:#2f8585;color:#fff}
  .declaration{border:1px solid #dce5eb;border-radius:12px;background:#f5f8fa;padding:18px;font-size:9px;line-height:1.65}.declaration-line{margin-top:12px;font-weight:700}.signature-grid{display:grid;grid-template-columns:1fr 1fr;gap:30px;margin-top:34px}.signature{border-top:1px solid #7890a3;padding-top:9px;font-size:10px;font-weight:700}.signature small{display:block;color:#718096;font-size:7px;font-weight:400;margin-top:4px}
  .footer{position:absolute;bottom:18px;left:38px;right:38px;border-top:1px solid #e3e9ee;padding-top:7px;color:#8a9aa8;font-size:6.5px}.footer span{float:right}
`;

const renderForm = (data, logo) => {
  const { employee: e, record: r, employeeId, reviewer } = data.form;
  const education = r.educationRecords?.length ? r.educationRecords : [{}];
  const checklist = [
    ['nationalId', 'Copy of National ID / Passport'], ['educationalCredentials', 'Educational Certificates / Credentials'],
    ['cv', 'Curriculum Vitae (CV) / Resume'], ['passportPhoto', 'Recent Passport-Size Photograph'],
    ['medicalCertificate', 'Medical Certificate / Fitness Report'], ['policeClearance', 'Certificate of Good Conduct / Police Clearance'],
    ['employmentContract', 'Signed Employment Contract / Offer Letter'], ['bankAccountDetails', 'Bank Account Details'],
  ];
  const header = (compact = false) => `<div class="paper-header">${logo ? `<img class="logo" style="${compact ? 'height:105px' : ''}" src="${logo}">` : ''}${compact ? '' : `<h1>NEW EMPLOYEE PERSONAL INFORMATION FORM</h1><div class="subtitle">To be completed by the new employee and verified by the HR Department upon hire.</div>`}</div>`;
  return `<div class="export-document">
    <div class="export-page">${header()}
      ${sectionBar('A', 'PERSONAL INFORMATION')}
      ${row(field('Full Name', e.fullName, { required: true }), field('Date of Birth', dateText(r.dateOfBirth), { required: true }), field('Gender', e.gender))}
      ${row(field('Nationality', r.nationality, { required: true }), field('National ID / Passport No.', r.nationalIdOrPassport, { required: true, helper: 'Enter the number exactly as printed on the document.' }), field('Marital Status', r.maritalStatus, { required: true }))}
      ${row(field('Phone Number', e.phone, { required: true }), field('Personal Email Address', e.altEmail), field('Employee ID', employeeId, { owner: 'hr', helper: 'Assigned and maintained by HR.' }))}
      ${subheading('PLACE OF BIRTH')}${row(field('Place / City', r.placeOfBirth?.city), field('Region', r.placeOfBirth?.region), field('Kebele', r.placeOfBirth?.kebele))}
      ${subheading('PRESENT ADDRESS')}${row(field('Region', r.presentAddress?.region, { required: true }), field('City / Town', r.presentAddress?.cityOrTown, { required: true }), field('Sub-City / Woreda', r.presentAddress?.subCityOrWoreda))}
      ${row(field('Kebele', r.presentAddress?.kebele), field('House Number', r.presentAddress?.houseNumber), field('Address Summary', e.location))}
      ${sectionBar('B', 'EMPLOYMENT DETAILS')}
      ${row(field('Job Title / Position', e.jobTitle, { owner: 'hr' }), field('Department', e.role, { owner: 'hr' }), field('Hiring Date', dateText(e.hireDate), { owner: 'hr' }))}
      ${row(field('Employment Type', e.employmentType, { owner: 'hr' }), field('Basic Pay (Birr)', moneyText(e.salary), { owner: 'hr' }), field('TIN Number', r.tinNumber, { helper: '10-digit taxpayer identification number.' }))}
      ${row(field('Salary Bank Account Number', r.salaryBankAccountNumber, { helper: 'Account designated to receive salary payments.' }))}
      ${sectionBar('C', 'EDUCATIONAL BACKGROUND')}
      ${e.education ? row(field('Education Summary', e.education)) : ''}
      <table class="education-table"><thead><tr><th>Level of Education</th><th>Institution Name</th><th>Field of Study</th><th>Year of Graduation</th></tr></thead><tbody>${education.map((item) => `<tr><td>${display(item.level, '')}</td><td>${display(item.institution, '')}</td><td>${display(item.fieldOfStudy, '')}</td><td>${display(item.graduationYear, '')}</td></tr>`).join('')}</tbody></table>
      <div class="footer">Confidential — For Internal HR Use Only <span>Page 1</span></div>
    </div>
    <div class="export-page">${header(true)}
      ${sectionBar('D', 'EMERGENCY CONTACT INFORMATION')}
      ${row(field('Full Name', r.emergencyContact?.fullName, { required: true }), field('Relationship to Employee', r.emergencyContact?.relationship, { required: true }))}
      ${row(field('Phone Number', r.emergencyContact?.phone, { required: true }), field('Alternative Phone Number', r.emergencyContact?.alternativePhone))}
      ${row(field('Address', r.emergencyContact?.address))}
      ${sectionBar('E', 'ATTACHED DOCUMENTS CHECKLIST')}
      <div class="check-grid">${checklist.map(([key, label]) => `<div class="check-item"><span class="check ${r.documentChecklist?.[key] ? 'checked' : ''}">${r.documentChecklist?.[key] ? '✓' : ''}</span>${escapeHtml(label)}</div>`).join('')}</div>
      ${sectionBar('', 'DECLARATION')}
      <div class="declaration">I confirm that the information provided in this form is true, complete, and accurate to the best of my knowledge. I understand that false or misleading information may result in disciplinary action, up to and including termination of employment, in accordance with Trade Ethiopia’s policies.<div class="declaration-line"><span class="check ${r.declarationAccepted ? 'checked' : ''}">${r.declarationAccepted ? '✓' : ''}</span>I have reviewed this record and accept the declaration.</div></div>
      <div class="signature-grid"><div class="signature">${display(e.fullName || e.username, '')}<small>Employee Signature &nbsp;&nbsp; Date: ${display(dateText(r.submittedAt), 'Not recorded')}</small></div><div class="signature">${display(r.hrDecision?.reviewerName || r.hrDecision?.decidedBy?.username || reviewer, '')}<small>HR Officer Signature &nbsp;&nbsp; Date: ${display(dateText(r.hrDecision?.decidedAt), 'Not recorded')}</small></div></div>
      <div class="footer">Confidential — For Internal HR Use Only <span>Page 2</span></div>
    </div>
  </div>`;
};

export const exportEmployeeWord = async (data) => {
  const logo = await embeddedLogo();
  const html = `<!doctype html><html><head><meta charset="utf-8"><style>@page{size:A4 portrait;margin:0}${formCss}</style></head><body>${renderForm(data, logo)}</body></html>`;
  downloadBlob(new Blob(['\ufeff', html], { type: 'application/msword;charset=utf-8' }), `${data.fileName}.doc`);
};

export const exportEmployeePdf = async (data) => {
  const [{ default: jsPDF }, { default: html2canvas }, logo] = await Promise.all([
    import('jspdf'), import('html2canvas'), embeddedLogo(),
  ]);
  const host = document.createElement('div');
  host.setAttribute('aria-hidden', 'true');
  host.style.cssText = 'position:fixed;left:-10000px;top:0;width:794px;z-index:-1;';
  host.innerHTML = `<style>${formCss}</style>${renderForm(data, logo)}`;
  document.body.appendChild(host);
  try {
    const pages = Array.from(host.querySelectorAll('.export-page'));
    const doc = new jsPDF({ unit: 'mm', format: 'a4', orientation: 'portrait' });
    for (let index = 0; index < pages.length; index += 1) {
      const canvas = await html2canvas(pages[index], { scale: 2, backgroundColor: '#ffffff', useCORS: true, logging: false });
      if (index > 0) doc.addPage();
      doc.addImage(canvas.toDataURL('image/jpeg', 0.96), 'JPEG', 0, 0, 210, 297, undefined, 'FAST');
    }
    doc.save(`${data.fileName}.pdf`);
  } finally {
    host.remove();
  }
};
