import React, { useState, useRef } from "react";
import {
  Badge,
  Box,
  Button,
  Flex,
  FormControl,
  FormLabel,
  Grid,
  GridItem,
  Heading,
  HStack,
  Icon,
  Input,
  Progress,
  Radio,
  RadioGroup,
  Select,
  Stack,
  Text,
  Textarea,
  useColorModeValue,
  useToast,
  VStack
} from "@chakra-ui/react";
import {
  FiBook,
  FiFileText,
  FiFolder,
  FiLink,
  FiPlus,
  FiUploadCloud,
  FiVideo,
  FiX
} from "react-icons/fi";

const typeOptions = [
  { value: "pdf", label: "PDF Document / E-Book", icon: FiBook, color: "teal" },
  { value: "video", label: "Video Tutorial / Masterclass", icon: FiVideo, color: "purple" },
  { value: "document", label: "Handbook / Word Doc", icon: FiFileText, color: "blue" },
  { value: "powerpoint", label: "Presentation (PPT)", icon: FiFolder, color: "pink" },
  { value: "excel", label: "Spreadsheet (XLSX)", icon: FiFileText, color: "orange" },
];

const UploadTrainingMaterial = ({ onUpload }) => {
  const [file, setFile] = useState(null);
  const [type, setType] = useState("");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [videoSource, setVideoSource] = useState("file");
  const [videoLink, setVideoLink] = useState("");
  const [uploading, setUploading] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef(null);
  const toast = useToast();

  const cardBg = useColorModeValue("white", "gray.800");
  const borderColor = useColorModeValue("gray.200", "gray.700");
  const dropzoneBg = useColorModeValue("gray.50", "gray.900");

  const handleFileChange = (e) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    const droppedFile = e.dataTransfer.files?.[0];
    if (droppedFile) {
      setFile(droppedFile);
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleUpload = async () => {
    if (!type || !title.trim()) {
      toast({
        title: "Missing fields",
        description: "Please enter a material title and select a type.",
        status: "error",
        duration: 3000,
        isClosable: true
      });
      return;
    }

    if (!file && !(type === "video" && videoSource === "link")) {
      toast({
        title: "File is required",
        description: "Please select a file or provide a video link.",
        status: "error",
        duration: 3000,
        isClosable: true
      });
      return;
    }

    setUploading(true);

    const formData = new FormData();
    formData.append("type", type);
    formData.append("title", title.trim());
    formData.append("description", description.trim());
    if (type === "video" && videoSource === "link") {
      formData.append("content", videoLink.trim());
    } else if (file) {
      formData.append("file", file);
    }

    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/resources/upload`, {
        method: "POST",
        body: formData,
      });

      if (res.ok) {
        toast({
          title: "Material published to library",
          description: `"${title}" has been successfully added.`,
          status: "success",
          duration: 3500,
          isClosable: true
        });
        setFile(null);
        setType("");
        setTitle("");
        setDescription("");
        setVideoLink("");
        if (fileInputRef.current) fileInputRef.current.value = "";
        if (onUpload) onUpload();
      } else {
        const errorData = await res.json().catch(() => ({}));
        toast({
          title: "Upload failed",
          description: errorData.message || "An error occurred during upload.",
          status: "error",
          duration: 4500,
          isClosable: true
        });
      }
    } catch (err) {
      toast({
        title: "Error uploading",
        description: err.message,
        status: "error",
        duration: 4500,
        isClosable: true
      });
    } finally {
      setUploading(false);
    }
  };

  return (
    <Box
      p={{ base: 5, md: 7 }}
      borderRadius="2xl"
      border="1px solid"
      borderColor={borderColor}
      bg={cardBg}
      boxShadow="sm"
      mb={8}
      transition="all 0.2s"
    >
      <Flex justify="space-between" align={{ base: "flex-start", sm: "center" }} mb={6} direction={{ base: "column", sm: "row" }} gap={2}>
        <HStack spacing={3}>
          <Flex
            w="42px"
            h="42px"
            borderRadius="xl"
            bg="teal.50"
            color="teal.600"
            align="center"
            justify="center"
          >
            <Icon as={FiUploadCloud} boxSize={5} />
          </Flex>
          <Box>
            <Heading size="sm" color="gray.900">
              Upload New Training Material / Book
            </Heading>
            <Text fontSize="xs" color="gray.500">
              Add handbooks, reading guides, PDFs, video modules, and documentation for staff.
            </Text>
          </Box>
        </HStack>
        {type && (
          <Badge colorScheme="teal" borderRadius="full" px={3} py={1} fontSize="xs">
            {type.toUpperCase()}
          </Badge>
        )}
      </Flex>

      {uploading && (
        <Box mb={5} p={4} bg="teal.50" borderRadius="xl" border="1px solid" borderColor="teal.200">
          <HStack justify="space-between" mb={2}>
            <Text fontSize="xs" fontWeight="700" color="teal.800">
              Uploading file to secure cloud storage...
            </Text>
            <Text fontSize="xs" color="teal.600">
              Please wait
            </Text>
          </HStack>
          <Progress size="xs" colorScheme="teal" isIndeterminate borderRadius="full" />
        </Box>
      )}

      <Grid templateColumns={{ base: "1fr", lg: "1.2fr 1fr" }} gap={6}>
        {/* Left column: Metadata */}
        <VStack spacing={4} align="stretch">
          <FormControl isRequired>
            <FormLabel fontSize="xs" fontWeight="700" color="gray.600" textTransform="uppercase" letterSpacing="wider">
              Material Title / Book Name
            </FormLabel>
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Employee Onboarding Guide, Safety Protocol Handbook"
              borderRadius="xl"
              fontSize="sm"
              focusBorderColor="teal.500"
              isDisabled={uploading}
            />
          </FormControl>

          <FormControl isRequired>
            <FormLabel fontSize="xs" fontWeight="700" color="gray.600" textTransform="uppercase" letterSpacing="wider">
              Category / Resource Type
            </FormLabel>
            <Select
              value={type}
              onChange={(e) => setType(e.target.value)}
              borderRadius="xl"
              fontSize="sm"
              placeholder="Select resource format"
              focusBorderColor="teal.500"
              isDisabled={uploading}
            >
              {typeOptions.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </Select>
          </FormControl>

          <FormControl>
            <FormLabel fontSize="xs" fontWeight="700" color="gray.600" textTransform="uppercase" letterSpacing="wider">
              Description & Learning Outcomes
            </FormLabel>
            <Textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Provide a concise summary, chapter breakdown, or reading instructions..."
              borderRadius="xl"
              fontSize="sm"
              rows={3}
              focusBorderColor="teal.500"
              isDisabled={uploading}
            />
          </FormControl>
        </VStack>

        {/* Right column: File dropzone / Video Link */}
        <VStack spacing={4} align="stretch">
          {type === "video" && (
            <FormControl>
              <FormLabel fontSize="xs" fontWeight="700" color="gray.600" textTransform="uppercase" letterSpacing="wider">
                Video Delivery Source
              </FormLabel>
              <RadioGroup value={videoSource} onChange={setVideoSource} isDisabled={uploading}>
                <Stack direction="row" spacing={4}>
                  <Radio value="file" colorScheme="teal" size="sm">Upload MP4 Video</Radio>
                  <Radio value="link" colorScheme="teal" size="sm">Video URL / YouTube Link</Radio>
                </Stack>
              </RadioGroup>
            </FormControl>
          )}

          {type === "video" && videoSource === "link" ? (
            <FormControl isRequired>
              <FormLabel fontSize="xs" fontWeight="700" color="gray.600" textTransform="uppercase" letterSpacing="wider">
                External Video URL
              </FormLabel>
              <Input
                value={videoLink}
                onChange={(e) => setVideoLink(e.target.value)}
                placeholder="https://youtube.com/watch?v=... or MP4 URL"
                borderRadius="xl"
                fontSize="sm"
                focusBorderColor="teal.500"
                isDisabled={uploading}
              />
              <Text mt={1.5} fontSize="xs" color="gray.400">
                Staff can stream this video directly within the training player.
              </Text>
            </FormControl>
          ) : (
            <FormControl isRequired>
              <FormLabel fontSize="xs" fontWeight="700" color="gray.600" textTransform="uppercase" letterSpacing="wider">
                Attach Publication File
              </FormLabel>
              <Box
                border="2px dashed"
                borderColor={isDragging ? "teal.500" : file ? "teal.300" : borderColor}
                borderRadius="2xl"
                p={5}
                bg={isDragging ? "teal.50" : file ? "teal.50" : dropzoneBg}
                textAlign="center"
                cursor="pointer"
                transition="all 0.2s"
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                _hover={{ borderColor: "teal.400", bg: "teal.50" }}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  onChange={handleFileChange}
                  style={{ display: "none" }}
                  accept={
                    type === "video"
                      ? "video/*"
                      : type === "pdf"
                      ? ".pdf"
                      : type === "document"
                      ? ".doc,.docx"
                      : type === "excel"
                      ? ".xls,.xlsx"
                      : type === "powerpoint"
                      ? ".ppt,.pptx"
                      : "*"
                  }
                  disabled={uploading}
                />

                {file ? (
                  <VStack spacing={2}>
                    <Flex w="38px" h="38px" borderRadius="full" bg="teal.100" color="teal.700" align="center" justify="center">
                      <Icon as={FiFileText} boxSize={5} />
                    </Flex>
                    <Text fontSize="sm" fontWeight="700" color="gray.800" noOfLines={1}>
                      {file.name}
                    </Text>
                    <Text fontSize="xs" color="gray.500">
                      {(file.size / (1024 * 1024)).toFixed(2)} MB · Ready to upload
                    </Text>
                    <Button
                      size="xs"
                      colorScheme="red"
                      variant="ghost"
                      leftIcon={<FiX />}
                      onClick={(e) => {
                        e.stopPropagation();
                        setFile(null);
                        if (fileInputRef.current) fileInputRef.current.value = "";
                      }}
                    >
                      Remove file
                    </Button>
                  </VStack>
                ) : (
                  <VStack spacing={2}>
                    <Flex w="42px" h="42px" borderRadius="full" bg="gray.200" color="gray.600" align="center" justify="center">
                      <Icon as={FiUploadCloud} boxSize={5} />
                    </Flex>
                    <Box>
                      <Text fontSize="sm" fontWeight="700" color="gray.700">
                        Click to browse or drag & drop
                      </Text>
                      <Text fontSize="xs" color="gray.400" mt={0.5}>
                        PDF, DOCX, PPTX, XLSX, or MP4 files
                      </Text>
                    </Box>
                  </VStack>
                )}
              </Box>
            </FormControl>
          )}

          <Button
            colorScheme="teal"
            size="md"
            borderRadius="xl"
            fontWeight="700"
            leftIcon={<FiPlus />}
            onClick={handleUpload}
            isLoading={uploading}
            loadingText="Uploading to library..."
            isDisabled={uploading || (!file && !(type === "video" && videoSource === "link")) || !title.trim() || !type}
            mt="auto"
            shadow="sm"
          >
            Publish to Library
          </Button>
        </VStack>
      </Grid>
    </Box>
  );
};

export default UploadTrainingMaterial;