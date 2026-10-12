import "dotenv/config";
import app from "./app.js";
import { env } from "./config/env.js";
import { checkDatabaseConnection } from "./db/check-db.js";
import { startAppointmentExpiryJob } from "./jobs/appointment-expiry.jobs.js";

// const PORT = process.env.PORT || 5000




// app.listen(PORT, ()=>{
//     console.log(`Server is running on port ${PORT}`)
// })



async function startServer() {
  try {
    await checkDatabaseConnection();

    app.listen(env.port, () => {
      console.log(`Server running on http://localhost:${env.port}`);
        startAppointmentExpiryJob
        ();
    });
  } catch (error) {
    console.error("Failed to start server:", error);
    process.exit(1);
  }
}

startServer();