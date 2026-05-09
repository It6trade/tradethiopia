const ApprovalPolicy = require('../models/ApprovalPolicy');

const getRequiredApprovals = async ({ documentType, amount = 0, department = '', branch = '' }) => {
  const query = {
    documentType,
    amountThreshold: { $lte: Number(amount || 0) },
    active: true,
    $and: [
      { $or: [{ department }, { department: '' }, { department: { $exists: false } }] },
      { $or: [{ branch }, { branch: '' }, { branch: { $exists: false } }] }
    ]
  };
  return ApprovalPolicy.find(query).sort({ approvalSequence: 1, amountThreshold: -1 }).lean();
};

module.exports = { getRequiredApprovals };
