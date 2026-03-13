/**
 * api/_lib/admin.ts
 *
 * Inicialização do Firebase Admin SDK para as Vercel Functions.
 * Usa variável de ambiente FIREBASE_SERVICE_ACCOUNT (JSON da service account).
 *
 * Como configurar no Vercel:
 * 1. Firebase Console → Project Settings → Service Accounts → Generate new private key
 * 2. Copie o conteúdo do JSON gerado
 * 3. Vercel Dashboard → Settings → Environment Variables
 *    FIREBASE_SERVICE_ACCOUNT = <cole o JSON inteiro como string>
 *    FIREBASE_DATABASE_URL = https://seu-projeto-default-rtdb.firebaseio.com
 */

import { cert, getApps, initializeApp, type App } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { getDatabase } from "firebase-admin/database";

function initAdmin(): App {
  const serviceAccount = process.env.FIREBASE_SERVICE_ACCOUNT;
  const databaseURL = process.env.FIREBASE_DATABASE_URL;

  if (!serviceAccount || !databaseURL) {
    throw new Error(
      "Variáveis FIREBASE_SERVICE_ACCOUNT e FIREBASE_DATABASE_URL são obrigatórias."
    );
  }

  const apps = getApps();
  if (apps.length > 0) return apps[0]!;

  return initializeApp({
    credential: cert(JSON.parse(serviceAccount)),
    databaseURL,
  });
}

const app = initAdmin();

export const db = getDatabase(app);
export const adminAuth = getAuth(app);
