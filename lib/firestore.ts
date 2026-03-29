import {
  collection,
  doc,
  onSnapshot,
  query,
  setDoc,
  updateDoc,
  deleteDoc,
  writeBatch,
  arrayUnion,
  getDoc,
} from "firebase/firestore"
import { db } from "./firebase"
import { Task, PomodoroSession } from "./types"
import { CommitmentMap } from "./commitment"

function tasksRef(userId: string) {
  return collection(db, `users/${userId}/tasks`)
}

function taskDoc(userId: string, taskId: string) {
  return doc(db, `users/${userId}/tasks/${taskId}`)
}

export function subscribeToTasks(
  userId: string,
  callback: (tasks: Task[]) => void
): () => void {
  const q = query(tasksRef(userId))
  return onSnapshot(q, (snapshot) => {
    const tasks = snapshot.docs.map((d) => d.data() as Task)
    callback(tasks)
  })
}

export async function addTask(userId: string, task: Task): Promise<void> {
  await setDoc(taskDoc(userId, task.id), task)
}

export async function updateTask(
  userId: string,
  taskId: string,
  updates: Partial<Task>
): Promise<void> {
  await updateDoc(taskDoc(userId, taskId), updates as Record<string, unknown>)
}

export async function permanentDeleteTask(userId: string, taskId: string): Promise<void> {
  await deleteDoc(taskDoc(userId, taskId))
}

// V2.3: atomic append — never overwrites existing sessions
export async function appendPomodoroSession(
  userId: string,
  taskId: string,
  session: PomodoroSession
): Promise<void> {
  await updateDoc(taskDoc(userId, taskId), {
    pomodoroSessions: arrayUnion(session),
    updatedAt: new Date().toISOString(),
  })
}

// ── Daily Commitment ─────────────────────────────────────────────────────────

function commitmentDoc(userId: string) {
  return doc(db, `users/${userId}/meta/dailyCommitments`)
}

export async function loadFirestoreCommitments(userId: string): Promise<CommitmentMap> {
  const snap = await getDoc(commitmentDoc(userId))
  return snap.exists() ? (snap.data() as CommitmentMap) : {}
}

export async function saveFirestoreCommitment(
  userId: string,
  date: string,
  value: number
): Promise<void> {
  await setDoc(commitmentDoc(userId), { [date]: value }, { merge: true })
}

// ── Migration ────────────────────────────────────────────────────────────────

export async function migrateTasks(userId: string, tasks: Task[]): Promise<void> {
  const batch = writeBatch(db)
  const now = new Date().toISOString()
  tasks.forEach((task) => {
    const ref = taskDoc(userId, task.id)
    batch.set(ref, {
      ...task,
      archived: task.archived ?? false,
      updatedAt: task.updatedAt ?? now,
    })
  })
  await batch.commit()
}
