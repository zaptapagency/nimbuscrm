# NimbusCRM

A production-grade, Salesforce-inspired SaaS CRM built with Next.js 14, PostgreSQL, Prisma, and TypeScript.

## Features

- **Lead Management** — Track and qualify prospects through your sales pipeline
- **Account Management** — Organize companies and their relationships
- **Contact Management** — Build and manage contact databases with account linkage
- **Opportunity Pipeline** — Visualize deals, track stages, and manage forecasts
- **Activity Tracking** — Tasks, calls, meetings, and notes linked to leads, contacts, and accounts
- **Dashboard Analytics** — Pipeline overview, key metrics, and performance indicators
- **Role-Based Access Control** — Admin, Manager, and Sales Rep roles with ownership-based data filtering
- **Transactional Lead Conversion** — Atomically convert leads to accounts + contacts + opportunities
- **Case-Insensitive Search** — Fast, flexible search across all entity types
- **Security First** — Environment validation, rate limiting, CSP headers, and secure defaults

## Tech Stack

- **Frontend:** Next.js 14 (App Router), React Server Components, Tailwind CSS, shadcn/ui-inspired components
- **Backend:** Next.js API Routes, NextAuth.js v4 (JWT + Credentials provider)
- **Database:** PostgreSQL 13+ with Prisma 5.22 ORM
- **Validation:** Zod schema validation at API boundaries
- **Deployment:** Docker + Railway (or any container platform)
- **Testing:** Vitest (unit), Playwright (e2e)

## Local Development

### Prerequisites

- Node.js 20+ (https://nodejs.org)
- PostgreSQL 13+ running locally or a remote instance
- Git 2.50+

### Setup

1. Clone the repository:
   ```bash
   git clone <your-repo-url>
   cd sales-force
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Configure environment variables:
   ```bash
   cp .env.example .env
   ```
   Edit `.env` and set:
   - `DATABASE_URL`: PostgreSQL connection string (format: `postgresql://user:password@host:port/database?schema=public`)
   - `NEXTAUTH_SECRET`: Strong random string (`openssl rand -base64 32`)
   - `NEXTAUTH_URL`: Your app URL (default: `http://localhost:3000` for local dev)

4. Create and seed the database:
   ```bash
   npx prisma migrate deploy
   npx prisma db seed
   ```

5. Start the development server:
   ```bash
   npm run dev
   ```

   Open http://localhost:3000 in your browser.

### Available Scripts

```bash
npm run dev           # Start dev server with hot reload
npm run build         # Build production bundle (Next.js standalone)
npm start             # Start production server
npm run typecheck     # TypeScript type checking
npm run lint          # ESLint checks
npm test              # Run Vitest (unit + integration tests)
npm run test:e2e      # Run Playwright e2e tests
npm run db:seed       # Seed database with demo data
npx prisma studio    # Open Prisma Studio GUI for database inspection
```

### Demo Credentials

After running `npm run db:seed`, three demo users are available:

| Email | Password | Role |
|-------|----------|------|
| admin@nimbuscrm.local | Password123! | Admin |
| manager@nimbuscrm.local | Password123! | Manager |
| sales@nimbuscrm.local | Password123! | Sales Rep |

**⚠️ IMPORTANT:** These credentials are for local development only. Never run `db:seed` on a production database.

## Database Schema

The schema consists of 6 core models:

- **User** — System users with roles (ADMIN, MANAGER, SALES_REP)
- **Lead** — Prospects not yet qualified; can be converted to Account + Contact + Opportunity
- **Account** — Companies or organizations
- **Contact** — Individual contacts linked to Accounts
- **Opportunity** — Deal records linked to Accounts/Contacts, tracked through sales stages
- **Activity** — Tasks, calls, meetings, notes attached polymorphically to Leads, Contacts, Accounts, or Opportunities

All entities support **ownership** (ownedById) and **audit tracking** (createdById, createdAt, updatedAt).

## Prisma Migrations

Schema changes are versioned via Prisma migrations:

```bash
# Create a migration after schema changes
npx prisma migrate dev --name description_of_change

# In production (Railway, etc.), migrations run automatically:
# The Dockerfile includes: CMD ["prisma migrate deploy && node server.js"]
```

For production first-time setup, the initial migration (`20260727012802_init`) creates all tables.

## Production Deployment

### Railway (Recommended)

1. **Prerequisites**
   - GitHub account with repo (push code first)
   - Railway account (https://railway.app)

2. **Create Railway Project**
   - New Project → GitHub Repository → select this repo
   - Add PostgreSQL plugin from Railway dashboard
   - Railway auto-generates `DATABASE_URL`

3. **Set Environment Variables** in Railway dashboard:
   - `DATABASE_URL` — (auto-set by Postgres plugin)
   - `NEXTAUTH_SECRET` — Generate: `openssl rand -base64 32`
   - `NEXTAUTH_URL` — Your Railway domain (e.g., `https://app-123.railway.app`)
   - `NODE_ENV` — `production`

4. **Deploy**
   - Push code to GitHub; Railway auto-deploys from connected repo
   - Migrations run automatically in container startup
   - App is live at your Railway domain

5. **First Production Run**
   - Do NOT run `prisma db seed` in production (demo passwords are insecure)
   - If you need initial data, create users manually or via admin panel
   - Monitor logs for any issues: `railway logs`

### Docker (Local or Self-Hosted)

Build and run locally:

```bash
docker build -t nimbuscrm .
docker run -p 3000:3000 \
  -e DATABASE_URL="postgresql://user:pass@host:5432/db?schema=public" \
  -e NEXTAUTH_SECRET="your-secret-here" \
  -e NEXTAUTH_URL="http://localhost:3000" \
  nimbuscrm
```

The Dockerfile is optimized with 3-stage builds (deps → builder → runner) for minimal image size.

## Security

### Environment Validation
- `DATABASE_URL` must be present
- `NEXTAUTH_SECRET` must be 32+ characters
- In production, dev defaults trigger warnings

### Rate Limiting
- In-memory token bucket per IP
- Default: 60 requests/minute
- Strict: 5 requests/minute on `/api/auth/signin` and `/api/signup`
- Note: Resets per instance; use Upstash Redis for multi-instance deployments

### HTTP Security Headers
- Content-Security-Policy (with pragmatic `unsafe-inline` for v1)
- Strict-Transport-Security (HSTS)
- X-Frame-Options (DENY)
- X-Content-Type-Options (nosniff)
- Referrer-Policy (strict-origin-when-cross-origin)
- Permissions-Policy (camera, mic, geolocation, USB disabled)

### API Error Handling
- Internal error details are **never** leaked to clients
- Errors are logged server-side for debugging
- Clients receive generic "Something went wrong" messages

### Database
- All table columns use parameterized queries (Prisma ORM)
- String-based enums are validated via Zod at boundaries
- Foreign key constraints at database level
- Case-sensitive search fixed for Postgres (uses `mode: "insensitive"` where needed)

## Testing

```bash
# Unit tests (15 tests, <500ms)
npm test -- tests/unit

# Integration tests (currently skipped; known limitation)
# TODO: Implement provider-agnostic test infrastructure

# E2E tests (Playwright)
npm run test:e2e
```

## Known Limitations & Fast-Follows

| Item | Status | Notes |
|------|--------|-------|
| Integration tests | ⚠️ Blocked | Schema provider mismatch (Postgres prod, SQLite tests). Requires test infrastructure overhaul. |
| Dark mode full coverage | 🟡 Foundation only | Theme provider + toggle in place; full `dark:` variants are a fast-follow. |
| CSP nonce-based scripts | 🔄 Documented | Current: `unsafe-inline` for pragmatism. Future: implement nonce injection. |
| Rate limiting multi-instance | 🔄 Documented | In-memory storage resets per instance. Upgrade path: Upstash Redis. |

## API Overview

All endpoints require authentication (session/JWT) except noted.

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/api/signup` | ❌ | Create account (rate limited) |
| POST | `/api/auth/signin` | ❌ | Login (rate limited) |
| GET | `/api/health` | ❌ | Health check (database connectivity) |
| GET | `/api/search?q=term` | ✅ | Global search (leads, accounts, contacts, opportunities) |
| GET/POST/PUT/DELETE | `/api/leads[/id]` | ✅ | Lead CRUD operations |
| POST | `/api/leads/[id]/convert` | ✅ | Convert lead to account + contact + opportunity (atomic) |
| GET/POST/PUT/DELETE | `/api/accounts[/id]` | ✅ | Account CRUD |
| GET/POST/PUT/DELETE | `/api/contacts[/id]` | ✅ | Contact CRUD |
| GET/POST/PUT/DELETE | `/api/opportunities[/id]` | ✅ | Opportunity CRUD |
| PATCH | `/api/opportunities/[id]/stage` | ✅ | Move opportunity to pipeline stage |
| GET/POST/PUT/DELETE | `/api/activities[/id]` | ✅ | Activity CRUD |
| GET | `/api/dashboard` | ✅ | Dashboard analytics |
| GET | `/api/users` | ✅ | List users (admins only) |

## Troubleshooting

### "DATABASE_URL must start with postgresql://"
Ensure your `.env` contains a valid PostgreSQL URL, not SQLite. Example: `postgresql://postgres@localhost:5432/nimbuscrm?schema=public`

### "Prisma schema validation failed" during build
Run `npx prisma generate` to regenerate Prisma client, then `npm run build` again.

### "Too many requests (429)" responses
Your IP is rate-limited. Default: 60 req/min per IP. Wait 60 seconds or restart server (resets in-memory limits).

### Migrations not running on Railway
Check Railway logs for errors. Ensure `DATABASE_URL` is set and points to a running Postgres instance. Migrations run automatically in the Dockerfile's CMD.

### "session token not found" errors
Ensure `NEXTAUTH_SECRET` is set to a 32+ character string. In development, regenerate: `openssl rand -base64 32`.

## Contributing

This is a production SaaS project. Changes should be:
- Submitted as small, focused commits
- Tested locally (typecheck, lint, tests)
- Documented in commit messages
- Reviewed before merge

## License

Proprietary (NimbusCRM)

## Support

For issues, errors, or feature requests, open an issue in the GitHub repository.
