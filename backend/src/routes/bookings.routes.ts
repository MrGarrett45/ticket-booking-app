import { Router } from "express";
import * as bookingsController from "../controllers/bookings.controller";

const router = Router();

router.post("/", bookingsController.createBooking);
router.get("/:bookingId", bookingsController.getBooking);

export default router;
