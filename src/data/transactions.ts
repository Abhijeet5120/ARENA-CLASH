// src/data/transactions.ts
'use server';

import { writeDataToFile, readDataFromFile } from '@/lib/localFileStore';

export type TransactionType = 
  | 'credit_purchase' 
  | 'tournament_entry' 
  | 'winnings_payout' 
  | 'admin_credit_adjustment' 
  | 'admin_winnings_adjustment';

export interface Transaction {
  id: string;
  userId: string;
  type: TransactionType;
  amount: number; // Positive for additions, negative for deductions
  currency: 'credits' | 'winnings' | 'mixed' | 'usd'; // 'mixed' if entry fee uses both, 'usd' for direct currency amounts
  description: string;
  date: string; // ISO string
  relatedId?: string; // e.g., tournamentId, paymentRequestId
}

export type CreateTransactionData = Omit<Transaction, 'id' | 'date'>;

const TRANSACTIONS_FILE = 'transactions.json';

const generateLocalId = () => `tx-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;

// --- Data Access Functions ---

export const getAllTransactions = async (): Promise<Transaction[]> => {
  const store = await readDataFromFile<Transaction[]>(TRANSACTIONS_FILE, []);
  return JSON.parse(JSON.stringify(store));
};

export const getTransactionsByUserId = async (userId: string): Promise<Transaction[]> => {
  const store = await readDataFromFile<Transaction[]>(TRANSACTIONS_FILE, []);
  const filtered = store.filter(tx => tx.userId === userId);
  return JSON.parse(JSON.stringify(filtered.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())));
};

// --- Data Modification Functions ---

export const addTransaction = async (transactionDetails: CreateTransactionData): Promise<Transaction> => {
  let currentStore = await readDataFromFile<Transaction[]>(TRANSACTIONS_FILE, []);
  const newTransaction: Transaction = {
    id: generateLocalId(),
    ...transactionDetails,
    date: new Date().toISOString(),
  };

  currentStore.push(newTransaction);
  const success = await writeDataToFile(TRANSACTIONS_FILE, currentStore);
  if (!success) {
    throw new Error("Failed to save new transaction to file.");
  }
  return JSON.parse(JSON.stringify(newTransaction));
};

// For testing/reset purposes
export const resetAllTransactions_ONLY_FOR_TESTING = async (): Promise<void> => {
  await writeDataToFile(TRANSACTIONS_FILE, []);
  console.log('All transactions have been reset (local file store).');
};
