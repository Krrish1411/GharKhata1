import { useState, useEffect } from 'react';
import { v4 as uuidv4 } from 'uuid';
import type { VaultMeta, VaultData, VaultId } from '../types';
import { deriveKey, encryptData, decryptData, createPasswordVerifier, verifyPassword, generateSalt } from '../crypto/encryption';
import { createVault, getVault, getAllVaults, deleteVault, addEncryptedRecord, getAllEncryptedRecordsByVault } from '../db/database';
import type { ReactNode } from 'react';

interface VaultContextType {
  vaults: VaultMeta[];
  currentVaultId: VaultId | null;
  currentVaultData: VaultData | null;
  isUnlocked: boolean;
  privacyMode: boolean;
  createVault: (name: string, password: string, baseCurrency?: string) => Promise<void>;
  unlockVault: (vaultId: VaultId, password: string) => Promise<boolean>;
  lockVault: () => void;
  switchVault: (vaultId: VaultId | null) => void;
  togglePrivacyMode: () => void;
  verifyPrivacyModePassword: (password: string) => Promise<boolean>;
  saveRecord: <T>(recordType: string, record: T) => Promise<void>;
  updateRecord: <T>(recordType: string, id: string, record: T) => Promise<void>;
  deleteRecord: (recordType: string, id: string) => Promise<void>;
  deleteVaultById: (vaultId: VaultId) => Promise<void>;
}

const VaultContext = createContext<VaultContextType | undefined>(undefined);

export function VaultProvider({ children }: { children: ReactNode }) {
  const [vaults, setVaults] = useState<VaultMeta[]>([]);
  const [currentVaultId, setCurrentVaultId] = useState<VaultId | null>(null);
  const [currentVaultData, setCurrentVaultData] = useState<VaultData | null>(null);
  const [isUnlocked, setIsUnlocked] = useState(false);
  const [privacyMode, setPrivacyMode] = useState(false);
  const [sessionKey, setSessionKey] = useState<CryptoKey | null>(null);
  const [currentVaultMeta, setCurrentVaultMeta] = useState<VaultMeta | null>(null);

  useEffect(() => {
    loadVaults();
  }, []);

  async function loadVaults() {
    const vaultList = await getAllVaults();
    setVaults(vaultList.map(v => ({
      id: v.id,
      name: v.name,
      salt: v.salt,
      passwordVerifier: v.passwordVerifier,
      createdDate: v.createdDate,
      baseCurrency: v.baseCurrency,
      numberFormat: v.numberFormat,
      financialYearStart: v.financialYearStart,
      autoLockTimeout: v.autoLockTimeout,
    })));
  }

  async function createVaultFn(name: string, password: string, baseCurrency: string = 'INR'): Promise<void> {
    const salt = await generateSalt();
    const key = await deriveKey(password, salt);
    const passwordVerifier = await createPasswordVerifier(key);
    
    const vaultId = uuidv4();

    await createVault({
      id: vaultId,
      name,
      salt,
      passwordVerifier,
      createdDate: Date.now(),
      baseCurrency,
      numberFormat: 'indian',
      financialYearStart: 3,
      autoLockTimeout: 5,
    });

    await loadVaults();
  }

  async function unlockVaultFn(vaultId: VaultId, password: string): Promise<boolean> {
    const vault = await getVault(vaultId);
    if (!vault) return false;

    const isValid = await verifyPassword(vault.passwordVerifier, password, vault.salt);
    if (!isValid) return false;

    const key = await deriveKey(password, vault.salt);
    setSessionKey(key);
    setCurrentVaultId(vaultId);
    setCurrentVaultMeta({
      id: vault.id,
      name: vault.name,
      salt: vault.salt,
      passwordVerifier: vault.passwordVerifier,
      createdDate: vault.createdDate,
      baseCurrency: vault.baseCurrency,
      numberFormat: vault.numberFormat,
      financialYearStart: vault.financialYearStart,
      autoLockTimeout: vault.autoLockTimeout,
    });
    setIsUnlocked(true);
    setPrivacyMode(false);

    await decryptVaultData(vaultId, key);

    return true;
  }

  async function decryptVaultData(vaultId: VaultId, key: CryptoKey) {
    const allRecords = await getAllEncryptedRecordsByVault(vaultId);
    
    const data: VaultData = {
      accounts: [],
      transactions: [],
      categories: [],
      peopleLedger: [],
      budgets: [],
      assets: [],
      liabilities: [],
      documents: [],
    };

    for (const record of allRecords) {
      try {
        const decrypted = await decryptData(record.iv, record.ciphertext, key);
        const parsed = JSON.parse(decrypted);
        
        switch (record.recordType) {
          case 'account':
            data.accounts.push(parsed);
            break;
          case 'transaction':
            data.transactions.push(parsed);
            break;
          case 'category':
            data.categories.push(parsed);
            break;
          case 'peopleLedger':
            data.peopleLedger.push(parsed);
            break;
          case 'budget':
            data.budgets.push(parsed);
            break;
          case 'asset':
            data.assets.push(parsed);
            break;
          case 'liability':
            data.liabilities.push(parsed);
            break;
          case 'document':
            data.documents.push(parsed);
            break;
        }
      } catch (e) {
        console.error('Failed to decrypt record:', record.id, e);
      }
    }

    setCurrentVaultData(data);
  }

  function lockVaultFn() {
    setSessionKey(null);
    setCurrentVaultId(null);
    setCurrentVaultMeta(null);
    setCurrentVaultData(null);
    setIsUnlocked(false);
    setPrivacyMode(false);
  }

  function switchVaultFn(vaultId: VaultId | null) {
    if (vaultId === null) {
      lockVaultFn();
    } else if (vaultId !== currentVaultId) {
      lockVaultFn();
    }
  }

  function togglePrivacyModeFn() {
    setPrivacyMode(!privacyMode);
  }

  async function verifyPrivacyModePasswordFn(password: string): Promise<boolean> {
    if (!currentVaultMeta) return false;
    return verifyPassword(currentVaultMeta.passwordVerifier, password, currentVaultMeta.salt);
  }

  async function saveRecordFn<T>(recordType: string, record: T): Promise<void> {
    if (!sessionKey || !currentVaultId) throw new Error('Vault not unlocked');

    const encrypted = await encryptData(JSON.stringify(record), sessionKey);
    
    await addEncryptedRecord({
      id: (record as any).id,
      vaultId: currentVaultId,
      recordType,
      iv: encrypted.iv,
      ciphertext: encrypted.ciphertext,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });

    if (currentVaultData) {
      const newData = { ...currentVaultData };
      const arrayKey = getArrayKey(recordType);
      if (arrayKey) {
        (newData as any)[arrayKey] = [...(newData as any)[arrayKey], record];
        setCurrentVaultData(newData);
      }
    }
  }

  async function updateRecordFn<T>(recordType: string, id: string, record: T): Promise<void> {
    if (!sessionKey || !currentVaultId) throw new Error('Vault not unlocked');

    const encrypted = await encryptData(JSON.stringify(record), sessionKey);
    
    await addEncryptedRecord({
      id,
      vaultId: currentVaultId,
      recordType,
      iv: encrypted.iv,
      ciphertext: encrypted.ciphertext,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });

    if (currentVaultData) {
      setCurrentVaultData({ ...currentVaultData });
    }
  }

  async function deleteRecordFn(recordType: string, id: string): Promise<void> {
    if (!currentVaultId) throw new Error('Vault not unlocked');
    
    if (currentVaultData) {
      const newData = { ...currentVaultData };
      const arrayKey = getArrayKey(recordType);
      if (arrayKey) {
        (newData as any)[arrayKey] = (newData as any)[arrayKey].filter((r: any) => r.id !== id);
        setCurrentVaultData(newData);
      }
    }
  }

  async function deleteVaultByIdFn(vaultId: VaultId): Promise<void> {
    await deleteVault(vaultId);
    if (currentVaultId === vaultId) {
      lockVaultFn();
    }
    await loadVaults();
  }

  function getArrayKey(recordType: string): string {
    switch (recordType) {
      case 'account': return 'accounts';
      case 'transaction': return 'transactions';
      case 'category': return 'categories';
      case 'peopleLedger': return 'peopleLedger';
      case 'budget': return 'budgets';
      case 'asset': return 'assets';
      case 'liability': return 'liabilities';
      case 'document': return 'documents';
      default: return '';
    }
  }

  return (
    <VaultContext.Provider
      value={{
        vaults,
        currentVaultId,
        currentVaultData,
        isUnlocked,
        privacyMode,
        createVault: createVaultFn,
        unlockVault: unlockVaultFn,
        lockVault: lockVaultFn,
        switchVault: switchVaultFn,
        togglePrivacyMode: togglePrivacyModeFn,
        verifyPrivacyModePassword: verifyPrivacyModePasswordFn,
        saveRecord: saveRecordFn,
        updateRecord: updateRecordFn,
        deleteRecord: deleteRecordFn,
        deleteVaultById: deleteVaultByIdFn,
      }}
    >
      {children}
    </VaultContext.Provider>
  );
}

import { createContext, useContext } from 'react';

export function useVault() {
  const context = useContext(VaultContext);
  if (context === undefined) {
    throw new Error('useVault must be used within a VaultProvider');
  }
  return context;
}
