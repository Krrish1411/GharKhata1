import { useVault } from '../context/VaultContext';
import { useState } from 'react';
import { v4 as uuidv4 } from 'uuid';
import type { Liability } from '../types';

type LiabilityType = 'home-loan' | 'car-loan' | 'personal-loan' | 'education-loan' | 'credit-card' | 'other';

const LIABILITY_TYPES: { value: LiabilityType; label: string }[] = [
  { value: 'home-loan', label: 'Home Loan' },
  { value: 'car-loan', label: 'Car Loan' },
  { value: 'personal-loan', label: 'Personal Loan' },
  { value: 'education-loan', label: 'Education Loan' },
  { value: 'credit-card', label: 'Credit Card Outstanding' },
  { value: 'other', label: 'Other' },
];

export default function LiabilitiesPage() {
  const { currentVaultData, saveRecord, updateRecord, deleteRecord, privacyMode } = useVault();
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedLiability, setSelectedLiability] = useState<Liability | null>(null);

  // Format amount with privacy mode support
  function formatAmount(amount: number): string {
    if (privacyMode) return '••••••';
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(amount);
  }

  // Calculate total liabilities
  const totalLiabilities = currentVaultData?.liabilities.reduce((sum, liab) => sum + liab.outstandingBalance, 0) || 0;

  function getLiabilityTypeLabel(type: string): string {
    return LIABILITY_TYPES.find(t => t.value === type)?.label || type;
  }

  function getDueDateStatus(dueDate: number): { label: string; color: string } {
    const now = Date.now();
    const diffDays = (dueDate - now) / (1000 * 60 * 60 * 24);
    
    if (diffDays < 0) return { label: 'Overdue', color: 'text-red-600 dark:text-red-400' };
    if (diffDays < 7) return { label: 'Due Soon', color: 'text-yellow-600 dark:text-yellow-400' };
    return { label: 'On Track', color: 'text-green-600 dark:text-green-400' };
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
            Liabilities
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Track formal debts and loans
          </p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="bg-marigold-400 hover:bg-marigold-500 text-white font-medium py-2 px-4 rounded-lg transition-colors"
        >
          Add Liability
        </button>
      </div>

      {/* Total Summary */}
      <div className="bg-gradient-to-r from-red-500 to-red-600 rounded-lg shadow p-6 text-white">
        <p className="text-sm opacity-90 mb-2">Total Outstanding</p>
        <p className="text-3xl font-bold">{formatAmount(totalLiabilities)}</p>
        <p className="text-sm opacity-75 mt-2">{currentVaultData?.liabilities.length || 0} liabilities tracked</p>
      </div>

      {/* Liabilities Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {currentVaultData?.liabilities.length === 0 ? (
          <div className="col-span-full bg-gray-50 dark:bg-navy-800/50 rounded-lg p-8 text-center">
            <p className="text-gray-500 dark:text-gray-400 mb-4">No liabilities added yet</p>
            <button
              onClick={() => setShowAddModal(true)}
              className="bg-marigold-400 hover:bg-marigold-500 text-white font-medium py-2 px-4 rounded-lg transition-colors"
            >
              Add Your First Liability
            </button>
          </div>
        ) : (
          currentVaultData?.liabilities.map(liability => {
            const dueDateStatus = getDueDateStatus(liability.nextDueDate);
            
            return (
              <div key={liability.id} className="bg-white dark:bg-navy-800 rounded-lg shadow p-6">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="font-semibold text-gray-900 dark:text-white">{liability.lender}</h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400">{getLiabilityTypeLabel(liability.type)}</p>
                  </div>
                </div>

                <div className="mb-4 space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-500 dark:text-gray-400">Outstanding</span>
                    <span className="font-bold text-red-600 dark:text-red-400">{formatAmount(liability.outstandingBalance)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-500 dark:text-gray-400">Principal</span>
                    <span className="font-medium text-gray-900 dark:text-white">{formatAmount(liability.principal)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-500 dark:text-gray-400">Interest Rate</span>
                    <span className="font-medium text-gray-900 dark:text-white">{liability.interestRate}%</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-500 dark:text-gray-400">EMI</span>
                    <span className="font-medium text-gray-900 dark:text-white">{formatAmount(liability.emiAmount)}</span>
                  </div>
                </div>

                <div className="mb-4 pt-4 border-t border-gray-200 dark:border-navy-700">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-500 dark:text-gray-400">Next Due</span>
                    <span className={`text-sm font-medium ${dueDateStatus.color}`}>
                      {new Date(liability.nextDueDate).toLocaleDateString('en-IN')} ({dueDateStatus.label})
                    </span>
                  </div>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    {liability.tenureRemaining} months remaining
                  </p>
                </div>

                <div className="flex space-x-2 pt-4 border-t border-gray-200 dark:border-navy-700">
                  <button
                    onClick={() => setSelectedLiability(liability)}
                    className="flex-1 text-sm text-marigold-600 hover:text-marigold-900 dark:text-marigold-400 dark:hover:text-marigold-300"
                  >
                    Edit
                  </button>
                  <button
                    onClick={async () => {
                      if (confirm('Delete this liability?')) {
                        await deleteRecord('liability', liability.id);
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

      {/* Add/Edit Liability Modal */}
      {showAddModal && (
        <LiabilityModal
          liability={null}
          onClose={() => setShowAddModal(false)}
          onSave={async (liability) => {
            await saveRecord('liability', liability);
            setShowAddModal(false);
          }}
        />
      )}

      {selectedLiability && (
        <LiabilityModal
          liability={selectedLiability}
          onClose={() => setSelectedLiability(null)}
          onSave={async (liability) => {
            await updateRecord('liability', selectedLiability.id, liability);
            setSelectedLiability(null);
          }}
        />
      )}
    </div>
  );
}

interface LiabilityModalProps {
  liability: Liability | null;
  onClose: () => void;
  onSave: (liability: Liability) => Promise<void>;
}

function LiabilityModal({ liability, onClose, onSave }: LiabilityModalProps) {
  const [type, setType] = useState<LiabilityType>(liability?.type || 'other');
  const [lender, setLender] = useState(liability?.lender || '');
  const [principal, setPrincipal] = useState(liability?.principal.toString() || '');
  const [outstandingBalance, setOutstandingBalance] = useState(liability?.outstandingBalance.toString() || '');
  const [interestRate, setInterestRate] = useState(liability?.interestRate.toString() || '');
  const [emiAmount, setEmiAmount] = useState(liability?.emiAmount.toString() || '');
  const [nextDueDate, setNextDueDate] = useState(
    liability?.nextDueDate ? new Date(liability.nextDueDate).toISOString().split('T')[0] : new Date().toISOString().split('T')[0]
  );
  const [tenureRemaining, setTenureRemaining] = useState(liability?.tenureRemaining.toString() || '');

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    
    if (!lender || !principal || !outstandingBalance || !interestRate || !emiAmount || !tenureRemaining) {
      alert('Please fill in required fields');
      return;
    }

    const now = Date.now();
    
    const newLiability: Liability = {
      id: liability?.id || uuidv4(),
      type,
      lender,
      principal: parseFloat(principal),
      outstandingBalance: parseFloat(outstandingBalance),
      interestRate: parseFloat(interestRate),
      emiAmount: parseFloat(emiAmount),
      nextDueDate: new Date(nextDueDate).getTime(),
      tenureRemaining: parseInt(tenureRemaining),
      createdAt: liability?.createdAt || now,
      updatedAt: now,
    };

    await onSave(newLiability);
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-navy-800 rounded-lg shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
            {liability ? 'Edit Liability' : 'Add Liability'}
          </h2>
          
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Liability Type *
              </label>
              <select
                value={type}
                onChange={(e) => setType(e.target.value as LiabilityType)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-navy-600 rounded-lg bg-white dark:bg-navy-700 text-gray-900 dark:text-white"
              >
                {LIABILITY_TYPES.map(t => (
                  <option key={t.value} value={t.value}>{t.label}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Lender *
              </label>
              <input
                type="text"
                value={lender}
                onChange={(e) => setLender(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-navy-600 rounded-lg bg-white dark:bg-navy-700 text-gray-900 dark:text-white"
                placeholder="e.g., HDFC Bank, SBI"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Principal Amount *
              </label>
              <input
                type="number"
                value={principal}
                onChange={(e) => setPrincipal(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-navy-600 rounded-lg bg-white dark:bg-navy-700 text-gray-900 dark:text-white"
                placeholder="0"
                step="0.01"
                min="0"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Outstanding Balance *
              </label>
              <input
                type="number"
                value={outstandingBalance}
                onChange={(e) => setOutstandingBalance(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-navy-600 rounded-lg bg-white dark:bg-navy-700 text-gray-900 dark:text-white"
                placeholder="0"
                step="0.01"
                min="0"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Interest Rate (%) *
              </label>
              <input
                type="number"
                value={interestRate}
                onChange={(e) => setInterestRate(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-navy-600 rounded-lg bg-white dark:bg-navy-700 text-gray-900 dark:text-white"
                placeholder="0"
                step="0.1"
                min="0"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                EMI Amount *
              </label>
              <input
                type="number"
                value={emiAmount}
                onChange={(e) => setEmiAmount(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-navy-600 rounded-lg bg-white dark:bg-navy-700 text-gray-900 dark:text-white"
                placeholder="0"
                step="0.01"
                min="0"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Next Due Date *
              </label>
              <input
                type="date"
                value={nextDueDate}
                onChange={(e) => setNextDueDate(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-navy-600 rounded-lg bg-white dark:bg-navy-700 text-gray-900 dark:text-white"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Tenure Remaining (months) *
              </label>
              <input
                type="number"
                value={tenureRemaining}
                onChange={(e) => setTenureRemaining(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-navy-600 rounded-lg bg-white dark:bg-navy-700 text-gray-900 dark:text-white"
                placeholder="0"
                min="0"
                required
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
                {liability ? 'Save Changes' : 'Add Liability'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
