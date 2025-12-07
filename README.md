# Thoughtly Ticket Booking App

End-to-end concert ticket booking app with a React + TypeScript frontend and a Node.js (Express 5 + TypeScript) backend using Postgres. 

## Project Structure
- `backend/` — Express API, Postgres access, Jest unit tests
- `frontend/` — Vite + React UI

## Setup & Run
### 1) Install deps
```
npm install --prefix backend
npm install --prefix frontend
```

### 2) Database
- Create your own Postgres database (local or hosted).
- Run seed file (seed.sql)

### 3) Environment
- Copy `backend/.env.example` to `backend/.env` and set:
  - `DATABASE_URL` (e.g., `postgres://user:pass@localhost:5432/ticket_booking`)
  - `PORT` (optional, default 3000)
  - `FRONTEND_ORIGIN` (e.g., `http://localhost:5173` for CORS)
- Frontend: optional `frontend/.env` with `VITE_API_BASE_URL=http://localhost:3000/api` if your API host/port differs.

### 4) Run backend
```
cd backend
npm run dev
```

### 5) Run frontend
```
cd frontend
npm run dev
```

### 6) Build
- Backend: `cd backend && npm run build`
- Frontend: `cd frontend && npm run build`

### 7) Tests (backend)
```
cd backend
npm run test
```

## API (backend)
Base path: `/api`
- `GET /api/health`
- `GET /api/events`
- `GET /api/events/:eventId`
- `GET /api/events/:eventId/ticket-tiers`
- `POST /api/bookings` — body `{ eventId, clientReference?, items: [{ ticketTierId, quantity }, ...] }`
- `GET /api/bookings/:bookingId`

## Preventing Double Booking
- **Single transaction** wraps each booking creation.
- **Row-level locks**: `ticket_tiers` rows are selected with `FOR UPDATE` while checking inventory, so concurrent requests cannot oversell.
- **Validate+decrement together**: remaining inventory is checked and decremented inside the transaction; any error rolls back all writes.
- **Idempotency (`clientReference`)**: if provided and already used for the same event, the existing booking is returned; if used for another event, it is rejected. This prevents duplicate submissions/retries from creating extra bookings.

## HA/Scale/Perf Design Intent (99.99% target, p95<500ms, ~50k peak CCU)
- **Database layer**
  - Primary Postgres for writes; add read replicas for GET-heavy traffic.
  - Use pgbouncer for connection pooling; index hot lookups (`events.id`, `ticket_tiers.event_id`, `bookings.event_id`, `booking_items.booking_id`, unique `(event_id, client_reference)`).
  - For very hot events, you can shard by event so each shard owns its inventory rows.
- **App layer**
  - Run multiple stateless API instances behind a load balancer; add health checks and autoscaling on CPU/latency.
  - Keep booking logic in a single DB transaction; no shared in-memory state.
- **Networking & availability**
  - Deploy across multiple availability zones so one AZ failure doesn’t take you down.
  - Terminate TLS at the load balancer; use DNS/LB health checks to fail over unhealthy nodes.
- **Caching**
  - CDN for the frontend assets.
  - Optional could use short-TTL cache (Redis) for event/tier listings;
- **Global users**
  - Serve UI from a CDN; use geo load balancing for the API.
  - Keep a single write region per inventory shard to avoid split-brain. Replicas can serve reads.
- **Resilience & ops**
  - Timeouts/retries with idempotency keys; circuit breakers to shed load under downstream failure.
  - Monitor p95 latency, error rate, DB saturation, and queue depth; alert on SLO breaches.
- **Performance**
  - Booking path is a few SQL statements inside one transaction; minimize network hops.
  - Use prepared statements and pooling to keep p95 under 500ms at peak.

## Multi-Region Approach (HA)
- **Pick a single writer for each set of tickets**: Choose one region to own writes for an event’s inventory. Other regions can still read from replicas, but all booking writes for that event go to its “home” region.
- **Route users smartly**: Use global DNS/load balancing to send users to the nearest healthy region. For booking writes, forward to the home region for that event; for reads, serve locally from replicas/caches.
- **Partition by event**: Assign events to regions (or shards). Store that mapping so API nodes know where to send booking requests; static content stays at the edge/CDN.
- **Failover plan**: If a region fails, promote a replica in another region for that shard. Use health checks to flip traffic, and rely on idempotency keys to keep retries from creating duplicate bookings.
