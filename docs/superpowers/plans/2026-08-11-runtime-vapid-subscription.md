# Runtime VAPID Subscription Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make installed PWAs obtain the active VAPID public key from the backend and persist a usable Web Push subscription without build-time configuration.

**Architecture:** The authenticated push controller exposes the public half of the backend's configured VAPID pair. The frontend fetches that value immediately after permission, passes it to the browser subscription helper, and reports success only after backend synchronization succeeds.

**Tech Stack:** React 19, Vitest/Testing Library, NestJS 11, Jest, Web Push API, `web-push`, PostgreSQL.

## Global Constraints

- Never expose or log `WEB_PUSH_PRIVATE_KEY`.
- Preserve existing iOS subscription reuse and multi-device delivery.
- Do not access Olga's account; production verification uses the owner technical account.
- Normal commit/push to `main`; no force-push.

---

### Task 1: Backend runtime public key

**Files:**
- Modify: `backend/src/push/web-push.service.ts`
- Modify: `backend/src/push/push.service.ts`
- Modify: `backend/src/push/push.controller.ts`
- Test: `backend/src/push/push.controller.spec.ts`

**Interfaces:**
- Produces: authenticated `GET /api/push/public-key -> { publicKey: string }`.
- Produces: `WebPushService.getPublicKey(): string` and `PushService.getPublicKey(): { publicKey: string }`.

- [ ] **Step 1: Write the failing controller test**

```ts
it('returns the configured browser VAPID public key', () => {
  const controller = new PushController({
    getPublicKey: () => ({ publicKey: 'public-vapid-key' }),
  } as PushService);
  expect(controller.publicKey()).toEqual({ publicKey: 'public-vapid-key' });
});
```

- [ ] **Step 2: Run the test and verify RED**

Run: `npm test -- --runInBand src/push/push.controller.spec.ts`
Expected: FAIL because `publicKey()` / `getPublicKey()` do not exist.

- [ ] **Step 3: Add the minimal endpoint and delegation**

```ts
@Get('public-key')
publicKey() {
  return this.pushService.getPublicKey();
}

// WebPushService
getPublicKey(): string {
  return this.publicKey;
}

// PushService
getPublicKey() {
  return { publicKey: this.webPush.getPublicKey() };
}
```

Assign the already validated `WEB_PUSH_PUBLIC_KEY` to a private readonly field in the `WebPushService` constructor. Return only that field; never include the private key or subject.

- [ ] **Step 4: Run targeted backend tests and verify GREEN**

Run: `npm test -- --runInBand src/push/push.controller.spec.ts src/push/web-push.service.spec.ts`
Expected: PASS.

### Task 2: Frontend runtime subscription and truthful sync

**Files:**
- Modify: `src/lib/push.ts`
- Modify: `src/hooks/useWebPush.ts`
- Create: `src/lib/push.test.ts`
- Create: `src/hooks/useWebPush.test.tsx`

**Interfaces:**
- Consumes: `GET push/public-key -> { publicKey: string }`.
- Produces: `subscribeToPush(publicKey: string): Promise<PushResult>`.

- [ ] **Step 1: Write failing browser-helper and hook tests**

```ts
it('subscribes with the runtime VAPID key', async () => {
  const result = await subscribeToPush('AQID');
  expect(result.success).toBe(true);
});

it('does not report success when backend synchronization fails', async () => {
  // Mock only API/browser boundaries; exercise the real hook.
  expect(await result.current.subscribe()).toBe(false);
  expect(result.current.isSubscribed).toBe(false);
});
```

- [ ] **Step 2: Run frontend tests and verify RED**

Run: `npm run test:frontend -- src/lib/push.test.ts src/hooks/useWebPush.test.tsx`
Expected: FAIL because the helper has no key parameter and sync errors are swallowed.

- [ ] **Step 3: Implement runtime fetch and truthful synchronization**

```ts
const { data } = await apiClient.get<{ publicKey: string }>('push/public-key');
const result = await subscribeToPush(data.publicKey);
if (!result.success || !result.subscription) return false;
return syncSubscription(result.subscription);
```

Make `syncSubscription` return `true` only after `POST push/subscribe` succeeds; set `isSubscribed` only in that branch.

- [ ] **Step 4: Run targeted frontend tests and verify GREEN**

Run: `npm run test:frontend -- src/lib/push.test.ts src/hooks/useWebPush.test.tsx`
Expected: PASS.

### Task 3: Documentation, integration, and deployment

**Files:**
- Modify: `PROJECT_MEMORY.md`
- Modify: `docs/tech-passport.md`
- Modify: `backend/.env.prod.example`

**Interfaces:**
- Documents runtime key flow and removes obsolete Firebase configuration from the production example.

- [ ] **Step 1: Run formatting and the complete verification suite**

Run: `npm run check`
Expected: frontend/backend builds, lints, and all tests pass.

- [ ] **Step 2: Verify the artifact behavior**

Build without `VITE_WEB_PUSH_PUBLIC_KEY`; inspect the emitted JS and confirm subscription code calls `push/public-key` and no longer compiles `publicKey = undefined` into the push path.

- [ ] **Step 3: Commit and push**

```bash
git add backend/src/push src/lib/push.ts src/lib/push.test.ts src/hooks/useWebPush.ts src/hooks/useWebPush.test.tsx PROJECT_MEMORY.md docs/tech-passport.md backend/.env.prod.example
git commit -m "fix: load VAPID key at runtime"
git push origin HEAD:main
```

- [ ] **Step 4: Back up and deploy**

Back up `.env.prod`, PostgreSQL, backend source, and frontend `dist`; deploy backend first and atomically swap frontend `dist_new -> dist`.

- [ ] **Step 5: Verify production**

Confirm endpoint fingerprint matches the configured backend public key, production frontend is `200`, API unauthenticated guards remain active, owner technical account can persist a subscription, and authorized `POST /api/push/test` returns `sent >= 1` with a matching `Web Push sent OK` log.
