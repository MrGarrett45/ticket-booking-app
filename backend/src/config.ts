import dotenv from "dotenv";

dotenv.config();

const rawPort = process.env.PORT;
const parsedPort = rawPort ? Number(rawPort) : undefined;

export const config = {
  port: Number.isFinite(parsedPort) ? (parsedPort as number) : 3000,
  databaseUrl:
    process.env.DATABASE_URL ?? "postgres://localhost:5432/ticket_booking",
  frontendOrigin: process.env.FRONTEND_ORIGIN ?? "*",
};
