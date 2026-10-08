import { Request, Response } from "express";
import {
  registerUser,
  loginUser,
  getCurrentUser,
} from "../services/auth.service.js";

// export async function register(req: Request, res: Response) {
//   try {
//     const { name, email, password, clinicName } = req.body;

//     if (!name || !email || !password || !clinicName) {
//       return res.status(400).json({
//         message: "Name, email, password and clinic name are required",
//       });
//     }

//     const result = await registerUser({
//       name,
//       email,
//       password,
//       clinicName,
//     });

//     return res.status(201).json({
//       message: "Registration successful",
//       data: result,
//     });
//   } catch (error) {
//     console.error("Registration error:", error);

//     return res.status(400).json({
//       message:
//         error instanceof Error
//           ? error.message
//           : "Registration failed",
//     });
//   }
// }

// export async function login(req: Request, res: Response) {
//   try {
//     const { email, password } = req.body;

//     if (!email || !password) {
//       return res.status(400).json({
//         message: "Email and password are required",
//       });
//     }

//     const result = await loginUser({
//       email,
//       password,
//     });

//     return res.status(200).json({
//       message: "Login successful",
//       data: result,
//     });
//   } catch (error) {
//     console.error("Login error:", error);

//     return res.status(401).json({
//       message:
//         error instanceof Error
//           ? error.message
//           : "Login failed",
//     });
//   }
// }

// export async function me(req: Request, res: Response) {
//   try {
//     if (!req.auth) {
//       return res.status(401).json({
//         message: "Authentication required",
//       });
//     }

//     const result = await getCurrentUser(
//       req.auth.userId,
//       req.auth.clinicId
//     );

//     return res.status(200).json({
//       message: "User fetched successfully",
//       data: result,
//     });
//   } catch (error) {
//     console.error("Get current user error:", error);

//     return res.status(401).json({
//       message:
//         error instanceof Error
//           ? error.message
//           : "Unable to fetch user",
//     });
//   }
// }

export async function register(req: Request, res: Response) {
  const result = await registerUser(req.body);

  return res.status(201).json({
    message: "Registration successful",
    data: result,
  });
}

export async function login(req: Request, res: Response) {
  const result = await loginUser(req.body);

  return res.status(200).json({
    message: "Login successful",
    data: result,
  });
}

export async function me(req: Request, res: Response) {
  if (!req.auth) {
    return res.status(401).json({
      message: "Authentication required",
    });
  }

  const result = await getCurrentUser(
    req.auth.userId,
    req.auth.clinicId
  );

  return res.status(200).json({
    message: "User fetched successfully",
    data: result,
  });
}