import React, { useState, useEffect } from 'react';
import { FiTarget, FiCalendar, FiTrendingUp } from 'react-icons/fi';
import { getSalesTargets, getAgentSalesStats } from '../../../../services/salesTargetService';
import { useUserStore } from '../../../../store/user';

const SalesTargetsPage = () => {
  const [targets, setTargets] = useState([]);
  const [salesStats, setSalesStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  const { currentUser } = useUserStore();

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const targetsResponse = await getSalesTargets(currentUser?._id);
        const statsResponse = await getAgentSalesStats();
        
        setTargets(targetsResponse.data || []);
        setSalesStats(statsResponse);
        setError(null);
      } catch (err) {
        console.error('Error fetching data:', err);
        setError('Failed to fetch sales data: ' + err.message);
      } finally {
        setLoading(false);
      }
    };

    if (currentUser?._id) {
      fetchData();
    }
  }, [currentUser]);

  const calculatePerformance = (actual, target) => {
    if (!target || target === 0) return 0;
    return Math.min(100, Math.round((actual / target) * 100));
  };

  const currentTargets = targets.filter(target => {
    const now = new Date();
    return new Date(target.periodStart) <= now && new Date(target.periodEnd) >= now;
  });

  const pastTargets = targets.filter(target => {
    const now = new Date();
    return new Date(target.periodEnd) < now;
  });

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[300px] py-10">
        <div className="animate-spin rounded-full h-8 w-8 border-4 border-teal-500 border-t-transparent"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 m-4 bg-red-50 border-l-4 border-red-500 text-red-700 dark:bg-red-950/20 dark:text-red-300 rounded-r-lg">
        <span className="font-bold">Error:</span> {error}
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      
      {/* Header Title */}
      <div className="flex justify-between items-center pb-4 border-b border-slate-200/60 dark:border-slate-800">
        <div>
          <h1 className="text-xl font-black text-slate-800 dark:text-slate-100 flex items-center gap-2">
            <FiTarget className="text-teal-500" />
            <span>My Sales Targets</span>
          </h1>
          <p className="text-xs text-slate-400 mt-1">Monitor assigned target progressions and historical milestones.</p>
        </div>
      </div>

      {/* Current Targets Section */}
      {currentTargets.length > 0 ? (
        <div className="space-y-4">
          <h2 className="text-xs font-extrabold uppercase text-slate-400 dark:text-slate-500 tracking-wider">
            Current Active Targets
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {currentTargets.map((target, index) => {
              const targetVal = target.weeklySalesTarget || target.monthlySalesTarget || 0;
              const performance = calculatePerformance(salesStats?.completedDeals || 0, targetVal);
              const isWeekly = target.periodType === 'weekly';
              
              return (
                <div 
                  key={index} 
                  className="bg-white dark:bg-slate-800 border border-slate-200/60 dark:border-slate-700/50 rounded-2xl p-5 shadow-xs hover:shadow-md transition-all duration-300 space-y-4"
                >
                  <div className="flex justify-between items-center">
                    <span className={`text-[10px] font-black px-2 py-0.5 rounded-full border ${
                      isWeekly 
                        ? 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/20 dark:text-blue-300 dark:border-blue-800' 
                        : 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/20 dark:text-emerald-300 dark:border-emerald-800'
                    }`}>
                      {target.periodType?.toUpperCase()}
                    </span>
                    <span className="text-[10px] text-slate-400 font-semibold flex items-center gap-1">
                      <FiCalendar />
                      {new Date(target.periodStart).toLocaleDateString()} - {new Date(target.periodEnd).toLocaleDateString()}
                    </span>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-3 bg-slate-50 dark:bg-slate-900/40 rounded-xl">
                      <span className="text-[10px] text-slate-400 block mb-0.5">Sales Target</span>
                      <span className="text-lg font-black text-slate-800 dark:text-slate-100">{targetVal} Sales</span>
                    </div>
                    
                    <div className="p-3 bg-slate-50 dark:bg-slate-900/40 rounded-xl">
                      <span className="text-[10px] text-slate-400 block mb-0.5">Current Progress</span>
                      <span className="text-lg font-black text-teal-650 dark:text-teal-400">{performance}%</span>
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <div className="flex justify-between items-center text-xs">
                      <span className="font-semibold text-slate-500">Milestone Progression</span>
                      <span className="font-bold text-slate-800 dark:text-slate-200">
                        {salesStats?.completedDeals || 0} / {targetVal} conversions
                      </span>
                    </div>
                    <div className="w-full bg-slate-150 dark:bg-slate-700 rounded-full h-2 overflow-hidden">
                      <div 
                        className="bg-teal-500 h-full rounded-full transition-all duration-500" 
                        style={{ width: `${performance}%` }}
                      ></div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        <div className="p-8 text-center bg-white dark:bg-slate-800 border border-slate-200/60 dark:border-slate-700/50 rounded-2xl">
          <FiTarget className="text-slate-350 dark:text-slate-600 text-4xl mx-auto mb-3" />
          <h3 className="font-extrabold text-sm text-slate-800 dark:text-slate-100 mb-1">No Active Targets</h3>
          <p className="text-xs text-slate-400">You don't have any active sales targets assigned at the moment.</p>
        </div>
      )}

      {/* Target History Section */}
      {pastTargets.length > 0 && (
        <div className="space-y-3">
          <h2 className="text-xs font-extrabold uppercase text-slate-400 dark:text-slate-500 tracking-wider">
            Target History Ledger
          </h2>
          <div className="bg-white dark:bg-slate-800 border border-slate-200/60 dark:border-slate-700/50 rounded-2xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs text-slate-650 dark:text-slate-350">
                <thead>
                  <tr className="bg-slate-50 dark:bg-slate-900 border-b border-slate-200 dark:border-slate-700">
                    <th className="p-3 font-extrabold text-slate-500 dark:text-slate-400">Period Date Range</th>
                    <th className="p-3 font-extrabold text-slate-500 dark:text-slate-400">Interval Type</th>
                    <th className="p-3 font-extrabold text-slate-500 dark:text-slate-400">Sales Target</th>
                    <th className="p-3 font-extrabold text-slate-500 dark:text-slate-400">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-150 dark:divide-slate-800">
                  {pastTargets.map((target, index) => (
                    <tr key={index} className="hover:bg-slate-50/50 dark:hover:bg-slate-900/30 transition-all">
                      <td className="p-3 font-medium text-slate-800 dark:text-slate-200">
                        {new Date(target.periodStart).toLocaleDateString()} - {new Date(target.periodEnd).toLocaleDateString()}
                      </td>
                      <td className="p-3">
                        <span className={`text-[9px] font-black px-2 py-0.5 rounded-full border ${
                          target.periodType === 'weekly'
                            ? 'bg-blue-50 text-blue-700 border-blue-100 dark:bg-blue-950/20 dark:text-blue-300'
                            : 'bg-emerald-50 text-emerald-700 border-emerald-100 dark:bg-emerald-950/20 dark:text-emerald-300'
                        }`}>
                          {target.periodType}
                        </span>
                      </td>
                      <td className="p-3 font-bold text-slate-700 dark:text-slate-300">
                        {target.weeklySalesTarget || target.monthlySalesTarget || 0} sales
                      </td>
                      <td className="p-3">
                        <span className="text-[9px] font-black bg-red-50 text-red-700 border border-red-100 dark:bg-red-950/20 dark:text-red-300 px-2 py-0.5 rounded-full">
                          Expired
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
      
    </div>
  );
};

export default SalesTargetsPage;