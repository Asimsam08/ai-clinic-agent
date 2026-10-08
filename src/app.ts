import express from "express";
import cors from "cors";
import helmet from "helmet"
import authRoutes from "./routes/auth.routes.js";
import clinicRoutes from "./routes/clinic.routes.js";
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
app.use(errorMiddleware);
export default app;