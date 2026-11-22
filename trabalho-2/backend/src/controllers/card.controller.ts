import type { Request, Response, NextFunction } from "express";
import { CardService } from "../services/card.service.js";
import { createCardSchema } from "../validators/card.validator.js";

const service = new CardService();

export class CardController {
  static async list(req: Request, res: Response, next: NextFunction) {
    try {
      res.json({ cards: await service.list(req.customerId!) });
    } catch (e) {
      next(e);
    }
  }

  static async create(req: Request, res: Response, next: NextFunction) {
    try {
      const v = createCardSchema.parse(req.body);
      res
        .status(201)
        .json({ card: await service.create(req.customerId!, v) });
    } catch (e) {
      next(e);
    }
  }
}
