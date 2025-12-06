import * as db from "../../db";
import { getEvent, listEvents } from "../event.service";
import { NotFoundError } from "../../utils/errors";

jest.mock("../../db", () => ({
  query: jest.fn(),
}));

const mockedQuery = db.query as jest.MockedFunction<typeof db.query>;

describe("event.service", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("maps events correctly in listEvents", async () => {
    mockedQuery.mockResolvedValueOnce({
      rows: [
        {
          id: "evt-1",
          name: "Concert",
          venue: "Great Hall",
          starts_at_utc: "2025-01-01T00:00:00Z",
          created_at: "2024-12-01T00:00:00Z",
        },
      ],
    } as any);

    const events = await listEvents();

    expect(mockedQuery).toHaveBeenCalledTimes(1);
    expect(events).toEqual([
      {
        id: "evt-1",
        name: "Concert",
        venue: "Great Hall",
        startsAtUtc: "2025-01-01T00:00:00Z",
        createdAt: "2024-12-01T00:00:00Z",
      },
    ]);
  });

  it("throws NotFoundError when an event is missing", async () => {
    mockedQuery.mockResolvedValueOnce({ rowCount: 0, rows: [] } as any);
    await expect(getEvent("missing-id")).rejects.toBeInstanceOf(NotFoundError);
  });
});
