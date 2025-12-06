# Ticket Booking Backend (Express + Postgres)

An Express 5 + TypeScript API that matches the take-home assignment conversation. It models a simple concert ticketing flow with tiers and prevents double-booking through Postgres transactions and row-level locks.

## Setup
- Copy `.env.example` to `.env` and set your values (`DATABASE_URL`, optional `PORT`).
- Install dependencies: `npm install`
- Ensure the Postgres schema already exists (tables are expected to be present).
- Seed a default event and tiers: `npm run db:seed`
- Start the server: `npm run dev` (or `npm run build && npm start`)

Environment:
- `DATABASE_URL` (postgres connection string, defaults to `postgres://localhost:5432/ticket_booking`)
- `PORT` (default 3000)

## API
Base path: `/api`
- `GET /api/health` – health check
- `GET /api/events` – list events
- `GET /api/events/:eventId` – event detail
- `GET /api/events/:eventId/ticket-tiers` – tiers with prices and remaining inventory
- `POST /api/bookings` – create a booking with one or more tier items. Respects optional `clientReference` idempotency key. Responds `409` if insufficient inventory.
- `GET /api/bookings/:bookingId` – fetch a booking and its line items

Request example:
```json
{
  "eventId": "event-uuid",
  "clientReference": "optional-idempotency-key",
  "items": [
    { "ticketTierId": "vip-tier-uuid", "quantity": 2 },
    { "ticketTierId": "ga-tier-uuid", "quantity": 3 }
  ]
}
```

## Concurrency & Consistency
- Booking writes run inside a single database transaction.
- Relevant `ticket_tiers` rows are selected `FOR UPDATE` so competing transactions cannot both claim the same inventory.
- Inventory is decremented in the same transaction as booking creation; any error rolls everything back.
- `client_reference` has a uniqueness constraint to support idempotent booking requests; retries with the same reference return the existing booking.

## Files to note
- Express setup: `src/app.ts`, `src/index.ts`
- Routing: `src/routes/*`, controllers in `src/controllers/*`
- Services with DB logic: `src/services/*`
- Database helpers: `src/db.ts`
- Schema: `migrations/001_init.sql`; seeding: `src/scripts/seed.ts`
