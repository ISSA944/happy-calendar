# Settings Push-Device Recovery Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Let an existing installed PWA confirm, recover, and test its own Web Push subscription directly from Settings.

**Architecture:** `useWebPush` exposes a truthful initial checking state and continues to own browser/backend subscription synchronization. A new focused `PushDeviceStatus` component renders device status, invokes subscription only from an explicit user gesture, and uses the existing authenticated test-push endpoint after confirmation. `SettingsPage` only embeds the component.

**Tech Stack:** React 19, TypeScript, Zustand, Vitest, React Testing Library, standard Web Push, existing Axios client.

## Global Constraints

- Do not change cron scheduling, notification preference payloads, database schema, or backend API shapes.
- A device is connected only after `POST /api/push/subscribe` returns `{ subscribed: true }`.
- Keep iOS permission prompting behind the explicit button gesture.
- Provider acceptance must be described as “test sent”, not “notification displayed”.
- Do not use Olga's account for production verification.

---

### Task 1: Truthful initial subscription status

**Files:**
- Modify: `src/hooks/useWebPush.ts`
- Modify: `src/hooks/useWebPush.test.tsx`

**Interfaces:**
- Produces: `useWebPush(): { isChecking: boolean; isSubscribed: boolean; isLoading: boolean; error: string | null; subscribe(): Promise<boolean>; ... }`
- Preserves: runtime key fetch and semantic `{ subscribed: true }` confirmation.

- [ ] **Step 1: Write failing hook tests**

Add tests asserting that `isChecking` starts `true`, becomes `false` after no
browser subscription, stays `true` until an existing subscription's backend
sync resolves, and becomes `false` with a user-facing error if
`getPushSubscription()` rejects.

```ts
expect(result.current.isChecking).toBe(true)
await waitFor(() => expect(result.current.isChecking).toBe(false))
expect(result.current.isSubscribed).toBe(false)
```

- [ ] **Step 2: Run tests and verify RED**

Run: `npm run test:frontend -- src/hooks/useWebPush.test.tsx`
Expected: FAIL because the hook does not expose `isChecking` and does not catch
initial lookup rejection.

- [ ] **Step 3: Implement the minimal hook state**

Initialize `isChecking` to `true`; make the initial effect an async guarded
function with `try/catch/finally`; await `syncSubscription` for an existing
subscription; set an actionable lookup error on failure; return `isChecking`.

- [ ] **Step 4: Run targeted tests and verify GREEN**

Run: `npm run test:frontend -- src/hooks/useWebPush.test.tsx`
Expected: all hook tests pass with no unhandled promise rejection.

- [ ] **Step 5: Commit**

```bash
git add src/hooks/useWebPush.ts src/hooks/useWebPush.test.tsx
git commit -m "fix(push): expose truthful device subscription state"
```

### Task 2: Settings recovery and test action

**Files:**
- Create: `src/features/notifications/PushDeviceStatus.tsx`
- Create: `src/features/notifications/PushDeviceStatus.test.tsx`
- Modify: `src/pages/SettingsPage.tsx`

**Interfaces:**
- Consumes: `useWebPush().isChecking`, `isSubscribed`, `isLoading`, `error`, and `subscribe()`.
- Consumes: `apiClient.post<{ sent: number; total: number }>('push/test')`.
- Produces: `<PushDeviceStatus />`, embedded below `NotificationCategoriesEditor`.

- [ ] **Step 1: Write failing component tests**

Mock `useWebPush` and `apiClient.post`. Cover:

```ts
it('warns and offers recovery when this device is not subscribed')
it('subscribes from the button and sends a test only after confirmation')
it('shows connected state and can send another test')
it('does not call push/test when subscribe returns false')
it('keeps connected status when only the test request fails')
```

Assert the primary disconnected copy contains “На этом устройстве уведомления
не подключены”, the CTA is “Подключить и проверить”, and successful provider
acceptance produces “Тестовый push отправлен”.

- [ ] **Step 2: Run tests and verify RED**

Run: `npm run test:frontend -- src/features/notifications/PushDeviceStatus.test.tsx`
Expected: FAIL because the component does not exist.

- [ ] **Step 3: Implement the focused component**

Render checking, connected, and disconnected states. On disconnected click,
await `subscribe()` and only then call `push/test`. On connected click, call
`push/test` directly. Display `hookError` directly so React re-renders with the
current permission/sync error; keep test-delivery errors in separate local state.

- [ ] **Step 4: Embed it in Settings**

```tsx
<NotificationCategoriesEditor categories={notificationCategories} />
<PushDeviceStatus />
```

- [ ] **Step 5: Run targeted tests, lint, and build**

Run: `npm run test:frontend -- src/features/notifications/PushDeviceStatus.test.tsx src/hooks/useWebPush.test.tsx`
Run: `npm run lint:frontend`
Run: `npm run build`
Expected: all commands exit `0`.

- [ ] **Step 6: Commit**

```bash
git add src/features/notifications/PushDeviceStatus.tsx src/features/notifications/PushDeviceStatus.test.tsx src/pages/SettingsPage.tsx
git commit -m "fix(push): recover device subscriptions from settings"
```

### Task 3: Documentation, full verification, and production release

**Files:**
- Modify: `PROJECT_MEMORY.md`
- Modify: `docs/tech-passport.md`

**Interfaces:**
- Documents the difference between saved schedules, provider acceptance, and a confirmed current-device subscription.

- [ ] **Step 1: Update documentation**

Record the Settings recovery block, runtime VAPID flow, truthful semantic
confirmation, and the rule that a saved schedule does not by itself prove a
browser subscription exists.

- [ ] **Step 2: Run complete verification**

Run: `npm run check`
Expected: frontend/backend builds, lints, and all tests pass.

- [ ] **Step 3: Inspect the production artifact**

Confirm the main bundle contains `push/public-key`, `push/test`,
“Подключить и проверить”, and no `VITE_WEB_PUSH_PUBLIC_KEY` lookup or compiled
undefined key.

- [ ] **Step 4: Review, commit, and push**

Run `git diff --check`, perform independent code review, commit docs, fetch
`origin/main`, and use ordinary `git push origin HEAD:main` without force.

- [ ] **Step 5: Back up and atomically deploy frontend**

Create a new timestamped production backup of current frontend `dist`, upload
the verified local `dist` to a unique `dist_new_<sha>`, run `nginx -t`, swap it
atomically, and reload Nginx with rollback to the saved `dist_old` on failure.

- [ ] **Step 6: Verify the live recovery**

Check the live bundle hash and Service Worker precache, then have the owner tap
“Подключить и проверить”. Confirm a current PostgreSQL subscription timestamp,
`POST /api/push/test` provider acceptance in logs, and no Web Push failure. Do
not log or print subscription endpoints or VAPID secrets.
