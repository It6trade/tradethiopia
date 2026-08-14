import { useRef, useState } from 'react';
import { Box, Button, Flex, Heading, HStack, Text, useColorModeValue } from '@chakra-ui/react';
import { FaPrint, FaRedoAlt } from 'react-icons/fa';
import './FinanceFormsPage.css';

const emptyForm = {
  documentNumber: '', bankBranch: '', sourceOfFund: '', bankAccount: false,
  taxpayerName: '', payerAccountNumber: '', amount: '', amountInWords: '',
  paymentDetails: '', tin: '', accountHolderSignature: '', madeBy: '',
  checkedBy: '', authorizedBy: '', madeByDate: '', checkedByDate: '', authorizedByDate: '',
};

const FinanceFormsPage = () => {
  const [form, setForm] = useState(emptyForm);
  const [tinDigits, setTinDigits] = useState(() => Array(10).fill(''));
  const tinInputRefs = useRef([]);
  const muted = useColorModeValue('gray.600', 'gray.300');
  const panelBg = useColorModeValue('white', 'gray.800');
  const update = (field) => (event) => {
    const value = event.target.type === 'checkbox' ? event.target.checked : event.target.value;
    setForm((current) => ({ ...current, [field]: value }));
  };

  const clearForm = () => {
    setForm(emptyForm);
    setTinDigits(Array(10).fill(''));
  };

  const writeTinDigits = (startIndex, rawValue) => {
    const digits = rawValue.replace(/\D/g, '').slice(0, 10 - startIndex);
    if (!digits) {
      setTinDigits((current) => current.map((digit, index) => (index === startIndex ? '' : digit)));
      return;
    }
    setTinDigits((current) => {
      const next = [...current];
      digits.split('').forEach((digit, offset) => { next[startIndex + offset] = digit; });
      return next;
    });
    tinInputRefs.current[Math.min(startIndex + digits.length, 9)]?.focus();
  };

  const handleTinKeyDown = (index) => (event) => {
    if (event.key === 'Backspace' && !tinDigits[index] && index > 0) tinInputRefs.current[index - 1]?.focus();
    if (event.key === 'ArrowLeft' && index > 0) tinInputRefs.current[index - 1]?.focus();
    if (event.key === 'ArrowRight' && index < 9) tinInputRefs.current[index + 1]?.focus();
  };

  return (
    <Box className="finance-forms-page" px={{ base: 3, md: 6 }} py={5}>
      <Flex className="forms-toolbar" justify="space-between" align={{ base: 'stretch', md: 'center' }} gap={4} mb={5} direction={{ base: 'column', md: 'row' }}>
        <Box>
          <Heading size="md">Forms</Heading>
          <Text mt={1} fontSize="sm" color={muted}>Click any blank area to type, or print the original blank form.</Text>
        </Box>
        <HStack>
          <Button leftIcon={<FaRedoAlt />} variant="outline" onClick={clearForm}>Clear form</Button>
          <Button leftIcon={<FaPrint />} colorScheme="teal" onClick={() => window.print()}>Print form</Button>
        </HStack>
      </Flex>

      <Box className="form-preview-shell" bg={panelBg}>
        <form id="tax-print-area" className="tax-image-form" autoComplete="off">
          <img className="tax-form-artwork" src="/finance-domestic-tax-form.jpg" alt="Addis Ababa Revenue Bureau domestic tax electronic payment form" />
          <input className="form-overlay document-number" value={form.documentNumber} onChange={update('documentNumber')} aria-label="Document number" maxLength="14" />
          <input className="form-overlay bank-branch" value={form.bankBranch} onChange={update('bankBranch')} aria-label="Bank branch" />
          <input className="form-overlay source-fund" value={form.sourceOfFund} onChange={update('sourceOfFund')} aria-label="Source of fund" />
          <label className="form-overlay bank-account" aria-label="Bank account">
            <input type="checkbox" checked={form.bankAccount} onChange={update('bankAccount')} />
            <span aria-hidden="true">✓</span>
          </label>
          <input className="form-overlay taxpayer-name" value={form.taxpayerName} onChange={update('taxpayerName')} aria-label="Tax payer or account holder name" />
          <input className="form-overlay payer-account" value={form.payerAccountNumber} onChange={update('payerAccountNumber')} aria-label="Payer account number" />
          <input className="form-overlay amount" value={form.amount} onChange={update('amount')} aria-label="Amount in figures" inputMode="decimal" />
          <input className="form-overlay amount-words" value={form.amountInWords} onChange={update('amountInWords')} aria-label="Amount in words" />
          <textarea className="form-overlay payment-details" value={form.paymentDetails} onChange={update('paymentDetails')} aria-label="Payment details" />
          <div className="form-overlay tin-number" role="group" aria-label="TIN number">
            {tinDigits.map((digit, index) => (
              <input
                key={index}
                ref={(element) => { tinInputRefs.current[index] = element; }}
                className="tin-digit-input"
                value={digit}
                onChange={(event) => writeTinDigits(index, event.target.value)}
                onKeyDown={handleTinKeyDown(index)}
                onPaste={(event) => { event.preventDefault(); writeTinDigits(index, event.clipboardData.getData('text')); }}
                aria-label={`TIN digit ${index + 1}`}
                inputMode="numeric"
                maxLength="1"
              />
            ))}
          </div>
          <input className="form-overlay holder-signature" value={form.accountHolderSignature} onChange={update('accountHolderSignature')} aria-label="Account holder signature" />
          <input className="form-overlay made-by" value={form.madeBy} onChange={update('madeBy')} aria-label="Made by signature" />
          <input className="form-overlay checked-by" value={form.checkedBy} onChange={update('checkedBy')} aria-label="Checked by signature" />
          <input className="form-overlay authorized-by" value={form.authorizedBy} onChange={update('authorizedBy')} aria-label="Authorized by signature" />
          <input className="form-overlay made-date" value={form.madeByDate} onChange={update('madeByDate')} aria-label="Made by payment date" />
          <input className="form-overlay checked-date" value={form.checkedByDate} onChange={update('checkedByDate')} aria-label="Checked by payment date" />
          <input className="form-overlay authorized-date" value={form.authorizedByDate} onChange={update('authorizedByDate')} aria-label="Authorized by payment date" />
        </form>
      </Box>
    </Box>
  );
};

export default FinanceFormsPage;
