# Sawa-X · Canton Blockchain Demo

> **Regional Energy Investment Platform** built on Daml / Canton.
> Three-role demo: **Admin · Operator · Investor**

---

## What is Sawa-X?

Sawa-X is a blockchain-backed platform for tokenized regional energy investments. It uses **Daml smart contracts** running on a **Canton** distributed ledger to manage:

- Regional investment portfolios
- SPV (Special Purpose Vehicle) project lifecycle
- Investor KYC and access control
- Token minting and yield distribution

---

## Architecture

```
┌─────────────────────────────────────────────────────────┐
│                   React UI  (:3000)                     │
│   Admin Panel  │  Operator Panel  │  Investor Panel     │
└────────────────────────┬────────────────────────────────┘
                         │ HTTP / Daml JSON API
                  ┌──────┴──────┐
                  │  JSON API   │  :7575
                  └──────┬──────┘
                         │ gRPC
            ┌────────────┴────────────┐
            │   Canton Participant    │  :6865 (Ledger API)
            │   (in-memory sandbox)   │  :6866 (Admin API)
            └────────────┬────────────┘
                         │
            ┌────────────┴────────────┐
            │     Canton Domain       │  :6867 / :6868
            └─────────────────────────┘
```

---

## Prerequisites

Install these before starting:

| Tool | Version | Install |
|------|---------|---------|
| Daml SDK | 2.10.3 | `curl -sSL https://get.daml.com/ \| sh -s 2.10.3` |
| Java | 17+ | `sudo apt install openjdk-17-jdk` |
| Node.js | 20+ | https://nodejs.org |

> **WSL2 users**: If the Daml install fails, use `curl --http1.1 -sSL https://get.daml.com/ | sh -s 2.10.3`

Verify installations:
```bash
daml version    # should show 2.10.3
java -version   # should show 17+
node -v         # should show v20+
```

---

## Project Structure

```
sawa-x-demo/
├── daml/
│   ├── daml.yaml
│   └── Sawa/
│       ├── Identity/
│       │   └── UserRole.daml          # KYCRequest, UserRole
│       ├── Portfolio/
│       │   └── RegionalPortfolio.daml # Regional portfolio management
│       ├── Asset/
│       │   └── ProjectSPV.daml        # SPV project lifecycle
│       ├── Token/
│       │   └── SPVToken.daml          # Token + registry
│       ├── Investment/
│       │   ├── InvestmentRequest.daml # Investor → Operator
│       │   └── AccessRequest.daml     # Access gating
│       ├── Yield/
│       │   └── ProductionReport.daml  # Production data + yield
│       └── Types.daml
├── daml/Test/
│   ├── Scenarios.daml                 # Full end-to-end scenario
│   └── SetupContracts.daml            # Setup without re-allocating parties
├── ui/
│   ├── src/
│   │   ├── api/
│   │   │   ├── ledger.ts              # Daml JSON API client
│   │   │   └── mock.ts                # In-memory mock (fallback)
│   │   ├── components/                # Layout, Modal, Badge, etc.
│   │   ├── context/AppContext.tsx     # Global state + role switcher
│   │   ├── pages/
│   │   │   ├── admin/                 # Dashboard, KYC, Portfolios, Proposals, Access
│   │   │   ├── operator/              # Dashboard, Projects, Production Reports
│   │   │   └── investor/              # Dashboard, Access, Projects, Portfolio
│   │   └── types/index.ts
│   └── package.json
├── infra/canton/
│   ├── canton-local.conf
│   └── bootstrap.canton
├── scripts/
│   └── start-sandbox.sh
└── docker-compose.yml
```

---

## Daml Contract Map

| Template | Module | Purpose |
|----------|--------|---------|
| `KYCRequest` | `Sawa.Identity.UserRole` | Investor submits identity for approval |
| `UserRole` | `Sawa.Identity.UserRole` | Proof of KYC — gates investor access |
| `RegionalPortfolio` | `Sawa.Portfolio.RegionalPortfolio` | Admin-managed regional investment pool |
| `ProjectSPV` | `Sawa.Asset.ProjectSPV` | SPV project lifecycle (Draft → Operational) |
| `SPVToken` | `Sawa.Token.SPVToken` | Investor's on-ledger token holding |
| `SPVTokenRegistry` | `Sawa.Token.SPVToken` | Global supply + holdings per project |
| `InvestmentRequest` | `Sawa.Investment.InvestmentRequest` | Investor → Operator investment intent |
| `AccessRequest` | `Sawa.Investment.AccessRequest` | Investor requests view access to region |
| `AccessApproval` | `Sawa.Investment.AccessRequest` | Admin grants access (gates UI projects view) |
| `ProductionReport` | `Sawa.Yield.ProductionReport` | Operator posts production data |
| `ClaimableYield` | `Sawa.Yield.ProductionReport` | On-chain yield entitlement |

---

## Setup & Run (Step by Step)

### Step 1 — Clone / Unzip the project

```bash
unzip sawa-x-demo.zip
cd sawa-x-demo
```

---

### Step 2 — Fix daml.yaml (remove build-options)

Make sure `daml.yaml` contains only:

```yaml
sdk-version: 2.10.3
name: sawa-x
version: 1.0.0
source: daml
dependencies:
  - daml-prim
  - daml-stdlib
  - daml-script
```

---

### Step 3 — Build the Daml DAR

```bash
daml build
```

Expected output:
```
Compiling sawa-x to a DAR.
Created .daml/dist/sawa-x-1.0.0.dar
```

Copy to target folder:
```bash
mkdir -p target
cp .daml/dist/sawa-x-1.0.0.dar target/
```

---

### Step 4 — Start Canton Sandbox (Terminal 1)

```bash
daml sandbox --port 6865 --dar target/sawa-x-1.0.0.dar
```

Keep this terminal open. Wait for:
```
Daml sandbox started on port 6865
```

---

### Step 5 — Run the Setup Script (Terminal 2)

```bash
daml script \
  --dar target/sawa-x-1.0.0.dar \
  --script-name Test.Scenarios:setup \
  --ledger-host localhost \
  --ledger-port 6865 \
  --wall-clock-time
```

Wait for `CoordinatedShutdown` — this means success. This creates all demo parties and contracts on the ledger.

> **Note**: If you see `Party already exists` error, the sandbox was restarted. Run `SetupContracts` instead:
> ```bash
> daml script \
>   --dar target/sawa-x-1.0.0.dar \
>   --script-name Test.SetupContracts:setupContracts \
>   --ledger-host localhost \
>   --ledger-port 6865 \
>   --wall-clock-time
> ```

---

### Step 6 — Start JSON API (Terminal 2)

```bash
daml json-api \
  --ledger-host localhost \
  --ledger-port 6865 \
  --http-port 7575 \
  --allow-insecure-tokens
```

Wait for:
```
Bound to /0.0.0.0:7575
```

---

### Step 7 — Get Package ID and Party IDs

```bash
# Get the sawa-x package ID
daml damlc inspect-dar target/sawa-x-1.0.0.dar | head -5
# Look for: sawa-x-1.0.0-<HASH>/...
# The HASH is your package ID

# Get party IDs
daml ledger list-parties --host localhost --port 6865
```

Note down the full party IDs for Admin, Operator, Investor, SPV_METALEX.

---

### Step 8 — Update UI Configuration

Open `ui/src/api/ledger.ts` in VS Code and update:

```ts
// Line 3 — replace with your actual package hash
const PKG = 'YOUR_PACKAGE_HASH_HERE';

// Line 5 — replace with your generated token (see below)
const SANDBOX_TOKEN = 'YOUR_TOKEN_HERE';
```

#### Generate your token:

```bash
python3 -c "
import base64, json

header = base64.urlsafe_b64encode(json.dumps({'alg':'HS256','typ':'JWT'}).encode()).rstrip(b'=').decode()
payload = base64.urlsafe_b64encode(json.dumps({
  'https://daml.com/ledger-api': {
    'ledgerId': 'sandbox',
    'applicationId': 'sawa-x',
    'actAs': [
      'Admin::YOUR_HASH',
      'Operator::YOUR_HASH',
      'Investor::YOUR_HASH',
      'SPV_METALEX::YOUR_HASH'
    ],
    'readAs': [
      'Admin::YOUR_HASH',
      'Operator::YOUR_HASH',
      'Investor::YOUR_HASH',
      'SPV_METALEX::YOUR_HASH'
    ]
  }
}).encode()).rstrip(b'=').decode()
print(f'{header}.{payload}.fake')
"
```

Replace `YOUR_HASH` with the hash from `daml ledger list-parties` output.

Also update the party constants in each page file:
```ts
const ADMIN_PARTY    = 'Admin::YOUR_HASH';
const OPERATOR_PARTY = 'Operator::YOUR_HASH';
const INVESTOR_PARTY = 'Investor::YOUR_HASH';
const SPV_PARTY      = 'SPV_METALEX::YOUR_HASH';
```

---

### Step 9 — Start the UI (Terminal 3)

```bash
cd ui
npm install
npm run dev
```

Wait for:
```
VITE ready
➜  Local: http://localhost:3000/
```

---

### Step 10 — Open Browser

```
http://localhost:3000
```

---

## Verify Everything is Running

```bash
# Sandbox (gRPC — curl won't work, use this instead)
daml ledger list-parties --host localhost --port 6865

# JSON API
curl -s http://localhost:7575/v1/parties \
  -H "Authorization: Bearer YOUR_TOKEN" | python3 -m json.tool

# UI
curl -s http://localhost:3000 | grep -q "Sawa" && echo "UI OK"
```

---

## Demo Flow (10 Steps)

### Admin Flow
| Step | Page | Action | Contract Created |
|------|------|--------|-----------------|
| 1 | Portfolios | Create Regional Portfolio | `RegionalPortfolio` |
| 2 | KYC Approvals | Approve Investor KYC request | `UserRole` |
| 3 | Portfolios | Add Investor to Portfolio | `RegionalPortfolio` (updated) |
| 4 | SPV Proposals | Approve SPV Project | `ProjectSPV` (Approved) |
| 5 | Access Requests | Approve Investor Access | `AccessApproval` |

### Operator Flow
| Step | Page | Action | Contract Created |
|------|------|--------|-----------------|
| 6 | My Projects | Create SPV Project | `ProjectSPV` (Draft) |
| 7 | My Projects | Propose to Admin | `ProjectSPV` (Proposed) |
| 8 | My Projects | Open Funding | `ProjectSPV` (FundingOpen) |
| 9 | Production Reports | Submit Production Report | `ProductionReport` |
| 10 | Production Reports | Allocate Yield | `ClaimableYield` |

### Investor Flow
| Step | Page | Action | Contract Created |
|------|------|--------|-----------------|
| 1 | Request Access | Submit KYC | `KYCRequest` |
| 2 | Request Access | Request Project Access | `AccessRequest` |
| 3 | Projects | View & Invest (after access) | `InvestmentRequest` → `SPVToken` |
| 4 | My Portfolio | Claim Yield | `ClaimableYield` (archived) |

---

## Terminal Summary

```
Terminal 1: daml sandbox --port 6865 --dar target/sawa-x-1.0.0.dar
Terminal 2: daml json-api --ledger-host localhost --ledger-port 6865 --http-port 7575 --allow-insecure-tokens
Terminal 3: cd ui && npm run dev
Browser:    http://localhost:3000
```

---

## Common Errors & Fixes

| Error | Cause | Fix |
|-------|-------|-----|
| `Unknown option --target` | Old `build-options` in daml.yaml | Remove `build-options` block from daml.yaml |
| `Ambiguous occurrence 'Reject'` | Name clash in InvestmentRequest | Rename choice to `DeclineRequest` |
| `Party already exists` | Sandbox restarted, parties preserved | Run `SetupContracts` script instead of `Scenarios` |
| `missing Authorization header` | No token in request | Add `Authorization: Bearer <token>` header |
| `non expected character 0x2e in Package ID` | Using package name not hash | Use `daml damlc inspect-dar` to get real hash |
| `400 Bad Request on /v1/create` | Wrong payload format | Check Daml Optional fields — use `null` not `{None: {}}` |
| `object is not iterable` | Holdings are `{_1, _2}` objects not arrays | Use `h._1` and `h._2` instead of destructuring |
| Port already in use | Previous process still running | `lsof -i :6865` then `kill <PID>` |
| Vite not picking up changes | Hot reload missed | Stop with `Ctrl+C` and restart `npm run dev` |

---

## Restarting After a Break

When you come back and Canton sandbox was stopped (in-memory = data lost):

```bash
# Terminal 1 — restart sandbox
daml sandbox --port 6865 --dar target/sawa-x-1.0.0.dar

# Terminal 2 — re-run setup (parties already exist, use SetupContracts)
daml script \
  --dar target/sawa-x-1.0.0.dar \
  --script-name Test.SetupContracts:setupContracts \
  --ledger-host localhost \
  --ledger-port 6865 \
  --wall-clock-time

# Then restart JSON API
daml json-api \
  --ledger-host localhost \
  --ledger-port 6865 \
  --http-port 7575 \
  --allow-insecure-tokens
```

The UI (Terminal 3) can stay running.

---

## Sprint 2 Roadmap

- [ ] USDCx funding via CIP-56 wallet integration
- [ ] Token minting connected to Canton token standard
- [ ] Yield bot — watches `ClaimableYield` events and triggers USDCx transfers
- [ ] KYC document vault — hash on-chain, docs off-chain
- [ ] Multi-party Canton network (separate participant per role)
- [ ] Production IoT oracle for kWh data

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Smart Contracts | Daml 2.10.3 |
| Ledger | Canton (Digital Asset) |
| API Gateway | Daml JSON API |
| Frontend | React 18 + TypeScript + Vite |
| Styling | Tailwind CSS |
| Icons | Lucide React |
| Dev Environment | WSL2 / Ubuntu |
