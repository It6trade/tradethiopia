import React, { useState, useEffect } from 'react';
import { FiTrendingUp, FiActivity, FiDollarSign, FiClock, FiFileText } from 'react-icons/fi';
import axiosInstance from '../../../../services/axiosInstance';

const calculateCommission = (salesValue) => {
  const commissionRate = 0.10;
  const taxRate = 0.05;
  const grossCommission = salesValue * commissionRate;
  const commissionTax = grossCommission * taxRate;
  const netCommission = grossCommission - commissionTax;
  
  return {
    grossCommission: Math.round(grossCommission),
    commissionTax: Math.round(commissionTax),
    netCommission: Math.round(netCommission)
  };
};

const MonthlyReport = () => {
  const [timeRange, setTimeRange] = useState('month');
  const [reportData, setReportData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchReportData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const statsResponse = await axiosInstance.get('/sales-customers/stats');
      const stats = statsResponse.data;
      
      const totalSalesValue = (stats.completedDeals || 0) * 15000;
      const commissionData = calculateCommission(totalSalesValue);
      
      const data = {
        agentName: 'Current Agent',
        totalSales: stats.completedDeals || 0,
        totalSalesValue: totalSalesValue,
        grossCommission: commissionData.grossCommission,
        netCommission: commissionData.netCommission,
        commissionTax: commissionData.commissionTax
      };
      
      setReportData(data);
    } catch (err) {
      console.error('Error fetching report data:', err);
      setError('Failed to fetch report data. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReportData();
  }, [timeRange]);

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
      
      {/* Header title */}
      <div className="flex justify-between items-center pb-4 border-b border-slate-200/60 dark:border-slate-800">
        <div>
          <h1 className="text-xl font-black text-slate-800 dark:text-slate-100 flex items-center gap-2">
            <FiFileText className="text-teal-500" />
            <span>Monthly Performance Report</span>
          </h1>
          <p className="text-xs text-slate-400 mt-1">Audit commission metrics and sales summaries over chosen intervals.</p>
        </div>
        <select 
          value={timeRange}
          onChange={(e) => setTimeRange(e.target.value)}
          className="px-3 py-2 border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 rounded-xl text-xs font-bold focus:ring-2 focus:ring-teal-500/25 focus:border-teal-500 outline-none transition-all text-slate-700 dark:text-slate-200"
        >
          <option value="week">This Week</option>
          <option value="month">This Month</option>
          <option value="quarter">This Quarter</option>
          <option value="year">This Year</option>
          <option value="all">All Time</option>
        </select>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Total Sales completed', value: reportData?.totalSales || 0, color: 'text-blue-500', bg: 'bg-blue-50 dark:bg-blue-950/20', icon: FiTrendingUp },
          { label: 'Total Sales Value', value: `ETB ${(reportData?.totalSalesValue || 0).toLocaleString()}`, color: 'text-emerald-500', bg: 'bg-emerald-50 dark:bg-emerald-950/20', icon: FiActivity },
          { label: 'Gross Commission', value: `ETB ${(reportData?.grossCommission || 0).toLocaleString()}`, color: 'text-purple-500', bg: 'bg-purple-50 dark:bg-purple-950/20', icon: FiDollarSign },
          { label: 'Net Commission', value: `ETB ${(reportData?.netCommission || 0).toLocaleString()}`, color: 'text-amber-500', bg: 'bg-amber-50 dark:bg-amber-950/20', icon: FiClock }
        ].map((card, i) => (
          <div 
            key={i}
            className="p-5 bg-white dark:bg-slate-800 border border-slate-200/60 dark:border-slate-700/50 rounded-2xl shadow-xs text-center space-y-2 hover:-translate-y-0.5 hover:shadow-md transition-all duration-300"
          >
            <div className={`w-10 h-10 rounded-xl ${card.bg} ${card.color} flex items-center justify-center mx-auto`}>
              <card.icon className="text-lg" />
            </div>
            <span className="text-[10px] font-extrabold text-slate-400 dark:text-slate-500 uppercase tracking-wider block">
              {card.label}
            </span>
            <span className={`text-lg font-black tracking-tight ${card.color} block`}>
              {card.value}
            </span>
          </div>
        ))}
      </div>

      {/* Detailed Table Card */}
      <div className="bg-white dark:bg-slate-800 border border-slate-200/60 dark:border-slate-700/50 rounded-2xl p-5 shadow-xs">
        <h2 className="text-sm font-black text-slate-800 dark:text-slate-100 mb-4">
          Detailed Performance Audit
        </h2>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs text-slate-650 dark:text-slate-350">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-900 border-b border-slate-200 dark:border-slate-700">
                <th className="p-3 font-extrabold text-slate-500 dark:text-slate-400">Metric Type</th>
                <th className="p-3 font-extrabold text-slate-500 dark:text-slate-400 text-right">Value Amount</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-150 dark:divide-slate-800">
              {[
                { label: 'Total Sales Completed', val: reportData?.totalSales || 0, color: 'text-blue-500' },
                { label: 'Total Sales Value', val: `ETB ${(reportData?.totalSalesValue || 0).toLocaleString()}`, color: 'text-emerald-500' },
                { label: 'Gross Commission (10%)', val: `ETB ${(reportData?.grossCommission || 0).toLocaleString()}`, color: 'text-purple-500' },
                { label: 'Tax Deduction (5%)', val: `ETB ${(reportData?.commissionTax || 0).toLocaleString()}`, color: 'text-red-500' },
                { label: 'Net Payout Commission', val: `ETB ${(reportData?.netCommission || 0).toLocaleString()}`, color: 'text-amber-500 font-extrabold text-sm' }
              ].map((row, idx) => (
                <tr key={idx} className="hover:bg-slate-50/50 dark:hover:bg-slate-900/30 transition-all">
                  <td className="p-3 font-semibold text-slate-750 dark:text-slate-250">{row.label}</td>
                  <td className={`p-3 text-right font-black ${row.color}`}>{row.val}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
};

export default MonthlyReport;