import { IconButton, Tooltip, useDisclosure } from '@chakra-ui/react';
import { FiFileText } from 'react-icons/fi';
import NotesDrawer from './NotesDrawer';

const NotesLauncher = ({ buttonProps = {}, tooltipLabel = 'Open notes' }) => {
  const { isOpen, onOpen, onClose } = useDisclosure();
  const { icon, ...restProps } = buttonProps;
  const resolvedIcon = icon || <FiFileText />;
  const resolvedLabel = tooltipLabel || restProps['aria-label'] || 'Open notes';

  const finalButtonProps = {
    'aria-label': restProps['aria-label'] || resolvedLabel,
    ...restProps,
  };

  return (
    <>
      <Tooltip label={resolvedLabel}>
        <IconButton
          icon={resolvedIcon}
          onClick={onOpen}
          {...finalButtonProps}
        />
      </Tooltip>
      <NotesDrawer isOpen={isOpen} onClose={onClose} />
    </>
  );
};

export default NotesLauncher;
