# Blockchain 101

An educational blockchain application demonstrating proof-of-work mining, transactions, and real-time updates using Server-Sent Events (SSE).

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                         DOCKER HOST                             │
│                                                                 │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │              Docker Compose Network                        │ │
│  │                                                            │ │
│  │  ┌──────────────────────┐      ┌──────────────────────┐    │ │
│  │  │  Frontend Container  │      │  Backend Container   │    │ │
│  │  │                      │      │                      │    │ │
│  │  │  ┌────────────────┐  │      │  ┌────────────────┐  │    │ │
│  │  │  │  Nginx:80      │  │      │  │  Node.js:9001  │  │    │ │
│  │  │  │                │  │      │  │                │  │    │ │
│  │  │  │  Serves:       │  │      │  │  Express API   │  │    │ │
│  │  │  │  - index.html  │  │      │  │  - /blockchain │  │    │ │
│  │  │  │  - bundle.js   │  │      │  │  - /mine       │  │    │ │
│  │  │  │  - CSS/assets  │  │      │  │  - /mempool    │  │    │ │
│  │  │  │                │  │      │  │  - SSE updates │  │    │ │
│  │  │  └────────────────┘  │      │  └────────────────┘  │    │ │
│  │  │                      │      │                      │    │ │
│  │  │  Port: 9000 ─────────┼──────┼─► Port: 9001         │    │ │
│  │  │  (mapped to host)    │      │  (internal network)  │    │ │
│  │  └──────────────────────┘      └──────────────────────┘    │ │
│  │           │                              ▲                 │ │
│  │           │    API Calls via             │                 │ │
│  │           │    BACKEND_API_URL           │                 │ │
│  │           └──────────────────────────────┘                 │ │
│  │                                                            │ │
│  │  ┌──────────────────────────────────────────────────────┐  │ │
│  │  │             Firebase (External Service)              │  │ │
│  │  │  - Firestore Database (blockchain data)              │  │ │
│  │  │  - Accessed via Firebase Admin SDK                   │  │ │
│  │  └──────────────────────────────────────────────────────┘  │ │
│  │                              ▲                             │ │
│  │                              │                             │ │
│  │                              │ (credentials from .env)     │ │
│  │                              │                             │ │
│  └──────────────────────────────┼─────────────────────────────┘ │
│                                 │                               │
└─────────────────────────────────┼───────────────────────────────┘
                                  │
                          ┌───────▼────────┐
                          │  Internet      │
                          │  (Firebase)    │
                          └────────────────┘
```

## 📁 Project Structure

```
blockchain101/
├── backend/                 # Node.js + TypeScript + Express API
│   ├── src/
│   │   ├── classes/        # Block and Blockchain classes
│   │   ├── constants/      # Configuration constants
│   │   ├── routes/         # Express routes
│   │   ├── services/       # Business logic (blockchain, db)
│   │   ├── types/          # TypeScript type definitions
│   │   ├── utils/          # Helper functions
│   │   └── server.ts       # Express server entry point
│   ├── dist/               # Compiled JavaScript (build output)
│   ├── Dockerfile          # Backend container definition
│   ├── .dockerignore
│   ├── package.json
│   └── tsconfig.json
│
├── frontend/               # React + TypeScript SPA
│   ├── src/
│   │   ├── components/     # React components
│   │   ├── hooks/          # Custom React hooks
│   │   ├── styles/         # CSS files
│   │   ├── types/          # TypeScript types
│   │   ├── utils/          # Helper functions
│   │   ├── App.tsx         # Main React component
│   │   └── index.tsx       # Entry point
│   ├── public/             # Static assets
│   ├── dist/               # Webpack build output
│   ├── Dockerfile          # Frontend container definition
│   ├── nginx.conf          # Nginx configuration
│   ├── .dockerignore
│   ├── package.json
│   ├── tsconfig.json
│   └── webpack.config.js
│
└── docker-compose.yml      # Multi-container orchestration
```

## 🚀 Getting Started

### Prerequisites

- Node.js 18+
- npm or yarn
- Docker & Docker Compose (for containerized deployment)
- Firebase project (for database)

### Local Development (without Docker)

1. **Clone the repository**
   ```bash
   git clone <your-repo-url>
   cd blockchain101
   ```

2. **Set up Firebase**
   - Create a Firebase project
   - Download service account credentials
   - Create `backend/.env` file:
     ```
     BACKEND_API_URL=http://localhost:9001
     FIREBASE_PROJECT_ID=your-project-id
     FIREBASE_CLIENT_EMAIL=your-client-email
     FIREBASE_PRIVATE_KEY="your-private-key"
     ```

3. **Install and run Backend**
   ```bash
   cd backend
   npm install
   npm run dev        # Development mode
   # OR
   npm run build      # Build TypeScript
   npm start          # Production mode
   ```

4. **Install and run Frontend** (in a new terminal)
   ```bash
   cd frontend
   npm install
   npm start          # Development mode on port 9000
   # OR
   npm run build      # Build for production
   ```

5. **Access the application**
   - Frontend: http://localhost:9000
   - Backend API: http://localhost:9001

### Docker Development

1. **Build and run with Docker Compose**
   ```bash
   docker-compose up --build
   ```

2. **Access the application**
   - Frontend: http://localhost:9000
   - Backend API: http://localhost:9001

3. **Stop the containers**
   ```bash
   docker-compose down
   ```

## 🔨 Build Process

### Frontend Build
```
┌─────────────────┐
│ 1. npm ci       │ Install dependencies
├─────────────────┤
│ 2. npm run build│ Webpack bundles React app
├─────────────────┤
│ 3. dist/        │ Creates static files
│    - index.html │ HTML entry point
│    - bundle.js  │ Bundled JavaScript
│    - assets/    │ Images, fonts, etc.
├─────────────────┤
│ 4. Copy to nginx│ Nginx serves static files
└─────────────────┘
```

### Backend Build
```
┌─────────────────┐
│ 1. npm ci       │ Install dependencies
├─────────────────┤
│ 2. tsc          │ Compile TypeScript to JavaScript
├─────────────────┤
│ 3. dist/        │ Creates compiled JS files
│    - server.js  │ Express server
│    - routes/    │ API routes
│    - services/  │ Business logic
├─────────────────┤
│ 4. npm start    │ Run: node dist/server.js
└─────────────────┘
```

## 🌐 Communication Flow

1. User opens browser → `http://localhost:9000`
2. Nginx (frontend container) serves `index.html` + `bundle.js`
3. React app loads in browser
4. User clicks "Add Transaction"
5. React sends `POST http://localhost:9001/transaction`
6. Express backend receives request
7. Backend saves to Firebase
8. Backend returns JSON response
9. React updates UI
10. SSE connection streams real-time mining progress

## 📦 Docker Images

### Frontend Image
- **Base**: `node:18-alpine` (build) + `nginx:alpine` (runtime)
- **Size**: ~25MB (compressed)
- **Purpose**: Serve static React build files
- **Exposed Port**: 80 (mapped to 9000 on host)

### Backend Image
- **Base**: `node:18-alpine`
- **Size**: ~150MB
- **Purpose**: Run Express API server
- **Exposed Port**: 9001

## 🔧 Technologies

### Backend
- **Runtime**: Node.js 18
- **Language**: TypeScript
- **Framework**: Express.js
- **Database**: Firebase Firestore
- **Key Libraries**:
  - `ethers.js` - Ethereum utilities
  - `crypto-js` - Cryptographic functions
  - `cors` - Cross-origin resource sharing

### Frontend
- **Framework**: React 18
- **Language**: TypeScript
- **Build Tool**: Webpack
- **Key Libraries**:
  - `ethers.js` - Ethereum utilities
  - `react-dom` - React rendering

### DevOps
- **Containerization**: Docker
- **Orchestration**: Docker Compose
- **Web Server**: Nginx (for frontend)
- **CI/CD**: GitHub Actions (planned)

## 🎯 Features

- ✅ **Proof-of-Work Mining**: Adjustable difficulty (1-7 leading zeros)
- ✅ **Real-time Mining Progress**: Server-Sent Events (SSE) for live updates
- ✅ **Transaction Management**: Add transactions to mempool
- ✅ **Block Explorer**: View entire blockchain
- ✅ **Abort Mining**: Stop mining process mid-execution
- ✅ **Persistent Storage**: Firebase Firestore integration
- ✅ **Responsive UI**: Retro gaming aesthetic

## 📝 API Endpoints

### Blockchain
- `GET /blockchain` - Fetch entire blockchain
- `DELETE /blockchain` - Delete entire blockchain

### Transactions
- `POST /transaction` - Add transaction to mempool
- `GET /mempool` - Get all pending transactions

### Mining
- `GET /mine` - Mine a new block
- `POST /abort-mining` - Stop current mining operation
- `GET /mining-progress` - SSE endpoint for real-time mining updates
- `GET /mining-state` - Get current mining state

### Configuration
- `GET /difficulty` - Get current mining difficulty
- `POST /difficulty` - Set mining difficulty (1-7)

## 🐛 Development

### Backend Development
```bash
cd backend
npm run dev          # Start with nodemon + ts-node
npm run build        # Compile TypeScript
npm start            # Run compiled code
```

### Frontend Development
```bash
cd frontend
npm start            # Start webpack dev server (port 9000)
npm run build        # Build for production
```

## 🧪 Testing

```bash
# Backend tests (coming soon)
cd backend
npm test

# Frontend tests (coming soon)
cd frontend
npm test
```

## 📄 License

This project is for educational purposes.

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.
