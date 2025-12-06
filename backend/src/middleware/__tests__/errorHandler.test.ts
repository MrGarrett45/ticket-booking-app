import { AppError } from "../../utils/errors";
import { errorHandler, notFoundHandler } from "../errorHandler";

const createMockRes = () => {
  const res: any = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
};

describe("errorHandler", () => {
  it("returns the status/message for AppError", () => {
    const res = createMockRes();
    const err = new AppError("bad request", 400, { reason: "test" });

    errorHandler(err, {} as any, res, jest.fn());

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({ error: "bad request", details: { reason: "test" } });
  });

  it("logs and returns 500 for unexpected errors", () => {
    const res = createMockRes();
    const consoleSpy = jest.spyOn(console, "error").mockImplementation(() => {});

    errorHandler(new Error("boom"), {} as any, res, jest.fn());

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({ error: "Internal server error" });
    expect(consoleSpy).toHaveBeenCalled();

    consoleSpy.mockRestore();
  });
});

describe("notFoundHandler", () => {
  it("returns a 404 json payload", () => {
    const res = createMockRes();

    notFoundHandler({} as any, res, jest.fn());

    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith({ error: "Not found" });
  });
});
