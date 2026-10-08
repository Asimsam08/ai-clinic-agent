import { NextFunction, Request, Response } from "express";
import { verifyToken } from "../utils/jwt.js";

export interface AuthContext {
  userId: string;
  clinicId: string;
  role: "OWNER" | "ADMIN" | "STAFF";
}

export function authMiddleware(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const authorization = req.headers.authorization;

    if (!authorization) {
      return res.status(401).json({
        message: "Authentication required",
      });
    }

    const [scheme, token] = authorization.split(" ");

    if (scheme !== "Bearer" || !token) {
      return res.status(401).json({
        message: "Invalid authorization header",
      });
    }

    const payload = verifyToken(token);

    req.auth = {
      userId: payload.userId,
      clinicId: payload.clinicId,
      role: payload.role,
    };

    next();
  } catch (error) {
    console.error("Authentication error:", error);

    return res.status(401).json({
      message: "Invalid or expired token",
    });
  }
}