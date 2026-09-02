import { useState } from 'react';
import { useVault } from '../context/VaultContext';

export default function OnboardingPage() {
  const { createVault } = useVault();
  const [step, setStep] = useState(1);
  const [vaultName, setVaultName] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [baseCurrency, setBaseCurrency] = useState('INR');
  const [error, setError] = useState('');
  const [isCreating, setIsCreating] = useState(false);

  const passwordStrength = getPasswordStrength(password);

  function getPasswordStrength(pwd: string): number {
    let strength = 0;
    if (pwd.length >= 8) strength++;
    if (pwd.length >= 12) strength++;
    if (/[a-z]/.test(pwd) && /[A-Z]/.test(pwd)) strength++;
    if (/\d/.test(pwd)) strength++;
    if (/[^a-zA-Z0-9]/.test(pwd)) strength++;
    return strength;
  }

  async function handleCreateVault() {
    if (!vaultName.trim()) {
      setError('Please enter a vault name');
      return;
    }
    if (password.length < 8) {
      setError('Password must be at least 8 characters');
      return;
    }
    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    setIsCreating(true);
    setError('');

    try {
      await createVault(vaultName.trim(), password, baseCurrency);
    } catch {
      setError('Failed to create vault. Please try again.');
    } finally {
      setIsCreating(false);
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-navy-900 flex items-center justify-center px-4">
      <div className="max-w-md w-full">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-navy-900 dark:text-white mb-2">GharKhata</h1>
          <p className="text-gray-600 dark:text-gray-400">Personal & Family Finance Manager</p>
        </div>

        <div className="flex justify-center mb-8">
          <div className="flex space-x-2">
            {[1, 2, 3].map((s) => (
              <div
                key={s}
                className={`w-3 h-3 rounded-full transition-colors ${
                  s <= step ? 'bg-marigold-400' : 'bg-gray-300 dark:bg-gray-600'
                }`}
              />
            ))}
          </div>
        </div>

        <div className="bg-white dark:bg-navy-800 rounded-lg shadow-lg p-6">
          {step === 1 && (
            <>
              <h2 className="text-xl font-semibold text-navy-900 dark:text-white mb-4">
                Welcome! Let's set up your vault
              </h2>
              <p className="text-gray-600 dark:text-gray-400 mb-6">
                Your vault is encrypted and stored only on this device.
              </p>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Vault Name
                  </label>
                  <input
                    type="text"
                    value={vaultName}
                    onChange={(e) => setVaultName(e.target.value)}
                    placeholder="My Vault"
                    className="w-full px-3 py-2 border border-gray-300 dark:border-navy-700 rounded-lg bg-white dark:bg-navy-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-marigold-400 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Base Currency
                  </label>
                  <select
                    value={baseCurrency}
                    onChange={(e) => setBaseCurrency(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-navy-700 rounded-lg bg-white dark:bg-navy-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-marigold-400 focus:border-transparent"
                  >
                    <option value="INR">₹ INR - Indian Rupee</option>
                    <option value="USD">$ USD - US Dollar</option>
                    <option value="EUR">€ EUR - Euro</option>
                    <option value="GBP">£ GBP - British Pound</option>
                  </select>
                </div>
              </div>

              <button
                onClick={() => setStep(2)}
                disabled={!vaultName.trim()}
                className="w-full mt-6 bg-marigold-400 hover:bg-marigold-500 disabled:bg-gray-300 disabled:cursor-not-allowed text-white font-medium py-2 px-4 rounded-lg transition-colors"
              >
                Continue
              </button>
            </>
          )}

          {step === 2 && (
            <>
              <h2 className="text-xl font-semibold text-navy-900 dark:text-white mb-4">
                Set your master password
              </h2>
              <p className="text-gray-600 dark:text-gray-400 mb-6">
                This password encrypts all your data. Make it strong and memorable!
              </p>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Password
                  </label>
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-navy-700 rounded-lg bg-white dark:bg-navy-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-marigold-400 focus:border-transparent"
                  />
                  
                  {password.length > 0 && (
                    <div className="mt-2">
                      <div className="flex space-x-1">
                        {[1, 2, 3, 4, 5].map((level) => (
                          <div
                            key={level}
                            className={`h-1 flex-1 rounded-full transition-colors ${
                              level <= passwordStrength
                                ? level <= 2 ? 'bg-red-500' : level <= 4 ? 'bg-yellow-500' : 'bg-green-500'
                                : 'bg-gray-200 dark:bg-gray-600'
                            }`}
                          />
                        ))}
                      </div>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                        {passwordStrength <= 2 ? 'Weak' : passwordStrength <= 4 ? 'Medium' : 'Strong'} password
                      </p>
                    </div>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Confirm Password
                  </label>
                  <input
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-navy-700 rounded-lg bg-white dark:bg-navy-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-marigold-400 focus:border-transparent"
                  />
                </div>
              </div>

              {error && <p className="mt-4 text-sm text-red-600 dark:text-red-400">{error}</p>}

              <div className="flex space-x-3 mt-6">
                <button
                  onClick={() => setStep(1)}
                  className="flex-1 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-800 dark:text-white font-medium py-2 px-4 rounded-lg transition-colors"
                >
                  Back
                </button>
                <button
                  onClick={() => setStep(3)}
                  disabled={password.length < 8 || password !== confirmPassword}
                  className="flex-1 bg-marigold-400 hover:bg-marigold-500 disabled:bg-gray-300 disabled:cursor-not-allowed text-white font-medium py-2 px-4 rounded-lg transition-colors"
                >
                  Continue
                </button>
              </div>
            </>
          )}

          {step === 3 && (
            <>
              <h2 className="text-xl font-semibold text-navy-900 dark:text-white mb-4">
                Ready to create your vault
              </h2>
              <p className="text-gray-600 dark:text-gray-400 mb-6">
                Your vault will be named "<strong>{vaultName}</strong>" and use <strong>{baseCurrency}</strong>.
              </p>

              <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4 mb-6">
                <p className="text-sm text-blue-800 dark:text-blue-300">
                  <strong>Remember:</strong> There is no password recovery!
                </p>
              </div>

              {error && <p className="mb-4 text-sm text-red-600 dark:text-red-400">{error}</p>}

              <div className="flex space-x-3">
                <button
                  onClick={() => setStep(2)}
                  disabled={isCreating}
                  className="flex-1 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-800 dark:text-white font-medium py-2 px-4 rounded-lg transition-colors disabled:opacity-50"
                >
                  Back
                </button>
                <button
                  onClick={handleCreateVault}
                  disabled={isCreating}
                  className="flex-1 bg-marigold-400 hover:bg-marigold-500 disabled:bg-gray-300 disabled:cursor-not-allowed text-white font-medium py-2 px-4 rounded-lg transition-colors"
                >
                  {isCreating ? 'Creating...' : 'Create Vault'}
                </button>
              </div>
            </>
          )}
        </div>

        <p className="text-center text-sm text-gray-500 dark:text-gray-400 mt-8">
          Privacy-first • Encrypted • Offline
        </p>
      </div>
    </div>
  );
}
