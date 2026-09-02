import React from 'react';
import { useVault } from '../context/VaultContext';

export default function DashboardPage() {
  const { currentVaultData, privacyMode } = useVault();

  // Format amount with privacy mode support
  function formatAmount(amount: number): string {
    if (privacyMode) return '••••••';
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(amount);
  }

  // Calculate totals
  const totalAssets = currentVaultData?.assets.reduce((sum, asset) => sum + asset.currentValue, 0) || 0;
  const totalLiabilities = currentVaultData?.liabilities.reduce((sum, liab) => sum + liab.outstandingBalance, 0) || 0;
  const netWorth = totalAssets - totalLiabilities;

  const totalLent = currentVaultData?.peopleLedger
    .filter(e => e.type === 'lent')
    .reduce((sum, e) => sum + e.amount, 0) || 0;
  
  const totalBorrowed = currentVaultData?.peopleLedger
    .filter(e => e.type === 'borrowed')
    .reduce((sum, e) => sum + e.amount, 0) || 0;

  return (
    <div className="space-y-6">
      {/* Welcome header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
          Dashboard
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          Overview of your finances
        </p>
      </div>

      {/* Net Worth Card */}
      <div className="bg-white dark:bg-navy-800 rounded-lg shadow p-6">
        <h2 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">
          Net Worth
        </h2>
        <p className={`text-3xl font-bold ${netWorth >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
          {formatAmount(netWorth)}
        </p>
        <div className="mt-4 grid grid-cols-2 gap-4">
          <div>
            <p className="text-xs text-gray-500 dark:text-gray-400">Assets</p>
            <p className="text-lg font-semibold text-gray-900 dark:text-white">{formatAmount(totalAssets)}</p>
          </div>
          <div>
            <p className="text-xs text-gray-500 dark:text-gray-400">Liabilities</p>
            <p className="text-lg font-semibold text-gray-900 dark:text-white">{formatAmount(totalLiabilities)}</p>
          </div>
        </div>
      </div>

      {/* People Ledger Summary */}
      <div className="bg-white dark:bg-navy-800 rounded-lg shadow p-6">
        <h2 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">
          People Ledger
        </h2>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-xs text-gray-500 dark:text-gray-400">Lent Out</p>
            <p className="text-lg font-semibold text-green-600 dark:text-green-400">{formatAmount(totalLent)}</p>
          </div>
          <div>
            <p className="text-xs text-gray-500 dark:text-gray-400">Borrowed</p>
            <p className="text-lg font-semibold text-red-600 dark:text-red-400">{formatAmount(totalBorrowed)}</p>
          </div>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-white dark:bg-navy-800 rounded-lg shadow p-6">
          <h2 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">
            Accounts
          </h2>
          <p className="text-2xl font-bold text-gray-900 dark:text-white">
            {currentVaultData?.accounts.length || 0}
          </p>
        </div>
        <div className="bg-white dark:bg-navy-800 rounded-lg shadow p-6">
          <h2 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">
            Transactions
          </h2>
          <p className="text-2xl font-bold text-gray-900 dark:text-white">
            {currentVaultData?.transactions.length || 0}
          </p>
        </div>
      </div>

      {/* Empty states for first-time users */}
      {!currentVaultData || (
        currentVaultData.accounts.length === 0 &&
        currentVaultData.transactions.length === 0
      ) ? (
        <div className="bg-marigold-400/10 dark:bg-marigold-400/20 border border-marigold-400/20 rounded-lg p-6 text-center">
          <h3 className="text-lg font-semibold text-marigold-600 dark:text-marigold-400 mb-2">
            Get started with your vault
          </h3>
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            Add your first account to start tracking your finances
          </p>
          <button className="bg-marigold-400 hover:bg-marigold-500 text-white font-medium py-2 px-4 rounded-lg transition-colors">
            Add Account
          </button>
        </div>
      ) : null}
    </div>
  );
}
