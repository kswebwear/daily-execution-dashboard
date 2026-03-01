# Daily Execution Dashboard

A minimal, dark-mode task board for daily accountability. No accounts. No backend. No noise.

**Live:** https://ded-app-lemon.vercel.app
**Repo:** https://github.com/kswebwear/daily-execution-dashboard

---

## Accessing the Dashboard

Open the live URL in any browser — desktop or mobile. No login, no setup required.

To run locally:

```bash
git clone https://github.com/kswebwear/daily-execution-dashboard
cd daily-execution-dashboard
npm install
npm run dev
```

Then open http://localhost:3000.

---

## Creating a Task

1. In the **Pending** column, click **+ Add task** at the bottom.
2. The form expands inline. Fill in:
   - **Title** — required. What you need to do today.
   - **Tag** — optional. A free-text label (e.g. `work`, `personal`, `health`).
3. Press **Add** or hit Enter.

The task appears immediately in the Pending column. It is saved to your browser's local storage on creation.

**What gets auto-assigned:**
- A unique ID
- `createdAt` set to today's date
- `status` set to `pending`

---

## Completing a Task

Drag a task card from the **Pending** column and drop it into the **Completed Today** column.

- On desktop: click, hold, drag across.
- On mobile: press and hold for ~150ms until the card lifts, then drag.

When a task is dropped into Completed:
- Its `status` is set to `completed`
- An entry is appended to its `completionHistory` with today's date

You can drag it back to Pending at any time. The completion history entry is **not deleted** — the record that it was completed today is preserved.

You can also reorder tasks within a column by dragging them above or below each other.

---

## Adding Notes to a Task

Click the **···** button that appears on hover (or tap on mobile) on any task card. This opens the task history modal.

In the modal:
- Write a note in the **Note for today** field.
- Click **Save note**.

Notes are date-stamped to today and stored in the task's `dailyNotes` array. If you open the modal again today, the note is pre-filled so you can edit it. Saving with an empty field removes today's note.

**Use case for partial work:** If you started a task but didn't finish, drag it back to Pending and add a note explaining where you left off. The note carries forward to tomorrow so you have context when you pick it up again.

---

## Viewing Task History

Click **···** on any task card to open its history modal. It shows:

- **Created date**
- **Note for today** — editable
- **Completion history** — every date this task was completed, newest first
- **Daily notes** — all notes from all days, newest first

---

## Deleting a Task

Task deletion is **not available in V1**. This is intentional — the dashboard is designed for accountability, and removing a task erases the record that it existed.

If you need to clear everything (e.g. reset for testing), you can manually clear local storage from your browser's DevTools:

```
DevTools → Application → Local Storage → your domain → Delete all
```

Task deletion is planned for a future version.

---

## How Data is Stored

All data lives in your browser's **local storage**. Nothing is sent to a server.

| Key | Contents |
|---|---|
| `execution_dashboard_tasks` | JSON array of all tasks |
| `execution_dashboard_last_active` | Last date the app was opened (YYYY-MM-DD) |

**Data only exists in the browser you use.** It will not sync across devices. Clearing browser data or using a different browser will start fresh.

### Task object structure

```ts
{
  id: string                      // UUID, auto-generated
  title: string                   // Task title
  tag: string                     // Free-text tag, may be empty
  createdAt: string               // YYYY-MM-DD, date task was created
  status: "pending" | "completed" // Current status
  dailyNotes: {
    date: string                  // YYYY-MM-DD
    text: string                  // Note content
  }[]
  completionHistory: {
    date: string                  // YYYY-MM-DD, date it was completed
    note?: string                 // Optional note (reserved for future use)
  }[]
}
```

Every state change (create, drag, note save) immediately writes the full task array back to local storage.

---

## How Pending Tasks Carry Forward

When the app loads, it compares today's date against the last recorded active date.

**Same day:** Nothing changes. The board shows exactly what you left it as.

**New day:** All tasks with `status: "completed"` are reset to `status: "pending"`. Their `completionHistory` is preserved — you can still see every date they were previously completed. Pending tasks are untouched (they were already carrying forward).

This means:
- Every day starts with a full Pending column of everything not yet done
- You never manually roll over tasks
- A task completed yesterday reappears today, ready to be done again or noted as ongoing

The last active date is updated to today as part of this check, so the reset only fires once per day regardless of how many times you open the app.

---

## Tech Stack

| Concern | Choice |
|---|---|
| Framework | Next.js 16 (App Router) |
| Styling | Tailwind CSS |
| Drag and drop | @dnd-kit/core + @dnd-kit/sortable |
| Persistence | Browser LocalStorage |
| Backend | None |
| Auth | None |
| Deployment | Vercel |

### Project structure

```
app/
  layout.tsx          Root layout, dark background, Geist font
  page.tsx            Main page with date header
  globals.css         Tailwind base + dark scrollbar
components/
  TaskBoard.tsx       DnD context, state, localStorage orchestration
  TaskColumn.tsx      Droppable pending / completed column
  TaskCard.tsx        Draggable task card with note preview
  AddTaskForm.tsx     Inline expand/collapse task creation form
  TaskModal.tsx       History modal with note editor
lib/
  types.ts            Task type definition
  storage.ts          LocalStorage read/write helpers
  carryForward.ts     New-day reset logic
```

---

## Deploying Updates

The Vercel project is connected to the GitHub repository. Any push to `main` triggers an automatic redeploy.

```bash
git add .
git commit -m "your change"
git push
```

Vercel will pick it up within ~30 seconds.
