
import { expirePendingAppointments } from "../services/appointment-expiry.service.js";

const INTERVAL_MS = 60_000; // 1 minute

let isRunning = false;

async function runExpiryCleanup() {
  if (isRunning) {
    return;
  }

  isRunning = true;

  try {
    const expiredCount = await expirePendingAppointments();

    if (expiredCount > 0) {
      console.log(
        `[Appointment Expiry] Cancelled ${expiredCount} expired appointment(s).`,
      );
    }
  } catch (error) {
    console.error("[Appointment Expiry] Cleanup failed:", error);
  } finally {
    isRunning = false;
  }
}

export function startAppointmentExpiryJob() {
  // Run once at startup.
  void runExpiryCleanup();

  // Then run every minute.
  setInterval(() => {
    void runExpiryCleanup();
  }, INTERVAL_MS);

  console.log("[Appointment Expiry] Background job started.");
}
