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
- **CI/CD**: GitHub Actions
- **IaC**: Terraform (OCI)
- **Kubernetes**: OKE (Oracle Container Engine)

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

## ⚙️ CI/CD Workflows

Two GitHub Actions workflows automate the build and deployment pipeline. Both are triggered by **merging a PR with a specific label**.

### CI:Build — Build and Push Docker Images

**Trigger**: Merge a PR with the `CI:Build` label

**What it does**:
1. Builds backend and frontend Docker images
2. Pushes to Docker Hub with two tags: `latest` and `<branch>-<commit-sha>`

**Required GitHub Secrets**:
| Secret | Description |
|---|---|
| `DOCKER_USERNAME` | Your Docker Hub username |
| `DOCKER_PASSWORD` | Your Docker Hub password or access token |

**How to trigger**:
```
1. Create a PR
2. Add the "CI:Build" label
3. Merge the PR → workflow runs automatically
```

---

### CI:Deploy — Build Pre-Mined Blockchain Image

**Trigger**: Merge a PR with the `CI:Deploy` label

**What it does**:
1. Starts the devnet using Docker Compose
2. Clears any existing blockchain state
3. Runs `scripts/populate-devnet.js` — mines 5 blocks with 10 transactions
4. Verifies blockchain state with `scripts/verify-state.js`
5. Builds new Docker images tagged `pre-mined` and `pre-mined-<sha>`
6. Starts the pre-mined images and runs the full test suite
7. Pushes verified images to Docker Hub

**Required GitHub Secrets** (in addition to Docker secrets above):
| Secret | Description |
|---|---|
| `FIREBASE_TYPE` | `service_account` |
| `FIREBASE_PROJECT_ID` | Firebase project ID |
| `FIREBASE_PRIVATE_KEY_ID` | Firebase private key ID |
| `FIREBASE_PRIVATE_KEY` | Firebase private key (full PEM) |
| `FIREBASE_CLIENT_EMAIL` | Firebase client email |
| `FIREBASE_CLIENT_ID` | Firebase client ID |
| `FIREBASE_AUTH_URI` | Firebase auth URI |
| `FIREBASE_TOKEN_URI` | Firebase token URI |
| `FIREBASE_AUTH_PROVIDER_CERT_URL` | Firebase auth provider cert URL |
| `FIREBASE_CLIENT_CERT_URL` | Firebase client cert URL |
| `FIREBASE_UNIVERSE_DOMAIN` | `googleapis.com` |

**Resulting images on Docker Hub**:
- `<username>/blockchain101-backend:pre-mined`
- `<username>/blockchain101-frontend:pre-mined`

---

## 🤖 Automation Scripts

Scripts for populating and verifying a local devnet. Located in `scripts/`.

### Setup
```bash
cd scripts
npm install
```

### Configuration

Edit `scripts/config.json` to customize defaults:
```json
{
  "backendUrl": "http://localhost:9001",
  "defaults": {
    "transactions": 10,
    "blocks": 5,
    "difficulty": 2
  }
}
```

### Available Commands

| Command | Description |
|---|---|
| `npm run populate` | Submit 10 transactions + mine 5 blocks |
| `npm run populate:quick` | Quick populate with fewer blocks |
| `npm run verify` | Verify blockchain state and integrity |
| `npm test` | Run full blockchain state test suite |

### Full workflow example
```bash
# 1. Start devnet
docker compose up -d

# 2. Wait for backend to be ready
curl http://localhost:9001/blockchain

# 3. Populate with transactions and mined blocks
cd scripts && npm run populate

# 4. Verify state
npm run verify

# 5. Run tests
npm test
```

### Individual scripts

- `generate-transactions.js` — submits N transactions to the mempool
- `mine-blocks.js` — mines N blocks
- `populate-devnet.js` — full automation (transactions + mining)
- `verify-state.js` — verifies block count, hashes, chain integrity

---

## ☸️ Kubernetes Deployment (OCI)

The app deploys to **Oracle Kubernetes Engine (OKE)** using the free tier (2x `VM.Standard.E2.1.Micro` nodes — always free).

### Infrastructure (via Terraform)

```
terraform/
├── provider.tf       # OCI + Kubernetes provider config
├── variables.tf      # Input variables
├── main.tf           # VCN, subnets, OKE cluster, node pool, k8s namespace + Firebase secret
├── outputs.tf        # Cluster endpoint, kubeconfig command
└── terraform.tfvars.example  # Template — copy to terraform.tfvars
```

### Deploy infrastructure
```bash
cd terraform
cp terraform.tfvars.example terraform.tfvars
# Fill in OCI credentials in terraform.tfvars

# Set Firebase secrets as env vars (don't commit them)
export TF_VAR_firebase_project_id="..."
export TF_VAR_firebase_private_key="..."
# ... (see terraform/README.md for full list)

terraform init
terraform plan
terraform apply
```

### Configure kubectl
```bash
# Use the command from terraform output
terraform output kubeconfig_command | bash
```

### Deploy application
```bash
kubectl apply -f k8s/
kubectl get services -n blockchain101
# Wait for EXTERNAL-IP to be assigned
```

**Access URLs** (after EXTERNAL-IP is assigned):
- Frontend: `http://<frontend-external-ip>`
- Backend API: `http://<backend-external-ip>:9001`

### Tear down
```bash
kubectl delete -f k8s/
cd terraform && terraform destroy
```

See `terraform/README.md` for full step-by-step instructions and cost details.

---

## 🧪 Testing

```bash
# Blockchain state tests (requires devnet running)
cd scripts
npm test
```

Tests verify:
- Backend connectivity
- Correct block count and genesis block
- Chain integrity (each block links to previous)
- Ethereum-format hash validation
- Transaction structure
- Proof-of-work nonces
- Timestamp ordering
- Difficulty range

---

## 🔐 Secrets Setup

### Docker Hub
1. Go to GitHub repo → Settings → Secrets and variables → Actions
2. Add `DOCKER_USERNAME` and `DOCKER_PASSWORD`

### Firebase
1. Go to Firebase Console → Project Settings → Service accounts
2. Click "Generate new private key" → download JSON
3. Add each field from the JSON as a separate GitHub Secret (see table in CI:Deploy section above)

> **Never commit `.env` files or `terraform.tfvars` with real credentials.**
> Use `.env.example` and `terraform.tfvars.example` as templates.

---

## 🐛 Troubleshooting

### Docker Compose issues

**Backend not starting**
```bash
docker compose logs backend
# Check .env file exists and has correct Firebase credentials
```

**Port already in use**
```bash
lsof -i :9001   # Find what's using the port
docker compose down  # Stop all containers
```

### Firebase connection issues

**`Error: Failed to parse private key`**
- Make sure `FIREBASE_PRIVATE_KEY` has actual newlines, not literal `\n`
- In `.env`: wrap the key in double quotes
- In GitHub Secrets: paste the raw key with real newlines

**`Error: Could not load the default credentials`**
- Verify all `FIREBASE_*` environment variables are set
- Check the service account has Firestore read/write permissions

### CI/CD workflow not triggering

- Confirm the PR was **merged** (not just closed)
- Confirm the correct label (`CI:Build` or `CI:Deploy`) was added **before** merging
- Check Actions tab for any error logs

### Terraform / OCI issues

- Ensure OCI CLI is installed and configured: `oci iam user get --user-id <user_ocid>`
- Verify API key fingerprint matches what's in OCI Console
- See `terraform/README.md` for detailed OCI setup steps

---

## 📄 License

This project is for educational purposes.

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.
