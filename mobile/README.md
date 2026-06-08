# TradeEthiopia Sales Mobile App

React Native / Expo mobile shell for the TradeEthiopia portal.

## What It Does

- Shows a native TradeEthiopia login screen with the same navy/gold mobile UI style as the portal.
- Authenticates against the existing backend endpoint: `/api/users/login`.
- Stores the authenticated session securely on the device.
- Loads the existing sales portal inside a native WebView after login.
- Injects the authenticated user/token into the portal `localStorage`, so the web portal can use the same session shape as the browser app.
- Keeps the login screen available offline. The portal itself needs internet access.

## Local Setup

Create `mobile/.env` from `.env.example`.

```txt
EXPO_PUBLIC_API_URL=http://YOUR_MACHINE_IP:5000
EXPO_PUBLIC_PORTAL_URL=http://YOUR_MACHINE_IP:3002/sdashboard
```

Use your computer's LAN IP address when testing on a physical phone. `localhost` points to the phone itself, not your development machine.

## Commands

```bash
npm start --prefix mobile
npm run android --prefix mobile
npm run ios --prefix mobile
```

From the repository root:

```bash
npm run dev:mobile
```
