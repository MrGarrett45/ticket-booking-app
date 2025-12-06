import { Router } from "express";
import * as eventsController from "../controllers/events.controller";

const router = Router();

router.get("/", eventsController.listEvents);
router.get("/:eventId", eventsController.getEvent);
router.get("/:eventId/ticket-tiers", eventsController.listTicketTiers);

export default router;
