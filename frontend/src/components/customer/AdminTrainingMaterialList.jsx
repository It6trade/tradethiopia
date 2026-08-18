import React, { useEffect, useMemo, useState } from "react";
import {
  Badge,
  Box,
  Button,
  Card,
  CardBody,
  Flex,
  Heading,
  HStack,
  Icon,
  IconButton,
  Input,
  InputGroup,
  InputLeftElement,
  SimpleGrid,
  Skeleton,
  Tag,
  Text,
  Tooltip,
  useColorModeValue,
  useToast,
  VStack
} from "@chakra-ui/react";
import {
  FiBook,
  FiBookOpen,
  FiClock,
  FiDownload,
  FiEye,
  FiFileText,
  FiFilm,
  FiGrid,
  FiLayers,
  FiList,
  FiSearch,
  FiTrash2,
  FiVideo
} from "react-icons/fi";

const getBookTheme = (type, index = 0) => {
  const themes = [
    {
      gradient: "linear(to-br, #0f3938, #134e4a, #042f2e)",
      accent: "#2dd4bf",
      border: "teal.700",
      tagBg: "teal.900",
      textColor: "teal.50"
    },
    {
      gradient: "linear(to-br, #1e293b, #0f172a, #334155)",
      accent: "#38bdf8",
      border: "blue.700",
      tagBg: "blue.900",
      textColor: "blue.50"
    },
    {
      gradient: "linear(to-br, #2e1065, #3b0764, #1e1b4b)",
      accent: "#c084fc",
      border: "purple.700",
      tagBg: "purple.900",
      textColor: "purple.50"
    },
    {
      gradient: "linear(to-br, #451a03, #78350f, #291305)",
      accent: "#f59e0b",
      border: "orange.700",
      tagBg: "orange.900",
      textColor: "amber.50"
    }
  ];

  if (type === "video") return themes[2];
  if (type === "pdf") return themes[0];
  if (type === "document") return themes[1];
  return themes[index % themes.length];
};

const AdminTrainingMaterialList = () => {
  const [materials, setMaterials] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedFilter, setSelectedFilter] = useState("all");
  const [viewMode, setViewMode] = useState("shelf"); // "shelf" or "list"
  const toast = useToast();

  const cardBg = useColorModeValue("white", "gray.800");
  const borderColor = useColorModeValue("gray.200", "gray.700");

  const fetchMaterials = async () => {
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/resources/`);
      const data = await res.json();
      setMaterials(Array.isArray(data) ? data : []);
    } catch (err) {
      toast({
        title: "Failed to fetch materials",
        description: err.message,
        status: "error",
        duration: 3000,
        isClosable: true
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMaterials();
  }, []);

  const handleDelete = async (id, title) => {
    if (!window.confirm(`Are you sure you want to remove "${title || 'this resource'}" from the training library?`)) {
      return;
    }
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/resources/${id}`, {
        method: "DELETE",
      });
      if (res.ok) {
        toast({
          title: "Resource removed",
          description: "Material deleted from the training repository.",
          status: "success",
          duration: 2500,
          isClosable: true
        });
        fetchMaterials();
      } else {
        const data = await res.json();
        toast({
          title: data.message || "Failed to delete",
          status: "error",
          duration: 3000,
          isClosable: true
        });
      }
    } catch (err) {
      toast({
        title: "Error deleting resource",
        description: err.message,
        status: "error",
        duration: 3000,
        isClosable: true
      });
    }
  };

  const canViewInBrowser = (type) => {
    return ["pdf", "document", "excel", "powerpoint", "video"].includes(type);
  };

  const filteredMaterials = useMemo(() => {
    return materials.filter((item) => {
      const matchesSearch =
        !searchQuery.trim() ||
        item.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.type?.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesFilter =
        selectedFilter === "all" ||
        (selectedFilter === "pdf" && item.type === "pdf") ||
        (selectedFilter === "video" && item.type === "video") ||
        (selectedFilter === "document" && item.type === "document") ||
        (selectedFilter === "slides" && item.type === "powerpoint") ||
        (selectedFilter === "sheets" && item.type === "excel");

      return matchesSearch && matchesFilter;
    });
  }, [materials, searchQuery, selectedFilter]);

  const filterTabs = [
    { key: "all", label: `All Books & Docs (${materials.length})`, icon: FiLayers },
    { key: "pdf", label: `PDFs & E-Books (${materials.filter((m) => m.type === "pdf").length})`, icon: FiBook },
    { key: "video", label: `Videos (${materials.filter((m) => m.type === "video").length})`, icon: FiVideo },
    { key: "document", label: `Handbooks (${materials.filter((m) => m.type === "document").length})`, icon: FiFileText },
  ];

  return (
    <Box mt={2}>
      {/* Header & Controls */}
      <Flex
        justify="space-between"
        align={{ base: "flex-start", md: "center" }}
        direction={{ base: "column", md: "row" }}
        gap={4}
        mb={6}
      >
        <Box>
          <HStack spacing={2} mb={1}>
            <Heading size="md" color="gray.800">
              Training Books & Material Library
            </Heading>
            <Badge colorScheme="teal" borderRadius="full" px={2.5} py={0.5} fontSize="xs">
              {materials.length} Publications
            </Badge>
          </HStack>
          <Text fontSize="xs" color="gray.500">
            Digital employee handbooks, onboarding guides, and training publications.
          </Text>
        </Box>

        <HStack spacing={3} w={{ base: "100%", md: "auto" }}>
          <InputGroup size="sm" maxW={{ base: "100%", md: "260px" }}>
            <InputLeftElement pointerEvents="none">
              <Icon as={FiSearch} color="gray.400" />
            </InputLeftElement>
            <Input
              placeholder="Search book name, title, topic..."
              borderRadius="xl"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              focusBorderColor="teal.500"
            />
          </InputGroup>

          <HStack spacing={1} bg={useColorModeValue("gray.100", "gray.700")} p={1} borderRadius="xl">
            <Tooltip label="3D Book Shelf View">
              <IconButton
                aria-label="Shelf View"
                icon={<FiGrid />}
                size="xs"
                variant={viewMode === "shelf" ? "solid" : "ghost"}
                colorScheme={viewMode === "shelf" ? "teal" : "gray"}
                onClick={() => setViewMode("shelf")}
                borderRadius="lg"
              />
            </Tooltip>
            <Tooltip label="List Details View">
              <IconButton
                aria-label="List View"
                icon={<FiList />}
                size="xs"
                variant={viewMode === "list" ? "solid" : "ghost"}
                colorScheme={viewMode === "list" ? "teal" : "gray"}
                onClick={() => setViewMode("list")}
                borderRadius="lg"
              />
            </Tooltip>
          </HStack>
        </HStack>
      </Flex>

      {/* Filter Chips */}
      <HStack spacing={2} mb={6} overflowX="auto" pb={2}>
        {filterTabs.map((tab) => {
          const isSelected = selectedFilter === tab.key;
          return (
            <Button
              key={tab.key}
              size="xs"
              borderRadius="full"
              px={3.5}
              py={2}
              leftIcon={<Icon as={tab.icon} />}
              variant={isSelected ? "solid" : "outline"}
              colorScheme="teal"
              bg={isSelected ? "teal.600" : "transparent"}
              borderColor={isSelected ? "teal.600" : borderColor}
              color={isSelected ? "white" : "gray.600"}
              onClick={() => setSelectedFilter(tab.key)}
              _hover={{ bg: isSelected ? "teal.700" : "teal.50" }}
              flexShrink={0}
            >
              {tab.label}
            </Button>
          );
        })}
      </HStack>

      {/* Loading Skeleton */}
      {loading ? (
        <SimpleGrid columns={{ base: 1, sm: 2, md: 3, lg: 4 }} spacing={6}>
          {[1, 2, 3, 4].map((n) => (
            <Skeleton key={n} height="320px" borderRadius="2xl" />
          ))}
        </SimpleGrid>
      ) : filteredMaterials.length === 0 ? (
        /* Empty State */
        <Box
          p={10}
          textAlign="center"
          borderRadius="2xl"
          border="1px dashed"
          borderColor={borderColor}
          bg={cardBg}
        >
          <Flex
            w="54px"
            h="54px"
            borderRadius="full"
            bg="teal.50"
            color="teal.600"
            align="center"
            justify="center"
            mx="auto"
            mb={3}
          >
            <Icon as={FiBookOpen} boxSize={6} />
          </Flex>
          <Heading size="sm" color="gray.700" mb={1}>
            {searchQuery ? "No matching books or materials" : "No training materials in this category"}
          </Heading>
          <Text fontSize="xs" color="gray.400" maxW="400px" mx="auto" mb={4}>
            {searchQuery
              ? `No results found for "${searchQuery}". Try searching with different keywords.`
              : "Upload documents, company policy guides, or tutorial videos to build your organization's digital library."}
          </Text>
          {searchQuery && (
            <Button size="xs" colorScheme="teal" variant="outline" onClick={() => setSearchQuery("")}>
              Clear Search Query
            </Button>
          )}
        </Box>
      ) : viewMode === "shelf" ? (
        /* 3D Realistic Book Shelf View (Inspired by Reference Image) */
        <SimpleGrid columns={{ base: 1, sm: 2, md: 3, lg: 4 }} spacing={6}>
          {filteredMaterials.map((material, index) => {
            const theme = getBookTheme(material.type, index);
            const targetUrl = material.fileUrl || material.content || "#";

            return (
              <Box
                key={material._id}
                position="relative"
                role="group"
                transition="all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)"
                _hover={{ transform: "translateY(-6px)" }}
              >
                {/* 3D Standing Book Cover */}
                <Box
                  position="relative"
                  h="290px"
                  borderRadius="xl"
                  bgGradient={theme.gradient}
                  p={5}
                  color="white"
                  boxShadow="0 15px 30px -10px rgba(0, 0, 0, 0.4), 0 0 0 1px rgba(255, 255, 255, 0.1) inset"
                  overflow="hidden"
                  display="flex"
                  flexDirection="column"
                  justifyContent="space-between"
                  borderLeft="6px solid rgba(0, 0, 0, 0.3)"
                >
                  {/* Subtle Book Spine crease highlight */}
                  <Box
                    position="absolute"
                    top={0}
                    bottom={0}
                    left="12px"
                    w="1px"
                    bg="rgba(255, 255, 255, 0.25)"
                    boxShadow="0 0 4px rgba(255, 255, 255, 0.4)"
                  />
                  <Box
                    position="absolute"
                    top={0}
                    bottom={0}
                    left="15px"
                    w="2px"
                    bg="rgba(0, 0, 0, 0.3)"
                  />

                  {/* Header: Type Tag & Bookmark ribbon */}
                  <Flex justify="space-between" align="center" pl={3}>
                    <Tag
                      size="sm"
                      bg="rgba(255, 255, 255, 0.15)"
                      color="white"
                      backdropFilter="blur(8px)"
                      borderRadius="full"
                      px={2.5}
                      fontSize="10px"
                      fontWeight="800"
                      letterSpacing="wider"
                      border="1px solid rgba(255, 255, 255, 0.2)"
                    >
                      {material.type === "powerpoint" ? "PPT GUIDE" : material.type.toUpperCase()}
                    </Tag>
                    <Icon as={FiBook} color={theme.accent} boxSize={4} />
                  </Flex>

                  {/* Center: Book Title & Illustration icon */}
                  <Box my="auto" pl={3} pr={1}>
                    <Flex
                      w="40px"
                      h="40px"
                      borderRadius="xl"
                      bg="rgba(255, 255, 255, 0.1)"
                      align="center"
                      justify="center"
                      mb={3}
                      color={theme.accent}
                      border="1px solid rgba(255, 255, 255, 0.15)"
                    >
                      {material.type === "video" ? (
                        <Icon as={FiFilm} boxSize={5} />
                      ) : (
                        <Icon as={FiBookOpen} boxSize={5} />
                      )}
                    </Flex>
                    <Heading
                      size="sm"
                      fontWeight="800"
                      lineHeight="1.3"
                      mb={1.5}
                      noOfLines={2}
                      title={material.title}
                      fontFamily="inherit"
                    >
                      {material.title}
                    </Heading>
                    <Text
                      fontSize="xs"
                      opacity={0.8}
                      noOfLines={2}
                      lineHeight="1.4"
                    >
                      {material.description || "Official organization training documentation."}
                    </Text>
                  </Box>

                  {/* Footer on cover: Edition info & Quick Action Bar */}
                  <Box pl={3} pt={2} borderTop="1px solid rgba(255, 255, 255, 0.12)">
                    <HStack justify="space-between" align="center">
                      <Text fontSize="10px" opacity={0.7} fontWeight="600">
                        VOL. {String(index + 1).padStart(2, "0")} · 2026 EDITION
                      </Text>
                      <IconButton
                        aria-label="Delete resource"
                        icon={<FiTrash2 />}
                        size="xs"
                        variant="ghost"
                        color="red.200"
                        _hover={{ color: "red.400", bg: "rgba(255, 255, 255, 0.1)" }}
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDelete(material._id, material.title);
                        }}
                      />
                    </HStack>
                  </Box>
                </Box>

                {/* Bottom Details Card & Read CTA */}
                <Box
                  p={3.5}
                  bg={cardBg}
                  borderRadius="xl"
                  border="1px solid"
                  borderColor={borderColor}
                  mt={2}
                  boxShadow="xs"
                >
                  <HStack justify="space-between" align="center">
                    <Box flex={1} minW={0} pr={2}>
                      <Text fontSize="xs" fontWeight="700" color="gray.800" noOfLines={1}>
                        {material.title}
                      </Text>
                      <Text fontSize="10px" color="gray.400">
                        {material.type === "video" ? "Video Streaming" : "Digital Document"}
                      </Text>
                    </Box>
                    <Button
                      as="a"
                      href={targetUrl}
                      target={canViewInBrowser(material.type) ? "_blank" : "_self"}
                      download={!canViewInBrowser(material.type)}
                      size="xs"
                      colorScheme="teal"
                      borderRadius="lg"
                      rightIcon={<Icon as={FiEye} />}
                      fontWeight="700"
                    >
                      Read ↗
                    </Button>
                  </HStack>
                </Box>
              </Box>
            );
          })}
        </SimpleGrid>
      ) : (
        /* Detailed List View */
        <VStack spacing={3} align="stretch">
          {filteredMaterials.map((material, index) => {
            const targetUrl = material.fileUrl || material.content || "#";
            return (
              <Card
                key={material._id}
                bg={cardBg}
                borderRadius="xl"
                border="1px solid"
                borderColor={borderColor}
                boxShadow="xs"
                _hover={{ borderColor: "teal.300", shadow: "sm" }}
                transition="all 0.2s"
              >
                <CardBody p={4}>
                  <Flex justify="space-between" align="center" direction={{ base: "column", sm: "row" }} gap={3}>
                    <HStack spacing={3.5} align="center" flex={1}>
                      <Flex
                        w="42px"
                        h="42px"
                        borderRadius="xl"
                        bg="teal.50"
                        color="teal.600"
                        align="center"
                        justify="center"
                        flexShrink={0}
                      >
                        {material.type === "video" ? (
                          <Icon as={FiVideo} boxSize={5} />
                        ) : (
                          <Icon as={FiBook} boxSize={5} />
                        )}
                      </Flex>
                      <Box>
                        <HStack spacing={2} mb={0.5}>
                          <Text fontSize="sm" fontWeight="700" color="gray.800">
                            {material.title}
                          </Text>
                          <Tag
                            size="sm"
                            colorScheme="teal"
                            borderRadius="full"
                            fontSize="10px"
                            fontWeight="700"
                          >
                            {material.type.toUpperCase()}
                          </Tag>
                        </HStack>
                        <Text fontSize="xs" color="gray.500" noOfLines={1}>
                          {material.description || "Training material publication for staff."}
                        </Text>
                      </Box>
                    </HStack>

                    <HStack spacing={2}>
                      <Button
                        as="a"
                        href={targetUrl}
                        target={canViewInBrowser(material.type) ? "_blank" : "_self"}
                        download={!canViewInBrowser(material.type)}
                        size="sm"
                        colorScheme="teal"
                        borderRadius="xl"
                        leftIcon={<Icon as={FiEye} />}
                      >
                        Open Publication
                      </Button>
                      <IconButton
                        aria-label="Delete publication"
                        icon={<FiTrash2 />}
                        size="sm"
                        colorScheme="red"
                        variant="ghost"
                        borderRadius="xl"
                        onClick={() => handleDelete(material._id, material.title)}
                      />
                    </HStack>
                  </Flex>
                </CardBody>
              </Card>
            );
          })}
        </VStack>
      )}
    </Box>
  );
};

export default AdminTrainingMaterialList;