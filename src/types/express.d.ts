import { AuthContext } from "../middleware/auth.middleware.js";

declare global {
  namespace Express {
    interface Request {
      auth?: AuthContext;
    }
  }
}

export {};