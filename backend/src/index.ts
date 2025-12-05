// src/index.ts
import express, { Request, Response } from "express";

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware to parse JSON
app.use(express.json());

// Simple route
app.get("/", (req: Request, res: Response) => {
  res.json({ message: "Hello from TypeScript + Express 👋" });
});

// Example API route
app.get("/health", (req: Request, res: Response) => {
  res.json({ status: "ok" });
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
