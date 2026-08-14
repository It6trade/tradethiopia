import React, { useState, useEffect, useRef } from 'react';
import { io } from 'socket.io-client';
import { FaBell, FaBars, FaCheck, FaComments, FaMoon, FaSun } from 'react-icons/fa';
import { useColorMode } from '@chakra-ui/react';
import NotesLauncher from '../../../../components/notes/NotesLauncher';
import ChatLauncher from '../../../../components/chat/ChatLauncher';
import { useUserStore } from '../../../../store/user';
import { useNavigate } from 'react-router-dom';
import { 
  getNotifications, 
  markNotificationAsRead, 
  markAllNotificationsAsRead,
  isSubscribed,
  requestAndSubscribe,
  unsubscribe
} from '../../../../services/notificationService';
import { useSearchStore } from '../../../../store/search';

const Snavbar = ({ onToggleSidebar }) => {
  const navigate = useNavigate();
  const { colorMode, toggleColorMode } = useColorMode();
  const searchQuery = useSearchStore(state => state.searchQuery);
  const setSearchQuery = useSearchStore(state => state.setSearchQuery);
  
  // Custom states for Tailwind dropdowns
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [socket, setSocket] = useState(null);
  const [pushActive, setPushActive] = useState(false);

  // Sync push subscription state
  useEffect(() => {
    let mounted = true;
    (async () => {
      const active = await isSubscribed();
      if (mounted) setPushActive(active);
    })();
    return () => { mounted = false; };
  }, []);

  // References for clicking outside to close
  const notificationRef = useRef(null);
  const profileRef = useRef(null);

  // Helper function to format time ago
  const getTimeAgo = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInSeconds = Math.floor((now - date) / 1000);
    
    if (diffInSeconds < 60) {
      return `${diffInSeconds}s ago`;
    } else if (diffInSeconds < 3600) {
      return `${Math.floor(diffInSeconds / 60)}m ago`;
    } else if (diffInSeconds < 86400) {
      return `${Math.floor(diffInSeconds / 3600)}h ago`;
    } else {
      return `${Math.floor(diffInSeconds / 86400)}d ago`;
    }
  };

  // Get user data from Zustand store
  const currentUser = useUserStore((state) => state.currentUser);
  const clearUser = useUserStore((state) => state.clearUser);

  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);

  // Close dropdowns on clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (notificationRef.current && !notificationRef.current.contains(event.target)) {
        setIsNotificationsOpen(false);
      }
      if (profileRef.current && !profileRef.current.contains(event.target)) {
        setIsProfileOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Establish Socket.IO connection
  useEffect(() => {
    if (!currentUser?._id) return;
    
    const newSocket = io(import.meta.env.VITE_API_URL || 'http://localhost:5000');
    newSocket.emit('registerUser', currentUser._id);
    
    newSocket.on('newNotification', (notification) => {
      const newNotification = {
        id: notification.id,
        message: notification.text,
        read: notification.read,
        time: getTimeAgo(notification.createdAt),
        taskId: notification.taskId,
        targetId: notification.targetId
      };
      
      setNotifications(prev => [newNotification, ...prev]);
      setUnreadCount(prev => prev + 1);
    });
    
    setSocket(newSocket);
    
    // Fetch initial list of notifications on mount
    const fetchInitialNotifications = async () => {
      try {
        const data = await getNotifications();
        const formatted = data.map(item => ({
          id: item._id,
          message: item.text,
          read: item.read,
          time: getTimeAgo(item.createdAt),
          taskId: item.taskId,
          targetId: item.targetId
        }));
        setNotifications(formatted);
        setUnreadCount(formatted.filter(n => !n.read).length);
      } catch (err) {
        console.error('Error fetching notifications:', err);
      }
    };

    fetchInitialNotifications();
    
    return () => {
      newSocket.close();
    };
  }, [currentUser?._id]);

  const markAsRead = async (id) => {
    try {
      await markNotificationAsRead(id);
      setNotifications(notifications.map(n => 
        n.id === id ? { ...n, read: true } : n
      ));
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  const markAllAsRead = async () => {
    try {
      await markAllNotificationsAsRead();
      setNotifications(notifications.map(n => ({ ...n, read: true })));
      setUnreadCount(0);
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
    }
  };

  const handleBellClick = async () => {
    setIsNotificationsOpen(!isNotificationsOpen);
    if (Notification.permission === 'default') {
      try {
        const ok = await requestAndSubscribe();
        setPushActive(ok);
      } catch (err) {
        console.error('[Push] Request on bell click failed:', err);
      }
    }
  };

  const togglePush = async () => {
    try {
      if (pushActive) {
        await unsubscribe();
        setPushActive(false);
      } else {
        const ok = await requestAndSubscribe();
        setPushActive(ok);
      }
    } catch (err) {
      console.error('[Push] Toggle failed:', err);
    }
  };

  const handleLogout = () => {
    clearUser();
    localStorage.removeItem('userToken');
    localStorage.removeItem('userRole');
    localStorage.removeItem('userStatus');
    localStorage.removeItem('userName');
    navigate('/login');
  };

  const handleToggleTheme = () => {
    toggleColorMode();
    if (colorMode === 'light') {
      document.documentElement.classList.add('dark');
      document.body.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
      document.body.classList.remove('dark');
    }
  };

  return (
    <header className="h-16 bg-[#0b1329] border-b border-slate-800 px-6 flex items-center justify-between text-white select-none">
      
      {/* Welcome Title */}
      <div className="flex items-center gap-3">
        <button
          onClick={onToggleSidebar}
          className="md:hidden p-1.5 hover:bg-white/10 rounded-lg transition-all text-white"
          aria-label="Toggle Navigation Sidebar"
        >
          <FaBars className="text-lg" />
        </button>
        <div className="hidden sm:block">
          <p className="text-[10px] text-slate-400 font-semibold tracking-wide">Welcome back,</p>
          <h2 className="text-sm font-black text-white mt-0.5">
            {currentUser?.username || "TradeEthiopia Team"} 👋
          </h2>
        </div>
      </div>

      {/* Middle Search Input pill */}
      <div className="flex-1 max-w-md mx-6 hidden md:block">
        <div className="relative flex items-center bg-[#151f38] border border-slate-700/50 rounded-xl px-3.5 py-1.5">
          <svg className="w-4 h-4 text-slate-400 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input 
            type="text" 
            placeholder="Search anything..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="bg-transparent text-xs w-full focus:outline-none text-slate-200 placeholder-slate-400"
          />
          <span className="text-[10px] font-extrabold text-slate-500 bg-[#0B132B]/60 px-1.5 py-0.5 rounded border border-slate-700/30 flex-shrink-0">
            Ctrl /
          </span>
        </div>
      </div>

      {/* Right controls */}
      <div className="flex items-center gap-4">
        
        {/* Workspace Chat Launcher */}
        <ChatLauncher
          icon={<FaComments className="text-lg text-slate-350 hover:text-white" />}
          ariaLabel="Workspace discussion"
          preferredView="sales"
          iconButtonProps={{
            variant: 'ghost',
            color: 'white',
            size: 'sm',
            _hover: { bg: 'transparent' },
          }}
        />

        {/* Notes Launcher */}
        <NotesLauncher
          buttonProps={{
            variant: 'ghost',
            color: 'white',
            size: 'sm',
            'aria-label': 'Workspace notes',
          }}
          tooltipLabel="Workspace Notes"
        />

        {/* Dark Mode toggle button */}
        <button
          onClick={handleToggleTheme}
          className="p-1.5 hover:bg-white/5 rounded-xl transition-all text-slate-300 hover:text-white"
          title="Toggle Theme Mode"
        >
          {colorMode === 'light' ? <FaMoon className="text-base" /> : <FaSun className="text-base" />}
        </button>

        {/* Notifications Popover */}
        <div className="relative" ref={notificationRef}>
          <button
            onClick={handleBellClick}
            className="p-1.5 hover:bg-white/5 rounded-xl transition-all relative text-slate-300 hover:text-white"
            title="Notifications"
          >
            <FaBell className="text-lg" />
            {unreadCount > 0 && (
              <span className="absolute top-0 right-0 bg-red-500 text-white text-[8px] font-black w-4.5 h-4.5 rounded-full flex items-center justify-center animate-pulse">
                {unreadCount}
              </span>
            )}
          </button>

          {isNotificationsOpen && (
            <div className="absolute right-0 mt-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-2xl rounded-2xl w-80 overflow-hidden z-50 text-slate-700 dark:text-slate-200">
              <div className="flex justify-between items-center px-4 py-3 bg-slate-50 dark:bg-slate-900 border-b border-slate-100 dark:border-slate-800">
                <span className="font-extrabold text-xs text-slate-500 uppercase tracking-wide">Notifications</span>
                {unreadCount > 0 && (
                  <button 
                    onClick={markAllAsRead}
                    className="p-1 text-teal-600 hover:bg-teal-50 dark:text-teal-400 dark:hover:bg-slate-800 rounded-lg text-xs font-bold transition-all flex items-center gap-0.5"
                    title="Mark all as read"
                  >
                    <FaCheck className="text-[10px]" />
                    Read all
                  </button>
                )}
              </div>
              <div className="max-h-72 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800">
                {notifications.length > 0 ? (
                  notifications.map((item) => (
                    <div
                      key={item.id}
                      onClick={() => markAsRead(item.id)}
                      className={`p-3 hover:bg-slate-50 dark:hover:bg-slate-900 cursor-pointer flex items-start gap-2.5 transition-all ${
                        !item.read ? 'bg-teal-50/30 dark:bg-teal-950/10' : ''
                      }`}
                    >
                      <span className={`w-2 h-2 rounded-full mt-1.5 flex-shrink-0 ${
                        !item.read ? 'bg-teal-500' : 'bg-transparent'
                      }`} />
                      <div className="flex-1 min-w-0">
                        <p className="text-xs text-slate-700 dark:text-slate-300 leading-normal line-clamp-2">
                          {item.message}
                        </p>
                        <span className="text-[9px] text-slate-400 block mt-1">
                          {item.time}
                        </span>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="p-6 text-center text-xs text-slate-400">
                    No new notifications.
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Profile Avatar circle with letter "T" */}
        <div className="relative" ref={profileRef}>
          <button
            onClick={() => setIsProfileOpen(!isProfileOpen)}
            className="w-8 h-8 rounded-full bg-teal-500 hover:bg-teal-400 flex items-center justify-center text-sm font-extrabold shadow-md cursor-pointer transition-all uppercase text-white"
          >
            {currentUser?.username?.charAt(0) || "T"}
          </button>

          {isProfileOpen && (
            <div className="absolute right-0 mt-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-2xl rounded-2xl w-64 overflow-hidden z-50 text-slate-700 dark:text-slate-200">
              <div className="p-4 bg-gradient-to-br from-slate-50 to-white dark:from-slate-900 dark:to-slate-800 border-b border-slate-100 dark:border-slate-800 flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-teal-500 flex items-center justify-center text-white text-base font-black uppercase">
                  {currentUser?.username?.charAt(0) || "T"}
                </div>
                <div className="min-w-0">
                  <span className="font-black text-xs block text-slate-800 dark:text-slate-100 truncate">
                    {currentUser?.username || "Username"}
                  </span>
                  <span className="text-[10px] text-slate-400 block truncate">
                    {currentUser?.email || "sales-agent@trade.et"}
                  </span>
                </div>
              </div>

              <div className="p-3 space-y-2">
                <button
                  onClick={() => navigate('/supervisor/account')}
                  className="w-full py-2 bg-slate-50 hover:bg-slate-100 dark:bg-slate-900/50 dark:hover:bg-slate-900 text-xs font-bold rounded-lg border border-slate-100 dark:border-slate-800 transition-all text-center block"
                >
                  My Profile
                </button>
                <button
                  onClick={togglePush}
                  className={`w-full py-2 text-xs font-bold rounded-lg border transition-all text-center block ${
                    pushActive 
                      ? 'bg-teal-50/70 border-teal-200 text-teal-700 hover:bg-teal-100 dark:bg-slate-900/60 dark:border-teal-900/60 dark:text-teal-350'
                      : 'bg-slate-50 hover:bg-slate-100 dark:bg-slate-900/50 dark:hover:bg-slate-900 border-slate-100 dark:border-slate-800 text-slate-700 dark:text-slate-300'
                  }`}
                  title={pushActive ? "Desktop push notifications are enabled. Click to disable them." : "Click to subscribe and receive desktop/system push alerts"}
                >
                  {pushActive ? '🔔 Notifications Active' : '🔕 Setup Desktop Push'}
                </button>
                <div className="p-2.5 bg-red-50 border border-red-200 dark:bg-red-950/20 dark:border-red-900/50 rounded-xl">
                  <div className="flex justify-between items-center gap-2">
                    <span className="text-[10px] font-bold text-red-800 dark:text-red-300">Exit Session</span>
                    <button
                      onClick={handleLogout}
                      className="px-2.5 py-1 bg-red-650 hover:bg-red-700 text-white text-[10px] font-black rounded-lg transition-all shadow-sm"
                    >
                      Logout
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

      </div>

    </header>
  );
};

export default Snavbar;
