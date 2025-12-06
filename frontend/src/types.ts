export type TicketTierType = "VIP" | "FRONT_ROW" | "GA" | string;

export interface Event {
  id: string;
  name: string;
  venue: string | null;
  startsAtUtc: string;
  createdAt: string;
}

export interface TicketTier {
  id: string;
  eventId: string;
  tier: TicketTierType;
  priceCents: number;
  totalQuantity: number;
  remainingQuantity: number;
  createdAt: string;
}

export interface BookingItemInput {
  ticketTierId: string;
  quantity: number;
}

export interface BookingRequest {
  eventId: string;
  clientReference?: string | null;
  items: BookingItemInput[];
}

export interface Booking {
  id: string;
  eventId: string;
  clientReference: string | null;
  status: "PENDING" | "CONFIRMED" | "FAILED" | "CANCELED";
  totalAmountCents: number;
  createdAt: string;
  updatedAt: string;
}
