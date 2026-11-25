import type { Request, Response, NextFunction } from "express";
import { OrderService } from "../services/order.service.js";
import { getRegionByState } from "../domain/services/region.service.js";
import {
  checkoutSchema,
  idempotencyKeySchema,
  previewOrderSchema,
} from "../validators/order.validator.js";

const service = new OrderService();

export class OrderController {
  static async preview(req: Request, res: Response, next: NextFunction) {
    try {
      const value = previewOrderSchema.parse(req.body);
      const region = value.state
        ? getRegionByState(value.state)
        : value.region!;

      res.json(await service.preview(req.customerId!, region));
    } catch (error) {
      next(error);
    }
  }

  static async checkout(req: Request, res: Response, next: NextFunction) {
    try {
      const input = checkoutSchema.parse(req.body);
      const idempotencyKey = idempotencyKeySchema.parse(
        req.get("Idempotency-Key"),
      );

      res.status(201).json(
        await service.checkout(req.customerId!, input, idempotencyKey),
      );
    } catch (error) {
      next(error);
    }
  }

  static async list(req: Request, res: Response, next: NextFunction) {
    try {
      res.json({ orders: await service.list(req.customerId!) });
    } catch (error) {
      next(error);
    }
  }

  static async get(req: Request, res: Response, next: NextFunction) {
    try {
      const id = req.params.id as string;
      res.json({ order: await service.get(req.customerId!, id) });
    } catch (error) {
      next(error);
    }
  }
}
