# Blockchain 101

![CI:Build](https://img.shields.io/github/actions/workflow/status/realgalinganchev/blockchain101/build.yml?label=CI%3ABuild&branch=main)
![CI:Deploy](https://img.shields.io/github/actions/workflow/status/realgalinganchev/blockchain101/deploy.yml?label=CI%3ADeploy&branch=main)
![Docker](https://img.shields.io/badge/docker-galinganchev%2Fblockchain101-blue?logo=docker)
![Kubernetes](https://img.shields.io/badge/kubernetes-DOKS-326CE5?logo=kubernetes)
![License](https://img.shields.io/badge/license-educational-green)

An educational blockchain application demonstrating proof-of-work mining, transactions, and real-time updates using Server-Sent Events (SSE).

This project models the core mechanics of **Ethereum's Proof-of-Work consensus** (pre-Merge, pre-EIP-3675). It uses the same cryptographic primitives — **Keccak-256** hashing and **RLP encoding** — the same nonce-based mining loop, and a block structure mirroring Ethereum's (`nonce`, `previousHash`, `gasLimit`, `gasUsed`, `miner`, `timestamp`, `transactions`). Difficulty is represented as a leading-zero target on the hash, analogous to Ethereum's target threshold. The chain omits Ethash's DAG/epoch complexity and the P2P network layer, keeping the focus on the fundamental PoW mechanics.

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
│   ├── nginx.conf          # Nginx reverse proxy config (envsubst template)
│   ├── .dockerignore
│   ├── package.json
│   ├── tsconfig.json
│   └── webpack.config.js
│
├── k8s/                     # Kubernetes manifests
│   ├── namespace.yaml
│   ├── backend-deployment.yaml
│   ├── backend-service.yaml
│   ├── frontend-deployment.yaml
│   └── frontend-service.yaml
│
├── terraform/               # Infrastructure as Code (DigitalOcean)
│   ├── provider.tf
│   ├── main.tf
│   ├── variables.tf
│   ├── outputs.tf
│   └── terraform.tfvars.example
│
├── scripts/                 # Devnet automation scripts
│   ├── populate-devnet.js
│   ├── verify-state.js
│   └── package.json
│
├── run.sh                   # Interactive playground CLI
└── docker-compose.yml       # Multi-container orchestration
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
   docker compose up --build -d
   ```

2. **Access the application**
   - Frontend: http://localhost:9000
   - Backend API: http://localhost:9001

3. **Stop the containers**
   ```bash
   docker compose down
   ```

Or use the interactive playground:
```bash
./run.sh   # then choose 1 → 2 (Rebuild + start)
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
5. React sends `POST /api/transaction` (relative URL)
6. Nginx reverse-proxies `/api/*` → `http://backend:9001/*`
7. Express backend receives request
8. Backend saves to Firebase
9. Backend returns JSON response
10. React updates UI
11. SSE connection streams real-time mining progress

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
  - `ethers.js` - Ethereum utilities (Keccak-256, RLP encoding)
  - `elliptic` - Transaction signing (ECDSA / secp256k1)
  - `crypto-js` - Cryptographic functions
  - `react-dom` - React rendering

### DevOps
- **Containerization**: Docker
- **Orchestration**: Docker Compose
- **Web Server**: Nginx (for frontend)
- **CI/CD**: GitHub Actions
- **IaC**: Terraform (DigitalOcean)
- **Kubernetes**: DOKS (DigitalOcean Kubernetes Service)

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

## 🎮 Interactive Playground (`run.sh`)

A single interactive CLI to run everything:

```bash
./run.sh
```

```
⛓️  blockchain101 Playground
  1) Docker    — local devnet (build/start/stop/logs)
  2) Scripts   — populate / verify / test
  3) Terraform — infrastructure
  4) Kubernetes — deploy / manage
  5) App       — open / status
  0) Exit
```

Each submenu has numbered options — no need to remember commands.

---

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
# 1. Start devnet (rebuild to pick up any image changes)
docker compose up --build -d

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

## ☸️ Kubernetes Deployment (DigitalOcean)

The app deploys to **DigitalOcean Kubernetes Service (DOKS)**. Default config: 1 node, `s-1vcpu-2gb` size (~$12/mo), region `fra1` (Frankfurt).

### Infrastructure (via Terraform)

```
terraform/
├── provider.tf       # DigitalOcean + Kubernetes provider config
├── variables.tf      # Input variables
├── main.tf           # DOKS cluster, node pool, k8s namespace + Firebase secret
├── outputs.tf        # Cluster endpoint, kubeconfig command
└── terraform.tfvars.example  # Template — copy to terraform.tfvars
```

### Deploy infrastructure
```bash
cd terraform
cp terraform.tfvars.example terraform.tfvars
# Fill in your DigitalOcean API token (do_token) in terraform.tfvars

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

### Terraform / DigitalOcean issues

- Ensure `doctl` is installed and authenticated: `doctl account get`
- Verify your `do_token` in `terraform.tfvars` is a valid DigitalOcean personal access token
- See `terraform/README.md` for detailed setup steps

---

---

## 🔬 DevOps Deep-Dive

How each DevOps layer works, with visual diagrams.

### Docker — Local Development

Both images use multi-stage builds to keep the final image small.

**Frontend** (`frontend/Dockerfile`):
```
Stage 1 — builder (node:18-alpine)          Stage 2 — runtime (nginx:alpine)
┌─────────────────────────────────┐          ┌──────────────────────────────┐
│  npm ci                         │          │                              │
│  COPY src/                      │  COPY    │  /usr/share/nginx/html/      │
│  npm run build  ──────────────► │ ──────►  │    index.html                │
│                   /app/dist/    │          │    bundle.js                 │
│                                 │          │    assets/                   │
│  (node_modules discarded)       │          │                              │
└─────────────────────────────────┘          │  nginx.conf (template)       │
                                             │  → envsubst at runtime       │
                                             │  → /etc/nginx/conf.d/        │
                                             └──────────────────────────────┘
Final image: ~25 MB (no Node.js, no source code)
```

**Backend** (`backend/Dockerfile`):
```
Stage 1 — builder (node:18-alpine)          Stage 2 — runtime (node:18-alpine)
┌─────────────────────────────────┐          ┌──────────────────────────────┐
│  npm ci                         │          │                              │
│  COPY src/                      │  COPY    │  /app/dist/   (JS only)      │
│  tsc  ──────────────────────►   │ ──────►  │  /app/node_modules/          │
│          /app/dist/             │          │                              │
│                                 │          │  node dist/server.js         │
└─────────────────────────────────┘          └──────────────────────────────┘
Final image: ~150 MB
```

**nginx reverse proxy**

The frontend container serves the React app AND proxies `/api/*` calls to the backend. The browser only ever talks to one origin — no CORS issues.

```
Browser                    Frontend Container (nginx)         Backend Container (Node.js)
   │                              │                                    │
   │  GET /                       │                                    │
   │ ─────────────────────────►   │                                    │
   │  ◄─────────────────────────  │                                    │
   │  index.html + bundle.js      │                                    │
   │                              │                                    │
   │  POST /api/transaction       │                                    │
   │ ─────────────────────────►   │                                    │
   │                              │  rewrite /api/transaction          │
   │                              │       → /transaction               │
   │                              │  POST http://backend:9001/         │
   │                              │  transaction                       │
   │                              │ ─────────────────────────────────► │
   │                              │  ◄───────────────────────────────  │
   │  ◄─────────────────────────  │  200 OK { txHash: "0x..." }        │
   │  200 OK { txHash: "0x..." }  │                                    │
```

The nginx config uses `envsubst` so the backend hostname is injected at container startup — no rebuild needed:

```
nginx.conf.template                          nginx.conf (generated at startup)
─────────────────────────────────            ─────────────────────────────────
resolver ${BACKEND_RESOLVER} ...    ──►      resolver 127.0.0.11 ...
set $upstream http://${BACKEND_HOST}:9001    set $upstream http://backend:9001
```

**docker-compose network**

```
┌────────────────────────── blockchain-network (bridge) ───────────────────────────┐
│                                                                                   │
│   ┌─────────────────────────────┐         ┌────────────────────────────────┐      │
│   │  blockchain101-frontend     │         │  blockchain101-backend         │      │
│   │                             │         │                                │      │
│   │  BACKEND_HOST=backend       │         │  PORT=9001                     │      │
│   │  BACKEND_RESOLVER=127.0.0.11│         │  Firebase credentials via .env │      │
│   │                             │         │                                │      │
│   │  :80 (internal)             │         │  :9001 (internal)              │      │
│   └──────────────┬──────────────┘         └────────────────────────────────┘      │
│                  │                                       ▲                         │
│          port mapping                         DNS name "backend"                  │
│          9000:80                              resolves inside network              │
└──────────────────┼────────────────────────────────────────────────────────────────┘
                   │
           HOST MACHINE
           localhost:9000 ── browser access
           localhost:9001 ── direct API access
```

---

### CI:Build — How it works

A PR must be **merged** AND have the `CI:Build` label attached before merging.

```
Developer                  GitHub                     GitHub Actions Runner
    │                         │                               │
    │  git push               │                               │
    │ ──────────────────────► │                               │
    │  open PR                │                               │
    │ ──────────────────────► │                               │
    │  add label "CI:Build"   │                               │
    │ ──────────────────────► │                               │
    │  click Merge            │                               │
    │ ──────────────────────► │  pull_request (closed+merged) │
    │                         │  + label = CI:Build           │
    │                         │ ────────────────────────────► │
    │                         │                               │  checkout code
    │                         │                               │  docker buildx setup
    │                         │                               │  docker login
    │                         │                               │  build backend image
    │                         │                               │  push to Docker Hub
    │                         │                               │  build frontend image
    │                         │                               │  push to Docker Hub
    │  ◄─────────────────────────────────────────────────────  │
    │  workflow complete                                        │
```

Each merge produces two tags per image:
```
galinganchev/blockchain101-backend
├── :latest          ← always points to most recent main branch build
└── :main-<sha>      ← immutable, points to exact commit

galinganchev/blockchain101-frontend
├── :latest
└── :main-<sha>
```

The workflow uses GitHub Actions layer cache (`type=gha`) — unchanged layers (e.g. `npm ci` when `package.json` didn't change) are never rebuilt.

---

### CI:Deploy — How it works

Produces a `:pre-mined` image — built and tested against a Firebase instance populated with 5 blocks and 10 transactions.

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                        CI:Deploy Pipeline                                   │
│                                                                             │
│  ① Checkout + Docker login                                                  │
│  ② Write Firebase credentials → backend/.env  (from GitHub Secrets)         │
│  ③ docker compose up -d  (start devnet)                                     │
│  ④ Health check: poll GET /blockchain until 200                              │
│  ⑤ DELETE /blockchain  →  restart backend  (fresh genesis block)            │
│  ⑥ scripts/populate-devnet.js  →  10 transactions + mine 5 blocks           │
│  ⑦ scripts/verify-state.js  (assert chain integrity)                        │
│  ⑧ docker compose down                                                      │
│  ⑨ Build & push  :pre-mined  and  :pre-mined-<sha>  to Docker Hub           │
│  ⑩ Start pre-mined images → run npm test → docker compose down              │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

> The blockchain data lives in Firebase (external DB), not baked into the image. `:pre-mined` means "built and verified against a known-good populated blockchain state."

---

### Terraform — Infrastructure as Code

One `terraform apply` creates everything needed to run in the cloud:

```
terraform apply
     │
     ├──► DigitalOcean Kubernetes Cluster  (DOKS)
     │       region: fra1 (Frankfurt)
     │       version: 1.32.x
     │       node pool: 1 × s-1vcpu-2gb (~$12/mo)
     │
     ├──► Kubernetes Namespace  "blockchain101"
     │
     └──► Kubernetes Secret  "firebase-credentials"
              all 11 FIREBASE_* fields
```

Terraform uses two providers chained together — the Kubernetes provider is bootstrapped from the cluster output, so no manual kubeconfig step is needed during provisioning:

```
DigitalOcean provider  →  creates cluster  →  Kubernetes provider reads:
                                                 .endpoint
                                                 .kube_config[0].token
                                                 .kube_config[0].cluster_ca_certificate
```

Firebase secrets are passed as `TF_VAR_*` environment variables — never written to `terraform.tfvars` which could be accidentally committed.

---

### Kubernetes — Runtime Orchestration

**Cluster layout**

```
DigitalOcean Cloud
└── DOKS Cluster  (blockchain101-cluster, fra1)
    └── Node Pool  (1 × s-1vcpu-2gb)
        └── Node
            └── Namespace: blockchain101
                ├── Deployment: blockchain101-backend
                │   └── Pod: Node.js Express  port 9001
                │           env: FIREBASE_* (from Secret)
                │
                ├── Deployment: blockchain101-frontend
                │   └── Pod: nginx + React app  port 80
                │           env: BACKEND_HOST, BACKEND_RESOLVER
                │
                ├── Service: blockchain101-backend   (LoadBalancer :9001)
                ├── Service: blockchain101-frontend  (LoadBalancer :80)
                └── Secret:  firebase-credentials
```

**Pod-to-pod communication via Kubernetes DNS**

Pods never talk by IP (IPs change on restart). They use DNS names:

```
  BACKEND_HOST     = "blockchain101-backend.blockchain101.svc.cluster.local"
  BACKEND_RESOLVER = "kube-dns.kube-system.svc.cluster.local"

  nginx  →  kube-dns resolves name  →  ClusterIP  →  Backend Service  →  Pod :9001
```

**Rolling update strategy** (`maxUnavailable: 1, maxSurge: 0`)

```
Before:  Pod A (old) — Running
Step 1:  Pod A — Terminating   (brief unavailability — only 1 node, no room for surge)
Step 2:  Pod B (new) — Running ✓
```

**Secret injection**

```
Secret "firebase-credentials"           Backend Pod
┌──────────────────────────────┐        ┌──────────────────────────────┐
│ FIREBASE_PROJECT_ID: base64  │        │ FIREBASE_PROJECT_ID=xxx      │
│ FIREBASE_PRIVATE_KEY: base64 │ ──────►│ FIREBASE_PRIVATE_KEY=xxx     │
│ ...                          │        │ ...                          │
└──────────────────────────────┘        └──────────────────────────────┘
  stored encrypted in etcd                available as env vars at runtime
  never in source code
```

---

### The Full Picture — Code to Production

```
┌──────────────────────────────────────────────────────────────────────────────────┐
│  SOURCE CODE  (GitHub)                                                           │
│  branches / PRs / labels                                                         │
└──────────────────────────────┬───────────────────────────────────────────────────┘
                               │ merge with CI:Build label
                               ▼
┌──────────────────────────────────────────────────────────────────────────────────┐
│  CI/CD  (GitHub Actions)                                                         │
│  build.yml  → builds Docker images                                               │
│  deploy.yml → builds pre-mined images                                            │
└──────────────────────────────┬───────────────────────────────────────────────────┘
                               │ docker push
                               ▼
┌──────────────────────────────────────────────────────────────────────────────────┐
│  ARTIFACT REGISTRY  (Docker Hub)                                                 │
│  galinganchev/blockchain101-backend:latest                                       │
│  galinganchev/blockchain101-frontend:latest                                      │
└──────────────────────────────┬───────────────────────────────────────────────────┘
                               │ kubectl rollout restart → docker pull
                               ▼
┌──────────────────────────────────────────────────────────────────────────────────┐
│  INFRASTRUCTURE  (DigitalOcean — provisioned once by Terraform)                  │
│                                                                                  │
│  ┌────────────────────────────────────────────────────────────────────────────┐  │
│  │  DOKS Cluster  fra1                                                        │  │
│  │  ┌──────────────────────────────────────────────────────────────────────┐  │  │
│  │  │  Namespace: blockchain101                                            │  │  │
│  │  │                                                                      │  │  │
│  │  │  ┌─────────────────────────┐    ┌─────────────────────────────────┐  │  │  │
│  │  │  │ frontend Deployment     │    │ backend Deployment              │  │  │  │
│  │  │  │  Pod: nginx + React     │───►│  Pod: Node.js + Firebase        │  │  │  │
│  │  │  └────────────┬────────────┘    └────────────────┬────────────────┘  │  │  │
│  │  │  Service (LB) :80              Service (LB) :9001                     │  │  │
│  │  └───────────────┼──────────────────────────────────┼───────────────────┘  │  │
│  └──────────────────┼──────────────────────────────────┼──────────────────────┘  │
└─────────────────────┼──────────────────────────────────┼──────────────────────────┘
                      ▼                                  ▼
              http://138.68.125.204              http://164.90.242.214:9001
```

**Local vs cloud at a glance**

```
                    LOCAL (docker compose)              CLOUD (k8s on DOKS)
                    ──────────────────────              ───────────────────
Image source        Built from source                  Pulled from Docker Hub
BACKEND_HOST        backend  (Docker DNS)              blockchain101-backend
                                                       .blockchain101.svc.cluster.local
BACKEND_RESOLVER    127.0.0.11  (Docker DNS)           kube-dns.kube-system.svc.cluster.local
Firebase creds      backend/.env file                  Kubernetes Secret
Access              localhost:9000                     138.68.125.204:80
Restart             docker compose restart             kubectl rollout restart
Logs                docker compose logs -f             kubectl logs -f -l app=...
```

---

## 📄 License

This project is for educational purposes.

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.
