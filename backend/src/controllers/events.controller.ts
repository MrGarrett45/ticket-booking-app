import { Request, Response, NextFunction } from "express";
import * as eventService from "../services/event.service";

export async function listEvents(req: Request, res: Response, next: NextFunction) {
  try {
    const events = await eventService.listEvents();
    res.json(events);
  } catch (error) {
    next(error);
  }
}

export async function getEvent(req: Request, res: Response, next: NextFunction) {
  try {
    const event = await eventService.getEvent(req.params.eventId);
    res.json(event);
  } catch (error) {
    next(error);
  }
}

export async function listTicketTiers(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const tiers = await eventService.listTicketTiers(req.params.eventId);
    res.json(tiers);
  } catch (error) {
    next(error);
  }
}
