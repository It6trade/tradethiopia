const mongoose = require('mongoose');
const Document = require('../models/Document');
const Notification = require('../models/Notification');
const User = require('../models/user.model');
const { ethiopianToGregorianDate, validateEthiopianDate } = require('../utils/ethiopianCalendar');

const HR_ROLES = ['HR', 'hr', 'admin', 'Admin'];

/**
 * Calculates the license renewal risk status for a given document.
 * @param {Object} document - Document mongoose model or plain object
 * @returns {Object} Risk evaluation result
 */
const calculateLicenseRisk = (document) => {
  const schedule = document?.licenseSchedule;
  if (!schedule) {
    return { isRisk: false, isScheduled: false };
  }

  let renewalDate = schedule.endDate || schedule.renewalDate;

  // Fallback: Calculate from Ethiopian end date if Gregorian date is missing
  if (!renewalDate && schedule.endDateEthiopian && validateEthiopianDate(schedule.endDateEthiopian)) {
    try {
      renewalDate = ethiopianToGregorianDate(schedule.endDateEthiopian);
    } catch (_) {
      renewalDate = null;
    }
  }

  if (!renewalDate) {
    return { isRisk: false, isScheduled: false };
  }

  const targetDate = new Date(renewalDate);
  const today = new Date();
  targetDate.setHours(0, 0, 0, 0);
  today.setHours(0, 0, 0, 0);

  const daysRemaining = Math.ceil((targetDate.getTime() - today.getTime()) / 86400000);
  const reminderDays = Number(schedule.reminderDaysBefore ?? 30);

  if (daysRemaining < 0) {
    return {
      isRisk: true,
      isScheduled: true,
      isOverdue: true,
      isDueToday: false,
      isApproaching: false,
      status: 'overdue',
      daysRemaining,
      reminderDays,
      renewalDate: targetDate,
    };
  }

  if (daysRemaining === 0) {
    return {
      isRisk: true,
      isScheduled: true,
      isOverdue: false,
      isDueToday: true,
      isApproaching: false,
      status: 'due_today',
      daysRemaining,
      reminderDays,
      renewalDate: targetDate,
    };
  }

  if (daysRemaining <= reminderDays) {
    return {
      isRisk: true,
      isScheduled: true,
      isOverdue: false,
      isDueToday: false,
      isApproaching: true,
      status: 'approaching',
      daysRemaining,
      reminderDays,
      renewalDate: targetDate,
    };
  }

  return {
    isRisk: false,
    isScheduled: true,
    isCurrent: true,
    daysRemaining,
    reminderDays,
    renewalDate: targetDate,
  };
};

/**
 * Builds standard notification text and link for all types of documents (company, employee, etc.).
 */
const buildNotificationDetails = (document, risk) => {
  const isEmployeeDoc = document.section === 'employees' || Boolean(document.userId);
  const title = document.title || (isEmployeeDoc ? 'Employee Document' : 'Company License');

  let entityLabel = '';
  if (isEmployeeDoc) {
    entityLabel = document.employeeName ? ` (Employee: ${document.employeeName})` : ' (Employee Document)';
  } else {
    entityLabel = document.department && document.department !== 'none' ? ` (${document.department})` : '';
  }

  let text = '';
  if (risk.isOverdue) {
    const overdueDays = Math.abs(risk.daysRemaining);
    text = `⚠️ Risk Document Alert: Renewal for "${title}"${entityLabel} is OVERDUE by ${overdueDays} day${overdueDays === 1 ? '' : 's'}! Action required.`;
  } else if (risk.isDueToday) {
    text = `⚠️ Risk Document Alert: Renewal for "${title}"${entityLabel} is DUE TODAY! Immediate action required.`;
  } else {
    text = `⚠️ Risk Document Alert: Renewal for "${title}"${entityLabel} is approaching in ${risk.daysRemaining} day${risk.daysRemaining === 1 ? '' : 's'}. Action required.`;
  }

  const link = isEmployeeDoc ? '/EmployeeDocument' : '/documentlist';
  const actionLabel = isEmployeeDoc ? 'View Employee Documents' : 'View Document Library';

  return { text, link, actionLabel, isEmployeeDoc };
};

/**
 * Synchronizes notifications for a specific document to all HR users.
 * When the document is no longer risky (e.g. renewal date updated to a future date),
 * all existing risk notifications for this document are automatically removed.
 * @param {Object} document - Document mongoose model or plain object
 * @param {Object} [app] - Express application instance for socket access
 */
const syncDocumentLicenseNotification = async (document, app = null) => {
  try {
    if (!document || !document._id) return;

    const risk = calculateLicenseRisk(document);
    const hrUsers = await User.find({
      role: { $in: HR_ROLES },
      status: 'active',
    }).select('_id username fullName role');

    if (!hrUsers.length) return;

    if (risk.isRisk) {
      const { text, link, actionLabel, isEmployeeDoc } = buildNotificationDetails(document, risk);
      const metadata = {
        title: isEmployeeDoc ? 'Risk Document: Employee Renewal Alert' : 'Risk Document: License Renewal Alert',
        category: 'risk document',
        isRiskDocument: true,
        isHazard: true,
        documentId: document._id,
        documentTitle: document.title,
        employeeName: document.employeeName || '',
        department: document.department || '',
        section: document.section || (isEmployeeDoc ? 'employees' : 'companys'),
        daysRemaining: risk.daysRemaining,
        status: risk.status,
        actionLabel,
      };

      for (const hrUser of hrUsers) {
        // Find existing unread risk notification for this document
        const existing = await Notification.findOne({
          user: hrUser._id,
          documentId: document._id,
          type: 'risk document',
          read: false,
        });

        let notification;
        if (existing) {
          existing.text = text;
          existing.metadata = metadata;
          existing.category = 'risk document';
          existing.link = link;
          notification = await existing.save();
        } else {
          notification = await Notification.create({
            user: hrUser._id,
            text,
            type: 'risk document',
            category: 'risk document',
            documentId: document._id,
            link,
            metadata,
          });
        }

        // Emit real-time notification via Socket.IO if app is provided
        if (app && notification) {
          const connectedUsers = app.get('connectedUsers');
          const io = app.get('io');
          const socketId = connectedUsers?.get?.(String(hrUser._id));
          if (io && socketId) {
            io.to(socketId).emit('newNotification', notification.toObject());
          }
        }
      }
    } else {
      // HR updated the renewal date or set a new renewal date that is not at risk:
      // Remove all unread/active risk document notifications for this document!
      await Notification.deleteMany({
        documentId: document._id,
        type: 'risk document',
      });

      // Emit real-time resolution event so HR UI immediately removes the hazard notification
      if (app) {
        const io = app.get('io');
        if (io) {
          io.emit('notification:resolved', {
            documentId: String(document._id),
            type: 'risk document',
          });
        }
      }
    }
  } catch (error) {
    console.error('Error syncing document license notification:', error);
  }
};

/**
 * Scans ALL documents (company documents and employee documents) and updates notifications.
 * @param {Object} [app] - Express application instance
 */
const syncAllApproachingLicenses = async (app = null) => {
  try {
    const documents = await Document.find({
      $or: [
        { 'licenseSchedule.endDate': { $ne: null } },
        { 'licenseSchedule.renewalDate': { $ne: null } },
        { 'licenseSchedule.endDateEthiopian.year': { $ne: null } },
      ],
    }).populate('category');

    for (const doc of documents) {
      await syncDocumentLicenseNotification(doc, app);
    }
  } catch (error) {
    console.error('Error during scheduled license risk check:', error);
  }
};

module.exports = {
  calculateLicenseRisk,
  syncDocumentLicenseNotification,
  syncAllApproachingLicenses,
};
