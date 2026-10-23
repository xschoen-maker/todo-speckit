import { Router } from "express";
import authRoutes from "./auth.routes.js";
import listRoutes from "./list.routes.js";

const router = Router();
router.use(authRoutes);
router.use("/lists", listRoutes);

router.get("/health", (_req, res) => {
  res.json({ status: "ok" });
});


export default router;
