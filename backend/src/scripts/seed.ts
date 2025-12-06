import { shutdownPool, withTransaction } from "../db";

async function seed() {
  await withTransaction(async (client) => {
    const eventName = "Thoughtly Live";
    const venue = "Global Livestream";
    const startsAtUtc = new Date(Date.UTC(2025, 0, 1, 20, 0, 0)).toISOString();

    const existingEvent = await client.query(
      `SELECT id FROM events WHERE name = $1 LIMIT 1`,
      [eventName],
    );

    let eventId: string;
    const hasExistingEvent = (existingEvent.rowCount ?? 0) > 0;

    if (hasExistingEvent) {
      eventId = existingEvent.rows[0].id;
    } else {
      const inserted = await client.query(
        `
        INSERT INTO events (name, venue, starts_at_utc)
        VALUES ($1, $2, $3)
        RETURNING id
        `,
        [eventName, venue, startsAtUtc],
      );
      eventId = inserted.rows[0].id;
    }

    const tiers = [
      { tier: "VIP", priceCents: 10000, quantity: 100 },
      { tier: "FRONT_ROW", priceCents: 5000, quantity: 200 },
      { tier: "GA", priceCents: 1000, quantity: 5000 },
    ];

    for (const tier of tiers) {
      await client.query(
        `
        INSERT INTO ticket_tiers (event_id, tier, price_cents, total_quantity, remaining_quantity)
        VALUES ($1, $2, $3, $4, $4)
        ON CONFLICT (event_id, tier) DO UPDATE
        SET price_cents = EXCLUDED.price_cents,
            total_quantity = EXCLUDED.total_quantity,
            remaining_quantity = EXCLUDED.total_quantity
        `,
        [eventId, tier.tier, tier.priceCents, tier.quantity],
      );
    }
  });

  console.log("Seeded default event and ticket tiers");
}

seed()
  .catch((error) => {
    console.error("Failed to seed database", error);
    process.exit(1);
  })
  .finally(async () => {
    await shutdownPool();
  });
