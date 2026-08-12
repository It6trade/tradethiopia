import React, { useState, useEffect } from 'react';
import { 
  Button, 
  FormControl, 
  FormLabel, 
  Input, 
  Select, 
  useToast, 
  Textarea, 
  VStack, 
  HStack, 
  SimpleGrid, 
  Box, 
  Text,
  InputGroup,
  InputLeftAddon,
  Icon
} from '@chakra-ui/react';
import { FiPackage, FiUploadCloud, FiTag, FiMapPin, FiUser, FiCalendar, FiDollarSign } from 'react-icons/fi';
import axios from 'axios';

const GREEN_PRIMARY = "#1a2e22";
const GREEN_ACCENT  = "#2d6a4f";
const GREEN_HOVER   = "#3a7d5c";

const AssetForm = ({ fetchAssets, assetToEdit, setAssetToEdit, categories = [], onSuccess }) => {
  const [name, setName] = useState('');
  const [nameTag, setNameTag] = useState('');
  const [assets, setAssets] = useState('Tangible');
  const [location, setLocation] = useState('');
  const [assignedTo, setAssignedTo] = useState('Unassigned');
  const [status, setStatus] = useState('Active');
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState('');
  const [dateAcquired, setDateAcquired] = useState('');
  const [description, setDescription] = useState('');
  const [imageURL, setImageURL] = useState('');
  const [warrantyExpiry, setWarrantyExpiry] = useState('');
  const [users, setUsers] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isNewCategoryMode, setIsNewCategoryMode] = useState(false);
  const toast = useToast();

  // Populate form fields if editing an asset
  useEffect(() => {
    if (assetToEdit) {
      setName(assetToEdit.name || '');
      setNameTag(assetToEdit.nameTag || '');
      setAssets(assetToEdit.assets || 'Tangible');
      setLocation(assetToEdit.location || '');
      setAssignedTo(assetToEdit.assignedTo || 'Unassigned');
      setStatus(assetToEdit.status || 'Active');
      setAmount(assetToEdit.amount || '');
      const cat = assetToEdit.category || '';
      setCategory(cat);
      setDateAcquired(assetToEdit.dateAcquired ? assetToEdit.dateAcquired.split('T')[0] : '');
      setDescription(assetToEdit.description || '');
      setImageURL(assetToEdit.imageURL || '');
      setWarrantyExpiry(assetToEdit.warrantyExpiry ? assetToEdit.warrantyExpiry.split('T')[0] : '');
      
      if (cat && !categories.includes(cat)) {
        setIsNewCategoryMode(true);
      } else {
        setIsNewCategoryMode(false);
      }
    } else {
      setName('');
      setNameTag('');
      setAssets('Tangible');
      setLocation('');
      setAssignedTo('Unassigned');
      setStatus('Active');
      setAmount('');
      setCategory('');
      setDateAcquired(new Date().toISOString().split('T')[0]);
      setDescription('');
      setImageURL('');
      setWarrantyExpiry('');
      setIsNewCategoryMode(false);
    }
  }, [assetToEdit, categories]);

  // Fetch users for assignment
  useEffect(() => {
    const fetchAllUsers = async () => {
      try {
        const response = await axios.get(`${import.meta.env.VITE_API_URL}/api/users`);
        const data = Array.isArray(response.data) ? response.data : response.data?.data || [];
        setUsers(data.filter(u => u.username && u.username !== "." && u.username !== ".."));
      } catch (error) {
        console.error("Error fetching users in form:", error);
      }
    };
    fetchAllUsers();
  }, []);

  const handleCapitalizedChange = (setter) => (e) => {
    const value = e.target.value;
    if (value) {
      setter(value.charAt(0).toUpperCase() + value.slice(1));
    } else {
      setter('');
    }
  };

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      setImageURL(event.target.result);
      toast({ title: "Image loaded successfully", status: "info", duration: 2000 });
    };
    reader.readAsDataURL(file);
  };

  const cleanCategory = (cat) => {
    if (!cat) return "";
    let s = String(cat).trim();
    if (!s) return "";
    s = s.split(/\s+/)
         .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
         .join(' ');
    if (s === "Chairs") s = "Chair";
    if (s === "Tables") s = "Table";
    if (s === "Laptops") s = "Laptop";
    if (s === "Desktops") s = "Desktop";
    if (s === "Phones" || s === "Phone Numbers") s = "Phone";
    if (s === "Printers") s = "Printer";
    if (s === "Servers") s = "Server";
    if (s === "Harddisks" || s === "Harddisk 1tb") s = "Harddisk 1TB";
    if (s === "Social Medias") s = "Social Media";
    return s;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!name.trim() || !nameTag.trim() || !location.trim() || !category.trim() || !dateAcquired) {
      toast({
        title: "Required fields missing",
        description: "Please fill in Name, Name Tag, Location, Category, and Date Acquired.",
        status: "warning",
        duration: 4000,
        isClosable: true
      });
      return;
    }

    setIsSubmitting(true);
    const cleanedCategory = cleanCategory(category);
    const payload = {
      name,
      nameTag,
      assets,
      location,
      assignedTo,
      status,
      amount: amount ? parseFloat(amount) : 0,
      category: cleanedCategory,
      dateAcquired: new Date(dateAcquired).toISOString(),
      description,
      imageURL,
      warrantyExpiry: warrantyExpiry ? new Date(warrantyExpiry).toISOString() : null,
    };

    try {
      if (assetToEdit) {
        await axios.put(`${import.meta.env.VITE_API_URL}/api/assets/${assetToEdit._id}`, payload);
        toast({
          title: "Asset Updated",
          description: `Successfully updated ${name}`,
          status: "success",
          duration: 3000,
          isClosable: true,
        });
      } else {
        await axios.post(`${import.meta.env.VITE_API_URL}/api/assets`, payload);
        toast({
          title: "Asset Created",
          description: `Successfully added ${name} to inventory`,
          status: "success",
          duration: 3000,
          isClosable: true,
        });
      }

      if (fetchAssets) fetchAssets();
      if (setAssetToEdit) setAssetToEdit(null);
      if (onSuccess) onSuccess();
    } catch (error) {
      console.error("Error submitting asset:", error);
      toast({
        title: "Submission failed",
        description: error.response?.data?.message || error.message,
        status: "error",
        duration: 5000,
        isClosable: true
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Box as="form" onSubmit={handleSubmit} py={4} color="gray.800">
      <VStack spacing={4} align="stretch">
        <SimpleGrid columns={{ base: 1, sm: 2 }} spacing={4}>
          <FormControl isRequired>
            <FormLabel fontSize="xs" fontWeight="800" color="gray.500" mb={1}>Asset Name</FormLabel>
            <Input
              size="sm"
              borderRadius="none"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Dell Latitude 5420"
            />
          </FormControl>

          <FormControl isRequired>
            <FormLabel fontSize="xs" fontWeight="800" color="gray.500" mb={1}>Name Tag / Barcode</FormLabel>
            <Input
              size="sm"
              borderRadius="none"
              value={nameTag}
              onChange={(e) => setNameTag(e.target.value)}
              placeholder="e.g. ETH-LP-202"
            />
          </FormControl>
        </SimpleGrid>

        <SimpleGrid columns={{ base: 1, sm: 2 }} spacing={4}>
          <FormControl isRequired>
            <FormLabel fontSize="xs" fontWeight="800" color="gray.500" mb={1}>Asset Category</FormLabel>
            {isNewCategoryMode ? (
              <VStack align="start" spacing={1} w="full">
                <Input
                  size="sm"
                  borderRadius="none"
                  value={category}
                  onChange={handleCapitalizedChange(setCategory)}
                  placeholder="Enter new category name"
                />
                <Button 
                  size="xs" 
                  variant="link" 
                  color={GREEN_ACCENT} 
                  _hover={{ textDecoration: 'underline' }}
                  onClick={() => {
                    setIsNewCategoryMode(false);
                    setCategory(categories[0] || "");
                  }}
                >
                  Choose existing category...
                </Button>
              </VStack>
            ) : (
              <VStack align="start" spacing={1} w="full">
                <Select
                  size="sm"
                  borderRadius="none"
                  value={category}
                  onChange={(e) => {
                    const val = e.target.value;
                    if (val === "CREATE_NEW_VAL") {
                      setIsNewCategoryMode(true);
                      setCategory("");
                    } else {
                      setCategory(val);
                    }
                  }}
                  fontWeight="700"
                >
                  <option value="">Select Category</option>
                  {categories.map(c => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                  <option value="CREATE_NEW_VAL" style={{ fontWeight: '800', color: GREEN_ACCENT }}>
                    + Register New Category...
                  </option>
                </Select>
              </VStack>
            )}
          </FormControl>

          <FormControl>
            <FormLabel fontSize="xs" fontWeight="800" color="gray.500" mb={1}>Asset Group</FormLabel>
            <Select
              size="sm"
              borderRadius="none"
              value={assets}
              onChange={(e) => setAssets(e.target.value)}
              fontWeight="700"
            >
              <option value="Tangible">Tangible Asset</option>
              <option value="Intangible">Intangible Asset</option>
            </Select>
          </FormControl>
        </SimpleGrid>

        <SimpleGrid columns={{ base: 1, sm: 2 }} spacing={4}>
          <FormControl isRequired>
            <FormLabel fontSize="xs" fontWeight="800" color="gray.500" mb={1}>Location</FormLabel>
            <Input
              size="sm"
              borderRadius="none"
              value={location}
              onChange={handleCapitalizedChange(setLocation)}
              placeholder="e.g. HQ 4th Floor"
            />
          </FormControl>

          <FormControl>
            <FormLabel fontSize="xs" fontWeight="800" color="gray.500" mb={1}>Assigned To</FormLabel>
            <Select
              size="sm"
              borderRadius="none"
              value={assignedTo}
              onChange={(e) => setAssignedTo(e.target.value)}
              fontWeight="700"
            >
              <option value="Unassigned">Unassigned</option>
              {users
                .filter(u => u.status && u.status.toLowerCase() === 'active')
                .sort((a, b) => a.username.localeCompare(b.username))
                .map(u => (
                  <option key={u._id} value={u.username}>{u.username}</option>
                ))}
            </Select>
          </FormControl>
        </SimpleGrid>

        <SimpleGrid columns={{ base: 1, sm: 2 }} spacing={4}>
          <FormControl>
            <FormLabel fontSize="xs" fontWeight="800" color="gray.500" mb={1}>Lifecycle Status</FormLabel>
            <Select
              size="sm"
              borderRadius="none"
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              fontWeight="700"
            >
              <option value="Active">Active</option>
              <option value="Inactive">Inactive</option>
              <option value="Under Maintenance">Under Maintenance</option>
            </Select>
          </FormControl>

          <FormControl>
            <FormLabel fontSize="xs" fontWeight="800" color="gray.500" mb={1}>Acquisition Value (ETB)</FormLabel>
            <InputGroup size="sm">
              <InputLeftAddon borderRadius="none" fontSize="10px" fontWeight="700" bg="gray.100">ETB</InputLeftAddon>
              <Input
                type="number"
                borderRadius="none"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0.00"
              />
            </InputGroup>
          </FormControl>
        </SimpleGrid>

        <SimpleGrid columns={{ base: 1, sm: 2 }} spacing={4}>
          <FormControl isRequired>
            <FormLabel fontSize="xs" fontWeight="800" color="gray.500" mb={1}>Date Acquired</FormLabel>
            <Input
              type="date"
              size="sm"
              borderRadius="none"
              value={dateAcquired}
              onChange={(e) => setDateAcquired(e.target.value)}
            />
          </FormControl>

          <FormControl>
            <FormLabel fontSize="xs" fontWeight="800" color="gray.500" mb={1}>Warranty Expiry Date</FormLabel>
            <Input
              type="date"
              size="sm"
              borderRadius="none"
              value={warrantyExpiry}
              onChange={(e) => setWarrantyExpiry(e.target.value)}
            />
          </FormControl>
        </SimpleGrid>

        <FormControl>
          <FormLabel fontSize="xs" fontWeight="800" color="gray.500" mb={1}>Description / Spec Details</FormLabel>
          <Textarea
            borderRadius="none"
            size="sm"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Add detailed specs, configurations, or serial numbers..."
            rows={3}
          />
        </FormControl>

        <FormControl>
          <FormLabel fontSize="xs" fontWeight="800" color="gray.500" mb={1}>Asset Photo</FormLabel>
          <HStack spacing={2}>
            <Button
              size="sm"
              variant="outline"
              borderRadius="none"
              leftIcon={<FiUploadCloud />}
              onClick={() => document.getElementById('form-asset-img-upload').click()}
              fontSize="xs"
              fontWeight="700"
              flex={1}
            >
              {imageURL ? "Change Photo" : "Upload Local Photo..."}
            </Button>
            <input
              type="file"
              id="form-asset-img-upload"
              accept="image/*"
              style={{ display: 'none' }}
              onChange={handleImageUpload}
            />
            {imageURL && (
              <Box w="36px" h="36px" border="1px solid" borderColor="gray.200" overflow="hidden" bg="white">
                <Box as="img" src={imageURL} w="100%" h="100%" objectFit="cover" />
              </Box>
            )}
          </HStack>
          <Input
            mt={2}
            size="xs"
            borderRadius="none"
            value={imageURL.startsWith('data:') ? '' : imageURL}
            onChange={(e) => setImageURL(e.target.value)}
            placeholder="Or enter direct image URL (e.g. /laptop_asset.png)"
          />
        </FormControl>

        <HStack spacing={3} pt={2}>
          <Button
            type="submit"
            size="sm"
            bg={GREEN_ACCENT}
            color="white"
            _hover={{ bg: GREEN_HOVER }}
            borderRadius="none"
            fontSize="xs"
            fontWeight="750"
            isLoading={isSubmitting}
            flex={1}
          >
            {assetToEdit ? 'UPDATE ASSET' : 'CREATE ASSET'}
          </Button>
          {assetToEdit && (
            <Button
              size="sm"
              variant="outline"
              borderRadius="none"
              fontSize="xs"
              fontWeight="750"
              onClick={() => {
                if (setAssetToEdit) setAssetToEdit(null);
                if (onSuccess) onSuccess();
              }}
            >
              CANCEL
            </Button>
          )}
        </HStack>
      </VStack>
    </Box>
  );
};

export default AssetForm;