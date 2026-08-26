// src/pages/coo2/CooHeader.jsx
import { useRef, useState } from 'react';
import {
  Badge,
  Box,
  Button,
  ButtonGroup,
  Flex,
  HStack,
  IconButton,
  Input,
  Text,
  Tooltip,
  useToast,
} from '@chakra-ui/react';
import { FiBell, FiDownload, FiLogOut, FiMenu, FiUpload } from 'react-icons/fi';
import { useNavigate } from 'react-router-dom';
import { useUserStore } from '../../store/user';
import {
  CUSTOMER_SUCCESS_KPI_DETAILS,
  DEPARTMENT_KPI_SUMMARY,
  FINANCE_KPI_DETAILS,
  HR_KPI_DETAILS,
  IT_KPI_DETAILS,
  SALES_KPI_DETAILS,
  SOCIAL_MEDIA_KPI_DETAILS,
  TRADEX_TV_KPI_DETAILS,
} from './cooData';

const PERIOD_FILTERS = ['Weekly', 'Monthly', 'Quarterly'];

const CooHeader = ({
  onToggleSidebar,
  dateRange,
  setDateRange,
  unreadCount = 3,
  onNotificationsClick,
  onDataImported,
  selectedDepartment = 'all',
}) => {
  const navigate = useNavigate();
  const clearUser = useUserStore((state) => state.clearUser);
  const fileInputRef = useRef(null);
  const toast = useToast();
  const [isImporting, setIsImporting] = useState(false);
  const [isExporting, setIsExporting] = useState(false);

  const handleLogout = () => {
    clearUser();
    navigate('/login', { replace: true });
  };

  const handleExportExcel = async () => {
    setIsExporting(true);
    try {
      const XLSX = await import('xlsx');
      const detailData = selectedDepartment === 'it'
        ? IT_KPI_DETAILS
        : selectedDepartment === 'social_media'
          ? SOCIAL_MEDIA_KPI_DETAILS
          : selectedDepartment === 'sales' ? SALES_KPI_DETAILS : null;
      const sectionTitles = selectedDepartment === 'it'
        ? { internal: 'Internal Deliverables', external: 'External Collateral' }
        : selectedDepartment === 'social_media'
          ? { overall: 'Overall Marketing KPIs', platforms: 'Platform Performance' }
          : { measurements: 'Sales Measurements', services: 'Service Lines', products: 'Product KPIs' };
      const rows = selectedDepartment === 'tradex'
        ? TRADEX_TV_KPI_DETAILS.map((row) => ({ KPI: row.kpi, Value: row.value }))
        : selectedDepartment === 'hr'
        ? HR_KPI_DETAILS.map((row) => ({ KPI: row.kpi, Value: row.value }))
        : selectedDepartment === 'finance' ? FINANCE_KPI_DETAILS.map((row) => ({ Item: row.item, Amount: row.amount }))
        : selectedDepartment === 'customer_services' ? CUSTOMER_SUCCESS_KPI_DETAILS.map((row) => ({
            KPI: row.kpi,
            Target: row.target,
            Actual: row.actual,
            Note: row.note,
          }))
        : detailData ? Object.entries(detailData).flatMap(([section, items]) =>
            items.map((row) => ({
              Section: sectionTitles[section],
              KPI: row.kpi,
              Target: row.target,
              Actual: row.actual,
              'Achievement %': row.achievement,
              Status: row.status,
            }))
          )
        : DEPARTMENT_KPI_SUMMARY.map((row) => ({
            Department: row.department,
            'Key Metric': row.keyMetric,
            Target: row.target,
            Actual: row.actual,
            'Achievement %': row.achievement,
            Status: row.status,
          }));
      const worksheet = XLSX.utils.json_to_sheet(rows);
      const workbook = XLSX.utils.book_new();
      const sheetName = selectedDepartment === 'it'
        ? 'IT KPI Data'
        : selectedDepartment === 'tradex'
          ? 'Tradex TV KPI Data'
        : selectedDepartment === 'social_media'
          ? 'Social Media KPI Data'
          : selectedDepartment === 'sales'
            ? 'Sales KPI Data'
            : selectedDepartment === 'customer_services'
              ? 'Customer Success Data'
              : selectedDepartment === 'finance'
                ? 'Finance KPI Data'
                : selectedDepartment === 'hr' ? 'HR KPI Data' : 'COO KPI Data';
      XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);
      XLSX.writeFile(
        workbook,
        `coo-kpi-export-${dateRange.toLowerCase()}-${new Date().toISOString().slice(0, 10)}.xlsx`
      );
      toast({
        title: 'Excel export complete',
        description: `${rows.length} KPI records were exported.`,
        status: 'success',
        duration: 2500,
        isClosable: true,
      });
    } catch (error) {
      toast({
        title: 'Excel export failed',
        description: error.message,
        status: 'error',
        duration: 3500,
        isClosable: true,
      });
    } finally {
      setIsExporting(false);
    }
  };

  const handleImportExcel = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsImporting(true);
    try {
      const XLSX = await import('xlsx');
      const workbook = XLSX.read(await file.arrayBuffer(), { type: 'array' });
      const firstSheet = workbook.SheetNames[0];
      const rows = XLSX.utils.sheet_to_json(workbook.Sheets[firstSheet], { defval: '' });
      let updatedCount = 0;

      rows.forEach((row) => {
        if (selectedDepartment === 'tradex') {
          const detailRow = TRADEX_TV_KPI_DETAILS.find(
            (item) => item.kpi.toLowerCase() === String(row.KPI || '').trim().toLowerCase()
          );
          if (!detailRow) return;
          if (row.Value !== undefined && row.Value !== '') detailRow.value = Number(row.Value) || 0;
          updatedCount += 1;
          return;
        }

        if (selectedDepartment === 'hr') {
          const detailRow = HR_KPI_DETAILS.find(
            (item) => item.kpi.toLowerCase() === String(row.KPI || '').trim().toLowerCase()
          );
          if (!detailRow) return;
          if (row.Value !== undefined && row.Value !== '') {
            detailRow.value = typeof row.Value === 'number' ? row.Value : String(row.Value);
          }
          updatedCount += 1;
          return;
        }

        if (selectedDepartment === 'finance') {
          const detailRow = FINANCE_KPI_DETAILS.find(
            (item) => item.item.toLowerCase() === String(row.Item || '').trim().toLowerCase()
          );
          if (!detailRow) return;
          if (row.Amount === '') {
            detailRow.amount = null;
          } else if (row.Amount !== undefined) {
            detailRow.amount = typeof row.Amount === 'number' ? row.Amount : String(row.Amount);
          }
          updatedCount += 1;
          return;
        }

        if (selectedDepartment === 'customer_services') {
          const detailRow = CUSTOMER_SUCCESS_KPI_DETAILS.find(
            (item) => item.kpi.toLowerCase() === String(row.KPI || '').trim().toLowerCase()
          );
          if (!detailRow) return;
          if (row.Target !== '' && row.Target !== undefined) detailRow.target = Number(row.Target);
          if (row.Actual !== '' && row.Actual !== undefined) detailRow.actual = Number(row.Actual);
          if (row.Note) detailRow.note = String(row.Note);
          updatedCount += 1;
          return;
        }

        if (['it', 'social_media', 'sales'].includes(selectedDepartment)) {
          const sectionName = String(row.Section || '').trim().toLowerCase();
          const detailData = selectedDepartment === 'it'
            ? IT_KPI_DETAILS
            : selectedDepartment === 'social_media' ? SOCIAL_MEDIA_KPI_DETAILS : SALES_KPI_DETAILS;
          const section = selectedDepartment === 'it'
            ? sectionName.includes('external') ? detailData.external : detailData.internal
            : selectedDepartment === 'social_media'
              ? sectionName.includes('platform performance') ? detailData.platforms : detailData.overall
              : sectionName.includes('service')
                ? detailData.services
                : sectionName.includes('product') ? detailData.products : detailData.measurements;
          const detailRow = section.find((item) => item.kpi.toLowerCase() === String(row.KPI || '').trim().toLowerCase());
          if (!detailRow) return;
          if (row.Target !== '' && row.Target !== undefined) detailRow.target = Number(row.Target);
          if (row.Actual !== '' && row.Actual !== undefined) detailRow.actual = Number(row.Actual);
          if (row.Status) detailRow.status = String(row.Status);
          detailRow.achievement = row['Achievement %'] !== '' && row['Achievement %'] !== undefined
            ? Number(String(row['Achievement %']).replace('%', ''))
            : detailRow.status === 'Not Reported'
              ? null
              : detailRow.target ? Math.round((detailRow.actual / detailRow.target) * 100) : 0;
          updatedCount += 1;
          return;
        }

        const departmentName = String(row.Department || row.department || '').trim().toLowerCase();
        const summaryRow = DEPARTMENT_KPI_SUMMARY.find(
          (item) => item.department.toLowerCase() === departmentName
        );

        if (!summaryRow) return;
        if (row['Key Metric']) summaryRow.keyMetric = String(row['Key Metric']);
        if (row.Target !== '' && row.Target !== undefined) summaryRow.target = Number(row.Target);
        if (row.Actual !== '' && row.Actual !== undefined) summaryRow.actual = Number(row.Actual);
        if (row['Achievement %'] !== '' && row['Achievement %'] !== undefined) {
          summaryRow.achievement = Number(String(row['Achievement %']).replace('%', ''));
        } else if (summaryRow.target) {
          summaryRow.achievement = Math.round((summaryRow.actual / summaryRow.target) * 100);
        }
        if (row.Status) summaryRow.status = String(row.Status);
        updatedCount += 1;
      });

      if (!updatedCount) {
        throw new Error('No matching KPI rows found. Export the current file first and use it as the import template.');
      }

      onDataImported?.();
      toast({
        title: 'Excel import complete',
        description: `${updatedCount} KPI records were updated.`,
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
    } catch (error) {
      toast({
        title: 'Excel import failed',
        description: error.message,
        status: 'error',
        duration: 4000,
        isClosable: true,
      });
    } finally {
      setIsImporting(false);
      event.target.value = '';
    }
  };

  return (
    <Box
      bg="#ffffff"
      borderBottom="1px solid #e2e8f0"
      px={{ base: 4, md: 6 }}
      py={3}
      position="sticky"
      top={0}
      zIndex={10}
      flexShrink={0}
      boxShadow="0 1px 3px rgba(0, 0, 0, 0.03)"
    >
      <Flex align="center" gap={3}>
        <IconButton
          icon={<FiMenu size={19} />}
          variant="ghost"
          color="#64748b"
          aria-label="Toggle navigation"
          onClick={onToggleSidebar}
          _hover={{ bg: '#f1f5f9', color: '#0f172a' }}
          borderRadius="10px"
        />

        <HStack spacing={2} ml="auto">
          <Input
            ref={fileInputRef}
            type="file"
            accept=".xlsx,.xls,.csv"
            display="none"
            onChange={handleImportExcel}
          />
          <Button
            size="sm"
            variant="outline"
            borderColor="#bbf7d0"
            color="#15803d"
            leftIcon={<FiUpload />}
            onClick={() => fileInputRef.current?.click()}
            isLoading={isImporting}
            loadingText="Importing"
          >
            Import Excel
          </Button>
          <Button
            size="sm"
            colorScheme="green"
            leftIcon={<FiDownload />}
            onClick={handleExportExcel}
            isLoading={isExporting}
            loadingText="Exporting"
          >
            Export Excel
          </Button>
        </HStack>

        <Tooltip label="Notifications" placement="bottom">
          <Box position="relative">
            <IconButton
              size="sm"
              variant="ghost"
              borderRadius="10px"
              color="#64748b"
              _hover={{ bg: '#f1f5f9', color: '#0f172a' }}
              icon={<FiBell size={18} />}
              aria-label="Notifications"
              onClick={onNotificationsClick}
            />
            {unreadCount > 0 && (
              <Badge
                position="absolute"
                top="-3px"
                right="-3px"
                bg="#ef4444"
                color="white"
                fontSize="9px"
                borderRadius="full"
                minW="18px"
                h="18px"
                display="flex"
                alignItems="center"
                justifyContent="center"
                border="2px solid #ffffff"
              >
                {unreadCount}
              </Badge>
            )}
          </Box>
        </Tooltip>

        <Button
          size="sm"
          ml={{ base: 0, xl: 1 }}
          variant="outline"
          colorScheme="red"
          leftIcon={<FiLogOut />}
          onClick={handleLogout}
        >
          Logout
        </Button>
      </Flex>

      <Flex
        align="center"
        gap={3}
        mt={3}
        mb={-3}
        mx={{ base: -4, md: -6 }}
        px={{ base: 4, md: 6 }}
        py={2.5}
        bg="#f8fafc"
        borderTop="1px solid #e2e8f0"
      >
        <Text
          fontSize="11px"
          fontWeight="700"
          color="#64748b"
          textTransform="uppercase"
          letterSpacing="0.08em"
          whiteSpace="nowrap"
        >
          Reporting period
        </Text>
        <ButtonGroup size="sm" isAttached variant="outline">
          {PERIOD_FILTERS.map((period) => {
            const isActive = dateRange === period;
            return (
              <Button
                key={period}
                minW={{ base: 'auto', sm: '92px' }}
                onClick={() => setDateRange(period)}
                bg={isActive ? '#2563eb' : '#ffffff'}
                color={isActive ? '#ffffff' : '#475569'}
                borderColor={isActive ? '#2563eb' : '#cbd5e1'}
                _hover={{ bg: isActive ? '#1d4ed8' : '#ffffff' }}
              >
                {period}
              </Button>
            );
          })}
        </ButtonGroup>
      </Flex>
    </Box>
  );
};

export default CooHeader;
