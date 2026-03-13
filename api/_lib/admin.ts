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

import * as admin from "firebase-admin";

function initAdmin(): admin.app.App {
  if (admin.apps.length > 0) return admin.apps[0]!;

  const serviceAccount = process.env.FIREBASE_SERVICE_ACCOUNT;
  const databaseURL = process.env.FIREBASE_DATABASE_URL;

  if (!serviceAccount || !databaseURL) {
    throw new Error(
      "Variáveis FIREBASE_SERVICE_ACCOUNT e FIREBASE_DATABASE_URL são obrigatórias."
    );
  }

  return admin.initializeApp({
    credential: admin.credential.cert(JSON.parse(serviceAccount)),
    databaseURL,
  });
}

initAdmin();

export const db = admin.database();
export const adminAuth = admin.auth();
