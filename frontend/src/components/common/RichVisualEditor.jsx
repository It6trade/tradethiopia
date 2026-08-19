import React, { useEffect, useRef, useState } from 'react';
import {
  Box,
  Button,
  Divider,
  Flex,
  HStack,
  IconButton,
  Popover,
  PopoverArrow,
  PopoverBody,
  PopoverContent,
  PopoverHeader,
  PopoverTrigger,
  SimpleGrid,
  Text,
  Tooltip,
  useColorModeValue,
} from '@chakra-ui/react';
import {
  FiBold,
  FiCode,
  FiItalic,
  FiList,
  FiRotateCcw,
  FiUnderline,
} from 'react-icons/fi';
import { MdFormatListNumbered } from 'react-icons/md';

const COLOR_PALETTE = [
  { name: 'Default Dark', color: '#1A202C' },
  { name: 'Red', color: '#E53E3E' },
  { name: 'Blue', color: '#3182CE' },
  { name: 'Green', color: '#38A169' },
  { name: 'Orange', color: '#DD6B20' },
  { name: 'Purple', color: '#805AD5' },
  { name: 'Teal', color: '#319795' },
  { name: 'Gold', color: '#D69E2E' },
  { name: 'Gray', color: '#718096' },
];

const RichVisualEditor = ({
  value = '',
  onChange,
  placeholder = 'Write notice details, instructions, action items...',
  minH = '180px',
}) => {
  const editorRef = useRef(null);
  const [activeFormats, setActiveFormats] = useState({
    bold: false,
    italic: false,
    underline: false,
    list: false,
  });

  const borderColor = useColorModeValue('gray.200', 'gray.600');
  const toolbarBg = useColorModeValue('gray.50', 'gray.750');
  const editorBg = useColorModeValue('white', 'gray.800');
  const placeholderColor = useColorModeValue('gray.400', 'gray.500');

  // Update active format states when selection or typing changes
  const updateActiveStates = () => {
    try {
      setActiveFormats({
        bold: Boolean(document.queryCommandState('bold')),
        italic: Boolean(document.queryCommandState('italic')),
        underline: Boolean(document.queryCommandState('underline')),
        list: Boolean(document.queryCommandState('insertUnorderedList')),
      });
    } catch {
      // ignore
    }
  };

  // Keep editor DOM in sync with value prop without breaking user typing cursor
  useEffect(() => {
    if (editorRef.current && editorRef.current.innerHTML !== value) {
      if (document.activeElement !== editorRef.current) {
        editorRef.current.innerHTML = value || '';
      }
    }
  }, [value]);

  const handleInput = () => {
    if (editorRef.current) {
      const html = editorRef.current.innerHTML;
      const cleanHtml = html === '<br>' || html === '<p><br></p>' ? '' : html;
      onChange?.(cleanHtml);
      updateActiveStates();
    }
  };

  const executeCommand = (command, commandValue = null) => {
    if (!editorRef.current) return;
    editorRef.current.focus();
    try {
      document.execCommand(command, false, commandValue);
      handleInput();
      updateActiveStates();
    } catch (e) {
      console.warn('execCommand warning:', e);
    }
  };

  const handleColorPick = (color) => {
    executeCommand('foreColor', color);
  };

  return (
    <Box
      border="1px solid"
      borderColor={borderColor}
      borderRadius="xl"
      overflow="hidden"
      bg={editorBg}
      boxShadow="sm"
      _focusWithin={{ borderColor: 'blue.400', boxShadow: '0 0 0 1px #3182ce' }}
      transition="all 0.2s"
    >
      {/* Visual Toolbar */}
      <Box
        bg={toolbarBg}
        p={2}
        borderBottom="1px solid"
        borderColor={borderColor}
        userSelect="none"
      >
        <Flex wrap="wrap" align="center" justify="space-between" gap={2}>
          <HStack spacing={1}>
            <Tooltip label="Bold (Click to toggle ON / OFF)">
              <IconButton
                size="sm"
                aria-label="Bold"
                icon={<FiBold />}
                variant={activeFormats.bold ? 'solid' : 'ghost'}
                colorScheme={activeFormats.bold ? 'blue' : 'gray'}
                onMouseDown={(e) => {
                  e.preventDefault();
                  executeCommand('bold');
                }}
              />
            </Tooltip>

            <Tooltip label="Italic (Click to toggle ON / OFF)">
              <IconButton
                size="sm"
                aria-label="Italic"
                icon={<FiItalic />}
                variant={activeFormats.italic ? 'solid' : 'ghost'}
                colorScheme={activeFormats.italic ? 'blue' : 'gray'}
                onMouseDown={(e) => {
                  e.preventDefault();
                  executeCommand('italic');
                }}
              />
            </Tooltip>

            <Tooltip label="Underline (Click to toggle ON / OFF)">
              <IconButton
                size="sm"
                aria-label="Underline"
                icon={<FiUnderline />}
                variant={activeFormats.underline ? 'solid' : 'ghost'}
                colorScheme={activeFormats.underline ? 'blue' : 'gray'}
                onMouseDown={(e) => {
                  e.preventDefault();
                  executeCommand('underline');
                }}
              />
            </Tooltip>

            <Divider orientation="vertical" h="20px" mx={1} />

            {/* Color Palette Popover */}
            <Popover placement="bottom-start">
              <PopoverTrigger>
                <Button
                  size="sm"
                  variant="ghost"
                  leftIcon={<Box w="12px" h="12px" borderRadius="full" bg="blue.500" />}
                >
                  Text Color
                </Button>
              </PopoverTrigger>
              <PopoverContent p={2} w="210px" zIndex={1500}>
                <PopoverArrow />
                <PopoverHeader fontSize="xs" fontWeight="bold">Choose Text Color</PopoverHeader>
                <PopoverBody p={2}>
                  <SimpleGrid columns={3} spacing={2}>
                    {COLOR_PALETTE.map((c) => (
                      <Tooltip key={c.color} label={c.name}>
                        <Box
                          as="button"
                          type="button"
                          w="36px"
                          h="36px"
                          borderRadius="lg"
                          bg={c.color}
                          border="2px solid white"
                          boxShadow="sm"
                          _hover={{ transform: 'scale(1.12)' }}
                          transition="all 0.15s"
                          onMouseDown={(e) => {
                            e.preventDefault();
                            handleColorPick(c.color);
                          }}
                        />
                      </Tooltip>
                    ))}
                  </SimpleGrid>
                </PopoverBody>
              </PopoverContent>
            </Popover>

            <Divider orientation="vertical" h="20px" mx={1} />

            <Tooltip label="Bullet List">
              <IconButton
                size="sm"
                aria-label="Bullet List"
                icon={<FiList />}
                variant={activeFormats.list ? 'solid' : 'ghost'}
                colorScheme={activeFormats.list ? 'blue' : 'gray'}
                onMouseDown={(e) => {
                  e.preventDefault();
                  executeCommand('insertUnorderedList');
                }}
              />
            </Tooltip>

            <Tooltip label="Numbered List">
              <IconButton
                size="sm"
                aria-label="Numbered List"
                icon={<MdFormatListNumbered size={18} />}
                variant="ghost"
                onMouseDown={(e) => {
                  e.preventDefault();
                  executeCommand('insertOrderedList');
                }}
              />
            </Tooltip>

            <Tooltip label="Clear Formatting">
              <IconButton
                size="sm"
                aria-label="Clear Formatting"
                icon={<FiRotateCcw />}
                variant="ghost"
                onMouseDown={(e) => {
                  e.preventDefault();
                  executeCommand('removeFormat');
                }}
              />
            </Tooltip>
          </HStack>

          <Text fontSize="2xs" color="gray.500">
            Click format to turn ON / OFF or select text
          </Text>
        </Flex>
      </Box>

      {/* Visual contentEditable Editing Canvas */}
      <Box
        ref={editorRef}
        contentEditable
        onInput={handleInput}
        onKeyUp={updateActiveStates}
        onMouseUp={updateActiveStates}
        p={4}
        minH={minH}
        maxH="400px"
        overflowY="auto"
        outline="none"
        fontSize="sm"
        lineHeight="tall"
        sx={{
          '&:empty:before': {
            content: `attr(data-placeholder)`,
            color: placeholderColor,
            pointerEvents: 'none',
            display: 'block',
          },
          'ul, ol': {
            paddingLeft: '24px',
            margin: '8px 0',
          },
          'li': {
            marginBottom: '4px',
          },
          'p': {
            marginBottom: '8px',
          },
        }}
        data-placeholder={placeholder}
      />
    </Box>
  );
};

export default RichVisualEditor;
