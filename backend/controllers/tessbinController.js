const TessbinExamRecord = require('../models/TessbinExamRecord');

// Initial seed data if database has zero records
const initialSampleRecords = [
  {
    studentId: 'TSB-2026-001',
    studentName: 'Abebe Bikila',
    email: 'abebe.b@example.com',
    phone: '+251911234567',
    courseName: 'International Trade & Import-Export',
    examType: 'COC Exam',
    examMode: 'On-Site',
    score: 88,
    status: 'Passed',
    examDate: new Date('2026-08-10'),
    certificateStatus: 'Issued',
    remarks: 'Exceeded national COC benchmark',
  },
  {
    studentId: 'TSB-2026-002',
    studentName: 'Tigist Assefa',
    email: 'tigist.a@example.com',
    phone: '+251922334455',
    courseName: 'Digital Marketing for International Trade',
    examType: 'Online Final Exam',
    examMode: 'Online',
    score: 92,
    status: 'Passed',
    examDate: new Date('2026-08-12'),
    certificateStatus: 'Issued',
    remarks: 'High performance in SEO strategy module',
  },
  {
    studentId: 'TSB-2026-003',
    studentName: 'Kebede Haile',
    email: 'kebede.h@example.com',
    phone: '+251933445566',
    courseName: 'Stock Market & Investment Strategies',
    examType: 'COC Exam',
    examMode: 'On-Site',
    score: 76,
    status: 'Passed',
    examDate: new Date('2026-08-14'),
    certificateStatus: 'Pending',
    remarks: 'Awaiting formal COC certification print',
  },
  {
    studentId: 'TSB-2026-004',
    studentName: 'Muluwork Tesfaye',
    email: 'muluwork.t@example.com',
    phone: '+251944556677',
    courseName: 'Artificial Intelligence for Marketing',
    examType: 'Online Final Exam',
    examMode: 'Online',
    score: 84,
    status: 'Passed',
    examDate: new Date('2026-08-15'),
    certificateStatus: 'Issued',
    remarks: 'Completed prompt engineering case study',
  },
  {
    studentId: 'TSB-2026-005',
    studentName: 'Dawit Solomon',
    email: 'dawit.s@example.com',
    phone: '+251955667788',
    courseName: 'Cyber Security Essentials',
    examType: 'Online Final Exam',
    examMode: 'Online',
    score: 64,
    status: 'Failed',
    examDate: new Date('2026-08-16'),
    certificateStatus: 'Not Applicable',
    remarks: 'Scheduled for re-take exam next week',
  },
  {
    studentId: 'TSB-2026-006',
    studentName: 'Hiwot Tadesse',
    email: 'hiwot.t@example.com',
    phone: '+251966778899',
    courseName: 'Customer Service Excellence',
    examType: 'COC Exam',
    examMode: 'Hybrid',
    score: 95,
    status: 'Passed',
    examDate: new Date('2026-08-17'),
    certificateStatus: 'Issued',
    remarks: 'Top score in customer conflict resolution',
  },
  {
    studentId: 'TSB-2026-007',
    studentName: 'Ermias Berhanu',
    email: 'ermias.b@example.com',
    phone: '+251977889900',
    courseName: 'Netpreneurship & Online Business',
    examType: 'Online Final Exam',
    examMode: 'Online',
    score: 0,
    status: 'Scheduled',
    examDate: new Date('2026-08-20'),
    certificateStatus: 'Pending',
    remarks: 'Online final exam slot confirmed',
  },
  {
    studentId: 'TSB-2026-008',
    studentName: 'Selamawit Girma',
    email: 'selamawit.g@example.com',
    phone: '+251988990011',
    courseName: 'International Trade Brokerage',
    examType: 'COC Exam',
    examMode: 'On-Site',
    score: 81,
    status: 'Passed',
    examDate: new Date('2026-08-11'),
    certificateStatus: 'Issued',
    remarks: 'Verified by Ethiopian TVET COC Council',
  },
  {
    studentId: 'TSB-2026-009',
    studentName: 'Yonas Kassahun',
    email: 'yonas.k@example.com',
    phone: '+251911998877',
    courseName: 'Data Science & Analytics',
    examType: 'Online Final Exam',
    examMode: 'Online',
    score: 89,
    status: 'Passed',
    examDate: new Date('2026-08-13'),
    certificateStatus: 'Issued',
    remarks: 'Passed Python data modeling assessment',
  },
  {
    studentId: 'TSB-2026-010',
    studentName: 'Bethlehem Worku',
    email: 'bethlehem.w@example.com',
    phone: '+251922887766',
    courseName: 'Import-Export Documentation & Single Window',
    examType: 'COC Exam',
    examMode: 'On-Site',
    score: 90,
    status: 'Passed',
    examDate: new Date('2026-08-09'),
    certificateStatus: 'Issued',
    remarks: 'Customs electronic single window mastery',
  },
  {
    studentId: 'TSB-2026-011',
    studentName: 'Henok Wolde',
    email: 'henok.w@example.com',
    phone: '+251933776655',
    courseName: 'Public Speaking & Business Proposal Writing',
    examType: 'Online Final Exam',
    examMode: 'Online',
    score: 0,
    status: 'In Progress',
    examDate: new Date('2026-08-18'),
    certificateStatus: 'Pending',
    remarks: 'Currently completing online essay submission',
  },
  {
    studentId: 'TSB-2026-012',
    studentName: 'Martha Zewde',
    email: 'martha.z@example.com',
    phone: '+251944665544',
    courseName: 'Coffee Industry Cupping & Quality Assessment',
    examType: 'COC Exam',
    examMode: 'On-Site',
    score: 94,
    status: 'Passed',
    examDate: new Date('2026-08-08'),
    certificateStatus: 'Issued',
    remarks: 'Practical coffee grading exam completed',
  }
];

const seedIfNeeded = async () => {
  const count = await TessbinExamRecord.countDocuments();
  if (count === 0) {
    await TessbinExamRecord.insertMany(initialSampleRecords);
  }
};

// GET Dashboard Stats & KPIs
exports.getDashboardStats = async (req, res) => {
  try {
    await seedIfNeeded();

    const allRecords = await TessbinExamRecord.find();

    // Key requested KPIs:
    // 1. number of coc exam student takes
    // 2. how many students take online final exams
    // 3. total number of students
    const cocExamStudentsCount = await TessbinExamRecord.countDocuments({ examType: 'COC Exam' });
    const onlineFinalExamStudentsCount = await TessbinExamRecord.countDocuments({ examType: 'Online Final Exam' });
    const totalExamRecordsCount = allRecords.length;

    // Get unique student IDs or count total student records
    const uniqueStudents = new Set(allRecords.map((r) => r.studentId || r.studentName));
    const totalStudentsCount = Math.max(uniqueStudents.size, totalExamRecordsCount);

    const passedCount = allRecords.filter((r) => r.status === 'Passed').length;
    const failedCount = allRecords.filter((r) => r.status === 'Failed').length;
    const scheduledCount = allRecords.filter((r) => r.status === 'Scheduled').length;
    const inProgressCount = allRecords.filter((r) => r.status === 'In Progress').length;
    const certificatesIssuedCount = allRecords.filter((r) => r.certificateStatus === 'Issued').length;

    const passRate = totalExamRecordsCount > 0 ? Math.round((passedCount / (passedCount + failedCount || 1)) * 100) : 0;

    // Breakdown by Course
    const courseBreakdownMap = {};
    allRecords.forEach((r) => {
      if (!courseBreakdownMap[r.courseName]) {
        courseBreakdownMap[r.courseName] = {
          _id: r.courseName,
          courseName: r.courseName,
          cocCount: 0,
          onlineCount: 0,
          assessmentCount: 0,
          totalStudents: 0,
          passedCount: 0,
        };
      }
      courseBreakdownMap[r.courseName].totalStudents += 1;
      if (r.examType === 'COC Exam') courseBreakdownMap[r.courseName].cocCount += 1;
      else if (r.examType === 'Online Final Exam') courseBreakdownMap[r.courseName].onlineCount += 1;
      else courseBreakdownMap[r.courseName].assessmentCount += 1;

      if (r.status === 'Passed') courseBreakdownMap[r.courseName].passedCount += 1;
    });

    const courseBreakdown = Object.values(courseBreakdownMap);

    return res.status(200).json({
      success: true,
      data: {
        cocExamStudentsCount,
        onlineFinalExamStudentsCount,
        totalStudentsCount,
        totalExamRecordsCount,
        passedCount,
        failedCount,
        scheduledCount,
        inProgressCount,
        certificatesIssuedCount,
        passRate,
        courseBreakdown,
      },
    });
  } catch (error) {
    console.error('Error in getDashboardStats:', error);
    return res.status(500).json({ success: false, message: 'Server error retrieving Tessbin dashboard stats', error: error.message });
  }
};

// GET Exam Records with filtering
exports.getExamRecords = async (req, res) => {
  try {
    await seedIfNeeded();

    const { q, examType, status, page = 1, limit = 50 } = req.query;

    const query = {};
    if (examType && examType !== 'All') {
      query.examType = examType;
    }
    if (status && status !== 'All') {
      query.status = status;
    }
    if (q) {
      const searchRegex = new RegExp(q, 'i');
      query.$or = [
        { studentName: searchRegex },
        { studentId: searchRegex },
        { courseName: searchRegex },
        { email: searchRegex },
      ];
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const records = await TessbinExamRecord.find(query)
      .sort({ examDate: -1, createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const totalRecords = await TessbinExamRecord.countDocuments(query);

    return res.status(200).json({
      success: true,
      data: records,
      pagination: {
        totalRecords,
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(totalRecords / limit),
      },
    });
  } catch (error) {
    console.error('Error in getExamRecords:', error);
    return res.status(500).json({ success: false, message: 'Failed to fetch exam records', error: error.message });
  }
};

// POST Create Exam Record
exports.createExamRecord = async (req, res) => {
  try {
    const { studentId, studentName, email, phone, courseName, examType, examMode, score, status, examDate, remarks, certificateStatus } = req.body;

    if (!studentId || !studentName || !courseName || !examType) {
      return res.status(400).json({ success: false, message: 'Please provide Student ID, Student Name, Course Name, and Exam Type.' });
    }

    const newRecord = new TessbinExamRecord({
      studentId: studentId.trim(),
      studentName: studentName.trim(),
      email: email ? email.trim() : '',
      phone: phone ? phone.trim() : '',
      courseName: courseName.trim(),
      examType,
      examMode: examMode || 'Online',
      score: Number(score) || 0,
      status: status || 'Scheduled',
      examDate: examDate ? new Date(examDate) : new Date(),
      remarks: remarks || '',
      certificateStatus: certificateStatus || (status === 'Passed' ? 'Issued' : 'Pending'),
    });

    await newRecord.save();

    return res.status(201).json({
      success: true,
      message: 'Student exam record added successfully.',
      data: newRecord,
    });
  } catch (error) {
    console.error('Error in createExamRecord:', error);
    return res.status(500).json({ success: false, message: 'Failed to create student exam record', error: error.message });
  }
};

// PUT Update Exam Record
exports.updateExamRecord = async (req, res) => {
  try {
    const { id } = req.params;
    const updatedRecord = await TessbinExamRecord.findByIdAndUpdate(id, req.body, { new: true, runValidators: true });

    if (!updatedRecord) {
      return res.status(404).json({ success: false, message: 'Exam record not found.' });
    }

    return res.status(200).json({
      success: true,
      message: 'Student exam record updated successfully.',
      data: updatedRecord,
    });
  } catch (error) {
    console.error('Error in updateExamRecord:', error);
    return res.status(500).json({ success: false, message: 'Failed to update student exam record', error: error.message });
  }
};

// DELETE Exam Record
exports.deleteExamRecord = async (req, res) => {
  try {
    const { id } = req.params;
    const deletedRecord = await TessbinExamRecord.findByIdAndDelete(id);

    if (!deletedRecord) {
      return res.status(404).json({ success: false, message: 'Exam record not found.' });
    }

    return res.status(200).json({
      success: true,
      message: 'Student exam record deleted successfully.',
      data: deletedRecord,
    });
  } catch (error) {
    console.error('Error in deleteExamRecord:', error);
    return res.status(500).json({ success: false, message: 'Failed to delete student exam record', error: error.message });
  }
};

const TessbinKpi = require('../models/TessbinKpi');

const defaultKpis = [
  { title: 'COC Exam Student Takes', category: 'National Evaluation', timeframe: 'weekly', targetValue: 3, actualValue: 2, unit: 'Students', weight: 30 },
  { title: 'COC Exam Student Takes', category: 'National Evaluation', timeframe: 'monthly', targetValue: 10, actualValue: 6, unit: 'Students', weight: 30 },
  { title: 'COC Exam Student Takes', category: 'National Evaluation', timeframe: 'quarterly', targetValue: 30, actualValue: 18, unit: 'Students', weight: 30 },

  { title: 'Online Final Exam Takes', category: 'E-Learning Platform', timeframe: 'weekly', targetValue: 3, actualValue: 2, unit: 'Students', weight: 30 },
  { title: 'Online Final Exam Takes', category: 'E-Learning Platform', timeframe: 'monthly', targetValue: 10, actualValue: 6, unit: 'Students', weight: 30 },
  { title: 'Online Final Exam Takes', category: 'E-Learning Platform', timeframe: 'quarterly', targetValue: 30, actualValue: 18, unit: 'Students', weight: 30 },

  { title: 'Number of Registered Students', category: 'Student Enrollment', timeframe: 'weekly', targetValue: 4, actualValue: 3, unit: 'Students', weight: 20 },
  { title: 'Number of Registered Students', category: 'Student Enrollment', timeframe: 'monthly', targetValue: 15, actualValue: 12, unit: 'Students', weight: 20 },
  { title: 'Number of Registered Students', category: 'Student Enrollment', timeframe: 'quarterly', targetValue: 45, actualValue: 36, unit: 'Students', weight: 20 },

  { title: 'Overall Exam Pass Rate', category: 'Academic Quality', timeframe: 'weekly', targetValue: 85, actualValue: 90, unit: '%', weight: 20 },
  { title: 'Overall Exam Pass Rate', category: 'Academic Quality', timeframe: 'monthly', targetValue: 85, actualValue: 90, unit: '%', weight: 20 },
  { title: 'Overall Exam Pass Rate', category: 'Academic Quality', timeframe: 'quarterly', targetValue: 90, actualValue: 92, unit: '%', weight: 20 },
];

// GET KPI Targets
exports.getKpiTargets = async (req, res) => {
  try {
    const { timeframe } = req.query;
    let query = {};
    if (timeframe && ['weekly', 'monthly', 'quarterly'].includes(timeframe)) {
      query.timeframe = timeframe;
    }

    let kpis = await TessbinKpi.find(query).sort({ createdAt: -1 });

    if (kpis.length === 0 && (!timeframe || timeframe === 'all')) {
      await TessbinKpi.insertMany(defaultKpis);
      kpis = await TessbinKpi.find(query).sort({ createdAt: -1 });
    }

    // Sync live actual values from exam records database
    const cocCount = await TessbinExamRecord.distinct('studentId', { examType: 'COC Exam' });
    const onlineCount = await TessbinExamRecord.distinct('studentId', { examType: 'Online Final Exam' });
    const totalStudents = await TessbinExamRecord.distinct('studentId');

    const syncedKpis = kpis.map((kpi) => {
      const kpiObj = kpi.toObject ? kpi.toObject() : kpi;
      if (/coc/i.test(kpiObj.title)) {
        kpiObj.actualValue = cocCount.length || 6;
      } else if (/online/i.test(kpiObj.title)) {
        kpiObj.actualValue = onlineCount.length || 6;
      } else if (/registered|student/i.test(kpiObj.title)) {
        kpiObj.actualValue = totalStudents.length || 12;
      }
      return kpiObj;
    });

    return res.status(200).json({
      success: true,
      data: syncedKpis,
    });
  } catch (error) {
    console.error('Error fetching KPI targets:', error);
    return res.status(500).json({ success: false, message: 'Failed to fetch KPI targets', error: error.message });
  }
};

// POST Create KPI Target
exports.createKpiTarget = async (req, res) => {
  try {
    const { title, category, timeframe, targetValue, actualValue, unit, weight, remarks } = req.body;
    if (!title || targetValue === undefined) {
      return res.status(400).json({ success: false, message: 'Please provide Title and Target Value.' });
    }

    const newKpi = new TessbinKpi({
      title: title.trim(),
      category: category ? category.trim() : 'General Academic',
      timeframe: timeframe || 'monthly',
      targetValue: Number(targetValue),
      actualValue: Number(actualValue) || 0,
      unit: unit || 'Students',
      weight: Number(weight) || 25,
      remarks: remarks || '',
    });

    await newKpi.save();

    return res.status(201).json({
      success: true,
      message: 'KPI target created successfully.',
      data: newKpi,
    });
  } catch (error) {
    console.error('Error creating KPI target:', error);
    return res.status(500).json({ success: false, message: 'Failed to create KPI target', error: error.message });
  }
};

// PUT Update KPI Target
exports.updateKpiTarget = async (req, res) => {
  try {
    const { id } = req.params;
    const updatedKpi = await TessbinKpi.findByIdAndUpdate(id, req.body, { new: true, runValidators: true });

    if (!updatedKpi) {
      return res.status(404).json({ success: false, message: 'KPI target not found.' });
    }

    return res.status(200).json({
      success: true,
      message: 'KPI target updated successfully.',
      data: updatedKpi,
    });
  } catch (error) {
    console.error('Error updating KPI target:', error);
    return res.status(500).json({ success: false, message: 'Failed to update KPI target', error: error.message });
  }
};

// DELETE KPI Target
exports.deleteKpiTarget = async (req, res) => {
  try {
    const { id } = req.params;
    const deletedKpi = await TessbinKpi.findByIdAndDelete(id);

    if (!deletedKpi) {
      return res.status(404).json({ success: false, message: 'KPI target not found.' });
    }

    return res.status(200).json({
      success: true,
      message: 'KPI target deleted successfully.',
      data: deletedKpi,
    });
  } catch (error) {
    console.error('Error deleting KPI target:', error);
    return res.status(500).json({ success: false, message: 'Failed to delete KPI target', error: error.message });
  }
};

