// src/lib/firebase.ts
// Firebase is no longer used. This file is kept for structure but functionality is removed.

// This flag indicates that Firebase is NOT initialized, and the app should use local data.
export const firebaseInitialized = false;

// Stubs for db and app, they will not be used.
// No actual Firebase app or Firestore instance will be initialized.
export const app = undefined; // Or null, or an empty object if preferred.
export const db = undefined; // Or null, or an empty object.

console.warn(
  "Firebase module (`src/lib/firebase.ts`) is present but Firebase is NOT being used. " +
  "The application is configured to use local in-memory/localStorage data for users and tournaments. " +
  "Ensure `NEXT_PUBLIC_USE_LOCAL_DATA=true` is set in your .env.local file if this is intended."
);
