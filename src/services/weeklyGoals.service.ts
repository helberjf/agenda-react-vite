import { ref, push, update, get, onValue, off } from "firebase/database";
import { database } from "@/lib/firebase";
import type { WeeklyGoal } from "@/types";
import type { WeeklyGoalInput } from "@/lib/validators/auth";

const goalsRef = (uid: string, weekKey: string) =>
  ref(database, `weeklyGoals/${uid}/${weekKey}`);

const goalRef = (uid: string, weekKey: string, goalId: string) =>
  ref(database, `weeklyGoals/${uid}/${weekKey}/${goalId}`);

export async function createWeeklyGoal(
  uid: string,
  weekKey: string,
  input: WeeklyGoalInput
): Promise<WeeklyGoal> {
  const listRef = goalsRef(uid, weekKey);
  const newRef = push(listRef);
  const goalId = newRef.key!;
  const now = Date.now();

  const goal: WeeklyGoal = {
    id: goalId,
    weekKey,
    title: input.title,
    description: input.description,
    target: input.target ?? 1,
    progress: 0,
    status: "pending",
    createdAt: now,
    updatedAt: now,
  };

  await update(ref(database), { [`weeklyGoals/${uid}/${weekKey}/${goalId}`]: goal });
  return goal;
}

export async function updateGoalProgress(
  uid: string,
  weekKey: string,
  goalId: string,
  progress: number
): Promise<void> {
  const r = goalRef(uid, weekKey, goalId);
  const snap = await get(r);
  if (!snap.exists()) return;

  const goal = snap.val() as WeeklyGoal;
  const status = progress >= goal.target ? "done" : "in_progress";

  await update(r, { progress, status, updatedAt: Date.now() });
}

export async function deleteWeeklyGoal(
  uid: string,
  weekKey: string,
  goalId: string
): Promise<void> {
  await update(ref(database), {
    [`weeklyGoals/${uid}/${weekKey}/${goalId}`]: null,
  });
}

export function subscribeWeeklyGoals(
  uid: string,
  weekKey: string,
  callback: (goals: WeeklyGoal[]) => void
): () => void {
  const r = goalsRef(uid, weekKey);
  const unsubscribe = onValue(
    r,
    (snap) => {
      if (!snap.exists()) {
        callback([]);
        return;
      }
      callback(Object.values(snap.val()) as WeeklyGoal[]);
    },
    () => callback([])
  );
  return unsubscribe;
}
