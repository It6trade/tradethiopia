import React, { useState } from 'react';
import { FiEdit2, FiTrash2, FiCheck, FiX, FiPlus } from 'react-icons/fi';

const PackageSalesTable = ({ packages, onDelete, onUpdate, onAdd }) => {
  const [editingCell, setEditingCell] = useState(null);
  const [editValue, setEditValue] = useState('');
  const [addingRow, setAddingRow] = useState(false);
  const [newPackage, setNewPackage] = useState({
    packageNumber: '',
    services: '',
    price: '',
    description: ''
  });

  const handleCellClick = (pkg, field) => {
    setEditingCell({ id: pkg._id, field });
    setEditValue(pkg[field] || '');
  };

  const handleSave = () => {
    if (editingCell) {
      const targetPkg = packages.find(p => p._id === editingCell.id);
      let value = editValue;
      if (editingCell.field === 'services') {
        value = editValue.split(',').map(s => s.trim()).filter(Boolean);
      } else if (editingCell.field === 'price' || editingCell.field === 'packageNumber') {
        value = Number(editValue) || 0;
      }
      const updated = { ...targetPkg, [editingCell.field]: value };
      onUpdate(editingCell.id, updated);
      setEditingCell(null);
      setEditValue('');
    }
  };

  const handleCancel = () => {
    setEditingCell(null);
    setEditValue('');
  };

  const handleNewPackageChange = (e) => {
    const { name, value } = e.target;
    setNewPackage(prev => ({ ...prev, [name]: value }));
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleSave();
    } else if (e.key === 'Escape') {
      handleCancel();
    }
  };

  const handleNewPackageKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleAddNewPackage();
    } else if (e.key === 'Escape') {
      setAddingRow(false);
      setNewPackage({
        packageNumber: '',
        services: '',
        price: '',
        description: ''
      });
    }
  };

  const handleAddNewPackage = () => {
    const servicesArray = newPackage.services.split(',').map(service => service.trim()).filter(Boolean);
    const packageToAdd = {
      ...newPackage,
      services: servicesArray,
      price: Number(newPackage.price) || 0
    };
    
    onAdd(packageToAdd);
    setAddingRow(false);
    setNewPackage({
      packageNumber: '',
      services: '',
      price: '',
      description: ''
    });
  };

  return (
    <div className="w-full space-y-4">
      
      {/* Action controls */}
      <div className="flex justify-between items-center px-4 py-3 bg-slate-50 dark:bg-slate-900 border-b border-slate-200/60 dark:border-slate-800">
        <span className="text-xs font-black text-slate-800 dark:text-slate-100">Package Listing Table</span>
        <button 
          onClick={() => setAddingRow(true)}
          disabled={addingRow}
          className="px-3.5 py-1.5 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs font-bold transition-all flex items-center gap-1 shadow-sm disabled:opacity-50"
        >
          <FiPlus />
          <span>Add Package</span>
        </button>
      </div>

      <div className="overflow-x-auto w-full">
        <table className="w-full text-left border-collapse text-xs text-slate-650 dark:text-slate-350 min-w-[700px]">
          <thead>
            <tr className="bg-slate-100 dark:bg-slate-950 border-b border-slate-200 dark:border-slate-800">
              <th className="p-3 font-extrabold text-slate-550 dark:text-slate-400 w-36">Package Number</th>
              <th className="p-3 font-extrabold text-slate-550 dark:text-slate-400">Services</th>
              <th className="p-3 font-extrabold text-slate-550 dark:text-slate-400 w-36">Price (ETB)</th>
              <th className="p-3 font-extrabold text-slate-550 dark:text-slate-400">Description</th>
              <th className="p-3 font-extrabold text-slate-550 dark:text-slate-400 w-24 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-150 dark:divide-slate-800">
            
            {/* Adding row input line */}
            {addingRow && (
              <tr className="bg-teal-50/20 dark:bg-teal-950/10">
                <td className="p-2">
                  <input 
                    type="number"
                    name="packageNumber"
                    placeholder="# No."
                    value={newPackage.packageNumber}
                    onChange={handleNewPackageChange}
                    onKeyDown={handleNewPackageKeyDown}
                    className="w-full border border-slate-250 dark:border-slate-700 rounded-lg p-1.5 text-xs bg-white text-slate-850 outline-none focus:border-teal-500"
                  />
                </td>
                <td className="p-2">
                  <textarea 
                    name="services"
                    placeholder="Services (comma separated)"
                    value={newPackage.services}
                    onChange={handleNewPackageChange}
                    onKeyDown={handleNewPackageKeyDown}
                    rows={1}
                    className="w-full border border-slate-250 dark:border-slate-700 rounded-lg p-1.5 text-xs bg-white text-slate-850 outline-none focus:border-teal-500"
                  />
                </td>
                <td className="p-2">
                  <input 
                    type="number"
                    name="price"
                    placeholder="Price"
                    value={newPackage.price}
                    onChange={handleNewPackageChange}
                    onKeyDown={handleNewPackageKeyDown}
                    className="w-full border border-slate-250 dark:border-slate-700 rounded-lg p-1.5 text-xs bg-white text-slate-850 outline-none focus:border-teal-500"
                  />
                </td>
                <td className="p-2">
                  <textarea 
                    name="description"
                    placeholder="Package Description..."
                    value={newPackage.description}
                    onChange={handleNewPackageChange}
                    onKeyDown={handleNewPackageKeyDown}
                    rows={1}
                    className="w-full border border-slate-250 dark:border-slate-700 rounded-lg p-1.5 text-xs bg-white text-slate-850 outline-none focus:border-teal-500"
                  />
                </td>
                <td className="p-2 text-right">
                  <div className="flex gap-1 justify-end">
                    <button 
                      onClick={handleAddNewPackage}
                      className="p-1 bg-teal-500 hover:bg-teal-600 text-white rounded"
                    >
                      <FiCheck className="text-sm" />
                    </button>
                    <button 
                      onClick={() => setAddingRow(false)}
                      className="p-1 bg-slate-350 hover:bg-slate-400 text-slate-700 rounded"
                    >
                      <FiX className="text-sm" />
                    </button>
                  </div>
                </td>
              </tr>
            )}

            {/* Packages listing */}
            {packages && packages.length > 0 ? (
              packages.map(pkg => {
                const isEditingNumber = editingCell?.id === pkg._id && editingCell?.field === 'packageNumber';
                const isEditingServices = editingCell?.id === pkg._id && editingCell?.field === 'services';
                const isEditingPrice = editingCell?.id === pkg._id && editingCell?.field === 'price';
                const isEditingDescription = editingCell?.id === pkg._id && editingCell?.field === 'description';
                
                return (
                  <tr key={pkg._id} className="hover:bg-slate-50/50 dark:hover:bg-slate-900/35 transition-all">
                    
                    {/* Number cell */}
                    <td 
                      onClick={() => handleCellClick(pkg, 'packageNumber')}
                      className={`p-3 truncate cursor-pointer font-bold text-slate-800 dark:text-slate-200 ${isEditingNumber ? 'bg-teal-50/10' : ''}`}
                    >
                      {isEditingNumber ? (
                        <input
                          autoFocus
                          type="number"
                          value={editValue}
                          onChange={handleInputChange}
                          onKeyDown={handleKeyDown}
                          onBlur={handleSave}
                          className="w-full border border-teal-500 rounded p-1 text-xs bg-white text-slate-800 outline-none"
                        />
                      ) : (
                        <span>{pkg.packageNumber}</span>
                      )}
                    </td>

                    {/* Services cell */}
                    <td 
                      onClick={() => handleCellClick(pkg, 'services')}
                      className={`p-3 cursor-pointer ${isEditingServices ? 'bg-teal-50/10' : ''}`}
                    >
                      {isEditingServices ? (
                        <textarea
                          autoFocus
                          value={editValue}
                          onChange={(e) => setEditValue(e.target.value)}
                          onKeyDown={handleKeyDown}
                          onBlur={handleSave}
                          rows={2}
                          className="w-full border border-teal-500 rounded p-1 text-xs bg-white text-slate-800 outline-none"
                        />
                      ) : (
                        <div className="flex flex-wrap gap-1">
                          {pkg.services && pkg.services.map((srv, i) => (
                            <span key={i} className="px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-900 text-[10px] text-slate-600 dark:text-slate-400 font-semibold border border-slate-200/50 dark:border-slate-800">
                              {srv}
                            </span>
                          ))}
                        </div>
                      )}
                    </td>

                    {/* Price cell */}
                    <td 
                      onClick={() => handleCellClick(pkg, 'price')}
                      className={`p-3 cursor-pointer text-emerald-600 dark:text-emerald-400 font-black ${isEditingPrice ? 'bg-teal-50/10' : ''}`}
                    >
                      {isEditingPrice ? (
                        <input
                          autoFocus
                          type="number"
                          value={editValue}
                          onChange={(e) => setEditValue(e.target.value)}
                          onKeyDown={handleKeyDown}
                          onBlur={handleSave}
                          className="w-full border border-teal-500 rounded p-1 text-xs bg-white text-slate-800 outline-none"
                        />
                      ) : (
                        <span>ETB {pkg.price?.toLocaleString()}</span>
                      )}
                    </td>

                    {/* Description cell */}
                    <td 
                      onClick={() => handleCellClick(pkg, 'description')}
                      className={`p-3 cursor-pointer max-w-xs truncate ${isEditingDescription ? 'bg-teal-50/10' : ''}`}
                    >
                      {isEditingDescription ? (
                        <textarea
                          autoFocus
                          value={editValue}
                          onChange={(e) => setEditValue(e.target.value)}
                          onKeyDown={handleKeyDown}
                          onBlur={handleSave}
                          rows={2}
                          className="w-full border border-teal-500 rounded p-1 text-xs bg-white text-slate-800 outline-none"
                        />
                      ) : (
                        <span className="truncate block">{pkg.description || 'No description provided.'}</span>
                      )}
                    </td>

                    {/* Actions cell */}
                    <td className="p-3 text-right">
                      <div className="flex gap-1.5 justify-end">
                        <button
                          onClick={() => handleCellClick(pkg, 'packageNumber')}
                          className="p-1 border border-slate-150 hover:border-teal-400 text-slate-400 hover:text-teal-600 rounded transition-all"
                          title="Edit Package"
                        >
                          <FiEdit2 className="text-xs" />
                        </button>
                        <button
                          onClick={() => onDelete(pkg._id)}
                          className="p-1 border border-slate-150 hover:border-red-400 text-slate-400 hover:text-red-600 rounded transition-all"
                          title="Delete Package"
                        >
                          <FiTrash2 className="text-xs" />
                        </button>
                      </div>
                    </td>

                  </tr>
                );
              })
            ) : (
              <tr>
                <td colSpan={5} className="py-12 text-center text-slate-400 text-sm">
                  No packages listed in the system registry.
                </td>
              </tr>
            )}

          </tbody>
        </table>
      </div>

    </div>
  );
};

export default PackageSalesTable;