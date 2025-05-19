// src/data/qrCodeMappings.ts
'use server';

import { writeDataToFile, readDataFromFile } from '@/lib/localFileStore';

export interface QRCodeMapping {
  id: string; // e.g., "amount_50", "amount_100"
  amount: number;
  qrCodeDataUri: string; // Store as data URI or a link to an uploaded image
  description?: string; // Optional description
}

const QR_CODE_MAPPINGS_FILE = 'qrCodeMappings.json';
let qrCodeMappingsStore: QRCodeMapping[] = [];

const defaultMappings: QRCodeMapping[] = [
  { id: 'amount_50', amount: 50, qrCodeDataUri: 'https://placehold.co/250x250.png?text=Scan+for+50+Credits', description: 'QR Code for 50 Credits' },
  { id: 'amount_100', amount: 100, qrCodeDataUri: 'https://placehold.co/250x250.png?text=Scan+for+100+Credits', description: 'QR Code for 100 Credits' },
  { id: 'amount_150', amount: 150, qrCodeDataUri: 'https://placehold.co/250x250.png?text=Scan+for+150+Credits', description: 'QR Code for 150 Credits' },
];

const initializeStore = async () => {
  qrCodeMappingsStore = await readDataFromFile<QRCodeMapping[]>(QR_CODE_MAPPINGS_FILE, []);
  if (qrCodeMappingsStore.length === 0 && defaultMappings.length > 0) {
    qrCodeMappingsStore = [...defaultMappings];
    await writeDataToFile(QR_CODE_MAPPINGS_FILE, qrCodeMappingsStore);
  } else if (qrCodeMappingsStore.length > 0) { 
    let storeChanged = false;
    for (const defMap of defaultMappings) {
        if (!qrCodeMappingsStore.find(m => m.amount === defMap.amount)) {
            qrCodeMappingsStore.push(defMap);
            storeChanged = true;
        }
    }
    if (storeChanged) {
      await writeDataToFile(QR_CODE_MAPPINGS_FILE, qrCodeMappingsStore);
    }
  }
};

if (typeof process !== 'undefined' && process.env.NODE_ENV !== 'test') {
  initializeStore().catch(console.error);
}

const getStore = async (): Promise<QRCodeMapping[]> => {
  if (qrCodeMappingsStore.length === 0 && process.env.NODE_ENV !== 'test') {
    await initializeStore();
  }
  return qrCodeMappingsStore;
};

export const getAllQRCodeMappings = async (): Promise<QRCodeMapping[]> => {
  const store = await getStore();
  return JSON.parse(JSON.stringify(store.sort((a,b) => a.amount - b.amount)));
};

export const getQRCodeForAmount = async (amount: number): Promise<QRCodeMapping | null> => {
  const store = await getStore();
  const mapping = store.find(m => m.amount === amount);
  return mapping ? JSON.parse(JSON.stringify(mapping)) : null;
};

export const updateQRCodeMapping = async (amount: number, qrCodeDataUri: string, description?: string): Promise<QRCodeMapping | null> => {
  let store = await getStore();
  const mappingIndex = store.findIndex(m => m.amount === amount);
  const id = `amount_${amount}`;

  if (mappingIndex > -1) {
    // Explicitly update fields of the existing mapping
    store[mappingIndex].id = id; // Ensure ID is correct
    store[mappingIndex].amount = amount; // Ensure amount is correct
    store[mappingIndex].qrCodeDataUri = qrCodeDataUri;
    store[mappingIndex].description = description || `QR Code for ${amount} Credits`;
  } else { 
    // This case should ideally not be hit for default amounts if store initialization is correct
    console.warn(`QRCodeMapping for amount ${amount} not found during update, creating new one. This might indicate an issue.`);
    const newMapping: QRCodeMapping = { 
        id, 
        amount, 
        qrCodeDataUri, 
        description: description || `QR Code for ${amount} Credits`
    };
    store.push(newMapping);
  }
  
  // Sort the store by amount before saving to ensure consistent order in the JSON file
  store.sort((a, b) => a.amount - b.amount);

  await writeDataToFile(QR_CODE_MAPPINGS_FILE, store);
  
  // Find from the potentially re-sorted and updated store
  const finalUpdatedMapping = store.find(m => m.amount === amount); 
  return finalUpdatedMapping ? JSON.parse(JSON.stringify(finalUpdatedMapping)) : null;
};

export const resetAllQRCodeMappings_ONLY_FOR_TESTING = async (): Promise<void> => {
  qrCodeMappingsStore = [...defaultMappings];
  await writeDataToFile(QR_CODE_MAPPINGS_FILE, qrCodeMappingsStore);
  console.log('All QR Code mappings have been reset to default (local file store).');
};
