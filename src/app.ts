import express from "express";
import cors from "cors";
import helmet from "helmet"
import authRoutes from "./routes/auth.routes.js";
import clinicRoutes from "./routes/clinic.routes.js";
import servicesRoutes from "./routes/services.routes.js";
import staffRoutes from "./routes/staff.routes.js";
import workingHoursRoutes from "./routes/working-hours.routes.js";
import appointmentRoutes from "./routes/appointment.routes.js";
import contactRoutes from "./routes/contact.routes.js";

import { errorMiddleware } from "./middleware/error.middleware.js";

const app = express();
app.use(helmet());
app.use(cors());
app.use(express.json());

app.get("/health", (req,res)=>{

    res.json({
        status : "ok",
        service: "ai-clinic-agent"

    })

})

app.use("/api/auth", authRoutes);
app.use("/api/clinic", clinicRoutes);
app.use("/api/services", servicesRoutes);
app.use("/api/staff", staffRoutes);
app.use("/api/working-hours", workingHoursRoutes);
app.use("/api/appointments", appointmentRoutes);
app.use("/api/contacts", contactRoutes);
app.use(errorMiddleware);
export default app;