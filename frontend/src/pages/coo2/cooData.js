// src/pages/coo2/cooData.js
// Rich operational datasets for 2 COO Executive Dashboard across all departments

export const DEPARTMENTS = [
  { id: 'all', name: 'All Departments', shortName: 'Overview', icon: 'RiDashboardLine', color: '#3b82f6', badge: '10 Depts' },
  { id: 'sales', name: 'Sales', shortName: 'Sales', icon: 'RiMoneyDollarCircleLine', color: '#10b981', badge: 'Active' },
  { id: 'it', name: 'IT & Technology', shortName: 'IT', icon: 'RiCodeBoxLine', color: '#6366f1', badge: '99.9% Up' },
  { id: 'tradex', name: 'Tradex', shortName: 'Tradex TV', icon: 'RiTvLine', color: '#ec4899', badge: 'Live' },
  { id: 'tessbin', name: 'Tessbin', shortName: 'Tessbin', icon: 'RiArchiveLine', color: '#f59e0b', badge: '1.2k Orders' },
  { id: 'hr', name: 'HR', shortName: 'HR', icon: 'RiTeamLine', color: '#8b5cf6', badge: '148 Staff' },
  { id: 'customer_services', name: 'Customer Success', shortName: 'CS', icon: 'RiCustomerService2Line', color: '#06b6d4', badge: '96% CSAT' },
  { id: 'finance', name: 'Finance', shortName: 'Finance', icon: 'RiBankLine', color: '#14b8a6', badge: 'Balanced' },
  { id: 'supervisor', name: 'Supervisor', shortName: 'Supervisor', icon: 'RiShieldCheckLine', color: '#f97316', badge: '98% Audit' },
  { id: 'social_media', name: 'Social Media', shortName: 'Social', icon: 'RiShareLine', color: '#e11d48', badge: '+42% Reach' },
  { id: 'ensira', name: 'Ensira', shortName: 'Ensira', icon: 'RiPlantLine', color: '#84cc16', badge: 'Procuring' }
];

export const DEPARTMENT_KPI_SUMMARY = [
  { department: 'IT & Technology', keyMetric: 'Internal Sites Delivered', target: 12, actual: 25, achievement: 208, status: 'On Track' },
  { department: 'Social Media & Marketing', keyMetric: 'Leads Generated', target: 40, actual: 30, achievement: 75, status: 'At Risk' },
  { department: 'Sales', keyMetric: 'Total Revenue (not reported)', target: 2640000, actual: 544665, achievement: 21, status: 'Behind' },
  { department: 'Services', keyMetric: 'Total Service Conversions', target: 495, actual: 52, achievement: 11, status: 'Behind' },
  { department: 'B2B Package', keyMetric: 'Local/Intl/Broker Deals', target: 27, actual: 2, achievement: 7, status: 'Behind' },
  { department: 'Customer Success', keyMetric: 'Clients Onboarded (no target set)', target: 60, actual: 60, achievement: 100, status: 'On Track' },
  { department: 'Finance', keyMetric: 'Net Weekly Position (ETB)', target: 2640000, actual: 92345, achievement: 3, status: 'Behind' },
  { department: 'HR & Development', keyMetric: 'Total Staff', target: 30, actual: 30, achievement: 100, status: 'On Track' },
  { department: 'Tradex TV', keyMetric: 'Shows Produced', target: 12, actual: 0, achievement: 0, status: 'Behind' },
];

export const IT_KPI_DETAILS = {
  internal: [
    { kpi: 'TRADEETHIOPIAN.COM', target: 3, actual: 15, achievement: 500, status: 'On Track' },
    { kpi: 'TRADETHIOPIA.COM', target: 3, actual: 0, achievement: 0, status: 'Behind' },
    { kpi: 'ENISRA.COM', target: 3, actual: 10, achievement: 333, status: 'On Track' },
    { kpi: 'TRADEX.COM', target: 3, actual: 0, achievement: 0, status: 'Behind' },
    { kpi: 'Trainings', target: 3, actual: 0, achievement: 0, status: 'Behind' },
    { kpi: 'Meetings', target: 3, actual: 3, achievement: 100, status: 'On Track' },
    { kpi: 'Maintenance', target: 3, actual: 3, achievement: 100, status: 'On Track' },
  ],
  external: [
    { kpi: 'Website', target: 3, actual: 0, achievement: 0, status: 'Behind' },
    { kpi: 'Company Profile', target: 1, actual: 0, achievement: 0, status: 'Behind' },
    { kpi: 'Banners', target: 1, actual: 0, achievement: 0, status: 'Behind' },
    { kpi: 'Brochure', target: 1, actual: 0, achievement: 0, status: 'Behind' },
    { kpi: 'Rollup', target: 1, actual: 0, achievement: 0, status: 'Behind' },
    { kpi: 'Flyers', target: 1, actual: 0, achievement: 0, status: 'Behind' },
    { kpi: 'Business Card', target: 1, actual: 0, achievement: 0, status: 'Behind' },
    { kpi: 'Letter Head', target: 1, actual: 0, achievement: 0, status: 'Behind' },
  ],
};

export const SOCIAL_MEDIA_KPI_DETAILS = {
  overall: [
    { kpi: 'Leads Generated', target: 40, actual: 30, achievement: 75, status: 'At Risk' },
    { kpi: 'Content Published', target: 35, actual: 60, achievement: 171, status: 'On Track' },
    { kpi: 'Engagement Rate', target: null, actual: null, achievement: null, status: 'Not Reported' },
    { kpi: 'Ad ROI', target: null, actual: null, achievement: null, status: 'Not Reported' },
    { kpi: 'Website Traffic Growth', target: null, actual: null, achievement: null, status: 'Not Reported' },
  ],
  platforms: [
    { kpi: 'Facebook', target: 7, actual: 10, achievement: 143, status: 'On Track' },
    { kpi: 'Instagram', target: 7, actual: 7, achievement: 100, status: 'On Track' },
    { kpi: 'LinkedIn', target: 5, actual: 8, achievement: 160, status: 'On Track' },
    { kpi: 'TikTok', target: 7, actual: 8, achievement: 114, status: 'On Track' },
    { kpi: 'YouTube', target: 2, actual: 2, achievement: 100, status: 'On Track' },
  ],
};

export const SALES_KPI_DETAILS = {
  measurements: [
    { kpi: 'Total Revenue', target: 2640000, actual: 544665, achievement: null, status: 'Not Reported' },
    { kpi: 'New Clients', target: null, actual: null, achievement: null, status: 'Not Reported' },
    { kpi: 'Conversion Rate', target: null, actual: null, achievement: null, status: 'Not Reported' },
    { kpi: 'Subscriptions Sold', target: null, actual: null, achievement: null, status: 'Not Reported' },
    { kpi: 'Follow-Ups Completed', target: null, actual: null, achievement: null, status: 'Not Reported' },
  ],
  services: [
    { kpi: 'International Import/Export', target: 90, actual: 41, achievement: 46, status: 'Behind' },
    { kpi: 'Stock Market', target: 45, actual: 3, achievement: 7, status: 'Behind' },
    { kpi: 'Coffee Cupping', target: 45, actual: 4, achievement: 9, status: 'Behind' },
    { kpi: 'Digital Marketing', target: 45, actual: 0, achievement: 0, status: 'Behind' },
    { kpi: 'Barista', target: 45, actual: 1, achievement: 2, status: 'Behind' },
    { kpi: 'Sales & Marketing', target: 45, actual: 0, achievement: 0, status: 'Behind' },
    { kpi: 'Documentation', target: 45, actual: 1, achievement: 2, status: 'Behind' },
    { kpi: 'Business Development', target: 45, actual: 0, achievement: 0, status: 'Behind' },
    { kpi: 'International Trade Brokerage', target: 45, actual: 0, achievement: 0, status: 'Behind' },
    { kpi: 'Logistic & Supply Management', target: 45, actual: 2, achievement: 4, status: 'Behind' },
  ],
  products: [
    { kpi: 'Coffee Lab Equipment (full package)', target: 2, actual: 1, achievement: 50, status: 'At Risk' },
    { kpi: 'Other Machines/Electronics', target: null, actual: null, achievement: null, status: 'Not Reported' },
  ],
};

export const CUSTOMER_SUCCESS_KPI_DETAILS = [
  { kpi: 'Clients Onboarded', target: null, actual: 60, note: 'No target set' },
  { kpi: 'Resolution Time', target: null, actual: 68, note: 'No target set; units not specified' },
  { kpi: 'CSAT Score', target: null, actual: 43, note: 'No target set; appears low if /100' },
  { kpi: 'Retention Rate', target: null, actual: 25, note: 'No target set; appears low if %' },
];

export const FINANCE_KPI_DETAILS = [
  { item: 'Weekly Revenue', amount: 544665 },
  { item: 'Weekly Expenses', amount: 452320 },
  { item: 'Net Position', amount: 92345 },
  { item: 'Receivables Collected', amount: null },
  { item: 'Tax Status', amount: 'Not marked' },
];

export const HR_KPI_DETAILS = [
  { kpi: 'Total Staff', value: 30 },
  { kpi: 'New Hires', value: 4 },
  { kpi: 'Resignations', value: 1 },
  { kpi: 'Performance Reviews', value: 'Medium' },
  { kpi: 'Staff Training Conducted', value: 1 },
  { kpi: 'Staff Morale', value: 'Not marked' },
];

export const TRADEX_TV_KPI_DETAILS = [
  { kpi: 'Shows Produced', value: 0 },
  { kpi: 'Sponsors', value: 0 },
  { kpi: 'Total Views', value: 0 },
  { kpi: 'Subscribers Gained', value: 0 },
  { kpi: 'Events & Interviews', value: 0 },
];

export const DEPARTMENT_DATA = {
  all: {
    name: 'Company-Wide Operations',
    kpis: [
      { id: 'rev', title: 'Total Revenue', value: '$128,430', change: '+12.5%', isPositive: true, sparkline: [45, 52, 48, 65, 58, 85, 92], color: '#6366f1', icon: 'FiDollarSign' },
      { id: 'users', title: 'Active Users', value: '24,680', change: '+8.2%', isPositive: true, sparkline: [18, 22, 21, 26, 29, 32, 35], color: '#10b981', icon: 'FiUsers' },
      { id: 'acc', title: 'AI Accuracy', value: '98.6%', change: '+2.1%', isPositive: true, sparkline: [95, 96, 95.5, 97, 98, 98.2, 98.6], color: '#a855f7', icon: 'FiCpu' },
      { id: 'proj', title: 'Active Projects', value: '142', change: '+15.3%', isPositive: true, sparkline: [110, 115, 120, 128, 134, 138, 142], color: '#f97316', icon: 'FiFolder' }
    ],
    chartData: [
      { date: 'May 12', value: 45000, target: 40000, secondary: 2200 },
      { date: 'May 13', value: 72000, target: 55000, secondary: 2800 },
      { date: 'May 14', value: 52000, target: 58000, secondary: 2400 },
      { date: 'May 15', value: 98000, target: 70000, secondary: 3600 },
      { date: 'May 16', value: 142580, target: 90000, secondary: 4800 },
      { date: 'May 17', value: 128430, target: 95000, secondary: 4300 },
      { date: 'May 18', value: 155000, target: 100000, secondary: 5100 }
    ],
    insights: [
      { id: 1, type: 'success', title: 'Revenue is up 12.5%', desc: 'Your revenue this week is higher than last week across Sales and Tessbin channels.', tag: 'Financial' },
      { id: 2, type: 'purple', title: 'User engagement is improving', desc: 'Users are spending 18% more time using the TradeThiopia portal workflows.', tag: 'Workforce' },
      { id: 3, type: 'warning', title: 'Project deadline alert', desc: '3 projects in IT and Ensira are approaching their critical milestones in 48h.', tag: 'Operations' },
      { id: 4, type: 'info', title: 'Operational Efficiency Spike', desc: 'Automated agent resolution speed increased by 32% across Customer Success.', tag: 'AI Agents' }
    ],
    activities: [
      { id: 'a1', user: 'Sarah Johnson', role: 'Data Scientist', avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100', action: 'Updated report', icon: 'FiFileText', project: 'AI Model Training', time: '2 min ago', status: 'Completed', statusColor: 'green' },
      { id: 'a2', user: 'James Carter', role: 'ML Engineer', avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100', action: 'Uploaded dataset', icon: 'FiUploadCloud', project: 'Customer Analysis', time: '15 min ago', status: 'Completed', statusColor: 'green' },
      { id: 'a3', user: 'Olivia Smith', role: 'UX Designer', avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=100', action: 'Created new project', icon: 'FiPlusCircle', project: 'Sales Prediction', time: '1 hour ago', status: 'In Progress', statusColor: 'blue' },
      { id: 'a4', user: 'Daniel Brown', role: 'Product Manager', avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100', action: 'Approved budget', icon: 'FiCheckCircle', project: 'Tessbin Expansion', time: '3 hours ago', status: 'Completed', statusColor: 'green' },
      { id: 'a5', user: 'Amina Zein', role: 'Operations Lead', avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100', action: 'Triggered audit run', icon: 'FiShield', project: 'Supervisor Compliance', time: '5 hours ago', status: 'Pending', statusColor: 'amber' }
    ],
    team: [
      { name: 'Sarah Johnson', role: 'Data Scientist', avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100', progress: 78, color: '#3b82f6' },
      { name: 'James Carter', role: 'ML Engineer', avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100', progress: 62, color: '#3b82f6' },
      { name: 'Olivia Smith', role: 'UX Designer', avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=100', progress: 54, color: '#3b82f6' },
      { name: 'Daniel Brown', role: 'Product Manager', avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100', progress: 81, color: '#3b82f6' },
      { name: 'Kidus Tadesse', role: 'Lead Architect', avatar: 'https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?w=100', progress: 92, color: '#3b82f6' }
    ]
  },
  sales: {
    name: 'Sales Operations',
    kpis: [
      { id: 's1', title: 'Closed Revenue', value: 'ETB 4,850,000', change: '+18.4%', isPositive: true, sparkline: [40, 48, 55, 62, 70, 82, 94], color: '#10b981', icon: 'FiDollarSign' },
      { id: 's2', title: 'Lead Conversion', value: '34.8%', change: '+5.2%', isPositive: true, sparkline: [25, 27, 28, 30, 31, 33, 34.8], color: '#3b82f6', icon: 'FiTrendingUp' },
      { id: 's3', title: 'Active Deals', value: '86 Deals', change: '+12%', isPositive: true, sparkline: [60, 65, 70, 75, 78, 82, 86], color: '#a855f7', icon: 'FiTarget' },
      { id: 's4', title: 'Sales Reps Quota', value: '91.2%', change: '+3.5%', isPositive: true, sparkline: [82, 84, 86, 88, 89, 90, 91.2], color: '#f97316', icon: 'FiAward' }
    ],
    chartData: [
      { date: 'Mon', value: 48000, target: 40000, secondary: 12 },
      { date: 'Tue', value: 65000, target: 50000, secondary: 18 },
      { date: 'Wed', value: 58000, target: 52000, secondary: 14 },
      { date: 'Thu', value: 89000, target: 60000, secondary: 22 },
      { date: 'Fri', value: 112000, target: 80000, secondary: 28 },
      { date: 'Sat', value: 94000, target: 75000, secondary: 19 },
      { date: 'Sun', value: 125000, target: 85000, secondary: 31 }
    ],
    insights: [
      { id: 1, type: 'success', title: 'Enterprise Deals Peak', desc: 'B2B subscription closures grew 24% over this billing cycle.', tag: 'Sales Pipeline' },
      { id: 2, type: 'info', title: 'High Intent Prospects', desc: '28 incoming inbound leads categorized as high-value VIP accounts.', tag: 'Inbound' },
      { id: 3, type: 'warning', title: 'Q3 Regional Target Gap', desc: 'Regional retail tier is 6% below baseline target for Hawassa zone.', tag: 'Attention' }
    ],
    activities: [
      { id: 's_a1', user: 'Yared Bekele', role: 'Senior Account Exec', avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100', action: 'Signed contract', icon: 'FiFileCheck', project: 'Addis B2B Logistics', time: '10 min ago', status: 'Completed', statusColor: 'green' },
      { id: 's_a2', user: 'Bethlehem Alemu', role: 'Sales Lead', avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100', action: 'Sent quotation', icon: 'FiSend', project: 'Midroc Portal Deal', time: '45 min ago', status: 'In Progress', statusColor: 'blue' },
      { id: 's_a3', user: 'Michael Tesfaye', role: 'SDR', avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100', action: 'Booked demo', icon: 'FiCalendar', project: 'Export Aggregator', time: '2 hours ago', status: 'Completed', statusColor: 'green' }
    ],
    team: [
      { name: 'Yared Bekele', role: 'Top Closer', avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100', progress: 94, color: '#10b981' },
      { name: 'Bethlehem Alemu', role: 'Enterprise AE', avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100', progress: 88, color: '#3b82f6' },
      { name: 'Michael Tesfaye', role: 'Inbound Specialist', avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100', progress: 76, color: '#f59e0b' }
    ]
  },
  it: {
    name: 'IT & Infrastructure Operations',
    kpis: [
      { id: 'it1', title: 'System Uptime', value: '99.98%', change: '+0.04%', isPositive: true, sparkline: [99.8, 99.9, 99.92, 99.95, 99.96, 99.97, 99.98], color: '#6366f1', icon: 'FiServer' },
      { id: 'it2', title: 'Avg Response Time', value: '42 ms', change: '-14.2%', isPositive: true, sparkline: [65, 58, 52, 49, 46, 44, 42], color: '#10b981', icon: 'FiZap' },
      { id: 'it3', title: 'Tickets Resolved', value: '184 / 190', change: '+96.8%', isPositive: true, sparkline: [120, 135, 148, 160, 172, 180, 184], color: '#a855f7', icon: 'FiCheckSquare' },
      { id: 'it4', title: 'Security Score', value: 'Grade A+', change: 'Zero Breaches', isPositive: true, sparkline: [95, 96, 98, 99, 99.5, 100, 100], color: '#14b8a6', icon: 'FiShield' }
    ],
    chartData: [
      { date: '00:00', value: 38, target: 50, secondary: 120 },
      { date: '04:00', value: 32, target: 50, secondary: 80 },
      { date: '08:00', value: 68, target: 50, secondary: 340 },
      { date: '12:00', value: 89, target: 50, secondary: 620 },
      { date: '16:00', value: 74, target: 50, secondary: 480 },
      { date: '20:00', value: 52, target: 50, secondary: 260 },
      { date: '23:59', value: 41, target: 50, secondary: 150 }
    ],
    insights: [
      { id: 1, type: 'success', title: 'Database Optimization Complete', desc: 'PostgreSQL indexing reduced query latency by 38% across portal tables.', tag: 'Database' },
      { id: 2, type: 'purple', title: 'Automated CI/CD Pipeline', desc: 'Vite build and backend microservices deployed with zero downtime.', tag: 'DevOps' }
    ],
    activities: [
      { id: 'it_a1', user: 'Samuel Desta', role: 'DevOps Engineer', avatar: 'https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?w=100', action: 'Deployed release v2.4', icon: 'FiGitCommit', project: 'Core Cloud API', time: '18 min ago', status: 'Completed', statusColor: 'green' },
      { id: 'it_a2', user: 'Hanna Mengistu', role: 'Security Lead', avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100', action: 'Ran SSL & vulnerability audit', icon: 'FiShield', project: 'Auth Services', time: '1 hour ago', status: 'Completed', statusColor: 'green' }
    ],
    team: [
      { name: 'Samuel Desta', role: 'DevOps Lead', avatar: 'https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?w=100', progress: 95, color: '#6366f1' },
      { name: 'Hanna Mengistu', role: 'Cybersecurity', avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100', progress: 89, color: '#10b981' }
    ]
  },
  tradex: {
    name: 'Tradex TV & Media Operations',
    kpis: [
      { id: 'tx1', title: 'Monthly Viewers', value: '412,000', change: '+22.4%', isPositive: true, sparkline: [280, 310, 340, 365, 380, 395, 412], color: '#ec4899', icon: 'FiTv' },
      { id: 'tx2', title: 'Broadcast Hours', value: '186 hrs', change: '+15 hrs', isPositive: true, sparkline: [140, 150, 158, 168, 174, 180, 186], color: '#3b82f6', icon: 'FiVideo' },
      { id: 'tx3', title: 'Sponsorship Rev', value: 'ETB 1,420,000', change: '+18.6%', isPositive: true, sparkline: [90, 98, 105, 118, 125, 134, 142], color: '#10b981', icon: 'FiDollarSign' },
      { id: 'tx4', title: 'Studio Utilization', value: '88.5%', change: '+4.2%', isPositive: true, sparkline: [75, 78, 80, 82, 85, 87, 88.5], color: '#f59e0b', icon: 'FiRadio' }
    ],
    chartData: [
      { date: 'Week 1', value: 85000, target: 70000, secondary: 40 },
      { date: 'Week 2', value: 98000, target: 75000, secondary: 48 },
      { date: 'Week 3', value: 112000, target: 80000, secondary: 52 },
      { date: 'Week 4', value: 142000, target: 90000, secondary: 65 }
    ],
    insights: [
      { id: 1, type: 'purple', title: 'Business Summit Special Aired', desc: 'Live broadcast garnered 64,000 concurrent streaming audience.', tag: 'Broadcast' }
    ],
    activities: [
      { id: 'tx_a1', user: 'Elias Kebede', role: 'Production Director', avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100', action: 'Finished studio segment', icon: 'FiFilm', project: 'AgriTech Spotlight', time: '35 min ago', status: 'Completed', statusColor: 'green' }
    ],
    team: [
      { name: 'Elias Kebede', role: 'Lead Director', avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100', progress: 87, color: '#ec4899' }
    ]
  },
  tessbin: {
    name: 'Tessbin Commerce & Logistics',
    kpis: [
      { id: 'tb1', title: 'Dispatched Orders', value: '1,428 Orders', change: '+19.2%', isPositive: true, sparkline: [950, 1040, 1120, 1230, 1310, 1380, 1428], color: '#f59e0b', icon: 'FiBox' },
      { id: 'tb2', title: 'Fulfillment Rate', value: '98.4%', change: '+1.1%', isPositive: true, sparkline: [95, 96, 96.8, 97.2, 97.8, 98.1, 98.4], color: '#10b981', icon: 'FiCheckCircle' },
      { id: 'tb3', title: 'Inventory Turn', value: '4.8x / mo', change: '+0.6x', isPositive: true, sparkline: [3.8, 4.0, 4.1, 4.3, 4.5, 4.7, 4.8], color: '#6366f1', icon: 'FiRefreshCw' },
      { id: 'tb4', title: 'Warehouse Capacity', value: '76% Used', change: 'Optimal', isPositive: true, sparkline: [68, 70, 72, 74, 75, 75, 76], color: '#06b6d4', icon: 'FiTruck' }
    ],
    chartData: [
      { date: 'May 12', value: 180, target: 150, secondary: 99 },
      { date: 'May 13', value: 210, target: 160, secondary: 98 },
      { date: 'May 14', value: 195, target: 165, secondary: 97 },
      { date: 'May 15', value: 245, target: 180, secondary: 99 },
      { date: 'May 16', value: 290, target: 200, secondary: 98.5 },
      { date: 'May 17', value: 310, target: 210, secondary: 99 },
      { date: 'May 18', value: 340, target: 220, secondary: 98.4 }
    ],
    insights: [
      { id: 1, type: 'success', title: 'Fast-Track Logistics Route', desc: 'Modjo dry-port dispatch times trimmed down to 1.8 days on average.', tag: 'Supply Chain' }
    ],
    activities: [
      { id: 'tb_a1', user: 'Dawit Solomon', role: 'Logistics Manager', avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100', action: 'Cleared bulk shipment', icon: 'FiTruck', project: 'Kality Central Depot', time: '25 min ago', status: 'Completed', statusColor: 'green' }
    ],
    team: [
      { name: 'Dawit Solomon', role: 'Logistics Head', avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100', progress: 91, color: '#f59e0b' }
    ]
  },
  hr: {
    name: 'Human Resources & Talent',
    kpis: [
      { id: 'hr1', title: 'Total Headcount', value: '148 Staff', change: '+6 Hires', isPositive: true, sparkline: [130, 134, 138, 140, 142, 145, 148], color: '#8b5cf6', icon: 'FiUsers' },
      { id: 'hr2', title: 'Retention Rate', value: '96.2%', change: '+1.8%', isPositive: true, sparkline: [92, 93, 94, 94.8, 95.5, 95.9, 96.2], color: '#10b981', icon: 'FiHeart' },
      { id: 'hr3', title: 'Training Pass Rate', value: '94.5%', change: '+3.2%', isPositive: true, sparkline: [88, 89, 91, 92, 93, 94, 94.5], color: '#3b82f6', icon: 'FiBookOpen' },
      { id: 'hr4', title: 'Open Requisitions', value: '8 Positions', change: '4 Finalist', isPositive: true, sparkline: [12, 11, 10, 9, 8, 8, 8], color: '#f97316', icon: 'FiUserPlus' }
    ],
    chartData: [
      { date: 'Jan', value: 130, target: 125, secondary: 92 },
      { date: 'Feb', value: 135, target: 130, secondary: 94 },
      { date: 'Mar', value: 140, target: 135, secondary: 95 },
      { date: 'Apr', value: 144, target: 140, secondary: 96 },
      { date: 'May', value: 148, target: 145, secondary: 96.2 }
    ],
    insights: [
      { id: 1, type: 'purple', title: 'Q2 Performance Cycle Initiated', desc: '142 of 148 self-assessments completed on the new portal module.', tag: 'Appraisals' }
    ],
    activities: [
      { id: 'hr_a1', user: 'Selamawit Girma', role: 'HR Business Partner', avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100', action: 'Completed onboarding', icon: 'FiUserCheck', project: 'Engineering Intake', time: '40 min ago', status: 'Completed', statusColor: 'green' }
    ],
    team: [
      { name: 'Selamawit Girma', role: 'HR Lead', avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100', progress: 84, color: '#8b5cf6' }
    ]
  },
  customer_services: {
    name: 'Customer Success & Support',
    kpis: [
      { id: 'cs1', title: 'CSAT Rating', value: '96.4%', change: '+2.3%', isPositive: true, sparkline: [91, 92, 93.5, 94.8, 95.2, 95.9, 96.4], color: '#06b6d4', icon: 'FiSmile' },
      { id: 'cs2', title: 'First Response Time', value: '4.2 min', change: '-1.8 min', isPositive: true, sparkline: [8.5, 7.2, 6.4, 5.8, 5.0, 4.6, 4.2], color: '#10b981', icon: 'FiClock' },
      { id: 'cs3', title: 'Total Inquiries', value: '3,840', change: '+12%', isPositive: true, sparkline: [2600, 2850, 3100, 3350, 3550, 3700, 3840], color: '#6366f1', icon: 'FiMessageSquare' },
      { id: 'cs4', title: 'Resolution Rate', value: '98.1%', change: '+0.8%', isPositive: true, sparkline: [95, 96, 96.5, 97, 97.5, 97.9, 98.1], color: '#f59e0b', icon: 'FiCheck' }
    ],
    chartData: [
      { date: 'Mon', value: 420, target: 400, secondary: 96 },
      { date: 'Tue', value: 510, target: 450, secondary: 97 },
      { date: 'Wed', value: 490, target: 450, secondary: 96.5 },
      { date: 'Thu', value: 620, target: 500, secondary: 98 },
      { date: 'Fri', value: 710, target: 550, secondary: 98.4 },
      { date: 'Sat', value: 580, target: 450, secondary: 97.8 },
      { date: 'Sun', value: 510, target: 400, secondary: 96.4 }
    ],
    insights: [
      { id: 1, type: 'success', title: 'Omnichannel Chat SLA', desc: '98.7% of tickets resolved under the 15-minute SLA benchmark.', tag: 'Quality' }
    ],
    activities: [
      { id: 'cs_a1', user: 'Abel Teshome', role: 'Support Specialist', avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100', action: 'Resolved VIP dispute', icon: 'FiCheckCircle', project: 'B2B Trade Escalation', time: '12 min ago', status: 'Completed', statusColor: 'green' }
    ],
    team: [
      { name: 'Abel Teshome', role: 'CS Manager', avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100', progress: 92, color: '#06b6d4' }
    ]
  },
  finance: {
    name: 'Finance & Accounts',
    kpis: [
      { id: 'fn1', title: 'Cash Inflow', value: 'ETB 14,250,000', change: '+14.8%', isPositive: true, sparkline: [9.2, 10.1, 11.4, 12.0, 12.8, 13.5, 14.25], color: '#14b8a6', icon: 'FiDollarSign' },
      { id: 'fn2', title: 'Operating Margin', value: '28.4%', change: '+3.1%', isPositive: true, sparkline: [22, 23.5, 24.8, 26, 27.2, 27.9, 28.4], color: '#10b981', icon: 'FiPieChart' },
      { id: 'fn3', title: 'Receivables Cleared', value: '92.6%', change: '+5.4%', isPositive: true, sparkline: [80, 83, 85, 87, 89, 91, 92.6], color: '#3b82f6', icon: 'FiCheckCircle' },
      { id: 'fn4', title: 'VAT & Tax Compliance', value: '100% On Time', change: 'Filed', isPositive: true, sparkline: [100, 100, 100, 100, 100, 100, 100], color: '#8b5cf6', icon: 'FiShield' }
    ],
    chartData: [
      { date: 'Jan', value: 8500000, target: 8000000, secondary: 22 },
      { date: 'Feb', value: 9800000, target: 8500000, secondary: 24 },
      { date: 'Mar', value: 11200000, target: 9500000, secondary: 26 },
      { date: 'Apr', value: 12800000, target: 10500000, secondary: 27 },
      { date: 'May', value: 14250000, target: 12000000, secondary: 28.4 }
    ],
    insights: [
      { id: 1, type: 'success', title: 'Automated VAT Reconciliation', desc: 'Electronic invoicing synchronized with Ethiopian Tax Authority APIs.', tag: 'Accounting' }
    ],
    activities: [
      { id: 'fn_a1', user: 'Genet Haile', role: 'Chief Accountant', avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100', action: 'Approved payroll release', icon: 'FiCreditCard', project: 'May Payroll Batch', time: '1 hour ago', status: 'Completed', statusColor: 'green' }
    ],
    team: [
      { name: 'Genet Haile', role: 'Finance Director', avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100', progress: 96, color: '#14b8a6' }
    ]
  },
  supervisor: {
    name: 'Operational Supervision & Audits',
    kpis: [
      { id: 'sp1', title: 'Audit Compliance', value: '98.2%', change: '+1.4%', isPositive: true, sparkline: [94, 95, 95.8, 96.5, 97.2, 97.8, 98.2], color: '#f97316', icon: 'FiCheckCircle' },
      { id: 'sp2', title: 'Floor Shifts Monitored', value: '64 Shifts', change: '100% On Time', isPositive: true, sparkline: [50, 54, 58, 60, 62, 63, 64], color: '#10b981', icon: 'FiEye' },
      { id: 'sp3', title: 'Issue Resolutions', value: '48 / 49', change: '+98%', isPositive: true, sparkline: [35, 38, 40, 43, 45, 47, 48], color: '#3b82f6', icon: 'FiAlertTriangle' },
      { id: 'sp4', title: 'SOP Adherence Score', value: '99.1%', change: '+0.5%', isPositive: true, sparkline: [97, 97.5, 98, 98.4, 98.7, 99, 99.1], color: '#a855f7', icon: 'FiShield' }
    ],
    chartData: [
      { date: 'Mon', value: 97, target: 95, secondary: 12 },
      { date: 'Tue', value: 98, target: 95, secondary: 8 },
      { date: 'Wed', value: 98.5, target: 95, secondary: 6 },
      { date: 'Thu', value: 99, target: 95, secondary: 4 },
      { date: 'Fri', value: 98.2, target: 95, secondary: 9 }
    ],
    insights: [
      { id: 1, type: 'success', title: 'Zero Critical Safety Breaches', desc: 'Full compliance across all warehouse and operational hubs recorded.', tag: 'Safety' }
    ],
    activities: [
      { id: 'sp_a1', user: 'Tewodros Kassahun', role: 'Head Supervisor', avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100', action: 'Completed floor inspection', icon: 'FiCheckSquare', project: 'Warehouse Hub B', time: '50 min ago', status: 'Completed', statusColor: 'green' }
    ],
    team: [
      { name: 'Tewodros Kassahun', role: 'Operations Supervisor', avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100', progress: 88, color: '#f97316' }
    ]
  },
  social_media: {
    name: 'Social Media & Brand Growth',
    kpis: [
      { id: 'sm1', title: 'Total Reach', value: '1.24M', change: '+42.5%', isPositive: true, sparkline: [650, 720, 840, 950, 1050, 1140, 1240], color: '#e11d48', icon: 'FiShare2' },
      { id: 'sm2', title: 'Engagement Rate', value: '8.4%', change: '+2.1%', isPositive: true, sparkline: [4.8, 5.2, 5.9, 6.8, 7.4, 8.0, 8.4], color: '#10b981', icon: 'FiHeart' },
      { id: 'sm3', title: 'Campaign Clicks', value: '84,200', change: '+28%', isPositive: true, sparkline: [45, 52, 58, 64, 72, 78, 84.2], color: '#3b82f6', icon: 'FiMousePointer' },
      { id: 'sm4', title: 'Content Published', value: '46 Posts', change: '100% Target', isPositive: true, sparkline: [30, 34, 38, 40, 42, 44, 46], color: '#f59e0b', icon: 'FiGrid' }
    ],
    chartData: [
      { date: 'May 12', value: 140000, target: 100000, secondary: 8.1 },
      { date: 'May 13', value: 185000, target: 120000, secondary: 8.5 },
      { date: 'May 14', value: 160000, target: 125000, secondary: 8.2 },
      { date: 'May 15', value: 240000, target: 140000, secondary: 9.1 },
      { date: 'May 16', value: 310000, target: 160000, secondary: 9.4 },
      { date: 'May 17', value: 280000, target: 150000, secondary: 8.8 },
      { date: 'May 18', value: 350000, target: 180000, secondary: 9.8 }
    ],
    insights: [
      { id: 1, type: 'purple', title: 'TikTok & LinkedIn Viral Post', desc: 'Ethiopian export innovation video reached 380k impressions organically.', tag: 'Viral Growth' }
    ],
    activities: [
      { id: 'sm_a1', user: 'Lidia Worku', role: 'Social Media Manager', avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=100', action: 'Launched ad campaign', icon: 'FiPlay', project: 'Trade Expo Promo', time: '15 min ago', status: 'Completed', statusColor: 'green' }
    ],
    team: [
      { name: 'Lidia Worku', role: 'Brand & Social Lead', avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=100', progress: 93, color: '#e11d48' }
    ]
  },
  ensira: {
    name: 'Ensira Agribusiness Operations',
    kpis: [
      { id: 'en1', title: 'Procured Volume', value: '4,650 Qtl', change: '+31.2%', isPositive: true, sparkline: [2800, 3100, 3500, 3900, 4200, 4450, 4650], color: '#84cc16', icon: 'FiShoppingBag' },
      { id: 'en2', title: 'Farmer Cooperatives', value: '38 Active', change: '+4 Co-ops', isPositive: true, sparkline: [26, 28, 30, 32, 34, 36, 38], color: '#10b981', icon: 'FiUsers' },
      { id: 'en3', title: 'Quality Rating', value: 'Grade 1 (97%)', change: 'Premium', isPositive: true, sparkline: [92, 93, 94.5, 95, 96, 96.5, 97], color: '#3b82f6', icon: 'FiAward' },
      { id: 'en4', title: 'Distribution Rate', value: '95.8%', change: '+3.5%', isPositive: true, sparkline: [88, 90, 91.5, 93, 94, 95, 95.8], color: '#f59e0b', icon: 'FiTruck' }
    ],
    chartData: [
      { date: 'Week 1', value: 850, target: 700, secondary: 94 },
      { date: 'Week 2', value: 1100, target: 800, secondary: 95.5 },
      { date: 'Week 3', value: 1350, target: 950, secondary: 96.8 },
      { date: 'Week 4', value: 1350, target: 1000, secondary: 97 }
    ],
    insights: [
      { id: 1, type: 'success', title: 'Coffee & Grain Pipeline Strong', desc: 'Direct sourcing contract secured with Sidama and Jimma regional unions.', tag: 'Procurement' }
    ],
    activities: [
      { id: 'en_a1', user: 'Tariku Feyisa', role: 'Agri Supply Director', avatar: 'https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?w=100', action: 'Approved co-op disbursement', icon: 'FiCheckCircle', project: 'Jimma Coffee Aggregation', time: '1 hour ago', status: 'Completed', statusColor: 'green' }
    ],
    team: [
      { name: 'Tariku Feyisa', role: 'Agribusiness Head', avatar: 'https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?w=100', progress: 89, color: '#84cc16' }
    ]
  }
};

export const AI_AGENTS_DATA = [
  {
    id: 'agent-sales',
    name: 'Sales Pipeline Co-pilot',
    department: 'Sales',
    status: 'Running',
    statusColor: 'green',
    accuracy: '99.4%',
    handledToday: '428 Leads',
    lastRun: '1 min ago',
    description: 'Auto-scores incoming B2B leads, generates personalized quotation proposals, and updates deal stage.'
  },
  {
    id: 'agent-tessbin',
    name: 'Tessbin Fulfillment Watchdog',
    department: 'Tessbin',
    status: 'Running',
    statusColor: 'green',
    accuracy: '98.8%',
    handledToday: '1,120 Orders',
    lastRun: '3 min ago',
    description: 'Monitors warehouse stock thresholds, predicts logistics transit times, and dispatches courier alerts.'
  },
  {
    id: 'agent-finance',
    name: 'Finance Reconciliation Agent',
    department: 'Finance',
    status: 'Running',
    statusColor: 'green',
    accuracy: '99.9%',
    handledToday: '284 Invoices',
    lastRun: '12 min ago',
    description: 'Performs 3-way matching of purchase orders, deliveries, and payment receipts against bank feeds.'
  },
  {
    id: 'agent-cs',
    name: 'CS Auto-Triage & Sentiment Bot',
    department: 'Customer Services',
    status: 'Running',
    statusColor: 'green',
    accuracy: '97.6%',
    handledToday: '890 Inquiries',
    lastRun: 'Just now',
    description: 'Analyzes user ticket sentiment, prioritizes urgent escalations, and drafts instant verified answers.'
  },
  {
    id: 'agent-it',
    name: 'IT Infrastructure Sentry',
    department: 'IT',
    status: 'Running',
    statusColor: 'green',
    accuracy: '100%',
    handledToday: '184k Requests',
    lastRun: 'Continuous',
    description: 'Real-time telemetry monitor for microservices, database slow queries, and cybersecurity penetration detection.'
  },
  {
    id: 'agent-hr',
    name: 'HR Talent & Onboarding Agent',
    department: 'HR',
    status: 'Idle',
    statusColor: 'blue',
    accuracy: '96.2%',
    handledToday: '14 Reviews',
    lastRun: '1 hour ago',
    description: 'Parses candidate CVs, synchronizes background checks, and manages candidate evaluation scorecards.'
  }
];

export const NOTIFICATIONS_DATA = [
  {
    id: 'notif-1',
    title: 'High-Value Enterprise Deal Signed',
    desc: 'Sales closed ETB 1.8M annual subscription with Addis Logistics Group.',
    time: '5 min ago',
    unread: true,
    department: 'Sales',
    type: 'success',
    actionRequired: false
  },
  {
    id: 'notif-2',
    title: 'Warehouse Low Stock Warning',
    desc: 'Tessbin Central Depot has reached 88% capacity for Category A electronics.',
    time: '18 min ago',
    unread: true,
    department: 'Tessbin',
    type: 'warning',
    actionRequired: true,
    actionText: 'Review Inventory'
  },
  {
    id: 'notif-3',
    title: 'Monthly VAT Declaration Ready',
    desc: 'Finance generated the ERCA tax reconciliation for May 2024.',
    time: '1 hour ago',
    unread: true,
    department: 'Finance',
    type: 'info',
    actionRequired: true,
    actionText: 'Authorize Submission'
  },
  {
    id: 'notif-4',
    title: 'Zero Latency Spikes in 48 Hours',
    desc: 'IT Infrastructure reports 99.98% uptime across all API endpoints.',
    time: '3 hours ago',
    unread: false,
    department: 'IT',
    type: 'success',
    actionRequired: false
  },
  {
    id: 'notif-5',
    title: 'Ensira Regional Union Agreement',
    desc: 'Contract finalized for 1,200 metric tons of export-grade coffee beans.',
    time: '5 hours ago',
    unread: false,
    department: 'Ensira',
    type: 'success',
    actionRequired: false
  }
];

export const REPORTS_DATA = [
  {
    id: 'rep-1',
    title: 'Executive Operational Summary - May 2024',
    department: 'All Departments',
    frequency: 'Monthly',
    generatedDate: 'May 18, 2024',
    author: '2 COO System',
    status: 'Ready',
    size: '2.4 MB'
  },
  {
    id: 'rep-2',
    title: 'Sales & Revenue Performance Scorecard',
    department: 'Sales',
    frequency: 'Weekly',
    generatedDate: 'May 17, 2024',
    author: 'Sales Manager AI',
    status: 'Ready',
    size: '1.8 MB'
  },
  {
    id: 'rep-3',
    title: 'Tessbin Supply Chain & Fulfillment Audit',
    department: 'Tessbin',
    frequency: 'Bi-Weekly',
    generatedDate: 'May 16, 2024',
    author: 'Logistics Team',
    status: 'Ready',
    size: '3.1 MB'
  },
  {
    id: 'rep-4',
    title: 'IT Infrastructure & Security Compliance Report',
    department: 'IT',
    frequency: 'Monthly',
    generatedDate: 'May 15, 2024',
    author: 'DevOps & SecOps',
    status: 'Ready',
    size: '1.2 MB'
  },
  {
    id: 'rep-5',
    title: 'Ensira Agribusiness Yield & Farmer Co-op Audit',
    department: 'Ensira',
    frequency: 'Monthly',
    generatedDate: 'May 14, 2024',
    author: 'Agri Operations',
    status: 'Ready',
    size: '2.7 MB'
  }
];
