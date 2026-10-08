import { NextFunction, Request, Response } from "express";
import { AppError } from "../utils/app.error.js";

type Role = "OWNER" | "ADMIN" | "STAFF";

export function requireRole(...allowedRoles: Role[]) {
  return (
    req: Request,
    _res: Response,
    next: NextFunction
  ) => {
    if (!req.auth) {
      return next(
        new AppError("Authentication required", 401)
      );
    }

    if (!allowedRoles.includes(req.auth.role)) {
      return next(
        new AppError("You are not authorized to perform this action", 403)
      );
    }

    next();
  };
}