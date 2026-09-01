import React, { useState } from "react";
import {
  Avatar,
  Badge,
  Box,
  Button,
  Checkbox,
  Flex,
  HStack,
  Icon,
  IconButton,
  Menu,
  MenuButton,
  MenuItem,
  MenuList,
  Portal,
  Select,
  Spinner,
  Table,
  Tbody,
  Td,
  Text,
  Th,
  Thead,
  Tooltip,
  Tr,
  useColorModeValue,
  VStack,
} from "@chakra-ui/react";
import {
  FiCalendar,
  FiCheckCircle,
  FiChevronDown,
  FiClock,
  FiDownload,
  FiEdit2,
  FiEye,
  FiFilter,
  FiMail,
  FiMessageSquare,
  FiMoreHorizontal,
  FiPhone,
  FiPlus,
  FiSliders,
  FiTrash2,
  FiUser,
} from "react-icons/fi";

const getInitials = (name = "") => {
  const parts = name.trim().split(" ").filter(Boolean);
  if (parts.length >= 2) return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
  return name.slice(0, 2).toUpperCase() || "CU";
};

const getAvatarBg = (id = "", index = 0) => {
  const colors = ["#8b44af", "#1d68d8", "#059669", "#ea580c", "#0284c7", "#d97706"];
  return colors[index % colors.length];
};

const FollowupTabPage = ({
  cardBg,
  borderColor,
  loading,
  error,
  filteredData = [],
  onRefresh,
  onSelectRow,
  onSelectAll,
  selectedIds = [],
  onOpenConversation,
  onOpenActivity,
  onOpenEdit,
  onOpenUpdate,
  onDeleteCustomer,
  searchQuery = "",
  handleSearch,
}) => {
  const headingColor = useColorModeValue("#0f172a", "#f8fafc");
  const textColor = useColorModeValue("#334155", "#cbd5e1");
  const subtextColor = useColorModeValue("#64748b", "#94a3b8");
  const cardBorder = borderColor || useColorModeValue("#e2e8f0", "#1e293b");

  const [ownerFilter, setOwnerFilter] = useState("All");
  const [statusFilter, setStatusFilter] = useState("All");
  const [deadlineFilter, setDeadlineFilter] = useState("Any");
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);

  // Active filter chips
  const [scopeChip, setScopeChip] = useState("Local");
  const [priorityChip, setPriorityChip] = useState("All");
  const [typeChip, setTypeChip] = useState("All");

  const clearAllChips = () => {
    setScopeChip("All");
    setPriorityChip("All");
    setTypeChip("All");
  };

  const isAllSelected =
    filteredData.length > 0 &&
    filteredData.every((item) => selectedIds.includes(item._id));
  const isIndeterminate =
    selectedIds.length > 0 && !isAllSelected;

  return (
    <Box w="100%">
      {/* 1. Main Search & Filter Toolbar */}
      <Box
        bg={cardBg}
        p={3}
        border="1px solid"
        borderColor={cardBorder}
        borderRadius="xl"
        mb={3}
      >
        <Flex
          direction={{ base: "column", lg: "row" }}
          gap={2.5}
          align={{ base: "stretch", lg: "center" }}
          justify="space-between"
        >
          {/* Search Box */}
          <Box position="relative" flex="1" maxW={{ base: "100%", lg: "360px" }}>
            <Box
              position="absolute"
              left={3}
              top="50%"
              transform="translateY(-50%)"
              color="gray.400"
              pointerEvents="none"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <circle cx="11" cy="11" r="8" />
                <line x1="21" y1="21" x2="16.65" y2="16.65" />
              </svg>
            </Box>
            <input
              style={{
                width: "100%",
                paddingLeft: "32px",
                paddingRight: "12px",
                height: "34px",
                fontSize: "12px",
                borderRadius: "8px",
                border: `1px solid ${cardBorder}`,
                backgroundColor: "transparent",
                outline: "none",
                color: "inherit",
              }}
              placeholder="Search client, company, phone or email"
              value={searchQuery}
              onChange={handleSearch}
            />
          </Box>

          {/* Filter Dropdowns & Right Action Buttons */}
          <HStack spacing={2} flexWrap="wrap">
            {/* Filters Button */}
            <Button
              size="sm"
              variant="outline"
              borderColor={cardBorder}
              fontSize="12px"
              fontWeight="500"
              h="34px"
              px={3}
              borderRadius="lg"
              leftIcon={<Icon as={FiFilter} boxSize={3.5} />}
            >
              Filters
              <Badge ml={1.5} bg="#0d9488" color="white" fontSize="10px" borderRadius="full" px={1.5}>
                3
              </Badge>
            </Button>

            {/* All Owners */}
            <Menu>
              <MenuButton
                as={Button}
                size="sm"
                variant="outline"
                borderColor={cardBorder}
                fontSize="12px"
                fontWeight="500"
                h="34px"
                borderRadius="lg"
                rightIcon={<Icon as={FiChevronDown} />}
              >
                All owners
              </MenuButton>
              <Portal>
                <MenuList zIndex="1600" fontSize="xs">
                  {["All owners", "Sara Alemu", "Daniel Kebede", "Mesfin Tadesse"].map((o) => (
                    <MenuItem key={o} onClick={() => setOwnerFilter(o)}>{o}</MenuItem>
                  ))}
                </MenuList>
              </Portal>
            </Menu>

            {/* All Statuses */}
            <Menu>
              <MenuButton
                as={Button}
                size="sm"
                variant="outline"
                borderColor={cardBorder}
                fontSize="12px"
                fontWeight="500"
                h="34px"
                borderRadius="lg"
                rightIcon={<Icon as={FiChevronDown} />}
              >
                All statuses
              </MenuButton>
              <Portal>
                <MenuList zIndex="1600" fontSize="xs">
                  {["All statuses", "Scheduled", "Active", "Overdue", "Completed"].map((s) => (
                    <MenuItem key={s} onClick={() => setStatusFilter(s)}>{s}</MenuItem>
                  ))}
                </MenuList>
              </Portal>
            </Menu>

            {/* Any Deadline */}
            <Menu>
              <MenuButton
                as={Button}
                size="sm"
                variant="outline"
                borderColor={cardBorder}
                fontSize="12px"
                fontWeight="500"
                h="34px"
                borderRadius="lg"
                rightIcon={<Icon as={FiChevronDown} />}
              >
                Any deadline
              </MenuButton>
              <Portal>
                <MenuList zIndex="1600" fontSize="xs">
                  {["Any deadline", "Today", "Next 7 days", "This month", "Overdue"].map((d) => (
                    <MenuItem key={d} onClick={() => setDeadlineFilter(d)}>{d}</MenuItem>
                  ))}
                </MenuList>
              </Portal>
            </Menu>

            {/* Columns Toggle & Export */}
            <HStack spacing={1} pl={1}>
              <Button
                size="sm"
                variant="outline"
                borderColor={cardBorder}
                fontSize="12px"
                fontWeight="500"
                h="34px"
                borderRadius="lg"
                leftIcon={<Icon as={FiSliders} boxSize={3.5} />}
                rightIcon={<Icon as={FiChevronDown} />}
              >
                Columns
              </Button>
              <IconButton
                aria-label="Export"
                icon={<Icon as={FiDownload} boxSize={3.5} />}
                size="sm"
                variant="outline"
                borderColor={cardBorder}
                h="34px"
                borderRadius="lg"
                onClick={onRefresh}
              />
            </HStack>
          </HStack>
        </Flex>

        {/* Active Filter Chips */}
        <Flex gap={2} align="center" mt={3} pt={2.5} borderTop="1px solid" borderColor={cardBorder} flexWrap="wrap">
          {scopeChip && (
            <Badge
              bg="#f1f5f9"
              color="#334155"
              fontSize="11px"
              fontWeight="500"
              px={2.5}
              py={0.5}
              borderRadius="md"
              textTransform="none"
              cursor="pointer"
              onClick={() => setScopeChip("")}
            >
              Scope: {scopeChip} ✕
            </Badge>
          )}

          {priorityChip && (
            <Badge
              bg="#f1f5f9"
              color="#334155"
              fontSize="11px"
              fontWeight="500"
              px={2.5}
              py={0.5}
              borderRadius="md"
              textTransform="none"
              cursor="pointer"
              onClick={() => setPriorityChip("")}
            >
              Priority: {priorityChip} ✕
            </Badge>
          )}

          {typeChip && (
            <Badge
              bg="#f1f5f9"
              color="#334155"
              fontSize="11px"
              fontWeight="500"
              px={2.5}
              py={0.5}
              borderRadius="md"
              textTransform="none"
              cursor="pointer"
              onClick={() => setTypeChip("")}
            >
              Type: {typeChip} ✕
            </Badge>
          )}

          <Button
            size="xs"
            variant="link"
            color="#0284c7"
            fontSize="11px"
            fontWeight="600"
            onClick={clearAllChips}
            ml={1}
          >
            Clear all
          </Button>
        </Flex>
      </Box>

      {/* 2. Compact Compressed Table Matching Screenshot */}
      <Box
        bg={cardBg}
        border="1px solid"
        borderColor={cardBorder}
        borderRadius="xl"
        overflow="hidden"
        mb={5}
        shadow="xs"
      >
        <Box overflowX="auto" w="100%">
          <Table
            size="sm"
            variant="simple"
            sx={{
              borderCollapse: "collapse",
              width: "100%",
              minWidth: "980px",
            }}
          >
            <Thead bg={useColorModeValue("#ffffff", "#0f172a")}>
              <Tr borderBottom="1px solid" borderColor={cardBorder}>
                <Th w="36px" py={2.5} px={3} textAlign="center">
                  <Checkbox
                    size="sm"
                    colorScheme="teal"
                    borderRadius="sm"
                    isChecked={isAllSelected}
                    isIndeterminate={isIndeterminate}
                    onChange={(e) => onSelectAll && onSelectAll(e.target.checked)}
                  />
                </Th>
                <Th fontSize="11px" fontWeight="700" color={headingColor} textTransform="none" letterSpacing="normal" py={2.5} px={3}>
                  <HStack spacing={1} cursor="pointer">
                    <Text>Client & Company</Text>
                    <Text fontSize="10px" color="gray.400">⇅</Text>
                  </HStack>
                </Th>
                <Th fontSize="11px" fontWeight="700" color={headingColor} textTransform="none" letterSpacing="normal" py={2.5} px={3}>
                  <HStack spacing={1} cursor="pointer">
                    <Text>Type</Text>
                    <Text fontSize="9px" color="gray.400">⌄</Text>
                  </HStack>
                </Th>
                <Th fontSize="11px" fontWeight="700" color={headingColor} textTransform="none" letterSpacing="normal" py={2.5} px={3}>
                  <HStack spacing={1} cursor="pointer">
                    <Text>Contact</Text>
                    <Text fontSize="10px" color="gray.400">⇅</Text>
                  </HStack>
                </Th>
                <Th fontSize="11px" fontWeight="700" color={headingColor} textTransform="none" letterSpacing="normal" py={2.5} px={3}>
                  <HStack spacing={1} cursor="pointer">
                    <Text>Package</Text>
                    <Text fontSize="10px" color="gray.400">⇅</Text>
                  </HStack>
                </Th>
                <Th fontSize="11px" fontWeight="700" color={headingColor} textTransform="none" letterSpacing="normal" py={2.5} px={3}>
                  <HStack spacing={1} cursor="pointer">
                    <Text>Priority</Text>
                    <Text fontSize="10px" color="gray.400">⇅</Text>
                  </HStack>
                </Th>
                <Th fontSize="11px" fontWeight="700" color={headingColor} textTransform="none" letterSpacing="normal" py={2.5} px={3}>
                  <HStack spacing={1} cursor="pointer">
                    <Text>Engagement</Text>
                    <Text fontSize="10px" color="gray.400">⇅</Text>
                  </HStack>
                </Th>
                <Th fontSize="11px" fontWeight="700" color={headingColor} textTransform="none" letterSpacing="normal" py={2.5} px={3}>
                  <HStack spacing={1} cursor="pointer">
                    <Text>Next Follow-up / Deadline</Text>
                    <Text fontSize="10px" color="gray.400">⇅</Text>
                  </HStack>
                </Th>
                <Th fontSize="11px" fontWeight="700" color={headingColor} textTransform="none" letterSpacing="normal" py={2.5} px={3}>
                  <HStack spacing={1} cursor="pointer">
                    <Text>Owner</Text>
                    <Text fontSize="10px" color="gray.400">⇅</Text>
                  </HStack>
                </Th>
                <Th fontSize="11px" fontWeight="700" color={headingColor} textTransform="none" letterSpacing="normal" py={2.5} px={3}>
                  <HStack spacing={1} cursor="pointer">
                    <Text>Status</Text>
                    <Text fontSize="10px" color="gray.400">⇅</Text>
                  </HStack>
                </Th>
                <Th w="36px" py={2.5} px={2}>
                  <Icon as={FiSliders} boxSize={3.5} color="gray.400" />
                </Th>
              </Tr>
            </Thead>

            <Tbody>
              {loading ? (
                <Tr>
                  <Td colSpan={11} textAlign="center" py={8}>
                    <Spinner size="md" color="teal.500" />
                  </Td>
                </Tr>
              ) : filteredData.length > 0 ? (
                filteredData.map((item, idx) => {
                  const clientName = item.clientName || item.customerName || "Client";
                  const companyName = item.companyName || "Company";
                  const isBuyer = (item.type || item.customerType || "").toLowerCase().includes("buyer");
                  const isOverdue = item.deadline && new Date(item.deadline) < new Date();
                  const statusLabel = isOverdue ? "Overdue" : item.status || "Scheduled";

                  return (
                    <Tr
                      key={item._id || idx}
                      _hover={{ bg: useColorModeValue("gray.50", "whiteAlpha.50") }}
                      borderBottom="1px solid"
                      borderColor={cardBorder}
                      transition="background 0.15s ease"
                    >
                      {/* Checkbox */}
                      <Td py={2.5} px={3} textAlign="center">
                        <Checkbox
                          size="sm"
                          colorScheme="teal"
                          borderRadius="sm"
                          isChecked={selectedIds.includes(item._id)}
                          onChange={() => onSelectRow && onSelectRow(item._id)}
                        />
                      </Td>

                      {/* Client & Company with Initials Avatar */}
                      <Td py={2.5} px={3}>
                        <HStack spacing={2.5}>
                          <Flex
                            boxSize="28px"
                            borderRadius="full"
                            bg={getAvatarBg(item._id, idx)}
                            color="white"
                            align="center"
                            justify="center"
                            fontSize="10px"
                            fontWeight="700"
                            flexShrink={0}
                          >
                            {getInitials(clientName)}
                          </Flex>
                          <Box>
                            <Text fontSize="12px" fontWeight="600" color={headingColor} lineHeight="1.2">
                              {clientName}
                            </Text>
                            <Text fontSize="10px" color={subtextColor} mt={0.2}>
                              {companyName}
                            </Text>
                          </Box>
                        </HStack>
                      </Td>

                      {/* Type (Buyer / Seller Pill) */}
                      <Td py={2.5} px={3} whiteSpace="nowrap">
                        <Badge
                          bg={isBuyer ? "#dcfce7" : "#f3e8ff"}
                          color={isBuyer ? "#16a34a" : "#9333ea"}
                          fontSize="10px"
                          fontWeight="700"
                          px={2}
                          py={0.5}
                          borderRadius="md"
                          textTransform="uppercase"
                          letterSpacing="0.5px"
                        >
                          {isBuyer ? "BUYER" : "SELLER"}
                        </Badge>
                      </Td>

                      {/* Contact Details */}
                      <Td py={2.5} px={3} whiteSpace="nowrap">
                        <Text fontSize="11px" fontWeight="500" color={headingColor} lineHeight="1.2">
                          {item.phoneNumber || item.phone || "0929243367"}
                        </Text>
                        <Text fontSize="10px" color={subtextColor} mt={0.2}>
                          {item.email || "ceo@tradethiopia.com"}
                        </Text>
                      </Td>

                      {/* Package with circular counter pill */}
                      <Td py={2.5} px={3} whiteSpace="nowrap">
                        <HStack spacing={1.5}>
                          <Flex
                            boxSize="18px"
                            borderRadius="full"
                            bg={useColorModeValue("#f3e8ff", "#3b0764")}
                            color="#9333ea"
                            fontSize="10px"
                            fontWeight="700"
                            align="center"
                            justify="center"
                          >
                            {item.packageType ? item.packageType.charAt(0) : idx + 1}
                          </Flex>
                          <Text fontSize="11px" color={textColor} fontWeight="400">
                            {item.packageType || "Local"}
                          </Text>
                        </HStack>
                      </Td>

                      {/* Priority */}
                      <Td py={2.5} px={3} whiteSpace="nowrap">
                        <HStack spacing={1.5}>
                          <Box
                            boxSize="6px"
                            borderRadius="full"
                            bg={
                              item.priority === "High"
                                ? "#dc2626"
                                : item.priority === "Low"
                                ? "#16a34a"
                                : "#d97706"
                            }
                          />
                          <Text fontSize="11px" color={textColor} fontWeight="500">
                            {item.priority || "Medium"}
                          </Text>
                        </HStack>
                      </Td>

                      {/* Engagement Counters */}
                      <Td py={2.5} px={3} whiteSpace="nowrap">
                        <HStack spacing={2.5} color={subtextColor} fontSize="11px">
                          <HStack spacing={1}>
                            <Icon as={FiPhone} boxSize={3} />
                            <Text>{item.call_count || 0}</Text>
                          </HStack>
                          <HStack spacing={1}>
                            <Icon as={FiMessageSquare} boxSize={3} />
                            <Text>{item.message_count || 0}</Text>
                          </HStack>
                          <HStack spacing={1}>
                            <Icon as={FiMail} boxSize={3} />
                            <Text>{item.email_count || 0}</Text>
                          </HStack>
                        </HStack>
                      </Td>

                      {/* Next Follow-up / Deadline */}
                      <Td py={2.5} px={3} whiteSpace="nowrap">
                        <HStack spacing={1.5} align="flex-start">
                          <Icon as={FiCalendar} boxSize={3.5} color="gray.400" mt={0.5} />
                          <Box>
                            <Text fontSize="11px" fontWeight="600" color={headingColor} lineHeight="1.2">
                              {item.deadline
                                ? new Date(item.deadline).toLocaleDateString("en-US", {
                                    month: "short",
                                    day: "numeric",
                                    year: "numeric",
                                  })
                                : "Dec 25, 2026"}
                            </Text>
                            <Text fontSize="10px" color={subtextColor} mt={0.2}>
                              9:00 AM
                            </Text>
                          </Box>
                        </HStack>
                      </Td>

                      {/* Owner */}
                      <Td py={2.5} px={3} whiteSpace="nowrap">
                        <HStack spacing={2}>
                          <Avatar size="2xs" name={item.agentName || "Sara Alemu"} />
                          <Text fontSize="11px" color={textColor} fontWeight="500">
                            {item.agentName || "Sara Alemu"}
                          </Text>
                        </HStack>
                      </Td>

                      {/* Status */}
                      <Td py={2.5} px={3} whiteSpace="nowrap">
                        <Badge
                          bg={
                            statusLabel === "Overdue"
                              ? "#fee2e2"
                              : statusLabel === "Active"
                              ? "#e0f2fe"
                              : "#e8f8ee"
                          }
                          color={
                            statusLabel === "Overdue"
                              ? "#dc2626"
                              : statusLabel === "Active"
                              ? "#0284c7"
                              : "#16a34a"
                          }
                          fontSize="10px"
                          fontWeight="600"
                          px={2}
                          py={0.5}
                          borderRadius="full"
                          textTransform="none"
                        >
                          {statusLabel}
                        </Badge>
                      </Td>

                      {/* Actions */}
                      <Td py={2.5} px={2} textAlign="right">
                        <Menu placement="bottom-end">
                          <MenuButton
                            as={IconButton}
                            icon={<Icon as={FiMoreHorizontal} boxSize={3.5} />}
                            size="xs"
                            variant="ghost"
                            color="gray.400"
                            borderRadius="md"
                          />
                          <Portal>
                            <MenuList zIndex="1600" fontSize="xs" shadow="md" borderRadius="lg">
                              <MenuItem icon={<FiEye size={13} />} onClick={() => onOpenActivity && onOpenActivity(item)}>
                                View details & activity
                              </MenuItem>
                              <MenuItem icon={<FiEdit2 size={13} />} onClick={() => onOpenEdit && onOpenEdit(item)}>
                                Edit customer info
                              </MenuItem>
                              <MenuItem icon={<FiCheckCircle size={13} />} onClick={() => onOpenUpdate && onOpenUpdate(item)}>
                                Update services
                              </MenuItem>
                              <MenuItem icon={<FiMail size={13} />} onClick={() => onOpenConversation && onOpenConversation(item)}>
                                Open conversation
                              </MenuItem>
                              <MenuItem icon={<FiTrash2 size={13} />} color="red.500" onClick={() => onDeleteCustomer && onDeleteCustomer(item._id)}>
                                Delete
                              </MenuItem>
                            </MenuList>
                          </Portal>
                        </Menu>
                      </Td>
                    </Tr>
                  );
                })
              ) : (
                <Tr>
                  <Td colSpan={11} textAlign="center" py={8} color={subtextColor} fontSize="xs">
                    No customer follow-up records found.
                  </Td>
                </Tr>
              )}
            </Tbody>
          </Table>
        </Box>

        {/* Pagination Footer Matching Screenshot */}
        <Flex
          justify="space-between"
          align="center"
          px={4}
          py={3}
          borderTop="1px solid"
          borderColor={cardBorder}
          flexWrap="wrap"
          gap={3}
        >
          <Text fontSize="12px" color={subtextColor}>
            Showing 1–{filteredData.length} of {filteredData.length} customers
          </Text>

          <HStack spacing={4}>
            <HStack spacing={2}>
              <Text fontSize="12px" color={subtextColor}>
                Rows per page:
              </Text>
              <Select
                size="sm"
                fontSize="12px"
                borderRadius="md"
                borderColor={cardBorder}
                w="68px"
                h="30px"
                value={rowsPerPage}
                onChange={(e) => setRowsPerPage(Number(e.target.value))}
              >
                <option value={10}>10</option>
                <option value={25}>25</option>
                <option value={50}>50</option>
              </Select>
            </HStack>

            <HStack spacing={1.5}>
              <IconButton
                aria-label="Previous page"
                icon={<Text fontSize="xs">&lt;</Text>}
                size="xs"
                variant="outline"
                borderColor={cardBorder}
                color="gray.400"
                h="30px"
                w="30px"
                isDisabled
              />
              <Button
                size="xs"
                bg="#e0f2fe"
                color="#0284c7"
                fontSize="12px"
                fontWeight="700"
                h="30px"
                minW="30px"
                borderRadius="md"
              >
                1
              </Button>
              <IconButton
                aria-label="Next page"
                icon={<Text fontSize="xs">&gt;</Text>}
                size="xs"
                variant="outline"
                borderColor={cardBorder}
                color="gray.400"
                h="30px"
                w="30px"
                isDisabled
              />
            </HStack>
          </HStack>
        </Flex>
      </Box>
    </Box>
  );
};

export default FollowupTabPage;
