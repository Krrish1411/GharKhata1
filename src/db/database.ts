// Database setup using Dexie.js (IndexedDB wrapper)

import Dexie from 'dexie';
import type { VaultId, RecordId } from '../types';

export interface VaultMetaTable {
  id: VaultId;
  name: string;
  salt: string;
  passwordVerifier: string;
  createdDate: number;
  baseCurrency: string;
  numberFormat: 'indian' | 'international';
  financialYearStart: number;
  autoLockTimeout: number;
}

export interface EncryptedRecordTable {
  id: RecordId;
  vaultId: VaultId;
  recordType: string;
  iv: string;
  ciphertext: string;
  createdAt: number;
  updatedAt: number;
}

class GharKhataDB extends Dexie {
  vaults!: Dexie.Table<VaultMetaTable, VaultId>;
  encryptedRecords!: Dexie.Table<EncryptedRecordTable, RecordId>;

  constructor() {
    super('GharKhataDB');
    
    this.version(1).stores({
      vaults: 'id, name, createdDate',
      encryptedRecords: 'id, vaultId, recordType, createdAt, updatedAt',
    });
  }
}

export const db = new GharKhataDB();

export async function createVault(meta: VaultMetaTable): Promise<void> {
  await db.vaults.add(meta);
}

export async function getVault(id: VaultId): Promise<VaultMetaTable | undefined> {
  return db.vaults.get(id);
}

export async function getAllVaults(): Promise<VaultMetaTable[]> {
  return db.vaults.toArray();
}

export async function updateVault(id: VaultId, updates: Partial<VaultMetaTable>): Promise<void> {
  await db.vaults.update(id, updates);
}

export async function deleteVault(id: VaultId): Promise<void> {
  await db.encryptedRecords.where('vaultId').equals(id).delete();
  await db.vaults.delete(id);
}

export async function addEncryptedRecord(record: EncryptedRecordTable): Promise<RecordId> {
  return db.encryptedRecords.add(record);
}

export async function getEncryptedRecordsByVaultAndType(
  vaultId: VaultId,
  recordType: string
): Promise<EncryptedRecordTable[]> {
  return db.encryptedRecords.where({ vaultId, recordType }).toArray();
}

export async function getEncryptedRecord(id: RecordId): Promise<EncryptedRecordTable | undefined> {
  return db.encryptedRecords.get(id);
}

export async function updateEncryptedRecord(
  id: RecordId,
  updates: Partial<EncryptedRecordTable>
): Promise<void> {
  await db.encryptedRecords.update(id, updates);
}

export async function deleteEncryptedRecord(id: RecordId): Promise<void> {
  await db.encryptedRecords.delete(id);
}

export async function getAllEncryptedRecordsByVault(vaultId: VaultId): Promise<EncryptedRecordTable[]> {
  return db.encryptedRecords.where('vaultId').equals(vaultId).toArray();
}
