import React, { useState } from 'react';
import { useVault } from '../context/VaultContext';

export default function UnlockPage() {
  const { vaults, unlockVault } = useVault();
  const [selectedVaultId, setSelectedVaultId] = useState(vaults[0]?.id || '');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isUnlocking, setIsUnlocking] = useState(false);

  async function handleUnlock() {
    if (!selectedVaultId) return;
    
    setIsUnlocking(true);
    setError('');

    try {
      const success = await unlockVault(selectedVaultId, password);
      if (!success) {
        setError('Incorrect password');
      }
    } catch (e) {
      setError('Failed to unlock. Please try again.');
    } finally {
      setIsUnlocking(false);
    }
  }

  function handleKeyPress(e: React.KeyboardEvent) {
    if (e.key === 'Enter') {
      handleUnlock();
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-navy-900 flex items-center justify-center px-4">
      <div className="max-w-md w-full">
        {/* Logo */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-navy-900 dark:text-white mb-2">GharKhata</h1>
          <p className="text-gray-600 dark:text-gray-400">Personal & Family Finance Manager</p>
        </div>

        {/* Unlock card */}
        <div className="bg-white dark:bg-navy-800 rounded-lg shadow-lg p-6">
          <h2 className="text-xl font-semibold text-navy-900 dark:text-white mb-4">
            Unlock your vault
          </h2>

          {vaults.length > 1 && (
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Select Vault
              </label>
              <select
                value={selectedVaultId}
                onChange={(e) => setSelectedVaultId(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-navy-700 rounded-lg bg-white dark:bg-navy-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-marigold-400 focus:border-transparent"
              >
                {vaults.map((vault) => (
                  <option key={vault.id} value={vault.id}>
                    {vault.name}
                  </option>
                ))}
              </select>
            </div>
          )}

          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Master Password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Enter your master password"
              className="w-full px-3 py-2 border border-gray-300 dark:border-navy-700 rounded-lg bg-white dark:bg-navy-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-marigold-400 focus:border-transparent"
              autoFocus
            />
          </div>

          {error && (
            <p className="mb-4 text-sm text-red-600 dark:text-red-400">{error}</p>
          )}

          <button
            onClick={handleUnlock}
            disabled={!password || isUnlocking}
            className="w-full bg-marigold-400 hover:bg-marigold-500 disabled:bg-gray-300 disabled:cursor-not-allowed text-white font-medium py-2 px-4 rounded-lg transition-colors"
          >
            {isUnlocking ? 'Unlocking...' : 'Unlock'}
          </button>

          <p className="mt-4 text-xs text-center text-gray-500 dark:text-gray-400">
            Your data is encrypted and stored only on this device
          </p>
        </div>

        {/* Footer */}
        <p className="text-center text-sm text-gray-500 dark:text-gray-400 mt-8">
          Privacy-first • Encrypted • Offline
        </p>
      </div>
    </div>
  );
}
