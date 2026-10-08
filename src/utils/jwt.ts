import jwt from "jsonwebtoken";
import { env } from "../config/env.js";

export interface JwtPayload {
  userId: string;
  clinicId: string;
  role: "OWNER" | "ADMIN" | "STAFF";
}


export function generateToken(payload: JwtPayload): string {
  return jwt.sign(payload, env.jwtSecret, {
    expiresIn: env.jwtExpiresIn as jwt.SignOptions["expiresIn"],
  });
}


export function verifyToken(token: string): JwtPayload {
  const decoded = jwt.verify(token, env.jwtSecret);

  if (typeof decoded === "string") {
    throw new Error("Invalid token");
  }

  if (
    typeof decoded.userId !== "string" ||
    typeof decoded.clinicId !== "string" ||
    !["OWNER", "ADMIN", "STAFF"].includes(decoded.role)
  ) {
    throw new Error("Invalid token payload");
  }

  return {
    userId: decoded.userId,
    clinicId: decoded.clinicId,
    role: decoded.role as JwtPayload["role"],
  };
}