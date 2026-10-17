# CropPulse

Mobile app for farmers and buyers — marketplace, logistics, and predictions.

## Table of Contents

- [About](#about)
- [Tech Stack](#tech-stack)
- [Prerequisites](#prerequisites)
- [Installation](#installation)
- [Running Locally](#running-locally)
- [Development](#development)
- [Project Structure](#project-structure)
- [Contributing](#contributing)
- [License](#license)

## About

CropPulse is an Expo + React Native TypeScript app that provides a marketplace, logistics features, and crop prediction utilities.

## Tech Stack

- Expo
- React Native
- TypeScript
- Expo Router

## Prerequisites

- Node.js (16+ recommended)
- npm or Yarn
- Android Studio (for Android emulator) or a physical device with Expo Go
- (macOS only) Xcode for iOS simulator

## Installation

Clone the repo and install dependencies:

```bash
git clone <repo-url>
cd CropPulse
npm install
# or
yarn install
```

## Running Locally

Start the Expo dev server:

```bash
npm run start
# or
yarn start
```

Quick run targets (available scripts):

- Start Metro / Expo: `npm run start`
- Open Android emulator: `npm run android` (requires Android emulator configured)
- Open iOS simulator: `npm run ios` (macOS only)
- Run on web: `npm run web`
- Lint: `npm run lint`
- Type-check: `npm run typecheck`

After starting, use the Expo Dev Tools to open on device/emulator or scan the QR code with Expo Go.

## Development

- Type-check the project:

```bash
npm run typecheck
```

- Lint:

```bash
npm run lint
```

If you add native modules or change native config, rebuild using Expo/EAS build workflows.

## Project Structure

Top-level notable folders:

- `app/` — screens and routing
- `components/` — reusable UI components
- `assets/` — images and static assets
- `constants/`, `context/`, `hooks/`, `utils/`, `types/` — app logic and types

## Environment

If the app needs environment variables, create a `.env` file (not committed) and document the keys here. Example:

```
API_URL=https://api.example.com
```

## Contributing

- Fork the repository and open a pull request with a clear description.
- Run `npm run lint` and `npm run typecheck` before submitting.
- Include screenshots or recordings for UI changes.

## License

This project is released under the MIT License. See the `LICENSE` file for details.# CropPulse 🌱

A modern agriculture application built with **React Native (Expo)** on the frontend and a **Node.js (Express) + MySQL + Prisma** backend. It features an integrated **Python FastAPI** service for ML-powered crop price predictions.

> This project has been transformed from a UI prototype into a fully functional end-to-end full-stack application, complete with real REST APIs, a MySQL database, secure JWT authentication, and a seeded production-style data layer.

- **Frontend:** Expo SDK 52 + Expo Router, React Native core components, `react-native-svg`
- **Backend:** Node.js, Express, TypeScript, Prisma ORM, MySQL
- **ML Service:** Python, FastAPI, XGBoost, pandas
- **Authentication:** JWT (JSON Web Tokens), bcrypt, expo-secure-store

## Getting started

```bash
npm install
npx expo start
```

Then press `i` for iOS simulator, `a` for Android emulator, or `w` for web — or scan the QR code with the Expo Go app on your phone.

## Project structure

```
app/                  Expo Router screens (file-based routing)
  index.tsx            Splash screen
  onboarding.tsx        Onboarding carousel
  login.tsx             Login screen
  signup.tsx             Placeholder — sign up
  logistics.tsx           Placeholder — logistics
  orders.tsx               Placeholder — orders
  notifications.tsx         Placeholder — notifications
  settings.tsx                Placeholder — settings
  (tabs)/                Bottom tab navigator
    home.tsx               Home dashboard
    prediction.tsx          AI price prediction
    marketplace.tsx          Marketplace
    profile.tsx               Profile

components/            Reusable UI building blocks
  Button.tsx, Input.tsx, Card.tsx, CropCard.tsx, PriceCard.tsx,
  WeatherWidget.tsx, Header.tsx, SearchBar.tsx, PlaceholderScreen.tsx

constants/theme.ts     Design tokens (colors, spacing, type scale, radius)
data/                  Realistic dummy JSON (crops, weather, marketplace, user)
hooks/                 useTheme (light/dark), useFadeIn (entrance animation)
types/                 Shared TypeScript interfaces
utils/format.ts        Currency, percentage, and greeting formatters
assets/images/         App icon, adaptive icon, splash icon, favicon
```

## Design system

| Token      | Value      |
|------------|------------|
| Primary    | `#2E7D32`  |
| Secondary  | `#66BB6A`  |
| Accent     | `#FFC107`  |
| Background | `#F7F9F5`  |

Colors, typography, spacing, and radii are centralized in `constants/theme.ts` as a lightweight Material 3–inspired token system, with matching light and dark palettes. All screens read colors through the `useTheme()` hook so the entire app responds to the system color scheme automatically.

## Run the full application locally

Start each service in its own terminal from the repository root:

```powershell
cd backend
Copy-Item .env.example .env
npm install
npx prisma db push
npx prisma generate
npm run dev
```

```powershell
cd ml
.\.venv\Scripts\python.exe -m uvicorn app:app --host 0.0.0.0 --port 8000
```

```powershell
cd CropPulse
npm install
npx expo start
```

The backend persists logistics requests, join decisions, participants, notifications, and group chat messages in the Prisma database. Authenticated farmers receive request and membership updates over Socket.IO; chat history is loaded from the API and new messages are broadcast only to authorized group members. The app detects the Expo development host for API/realtime connections. To override it, set `EXPO_PUBLIC_API_URL` to the backend origin before starting Expo.

Create local test accounts by signing up in the app. The seed script creates crop, market, and historical price data, but no sample accounts. Do not run the seed command against a database whose data you need: the seed resets application tables.

## Production deployment requirements

SQLite remains the default for local development. A separate MySQL schema and initial migration are provided under `backend/prisma/mysql`, without changing the local `.env` or SQLite database. For a MySQL deployment:

1. Create a MySQL database and configure the deployment environment from `backend/.env.mysql.example`, replacing every placeholder with deployment-specific values. Never commit real credentials.
2. From `backend`, install dependencies, then run:

   ```powershell
   npm ci
   npm run db:generate:mysql
   npm run db:migrate:mysql:deploy
   npm run build
   npm run start
   ```

   `db:migrate:mysql:dev` is for creating future migrations during development; deploy committed migrations with `db:migrate:mysql:deploy`. The initial migration creates the schema but does not seed demo accounts. Do not run the destructive development seed against production.
3. Set a unique, high-entropy `JWT_SECRET` and explicit `CORS_ORIGIN` values. Production startup intentionally fails if the development JWT secret or an unspecified CORS origin is used.
4. Serve the API and Socket.IO over HTTPS/WSS, configure the mobile app's `EXPO_PUBLIC_API_URL` to the public API origin, and use a shared Socket.IO adapter when running multiple backend instances so realtime events reach clients connected to every instance.

The MySQL schema is currently aligned with the local SQLite schema, but production database connectivity and migration application still need to be verified against your provisioned MySQL instance. `npm run db:generate:mysql` generates a MySQL-specific Prisma client in the standard `@prisma/client` location; rerun `npx prisma generate` with the default SQLite schema when switching the same working copy back to local SQLite development.
