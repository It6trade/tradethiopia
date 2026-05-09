const Purchase = require('../models/Purchase');
const InventoryMovement = require('../models/InventoryMovement');
const { getAccountByCode, postFromTemplate, postJournalEntry, assertValidAmount } = require('./financePostingService');

const postInventoryPurchase = async (purchaseId, req) => {
  const purchase = await Purchase.findById(purchaseId);
  if (!purchase) throw new Error('Purchase not found');
  const amount = assertValidAmount(purchase.totals?.totalCost || 0, 'purchase total cost');
  if (amount <= 0) throw new Error('Purchase total cost must be greater than zero before accounting posting');
  const entry = await postFromTemplate({
    templateKey: 'inventory_purchase',
    context: { amount, label: purchase.referenceNumber, partnerType: 'vendor' },
    memo: `Inventory purchase ${purchase.referenceNumber}`,
    sourceType: 'purchase',
    sourceId: purchase._id,
    userId: req.user?._id
  });
  return { purchase, journalEntry: entry };
};

const postInventoryDelivery = async (movementId, req) => {
  const movement = await InventoryMovement.findById(movementId);
  if (!movement) throw new Error('Inventory movement not found');
  const amount = assertValidAmount(req.body?.amount || movement.amount || 0, 'delivery cost amount');
  if (amount <= 0) throw new Error('Delivery cost amount must be greater than zero');
  const entry = await postFromTemplate({
    templateKey: 'inventory_delivery_cogs',
    context: { amount, label: `Movement ${movement._id}` },
    memo: `Inventory delivery / COGS for movement ${movement._id}`,
    sourceType: 'stock_movement',
    sourceId: movement._id,
    userId: req.user?._id
  });
  return { movement, journalEntry: entry };
};

const postInventoryAdjustment = async ({ movementId, amount, direction }, req) => {
  const movement = await InventoryMovement.findById(movementId);
  if (!movement) throw new Error('Inventory movement not found');
  const value = assertValidAmount(amount, 'adjustment amount');
  if (value <= 0) throw new Error('Adjustment amount must be greater than zero');
  const inventory = await getAccountByCode('1200');
  const offset = await getAccountByCode(direction === 'gain' ? '4300' : '5300');
  const lines = direction === 'gain'
    ? [
      { account: inventory._id, label: 'Inventory gain', debit: value, credit: 0 },
      { account: offset._id, label: 'Inventory gain', debit: 0, credit: value }
    ]
    : [
      { account: offset._id, label: 'Inventory loss', debit: value, credit: 0 },
      { account: inventory._id, label: 'Inventory loss', debit: 0, credit: value }
    ];
  const entry = await postJournalEntry({
    lines,
    memo: `Inventory ${direction} adjustment for movement ${movement._id}`,
    sourceType: 'stock_movement',
    sourceId: movement._id,
    userId: req.user?._id
  });
  return { movement, journalEntry: entry };
};

module.exports = {
  postInventoryPurchase,
  postInventoryDelivery,
  postInventoryAdjustment
};
