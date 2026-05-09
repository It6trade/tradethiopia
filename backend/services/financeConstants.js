const defaultAccounts = [
  { code: '1000', name: 'Cash and Bank', type: 'asset', normalBalance: 'debit', systemAccount: true },
  { code: '1100', name: 'Accounts Receivable', type: 'asset', normalBalance: 'debit', systemAccount: true },
  { code: '1200', name: 'Inventory Asset', type: 'asset', normalBalance: 'debit', systemAccount: true },
  { code: '2000', name: 'Accounts Payable', type: 'liability', normalBalance: 'credit', systemAccount: true },
  { code: '2100', name: 'VAT Payable', type: 'liability', normalBalance: 'credit', systemAccount: true },
  { code: '2200', name: 'Accrued Liabilities', type: 'liability', normalBalance: 'credit', systemAccount: true },
  { code: '3000', name: 'Owner Equity', type: 'equity', normalBalance: 'credit', systemAccount: true },
  { code: '4000', name: 'Sales Revenue', type: 'income', normalBalance: 'credit', systemAccount: true },
  { code: '4300', name: 'Inventory Gain', type: 'income', normalBalance: 'credit', systemAccount: true },
  { code: '5000', name: 'Operating Expenses', type: 'expense', normalBalance: 'debit', systemAccount: true },
  { code: '5010', name: 'Cost of Goods Sold', type: 'expense', normalBalance: 'debit', systemAccount: true },
  { code: '5100', name: 'Payroll Expense', type: 'expense', normalBalance: 'debit', systemAccount: true },
  { code: '5200', name: 'Commission Expense', type: 'expense', normalBalance: 'debit', systemAccount: true },
  { code: '5300', name: 'Inventory Loss', type: 'expense', normalBalance: 'debit', systemAccount: true }
];

const defaultPostingTemplates = [
  {
    key: 'sales_invoice',
    name: 'Sales Invoice',
    sourceType: 'invoice',
    lines: [
      { accountCode: '1100', side: 'debit', amountPath: 'total', label: 'Accounts receivable' },
      { accountCode: '4000', side: 'credit', amountPath: 'subtotal', label: 'Sales revenue' },
      { accountCode: '2100', side: 'credit', amountPath: 'taxTotal', label: 'VAT payable', optional: true }
    ]
  },
  {
    key: 'customer_payment',
    name: 'Customer Payment',
    sourceType: 'payment',
    lines: [
      { accountCode: '1000', side: 'debit', amountPath: 'amount', label: 'Cash received' },
      { accountCode: '1100', side: 'credit', amountPath: 'amount', label: 'Receivable cleared' }
    ]
  },
  {
    key: 'vendor_bill',
    name: 'Vendor Bill',
    sourceType: 'bill',
    lines: [
      { accountCode: '5000', side: 'debit', amountPath: 'total', label: 'Expense' },
      { accountCode: '2000', side: 'credit', amountPath: 'total', label: 'Payable' }
    ]
  },
  {
    key: 'supplier_payment',
    name: 'Supplier Payment',
    sourceType: 'payment',
    lines: [
      { accountCode: '2000', side: 'debit', amountPath: 'amount', label: 'Payable cleared' },
      { accountCode: '1000', side: 'credit', amountPath: 'amount', label: 'Cash paid' }
    ]
  },
  {
    key: 'expense_accrual',
    name: 'Expense Accrual',
    sourceType: 'expense',
    lines: [
      { accountCode: '5000', side: 'debit', amountPath: 'amount', label: 'Expense recognized' },
      { accountCode: '2200', side: 'credit', amountPath: 'amount', label: 'Accrued liability' }
    ]
  },
  {
    key: 'expense_payment',
    name: 'Expense Payment',
    sourceType: 'payment',
    lines: [
      { accountCode: '2200', side: 'debit', amountPath: 'amount', label: 'Accrued liability cleared' },
      { accountCode: '1000', side: 'credit', amountPath: 'amount', label: 'Cash paid' }
    ]
  },
  {
    key: 'inventory_purchase',
    name: 'Inventory Purchase',
    sourceType: 'purchase',
    lines: [
      { accountCode: '1200', side: 'debit', amountPath: 'amount', label: 'Inventory received' },
      { accountCode: '2000', side: 'credit', amountPath: 'amount', label: 'Payable' }
    ]
  },
  {
    key: 'inventory_delivery_cogs',
    name: 'Inventory Delivery / COGS',
    sourceType: 'stock_movement',
    lines: [
      { accountCode: '5010', side: 'debit', amountPath: 'amount', label: 'COGS' },
      { accountCode: '1200', side: 'credit', amountPath: 'amount', label: 'Inventory issued' }
    ]
  },
  {
    key: 'payroll_posting',
    name: 'Payroll Posting',
    sourceType: 'payroll',
    lines: [
      { accountCode: '5100', side: 'debit', amountPath: 'grossAmount', label: 'Payroll expense' },
      { accountCode: '1000', side: 'credit', amountPath: 'netAmount', label: 'Payroll paid' },
      { accountCode: '2200', side: 'credit', amountPath: 'withholdingAmount', label: 'Payroll liabilities', optional: true }
    ]
  },
  {
    key: 'commission_posting',
    name: 'Commission Posting',
    sourceType: 'commission',
    lines: [
      { accountCode: '5200', side: 'debit', amountPath: 'grossAmount', label: 'Commission expense' },
      { accountCode: '1000', side: 'credit', amountPath: 'netAmount', label: 'Commission paid' },
      { accountCode: '2200', side: 'credit', amountPath: 'withholdingAmount', label: 'Commission tax payable', optional: true }
    ]
  }
];

module.exports = {
  defaultAccounts,
  defaultPostingTemplates
};
