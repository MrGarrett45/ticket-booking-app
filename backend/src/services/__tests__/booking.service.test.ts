import { createBooking } from "../booking.service";
import { ConflictError, NotFoundError, ValidationError } from "../../utils/errors";
import * as db from "../../db";

jest.mock("../../db", () => ({
  query: jest.fn(),
  withTransaction: jest.fn(),
}));

const mockedWithTransaction = db.withTransaction as jest.MockedFunction<typeof db.withTransaction>;

describe("booking.service createBooking", () => {
  const validInput = {
    eventId: "evt-1",
    items: [{ ticketTierId: "tier-1", quantity: 1 }],
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("rejects missing eventId before touching the database", async () => {
    await expect(createBooking({ ...validInput, eventId: "" })).rejects.toBeInstanceOf(ValidationError);
    expect(mockedWithTransaction).not.toHaveBeenCalled();
  });

  it("rejects when the event does not exist", async () => {
    mockedWithTransaction.mockImplementation(async (fn) => {
      const client = {
        query: jest.fn().mockResolvedValueOnce({ rowCount: 0 }),
      } as any;
      return fn(client);
    });

    await expect(createBooking(validInput)).rejects.toBeInstanceOf(NotFoundError);
    expect(mockedWithTransaction).toHaveBeenCalledTimes(1);
  });

  it("rejects when there is not enough inventory for a tier", async () => {
    mockedWithTransaction.mockImplementation(async (fn) => {
      const queryMock = jest
        .fn()
        .mockResolvedValueOnce({ rowCount: 1 }) // ensureEventExists
        .mockResolvedValueOnce({
          rowCount: 1,
          rows: [
            {
              id: "tier-1",
              event_id: "evt-1",
              tier: "VIP",
              price_cents: "5000",
              remaining_quantity: 0,
            },
          ],
        });

      const client = { query: queryMock } as any;
      return fn(client);
    });

    await expect(createBooking(validInput)).rejects.toBeInstanceOf(ConflictError);
  });
});
