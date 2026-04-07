# Sawa-X · Tokenized Infrastructure Investment Platform

> Canton/DAML Blockchain · Role-Based Portals · Tranche Investment · Waterfall Settlement
> **Zero hash issues** — backend auto-discovers package hash + party identifiers

---

## Architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│  React Frontend (port 3000) — TypeScript + Tailwind                 │
│  ┌───────────────┐  ┌──────────────┐  ┌──────────────────────────┐  │
│  │ Admin Portal   │  │ Operator     │  │ Investor Portal          │  │
│  │ • KYC Review   │  │ • Create SPV │  │ • KYC Submit (ID+Selfie) │  │
│  │ • Portfolios   │  │   (VDR/PPA)  │  │ • Projects (filtered)    │  │
│  │ • SPV Approvals│  │ • Lifecycle  │  │ • Tranches (Invest+Done) │  │
│  │ • Access Ctrl  │  │ • Production │  │ • Portfolio & Tokens     │  │
│  │ • Tranche Mgmt │  │              │  │                          │  │
│  │ • Waterfall    │  │              │  │                          │  │
│  │   Settlement   │  │              │  │                          │  │
│  └───────────────┘  └──────────────┘  └──────────────────────────┘  │
└──────────────────────────┬──────────────────────────────────────────┘
                           │ /api/*
                           ▼
┌─────────────────────────────────────────────────────────────────────┐
│  Express Backend (port 3001)                                        │
│  • Auto-discovers Canton hash via `daml ledger list-parties`        │
│  • Auto-discovers package hash via `daml damlc inspect`             │
│  • Builds full template IDs (PKG:Module:Entity) dynamically         │
│  • KYC document store (off-chain) + on-chain status                 │
│  • KYC gating middleware — blocks unapproved investors              │
│  • Single active investor enforcement per project                   │
│  • 40+ API endpoints                                                │
└──────────────────────────┬──────────────────────────────────────────┘
                           │ /v1/*
                           ▼
┌─────────────────────────────────────────────────────────────────────┐
│  DAML JSON API (port 7575) → Canton Sandbox (port 6865)             │
│  15 DAML templates · 20+ choices · On-chain smart contracts         │
└─────────────────────────────────────────────────────────────────────┘
```

---

## Quick Start (5 Terminals)

### Prerequisites
- DAML SDK 2.10.x (`daml version`)
- Node.js 18+ (`node --version`)

### Terminal 1 — Build + Sandbox
```bash
cd sawa-x-demo
daml build
daml sandbox --port 6865
```
Wait for "Started Canton sandbox" (30–60s on WSL).

### Terminal 2 — JSON API
```bash
cd sawa-x-demo
daml json-api --ledger-host localhost --ledger-port 6865 --http-port 7575 --allow-insecure-tokens
```

### Terminal 3 — Upload DAR + Bootstrap
```bash
cd sawa-x-demo
daml ledger upload-dar .daml/dist/sawa-x-demo-0.0.1.dar --host localhost --port 6865
daml script --dar .daml/dist/sawa-x-demo-0.0.1.dar --ledger-host localhost --ledger-port 6865 --script-name Test.Bootstrap:setup
```

### Terminal 4 — Backend
```bash
cd sawa-x-demo/backend
npm install
node server.js
```
You should see:
```
  🔆 Sawa-X Backend
  ✓ Discovered 6 parties
  ✓ Package hash: 3d784363fad6f522...
  Listening: http://localhost:3001
```

### Terminal 5 — Frontend
```bash
cd sawa-x-demo/ui
npm install
npm run dev
```

Open **http://localhost:3000**

---

## Login Portals

| Portal | Parties | Access |
|--------|---------|--------|
| **Admin** | Admin | KYC approvals, portfolios, SPV approvals, access control, tranche allocation, waterfall settlement |
| **Operator** | Operator | Create SPV proposals (with VDR/PPA data), lifecycle management, production reports |
| **Investor** | Investor1, Investor2, Investor3 | KYC submission (ID card + selfie), browse projects, invest in tranches, portfolio, tokens |

---

## Smart Contracts (15 Templates)

### Identity & Access
| Template | Signatories | Purpose |
|----------|------------|---------|
| `KYCRequest` | investor | Investor submits KYC for admin review |
| `UserRole` | admin | Approved user with role, wallet, regions |
| `RejectedKYC` | admin | Record of rejected KYC |
| `RegionalPortfolio` | admin | Groups investors by region |
| `PortfolioAccess` | admin | Controls which projects an investor can see |

### Projects & Investment
| Template | Signatories | Purpose |
|----------|------------|---------|
| `SPVProposal` | operator | Operator proposes new project with VDR/PPA data |
| `ProjectSPV` | admin | Approved project with lifecycle, financial structure |
| `Tranche` | admin | Single tranche allocated to one investor |
| `CompletedInvestment` | admin | Permanent record of completed investment |
| `SPVToken` | admin | Yield-bearing token minted on investment completion |

### VDR & Settlement
| Template | Signatories | Purpose |
|----------|------------|---------|
| `ProjectRegistry` | operator | Virtual Data Room — PPA, off-taker, technical metadata |
| `WaterfallState` | admin | Multi-phase revenue distribution with IRR tracking |
| `OperatorToken` | admin | Class B performance carry token with milestone vesting |
| `DevFeeDisbursement` | admin | Dev fee payment record |

### Yield & Production
| Template | Signatories | Purpose |
|----------|------------|---------|
| `ProductionReport` | operator | Energy production data from oracle |
| `ClaimYield` | admin | Yield available for investor to claim |

---

## Key Features

### 1. KYC with Document Upload
- Investor submits: full name, wallet, nationality, ID type, ID number
- Uploads **ID card photo** (file picker)
- Takes **live selfie** (browser webcam) or uploads photo
- **On-chain:** KYC status, name, wallet stored in `UserRole` contract
- **Off-chain:** ID card image, selfie image stored in backend memory (VDR)
- Admin reviews documents side-by-side and approves/rejects

### 2. KYC Gating
- Investors with unapproved KYC see a gate on Dashboard, Projects, Tranches
- Backend enforces: `/api/invest`, `/api/tranches`, `/api/projects` blocked without KYC
- Admin must approve before any investment activity

### 3. Tranche-Based Investment
```
Project: $1,000,000 total / $10,000 per tranche = 100 tranches

Admin creates Tranche #0 → assigns to Investor1
  Option A: Investor1 invests $10,000 → tranche auto-closes (TrancheFunded)
  Option B: Investor1 invests $7,000 → clicks "Done" → tranche closes at $7,000
            Token minted, funding moves to next investor

Admin creates Tranche #1 → assigns to Investor2
  ... same flow ...
```

### 4. Single Active Investor (Sequential Allocation)
- Only one tranche can be `TrancheAllocated` per project at a time
- Backend rejects creating a new tranche if another is still open
- Prevents concurrent pooling — strictly sequential

### 5. Permissioned Visibility
- Admin grants `PortfolioAccess` per investor per region with specific project IDs
- Investors only see projects they have explicit access to
- Investor3 with no grants sees nothing

### 6. VDR / Project Registry (Virtual Data Room)
SPV proposals now include investor-grade data:
- **PPA & Revenue:** Off-taker name/credit, tariff ($/kWh), escalator (%/yr), performance guarantees, deemed energy
- **Technical:** Capacity (MW), EPC milestones, annual O&M, site rights, grid connection
- **Financial:** Total CapEx, debt, dev fee %, mgmt fee %, operator equity %, investor hurdle IRR

### 7. Waterfall Settlement (Revenue Distribution)
4-level automated settlement:
```
Level 1: O&M / OpEx    → Monthly deduction for plant operations
Level 2: Mgmt Fee      → X% of gross revenue to Operator (top of waterfall)
Level 3: Debt Service   → Senior debt paid first (if applicable)
Level 4: Distribution   → Based on phase:

  Phase 1 (Capital Recovery):  100% to Investor until principal returned
  Phase 2 (Preferred Return):  80% Investor / 20% Operator until IRR hurdle met
  Phase 3 (Catch-Up / Flip):   20% Investor / 80% Operator for remainder
```

### 8. Equity & Carry Structure
- **Dev Fee:** X% of CapEx auto-deducted when tranche is funded (immediate operator liquidity)
- **Mgmt Fee:** X% of gross revenue deducted at top of waterfall (recurring)
- **Operator Token (Class B):** Minted at milestones (COD, 6mo uptime, 12mo uptime)
- **Vesting:** Admin approves vesting when milestone is verified
- **Funding Target Calculation:** `(CapEx - Debt - TaxEquity) / (1 - OperatorEquity%)`

### 9. Project Lifecycle
```
Proposed → Approved → FundingOpen → UnderConstruction → Operational → Completed
```
- Operator moves lifecycle via `OperatorProjects` page
- Each transition triggers different contract logic (token minting, production reports, yield claims)

### 10. Zero Hash Design
- Backend auto-discovers Canton party hash via `daml ledger list-parties`
- Auto-discovers DAML package hash via `daml damlc inspect`
- Builds full template IDs (`PKG:Module:Entity`) dynamically using JS getters
- Frontend never touches any hash, JWT, or template ID
- **No hardcoded hashes anywhere** — works across rebuilds automatically

---

## API Endpoints (40+)

### Identity & KYC
| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/init` | Auto-discovered parties |
| GET | `/api/health` | Health check with package hash |
| GET | `/api/kyc-status?investor=X` | KYC status for investor |
| POST | `/api/submit-kyc-full` | Submit KYC with ID card + selfie (base64) |
| GET | `/api/kyc-full` | All KYC entries with documents (admin) |
| POST | `/api/approve-kyc-by-name` | Admin approves KYC |
| POST | `/api/reject-kyc-by-name` | Admin rejects KYC |
| GET | `/api/user-roles` | All UserRole contracts |

### Portfolios & Access
| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/portfolios` | Regional portfolios |
| POST | `/api/create-portfolio` | Create portfolio |
| POST | `/api/allocate-investor-portfolio` | Allocate investor to portfolio |
| GET | `/api/portfolio-access` | Access grants |
| POST | `/api/grant-access` | Grant project visibility |

### SPV Projects
| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/spv-proposals` | Pending SPV proposals |
| POST | `/api/create-spv` | Create SPV with VDR/PPA data |
| POST | `/api/approve-spv` | Admin approves SPV |
| GET | `/api/projects?investor=X` | Permission-filtered projects |
| POST | `/api/open-funding` | Operator opens funding |
| POST | `/api/move-lifecycle` | Lifecycle transitions |

### Tranches & Investment
| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/tranches?investor=X` | Investor's tranches (KYC gated) |
| POST | `/api/create-tranche` | Admin allocates tranche (single active enforced) |
| POST | `/api/invest` | Invest in tranche (KYC gated) |
| POST | `/api/complete-tranche` | Close tranche, mint token |
| GET | `/api/investments?investor=X` | Completed investments |
| GET | `/api/tokens?investor=X` | Minted tokens |

### VDR / Project Registry
| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/vdr?projectId=X` | VDR data for project |
| POST | `/api/create-vdr` | Create VDR entry |
| POST | `/api/approve-vdr` | Admin approves VDR |

### Waterfall Settlement
| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/waterfall?projectId=X` | Waterfall states |
| POST | `/api/create-waterfall` | Create waterfall for investor |
| POST | `/api/settle-revenue` | Process revenue through waterfall |

### Operator Tokens & Fees
| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/operator-tokens` | Operator carry tokens |
| POST | `/api/mint-operator-token` | Mint Class B / Performance token |
| POST | `/api/vest-operator-token` | Vest token on milestone |
| GET | `/api/dev-fees` | Dev fee disbursements |
| POST | `/api/disburse-dev-fee` | Disburse dev fee |

### Production & Yield
| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/production?projectId=X` | Production reports |
| POST | `/api/update-production` | Submit production data |

---

## Frontend Pages (18)

### Admin (7 pages)
- **Dashboard** — Stats overview
- **KYC Approvals** — Review ID cards + selfies, approve/reject
- **Portfolios** — Create regions, allocate investors
- **SPV Approvals** — Approve operator proposals
- **Manage Access** — Grant project visibility per investor
- **Tranche Management** — Create tranches, assign investors (single active)
- **Waterfall Settlement** — Settle revenue, mint operator tokens, disburse dev fees

### Operator (4 pages)
- **Dashboard** — Stats overview
- **Create SPV** — Full form with PPA, VDR, financial structure
- **Projects** — Lifecycle management (Approved → Funding → Construction → Operational)
- **Production** — Submit energy production reports

### Investor (6 pages + login)
- **Dashboard** — KYC-gated stats (blocks if KYC not approved)
- **Submit KYC** — Full name, wallet, ID card upload, live camera selfie
- **Projects** — Permission-filtered project list
- **My Tranches** — Invest + Done button with progress bars
- **Portfolio** — Completed investments
- **Tokens** — Yield-bearing tokens

---

## On-Chain vs Off-Chain Data Separation

| Data | Storage | Purpose |
|------|---------|---------|
| KYC status, name, wallet, role | **On-chain** (UserRole contract) | Contract-level authorization |
| ID card image, selfie image | **Off-chain** (backend KYC_STORE) | Document verification / VDR |
| Project status, funding, tranches | **On-chain** (ProjectSPV, Tranche) | Investment logic |
| PPA tariff, off-taker, capacity | **On-chain** (ProjectSPV fields) | Contract-critical |
| EPC milestones, site permits | **On-chain** (ProjectRegistry) | VDR approval gate |
| Waterfall state, IRR, distributions | **On-chain** (WaterfallState) | Settlement logic |
| Operator token vesting | **On-chain** (OperatorToken) | Carry structure |
| Production data | **On-chain** (ProductionReport) | Yield calculation |

---

## Troubleshooting

| Problem | Solution |
|---------|----------|
| Backend says "0 parties" | Sandbox not running. Start sandbox first, wait 30s |
| "Cannot resolve template ID" | Package hash mismatch. Restart backend after `daml build` |
| Port already in use | `fuser -k 6865/tcp; fuser -k 7575/tcp; fuser -k 3001/tcp` |
| "Connecting to ledger..." | Backend not started, or sandbox not ready |
| Investor sees no projects | Admin must grant PortfolioAccess first |
| Tranche creation rejected | Another tranche is still open (single active investor) |
| KYC gate blocking investor | Admin must approve KYC from Admin → KYC Approvals |
| `daml build` fails | Check `daml.yaml` sdk-version matches installed SDK |
| `You'll` parse error | Use `You will` instead (no apostrophes in JSX strings) |
| Import mismatch error | Run `ls ui/src/pages/admin/` and match filenames to imports in `main.tsx` |

---

## Project Structure

```
sawa-x-demo/
├── daml.yaml
├── daml/
│   ├── Sawa/
│   │   ├── Types.daml                    # Shared enums
│   │   ├── Identity/UserRole.daml        # KYC + UserRole
│   │   ├── Portfolio/RegionalPortfolio.daml
│   │   ├── Asset/ProjectSPV.daml         # SPV with VDR/PPA fields
│   │   ├── Asset/Tranche.daml            # Per-investor tranche
│   │   ├── Investment/Investment.daml     # Completed investment record
│   │   ├── Token/SPVToken.daml           # Yield-bearing token
│   │   ├── Access/PortfolioAccess.daml   # Project visibility control
│   │   ├── Registry/ProjectRegistry.daml # VDR / PPA metadata
│   │   ├── Settlement/WaterfallSettlement.daml # Waterfall + carry + dev fee
│   │   └── Yield/
│   │       ├── ProductionReport.daml
│   │       └── ClaimYield.daml
│   └── Test/Bootstrap.daml               # Demo data setup
├── backend/
│   ├── package.json
│   └── server.js                         # Express API (600+ lines)
├── ui/
│   ├── package.json
│   ├── vite.config.ts
│   ├── src/
│   │   ├── main.tsx                      # Routes
│   │   ├── api/backend.ts               # API client (zero hash)
│   │   ├── context/AppContext.tsx        # Auth + KYC state
│   │   ├── components/Layout.tsx         # Sidebar nav
│   │   ├── types/index.ts
│   │   └── pages/
│   │       ├── LoginPage.tsx
│   │       ├── admin/ (7 pages)
│   │       ├── operator/ (4 pages)
│   │       └── investor/ (6 pages)
├── scripts/start-sandbox.sh
├── infra/canton/
└── docker-compose.yml
