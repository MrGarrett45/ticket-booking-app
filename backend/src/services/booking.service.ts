import { PoolClient } from "pg";
import { query, withTransaction } from "../db";
import { Booking, BookingItem } from "../models";
import {
  ConflictError,
  NotFoundError,
  ValidationError,
} from "../utils/errors";

interface CreateBookingItemInput {
  ticketTierId: string;
  quantity: number;
}

export interface CreateBookingInput {
  eventId: string;
  clientReference?: string | null;
  items: CreateBookingItemInput[];
}

export async function createBooking(input: CreateBookingInput): Promise<Booking> {
  validateBookingInput(input);

  return withTransaction(async (client) => {
    await ensureEventExists(client, input.eventId);

    const normalizedRef = input.clientReference?.trim() || null;
    if (normalizedRef) {
      const existing = await findBookingByReference(client, normalizedRef);
      if (existing) {
        if (existing.event_id !== input.eventId) {
          throw new ValidationError("clientReference already used for another event");
        }
        return loadBooking(client, existing.id);
      }
    }

    const tierIds = input.items.map((item) => item.ticketTierId);
    const tiersResult = await client.query(
      `
      -- Lock tiers while we check/decrement inventory to prevent overselling.
      SELECT id, event_id, tier, price_cents, remaining_quantity
      FROM ticket_tiers
      WHERE id = ANY($1::uuid[]) AND event_id = $2
      FOR UPDATE
      `,
      [tierIds, input.eventId],
    );

    if (tiersResult.rowCount !== tierIds.length) {
      throw new NotFoundError("One or more ticket tiers were not found");
    }

    const tiersById = new Map<string, any>();
    for (const row of tiersResult.rows) {
      tiersById.set(row.id, row);
    }

    let totalAmountCents = 0;
    for (const item of input.items) {
      const tier = tiersById.get(item.ticketTierId);
      if (!tier) {
        throw new NotFoundError("Ticket tier not found");
      }
      if (tier.event_id !== input.eventId) {
        throw new ValidationError("Ticket tier does not belong to the event");
      }
      if (tier.remaining_quantity < item.quantity) {
        throw new ConflictError(`Not enough tickets remaining for tier ${tier.tier}`);
      }
      totalAmountCents += Number(tier.price_cents) * item.quantity;
    }

    const bookingResult = await client.query(
      `
      INSERT INTO bookings (event_id, client_reference, status, total_amount_cents)
      VALUES ($1, $2, 'CONFIRMED', $3)
      RETURNING *
      `,
      [input.eventId, normalizedRef, totalAmountCents],
    );
    const bookingRow = bookingResult.rows[0];

    for (const item of input.items) {
      const tier = tiersById.get(item.ticketTierId);
      await client.query(
        `
        INSERT INTO booking_items (booking_id, ticket_tier_id, quantity, price_cents)
        VALUES ($1, $2, $3, $4)
        `,
        [bookingRow.id, tier.id, item.quantity, tier.price_cents],
      );

      await client.query(
        `
        UPDATE ticket_tiers
        SET remaining_quantity = remaining_quantity - $1
        WHERE id = $2
        `,
        [item.quantity, tier.id],
      );
    }

    return loadBooking(client, bookingRow.id);
  });
}

export async function getBooking(bookingId: string): Promise<Booking> {
  return loadBooking(null, bookingId);
}

async function ensureEventExists(client: PoolClient, eventId: string) {
  const result = await client.query(`SELECT 1 FROM events WHERE id = $1`, [eventId]);
  if (result.rowCount === 0) {
    throw new NotFoundError("Event not found");
  }
}

async function findBookingByReference(client: PoolClient, clientReference: string) {
  const result = await client.query(
    `SELECT * FROM bookings WHERE client_reference = $1`,
    [clientReference],
  );
  return result.rows[0] ?? null;
}

async function loadBooking(client: PoolClient | null, bookingId: string): Promise<Booking> {
  const executor = client ?? {
    query: (text: string, params?: any[]) => query(text, params),
  };

  const bookingResult = await executor.query(
    `SELECT * FROM bookings WHERE id = $1`,
    [bookingId],
  );

  if (bookingResult.rowCount === 0) {
    throw new NotFoundError("Booking not found");
  }

  const itemsResult = await executor.query(
    `
    SELECT bi.*, tt.tier
    FROM booking_items bi
    JOIN ticket_tiers tt ON tt.id = bi.ticket_tier_id
    WHERE bi.booking_id = $1
    `,
    [bookingId],
  );

  return mapBooking(bookingResult.rows[0], itemsResult.rows);
}

const mapBooking = (bookingRow: any, itemsRows: any[]): Booking => {
  const items: BookingItem[] = itemsRows.map((row) => ({
    id: row.id,
    ticketTierId: row.ticket_tier_id,
    tier: row.tier,
    quantity: Number(row.quantity),
    priceCents: Number(row.price_cents),
  }));

  return {
    id: bookingRow.id,
    eventId: bookingRow.event_id,
    clientReference: bookingRow.client_reference,
    status: bookingRow.status,
    totalAmountCents: Number(bookingRow.total_amount_cents),
    createdAt: bookingRow.created_at,
    updatedAt: bookingRow.updated_at,
    items,
  };
};

function validateBookingInput(input: CreateBookingInput) {
  if (!input.eventId) {
    throw new ValidationError("eventId is required");
  }
  if (!Array.isArray(input.items) || input.items.length === 0) {
    throw new ValidationError("At least one booking item is required");
  }

  const seenTierIds = new Set<string>();
  for (const item of input.items) {
    if (!item.ticketTierId) {
      throw new ValidationError("ticketTierId is required");
    }
    if (seenTierIds.has(item.ticketTierId)) {
      throw new ValidationError("Duplicate ticketTierId in items");
    }
    seenTierIds.add(item.ticketTierId);

    if (!Number.isInteger(item.quantity) || item.quantity <= 0) {
      throw new ValidationError("Quantity must be a positive integer");
    }
  }
}
