import React from "react";
import { Box, Button, Code, Heading, Text, VStack } from "@chakra-ui/react";

/**
 * ErrorBoundary — catches React render errors and shows them on-screen
 * instead of a silent white screen. Wrap any route or component to expose
 * runtime crashes during development.
 */
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    this.setState({ errorInfo });
    console.error("ErrorBoundary caught:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <Box
          minH="100vh"
          bg="#0f172a"
          display="flex"
          alignItems="center"
          justifyContent="center"
          p={8}
        >
          <VStack
            spacing={5}
            align="stretch"
            maxW="860px"
            w="full"
            bg="#1e293b"
            border="1px solid #334155"
            borderRadius="xl"
            p={8}
          >
            <Heading color="#f87171" size="lg">
              ⚠️ Render Error
            </Heading>
            <Text color="#cbd5e1" fontWeight="600">
              {this.state.error?.toString()}
            </Text>
            {this.state.errorInfo?.componentStack && (
              <Box
                as="pre"
                bg="#0f172a"
                border="1px solid #334155"
                borderRadius="lg"
                p={4}
                overflowX="auto"
                fontSize="xs"
                color="#94a3b8"
                whiteSpace="pre-wrap"
                wordBreak="break-word"
                maxH="320px"
                overflowY="auto"
              >
                {this.state.errorInfo.componentStack}
              </Box>
            )}
            <Button
              colorScheme="blue"
              alignSelf="flex-start"
              onClick={() => this.setState({ hasError: false, error: null, errorInfo: null })}
            >
              Try Again
            </Button>
          </VStack>
        </Box>
      );
    }
    return this.props.children;
  }
}

export default ErrorBoundary;
