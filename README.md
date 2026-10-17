# CropPulse 🌱

> **Next-Generation AgriTech Platform** — Empowering farmers with an integrated crop marketplace, collaborative logistics pooling, real-time messaging, and AI-driven market price forecasting.

---

## 📌 Table of Contents

- [Overview](#-overview)
- [Key Features](#-key-features)
- [Tech Stack](#-tech-stack)
- [Repository Structure](#-repository-structure)
- [Getting Started](#-getting-started)
  - [Prerequisites](#prerequisites)
  - [1. Backend Service Setup](#1-backend-service-setup)
  - [2. Machine Learning Service Setup](#2-machine-learning-service-setup)
  - [3. Mobile Application Setup (Expo)](#3-mobile-application-setup-expo)
  - [4. Docker Setup (Optional for MySQL)](#4-docker-setup-optional-for-mysql)
- [Environment Variables](#-environment-variables)
- [API Overview](#-api-overview)
- [Database & Migrations](#-database--migrations)
- [Contributing](#-contributing)
- [License](#-license)

---

## 📖 Overview

**CropPulse** bridges the gap between rural farmers, wholesale buyers, and transport operators. Agriculture often suffers from volatile market pricing, high intermediary costs, and inefficient transport. CropPulse tackles these challenges through:

1. **Direct Marketplace**: Seamless trade directly between farmers and buyers with live order tracking.
2. **Collaborative Logistics Pooling**: Smallholder farmers can bundle freight into single shared transport trips, slashing logistics costs.
3. **Machine Learning Price Forecasting**: Predictive models built on top of historical Mandi (APMC) modal prices, assisting farmers on when and where to sell.
4. **Real-time Collaboration**: Live trip coordination, group chat, and instant push notifications.

---

## ✨ Key Features

### 🌾 Crop Marketplace & Trading

- Browse and search crop listings with transparent modal prices, quantities, and quality grades.
- Buyer purchase requests and supplier order workflow (`PENDING` ➔ `ACCEPTED` ➔ `CONFIRMED` ➔ `DELIVERED`).
- User role management: `FARMER`, `BUYER`, `LOGISTICS_PROVIDER`, and `ADMIN`.

### 🚚 Shared Logistics & Transport Pooling

- **Trip Creation**: Farmers or transport providers list trips specifying destination market, vehicle capacity, and departure dates.
- **Pooled Joining**: Nearby farmers can request to join an existing trip, specifying partial cargo weight to split transit fees.
- **Join Approvals**: Trip hosts accept or decline join requests with automatic capacity re-calculation.
- **Trip-Linked Group Chat**: Authenticated real-time Socket.IO chat rooms for active trip participants.

### 📈 AI/ML Price Prediction Engine

- Trained **XGBoost Regressor** models forecasting 1-day, 3-day, and 7-day modal prices.
- Confidence intervals, price trend historical series, and minimum/maximum ranges.
- Automated fallback to statistical heuristics when historical data points are sparse.

### ⛅ Hyperlocal Weather & Ag-Advisories

- Dynamic weather widgets presenting temperature, precipitation, humidity, and wind conditions.
- Sowing and harvesting advisories tailored to current forecast patterns.

### 🎨 Design System & Accessibility

- Material 3-inspired design tokens (`constants/theme.ts`).
- Full automatic light & dark mode support via custom `useTheme()` hooks.
- Smooth animations powered by `react-native-reanimated` and scalable vector charts using `react-native-svg`.

---

## 🛠 Tech Stack

| Domain | Technology | Description |
| --- | --- | --- |
| Mobile Frontend | React Native (v0.81.5) + Expo (v54) | Cross-platform mobile development (Android, iOS, Web) |
| Mobile Frontend | Expo Router (v6) | Type-safe, file-based routing and navigation |
| Mobile Frontend | React Native Reanimated & SVG | Micro-interactions, animated transitions, charts |
| Mobile Frontend | Socket.IO Client | Real-time bi-directional messaging & live updates |
| Backend API | Node.js & Express (v5) | REST API server with TypeScript compilation |
| Backend API | Prisma ORM (v5.22) | Type-safe database queries with schema migrations |
| Backend API | Socket.IO (v4.8) | Real-time room management (`user:id`, `conversation:id`) |
| Backend API | JWT & Bcrypt | Secure password hashing and stateless token auth |
| Machine Learning | Python 3.10+ & FastAPI | High-performance asynchronous ML microservice |
| Machine Learning | XGBoost & Scikit-Learn | Time-series crop price prediction models |
| Machine Learning | Pandas & NumPy | Market data manipulation and feature engineering |
| Database & DevOps | SQLite / MySQL 8.0 | SQLite for rapid local dev; MySQL for production |
| Database & DevOps | Docker & Docker Compose | Containerized database for local and staging environments |

---

## 📁 Repository Structure

```text
CropPulse/
├── CropPulse/                 # Mobile Application (Expo / React Native)
│   ├── app/                   # Expo Router file-based screens
│   │   ├── (tabs)/            # Bottom navigation: Home, Prediction, Marketplace, Profile
│   │   ├── logistics*.tsx     # Logistics pooling, trip creation, chat, and details
│   │   ├── login.tsx          # Authentication & sign in
│   │   ├── orders.tsx         # Order history & status
│   │   └── notifications.tsx  # Alerts & notification feed
│   ├── components/            # Reusable UI components (Cards, Inputs, WeatherWidget)
│   ├── constants/             # Design tokens, color palette, theme definitions
│   ├── hooks/                 # Custom React hooks (useTheme, useFadeIn)
│   ├── services/              # API clients & Socket.IO service connectors
│   └── types/                 # Shared TypeScript interfaces
│
├── backend/                   # Node.js + Express REST API & Socket.IO Server
│   ├── prisma/                # Prisma schema & migrations (SQLite & MySQL)
│   │   ├── schema.prisma      # Default development schema (SQLite)
│   │   ├── mysql/             # Production MySQL schema & migrations
│   │   └── seed.ts            # Database seed script for crops & mandi prices
│   ├── src/
│   │   ├── controllers/       # Route request handlers
│   │   ├── middlewares/       # Auth guards & validation middlewares
│   │   ├── routes/            # Express endpoint route definitions
│   │   ├── services/          # Business logic & socket handlers
│   │   └── index.ts           # Server initialization & Socket.IO setup
│   └── tsconfig.json          # TypeScript backend configuration
│
├── ml/                        # Machine Learning Microservice (FastAPI)
│   ├── models/                # Trained XGBoost model binaries (.pkl)
│   ├── app.py                 # FastAPI service endpoints (/predict, /catalog)
│   └── requirements.txt       # Python package dependencies
│
└── docker-compose.yml         # Container configuration for MySQL 8.0
```

---

## 🚀 Getting Started

### Prerequisites

- **Node.js**: v18.0.0 or higher
- **npm** or **yarn**
- **Python**: 3.10 or higher
- **Expo Go** app on your physical mobile device, or Android Studio / Xcode emulators
- **Docker** (optional, only if running MySQL locally)

### 1. Backend Service Setup

Open a terminal and navigate to the `backend/` directory:

```bash
cd backend
```

Install dependencies:

```bash
npm install
```

Configure environment variables:

```bash
cp .env.example .env
```

Prepare the database and apply the schema:

```bash
npx prisma db push
npx prisma generate
```

(Optional) Seed initial crop catalog and mandi price data:

```bash
npm run seed
```

Start the development server:

```bash
npm run dev
```

The backend will run at `http://localhost:5000` (or the configured `PORT`).

### 2. Machine Learning Service Setup

Open a new terminal and navigate to the `ml/` directory:

```bash
cd ml
```

Create and activate a Python virtual environment:

**Windows:**

```powershell
python -m venv .venv
.\.venv\Scripts\activate
```

**macOS / Linux:**

```bash
python3 -m venv .venv
source .venv/bin/activate
```

Install required Python packages:

```bash
pip install -r requirements.txt
```

Launch the FastAPI server:

```bash
uvicorn app:app --host 0.0.0.0 --port 8000 --reload
```

The ML microservice will be available at `http://localhost:8000` with interactive Swagger docs at `http://localhost:8000/docs`.

### 3. Mobile Application Setup (Expo)

Open a new terminal and navigate to the `CropPulse/` directory:

```bash
cd CropPulse
```

Install dependencies:

```bash
npm install
```

Configure your API endpoint: create a `.env` file in `CropPulse/` (or rely on automatic Metro host resolution):

```env
EXPO_PUBLIC_API_URL=http://<YOUR_LOCAL_IP>:5000
```

Start the Expo development server:

```bash
npx expo start
```

Open the app:

- Press `a` for Android Emulator.
- Press `i` for iOS Simulator.
- Press `w` for Web Browser.
- Or scan the QR code using the Expo Go app on your phone.

### 4. Docker Setup (Optional for MySQL)

To run a containerized MySQL 8.0 instance locally instead of SQLite:

From the project root, run:

```bash
docker compose up -d
```

In `backend/.env`, configure your database URL:

```env
DATABASE_URL="mysql://croppulse:croppulse123@localhost:3306/croppulse"
```

Run the MySQL migration commands from `backend/`:

```bash
npm run db:generate:mysql
npm run db:migrate:mysql:deploy
```

---

## 🔐 Environment Variables

### Backend (`backend/.env`)

| Variable | Default Value | Description |
| --- | --- | --- |
| `PORT` | `5000` | Port for Express server |
| `DATABASE_URL` | `file:./dev.db` | SQLite path or MySQL connection URI |
| `JWT_SECRET` | `secret` | Secret key for signing JSON Web Tokens |
| `CORS_ORIGIN` | `*` | Allowed CORS origins (comma-separated in production) |
| `ML_SERVICE_URL` | `http://localhost:8000` | Address of the FastAPI prediction service |

### Mobile App (`CropPulse/.env`)

| Variable | Default Value | Description |
| --- | --- | --- |
| `EXPO_PUBLIC_API_URL` | `http://localhost:5000` | Root URL of the CropPulse backend API |

---

## 📡 API Overview

| Method | Endpoint | Description | Auth Required |
| --- | --- | --- | --- |
| POST | `/api/auth/register` | Register new user account | No |
| POST | `/api/auth/login` | Authenticate user and issue JWT | No |
| GET | `/api/auth/me` | Fetch currently logged in user profile | Yes |
| GET | `/api/crops` | List crop catalog and current prices | No |
| GET | `/api/listings` | Fetch active marketplace listings | No |
| POST | `/api/listings` | Create a new crop listing for sale | Yes |
| POST | `/api/orders` | Place an order on a crop listing | Yes |
| GET | `/api/logistics` | Retrieve available pooled trips | Yes |
| POST | `/api/logistics` | Create a new transport request | Yes |
| POST | `/api/logistics/:id/join` | Request to join an existing trip | Yes |
| PATCH | `/api/logistics/:id/join/:joinId` | Accept or reject a pooling request | Yes |
| POST | `/api/predictions/predict` | Predict crop price (1, 3, or 7 days) | Yes |
| GET | `/api/weather` | Current weather and farming advisories | No |

---

## 🗄 Database & Migrations

The database models are maintained using Prisma:

- **Dual-Database Architecture**: Supports both zero-config local development with SQLite (`backend/prisma/schema.prisma`) and production deployments with MySQL (`backend/prisma/mysql/schema.prisma`).
- **Core Entities**:
  - `User`, `FarmerProfile`, `BuyerProfile`, `LogisticsProvider`
  - `Crop`, `Market`, `MarketPrice` (Historical APMC arrival & modal prices)
  - `Listing`, `Order`
  - `LogisticsRequest`, `LogisticsJoinRequest`, `LogisticsParticipant`
  - `Conversation`, `ConversationMember`, `Message`, `Notification`

---

## 🤝 Contributing

Contributions make the open-source community a better place to learn, inspire, and create. Any contributions you make are greatly appreciated.

1. Fork the Project.
2. Create your Feature Branch (`git checkout -b feature/AmazingFeature`).
3. Commit your Changes (`git commit -m 'Add some AmazingFeature'`).
4. Push to the Branch (`git push origin feature/AmazingFeature`).
5. Open a Pull Request.

Make sure to run linting and type checks prior to pushing:

```bash
# In backend/
npm run build

# In CropPulse/
npm run lint
npm run typecheck
```

---

## 📄 License

Distributed under the MIT License. See `LICENSE` for more information.
