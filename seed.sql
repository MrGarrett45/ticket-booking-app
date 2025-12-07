-- =============================================================
-- SEED.SQL - Ticket Booking System Sample Data
-- =============================================================

-- Enable UUID generation extension
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- =============================================================
-- ENUM TYPES
-- =============================================================

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'ticket_tier_type') THEN
        CREATE TYPE ticket_tier_type AS ENUM ('VIP', 'FRONT_ROW', 'GA');

END IF;

IF NOT EXISTS (
    SELECT 1
    FROM pg_type
    WHERE
        typname = 'booking_status'
) THEN CREATE TYPE booking_status AS ENUM(
    'PENDING',
    'CONFIRMED',
    'FAILED',
    'CANCELED'
);

END IF;

END $$;

-- =============================================================
-- TABLES
-- =============================================================

DROP TABLE IF EXISTS booking_items CASCADE;

DROP TABLE IF EXISTS bookings CASCADE;

DROP TABLE IF EXISTS ticket_tiers CASCADE;

DROP TABLE IF EXISTS events CASCADE;

-- =========================
-- EVENTS
-- =========================
CREATE TABLE events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid (),
    name TEXT NOT NULL,
    venue TEXT,
    starts_at_utc TIMESTAMPTZ NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- =========================
-- TICKET TIERS
-- =========================
CREATE TABLE ticket_tiers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid (),
    event_id UUID NOT NULL REFERENCES events (id) ON DELETE CASCADE,
    tier ticket_tier_type NOT NULL,
    price_cents INT NOT NULL,
    total_quantity INT NOT NULL,
    remaining_quantity INT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (event_id, tier)
);

-- =========================
-- BOOKINGS
-- =========================
CREATE TABLE bookings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid (),
    event_id UUID NOT NULL REFERENCES events (id),
    client_reference TEXT UNIQUE,
    status booking_status NOT NULL DEFAULT 'CONFIRMED',
    total_amount_cents INT NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- =========================
-- BOOKING ITEMS
-- =========================
CREATE TABLE booking_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid (),
    booking_id UUID NOT NULL REFERENCES bookings (id) ON DELETE CASCADE,
    ticket_tier_id UUID NOT NULL REFERENCES ticket_tiers (id),
    quantity INT NOT NULL,
    price_cents INT NOT NULL,
    UNIQUE (booking_id, ticket_tier_id)
);

-- =============================================================
-- SAMPLE EVENT DATA
-- =============================================================

INSERT INTO
    events (
        id,
        name,
        venue,
        starts_at_utc
    )
VALUES (
        '11111111-1111-1111-1111-111111111111',
        'Thoughtly Live: Global AI Summit',
        'New York City – MSG Arena',
        '2025-07-15T00:00:00Z'
    ),
    (
        '22222222-2222-2222-2222-222222222222',
        'Thoughtly Concert Experience',
        'Los Angeles – Hollywood Bowl',
        '2025-08-21T03:00:00Z'
    ),
    (
        '33333333-3333-3333-3333-333333333333',
        'Thoughtly World Tour: Opening Night',
        'London – O2 Arena',
        '2025-09-10T19:30:00Z'
    );

-- =============================================================
-- SAMPLE TICKET TIERS PER EVENT
-- =============================================================

-- =========================
-- Event 1 tiers (NYC)
-- =========================
INSERT INTO
    ticket_tiers (
        id,
        event_id,
        tier,
        price_cents,
        total_quantity,
        remaining_quantity
    )
VALUES (
        'aaaaaaa1-aaaa-aaaa-aaaa-aaaaaaaaaaa1',
        '11111111-1111-1111-1111-111111111111',
        'VIP',
        10000,
        100,
        100
    ),
    (
        'aaaaaaa2-aaaa-aaaa-aaaa-aaaaaaaaaaa2',
        '11111111-1111-1111-1111-111111111111',
        'FRONT_ROW',
        5000,
        200,
        200
    ),
    (
        'aaaaaaa3-aaaa-aaaa-aaaa-aaaaaaaaaaa3',
        '11111111-1111-1111-1111-111111111111',
        'GA',
        1000,
        500,
        500
    );

-- =========================
-- Event 2 tiers (LA)
-- =========================
INSERT INTO
    ticket_tiers (
        id,
        event_id,
        tier,
        price_cents,
        total_quantity,
        remaining_quantity
    )
VALUES (
        'bbbbbbb1-bbbb-bbbb-bbbb-bbbbbbbbbbb1',
        '22222222-2222-2222-2222-222222222222',
        'VIP',
        12000,
        80,
        80
    ),
    (
        'bbbbbbb2-bbbb-bbbb-bbbb-bbbbbbbbbbb2',
        '22222222-2222-2222-2222-222222222222',
        'FRONT_ROW',
        6000,
        150,
        150
    ),
    (
        'bbbbbbb3-bbbb-bbbb-bbbb-bbbbbbbbbbb3',
        '22222222-2222-2222-2222-222222222222',
        'GA',
        1500,
        400,
        400
    );

-- =========================
-- Event 3 tiers (London)
-- =========================
INSERT INTO
    ticket_tiers (
        id,
        event_id,
        tier,
        price_cents,
        total_quantity,
        remaining_quantity
    )
VALUES (
        'ccccccc1-cccc-cccc-cccc-ccccccccccc1',
        '33333333-3333-3333-3333-333333333333',
        'VIP',
        9000,
        120,
        120
    ),
    (
        'ccccccc2-cccc-cccc-cccc-ccccccccccc2',
        '33333333-3333-3333-3333-333333333333',
        'FRONT_ROW',
        4500,
        180,
        180
    ),
    (
        'ccccccc3-cccc-cccc-cccc-ccccccccccc3',
        '33333333-3333-3333-3333-333333333333',
        'GA',
        900,
        600,
        600
    );