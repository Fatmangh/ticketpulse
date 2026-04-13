# TicketPulse

Agent-based ticketing platform. Agents sell tickets in-person via Clover POS (PAX A920 Pro), customers receive QR-code tickets via email, admins monitor everything in real-time.

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18 + Vite, Tailwind CSS, React Router v6 |
| Backend | Node.js 20 + Express.js + TypeScript |
| Database | PostgreSQL via Supabase |
| ORM | Prisma |
| Auth | JWT + bcrypt PIN hashing |
| Payments | Clover REST API (sandbox mode available) |
| Email | SendGrid with QR code attachments |
| Real-time | Socket.io |

## Quick Start

```bash
# Server
cd server
npm install
cp .env.example .env   # Fill in your values
npx prisma generate
npx prisma db push
npx prisma db seed
npm run dev              # Port 4000

# Client (separate terminal)
cd client
npm install
npm run dev              # Port 5173
```

## Project Structure

```
ticketpulse/
├── server/          # Node.js + Express + Prisma
│   ├── prisma/      # Schema + seed
│   ├── src/
│   │   ├── config/
│   │   ├── middleware/
│   │   ├── routes/
│   │   ├── controllers/
│   │   ├── services/
│   │   ├── utils/
│   │   └── types/
│   └── tests/
└── client/          # React + Vite + Tailwind
    └── src/
        ├── context/
        ├── hooks/
        ├── lib/
        ├── pages/
        ├── components/
        └── types/
```

## Environment Variables

See `.env.example` for required configuration.

## License

Private
