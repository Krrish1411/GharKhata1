import { useVault } from '../context/VaultContext';
import { useState } from 'react';
import { v4 as uuidv4 } from 'uuid';
import type { Budget, Category } from '../types';

type BudgetPeriod = 'monthly' | 'quarterly' | 'yearly' | 'custom';

export default function BudgetsPage() {
  const { currentVaultData, saveRecord, updateRecord, deleteRecord, privacyMode } = useVault();
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedBudget, setSelectedBudget] = useState<Budget | null>(null);

  // Format amount with privacy mode support
  function formatAmount(amount: number): string {
    if (privacyMode) return '••••••';
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(amount);
  }

  // Get expense categories
  const expenseCategories = currentVaultData?.categories.filter(c => c.type === 'expense') || [];

  // Calculate actual spend per category for current month
  const currentMonth = new Date().getMonth();
  const currentYear = new Date().getFullYear();
  
  function getCategorySpend(categoryId: string): number {
    return (currentVaultData?.transactions
      .filter(t => {
        const transactionDate = new Date(t.date);
        return t.categoryId === categoryId && 
               transactionDate.getMonth() === currentMonth && 
               transactionDate.getFullYear() === currentYear;
      })
      .reduce((sum, t) => sum + t.amount, 0) || 0);
  }

  function getBudgetStatus(budget: Budget): { spent: number; percentage: number; status: 'under' | 'on-track' | 'over' } {
    const spent = getCategorySpend(budget.categoryId);
    const percentage = budget.budgetedAmount > 0 ? (spent / budget.budgetedAmount) * 100 : 0;
    let status: 'under' | 'on-track' | 'over' = 'under';
    
    if (percentage >= 100) status = 'over';
    else if (percentage >= 80) status = 'on-track';
    
    return { spent, percentage, status };
  }

  function getStatusColor(status: string): string {
    switch (status) {
      case 'under': return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400';
      case 'on-track': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400';
      case 'over': return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400';
    }
  }

  function getProgressColor(percentage: number): string {
    if (percentage >= 100) return 'bg-red-500';
    if (percentage >= 80) return 'bg-yellow-500';
    return 'bg-green-500';
  }

  function getCategoryName(categoryId: string): string {
    return currentVaultData?.categories.find(c => c.id === categoryId)?.name || 'Unknown';
  }

  function getPeriodLabel(period: BudgetPeriod): string {
    switch (period) {
      case 'monthly': return 'Monthly';
      case 'quarterly': return 'Quarterly';
      case 'yearly': return 'Yearly';
      case 'custom': return 'Custom';
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
            Budgets & Planning
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Track spending against budgets
          </p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="bg-marigold-400 hover:bg-marigold-500 text-white font-medium py-2 px-4 rounded-lg transition-colors"
        >
          Add Budget
        </button>
      </div>

      {/* Budgets Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {currentVaultData?.budgets.length === 0 ? (
          <div className="col-span-full bg-gray-50 dark:bg-navy-800/50 rounded-lg p-8 text-center">
            <p className="text-gray-500 dark:text-gray-400 mb-4">No budgets created yet</p>
            <button
              onClick={() => setShowAddModal(true)}
              className="bg-marigold-400 hover:bg-marigold-500 text-white font-medium py-2 px-4 rounded-lg transition-colors"
            >
              Create Your First Budget
            </button>
          </div>
        ) : (
          currentVaultData?.budgets.map(budget => {
            const { spent, percentage, status } = getBudgetStatus(budget);
            const categoryName = getCategoryName(budget.categoryId);
            
            return (
              <div key={budget.id} className="bg-white dark:bg-navy-800 rounded-lg shadow p-6">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="font-semibold text-gray-900 dark:text-white">{categoryName}</h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400">{getPeriodLabel(budget.period)}</p>
                  </div>
                  <span className={`px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(status)}`}>
                    {status === 'under' ? 'Under Budget' : status === 'on-track' ? 'On Track' : 'Over Budget'}
                  </span>
                </div>

                <div className="mb-4">
                  <div className="flex justify-between text-sm mb-2">
                    <span className="text-gray-500 dark:text-gray-400">Spent</span>
                    <span className="font-medium text-gray-900 dark:text-white">{formatAmount(spent)} / {formatAmount(budget.budgetedAmount)}</span>
                  </div>
                  <div className="w-full bg-gray-200 dark:bg-navy-700 rounded-full h-2">
                    <div
                      className={`h-2 rounded-full transition-all ${getProgressColor(Math.min(percentage, 100))}`}
                      style={{ width: `${Math.min(percentage, 100)}%` }}
                    />
                  </div>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{percentage.toFixed(0)}% used</p>
                </div>

                {budget.rollover && (
                  <p className="text-xs text-marigold-600 dark:text-marigold-400">
                    ✓ Rollover enabled
                  </p>
                )}

                <div className="flex space-x-2 mt-4 pt-4 border-t border-gray-200 dark:border-navy-700">
                  <button
                    onClick={() => setSelectedBudget(budget)}
                    className="flex-1 text-sm text-marigold-600 hover:text-marigold-900 dark:text-marigold-400 dark:hover:text-marigold-300"
                  >
                    Edit
                  </button>
                  <button
                    onClick={async () => {
                      if (confirm('Delete this budget?')) {
                        await deleteRecord('budget', budget.id);
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

      {/* Add/Edit Budget Modal */}
      {showAddModal && (
        <BudgetModal
          budget={null}
          categories={expenseCategories}
          onClose={() => setShowAddModal(false)}
          onSave={async (budget) => {
            await saveRecord('budget', budget);
            setShowAddModal(false);
          }}
        />
      )}

      {selectedBudget && (
        <BudgetModal
          budget={selectedBudget}
          categories={expenseCategories}
          onClose={() => setSelectedBudget(null)}
          onSave={async (budget) => {
            await updateRecord('budget', selectedBudget.id, budget);
            setSelectedBudget(null);
          }}
        />
      )}
    </div>
  );
}

interface BudgetModalProps {
  budget: Budget | null;
  categories: Category[];
  onClose: () => void;
  onSave: (budget: Budget) => Promise<void>;
}

function BudgetModal({ budget, categories, onClose, onSave }: BudgetModalProps) {
  const [categoryId, setCategoryId] = useState(budget?.categoryId || '');
  const [period, setPeriod] = useState<BudgetPeriod>(budget?.period || 'monthly');
  const [budgetedAmount, setBudgetedAmount] = useState(budget?.budgetedAmount.toString() || '');
  const [rollover, setRollover] = useState(budget?.rollover || false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    
    if (!categoryId || !budgetedAmount) {
      alert('Please fill in required fields');
      return;
    }

    const now = Date.now();
    let endDate: number | undefined = undefined;
    
    if (period === 'monthly') {
      const nextMonth = new Date();
      nextMonth.setMonth(nextMonth.getMonth() + 1);
      endDate = nextMonth.getTime();
    } else if (period === 'quarterly') {
      const nextQuarter = new Date();
      nextQuarter.setMonth(nextQuarter.getMonth() + 3);
      endDate = nextQuarter.getTime();
    } else if (period === 'yearly') {
      const nextYear = new Date();
      nextYear.setFullYear(nextYear.getFullYear() + 1);
      endDate = nextYear.getTime();
    }

    const newBudget: Budget = {
      id: budget?.id || uuidv4(),
      categoryId,
      period,
      budgetedAmount: parseFloat(budgetedAmount),
      rollover,
      startDate: budget?.startDate || now,
      endDate,
      createdAt: budget?.createdAt || now,
      updatedAt: now,
    };

    await onSave(newBudget);
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-navy-800 rounded-lg shadow-xl max-w-md w-full">
        <div className="p-6">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
            {budget ? 'Edit Budget' : 'Add Budget'}
          </h2>
          
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Category *
              </label>
              <select
                value={categoryId}
                onChange={(e) => setCategoryId(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-navy-600 rounded-lg bg-white dark:bg-navy-700 text-gray-900 dark:text-white"
                required
              >
                <option value="">Select a category</option>
                {categories.map(cat => (
                  <option key={cat.id} value={cat.id}>{cat.name}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Period *
              </label>
              <select
                value={period}
                onChange={(e) => setPeriod(e.target.value as BudgetPeriod)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-navy-600 rounded-lg bg-white dark:bg-navy-700 text-gray-900 dark:text-white"
              >
                <option value="monthly">Monthly</option>
                <option value="quarterly">Quarterly</option>
                <option value="yearly">Yearly</option>
                <option value="custom">Custom</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Budgeted Amount *
              </label>
              <input
                type="number"
                value={budgetedAmount}
                onChange={(e) => setBudgetedAmount(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-navy-600 rounded-lg bg-white dark:bg-navy-700 text-gray-900 dark:text-white"
                placeholder="0"
                step="0.01"
                min="0"
                required
              />
            </div>

            <div className="flex items-center">
              <input
                type="checkbox"
                id="rollover"
                checked={rollover}
                onChange={(e) => setRollover(e.target.checked)}
                className="h-4 w-4 text-marigold-600 focus:ring-marigold-500 border-gray-300 rounded"
              />
              <label htmlFor="rollover" className="ml-2 block text-sm text-gray-700 dark:text-gray-300">
                Enable rollover (unused amount carries to next period)
              </label>
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
                {budget ? 'Save Changes' : 'Create Budget'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
