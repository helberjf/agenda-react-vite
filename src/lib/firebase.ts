/**
 * lib/firebase.ts
 *
 * Inicialização central do Firebase SDK.
 * Exporta auth e database prontos para uso nos services.
 *
 * Design decisions:
 * - getApps().length guard evita re-inicialização em HMR do Vite
 * - Exportações nomeadas evitam imports acidentais do firebase/app raw
 * - DATABASE_URL obrigatória para Realtime Database (distinto do Firestore)
 */

import { initializeApp, getApps, type FirebaseApp } from "firebase/app";
import {
  getAuth,
  connectAuthEmulator,
  type Auth,
} from "firebase/auth";
import {
  getDatabase,
  connectDatabaseEmulator,
  type Database,
} from "firebase/database";

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  databaseURL: import.meta.env.VITE_FIREBASE_DATABASE_URL,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

// Evita re-inicialização durante HMR do Vite
const app: FirebaseApp =
  getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];

export const auth: Auth = getAuth(app);
export const database: Database = getDatabase(app);

// Emuladores locais — ative via VITE_USE_EMULATORS=true
if (import.meta.env.VITE_USE_EMULATORS === "true") {
  connectAuthEmulator(auth, "http://localhost:9099", { disableWarnings: true });
  connectDatabaseEmulator(database, "localhost", 9000);
}

export { app };
