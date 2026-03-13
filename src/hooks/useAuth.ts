/**
 * hooks/useAuth.ts
 *
 * Hook central de autenticação — encapsula Firebase Auth e Zustand.
 * Lida com onAuthStateChanged e expõe helpers de login/logout/registro.
 */

import { useEffect } from "react";
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  updateProfile,
  GoogleAuthProvider,
  signInWithPopup,
} from "firebase/auth";
import { ref, set, get } from "firebase/database";
import { auth, database } from "@/lib/firebase";
import { useAuthStore } from "@/store/auth.store";
import { createCategory, DEFAULT_CATEGORIES } from "@/services/categories.service";
import type { AuthUser, UserProfile, UserSettings } from "@/types";
import type { LoginInput, RegisterInput } from "@/lib/validators/auth";

/** Inicializa perfil e categorias padrão no primeiro login */
async function initializeUserData(uid: string, displayName: string, email: string) {
  const profileRef = ref(database, `users/${uid}/profile`);
  const snap = await get(profileRef);

  if (!snap.exists()) {
    const profile: UserProfile = {
      uid,
      displayName,
      email,
      createdAt: Date.now(),
    };

    const settings: UserSettings = {
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      theme: "system",
      startOfWeek: 1,
      defaultView: "week",
      showWeekNumbers: false,
    };

    await Promise.all([
      set(profileRef, profile),
      set(ref(database, `users/${uid}/settings`), settings),
      ...DEFAULT_CATEGORIES.map((cat) => createCategory(uid, cat)),
    ]);
  }
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function useAuthListener() {
  const { setUser, setInitialized } = useAuthStore();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      if (firebaseUser) {
        const user: AuthUser = {
          uid: firebaseUser.uid,
          email: firebaseUser.email,
          displayName: firebaseUser.displayName,
          photoURL: firebaseUser.photoURL,
        };
        setUser(user);
      } else {
        setUser(null);
      }
      setInitialized();
    });

    return unsubscribe;
  }, [setUser, setInitialized]);
}

export function useAuth() {
  const { user, loading, initialized } = useAuthStore();

  async function login(input: LoginInput) {
    await signInWithEmailAndPassword(auth, input.email, input.password);
  }

  async function register(input: RegisterInput) {
    const cred = await createUserWithEmailAndPassword(auth, input.email, input.password);
    await updateProfile(cred.user, { displayName: input.displayName });
    await initializeUserData(cred.user.uid, input.displayName, input.email);
  }

  async function loginWithGoogle() {
    const provider = new GoogleAuthProvider();
    const cred = await signInWithPopup(auth, provider);
    await initializeUserData(
      cred.user.uid,
      cred.user.displayName ?? "Usuário",
      cred.user.email ?? ""
    );
  }

  async function logout() {
    await signOut(auth);
  }

  return { user, loading, initialized, login, register, loginWithGoogle, logout };
}
