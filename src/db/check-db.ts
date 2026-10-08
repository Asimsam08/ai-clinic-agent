import { prisma } from "./prisma.js";

export async function checkDatabaseConnection() {
  await prisma.$queryRaw`SELECT 1`;
  console.log("Database connected successfully");
}