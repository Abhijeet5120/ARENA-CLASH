// src/data/paymentRequests.ts
'use server';

import { writeDataToFile, readDataFromFile } from '@/lib/localFileStore';
import { getUserById, updateUser, type UserRecord } from './users';
import { addTransaction, type CreateTransactionData } from './transactions';

export interface PaymentRequest {
  id: string; // This IS the user-provided transactionId
  userId: string;
  userEmail: string;
  amount: number;
  status: 'pending' | 'approved' | 'declined';
  requestedDate: string; // ISO string
  processedDate?: string | null;
  adminNotes?: string; // Optional field for notes, e.g., for auto-declined
}

export type CreatePaymentRequestData = Pick<PaymentRequest, 'userId' | 'userEmail' | 'amount'> & {
  transactionId: string; // User-provided transaction ID, will become the 'id'
};

const PAYMENT_REQUESTS_FILE = 'paymentRequests.json'; // Re-added constant

// Each function will read directly to ensure fresh data.
export const getAllPaymentRequests = async (): Promise<PaymentRequest[]> => {
  const currentStore = await readDataFromFile<PaymentRequest[]>(PAYMENT_REQUESTS_FILE, []);
  return JSON.parse(JSON.stringify(currentStore));
};

export const getPendingPaymentRequests = async (): Promise<PaymentRequest[]> => {
  const currentStore = await readDataFromFile<PaymentRequest[]>(PAYMENT_REQUESTS_FILE, []);
  return JSON.parse(JSON.stringify(currentStore.filter(req => req.status === 'pending')));
};

export const getPaymentRequestById = async (id: string): Promise<PaymentRequest | null> => {
  // id here IS the transactionId
  const currentStore = await readDataFromFile<PaymentRequest[]>(PAYMENT_REQUESTS_FILE, []);
  const request = currentStore.find(req => req.id === id);
  return request ? JSON.parse(JSON.stringify(request)) : null;
};

export const getPaymentRequestsByUserId = async (userId: string): Promise<PaymentRequest[]> => {
  const currentStore = await readDataFromFile<PaymentRequest[]>(PAYMENT_REQUESTS_FILE, []);
  const userRequests = currentStore.filter(req => req.userId === userId);
  return JSON.parse(JSON.stringify(userRequests.sort((a, b) => new Date(b.requestedDate).getTime() - new Date(a.requestedDate).getTime())));
};

export const createPaymentRequest = async (data: CreatePaymentRequestData): Promise<PaymentRequest | null> => {
  let currentStore = await readDataFromFile<PaymentRequest[]>(PAYMENT_REQUESTS_FILE, []);

  const existingRequest = currentStore.find(req => req.id === data.transactionId);
  if (existingRequest) {
    throw new Error(`Transaction ID "${data.transactionId}" has already been submitted.`);
  }

  const newRequest: PaymentRequest = {
    id: data.transactionId, // Use transactionId as the main ID
    userId: data.userId,
    userEmail: data.userEmail,
    amount: data.amount,
    status: 'pending',
    requestedDate: new Date().toISOString(),
    processedDate: null,
  };
  currentStore.push(newRequest);
  const success = await writeDataToFile(PAYMENT_REQUESTS_FILE, currentStore);
  return success ? JSON.parse(JSON.stringify(newRequest)) : null;
};

export const approvePaymentRequest = async (requestId: string, userId: string, amount: number): Promise<PaymentRequest | null> => {
  let currentStore = await readDataFromFile<PaymentRequest[]>(PAYMENT_REQUESTS_FILE, []);
  const requestIndex = currentStore.findIndex(req => req.id === requestId && req.status === 'pending');
  if (requestIndex === -1) {
    throw new Error('Payment request not found or not pending.');
  }

  const user = await getUserById(userId);
  if (!user) {
    throw new Error('User not found to credit funds.');
  }

  const currentCredits = user.walletBalance?.credits || 0;
  const updatedUser = await updateUser(userId, {
    walletBalance: {
      ...(user.walletBalance || { winnings: 0, credits: 0 }),
      credits: currentCredits + amount,
      winnings: user.walletBalance?.winnings || 0, 
    },
  });

  if (!updatedUser) {
    throw new Error('Failed to update user wallet.');
  }

  const transactionData: CreateTransactionData = {
    userId,
    type: 'credit_purchase',
    amount: amount,
    currency: 'credits',
    description: `Credits added via payment request. TxID: ${requestId}`,
    relatedId: requestId,
  };
  await addTransaction(transactionData);

  currentStore[requestIndex].status = 'approved';
  currentStore[requestIndex].processedDate = new Date().toISOString();
  await writeDataToFile(PAYMENT_REQUESTS_FILE, currentStore);
  return JSON.parse(JSON.stringify(currentStore[requestIndex]));
};

export const declinePaymentRequest = async (requestId: string): Promise<PaymentRequest | null> => {
  let currentStore = await readDataFromFile<PaymentRequest[]>(PAYMENT_REQUESTS_FILE, []);
  const requestIndex = currentStore.findIndex(req => req.id === requestId && req.status === 'pending');
  if (requestIndex === -1) {
    const alreadyProcessedRequest = currentStore.find(req => req.id === requestId);
    if (alreadyProcessedRequest) {
        if(alreadyProcessedRequest.status === 'declined') return JSON.parse(JSON.stringify(alreadyProcessedRequest));
        if(alreadyProcessedRequest.status === 'approved') throw new Error('Payment request already approved.');
    }
    throw new Error('Payment request not found or not pending.');
  }
  currentStore[requestIndex].status = 'declined';
  currentStore[requestIndex].processedDate = new Date().toISOString();
  await writeDataToFile(PAYMENT_REQUESTS_FILE, currentStore);
  return JSON.parse(JSON.stringify(currentStore[requestIndex]));
};

export const resetAllPaymentRequests_ONLY_FOR_TESTING = async (): Promise<void> => {
  await writeDataToFile(PAYMENT_REQUESTS_FILE, []);
  console.log('All payment requests have been reset (local file store).');
};
