// Import required modules
const Payroll = require('../models/Payroll');
const Attendance = require('../models/Attendance');
const Commission = require('../models/Commission');
const PayrollHistory = require('../models/PayrollHistory');
const User = require('../models/user.model');
const SalesCustomer = require('../models/SalesCustomer');
const { resolveSaleCommission } = require('../utils/commission');
const asyncHandler = require('express-async-handler');

// Ethiopian Income Tax (2017 EC / 2025 GC)
const calculateEthiopianIncomeTax = (grossSalary) => {
  if (grossSalary <= 2000) {
    return 0;
  } 
  else if (grossSalary <= 4000) {
    return grossSalary * 0.15 - 300;
  } 
  else if (grossSalary <= 7000) {
    return grossSalary * 0.20 - 500;
  } 
  else if (grossSalary <= 10000) {
    return grossSalary * 0.25 - 850;
  } 
  else if (grossSalary <= 14000) {
    return grossSalary * 0.30 - 1350;
  } 
  else {
    return grossSalary * 0.35 - 2050;
  }
};


// Calculate pension contribution (7% of basic salary)
const calculatePension = (basicSalary) => {
  return basicSalary * 0.07;
};

// Calculate hourly wage from monthly salary
const calculateHourlyWage = (monthlySalary) => {
  if (!monthlySalary) return 0;
  const dailySalary = monthlySalary / 30;
  const hourlyWage = dailySalary / 8;
  return hourlyWage;
};

// Calculate overtime pay based on Ethiopian labor law
const calculateOvertimePay = (hourlyWage, overtimeData) => {
  if (!overtimeData) return 0;
  
  let totalOvertimePay = 0;
  
  // Daytime Overtime (6am–10pm): 1.5x hourly rate
  if (overtimeData.daytimeOvertimeHours) {
    const daytimeRate = hourlyWage * 1.5;
    totalOvertimePay += overtimeData.daytimeOvertimeHours * daytimeRate;
  }
  
  // Night Overtime (10pm–6am): 1.75x hourly rate
  if (overtimeData.nightOvertimeHours) {
    const nightRate = hourlyWage * 1.75;
    totalOvertimePay += overtimeData.nightOvertimeHours * nightRate;
  }
  
  // Rest Day Overtime: 2.0x hourly rate
  if (overtimeData.restDayOvertimeHours) {
    const restDayRate = hourlyWage * 2.0;
    totalOvertimePay += overtimeData.restDayOvertimeHours * restDayRate;
  }
  
  // Public Holiday Overtime: 2.5x hourly rate
  if (overtimeData.holidayOvertimeHours) {
    const holidayRate = hourlyWage * 2.5;
    totalOvertimePay += overtimeData.holidayOvertimeHours * holidayRate;
  }
  
  return totalOvertimePay;
};

// Calculate late deduction (3000 ETB per day)
const calculateLateDeduction = (lateDays) => {
  return (lateDays || 0) * 300;
};

// Calculate absence deduction (3000 ETB per day)
const calculateAbsenceDeduction = (absenceDays) => {
  return (absenceDays || 0) * 3000;
};

const buildCommissionSnapshot = (sales = []) => {
  let totalGross = 0;
  let totalTax = 0;
  let totalNet = 0;

  const commissionDetails = (Array.isArray(sales) ? sales : []).map((sale) => {
    const resolved = resolveSaleCommission(sale);
    totalGross += resolved.grossCommission;
    totalTax += resolved.commissionTax;
    totalNet += resolved.netCommission;

    return {
      customerId: sale._id || sale.customerId,
      customerName: sale.customerName || 'Unknown',
      saleAmount: Number(sale.coursePrice) || 0,
      commissionRate: 0.07,
      commissionAmount: resolved.netCommission,
      grossCommission: resolved.grossCommission,
      commissionTax: resolved.commissionTax,
      netCommission: resolved.netCommission,
      date: sale.date
    };
  });

  return {
    commissionDetails,
    totals: {
      gross: Math.round(totalGross),
      tax: Math.round(totalTax),
      net: Math.round(totalNet)
    }
  };
};

const resolveCommissionForPeriod = async (
  userId,
  month,
  year,
) => {
  const commissionRecord = await Commission.findOne({ userId, month, year });
  return commissionRecord || null;
};

// Apply stored finance adjustments back onto a new HR net
const reapplyFinanceAdjustments = (baseNet, payrollRecord = {}) => {
  const financeAllowances = payrollRecord.financeAllowances || 0;
  const financeDeductions = payrollRecord.financeDeductions || 0;
  return {
    financeAllowances,
    financeDeductions,
    netSalary: baseNet + financeAllowances - financeDeductions
  };
};

const deriveHrNetFromRecord = (payrollRecord, fallbackBaseNet = 0) => {
  const recordedNet = payrollRecord?.netSalary ?? fallbackBaseNet;
  const financeAllowances = payrollRecord?.financeAllowances || 0;
  const financeDeductions = payrollRecord?.financeDeductions || 0;
  return recordedNet - financeAllowances + financeDeductions;
};

// Enhanced payroll calculation function
const calculatePayrollForEmployee = async (userData, attendanceData, commissionData) => {
  try {
    const currentDate = new Date();
    const month = currentDate.toISOString().slice(0, 7);
    const year = currentDate.getFullYear();
    
    // Base salary from user data
    const basicSalary = userData.salary || 0;
    
    // Calculate hourly wage for overtime calculations
    const hourlyWage = calculateHourlyWage(basicSalary);
    
    // Calculate overtime pay
    let overtimePay = 0;
    let totalOvertimeHours = 0;
    if (attendanceData) {
      overtimePay = calculateOvertimePay(hourlyWage, attendanceData);
      totalOvertimeHours = (
        (attendanceData.daytimeOvertimeHours || 0) +
        (attendanceData.nightOvertimeHours || 0) +
        (attendanceData.restDayOvertimeHours || 0) +
        (attendanceData.holidayOvertimeHours || 0)
      );
    }
    
    // Calculate late deduction
    let lateDeduction = 0;
    const lateDays = attendanceData?.lateDays || 0;
    if (lateDays) {
      lateDeduction = calculateLateDeduction(lateDays);
    }
    
    // Calculate absence deduction
    let absenceDeduction = 0;
    const absenceDays = attendanceData?.absenceDays || 0;
    if (absenceDays) {
      absenceDeduction = calculateAbsenceDeduction(absenceDays);
    }
    
    // Calculate commission
    let salesCommission = 0;
    let numberOfSales = 0;
    if (commissionData) {
      salesCommission = commissionData.totalCommission || 0;
      numberOfSales = commissionData.numberOfSales || 0;
    }
    
    // Calculate allowances
    const hrAllowances = attendanceData?.hrAllowances || 0;
    const financeAllowances = attendanceData?.financeAllowances || 0;
    const financeDeductions = attendanceData?.financeDeductions || 0;
    
    // Calculate gross salary (basic + overtime + commission + allowances)
    const grossSalary = basicSalary + overtimePay + salesCommission + hrAllowances + financeAllowances;
    
    // Calculate income tax on gross salary
    const incomeTax = calculateEthiopianIncomeTax(grossSalary);
    
    // Calculate pension (7% of basic salary only)
    const pension = calculatePension(basicSalary);
    
    // Calculate net salary
    const netSalary = grossSalary - incomeTax - pension - lateDeduction - absenceDeduction - financeDeductions;
    
    // Prepare payroll record
    const payrollRecord = {
      userId: userData._id,
      employeeName: userData.fullName || userData.username,
      department: userData.department || 'general',
      month,
      year,
      basicSalary,
      grossSalary,
      incomeTax,
      pension,
      overtimeHours: totalOvertimeHours,
      overtimePay,
      lateDays,
      lateDeduction,
      absenceDays,
      absenceDeduction,
      numberOfSales,
      salesCommission,
      hrAllowances,
      financeAllowances,
      financeDeductions,
      netSalary,
      status: 'draft'
    };
    
    return payrollRecord;
  } catch (error) {
    console.error('Error calculating payroll for employee:', error);
    throw error;
  }
};

// GET /payroll/:month → full payroll list
const getPayrollList = async (req, res) => {
  try {
    const { month } = req.params;
    const { year, department, role } = req.query;
    
    // Build query for existing payroll records
    let query = { month };
    if (year) query.year = year;
    if (department) query.department = department;
    if (role) query.role = role;
    
    // Get existing payroll records
    const existingPayrollRecords = await Payroll.find(query)
      .populate('userId', 'username fullName role salary jobTitle');
    
    // Get all active users matching the filters
    let userQuery = { status: 'active' };
    if (department) userQuery.jobTitle = department; // Use jobTitle instead of department
    if (role) userQuery.role = role;
    
    const allActiveUsers = await User.find(userQuery);
    
    // Create a map of existing payroll records by userId for quick lookup
    const payrollRecordMap = {};
    existingPayrollRecords.forEach(record => {
      // Skip records with missing userId
      if (record.userId) {
        payrollRecordMap[record.userId._id.toString()] = record;
      }    });
    
    // Combine existing records with placeholders for users without records
    const payrollRecords = allActiveUsers.map(user => {
      const userIdStr = user._id.toString();
      const currentSalary = user.salary || 0;
      if (payrollRecordMap[userIdStr]) {
        // Return existing record (make sure department and employeeName are populated)
        const doc = payrollRecordMap[userIdStr];
        const record = doc.toObject ? doc.toObject() : doc;
        // Ensure employeeName is set from user data if not already set
        if (!record.employeeName) {
          record.employeeName = user.fullName || user.username;
        }
        // Ensure department is set from user's jobTitle if not already set or is 'general'
        if ((!record.department || record.department === 'general') && user.jobTitle) {
          record.department = user.jobTitle;
        }
        // Make sure we always have a department
        if (!record.department || record.department === 'general') {
          record.department = user.jobTitle || user.role || 'general';
        }
        record.basicSalary = currentSalary;
        return record;
      } else {
        // Create a placeholder record for users without existing payroll data
        const basicSalary = currentSalary;
        
        // For placeholder records, we only have basic salary (no overtime, commissions, or allowances)
        const grossSalary = basicSalary;
        
        // Calculate income tax on gross salary
        const incomeTax = calculateEthiopianIncomeTax(grossSalary);
        
        // Calculate pension (7% of basic salary)
        const pension = calculatePension(basicSalary);
        
        // Calculate net salary (gross - tax - pension)
        const netSalary = grossSalary - incomeTax - pension;
        
        const placeholderRecord = {
          _id: `placeholder-${userIdStr}`, // Add a temporary ID for frontend use
          userId: user._id,
          employeeName: user.fullName || user.username,
          department: user.jobTitle || user.role || 'general', // Use jobTitle or role as fallback
          month,
          year: parseInt(year) || new Date().getFullYear(),
          basicSalary: basicSalary,
          grossSalary: grossSalary,
          incomeTax: incomeTax,
          pension: pension,
          overtimeHours: 0,
          overtimePay: 0,
          lateDays: 0,
          lateDeduction: 0,
          absenceDays: 0,
          absenceDeduction: 0,
          numberOfSales: 0,
          salesCommission: 0,
          hrAllowances: 0,
          financeAllowances: 0,
          financeDeductions: 0,
          netSalary: netSalary,
          status: 'draft',
          auditLog: []
        };
        
        return placeholderRecord;
      }
    });
    
    res.json(payrollRecords);
  } catch (error) {
    console.error('Error in getPayrollList:', error);
    res.status(500).json({ message: error.message });
  }
};

// POST /payroll/calculate → run payroll engine
const calculatePayrollForAll = async (req, res) => {
  try {
    const { month: requestedMonth, year: requestedYear } = req.body;
    const month = requestedMonth || new Date().toISOString().slice(0, 7);
    const year = parseInt(requestedYear, 10) || new Date().getFullYear();
    
    // Get all active users
    const users = await User.find({ status: 'active' });
    
    let payrollRecords = [];
    
    for (const user of users) {
      try {
        // Get attendance data for the user
        const attendanceData = await Attendance.findOne({
          userId: user._id,
          date: {
            $gte: new Date(`${month}-01`),
            $lt: new Date(new Date(`${month}-01`).setMonth(new Date(`${month}-01`).getMonth() + 1))
          }
        });
        
        // Get commission data for the user
        const commissionData = await resolveCommissionForPeriod(user._id, month, year);
        
        // Calculate payroll for the employee
        const payrollData = await calculatePayrollForEmployee(user, attendanceData, commissionData);
        
        // Check if payroll record already exists
        const existingRecord = await Payroll.findOne({
          userId: user._id,
          month,
          year
        });
        
        let payrollRecord;
        if (existingRecord) {
          // Update existing record
          payrollRecord = await Payroll.findByIdAndUpdate(
            existingRecord._id,
            { ...payrollData, auditLog: [...existingRecord.auditLog, {
              changedBy: req.user._id,
              changedAt: new Date(),
              fieldName: 'Payroll Recalculation',
              oldValue: null,
              newValue: 'Recalculated',
              role: req.user.role
            }] },
            { new: true }
          );
        } else {
          // Create new record
          payrollRecord = new Payroll({
            ...payrollData,
            auditLog: [{
              changedBy: req.user._id,
              changedAt: new Date(),
              fieldName: 'Payroll Creation',
              oldValue: null,
              newValue: 'Created',
              role: req.user.role
            }]
          });
          await payrollRecord.save();
        }
        
        payrollRecords.push(payrollRecord);
      } catch (error) {
        console.error(`Error calculating payroll for user ${user._id}:`, error);
        // Continue with other users even if one fails
      }
    }
    
    res.json({
      success: true,
      message: `Payroll calculated for ${payrollRecords.length} employees`,
      data: payrollRecords
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// POST /payroll/hr-adjust → HR attendance submission
const submitHRAdjustment = async (req, res) => {
  try {
    // Log for debugging
    console.log('HR Adjustment Request - User:', req.user);
    console.log('HR Adjustment Request - Body:', req.body);
    
    const { userId, month, year, ...attendanceData } = req.body;
    
    // Validate required fields
    if (!userId || !month || !year) {
      return res.status(400).json({ message: 'User ID, month, and year are required' });
    }
    
    // Check if user exists
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    // Upsert attendance record
    const attendanceRecord = await Attendance.findOneAndUpdate(
      { userId, date: { $gte: new Date(`${month}-01`), $lt: new Date(new Date(`${month}-01`).setMonth(new Date(`${month}-01`).getMonth() + 1)) } },
      {
        ...attendanceData,
        userId,
        employeeName: user.fullName || user.username,
        department: user.jobTitle || 'general', // Use jobTitle instead of department
        status: 'approved',
        submittedBy: req.user._id,
        approvedBy: req.user._id,
        submittedAt: new Date(),
        approvedAt: new Date()
      },
      { upsert: true, new: true }
    );
    
    // Recalculate payroll for this user
    const commissionData = await Commission.findOne({ userId, month, year });
    const payrollData = await calculatePayrollForEmployee(user, attendanceRecord, commissionData);
    const existingPayroll = await Payroll.findOne({ userId, month, year });
    const financeAdjustmentSnapshot = reapplyFinanceAdjustments(payrollData.netSalary, existingPayroll);

    // Update or create payroll record
    const payrollRecord = await Payroll.findOneAndUpdate(
      { userId, month, year },
      {
        ...payrollData,
        financeAllowances: financeAdjustmentSnapshot.financeAllowances,
        financeDeductions: financeAdjustmentSnapshot.financeDeductions,
        netSalary: financeAdjustmentSnapshot.netSalary,
        hrSubmittedBy: req.user._id,
        hrSubmittedAt: new Date(),
        status: 'hr_submitted',
        $push: {
          auditLog: {
            changedBy: req.user._id,
            changedAt: new Date(),
            fieldName: 'HR Adjustment',
            oldValue: null,
            newValue: 'HR adjustment submitted',
            role: 'HR'
          }
        }
      },
      { upsert: true, new: true }
    );
    
    res.json({
      success: true,
      message: 'HR adjustment submitted successfully',
      data: payrollRecord
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// POST /payroll/finance-adjust → Finance allowances & deductions
const submitFinanceAdjustment = async (req, res) => {
  try {
    // Log for debugging
    console.log('Finance Adjustment Request - User:', req.user);
    console.log('Finance Adjustment Request - Body:', req.body);
    
    const { userId, month, year, financeAllowances, financeDeductions } = req.body;
    
    // Validate required fields
    if (!userId || !month || !year) {
      return res.status(400).json({ message: 'User ID, month, and year are required' });
    }
    
    // Check if user exists
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    // Get existing attendance record
    const attendanceRecord = await Attendance.findOne({
      userId,
      date: { $gte: new Date(`${month}-01`), $lt: new Date(new Date(`${month}-01`).setMonth(new Date(`${month}-01`).getMonth() + 1)) }
    });
    
    // Get existing commission data
    const commissionData = await Commission.findOne({ userId, month, year });
    
    const existingPayroll = await Payroll.findOne({ userId, month, year });
    
    // Recalculate payroll with data that reflects HR adjustments only
    const payrollData = await calculatePayrollForEmployee(user, attendanceRecord, commissionData);

    const fallbackFinanceAllowances = existingPayroll?.financeAllowances ?? payrollData.financeAllowances ?? 0;
    const fallbackFinanceDeductions = existingPayroll?.financeDeductions ?? payrollData.financeDeductions ?? 0;
    const financeAllowancesValue =
      financeAllowances !== undefined ? (Number(financeAllowances) || 0) : fallbackFinanceAllowances;
    const financeDeductionsValue =
      financeDeductions !== undefined ? (Number(financeDeductions) || 0) : fallbackFinanceDeductions;

    const hrNet = deriveHrNetFromRecord(existingPayroll, payrollData.netSalary);
    const netSalary = hrNet + financeAllowancesValue - financeDeductionsValue;

    // Update payroll record with finance adjustments
    const payrollRecord = await Payroll.findOneAndUpdate(
      { userId, month, year },
      {
        ...payrollData,
        financeAllowances: financeAllowancesValue,
        financeDeductions: financeDeductionsValue,
        netSalary,
        financeReviewedBy: req.user._id,
        financeReviewedAt: new Date(),
        status: 'finance_reviewed',
        $push: {
          auditLog: {
            changedBy: req.user._id,
            changedAt: new Date(),
            fieldName: 'Finance Adjustment',
            oldValue: null,
            newValue: 'Finance adjustment submitted',
            role: 'Finance'
          }
        }
      },
      { upsert: true, new: true }
    );
    
    res.json({
      success: true,
      message: 'Finance adjustment submitted successfully',
      data: payrollRecord
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// GET /payroll/:userId/details → detailed payroll view
const getPayrollDetails = async (req, res) => {
  try {
    const { userId } = req.params;
    const { month, year } = req.query;
    
    if (!month || !year) {
      return res.status(400).json({ message: 'Month and year are required' });
    }
    
    // Get payroll record
    const payrollRecord = await Payroll.findOne({ userId, month, year })
      .populate('userId', 'username fullName role salary')
      .populate('hrSubmittedBy', 'username fullName')
      .populate('financeReviewedBy', 'username fullName')
      .populate('approvedBy', 'username fullName')
      .populate('lockedBy', 'username fullName');
    
    if (!payrollRecord) {
      const user = await User.findById(userId);
      if (!user) {
        return res.status(404).json({ message: 'Payroll record not found' });
      }
      const placeholder = {
        userId: user._id,
        employeeName: user.fullName || user.username,
        department: user.jobTitle || user.department || 'general',
        month,
        year,
        basicSalary: user.salary || 0,
        grossSalary: user.salary || 0,
        incomeTax: 0,
        pension: 0,
        overtimeHours: 0,
        overtimePay: 0,
        lateDays: 0,
        lateDeduction: 0,
        absenceDays: 0,
        absenceDeduction: 0,
        numberOfSales: 0,
        salesCommission: 0,
        hrAllowances: 0,
        financeAllowances: 0,
        financeDeductions: 0,
        netSalary: user.salary || 0,
        status: 'draft',
        auditLog: [],
        createdAt: new Date(),
        updatedAt: new Date()
      };
      return res.json(placeholder);
    }
    
    res.json(payrollRecord);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// POST /payroll/:id/finalize ?+' Finance finalization & history persistence
const finalizePayrollForFinance = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const payrollRecord = await Payroll.findById(id);
  if (!payrollRecord) {
    res.status(404);
    throw new Error('Payroll record not found');
  }

  const [yearPart = `${payrollRecord.year}`, monthPart = '01'] = (payrollRecord.month || '').split('-');
  const year = parseInt(yearPart, 10) || payrollRecord.year;
  const monthIndex = Math.max((parseInt(monthPart, 10) || 1) - 1, 0);
  const startDate = new Date(year, monthIndex, 1);
  const endDate = new Date(year, monthIndex + 1, 0);

  const sales = await SalesCustomer.find({
    agentId: String(payrollRecord.userId),
    followupStatus: 'Completed',
    date: {
      $gte: startDate,
      $lte: endDate
    }
  }).lean();

  const { commissionDetails, totals } = buildCommissionSnapshot(sales);

  await Commission.deleteMany({
    userId: payrollRecord.userId,
    month: payrollRecord.month,
    year: payrollRecord.year
  });

  const commissionRecord = await Commission.create({
    userId: payrollRecord.userId,
    employeeName: payrollRecord.employeeName,
    department: payrollRecord.department,
    month: payrollRecord.month,
    year: payrollRecord.year,
    numberOfSales: sales.length,
    totalCommission: totals.net,
    grossCommission: totals.gross,  // Add gross commission
    commissionTax: totals.tax,      // Add commission tax
    commissionDetails,
    submittedBy: req.user._id
  });

  const user = await User.findById(payrollRecord.userId).select('fullName username jobTitle department');
  const payrollSnapshot = payrollRecord.toObject();
  const employeeName = payrollSnapshot.employeeName || user?.fullName || user?.username || 'Unknown';
  const department =
    payrollSnapshot.department && payrollSnapshot.department !== 'general'
      ? payrollSnapshot.department
      : user?.jobTitle || user?.department || 'general';
  payrollSnapshot.employeeName = employeeName;
  payrollSnapshot.department = department;

  const historyEntry = await PayrollHistory.create({
    userId: payrollRecord.userId,
    employeeName,
    department,
    month: payrollRecord.month,
    year: payrollRecord.year,
    payrollData: payrollSnapshot,
    commissionData: {
      numberOfSales: commissionRecord.numberOfSales,
      totalCommission: commissionRecord.totalCommission,
      grossCommission: totals.gross,
      commissionTax: totals.tax,
      netCommission: totals.net,
      commissionDetails
    },
    finalizedBy: req.user._id,
    finalizedByName: req.user.fullName || req.user.username || req.user.role,
    finalizedAt: new Date()
  });

  await Payroll.findByIdAndDelete(payrollRecord._id);

  res.json({
    success: true,
    message: 'Payroll finalized and archived',
    history: historyEntry
  });
});

// GET /payroll/history ?+' List historical payroll data
const getPayrollHistory = asyncHandler(async (req, res) => {
  const { userId, month, year, department } = req.query;
  const filter = {};
  if (userId) filter.userId = userId;
  if (month) filter.month = month;
  if (year) {
    const parsedYear = parseInt(year, 10);
    if (!Number.isNaN(parsedYear)) {
      filter.year = parsedYear;
    }
  }
  if (department) filter.department = department;

  const historyList = await PayrollHistory.find(filter).sort({ finalizedAt: -1 });
  res.json(historyList);
});

// PUT /payroll/:id/approve → Approve payroll
const approvePayroll = async (req, res) => {
  try {
    const { id } = req.params;
    
    const payrollRecord = await Payroll.findByIdAndUpdate(
      id,
      {
        status: 'approved',
        approvedBy: req.user._id,
        approvedAt: new Date(),
        $push: {
          auditLog: {
            changedBy: req.user._id,
            changedAt: new Date(),
            fieldName: 'Payroll Approval',
            oldValue: 'finance_reviewed',
            newValue: 'approved',
            role: 'Admin'
          }
        }
      },
      { new: true }
    ).populate('userId', 'username fullName role');
    
    if (!payrollRecord) {
      return res.status(404).json({ message: 'Payroll record not found' });
    }
    
    res.json({
      success: true,
      message: 'Payroll approved successfully',
      data: payrollRecord
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// PUT /payroll/:id/lock → Lock payroll
const lockPayroll = async (req, res) => {
  try {
    const { id } = req.params;
    
    const payrollRecord = await Payroll.findByIdAndUpdate(
      id,
      {
        status: 'locked',
        lockedBy: req.user._id,
        lockedAt: new Date(),
        $push: {
          auditLog: {
            changedBy: req.user._id,
            changedAt: new Date(),
            fieldName: 'Payroll Lock',
            oldValue: 'approved',
            newValue: 'locked',
            role: 'Admin'
          }
        }
      },
      { new: true }
    ).populate('userId', 'username fullName role');
    
    if (!payrollRecord) {
      return res.status(404).json({ message: 'Payroll record not found' });
    }
    
    res.json({
      success: true,
      message: 'Payroll locked successfully',
      data: payrollRecord
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// GET /payroll/commission/:userId → Get commission data for a user
const getCommissionByUser = async (req, res) => {
  try {
    const { userId } = req.params;
    const { month, year } = req.query;
    
    if (!month || !year) {
      return res.status(400).json({ message: 'Month and year are required' });
    }
    
    const commissionRecord = await Commission.findOne({ userId, month, year });
    
    if (!commissionRecord) {
      return res.status(404).json({ message: 'Commission record not found' });
    }
    
    res.json(commissionRecord);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// POST /payroll/commission → Submit or update commission data
const submitCommission = async (req, res) => {
  try {
    const { userId, month, year, numberOfSales, totalCommission, grossCommission, commissionTax, commissionDetails } = req.body;
    
    // Validate required fields
    if (!userId || !month || !year) {
      return res.status(400).json({ message: 'User ID, month, and year are required' });
    }
    
    // Check if user exists
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    // Upsert commission record
    const commissionRecord = await Commission.findOneAndUpdate(
      { userId, month, year },
      {
        userId,
        month,
        year,
        numberOfSales: numberOfSales || 0,
        totalCommission: totalCommission || 0,
        grossCommission: grossCommission || 0,    // Add gross commission
        commissionTax: commissionTax || 0,        // Add commission tax
        commissionDetails: commissionDetails || []
      },
      { upsert: true, new: true }
    );
    
    // Get existing attendance data
    const attendanceData = await Attendance.findOne({
      userId,
      date: { $gte: new Date(`${month}-01`), $lt: new Date(new Date(`${month}-01`).setMonth(new Date(`${month}-01`).getMonth() + 1)) }
    });
    
    // Recalculate payroll with new commission data
    const payrollData = await calculatePayrollForEmployee(user, attendanceData, commissionRecord);
    
    // Update payroll record
    const payrollRecord = await Payroll.findOneAndUpdate(
      { userId, month, year },
      {
        ...payrollData,
        $push: {
          auditLog: {
            changedBy: req.user._id,
            changedAt: new Date(),
            fieldName: 'Commission Update',
            oldValue: null,
            newValue: 'Commission data updated',
            role: req.user.role
          }
        }
      },
      { upsert: true, new: true }
    );
    
    res.json({
      success: true,
      message: 'Commission data submitted successfully',
      data: { commission: commissionRecord, payroll: payrollRecord }
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// DELETE /payroll/commission → clear commission data for user period
const clearCommissionRecord = async (req, res) => {
  try {
    const { userId, month, year } = req.body;
    if (!userId || !month || !year) {
      return res.status(400).json({ message: 'User ID, month, and year are required' });
    }

    const commissionRecord = await Commission.findOneAndDelete({ userId, month, year });

    if (!commissionRecord) {
      return res.status(404).json({ message: 'Commission record not found for the specified period' });
    }

    res.json({
      success: true,
      message: 'Commission data cleared for the selected period',
      data: commissionRecord
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// GET /payroll/sales-data/:agentId → Get sales data for commission calculation
const getSalesDataForCommission = async (req, res) => {
  try {
    const { agentId } = req.params;
    const { month, year, startDate, endDate, status } = req.query;
    
    // Build date filter
    const dateFilter = {};
    
    // If specific date range is provided, use that
    if (startDate && endDate) {
      dateFilter.date = {
        $gte: new Date(startDate),
        $lte: new Date(endDate)
      };
    } 
    // Otherwise, use month/year filter
    else if (month && year) {
      // Parse month (expected format: YYYY-MM)
      const [yearStr, monthStr] = month.split('-');
      const monthIndex = parseInt(monthStr) - 1; // JS months are 0-indexed
      
      const startDateOfMonth = new Date(yearStr, monthIndex, 1);
      const endDateOfMonth = new Date(yearStr, monthIndex + 1, 0); // Last day of month
      
      dateFilter.date = {
        $gte: startDateOfMonth,
        $lte: endDateOfMonth
      };
    }
    
    // Build filter object
    const filter = {
      agentId: agentId,
      ...dateFilter
    };
    
    // Only add followupStatus filter if explicitly requested
    // This allows the payroll system to access all sales data, not just completed ones
    if (status) {
      filter.followupStatus = status;
    }
    
    // Get sales for this agent with filters
    let sales = await SalesCustomer.find(filter)
      .sort({ date: -1 });
    
    // Filter out sales that have already been paid in previous finalized payrolls
    // We check if these sales exist in any commission records with the same agentId
    const paidSales = await Commission.find({
      userId: agentId,
      'commissionDetails.customerId': { $in: sales.map(sale => sale._id) }
    }, {
      'commissionDetails.customerId': 1,
      _id: 0
    });
    
    // Extract the IDs of paid sales
    const paidSaleIds = new Set();
    paidSales.forEach(record => {
      record.commissionDetails.forEach(detail => {
        if (detail.customerId) {
          paidSaleIds.add(detail.customerId.toString());
        }
      });
    });
    
    // Filter out already paid sales
    sales = sales.filter(sale => !paidSaleIds.has(sale._id.toString()));
    
    // Calculate total commission
    let totalCommission = 0;
    let numberOfSales = sales.length;
    
    sales.forEach(sale => {
      // Simple commission calculation (10% of course price)
      // In a real implementation, this would use a more complex commission structure
      const saleAmount = sale.coursePrice || 0;
      const commission = saleAmount * 0.10; // 10% commission rate
      totalCommission += commission;
    });
    
    res.json({
      agentId,
      sales,
      totalCommission: Math.round(totalCommission),
      numberOfSales
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// DELETE /payroll/:id → Delete payroll record
const deletePayrollRecord = async (req, res) => {
  try {
    const { id } = req.params;
    
    // Check if user has proper permissions (admin or finance)
    if (req.user.role !== 'admin' && req.user.role !== 'finance') {
      return res.status(403).json({ 
        success: false, 
        message: 'Access denied. Requires admin or finance role.' 
      });
    }
    
    const payrollRecord = await Payroll.findByIdAndDelete(id);
    
    if (!payrollRecord) {
      return res.status(404).json({ 
        success: false, 
        message: 'Payroll record not found' 
      });
    }
    
    res.json({
      success: true,
      message: 'Payroll record deleted successfully',
      data: payrollRecord
    });
  } catch (error) {
    res.status(500).json({ 
      success: false,
      message: error.message 
    });
  }
};

module.exports = {
  getPayrollList,
  calculatePayrollForAll,
  submitHRAdjustment,
  submitFinanceAdjustment,
  getPayrollDetails,
  finalizePayrollForFinance,
  getPayrollHistory,
  approvePayroll,
  lockPayroll,
  getCommissionByUser,
  submitCommission,
  clearCommissionRecord,
  getSalesDataForCommission,
  deletePayrollRecord
};
