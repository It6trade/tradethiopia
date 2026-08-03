const mongoose = require('mongoose');
const User = require('../models/user.model');
const puncher = require('../services/puncherApiService');

const employeeFields = '_id username fullName email digitalId punchId punchEmployeeName jobTitle role status';

const normalizePunchId = (value) => {
  const normalized = String(value ?? '').trim();
  if (!normalized) return undefined;
  if (normalized.length > 64 || !/^[A-Za-z0-9._-]+$/.test(normalized)) return null;
  return normalized;
};

const employeeName = (user) => user.fullName || user.username || user.email;
const comparableName = (value) => String(value || '').trim().toLowerCase().replace(/\s+/g, ' ');

async function employeeMap() {
  const employees = await User.find({ punchId: { $exists: true, $nin: ['', null] } })
    .select(employeeFields)
    .lean();
  return new Map(employees.map((employee) => [String(employee.punchId), employee]));
}

function attachEmployee(row, map) {
  const matched = map.get(String(row.employeeId));
  const identityMismatch = Boolean(
    matched && matched.punchEmployeeName && row.employeeName &&
    comparableName(matched.punchEmployeeName) !== comparableName(row.employeeName)
  );
  return {
    ...row,
    matched: Boolean(matched),
    identityMismatch,
    employee: matched ? {
      id: matched._id,
      name: employeeName(matched),
      email: matched.email,
      department: matched.jobTitle || 'Not assigned',
      role: matched.role,
      status: matched.status,
      punchId: matched.punchId,
      punchEmployeeName: matched.punchEmployeeName || row.employeeName,
    } : null,
  };
}

function handlePuncherError(res, error) {
  const safe = puncher.publicError(error);
  return res.status(safe.status).json({ success: false, ...safe });
}

exports.getMappings = async (_req, res) => {
  const employeesPromise = User.find().select(employeeFields).sort({ fullName: 1, username: 1 }).lean();
  let terminalEmployees = [];
  let directoryAvailable = true;
  try {
    const directory = await puncher.request('/api/employees', { params: { limit: 100, page: 1 } });
    terminalEmployees = (directory.employees || []).map((employee) => ({
      punchId: String(employee.employeeId),
      name: employee.employeeName,
      activityCategory: employee.activityCategory,
      lastPunch: employee.lastPunch,
    })).sort((left, right) => left.name.localeCompare(right.name));
  } catch {
    directoryAvailable = false;
  }
  const employees = await employeesPromise;
  res.json({
    success: true,
    employees: employees.map((employee) => ({ ...employee, displayName: employeeName(employee) })),
    terminalEmployees,
    directoryAvailable,
    summary: {
      total: employees.length,
      mapped: employees.filter((employee) => employee.punchId).length,
      unmapped: employees.filter((employee) => !employee.punchId).length,
    },
  });
};

exports.updateMapping = async (req, res) => {
  if (!mongoose.isValidObjectId(req.params.userId)) {
    return res.status(400).json({ success: false, message: 'A valid employee is required.' });
  }
  const punchId = normalizePunchId(req.body.punchId);
  if (punchId === null) {
    return res.status(400).json({ success: false, message: 'Punch ID may contain letters, numbers, dots, underscores, and hyphens only.' });
  }

  try {
    const employee = await User.findById(req.params.userId);
    if (!employee) return res.status(404).json({ success: false, message: 'Employee not found.' });
    if (punchId) {
      let directory;
      try {
        directory = await puncher.request('/api/employees', { params: { limit: 100, page: 1, search: punchId } });
      } catch (error) {
        const safe = puncher.publicError(error);
        return res.status(safe.status).json({ success: false, ...safe, message: 'The Puncher directory must be available before assigning an ID.' });
      }
      const terminalEmployee = (directory.employees || []).find((item) => String(item.employeeId) === punchId);
      if (!terminalEmployee) {
        return res.status(400).json({ success: false, message: `Punch ID ${punchId} does not exist in the Puncher employee directory.` });
      }
      employee.punchId = punchId;
      employee.punchEmployeeName = terminalEmployee.employeeName;
    } else {
      employee.punchId = undefined;
      employee.punchEmployeeName = undefined;
    }
    await employee.save();
    res.json({
      success: true,
      message: punchId ? `Punch ID ${punchId} assigned to ${employeeName(employee)}.` : `Punch ID removed from ${employeeName(employee)}.`,
      employee: { id: employee._id, displayName: employeeName(employee), punchId: employee.punchId || '', punchEmployeeName: employee.punchEmployeeName || '' },
    });
  } catch (error) {
    if (error?.code === 11000) {
      return res.status(409).json({ success: false, message: `Punch ID ${punchId} is already assigned to another employee.` });
    }
    throw error;
  }
};

exports.getConnectorStatus = async (_req, res) => {
  try {
    const data = await puncher.request('/api/connector/status');
    const now = Date.now();
    const connectors = (data.connectors || []).map((connector) => {
      const heartbeat = connector.lastHeartbeatAt ? new Date(connector.lastHeartbeatAt).getTime() : 0;
      return { ...connector, online: Boolean(connector.online && heartbeat && now - heartbeat < 5 * 60 * 1000) };
    });
    const latestSuccessfulSyncAt = connectors.reduce((latest, item) => {
      const value = item.lastSuccessfulSyncAt ? new Date(item.lastSuccessfulSyncAt).getTime() : 0;
      return value > latest ? value : latest;
    }, 0);
    res.json({
      success: true,
      online: connectors.some((connector) => connector.online),
      latestSuccessfulSyncAt: latestSuccessfulSyncAt ? new Date(latestSuccessfulSyncAt) : null,
      connectors,
    });
  } catch (error) {
    return handlePuncherError(res, error);
  }
};

exports.getToday = async (_req, res) => {
  try {
    const [data, map] = await Promise.all([puncher.request('/api/attendance/today'), employeeMap()]);
    const attendance = (data.attendance || []).map((row) => attachEmployee(row, map));
    res.json({
      success: true,
      attendanceDate: data.attendanceDate,
      attendance,
      policy: data.policy || {},
      summary: {
        ...(data.summary || {}),
        matched: attendance.filter((row) => row.matched).length,
        unmatched: attendance.filter((row) => !row.matched).length,
        identityMismatches: attendance.filter((row) => row.identityMismatch).length,
      },
    });
  } catch (error) {
    return handlePuncherError(res, error);
  }
};

exports.getHistory = async (req, res) => {
  try {
    const days = Math.min(365, Math.max(1, Number(req.query.days) || 30));
    const [data, map] = await Promise.all([puncher.request('/api/history', { params: { days } }), employeeMap()]);
    const attendance = (data.attendance || []).map((row) => attachEmployee(row, map));
    res.json({
      success: true,
      days,
      attendance,
      summary: {
        records: attendance.length,
        matched: attendance.filter((row) => row.matched).length,
        unmatched: attendance.filter((row) => !row.matched).length,
      },
    });
  } catch (error) {
    return handlePuncherError(res, error);
  }
};
