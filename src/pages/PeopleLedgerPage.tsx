import { useVault } from '../context/VaultContext';
import { useState } from 'react';
import { v4 as uuidv4 } from 'uuid';
import type { PeopleLedgerEntry, Settlement } from '../types';

type EntryType = 'lent' | 'borrowed' | 'holding';

export default function PeopleLedgerPage() {
  const { currentVaultData, saveRecord, updateRecord, deleteRecord, privacyMode } = useVault();
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedContact, setSelectedContact] = useState<string | null>(null);

  // Format amount with privacy mode support
  function formatAmount(amount: number): string {
    if (privacyMode) return '••••••';
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(amount);
  }

  // Get unique contacts
  const contacts = Array.from(
    new Set(currentVaultData?.peopleLedger.map(e => e.contactName) || [])
  ).sort();

  // Filter by contact if selected
  const filteredEntries = selectedContact
    ? currentVaultData?.peopleLedger.filter(e => e.contactName === selectedContact) || []
    : currentVaultData?.peopleLedger || [];

  // Calculate totals
  const totalLent = currentVaultData?.peopleLedger
    .filter(e => e.type === 'lent' && e.status !== 'closed')
    .reduce((sum, e) => sum + e.amount, 0) || 0;
  
  const totalBorrowed = currentVaultData?.peopleLedger
    .filter(e => e.type === 'borrowed' && e.status !== 'closed')
    .reduce((sum, e) => sum + e.amount, 0) || 0;
  
  const totalHolding = currentVaultData?.peopleLedger
    .filter(e => e.type === 'holding' && e.status !== 'closed')
    .reduce((sum, e) => sum + e.amount, 0) || 0;

  function getStatusColor(status: string): string {
    switch (status) {
      case 'open': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400';
      case 'partially-settled': return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400';
      case 'closed': return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400';
    }
  }

  function getTypeLabel(type: string): string {
    switch (type) {
      case 'lent': return 'Lent Out';
      case 'borrowed': return 'Borrowed';
      case 'holding': return 'Holding For';
      default: return type;
    }
  }

  function getTypeColor(type: string): string {
    switch (type) {
      case 'lent': return 'text-green-600 dark:text-green-400';
      case 'borrowed': return 'text-red-600 dark:text-red-400';
      case 'holding': return 'text-blue-600 dark:text-blue-400';
      default: return 'text-gray-600 dark:text-gray-400';
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
            People Ledger
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Track informal lending & borrowing
          </p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="bg-marigold-400 hover:bg-marigold-500 text-white font-medium py-2 px-4 rounded-lg transition-colors"
        >
          Add Entry
        </button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white dark:bg-navy-800 rounded-lg shadow p-6">
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">Total Lent Out</p>
          <p className="text-2xl font-bold text-green-600 dark:text-green-400">{formatAmount(totalLent)}</p>
        </div>
        <div className="bg-white dark:bg-navy-800 rounded-lg shadow p-6">
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">Total Borrowed</p>
          <p className="text-2xl font-bold text-red-600 dark:text-red-400">{formatAmount(totalBorrowed)}</p>
        </div>
        <div className="bg-white dark:bg-navy-800 rounded-lg shadow p-6">
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">Holding For Others</p>
          <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">{formatAmount(totalHolding)}</p>
        </div>
      </div>

      {/* Contact Filter */}
      {contacts.length > 0 && (
        <div className="bg-white dark:bg-navy-800 rounded-lg shadow p-4">
          <div className="flex items-center space-x-2 overflow-x-auto">
            <button
              onClick={() => setSelectedContact(null)}
              className={`px-3 py-1 rounded-full text-sm font-medium whitespace-nowrap ${
                !selectedContact
                  ? 'bg-marigold-400 text-white'
                  : 'bg-gray-100 dark:bg-navy-700 text-gray-700 dark:text-gray-300'
              }`}
            >
              All Contacts
            </button>
            {contacts.map(contact => (
              <button
                key={contact}
                onClick={() => setSelectedContact(contact)}
                className={`px-3 py-1 rounded-full text-sm font-medium whitespace-nowrap ${
                  selectedContact === contact
                    ? 'bg-marigold-400 text-white'
                    : 'bg-gray-100 dark:bg-navy-700 text-gray-700 dark:text-gray-300'
                }`}
              >
                {contact}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Entries List */}
      <div className="bg-white dark:bg-navy-800 rounded-lg shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-navy-700">
            <thead className="bg-gray-50 dark:bg-navy-900">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Contact
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Type
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Amount
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Date
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-navy-800 divide-y divide-gray-200 dark:divide-navy-700">
              {filteredEntries.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-8 text-center text-gray-500 dark:text-gray-400">
                    No entries found. Add your first entry to get started.
                  </td>
                </tr>
              ) : (
                filteredEntries.map(entry => (
                  <tr key={entry.id} className="hover:bg-gray-50 dark:hover:bg-navy-700/50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900 dark:text-white">{entry.contactName}</div>
                      {entry.note && (
                        <div className="text-sm text-gray-500 dark:text-gray-400 truncate max-w-xs">{entry.note}</div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`text-sm font-medium ${getTypeColor(entry.type)}`}>
                        {getTypeLabel(entry.type)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`text-sm font-bold ${entry.type === 'lent' ? 'text-green-600 dark:text-green-400' : entry.type === 'borrowed' ? 'text-red-600 dark:text-red-400' : 'text-blue-600 dark:text-blue-400'}`}>
                        {formatAmount(entry.amount)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                      {new Date(entry.date).toLocaleDateString('en-IN')}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(entry.status)}`}>
                        {entry.status.replace('-', ' ')}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <button
                        onClick={() => handleSettle(entry)}
                        className="text-marigold-600 hover:text-marigold-900 dark:text-marigold-400 dark:hover:text-marigold-300 mr-3"
                      >
                        Settle
                      </button>
                      <button
                        onClick={() => handleDelete(entry.id)}
                        className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300"
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Entry Modal */}
      {showAddModal && (
        <AddEntryModal
          onClose={() => setShowAddModal(false)}
          onSave={async (entry) => {
            await saveRecord('peopleLedger', entry);
            setShowAddModal(false);
          }}
        />
      )}
    </div>
  );

  async function handleSettle(entry: PeopleLedgerEntry) {
    const amountStr = prompt(`Enter settlement amount (max: ${formatAmount(entry.amount)}):`);
    if (!amountStr) return;
    
    const amount = parseFloat(amountStr);
    if (isNaN(amount) || amount <= 0 || amount > entry.amount) {
      alert('Invalid amount');
      return;
    }

    const note = prompt('Settlement note (optional):') || '';
    
    const settlement: Settlement = {
      id: uuidv4(),
      amount,
      date: Date.now(),
      note,
    };

    const remainingAmount = entry.amount - amount;
    const updatedEntry: PeopleLedgerEntry = {
      ...entry,
      amount: remainingAmount,
      status: remainingAmount === 0 ? 'closed' : 'partially-settled',
      settlementHistory: [...entry.settlementHistory, settlement],
      updatedAt: Date.now(),
    };

    await updateRecord('peopleLedger', entry.id, updatedEntry);
  }

  async function handleDelete(id: string) {
    if (confirm('Are you sure you want to delete this entry?')) {
      await deleteRecord('peopleLedger', id);
    }
  }
}

interface AddEntryModalProps {
  onClose: () => void;
  onSave: (entry: PeopleLedgerEntry) => Promise<void>;
}

function AddEntryModal({ onClose, onSave }: AddEntryModalProps) {
  const [contactName, setContactName] = useState('');
  const [type, setType] = useState<EntryType>('lent');
  const [amount, setAmount] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [dueDate, setDueDate] = useState('');
  const [interestRate, setInterestRate] = useState('');
  const [note, setNote] = useState('');

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    
    if (!contactName || !amount || !date) {
      alert('Please fill in required fields');
      return;
    }

    const entry: PeopleLedgerEntry = {
      id: uuidv4(),
      contactName,
      type,
      amount: parseFloat(amount),
      originalAmount: parseFloat(amount),
      currency: 'INR',
      date: new Date(date).getTime(),
      dueDate: dueDate ? new Date(dueDate).getTime() : undefined,
      interestRate: interestRate ? parseFloat(interestRate) : undefined,
      status: 'open',
      settlementHistory: [],
      note,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };

    await onSave(entry);
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-navy-800 rounded-lg shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">Add People Ledger Entry</h2>
          
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Contact Name *
              </label>
              <input
                type="text"
                value={contactName}
                onChange={(e) => setContactName(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-navy-600 rounded-lg bg-white dark:bg-navy-700 text-gray-900 dark:text-white"
                placeholder="e.g., Rahul Sharma"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Entry Type *
              </label>
              <select
                value={type}
                onChange={(e) => setType(e.target.value as EntryType)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-navy-600 rounded-lg bg-white dark:bg-navy-700 text-gray-900 dark:text-white"
              >
                <option value="lent">Money I Lent Out</option>
                <option value="borrowed">Money I Borrowed</option>
                <option value="holding">Money I'm Holding For Someone</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Amount *
              </label>
              <input
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-navy-600 rounded-lg bg-white dark:bg-navy-700 text-gray-900 dark:text-white"
                placeholder="0"
                step="0.01"
                min="0"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Date *
              </label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-navy-600 rounded-lg bg-white dark:bg-navy-700 text-gray-900 dark:text-white"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Due Date (optional)
              </label>
              <input
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-navy-600 rounded-lg bg-white dark:bg-navy-700 text-gray-900 dark:text-white"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Interest Rate % (optional)
              </label>
              <input
                type="number"
                value={interestRate}
                onChange={(e) => setInterestRate(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-navy-600 rounded-lg bg-white dark:bg-navy-700 text-gray-900 dark:text-white"
                placeholder="0"
                step="0.1"
                min="0"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Note (optional)
              </label>
              <textarea
                value={note}
                onChange={(e) => setNote(e.target.value)}
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
                Add Entry
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
