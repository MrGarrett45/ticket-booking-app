export type TicketTierType = "VIP" | "FRONT_ROW" | "GA";

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

export type BookingStatus = "PENDING" | "CONFIRMED" | "FAILED" | "CANCELED";

export interface BookingItem {
  id: string;
  ticketTierId: string;
  tier: TicketTierType;
  quantity: number;
  priceCents: number;
}

export interface Booking {
  id: string;
  eventId: string;
  clientReference: string | null;
  status: BookingStatus;
  totalAmountCents: number;
  createdAt: string;
  updatedAt: string;
  items: BookingItem[];
}
