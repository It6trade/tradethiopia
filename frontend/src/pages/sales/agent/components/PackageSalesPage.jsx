import React, { useState, useEffect } from 'react';
import { 
  FiUser, 
  FiTrendingUp, 
  FiDollarSign,
  FiFileText
} from 'react-icons/fi';
import PackageSalesTable from './PackageSalesTable';
import { fetchPackages } from '../../../../services/packageService';

const PackageSalesPage = () => {
  const [packages, setPackages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const loadPackages = async () => {
      try {
        setLoading(true);
        const data = await fetchPackages();
        setPackages(Array.isArray(data) ? data : []);
        setError(null);
      } catch (err) {
        setError('Failed to fetch packages: ' + err.message);
        console.error('Error fetching packages:', err);
      } finally {
        setLoading(false);
      }
    };

    loadPackages();
  }, []);

  const totalPackages = packages.length;
  const avgPrice = totalPackages > 0 
    ? packages.reduce((sum, pkg) => sum + (pkg.price || 0), 0) / totalPackages
    : 0;
  const maxPrice = totalPackages > 0 
    ? Math.max(...packages.map(pkg => pkg.price || 0))
    : 0;

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
            <span>Package Catalog</span>
          </h1>
          <p className="text-xs text-slate-400 mt-1">Review active and custom subscription packages for clients.</p>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[
          { label: 'Total Packages', value: totalPackages, color: 'text-blue-500', bg: 'bg-blue-50 dark:bg-blue-950/20', icon: FiUser },
          { label: 'Avg. Package Price', value: `ETB ${avgPrice.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`, color: 'text-emerald-500', bg: 'bg-emerald-50 dark:bg-emerald-950/20', icon: FiDollarSign },
          { label: 'Highest Package Price', value: `ETB ${maxPrice.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`, color: 'text-purple-500', bg: 'bg-purple-50 dark:bg-purple-950/20', icon: FiTrendingUp }
        ].map((card, i) => (
          <div 
            key={i}
            className="p-4 bg-white dark:bg-slate-800 border border-slate-200/60 dark:border-slate-700/50 rounded-2xl shadow-xs flex items-center gap-3.5 hover:-translate-y-0.5 hover:shadow-md transition-all duration-300"
          >
            <div className={`p-2.5 rounded-xl ${card.bg} ${card.color} flex-shrink-0`}>
              <card.icon className="text-xl" />
            </div>
            <div className="min-w-0">
              <span className="text-[10px] font-extrabold text-slate-400 dark:text-slate-500 uppercase tracking-wider block">
                {card.label}
              </span>
              <span className="text-lg font-black text-slate-800 dark:text-slate-100 tracking-tight block mt-0.5">
                {card.value}
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* Package Sales Table component container */}
      <div className="bg-white dark:bg-slate-800 border border-slate-200/60 dark:border-slate-700/50 rounded-2xl shadow-xs overflow-hidden">
        <PackageSalesTable
          packages={packages}
          onDelete={(id) => console.log('Delete package', id)}
          onUpdate={(id, data) => console.log('Update package', id, data)}
          onAdd={(data) => console.log('Add package', data)}
        />
      </div>

    </div>
  );
};

export default PackageSalesPage;