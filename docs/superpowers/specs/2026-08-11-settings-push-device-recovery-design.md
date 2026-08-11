# Settings push-device recovery

## Confirmed production failure

The 16:40 support preference was saved at 16:38:44 in `Asia/Almaty`. The
16:40 cron tick generated the support notification, all five stored endpoints
were accepted by their push providers, and notification history was written.
The current PWA still did not display it because every stored subscription was
created in July; today's installation never completed `POST /api/push/subscribe`
after the former build-time VAPID failure.

`SettingsPage` currently edits notification preferences without mounting
`useWebPush`, checking the current browser subscription, or offering a recovery
action. A valid-looking schedule therefore does not mean this device can receive
pushes.

## Design

Add a focused `PushDeviceStatus` block below the four category controls in
Settings. It uses `useWebPush` as the single subscription authority:

- while the browser subscription is being checked, show a neutral checking state;
- when the current browser subscription has been confirmed by
  `POST /api/push/subscribe`, show “Подключено на этом устройстве”;
- when no confirmed subscription exists, show a warning that the schedule is
  saved but this device cannot receive it, plus “Подключить и проверить”;
- when notification permission is denied, keep the existing actionable blocked
  message instead of claiming success.

The disconnected CTA runs `subscribe()` directly from the user gesture. That
flow requests permission when needed, fetches the runtime VAPID public key,
creates or reuses the browser subscription, and reports success only after the
backend confirms `{ subscribed: true }`. After confirmation, Settings calls the
existing authenticated `POST /api/push/test`. A connected device gets an
“Отправить тестовый push” button using the same endpoint.

Provider acceptance is not described as display confirmation. The UI says the
test was sent and asks the user to check the notification shade. A failed test
request does not erase a successfully confirmed subscription, but it displays a
separate delivery-check error.

## Hook state and error handling

Extend `useWebPush` with `isChecking`: it starts `true`, becomes `false` after
the initial `getPushSubscription` lookup and backend re-sync, and also becomes
`false` on lookup errors. The initial lookup must catch errors to avoid an
unhandled rejection. `isSubscribed` remains truthful: it is set only after a
successful semantic backend response.

No new backend route, schema change, permission policy, or cron behavior is
needed. Existing multi-device delivery remains unchanged.

## Verification

- Hook tests cover checking state, no-subscription completion, existing
  subscription re-sync, lookup failure, and semantic backend rejection.
- Component tests cover disconnected warning, user-gesture subscription,
  immediate test push, connected test action, blocked permission, and test-send
  failure without losing connected state.
- Full `npm run check` passes and the production bundle contains the Settings
  recovery copy and runtime `push/public-key` path.
- Production deployment is frontend-only and atomic. After deployment the owner
  taps “Подключить и проверить”; PostgreSQL must show a subscription updated at
  that moment and production logs must show the test push accepted for it.
- Olga's account is not used.
