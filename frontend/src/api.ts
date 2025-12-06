import type { BookingRequest, Event, TicketTier, Booking } from "./types";

const API_BASE =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:3000/api";

async function fetchJson<T>(path: string, options?: RequestInit): Promise<T> {
  const response = await fetch(`${API_BASE}${path}`, {
    headers: {
      "Content-Type": "application/json",
      ...(options?.headers || {}),
    },
    ...options,
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    const message =
      (data as any)?.error || response.statusText || "Request failed";
    throw new Error(message);
  }

  return data as T;
}

export const api = {
  getEvents: () => fetchJson<Event[]>("/events"),
  getEvent: (eventId: string) => fetchJson<Event>(`/events/${eventId}`),
  getTicketTiers: (eventId: string) =>
    fetchJson<TicketTier[]>(`/events/${eventId}/ticket-tiers`),
  createBooking: (payload: BookingRequest) =>
    fetchJson<Booking>("/bookings", {
      method: "POST",
      body: JSON.stringify(payload),
    }),
};
