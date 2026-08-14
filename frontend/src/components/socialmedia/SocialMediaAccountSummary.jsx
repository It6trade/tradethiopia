import { useEffect, useMemo, useState } from "react";
import axios from "axios";
import {
  Alert,
  AlertDescription,
  AlertIcon,
  AlertTitle,
  Badge,
  Box,
  Button,
  Flex,
  HStack,
  Icon,
  Spinner,
  Table,
  Tbody,
  Td,
  Text,
  Th,
  Thead,
  Tr,
  useColorModeValue,
  VStack,
} from "@chakra-ui/react";
import { RepeatIcon } from "@chakra-ui/icons";
import { FiGlobe, FiMail, FiUser } from "react-icons/fi";
import { FaFacebookF, FaInstagram, FaLinkedinIn, FaTelegramPlane, FaTiktok, FaTwitter, FaWhatsapp, FaYoutube } from "react-icons/fa";
import { EmptyStateBlock, SurfaceCard } from "./SocialMediaPrimitives";

const mediaPlatformLabels = new Set([
  "Facebook",
  "Instagram",
  "TikTok",
  "YouTube",
  "LinkedIn",
  "WhatsApp",
  "Telegram",
  "X",
  "Twitter (X)",
  "Google",
  "Other",
]);

const platformVisuals = {
  Facebook: { icon: FaFacebookF, color: "#1877F2", bg: "rgba(24,119,242,0.1)" },
  Instagram: { icon: FaInstagram, color: "#E4405F", bg: "rgba(228,64,95,0.1)" },
  TikTok: { icon: FaTiktok, color: "#111827", bg: "rgba(17,24,39,0.08)" },
  YouTube: { icon: FaYoutube, color: "#FF0000", bg: "rgba(255,0,0,0.1)" },
  LinkedIn: { icon: FaLinkedinIn, color: "#0A66C2", bg: "rgba(10,102,194,0.1)" },
  WhatsApp: { icon: FaWhatsapp, color: "#25D366", bg: "rgba(37,211,102,0.1)" },
  Telegram: { icon: FaTelegramPlane, color: "#26A5E4", bg: "rgba(38,165,228,0.1)" },
  X: { icon: FaTwitter, color: "#111827", bg: "rgba(17,24,39,0.08)" },
  "Twitter (X)": { icon: FaTwitter, color: "#111827", bg: "rgba(17,24,39,0.08)" },
  Google: { icon: FiGlobe, color: "#2563EB", bg: "rgba(37,99,235,0.1)" },
  Other: { icon: FiGlobe, color: "#64748B", bg: "rgba(100,116,139,0.1)" },
};

const getPlatformVisual = (platform) => platformVisuals[platform] || platformVisuals.Other;

const getAccountKey = (account) =>
  [account.employeeFullName || "No employee", account.email || account.accountName || "No email"]
    .map((value) => value.toString().trim().toLowerCase())
    .join("|");

export default function SocialMediaAccountSummary() {
  const [accounts, setAccounts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const borderColor = useColorModeValue("rgba(226,232,240,0.9)", "rgba(148,163,184,0.16)");
  const muted = useColorModeValue("#64748B", "gray.400");
  const tableHeaderBg = useColorModeValue("rgba(248,250,252,0.92)", "whiteAlpha.100");
  const rowBg = useColorModeValue("rgba(255,255,255,0.96)", "whiteAlpha.50");
  const rowHover = useColorModeValue("rgba(248,250,252,0.98)", "rgba(255,255,255,0.05)");
  const iconPanelBg = useColorModeValue("rgba(37,99,235,0.08)", "whiteAlpha.100");

  const fetchAccounts = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${import.meta.env.VITE_API_URL}/api/social-account-credentials`);
      setAccounts(Array.isArray(response.data) ? response.data : response.data?.data || []);
      setError("");
    } catch (fetchError) {
      console.error("Failed to fetch account summary", fetchError);
      setError("Failed to load email-created social media accounts.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAccounts();
  }, []);

  const rows = useMemo(() => {
    const grouped = new Map();

    accounts
      .filter((account) => account.active !== false)
      .forEach((account) => {
        const key = getAccountKey(account);
        const current = grouped.get(key) || {
          id: key,
          employeeFullName: account.employeeFullName || "-",
          accountName: account.accountName || "-",
          email: account.email || "-",
          platforms: new Set(),
        };

        if (account.platform && account.platform !== "Email" && mediaPlatformLabels.has(account.platform)) {
          current.platforms.add(account.platform);
        }

        if (Array.isArray(account.socialPlatforms)) {
          account.socialPlatforms
            .filter((platform) => platform && platform !== "Email")
            .forEach((platform) => current.platforms.add(platform));
        }

        grouped.set(key, current);
      });

    return Array.from(grouped.values())
      .map((row) => ({ ...row, platforms: Array.from(row.platforms).sort((a, b) => a.localeCompare(b)) }))
      .filter((row) => row.platforms.length)
      .sort((a, b) => a.employeeFullName.localeCompare(b.employeeFullName));
  }, [accounts]);

  const renderPlatformBadges = (platforms, iconOnly = false) => (
    <HStack spacing={1.5} flexWrap="wrap">
      {platforms.map((platform) => {
        const platformVisual = getPlatformVisual(platform);
        if (iconOnly) {
          return (
            <Flex
              key={platform}
              w="26px"
              h="26px"
              borderRadius="full"
              align="center"
              justify="center"
              borderWidth="1px"
              borderColor={borderColor}
              bg={platformVisual.bg}
              color={platformVisual.color}
              title={platform}
              aria-label={platform}
              transition="transform 0.15s ease"
              _hover={{ transform: "scale(1.15)" }}
            >
              <Icon as={platformVisual.icon} boxSize={3} />
            </Flex>
          );
        }
        return (
          <HStack
            key={platform}
            spacing={1.5}
            px={2}
            py={0.5}
            borderRadius="full"
            borderWidth="1px"
            borderColor={borderColor}
            bg={platformVisual.bg}
            color={platformVisual.color}
            aria-label={platform}
            title={platform}
          >
            <Icon as={platformVisual.icon} boxSize={3} />
            <Text fontSize="10px" fontWeight="800" color="inherit">
              {platform}
            </Text>
          </HStack>
        );
      })}
    </HStack>
  );

  if (loading) {
    return (
      <SurfaceCard>
        <Box p={6}>
          <HStack spacing={3}>
            <Spinner size="sm" />
            <Text color={muted}>Loading account summary...</Text>
          </HStack>
        </Box>
      </SurfaceCard>
    );
  }

  return (
    <VStack align="stretch" spacing={4}>
      {error ? (
        <Alert status="error" borderRadius="18px" borderWidth="1px" borderColor={borderColor}>
          <AlertIcon />
          <Box>
            <AlertTitle>Account summary unavailable</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Box>
        </Alert>
      ) : null}

      <SurfaceCard>
        <Box p={{ base: 3, md: 4 }}>
          <Flex justify="space-between" align={{ base: "stretch", md: "center" }} direction={{ base: "column", md: "row" }} gap={3} mb={4}>
            <Box>
              <Text fontSize="sm" fontWeight="800">
                Email based social media accounts
              </Text>
              <Text fontSize="sm" color={muted}>
                Shows the social media accounts connected to each employee email.
              </Text>
            </Box>
            <Button leftIcon={<RepeatIcon />} size="sm" borderRadius="14px" variant="outline" onClick={fetchAccounts}>
              Refresh
            </Button>
          </Flex>

          {rows.length ? (
            <>
              <VStack display={{ base: "flex", md: "none" }} align="stretch" spacing={2.5}>
                {rows.map((row) => (
                  <Box key={row.id} p={3} borderWidth="1px" borderColor={borderColor} borderRadius="14px" bg={rowBg}>
                    <VStack align="stretch" spacing={2.5}>
                      <HStack spacing={2.5}>
                        <Box p={2} borderRadius="10px" bg={iconPanelBg} color="#2563EB">
                          <Icon as={FiUser} boxSize={3.5} />
                        </Box>
                        <Box minW={0}>
                          <Text fontSize="sm" fontWeight="700" noOfLines={1}>
                            {row.employeeFullName}
                          </Text>
                          <Text fontSize="xs" color={muted} noOfLines={1}>
                            {row.email}
                          </Text>
                        </Box>
                      </HStack>
                      <HStack spacing={2}>
                        <Icon as={FiMail} color={muted} boxSize={3.5} />
                        <Text fontSize="xs" color={muted} noOfLines={1}>
                          {row.email}
                        </Text>
                      </HStack>
                      <Box>{renderPlatformBadges(row.platforms)}</Box>
                    </VStack>
                  </Box>
                ))}
              </VStack>

              <Box display={{ base: "none", md: "block" }} overflowX="auto">
                <Table variant="unstyled" sx={{ borderCollapse: "separate", borderSpacing: "0 6px" }}>
                  <Thead>
                    <Tr>
                      {["Employee", "Email", "Social Media Account"].map((heading) => (
                        <Th
                          key={heading}
                          px={4}
                          py={2}
                          fontSize="10px"
                          textTransform="uppercase"
                          letterSpacing="0.12em"
                          color={muted}
                          bg={tableHeaderBg}
                          borderY="1px"
                          borderColor={borderColor}
                          _first={{ borderLeftWidth: "1px", borderLeftRadius: "12px" }}
                          _last={{ borderRightWidth: "1px", borderRightRadius: "12px" }}
                        >
                          {heading}
                        </Th>
                      ))}
                    </Tr>
                  </Thead>
                  <Tbody>
                    {rows.map((row) => (
                      <Tr
                        key={row.id}
                        bg={rowBg}
                        boxShadow="0 1px 4px rgba(15,23,42,0.02)"
                        transition="all 0.15s ease"
                        _hover={{ bg: rowHover, transform: "translateY(-0.5px)", boxShadow: "0 6px 18px rgba(15,23,42,0.05)" }}
                      >
                        <Td px={4} py={2} borderY="1px" borderColor={borderColor} _first={{ borderLeftWidth: "1px", borderLeftRadius: "14px" }}>
                          <HStack spacing={2.5}>
                            <Box p={2} borderRadius="10px" bg={iconPanelBg} color="#2563EB">
                              <Icon as={FiUser} boxSize={3.5} />
                            </Box>
                            <Text fontSize="sm" fontWeight="700">{row.employeeFullName}</Text>
                          </HStack>
                        </Td>
                        <Td px={4} py={2} borderY="1px" borderColor={borderColor}>
                          <HStack spacing={2}>
                            <Icon as={FiMail} color={muted} boxSize={3.5} />
                            <Text fontSize="xs" color={muted}>{row.email}</Text>
                          </HStack>
                        </Td>
                        <Td px={4} py={2} borderY="1px" borderColor={borderColor} _last={{ borderRightWidth: "1px", borderRightRadius: "14px" }}>
                          {renderPlatformBadges(row.platforms, true)}
                        </Td>
                      </Tr>
                    ))}
                  </Tbody>
                </Table>
              </Box>
            </>
          ) : (
            <EmptyStateBlock
              title="No email social accounts yet"
              description="Add an email account, then select the social media checkboxes. The connected media accounts will appear here."
              badge="Account"
            />
          )}
        </Box>
      </SurfaceCard>
    </VStack>
  );
}
