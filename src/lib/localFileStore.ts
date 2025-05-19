// src/lib/localFileStore.ts
'use server';

import fs from 'fs';
import path from 'path';

const DATA_DIRECTORY = path.join(process.cwd(), '.data');

// Ensure the .data directory exists
if (typeof window === 'undefined') { // This check is problematic for 'use server' files.
                                    // 'use server' implies server-only execution.
  if (!fs.existsSync(DATA_DIRECTORY)) {
    try {
      fs.mkdirSync(DATA_DIRECTORY, { recursive: true });
    } catch (error) {
      console.error('Failed to create .data directory:', error);
    }
  }
}


export const writeDataToFile = async <T>(filename: string, data: T): Promise<boolean> => {
  // 'use server' context means this will always run on the server.
  // The 'typeof window' check is redundant here.
  try {
    if (!fs.existsSync(DATA_DIRECTORY)) {
      fs.mkdirSync(DATA_DIRECTORY, { recursive: true });
    }
    const filePath = path.join(DATA_DIRECTORY, filename);
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf-8');
    // console.log(`Data successfully written to ${filePath}`);
    return true;
  } catch (error) {
    console.error(`Error writing data to ${filename}:`, error);
    return false;
  }
};

export const readDataFromFile = async <T>(filename: string, defaultValue: T): Promise<T> => {
  // 'use server' context means this will always run on the server.
  try {
    const filePath = path.join(DATA_DIRECTORY, filename);
    if (fs.existsSync(filePath)) {
      const fileContent = fs.readFileSync(filePath, 'utf-8');
      // console.log(`Data successfully read from ${filePath}`);
      return JSON.parse(fileContent) as T;
    }
    // console.log(`File ${filePath} not found. Returning default value.`);
    return defaultValue;
  } catch (error) {
    console.error(`Error reading data from ${filename}:`, error);
    return defaultValue;
  }
};

export const deleteFile = async (filename: string): Promise<boolean> => {
  // 'use server' context means this will always run on the server.
  try {
    const filePath = path.join(DATA_DIRECTORY, filename);
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
      // console.log(`File ${filePath} successfully deleted.`);
      return true;
    }
    // console.log(`File ${filePath} not found for deletion.`);
    return false;
  } catch (error) {
    console.error(`Error deleting file ${filename}:`, error);
    return false;
  }
}
