const path = require('path');
require('dotenv').config({
  path: [
    path.join(__dirname, '..', '.env.local'),
    path.join(__dirname, '..', '.env')
  ]
});
const { connectDB, disconnectDB } = require('../config/db');
const { syncDocumentLicenseNotification } = require('../services/documentLicenseReminderService');
const Document = require('../models/Document');
const Notification = require('../models/Notification');
const Category = require('../models/Category');

async function testAll() {
  await connectDB();
  console.log('Connected to DB');

  const cat = await Category.findOne({});

  // 1. Create a test company document with overdue license
  const testDoc = await Document.create({
    title: 'Test Temp Company License',
    file: 'temp_file_1',
    category: cat ? cat._id : new mongoose.Types.ObjectId(),
    department: 'TESBINN',
    section: 'companys',
    licenseSchedule: {
      endDate: new Date(Date.now() - 5 * 86400000), // 5 days overdue
      reminderDaysBefore: 30,
    }
  });

  // Sync -> HR should receive risk document notification
  await syncDocumentLicenseNotification(testDoc);
  let notifs = await Notification.find({ documentId: testDoc._id, type: 'risk document' });
  console.log('Case 1: Overdue -> notifications created count:', notifs.length);
  if (notifs.length === 0) throw new Error('Expected risk notifications for overdue document');

  // 2. HR sets a new renewal date in the safe future (e.g. 180 days from now)
  testDoc.licenseSchedule.endDate = new Date(Date.now() + 180 * 86400000);
  await testDoc.save();
  await syncDocumentLicenseNotification(testDoc);
  notifs = await Notification.find({ documentId: testDoc._id, type: 'risk document' });
  console.log('Case 2: HR updated to safe future renewal date -> risk notifications count:', notifs.length);
  if (notifs.length !== 0) throw new Error('Expected risk notifications to be cleared when HR sets safe renewal date');

  // 3. Test Employee Document with approaching renewal
  const empDoc = await Document.create({
    title: 'Test Temp Employee Work Permit',
    employeeName: 'Abebe Kebede',
    file: 'temp_file_2',
    category: cat ? cat._id : new mongoose.Types.ObjectId(),
    department: 'Sales',
    section: 'employees',
    licenseSchedule: {
      endDate: new Date(Date.now() + 10 * 86400000), // 10 days remaining
      reminderDaysBefore: 30,
    }
  });

  await syncDocumentLicenseNotification(empDoc);
  let empNotifs = await Notification.find({ documentId: empDoc._id, type: 'risk document' });
  console.log('Case 3: Employee document approaching renewal -> notifications count:', empNotifs.length);
  if (empNotifs.length === 0) throw new Error('Expected risk notifications for employee document');
  console.log('Employee notification sample:', {
    text: empNotifs[0].text,
    link: empNotifs[0].link,
    category: empNotifs[0].category,
    metadata: empNotifs[0].metadata
  });

  // 4. HR updates employee document renewal to 1 year later
  empDoc.licenseSchedule.endDate = new Date(Date.now() + 365 * 86400000);
  await empDoc.save();
  await syncDocumentLicenseNotification(empDoc);
  empNotifs = await Notification.find({ documentId: empDoc._id, type: 'risk document' });
  console.log('Case 4: Employee document renewal updated to 1 year later -> risk notifications count:', empNotifs.length);
  if (empNotifs.length !== 0) throw new Error('Expected risk notifications to be cleared when employee renewal updated');

  // Clean up
  await Document.deleteOne({ _id: testDoc._id });
  await Document.deleteOne({ _id: empDoc._id });
  await Notification.deleteMany({ documentId: testDoc._id });
  await Notification.deleteMany({ documentId: empDoc._id });
  console.log('Cleaned up test documents and notifications');

  await disconnectDB();
  console.log('=== ALL RENEWAL NOTIFICATION FIXES VERIFIED SUCCESSFULLY! ===');
}

testAll().catch((err) => {
  console.error('Test failed:', err);
  process.exit(1);
});
