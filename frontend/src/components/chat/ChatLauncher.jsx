import {
  Badge,
  Box,
  Drawer,
  DrawerBody,
  DrawerCloseButton,
  DrawerContent,
  DrawerHeader,
  DrawerOverlay,
  IconButton,
  useDisclosure,
} from '@chakra-ui/react';
import ChatWorkspace from './ChatWorkspace';
import { useChatSummary } from '../../hooks/useChatSummary';

const ChatLauncher = ({ icon, ariaLabel = 'Open workspace chat', iconButtonProps = {}, unreadCount, preferredView = 'default' }) => {
  const { isOpen, onOpen, onClose } = useDisclosure();
  const { summary } = useChatSummary();
  const badgeCount = typeof unreadCount === 'number' ? unreadCount : summary.unreadCount;

  return (
    <>
      <IconButton
        icon={
          <Box position="relative">
            {icon}
            {badgeCount > 0 && (
              <Badge
                colorScheme="red"
                borderRadius="full"
                position="absolute"
                top="-6px"
                right="-8px"
                fontSize="10px"
                minW="18px"
                h="18px"
                display="flex"
                alignItems="center"
                justifyContent="center"
              >
                {badgeCount > 99 ? '99+' : badgeCount}
              </Badge>
            )}
          </Box>
        }
        aria-label={ariaLabel}
        onClick={onOpen}
        {...iconButtonProps}
      />
      <Drawer isOpen={isOpen} placement="right" onClose={onClose} size="xl">
        <DrawerOverlay />
        <DrawerContent>
          <DrawerCloseButton />
          <DrawerHeader borderBottomWidth="1px">Workspace Chat</DrawerHeader>
          <DrawerBody p={3}>
            <ChatWorkspace embedded preferredView={preferredView} />
          </DrawerBody>
        </DrawerContent>
      </Drawer>
    </>
  );
};

export default ChatLauncher;
