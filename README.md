# Medflect AI

Transforming hospitals into smart, explainable-AI-enabled care hubs with on-prem Groq inference, FHIR-native data, offline-first sync, and blockchain-governed consent and audit.

---

## 1. Executive Summary

- __Context__: Ghana faces a 42% health workforce shortfall; across Africa there is ~1 doctor per 5,000 people. Data silos and paper records create delays and errors.
- __Vision__: On-site, explainable LLM agents (Groq) that summarize patient records, assist clinical reasoning, and power patient messaging—while respecting patient consent via blockchain and interoperating via HL7 FHIR.
- __Mission__: Amplify clinicians, protect patient autonomy, and increase care quality. Start with 37 Military Hospital and scale across Ghana/Africa.

## 2. Product Blueprint

- __Smart AI Agents__: Groq-accelerated LLMs ingest FHIR resources and hospital data (via MCP) to deliver:
  - Clinical Summaries (discharge, progress, handoff)
  - Clinical Support (diagnoses hints, med checks, care plans)
  - Patient Messaging (appointments, triage via app/SMS)
- __Consent & Audit Smart Contracts__: Purpose-based access control; each data access/inference is hashed and written on chain for immutable audit.
- __Offline-First Sync__: Local-first storage on devices/edge with secure background sync when connected.
- __No-Code Dashboards/Workflow Builder__: Drag-and-drop rules, metrics (bed occupancy, wait times, readmissions), and role-specific UIs.
- __User Roles__: Clinicians, Admins, Patients/Caregivers—with streamlined, role-focused interfaces.

## 3. Repository Overview (Monorepo)

```
.
├─ apps/
│  ├─ web/                # React 18 + Vite + TS + Tailwind + PWA
│  └─ mobile/             # React Native + Expo
├─ packages/
│  ├─ server/             # Express + TS; Supabase/AI services
│  └─ blockchain/         # Hardhat + Ethers + OZ; consent/audit contracts
├─ docker-compose.yml     # Supabase, Ganache, Redis, Postgres (local)
├─ index.html             # Landing; redirects to apps/web/
├─ env.example            # Environment variables template
└─ package.json           # npm workspaces + scripts
```

- __Workspaces__: defined in root `package.json` under `apps/*` and `packages/*`.
- __Infra__: local services via `docker-compose.yml`.

## 4. Technology Architecture

- __Groq-Powered Inference__: On-prem LPU servers for ultra-low-latency LLM inference. Keeps PHI local and fast.
- __FHIR-First Data__: All clinical entities modeled as HL7 FHIR resources; RESTful APIs for interoperability.
- __Model Context Protocol (MCP)__: Securely connects LLM prompts to live hospital data sources and enables traceable writes.
- __Blockchain Layer__: Permissioned Ethereum network; smart contracts encode consent and audit. Only hashes of sensitive actions are on-chain.
- __Offline-First Sync__: Local DB (e.g., IndexedDB/SQLite) as primary; background, encrypted bi-directional sync; conflict resolution aligned to FHIR versioning.
- __Integration Flow__: Clinician triggers “Generate Summary” → MCP fetches latest FHIR context → Groq LLM returns draft → Clinician edits → Saved locally → Sync to cloud → Audit hash written on-chain.

## 5. Codebase Components

- __Web PWA__ (`apps/web/`)
  - Entry: `src/main.tsx`, `src/App.tsx` with `react-router-dom` routes and providers `AuthProvider`, `SyncProvider`, `ToastProvider`.
  - PWA: `vite`, `vite-plugin-pwa` with `virtual:pwa-register` in `main.tsx`.
  - Screens: `/login`, protected `/dashboard`, `/patients`, `/patients/:id`, `/admin`, `/audit`.
- __Server API__ (`packages/server/`)
  - Entry: `src/index.ts` (Express). Common middleware: `cors`, `helmet`, rate limits, validators.
  - Integrations: Supabase, AI SDKs (`openai`, `groq-sdk`, `anthropic`, `cohere`), LangChain modules.
  - DB: Supabase for auth/storage; optional Postgres (via docker) and Redis cache.
- __Blockchain__ (`packages/blockchain/`)
  - Hardhat toolchain, TypeChain, Ethers v6, OpenZeppelin. Scripts for compile/test/deploy to localhost/Ganache/Sepolia.
- __Mobile__ (`apps/mobile/`)
  - Expo-based RN app with navigation, notifications, device integrations.

## 6. Getting Started

### Prerequisites

- Node.js >= 18, npm >= 8
- Docker Desktop (for local infra)
- Git, and (optional) VS Code + Live Server

### 1) Clone and Install

```bash
npm install
```

### 2) Environment Variables

Copy `env.example` to `.env` in relevant workspaces and set keys (Supabase URL/keys, LLM providers, chain RPC, etc.). Do not commit secrets.

### 3) Start Local Infrastructure

```bash
npm run start:local
# brings up: supabase, ganache, redis, postgres
```

### 4) Run Apps

- Web (dev):
  ```bash
  npm run dev:web
  ```
  Or open `apps/web/` with Live Server (root it to `apps/web/`). Root `index.html` auto-redirects to `./apps/web/`.

- Server (dev):
  ```bash
  npm run dev:server
  ```

- Mobile (Expo):
  ```bash
  npm run dev:mobile
  # Or inside apps/mobile: npm run start
  ```

### 5) Build

```bash
npm run build:web       # web only
npm run build:all       # all workspaces
```

## 7. Developer Guide

- __Web__
  - Entry: `apps/web/src/main.tsx`
  - Routing & guards: `apps/web/src/App.tsx`, `components/ProtectedRoute`
  - Context: `apps/web/src/contexts/`
  - Services/API: `apps/web/src/services/`
- __Server__
  - Entry: `packages/server/src/index.ts`
  - Services: `packages/server/src/services/`
  - Scripts (DB, functions): see `package.json` scripts
- __Blockchain__
  - Compile/test/deploy from `packages/blockchain/`
  - Local networks: Hardhat node or Docker Ganache

## 8. Security, Privacy, and Governance

- __Provenance & Traceability__: Version-control models/datasets; log inputs via MCP; attach model cards to inferences.
- __Consent Enforcement__: Purpose-based access smart contracts; revocable tokens; patient-visible permissions.
- __Immutable Audit__: Timestamped on-chain logs of data reads/writes and AI events (hash-only, no PHI on-chain).
- __Explainability__: Outputs annotated with data points and reasoning; clinician-in-the-loop overrides.

## 9. Roadmap

1) __MVP & Pilot (0–12 months)__: Deploy at 37 Military Hospital. On-prem Groq + blockchain node. Integrate HIS. Train cohort. Collect metrics.
2) __Iterate & Rollout (Year 2)__: Refine UX/workflows; expand to major Ghana hospitals; align with national strategy; multi-site cloud sync.
3) __Regional Expansion (Years 3–4)__: Enter Nigeria, Kenya, South Africa; localization; partnerships (telecom, satellite) for connectivity.
4) __Scale (Year 5+)__: Regional data centers, telehealth, ambulatory; continuous R&D on Africa-native models; interoperability certifications.

## 10. Commercial Model (Summary)

- __Pricing__: SaaS license tiered by bed count + Results-as-a-Service performance component.
- __ROI__: 5–10% cost reduction typical with AI; quick payback via efficiency and error reduction.
- __Funding__: Mix of grants, development finance, and SaaS contracts; strategic partnerships (telcos, cloud).

## 11. Impact

- __Equity__: Specialist-level support for rural clinics; measurable improvements in throughput, satisfaction.
- __Regulatory__: Built-in audit and FHIR compliance; supports national digital health policy.
- __Operations__: Reduced wait times and burnout; improved flow and safety.

## 12. Scripts Reference (Root `package.json`)

- `bootstrap`: install + build all
- `dev:web` | `build:web`
- `dev:server`
- `dev:mobile`
- `build:all`
- `start:local`: docker infra up
- `test` | `lint` | `type-check` | `clean`

## 13. Notes on Groq, FHIR, MCP, Blockchain (Implementation Pointers)

- __Groq__: Provision on-prem LPU servers; expose local inference endpoints used by `packages/server` services. Ensure PHI never leaves premises.
- __FHIR__: Adopt resource schemas across UI and API; leverage FHIR versioning for conflict resolution in offline sync.
- __MCP__: Define MCP servers for EHR/LIS/PACS; log all prompt-context references.
- __Blockchain__: Treat chain as governance/audit layer; store only hashes and permission tokens. Use permissioned validators (consortium).

## 14. Contributing

1) Fork/branch; 2) `npm install`; 3) Add tests; 4) `npm run lint && npm run type-check`; 5) PR with context and screenshots.

## 15. License

MIT 
