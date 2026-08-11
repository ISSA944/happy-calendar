# Runtime VAPID subscription recovery

## Problem

The production frontend was built without `VITE_WEB_PUSH_PUBLIC_KEY`. Vite replaced the missing build-time variable with `undefined`, so installed PWAs fail with `VAPID key not configured` before `PushManager.subscribe()` and before `POST /api/push/subscribe`. The production backend VAPID pair and cron delivery are healthy.

## Design

The backend becomes the single source of truth for the browser-facing VAPID public key. Authenticated `GET /api/push/public-key` returns `{ "publicKey": "..." }` from the same `WEB_PUSH_PUBLIC_KEY` used by `web-push`. The private key is never returned or logged.

When the user presses the notification permission button, the frontend requests this runtime key, validates that it is non-empty, and passes it explicitly to `subscribeToPush(publicKey)`. Only after the browser subscription is created and `POST /api/push/subscribe` succeeds may the hook report success or set `isSubscribed=true`. Existing subscriptions remain reusable so multi-device and iOS endpoint-churn guarantees are preserved.

The old build-time `VITE_WEB_PUSH_PUBLIC_KEY` dependency is removed from the subscription path. API response shapes unrelated to push are unchanged.

## Error handling

- Missing/malformed public key: show a clear connection error and do not call `PushManager.subscribe`.
- Browser permission denial: keep the existing user-facing blocked-permission message.
- Backend subscription sync failure: return failure; never claim that notifications are enabled.
- Existing browser subscription: reuse and re-sync it with the authenticated user.

## Verification

- Backend unit/controller tests prove the public endpoint returns only the public key.
- Frontend tests prove runtime key fetch precedes subscription and that sync failures are not reported as success.
- `npm run check` passes.
- Production bundle contains no compiled `VAPID key not configured` build guard.
- On the technical owner account, a fresh/re-synced subscription appears in PostgreSQL and authorized `POST /api/push/test` reports a successful delivery. Olga's account is not used.

## Deployment

Use a normal commit/push to `main`, back up production backend/frontend state, deploy backend first, then atomically swap the frontend. Verify containers, Nginx, public-key fingerprint agreement, subscription persistence, test delivery, and cron logs.
