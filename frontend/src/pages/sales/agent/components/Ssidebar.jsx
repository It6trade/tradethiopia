import React, { useState, useEffect } from 'react';
import {
  FaHome,
  FaChartLine,
  FaArrowLeft,
  FaArrowRight,
  FaVideo,
  FaMoneyBillWave,
  FaShoppingCart,
  FaClipboardList,
  FaRegCalendarAlt,
} from 'react-icons/fa';
import { FiCheckCircle, FiMessageSquare } from 'react-icons/fi';
import { getNotifications } from '../../../../services/notificationService';

const sidebarItems = [
  { label: 'Home', icon: FaHome },
  { label: 'Followup', icon: FaMoneyBillWave },
  { label: 'Orders', icon: FaShoppingCart },
  { label: 'Tutorials', icon: FaVideo },
  { label: 'Tasks', icon: FiCheckCircle },
  { label: 'Content Tracker', icon: FaRegCalendarAlt },
  { label: 'Monthly Report', icon: FaChartLine },
  { label: 'Notice Board', icon: FiMessageSquare },
  { label: 'Requests', icon: FaClipboardList },
];

const SSidebar = ({ isCollapsed, toggleCollapse, activeItem, setActiveItem }) => {
  const [unreadCount, setUnreadCount] = useState(0);

  // Fetch notifications to count unread messages
  const fetchUnreadCount = async () => {
    try {
      const data = await getNotifications();
      const broadcastMessages = data.filter(msg => msg.type === 'general');
      const unread = broadcastMessages.filter(msg => !msg.read).length;
      setUnreadCount(unread);
    } catch (err) {
      console.error('Error fetching notification count:', err);
    }
  };

  useEffect(() => {
    fetchUnreadCount();
    const interval = setInterval(fetchUnreadCount, 30000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="flex flex-col h-full bg-[#0b1329] text-slate-200 border-r border-slate-800 transition-all duration-300 select-none">
      
      {/* Sidebar Logo Header */}
      <div className="flex items-center gap-2.5 px-5 py-4 mt-1 flex-shrink-0">
        <div className="flex items-center justify-center w-8 h-8 rounded-xl bg-teal-500/10 text-teal-400">
          <svg className="w-5 h-5 text-teal-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <path strokeLinecap="round" strokeLinejoin="round" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
          </svg>
        </div>
        {!isCollapsed && (
          <div className="leading-tight">
            <span className="font-black text-sm text-white tracking-wide block">
              TradeEthiopia
            </span>
            <span className="text-[10px] text-teal-400 font-extrabold uppercase tracking-widest block">
              Portal
            </span>
          </div>
        )}
      </div>

      {/* Section label */}
      {!isCollapsed && (
        <div className="px-5 mt-4 mb-2 flex-shrink-0">
          <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">
            Workspace
          </span>
        </div>
      )}

      {/* Navigation Items */}
      <nav className="flex-1 px-3 space-y-1 overflow-y-auto mt-2">
        {sidebarItems.map((item) => {
          const isActive = activeItem === item.label;
          const showBadge = item.label === 'Notice Board' && unreadCount > 0;
          
          return (
            <button
              key={item.label}
              onClick={() => {
                setActiveItem(item.label);
                if (item.label === 'Notice Board') {
                  fetchUnreadCount();
                }
              }}
              className={`w-full flex items-center p-2.5 rounded-xl transition-all duration-200 group relative ${
                isActive 
                  ? 'bg-teal-605 text-white shadow-md shadow-teal-600/10' 
                  : 'hover:bg-slate-800/60 text-slate-400 hover:text-slate-200'
              } ${isCollapsed ? 'justify-center' : 'justify-start gap-3.5'}`}
              title={isCollapsed ? item.label : undefined}
            >
              <item.icon className="text-base flex-shrink-0" />
              {!isCollapsed && (
                <>
                  <span className="text-xs font-bold tracking-wide">{item.label}</span>
                  {showBadge && (
                    <span className="absolute right-3 top-3 bg-red-500 text-white text-[8px] font-black rounded-full h-4 min-w-4 px-1 flex items-center justify-center">
                      {unreadCount}
                    </span>
                  )}
                </>
              )}
            </button>
          );
        })}
      </nav>

      {/* Quick Tip card at bottom */}
      {!isCollapsed && (
        <div className="p-4 m-3.5 bg-slate-800/40 border border-slate-700/30 rounded-2xl space-y-2 flex-shrink-0">
          <div className="flex items-center gap-1.5 text-[10px] font-extrabold text-teal-400 uppercase tracking-wider">
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
            </svg>
            <span>Quick Tip</span>
          </div>
          <p className="text-[10px] text-slate-450 leading-relaxed">
            Use filters & exports to get real-time insights and stay on top of follow-ups.
          </p>
          {/* Mini graphic bar chart */}
          <div className="flex items-end gap-1.5 pt-2 h-7">
            <div className="w-1.5 bg-slate-700 h-1/3 rounded-sm"></div>
            <div className="w-1.5 bg-slate-700 h-2/3 rounded-sm"></div>
            <div className="w-1.5 bg-teal-500/30 h-1/2 rounded-sm"></div>
            <div className="w-1.5 bg-teal-500 h-full rounded-sm animate-pulse"></div>
            <div className="w-1.5 bg-slate-700 h-3/4 rounded-sm"></div>
          </div>
        </div>
      )}
      
    </div>
  );
};

export default SSidebar;
