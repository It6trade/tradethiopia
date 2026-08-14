import React, { useEffect, useState } from 'react';
import { Bar } from 'react-chartjs-2';
import { MdPeople, MdCheckCircle, MdPendingActions, MdNote } from 'react-icons/md';
import { 
  FiCheckCircle, 
  FiCheck, 
  FiClock, 
  FiSmartphone, 
  FiActivity, 
  FiPhoneCall, 
  FiTrendingUp, 
  FiBookmark,
  FiX
} from 'react-icons/fi';
import axiosInstance from '../../../../services/axiosInstance';
import { getMyTasks, getTaskStats } from '../../../../services/taskService';
import { Chart, registerables } from 'chart.js';

// Register Chart.js components
Chart.register(...registerables);

const formatNumber = (value) => {
  const number = Number(value) || 0;
  return number.toLocaleString(undefined, { maximumFractionDigits: 0 });
};

const formatCurrency = (value) => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'ETB',
    minimumFractionDigits: 0
  }).format(Number(value) || 0);
};

const Dashboard = () => {
  // Dashboard states
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [followupMetrics, setFollowupMetrics] = useState({
    total: 0,
    completed: 0,
    pending: 0,
    overdue: 0
  });
  const [deliveredOrders, setDeliveredOrders] = useState(0);
  const [totalCommission, setTotalCommission] = useState(0);
  const [notes, setNotes] = useState([]);
  const [selectedNote, setSelectedNote] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [tasks, setTasks] = useState([]);
  const [taskStats, setTaskStats] = useState({
    totalTasks: 0,
    completedTasks: 0,
    pendingTasks: 0,
    overdueTasks: 0
  });

  // Mobile Sync states
  const [isMobileSynced, setIsMobileSynced] = useState(true);
  const [syncDeviceName, setSyncDeviceName] = useState("Galaxy S23 Ultra (TE-Agent-Mobile-102)");
  const [pendingDialLeads, setPendingDialLeads] = useState([]);
  const [dialingLeadId, setDialingLeadId] = useState(null);

  // Custom Toast State
  const [toasts, setToasts] = useState([]);

  // Weekly target parameters (Progress Gauge)
  const targetCompletedDeals = 12; // weekly goal
  const targetCommissionGoal = 8000; // weekly goal in ETB

  // Dynamic QR Code link points to mobile companion route
  const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(
    window.location.origin + "/sales?companion=paired"
  )}&color=0D9488&bgcolor=FFFFFF`;

  // Custom Toast Helper
  const showToast = (title, description, status = "info") => {
    const id = Date.now();
    setToasts(prev => [...prev, { id, title, description, status }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 4000);
  };

  // Fetch initial dashboard records
  const fetchData = async () => {
    try {
      setLoading(true);
      const [followupStatsRes, tasksRes, taskStatsRes, ordersStatsRes, completedCustomersRes, notesRes] = await Promise.all([
        axiosInstance.get('/followups/stats'),
        getMyTasks(),
        getTaskStats(),
        axiosInstance.get('/orders/stats'),
        axiosInstance.get('/sales-customers', { params: { followupStatus: 'Completed' } }),
        axiosInstance.get('/notes')
      ]);

      const followupStats = followupStatsRes.data || {};
      const orderStats = ordersStatsRes.data || {};
      const notesData = notesRes.data || [];

      setFollowupMetrics({
        total: followupStats.total || 0,
        completed: followupStats.completed || 0,
        pending: followupStats.pending || 0,
        overdue: followupStats.overdue || 0,
      });

      setDeliveredOrders(orderStats.deliveredOrders || 0);
      setNotes(notesData);

      const completedCustomers = Array.isArray(completedCustomersRes.data) ? completedCustomersRes.data : [];
      const commissionSum = completedCustomers.reduce((sum, customer) => {
        const netCommission = Number(customer?.commission?.netCommission ?? 0);
        return sum + (Number.isFinite(netCommission) ? netCommission : 0);
      }, 0);
      setTotalCommission(commissionSum);

      // Populate companion dial list with pending leads
      const allCustomersRes = await axiosInstance.get('/sales-customers');
      const allCustomers = Array.isArray(allCustomersRes.data) ? allCustomersRes.data : [];
      const pendingLeads = allCustomers.filter(c => c.followupStatus === 'Pending').slice(0, 4);
      setPendingDialLeads(pendingLeads);

      setTasks(tasksRes);
      setTaskStats(taskStatsRes);
      setError(null);
    } catch (err) {
      console.error('Error fetching dashboard metrics:', err);
      setError('Failed to refresh sales dashboard data.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const openNote = async (noteId) => {
    try {
      const response = await axiosInstance.get(`/notes/${noteId}`);
      setSelectedNote(response.data);
      setIsModalOpen(true);
    } catch (err) {
      console.error('Error opening note details:', err);
    }
  };

  // Simulate dialing callback via mobile app pairing
  const handleDialToMobile = (lead) => {
    setDialingLeadId(lead._id);
    showToast(
      "Sync Dial Pushed", 
      `Sending call request for ${lead.customerName} (${lead.phone}) to paired device...`, 
      "info"
    );

    setTimeout(() => {
      setDialingLeadId(null);
      showToast(
        "Mobile App Connected", 
        `Active callback dialer session established for ${lead.customerName}`, 
        "success"
      );
    }, 2000);
  };

  // Metrics percentages
  const weeklyDealsProgress = Math.min(100, Math.round((followupMetrics.completed / targetCompletedDeals) * 100)) || 0;
  const weeklyCommissionProgress = Math.min(100, Math.round((totalCommission / targetCommissionGoal) * 100)) || 0;

  // Chart data config
  const chartData = {
    labels: ['Completed', 'Pending', 'Overdue'],
    datasets: [
      {
        label: 'Follow-ups',
        data: [followupMetrics.completed, followupMetrics.pending, followupMetrics.overdue],
        backgroundColor: ['#0D9488', '#F59E0B', '#EF4444'],
        borderWidth: 0,
        borderRadius: 8,
        barThickness: 28,
      },
    ],
  };

  const chartOptions = {
    maintainAspectRatio: false,
    responsive: true,
    plugins: {
      legend: {
        display: false
      },
      tooltip: {
        backgroundColor: '#1E293B',
        titleColor: '#FFFFFF',
        bodyColor: '#E2E8F0',
        borderColor: '#0D9488',
        borderWidth: 1,
        padding: 10,
        cornerRadius: 8,
      },
    },
    scales: {
      x: {
        grid: { display: false },
        ticks: { color: '#94A3B8', font: { weight: 'bold', size: 11 } }
      },
      y: {
        grid: { color: 'rgba(148, 163, 184, 0.15)' },
        ticks: { color: '#94A3B8', font: { size: 11 } }
      }
    }
  };

  return (
    <div className="p-4 md:p-6 bg-slate-50 dark:bg-slate-900 min-h-screen text-slate-700 dark:text-slate-200">
      
      {/* Title Header */}
      <div className="flex flex-col md:flex-row justify-between items-stretch md:items-center mb-6 gap-3">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-teal-600 dark:text-teal-400">
            Sales Agent Workspace
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Real-time pipeline monitoring, automated targets, and mobile connectivity options.
          </p>
        </div>
        <div className="flex items-center gap-2 self-start md:self-center">
          <span className={`inline-flex items-center gap-1 text-[10px] font-extrabold px-3 py-1.5 rounded-full ${
            isMobileSynced ? 'bg-green-100 text-green-800 dark:bg-green-950/40 dark:text-green-300' : 'bg-slate-100 text-slate-800'
          }`}>
            <FiSmartphone className="animate-pulse" />
            {isMobileSynced ? "Companion Paired" : "Companion Offline"}
          </span>
          <button 
            onClick={fetchData}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 border border-teal-200 hover:border-teal-400 dark:border-teal-800 text-teal-600 dark:text-teal-400 text-xs font-bold rounded-lg bg-white dark:bg-slate-800 transition-all shadow-sm"
          >
            <FiActivity />
            Refresh
          </button>
        </div>
      </div>

      {error && (
        <div className="p-4 mb-6 bg-red-50 border-l-4 border-red-500 text-red-700 dark:bg-red-950/20 dark:text-red-300 rounded-r-lg">
          <div className="flex gap-2">
            <span className="font-bold">Sync warning:</span>
            <span>{error}</span>
          </div>
        </div>
      )}

      {loading ? (
        <div className="flex justify-center items-center min-h-[400px]">
          <div className="animate-spin rounded-full h-10 w-10 border-4 border-teal-500 border-t-transparent"></div>
        </div>
      ) : (
        <div className="space-y-6">
          
          {/* Top Row: Metrics Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              {
                value: formatNumber(followupMetrics.total),
                label: 'Total Prospects',
                bg: 'from-blue-500 to-indigo-600',
                desc: 'Active pipeline leads',
                icon: MdPeople
              },
              {
                value: formatNumber(followupMetrics.completed),
                label: 'Deals Completed',
                bg: 'from-emerald-500 to-teal-600',
                desc: 'Verified conversions',
                icon: MdCheckCircle
              },
              {
                value: formatNumber(followupMetrics.pending),
                label: 'Pending Actions',
                bg: 'from-amber-500 to-orange-600',
                desc: 'Awaiting callback sessions',
                icon: MdPendingActions
              },
              {
                value: formatCurrency(totalCommission),
                label: 'Total Commission',
                bg: 'from-violet-500 to-purple-600',
                desc: 'Accrued net ledger payout',
                icon: MdNote
              }
            ].map((card, i) => (
              <div 
                key={i}
                className="bg-white/95 dark:bg-slate-800/90 border border-slate-200/60 dark:border-slate-700/50 rounded-2xl p-5 shadow-sm hover:shadow-md transition-all duration-300 flex items-center justify-between"
              >
                <div>
                  <span className="text-[10px] font-extrabold text-slate-400 dark:text-slate-500 uppercase tracking-wider block">
                    {card.label}
                  </span>
                  <span className="text-2xl font-black text-slate-800 dark:text-slate-100 tracking-tight block mt-1">
                    {card.value}
                  </span>
                  <span className="text-[10px] text-slate-400 mt-1 block">
                    {card.desc}
                  </span>
                </div>
                <div className={`w-11 h-11 rounded-xl bg-gradient-to-br ${card.bg} text-white flex items-center justify-center shadow-lg shadow-teal-500/5`}>
                  <card.icon className="text-xl" />
                </div>
              </div>
            ))}
          </div>

          {/* Middle Row: Charts & Targets & Mobile Pairing */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
            
            {/* Left: Follow-ups Analytics & Targets (7 cols) */}
            <div className="lg:col-span-7 space-y-5">
              
              {/* Targets widget */}
              <div className="bg-white dark:bg-slate-800 border border-slate-200/60 dark:border-slate-700/50 rounded-2xl p-5 shadow-sm">
                <span className="text-[11px] font-extrabold text-slate-400 dark:text-slate-500 uppercase tracking-wider block mb-4">
                  Weekly Goal Progression
                </span>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <div className="flex justify-between items-center mb-2">
                      <div className="flex items-center gap-1.5 text-xs font-extrabold text-slate-600 dark:text-slate-300">
                        <FiTrendingUp className="text-teal-500" />
                        <span>Deals Conversions</span>
                      </div>
                      <span className="text-xs font-bold text-teal-600 dark:text-teal-400">{weeklyDealsProgress}% ({followupMetrics.completed}/{targetCompletedDeals})</span>
                    </div>
                    <div className="w-full bg-slate-100 dark:bg-slate-700 rounded-full h-1.5">
                      <div 
                        className="bg-teal-500 h-1.5 rounded-full transition-all duration-500" 
                        style={{ width: `${weeklyDealsProgress}%` }}
                      ></div>
                    </div>
                    <span className="text-[10px] text-slate-400 mt-1 block">Weekly deal goal: 12 completions.</span>
                  </div>

                  <div>
                    <div className="flex justify-between items-center mb-2">
                      <div className="flex items-center gap-1.5 text-xs font-extrabold text-slate-600 dark:text-slate-300">
                        <FiCheck className="text-purple-500" />
                        <span>Commission Target</span>
                      </div>
                      <span className="text-xs font-bold text-purple-600 dark:text-purple-400">{weeklyCommissionProgress}%</span>
                    </div>
                    <div className="w-full bg-slate-100 dark:bg-slate-700 rounded-full h-1.5">
                      <div 
                        className="bg-purple-500 h-1.5 rounded-full transition-all duration-500" 
                        style={{ width: `${weeklyCommissionProgress}%` }}
                      ></div>
                    </div>
                    <span className="text-[10px] text-slate-400 mt-1 block">Goal: {formatCurrency(targetCommissionGoal)} net.</span>
                  </div>
                </div>
              </div>

              {/* Chart widget */}
              <div className="bg-white dark:bg-slate-800 border border-slate-200/60 dark:border-slate-700/50 rounded-2xl p-5 shadow-sm">
                <div className="flex justify-between items-center mb-4">
                  <span className="text-[11px] font-extrabold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
                    Follow-up Action Summary
                  </span>
                  <span className="bg-teal-50 text-teal-700 dark:bg-teal-950/30 dark:text-teal-400 text-[9px] font-extrabold px-2 py-0.5 rounded-full">
                    Live Statistics
                  </span>
                </div>
                <div className="h-[188px]">
                  <Bar data={chartData} options={chartOptions} />
                </div>
              </div>

            </div>

            {/* Right: Mobile Sync Companion & Dialer sync (5 cols) */}
            <div className="lg:col-span-5">
              <div className="bg-white dark:bg-slate-800 border border-slate-200/60 dark:border-slate-700/50 rounded-2xl p-5 shadow-sm h-100 flex flex-col justify-between">
                
                <div>
                  <div className="flex justify-between items-center mb-4">
                    <div>
                      <span className="text-[11px] font-extrabold text-slate-400 dark:text-slate-500 uppercase tracking-wider block">
                        Mobile Companion Link
                      </span>
                      <span className="text-[10px] text-slate-400">Scan QR to pair dialer sync.</span>
                    </div>
                    <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full ${
                      isMobileSynced ? 'bg-green-50 text-green-700 dark:bg-green-950/20' : 'bg-red-50 text-red-700'
                    }`}>
                      {isMobileSynced ? "Sync Active" : "Unlinked"}
                    </span>
                  </div>

                  {/* QR pairing interface */}
                  <div className="p-3.5 bg-slate-50 dark:bg-slate-900/40 border border-slate-100 dark:border-slate-800/80 rounded-xl flex gap-4 items-center mb-5">
                    <div className="bg-white p-1.5 rounded-lg border border-slate-100 flex-shrink-0">
                      <img 
                        src={qrCodeUrl} 
                        alt="Pairing QR Code"
                        className="w-20 h-20"
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1 text-[11px] font-extrabold text-slate-700 dark:text-slate-300">
                        <FiSmartphone className="text-teal-500 flex-shrink-0" />
                        <span className="truncate">{isMobileSynced ? syncDeviceName : "Pair Device"}</span>
                      </div>
                      <div className="h-px bg-slate-200/60 dark:bg-slate-800 my-2"></div>
                      <div className="space-y-1 text-[9px] text-slate-400">
                        <div className="flex justify-between">
                          <span>Push Mode:</span>
                          <span className="font-extrabold text-teal-600">Simulate WebSocket</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Latency:</span>
                          <span>&lt; 20ms (secured)</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Dialer items list */}
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">
                        Quick Mobile Dialer
                      </span>
                      <span className="text-[9px] text-slate-400">Awaiting Callback</span>
                    </div>

                    {pendingDialLeads.length > 0 ? (
                      <div className="space-y-2">
                        {pendingDialLeads.map((lead) => (
                          <div 
                            key={lead._id}
                            className="p-3 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800/80 rounded-xl hover:border-teal-300 transition-all flex items-center justify-between shadow-sm"
                          >
                            <div className="min-w-0">
                              <span className="text-xs font-black text-slate-700 dark:text-slate-200 block truncate">
                                {lead.customerName}
                              </span>
                              <span className="text-[9px] text-slate-400 block truncate">
                                {lead.contactTitle || "Sales prospect"} · {lead.phone}
                              </span>
                            </div>
                            <button
                              onClick={() => handleDialToMobile(lead)}
                              disabled={dialingLeadId === lead._id}
                              className={`p-1.5 bg-teal-50 text-teal-600 hover:bg-teal-500 hover:text-white dark:bg-slate-800 dark:text-teal-400 dark:hover:bg-teal-600 dark:hover:text-white rounded-lg transition-all ${
                                dialingLeadId === lead._id ? 'opacity-50 pointer-events-none' : ''
                              }`}
                            >
                              <FiPhoneCall className="text-xs" />
                            </button>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="p-4 text-center border border-dashed border-slate-200 dark:border-slate-800 rounded-xl text-xs text-slate-400">
                        No pending follow-ups today.
                      </div>
                    )}
                  </div>
                </div>

              </div>
            </div>

          </div>

          {/* Bottom Row: Notices & Tasks */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            
            {/* Notices card */}
            <div className="bg-white dark:bg-slate-800 border border-slate-200/60 dark:border-slate-700/50 rounded-2xl p-5 shadow-sm">
              <div className="flex justify-between items-center mb-4">
                <span className="text-[11px] font-extrabold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
                  Recent Sales Board Notices
                </span>
                <span className="bg-teal-50 text-teal-700 dark:bg-teal-950/30 dark:text-teal-400 text-[9px] font-extrabold px-2 py-0.5 rounded-full">
                  {notes.length} notes
                </span>
              </div>

              {notes.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {notes.slice(-4).reverse().map((note) => (
                    <div
                      key={note._id}
                      onClick={() => openNote(note._id)}
                      className="p-3 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-xl hover:border-teal-400 transition-all cursor-pointer"
                    >
                      <div className="flex items-center gap-1.5 text-xs font-extrabold text-teal-600 dark:text-teal-400">
                        <FiBookmark className="text-xs" />
                        <span className="truncate">{note.title}</span>
                      </div>
                      <p className="text-[10px] text-slate-400 mt-1 line-clamp-2">
                        {note.content}
                      </p>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-6 text-center border border-dashed border-slate-200 dark:border-slate-800 rounded-xl text-xs text-slate-400">
                  No notifications.
                </div>
              )}
            </div>

            {/* Task stats card */}
            <div className="bg-white dark:bg-slate-800 border border-slate-200/60 dark:border-slate-700/50 rounded-2xl p-5 shadow-sm">
              <div className="flex justify-between items-center mb-4">
                <span className="text-[11px] font-extrabold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
                  Tasks Reminder Indicators
                </span>
                <button 
                  onClick={() => window.dispatchEvent(new CustomEvent('navigateToSection', { detail: { section: 'Tasks' } }))}
                  className="text-xs text-teal-600 dark:text-teal-400 font-extrabold hover:underline"
                >
                  Manage Checklist
                </button>
              </div>

              <div className="flex gap-3">
                <div className="flex-1 p-3 bg-blue-50 dark:bg-blue-950/20 border border-blue-100 dark:border-blue-900/30 rounded-xl text-center">
                  <div className="flex items-center justify-center gap-1 text-[9px] font-extrabold text-blue-800 dark:text-blue-300 mb-0.5">
                    <FiClock />
                    <span>Pending</span>
                  </div>
                  <span className="text-xl font-black text-blue-700 dark:text-blue-200">{taskStats.pendingTasks}</span>
                </div>

                <div className="flex-1 p-3 bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-100 dark:border-emerald-900/30 rounded-xl text-center">
                  <div className="flex items-center justify-center gap-1 text-[9px] font-extrabold text-emerald-800 dark:text-emerald-300 mb-0.5">
                    <FiCheckCircle />
                    <span>Completed</span>
                  </div>
                  <span className="text-xl font-black text-emerald-700 dark:text-emerald-200">{taskStats.completedTasks}</span>
                </div>

                <div className="flex-1 p-3 bg-rose-50 dark:bg-rose-950/20 border border-rose-100 dark:border-rose-900/30 rounded-xl text-center">
                  <div className="flex items-center justify-center gap-1 text-[9px] font-extrabold text-rose-800 dark:text-rose-300 mb-0.5">
                    <FiCheck />
                    <span>Overdue</span>
                  </div>
                  <span className="text-xl font-black text-rose-700 dark:text-rose-200">{taskStats.overdueTasks}</span>
                </div>
              </div>
            </div>

          </div>

          {/* Modal for Note Detail View */}
          {isModalOpen && selectedNote && (
            <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
              <div className="bg-white dark:bg-slate-800 border border-slate-200/60 dark:border-slate-700 rounded-2xl w-full max-w-lg shadow-xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                <div className="flex justify-between items-center p-4 border-b border-slate-100 dark:border-slate-700">
                  <h3 className="font-black text-slate-800 dark:text-slate-100">{selectedNote.title}</h3>
                  <button 
                    onClick={() => setIsModalOpen(false)}
                    className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-all"
                  >
                    <FiX className="text-lg" />
                  </button>
                </div>
                <div className="p-5 text-sm leading-relaxed text-slate-600 dark:text-slate-350">
                  {selectedNote.content}
                </div>
                <div className="p-4 bg-slate-50 dark:bg-slate-900/50 flex justify-end">
                  <button 
                    onClick={() => setIsModalOpen(false)}
                    className="px-4 py-2 bg-teal-500 hover:bg-teal-600 text-white text-xs font-bold rounded-lg transition-all"
                  >
                    Dismiss
                  </button>
                </div>
              </div>
            </div>
          )}

        </div>
      )}

      {/* Floating custom Tailwind Toasts container */}
      <div className="fixed bottom-4 right-4 z-50 space-y-2 pointer-events-none">
        {toasts.map(toast => (
          <div 
            key={toast.id}
            className={`p-3.5 rounded-xl border shadow-xl flex flex-col pointer-events-auto min-w-[280px] max-w-sm animate-in slide-in-from-bottom-5 duration-200 ${
              toast.status === 'success' 
                ? 'bg-green-50 border-green-200 text-green-800 dark:bg-green-950 dark:border-green-900 dark:text-green-300' 
                : 'bg-teal-50 border-teal-200 text-teal-800 dark:bg-slate-800 dark:border-teal-900 dark:text-teal-350'
            }`}
          >
            <span className="text-xs font-black">{toast.title}</span>
            <span className="text-[10px] mt-1">{toast.description}</span>
          </div>
        ))}
      </div>

    </div>
  );
};

export default Dashboard;
