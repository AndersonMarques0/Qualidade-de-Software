import type { Request, Response, NextFunction } from "express";
import { CartService } from "../services/cart.service.js";
import {
  addCartItemSchema,
  updateCartItemSchema
} from "../validators/cart.validator.js";

const service = new CartService();

export class CartController {
  static async get(
    req: Request,
    res: Response,
    next: NextFunction
  ) {
    try {
      res.json(await service.get(req.customerId!));
    } catch (e) {
      next(e);
    }
  }

  static async add(
    req: Request,
    res: Response,
    next: NextFunction
  ) {
    try {
      const v = addCartItemSchema.parse(req.body);

      res.status(201).json(
        await service.add(
          req.customerId!,
          v.bookId,
          v.quantity
        )
      );
    } catch (e) {
      next(e);
    }
  }

  static async update(
    req: Request,
    res: Response,
    next: NextFunction
  ) {
    try {
      const v = updateCartItemSchema.parse(req.body);
      const bookId = req.params.bookId as string;

      res.json(
        await service.update(
          req.customerId!,
          bookId,
          v.quantity
        )
      );
    } catch (e) {
      next(e);
    }
  }

  static async remove(
    req: Request,
    res: Response,
    next: NextFunction
  ) {
    try {
      const bookId = req.params.bookId as string;

      res.json(
        await service.remove(
          req.customerId!,
          bookId
        )
      );
    } catch (e) {
      next(e);
    }
  }
}
