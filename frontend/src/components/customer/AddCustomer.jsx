import { useState, useEffect, useContext } from "react";
import AuthContext from "../../context/AuthContext.jsx";
import axios from "axios";
import {
  Box,
  FormControl,
  FormLabel,
  Input,
  Button,
  Heading,
  VStack,
  useToast,
  useColorModeValue,
  Select,
  Tabs,
  TabList,
  TabPanels,
  Tab,
  TabPanel,
  Textarea,
  Tag,
  TagLabel,
  TagCloseButton,
  InputGroup,
  InputRightElement,
  IconButton,
  Flex,
  Text,
  Divider,
  HStack,
  Badge,
  Card,
  CardBody,
  CardHeader,
  Grid,
  GridItem,
  useMediaQuery,
} from "@chakra-ui/react";
import { AddIcon, SmallCloseIcon, StarIcon } from "@chakra-ui/icons";

const AddCustomer = ({ onSuccess }) => {
  const [customerType, setCustomerType] = useState("buyer"); // Changed default to "buyer"
  const [packages, setPackages] = useState([]);
  const [formData, setFormData] = useState({
    clientName: "",
    companyName: "",
    phoneNumber: "",
    email: "",
    packageType: "",
    service: "",
    serviceProvided: "",
    serviceNotProvided: "",
    createdBy: "",
    contactPerson: "",
    country: "",
    industry: "",
    products: [],
    requirements: "",
    certifications: [],
  });

  const { user } = useContext(AuthContext);
  const [allUsers, setAllUsers] = useState([]);
  const [customerServiceUsers, setCustomerServiceUsers] = useState([]);
  const [productInput, setProductInput] = useState("");
  const [certificationInput, setCertificationInput] = useState("");
  const [loading, setLoading] = useState(false);
  const toast = useToast();
  
  const determineScopeFromCountry = (country = "") => {
    const normalizedCountry = (country || "").toString().trim().toLowerCase();
    if (!normalizedCountry) return "International";
    return normalizedCountry.includes("ethiopia") ? "Local" : "International";
  };
  
  // Responsive breakpoints
  const [isLargerThan768] = useMediaQuery("(min-width: 768px)");
  const [isLargerThan1024] = useMediaQuery("(min-width: 1024px)");
  
  // Color mode values
  const formBg = useColorModeValue("white", "gray.700");
  const inputBg = useColorModeValue("gray.50", "gray.800");
  const headerBg = useColorModeValue("blue.500", "blue.600");
  const borderColor = useColorModeValue("gray.200", "gray.600");

  // Fetch all users
  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const response = await axios.get(`${import.meta.env.VITE_API_URL}/api/users`);
        const usersData = response.data.users || response.data.data || [];
        setAllUsers(usersData);
        const filteredUsers = usersData.filter(user => user.role === "customerservice");
        setCustomerServiceUsers(filteredUsers);
      } catch (error) {
        console.error("Error fetching users:", error);
        toast({
          title: "Error",
          description: "Failed to fetch users. Please try again.",
          status: "error",
          duration: 3000,
          isClosable: true,
        });
      }
    };

    fetchUsers();
  }, [toast]);

  // Fetch packages
  useEffect(() => {
    const fetchPackages = async () => {
      try {
        const response = await axios.get(`${import.meta.env.VITE_API_URL}/api/packages`);
        setPackages(Array.isArray(response.data) ? response.data : []);
      } catch (error) {
        console.error("Error fetching packages:", error);
        toast({
          title: "Error",
          description: "Failed to fetch packages. Using default options.",
          status: "warning",
          duration: 3000,
          isClosable: true,
        });
        // Set default packages if fetch fails
        setPackages([
          { _id: "1", packageNumber: 1, price: 100 },
          { _id: "2", packageNumber: 2, price: 200 },
          { _id: "3", packageNumber: 3, price: 300 },
          { _id: "4", packageNumber: 4, price: 400 },
          { _id: "5", packageNumber: 5, price: 500 },
          { _id: "6", packageNumber: 6, price: 600 },
          { _id: "7", packageNumber: 7, price: 700 },
          { _id: "8", packageNumber: 8, price: 800 }
        ]);
      }
    };

    fetchPackages();
  }, [toast]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleAddProduct = () => {
    if (productInput.trim() && !formData.products.includes(productInput.trim())) {
      setFormData(prev => ({
        ...prev,
        products: [...prev.products, productInput.trim()]
      }));
      setProductInput("");
    }
  };

  const handleRemoveProduct = (productToRemove) => {
    setFormData(prev => ({
      ...prev,
      products: prev.products.filter(product => product !== productToRemove)
    }));
  };

  const handleAddCertification = () => {
    if (certificationInput.trim() && !formData.certifications.includes(certificationInput.trim())) {
      setFormData(prev => ({
        ...prev,
        certifications: [...prev.certifications, certificationInput.trim()]
      }));
      setCertificationInput("");
    }
  };

  const handleRemoveCertification = (certificationToRemove) => {
    setFormData(prev => ({
      ...prev,
      certifications: prev.certifications.filter(certification => certification !== certificationToRemove)
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const creatorId = user && user._id ? user._id : formData.createdBy;
      const calculatedDeadline = new Date(
        new Date().setFullYear(new Date().getFullYear() + 1)
      ).toISOString().split("T")[0];
      const followupScope = determineScopeFromCountry(formData.country);

      if (customerType === "buyer") {
        if (
          !formData.companyName ||
          !formData.contactPerson ||
          !formData.email ||
          !formData.phoneNumber ||
          !formData.country ||
          !formData.industry
        ) {
          toast({
            title: "Error",
            description: "All buyer fields are required.",
            status: "error",
            duration: 3000,
            isClosable: true,
          });
          setLoading(false);
          return;
        }

        const buyerData = {
          companyName: formData.companyName,
          contactPerson: formData.contactPerson,
          email: formData.email,
          phoneNumber: formData.phoneNumber,
          country: formData.country,
          industry: formData.industry,
          products: formData.products,
          requirements: formData.requirements,
          packageType: formData.packageType,
        };

        const buyerResponse = await axios.post(
          `${import.meta.env.VITE_API_URL}/api/buyers`,
          buyerData
        );

        if (buyerResponse.status === 201) {
        const followupData = {
          clientName: formData.contactPerson,
          companyName: formData.companyName,
          phoneNumber: formData.phoneNumber,
          email: formData.email,
          packageType: formData.packageType || "Not specified",
          country: formData.country,
          packageScope: followupScope,
          customerType,
          type: customerType,
          service: `Buying ${formData.industry} products`,
          serviceProvided: "Initial contact made",
          serviceNotProvided: "Ongoing relationship management",
          createdBy: creatorId,
          deadline: calculatedDeadline,
        };

          await axios.post(
            `${import.meta.env.VITE_API_URL}/api/followups`,
            followupData
          );

          toast({
            title: "Success",
            description: "Buyer added to marketplace and follow-up system!",
            status: "success",
            duration: 3000,
            isClosable: true,
          });
        }
      } else if (customerType === "seller") {
        if (
          !formData.companyName ||
          !formData.contactPerson ||
          !formData.email ||
          !formData.phoneNumber ||
          !formData.country ||
          !formData.industry
        ) {
          toast({
            title: "Error",
            description: "All seller fields are required.",
            status: "error",
            duration: 3000,
            isClosable: true,
          });
          setLoading(false);
          return;
        }

        const sellerData = {
          companyName: formData.companyName,
          contactPerson: formData.contactPerson,
          email: formData.email,
          phoneNumber: formData.phoneNumber,
          country: formData.country,
          industry: formData.industry,
          products: formData.products,
          certifications: formData.certifications,
          packageType: formData.packageType,
        };

        const sellerResponse = await axios.post(
          `${import.meta.env.VITE_API_URL}/api/sellers`,
          sellerData
        );

        if (sellerResponse.status === 201) {
        const followupData = {
          clientName: formData.contactPerson,
          companyName: formData.companyName,
          phoneNumber: formData.phoneNumber,
          email: formData.email,
          packageType: formData.packageType || "Not specified",
          country: formData.country,
          packageScope: followupScope,
          customerType,
          type: customerType,
          service: `Selling ${formData.industry} products`,
          serviceProvided: "Initial contact made",
          serviceNotProvided: "Ongoing relationship management",
          createdBy: creatorId,
          deadline: calculatedDeadline,
        };

          await axios.post(
            `${import.meta.env.VITE_API_URL}/api/followups`,
            followupData
          );

          toast({
            title: "Success",
            description: "Seller added to marketplace and follow-up system!",
            status: "success",
            duration: 3000,
            isClosable: true,
          });
        }
      }

      setFormData({
        clientName: "",
        companyName: "",
        phoneNumber: "",
        email: "",
        packageType: "",
        service: "",
        serviceProvided: "",
        serviceNotProvided: "",
        createdBy: "",
        contactPerson: "",
        country: "",
        industry: "",
        products: [],
        requirements: "",
        certifications: [],
      });
      
      onSuccess && onSuccess();
    } catch (error) {
      console.error("Error Response:", error.response);
      toast({
        title: "Error",
        description: error.response?.data?.error || "Failed to add customer. Please try again.",
        status: "error",
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setLoading(false);
    }
  };

  // Professional form section component
  const FormSection = ({ title, children }) => (
    <Card mb={4} bg={formBg} boxShadow="sm" borderRadius="lg">
      <CardHeader pb={2} bg={useColorModeValue("gray.50", "gray.700")} borderRadius="lg">
        <Heading size="sm" color={headerBg}>{title}</Heading>
      </CardHeader>
      <CardBody>
        <VStack spacing={4} align="stretch">
          {children}
        </VStack>
      </CardBody>
    </Card>
  );

  // Responsive grid item component
  const ResponsiveGridItem = ({ children, colSpan = 1 }) => (
    <GridItem colSpan={isLargerThan768 ? colSpan : 1}>
      {children}
    </GridItem>
  );

  // Get selected package price
  const getSelectedPackagePrice = () => {
    if (!formData.packageType) return 0;
    const selectedPackage = packages.find(pkg => pkg.packageNumber.toString() === formData.packageType);
    return selectedPackage ? selectedPackage.price : 0;
  };

  return (
    <Box p={2}>
      <VStack spacing={4} align="stretch">
        <Heading as="h2" size="md" textAlign="center" color={headerBg} py={2}>
          Add New Customer
        </Heading>
        
        <Tabs 
          variant="enclosed" 
          colorScheme="blue" 
          isFitted 
          onChange={(index) => {
            const types = ["buyer", "seller"]; // Removed "followup" from the array
            setCustomerType(types[index]);
          }}
          defaultIndex={0} // Set default index to 0 for buyer tab
        >
          <TabList mb={4}>
            {/* Removed the Follow-up tab */}
            <Tab>
              <VStack spacing={1}>
                <StarIcon />
                <Text fontSize="sm">Buyer</Text>
              </VStack>
            </Tab>
            <Tab>
              <VStack spacing={1}>
                <StarIcon />
                <Text fontSize="sm">Seller</Text>
              </VStack>
            </Tab>
          </TabList>
          
          <TabPanels>
            {/* Marketplace Buyer Tab */}
            <TabPanel px={0}>
              <VStack spacing={4} align="stretch">
                <FormSection title="Company Information">
                  <Grid templateColumns={isLargerThan768 ? "repeat(2, 1fr)" : "1fr"} gap={4}>
                    <ResponsiveGridItem>
                      <FormControl isRequired>
                        <FormLabel fontSize="sm">Company Name</FormLabel>
                        <Input
                          name="companyName"
                          value={formData.companyName}
                          onChange={handleChange}
                          placeholder="Enter company name"
                          bg={inputBg}
                          size="md"
                        />
                      </FormControl>
                    </ResponsiveGridItem>
                    
                    <ResponsiveGridItem>
                      <FormControl isRequired>
                        <FormLabel fontSize="sm">Contact Person</FormLabel>
                        <Input
                          name="contactPerson"
                          value={formData.contactPerson}
                          onChange={handleChange}
                          placeholder="Enter contact person name"
                          bg={inputBg}
                          size="md"
                        />
                      </FormControl>
                    </ResponsiveGridItem>
                    
                    <ResponsiveGridItem>
                      <FormControl isRequired>
                        <FormLabel fontSize="sm">Email</FormLabel>
                        <Input
                          name="email"
                          type="email"
                          value={formData.email}
                          onChange={handleChange}
                          placeholder="Enter email address"
                          bg={inputBg}
                          size="md"
                        />
                      </FormControl>
                    </ResponsiveGridItem>
                    
                    <ResponsiveGridItem>
                      <FormControl isRequired>
                        <FormLabel fontSize="sm">Phone Number</FormLabel>
                        <Input
                          name="phoneNumber"
                          value={formData.phoneNumber}
                          onChange={handleChange}
                          placeholder="Enter phone number"
                          bg={inputBg}
                          size="md"
                        />
                      </FormControl>
                    </ResponsiveGridItem>
                    
                    <ResponsiveGridItem>
                      <FormControl isRequired>
                        <FormLabel fontSize="sm">Country</FormLabel>
                        <Input
                          name="country"
                          value={formData.country}
                          onChange={handleChange}
                          placeholder="Enter country"
                          bg={inputBg}
                          size="md"
                        />
                      </FormControl>
                    </ResponsiveGridItem>
                    
                    <ResponsiveGridItem>
                      <FormControl isRequired>
                        <FormLabel fontSize="sm">Industry</FormLabel>
                        <Input
                          name="industry"
                          value={formData.industry}
                          onChange={handleChange}
                          placeholder="Enter industry"
                          bg={inputBg}
                          size="md"
                        />
                      </FormControl>
                    </ResponsiveGridItem>
                  </Grid>
                </FormSection>
                
                <FormSection title="Package & Products">
                  <Grid templateColumns={isLargerThan768 ? "repeat(2, 1fr)" : "1fr"} gap={4}>
                    <ResponsiveGridItem>
                      <FormControl>
                        <FormLabel fontSize="sm">Package Type</FormLabel>
                        <Select
                          name="packageType"
                          value={formData.packageType}
                          onChange={handleChange}
                          placeholder="Select package type"
                          bg={inputBg}
                          size="md"
                        >
                          {packages.map(pkg => (
                            <option key={pkg._id || pkg.packageNumber} value={pkg.packageNumber}>
                              {pkg.packageNumber} - ${pkg.price}
                            </option>
                          ))}
                        </Select>
                        {formData.packageType && (
                          <Text mt={2} fontSize="sm" color="green.500">
                            Selected Package Price: ${getSelectedPackagePrice()}
                          </Text>
                        )}
                      </FormControl>
                    </ResponsiveGridItem>
                    
                    <ResponsiveGridItem colSpan={2}>
                      <FormControl>
                        <FormLabel fontSize="sm">Products</FormLabel>
                        <Flex>
                          <Input
                            value={productInput}
                            onChange={(e) => setProductInput(e.target.value)}
                            placeholder="Enter a product and click + to add"
                            onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddProduct())}
                            bg={inputBg}
                            size="md"
                          />
                          <IconButton
                            ml={2}
                            aria-label="Add product"
                            icon={<AddIcon />}
                            onClick={handleAddProduct}
                            colorScheme="teal"
                            size="md"
                          />
                        </Flex>
                        <Box mt={2}>
                          {formData.products.map((product, index) => (
                            <Tag key={index} mr={2} mt={2} colorScheme="teal" size="md">
                              <TagLabel>{product}</TagLabel>
                              <TagCloseButton onClick={() => handleRemoveProduct(product)} />
                            </Tag>
                          ))}
                        </Box>
                      </FormControl>
                    </ResponsiveGridItem>
                    
                    <ResponsiveGridItem colSpan={2}>
                      <FormControl>
                        <FormLabel fontSize="sm">Requirements</FormLabel>
                        <Textarea
                          name="requirements"
                          value={formData.requirements}
                          onChange={handleChange}
                          placeholder="Enter any special requirements"
                          bg={inputBg}
                          size="md"
                          rows={3}
                        />
                      </FormControl>
                    </ResponsiveGridItem>
                  </Grid>
                </FormSection>
                
                <FormSection title="Assignment">
                  <FormControl isRequired>
                    <FormLabel fontSize="sm">Created By</FormLabel>
                    <Select
                      name="createdBy"
                      value={formData.createdBy}
                      onChange={handleChange}
                      placeholder="Select a user"
                      bg={inputBg}
                      size="md"
                    >
                      {customerServiceUsers.map((user) => (
                        <option key={user._id} value={user._id}>
                          {user.username}
                        </option>
                      ))}
                    </Select>
                  </FormControl>
                </FormSection>
                
                <Text fontSize="sm" color="gray.500" textAlign="center" p={2}>
                  Note: This buyer will be added to both the marketplace and follow-up system
                </Text>
              </VStack>
            </TabPanel>
            
            {/* Marketplace Seller Tab */}
            <TabPanel px={0}>
              <VStack spacing={4} align="stretch">
                <FormSection title="Company Information">
                  <Grid templateColumns={isLargerThan768 ? "repeat(2, 1fr)" : "1fr"} gap={4}>
                    <ResponsiveGridItem>
                      <FormControl isRequired>
                        <FormLabel fontSize="sm">Company Name</FormLabel>
                        <Input
                          name="companyName"
                          value={formData.companyName}
                          onChange={handleChange}
                          placeholder="Enter company name"
                          bg={inputBg}
                          size="md"
                        />
                      </FormControl>
                    </ResponsiveGridItem>
                    
                    <ResponsiveGridItem>
                      <FormControl isRequired>
                        <FormLabel fontSize="sm">Contact Person</FormLabel>
                        <Input
                          name="contactPerson"
                          value={formData.contactPerson}
                          onChange={handleChange}
                          placeholder="Enter contact person name"
                          bg={inputBg}
                          size="md"
                        />
                      </FormControl>
                    </ResponsiveGridItem>
                    
                    <ResponsiveGridItem>
                      <FormControl isRequired>
                        <FormLabel fontSize="sm">Email</FormLabel>
                        <Input
                          name="email"
                          type="email"
                          value={formData.email}
                          onChange={handleChange}
                          placeholder="Enter email address"
                          bg={inputBg}
                          size="md"
                        />
                      </FormControl>
                    </ResponsiveGridItem>
                    
                    <ResponsiveGridItem>
                      <FormControl isRequired>
                        <FormLabel fontSize="sm">Phone Number</FormLabel>
                        <Input
                          name="phoneNumber"
                          value={formData.phoneNumber}
                          onChange={handleChange}
                          placeholder="Enter phone number"
                          bg={inputBg}
                          size="md"
                        />
                      </FormControl>
                    </ResponsiveGridItem>
                    
                    <ResponsiveGridItem>
                      <FormControl isRequired>
                        <FormLabel fontSize="sm">Country</FormLabel>
                        <Input
                          name="country"
                          value={formData.country}
                          onChange={handleChange}
                          placeholder="Enter country"
                          bg={inputBg}
                          size="md"
                        />
                      </FormControl>
                    </ResponsiveGridItem>
                    
                    <ResponsiveGridItem>
                      <FormControl isRequired>
                        <FormLabel fontSize="sm">Industry</FormLabel>
                        <Input
                          name="industry"
                          value={formData.industry}
                          onChange={handleChange}
                          placeholder="Enter industry"
                          bg={inputBg}
                          size="md"
                        />
                      </FormControl>
                    </ResponsiveGridItem>
                  </Grid>
                </FormSection>
                
                <FormSection title="Package, Products & Certifications">
                  <Grid templateColumns={isLargerThan768 ? "repeat(2, 1fr)" : "1fr"} gap={4}>
                    <ResponsiveGridItem>
                      <FormControl>
                        <FormLabel fontSize="sm">Package Type</FormLabel>
                        <Select
                          name="packageType"
                          value={formData.packageType}
                          onChange={handleChange}
                          placeholder="Select package type"
                          bg={inputBg}
                          size="md"
                        >
                          {packages.map(pkg => (
                            <option key={pkg._id || pkg.packageNumber} value={pkg.packageNumber}>
                              {pkg.packageNumber} - ${pkg.price}
                            </option>
                          ))}
                        </Select>
                        {formData.packageType && (
                          <Text mt={2} fontSize="sm" color="green.500">
                            Selected Package Price: ${getSelectedPackagePrice()}
                          </Text>
                        )}
                      </FormControl>
                    </ResponsiveGridItem>
                    
                    <ResponsiveGridItem colSpan={2}>
                      <FormControl>
                        <FormLabel fontSize="sm">Products</FormLabel>
                        <Flex>
                          <Input
                            value={productInput}
                            onChange={(e) => setProductInput(e.target.value)}
                            placeholder="Enter a product and click + to add"
                            onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddProduct())}
                            bg={inputBg}
                            size="md"
                          />
                          <IconButton
                            ml={2}
                            aria-label="Add product"
                            icon={<AddIcon />}
                            onClick={handleAddProduct}
                            colorScheme="teal"
                            size="md"
                          />
                        </Flex>
                        <Box mt={2}>
                          {formData.products.map((product, index) => (
                            <Tag key={index} mr={2} mt={2} colorScheme="teal" size="md">
                              <TagLabel>{product}</TagLabel>
                              <TagCloseButton onClick={() => handleRemoveProduct(product)} />
                            </Tag>
                          ))}
                        </Box>
                      </FormControl>
                    </ResponsiveGridItem>
                    
                    <ResponsiveGridItem colSpan={2}>
                      <FormControl>
                        <FormLabel fontSize="sm">Certifications</FormLabel>
                        <Flex>
                          <Input
                            value={certificationInput}
                            onChange={(e) => setCertificationInput(e.target.value)}
                            placeholder="Enter a certification and click + to add"
                            onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddCertification())}
                            bg={inputBg}
                            size="md"
                          />
                          <IconButton
                            ml={2}
                            aria-label="Add certification"
                            icon={<AddIcon />}
                            onClick={handleAddCertification}
                            colorScheme="purple"
                            size="md"
                          />
                        </Flex>
                        <Box mt={2}>
                          {formData.certifications.map((certification, index) => (
                            <Tag key={index} mr={2} mt={2} colorScheme="purple" size="md">
                              <TagLabel>{certification}</TagLabel>
                              <TagCloseButton onClick={() => handleRemoveCertification(certification)} />
                            </Tag>
                          ))}
                        </Box>
                      </FormControl>
                    </ResponsiveGridItem>
                  </Grid>
                </FormSection>
                
                <FormSection title="Assignment">
                  <FormControl isRequired>
                    <FormLabel fontSize="sm">Created By</FormLabel>
                    <Select
                      name="createdBy"
                      value={formData.createdBy}
                      onChange={handleChange}
                      placeholder="Select a user"
                      bg={inputBg}
                      size="md"
                    >
                      {customerServiceUsers.map((user) => (
                        <option key={user._id} value={user._id}>
                          {user.username}
                        </option>
                      ))}
                    </Select>
                  </FormControl>
                </FormSection>
                
                <Text fontSize="sm" color="gray.500" textAlign="center" p={2}>
                  Note: This seller will be added to both the marketplace and follow-up system
                </Text>
              </VStack>
            </TabPanel>
          </TabPanels>
        </Tabs>
        
        <Button
          onClick={handleSubmit}
          colorScheme="blue"
          width="full"
          size="lg"
          fontWeight="bold"
          isLoading={loading}
          loadingText="Saving..."
          mt={2}
        >
          {/* Updated button text to remove followup option */}
          {customerType === "buyer" && "Add Buyer to Marketplace & Follow-up"}
          {customerType === "seller" && "Add Seller to Marketplace & Follow-up"}
        </Button>
      </VStack>
    </Box>
  );
};

export default AddCustomer;
