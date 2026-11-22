import type { Request, Response, NextFunction } from "express";
import { OrderService } from "../services/order.service.js";
import {
  checkoutSchema,
  previewOrderSchema
} from "../validators/order.validator.js";

const service = new OrderService();

export class OrderController {
  static async preview(
    req: Request,
    res: Response,
    next: NextFunction
  ) {
    try {
      const v = previewOrderSchema.parse(req.body);

      res.json(
        await service.preview(
          req.customerId!,
          v.region
        )
      );
    } catch (e) {
      next(e);
    }
  }

  static async checkout(
    req: Request,
    res: Response,
    next: NextFunction
  ) {
    try {
      const input = checkoutSchema.parse(req.body);

      res.status(201).json(
        await service.checkout(
          req.customerId!,
          input
        )
      );
    } catch (e) {
      next(e);
    }
  }

  static async list(
    req: Request,
    res: Response,
    next: NextFunction
  ) {
    try {
      res.json({
        orders: await service.list(req.customerId!)
      });
    } catch (e) {
      next(e);
    }
  }

  static async get(
    req: Request,
    res: Response,
    next: NextFunction
  ) {
    try {
      const id = req.params.id as string;

      res.json({
        order: await service.get(
          req.customerId!,
          id
        )
      });
    } catch (e) {
      next(e);
    }
  }
}
