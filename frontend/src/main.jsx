import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { ChakraProvider, Box, Flex, Text, CloseButton, extendTheme } from '@chakra-ui/react'
import { BrowserRouter } from 'react-router-dom'
import App from './App.jsx'

const theme = extendTheme({
  fonts: {
    heading: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
    body: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
  },
  radii: {
    sm: '8px',
    md: '12px',
    lg: '16px',
    xl: '20px',
    '2xl': '24px',
    '3xl': '32px',
    full: '9999px',
  },
  config: {
    initialColorMode: 'light',
    useSystemColorMode: false,
  },
  styles: {
    global: (props) => ({
      body: {
        bg: props.colorMode === 'dark' ? '#0f172a' : '#f8fafc',
        color: props.colorMode === 'dark' ? '#e2e8f0' : '#0f172a',
        transition: 'background-color 0.2s ease',
      },
    }),
  },
  components: {
    Button: {
      baseStyle: {
        fontWeight: '600',
        borderRadius: '12px',
        transition: 'all 0.2s ease',
      },
    },
    Input: {
      baseStyle: {
        field: {
          borderRadius: '12px',
        },
      },
    },
    Select: {
      baseStyle: {
        field: {
          borderRadius: '12px',
        },
      },
    },
    Drawer: {
      baseStyle: {
        dialog: {
          borderLeftRadius: '2xl',
        },
      },
    },
  },
});

// Sleek Custom Toast Component
const CustomToast = ({ title, description, status, onClose, isClosable }) => {
  let borderColor = '#3b82f6';
  let iconColor = '#3b82f6';
  let accentBg = 'rgba(59, 130, 246, 0.14)';
  let iconSvg = (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" /><line x1="12" y1="16" x2="12" y2="12" /><line x1="12" y1="8" x2="12.01" y2="8" />
    </svg>
  );
  
  if (status === 'success') {
    borderColor = '#10b981';
    iconColor = '#10b981';
    accentBg = 'rgba(16, 185, 129, 0.16)';
    iconSvg = (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
        <polyline points="22 4 12 14.01 9 11.01" />
      </svg>
    );
  } else if (status === 'error') {
    borderColor = '#ef4444';
    iconColor = '#ef4444';
    accentBg = 'rgba(239, 68, 68, 0.16)';
    iconSvg = (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10" /><line x1="15" y1="9" x2="9" y2="15" /><line x1="9" y1="9" x2="15" y2="15" />
      </svg>
    );
  } else if (status === 'warning') {
    borderColor = '#f59e0b';
    iconColor = '#f59e0b';
    accentBg = 'rgba(245, 158, 11, 0.16)';
    iconSvg = (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
        <line x1="12" y1="9" x2="12" y2="13" /><line x1="12" y1="17" x2="12.01" y2="17" />
      </svg>
    );
  }

  return (
    <Box
      role="alert"
      p={4}
      bg="rgba(15, 23, 42, 0.92)"
      backdropFilter="blur(16px)"
      border="1px solid"
      borderLeft="5px solid"
      borderColor={borderColor}
      borderRadius="xl"
      boxShadow="0 20px 25px -5px rgba(0, 0, 0, 0.25), 0 10px 10px -5px rgba(0, 0, 0, 0.15)"
      w="100%"
      maxW="md"
      minW={{ base: 'auto', sm: '300px' }}
      mx="auto"
      my={1}
    >
      <Flex align="start" gap={3}>
        <Flex boxSize="34px" borderRadius="lg" bg={accentBg} color={iconColor} align="center" justify="center" mt="-1px" flexShrink={0}>
          {iconSvg}
        </Flex>
        <Flex direction="column" flex="1">
          {title && (
            <Text fontWeight="bold" fontSize="sm" color="white" lineHeight="short">
              {title}
            </Text>
          )}
          {description && (
            <Text fontSize="xs" color="gray.300" mt={0.5} lineHeight="normal">
              {description}
            </Text>
          )}
        </Flex>
        {isClosable !== false && (
          <CloseButton
            size="sm"
            color="gray.400"
            _hover={{ color: "white", bg: "rgba(255, 255, 255, 0.06)" }}
            onClick={onClose}
            mt="-2px"
            mr="-2px"
          />
        )}
      </Flex>
    </Box>
  );
};

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <ChakraProvider theme={theme} toastOptions={{
        defaultOptions: {
          position: 'top',
          duration: 4000,
          isClosable: true,
          render: (props) => <CustomToast {...props} />
        }
      }}>
         <App />
      </ChakraProvider>
    </BrowserRouter>
  </StrictMode>,
);
