import { useState, useEffect } from "react";
import {
  Box,
  Flex,
  IconButton,
  VStack,
  Link,
  Text,
  Icon,
  useBreakpointValue,
} from "@chakra-ui/react";
import { FiFolder, FiHome, FiPlusCircle, FiMenu, FiUsers, FiBookOpen, FiSearch, FiBriefcase, FiBarChart, FiDollarSign } from "react-icons/fi";
import { Link as RouterLink } from "react-router-dom";
import { FiFileText } from 'react-icons/fi';
const Sidebar = ({ isCollapsed: controlledIsCollapsed, onToggleCollapse }) => {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const breakpointValue = useBreakpointValue({ base: true, md: false });
  
  // Use controlled prop if provided, otherwise use internal state
  const effectiveIsCollapsed = controlledIsCollapsed !== undefined ? controlledIsCollapsed : isCollapsed;

  useEffect(() => {
    // Only set initial collapse state if not controlled by parent
    if (controlledIsCollapsed === undefined) {
      setIsCollapsed(breakpointValue);
    }
  }, [breakpointValue, controlledIsCollapsed]);

  const toggleCollapse = () => {
    if (onToggleCollapse) {
      onToggleCollapse();
    } else {
      setIsCollapsed((prevState) => !prevState);
    }
  };

  return (
    <Box
      as="nav"
      width={effectiveIsCollapsed ? "50px" : "200px"}      height="100vh"
      position="fixed"
      left={0}
      top={0}
      bg="gray.800"
      color="white"
      transition="width 0.3s"
      zIndex="1"
      paddingTop="80px" // Adjusting to account for the Navbar height
    >
      {/* Collapse Toggle Button */}
      <Flex justify="flex-end" align="center" p={4}>
        <IconButton
          icon={<Icon as={FiMenu} boxSize={4} />}
          variant="ghost"
          color="white"
          onClick={toggleCollapse}
          aria-label="Toggle Sidebar"
        />
      </Flex>

      {/* Sidebar Links */}
      <VStack align="start" spacing={1} p={1}>
        {/* Dashboard Link */}
        <Link as={RouterLink} to="/dashboard" _hover={{ textDecoration: "none" }}>
          <Flex align="center" p={1} borderRadius="md" _hover={{ bg: "gray.700" }}>
            <Icon as={FiHome} boxSize={4} />
            {!effectiveIsCollapsed && <Text ml={3} fontSize="sm">Dashboard</Text>}
          </Flex>
        </Link>

        {/* COO Dashboard Link removed */}

        {/* Account Management Link */}
        <Link as={RouterLink} to="/users" _hover={{ textDecoration: "none" }}>
          <Flex align="center" p={1} borderRadius="md" _hover={{ bg: "gray.700" }}>
            <Icon as={FiUsers} boxSize={4} />
            {!effectiveIsCollapsed && <Text ml={3} fontSize="sm">Account Management</Text>}
          </Flex>
        </Link>

        {/* Asset Management Link */}
        <Link as={RouterLink} to="/assets" _hover={{ textDecoration: "none" }}>
          <Flex align="center" p={1} borderRadius="md" _hover={{ bg: "gray.700" }}>
            <Icon as={FiBriefcase} boxSize={4} />
            {!effectiveIsCollapsed && <Text ml={3} fontSize="sm">Asset Management</Text>}
          </Flex>
        </Link>

        {/* Company Documents Link */}
        <Link as={RouterLink} to="/documentlist" _hover={{ textDecoration: "none" }}>
          <Flex align="center" p={1} borderRadius="md" _hover={{ bg: "gray.700" }}>
            <Icon as={FiBookOpen} boxSize={4} />
            {!effectiveIsCollapsed && <Text ml={3} fontSize="sm">Company Documents</Text>}
          </Flex>
        </Link>

        {/* Employee Document Link */}
        <Link as={RouterLink} to="/EmployeeDocument" _hover={{ textDecoration: "none" }}>
          <Flex align="center" p={1} borderRadius="md" _hover={{ bg: "gray.700" }}>
            <Icon as={FiFolder} boxSize={4} />
            {!effectiveIsCollapsed && <Text ml={3} fontSize="sm">Employee Document</Text>}
          </Flex>
        </Link>

        {/* Quiz Center Link */}
        <Link as={RouterLink} to="/quiz" _hover={{ textDecoration: "none" }}>
          <Flex align="center" p={1} borderRadius="md" _hover={{ bg: "gray.700" }}>
            <Icon as={FiSearch} boxSize={4} />
            {!effectiveIsCollapsed && <Text ml={3} fontSize="sm">Quiz Center</Text>}
          </Flex>
        </Link>

        {/* Customer List Link */}
        <Link as={RouterLink} to="/FollowUpList" _hover={{ textDecoration: "none" }}>
          <Flex align="center" p={1} borderRadius="md" _hover={{ bg: "gray.700" }}>
            <Icon as={FiUsers} boxSize={4} />
            {!effectiveIsCollapsed && <Text ml={3} fontSize="sm">Customer List</Text>}
          </Flex>
        </Link>

        {/* Payroll Link */}
        <Link as={RouterLink} to="/payroll" _hover={{ textDecoration: "none" }}>
          <Flex align="center" p={1} borderRadius="md" _hover={{ bg: "gray.700" }}>
            <Icon as={FiDollarSign} boxSize={4} />
            {!effectiveIsCollapsed && <Text ml={3} fontSize="sm">Payroll</Text>}
          </Flex>
        </Link>

        {/* HR Course Link */}
        <Link as={RouterLink} to="/course" _hover={{ textDecoration: "none" }}>
          <Flex align="center" p={1} borderRadius="md" _hover={{ bg: "gray.700" }}>
            <Icon as={FiBookOpen} boxSize={4} />
            {!effectiveIsCollapsed && <Text ml={3} fontSize="sm">HR Course Editor</Text>}
          </Flex>
        </Link>

        {/* HR Training Link */}
        <Link as={RouterLink} to="/hr-training" _hover={{ textDecoration: "none" }}>
          <Flex align="center" p={1} borderRadius="md" _hover={{ bg: "gray.700" }}>
            <Icon as={FiBookOpen} boxSize={4} />
            {!effectiveIsCollapsed && <Text ml={3} fontSize="sm">HR Training</Text>}
          </Flex>
        </Link>

        {/* Awards Link */}
        <Link as={RouterLink} to="/awards" _hover={{ textDecoration: "none" }}>
          <Flex align="center" p={1} borderRadius="md" _hover={{ bg: "gray.700" }}>
            <Icon as={FiBarChart} boxSize={4} />
            {!effectiveIsCollapsed && <Text ml={3} fontSize="sm">Awards</Text>}
          </Flex>
        </Link>
      
        {/* Notes Board Link */}
        <Link as={RouterLink} to="/customer/messages" _hover={{ textDecoration: "none" }}>
          <Flex align="center" p={1} borderRadius="md" _hover={{ bg: "gray.700" }}>
            <Icon as={FiFileText} boxSize={4} />
            {!effectiveIsCollapsed && <Text ml={3} fontSize="sm">Notes Board</Text>}
          </Flex>
        </Link>
      </VStack>
    </Box>
  );
};

export default Sidebar;
