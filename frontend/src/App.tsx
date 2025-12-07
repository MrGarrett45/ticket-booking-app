/* eslint-disable @typescript-eslint/no-explicit-any */
import { useEffect, useMemo, useState } from "react";
import "./App.css";
import { api } from "./api";
import type { Booking, Event, TicketTier } from "./types";

type ViewState = { page: "list" } | { page: "event"; eventId: string };

const formatDate = (value: string) =>
  new Intl.DateTimeFormat("en", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));

const currency = (cents: number) =>
  new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(cents / 100);

function parseInitialView(): ViewState {
  const match = window.location.pathname.match(/\/events\/([^/]+)/);
  return match ? { page: "event", eventId: match[1] } : { page: "list" };
}

function App() {
  const [view, setView] = useState<ViewState>(() => parseInitialView());
  const [events, setEvents] = useState<Event[]>([]);
  const [eventsLoading, setEventsLoading] = useState(true);
  const [eventsError, setEventsError] = useState<string | null>(null);

  useEffect(() => {
    const onPop = () => {
      setView(parseInitialView());
    };
    window.addEventListener("popstate", onPop);
    return () => window.removeEventListener("popstate", onPop);
  }, []);

  useEffect(() => {
    let mounted = true;

    const loadEvents = async () => {
      setEventsLoading(true);
      try {
        const data = await api.getEvents();
        if (mounted) {
          setEvents(data);
          setEventsError(null);
        }
      } catch (err: any) {
        if (mounted) {
          setEventsError(err.message ?? "Failed to load events");
        }
      } finally {
        if (mounted) {
          setEventsLoading(false);
        }
      }
    };

    void loadEvents();
    return () => {
      mounted = false;
    };
  }, []);

  const goToEvent = (eventId: string) => {
    window.history.pushState({ eventId }, "", `/events/${eventId}`);
    setView({ page: "event", eventId });
  };

  const goHome = () => {
    window.history.pushState({}, "", "/");
    setView({ page: "list" });
  };

  return (
    <div className="shell">
      <header className="topbar">
        <div className="brand" onClick={goHome}>
          <span className="brand-mark">th.</span>
          <span className="brand-name">Thoughtly Events</span>
        </div>
        <div className="top-actions">
          <button className="ghost" onClick={goHome}>
            Events
          </button>
        </div>
      </header>

      <main className="content">
        {view.page === "list" && (
          <EventsList events={events} loading={eventsLoading} error={eventsError} onSelect={goToEvent} />
        )}
        {view.page === "event" && <EventDetail eventId={view.eventId} onBack={goHome} />}
      </main>
    </div>
  );
}

function EventsList({
  events,
  loading,
  error,
  onSelect,
}: {
  events: Event[];
  loading: boolean;
  error: string | null;
  onSelect: (eventId: string) => void;
}) {
  if (loading) {
    return <section className="panel">Loading events…</section>;
  }

  if (error) {
    return (
      <section className="panel error">
        <strong>Could not load events.</strong>
        <span>{error}</span>
      </section>
    );
  }

  if (!events.length) {
    return <section className="panel">No events found.</section>;
  }

  return (
    <section>
      <header className="section-head">
        <div>
          <p className="eyebrow">Upcoming</p>
          <h1>Pick an experience</h1>
          <p className="muted">Choose an event to view details and reserve tickets.</p>
        </div>
      </header>
      <div className="grid">
        {events.map((event) => (
          <article key={event.id} className="card" onClick={() => onSelect(event.id)}>
            <div className="card-top">
              <p className="eyebrow">{formatDate(event.startsAtUtc)}</p>
              <h3>{event.name}</h3>
              <p className="muted">{event.venue ?? "Venue TBA"}</p>
            </div>
            <div className="card-actions">
              <span>View details</span>
              <span className="arrow">→</span>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}

function EventDetail({ eventId, onBack }: { eventId: string; onBack: () => void }) {
  const [event, setEvent] = useState<Event | null>(null);
  const [tiers, setTiers] = useState<TicketTier[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;

    const loadEvent = async () => {
      setLoading(true);
      try {
        const [evt, ticketTiers] = await Promise.all([
          api.getEvent(eventId),
          api.getTicketTiers(eventId),
        ]);
        if (mounted) {
          setEvent(evt);
          setTiers(ticketTiers);
          setError(null);
        }
      } catch (err: any) {
        if (mounted) {
          setError(err.message ?? "Failed to load event");
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    void loadEvent();
    return () => {
      mounted = false;
    };
  }, [eventId]);

  if (loading) {
    return <section className="panel">Loading event…</section>;
  }

  if (error || !event) {
    return (
      <section className="panel error">
        <div className="panel-header">
          <button className="ghost" onClick={onBack}>
            ← Back
          </button>
        </div>
        <p>{error ?? "Event not found."}</p>
      </section>
    );
  }

  return (
    <section className="stack gap-lg">
      <div className="panel">
        <div className="panel-header">
          <button className="ghost" onClick={onBack}>
            ← Back to events
          </button>
          <p className="eyebrow">Event</p>
        </div>
        <h1>{event.name}</h1>
        <p className="muted">
          {formatDate(event.startsAtUtc)} · {event.venue ?? "Venue TBA"}
        </p>
      </div>

      <TicketTiers eventId={eventId} tiers={tiers} onTiersChange={setTiers} />
    </section>
  );
}

function TicketTiers({
  eventId,
  tiers,
  onTiersChange,
}: {
  eventId: string;
  tiers: TicketTier[];
  onTiersChange: (next: TicketTier[]) => void;
}) {
  const [quantities, setQuantities] = useState<Record<string, number>>({});
  const [submitting, setSubmitting] = useState(false);
  const [clientRef, setClientRef] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [booking, setBooking] = useState<Booking | null>(null);

  const total = useMemo(
    () => tiers.reduce((sum, tier) => sum + (quantities[tier.id] ?? 0) * tier.priceCents, 0),
    [tiers, quantities]
  );

  const updateQty = (tierId: string, qty: number) => {
    setQuantities((prev) => ({ ...prev, [tierId]: Math.max(0, qty) }));
  };

  const handleSubmit = async () => {
    setMessage(null);
    setBooking(null);
    const items = tiers
      .map((tier) => ({
        ticketTierId: tier.id,
        quantity: quantities[tier.id] ?? 0,
      }))
      .filter((item) => item.quantity > 0);

    if (!items.length) {
      setMessage("Select at least one ticket.");
      return;
    }

    setSubmitting(true);
    try {
      const result = await api.createBooking({
        eventId,
        clientReference: clientRef.trim() || null,
        items,
      });
      setBooking(result);
      setMessage("Booking confirmed!");
      // Reflect updated inventory locally only when a new booking is created.
      // If the API returns an existing booking for the same clientReference, do not double-decrement.
      if (!booking || booking.id !== result.id) {
        const decrements = new Map(items.map((i) => [i.ticketTierId, i.quantity]));
        const updated = tiers.map((tier) => {
          const dec = decrements.get(tier.id) ?? 0;
          return { ...tier, remainingQuantity: Math.max(0, tier.remainingQuantity - dec) };
        });
        onTiersChange(updated);
      }
      setQuantities({});
    } catch (err: any) {
      setMessage(err.message || "Could not complete booking.");
    } finally {
      setSubmitting(false);
    }
  };

  if (!tiers.length) {
    return <div className="panel">No tickets available for this event.</div>;
  }

  return (
    <div className="panel stack gap-md">
      <div className="panel-header">
        <div>
          <p className="eyebrow">Tickets</p>
          <h2>Choose your tiers</h2>
        </div>
        <div className="total">
          <span>Total</span>
          <strong>{currency(total)}</strong>
        </div>
      </div>

      <div className="tiers">
        {tiers.map((tier) => (
          <div key={tier.id} className="tier">
            <div>
              <p className="eyebrow">{tier.tier}</p>
              <h3>{currency(tier.priceCents)}</h3>
              <p className="muted">
                {tier.remainingQuantity} / {tier.totalQuantity} remaining
              </p>
            </div>
            <div className="qty">
              <label htmlFor={`qty-${tier.id}`}>Qty</label>
              <input
                id={`qty-${tier.id}`}
                type="number"
                min={0}
                max={tier.remainingQuantity}
                value={quantities[tier.id] ?? 0}
                onChange={(e) => updateQty(tier.id, Number(e.target.value))}
              />
            </div>
          </div>
        ))}
      </div>

      <label className="field">
        <span className="label">Client reference (optional)</span>
        <input
          type="text"
          value={clientRef}
          onChange={(e) => setClientRef(e.target.value)}
          placeholder="e.g. ACME-ORDER-123"
        />
      </label>

      {message && <div className="banner">{message}</div>}
      {booking && (
        <div className="banner success">
          Booking #{booking.id} · Status: {booking.status} · {currency(booking.totalAmountCents)}
        </div>
      )}

      <div className="actions">
        <button className="primary" onClick={handleSubmit} disabled={submitting}>
          {submitting ? "Processing…" : "Book tickets"}
        </button>
      </div>
    </div>
  );
}

export default App;
