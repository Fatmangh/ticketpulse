# TicketPulse — Project Instructions

## What is this?
TicketPulse is an agent-based ticketing platform. Agents sell tickets in-person via Clover POS (PAX A920 Pro), customers get QR-code tickets via email, admins monitor everything real-time.

## Architecture
- **Monorepo**: `/server` (Node.js + Express + Prisma + TypeScript) and `/client` (React + Vite + Tailwind)
- **Database**: PostgreSQL on Supabase
- **Payments**: Clover REST API (sandbox mode by default)
- **Email**: SendGrid with QR code attachments
- **Real-time**: Socket.io
- **Auth**: JWT with bcrypt-hashed PINs

## Key Business Rules
- Commission: flat 8% on every sale
- Refund window: 14 days from sale date
- One unique QR code per ticket (not per transaction)
- Inventory is managed daily — global cap + per-agent allocation
- Refunded tickets are VOIDED and rejected at scanner
- Email must be entered twice and validated (client + server)
- PINs are bcrypt hashed, never stored in plaintext

## Git
- Repo: `Fatmangh/ticketpulse`
- Branch: `main`
- Commit frequently with descriptive messages

## Commands
```bash
# Server
cd server && npm run dev     # Port 4000
npx prisma studio            # DB browser
npx prisma db push           # Push schema changes
npx prisma db seed           # Reset seed data

# Client
cd client && npm run dev     # Port 5173
npm run build                # Production build
```

## Environment
- Server env: `server/.env` (see `server/.env.example`)
- Supabase connection string goes in DATABASE_URL
- Set CLOVER_SANDBOX=true for development without Clover credentials

## Style Guide
- TypeScript strict mode
- Zod for request validation
- Functional components with hooks (no class components)
- Tailwind CSS with CSS variables for theming (dark/light mode)
- Fonts: Outfit (display), JetBrains Mono (data/monospace)
- Accent color: #E8643A (dark) / #D4522A (light)

## Testing
- Use Vitest for backend tests
- Test critical paths: auth, sale creation, refund processing, QR scanning
