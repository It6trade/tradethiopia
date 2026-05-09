const transitions = {
  invoice: {
    draft: ['pending_approval', 'cancelled'],
    sent: ['pending_approval', 'cancelled'],
    pending_approval: ['approved', 'cancelled'],
    approved: ['posted', 'cancelled'],
    posted: ['partially_paid', 'paid', 'overdue', 'reversed'],
    partially_paid: ['paid', 'overdue', 'reversed'],
    paid: ['reversed'],
    overdue: ['paid', 'cancelled', 'reversed'],
    cancelled: ['reversed'],
    reversed: []
  },
  bill: {
    draft: ['submitted', 'cancelled'],
    submitted: ['approved', 'cancelled'],
    awaiting_approval: ['approved', 'cancelled'],
    approved: ['posted', 'cancelled'],
    posted: ['partially_paid', 'paid', 'reversed'],
    partially_paid: ['paid', 'reversed'],
    paid: ['closed', 'reversed'],
    closed: ['reversed'],
    overdue: ['paid', 'reversed'],
    cancelled: ['reversed'],
    reversed: []
  },
  journalEntry: {
    draft: ['posted'],
    posted: ['locked', 'reversed'],
    locked: ['reversed'],
    reversed: [],
    cancelled: []
  },
  expense: {
    draft: ['submitted'],
    submitted: ['approved', 'rejected'],
    approved: ['posted', 'reversed'],
    posted: ['paid', 'reconciled', 'reversed'],
    paid: ['reconciled', 'reversed'],
    reconciled: ['reversed'],
    rejected: [],
    reversed: []
  },
  payment: {
    draft: ['posted', 'cancelled'],
    posted: ['reconciled', 'reversed'],
    reconciled: ['reversed'],
    reversed: [],
    cancelled: []
  }
};

const lockedStatuses = new Set(['posted', 'locked', 'reversed', 'paid', 'closed', 'reconciled']);

class FinanceStateError extends Error {
  constructor(message) {
    super(message);
    this.name = 'FinanceStateError';
    this.statusCode = 409;
  }
}

const canTransition = (documentType, fromStatus, toStatus) => {
  const machine = transitions[documentType];
  if (!machine) throw new FinanceStateError(`Unsupported finance state machine: ${documentType}`);
  return (machine[fromStatus] || []).includes(toStatus);
};

const assertTransition = (documentType, fromStatus, toStatus) => {
  if (!canTransition(documentType, fromStatus, toStatus)) {
    throw new FinanceStateError(`Invalid ${documentType} transition from ${fromStatus} to ${toStatus}`);
  }
};

const assertEditable = (documentType, status) => {
  if (lockedStatuses.has(status)) {
    throw new FinanceStateError(`${documentType} records with status ${status} cannot be edited directly; use a reversal or adjustment entry`);
  }
};

module.exports = {
  transitions,
  canTransition,
  assertTransition,
  assertEditable,
  FinanceStateError
};
