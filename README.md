# Blockchain 101

![CI:Checks](https://img.shields.io/github/actions/workflow/status/realgalinganchev/blockchain101/ci.yml?label=CI%3AChecks&branch=main)
![CI:Build](https://img.shields.io/github/actions/workflow/status/realgalinganchev/blockchain101/build.yml?label=CI%3ABuild&branch=main)
![CI:Deploy](https://img.shields.io/github/actions/workflow/status/realgalinganchev/blockchain101/deploy.yml?label=CI%3ADeploy&branch=main)
![Docker](https://img.shields.io/badge/docker-galinganchev%2Fblockchain101--*-blue?logo=docker)
![AWS](https://img.shields.io/badge/AWS-EC2%20%2B%20SSM-FF9900?logo=amazonwebservices)
![Terraform](https://img.shields.io/badge/IaC-Terraform-7B42BC?logo=terraform)
![Kubernetes](https://img.shields.io/badge/kubernetes-tested%20in%20CI%20%28kind%29-326CE5?logo=kubernetes)
![License](https://img.shields.io/badge/license-educational-green)

**▶ Live demo: [blockchain101.founderexchange.co](https://blockchain101.founderexchange.co)** — add transactions, mine blocks and watch the nonce search stream in live. Runs on AWS, deployed by GitHub Actions; the demo chain resets every night. See [Production Deployment (AWS)](#%EF%B8%8F-production-deployment-aws).

[![blockchain101 mining a block live: nonce counter, hash leading zeros against the target, mempool and linked chain](frontend/public/og.png)](https://blockchain101.founderexchange.co)

An educational blockchain application demonstrating proof-of-work mining, transactions, and real-time updates using Server-Sent Events (SSE).

This project models the core mechanics of **Ethereum's Proof-of-Work consensus** (pre-Merge, pre-EIP-3675). It uses the same cryptographic primitives — **Keccak-256** hashing, **RLP-encoded, ECDSA-signed transactions** (EIP-155) — and the same nonce-based mining loop. Difficulty is represented as a leading-zero target on the hash, analogous to Ethereum's target threshold. The chain omits Ethash's DAG/epoch complexity, account balances and the P2P network layer, keeping the focus on the fundamental PoW mechanics.

## 🔗 How the chain works

**Transactions.** "Add transaction" creates two throwaway wallets in the browser and signs a legacy transfer from one to the other (chain id `1337`, sender nonce `0`). Only the raw signed bytes are sent. The node decodes them and **recovers the sender from the signature**, so nobody can submit a transaction for an address whose key they don't hold. It rejects unsigned or malformed transactions, other chain ids (EIP-155 replay protection), typed (EIP-1559) transactions, contract creation, gas below 21,000, duplicates, and nonces that aren't the sender's next one, which also stops a signed transaction from being replayed. The transaction hash is `keccak256(raw)`, as on Ethereum.

**Blocks.** A block header holds `number`, `timestamp`, `previousHash`, `transactionsRoot` (a Merkle root of the transaction hashes), `difficulty` and `data`. Mining works like Ethash's seal: the header is hashed once (the *seal hash*), then the node tries nonces until `keccak256(sealHash ‖ nonce)` starts with `difficulty` zeros. Because the transactions root is in the header, changing, adding, removing or reordering any transaction changes the block hash, and with it the proof of work and the next block's `previousHash` link.

**Validation.** Before a block is saved or appended, the node checks every signature against the stored fields, the transactions root, the hash, the proof of work, the parent link and the block number. The stored chain is re-checked on startup. Aborting or timing out a mining run leaves its transactions in the mempool.

**Don't trust, verify.** The browser re-implements these rules and checks every block itself: the chain header shows the result, and each block's details list the checks. "Tamper with this block" edits a local copy so you can watch them fail. `scripts/verify-state.js` does the same independently in CI, and a deploy fails if the chain doesn't verify.

**Live for everyone.** One Server-Sent Events stream (`/mining-progress`) carries mining progress plus `mining`, `block`, `mempool`, `difficulty` and `reset` events, so every open tab sees what other visitors do as it happens.

## 🏗️ Architecture

Local Docker Compose setup; production adds Caddy in front (see [Production Deployment (AWS)](#%EF%B8%8F-production-deployment-aws)).

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
│  │  │  │  - bundle.*.js │  │      │  │  - /mine       │  │    │ │
│  │  │  │  - CSS/assets  │  │      │  │  - /mempool    │  │    │ │
│  │  │  │                │  │      │  │  - SSE updates │  │    │ │
│  │  │  └────────────────┘  │      │  └────────────────┘  │    │ │
│  │  │                      │      │                      │    │ │
│  │  │  Port: 9000 ─────────┼──────┼─► Port: 9001         │    │ │
│  │  │  (mapped to host)    │      │  (also mapped)       │    │ │
│  │  └──────────────────────┘      └──────────────────────┘    │ │
│  │           │                              ▲                 │ │
│  │           │    nginx proxies /api/*      │                 │ │
│  │           │    → http://backend:9001/*   │                 │ │
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
│   │   ├── services/       # Business logic (blockchain, events, db stores)
│   │   ├── types/          # TypeScript type definitions
│   │   ├── utils/          # Hashing, Merkle root, validation, tx decoding
│   │   └── server.ts       # Express server entry point
│   ├── test/               # Unit tests (node:test)
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
├── deploy/aws/              # Production (live demo)
│   ├── terraform/          # EC2, IAM (GitHub OIDC), SSM parameters, budget; state in S3
│   ├── docker-compose.yml  # Caddy + frontend + backend, public-demo limits
│   ├── Caddyfile           # HTTPS (Let's Encrypt) in front of nginx
│   └── deploy.sh           # Run on the host through SSM: .env from SSM, pull, restart
│
├── .github/workflows/       # CI:Checks (ci.yml), CI:Build (build.yml), CI:Deploy (deploy.yml)
│
├── scripts/                 # Devnet automation scripts
│   ├── generate-transactions.js
│   ├── mine-blocks.js
│   ├── populate-devnet.js
│   ├── verify-state.js
│   ├── test/               # Blockchain state tests against a running node
│   ├── config.json
│   └── package.json
│
├── k8s/                     # Kubernetes manifests, deployed to a kind cluster in CI on every PR
├── terraform/               # Legacy: DigitalOcean Kubernetes cluster (no longer running)
│
├── run.sh                   # Interactive playground CLI
└── docker-compose.yml       # Multi-container orchestration
```

## 🚀 Getting Started

### Prerequisites

- Node.js 18+
- npm or yarn
- Docker & Docker Compose (for containerized deployment)
- Firebase project (optional: without credentials the backend keeps the chain in memory)

### Local Development (without Docker)

1. **Clone the repository**
   ```bash
   git clone <your-repo-url>
   cd blockchain101
   ```

2. **Set up Firebase** (optional; skip it to run with an in-memory chain that resets on restart, or force that with `STORE=memory`)
   - Create a Firebase project
   - Download service account credentials
   - Create `backend/.env` from the service account fields (all keys are listed in `backend/.env.example`). The minimum is:
     ```
     FIREBASE_PROJECT_ID=your-project-id
     FIREBASE_CLIENT_EMAIL=your-client-email
     FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
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
   touch backend/.env           # required by compose; leave it empty to run with the in-memory store
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
│    - index.html │ HTML entry point (always revalidated)
│    - bundle.<hash>.js  Bundled JavaScript, named by content hash (cached for a year)
├─────────────────┤
│ 4. Copy to nginx│ public/ (favicon, sounds, preview image) + dist/
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
2. Nginx (frontend container) serves `index.html` + `bundle.<hash>.js`
3. React app loads in browser
4. User clicks "Add Transaction"; the browser signs a transfer with a fresh wallet
5. React sends `POST /api/transaction` with `{ raw }` (relative URL)
6. Nginx reverse-proxies `/api/*` → `http://backend:9001/*`
7. Express backend decodes the transaction, recovers the sender and validates it
8. Backend saves it to the mempool (Firestore)
9. Backend returns the decoded transaction as JSON
10. React updates UI
11. The SSE connection streams mining progress and chain events to every open tab

## 📦 Docker Images

### Frontend Image
- **Base**: `node:18-alpine` (build) + `nginx:alpine` (runtime)
- **Size**: ~25MB (compressed)
- **Purpose**: Serve static React build files
- **Exposed Port**: 80 (mapped to 9000 on host)

### Backend Image
- **Base**: `node:18-alpine`
- **Size**: ~80MB (compressed)
- **Purpose**: Run Express API server
- **Exposed Port**: 9001

## 🔧 Technologies

### Backend
- **Runtime**: Node.js 18
- **Language**: TypeScript
- **Framework**: Express.js
- **Database**: Firebase Firestore (in-memory store when no credentials are set)
- **Tests**: `node:test` with `ts-node`
- **Key Libraries**:
  - `ethers.js` - transaction decoding and signature recovery, Keccak-256, ABI encoding
  - `cors` - Cross-origin resource sharing

### Frontend
- **Framework**: React 18
- **Language**: TypeScript
- **Build Tool**: Webpack
- **Key Libraries**:
  - `ethers.js` - wallets, ECDSA (secp256k1) signing, RLP, Keccak-256; also verifies the chain in the browser
  - `react-dom` - React rendering

### DevOps
- **Containerization**: Docker
- **Orchestration**: Docker Compose
- **Web Server**: Nginx (frontend + `/api` proxy), Caddy (HTTPS) in production
- **CI/CD**: GitHub Actions (AWS access through OIDC, no stored AWS keys)
- **IaC**: Terraform (AWS: EC2, IAM, SSM Parameter Store, budget alert; state in S3)
- **Kubernetes**: manifests tested in CI on a throwaway kind cluster (the DigitalOcean cluster they used to run on is gone)

## 🎯 Features

- ✅ **Proof-of-Work Mining**: Adjustable difficulty (1-7 leading zeros), Ethash-style seal hash + nonce
- ✅ **Signed Transactions**: EIP-155 signatures, sender recovered and checked by the node, nonce and replay rules
- ✅ **Merkle Transactions Root**: the block hash commits to every transaction
- ✅ **Verification in the Browser**: every block re-checked client-side, with a tamper demo
- ✅ **Block Explorer**: click any block or transaction for full details
- ✅ **Real-time for Every Visitor**: SSE streams mining progress and chain events to all open tabs
- ✅ **Abort Mining**: Stop mining mid-run without losing pending transactions
- ✅ **Persistent Storage**: Firebase Firestore, or in memory for local development
- ✅ **Responsive UI**: dark block-explorer design, keyboard accessible

## 📝 API Endpoints

### Blockchain
- `GET /blockchain` - The chain from genesis to tip
- `DELETE /blockchain` - Reset to a fresh genesis block (admin token required in production)

### Transactions
- `POST /transaction` - Body `{ "raw": "0x…" }`, a signed legacy transaction for chain id 1337. Returns the decoded transaction (`201`), or `400` (invalid, wrong chain, bad nonce), `409` (duplicate) or `429` (mempool full) with `{ "error" }`
- `GET /mempool` - Get all pending transactions

### Mining
- `GET /mine` - Mine a new block (`409` if one is already being mined)
- `POST /abort-mining` - Stop current mining operation
- `GET /mining-progress` - SSE: progress as plain messages, plus named events `mining`, `block`, `mempool`, `difficulty`, `reset`
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
npm test             # Unit tests (no Firebase needed)
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

Three GitHub Actions workflows:

- **CI:Checks** (`ci.yml`) runs on every PR and every push to `main`: backend build and unit tests, frontend type-check and build, `terraform fmt`/`validate`, the production compose file, `shellcheck` on the deploy script, `nginx -t` on the frontend config, and a Kubernetes run: the `k8s/` manifests are deployed to a throwaway kind cluster with images built from the PR, then a chain is mined through the frontend's nginx proxy and verified with `verify-state.js --strict`.
- **CI:Build** and **CI:Deploy** run when a PR with their label is **merged**. CI:Deploy also runs nightly (03:00 UTC) and on demand.

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

**Trigger**: Merge a PR with the `CI:Deploy` label, nightly at 03:00 UTC, or manually (Actions → Run workflow)

**What it does**:
1. Starts the devnet with Docker Compose, using the production Firestore credentials
2. Clears the stored chain (this is the shared chain the live demo serves)
3. Runs `scripts/populate-devnet.js`: 3 blocks of 8 signed transactions each, at difficulty 2
4. Verifies the chain with `scripts/verify-state.js --strict` (signatures, roots, hashes, proof of work, links); any error fails the job
5. Builds and pushes images tagged `pre-mined`, `pre-mined-<sha>` and `latest`
6. Restarts the stack and verifies the chain again
7. Assumes an AWS role through OIDC, stores the Firebase service account in SSM Parameter Store, and runs `blockchain101-deploy` on the EC2 host through SSM Run Command (pulls `:latest` and restarts)
8. Smoke-tests the public URL

**Required GitHub Secrets** (in addition to Docker secrets above):
| Secret | Description |
|---|---|
| `FIREBASE_SERVICE_ACCOUNT_JSON` | Full Firebase service account JSON (paste the entire downloaded JSON file) |
| `AWS_DEPLOY_ROLE_ARN` | The `github_deploy_role_arn` Terraform output |

**Resulting images on Docker Hub**:
- `<username>/blockchain101-backend:pre-mined` and `:latest` (the EC2 host pulls `:latest`)
- `<username>/blockchain101-frontend:pre-mined` and `:latest`

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
| `npm run populate` | 3 blocks of 8 signed transactions each, at difficulty 2 |
| `npm run verify` | Recompute and verify the whole chain; exits non-zero on any error |
| `npm test` | Run full blockchain state test suite |

The `config.json` defaults apply when you run the scripts directly (e.g. `node mine-blocks.js`).

### Full workflow example
```bash
# 1. Start devnet (rebuild to pick up any image changes; an empty backend/.env runs in memory)
touch backend/.env
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

- `generate-transactions.js` — submits N transfers, each signed by a fresh wallet
- `mine-blocks.js` — mines N blocks
- `populate-devnet.js` — full automation (transactions + mining)
- `verify-state.js` — recomputes signatures, transactions roots, hashes, proof of work and links; exits non-zero on any error

---

## ☁️ Production Deployment (AWS)

The live demo runs on a single **EC2 instance** provisioned with **Terraform** (`deploy/aws/terraform`), sized for a portfolio demo at roughly $13–14/month, with a $20/month budget alert.

```
visitor ──HTTPS──▶ Caddy (auto Let's Encrypt) ──▶ nginx frontend ──/api──▶ Node backend ──▶ Firestore
                   └──────────────── Docker Compose on EC2 t3.micro (Amazon Linux 2023) ──────────────┘
```

**Infrastructure (Terraform):** EC2 with an Elastic IP, a security group exposing only 80/443 (**no SSH**, the host is managed through **SSM Session Manager**), an instance role that can read only this app's SSM parameters, IMDSv2-only metadata, an encrypted gp3 root volume, and `standard` CPU credits so sustained load is throttled rather than billed. A random admin token is generated into SSM Parameter Store.

**Deploys (GitHub Actions, `CI:Deploy`):** the job assumes an AWS role through **OIDC** (no long-lived AWS keys in the repo), writes the Firebase service account to **SSM Parameter Store** as a SecureString, and runs `blockchain101-deploy` on the host through **SSM Run Command**. That script fetches `deploy/aws/` for the exact commit, builds a root-only `.env` from SSM, pulls the images and restarts the stack, then the job smoke-tests the public URL. It runs on labelled PR merges, on demand, and nightly to restore the pre-mined demo chain.

**Hardening for a public demo** (all off locally, configured in `deploy/aws/docker-compose.yml`):

| Control | Setting |
|---|---|
| Chain reset (`DELETE /blockchain`) | requires `x-admin-token` (`ADMIN_TOKEN`) |
| Difficulty | capped at 5 leading zeros (`MAX_DIFFICULTY`) |
| Mining | one miner at a time (409), auto-abort after 60s (`MAX_MINING_MS`) |
| Mempool | capped at 100 pending transactions (`MAX_MEMPOOL`) |
| Rate limits | per-IP limits on mining, transactions and control endpoints; `TRUST_PROXY_HOPS=2` so limits see the visitor behind Caddy → nginx |
| Payloads | JSON bodies capped at 16 KB |

**Provision it yourself:**

```bash
cd deploy/aws/terraform
cp backend.hcl.example backend.hcl         # S3 bucket for the state (create it once, see the file)
terraform init -backend-config=backend.hcl
terraform apply                            # prints public_ip and github_deploy_role_arn
# 1. DNS: A record  <your domain>  ->  public_ip
# 2. GitHub secret AWS_DEPLOY_ROLE_ARN = github_deploy_role_arn
# 3. Run the CI:Deploy workflow (or merge a PR labelled CI:Deploy)
aws ssm start-session --target <instance_id>   # shell access without SSH
```

---

## ☸️ Legacy: Kubernetes Deployment (DigitalOcean)

> **Not deployed, but tested.** The demo moved to AWS and the DOKS cluster was deleted in September 2026. The `k8s/` manifests are still exercised on every PR: CI:Checks deploys them to a throwaway [kind](https://kind.sigs.k8s.io/) cluster, mines a chain through the frontend's nginx proxy and verifies it. The DigitalOcean Terraform in `terraform/` is kept for reference only.
>
> To try the manifests on any cluster: `kubectl apply -f k8s/00-namespace.yaml`, create the `firebase-credentials` secret (empty values run the chain in memory), then `kubectl apply -f k8s/`.

The app used to deploy to **DigitalOcean Kubernetes Service (DOKS)**. Default config: 1 node, `s-1vcpu-2gb` size (~$12/mo), region `fra1` (Frankfurt).

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
# Backend unit tests (run in CI): Merkle root, mining, signature checks,
# nonce/replay rules, abort, tamper detection, reset
cd backend
npm test

# Re-verify a running node independently: signatures, transactions roots,
# hashes, proof of work and links (fails on any error; runs in CI:Deploy)
cd scripts
npm run verify

# Blockchain state tests (requires devnet running)
npm test
```

The state tests verify:
- Backend connectivity
- Correct block count and genesis block
- Chain integrity (each block links to previous)
- Ethereum-format hash validation
- Transaction structure
- Mempool and difficulty endpoints
- Proof-of-work nonces
- Timestamp ordering
- Mining continuity (a new block links to the previous tip)

---

## 🔐 Secrets Setup

### Docker Hub
1. Go to GitHub repo → Settings → Secrets and variables → Actions
2. Add `DOCKER_USERNAME` and `DOCKER_PASSWORD`

### Firebase
1. Go to Firebase Console → Project Settings → Service accounts
2. Click "Generate new private key" → download JSON
3. Store the whole file as one GitHub Secret, `FIREBASE_SERVICE_ACCOUNT_JSON`:
   `gh secret set FIREBASE_SERVICE_ACCOUNT_JSON < service-account.json`, then delete the file

### AWS
- `AWS_DEPLOY_ROLE_ARN`: the `github_deploy_role_arn` output of `deploy/aws/terraform`. CI uses it through OIDC; no AWS keys are stored anywhere.

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
- In `.env`, wrap `FIREBASE_PRIVATE_KEY` in double quotes; real newlines and literal `\n` both work (the backend converts `\n`)
- In GitHub, the secret is the whole service account JSON (`FIREBASE_SERVICE_ACCOUNT_JSON`), not the bare key

**`Error: Could not load the default credentials`**
- Verify the `FIREBASE_*` environment variables are set
- Check the service account has Firestore read/write permissions

**The backend says it is keeping the chain in memory**
- `FIREBASE_PROJECT_ID` isn't set (or `STORE=memory`), so nothing is persisted. Expected for local development without Firebase

### CI/CD workflow not triggering

- Confirm the PR was **merged** (not just closed)
- Confirm the correct label (`CI:Build` or `CI:Deploy`) was added **before** merging
- Check Actions tab for any error logs

### Live demo issues

- Shell on the host without SSH: `aws ssm start-session --target <instance_id>`, then `cd /opt/blockchain101 && docker compose ps` / `docker compose logs backend`
- A browser still showing an old version after a deploy: reload once (`index.html` is revalidated on every visit)

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
│                   /app/dist/    │          │    bundle.<hash>.js          │
│                                 │          │    + public/ assets          │
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
Final image: ~80 MB compressed
```

**nginx reverse proxy**

The frontend container serves the React app AND proxies `/api/*` calls to the backend. The browser only ever talks to one origin — no CORS issues.

```
Browser                    Frontend Container (nginx)         Backend Container (Node.js)
   │                              │                                    │
   │  GET /                       │                                    │
   │ ─────────────────────────►   │                                    │
   │  ◄─────────────────────────  │                                    │
   │  index.html + bundle.*.js    │                                    │
   │                              │                                    │
   │  POST /api/transaction {raw} │                                    │
   │ ─────────────────────────►   │                                    │
   │                              │  rewrite /api/transaction          │
   │                              │       → /transaction               │
   │                              │  POST http://backend:9001/         │
   │                              │  transaction                       │
   │                              │ ─────────────────────────────────► │
   │                              │  ◄───────────────────────────────  │
   │  ◄─────────────────────────  │  201 { hash, from, to, value, … }  │
   │  201 { hash, from, to, … }   │                                    │
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
┌────────────────────────── blockchain-network (bridge) ────────────────────────────┐
│                                                                                   │
│   ┌─────────────────────────────┐         ┌────────────────────────────────┐      │
│   │  blockchain101-frontend     │         │  blockchain101-backend         │      │
│   │                             │         │                                │      │
│   │  BACKEND_HOST=backend       │         │  listens on 9001               │      │
│   │  BACKEND_RESOLVER=127.0.0.11│         │  Firebase credentials via .env │      │
│   │                             │         │                                │      │
│   │  :80 (internal)             │         │  :9001 (internal)              │      │
│   └──────────────┬──────────────┘         └────────────────────────────────┘      │
│                  │                                       ▲                        │
│          port mapping                         DNS name "backend"                  │
│          9000:80                              resolves inside network             │
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

Re-mines the shared demo chain, builds and pushes the images, and deploys them to EC2.

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                        CI:Deploy Pipeline                                   │
│                                                                             │
│  ① Checkout + Docker login                                                  │
│  ② Write Firebase credentials → backend/.env  (from GitHub Secrets)         │
│  ③ docker compose up -d  (start devnet)                                     │
│  ④ Health check: poll GET /blockchain until 200                             │
│  ⑤ DELETE /blockchain  →  restart backend  (fresh genesis block)            │
│  ⑥ scripts/populate-devnet.js  →  3 blocks × 8 signed txs, difficulty 2     │
│  ⑦ scripts/verify-state.js --strict  (recompute the whole chain)            │
│  ⑧ docker compose down                                                      │
│  ⑨ Build & push  :pre-mined, :pre-mined-<sha>, :latest  to Docker Hub       │
│  ⑩ Restart the stack → verify again → docker compose down                   │
│  ⑪ AWS role via OIDC → Firebase JSON into SSM Parameter Store               │
│  ⑫ SSM Run Command on EC2: blockchain101-deploy (pull :latest, restart)     │
│  ⑬ Smoke test https://blockchain101.founderexchange.co                      │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

> The blockchain data lives in Firestore, not in the image. Steps ⑤–⑦ rewrite the chain the live demo serves, which is how the nightly run resets it. `:pre-mined` means "built and verified against a freshly populated chain."

---

### Terraform — Infrastructure as Code (legacy DigitalOcean setup)

> Production now uses `deploy/aws/terraform`, described in [Production Deployment (AWS)](#%EF%B8%8F-production-deployment-aws). This section and the Kubernetes one below describe the old DOKS setup, which is no longer running.

One `terraform apply` in `terraform/` created the DigitalOcean cluster:

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

### Kubernetes — Runtime Orchestration (legacy)

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
│  every PR: CI:Checks (build, type-check, tests, Terraform, compose, nginx, k8s)  │
└──────────────────────────────┬───────────────────────────────────────────────────┘
                               │ merge with CI:Deploy label (or nightly / manual)
                               ▼
┌──────────────────────────────────────────────────────────────────────────────────┐
│  CI:Deploy  (GitHub Actions)                                                     │
│  re-mine + verify the chain in Firestore → build images → push                   │
└──────────────────────────────┬───────────────────────────────────────────────────┘
                               │ docker push
                               ▼
┌──────────────────────────────────────────────────────────────────────────────────┐
│  ARTIFACT REGISTRY  (Docker Hub)                                                 │
│  galinganchev/blockchain101-backend:latest                                       │
│  galinganchev/blockchain101-frontend:latest                                      │
└──────────────────────────────┬───────────────────────────────────────────────────┘
                               │ OIDC → SSM Run Command → docker compose pull + up
                               ▼
┌──────────────────────────────────────────────────────────────────────────────────┐
│  AWS  eu-central-1  (provisioned by deploy/aws/terraform)                        │
│                                                                                  │
│  EC2 t3.micro + Elastic IP, ports 80/443 only, no SSH                            │
│  ┌────────────────────────────────────────────────────────────────────────────┐  │
│  │  Docker Compose                                                            │  │
│  │  Caddy (HTTPS) ──► nginx frontend ──/api──► Node backend ──► Firestore     │  │
│  │  .env built from SSM Parameter Store at deploy time (root-only)            │  │
│  └────────────────────────────────────────────────────────────────────────────┘  │
└──────────────────────────────┬───────────────────────────────────────────────────┘
                               ▼
                https://blockchain101.founderexchange.co
```

**Local vs cloud at a glance**

```
                    LOCAL (docker compose)              CLOUD (EC2, deploy/aws)
                    ──────────────────────              ───────────────────────
Image source        Built from source                   Pulled from Docker Hub (:latest)
HTTPS               none                                Caddy, Let's Encrypt
BACKEND_HOST        backend  (Docker DNS)               backend  (Docker DNS)
Firebase creds      backend/.env file (or none:         SSM Parameter Store → root-only .env
                    in-memory chain)
Public-demo limits  off                                 on (difficulty, mining time, mempool, rate limits)
Access              localhost:9000                      https://blockchain101.founderexchange.co
Restart             docker compose restart              CI:Deploy, or SSM session + docker compose
Logs                docker compose logs -f              aws ssm start-session → docker compose logs
```

---

## Notable Technical Details

### nginx reverse proxy — dynamic backend URL via envsubst

- The nginx config is NOT hardcoded — it's a template with a `${BACKEND_HOST}` placeholder
- When the container starts, nginx automatically runs `envsubst` which swaps the placeholder with the real value from the env var
- Same Docker image works everywhere: docker-compose injects `backend` (locally and on EC2); the legacy K8s setup injected the full cluster DNS name

```
docker compose up
      │
      ├─ passes env:  BACKEND_HOST=backend
      │
      ▼
frontend container starts
      │
      ├─ envsubst runs: replaces ${BACKEND_HOST} → "backend"
      │
      ▼
nginx.conf generated:
  set $upstream http://backend:9001   ← Docker DNS resolves this
      │
      ▼
browser hits /api/transaction
      │
nginx proxies → http://backend:9001/transaction
```

---

### run.sh — auto-fetches load balancer IPs from kubectl (legacy DOKS)

- DigitalOcean assigns NEW IPs every time you `terraform destroy + apply` — hardcoding breaks immediately
- On startup, `run.sh` asks kubectl "what IP did DigitalOcean assign to my services right now?"
- Falls back to `localhost` automatically if no cluster is running (local dev)

```
./run.sh starts
      │
      ├─ kubectl get service blockchain101-backend  → "164.90.x.x"
      ├─ kubectl get service blockchain101-frontend → "138.68.x.x"
      │
      ├─ cluster reachable? ──YES──► BACKEND_URL=http://164.90.x.x:9001
      │                              FRONTEND_URL=http://138.68.x.x
      │
      └─ cluster down? ───────NO───► BACKEND_URL=http://localhost:9001
                                     FRONTEND_URL=http://localhost:9000
      │
      ▼
App menu always has valid URLs — no manual editing after terraform destroy/apply
```

---

### Rolling update — zero-downtime image swap (legacy DOKS)

- K8s doesn't pull new images automatically — you trigger it with `kubectl rollout restart`
- The rolling update strategy (`maxUnavailable: 1, maxSurge: 0`) swaps pods one at a time
- On a single-node cluster there's a brief gap (no room for a second pod), but on multi-node it's truly zero-downtime

```
CI:Build pushes :latest to Docker Hub
      │
      ▼
./run.sh → 4) Kubernetes → 7) Restart deployments
      │
      ├─ kubectl rollout restart deployment/blockchain101-backend
      ├─ kubectl rollout restart deployment/blockchain101-frontend
      │
      ▼
K8s rolling update:
      │
      ├─ Pod A (old image) ── Running
      ├─ Pod A ── Terminating     (brief unavailability on single node)
      ├─ Pod B (new :latest pulled from Docker Hub) ── Starting
      └─ Pod B ── Running ✓
```

---

## Security — Where Secrets Live (and where they don't)

Every secret is injected at runtime. Nothing is baked into images or committed to git.

```
┌─────────────────────────────────────────────────────────────────────────────┐
│  SECRET FLOW — from origin to runtime                                       │
│                                                                             │
│  Firebase Console                                                           │
│  (download JSON)                                                            │
│       │                                                                     │
│       ├──► backend/.env              LOCAL DEV                              │
│       │    ├── .gitignore'd          never reaches GitHub                   │
│       │    ├── docker compose reads  via env_file: ./backend/.env           │
│       │    └── consumed by           process.env.FIREBASE_* in Node.js      │
│       │                                                                     │
│       ├──► GitHub Secrets            CI/CD                                  │
│       │    ├── FIREBASE_SERVICE_ACCOUNT_JSON  (single JSON blob)            │
│       │    ├── AWS_DEPLOY_ROLE_ARN   role assumed through OIDC (no AWS keys)│
│       │    ├── DOCKER_USERNAME / DOCKER_PASSWORD                            │
│       │    ├── masked in logs        GitHub masks the stored value; values  │
│       │    │                         derived from it (the decoded key) are  │
│       │    │                         masked explicitly with ::add-mask::    │
│       │    └── deploy.yml writes     backend/.env at runtime, never into    │
│       │                              an image                               │
│       │                                                                     │
│       └──► SSM Parameter Store       PRODUCTION RUNTIME (EC2)               │
│            ├── SecureString          written by CI:Deploy                   │
│            ├── /blockchain101/admin-token  generated by Terraform           │
│            ├── read by the instance  role limited to this app's parameters  │
│            └── deploy.sh writes      a root-only .env on the host           │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

| Secret | Where it lives | How it's injected | Protected by |
|---|---|---|---|
| Firebase credentials | `backend/.env` (local) | `env_file` in docker-compose | `.gitignore` |
| Firebase credentials | `FIREBASE_SERVICE_ACCOUNT_JSON` (CI) | GitHub Actions writes `backend/.env` at runtime | GitHub Secrets (encrypted; decoded key masked explicitly) |
| Firebase credentials | SSM `/blockchain101/firebase-service-account` (prod) | `deploy.sh` builds a root-only `.env` on EC2 | SecureString, instance role scoped to `/blockchain101/*` |
| Admin token | SSM `/blockchain101/admin-token` | same `.env`, checked on `DELETE /blockchain` | Generated by Terraform, never in git |
| AWS access for CI | IAM role trusted for this repo (OIDC) | `aws-actions/configure-aws-credentials` | No long-lived keys anywhere |
| Docker Hub credentials | GitHub Secrets | `docker/login-action` in CI | GitHub Secrets |
| Terraform state | S3 bucket (versioned, private) | `backend.hcl` (gitignored) | Private, versioned bucket; nothing local |
| Backend hostname | `BACKEND_HOST` env var | docker-compose | Not a secret — but injected, never hardcoded |

```
.gitignore blocks:
  .env, backend/.env, frontend/.env
  deploy/aws/terraform/terraform.tfvars, backend.hcl, *.tfstate*
  terraform/terraform.tfvars, terraform/terraform.tfstate*   (legacy)

Docker images contain:
  ✓ compiled code
  ✗ no .env files
  ✗ no credentials
  ✗ no terraform state
```

---

## 📄 License

This project is for educational purposes.

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.
