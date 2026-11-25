import type { Request, Response, NextFunction } from "express";
import { AuthService } from "../services/auth.service.js";
import { registerSchema, loginSchema } from "../validators/auth.validator.js";
const service = new AuthService();
export class AuthController {
  static async register(req: Request, res: Response, next: NextFunction) {
    try {
      res
        .status(201)
        .json({
          customer: await service.register(registerSchema.parse(req.body)),
        });
    } catch (e) {
      next(e);
    }
  }
  static async login(req: Request, res: Response, next: NextFunction) {
    try {
      res.json(await service.login(loginSchema.parse(req.body)));
    } catch (e) {
      next(e);
    }
  }
}
