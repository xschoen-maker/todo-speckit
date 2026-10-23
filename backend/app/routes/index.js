import { Router } from "express";
import authRoutes from "./auth.routes.js";
import { authenticate } from "../authorization/authorization.js";
import db from "../models/index.js";

const router = Router();
router.use(authRoutes);
router.get("/lists", authenticate, async (req, res, next) => {
  try { res.send(await db.list.findAll({ where: { userId: req.user.id }, order: [["name", "ASC"]] })); }
  catch (error) { next(error); }
});

router.get("/health", (_req, res) => {
  res.json({ status: "ok" });
});


export default router;
