import { useVault } from '../context/VaultContext';
import { useState } from 'react';
import { v4 as uuidv4 } from 'uuid';
import type { Asset, ValueHistoryEntry } from '../types';

type AssetType = 'property' | 'vehicle' | 'gold' | 'fd-rd' | 'mutual-fund' | 'stock' | 'epf-ppf-nps' | 'insurance' | 'chit-fund' | 'other';

const ASSET_TYPES: { value: AssetType; label: string }[] = [
  { value: 'property', label: 'Property / Real Estate' },
  { value: 'vehicle', label: 'Vehicle' },
  { value: 'gold', label: 'Gold / Jewelry' },
  { value: 'fd-rd', label: 'Fixed / Recurring Deposit' },
  { value: 'mutual-fund', label: 'Mutual Funds' },
  { value: 'stock', label: 'Stocks' },
  { value: 'epf-ppf-nps', label: 'EPF / PPF / NPS' },
  { value: 'insurance', label: 'Insurance Policies' },
  { value: 'chit-fund', label: 'Chit Funds' },
  { value: 'other', label: 'Other' },
];

export default function AssetsPage() {
  const { currentVaultData, saveRecord, updateRecord, deleteRecord, privacyMode } = useVault();
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedAsset, setSelectedAsset] = useState<Asset | null>(null);
  const [showValueHistory, setShowValueHistory] = useState<string | null>(null);

  // Format amount with privacy mode support
  function formatAmount(amount: number): string {
    if (privacyMode) return '••••••';
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(amount);
  }

  // Calculate total assets
  const totalAssets = currentVaultData?.assets.reduce((sum, asset) => sum + asset.currentValue, 0) || 0;

  function getAssetTypeLabel(type: string): string {
    return ASSET_TYPES.find(t => t.value === type)?.label || type;
  }

  function getValueChange(asset: Asset): { amount: number; percentage: number } {
    if (asset.valueHistory.length < 2) {
      return { amount: 0, percentage: 0 };
    }
    
    const latest = asset.valueHistory[asset.valueHistory.length - 1];
    const previous = asset.valueHistory[asset.valueHistory.length - 2];
    const amount = latest.value - previous.value;
    const percentage = previous.value > 0 ? (amount / previous.value) * 100 : 0;
    
    return { amount, percentage };
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
            Assets
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Track your wealth and investments
          </p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="bg-marigold-400 hover:bg-marigold-500 text-white font-medium py-2 px-4 rounded-lg transition-colors"
        >
          Add Asset
        </button>
      </div>

      {/* Total Summary */}
      <div className="bg-gradient-to-r from-marigold-400 to-marigold-500 rounded-lg shadow p-6 text-white">
        <p className="text-sm opacity-90 mb-2">Total Asset Value</p>
        <p className="text-3xl font-bold">{formatAmount(totalAssets)}</p>
        <p className="text-sm opacity-75 mt-2">{currentVaultData?.assets.length || 0} assets tracked</p>
      </div>

      {/* Assets Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {currentVaultData?.assets.length === 0 ? (
          <div className="col-span-full bg-gray-50 dark:bg-navy-800/50 rounded-lg p-8 text-center">
            <p className="text-gray-500 dark:text-gray-400 mb-4">No assets added yet</p>
            <button
              onClick={() => setShowAddModal(true)}
              className="bg-marigold-400 hover:bg-marigold-500 text-white font-medium py-2 px-4 rounded-lg transition-colors"
            >
              Add Your First Asset
            </button>
          </div>
        ) : (
          currentVaultData?.assets.map(asset => {
            const change = getValueChange(asset);
            
            return (
              <div key={asset.id} className="bg-white dark:bg-navy-800 rounded-lg shadow p-6">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="font-semibold text-gray-900 dark:text-white">{asset.name}</h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400">{getAssetTypeLabel(asset.type)}</p>
                  </div>
                </div>

                <div className="mb-4">
                  <p className="text-2xl font-bold text-gray-900 dark:text-white mb-1">
                    {formatAmount(asset.currentValue)}
                  </p>
                  {asset.valueHistory.length >= 2 && (
                    <p className={`text-sm ${change.amount >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                      {change.amount >= 0 ? '+' : ''}{formatAmount(change.amount)} ({change.percentage >= 0 ? '+' : ''}{change.percentage.toFixed(1)}%)
                    </p>
                  )}
                </div>

                {asset.notes && (
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-4 line-clamp-2">{asset.notes}</p>
                )}

                <div className="flex space-x-2 pt-4 border-t border-gray-200 dark:border-navy-700">
                  <button
                    onClick={() => setShowValueHistory(asset.id)}
                    className="flex-1 text-sm text-blue-600 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-300"
                  >
                    History
                  </button>
                  <button
                    onClick={() => setSelectedAsset(asset)}
                    className="flex-1 text-sm text-marigold-600 hover:text-marigold-900 dark:text-marigold-400 dark:hover:text-marigold-300"
                  >
                    Edit
                  </button>
                  <button
                    onClick={async () => {
                      if (confirm('Delete this asset?')) {
                        await deleteRecord('asset', asset.id);
                      }
                    }}
                    className="flex-1 text-sm text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300"
                  >
                    Delete
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Add/Edit Asset Modal */}
      {showAddModal && (
        <AssetModal
          asset={null}
          onClose={() => setShowAddModal(false)}
          onSave={async (asset) => {
            await saveRecord('asset', asset);
            setShowAddModal(false);
          }}
        />
      )}

      {selectedAsset && (
        <AssetModal
          asset={selectedAsset}
          onClose={() => setSelectedAsset(null)}
          onSave={async (asset) => {
            await updateRecord('asset', selectedAsset.id, asset);
            setSelectedAsset(null);
          }}
        />
      )}

      {/* Value History Modal */}
      {showValueHistory && currentVaultData?.assets.find(a => a.id === showValueHistory) && (
        <ValueHistoryModal
          asset={currentVaultData.assets.find(a => a.id === showValueHistory)!}
          onClose={() => setShowValueHistory(null)}
          onUpdate={async (asset) => {
            await updateRecord('asset', asset.id, asset);
            setShowValueHistory(null);
          }}
        />
      )}
    </div>
  );
}

interface AssetModalProps {
  asset: Asset | null;
  onClose: () => void;
  onSave: (asset: Asset) => Promise<void>;
}

function AssetModal({ asset, onClose, onSave }: AssetModalProps) {
  const [type, setType] = useState<AssetType>(asset?.type || 'other');
  const [name, setName] = useState(asset?.name || '');
  const [currentValue, setCurrentValue] = useState(asset?.currentValue.toString() || '');
  const [notes, setNotes] = useState(asset?.notes || '');

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    
    if (!name || !currentValue) {
      alert('Please fill in required fields');
      return;
    }

    const now = Date.now();
    const value: number = parseFloat(currentValue);
    
    // Add to value history if it's a new asset or value changed
    const valueHistory: ValueHistoryEntry[] = asset?.valueHistory || [];
    if (!asset || (asset && asset.currentValue !== value)) {
      valueHistory.push({
        date: now,
        value,
        note: asset ? 'Value updated' : 'Initial value',
      });
    }

    const newAsset: Asset = {
      id: asset?.id || uuidv4(),
      type,
      name,
      currentValue: value,
      valueHistory,
      notes,
      createdAt: asset?.createdAt || now,
      updatedAt: now,
    };

    await onSave(newAsset);
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-navy-800 rounded-lg shadow-xl max-w-md w-full">
        <div className="p-6">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
            {asset ? 'Edit Asset' : 'Add Asset'}
          </h2>
          
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Asset Type *
              </label>
              <select
                value={type}
                onChange={(e) => setType(e.target.value as AssetType)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-navy-600 rounded-lg bg-white dark:bg-navy-700 text-gray-900 dark:text-white"
              >
                {ASSET_TYPES.map(t => (
                  <option key={t.value} value={t.value}>{t.label}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Name *
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-navy-600 rounded-lg bg-white dark:bg-navy-700 text-gray-900 dark:text-white"
                placeholder="e.g., HDFC Mutual Fund, Maruti Swift"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Current Value *
              </label>
              <input
                type="number"
                value={currentValue}
                onChange={(e) => setCurrentValue(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-navy-600 rounded-lg bg-white dark:bg-navy-700 text-gray-900 dark:text-white"
                placeholder="0"
                step="0.01"
                min="0"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Notes
              </label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-navy-600 rounded-lg bg-white dark:bg-navy-700 text-gray-900 dark:text-white"
                rows={3}
                placeholder="Additional details..."
              />
            </div>

            <div className="flex space-x-3 pt-4">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 px-4 py-2 border border-gray-300 dark:border-navy-600 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-navy-700"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="flex-1 px-4 py-2 bg-marigold-400 hover:bg-marigold-500 text-white rounded-lg font-medium"
              >
                {asset ? 'Save Changes' : 'Add Asset'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

interface ValueHistoryModalProps {
  asset: Asset;
  onClose: () => void;
  onUpdate: (asset: Asset) => Promise<void>;
}

function ValueHistoryModal({ asset, onClose, onUpdate }: ValueHistoryModalProps) {
  const [newValue, setNewValue] = useState('');

  async function handleAddValue() {
    if (!newValue) return;
    
    const value = parseFloat(newValue);
    if (isNaN(value) || value <= 0) {
      alert('Invalid value');
      return;
    }

    const updatedAsset: Asset = {
      ...asset,
      currentValue: value,
      valueHistory: [
        ...asset.valueHistory,
        {
          date: Date.now(),
          value,
          note: 'Manual update',
        },
      ],
      updatedAt: Date.now(),
    };

    await onUpdate(updatedAsset);
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-navy-800 rounded-lg shadow-xl max-w-md w-full max-h-[80vh] overflow-y-auto">
        <div className="p-6">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
            Value History - {asset.name}
          </h2>

          <div className="mb-4">
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">Current Value</p>
            <p className="text-2xl font-bold text-gray-900 dark:text-white">
              ₹{asset.currentValue.toLocaleString('en-IN')}
            </p>
          </div>

          <div className="mb-6">
            <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Add New Value</h3>
            <div className="flex space-x-2">
              <input
                type="number"
                value={newValue}
                onChange={(e) => setNewValue(e.target.value)}
                className="flex-1 px-3 py-2 border border-gray-300 dark:border-navy-600 rounded-lg bg-white dark:bg-navy-700 text-gray-900 dark:text-white"
                placeholder="New value"
                step="0.01"
                min="0"
              />
              <button
                onClick={handleAddValue}
                className="px-4 py-2 bg-marigold-400 hover:bg-marigold-500 text-white rounded-lg font-medium"
              >
                Add
              </button>
            </div>
          </div>

          <div className="border-t border-gray-200 dark:border-navy-700 pt-4">
            <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">History</h3>
            {asset.valueHistory.length === 0 ? (
              <p className="text-sm text-gray-500 dark:text-gray-400">No history yet</p>
            ) : (
              <div className="space-y-2 max-h-60 overflow-y-auto">
                {asset.valueHistory.slice().reverse().map((entry, idx) => (
                  <div key={idx} className="flex justify-between text-sm">
                    <span className="text-gray-600 dark:text-gray-400">
                      {new Date(entry.date).toLocaleDateString('en-IN')}
                    </span>
                    <span className="font-medium text-gray-900 dark:text-white">
                      ₹{entry.value.toLocaleString('en-IN')}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="mt-6">
            <button
              onClick={onClose}
              className="w-full px-4 py-2 border border-gray-300 dark:border-navy-600 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-navy-700"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
