import { useEffect } from "react";
import {
  GoogleAuthProvider,
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signInWithPopup,
  signInWithRedirect,
  signOut,
  updateProfile,
} from "firebase/auth";
import { get, ref, set } from "firebase/database";
import { auth, database } from "@/lib/firebase";
import { useAuthStore } from "@/store/auth.store";
import { createCategory, DEFAULT_CATEGORIES } from "@/services/categories.service";
import type { AuthUser, UserProfile, UserSettings } from "@/types";
import type { LoginInput, RegisterInput } from "@/lib/validators/auth";

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
      ...DEFAULT_CATEGORIES.map((category) => createCategory(uid, category)),
    ]);
  }
}

function buildGoogleProvider() {
  const provider = new GoogleAuthProvider();
  provider.setCustomParameters({ prompt: "select_account" });
  return provider;
}

function shouldFallbackToRedirect(error: unknown) {
  const code = (error as { code?: string } | undefined)?.code;
  return code === "auth/popup-blocked" || code === "auth/operation-not-supported-in-this-environment";
}

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

        void initializeUserData(
          firebaseUser.uid,
          firebaseUser.displayName ?? "Usuario",
          firebaseUser.email ?? ""
        ).catch(() => undefined);

        setUser(user);
      } else {
        setUser(null);
      }

      setInitialized();
    });

    return unsubscribe;
  }, [setInitialized, setUser]);
}

export function useAuth() {
  const { user, loading, initialized } = useAuthStore();

  async function login(input: LoginInput) {
    await signInWithEmailAndPassword(auth, input.email, input.password);
  }

  async function register(input: RegisterInput) {
    const credential = await createUserWithEmailAndPassword(auth, input.email, input.password);
    await updateProfile(credential.user, { displayName: input.displayName });
    await initializeUserData(credential.user.uid, input.displayName, input.email);
  }

  async function loginWithGoogle() {
    const provider = buildGoogleProvider();

    try {
      const credential = await signInWithPopup(auth, provider);
      await initializeUserData(
        credential.user.uid,
        credential.user.displayName ?? "Usuario",
        credential.user.email ?? ""
      );
    } catch (error) {
      if (shouldFallbackToRedirect(error)) {
        await signInWithRedirect(auth, provider);
        return;
      }

      throw error;
    }
  }

  async function logout() {
    await signOut(auth);
  }

  return { user, loading, initialized, login, register, loginWithGoogle, logout };
}
