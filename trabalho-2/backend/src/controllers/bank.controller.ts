import type { Request, Response, NextFunction } from "express";
import { BankService } from "../services/bank.service.js";
import { createBankSchema } from "../validators/bank.validator.js";

const service = new BankService();

export class BankController {
  static async list(_req: Request, res: Response, next: NextFunction) {
    try {
      res.json({ banks: await service.list() });
    } catch (e) {
      next(e);
    }
  }

  static async create(req: Request, res: Response, next: NextFunction) {
    try {
      const v = createBankSchema.parse(req.body);
      res.status(201).json({ bank: await service.create(v) });
    } catch (e) {
      next(e);
    }
  }
}
