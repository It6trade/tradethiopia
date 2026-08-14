import { useEffect, useState, useMemo } from 'react';
import {
  List,
  ListItem,
  HStack,
  Box,
  IconButton,
  Button,
  useDisclosure,
  Input,
  Text,
  Divider,
  Flex,
  Checkbox,
  VStack,
  Select,
  useColorModeValue,
  useToast,
  Badge,
  Icon,
} from '@chakra-ui/react';
import { DeleteIcon, DownloadIcon } from '@chakra-ui/icons';
import { FiMail, FiGlobe, FiPhone, FiShield } from 'react-icons/fi';
import axios from 'axios';
import * as XLSX from 'xlsx';
import AssetDetailDrawer from './AssetDetailDrawer';

const AssetList = ({ readOnly = false, intangibleOnly = false }) => {
  const [assets, setAssets] = useState([]);
  const { isOpen, onOpen, onClose } = useDisclosure();
  const [selectedAsset, setSelectedAsset] = useState(null);
  const [filter, setFilter] = useState('');
  const [selectedCategories, setSelectedCategories] = useState([]);
  const [assignedTo, setAssignedTo] = useState('');
  const [location] = useState('');
  const [status, setStatus] = useState('');
  const [selectedGroup, setSelectedGroup] = useState('');
  const toast = useToast();

  const fetchAssetsData = async () => {
    try {
      const response = await axios.get(`${import.meta.env.VITE_API_URL}/api/assets`);
      const assetsData = response.data && response.data.data ? response.data.data : [];
      setAssets(assetsData);
    } catch (error) {
      console.error("Error fetching assets:", error);
      setAssets([]);
    }
  };

  useEffect(() => {
    fetchAssetsData();
  }, []);

  const handleDelete = async (id) => {
    const confirmDelete = window.confirm("Are you sure you want to delete this asset?");
    if (confirmDelete) {
      try {
        await axios.delete(`${import.meta.env.VITE_API_URL}/api/assets/${id}`);
        fetchAssetsData();
      } catch (error) {
        console.error("Error deleting asset:", error.response?.data || error.message);
      }
    }
  };

  const handleUpdateAsset = async () => {
    if (readOnly) return;
    try {
      await axios.put(`${import.meta.env.VITE_API_URL}/api/assets/${selectedAsset._id}`, selectedAsset);
      fetchAssetsData();
      onClose();
    } catch (error) {
      console.error("Error updating asset:", error.response?.data || error.message);
    }
  };

  const handleAssetClick = (asset) => {
    setSelectedAsset(asset);
    onOpen();
  };

  const handleCategoryChange = (category) => {
    setSelectedCategories((prev) => {
      if (prev.includes(category)) {
        return prev.filter((c) => c !== category);
      } else {
        return [...prev, category];
      }
    });
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'Active':
        return 'green.500';
      case 'Inactive':
        return 'red.500';
      case 'Under Maintenance':
        return 'yellow.500';
      default:
        return 'gray.500';
    }
  };

  // Helper to determine if an asset is intangible (digital assets, credentials, software licenses, domains, etc.)
  const isIntangible = (asset) => {
    if (!asset) return false;
    const group = (asset.assets || "").toLowerCase().trim();
    const cat = (asset.category || "").toLowerCase().trim();
    
    // Explicitly tangible if tagged Tangible
    if (group === "tangible") return false;
    
    // Explicitly intangible if tagged Intangible
    if (group === "intangible") return true;
    
    // Fallback search keywords for items classified loosely in categories
    const intangibleKeywords = ["intangible", "email", "gmail", "social", "linkedin", "linkden", "account", "credential", "phone number"];
    return (
      intangibleKeywords.some(keyword => cat.includes(keyword)) ||
      intangibleKeywords.some(keyword => group.includes(keyword))
    );
  };

  // Restrict the active pool of assets if intangibleOnly is enabled
  const filteredAssetPool = useMemo(() => {
    if (!Array.isArray(assets)) return [];
    if (intangibleOnly) {
      return assets.filter(isIntangible);
    }
    return assets;
  }, [assets, intangibleOnly]);

  const filteredAssets = filteredAssetPool.filter(asset => {
    if (!asset) return false;
    
    const matchesSearch = 
      (asset.name ? asset.name.toLowerCase().includes(filter.toLowerCase()) : false) ||
      (asset.nameTag ? asset.nameTag.toLowerCase().includes(filter.toLowerCase()) : false) ||
      (asset.assignedTo ? asset.assignedTo.toLowerCase().includes(filter.toLowerCase()) : false) ||
      (asset.category ? asset.category.toLowerCase().includes(filter.toLowerCase()) : false) ||
      (asset.assets ? asset.assets.toLowerCase().includes(filter.toLowerCase()) : false);
    
    const matchesCategory = selectedCategories.length === 0 || selectedCategories.includes(asset.category);
    const matchesAssignedTo = assignedTo ? asset.assignedTo === assignedTo : true;
    const matchesAssets = location ? asset.assets === location : true;
    const matchesLocation = location ? asset.location === location : true;
    const matchesStatus = status ? asset.status === status : true;
    const matchesGroup = selectedGroup ? asset.assets === selectedGroup : true;
  
    return matchesSearch && matchesCategory && matchesAssignedTo && matchesLocation && matchesStatus && matchesAssets && matchesGroup;
  });

  const handleExportToExcel = () => {
    if (!Array.isArray(filteredAssetPool) || filteredAssetPool.length === 0) {
      toast({ title: 'No assets to export', status: 'info', duration: 2500, isClosable: true });
      return;
    }

    try {
      const exportData = filteredAssets.map((asset) => ({
        'Name Tag': asset?.nameTag || '',
        Name: asset?.name || '',
        Category: asset?.category || '',
        'Assigned To': asset?.assignedTo || '',
        Group: asset?.assets || '',
        Location: asset?.location || '',
        Status: asset?.status || '',
        'Date Acquired': asset?.dateAcquired
          ? new Date(asset.dateAcquired).toISOString().slice(0, 10)
          : '',
      }));

      const worksheet = XLSX.utils.json_to_sheet(exportData);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Assets');
      XLSX.writeFile(workbook, `assets_${new Date().toISOString().slice(0, 10)}.xlsx`);
      toast({ title: 'Export complete', description: 'Asset data exported to Excel.', status: 'success', duration: 3000, isClosable: true });
    } catch (error) {
      console.error('Error exporting assets:', error);
      toast({ title: 'Export failed', description: 'Could not export asset data.', status: 'error', duration: 3000, isClosable: true });
    }
  };

  const uniqueCategories = Array.isArray(filteredAssetPool) ? [...new Set(filteredAssetPool.map(asset => asset?.category).filter(Boolean))] : [];
  const uniqueAssignedTo = Array.isArray(filteredAssetPool) ? [...new Set(filteredAssetPool.map(asset => asset?.assignedTo).filter(Boolean))] : [];
  const uniqueAssets = Array.isArray(filteredAssetPool) ? [...new Set(filteredAssetPool.map(asset => asset?.assets).filter(Boolean))] : [];
  const uniqueStatuses = Array.isArray(filteredAssetPool) ? [...new Set(filteredAssetPool.map(asset => asset?.status).filter(Boolean))] : [];

  const filterPanelBg = useColorModeValue(
    'linear-gradient(180deg, rgba(255,255,255,0.98), rgba(248,250,252,0.94))',
    'linear-gradient(180deg, rgba(15,23,42,0.96), rgba(30,41,59,0.88))'
  );
  const filterPanelBorder = useColorModeValue('rgba(226,232,240,0.95)', 'rgba(148,163,184,0.18)');
  const filterPanelShadow = useColorModeValue('0 18px 46px rgba(15,23,42,0.08)', '0 20px 54px rgba(0,0,0,0.34)');
  const fieldBorder = useColorModeValue('rgba(203,213,225,0.95)', 'rgba(148,163,184,0.28)');
  const filterLabelColor = useColorModeValue('#0F172A', 'gray.100');
  const filterMuted = useColorModeValue('#64748B', 'gray.400');
  const filterAccentBg = useColorModeValue('rgba(37,99,235,0.08)', 'rgba(37,99,235,0.2)');
  const categoryBg = useColorModeValue('rgba(248,250,252,0.9)', 'whiteAlpha.50');
  const assetRowBg = useColorModeValue('white', 'gray.800');
  const assetRowHoverBg = useColorModeValue('gray.100', 'gray.600');
  const focusRing = '0 0 0 3px rgba(37,99,235,0.18)';
  const fieldStyles = {
    borderRadius: '16px',
    borderColor: fieldBorder,
    bg: useColorModeValue('white', 'whiteAlpha.50'),
    _hover: { borderColor: '#2563EB' },
    _focus: { borderColor: '#2563EB', boxShadow: focusRing },
  };
  const filterLabelProps = {
    fontSize: 'xs',
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: '0.08em',
    color: filterLabelColor,
    mb: 2,
  };

  return (
    <Flex direction={{ base: 'column', md: 'row' }} p={{ base: 2, md: 4 }} gap={5}>
      <Box 
        width={{ base: '100%', md: '30%' }} 
        p={5} 
        borderWidth={1} 
        borderRadius="24px" 
        boxShadow={filterPanelShadow}
        bg={filterPanelBg}
        borderColor={filterPanelBorder}
        position={{ md: 'sticky' }}
        top={{ md: 4 }}
        alignSelf="flex-start"
      >
        <HStack justify="space-between" align="start" mb={5}>
          <Box>
            <Text fontSize="xl" fontWeight="800" color={filterLabelColor}>Asset Filters</Text>
            <Text fontSize="sm" color={filterMuted} mt={1}>
              {filteredAssets.length} of {filteredAssetPool.length} visible
            </Text>
          </Box>
          <Box px={3} py={1} borderRadius="full" bg={filterAccentBg} color="#2563EB" fontSize="xs" fontWeight="800">
            Read only
          </Box>
        </HStack>

        <Input
          placeholder="Search assets, tags, owners..."
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          mb={5}
          {...fieldStyles}
        />

        <Divider borderColor={filterPanelBorder} />

        <Text {...filterLabelProps} mt={5}>Assigned To</Text>
        <Select
          placeholder="Select Assigned To"
          value={assignedTo}
          onChange={(e) => setAssignedTo(e.target.value)}
          mb={4}
          {...fieldStyles}
        >
          {uniqueAssignedTo.map((person) => (
            <option key={person} value={person}>{person}</option>
          ))}
        </Select>

        {!intangibleOnly && (
          <>
            <Text {...filterLabelProps}>Group</Text>
            <Select
              placeholder="Select Group"
              value={selectedGroup}
              onChange={(e) => setSelectedGroup(e.target.value)}
              mb={4}
              {...fieldStyles}
            >
              {uniqueAssets.filter(group => group).map((group) => (
                <option key={group} value={group}>{group}</option>
              ))}
            </Select>
          </>
        )}

        <Text {...filterLabelProps}>Status</Text>
        <Select
          placeholder="Select Status"
          value={status}
          onChange={(e) => setStatus(e.target.value)}
          mb={4}
          {...fieldStyles}
        >
          {uniqueStatuses.map((stat) => (
            <option key={stat} value={stat}>{stat}</option>
          ))}
        </Select>

        <Divider my={5} borderColor={filterPanelBorder} />

        <Text {...filterLabelProps}>Categories</Text>
        <VStack align="stretch" spacing={2} maxH="300px" overflowY="auto">
          <Checkbox 
            isChecked={selectedCategories.length === uniqueCategories.length && uniqueCategories.length > 0}
            onChange={() => {
              if (selectedCategories.length === uniqueCategories.length) {
                setSelectedCategories([]);
              } else {
                setSelectedCategories(uniqueCategories);
              }
            }}
            colorScheme="blue"
            px={3}
            py={2}
            borderRadius="14px"
            bg={categoryBg}
          >
            Select All
          </Checkbox>
          {uniqueCategories.map((category) => (
            <Checkbox
              key={category}
              isChecked={selectedCategories.includes(category)}
              onChange={() => handleCategoryChange(category)}
              colorScheme="blue"
              px={3}
              py={2}
              borderRadius="14px"
              bg={selectedCategories.includes(category) ? filterAccentBg : categoryBg}
            >
              {category}
            </Checkbox>
          ))}
        </VStack>
      </Box>
 
      <Box width={{ base: '100%', md: '70%' }} p={{ base: 0, md: 4 }}>
        <Flex justify={{ base: 'stretch', md: 'flex-end' }} mb={3}>
          <Button
            leftIcon={<DownloadIcon />}
            variant="outline"
            colorScheme="teal"
            size="sm"
            w={{ base: '100%', md: 'auto' }}
            onClick={handleExportToExcel}
          >
            Export Excel
          </Button>
        </Flex>
        <List spacing={3}>
          {filteredAssets.map(asset => {
            const statusColor = getStatusColor(asset?.status);
            
            // Context-aware icon assignment
            let assetIcon = FiShield;
            const cat = (asset?.category || "").toLowerCase();
            if (cat.includes("email") || cat.includes("gmail")) {
              assetIcon = FiMail;
            } else if (cat.includes("social") || cat.includes("linkedin") || cat.includes("linkden") || cat.includes("youtube") || cat.includes("facebook")) {
              assetIcon = FiGlobe;
            } else if (cat.includes("phone")) {
              assetIcon = FiPhone;
            }

            return (
              <ListItem
                key={asset?._id || asset?.nameTag}
                p={3}
                borderWidth={1}
                borderColor={filterPanelBorder}
                borderRadius="16px"
                bg={assetRowBg}
                _hover={{ bg: assetRowHoverBg, borderColor: 'blue.200' }}
                display="flex"
                alignItems="center"
                justifyContent="space-between"
                transition="all 0.15s ease"
              >
                <HStack spacing={3.5} minW={0} flex="1">
                  <Flex
                    w="34px"
                    h="34px"
                    align="center"
                    justify="center"
                    borderRadius="10px"
                    bg={filterAccentBg}
                    color="blue.500"
                    flexShrink={0}
                  >
                    <Icon as={assetIcon} boxSize={4} />
                  </Flex>

                  <Box minW={0} flex="1">
                    <HStack spacing={2} align="center" flexWrap="wrap">
                      <Text
                        onClick={() => handleAssetClick(asset)}
                        fontWeight="700"
                        fontSize="sm"
                        cursor="pointer"
                        color="blue.500"
                        _hover={{ textDecoration: 'underline' }}
                        noOfLines={1}
                      >
                        {asset?.nameTag}
                      </Text>
                      <Badge colorScheme="blue" variant="subtle" size="sm" borderRadius="6px" px={2}>
                        {asset?.category}
                      </Badge>
                      <Badge colorScheme={asset?.assets === "Intangible" ? "purple" : "gray"} variant="outline" size="sm" borderRadius="6px" px={1.5} fontSize="9px">
                        {asset?.assets || "Group"}
                      </Badge>
                    </HStack>
                    <Text fontSize="xs" color={filterMuted} mt={0.5} noOfLines={1}>
                      {asset?.name} · Assigned: <Text as="span" fontWeight="700" color={useColorModeValue('gray.800', 'white')}>{asset?.assignedTo || "Unassigned"}</Text>
                    </Text>
                  </Box>
                </HStack>

                <HStack spacing={4} flexShrink={0}>
                  <HStack spacing={1.5}>
                    <Box w="6px" h="6px" borderRadius="full" bg={statusColor} />
                    <Text fontSize="xs" fontWeight="700">{asset?.status}</Text>
                  </HStack>

                  <Button
                    size="xs"
                    variant="outline"
                    borderRadius="8px"
                    onClick={() => handleAssetClick(asset)}
                  >
                    Details
                  </Button>

                  {!readOnly && (
                    <IconButton
                      icon={<DeleteIcon />}
                      onClick={() => handleDelete(asset?._id)}
                      aria-label="Delete Asset"
                      variant="outline"
                      colorScheme="red"
                      size="xs"
                      borderRadius="8px"
                    />
                  )}
                </HStack>
              </ListItem>
            );
          })}
        </List>

        <AssetDetailDrawer
          isOpen={isOpen}
          onClose={onClose}
          selectedAsset={selectedAsset}
          setSelectedAsset={setSelectedAsset}
          handleUpdateAsset={handleUpdateAsset}
          readOnly={readOnly}
        />
      </Box>
    </Flex>
  );
};

export default AssetList;
