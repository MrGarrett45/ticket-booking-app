import { Router } from "express";
import eventsRouter from "./events.routes";
import bookingsRouter from "./bookings.routes";

const router = Router();

router.use("/events", eventsRouter);
router.use("/bookings", bookingsRouter);

export default router;
