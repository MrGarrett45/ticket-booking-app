import { Request, Response, NextFunction } from "express";
import * as bookingService from "../services/booking.service";

export async function createBooking(req: Request, res: Response, next: NextFunction) {
  try {
    const booking = await bookingService.createBooking(req.body);
    res.status(201).json(booking);
  } catch (error) {
    next(error);
  }
}

export async function getBooking(req: Request, res: Response, next: NextFunction) {
  try {
    const booking = await bookingService.getBooking(req.params.bookingId);
    res.json(booking);
  } catch (error) {
    next(error);
  }
}
