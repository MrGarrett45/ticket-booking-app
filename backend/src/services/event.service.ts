import { query } from "../db";
import { Event, TicketTier } from "../models";
import { NotFoundError } from "../utils/errors";

const mapEventRow = (row: any): Event => ({
  id: row.id,
  name: row.name,
  venue: row.venue,
  startsAtUtc: row.starts_at_utc,
  createdAt: row.created_at,
});

const mapTicketTierRow = (row: any): TicketTier => ({
  id: row.id,
  eventId: row.event_id,
  tier: row.tier,
  priceCents: Number(row.price_cents),
  totalQuantity: Number(row.total_quantity),
  remainingQuantity: Number(row.remaining_quantity),
  createdAt: row.created_at,
});

export async function listEvents(): Promise<Event[]> {
  const result = await query(
    `SELECT id, name, venue, starts_at_utc, created_at
     FROM events
     ORDER BY starts_at_utc ASC`,
  );
  return result.rows.map(mapEventRow);
}

export async function getEvent(eventId: string): Promise<Event> {
  const result = await query(
    `SELECT id, name, venue, starts_at_utc, created_at
     FROM events
     WHERE id = $1`,
    [eventId],
  );

  if (result.rowCount === 0) {
    throw new NotFoundError("Event not found");
  }

  return mapEventRow(result.rows[0]);
}

export async function listTicketTiers(eventId: string): Promise<TicketTier[]> {
  await ensureEventExists(eventId);

  const result = await query(
    `SELECT id, event_id, tier, price_cents, total_quantity, remaining_quantity, created_at
     FROM ticket_tiers
     WHERE event_id = $1
     ORDER BY price_cents DESC`,
    [eventId],
  );

  return result.rows.map(mapTicketTierRow);
}

async function ensureEventExists(eventId: string) {
  const check = await query(`SELECT 1 FROM events WHERE id = $1`, [eventId]);
  if (check.rowCount === 0) {
    throw new NotFoundError("Event not found");
  }
}
