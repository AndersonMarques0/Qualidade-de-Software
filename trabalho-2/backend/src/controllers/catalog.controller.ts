import type { Request, Response, NextFunction } from "express";
import { CatalogService } from "../services/catalog.service.js";

const service = new CatalogService();

export class CatalogController {
  static async list(
    _req: Request,
    res: Response,
    next: NextFunction
  ) {
    try {
      res.json({
        books: await service.list()
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
        book: await service.get(id)
      });
    } catch (e) {
      next(e);
    }
  }
}
