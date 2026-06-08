import React, { useState } from 'react';
import { Box, useDisclosure } from '@chakra-ui/react';
import MobileSalesTopBar from '../../components/mobile/navigation/MobileSalesTopBar';
import MobileBottomNav from '../../components/mobile/navigation/MobileBottomNav';
import MobileSalesSidebar from '../../components/mobile/navigation/MobileSalesSidebar';
import MobileFollowups from './MobileFollowups';
import MobileProfile from './MobileProfile';
import MobileSalesHome from './MobileSalesHome';
import MobileSalesPlaceholder from './MobileSalesPlaceholder';
import MobileTasks from './MobileTasks';

const titleByItem = {
  Home: 'Sales',
  Followup: 'Followup',
  'Package Sales': 'Deals',
  Tasks: 'My Tasks',
  Search: 'Search',
  More: 'Profile',
  Meetings: 'Meetings',
  Performance: 'Performance',
  Reports: 'Reports',
  Messages: 'Messages',
  Notifications: 'Notifications',
  Documents: 'Documents',
  Settings: 'Settings',
  Help: 'Help & Support'
};

const MobileSalesShell = ({ activeItem, setActiveItem }) => {
  const sidebarDisclosure = useDisclosure();
  const [mobileItem, setMobileItem] = useState(() => (
    ['Home', 'Followup', 'Package Sales', 'Tasks'].includes(activeItem) ? activeItem : 'Home'
  ));
  const [followupAddSignal, setFollowupAddSignal] = useState(0);
  const [taskAddSignal, setTaskAddSignal] = useState(0);
  const currentItem = mobileItem || 'Home';

  const handleAdd = () => {
    if (currentItem === 'Tasks') {
      setTaskAddSignal((value) => value + 1);
      return;
    }

    setMobileItem('Followup');
    setFollowupAddSignal((value) => value + 1);
  };

  const renderMobileContent = () => {
    switch (currentItem) {
      case 'Home':
        return <MobileSalesHome onNavigate={setMobileItem} onMenu={sidebarDisclosure.onOpen} />;
      case 'Followup':
        return <MobileFollowups openAddSignal={followupAddSignal} />;
      case 'Package Sales':
        return <MobileSalesPlaceholder title="Deals" description="Mobile deal and package sales views will live here." />;
      case 'Tasks':
        return <MobileTasks openAddSignal={taskAddSignal} />;
      case 'Search':
        return <MobileSalesPlaceholder title="Search" description="Mobile global search for contacts, tasks, deals, and resources will live here." />;
      case 'More':
        return <MobileProfile onNavigate={setMobileItem} />;
      case 'Meetings':
      case 'Performance':
      case 'Reports':
      case 'Messages':
      case 'Notifications':
      case 'Documents':
      case 'Settings':
      case 'Help':
        return (
          <MobileSalesPlaceholder
            title={titleByItem[currentItem]}
            description={`${titleByItem[currentItem]} mobile tools will live here.`}
          />
        );
      default:
        return <MobileSalesHome onNavigate={setMobileItem} />;
    }
  };

  return (
    <Box minH="100vh" bg="#FAFBFD" color="#081A34" pb="92px">
      {currentItem !== 'Home' && (
        <Box position="sticky" top={0} zIndex={10}>
          <MobileSalesTopBar
            title={titleByItem[currentItem] || currentItem || 'Sales'}
            onMenu={sidebarDisclosure.onOpen}
            onAdd={handleAdd}
          />
        </Box>
      )}
      <Box px={3} py={currentItem === 'Home' ? 5 : 4}>
        {renderMobileContent()}
      </Box>
      <MobileBottomNav activeItem={currentItem} onChange={setMobileItem} onAdd={handleAdd} />
      <MobileSalesSidebar
        isOpen={sidebarDisclosure.isOpen}
        onClose={sidebarDisclosure.onClose}
        activeItem={currentItem}
        onNavigate={setMobileItem}
      />
    </Box>
  );
};

export default MobileSalesShell;
