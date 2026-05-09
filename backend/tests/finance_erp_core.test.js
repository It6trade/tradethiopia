const assert = require('assert');
const mongoose = require('mongoose');

const {
  validateJournalLines
} = require('../services/financePostingService');
const {
  assertTransition,
  assertEditable
} = require('../services/financeStateMachineService');
const {
  assertPeriodOpen
} = require('../services/fiscalPeriodService');
const AuditLog = require('../models/AuditLog');
const FiscalPeriod = require('../models/FiscalPeriod');
const JournalEntry = require('../models/JournalEntry');
const financeErpRoutes = require('../routes/financeErpRoutes');

const test = async (name, fn) => {
  try {
    await fn();
    console.log(`ok - ${name}`);
  } catch (error) {
    console.error(`not ok - ${name}`);
    console.error(error);
    process.exitCode = 1;
  }
};

(async () => {
  await test('journal balancing accepts equal debits and credits', () => {
    const accountA = new mongoose.Types.ObjectId();
    const accountB = new mongoose.Types.ObjectId();
    const result = validateJournalLines([
      { account: accountA, debit: 100, credit: 0 },
      { account: accountB, debit: 0, credit: 100 }
    ]);

    assert.strictEqual(result.totalDebit, 100);
    assert.strictEqual(result.totalCredit, 100);
  });

  await test('journal balancing rejects unbalanced or invalid lines', () => {
    const accountA = new mongoose.Types.ObjectId();
    const accountB = new mongoose.Types.ObjectId();

    assert.throws(() => validateJournalLines([
      { account: accountA, debit: 100, credit: 0 },
      { account: accountB, debit: 0, credit: 90 }
    ]), /Unbalanced journal entry/);

    assert.throws(() => validateJournalLines([
      { account: accountA, debit: -1, credit: 0 },
      { account: accountB, debit: 0, credit: -1 }
    ]), /non-negative finite number/);
  });

  await test('duplicate posting prevention is enforced by source unique index', () => {
    const duplicateIndex = JournalEntry.schema.indexes().find(([fields, options]) => (
      fields.sourceType === 1
      && fields.sourceId === 1
      && options.unique === true
      && options.partialFilterExpression
    ));

    assert.ok(duplicateIndex, 'expected unique sourceType/sourceId partial index');
  });

  await test('locked fiscal period blocks posting workflows', async () => {
    const originalFindOne = FiscalPeriod.findOne;
    FiscalPeriod.findOne = () => ({
      session: () => Promise.resolve({ name: 'May 2026', status: 'locked' })
    });

    try {
      await assert.rejects(
        () => assertPeriodOpen(new Date('2026-05-08T00:00:00.000Z')),
        /posting, editing, and reversing are blocked/
      );
    } finally {
      FiscalPeriod.findOne = originalFindOne;
    }
  });

  await test('invalid document transitions and direct posted edits are rejected', () => {
    assert.throws(() => assertTransition('invoice', 'draft', 'paid'), /Invalid invoice transition/);
    assert.throws(() => assertTransition('bill', 'draft', 'posted'), /Invalid bill transition/);
    assert.throws(() => assertTransition('payment', 'draft', 'reconciled'), /Invalid payment transition/);
    assert.doesNotThrow(() => assertTransition('payment', 'draft', 'posted'));
    assert.doesNotThrow(() => assertTransition('payment', 'posted', 'reconciled'));
    assert.throws(() => assertTransition('payment', 'posted', 'cancelled'), /Invalid payment transition/);
    assert.throws(() => assertEditable('journalEntry', 'posted'), /cannot be edited directly/);
  });

  await test('audit logs expose createdAt only and block normal updates', () => {
    assert.ok(AuditLog.schema.path('createdAt'), 'expected createdAt timestamp');
    assert.strictEqual(AuditLog.schema.path('updatedAt'), undefined, 'append-only audit logs should not expose updatedAt');
    const updateHookNames = AuditLog.schema.s.hooks._pres.get('updateOne') || [];
    assert.ok(updateHookNames.length > 0, 'expected updateOne hook to block audit updates');
  });

  await test('specific command routes are registered before dynamic resource routes', () => {
    const routePaths = financeErpRoutes.stack
      .filter((layer) => layer.route)
      .map((layer) => layer.route.path);
    const dynamicPostIndex = routePaths.indexOf('/:resource');
    const dynamicPutIndex = routePaths.indexOf('/:resource/:id');

    for (const commandPath of [
      '/invoices/:id/post',
      '/invoices/:id/reverse',
      '/payments/:id/post',
      '/payments/:id/reverse',
      '/bank/reconcile',
      '/periods/:id/close'
    ]) {
      const commandIndex = routePaths.indexOf(commandPath);
      assert.ok(commandIndex >= 0, `missing command route ${commandPath}`);
      assert.ok(commandIndex < dynamicPostIndex, `${commandPath} must be before /:resource`);
      assert.ok(commandIndex < dynamicPutIndex, `${commandPath} must be before /:resource/:id`);
    }
  });
})();
