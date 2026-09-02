// Core Types for GharKhata Finance Manager

export type VaultId = string;
export type RecordId = string;

export interface VaultMeta {
  id: VaultId;
  name: string;
  salt: string; // base64 encoded
  passwordVerifier: string; // encrypted known string for verification
  createdDate: number;
  baseCurrency: string;
  numberFormat: 'indian' | 'international';
  financialYearStart: number; // month (0-11, default 3 for April)
  autoLockTimeout: number; // minutes
}

export interface EncryptedRecord {
  id: RecordId;
  vaultId: VaultId;
  iv: string; // base64 encoded initialization vector
  ciphertext: string; // base64 encoded encrypted data
  createdAt: number;
  updatedAt: number;
}

export interface Account {
  id: RecordId;
  name: string;
  type: 'bank' | 'cash' | 'card' | 'wallet' | 'upi' | 'other';
  currency: string;
  balance: number;
  visibleOnDashboard: boolean;
  tag: 'personal' | 'household';
  createdAt: number;
  updatedAt: number;
}

export interface Category {
  id: RecordId;
  name: string;
  icon: string;
  type: 'income' | 'expense';
  parentCategoryId?: RecordId;
  essential: boolean;
  createdAt: number;
  updatedAt: number;
}

export interface Transaction {
  id: RecordId;
  date: number; // timestamp
  amount: number;
  currency: string;
  accountId: RecordId;
  categoryId: RecordId;
  subcategoryId?: RecordId;
  note: string;
  tags: string[];
  attachmentIds: RecordId[];
  recurring: boolean;
  recurringSchedule?: RecurringSchedule;
  createdAt: number;
  updatedAt: number;
}

export interface RecurringSchedule {
  frequency: 'daily' | 'weekly' | 'monthly' | 'quarterly' | 'yearly';
  nextDate: number;
  endDate?: number;
}

export interface PeopleLedgerEntry {
  id: RecordId;
  contactName: string;
  type: 'lent' | 'borrowed' | 'holding';
  amount: number;
  originalAmount: number;
  currency: string;
  date: number;
  dueDate?: number;
  interestRate?: number;
  status: 'open' | 'partially-settled' | 'closed';
  settlementHistory: Settlement[];
  note: string;
  createdAt: number;
  updatedAt: number;
}

export interface Settlement {
  id: RecordId;
  amount: number;
  date: number;
  note: string;
}

export interface Budget {
  id: RecordId;
  categoryId: RecordId;
  period: 'monthly' | 'quarterly' | 'yearly' | 'custom';
  budgetedAmount: number;
  rollover: boolean;
  startDate: number;
  endDate?: number;
  createdAt: number;
  updatedAt: number;
}

export interface Asset {
  id: RecordId;
  type: 'property' | 'vehicle' | 'gold' | 'fd-rd' | 'mutual-fund' | 'stock' | 'epf-ppf-nps' | 'insurance' | 'chit-fund' | 'other';
  name: string;
  currentValue: number;
  valueHistory: ValueHistoryEntry[];
  notes: string;
  createdAt: number;
  updatedAt: number;
}

export interface ValueHistoryEntry {
  date: number;
  value: number;
  note?: string;
}

export interface Liability {
  id: RecordId;
  type: 'home-loan' | 'car-loan' | 'personal-loan' | 'education-loan' | 'credit-card' | 'other';
  lender: string;
  principal: number;
  outstandingBalance: number;
  interestRate: number;
  emiAmount: number;
  nextDueDate: number;
  tenureRemaining: number; // months
  createdAt: number;
  updatedAt: number;
}

export interface Document {
  id: RecordId;
  linkedRecordId?: RecordId;
  linkedRecordType?: 'asset' | 'liability' | 'account';
  fileName: string;
  fileType: string;
  fileSize: number;
  fileBlob: string; // base64 encoded encrypted file
  expiryDate?: number;
  createdAt: number;
  updatedAt: number;
}

export interface CurrencyRate {
  code: string;
  name: string;
  rateToBase: number;
}

export interface AppSettings {
  theme: 'light' | 'dark' | 'system';
  currencies: CurrencyRate[];
  numberFormat: 'indian' | 'international';
  financialYearStart: number;
  autoLockTimeout: number;
}

export interface VaultData {
  accounts: Account[];
  transactions: Transaction[];
  categories: Category[];
  peopleLedger: PeopleLedgerEntry[];
  budgets: Budget[];
  assets: Asset[];
  liabilities: Liability[];
  documents: Document[];
}
