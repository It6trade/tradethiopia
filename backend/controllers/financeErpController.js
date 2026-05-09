const financeErpService = require('../services/financeErpService');

const send = (res, payload, status = 200) => {
  res.status(status).json({ success: true, ...payload });
};

const handle = (res, error) => {
  console.error('Finance ERP error:', error);
  res.status(error.statusCode || 400).json({ success: false, message: error.message || 'Finance ERP request failed' });
};

exports.getDashboard = async (_req, res) => {
  try {
    const data = await financeErpService.dashboard();
    send(res, { data });
  } catch (error) {
    handle(res, error);
  }
};

exports.getReports = async (_req, res) => {
  try {
    const data = await financeErpService.reports();
    send(res, { data });
  } catch (error) {
    handle(res, error);
  }
};

exports.listResource = async (req, res) => {
  try {
    const data = await financeErpService.list(req.params.resource, req.query);
    send(res, data);
  } catch (error) {
    handle(res, error);
  }
};

exports.createResource = async (req, res) => {
  try {
    const data = await financeErpService.createResource(req.params.resource, req.body, req);
    send(res, { data }, 201);
  } catch (error) {
    handle(res, error);
  }
};

exports.updateResource = async (req, res) => {
  try {
    const data = await financeErpService.updateResource(req.params.resource, req.params.id, req.body, req);
    send(res, { data });
  } catch (error) {
    handle(res, error);
  }
};

exports.createSalesWorkflow = async (req, res) => {
  try {
    const data = await financeErpService.createSalesWorkflow(req.body, req);
    send(res, { data }, 201);
  } catch (error) {
    handle(res, error);
  }
};

exports.createPurchaseWorkflow = async (req, res) => {
  try {
    const data = await financeErpService.createPurchaseWorkflow(req.body, req);
    send(res, { data }, 201);
  } catch (error) {
    handle(res, error);
  }
};

exports.createExpenseWorkflow = async (req, res) => {
  try {
    const data = await financeErpService.createExpenseWorkflow(req.body, req);
    send(res, { data }, 201);
  } catch (error) {
    handle(res, error);
  }
};

const command = (serviceMethod, status = 200) => async (req, res) => {
  try {
    const data = await serviceMethod(req.params.id, req);
    send(res, { data }, status);
  } catch (error) {
    handle(res, error);
  }
};

exports.submitInvoice = command(financeErpService.submitInvoice);
exports.approveInvoice = command(financeErpService.approveInvoice);
exports.postInvoice = command(financeErpService.postInvoice);
exports.reverseInvoice = command(financeErpService.reverseInvoice);
exports.markInvoiceOverdue = command(financeErpService.markInvoiceOverdue);
exports.cancelInvoice = command(financeErpService.cancelInvoice);
exports.submitBill = command(financeErpService.submitBill);
exports.approveBill = command(financeErpService.approveBill);
exports.postBill = command(financeErpService.postBill);
exports.payBill = command(financeErpService.payBill);
exports.reverseBill = command(financeErpService.reverseBill);
exports.closeBill = command(financeErpService.closeBill);
exports.approveExpense = command(financeErpService.approveExpense);
exports.payExpense = command(financeErpService.payExpense);
exports.postExpense = command(financeErpService.postExpense);
exports.reverseExpense = command(financeErpService.reverseExpense);
exports.postJournal = command(financeErpService.postJournal);
exports.reverseJournal = command(financeErpService.reverseJournal);
exports.postPayment = command(financeErpService.postPayment);
exports.reversePayment = command(financeErpService.reversePayment);
exports.postPayroll = command(financeErpService.postPayroll);
exports.postCommission = command(financeErpService.postCommission);
exports.closePeriod = command(financeErpService.closePeriod);
exports.reopenPeriod = command(financeErpService.reopenPeriod);

exports.createBankStatement = async (req, res) => {
  try {
    const data = await financeErpService.createBankStatement(req.body, req);
    send(res, { data }, 201);
  } catch (error) {
    handle(res, error);
  }
};

exports.reconcileBank = async (req, res) => {
  try {
    const data = await financeErpService.reconcileBank(req.body, req);
    send(res, { data });
  } catch (error) {
    handle(res, error);
  }
};

exports.getAgeingReport = async (req, res) => {
  try {
    const data = await financeErpService.ageingReport(req.params.type);
    send(res, { data });
  } catch (error) {
    handle(res, error);
  }
};

exports.createMonthEndClose = async (req, res) => {
  try {
    const data = await financeErpService.createMonthEndClose(req.body, req);
    send(res, { data }, 201);
  } catch (error) {
    handle(res, error);
  }
};

exports.enqueueFinanceJob = async (req, res) => {
  try {
    const data = await financeErpService.enqueueFinanceJob(req.params.name, req.body);
    send(res, { data }, 202);
  } catch (error) {
    handle(res, error);
  }
};

exports.listJobs = async (_req, res) => {
  try {
    const data = { jobs: financeErpService.listJobs(), setup: financeErpService.jobSetup };
    send(res, { data });
  } catch (error) {
    handle(res, error);
  }
};

exports.postInventoryPurchase = command(financeErpService.postInventoryPurchase);
exports.postInventoryDelivery = command(financeErpService.postInventoryDelivery);

exports.postInventoryAdjustment = async (req, res) => {
  try {
    const data = await financeErpService.postInventoryAdjustment({
      movementId: req.params.id,
      amount: req.body?.amount,
      direction: req.body?.direction || 'loss'
    }, req);
    send(res, { data });
  } catch (error) {
    handle(res, error);
  }
};
