import express from "express";
import routes from "./routes";
import { errorHandler, notFoundHandler } from "./middleware/errorHandler";
import { config } from "./config";

const app = express();

app.use(express.json());

// Basic CORS. Adjust FRONTEND_ORIGIN env var to lock down origins.
app.use((req, res, next) => {
  res.header("Access-Control-Allow-Origin", config.frontendOrigin);
  res.header("Access-Control-Allow-Methods", "GET,POST,PUT,DELETE,OPTIONS");
  res.header("Access-Control-Allow-Headers", "Content-Type, Authorization");
  if (req.method === "OPTIONS") {
    return res.sendStatus(204);
  }
  next();
});

app.get("/api/health", (_req, res) => {
  res.json({ status: "ok" });
});

app.use("/api", routes);

app.use(notFoundHandler);
app.use(errorHandler);

export default app;
