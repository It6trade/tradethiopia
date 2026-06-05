import React, { useState } from 'react';
import { Box } from '@chakra-ui/react';
import MobileSalesTopBar from '../../components/mobile/navigation/MobileSalesTopBar';
import MobileBottomNav from '../../components/mobile/navigation/MobileBottomNav';
import MobileFollowups from './MobileFollowups';
import MobileSalesHome from './MobileSalesHome';
import MobileSalesPlaceholder from './MobileSalesPlaceholder';
import MobileTasks from './MobileTasks';

const titleByItem = {
  Home: 'Sales',
  Followup: 'Contacts',
  'Package Sales': 'Deals',
  Tasks: 'My Tasks',
  Search: 'Search'
};

const MobileSalesShell = ({ activeItem, setActiveItem }) => {
  const [mobileItem, setMobileItem] = useState(() => (
    ['Home', 'Followup', 'Package Sales', 'Tasks'].includes(activeItem) ? activeItem : 'Home'
  ));
  const currentItem = mobileItem || 'Home';

  const renderMobileContent = () => {
    switch (currentItem) {
      case 'Home':
        return <MobileSalesHome onNavigate={setMobileItem} />;
      case 'Contacts':
        return <MobileSalesPlaceholder title="Contacts" description="Mobile contact cards and contact detail views will live here." />;
      case 'Followup':
        return <MobileFollowups />;
      case 'Package Sales':
        return <MobileSalesPlaceholder title="Deals" description="Mobile deal and package sales views will live here." />;
      case 'Tasks':
        return <MobileTasks />;
      case 'Search':
        return <MobileSalesPlaceholder title="Search" description="Mobile global search for contacts, tasks, deals, and resources will live here." />;
      case 'More':
        return <MobileSalesPlaceholder title="More" description="Profile, resources, settings, and logout actions will live here." />;
      default:
        return <MobileSalesHome onNavigate={setMobileItem} />;
    }
  };

  return (
    <Box minH="100vh" bg="#FAFBFD" color="#081A34" pb="92px">
      {currentItem !== 'Home' && (
        <Box position="sticky" top={0} zIndex={10}>
          <MobileSalesTopBar title={titleByItem[currentItem] || currentItem || 'Sales'} />
        </Box>
      )}
      <Box px={3} py={currentItem === 'Home' ? 5 : 4}>
        {renderMobileContent()}
      </Box>
      <MobileBottomNav activeItem={currentItem} onChange={setMobileItem} />
    </Box>
  );
};

export default MobileSalesShell;
